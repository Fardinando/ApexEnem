import express from "express";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import rateLimit from "express-rate-limit";
import { PROMPTS } from "./prompts.js";
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
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.hcaptcha.com https://*.hcaptcha.com; style-src 'self' 'unsafe-inline'; frame-src https://*.hcaptcha.com; connect-src 'self' https://*.supabase.co https://openrouter.ai https://enem.dev; img-src 'self' data: https://storage.googleapis.com;");
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
    "/lesson", "/lesson-v2", "/questoes-ai", "/stats"
  ];
  const checkPath = req.path.startsWith("/api/") ? req.path : `/api${req.path}`;
  if (publicRoutes.includes(req.path) || publicRoutes.includes(checkPath)) return next();

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

const openRouterKeys = [
  process.env.OPENROUTER_API_KEY,
  process.env.OPENROUTER_API_KEY_V1,
  process.env.OPENROUTER_API_KEY_V2,
  process.env.OPENROUTER_API_KEY_V3,
  process.env.OPENROUTER_API_KEY_V4,
  process.env.OPENROUTER_API_KEY_V5,
].filter(Boolean) as string[];

let currentOpenRouterKeyIndex = 0;

function getNextOpenRouterKey(): string {
  if (openRouterKeys.length === 0) return "";
  const key = openRouterKeys[currentOpenRouterKeyIndex % openRouterKeys.length];
  currentOpenRouterKeyIndex++;
  return key;
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



async function fetchCorrectionFromModel(modelName: string, prompt: string) {
  for (let attempt = 0; attempt < openRouterKeys.length * 2; attempt++) {
    const key = getNextOpenRouterKey();
    if (!key) continue;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`Timeout (9s) for model ${modelName}, aborting...`);
      controller.abort();
    }, 9000);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
          "HTTP-Referer": "https://apexenem.app",
          "X-Title": "ApexEnem"
        },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "system",
            content: "Você é um corretor oficial do ENEM. Retorne APENAS o JSON de avaliação estrito sem rodeios nem introduções estruturado exatamente como solicitado."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3
      }),
      signal: controller.signal
    });

    if (response.status === 429) {
      console.error(`fetchCorrection 429 com chave ${key.slice(-4)}, tentando próxima...`);
      clearTimeout(timeoutId);
      continue;
    }
    if (!response.ok) {
      console.error(`fetchCorrection ${modelName}: ${response.status}`);
      clearTimeout(timeoutId);
      continue;
    }

    const resData = await response.json();
    const rawContent = resData.choices?.[0]?.message?.content;
    if (!rawContent) {
      console.error(`fetchCorrection ${modelName}: empty content`);
      clearTimeout(timeoutId);
      continue;
    }

    clearTimeout(timeoutId);
    return extractJsonFromText(rawContent);
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error(`Error querying model ${modelName}:`, err.message);
    continue;
  }
}
console.error(`fetchCorrection ${modelName}: todas as chaves esgotadas`);
return null;
}

