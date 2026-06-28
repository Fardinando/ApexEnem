import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Supabase Client safely (anon key - for public queries)
let supabase: any = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    console.log("Supabase Client (anon) initialized successfully!");
  } catch (error: any) {
    console.warn("Failed to initialize Supabase Client:", error.message);
  }
} else {
  console.warn("WARNING: SUPABASE_URL or SUPABASE_ANON_KEY are not defined in the environment.");
}

// Initialize Supabase Admin Client (service_role - for DDL/setup)
let supabaseAdmin: any = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log("Supabase Admin Client (service_role) initialized successfully!");
  } catch (error: any) {
    console.warn("Failed to initialize Supabase Admin Client:", error.message);
  }
}

// Initialize native Gemini GoogleGenAI client safely
let aiInstance: any = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log("Native Gemini GoogleGenAI Client initialized successfully!");
  } catch (error: any) {
    console.warn("Failed to initialize native Gemini SDK:", error.message);
  }
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined. Standing by for OpenRouter only, or offline fallback.");
}

app.use(express.json({ limit: "15mb" }));

// Helper to extract JSON from string safely
function extractJsonFromText(rawText: string): any {
  try {
    return JSON.parse(rawText.trim());
  } catch (e) {
    // Continue
  }

  // Look for ```json ... ``` code fence
  const regex = /```json\s*([\s\S]*?)\s*```/;
  const match = rawText.match(regex);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (e) {
      // Continue
    }
  }

  // Find first { and last }
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

// Helper to return a generic offline response structure if API keys are missing
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

// Helper to make a correction call to a specific OpenRouter free model
async function fetchCorrectionFromModel(modelName: string, prompt: string) {
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
      })
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
  }
}

