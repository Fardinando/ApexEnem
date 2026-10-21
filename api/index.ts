import express from "express";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import rateLimit from "express-rate-limit";
import { PROMPTS, ModelConfig } from "./prompts.js";
import { jsonrepair } from "jsonrepair";
import { z, ZodTypeAny } from "zod";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userEmail?: string;
    }
  }
}

if (!process.env.VERCEL) dotenv.config();

const app = express();
app.set("trust proxy", 1);
const PORT = 3000;

const RENDER_INTERNAL_KEY = process.env.INTERNAL_API_KEY || "";
if (!RENDER_INTERNAL_KEY) {
  console.warn("WARNING: INTERNAL_API_KEY not set — chamadas ao serviço de IA no Render não serão autenticadas.");
}

function renderHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (RENDER_INTERNAL_KEY) h["x-internal-key"] = RENDER_INTERNAL_KEY;
  return { ...h, ...extra };
}

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Tente novamente em 1 minuto." }
});

// ─── Rate limit "distribuído" (Upstash Redis REST opcional) ───────────────────
// Em serverless, o contador em memória é por instância. Se UPSTASH_REDIS_REST_URL
// e UPSTASH_REDIS_REST_TOKEN existirem, usamos um contador distribuído.
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const memoryCounters = new Map<string, { count: number; resetAt: number }>();

async function hitUpstash(key: string, windowSec: number): Promise<number | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    const r = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(windowSec), "NX"],
      ]),
      signal: AbortSignal.timeout(2000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const count = Number(data?.[0]?.result);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
}

function distributedRateLimit(opts: { name: string; max: number; windowSec: number }) {
  return async (req: any, res: any, next: any) => {
    const identity = req.user?.id || req.userEmail || req.ip || "anon";
    const bucket = Math.floor(Date.now() / (opts.windowSec * 1000));
    const key = `rl:${opts.name}:${identity}:${bucket}`;

    let count = await hitUpstash(key, opts.windowSec);
    if (count === null) {
      const now = Date.now();
      const entry = memoryCounters.get(key);
      if (!entry || entry.resetAt < now) {
        memoryCounters.set(key, { count: 1, resetAt: now + opts.windowSec * 1000 });
        count = 1;
      } else {
        entry.count++;
        count = entry.count;
      }
      if (memoryCounters.size > 10000) memoryCounters.clear();
    }

    if (count > opts.max) {
      return res.status(429).json({ error: "Muitas requisições. Aguarde um instante e tente novamente." });
    }
    next();
  };
}

// ─── Validação de schema (Zod) ────────────────────────────────────────────────
function validateBody(schema: ZodTypeAny) {
  return (req: any, res: any, next: any) => {
    const parsed = schema.safeParse(req.body || {});
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return res.status(400).json({ error: `Dados inválidos: ${first?.path?.join(".") || "corpo"} — ${first?.message || "inválido"}` });
    }
    req.body = parsed.data;
    next();
  };
}

// ─── Triagem de IA (modelo leve antes do modelo caro) ─────────────────────────
// Decide se uma requisição merece o modelo principal. Bloqueia pedidos vazios,
// abusivos ou triviais antes de gastar tokens com o modelo caro.
const TRIAGE_BLOCKLIST = /(ignore (all|previous)|ignore as instruções|desconsidere (as )?instru|system prompt|reveal your|mostre (o|seu) prompt|jailbreak|DAN mode)/i;
function aiTriage(prompt: string): { ok: boolean; reason?: string } {
  const text = (prompt || "").trim();
  if (text.length < 3) return { ok: false, reason: "conteúdo vazio" };
  if (text.length > 20000) return { ok: false, reason: "conteúdo grande demais" };
  if (TRIAGE_BLOCKLIST.test(text)) return { ok: false, reason: "conteúdo bloqueado" };
  const letters = text.replace(/[^a-zA-ZÀ-ÿ]/g, "").length;
  if (letters / Math.max(1, text.length) < 0.15 && text.length > 40) {
    return { ok: false, reason: "conteúdo sem texto válido" };
  }
  return { ok: true };
}

let supabase: any = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  } catch (error: any) {
    console.warn("Failed to initialize Supabase Client:", error.message);
  }
} else {
  console.warn("WARNING: SUPABASE_URL or SUPABASE_ANON_KEY are not defined in the environment.");
}

let supabaseAdmin: any = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  } catch (error: any) {
    console.warn("Failed to initialize Supabase Admin Client:", error.message);
  }
}

const HMAC_SECRET = process.env.HMAC_SECRET;
if (!HMAC_SECRET) {
  console.warn("WARNING: HMAC_SECRET not set — email confirmation tokens will NOT be signed. Set HMAC_SECRET in env.");
}

