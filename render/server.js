const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 3001;

const googleApiKey = process.env.GOOGLE_API_KEY;

const groqKeys = [
  process.env.GROQ_API_KEY_V1, process.env.GROQ_API_KEY_V2, process.env.GROQ_API_KEY_V3,
  process.env.GROQ_API_KEY_V4, process.env.GROQ_API_KEY_V5, process.env.GROQ_API_KEY_V6,
  process.env.GROQ_API_KEY_V7, process.env.GROQ_API_KEY_V8, process.env.GROQ_API_KEY_V9,
  process.env.GROQ_API_KEY_V10,
].filter(Boolean);

const openRouterKeys = [
  process.env.OPENROUTER_API_KEY_V1, process.env.OPENROUTER_API_KEY_V2, process.env.OPENROUTER_API_KEY_V3,
  process.env.OPENROUTER_API_KEY_V4, process.env.OPENROUTER_API_KEY_V5, process.env.OPENROUTER_API_KEY_V6,
  process.env.OPENROUTER_API_KEY_V7, process.env.OPENROUTER_API_KEY_V8, process.env.OPENROUTER_API_KEY_V9,
  process.env.OPENROUTER_API_KEY_V10,
].filter(Boolean);

let groqIdx = 0;
let orIdx = 0;
function nextGroqKey() {
  if (groqKeys.length === 0) return null;
  const k = groqKeys[groqIdx % groqKeys.length];
  groqIdx++;
  return k;
}
function nextOrKey() {
  if (openRouterKeys.length === 0) return null;
  const k = openRouterKeys[orIdx % openRouterKeys.length];
  orIdx++;
  return k;
}

const jobs = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [cura, job] of jobs) {
    if (job.status === "done" || job.status === "error") {
      if (job.completedAt && now - job.completedAt > 5 * 60 * 1000) {
        jobs.delete(cura);
      }
    }
  }
}, 30000);

function extractJson(raw) {
  let t = raw.trim();
  t = t.replace(/```(?:json)?\s*/gi, "").replace(/\s*```/gi, "").trim();

  try { return JSON.parse(t); } catch {}

  const repaired = t
    .replace(/,\s*([\]}])/g, "$1")
    .replace(/[\u201C\u201D\u2018\u2019]/g, '"');
  try { return JSON.parse(repaired); } catch {}

  for (const open of ["[", "{"]) {
    const close = open === "[" ? "]" : "}";
    const s = t.indexOf(open);
    const e = t.lastIndexOf(close);
    if (s !== -1 && e > s) {
      const chunk = t.substring(s, e + 1);
      try { return JSON.parse(chunk); } catch {}
      const r2 = chunk.replace(/,\s*([\]}])/g, "$1");
      try { return JSON.parse(r2); } catch {}
    }
  }

  return null;
}

async function callGroq(prompt, keyOverride) {
  const key = keyOverride || nextGroqKey();
  if (!key) throw new Error("no groq keys");
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Voce e um professor especialista em elaboracao de itens para o ENEM. Retorne APENAS o JSON valido. REGRA CRITICA: NUNCA coloque quebras de linha entre caracteres. O texto deve ser continuo e fluido como paragrafos normais. Nunca escreva letra por linha. Tabelas devem usar formato markdown. Use espacos normais entre palavras. NUNCA inclua referencias a provas do ENEM como Questao XX - ENEM XXXX. As questoes sao INEDITAS. NUNCA repita a letra da alternativa no campo text." },
          { role: "user", content: prompt },
        ],
        max_tokens: 8192,
        temperature: 0.85,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(tid);
    if (!r.ok) throw new Error(`groq ${r.status}`);
    const d = await r.json();
    const raw = d.choices?.[0]?.message?.content;
    if (!raw) throw new Error("empty response");
    return extractJson(raw);
  } catch (e) { clearTimeout(tid); throw e; }
}

