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
      `Crie ${numQuestions} questões de múltipla escolha estilo ENEM de nível avançado sobre "${targetArea}".

REGRAS OBRIGATÓRIAS:
- Cada questão deve ter enunciado longo contextualizado (com dados, citação ou situação-problema)
- Exatamente 5 alternativas (A, B, C, D, E) por questão, todas plausíveis
- Resposta correta não-óbvia (não pode ser a primeira que vem à mente)
- Exigido: raciocínio, interpretação e análise
- Proibido: perguntas factuais, contas simples ou conhecimento direto
- Inclua explicação detalhada mostrando o raciocínio passo a passo

Formato JSON obrigatório:
[{"statement":"enunciado completo aqui","options":[{"letter":"A","text":"alternativa A"},{"letter":"B","text":"alternativa B"},{"letter":"C","text":"alternativa C"},{"letter":"D","text":"alternativa D"},{"letter":"E","text":"alternativa E"}],"correctAnswer":"A","explanation":"explicação detalhada"}]

IMPORTANTE: Retorne APENAS o array JSON. Sem texto antes ou depois.`,
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