function getBaseUrl(): string {
  const explicit = process.env.APP_URL || process.env.SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${PORT}`;
}

function signToken(email: string, code: string): string {
  if (!HMAC_SECRET) throw new Error("HMAC_SECRET não configurado");
  if (typeof email !== "string" || typeof code !== "string") throw new Error("Email e código devem ser strings");
  return crypto.createHmac("sha256", HMAC_SECRET).update(`${email.toLowerCase()}:${code}`).digest("hex");
}

function verifyToken(email: string, code: string, token: string): boolean {
  const expected = signToken(email, code);
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

app.use(express.json({ limit: "15mb" }));
app.use("/api/", apiLimiter);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://partner.googleadservices.com https://tpc.googlesyndication.com https://www.googletagservices.com https://adservice.google.com https://securepubads.g.doubleclick.net https://www.googletagmanager.com https://www.google-analytics.com https://js.hcaptcha.com https://*.hcaptcha.com",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "frame-src https://*.hcaptcha.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://br.wps.com",
    "connect-src 'self' https://*.supabase.co https://openrouter.ai https://enem.dev https://api.enem.dev https://www.google-analytics.com https://region1.google-analytics.com https://pagead2.googlesyndication.com https://securepubads.g.doubleclick.net",
    "img-src 'self' data: https://storage.googleapis.com https://pagead2.googlesyndication.com https://*.gstatic.com https://*.googleusercontent.com https://www.google-analytics.com",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; "));
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  next();
});

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : ["http://localhost:5173", "http://localhost:3000"];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const requireAuth = async (req: any, res: any, next: any) => {
  const publicRoutes = [
    "/confirm-email", "/send-confirmation", "/credentials-status",
    "/supabase/keep-alive", "/auth-access", "/repertoires",
    "/enem-questions", "/questions", "/correct",
    "/openrouter-chat", "/generate-learning-exercises",
    "/lesson", "/lesson-v2", "/chapter-lesson", "/questoes-ai", "/stats", "/simulado-explanation",
    "/pratica-questoes", "/classify-question", "/ai-task", "/beta-request",
    "/contact"
  ];
  const checkPath = req.path.startsWith("/api/") ? req.path : `/api${req.path}`;
    if (publicRoutes.includes(req.path) || publicRoutes.includes(checkPath) || req.path.startsWith("/questions/status/") || req.path.startsWith("/questions/status-batch") || req.path.startsWith("/ai-task/") || req.path.startsWith("/repertoires/status/") || req.path.startsWith("/status/")) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Autenticação necessária. Envie um token Bearer." });
  }
  const token = authHeader.replace("Bearer ", "");
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Serviço de autenticação indisponível." });
  }
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Token inválido ou expirado." });
    }
    req.user = user;
    req.userEmail = user.email?.toLowerCase() || "";
    next();
  } catch {
    return res.status(401).json({ error: "Erro ao verificar token." });
  }
};

app.use("/api/", requireAuth);

function tryParse(text: string): any | null {
  try { return JSON.parse(text); } catch { return null; }
}

function repairJson(text: string): string {
  let t = text.replace(/```(?:json)?\s*/gi, '').replace(/\s*```/gi, '').trim();
  t = t.replace(/,(\s*[}\]])/g, '$1');
  t = t.replace(/,\s*$/, '');
  let depth = 0, inStr = false;
  for (const ch of ['[', '{']) {
    const start = t.indexOf(ch);
    if (start === -1) continue;
    depth = 0; inStr = false;
    let candidate = t.substring(start);
    for (let i = 0; i < candidate.length; i++) {
      const c = candidate[i];
      if (c === '"' && (i === 0 || candidate[i-1] !== '\\')) { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === '[' || c === '{') depth++;
      else if (c === ']' || c === '}') { depth--; if (depth === 0) return candidate.substring(0, i + 1); }
    }
    if (depth > 0) {
      for (let i = 0; i < depth; i++) candidate += (ch === '[' ? ']' : '}');
      return candidate;
    }
  }
  return text;
}

function extractJsonFromText(rawText: string): any {
  const cleaned = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const trimmed = cleaned || rawText.trim();

  const parsed = tryParse(trimmed) || tryParse(trimmed.replace(/```(?:json)?\s*/gi, '').replace(/\s*```/gi, '').trim());
  if (parsed) { console.error("extract: parsed OK, len=" + trimmed.length); return parsed; }

  const fixed = repairJson(trimmed);
  if (fixed !== trimmed) {
    const p = tryParse(fixed);
    if (p) { console.error("extract: parsed after repair, len=" + fixed.length); return p; }
  }

  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    const extracted = match[1].trim();
    console.error("extract: regex content, len=" + extracted.length + " start=" + extracted[0] + " end=" + extracted[extracted.length-1]);
    const p = tryParse(extracted) || tryParse(repairJson(extracted));
    if (p) { console.error("extract: parsed regex"); return p; }
  }

  for (const ch of ['[', '{']) {
    const end = ch === '[' ? ']' : '}';
    const startIdx = trimmed.indexOf(ch);
    const endIdx = trimmed.lastIndexOf(end);
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const extracted = trimmed.substring(startIdx, endIdx + 1);
      console.error(`extract: bracket ${ch}, len=${extracted.length}`);
      let p = tryParse(extracted) || tryParse(repairJson(extracted));
      if (!p && typeof jsonrepair === 'function') {
        try { p = tryParse(jsonrepair(extracted)); if (p) console.error("extract: jsonrepair on bracket worked"); } catch {}
      }
      if (p) return p;
    }
    if (startIdx !== -1) {
      const sub = trimmed.substring(startIdx);
      let p = tryParse(repairJson(sub));
      if (!p && typeof jsonrepair === 'function') {
        try { p = tryParse(jsonrepair(sub)); if (p) console.error("extract: jsonrepair on substring worked"); } catch {}
      }
      if (p) { console.error(`extract: repaired from ${ch}`); return p; }
    }
  }

  try {
    const repaired = jsonrepair(trimmed);
    console.error("extract: jsonrepair full text, len=" + repaired.length);
    const p = tryParse(repaired);
    if (p && Array.isArray(p)) { console.error("extract: jsonrepair full text returned array"); return p; }
    console.error("extract: jsonrepair full text did not return array, type=" + typeof p);
  } catch (e: any) {
    console.error("extract: jsonrepair full text failed:", e?.message?.slice(0, 100));
  }

  console.error("extract: ALL FAILED. Content preview:", trimmed.slice(0, 500));
  throw new Error("Could not parse JSON from LLM response");
}

const googleApiKey = process.env.GOOGLE_API_KEY;

function cleanText(s: string): string {
  if (typeof s !== "string") return s;
  let t = s.replace(/\r\n?/g, "\n");
  t = t.replace(/\\n/g, "\n");
  t = t.replace(/\\t/g, " ");
  t = t.replace(/\u2223/g, "|").replace(/\u2236/g, ":").replace(/\u223C/g, "~");
  let prev: string;
  do {
    prev = t;
    t = t.replace(/([^\s\n|])\n([^\s\n|])/g, "$1$2");
  } while (t !== prev);
  t = t.replace(/([^\n|])\n(?!\n)(?![|])/g, "$1 ");
  t = t.replace(/ {2,}/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

function fixEncoding(s: string): string {
  if (typeof s !== "string") return s;
  try {
    const latin1Bytes = new Uint8Array([...s].map(c => c.charCodeAt(0) & 0xFF));
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(latin1Bytes);
    if (!decoded.includes("\uFFFD") && decoded.length < s.length && decoded.length > 0) return decoded;
  } catch {}
  return s;
}

function sanitizeQuestionText(s: string): string {
  return fixEncoding(cleanText(s));
}

function sanitizeQuestions(questions: any[]): any[] {
  if (!Array.isArray(questions)) return questions;
  return questions.map(q => ({
    ...q,
    statement: q.statement ? sanitizeQuestionText(q.statement) : q.statement,
    explanation: q.explanation ? sanitizeQuestionText(q.explanation) : q.explanation,
    correctAnswer: typeof q.correctAnswer === "string" ? q.correctAnswer.toUpperCase().charAt(0) : q.correctAnswer,
    options: Array.isArray(q.options)
      ? q.options.slice(0, 5).map((o: any, i: number) => {
          if (!o || typeof o !== "object") return { letter: String.fromCharCode(65 + i), text: String(o || "") };
          const letter = typeof o.letter === "string" ? o.letter.toUpperCase() : String.fromCharCode(65 + i);
          let text = typeof o.text === "string" ? o.text : "";
          text = fixEncoding(text);
          text = text.replace(/^["\u0027\u201C\u201D]*[A-Ea-e]\)?["\u0027\u201C\u201D]*\s*/g, "").trim();
          if (!text && typeof o === "object") {
            const chars: string[] = [];
            for (let j = 0; j <= 9; j++) {
              if (o[j] !== undefined && o[j] !== null) chars.push(String(o[j]));
            }
            if (chars.length > 0) text = fixEncoding(chars.join(""));
          }
          if (!text) text = JSON.stringify(o);
          return { letter, text };
        })
      : q.options,
  }));
}

async function callAI(opts: { systemPrompt?: string; userPrompt: string; maxTokens?: number; temperature?: number; timeout?: number; type?: string }): Promise<string> {
  const renderUrl = process.env.RENDER_PROCESS_URL;
  if (!renderUrl) throw new Error("RENDER_PROCESS_URL not set");
  const base = renderUrl.replace(/\/+$/, "");
  const jobType = opts.type || "general";
  const cura = crypto.randomUUID();

  const triage = aiTriage(opts.userPrompt);
  if (!triage.ok) throw new Error(`TRIAGEM:${triage.reason}`);

  try {
    const r = await fetch(`${base}/api/process`, {
      method: "POST",
      headers: renderHeaders(),
      body: JSON.stringify({
        cura,
        prompt: opts.userPrompt,
        type: jobType,
        systemPrompt: opts.systemPrompt || null,
        maxTokens: opts.maxTokens || 8192,
        temperature: opts.temperature ?? 0.85,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) console.error("[callAI] Render /api/process returned", r.status);
  } catch (err: any) {
    console.error("[callAI] failed to reach Render:", err?.message);
    throw new Error("Serviço de IA indisponível. Tente novamente.");
  }

  throw new Error(`PENDING:${cura}`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callAISync(opts: { systemPrompt?: string; userPrompt: string; maxTokens?: number; temperature?: number; timeout?: number; type?: string; waitMs?: number }): Promise<string> {
  const renderUrl = process.env.RENDER_PROCESS_URL;
  if (!renderUrl) throw new Error("RENDER_PROCESS_URL not set");
  const base = renderUrl.replace(/\/+$/, "");
  const jobType = opts.type || "general";
  const cura = crypto.randomUUID();

  const triage = aiTriage(opts.userPrompt);
  if (!triage.ok) throw new Error(`TRIAGEM:${triage.reason}`);

  const r = await fetch(`${base}/api/process`, {
    method: "POST",
    headers: renderHeaders(),
    body: JSON.stringify({
      cura,
      prompt: opts.userPrompt,
      type: jobType,
      systemPrompt: opts.systemPrompt || null,
      maxTokens: opts.maxTokens || 8192,
      temperature: opts.temperature ?? 0.85,
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!r.ok) throw new Error("Serviço de IA indisponível.");

  const deadline = Date.now() + (opts.waitMs || 60000);
  while (Date.now() < deadline) {
    await sleep(2500);
    try {
      const s = await fetch(`${base}/api/status/${cura}`, { headers: renderHeaders(), signal: AbortSignal.timeout(4000) });
      if (!s.ok) continue;
      const data = await s.json();
      if (data?.status === "done" && typeof data?.result === "string" && data.result.length > 0) {
        return data.result;
      }
      if (data?.status === "error") {
        throw new Error("IA não conseguiu processar a solicitação.");
      }
    } catch (err: any) {
      if (err?.message?.startsWith("IA não")) throw err;
    }
  }
  throw new Error("Tempo esgotado ao processar na IA.");
}

const FREE_MODELS = [
  "openrouter/free"
];

let cachedModels: any[] | null = null;
let modelsCacheTime = 0;
const MODELS_CACHE_TTL = 300_000;

async function assertModelIsFree(modelName: string): Promise<void> {
  if (Date.now() - modelsCacheTime > MODELS_CACHE_TTL) {
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/models", { signal: AbortSignal.timeout(5000) });
      if (resp.ok) {
        const data = await resp.json();
        cachedModels = data.data || data;
        modelsCacheTime = Date.now();
      }
    } catch {}
  }
  if (!cachedModels) return;
  const model = cachedModels.find((m: any) => m.id === modelName);
  if (!model) return;
  const promptPrice = parseFloat(model.pricing?.prompt);
  const completionPrice = parseFloat(model.pricing?.completion);
  if (promptPrice > 0 || completionPrice > 0) {
    throw new Error(`Modelo pago bloqueado: ${modelName} (R$ ${promptPrice}/R$ ${completionPrice} por token). Use apenas modelos gratuitos.`);
  }
}



app.post("/api/beta-request",
  validateBody(z.object({
    name: z.string().trim().min(1).max(200),
    email: z.string().email(),
    reason: z.string().max(2000).optional(),
  })),
  async (req, res) => {
  const { name, email, reason } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Nome e e-mail são obrigatórios." });
  }
  console.log(`[beta-request] NEW: name="${name}" email="${email}" reason="${reason || ''}"`);
  try {
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.from('beta_requests').insert({
        name,
        email: email.toLowerCase().trim(),
        reason: reason || '',
        created_at: new Date().toISOString(),
      });
      if (error) console.error('[beta-request] insert failed:', error.message);
    }
  } catch (e: any) {
    console.error('[beta-request] error:', e?.message);
  }
  return res.json({ ok: true });
});

// ─── Contato (formulário público) ─────────────────────────────────────────────
  const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "apexenem@gmail.com";

app.post(
  "/api/contact",
  distributedRateLimit({ name: "contact", max: 5, windowSec: 3600 }),
  validateBody(z.object({
    name: z.string().trim().min(1).max(200),
    email: z.string().email(),
    subject: z.string().trim().max(200).optional(),
    message: z.string().trim().min(10).max(5000),
  })),
  async (req, res) => {
    const { name, email, subject, message } = req.body;
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject || "Nova mensagem de contato");
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

    try {
      if (supabaseAdmin) {
        const { error } = await supabaseAdmin.from("contact_messages").insert({
          name,
          email: email.toLowerCase().trim(),
          subject: subject || "",
          message,
          created_at: new Date().toISOString(),
        });
        if (error) console.error("[contact] insert failed:", error.message);
      }
    } catch (e: any) {
      console.error("[contact] error:", e?.message);
    }

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f0eeff;border-radius:16px">
        <h1 style="color:#1b1574;font-size:20px;margin:0 0 12px">Nova mensagem de contato — ApexEnem</h1>
        <p style="color:#444;font-size:14px;line-height:1.6"><strong>Nome:</strong> ${safeName}</p>
        <p style="color:#444;font-size:14px;line-height:1.6"><strong>E-mail:</strong> ${safeEmail}</p>
        <p style="color:#444;font-size:14px;line-height:1.6"><strong>Assunto:</strong> ${safeSubject}</p>
        <hr style="border:none;border-top:1px solid #ddd;margin:16px 0" />
        <p style="color:#333;font-size:14px;line-height:1.7">${safeMessage}</p>
      </div>`;

    const sent = await sendEmail(CONTACT_EMAIL, `[Contato] ${subject || "Nova mensagem"}`, html);
    console.log(`[contact] from="${email}" subject="${subject || ""}" sent=${sent}`);

    return res.json({ ok: true, delivered: sent });
  }
);

const SERVER_ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

app.get("/api/auth-access", (req, res) => {
  const email = String(req.query.email || "").toLowerCase().trim();
  const restricted = SERVER_ALLOWED_EMAILS.length > 0;
  const allowed = !restricted || SERVER_ALLOWED_EMAILS.includes(email);
  res.json({ restricted, allowed });
});

