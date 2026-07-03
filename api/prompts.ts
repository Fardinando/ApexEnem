export interface ModelConfig {
  provider: 'gemini' | 'openrouter'
  modelId: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  timeout?: number
}

export interface PromptDefinition {
  id: string
  label: string
  buildPrompt: (...args: any[]) => string | { system: string; user: string }
  models: ModelConfig[]
}

const MODELS = {
  geminiFlash: (): ModelConfig => ({
    provider: 'gemini',
    modelId: 'gemini-2.5-flash',
    temperature: 0.9,
    maxTokens: 8192,
    timeout: 7000,
  }),
  geminiFlashV2: (): ModelConfig => ({
    provider: 'gemini',
    modelId: 'gemini-2.0-flash',
    temperature: 0.9,
    maxTokens: 8192,
    timeout: 7000,
  }),
  openRouterFree: (): ModelConfig => ({
    provider: 'openrouter',
    modelId: 'openrouter/free',
    temperature: 0.9,
    maxTokens: 2048,
    timeout: 9900,
  }),
  openRouterLlama: (): ModelConfig => ({
    provider: 'openrouter',
    modelId: 'meta-llama/llama-3.2-3b-instruct:free',
    temperature: 0.9,
    maxTokens: 2048,
    timeout: 9900,
  }),
  openRouterChat: (): ModelConfig => ({
    provider: 'openrouter',
    modelId: 'openrouter/free',
    temperature: 0.7,
    maxTokens: 512,
    timeout: 9900,
  }),
  openRouterCorrection: (): ModelConfig => ({
    provider: 'openrouter',
    modelId: 'openrouter/free',
    temperature: 0.3,
    maxTokens: 4096,
    timeout: 9000,
  }),
}

