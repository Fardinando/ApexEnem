const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 3001;

const googleApiKey = process.env.GOOGLE_API_KEY;

const groqKeys = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_V1, process.env.GROQ_API_KEY_V2, process.env.GROQ_API_KEY_V3,
  process.env.GROQ_API_KEY_V4, process.env.GROQ_API_KEY_V5, process.env.GROQ_API_KEY_V6,
  process.env.GROQ_API_KEY_V7, process.env.GROQ_API_KEY_V8, process.env.GROQ_API_KEY_V9,
  process.env.GROQ_API_KEY_V10,
].filter(Boolean);

const openRouterKeys = [
  process.env.OPENROUTER_API_KEY,
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
  const tid = setTimeout(() => ctrl.abort(), 60000);
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Voce e um professor especialista em elaboracao de itens para o ENEM. Retorne APENAS o JSON valido." },
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
  const tid = setTimeout(() => ctrl.abort(), 60000);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: "Voce e um professor especialista em elaboracao de itens para o ENEM. Retorne APENAS o JSON valido." }] },
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
  const tid = setTimeout(() => ctrl.abort(), 60000);
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
          { role: "system", content: "Voce e um professor especialista em elaboracao de itens para o ENEM. Retorne APENAS o JSON valido." },
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

function validateQuestions(qs) {
  if (!Array.isArray(qs)) return false;
  return qs.length > 0 && qs.every(q =>
    q && typeof q.statement === "string" && q.statement.length > 30 &&
    Array.isArray(q.options) && q.options.length >= 2 &&
    typeof q.correctAnswer === "string" && q.correctAnswer.length === 1 &&
    typeof q.explanation === "string" && q.explanation.length > 20
  );
}

function cleanText(s) {
  if (typeof s !== "string") return s;
  return s.replace(/(?<!\n)\n(?!\n)/g, "").replace(/\r/g, "");
}

function normalizeQuestions(qs) {
  return qs.map(q => ({
    ...q,
    statement: cleanText(q.statement),
    explanation: cleanText(q.explanation),
    options: q.options.map(o => ({ ...o, text: cleanText(o.text) })),
  }));
}

async function processJob(cura, prompt, attempt = 1) {
  const job = jobs.get(cura);
  if (!job) return;
  job.attempts = attempt;

  const orModels = ["openrouter/free", "google/gemma-4-31b-it:free", "nvidia/nemotron-3-super-120b-a12b:free", "google/gemma-4-26b-a4b-it:free", "nvidia/nemotron-3-nano-30b-a3b:free"];
  const sysMsg = "Voce e um professor especialista em elaboracao de itens para o ENEM. Retorne APENAS o JSON valido.";

  async function callOrWithKey(key, model) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 60000);
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

  // Build flat list: try every key+model combo one at a time
  const attempts = [];
  for (const k of groqKeys) {
    attempts.push({ name: `groq-${k.slice(-4)}`, fn: () => callGroq(prompt, k) });
  }
  for (const k of openRouterKeys) {
    for (const m of orModels) {
      attempts.push({ name: `or-${m.slice(0,10)}-${k.slice(-4)}`, fn: () => callOrWithKey(k, m) });
    }
  }
  if (googleApiKey) {
    attempts.push({ name: "gemini", fn: () => callGemini(prompt) });
  }

  console.log(`[${cura}] Starting ${attempts.length} key/model combos (attempt ${attempt})`);

  for (const a of attempts) {
    try {
      const result = await a.fn();
      if (validateQuestions(result)) {
        job.status = "done";
        job.result = normalizeQuestions(result);
        job.completedAt = Date.now();
        console.log(`[${cura}] OK via ${a.name}`);
        return;
      }
    } catch (err) {
      if (err.message.includes("429")) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }

  if (attempt < 3) {
    const delay = attempt === 1 ? 60000 : 120000;
    console.log(`[${cura}] All ${attempts.length} combos failed. Retry in ${delay/1000}s...`);
    await new Promise(r => setTimeout(r, delay));
    return processJob(cura, prompt, attempt + 1);
  }

  job.status = "error";
  job.error = "Todos os modelos falharam apos 3 tentativas";
  job.completedAt = Date.now();
  console.log(`[${cura}] FAILED after ${attempts.length * 3} total attempts`);
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, keys: { groq: groqKeys.length, gemini: !!googleApiKey, openrouter: openRouterKeys.length } });
});

app.post("/api/chat", async (req, res) => {
  const { systemPrompt, userPrompt, maxTokens, temperature } = req.body;
  if (!userPrompt) return res.status(400).json({ error: "userPrompt required" });

  const sys = systemPrompt || "Voce e um professor especialista no ENEM.";
  const mt = maxTokens || 4096;
  const temp = temperature || 0.7;

  async function chatGroq(key, model) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 60000);
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
    const tid = setTimeout(() => ctrl.abort(), 60000);
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
    const tid = setTimeout(() => ctrl.abort(), 60000);
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

  const orModels = ["openrouter/free", "google/gemma-4-31b-it:free", "nvidia/nemotron-3-super-120b-a12b:free", "google/gemma-4-26b-a4b-it:free", "nvidia/nemotron-3-nano-30b-a3b:free"];

  const attempts = [];
  for (const k of groqKeys) {
    attempts.push({ name: `groq-${k.slice(-4)}`, fn: () => chatGroq(k, "llama-3.3-70b-versatile") });
  }
  for (const k of openRouterKeys) {
    for (const m of orModels) {
      attempts.push({ name: `or-${m.slice(0,10)}-${k.slice(-4)}`, fn: () => chatOr(k, m) });
    }
  }
  if (googleApiKey) attempts.push({ name: "gemini", fn: chatGemini });

  for (const a of attempts) {
    try {
      const text = await a.fn();
      if (text) {
        console.log(`[chat] OK via ${a.name}`);
        return res.json({ text, model: a.name });
      }
    } catch (err) {
      if (!err.message.includes("429")) {
        console.error(`[chat] ${a.name} failed: ${err.message}`);
      }
      if (err.message.includes("429")) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }

  console.error(`[chat] ALL ${attempts.length} attempts failed`);
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