// ─── F1. Pesquisa de Repertórios ──────────────────────────────────────────────
//
// Sobre os links: a IA erra ao "chutar" a plataforma de streaming (a obra pode
// não estar lá → busca vazia). Por isso NÃO pedimos plataforma nenhuma à IA.
// Montamos os links no servidor por TIPO de obra:
//   - filme/série → JustWatch (agregador "onde assistir", dados do BR) + YouTube
//   - livro       → Google Books + Wikipédia
// Assim o link nunca cai em busca vazia: o JustWatch sempre mostra a obra e em
// quais serviços ela está (ou avisa honestamente que não está disponível).
function watchLinksFor(title: string, type: string): { platform: string; url: string }[] {
  const clean = title.trim();
  if (!clean) return [];
  const q = encodeURIComponent(clean);
  const t = (type || "").toLowerCase();
  if (t === "filme" || t === "série" || t === "serie" || t === "documentário" || t === "documentario" || t === "animação" || t === "animacao") {
    return [
      { platform: "Onde assistir", url: `https://www.justwatch.com/br/busca?q=${q}` },
      { platform: "YouTube", url: `https://www.youtube.com/results?search_query=${q}` },
    ];
  }
  if (t === "livro" || t === "romance" || t === "poema" || t === "peça" || t === "peca" || t === "quadrinhos" || t === "mangá" || t === "manga") {
    return [
      { platform: "Google Livros", url: `https://www.google.com/search?tbm=bks&q=${q}` },
      { platform: "Wikipédia", url: `https://pt.wikipedia.org/w/index.php?search=${q}` },
    ];
  }
  return [];
}

// Verificação factual de títulos via Wikipédia (PT), sem API key. Confirma que
// a obra existe e devolve o TÍTULO CANÔNICO real, corrigindo nomes errados.
const WIKI_TYPES = new Set(["filme", "serie", "série", "livro", "documentário", "documentario", "animação", "animacao"]);

function normalizeForMatch(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\(.*?\)/g, " ")      // remove disambiguadores "(filme)", "(livro)"
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripDisambiguator(title: string): string {
  return title.replace(/\s*\((?:filme|série|serie|livro|romance|obra|minissérie|minisserie|telenovela)[^)]*\)\s*$/i, "").trim();
}

async function wikiSearchTitle(title: string, extra: string): Promise<string | null> {
  const q = encodeURIComponent(`${title} ${extra}`.trim());
  const url = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&format=json&srlimit=3&srnamespace=0`;
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "ApexEnem/1.0 (https://apexenem.com.br; educational repertory checker)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return null;
    const data: any = await r.json();
    const results: any[] = data?.query?.search || [];
    const target = normalizeForMatch(title);
    if (!target) return null;
    for (const res of results) {
      const cand = normalizeForMatch(res?.title || "");
      // aceita quando o título canônico bate (ou contém) o título sugerido
      if (cand === target || cand.startsWith(target + " ") || target.startsWith(cand + " ")) {
        return stripDisambiguator(String(res.title));
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Confirma/corrige títulos de obras reais. Não é fatal: em falha, mantém o original. */
async function verifyItemTitles(categories: any[]): Promise<any[]> {
  const tasks: Promise<void>[] = [];
  for (const cat of categories) {
    for (const item of cat.items || []) {
      const type = String(item?.type || "").toLowerCase();
      if (!WIKI_TYPES.has(type)) continue;
      const title = String(item?.title || "").trim();
      if (!title) continue;
      const extra = [item?.creator, item?.year].filter(Boolean).join(" ");
      tasks.push(
        wikiSearchTitle(title, extra).then((canonical) => {
          if (canonical && normalizeForMatch(canonical) !== normalizeForMatch(title)) {
            item.title = canonical;
            item.titleVerified = true;
          } else if (canonical) {
            item.titleVerified = true;
          }
        })
      );
    }
  }
  await Promise.allSettled(tasks);
  return categories;
}

/** Normaliza a resposta da IA: títulos limpos + links de confiança montados no servidor. */
function normalizeRepertoires(parsed: any): { categories: any[] } {
  const categories = Array.isArray(parsed?.categories) ? parsed.categories : [];
  const out = categories
    .map((cat: any) => {
      const items = (Array.isArray(cat?.items) ? cat.items : [])
        .map((item: any) => {
          const title = String(item?.title || "").replace(/\s+/g, " ").trim();
          if (!title) return null;
          const type = String(item?.type || "").trim();
          const watch = watchLinksFor(title, type); // ignora qualquer URL vinda da IA
          const cleaned: any = {
            title,
            type: type || undefined,
            creator: item?.creator ? String(item.creator).trim() : undefined,
            studio: item?.studio ? String(item.studio).trim() : undefined,
            year: item?.year,
            synopsis: item?.synopsis ? String(item.synopsis).trim() : undefined,
            rating: item?.rating ? String(item.rating).trim() : undefined,
            titleVerified: !!item?.titleVerified,
          };
          if (watch.length > 0) cleaned.watch = watch;
          return cleaned;
        })
        .filter(Boolean);
      return { name: String(cat?.name || "").trim(), items };
    })
    .filter((cat: any) => cat.name && cat.items.length > 0);
  return { categories: out };
}

app.post(
  "/api/repertoires",
  distributedRateLimit({ name: "repertoires", max: 20, windowSec: 3600 }),
  validateBody(z.object({ theme: z.string().trim().min(4).max(300) })),
  async (req, res) => {
    const { theme } = req.body;
    const systemPrompt =
      "Você é um professor de redação do ENEM com memória enciclopédica de cultura pop e obras conhecidas. " +
      "Você seleciona obras MUITO CONHECIDAS cujo assunto central é exatamente o tema pedido. Nunca inventa títulos. Retorne APENAS JSON puro, sem markdown.";
    const userPrompt = `Tema de redação ENEM: "${theme}".

Escolha repertórios socioculturais para enriquecer uma redação sobre esse tema.

PRIORIDADE MÁXIMA (as duas ao mesmo tempo):
A) OBRAS MUITO CONHECIDAS — coisas que um estudante brasileiro reconhece na hora: cultura pop, best-sellers, clássicos populares, filmes/séries de grande audiência. NÃO escolha obras por prêmios ou por serem "de nicho"/eruditas.
B) CUJO FOCO SEJA O TEMA — a obra precisa tratar CENTRALMENTE desse assunto (não apenas tangenciar). Se a obra só menciona o tema de passagem, não serve: troque por outra mais direta.

Retorne EXATAMENTE este JSON:
{
  "categories": [
    {
      "name": "FILMES",
      "items": [
        {
          "title": "Nome oficial da obra",
          "type": "filme",
          "creator": "Diretor (filme/série) / Autor (livro)",
          "studio": "Estúdio / Editora",
          "year": 2009,
          "synopsis": "Sinopse curta, mostrando POR QUE a obra tem a ver com o tema.",
          "rating": "Nota ou indicação curta de fama (ex.: 4,8/5 no Google)"
        }
      ]
    }
  ]
}

REGRAS CRÍTICAS:
1. "type" deve ser um destes: "filme", "serie", "livro", "dado", "lei", "filosofia".
2. NÃO escreva nenhuma URL e NÃO chute plataformas de streaming. (Deixe os links com o sistema.)
3. Escreva o TÍTULO OFICIAL exato, como é conhecido no Brasil (tradução consagrada quando for o caso). Confira título e ano antes de responder.
4. Inclua ao menos 3 categorias entre: FILMES, SÉRIES, LIVROS, DADOS/ESTATÍSTICAS, LEIS, FILOSOFIA/CIÊNCIA.
5. 2 a 3 itens por categoria, com sinopse curta em português do Brasil que deixe clara a ligação com o tema.
6. Para DADOS/LEIS/FILOSOFIA, use "type" correspondente, "creator" com a fonte e "year".
7. Revise cada item antes de responder: o título existe? o ano está certo? é uma obra MUITO conhecida? o tema é o FOCO dela? Se alguma resposta for "não", substitua por outra obra.
Apenas JSON puro.`;

    try {
      const raw = await callAI({ systemPrompt, userPrompt, maxTokens: 4096, temperature: 0.5, timeout: 25000, type: "repertoires" });
      const data = extractJsonFromText(raw);
      if (!data?.categories) {
        return res.status(503).json({ error: "Resposta da IA inválida. Tente novamente." });
      }
      return res.json({ theme, ...normalizeRepertoires(data) });
    } catch (err: any) {
      if (err?.message?.startsWith("PENDING:")) {
        return res.json({ pending: true, cura: err.message.replace("PENDING:", ""), message: "Repertórios em processamento via IA..." });
      }
      if (err?.message?.startsWith("TRIAGEM:")) {
        return res.status(400).json({ error: "Tema não aceito pela triagem de IA." });
      }
      console.error("[repertoires] failed:", err?.message);
      return res.status(503).json({ error: "Serviço de IA indisponível no momento. Tente novamente." });
    }
  }
);

// Status dos repertórios: quando o job termina, normalizamos (títulos + links
// de busca válidos) ANTES de devolver ao cliente.
app.get("/api/repertoires/status/:cura", async (req, res) => {
  const renderUrl = process.env.RENDER_PROCESS_URL;
  if (!renderUrl) return res.status(503).json({ error: "Serviço indisponível." });
  try {
    const r = await fetch(`${renderUrl.replace(/\/+$/, "")}/api/status/${req.params.cura}`, {
      headers: renderHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return res.status(502).json({ error: "Render returned " + r.status });
    const data = await r.json();
    if (data?.status === "done" && typeof data.result === "string") {
      let parsed: any = null;
      try { parsed = extractJsonFromText(data.result); } catch { parsed = null; }
      if (parsed?.categories) {
        await verifyItemTitles(parsed.categories); // confirma/corrige título via Wikipédia
      }
      const normalized = normalizeRepertoires(parsed);
      return res.json({ status: "done", result: { categories: normalized.categories } });
    }
    return res.json({ status: data?.status, error: data?.error });
  } catch (err: any) {
    return res.status(502).json({ error: "Render unavailable: " + (err?.message || "timeout") });
  }
});

// ─── IA Professora (Apex) — planos de aula ───────────────────────────────────
app.post(
  "/api/teacher-plan",
  distributedRateLimit({ name: "teacher-plan", max: 30, windowSec: 3600 }),
  validateBody(z.object({ subject: z.string().trim().min(2).max(120), topic: z.string().trim().min(2).max(200), level: z.string().max(60).optional() })),
  async (req, res) => {
    const { subject, topic, level } = req.body;
    const systemPrompt =
      "Você é um professor experiente que elabora planos de aula alinhados à BNCC e ao ENEM. Retorne APENAS JSON puro, sem markdown.";
    const userPrompt = `Crie um plano de aula de "${subject}" sobre "${topic}" (nível: ${level || "Ensino Médio"}).