async function callGemini(prompt) {
  if (!googleApiKey) throw new Error("GOOGLE_API_KEY not set");
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: "Voce e um professor especialista em elaboracao de itens para o ENEM. Retorne APENAS o JSON valido. REGRA CRITICA: NUNCA coloque quebras de linha entre caracteres. O texto deve ser continuo e fluido como paragrafos normais. Nunca escreva letra por linha." }] },
        generationConfig: { temperature: 0.9, maxOutputTokens: 8192 },
      }),
      signal: ctrl.signal,
    });
    clearTimeout(tid);
    if (!r.ok) throw new Error(`gemini ${r.status}`);
    const d = await r.json();
    const raw = d?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error("empty response");
    return extractJson(raw);
  } catch (e) { clearTimeout(tid); throw e; }
}

async function callOpenRouter(prompt) {
  const key = nextOrKey();
  if (!key) throw new Error("no openrouter keys");
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": "https://apexenem.app",
        "X-Title": "ApexAI",
      },
      body: JSON.stringify({
        model: "google/gemma-4-31b-it:free",
        messages: [
          { role: "system", content: "Voce e um professor especialista em elaboracao de itens para o ENEM. Retorne APENAS o JSON valido. REGRA CRITICA: NUNCA coloque quebras de linha entre caracteres. O texto deve ser continuo e fluido como paragrafos normais. Nunca escreva letra por linha. Tabelas devem usar formato markdown. Use espacos normais entre palavras. NUNCA inclua referencias a provas do ENEM como Questao XX - ENEM XXXX. As questoes sao INEDITAS. NUNCA repita a letra da alternativa no campo text." },
          { role: "user", content: prompt },
        ],
        max_tokens: 8192,
        temperature: 0.85,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(tid);
    if (!r.ok) throw new Error(`openrouter ${r.status}`);
    const d = await r.json();
    const raw = d.choices?.[0]?.message?.content;
    if (!raw) throw new Error("empty response");
    return extractJson(raw);
  } catch (e) { clearTimeout(tid); throw e; }
}