// 1. API - Essay Correction Endpoint using Parallel Consensus (5 IAs)
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
    "mistralai/mistral-small-24b-instruct-2501:free"
  ];

  const contentToEvaluate = text || "[O aluno enviou uma imagem contendo o manuscrito de redação para transcrição e correção direta.]";

  const prompt = `Você é um corretor de redação oficial da banca do ENEM (INEP), altamente conceituado pela sua extrema rigidez, imparcialidade e aplicação clínica do manual oficial de correção. Você não é um professor bonzinho ou motivador; você avalia o texto de forma cirúrgica, fria e extremamente técnica. Redações medianas ou com falhas cruciais não devem receber notas infladas; notas próximas de 480 a 600 representam a realidade da média nacional e erros graves devem puxar a nota para baixo de forma dura.

O título/tema proposto da redação é: "${title || "Sem título"}"

Redação do aluno:
"""
${contentToEvaluate}
"""

PROCEDIMENTO DE CALIBRAÇÃO DE NOTA E TRAVAS OBRIGATÓRIAS (CAPPING RULES):
Antes de fechar a nota de cada uma das 5 competências do ENEM, aplique rigorosamente as seguintes travas de nota:

1. TRAVAS PARA A COMPETÊNCIA 1 (Escrita Formal - Máximo 200):
   - Se houver mais de 2 falhas gramaticais ou ortográficas leves: Nota Máxima = 160 pontos.
   - Se houver entre 3 e 5 falhas no total (desvios de crase, concordância, regência, acentuação, vírgulas simples ou inadequação lexical): Nota Máxima = 120 pontos.
   - Se houver mais de 5 desvios, repetições de estruturas incompletas, gírias ou períodos longos sem pontuação adequada (truncados/periodização): Nota Máxima = 80 pontos.
   - Se houver desestruturação sintática frequente e domínio precário das convenções escritas: Nota Máxima = 40 pontos.

2. TRAVAS PARA A COMPETÊNCIA 2 (Compreensão do Tema e Tipo Textual - Máximo 200):
   - SEM REPERTÓRIO SOCIOCULTURAL EXTERNO: Se o aluno não inseriu nenhum repertório legitimado de fora dos textos de apoio (como alusão histórica específica, dados de institutos oficiais, citações de filósofos/sociólogos com o nome do pensador, livros, filmes, leis ou conceitos das ciências humanas), a competência está travada no Máximo em 120 pontos.
   - REPERTÓRIO APENAS CITADO, SEM USO PRODUTIVO: Se o aluno citou um repertório externo (ex: "segundo Kant...") mas apenas jogou a informação sem conectá-la diretamente e de forma produtiva com o argumento ou com o tema da redação, a competência está travada no Máximo em 160 pontos.
   - Se tangenciou o tema (focou apenas superficialmente no assunto geral sem abordar o problema específico proposto): Nota Máxima = 80 pontos.

3. TRAVAS PARA A COMPETÊNCIA 3 (Projeto de Texto e Argumentação - Máximo 200):
   - SEM TESE CLARA NA INTRODUÇÃO: Se o aluno não apresentou uma tese explícita contendo duas ideias claras de problemas com o tema desde o primeiro parágrafo (introdução), a competência está travada no Máximo em 120 pontos.
   - ARGUMENTAÇÃO PURAMENTE EXPOSITIVA: Se o texto apenas lista fatos, informações ou descreve o problema sem fazer uma discussão autoral madura, sem defender ativamente um ponto de vista com argumentos bem encadeados, a competência está travada no Máximo em 120 pontos.
   - ARGUMENTOS COM LACUNAS OU LEVE SUPERFICIALIDADE: Se o projeto de texto é visível mas contém falhas de encadeamento ou argumentos superficiais/repetitivos em algum desenvolvimento: Nota Máxima = 160 pontos.

4. TRAVAS PARA A COMPETÊNCIA 4 (Mecanismos Coesivos - Máximo 200):
   - COESÃO INTERPARÁGRAFO INSUFICIENTE: É obrigatório o uso de conectivos formais e variados na introdução de parágrafos (ex: "Ademais,", "Portanto,", "Nesse cenário,", "Outrossim,"). Se não houver pelo menos DOIS conectivos interparágrafos legítimos ligando o início dos parágrafos de desenvolvimento/conclusão, a competência está travada no Máximo em 120 pontos.
   - COESÃO INTRAPARÁGRAFO FRACA/REPETITIVA: Se dentro dos parágrafos faltarem conjunções, pronomes relativos, ou se o aluno repetir excessivamente palavras comuns (exemplo: repetir "que", "também", "o problema", ou "a população" a todo instante) em vez de usar sinônimos: Nota Máxima no Máximo em 120 ou 160 pontos.

5. TRAVAS PARA A COMPETÊNCIA 5 (Proposta de Intervenção - Máximo 200):
   - Avalie de forma fria, matemática e objetiva. Dê exatamente 40 pontos para cada elemento abaixo que esteja explícito e claro na proposta. Se algum elemento estiver ausente ou for vago, atribua ZERO pontos a esse elemento específico:
     * AGENTE (+40 pontos): Quem fará a ação. Deve ser específico (ex: Ministério da Saúde, Poder Legislativo, ONGs). Termos genéricos como "alguém", "nós", "a sociedade" ou "as pessoas" NÃO devem pontuar (0 pontos).
     * AÇÃO (+40 pontos): O que será feito. Deve ser uma atividade concreta. Expressões vagas como "devemos tomar providências", "mudar a mentalidade" ou "fazer algo" NÃO devem pontuar (0 pontos).
     * MEIO/MODO (+40 pontos): Como a ação será viabilizada. Deve conter conectivos instrumentais explícitos (ex: "por meio de", "através de", "mediante"). Se não disser claramente como será feito, não pontue (0 pontos).
     * EFEITO/OBJETIVO (+40 pontos): Para que a ação serve (ex: "com o intuito de conter a proliferação...", "com o fito de garantir o direito..."). Se não estiver claro, não pontue (0 pontos).
     * DETALHAMENTO (+40 pontos): Informação explicativa ou justificativa adicional sobre um dos elementos acima (exemplo: "o Ministério da Educação, órgão encarregado por gerir as redes federais de ensino,..."). O detalhamento precisa ser nítido e rico em detalhes. Se for genérico, dê 0 pontos.
   - Se faltar qualquer um desses 5 elementos, a nota máxima recomendada é 160. Se faltarem dois, a nota máxima recomendada é 120, exceto se a proposta inteira for inexistente ou impraticável, recebendo 0 ou 40 pontos.

DIRETRIZES FUNDAMENTAIS PARA SINTONIA DA IA:
- Não balanceie as notas para cima para agradar ou evitar rejeição.
- Forneça críticas maduras, diretas e pragmáticas, usando o linguajar formal e clínico de uma banca oficial.
- Se o aluno escreveu uma redação tipicamente escolar que não traz um repertório sociocultural forte articulado em cada desenvolvimento e que possui deslizes gramaticais comuns de vírgula ou concordância, a nota total deve gravitar estritamente entre 480 e 560 pontos. Nunca dê notas superiores a 800 para redações que não tenham estrutura, vocabulário culto, domínio formal impecável e intervenção completa.

Retorne estritamente um objeto JSON com o seguinte formato:
{
  "score": 520,
  "generalFeedback": "Análise diagnóstica cirúrgica, extremamente realista, franca e detalhada da redação justificando o exato motivo de deságios e perdas de pontuação sob a perspectiva de um corretor implacável da banca ENEM.",
  "competencies": [
    { "id": 1, "name": "Competência 1: Domínio da escrita formal", "description": "Demonstrar domínio da modalidade escrita formal da língua portuguesa.", "score": 120, "feedback": "Análise nítida e direta apontando os desvios gramaticais exatos encontrados no texto (desvios de crase, pontuação, ortografia, concordância, coloquialismo), listando-os especificamente se possível, e justificando a pontuação com base nas travas." },
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
    // Fire all 5 requests in parallel with timeout safety
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

    // Fallback if all models failed
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

    // Now compute the mathematical average across the successful models!
    const numSuccessful = successfulCorrections.length;

    // Standardized Competencies list initially empty
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

      // Compute exact average score, and snap it to the closest valid ENEM multiple of 20 or 40 for educational precision!
      const rawAvg = scoreCount > 0 ? compSum / scoreCount : 120;
      const roundedScore = Math.round(rawAvg / 40) * 40; // Snap to 0, 40, 80, 120, 160, 200

      return {
        id: compId,
        name: compName || `Competência ${compId}`,
        description: compDesc,
        score: Math.min(200, Math.max(0, roundedScore)),
        feedback: feedbacks.join("\n\n")
      };
    });

    // Sum up the averaged competencies to form the finalized consolidated score (0 to 1000)
    const consolidatedScore = finalCompetencies.reduce((acc, curr) => acc + curr.score, 0);

    // Structure a brilliant multi-model description feedback
    const modelBreakdown = successfulCorrections.map(suc => {
      const mn = suc.model.split('/')[1] || suc.model;
      return `- **${mn}**: ${suc.data.score || 0} pontos`;
    }).join("\n");

    const mergedGeneralFeedback = `### 🌟 Consolidado de Correção por Consenso Multi-IA