Retorne EXATAMENTE:
{
  "title": "...",
  "objectives": ["..."],
  "materials": ["..."],
  "steps": [{ "title": "...", "duration": "10 min", "description": "..." }],
  "assessment": ["..."],
  "homework": ["..."]
}
Apenas JSON puro.`;

    try {
      const raw = await callAI({ systemPrompt, userPrompt, maxTokens: 3072, temperature: 0.7, timeout: 25000 });
      const data = extractJsonFromText(raw);
      if (!data?.steps) return res.status(503).json({ error: "Resposta da IA inválida." });
      return res.json(data);
    } catch (err: any) {
      if (err?.message?.startsWith("PENDING:")) {
        return res.json({ pending: true, cura: err.message.replace("PENDING:", ""), message: "Plano de aula em processamento..." });
      }
      if (err?.message?.startsWith("TRIAGEM:")) return res.status(400).json({ error: "Conteúdo não aceito pela triagem." });
      return res.status(503).json({ error: "Serviço de IA indisponível." });
    }
  }
);



app.post("/api/correct",
  distributedRateLimit({ name: "correct", max: 30, windowSec: 3600 }),
  validateBody(z.object({
    title: z.string().max(300).optional(),
    text: z.string().max(30000).optional(),
    imageBase64: z.string().max(15_000_000).optional(),
  })),
  async (req, res) => {
  const { title, text, imageBase64 } = req.body;

  if (!text && !imageBase64) {
    return res.status(400).json({ error: "É necessário digitar um texto ou enviar uma foto." });
  }

  const contentToEvaluate = text || "[O aluno enviou uma imagem contendo o manuscrito de redação para transcrição e correção direta.]";

  const prompt = `Corretor oficial ENEM 2025. Avalie com precisão técnica.

REGRAS OBRIGATÓRIAS:
- Cada competência recebe 0, 40, 80, 120, 160 ou 200.
- 200 = NENHUM defeito detectável. Se você não consegue apontar um erro concreto, a nota É 200.
- 160 = 1 único ponto fraco específico e identificável (ex: 1 repertório genérico, 1 coesão redundante).
- 120 = 2+ defeitos OU 1 problema sério que prejudica a compreensão.
- 80 = problema grave que compromete a clareza.
- 40 = quase não atende o critério.
- 0 = ausente.

IMPORTANTE: Redações com texto coeso, vocabulário variado, proposta detalhada com 5 elementos e repertório produtivo devem receber 200 em todas as competências. Não desconte detalhes triviais — avalie como banca do ENEM real, não como professor exigente.

Tema: "${title || "Sem título"}"

Redação:
"""
${contentToEvaluate}
"""

NOTAS POR COMPETÊNCIA:
C1 - Domínio da escrita formal (ausência de erros ortográficos, acentuação, concordância, regência, pontuação)
C2 - Compreensão do tema e逄ao de argumentação (desenvolvimento do tema, repertório sociocultural produtivo)
C3 - Organização dos argumentos (estrutura do texto, uso de conectivos, autoria, progressão de ideias)
C4 - Coesão textual (articulação entre parágrafos, uso de operadores argumentativos, sequenciação)
C5 - Proposta de intervenção (5 elementos: AGENTE + AÇÃO + MEIO + EFEITO + DETALHAMENTO)

Retorne APENAS este JSON exato:
{
  "score": 900,
  "generalFeedback": "...",
  "competencies": [
    {"id": 1, "name": "Domínio da Escrita Formal", "description": "...", "score": 200, "feedback": "..."},
    {"id": 2, "name": "Compreensão da Tema", "description": "...", "score": 200, "feedback": "..."},
    {"id": 3, "name": "Organização dos Argumentos", "description": "...", "score": 200, "feedback": "..."},
    {"id": 4, "name": "Coesão Textual", "description": "...", "score": 200, "feedback": "..."},
    {"id": 5, "name": "Proposta de Intervenção", "description": "...", "score": 200, "feedback": "..."}
  ],
  "strengths": ["..."],
  "weaknesses": ["..."]
}
Apenas JSON puro, sem markdown.`;

  try {
    const raw = await callAI({
      systemPrompt: 'Você é um corretor oficial do ENEM. Retorne APENAS o JSON de avaliação estrito sem rodeios nem introduções estruturado exatamente como solicitado. NÃO inclua seu raciocínio ou pensamento, apenas o JSON final.',
      userPrompt: prompt,
      maxTokens: 4096,
      temperature: 0,
      timeout: 25000,
    });

    const data = extractJsonFromText(raw);
    if (!data?.competencies) {
      return res.status(503).json({ error: "Resposta da IA inválida. Tente novamente." });
    }

    const finalCompetencies = (data.competencies || []).map((c: any) => ({
      id: c.id,
      name: c.name || `Competência ${c.id}`,
      description: c.description || "",
      score: Math.min(200, Math.max(0, c.score || 0)),
      feedback: c.feedback || ""
    }));

    const consolidatedScore = finalCompetencies.reduce((acc: number, curr: any) => acc + curr.score, 0);

    return res.json({
      score: consolidatedScore,
      generalFeedback: data.generalFeedback || "Correção realizada com sucesso.",
      competencies: finalCompetencies,
      strengths: (data.strengths || []).slice(0, 3),
      weaknesses: (data.weaknesses || []).slice(0, 3),
    });
  } catch (err: any) {
    console.error('[correct] AI failed:', err?.message || err);
    if (err?.message?.startsWith("PENDING:")) {
      const cura = err.message.replace("PENDING:", "");
      return res.json({ pending: true, cura, message: "Correção em processamento via IA..." });
    }
    return res.status(503).json({ error: "Serviço de correção por IA indisponível no momento. Tente novamente." });
  }
});

const QUESTIONS_SUBJECT_MAP: Record<string, string> = {
  Matemática: "matematica",
  Humanas: "ciencias-humanas",
  Natureza: "ciencias-natureza",
  Linguagens: "linguagens",
};

async function fetchReferenceQuestions(area: string, count: number = 8): Promise<any[]> {
  const discipline = QUESTIONS_SUBJECT_MAP[area];
  if (!discipline) return [];
  const years = [2024, 2023, 2022];
  const offsets = [0, 25, 50];

  const fetchBatch = async (year: number, offset: number): Promise<any[]> => {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 1500);
      const res = await fetch(`https://api.enem.dev/v1/exams/${year}/questions?limit=25&offset=${offset}`, { signal: ctrl.signal });
      clearTimeout(tid);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.questions || []).filter((q: any) =>
        q.discipline === discipline &&
        q.correctAlternative &&
        ["A","B","C","D","E"].includes(q.correctAlternative) &&
        q.alternatives?.some((a: any) => a.text?.trim())
      ).map((q: any) => ({
        statement: ((q.context || "") + "\n" + (q.alternativesIntroduction || "")).trim() + (q.title ? " (" + q.title + ")" : ""),
        options: q.alternatives.filter((a: any) => a.text).map((a: any) => ({ letter: a.letter, text: a.text })),
        correctAnswer: q.correctAlternative,
      }));
    } catch { return []; }
  };

  const allBatches = await Promise.all(years.flatMap(year => offsets.map(o => fetchBatch(year, o))));
  const all: any[] = [];
  for (const batch of allBatches) {
    for (const q of batch) {
      if (all.length >= count) break;
      all.push(q);
    }
    if (all.length >= count) break;
  }
  return all;
}

app.post("/api/questions", async (req, res) => {
  const renderUrl = process.env.RENDER_PROCESS_URL;
  console.log("[questions] RENDER_PROCESS_URL:", renderUrl ? renderUrl.slice(0, 30) + "..." : "MISSING");
  if (!renderUrl) {
    return res.status(503).json({ error: "Serviço de geração indisponível." });
  }

  const { area, hardSubjects } = req.body;
  const targetArea = area || "Geral";
  const numQuestions = 3;

  const promptDef = PROMPTS.questions;
  const referenceQuestions = await Promise.race([
    fetchReferenceQuestions(targetArea, 4).catch(() => []),
    new Promise<any[]>(r => setTimeout(() => r([]), 1500))
  ]);

  const url = `${renderUrl.replace(/\/+$/, "")}/api/process`;
  console.log("[questions] Sending", numQuestions, "parallel jobs to:", url);

  const curas: string[] = [];
  const jobs = [];

  for (let i = 0; i < numQuestions; i++) {
    const cura = crypto.randomUUID();
    curas.push(cura);
    const prompt = promptDef.buildPrompt(1, targetArea, referenceQuestions, hardSubjects) as string;
    const delay = i * 3000;
    jobs.push(
      new Promise(resolve => setTimeout(resolve, delay)).then(() =>
        fetch(url, {
          method: "POST",
          headers: renderHeaders(),
          body: JSON.stringify({ cura, prompt, type: "questions", maxTokens: 4096, temperature: 0.9 }),
          signal: AbortSignal.timeout(5000),
        }).catch(err => {
          console.error("[questions] Failed job", i, ":", err?.message);
          return null;
        })
      )
    );
  }

  const results = await Promise.all(jobs);
  const successCount = results.filter(r => r && r.ok).length;
  console.log("[questions] Submitted", successCount, "of", numQuestions, "jobs");

  if (successCount === 0) {
    return res.status(502).json({ error: "Render service unavailable" });
  }

  return res.json({ curas });
});

app.get("/api/questions/status/:cura", async (req, res) => {
  const renderUrl = process.env.RENDER_PROCESS_URL;
  if (!renderUrl) {
    return res.status(503).json({ error: "Serviço indisponível." });
  }

  const url = `${renderUrl.replace(/\/+$/, "")}/api/status/${req.params.cura}`;
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(url, { headers: renderHeaders(), signal: ctrl.signal });
    clearTimeout(tid);
    if (!r.ok) {
      console.log("[questions/status] Render returned:", r.status);
      return res.status(502).json({ error: "Render returned " + r.status });
    }
    const data = await r.json();
    if (data.status === "done" && Array.isArray(data.result)) {
      data.result = sanitizeQuestions(data.result);
    }
    return res.json(data);
  } catch (err: any) {
    console.error("[questions/status] Failed:", err?.name, err?.message);
    return res.status(502).json({ error: "Render unavailable: " + (err?.message || "timeout") });
  }
});