function cleanText(s) {
  if (typeof s !== "string") return s;
  let t = s.replace(/\r\n?/g, "\n");
  t = t.replace(/\\n/g, "\n");
  t = t.replace(/\\t/g, " ");
  t = t.replace(/∣/g, "|").replace(/∶/g, ":").replace(/∼/g, "~");
  let prev;
  do {
    prev = t;
    t = t.replace(/([^\s\n|])\n([^\s\n|])/g, "$1$2");
  } while (t !== prev);
  t = t.replace(/([^\n|])\n(?!\n)(?![|])/g, "$1 ");
  t = t.replace(/ {2,}/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

function validateQuestions(qs) {
  if (!Array.isArray(qs)) return false;
  return qs.length > 0 && qs.every(q =>
    q && typeof q.statement === "string" && q.statement.length > 30 &&
    Array.isArray(q.options) && q.options.length >= 2 &&
    q.options.every(o => typeof o === "object" && o !== null && typeof o.text === "string" && o.text.length > 0 && typeof o.letter === "string") &&
    typeof q.correctAnswer === "string" && /^[A-E]$/.test(q.correctAnswer) &&
    typeof q.explanation === "string" && q.explanation.length > 20
  );
}

function fixEncoding(s) {
  if (typeof s !== "string") return s;
  try {
    const latin1Bytes = new Uint8Array([...s].map(c => c.charCodeAt(0) & 0xFF));
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(latin1Bytes);
    if (!decoded.includes("\uFFFD") && decoded.length < s.length && decoded.length > 0) {
      return decoded;
    }
  } catch {}
  return s;
}

function normalizeOption(opt, idx) {
  if (!opt || typeof opt !== "object") return { letter: String.fromCharCode(65 + idx), text: String(opt) };
  if (typeof opt.letter === "string" && typeof opt.text === "string" && opt.text.length > 0) {
    let text = fixEncoding(opt.text);
    text = text.replace(/^["'\u201C\u201D]*[A-Ea-e]\)?["'\u201C\u201D]*\s*/g, "").trim();
    if (!text) text = fixEncoding(opt.text);
    return { letter: opt.letter.toUpperCase(), text };
  }
  if (opt.text === undefined || opt.text === null) {
    const chars = [];
    for (let i = 0; i <= 9; i++) {
      if (opt[i] !== undefined && opt[i] !== null) chars.push(String(opt[i]));
    }
    if (chars.length > 0) {
      let text = fixEncoding(chars.join(""));
      text = text.replace(/^["'\u201C\u201D]*[A-Ea-e]\)?["'\u201C\u201D]*\s*/g, "").trim();
      if (!text) text = fixEncoding(chars.join(""));
      return { letter: String.fromCharCode(65 + idx), text };
    }
  }
  if (typeof opt === "string") {
    let text = fixEncoding(opt);
    text = text.replace(/^["'\u201C\u201D]*[A-Ea-e]\)?["'\u201C\u201D]*\s*/g, "").trim();
    if (!text) text = fixEncoding(opt);
    return { letter: String.fromCharCode(65 + idx), text };
  }
  return { letter: String.fromCharCode(65 + idx), text: fixEncoding(JSON.stringify(opt)) };
}

function normalizeQuestions(qs) {
  const letters = "ABCDE";
  return qs.map((q, qi) => ({
    ...q,
    statement: fixEncoding(cleanText(q.statement)),
    explanation: fixEncoding(cleanText(q.explanation)),
    correctAnswer: (q.correctAnswer || "A").toUpperCase().charAt(0),
    options: (q.options || []).slice(0, 5).map((o, oi) => normalizeOption(o, oi)),
  })).filter(q => q.options.length >= 2);
}

async function processJob(cura, prompt, attempt = 1) {
  const job = jobs.get(cura);
  if (!job) return;
  job.attempts = attempt;

  const orModels = ["nvidia/nemotron-3-nano-30b-a3b:free", "openai/gpt-oss-20b:free", "nvidia/nemotron-nano-9b-v2:free", "google/gemma-4-31b-it:free"];
  const sysMsg = "Voce e um professor especialista em elaboracao de itens para o ENEM. Retorne APENAS o JSON valido. REGRA CRITICA: NUNCA coloque quebras de linha entre caracteres. O texto deve ser continuo e fluido como paragrafos normais. Nunca escreva letra por linha. Tabelas devem usar formato markdown com | e ---. Use espacos normais entre palavras. NUNCA inclua referencias a provas do ENEM como Questao XX - ENEM XXXX. As questoes sao INEDITAS. NUNCA repita a letra da alternativa no campo text. Seus textos serao lidos por estudantes, entao devem estar perfeitamente formatados.";

  async function callOrWithKey(key, model) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "HTTP-Referer": "https://apexenem.app", "X-Title": "ApexAI" },
        body: JSON.stringify({ model, messages: [{ role: "system", content: sysMsg }, { role: "user", content: prompt }], max_tokens: 8192, temperature: 0.85 }),
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      if (!r.ok) throw new Error(`openrouter ${r.status}`);
      const d = await r.json();
      const raw = d.choices?.[0]?.message?.content;
      if (!raw) throw new Error("empty");
      return extractJson(raw);
    } catch (e) { clearTimeout(tid); throw e; }
  }

  async function tryOne(name, fn) {
    try {
      const result = await fn();
      if (Array.isArray(result)) {
        const normalized = normalizeQuestions(result);
        if (validateQuestions(normalized)) return normalized;
      }
    } catch {}
    return null;
  }

  console.log(`[${cura}] Attempt ${attempt}: trying parallel batch`);

  const batch1 = [];
  if (groqKeys.length > 0) batch1.push({ name: `groq-${groqKeys[0].slice(-4)}`, fn: () => callGroq(prompt, groqKeys[0]) });
  if (groqKeys.length > 1) batch1.push({ name: `groq-${groqKeys[1].slice(-4)}`, fn: () => callGroq(prompt, groqKeys[1]) });
  if (googleApiKey) batch1.push({ name: "gemini", fn: () => callGemini(prompt) });
  if (openRouterKeys.length > 0) batch1.push({ name: `or-${orModels[0].slice(0,15)}-${openRouterKeys[0].slice(-4)}`, fn: () => callOrWithKey(openRouterKeys[0], orModels[0]) });

  const results = await Promise.allSettled(batch1.map(a => tryOne(a.name, a.fn)));
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === "fulfilled" && results[i].value) {
      job.status = "done";
      job.result = results[i].value;
      job.completedAt = Date.now();
      console.log(`[${cura}] OK via ${batch1[i].name} (parallel)`);
      return;
    }
  }

  console.log(`[${cura}] Parallel batch failed, trying sequential fallback`);

  const seqAttempts = [];
  for (const k of groqKeys.slice(2)) {
    seqAttempts.push({ name: `groq-${k.slice(-4)}`, fn: () => callGroq(prompt, k) });
  }
  for (const k of openRouterKeys.slice(1)) {
    for (const m of orModels) {
      seqAttempts.push({ name: `or-${m.slice(0,10)}-${k.slice(-4)}`, fn: () => callOrWithKey(k, m) });
    }
  }

  for (const a of seqAttempts.slice(0, 5)) {
    try {
      const result = await a.fn();
      const normalized = Array.isArray(result) ? normalizeQuestions(result) : null;
      if (normalized && validateQuestions(normalized)) {
        job.status = "done";
        job.result = normalized;
        job.completedAt = Date.now();
        console.log(`[${cura}] OK via ${a.name} (sequential)`);
        return;
      }
    } catch (err) {
      if (err.message.includes("429")) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }

  if (attempt < 3) {
    const delay = attempt === 1 ? 30000 : 60000;
    console.log(`[${cura}] All combos failed. Retry in ${delay/1000}s...`);
    await new Promise(r => setTimeout(r, delay));
    return processJob(cura, prompt, attempt + 1);
  }

  job.status = "error";
  job.error = "Todos os modelos falharam apos 3 tentativas";
  job.completedAt = Date.now();
  console.log(`[${cura}] FAILED after ${attempt} attempts`);
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, keys: { groq: groqKeys.length, gemini: !!googleApiKey, openrouter: openRouterKeys.length } });
});

app.post("/api/chat", async (req, res) => {
  const { systemPrompt, userPrompt, maxTokens, temperature } = req.body;
  if (!userPrompt) return res.status(400).json({ error: "userPrompt required" });

  const sys = systemPrompt || "Voce e um professor especialista no ENEM. NUNCA coloque quebras de linha entre caracteres. Texto deve ser continuo e fluido.";
  const mt = maxTokens || 4096;
  const temp = temperature || 0.7;

  async function chatGroq(key, model) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: "system", content: sys }, { role: "user", content: userPrompt }], max_tokens: mt, temperature: temp }),
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      if (!r.ok) throw new Error(`groq ${r.status}`);
      const d = await r.json();
      return d.choices?.[0]?.message?.content || null;
    } catch (e) { clearTimeout(tid); throw e; }
  }

  async function chatOr(key, model) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "HTTP-Referer": "https://apexenem.app", "X-Title": "ApexAI" },
        body: JSON.stringify({ model, messages: [{ role: "system", content: sys }, { role: "user", content: userPrompt }], max_tokens: mt, temperature: temp }),
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      if (!r.ok) throw new Error(`openrouter ${r.status}`);
      const d = await r.json();
      return d.choices?.[0]?.message?.content || null;
    } catch (e) { clearTimeout(tid); throw e; }
  }

  async function chatGemini() {
    if (!googleApiKey) throw new Error("no gemini key");
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: userPrompt }] }], systemInstruction: { parts: [{ text: sys }] }, generationConfig: { temperature: temp, maxOutputTokens: mt } }),
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      if (!r.ok) throw new Error(`gemini ${r.status}`);
      const d = await r.json();
      return d?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (e) { clearTimeout(tid); throw e; }
  }

  const orModels = ["nvidia/nemotron-3-nano-30b-a3b:free", "openai/gpt-oss-20b:free", "nvidia/nemotron-nano-9b-v2:free", "google/gemma-4-31b-it:free"];

  async function tryChat(name, fn) {
    try {
      const text = await fn();
      if (text) return { name, text };
    } catch {}
    return null;
  }

  const batch = [];
  if (groqKeys.length > 0) batch.push(tryChat(`groq-${groqKeys[0].slice(-4)}`, () => chatGroq(groqKeys[0], "llama-3.3-70b-versatile")));
  if (googleApiKey) batch.push(tryChat("gemini", chatGemini));
  if (openRouterKeys.length > 0) batch.push(tryChat(`or-${orModels[0].slice(0,15)}-${openRouterKeys[0].slice(-4)}`, () => chatOr(openRouterKeys[0], orModels[0])));

  const batchResults = await Promise.allSettled(batch);
  for (const r of batchResults) {
    if (r.status === "fulfilled" && r.value) {
      console.log(`[chat] OK via ${r.value.name} (parallel)`);
      return res.json({ text: cleanText(r.value.text), model: r.value.name });
    }
  }

  const seqAttempts = [];
  for (const k of groqKeys.slice(1)) {
    seqAttempts.push({ name: `groq-${k.slice(-4)}`, fn: () => chatGroq(k, "llama-3.3-70b-versatile") });
  }
  for (const k of openRouterKeys.slice(1)) {
    for (const m of orModels) {
      seqAttempts.push({ name: `or-${m.slice(0,10)}-${k.slice(-4)}`, fn: () => chatOr(k, m) });
    }
  }

  for (const a of seqAttempts.slice(0, 5)) {
    try {
      const text = await a.fn();
      if (text) {
        console.log(`[chat] OK via ${a.name}`);
        return res.json({ text: cleanText(text), model: a.name });
      }
    } catch (err) {
      if (err.message.includes("429")) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }

  console.error(`[chat] ALL attempts failed`);
  return res.status(503).json({ error: "all models failed" });
});

