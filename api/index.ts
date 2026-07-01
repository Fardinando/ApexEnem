import express from "express";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import rateLimit from "express-rate-limit";

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
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.hcaptcha.com https://*.hcaptcha.com; style-src 'self' 'unsafe-inline'; frame-src https://*.hcaptcha.com; connect-src 'self' https://*.supabase.co https://openrouter.ai https://enem.dev; img-src 'self' data:;");
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
    "/supabase/keep-alive", "/supabase/setup",
    "/enem-questions", "/questions", "/correct",
    "/openrouter-chat", "/generate-learning-exercises"
  ];
  if (publicRoutes.includes(req.path)) return next();

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

function extractJsonFromText(rawText: string): any {
  try {
    return JSON.parse(rawText.trim());
  } catch (e) {
    // Continue
  }
  const regex = /```json\s*([\s\S]*?)\s*```/;
  const match = rawText.match(regex);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (e) {
      // Continue
    }
  }
  const startIdx = rawText.indexOf('{');
  const endIdx = rawText.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const jsonStr = rawText.substring(startIdx, endIdx + 1);
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      // Continue
    }
  }
  throw new Error("Could not parse JSON from LLM response");
}

const apiKey = process.env.OPENROUTER_API_KEY;

function generateFallbackCorrection(title: string, text: string) {
  return {
    score: 680,
    generalFeedback: "Sua redação apresenta boa estrutura, mas não foi possível conectar ao servidor de IAs para a correção paralela de consenso.",
    competencies: [
      { id: 1, name: "Competência 1: Domínio da escrita formal", description: "Demonstrar domínio da modalidade escrita formal da língua portuguesa.", score: 120, feedback: "Atenção a pequenos desvios gramaticais de concordância e a acentuação." },
      { id: 2, name: "Competência 2: Compreensão do tema e desenvolvimento", description: "Compreender a proposta de redação e aplicar conceitos das várias áreas de conhecimento.", score: 160, feedback: "Excelente abordagem do tema e escolha adequada do gênero dissertativo-argumentativo." },
      { id: 3, name: "Competência 3: Projeto de texto e argumentação", description: "Selecionar, relacionar, organizar e interpretar informações em defesa de um ponto de vista.", score: 120, feedback: "Seus argumentos são claros, mas a articulação entre as ideias poderia ser fortalecida." },
      { id: 4, name: "Competência 4: Coesão e coerência", description: "Demonstrar conhecimento dos mecanismos linguísticos necessários para a construção da argumentação.", score: 160, feedback: "Boa coesão interparágrafos e intraparágrafos." },
      { id: 5, name: "Competência 5: Proposta de intervenção", description: "Elaborar proposta de intervenção para o problema abordado, respeitando os direitos humanos.", score: 120, feedback: "A sua proposta inclui agente e ação, mas faltou detalhar o meio/modo." }
    ],
    strengths: ["Boa estruturação em introdução, desenvolvimento e conclusão."],
    weaknesses: ["Carece de detalhamento minucioso do quinto elemento da proposta de intervenção."]
  };
}

function generateFallbackQuestions(area: string) {
  return [
    {
      id: "q-fb-1",
      area: area,
      statement: `(ENEM Simulado) Em relação às principais discussões contemporâneas sobre sustentabilidade e impacto ambiental na região brasileira de ${area}, observa-se uma forte necessidade de reestruturação produtiva. Qual das seguintes medidas promove um desenvolvimento verdadeiramente sustentável?`,
      options: [
        { letter: "A", text: "Expansão desordenada de áreas para pecuária extensiva com subsídios estatais." },
        { letter: "B", text: "Uso racional e planejado de recursos naturais com rotação de culturas e reflorestamento." },
        { letter: "C", text: "Industrialização pesada sem mitigação de emissões carboníferas." },
        { letter: "D", text: "Privatização desregulada de mananciais de água para consumo do agronegócio." },
        { letter: "E", text: "Incentivo a defensivos agrícolas químicos altamente persistentes no lençol freático." }
      ],
      correctAnswer: "B",
      explanation: "A alternativa B descreve práticas consolidadas de sustentabilidade agrícola: o uso planejado dos recursos, a rotação de culturas que preserva a fertilidade do solo e o reflorestamento que sequestra carbono."
    }
  ];
}

