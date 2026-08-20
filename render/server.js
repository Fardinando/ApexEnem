require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 3001;

// ─── Ollama Config ──────────────────────────────────────────────────────────
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL_MAIN = process.env.OLLAMA_MODEL_MAIN || "qwen2.5:3b";
const OLLAMA_MODEL_FAST = process.env.OLLAMA_MODEL_FAST || "qwen2.5:0.5b";

// ─── Job Queue ───────────────────────────────────────────────────────────────
const jobs = new Map();
const MAX_JOBS = 250;
const MAX_ACTIVE = 6;
const JOB_TIMEOUT_MS = 240000;       // 4 min per job
const STALE_PROCESSING_MS = 420000;   // 7 min => mark stale
let activeJobs = 0;

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason && reason.stack ? reason.stack : reason);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err && err.stack ? err.stack : err);
});

setInterval(() => {
  const now = Date.now();
  for (const [cura, job] of jobs) {
    if (job.status === "done" || job.status === "error") {
      if (job.completedAt && now - job.completedAt > 5 * 60 * 1000) {
        jobs.delete(cura);
      }
    } else if (job.status === "processing") {
      if (job.startedAt && now - job.startedAt > STALE_PROCESSING_MS) {
        job.status = "error";
        job.error = "Tempo de processamento excedido";
        job.completedAt = now;
        console.log(`[${cura}] marked stale processing job as error`);
      }
    }
  }
}, 30000);

// ─── JSON / Text Helpers ─────────────────────────────────────────────────────
function extractJson(raw) {
  let t = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
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

function stripCodeFences(s) {
  if (typeof s !== "string") return s;
  let t = s.trim();
  t = t.replace(/^```(?:json|JSON)?\s*\n?/m, "");
  t = t.replace(/\n?```\s*$/m, "");
  return t.trim();
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
  return qs.map((q, qi) => ({
    ...q,
    statement: fixEncoding(cleanText(q.statement)),
    explanation: fixEncoding(cleanText(q.explanation)),
    correctAnswer: (q.correctAnswer || "A").toUpperCase().charAt(0),
    options: (q.options || []).slice(0, 5).map((o, oi) => normalizeOption(o, oi)),
  })).filter(q => q.options.length >= 2);
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

// ─── Ollama Caller ──────────────────────────────────────────────────────────
async function callOllama(model, sysMsg, userPrompt, maxTokens, temperature, timeoutMs) {
  const timer = new Promise((_, reject) => setTimeout(() => reject(new Error("ollama timeout")), timeoutMs || 180000));
  const fetchPromise = (async () => {
    const r = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: sysMsg },
          { role: "user", content: userPrompt },
        ],
        stream: false,
        options: {
          num_predict: maxTokens || 4096,
          temperature: temperature || 0.7,
        },
      }),
    });
    if (!r.ok) throw new Error(`ollama ${r.status}`);
    const d = await r.json();
    const raw = d.message?.content;
    if (!raw) throw new Error("empty response from ollama");
    return raw;
  })();
  return Promise.race([fetchPromise, timer]);
}