app.post("/api/process", (req, res) => {
  const { cura, prompt } = req.body;
  if (!cura || !prompt) {
    return res.status(400).json({ error: "cura and prompt required" });
  }

  jobs.set(cura, {
    cura,
    status: "processing",
    prompt,
    result: null,
    error: null,
    attempts: 0,
    createdAt: Date.now(),
    completedAt: null,
  });

  processJob(cura, prompt);

  res.json({ ok: true, cura });
});

app.get("/api/status/:cura", (req, res) => {
  const job = jobs.get(req.params.cura);
  if (!job) {
    return res.status(404).json({ error: "CURA not found or expired" });
  }
  res.json({
    cura: job.cura,
    status: job.status,
    result: job.result,
    error: job.error,
    attempts: job.attempts,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    expiresAt: job.completedAt ? job.completedAt + 5 * 60 * 1000 : null,
  });
});

app.get("/api/all", (req, res) => {
  const all = [];
  for (const [cura, job] of jobs) {
    all.push({
      cura,
      status: job.status,
      attempts: job.attempts,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      expiresAt: job.completedAt ? job.completedAt + 5 * 60 * 1000 : null,
      error: job.error,
      hasResult: !!job.result,
      questionCount: Array.isArray(job.result) ? job.result.length : 0,
    });
  }
  all.sort((a, b) => b.createdAt - a.createdAt);
  res.json(all);
});