app.post("/api/correct", async (req, res) => {
  const { title, text, imageBase64 } = req.body;

  if (!text && !imageBase64) {
    return res.status(400).json({ error: "É necessário digitar um texto ou enviar uma foto." });
  }

  const models = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "deepseek/deepseek-r1:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "google/gemma-3-12b-it:free",
    "mistralai/mistral-small-24b-instruct-2501:free",
    "deepseek/deepseek-chat:free",
    "microsoft/phi-3.5-mini-instruct:free",
    "cohere/command-r7b-12-2025:free",
    "google/gemma-2-9b-it:free",
    "nvidia/llama-3.1-nemotron-70b-instruct:free"
  ];

  const contentToEvaluate = text || "[O aluno enviou uma imagem contendo o manuscrito de redação para transcrição e correção direta.]";

  const prompt = `Você é um corretor de redação oficial da banca do ENEM (INEP), altamente conceituado pela sua extrema rigidez, imparcialidade e aplicação clínica da Cartilha do Participante ENEM 2025. Você não é um professor bonzinho ou motivador; você avalia o texto de forma cirúrgica, fria e extremamente técnica. Redações medianas ou com falhas cruciais não devem receber notas infladas; notas próximas de 480 a 600 representam a realidade da média nacional e erros graves devem puxar a nota para baixo de forma dura.

O título/tema proposto da redação é: "${title || "Sem título"}

Redação do aluno:
"""
${contentToEvaluate}
"""

CRITÉRIOS OFICIAIS DO ENEM 2025 (CARTILHA DO PARTICIPANTE) - Use EXATAMENTE estes níveis:

=== COMPETÊNCIA 1: Domínio da escrita formal ===
200: "Demonstra excelente domínio da modalidade escrita formal da língua portuguesa e de escolha de registro. Desvios gramaticais ou de convenções da escrita serão aceitos somente como excepcionalidade e quando não caracterizarem reincidência."
160: "Demonstra bom domínio da modalidade escrita formal da língua portuguesa e de escolha de registro, com poucos desvios gramaticais e de convenções da escrita."
120: "Demonstra domínio mediano da modalidade escrita formal da língua portuguesa e de escolha de registro, com alguns desvios gramaticais e de convenções da escrita."
80: "Demonstra domínio insuficiente da modalidade escrita formal da língua portuguesa, com muitos desvios gramaticais, de escolha de registro e de convenções da escrita."
40: "Demonstra domínio precário da modalidade escrita formal da língua portuguesa, de forma sistemática, com diversificados e frequentes desvios gramaticais, de escolha de registro e de convenções da escrita."
0: "Demonstra desconhecimento da modalidade escrita formal da língua portuguesa."
Avalie: convenções da escrita (acentuação, ortografia, hífen, maiúsculas/minúsculas, translineação), aspectos gramaticais (regência, concordância, tempos verbais, pontuação, paralelismos, pronomes, crase), escolha de registro (adequação à escrita formal, ausência de oralidade), escolha vocabular (precisão semântica).

=== COMPETÊNCIA 2: Compreensão do tema e aplicação de conceitos ===
200: "Desenvolve o tema por meio de argumentação consistente, a partir de um repertório sociocultural produtivo, e apresenta excelente domínio do texto dissertativo-argumentativo."
160: "Desenvolve o tema por meio de argumentação consistente e apresenta bom domínio do texto dissertativo-argumentativo, com proposição, argumentação e conclusão."
120: "Desenvolve o tema por meio de argumentação previsível e apresenta domínio mediano do texto dissertativo-argumentativo, com proposição, argumentação e conclusão."
80: "Desenvolve o tema recorrendo à cópia de trechos dos textos motivadores ou apresenta domínio insuficiente do texto dissertativo-argumentativo, não atendendo à estrutura com proposição, argumentação e conclusão."
40: "Apresenta o assunto, tangenciando o tema, ou demonstra domínio precário do texto dissertativo-argumentativo, com traços constantes de outros tipos textuais."
0: "Fuga ao tema/não atendimento à estrutura dissertativo-argumentativa."
Avalie: compreensão da proposta, desenvolvimento do tema dentro dos limites do texto dissertativo-argumentativo em prosa, presença de repertório sociocultural produtivo (informação, fato, citação ou experiência relacionada ao tema que contribua como argumento). CUIDADO com repertório de bolso (referências prontas e decoradas sem conexão genuína com o tema).

=== COMPETÊNCIA 3: Seleção e organização dos argumentos ===
200: "Apresenta informações, fatos e opiniões relacionados ao tema proposto, de forma consistente e organizada, configurando autoria, em defesa de um ponto de vista."
160: "Apresenta informações, fatos e opiniões relacionados ao tema, de forma organizada, com indícios de autoria, em defesa de um ponto de vista."
120: "Apresenta informações, fatos e opiniões relacionados ao tema, limitados aos argumentos dos textos motivadores e pouco organizados, em defesa de um ponto de vista."
80: "Apresenta informações, fatos e opiniões relacionados ao tema, mas desorganizados ou contraditórios e limitados aos argumentos dos textos motivadores, em defesa de um ponto de vista."
40: "Apresenta informações, fatos e opiniões pouco relacionados ao tema ou incoerentes e sem defesa de um ponto de vista."
0: "Apresenta informações, fatos e opiniões não relacionados ao tema e sem defesa de um ponto de vista."
Avalie: existência de projeto de texto (planejamento prévio perceptível), seleção e organização estratégica dos argumentos, progressão textual fluente, desenvolvimento dos argumentos (explicitação da relevância das ideias para defesa do ponto de vista).

=== COMPETÊNCIA 4: Coesão e mecanismos linguísticos ===
200: "Articula bem as partes do texto e apresenta repertório diversificado de recursos coesivos."
160: "Articula as partes do texto, com poucas inadequações, e apresenta repertório diversificado de recursos coesivos."
120: "Articula as partes do texto, de forma mediana, com inadequações, e apresenta repertório pouco diversificado de recursos coesivos."
80: "Articula as partes do texto, de forma insuficiente, com muitas inadequações, e apresenta repertório limitado de recursos coesivos."
40: "Articula as partes do texto de forma precária."
0: "Não articula as informações."
Avalie: estruturação dos parágrafos, estruturação dos períodos (complexidade com orações subordinadas e intercaladas), referenciação (pronomes, advérbios, artigos, sinônimos, expressões resumitivas), uso variado de operadores argumentativos (conjunções, preposições, advérbios) que estabeleçam relações semânticas de causa, consequência, adversidade, conclusão, etc.

=== COMPETÊNCIA 5: Proposta de intervenção ===
200: "Elabora muito bem proposta de intervenção, detalhada, relacionada ao tema e articulada à discussão desenvolvida no texto."
160: "Elabora bem proposta de intervenção relacionada ao tema e articulada à discussão desenvolvida no texto."
120: "Elabora, de forma mediana, proposta de intervenção relacionada ao tema e articulada à discussão desenvolvida no texto."
80: "Elabora, de forma insuficiente, proposta de intervenção relacionada ao tema, ou não articulada com a discussão desenvolvida no texto."
40: "Apresenta proposta de intervenção vaga, precária ou relacionada apenas ao assunto."
0: "Não apresenta proposta de intervenção ou apresenta proposta não relacionada ao tema ou ao assunto."
Avalie objetivamente cada um dos 5 elementos obrigatórios (Agente, Ação, Meio/Modo, Efeito/Finalidade, Detalhamento) - 40 pts cada. A proposta deve estar relacionada ao tema e integrada ao projeto de texto.

PROCEDIMENTO DE CALIBRAÇÃO DE NOTA E TRAVAS OBRIGATÓRIAS (CAPPING RULES):
Aplique rigorosamente as travas abaixo ANTES de definir a nota final de cada competência:

1. TRAVAS PARA A COMPETÊNCIA 1:
   - Mais de 2 falhas gramaticais/ortográficas leves → Máx 160
   - 3 a 5 falhas (crase, concordância, regência, acentuação) → Máx 120
   - Mais de 5 desvios, gírias, períodos truncados → Máx 80
   - Desestruturação sintática frequente → Máx 40

2. TRAVAS PARA A COMPETÊNCIA 2:
   - Sem repertório sociocultural externo → Máx 120
   - Repertório citado sem uso produtivo → Máx 160
   - Tangenciamento do tema → Máx 80

3. TRAVAS PARA A COMPETÊNCIA 3:
   - Sem tese clara na introdução → Máx 120
   - Argumentação puramente expositiva → Máx 120
   - Argumentos com lacunas/superficialidade → Máx 160

4. TRAVAS PARA A COMPETÊNCIA 4:
   - Menos de 2 conectivos interparágrafos legítimos → Máx 120
   - Coesão intraparágrafo fraca/repetitiva → Máx 120-160

5. TRAVAS PARA A COMPETÊNCIA 5:
   - Avalie matematicamente: 40 pts para cada elemento (Agente, Ação, Meio/Modo, Efeito, Detalhamento)
   - Termos genéricos como "nós", "a sociedade" NÃO pontuam como agente
   - Ausência de 1 elemento → Máx 160. Ausência de 2 → Máx 120.

DIRETRIZES FUNDAMENTAIS:
- Não balanceie as notas para cima para agradar.
- Forneça críticas maduras, diretas e pragmáticas, com linguajar formal e clínico de banca oficial.
- Redações tipicamente escolares sem repertório forte e com deslizes comuns devem ter nota entre 480 e 560 pontos. Nunca dê notas superiores a 800 sem estrutura impecável, vocabulário culto, domínio formal completo e intervenção detalhada.

Retorne estritamente um objeto JSON com o seguinte formato:
{
  "score": 520,
  "generalFeedback": "Análise diagnóstica cirúrgica, extremamente realista, franca e detalhada da redação justificando o exato motivo de deságios e perdas de pontuação sob a perspectiva de um corretor implacável da banca ENEM.",
  "competencies": [
    { "id": 1, "name": "Competência 1: Domínio da escrita formal", "description": "Demonstrar domínio da modalidade escrita formal da língua portuguesa.", "score": 120, "feedback": "Análise nítida e direta apontando os desvios gramaticais exatos encontrados no texto (desvios de crase, pontuação, ortografia, concordância, coloquialismo), listando-os especificamente se possível, e justificando a pontuação com base nos níveis oficiais e travas." },
    { "id": 2, "name": "Competência 2: Compreensão do tema e desenvolvimento", "description": "Compreender a proposta de redação e aplicar conceitos das várias áreas.", "score": 120, "feedback": "Apontar claramente se o aluno abordou o tema de forma integral ou tangencial, se respeitou o formato dissertativo-argumentativo, e julgar se há repertório legitimado, pertinente e produtivo. Diga explicitamente qual foi o repertório identificado ou a ausência dele." },
    { "id": 3, "name": "Competência 3: Projeto de texto e argumentação", "description": "Selecionar, relacionar, organizar e interpretar informações em defesa de um ponto de vista.", "score": 120, "feedback": "Criticar o encadeamento das ideias. Apontar se há de fato uma tese clara na introdução para guiar o leitor, se os desenvolvimentos a defendem de modo aprofundado ou se caem na superficialidade, senso comum ou mera exposição textual." },
    { "id": 4, "name": "Competência 4: Coesão e coerência", "description": "Demonstrar conhecimento dos mecanismos linguísticos necessários para a construção.", "score": 80, "feedback": "Verificar se existem conectivos interparágrafos legítimos no início das estrofes conectivas, e se há uma coesão intraparágrafo limpa. Apontar repetições exaustivas de termos comuns que empobrecem o texto." },
    { "id": 5, "name": "Competência 5: Proposta de intervenção", "description": "Elaborar proposta de intervenção para o problema abordado respeitando direitos humanos.", "score": 80, "feedback": "Listar explicitamente quais dos 5 elementos obrigatórios estão PRESENTES e quais estão AUSENTES ou VAGOS (identificando individualmente: Agente, Ação, Meio/Modo, Efeito e Detalhamento) para justificar a nota matemática final desta competência." }
  ],
  "strengths": ["Item positivo técnico real do texto 1", "Item positivo técnico real do texto 2"],
  "weaknesses": ["Item de correção crucial 1 que causou perda de pontos", "Item de correção crucial 2 que causou perda de pontos"]
}

Retorne APENAS o JSON puro. Não escreva textos explicativos adicionais antes ou depois do bloco JSON.`;

  try {
    const results = await Promise.allSettled(
      models.map(m => fetchCorrectionFromModel(m, prompt))
    );

    const successfulCorrections: any[] = [];
    const errorsList: string[] = [];

    results.forEach((res, idx) => {
      if (res.status === "fulfilled" && res.value != null) {
        successfulCorrections.push({
          model: models[idx],
          data: res.value
        });
      } else if (res.status === 'rejected') {
        errorsList.push(`${models[idx]}: ${res.reason?.message || res.reason}`);
      }
    });

    if (successfulCorrections.length === 0) {
      console.warn("All parallel models failed. Attempting single backup with openrouter/free...");
      try {
        const backupData = await fetchCorrectionFromModel("openrouter/free", prompt);
        if (backupData) {
          successfulCorrections.push({ model: "openrouter/free", data: backupData });
        } else {
          return res.status(503).json({ error: "Todos os modelos de IA falharam ao processar sua redação.", details: errorsList.slice(0, 5) });
        }
      } catch (backupErr: any) {
        console.error("Backup model call failed too:", backupErr);
        return res.status(503).json({ error: "Serviço de correção por IA indisponível no momento.", details: errorsList.slice(0, 5) });
      }
    }

    const numSuccessful = successfulCorrections.length;

    const finalCompetencies = [1, 2, 3, 4, 5].map(compId => {
      let compSum = 0;
      let scoreCount = 0;
      const feedbacks: string[] = [];
      let compName = "";
      let compDesc = "";

      successfulCorrections.forEach(suc => {
        if (!suc?.data?.competencies) return;
        const comp = suc.data.competencies.find((c: any) => c.id === compId) || suc.data.competencies[compId - 1];
        if (comp) {
          compName = comp.name || `Competência ${compId}`;
          compDesc = comp.description || "";
          
          let scoreVal = typeof comp.score === 'number' ? comp.score : 0;
          compSum += scoreVal;
          scoreCount++;

          const modelNameClean = (suc.model || '').split('/')[1] || suc.model;
          if (comp.feedback) {
            feedbacks.push(`🤖 **${modelNameClean}**: ${comp.feedback}`);
          }
        }
      });

      const rawAvg = scoreCount > 0 ? compSum / scoreCount : 120;
      const roundedScore = Math.round(rawAvg / 40) * 40;

      return {
        id: compId,
        name: compName || `Competência ${compId}`,
        description: compDesc,
        score: Math.min(200, Math.max(0, roundedScore)),
        feedback: feedbacks.join("\n\n")
      };
    });

    const consolidatedScore = finalCompetencies.reduce((acc, curr) => acc + curr.score, 0);

    const modelBreakdown = successfulCorrections.map(suc => {
      const mn = suc.model.split('/')[1] || suc.model;
      const compAvg = (suc.data.competencies || []).filter(Boolean).reduce((s: number, c: any) => s + (c.score || 0), 0);
      return `- **${mn}**: ${compAvg} pontos`;
    }).join("\n");

    const mergedGeneralFeedback = `### 🌟 Consenso Multi-IA (${numSuccessful} modelos)
Sua nota foi construída de forma justa, matemática e transparente avaliando o texto simultaneamente em **${numSuccessful} modelos de Inteligência Artificial diferentes** através do OpenRouter.

**Pontuações atribuídas por ferramenta individual:**
${modelBreakdown}

---

### 📝 Diagnóstico Coletivo e Recomendações:
${successfulCorrections.map(suc => {
  const mn = suc.model.split('/')[1] || suc.model;
      return `##### Análise de ${mn}:
${suc.data.generalFeedback || "Estudo estrutural adequado."}`;
}).slice(0, 5).join("\n\n")}`;

    const finalStrengths = Array.from(new Set(
      successfulCorrections.flatMap(suc => suc.data.strengths || [])
    )).filter(s => typeof s === 'string' && s.length > 5).slice(0, 3);

    const finalWeaknesses = Array.from(new Set(
      successfulCorrections.flatMap(suc => suc.data.weaknesses || [])
    )).filter(w => typeof w === 'string' && w.length > 5).slice(0, 3);

    const responsePayload = {
      score: consolidatedScore,
      generalFeedback: mergedGeneralFeedback,
      competencies: finalCompetencies,
      strengths: finalStrengths.length > 0 ? finalStrengths : ["Boa argumentação estrutural global."],
      weaknesses: finalWeaknesses.length > 0 ? finalWeaknesses : ["Ajustar conectores interparágrafos periféricos para maximizar nota."]
    };

    return res.json(responsePayload);
  } catch (error: any) {
    console.error("OpenRouter correction pipeline failure:", error);
    res.status(500).json({ error: "Erro crítico na correção paralela das IAs. Tente novamente." });
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
  const years = [2024, 2023, 2022, 2021, 2020];
  const all: any[] = [];
  for (const year of years) {
    if (all.length >= count) break;
    try {
      const offsets = [0, 25, 50, 75];
      for (const offset of offsets) {
        if (all.length >= count) break;
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 5000);
        const res = await fetch(`https://api.enem.dev/v1/exams/${year}/questions?limit=25&offset=${offset}`, { signal: ctrl.signal });
        clearTimeout(tid);
        if (!res.ok) continue;
        const data = await res.json();
        const questions = data.questions || [];
        for (const q of questions) {
          if (all.length >= count) break;
          if (q.discipline !== discipline) continue;
          if (!q.correctAlternative || !["A","B","C","D","E"].includes(q.correctAlternative)) continue;
          if (!q.alternatives?.some((a: any) => a.text?.trim())) continue;
          all.push({
            statement: ((q.context || "") + "\n" + (q.alternativesIntroduction || "")).trim() + (q.title ? " (" + q.title + ")" : ""),
            options: q.alternatives.filter((a: any) => a.text).map((a: any) => ({ letter: a.letter, text: a.text })),
            correctAnswer: q.correctAlternative,
          });
        }
      }
    } catch {}
  }
  return all;
}