app.get("/api/status/:cura", async (req, res) => {
  const renderUrl = process.env.RENDER_PROCESS_URL;
  if (!renderUrl) {
    return res.status(503).json({ error: "Serviço indisponível." });
  }

  const url = `${renderUrl.replace(/\/+$/, "")}/api/status/${req.params.cura}`;
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 10000);
    const r = await fetch(url, { headers: renderHeaders(), signal: ctrl.signal });
    clearTimeout(tid);
    if (!r.ok) {
      return res.status(502).json({ error: "Render returned " + r.status });
    }
    const data = await r.json();
    return res.json(data);
  } catch (err: any) {
    console.error("[status] Failed:", err?.name, err?.message);
    return res.status(502).json({ error: "Render unavailable: " + (err?.message || "timeout") });
  }
});

app.get("/api/questions/status-batch", async (req, res) => {
  const renderUrl = process.env.RENDER_PROCESS_URL;
  if (!renderUrl) {
    return res.status(503).json({ error: "Serviço indisponível." });
  }

  const curasParam = req.query.curas as string;
  if (!curasParam) {
    return res.status(400).json({ error: "curas query param required" });
  }

  const curas = curasParam.split(",").filter(Boolean);
  const results = await Promise.all(curas.map(async (cura) => {
    try {
      const url = `${renderUrl.replace(/\/+$/, "")}/api/status/${cura}`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 10000);
      const r = await fetch(url, { headers: renderHeaders(), signal: ctrl.signal });
      clearTimeout(tid);
      if (!r.ok) return { cura, status: "error", result: null };
      const data = await r.json();
      if (data.status === "done" && Array.isArray(data.result)) {
        data.result = sanitizeQuestions(data.result);
      }
      return data;
    } catch {
      return { cura, status: "error", result: null };
    }
  }));

  return res.json(results);
});

app.get("/api/ai-task/:cura", async (req, res) => {
  const renderUrl = process.env.RENDER_PROCESS_URL;
  if (!renderUrl) return res.status(503).json({ error: "Serviço indisponível." });
  try {
    const r = await fetch(`${renderUrl.replace(/\/+$/, "")}/api/status/${req.params.cura}`, { headers: renderHeaders(), signal: AbortSignal.timeout(8000) });
    if (!r.ok) return res.status(502).json({ error: "Render returned " + r.status });
    const data = await r.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(502).json({ error: "Render unavailable: " + (err?.message || "timeout") });
  }
});

app.post("/api/openrouter-chat",
  validateBody(z.object({
    questionText: z.string().max(8000),
    instructions: z.string().max(500).optional(),
    correctAnswer: z.string().max(2000).optional(),
  })),
  async (req, res) => {
  const { questionText, instructions, correctAnswer } = req.body;

  const cabritoPrompt = `Por favor, explique de forma motivadora este exercício para mim:\nExercício/Pergunta: "${questionText}"\nTipo do desafio: "${instructions}"\nGabarito Oficial: "${correctAnswer}"\n\nRetorne 2-3 parágrafos curtos, lúdicos e didáticos adicionando emojis de cabrito 🐐 e símbolos de livros.`;

  try {
    const text = await callAI({
      systemPrompt: "Você é o Cabrito, o tutor inteligente e encorajador tipo cabrito do Duolingo do ENEM. Explique conceitos de modo muito lúdico, conciso e instrutivo.",
      userPrompt: cabritoPrompt,
      maxTokens: 512,
      timeout: 15000,
    });
    return res.json({ text });
  } catch (err: any) {
    if (err?.message?.startsWith("PENDING:")) {
      return res.json({ pending: true, cura: err.message.replace("PENDING:", ""), message: "Explicação em processamento via IA..." });
    }
    return res.json({ text: "🐐 Olá! Encontrei um pequeno atraso de sinal para buscar a explicação, mas já volto com a resposta! 📚" });
  }
});

app.post("/api/lesson", async (req, res) => {
  const { area, level, weakTopics, topicIndex } = req.body;
  if (!area) return res.status(400).json({ error: "area is required" });

  const topicNum = typeof topicIndex === 'number' ? topicIndex : Math.floor(Math.random() * 100);

  const systemPrompt = `Você é o Cabrito 🐐, tutor inteligente e encorajador do ENEM. Gere uma aula completa e detalhada sobre um tópico específico dentro da área "${area}" para o ENEM.

Nível de dificuldade: ${level || 5}/10 (1=fundamental, 10=avançado cursinho).
Tópico sorteado #: ${topicNum} (use para variar o conteúdo — cada número gera um tema diferente dentro da área).

Regras:
- O conteúdo deve ter EXATAMENTE 5 a 7 blocos de texto, cada um com 2-4 frases didáticas
- Cada bloco deve ser um conceito distinto e progressivo
- Ao final, gere 3 dicas práticas para o ENEM
- Use linguagem acessível mas técnica o suficiente para o ENEM
- Inclua exemplos práticos e contextualizações reais
- NÃO repita tópicos óbvios — aprofunde-se em nuances que caem no ENEM
- Foque em conteúdo que realmente cai nas provas

Para a área "${area}", sugira tópicos variados como:
- Redação: tipos de tese, conectivos avançados, repertórios, proposta de intervenção
- Linguagens: interpretação de gêneros, figuras de linguagem, gramática contextual, literatura brasileira
- Humanas: movimentos sociais, geopolítica, filósofos, historia do Brasil
- Natureza: bioquímica, termodinâmica, química orgânica, genética molecular
- Matemática: funções trigonométricas, combinatória, geometria analítica, estatística`;

  const userPrompt = `Gere uma aula ENEM sobre um tópico diversificado da área "${area}" (tópico #${topicNum}). Retorne APENAS o JSON, sem markdown:

{
  "title": "Título chamativo da aula",
  "subtitle": "Subtítulo explicativo curto",
  "content": ["bloco 1", "bloco 2", "bloco 3", "bloco 4", "bloco 5"],
  "tips": ["dica 1", "dica 2", "dica 3"]
}`;

  try {
    const raw = await callAI({ systemPrompt, userPrompt, maxTokens: 4096, temperature: 0.85, timeout: 25000 });

    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    let lesson = null;
    try { lesson = JSON.parse(cleaned); } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) try { lesson = JSON.parse(match[0]); } catch {}
    }

    if (lesson && lesson.title && Array.isArray(lesson.content) && lesson.content.length >= 3) {
      return res.json(lesson);
    }
  } catch (err: any) {
    if (err?.message?.startsWith("PENDING:")) {
      return res.json({ pending: true, cura: err.message.replace("PENDING:", ""), message: "Aula em processamento via IA..." });
    }
  }

  return res.json({
    title: `Aula de ${area}`,
    subtitle: 'Conceitos essenciais para o ENEM',
    content: [
      `A área de ${area} é uma das mais importantes no ENEM. Cada prova traz questões que exigem não apenas memorização, mas interpretação profunda e aplicação prática.`,
      `Para ir bem, é essencial dominar os conceitos fundamentais e entender como eles se conectam com situações reais. O ENEM valoriza a capacidade de relacionar conteúdos.`,
      `Estude com consistência, resolva questões de provas anteriores e sempre revise seus pontos fracos. A prática regular é a chave para a aprovação.`,
      `Não pule etapas: construa uma base sólida antes de avançar para tópicos complexos. Use resumos, mapas mentais e fichas de revisão.`,
      `Lembre-se: o ENEM não cobra apenas fórmulas. Ele avalia sua capacidade de pensar criticamente e propor soluções para problemas reais da sociedade brasileira.`
    ],
    tips: [
      'Resolva questões de provas anteriores do ENEM regularmente.',
      'Revise seus erros e identifique padrões nos temas que erra.',
      'Use o método de repetição espaçada para fixar o conteúdo.'
    ]
  });
});

app.post("/api/lesson-v2", async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { area, level, weakTopics, topicIndex, topic } = req.body;
    if (!area) return res.status(400).json({ error: "area is required" });

  const topicNum = typeof topicIndex === 'number' ? topicIndex : Math.floor(Math.random() * 100);
  const promptDef = PROMPTS.lessonCycle;
  const built = promptDef.buildPrompt(area, level || 5, topicNum, weakTopics, topic);
  const systemPrompt = typeof built === 'string' ? built : built.system;
  const userPrompt = typeof built === 'string' ? '' : built.user;

  function parseLessonJson(content: string): any | null {
    const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.title && Array.isArray(parsed.cycles) && parsed.cycles.length >= 4) return parsed;
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (parsed.title && Array.isArray(parsed.cycles)) return parsed;
        } catch {}
      }
    }
    return null;
  }

  try {
    const raw = await callAI({ systemPrompt, userPrompt: userPrompt || systemPrompt, maxTokens: 8192, temperature: 0.85, timeout: 25000 });
    const lesson = parseLessonJson(raw);
    if (lesson) return res.json(lesson);
  } catch (err: any) {
    if (err?.message?.startsWith("PENDING:")) {
      return res.json({ pending: true, cura: err.message.replace("PENDING:", ""), message: "Aula em processamento via IA..." });
    }
  }

  return res.status(503).json({ error: "IA não conseguiu gerar a aula. Tente novamente." });
  } catch (err) {
    console.error('[lesson-v2] fatal:', err);
    return res.status(503).json({ error: "Erro ao gerar aula. Tente novamente." });
  }
});

app.post("/api/chapter-lesson", async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { subject, moduleTitle, chapterTitle, chapterDescription, difficulty, weakTopics } = req.body;
    if (!subject || !chapterTitle) return res.status(400).json({ error: "subject and chapterTitle are required" });

  const promptDef = PROMPTS.chapterLesson;
  const built = promptDef.buildPrompt(subject, moduleTitle || '', chapterTitle, chapterDescription || '', difficulty || 2, weakTopics);
  const systemPrompt = typeof built === 'string' ? built : built.system;
  const userPrompt = typeof built === 'string' ? '' : built.user;

  function parseChapterJson(content: string): any | null {
    const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.chapterTitle && Array.isArray(parsed.sections) && parsed.sections.length >= 5) return parsed;
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (parsed.chapterTitle && Array.isArray(parsed.sections)) return parsed;
        } catch {}
      }
    }
    return null;
  }

  try {
    const raw = await callAI({ systemPrompt, userPrompt: userPrompt || systemPrompt, maxTokens: 12288, temperature: 0.85, timeout: 25000 });
    const lesson = parseChapterJson(raw);
    if (lesson) return res.json(lesson);
  } catch (err: any) {
    if (err?.message?.startsWith("PENDING:")) {
      return res.json({ pending: true, cura: err.message.replace("PENDING:", ""), message: "Aula do capítulo em processamento via IA..." });
    }
  }

  return res.status(503).json({ error: "IA não conseguiu gerar a aula do capítulo. Tente novamente." });
  } catch (err) {
    console.error('[chapter-lesson] fatal:', err);
    return res.status(503).json({ error: "Erro ao gerar aula do capítulo. Tente novamente." });
  }
});