app.get("/", (req, res) => {
  res.send(dashboardHtml);
});

const dashboardHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ApexAI Dashboard</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;color:#e2e8f0;min-height:100vh}
.header{background:linear-gradient(135deg,#1e293b,#0f172a);border-bottom:1px solid #334155;padding:20px 32px;display:flex;align-items:center;gap:16px}
.header h1{font-size:24px;font-weight:800;background:linear-gradient(135deg,#3b82f6,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.header .badge{background:#1e40af;color:#93c5fd;padding:4px 12px;border-radius:9999px;font-size:11px;font-weight:700}
.stats{display:flex;gap:16px;padding:20px 32px;flex-wrap:wrap}
.stat{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px 24px;min-width:140px}
.stat .label{font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:1px}
.stat .value{font-size:28px;font-weight:800;margin-top:4px}
.stat .value.processing{color:#f59e0b}
.stat .value.done{color:#22c55e}
.stat .value.error{color:#ef4444}
.table-wrap{padding:0 32px 32px;overflow-x:auto}
table{width:100%;border-collapse:collapse;background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155}
th{background:#0f172a;padding:12px 16px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:1px;border-bottom:1px solid #334155}
td{padding:12px 16px;border-bottom:1px solid #1e293b;font-size:13px;vertical-align:top}
tr:hover{background:#1a2744}
.badge{display:inline-block;padding:3px 10px;border-radius:9999px;font-size:11px;font-weight:700;text-transform:uppercase}
.badge.processing{background:#92400e;color:#fcd34d}
.badge.done{background:#14532d;color:#86efac}
.badge.error{background:#7f1d1d;color:#fca5a5}
.cura-id{font-family:monospace;font-size:12px;color:#94a3b8}
.time{font-size:12px;color:#64748b;font-family:monospace}
.result-btn{background:#1e40af;color:#93c5fd;border:none;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:700}
.result-btn:hover{background:#1d4ed8}
.result-json{background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px;font-family:monospace;font-size:11px;white-space:pre-wrap;max-height:400px;overflow:auto;margin-top:8px;color:#94a3b8;display:none}
.empty{text-align:center;padding:48px;color:#475569;font-size:14px}
.countdown{color:#f59e0b;font-size:11px}
</style>
</head>
<body>
<div class="header">
<h1>ApexAI</h1>
<span class="badge">DASHBOARD</span>
</div>
<div class="stats" id="stats"></div>
<div class="table-wrap">
<table>
<thead>
<tr>
<th>CURA</th>
<th>Status</th>
<th>Tentativas</th>
<th>Criado</th>
<th>Completado</th>
<th>Deleta em</th>
<th>Questoes</th>
<th>Detalhes</th>
</tr>
</thead>
<tbody id="tbody"></tbody>
</table>
<div class="empty" id="empty">Nenhuma requisicao ativa</div>
</div>
<script>
function fmt(ts){if(!ts)return '-';const d=new Date(ts);return d.toLocaleTimeString('pt-BR')}
function countdown(ms){if(!ms)return'-';const r=ms-Date.now();if(r<=0)return'Expirado';const m=Math.floor(r/60000);const s=Math.floor((r%60000)/1000);return m+'m '+s+'s'}
function trunc(c){return c.substring(0,8)+'...'}
let lastData=[];
async function refresh(){
try{
const r=await fetch('/api/all');const data=await r.json();lastData=data;
const processing=data.filter(j=>j.status==='processing').length;
const done=data.filter(j=>j.status==='done').length;
const error=data.filter(j=>j.status==='error').length;
document.getElementById('stats').innerHTML=
'<div class="stat"><div class="label">Total</div><div class="value">'+data.length+'</div></div>'+
'<div class="stat"><div class="label">Processando</div><div class="value processing">'+processing+'</div></div>'+
'<div class="stat"><div class="label">Concluido</div><div class="value done">'+done+'</div></div>'+
'<div class="stat"><div class="label">Erros</div><div class="value error">'+error+'</div></div>';
const tbody=document.getElementById('tbody');
const empty=document.getElementById('empty');
if(data.length===0){tbody.innerHTML='';empty.style.display='block';return}
empty.style.display='none';
tbody.innerHTML=data.map((j,i)=>{
const expMs=j.expiresAt||0;
return '<tr>'+
'<td><span class="cura-id">'+trunc(j.cura)+'</span></td>'+
'<td><span class="badge '+j.status+'">'+j.status+'</span></td>'+
'<td>'+j.attempts+'/3</td>'+
'<td class="time">'+fmt(j.createdAt)+'</td>'+
'<td class="time">'+fmt(j.completedAt)+'</td>'+
'<td class="countdown">'+countdown(expMs)+'</td>'+
'<td>'+(j.questionCount||0)+'</td>'+
'<td>'+(j.error?'<span style="color:#fca5a5;font-size:11px">'+j.error+'</span>':
(j.hasResult?'<button class="result-btn" onclick="toggle('+i+')">Ver JSON</button>':'-'))+
'<div class="result-json" id="json-'+i+'">'+(j.hasResult?JSON.stringify(lastData[i],null,2):'')+'</div></td>'+
'</tr>';
}).join('');
}catch(e){console.error(e)}
}
function toggle(i){const el=document.getElementById('json-'+i);el.style.display=el.style.display==='block'?'none':'block'}
refresh();setInterval(refresh,5000);
setInterval(()=>{
document.querySelectorAll('.countdown').forEach(el=>{
const idx=[...document.querySelectorAll('tr')].indexOf(el.closest('tr'));
});
},1000);
</script>
</body>
</html>`;

app.listen(PORT, () => {
  console.log("ApexAI running on port " + PORT);
  console.log("Keys: Groq=" + groqKeys.length + " Gemini=" + (googleApiKey?"yes":"no") + " OR=" + openRouterKeys.length);
});
