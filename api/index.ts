import express from "express";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import rateLimit from "express-rate-limit";
import { PROMPTS, ModelConfig } from "./prompts.js";
import { jsonrepair } from "jsonrepair";

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

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Tente novamente em 1 minuto." }
});

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
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pl30323980.effectivecpmnetwork.com https://pl30323978.effectivecpmnetwork.com https://www.highperformanceformat.com https://js.hcaptcha.com https://*.hcaptcha.com; style-src 'self' 'unsafe-inline'; frame-src https://*.hcaptcha.com https://*.effectivecpmnetwork.com https://www.highperformanceformat.com https://br.wps.com https://www.effectivecpmnetwork.com; connect-src 'self' https://*.supabase.co https://openrouter.ai https://enem.dev; img-src 'self' data: https://storage.googleapis.com;");
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
    "/supabase/keep-alive",
    "/enem-questions", "/questions", "/correct",
    "/openrouter-chat", "/generate-learning-exercises",
    "/lesson", "/lesson-v2", "/questoes-ai", "/stats", "/simulado-explanation"
  ];
  const checkPath = req.path.startsWith("/api/") ? req.path : `/api${req.path}`;
  if (publicRoutes.includes(req.path) || publicRoutes.includes(checkPath) || req.path.startsWith("/questions/status/")) return next();

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
  const trimmed = rawText.trim();

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