app.post("/api/questoes-ai", async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { area, count, weakTopics, topic } = req.body;
    if (!area) return res.status(400).json({ error: "area is required" });

  const promptDef = PROMPTS.questoesComFeedback;
  const built = promptDef.buildPrompt(area, count || 5, weakTopics, topic);
  const systemPrompt = typeof built === 'string' ? built : built.system;
  const userPrompt = typeof built === 'string' ? '' : built.user;

  function parseQuestoesJson(content: string): any[] | null {
    const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length >= 2) {
        return parsed.questions;
      }
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed.length >= 2) return parsed;
        } catch {}
      }
    }
    return null;
  }

  try {
    const raw = await callAI({ systemPrompt, userPrompt: userPrompt || systemPrompt, maxTokens: 8192, temperature: 0.85, timeout: 25000 });
    const questions = parseQuestoesJson(raw);
    if (questions) return res.json({ questions });
  } catch (err: any) {
    if (err?.message?.startsWith("PENDING:")) {
      return res.json({ pending: true, cura: err.message.replace("PENDING:", ""), message: "Questões em processamento via IA..." });
    }
  }

  return res.status(503).json({ error: "IA não conseguiu gerar questões. Tente novamente." });
  } catch (err) {
    console.error('[questoes-ai] fatal:', err);
    return res.status(503).json({ error: "Erro ao gerar questões. Tente novamente." });
  }
});

app.post("/api/pratica-questoes", async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { area, topic, weakTopics } = req.body;
    if (!area) return res.status(400).json({ error: "area is required" });
    if (!topic) return res.status(400).json({ error: "topic is required" });

  const promptDef = PROMPTS.praticaQuestoes;
  const built = promptDef.buildPrompt(area, topic, weakTopics);
  const systemPrompt = typeof built === 'string' ? built : built.system;
  const userPrompt = typeof built === 'string' ? '' : built.user;

  function parsePraticaJson(content: string): any | null {
    const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed.practice) && parsed.practice.length >= 1 && Array.isArray(parsed.quiz) && parsed.quiz.length >= 1) {
        return parsed;
      }
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed.practice) && Array.isArray(parsed.quiz)) return parsed;
        } catch {}
      }
    }
    return null;
  }

  try {
    const raw = await callAI({ systemPrompt, userPrompt: userPrompt || systemPrompt, maxTokens: 8192, temperature: 0.85, timeout: 25000 });
    const pratica = parsePraticaJson(raw);
    if (pratica) return res.json(pratica);
  } catch (err: any) {
    if (err?.message?.startsWith("PENDING:")) {
      return res.json({ pending: true, cura: err.message.replace("PENDING:", ""), message: "Prática em processamento via IA..." });
    }
  }

  return res.status(503).json({ error: "IA não conseguiu gerar a prática. Tente novamente." });
  } catch (err) {
    console.error('[pratica-questoes] fatal:', err);
    return res.status(503).json({ error: "Erro ao gerar a prática. Tente novamente." });
  }
});

app.post("/api/classify-question", async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { statement, subject } = req.body;
    if (!statement || typeof statement !== 'string' || statement.trim().length < 10) {
      return res.status(400).json({ error: "statement is required" });
    }

  const promptDef = PROMPTS.classificacaoErro;
  const built = promptDef.buildPrompt(statement, subject);
  const systemPrompt = typeof built === 'string' ? built : built.system;
  const userPrompt = typeof built === 'string' ? '' : built.user;

  function parseClassificacao(content: string): { subject: string; method: string; topic: string } | null {
    const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (typeof parsed?.subject === 'string' && typeof parsed?.method === 'string' && typeof parsed?.topic === 'string') {
        return { subject: parsed.subject, method: parsed.method, topic: parsed.topic };
      }
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (parsed && typeof parsed.subject === 'string' && typeof parsed.method === 'string' && typeof parsed.topic === 'string') {
            return { subject: parsed.subject, method: parsed.method, topic: parsed.topic };
          }
        } catch {}
      }
    }
    return null;
  }

  try {
    const raw = await callAISync({ systemPrompt, userPrompt: userPrompt || systemPrompt, maxTokens: 512, temperature: 0.2, timeout: 25000, waitMs: 45000 });
    const classificacao = parseClassificacao(raw);
    if (classificacao) {
      return res.json(classificacao);
    }
  } catch (err: any) {
    console.error('[classify-question] erro IA:', err?.message);
  }

  return res.json({ subject: subject || '', method: '', topic: '' });
  } catch (err) {
    console.error('[classify-question] fatal:', err);
    return res.status(503).json({ error: "Erro ao classificar a questão." });
  }
});

app.post("/api/simulado-explanation", async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'questions array is required' });
    }

    const limited = questions.slice(0, 15);

    const batchPrompt = limited.map((q: any, i: number) => {
      const optsText = (q.options || []).map((o: any) => `${o.letter}) ${o.text}`).join('\n');
      return `QUESTAO ${i + 1} (id: ${q.id}):\n${q.statement}\n${optsText}\nResposta correta: ${q.correctAnswer}`;
    }).join('\n\n---\n\n');

    const systemPrompt = `Para cada questão abaixo, explique de forma didática por que a alternativa correta está correta e brevemente por que as outras estão incorretas. Seja claro e objetivo.
Retorne APENAS um JSON no formato: {"explanations": {"id_da_questao": "explicação", ...}}`;

    const renderUrl = process.env.RENDER_PROCESS_URL;
    if (!renderUrl) {
      return res.status(503).json({ error: "Serviço indisponível." });
    }

    const cura = crypto.randomUUID();
    const base = renderUrl.replace(/\/+$/, "");
    try {
      await fetch(`${base}/api/process`, {
        method: "POST",
        headers: renderHeaders(),
        body: JSON.stringify({ cura, prompt: batchPrompt, type: "general", systemPrompt }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {}

    return res.json({ pending: true, cura, message: "Explicações em processamento via IA..." });
  } catch (err) {
    console.error('[simulado-explanation] fatal:', err);
    return res.status(503).json({ error: 'Erro ao gerar explicações.' });
  }
});

app.post("/api/generate-learning-exercises", async (req, res) => {
  const { chapterTitle, chapterArea, weakAreas, count } = req.body;

  const systemMsg = `Você é um gerador de exercícios educacionais para o ENEM. Gere ${count || 3} exercícios no formato JSON sobre "${chapterTitle}" (área: ${chapterArea}).
Os exercícios DEVEM ser variados entre os tipos: 'choice', 'true-false', 'reorder', 'matching'.
Sempre retorne APENAS o JSON array, sem markdown.
Se o usuário tem pontos fracos (${weakAreas?.join(', ') || 'nenhum'}), foque neles.`;
  const userMsg = `Gere ${count || 3} exercícios sobre "${chapterTitle}" para o ENEM, focando nos pontos fracos: ${weakAreas?.join(', ') || 'nenhum específico'}. Retorne apenas o JSON.`;

  function parseExercises(content: string): any[] | null {
    const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          return Array.isArray(parsed) ? parsed : null;
        } catch {}
      }
      return null;
    }
  }

  try {
    const raw = await callAI({ systemPrompt: systemMsg, userPrompt: userMsg, maxTokens: 1536, timeout: 15000 });
    const exercises = parseExercises(raw);
    return res.json({ exercises: exercises && exercises.length > 0 ? exercises : null });
  } catch (err: any) {
    if (err?.message?.startsWith("PENDING:")) {
      return res.json({ pending: true, cura: err.message.replace("PENDING:", ""), exercises: null });
    }
    return res.json({ exercises: null });
  }
});

app.post("/api/supabase/save-progress", async (req, res) => {
  const { progress } = req.body;
  const email = req.userEmail;
  if (!email || !progress) {
    return res.status(400).json({ error: "Progresso é necessário." });
  }

  if (!supabaseAdmin) {
    return res.json({ success: false, message: "Supabase não está inicializado." });
  }

  const safeProgress = {
    chapters: progress?.chapters || [],
    xpPoints: typeof progress?.xpPoints === "number" ? progress.xpPoints : 0
  };

  try {
    const { data, error } = await supabaseAdmin
      .from("ApexEnem_progress")
      .upsert(
        { email, progress: safeProgress, updated_at: new Date().toISOString() },
        { onConflict: "email" }
      );

    if (error) {
      console.warn("Supabase upsert warning:", error.message);
      return res.json({ success: false, message: "Erro ao salvar progresso." });
    }

    return res.json({ success: true, data });
  } catch (err: any) {
    console.error("Supabase sync error:", err.message);
    return res.json({ success: false, message: "Erro interno ao salvar progresso." });
  }
});

app.get("/api/supabase/get-progress", async (req, res) => {
  const email = req.userEmail;
  if (!email) {
    return res.status(400).json({ error: "Usuário não autenticado." });
  }

  if (!supabaseAdmin) {
    return res.json({ success: false, message: "Supabase não está configurado." });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("ApexEnem_progress")
      .select("progress")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (error) {
      console.warn("Supabase progress fetch error:", error.message);
      return res.json({ success: false, message: "Erro ao buscar progresso." });
    }

    return res.json({ success: true, progress: data?.progress || null });
  } catch (err: any) {
    console.error("Supabase progress loading failed:", err.message);
    return res.json({ success: false, message: "Erro interno ao carregar progresso." });
  }
});

// ─── Wallet (moedas) — persistente por usuário ───────────────────────────────
const WALLET_MONTHLY_COINS: Record<string, number> = { free: 10, pro: 600, apex: 2000 };
const WALLET_WEEKLY_RESET_COINS = 10;
const WALLET_MAX_COINS = 10_000_000;

function walletIsoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function normalizeWalletRow(row: any) {
  const plan: string = ["free", "pro", "apex"].includes(row?.plan) ? row.plan : "free";
  const now = new Date();
  let coins = Number.isFinite(row?.coins) ? Math.max(0, Math.floor(row.coins)) : WALLET_WEEKLY_RESET_COINS;
  let weeklyResetAt: string = typeof row?.weekly_reset_at === "string" && row.weekly_reset_at ? row.weekly_reset_at : walletIsoWeekKey(now);
  let refreshedAt: string = row?.refreshed_at || now.toISOString();
  const history: any[] = Array.isArray(row?.history) ? row.history.slice(0, 100) : [];

  if (plan === "free") {
    // Free: recarrega para 10 moedas no início de cada semana ISO.
    const week = walletIsoWeekKey(now);
    if (weeklyResetAt !== week) {
      coins = WALLET_WEEKLY_RESET_COINS;
      weeklyResetAt = week;
      history.unshift({ ts: Date.now(), delta: WALLET_WEEKLY_RESET_COINS, reason: "Recarga semanal do plano Free" });
    }
  } else {
    // Pagos: cota mensal quando vira o mês.
    const last = new Date(refreshedAt);
    if (isNaN(last.getTime()) || now.getUTCMonth() !== last.getUTCMonth() || now.getUTCFullYear() !== last.getUTCFullYear()) {
      coins += WALLET_MONTHLY_COINS[plan] || 0;
      refreshedAt = now.toISOString();
      history.unshift({ ts: Date.now(), delta: WALLET_MONTHLY_COINS[plan] || 0, reason: `Cota mensal do plano ${plan.toUpperCase()}` });
    }
  }

  coins = Math.min(WALLET_MAX_COINS, coins);
  return { plan, coins, refreshed_at: refreshedAt, weekly_reset_at: weeklyResetAt, history: history.slice(0, 100) };
}

app.get("/api/wallet", async (req: any, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Usuário não autenticado." });
  if (!supabaseAdmin) return res.status(503).json({ error: "Serviço indisponível." });

  try {
    const { data, error } = await supabaseAdmin
      .from("wallets")
      .select("plan, coins, refreshed_at, weekly_reset_at, history")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Wallet fetch error:", error.message);
      return res.status(500).json({ error: "Erro ao carregar carteira." });
    }

    const normalized = normalizeWalletRow(data);
    const { error: upErr } = await supabaseAdmin
      .from("wallets")
      .upsert({ user_id: userId, ...normalized, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (upErr) console.warn("Wallet upsert warning:", upErr.message);

    return res.json({ success: true, wallet: normalized });
  } catch (err: any) {
    console.error("Wallet load failed:", err.message);
    return res.status(500).json({ error: "Erro interno ao carregar carteira." });
  }
});

app.post("/api/wallet", async (req: any, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Usuário não autenticado." });
  if (!supabaseAdmin) return res.status(503).json({ error: "Serviço indisponível." });

  const body = req.body || {};
  const plan: string = ["free", "pro", "apex"].includes(body.plan) ? body.plan : "free";
  const coins = Number.isFinite(body.coins) ? Math.max(0, Math.min(WALLET_MAX_COINS, Math.floor(body.coins))) : WALLET_WEEKLY_RESET_COINS;
  const weeklyResetAt: string = typeof body.weeklyResetAt === "string" && body.weeklyResetAt ? body.weeklyResetAt : walletIsoWeekKey(new Date());
  const refreshedAt: string = typeof body.refreshedAt === "string" && body.refreshedAt ? body.refreshedAt : new Date().toISOString();
  const history: any[] = Array.isArray(body.history)
    ? body.history
        .filter((h: any) => h && Number.isFinite(h.delta))
        .slice(0, 100)
        .map((h: any) => ({ ts: Number.isFinite(h.ts) ? h.ts : Date.now(), delta: Math.floor(h.delta), reason: String(h.reason || "").slice(0, 120) }))
    : [];

  try {
    const row = { user_id: userId, plan, coins, refreshed_at: refreshedAt, weekly_reset_at: weeklyResetAt, history, updated_at: new Date().toISOString() };
    const { error } = await supabaseAdmin.from("wallets").upsert(row, { onConflict: "user_id" });
    if (error) {
      console.warn("Wallet save error:", error.message);
      return res.status(500).json({ error: "Erro ao salvar carteira." });
    }
    const normalized = normalizeWalletRow(row);
    return res.json({ success: true, wallet: normalized });
  } catch (err: any) {
    console.error("Wallet save failed:", err.message);
    return res.status(500).json({ error: "Erro interno ao salvar carteira." });
  }
});

app.post("/api/supabase/setup", async (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseAdmin || !supabaseUrl || !serviceRoleKey) {
    return res.json({ success: false, message: "SUPABASE_SERVICE_ROLE_KEY não configurada no Vercel." });
  }

  const tables = ["profiles", "essay_corrections", "simulado_history", "activity_logs", "ApexEnem_progress", "wallets"];
  const missing: string[] = [];

  for (const t of tables) {
    const { error } = await supabaseAdmin.from(t).select("id").limit(1).maybeSingle();
    if (error?.message?.includes("does not exist") || error?.message?.includes("relation")) missing.push(t);
  }

  if (missing.length === 0) {
    return res.json({ success: true, message: "Todas as tabelas existem." });
  }

  // Helper to run SQL via Management API
  async function runSql(sql: string): Promise<boolean> {
    const mgmtKey = process.env.SUPABASE_MANAGEMENT_KEY;
    if (mgmtKey && supabaseUrl) {
      try {
        const ref = supabaseUrl.replace("https://", "").split(".")[0];
        const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/sql`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${mgmtKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query: sql })
        });
        if (mgmtRes.ok) return true;
      } catch {}
    }
    return false;
  }

  // Try to create tables via Management API
  const allSql = missing.map(t => getTableSql(t)).join("\n\n");
  const created = await runSql(allSql);
  if (created) {
    const recheck = [];
    for (const t of missing) {
      const { error } = await supabaseAdmin.from(t).select("id").limit(1).maybeSingle();
      if (error?.message?.includes("does not exist") || error?.message?.includes("relation")) recheck.push(t);
    }
    if (recheck.length === 0) {
      return res.json({ success: true, message: "Todas as tabelas criadas com sucesso!" });
    }
  }

  const fullSql = `-- ═══════════════════════════════════════════
-- Execute este SQL no SQL Editor do Supabase
-- Dashboard: https://supabase.com/dashboard
-- ═══════════════════════════════════════════

${missing.map(t => getTableSql(t)).join("\n\n")}\n\n-- 2. Cria perfis para usuários existentes sem perfil\nINSERT INTO public.profiles (id, name, region, state, city)\nSELECT id, COALESCE(raw_user_meta_data ->> 'name', 'Estudante'), raw_user_meta_data ->> 'region', raw_user_meta_data ->> 'state', raw_user_meta_data ->> 'city' FROM auth.users ON CONFLICT DO NOTHING;`;

  return res.json({
    success: false,
    missing,
    sql: fullSql,
    message: `Execute o SQL abaixo no Supabase Dashboard para criar as tabelas: ${missing.join(", ")}`
  });
});

function getTableSql(table: string): string {
  switch (table) {
    case "profiles":
      return `CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Estudante',
  region TEXT, state TEXT, city TEXT, avatar TEXT,
  serie TEXT, target_score INTEGER, hard_subjects TEXT[],
  streak INTEGER DEFAULT 1, last_login_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='read') THEN
    CREATE POLICY "read" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='insert') THEN
    CREATE POLICY "insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='update') THEN
    CREATE POLICY "update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;`;

    case "essay_corrections":
      return `CREATE TABLE IF NOT EXISTS public.essay_corrections (
  id TEXT PRIMARY KEY, user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL, text TEXT NOT NULL, score INTEGER NOT NULL,
  general_feedback TEXT, competencies JSONB DEFAULT '[]',
  strengths TEXT[] DEFAULT '{}', weaknesses TEXT[] DEFAULT '{}',
  date TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.essay_corrections ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_essay_user ON public.essay_corrections(user_id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='essay_corrections' AND policyname='read') THEN
    CREATE POLICY "read" ON public.essay_corrections FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='essay_corrections' AND policyname='insert') THEN
    CREATE POLICY "insert" ON public.essay_corrections FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='essay_corrections' AND policyname='update') THEN
    CREATE POLICY "update" ON public.essay_corrections FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;`;

    case "simulado_history":
      return `CREATE TABLE IF NOT EXISTS public.simulado_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score_percent INTEGER NOT NULL, subject TEXT NOT NULL,
  date TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.simulado_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_simulado_user ON public.simulado_history(user_id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='simulado_history' AND policyname='read') THEN
    CREATE POLICY "read" ON public.simulado_history FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='simulado_history' AND policyname='insert') THEN
    CREATE POLICY "insert" ON public.simulado_history FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;`;

    case "activity_logs":
      return `CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY, user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, title TEXT NOT NULL, description TEXT,
  time_ago TEXT, date TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_logs_user ON public.activity_logs(user_id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='activity_logs' AND policyname='read') THEN
    CREATE POLICY "read" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='activity_logs' AND policyname='insert') THEN
    CREATE POLICY "insert" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;`;

    case "ApexEnem_progress":
      return `CREATE TABLE IF NOT EXISTS public."ApexEnem_progress" (
  email text PRIMARY KEY, progress jsonb DEFAULT '{}'::jsonb, updated_at timestamptz DEFAULT now()
);
ALTER TABLE public."ApexEnem_progress" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "all_access" ON public."ApexEnem_progress";
CREATE POLICY "all_access" ON public."ApexEnem_progress"
  USING (auth.jwt() ->> 'email' = email)
  WITH CHECK (auth.jwt() ->> 'email' = email);`;

    case "wallets":
      return `CREATE TABLE IF NOT EXISTS public.wallets (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free',
  coins INTEGER NOT NULL DEFAULT 10,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weekly_reset_at TEXT,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wallets' AND policyname='read') THEN
    CREATE POLICY "read" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wallets' AND policyname='insert') THEN
    CREATE POLICY "insert" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wallets' AND policyname='update') THEN
    CREATE POLICY "update" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;`;

    default:
      return "";
  }
}

app.get("/api/supabase/keep-alive", async (req, res) => {
  if (!supabaseAdmin) {
    return res.json({ status: "supabase_not_configured" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("ApexEnem_progress")
      .select("email")
      .limit(1);

    if (error) {
      console.warn("Supabase keep-alive error:", error.message);
      return res.json({ status: "error" });
    }

    return res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Supabase keep-alive error:", err.message);
    return res.json({ status: "error" });
  }
});

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "ApexEnem <onboarding@resend.dev>";

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) {
      console.error("[sendEmail] Resend returned", r.status, (await r.text().catch(() => "")).slice(0, 200));
      return false;
    }
    return true;
  } catch (err: any) {
    console.error("[sendEmail] failed:", err?.message);
    return false;
  }
}