app.post("/api/questions", async (req, res) => {
  const { area, count, hardSubjects } = req.body;
  const targetArea = area || "Geral";
  const numQuestions = count || 1;

  const promptDef = PROMPTS.questions;
  const referenceQuestions = await fetchReferenceQuestions(targetArea, 8);
  const prompt = promptDef.buildPrompt(numQuestions, targetArea, referenceQuestions, hardSubjects) as string;

  function stripLatex(text: string): string {
    if (!text) return text;
    const supers: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', '(': '⁽', ')': '⁾', 'n': 'ⁿ' };
    const subs: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋' };
    let s = text;
    s = s.replace(/\\(?:sqrt|√)\{([^}]*)\}/g, '√$1');
    s = s.replace(/\\(?:frac)\{([^}]*)\}\{([^}]*)\}/g, '$1/$2');
    s = s.replace(/\\(?:alpha|α)/g, 'α');
    s = s.replace(/\\(?:beta|β)/g, 'β');
    s = s.replace(/\\(?:pi|π)/g, 'π');
    s = s.replace(/\\(?:Delta|Δ)/g, 'Δ');
    s = s.replace(/\\(?:theta|θ)/g, 'θ');
    s = s.replace(/\\(?:infty|∞)/g, '∞');
    s = s.replace(/\\(?:approx|≈)/g, '≈');
    s = s.replace(/\\(?:neq|≠)/g, '≠');
    s = s.replace(/\\(?:leq|≤)/g, '≤');
    s = s.replace(/\\(?:geq|≥)/g, '≥');
    s = s.replace(/\\(?:times|×)/g, '×');
    s = s.replace(/\\(?:div|÷)/g, '÷');
    s = s.replace(/\\(?:cdot|·)/g, '·');
    s = s.replace(/\\/g, '');
    s = s.replace(/\^\{([^}]*)\}/g, (_, inner) => inner.split('').map((c: string) => supers[c] || c).join(''));
    s = s.replace(/\_\{([^}]*)\}/g, (_, inner) => inner.split('').map((c: string) => subs[c] || c).join(''));
    s = s.replace(/\^([0-9A-Za-z])/g, (_, c) => supers[c] || c);
    s = s.replace(/\_([0-9A-Za-z])/g, (_, c) => subs[c] || c);
    return s;
  }

  function normalizeQuestion(q: any): any {
    if (!q || typeof q !== 'object' || Array.isArray(q)) return q;
    q.correctAnswer = q.correctAnswer || q.correct_answer || q.answer || q.gabarito || q.correct || q.correctAnswerLetter || q.rightAnswer;
    if (typeof q.correctAnswer === 'string') q.correctAnswer = q.correctAnswer.trim().toUpperCase().replace(/[^A-E]/g, '');
    q.statement = stripLatex(q.statement || q.question || q.questionText || q.enunciado || q.pergunta || q.text || '');
    q.explanation = stripLatex(q.explanation || q.explicacao || q.feedback || q.justification || q.resolution || q.comment || q.comentario || q.solution || q.resposta || q.gabarito_comentado || q.resolucao || '');
    q.options = q.options || q.alternatives || q.choices || q.opcoes || q.items || q.respostas || [];
    if (Array.isArray(q.options)) {
      q.options = q.options.map((o: any) => {
        if (typeof o === 'string') return { letter: '', text: stripLatex(o) };
        return { letter: o.letter || o.letra || o.key || o.id || o.index || '', text: stripLatex(o.text || o.texto || o.value || o.conteudo || o.descricao || o.description || o.label || '') };
      });
    }
    return q;
  }

  function validateQuestions(questions: any[], targetArea?: string): any[] {
    return questions.filter((q: any) => {
      q = normalizeQuestion(q);
      if (!q) { console.error("validate: q is null/undefined"); return false; }
      const keys = Object.keys(q);
      if (typeof q.statement !== 'string' || q.statement.length < 30) { console.error("validate: statement inválido", "keys:", keys, "statement:", typeof q.statement, q.statement?.length); return false; }
      if (!Array.isArray(q.options) || q.options.length < 2) { console.error("validate: options inválido", "keys:", keys, Array.isArray(q.options), q.options?.length); return false; }
      if (typeof q.correctAnswer !== 'string' || q.correctAnswer.length !== 1) { console.error("validate: correctAnswer inválido", "keys:", keys, "val:", q.correctAnswer, "type:", typeof q.correctAnswer); return false; }
      if (typeof q.explanation !== 'string' || q.explanation.length < 20) { console.error("validate: explanation inválido", "keys:", keys, "len:", q.explanation?.length); return false; }

      const texts = q.options.map((o: any) => o?.text || '');
      if (texts.some((t: string) => t.length < 2)) { console.error("validate: texto de opção muito curto", texts); return false; }
      if (new Set(texts).size !== texts.length) { console.error("validate: textos de opção duplicados", texts); return false; }

      return true;
    });
  }

  async function tryGemini(model: string, timeoutMs: number, errors: string[]): Promise<any[] | null> {
    if (!googleApiKey) { errors.push('Gemini: GOOGLE_API_KEY não configurada'); return null; }
    if (Date.now() - endpointStart > MAX_TOTAL_TIME) { return null; }
    const ctrl = new AbortController();
    const remaining = Math.max(2000, MAX_TOTAL_TIME - (Date.now() - endpointStart));
    const tid = setTimeout(() => ctrl.abort(), Math.min(timeoutMs, remaining));
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
          ],
          generationConfig: { temperature: 0.9, maxOutputTokens: 8192 }
        }),
        signal: ctrl.signal
      });
      clearTimeout(tid);
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        const msg = `Gemini ${model}: ${res.status} ${errBody.slice(0, 200)}`;
        console.error(msg);
        errors.push(msg);
        return null;
      }
      const data = await res.json();
      const candidate = data?.candidates?.[0];
      const finishReason = candidate?.finishReason;
      const text = candidate?.content?.parts?.[0]?.text;
      console.error(`Gemini ${model} finishReason=${finishReason} rawLen=${text?.length || 0}`);
      if (!text || finishReason === "SAFETY") {
        const msg = `Gemini ${model}: bloqueado (${finishReason})`;
        console.error(msg);
        errors.push(msg);
        return null;
      }
      const raw = extractJsonFromText(text);
      const questions = Array.isArray(raw) ? validateQuestions(raw) : [];
      if (questions.length > 0) return questions;
      errors.push(`Gemini ${model}: JSON inválido ou validação rejeitou`);
      return null;
    } catch (err: any) {
      const msg = `Gemini ${model}: ${err?.message || err}`;
      console.error(msg);
      errors.push(msg);
      return null;
    } finally {
      clearTimeout(tid);
    }
  }

  const endpointStart = Date.now();
  const MAX_TOTAL_TIME = 9800;

  async function tryOpenRouter(model: string, timeoutMs: number, errors: string[]): Promise<any[] | null> {
    for (let attempt = 0; attempt < openRouterKeys.length * 2; attempt++) {
      if (Date.now() - endpointStart > MAX_TOTAL_TIME) {
        errors.push(`${model}: tempo total excedido`);
        return null;
      }
      const key = getNextOpenRouterKey();
      if (!key) continue;
      const ctrl = new AbortController();
      const remaining = Math.max(2000, MAX_TOTAL_TIME - (Date.now() - endpointStart));
      const tid = setTimeout(() => ctrl.abort(), Math.min(timeoutMs, remaining));
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`,
            "HTTP-Referer": "https://apexenem.vercel.app",
            "X-Title": "ApexEnem"
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: "Você é um especialista em questões ENEM. Gere apenas JSON." },
              { role: "user", content: prompt }
            ],
            temperature: 0.9,
            max_tokens: 6144
          }),
          signal: ctrl.signal
        });
        clearTimeout(tid);
        if (res.status === 429) {
          errors.push(`429: ${model} — quota esgotada na chave ${key.slice(-4)}`);
          continue;
        }
        if (res.status === 402) {
          errors.push(`402: ${model} — saldo insuficiente na chave ${key.slice(-4)}`);
          continue;
        }
        if (!res.ok) {
          errors.push(`${res.status}: ${model} — erro na chave ${key.slice(-4)}`);
          return null;
        }
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!content) { errors.push(`${model}: resposta vazia`); return null; }
        const raw = extractJsonFromText(content);
        const questions = Array.isArray(raw) ? validateQuestions(raw) : [];
        if (questions.length > 0) return questions;
        errors.push(`${model}: JSON inválido ou validação rejeitou`);
        return null;
      } catch (err: any) {
        clearTimeout(tid);
        const msg = err?.message || err || 'erro desconhecido';
        errors.push(`${model}: ${msg}`);
        continue;
      }
    }
    errors.push(`${model}: todas as ${openRouterKeys.length} chave(s) esgotaram`);
    return null;
  }

  const errors: string[] = [];
  const modelAttempts = PROMPTS.questions.models.map(m => {
    if (m.provider === 'gemini') return tryGemini(m.modelId, m.timeout || 9500, errors);
    if (m.provider === 'openrouter') return tryOpenRouter(m.modelId, m.timeout || 9900, errors);
    return Promise.resolve(null);
  });

  const result = await Promise.any(
    modelAttempts.map(p => p.then(q => q ? Promise.resolve(q) : Promise.reject()))
  ).catch(() => null);

  if (result) {
    const enriched = (result as any[]).map((q: any, i: number) => ({
      ...q,
      id: q.id || `ai-q-${Date.now()}-${i}`,
      area: q.area || targetArea,
    }));
    return res.json(enriched);
  }
  return res.status(502).json({ error: "Todos os modelos falharam.", details: errors.slice(0, 10) });
});

app.post("/api/openrouter-chat", async (req, res) => {
  const { questionText, instructions, correctAnswer } = req.body;

  const cabritoPrompt = `Por favor, explique de forma motivadora este exercício para mim:\nExercício/Pergunta: "${questionText}"\nTipo do desafio: "${instructions}"\nGabarito Oficial: "${correctAnswer}"\n\nRetorne 2-3 parágrafos curtos, lúdicos e didáticos adicionando emojis de cabrito 🐐 e símbolos de livros.`;

  async function tryChat(model: string): Promise<string | null> {
    for (let attempt = 0; attempt < openRouterKeys.length * 2; attempt++) {
      const key = getNextOpenRouterKey();
      if (!key) continue;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9900);
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`,
            "HTTP-Referer": "https://apexenem.vercel.app",
            "X-Title": "ApexEnem"
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: "Você é o Cabrito, o tutor inteligente e encorajador tipo cabrito do Duolingo do ENEM. Explique conceitos de modo muito lúdico, conciso e instrutivo." },
              { role: "user", content: cabritoPrompt }
            ],
            max_tokens: 512
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.status === 429) {
          console.error(`tryChat 429 com chave ${key.slice(-4)}`);
          continue;
        }
        if (!res.ok) return null;
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
      } catch {
        clearTimeout(timeoutId);
        continue;
      }
    }
    return null;
  }

  const models = ["meta-llama/llama-3.2-3b-instruct:free", "openrouter/free"];
  const text = await Promise.any(models.map(m => tryChat(m).then(t => t ? Promise.resolve(t) : Promise.reject()))).catch(() => null);

  return res.json({ text: text || "🐐 Olá! Encontrei um pequeno atraso de sinal para buscar a explicação, mas já volto com a resposta! 📚" });
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

  async function tryLesson(model: string): Promise<any | null> {
    for (let attempt = 0; attempt < openRouterKeys.length * 2; attempt++) {
      const key = getNextOpenRouterKey();
      if (!key) continue;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 12000);
      try {
        const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`,
            "HTTP-Referer": "https://apexenem.vercel.app",
            "X-Title": "ApexEnem"
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            max_tokens: 1536,
            temperature: 0.85
          }),
          signal: ctrl.signal
        });
        clearTimeout(tid);
        if (resp.status === 429) continue;
        if (!resp.ok) continue;
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) continue;

        const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
          const parsed = JSON.parse(cleaned);
          if (parsed.title && Array.isArray(parsed.content) && parsed.content.length >= 3) {
            return parsed;
          }
        } catch {
          const match = cleaned.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              const parsed = JSON.parse(match[0]);
              if (parsed.title && Array.isArray(parsed.content)) return parsed;
            } catch {}
          }
        }
      } catch {
        clearTimeout(tid);
        continue;
      }
    }
    return null;
  }

  const models = ["meta-llama/llama-3.2-3b-instruct:free", "openrouter/free"];
  const lesson = await Promise.any(
    models.map(m => tryLesson(m).then(l => l ? Promise.resolve(l) : Promise.reject()))
  ).catch(() => null);

  if (!lesson) {
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
  }

  return res.json(lesson);
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
  const userPrompt = typeof built === 'string' ? built : built.user;

  async function tryLessonV2(model: string): Promise<any | null> {
    for (let attempt = 0; attempt < openRouterKeys.length * 2; attempt++) {
      const key = getNextOpenRouterKey();
      if (!key) continue;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 25000);
      try {
        const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`,
            "HTTP-Referer": "https://apexenem.vercel.app",
            "X-Title": "ApexEnem"
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            max_tokens: 6144,
            temperature: 0.85
          }),
          signal: ctrl.signal
        });
        clearTimeout(tid);
        if (resp.status === 429) continue;
        if (!resp.ok) continue;
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) continue;

        const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
          const parsed = JSON.parse(cleaned);
          if (parsed.title && Array.isArray(parsed.cycles) && parsed.cycles.length >= 4) {
            return parsed;
          }
        } catch {
          const match = cleaned.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              const parsed = JSON.parse(match[0]);
              if (parsed.title && Array.isArray(parsed.cycles)) return parsed;
            } catch {}
          }
        }
      } catch {
        clearTimeout(tid);
        continue;
      }
    }
    return null;
  }

  const models = promptDef.models.map(m => m.modelId);
  const lesson = await Promise.any(
    models.map(m => tryLessonV2(m).then(l => l ? Promise.resolve(l) : Promise.reject()))
  ).catch(() => null);

  if (!lesson) {
    return res.json({
      title: `Aula de ${area}`,
      subtitle: 'Conceitos essenciais para o ENEM',
      cycles: [
        { type: 'story', cabritoSpeech: 'Deixa eu te contar uma história!', content: ` Imagina que você tá numa feira livre e precisa calcular o preço de uma sacola com frutas de diferentes valores... É EXATAMENTE assim que ${area} aparece no ENEM — ligado a situações do dia a dia que parecem simples mas exigem raciocínio lógico por trás.` },
        { type: 'explanation', cabritoSpeech: 'Agora vamos entender a teoria!', content: `Os principais conceitos de ${area} para o ENEM:\n\n• Conceito-chave 1: aparece em pelo menos 30% das questões da área\n• Conceito-chave 2: o ENEM adora misturar com interpertação de gráficos\n• Conceito-chave 3: cai sempre em conjunto com temas transversais (sustentabilidade, cidadania)\n\nDica do Cabrito: não decore fórmulas — entenda o CONCEITO por trás delas. O ENEM cobra aplicação, não memorização.` },
        { type: 'interactive', cabritoSpeech: 'Testa seus conhecimentos!', content: `Em uma pesquisa sobre o impacto ambiental de uma indústria, observou-se que a poluição dobrou a cada 5 anos. Se em 2010 a poluição era de 20 unidades, qual era o valor em 2020?`, options: ['40 unidades', '60 unidades', '80 unidades', '160 unidades'], correctIndex: 2, explanation: 'De 2010 a 2020 são 10 anos = 2 períodos de 5 anos. A poluição dobra a cada período: 20 → 40 → 80. A alternativa C está correta. Muitos erram escolhendo D por aplicar a dobra 3 vezes em vez de 2.' },
        { type: 'challenge', cabritoSpeech: 'Agora ficou sério!', content: `Desafio: Um gráfico mostra que o PIB per capita de um país cresceu 3% ao ano entre 2015 e 2020. Sabendo que o PIB inicial era R$ 35.000,00, qual era o PIB per capita aproximado em 2020?`, options: ['R$ 38.500,00', 'R$ 40.600,00', 'R$ 42.800,00', 'R$ 45.100,00'], correctIndex: 1, explanation: 'Crescimento composto por 5 anos: 35.000 × (1,03)^5 ≈ 35.000 × 1,159 ≈ R$ 40.600. A chave é entender que crescimento percentual acumulado NÃO é simples soma (3% × 5 = 15%), mas multiplicativo.' },
        { type: 'story', cabritoSpeech: 'Segundo tema, vamos lá!', content: `Sabe aquele experimento de laboratório que você fez no ensino médio onde misturou dois reagentes e mudou de cor? Pois é — o ENEM adora pegar experimentos parecidos e pedir pra você interpretar o que aconteceu em termos científicos. Em ${area}, a habilidade de ler um experimento e extrair conclusões é fundamental.` },
        { type: 'explanation', cabritoSpeech: 'Aprofundando o conhecimento!', content: `Como ${area} cai no ENEM de forma mais avançada:\n\n• O ENEM não pergunta "o que é X" — ele dá um CONTEXTO complexo e pede pra você APLICAR X\n• Questões de ${area} exigem interpretação de dados (tabelas, gráficos, mapas)\n• Pegadinhas comuns: alternativas que parecem corretas mas confundem unidades ou escalas\n\nRegra de ouro: LEIA O ENUNCIADO INTEIRO antes de olhar as alternativas. 70% dos erros são por pressa na leitura.` },
        { type: 'interactive', cabritoSpeech: 'Mais uma pra treinar!', content: `Uma cidade planeja reduzir o consumo de água em 20% em 3 anos. No primeiro ano, conseguiu reduzir 5%. Para atingir a meta total, qual seria a redução necessária nos dois anos seguintes (considerando redução composta)?`, options: ['Reduzir 15% ao ano', 'Reduzir 8% ao ano', 'Reduzir cerca de 7,8% ao ano', 'Reduzir 10% ao ano'], correctIndex: 2, explanation: 'Meta: reduzir 20% em 3 anos = fator 0,80. Após 1 ano: fator 0,95. Falta: 0,80/0,95 ≈ 0,842 por ano nos 2 anos restantes = redução de ~7,8% ao ano. Não é 15%/2 = 7,5% porque a redução é composta!' },
        { type: 'challenge', cabritoSpeech: 'Último desafio!', content: `Desafio final: Pesquisadores compararam dois medicamentos para reduzir a pressão arterial. O medicamento A reduziu em média 12 mmHg com desvio padrão de 3 mmHg. O medicamento B reduziu em média 10 mmHg com desvio padrão de 5 mmHg. Qual afirmação é estatisticamente mais correta?`, options: ['O A é sempre melhor que o B', 'O A tem resultado mais consistente e maior efeito médio', 'O B é melhor porque tem mais variabilidade', 'Não dá pra comparar sem teste estatístico'], correctIndex: 1, explanation: 'O A tem maior efeito médio (12 > 10) E menor variabilidade (desvio 3 < 5), o que indica resultado mais consistente e previsível. A D seria válida se os desvios fossem próximos, mas aqui a diferença de médias (2 mmHg) é significativa comparada aos desvios.' },
        { type: 'story', cabritoSpeech: 'Terceiro ciclo, última história!', content: `Imagina que você é um juiz no tribunal da prova do ENEM e precisa decidir qual a melhor resposta com base em evidências. É EXATAMENTE isso que o exame espera de você em ${area}: pensar como um profissional, não como um memorizador de fórmulas. Cada questão é um mini-caso que exige argumentação.` },
        { type: 'explanation', cabritoSpeech: 'Consolidando o aprendizado!', content: `Pontos-chave de ${area} para revisar:\n\n• Sempre identifique o TIPO de habilidade que a questão pede (interpretar, calcular, comparar, inferir)\n• Gráficos e tabelas são sua AMIGA — aprenda a ler tendências, não apenas valores pontuais\n• Questões de ${area} no ENEM valorizam o raciocínio sobre o resultado final\n• Erro clássico: confundir correlação com causalidade\n• Revise provas anteriores e anote os PADRÕES de como o tema aparece` },
        { type: 'interactive', cabritoSpeech: 'Última chance de brilhar!', content: `Questão final: Um estudo mostrou que cidades com mais áreas verdes têm taxas menores de doenças respiratórias. Qual a interpretação mais científica para essa relação?`, options: ['Áreas verdes curam doenças respiratórias', 'A relação pode ser explicada pela melhoria da qualidade do ar e redução de poluentes', 'Cidades com menos doenças plantam mais árvores', 'A relação é puramente coincidental'], correctIndex: 1, explanation: 'A resposta B é a mais científica porque apresenta um MECANISMO plausível (vegetação filtra poluentes, melhora qualidade do ar). A confunde correlação com causalidade direta, C inverte a causalidade, e D ignora evidências epidemiológicas consistentes.' },
        { type: 'challenge', cabritoSpeech: 'Missão cumprida, estudioso!', content: `Parabéns por completar a aula de ${area}! Você trabalhou com interpretação de dados, raciocínio quantitativo e pensamento crítico — tudo isso aparece no ENEM. Revise os pontos-chave e continue praticando com questões reais de provas anteriores.`, options: ['Quero revisar o conteúdo', 'Próxima aula!', 'Voltar ao menu'], correctIndex: 0, explanation: 'Revisar é sempre uma ótima opção! O estudo mostra que a revisão espaçada aumenta em até 200% a retenção de informações. Continue firme, o Cabrito confia em você! 🐐' },
      ]
    });
  }

  return res.json(lesson);
  } catch (err) {
    console.error('[lesson-v2] fatal:', err);
    return res.json({
      title: `Aula de ${req.body?.area || 'Geral'}`,
      subtitle: 'Conceitos essenciais para o ENEM',
      cycles: [
        { type: 'story', cabritoSpeech: 'Vamos lá!', content: 'Infelizmente a aula completa não pôde ser gerada agora. Tente novamente em alguns instantes!' },
        { type: 'explanation', cabritoSpeech: 'Enquanto isso...', content: 'Revise os conceitos básicos da matéria e tente de novo. O Cabrito está aqui pra te ajudar! 🐐' },
        { type: 'interactive', cabritoSpeech: 'Testa aí!', content: 'Resumo rápido: revise seus erros anteriores e foque nos pontos fracos. Tente gerar a aula novamente.', options: ['Tentar de novo', 'Voltar ao menu'], correctIndex: 0, explanation: 'Clique em "Tentar de novo" para gerar uma nova aula.' },
        { type: 'challenge', cabritoSpeech: 'Não desista!', content: 'Às vezes a IA precisa de mais tempo. Tente gerar a aula novamente em alguns segundos.', options: ['Gerar nova aula', 'Voltar ao menu'], correctIndex: 0, explanation: 'Persistência é chave para o ENEM — e para a vida!' },
      ]
    });
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
  const userPrompt = typeof built === 'string' ? built : built.user;

  async function tryQuestoes(model: string): Promise<any | null> {
    for (let attempt = 0; attempt < openRouterKeys.length * 2; attempt++) {
      const key = getNextOpenRouterKey();
      if (!key) continue;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 25000);
      try {
        const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`,
            "HTTP-Referer": "https://apexenem.vercel.app",
            "X-Title": "ApexEnem"
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            max_tokens: 6144,
            temperature: 0.85
          }),
          signal: ctrl.signal
        });
        clearTimeout(tid);
        if (resp.status === 429) continue;
        if (!resp.ok) continue;
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) continue;

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
      } catch {
        clearTimeout(tid);
        continue;
      }
    }
    return null;
  }

  const models = promptDef.models.map(m => m.modelId);
  const questions = await Promise.any(
    models.map(m => tryQuestoes(m).then(q => q ? Promise.resolve(q) : Promise.reject()))
  ).catch(() => null);

  if (!questions) {
    return res.json({ questions: [] });
  }

  return res.json({ questions });
  } catch (err) {
    console.error('[questoes-ai] fatal:', err);
    return res.json({ questions: [] });
  }
});

app.post("/api/generate-learning-exercises", async (req, res) => {
  const { chapterTitle, chapterArea, weakAreas, count } = req.body;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9900);

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

  async function tryExercises(model: string): Promise<any[] | null> {
    for (let attempt = 0; attempt < openRouterKeys.length * 2; attempt++) {
      const key = getNextOpenRouterKey();
      if (!key) continue;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 9900);
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`,
            "HTTP-Referer": "https://apexenem.vercel.app",
            "X-Title": "ApexEnem"
          },
          body: JSON.stringify({ model, messages: [{ role: "system", content: systemMsg }, { role: "user", content: userMsg }], max_tokens: 1536 }),
          signal: ctrl.signal
        });
        clearTimeout(tid);
        if (res.status === 429) {
          console.error(`tryExercises 429 com chave ${key.slice(-4)}`);
          continue;
        }
        if (!res.ok) { console.error(`tryExercises ${model}: ${res.status}`); continue; }
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) continue;
        return parseExercises(content);
      } catch {
        continue;
      }
    }
    return null;
  }

  const models = ["meta-llama/llama-3.2-3b-instruct:free", "openrouter/free"];
  const exercises = await Promise.any(models.map(m => tryExercises(m).then(e => e ? Promise.resolve(e) : Promise.reject()))).catch(() => null);

  return res.json({ exercises: exercises && exercises.length > 0 ? exercises : null });
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
    openRouter: openRouterKeys.length > 0,
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