async function fetchCorrectionFromModel(modelName: string, prompt: string) {
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
        "Authorization": `Bearer ${apiKey}`,
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

    if (!response.ok) {
      throw new Error(`Model ${modelName} returned status ${response.status}`);
    }

    const resData = await response.json();
    const rawContent = resData.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error(`Model ${modelName} returned empty text`);
    }

    return extractJsonFromText(rawContent);
  } catch (err: any) {
    console.error(`Error querying model ${modelName}:`, err.message);
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
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
      if (res.status === "fulfilled") {
        successfulCorrections.push({
          model: models[idx],
          data: res.value
        });
      } else {
        errorsList.push(`${models[idx]}: ${res.reason?.message || res.reason}`);
      }
    });

    if (successfulCorrections.length === 0) {
      console.warn("All parallel models failed. Attempting single backup with openrouter/free...");
      try {
        const backupData = await fetchCorrectionFromModel("openrouter/free", prompt);
        successfulCorrections.push({ model: "openrouter/free", data: backupData });
      } catch (backupErr) {
        console.error("Backup model call failed too:", backupErr);
        return res.json(generateFallbackCorrection(title || "Sem título", contentToEvaluate));
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
        const comp = suc.data.competencies?.find((c: any) => c.id === compId) || suc.data.competencies?.[compId - 1];
        if (comp) {
          compName = comp.name || `Competência ${compId}`;
          compDesc = comp.description || "";
          
          let scoreVal = typeof comp.score === 'number' ? comp.score : 0;
          compSum += scoreVal;
          scoreCount++;

          const modelNameClean = suc.model.split('/')[1] || suc.model;
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

app.post("/api/questions", async (req, res) => {
  const { area, count } = req.body;
  const targetArea = area || "Geral";
  const numQuestions = count || 2;

  try {
    const prompt = `Gere ${numQuestions} perguntas de múltipla escolha inéditas no estilo exato do ENEM focadas na área de conhecimento: "${targetArea}".
Cada questão deve conter:
- Um enunciado contextualizado baseado em problemas reais (tipo do INEP/ENEM).
- Cinco alternativas listadas de A até E de forma equilibrada.
- Gabarito preciso indicando qual das alternativas é a correta.
- Justificativa/Explicação pedagógica robusta.

Retorne estritamente o resultado em formato de matriz JSON estruturado exatamente assim:
[
  {
    "id": "q_12345",
    "statement": "Enunciado clássico...",
    "options": [
      { "letter": "A", "text": "Texto da alternativa A" },
      { "letter": "B", "text": "Texto da alternativa B" },
      { "letter": "C", "text": "Texto da alternativa C" },
      { "letter": "D", "text": "Texto da alternativa D" },
      { "letter": "E", "text": "Texto da alternativa E" }
    ],
    "correctAnswer": "A",
    "explanation": "Explicação completa..."
  }
]

Retorne APENAS o JSON. Não escreva textos adicionais.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://ai.studio/build",
        "X-Title": "ApexEnem ENEM Applet"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          {
            role: "system",
            content: "Você é um gerador de avaliações do ENEM especialista. Responda apenas com o JSON bruto solicitado."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter returned status ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      return res.json(generateFallbackQuestions(targetArea));
    }

    const parsedQuestions = extractJsonFromText(rawContent);
    return res.json(parsedQuestions);
  } catch (error: any) {
    console.error("OpenRouter questions generation error:", error);
    return res.json(generateFallbackQuestions(targetArea));
  }
});

app.post("/api/openrouter-chat", async (req, res) => {
  const { questionText, instructions, correctAnswer } = req.body;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://ai.studio/build",
        "X-Title": "ApexEnem ENEM Applet"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          {
            role: "system",
            content: "Você é o Cabrito, o tutor inteligente e encorajador tipo cabrito do Duolingo do ENEM. Explique conceitos de modo muito lúdico, conciso e instrutivo."
          },
          {
            role: "user",
            content: `Por favor, explique de forma motivadora este exercício para mim:
Exercício/Pergunta: "${questionText}"
Tipo do desafio: "${instructions}"
Gabarito Oficial: "${correctAnswer}"

Retorne 2-3 parágrafos curtos, lúdicos e didáticos adicionando emojis de coruja e símbolos de livros.`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter respondeu com status ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "Eis meu conselho do vôo secreto!";
    return res.json({ text });
  } catch (err: any) {
    console.error("OpenRouter error:", err);
    return res.json({ text: "🦉 Olá! Encontrei um pequeno atraso de sinal ao voar para buscar a explicação, mas lembre-se: foco nos estudos sempre rende excelentes frutos! 📚" });
  }
});

app.post("/api/generate-learning-exercises", async (req, res) => {
  const { chapterId, chapterTitle, chapterArea, weakAreas, count } = req.body;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://apexenem.vercel.app",
        "X-Title": "ApexEnem Learning"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          {
            role: "system",
            content: `Você é um gerador de exercícios educacionais para o ENEM. Gere ${count || 5} exercícios no formato JSON sobre "${chapterTitle}" (área: ${chapterArea}).
            Os exercícios DEVEM ser variados entre os tipos: 'choice' (múltipla escolha com 5 opções A-E), 'true-false' (verdadeiro/falso), 'reorder' (ordenar blocos de palavras), 'matching' (associar colunas).
            
            IMPORTANTE: 
            - O JSON deve ser um array de objetos, cada um com: id (string), type (um dos 4 tipos), instructions (string instrutiva), statement (enunciado), options (array de {letter, text} para choice), correctLetter (string para choice), correctBoolean (boolean para true-false), shuffledWords (string[] para reorder), correctSentenceWords (string[] para reorder), matchingPairs (array de {left, right} para matching), explanation (string educativa).
            - Sempre retorne APENAS o JSON puro, sem markdown, sem explicações extras.
            - Se o usuário tem pontos fracos (${weakAreas?.join(', ') || 'nenhum'}), foque neles.
            - Os exercícios devem ser de nível ENEM (ensino médio), com linguagem clara e adequada.
            - Para matching, use 3 pares. Para reorder, use 4-6 palavras.`
          },
          {
            role: "user",
            content: `Gere ${count || 5} exercícios sobre "${chapterTitle}" para o ENEM, focando nos pontos fracos: ${weakAreas?.join(', ') || 'nenhum específico'}. Retorne apenas o JSON.`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter respondeu com status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
    let exercises;
    try {
      exercises = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) {
        exercises = JSON.parse(match[0]);
      } else {
        throw new Error("Could not parse exercises JSON");
      }
    }
    
    return res.json({ exercises });
  } catch (err: any) {
    console.error("AI exercise generation error:", err.message);
    return res.json({ exercises: null });
  }
});

app.post("/api/supabase/save-progress", async (req, res) => {
  const { progress } = req.body;
  const email = req.userEmail;
  if (!email || !progress) {
    return res.status(400).json({ error: "Progresso é necessário." });
  }

  if (!supabase) {
    return res.json({ success: false, message: "Supabase não está inicializado." });
  }

  const safeProgress = {
    chapters: progress?.chapters || [],
    xpPoints: typeof progress?.xpPoints === "number" ? progress.xpPoints : 0
  };

  try {
    const { data, error } = await supabase
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

  if (!supabase) {
    return res.json({ success: false, message: "Supabase não está configurado." });
  }

  try {
    const { data, error } = await supabase
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
  if (!supabaseAdmin) {
    return res.status(400).json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurado. Adicione ao .env para permitir setup automático." });
  }

  try {
    const { error } = await supabaseAdmin.rpc('setup_ApexEnem_progress');
    if (error && error.message?.includes('function "setup_ApexEnem_progress" does not exist')) {
      const testResult = await supabaseAdmin
        .from("ApexEnem_progress")
        .upsert(
          { email: "__setup_test__", progress: { setup: true }, updated_at: new Date().toISOString() },
          { onConflict: "email" }
        );

      if (testResult.error) {
        console.warn("Supabase setup test failed:", testResult.error.message);
        return res.status(500).json({ 
          error: "Erro ao configurar Supabase. Execute o SQL manualmente no Dashboard."
        });
      }

      await supabaseAdmin.from("ApexEnem_progress").delete().eq("email", "__setup_test__");
    }

    return res.json({ success: true, message: "Supabase configurado com sucesso!" });
  } catch (err: any) {
    console.error("Supabase setup error:", err.message);
    return res.status(500).json({ error: "Erro interno ao configurar Supabase." });
  }
});

app.get("/api/supabase/keep-alive", async (req, res) => {
  if (!supabase) {
    return res.json({ status: "supabase_not_configured" });
  }

  try {
    const { data, error } = await supabase
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

  const results = await Promise.allSettled(
    years.map(async (year) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const url = `https://api.enem.dev/v1/exams/${year}/questions?limit=50&offset=0`;
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
            statement: `(${q.title || `ENEM ${q.year} - Questão ${q.index}`})\n\n${q.context || ""}`,
            options: q.alternatives?.filter((a: any) => a.text).map((a: any) => ({
              letter: a.letter,
              text: a.text || ""
            })) || [],
            correctAnswer: q.correctAlternative,
            explanation: `Alternativa correta: ${q.correctAlternative}. ${q.alternatives?.find((a: any) => a.letter === q.correctAlternative)?.text || ""}`,
            year: q.year,
            index: q.index,
          }));
      } catch (err: any) {
        console.warn(`Failed to fetch year ${year}:`, err.message);
        return [];
      } finally {
        clearTimeout(timeoutId);
      }
    })
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

app.get("/api/credentials-status", (req, res) => {
  res.json({
    openRouter: !!apiKey,
    supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    supabaseAdmin: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    gemini: false
  });
});

app.get("/api/adsense-status", (_req, res) => {
  res.json({ configured: !!process.env.VITE_ADSENSE_PUBLISHER_ID });
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