export const PROMPTS: Record<string, PromptDefinition> = {
  questions: {
    id: 'questions',
    label: 'Gerar questões estilo ENEM',
    buildPrompt: (numQuestions: number, targetArea: string) =>
      `Você é um professor especialista em elaboração de itens para o ENEM, com domínio absoluto da matriz de referência, competências e habilidades do exame. Sua tarefa é gerar exatamente ${numQuestions} questões de múltipla escolha **inéditas**, de **nível avançado** (grau de dificuldade 4 ou 5 na escala ENEM), focadas estritamente na área de conhecimento: "${targetArea}".

REGRAS DE CONSTRUÇÃO (OBRIGATÓRIAS):

1. Sobre o Enunciado:

O enunciado deve ser longo, contextualizado e auto-suficiente, apresentando obrigatoriamente um recorte da realidade (situação-problema, dado estatístico, trecho de obra literária/filosófica, notícia de jornal, charge descrita textualmente, ou experimento científico hipotético).

Evite perguntas diretas ou factoides. A questão deve exigir interpretação, inferência, análise de dados ou aplicação de conceitos em cenários novos.

2. Sobre as Alternativas (5 alternativas - A, B, C, D, E):

Todas as alternativas devem ser extremamente plausíveis, com extensão e complexidade sintática semelhantes, para não levantar suspeitas pela forma.

Os distratores (alternativas erradas) devem representar erros conceituais comuns ou interpretações equivocadas que um aluno bem-preparado, mas desatento, poderia cometer.

A resposta correta deve ser não-óbvia, exigindo raciocínio crítico para ser identificada.

3. Sobre a Explicação (Resolução Comentada):

A explicação deve ser detalhada e didática, contendo obrigatoriamente duas partes:

Parte 1 (Resolução): Passo a passo do raciocínio lógico-científico para chegar à alternativa correta, citando os conceitos envolvidos.

Parte 2 (Análise dos Distratores): Justificativa específica do porquê cada uma das outras 4 alternativas está errada, apontando a falha de raciocínio ou o equívoco conceitual que leva a cada uma delas.

4. Sobre o Formato de Saída (JSON ESTRITAMENTE VÁLIDO):

Retorne apenas um array JSON válido, seguindo exatamente a estrutura abaixo.

O campo "correctAnswer" deve conter APENAS a letra (A, B, C, D ou E) da alternativa correta.

Atenção: Escapes de caracteres. Todas as aspas duplas (") que aparecerem dentro das strings (especialmente no statement e explanation) devem ser escapadas com barra invertida (\\").

Não utilize vírgulas no final dos objetos (trailing commas).

Estrutura Obrigatória:

json
[
  {
    "statement": "Enunciado completo, contextualizado e com comando claro aqui.",
    "options": [
      {"letter": "A", "text": "Texto da alternativa A"},
      {"letter": "B", "text": "Texto da alternativa B"},
      {"letter": "C", "text": "Texto da alternativa C"},
      {"letter": "D", "text": "Texto da alternativa D"},
      {"letter": "E", "text": "Texto da alternativa E"}
    ],
    "correctAnswer": "A",
    "explanation": "Explicação detalhada contendo a resolução passo a passo e a análise de cada distrator (A, B, C, D, E)."
  }
]
INSTRUÇÃO FINAL E OBRIGATÓRIA:
Retorne exclusivamente o array JSON puro. Não insira textos de saudação, comentários, marcadores de código (como \`\`\`json) ou qualquer outro caractere fora da estrutura JSON. A saída deve ser parseável diretamente por um parser JSON padrão.`,
    models: [
      MODELS.geminiFlash(),
      MODELS.openRouterFree(),
      MODELS.openRouterLlama(),
      MODELS.geminiFlashV2(),
    ],
  },

  exercises: {
    id: 'exercises',
    label: 'Gerar exercícios de aprendizado',
    buildPrompt: (chapterTitle: string, chapterArea: string, weakAreas: string[], count: number) => {
      const system = `Você é um gerador de exercícios educacionais para o ENEM. Gere ${count || 3} exercícios variados sobre "${chapterTitle}" (área: ${chapterArea}).
Tipos permitidos: 'choice', 'true-false', 'reorder', 'matching'.
Foque nos pontos fracos: ${weakAreas?.join(', ') || 'conteúdo geral'}.
Retorne APENAS JSON array.`
      const user = `Gere ${count || 3} exercícios sobre "${chapterTitle}" para o ENEM.`
      return { system, user }
    },
    models: [
      MODELS.openRouterFree(),
      MODELS.openRouterLlama(),
    ],
  },

  chat: {
    id: 'chat',
    label: 'Explicação motivacional (Cabrito)',
    buildPrompt: (questionText: string, instructions: string, correctAnswer: string) =>
      `Explique de forma motivadora este exercício para mim:
Pergunta: "${questionText}"
Tipo: "${instructions}"
Gabarito: "${correctAnswer}"

Retorne 2-3 parágrafos curtos, lúdicos e didáticos com emojis de cabrito 🐐.`,
    models: [
      MODELS.openRouterChat(),
    ],
  },

  correction: {
    id: 'correction',
    label: 'Correção de redação ENEM',
    buildPrompt: (title: string, contentToEvaluate: string) => {
      const system = `Você é um corretor oficial do ENEM. Retorne APENAS o JSON de avaliação.`
      const user = `Título: "${title || "Sem título"}"

Redação:
${contentToEvaluate}

Avalie segundo as 5 competências do ENEM e retorne JSON com score, feedback, competencies, strengths e weaknesses.`
      return { system, user }
    },
    models: [
      MODELS.openRouterCorrection(),
    ],
  },
}

export function getLoadingMessages(): string[] {
  return [
    'Consultando os maiores especialistas do Enem…',
    'Analisando questões de provas anteriores…',
    'Preparando desafios personalizados…',
    'A IA está estudando o edital do Enem…',
    'Calculando a melhor rota de estudos…',
    'Revisando os tópicos mais cobrados…',
    'Elaborando enunciados no estilo Enem…',
    'Separando alternativas certas das pegadinhas…',
    'Montando um simulado sob medida…',
    'Buscando questões inéditas…',
    'Preparando o gabarito comentado…',
    'Organizando competências e habilidades…',
    'Criando situações-problema contextualizadas…',
    'Equilibrando o nível de dificuldade…',
    'Preparando explicações detalhadas…',
  ]
}

export function getKeySwitchMessages(): string[] {
  return [
    '🔄 Esta chave esgotou o limite. Buscando rota alternativa…',
    '🔄 Redirecionando para outro servidor de IA…',
    '🔑 Quota excedida. Acionando chave reserva…',
    '🔄 Trocando de canal para acelerar o processo…',
    '⚡ Servidor ocupado. Conectando em outro nó…',
    '🔄 Falha na chave anterior. Iniciando failover…',
    '⚡ Redundância ativada. Tentando próximo endpoint…',
    '🔄 Balanceador de carga redirecionando requisição…',
    '🔑 Chave esgotada. Gatilho de recuperação acionado!',
  ]
}