async function callAI(opts: { systemPrompt?: string; userPrompt: string; maxTokens?: number; temperature?: number; timeout?: number }): Promise<string> {
  const renderUrl = process.env.RENDER_PROCESS_URL;
  if (!renderUrl) throw new Error("RENDER_PROCESS_URL not set");
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), opts.timeout || 30000);
  try {
    const r = await fetch(`${renderUrl.replace(/\/+$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt: opts.systemPrompt,
        userPrompt: opts.userPrompt,
        maxTokens: opts.maxTokens || 4096,
        temperature: opts.temperature ?? 0.7,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(tid);
    if (!r.ok) throw new Error(`Render /api/chat returned ${r.status}`);
    const data = await r.json();
    if (data.error) throw new Error(data.error);
    return data.text || "";
  } catch (e: any) {
    clearTimeout(tid);
    throw e;
  }
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



app.post("/api/correct", async (req, res) => {
  const { title, text, imageBase64 } = req.body;

  if (!text && !imageBase64) {
    return res.status(400).json({ error: "É necessário digitar um texto ou enviar uma foto." });
  }

  const contentToEvaluate = text || "[O aluno enviou uma imagem contendo o manuscrito de redação para transcrição e correção direta.]";

  const prompt = `Corretor oficial ENEM 2025. Avalie justa e objetivamente.

Tema: "${title || "Sem título"}"

Redação:
"""
${contentToEvaluate}
"""

NOTAS POR COMPETÊNCIA (0, 40, 80, 120, 160 ou 200):
C1 - Domínio escrita formal: 200=excelente, 160=bom, 120=mediano, 80=insuficiente, 40=precário, 0=desconhecimento
C2 - Compreensão tema: 200=argumentação consistente+repertório produtivo, 160=bom, 120=previsível, 80=cópia/insuficiente, 40=tangencia, 0=fuga
C3 - Organização argumentos: 200=consistente+autoria, 160=organizada, 120=limitada, 80=desorganizada, 40=pouco relacionado, 0=sem relação
C4 - Coesão: 200=excelente, 160=bom, 120=mediano, 80=insuficiente, 40=precário, 0=sem articulação
C5 - Proposta intervenção: 200=detalhada+5 elementos (Agente,Ação,Meio,Efeito,Detalhe), 160=bom, 120=mediana, 80=insuficiente, 40=vaga, 0=ausente

TRAVAS: 200 requer texto impecável. Redação mediana=480-560. Impecável=900-1000. Boa=640-800. Ruim<400.

Retorne JSON: {score, generalFeedback, competencies:[{id,name,description,score,feedback}x5], strengths:[], weaknesses:[]}
Apenas JSON puro.`;

  try {
    const raw = await callAI({
      systemPrompt: 'Você é um corretor oficial do ENEM. Retorne APENAS o JSON de avaliação estrito sem rodeios nem introduções estruturado exatamente como solicitado.',
      userPrompt: prompt,
      maxTokens: 2048,
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
  const prompt = promptDef.buildPrompt(numQuestions, targetArea, referenceQuestions, hardSubjects) as string;

  const cura = crypto.randomUUID();

  const url = `${renderUrl.replace(/\/+$/, "")}/api/process`;
  console.log("[questions] Sending to:", url, "prompt length:", prompt.length);

  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 30000);
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cura, prompt }),
      signal: ctrl.signal,
    });
    clearTimeout(tid);
    console.log("[questions] Render responded:", r.status);
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      console.log("[questions] Render error body:", body.slice(0, 500));
      return res.status(502).json({ error: "Render service returned " + r.status, details: body.slice(0, 300) });
    }
    return res.json({ cura });
  } catch (err: any) {
    console.error("[questions] Failed to reach Render:", err?.name, err?.message);
    return res.status(502).json({ error: "Render service unavailable: " + (err?.message || "timeout") });
  }
});

app.get("/api/questions/status/:cura", async (req, res) => {
  const renderUrl = process.env.RENDER_PROCESS_URL;
  if (!renderUrl) {
    return res.status(503).json({ error: "Serviço indisponível." });
  }

  const url = `${renderUrl.replace(/\/+$/, "")}/api/status/${req.params.cura}`;
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 10000);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(tid);
    if (!r.ok) {
      console.log("[questions/status] Render returned:", r.status);
      return res.status(502).json({ error: "Render returned " + r.status });
    }
    const data = await r.json();
    return res.json(data);
  } catch (err: any) {
    console.error("[questions/status] Failed:", err?.name, err?.message);
    return res.status(502).json({ error: "Render unavailable: " + (err?.message || "timeout") });
  }
});

app.post("/api/openrouter-chat", async (req, res) => {
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
  } catch {
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
  } catch {}

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
    const { area, level, weakTopics, topicIndex } = req.body;
    if (!area) return res.status(400).json({ error: "area is required" });

  const topicNum = typeof topicIndex === 'number' ? topicIndex : Math.floor(Math.random() * 100);
  const promptDef = PROMPTS.lessonCycle;
  const built = promptDef.buildPrompt(area, level || 5, topicNum, weakTopics);
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
  } catch {}

  return res.status(503).json({ error: "IA não conseguiu gerar a aula. Tente novamente." });
  } catch (err) {
    console.error('[lesson-v2] fatal:', err);
    return res.status(503).json({ error: "Erro ao gerar aula. Tente novamente." });
  }
});

app.post("/api/questoes-ai", async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { area, count, weakTopics } = req.body;
    if (!area) return res.status(400).json({ error: "area is required" });

  const promptDef = PROMPTS.questoesComFeedback;
  const built = promptDef.buildPrompt(area, count || 5, weakTopics);
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
  } catch {}

  return res.status(503).json({ error: "IA não conseguiu gerar questões. Tente novamente." });
  } catch (err) {
    console.error('[questoes-ai] fatal:', err);
    return res.status(503).json({ error: "Erro ao gerar questões. Tente novamente." });
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

    async function explainOne(q: any): Promise<{ id: string; explanation: string } | null> {
      const optsText = (q.options || []).map((o: any) => `${o.letter}) ${o.text}`).join('\n');
      const prompt = `Explique de forma didática e detalhada por que a alternativa ${q.correctAnswer} está correta para esta questão do ENEM. Analise brevemente por que as outras alternativas estão incorretas. Seja claro e objetivo, como um professor explicando para um aluno.

Enunciado: ${q.statement}
Alternativas:
${optsText}
Resposta correta: ${q.correctAnswer}`;

      try {
        const text = await callAI({ userPrompt: prompt, maxTokens: 512, temperature: 0.3, timeout: 15000 });
        if (text) return { id: q.id, explanation: text.trim() };
      } catch {}
      return null;
    }

    const results = await Promise.all(limited.map(q => explainOne(q)));
    const explanations: Record<string, string> = {};
    for (const r of results) {
      if (r) explanations[r.id] = r.explanation;
    }

    return res.json({ explanations });
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
  } catch {
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

app.post("/api/supabase/setup", async (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseAdmin || !supabaseUrl || !serviceRoleKey) {
    return res.json({ success: false, message: "SUPABASE_SERVICE_ROLE_KEY não configurada no Vercel." });
  }

  const tables = ["profiles", "essay_corrections", "simulado_history", "activity_logs", "ApexEnem_progress"];
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

app.post("/api/send-confirmation", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Email e código são obrigatórios" });
  }

  let token: string;
  try {
    token = signToken(email, code);
  } catch (err: any) {
    console.warn("Failed to sign token:", err.message);
    return res.status(500).json({ error: "Erro ao gerar token de confirmação" });
  }

  const confirmLink = `${getBaseUrl()}/api/confirm-email?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}&token=${encodeURIComponent(token)}`;

  console.log(`[SIMULATED] Confirmation code for ${email}: ${code}`);
  res.json({ sent: true, simulated: true, token, confirmLink });
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

  const years = [2023, 2022];
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

app.get("/api/stats", async (_req, res) => {
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
        return res.json({ totalUsers, regionCounts, stateCounts, cityCounts, tablesExist });
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
          return res.json({ totalUsers, regionCounts, stateCounts, cityCounts, tablesExist });
        }
      }
    } catch {}
  }

  res.json({ totalUsers, regionCounts, tablesExist });
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