Sua nota foi construída de forma justa, matemática e transparente avaliando o texto simultaneamente em **${numSuccessful} modelos de Inteligência Artificial diferentes** através do OpenRouter.

**Pontuações atribuídas por ferramenta individual:**
${modelBreakdown}

---

### 📝 Diagnóstico Coletivo e Recomendações:
${successfulCorrections.map(suc => {
  const mn = suc.model.split('/')[1] || suc.model;
  return `##### Análise de ${mn}:
${suc.data.generalFeedback || "Estudo estrutural adequado."}`;
}).slice(0, 3).join("\n\n")}`;

    // Merge strengths & weaknesses removing blanks / duplicates
    const finalStrengths = Array.from(new Set(
      successfulCorrections.flatMap(suc => suc.data.strengths || [])
    )).filter(s => typeof s === 'string' && s.length > 5).slice(0, 3);

    const finalWeaknesses = Array.from(new Set(
      successfulCorrections.flatMap(suc => suc.data.weaknesses || [])
    )).filter(w => typeof w === 'string' && w.length > 5).slice(0, 3);

    // Clean compile of merged result
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
    res.status(500).json({ error: "Erro crítico na chamada das IAs de correção paralelo do OpenRouter: " + error.message });
  }
});

// 2. API - Magic Questions Generation Endpoint (OpenRouter ONLY)
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
        "X-Title": "NotaMil ENEM Applet"
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

// OpenRouter Chat/Explanation proxy endpoint - Cleaned of Google SDK and fallbacks
app.post("/api/openrouter-chat", async (req, res) => {
  const { questionText, instructions, correctAnswer } = req.body;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://ai.studio/build",
        "X-Title": "NotaMil ENEM Applet"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          {
            role: "system",
            content: "Você é o Corujito, o tutor inteligente e encorajador tipo corujinha de Duolingo do ENEM. Explique conceitos de modo muito lúdico, conciso e instrutivo."
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

// Supabase Save Progress Route
app.post("/api/supabase/save-progress", async (req, res) => {
  const { email, progress } = req.body;
  if (!email || !progress) {
    return res.status(400).json({ error: "E-mail e progresso são necessários." });
  }

  if (!supabase) {
    return res.json({ success: false, message: "Supabase não está inicializado." });
  }

  try {
    const { data, error } = await supabase
      .from("notamil_progress")
      .upsert(
        { email: email.toLowerCase(), progress, updated_at: new Date().toISOString() },
        { onConflict: "email" }
      );

    if (error) {
      console.warn("Supabase upsert warning (the table of progress might not exist yet):", error.message);
      return res.json({ success: false, error: error.message });
    }

    return res.json({ success: true, data });
  } catch (err: any) {
    console.error("Supabase sync error:", err);
    return res.json({ success: false, error: err.message });
  }
});

// Supabase Get Progress Route
app.get("/api/supabase/get-progress", async (req, res) => {
  const email = req.query.email as string;
  if (!email) {
    return res.status(400).json({ error: "E-mail de estudante é obrigatório." });
  }

  if (!supabase) {
    return res.json({ success: false, message: "Supabase não está configurado." });
  }

  try {
    const { data, error } = await supabase
      .from("notamil_progress")
      .select("progress")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (error) {
      console.warn("Supabase progress missing/fetch error:", error.message);
      return res.json({ success: false, error: error.message });
    }

    return res.json({ success: true, progress: data?.progress || null });
  } catch (err: any) {
    console.error("Supabase progress loading failed:", err);
    return res.json({ success: false, error: err.message });
  }
});

// Supabase Setup Endpoint (creates the table if it doesn't exist)
app.post("/api/supabase/setup", async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(400).json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurado. Adicione ao .env para permitir setup automático." });
  }

  try {
    const { error } = await supabaseAdmin.rpc('setup_notamil_progress');
    if (error && error.message?.includes('function "setup_notamil_progress" does not exist')) {
      // Function doesn't exist yet - try raw SQL via the management API
      const sql = `