app.post("/api/send-confirmation", validateBody(z.object({ email: z.string().email(), code: z.string().min(4).max(12) })), async (req, res) => {
  const { email, code } = req.body;

  let token: string;
  try {
    token = signToken(email, code);
  } catch (err: any) {
    console.warn("Failed to sign token:", err.message);
    return res.status(500).json({ error: "Erro ao gerar token de confirmação" });
  }

  const confirmLink = `${getBaseUrl()}/api/confirm-email?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}&token=${encodeURIComponent(token)}`;

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f0eeff;border-radius:16px">
      <h1 style="color:#1b1574;font-size:22px;margin:0 0 12px">Confirmar e-mail — ApexEnem</h1>
      <p style="color:#444;font-size:14px;line-height:1.6">Use o código abaixo para confirmar seu e-mail e ativar sua conta:</p>
      <p style="font-size:32px;font-weight:800;letter-spacing:6px;color:#2563eb;text-align:center;margin:24px 0">${escapeHtml(code)}</p>
      <p style="text-align:center"><a href="${confirmLink}" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px">Confirmar e-mail</a></p>
      <p style="color:#888;font-size:12px;line-height:1.6;margin-top:20px">Se você não criou uma conta no ApexEnem, ignore este e-mail.</p>
    </div>`;

  const sent = await sendEmail(email, "Seu código de confirmação — ApexEnem", html);

  if (!sent) {
    console.log(`[SIMULATED] Confirmation code for ${email}: ${code}`);
    return res.json({ sent: true, simulated: true, token, confirmLink });
  }
  return res.json({ sent: true, simulated: false });
});

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

app.get("/api/confirm-email", (req, res) => {
  const { email, code, token } = req.query;

  if (typeof email !== "string" || typeof code !== "string") {
    return res.status(400).json({ error: "Email e código são obrigatórios" });
  }

  const isHtml = req.headers.accept?.includes("text/html");

  if (token && typeof token === "string") {
    let valid = false;
    try {
      valid = verifyToken(email, code, token);
    } catch {
      valid = false;
    }
    if (valid && isHtml) {
      const safeEmail = escapeHtml(email);
      return res.type("html").send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>E-mail Confirmado - ApexEnem</title>
        <style>body{font-family:sans-serif;background:#f0eeff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px}
        .card{background:#fff;padding:48px 32px;border-radius:24px;box-shadow:0 4px 24px rgba(0,0,0,.08);text-align:center;max-width:400px}
        .check{width:64px;height:64px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px;color:#fff}
        h1{font-size:24px;color:#1b1574;margin:0 0 8px} p{color:#666;font-size:14px;line-height:1.6;margin:0 0 24px}
        .btn{display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px}
        </style></head>
        <body><div class="card"><div class="check">✓</div>
        <h1>E-mail Confirmado!</h1><p>Seu e-mail <strong>${safeEmail}</strong> foi verificado com sucesso. Sua conta ApexEnem já está ativa.</p>
        <a class="btn" href="${getBaseUrl()}">Ir para o ApexEnem</a></div></body></html>
      `);
    }
    if (valid) {
      return res.json({ confirmed: true });
    }
    if (isHtml) {
      return res.type("html").send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Código Inválido - ApexEnem</title>
        <style>body{font-family:sans-serif;background:#f0eeff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px}
        .card{background:#fff;padding:48px 32px;border-radius:24px;box-shadow:0 4px 24px rgba(0,0,0,.08);text-align:center;max-width:400px}
        .x{width:64px;height:64px;background:#ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px;color:#fff}
        h1{font-size:24px;color:#1b1574;margin:0 0 8px} p{color:#666;font-size:14px;line-height:1.6;margin:0 0 8px}
        </style></head>
        <body><div class="card"><div class="x">✕</div>
        <h1>Link Inválido</h1><p>Este link de confirmação é inválido ou expirou. Tente copiar o código manualmente no app.</p></div></body></html>
      `);
    }
    return res.status(400).json({ error: "Token inválido ou expirado" });
  }

  return res.status(400).json({ error: "Token de confirmação não enviado" });
});

const SUBJECT_MAP: Record<string, string> = {
  Matemática: "matematica",
  Humanas: "ciencias-humanas",
  Natureza: "ciencias-natureza",
  Linguagens: "linguagens",
};

app.get("/api/enem-questions", async (req, res) => {
  const subject = (req.query.subject as string) || "Geral";
  const count = Math.max(1, Math.min(50, parseInt(req.query.count as string) || 10));
  const usedIds = (req.query.used as string) || "";

  const years = [2023, 2022, 2021, 2020];
  const allQuestions: any[] = [];
  const BATCH_SIZE = 50;
  const MAX_BATCHES = 4;

  const results = await Promise.allSettled(
    years.flatMap(year =>
      Array.from({ length: MAX_BATCHES }, (_, i) => i * BATCH_SIZE).map(async (offset) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
          const url = `https://api.enem.dev/v1/exams/${year}/questions?limit=${BATCH_SIZE}&offset=${offset}`;
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) return [];
          const data = await response.json();
          const questions = data.questions || [];

          return (questions || [])
            .filter((q: any) => q && typeof q === "object")
            .filter((q: any) => {
              if (subject !== "Geral" && q.discipline !== SUBJECT_MAP[subject]) return false;
              const letter = q.correctAlternative;
              if (!letter || !["A","B","C","D","E"].includes(letter)) return false;
              const hasText = q.alternatives?.some((a: any) => a.text?.trim());
              if (!hasText) return false;
              if (usedIds.includes(`enem-${q.year}-${q.index}`)) return false;
              return true;
            })
            .map((q: any) => ({
              id: `enem-${q.year}-${q.index}`,
              statement: ((q.title || `ENEM ${q.year} - Questão ${q.index}`) + "\n\n" + (q.context || "") + "\n" + (q.alternativesIntroduction || "")).trim(),
              options: q.alternatives?.filter((a: any) => a.text).map((a: any) => ({
                letter: a.letter,
                text: a.text || "",
                image: a.image || undefined
              })) || [],
              correctAnswer: q.correctAlternative,
              explanation: `Alternativa correta: ${q.correctAlternative}. ${(q.alternatives?.find((a: any) => a.letter === q.correctAlternative)?.text || q.alternatives?.find((a: any) => a.letter === q.correctAlternative)?.image) || ""}`,
              year: q.year,
              index: q.index,
              image: q.image || undefined,
              imageAlt: q.title || undefined,
            }));
        } catch (err: any) {
          console.warn(`Failed to fetch year ${year} offset ${offset}:`, err.message);
          return [];
        } finally {
          clearTimeout(timeoutId);
        }
      })
    )
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allQuestions.push(...result.value);
    }
  }

  for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }

  const selected = allQuestions.slice(0, Math.min(count, allQuestions.length));

  if (selected.length === 0) {
    return res.json({ questions: [], error: "Nenhuma questão encontrada para este filtro." });
  }

  res.json({ questions: selected });
});

let statsCache: { at: number; data: any } | null = null;

app.get("/api/stats", async (_req, res) => {
  if (statsCache && Date.now() - statsCache.at < 5 * 60 * 1000) {
    return res.json(statsCache.data);
  }
  const sendStats = (data: any) => {
    statsCache = { at: Date.now(), data };
    return res.json(data);
  };
  let totalUsers = 0;
  let tablesExist = false;
  const regionCounts: Record<string, number> = { Norte: 0, Nordeste: 0, "Centro-Oeste": 0, Sudeste: 0, Sul: 0 };
  const stateCounts: Record<string, number> = {};
  const cityCounts: Record<string, number> = {};

  // Try profiles table first
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.from("profiles").select("region, state, city");
      if (!error && data) {
        tablesExist = true;
        totalUsers = data.length;
        for (const p of data) {
          if (p.region && regionCounts[p.region] !== undefined) {
            regionCounts[p.region]++;
          }
          if (p.state) {
            stateCounts[p.state] = (stateCounts[p.state] || 0) + 1;
          }
          if (p.city) {
            cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
          }
        }
        return sendStats({ totalUsers, regionCounts, stateCounts, cityCounts, tablesExist });
      }
    } catch {}
  }

  // Fallback: try GoTrue Admin API to count users with their metadata
  if (supabaseAdmin) {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      if (supabaseUrl) {
        const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          headers: {
            "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          }
        });
        if (authRes.ok) {
          const authData = await authRes.json();
          const users = authData.users || [];
          totalUsers = users.length;
          for (const u of users) {
            const meta = u.user_metadata || {};
            const region = meta.region || meta.state || "";
            if (region && regionCounts[region] !== undefined) {
              regionCounts[region]++;
            }
          }
          tablesExist = true;
          return sendStats({ totalUsers, regionCounts, stateCounts, cityCounts, tablesExist });
        }
      }
    } catch {}
  }

  sendStats({ totalUsers, regionCounts, tablesExist });
});

app.post("/api/delete-account", async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Serviço de autenticação indisponível." });
  }

  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Usuário não autenticado." });
  }

  const tables = ["essay_corrections", "simulado_history", "activity_logs", "profiles"];
  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).delete().eq(table === "profiles" ? "id" : "user_id", userId);
    if (error) {
      console.error(`delete-account: failed to delete from ${table}:`, error.message);
    }
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("delete-account: failed to delete auth user:", error.message);
    return res.status(500).json({ error: "Erro ao excluir conta." });
  }

  return res.json({ success: true });
});

app.get("/api/credentials-status", (req, res) => {
  res.json({
    openRouter: !!process.env.RENDER_PROCESS_URL,
    supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    supabaseAdmin: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    gemini: false
  });
});


if (!process.env.VERCEL) {
  async function startServer() {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }

  startServer().catch((err) => {
    console.error("Failed to start server:", err?.message || err);
    process.exit(1);
  });
}

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err?.message || err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

export default app;