// ─── Job Processor ───────────────────────────────────────────────────────────
async function processJob(cura, opts, attempt = 1) {
  const job = jobs.get(cura);
  if (!job) return;
  job.attempts = attempt;
  job.startedAt = job.startedAt || Date.now();
  const deadline = job.startedAt + JOB_TIMEOUT_MS;

  const { prompt, type, systemPrompt, maxTokens, temperature } = opts;
  const isQuestions = type === "questions";
  const mt = maxTokens || 4096;
  const temp = temperature || 0.7;

  const defaultSysMsg = isQuestions
    ? "Voce e um professor especialista em elaboracao de itens para o ENEM. Retorne APENAS o JSON valido. REGRA CRITICA: NUNCA coloque quebras de linha entre caracteres. O texto deve ser continuo e fluido como paragrafos normais. Nunca escreva letra por linha. Tabelas devem usar formato markdown com | e ---. Use espacos normais entre palavras. NUNCA inclua referencias a provas do ENEM como Questao XX - ENEM XXXX. As questoes sao INEDITAS. NUNCA repita a letra da alternativa no campo text. Seus textos serao lidos por estudantes, entao devem estar perfeitamente formatados."
    : "Voce e um professor brasileiro especialista. Responda em portugues do Brasil. NAO inclua explicacoes extras apos o JSON.";
  const sysMsg = systemPrompt || defaultSysMsg;

  // ── Try main model first (qwen2.5:3b), then fallback to fast model (qwen2.5:0.5b) ──
  const attempts = [
    { name: OLLAMA_MODEL_MAIN, fn: () => callOllama(OLLAMA_MODEL_MAIN, sysMsg, prompt, mt, temp, 180000) },
    { name: OLLAMA_MODEL_FAST, fn: () => callOllama(OLLAMA_MODEL_FAST, sysMsg, prompt, Math.min(mt, 2048), temp, 90000) },
  ];

  async function tryOneOrThrow(name, fn) {
    const raw = await fn();
    if (!raw || (typeof raw === "string" && raw.length === 0)) throw new Error(`${name} returned empty`);
    if (isQuestions) {
      const parsed = extractJson(raw);
      if (!Array.isArray(parsed)) throw new Error(`${name} returned non-array`);
      const normalized = normalizeQuestions(parsed);
      if (!validateQuestions(normalized)) throw new Error(`${name} failed validation`);
      return { name, value: normalized };
    }
    const text = stripCodeFences(typeof raw === "string" ? raw : JSON.stringify(raw));
    if (!text) throw new Error(`${name} returned empty text`);
    return { name, value: text };
  }

  for (const a of attempts) {
    if (Date.now() > deadline) break;
    try {
      console.log(`[${cura}] Attempt ${attempt}: trying ${a.name}`);
      const result = await tryOneOrThrow(a.name, a.fn);
      job.status = "done";
      job.result = result.value;
      job.completedAt = Date.now();
      console.log(`[${cura}] OK via ${a.name}`);
      return;
    } catch (err) {
      console.log(`[${cura}] ${a.name} failed: ${err.message?.slice(0, 60)}`);
      if (Date.now() > deadline) break;
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // ── Retry once ──
  if (attempt < 2 && Date.now() < deadline) {
    const delay = Math.min(15000, deadline - Date.now());
    console.log(`[${cura}] All models failed. Retry in ${delay / 1000}s...`);
    await new Promise(r => setTimeout(r, delay));
    return processJob(cura, opts, attempt + 1);
  }

  job.status = "error";
  job.error = "Todos os modelos Ollama falharam apos tentativas";
  job.completedAt = Date.now();
  console.log(`[${cura}] FAILED after ${attempt} attempts`);
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health check
app.get("/api/health", (req, res) => {
  const counts = { processing: 0, done: 0, error: 0 };
  for (const job of jobs.values()) {
    if (counts[job.status] !== undefined) counts[job.status]++;
  }
  res.json({
    ok: true,
    ollama: { url: OLLAMA_URL, modelMain: OLLAMA_MODEL_MAIN, modelFast: OLLAMA_MODEL_FAST },
    jobs: counts,
    activeJobs,
  });
});

// Submit a job (async)
app.post("/api/process", (req, res) => {
  const { cura, prompt, type, systemPrompt, maxTokens, temperature } = req.body;
  if (!cura || !prompt) {
    return res.status(400).json({ error: "cura and prompt required" });
  }

  if (jobs.size >= MAX_JOBS) {
    return res.status(429).json({ error: "limite de jobs atingido. Tente novamente em instantes." });
  }
  if (activeJobs >= MAX_ACTIVE) {
    return res.status(429).json({ error: "servidor de IA ocupado. Tente novamente em instantes." });
  }

  const jobType = type || "general";

  jobs.set(cura, {
    cura,
    status: "processing",
    prompt,
    type: jobType,
    systemPrompt: systemPrompt || null,
    maxTokens: maxTokens || 8192,
    temperature: temperature || 0.85,
    result: null,
    error: null,
    attempts: 0,
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
  });

  activeJobs++;
  processJob(cura, { prompt, type: jobType, systemPrompt, maxTokens, temperature }, 1)
    .catch((err) => {
      console.error(`[${cura}] processJob error:`, err?.message);
      const j = jobs.get(cura);
      if (j) {
        j.status = "error";
        j.error = err?.message || "erro interno";
        j.completedAt = Date.now();
      }
    })
    .finally(() => {
      activeJobs = Math.max(0, activeJobs - 1);
    });

  res.json({ ok: true, cura });
});

// Poll job status
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

// All jobs (for dashboard)
app.get("/api/all", (req, res) => {
  const all = [];
  for (const [cura, job] of jobs) {
    all.push({
      cura,
      status: job.status,
      type: job.type,
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

// Dashboard
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
.type-badge{background:#1e3a5f;color:#93c5fd;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600}
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
<span class="badge">DASHBOARD v2</span>
</div>
<div class="stats" id="stats"></div>
<div class="table-wrap">
<table>
<thead>
<tr>
<th>CURA</th>
<th>Status</th>
<th>Tipo</th>
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
'<td><span class="type-badge">'+(j.type||'-')+'</span></td>'+
'<td>'+j.attempts+'</td>'+
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
</script>
</body>
</html>`;

app.listen(PORT, () => {
  console.log("ApexAI v2 running on port " + PORT);
  console.log("Ollama: " + OLLAMA_URL + " | Main=" + OLLAMA_MODEL_MAIN + " Fast=" + OLLAMA_MODEL_FAST);
});