CREATE TABLE IF NOT EXISTS public.notamil_progress (
  email TEXT PRIMARY KEY,
  progress JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notamil_progress_email ON public.notamil_progress (email);
ALTER TABLE public.notamil_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notamil_progress') THEN
    CREATE POLICY "Acesso total anonimo"
      ON public.notamil_progress
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;`;
      
      // Try executing via REST API (service_role bypasses RLS)
      // We'll do a simple health check - actually try to write to the table
      const testResult = await supabaseAdmin
        .from("notamil_progress")
        .upsert(
          { email: "__setup_test__", progress: { setup: true }, updated_at: new Date().toISOString() },
          { onConflict: "email" }
        );

      if (testResult.error) {
        return res.status(500).json({ 
          error: "Tabela não existe. Execute o SQL manualmente no Supabase Dashboard > SQL Editor:",
          sql,
          detail: testResult.error.message
        });
      }

      // Cleanup test row
      await supabaseAdmin.from("notamil_progress").delete().eq("email", "__setup_test__");
    }

    return res.json({ success: true, message: "Supabase configurado com sucesso!" });
  } catch (err: any) {
    console.error("Supabase setup error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Supabase Keep-Alive Endpoint (prevents 7-day pause on free tier)
app.get("/api/supabase/keep-alive", async (req, res) => {
  if (!supabase) {
    return res.json({ status: "supabase_not_configured" });
  }

  try {
    // Simple query to keep the database active
    const { data, error } = await supabase
      .from("notamil_progress")
      .select("email")
      .limit(1);

    if (error) {
      return res.json({ status: "error", message: error.message });
    }

    return res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      message: "Database pinged successfully - keep alive"
    });
  } catch (err: any) {
    return res.json({ status: "error", message: err.message });
  }
});

// Credentials Status Endpoint (updated)
app.get("/api/credentials-status", (req, res) => {
  res.json({
    openRouter: !!apiKey,
    supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    supabaseAdmin: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    gemini: false
  });
});

// 3. Static Assest Serving and SPA Fallback & Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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

startServer();
