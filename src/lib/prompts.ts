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
  buildPrompt: (...args: any[]) => string
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
- Exatamente 5 alternativas (A, B, C, D, E) por questão
- Todas as alternativas devem ser plausíveis e bem escritas
- Resposta correta não-óbvia
- Evite perguntas factuais ou contas simples
- Exigido: raciocínio, interpretação, análise
- Inclua uma explicação detalhada mostrando o raciocínio

Formato JSON obrigatório:
[{"statement":"enunciado completo aqui","options":[{"letter":"A","text":"texto da alternativa A"},{"letter":"B","text":"texto da alternativa B"},{"letter":"C","text":"texto da alternativa C"},{"letter":"D","text":"texto da alternativa D"},{"letter":"E","text":"texto da alternativa E"}],"correctAnswer":"A","explanation":"explicação detalhada aqui"}]

Retorne APENAS o JSON, sem texto adicional, sem markdown.`,
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
      const systemMsg = `Você é um gerador de exercícios educacionais para o ENEM. Gere ${count || 3} exercícios no formato JSON sobre "${chapterTitle}" (área: ${chapterArea}).
Os exercícios DEVEM ser variados entre os tipos: 'choice', 'true-false', 'reorder', 'matching'.
Sempre retorne APENAS o JSON array, sem markdown.
Se o usuário tem pontos fracos (${weakAreas?.join(', ') || 'nenhum'}), foque neles.`

      const userMsg = `Gere ${count || 3} exercícios sobre "${chapterTitle}" para o ENEM, focando nos pontos fracos: ${weakAreas?.join(', ') || 'nenhum específico'}. Retorne apenas o JSON.`

      return JSON.stringify({ system: systemMsg, user: userMsg })
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
      `Por favor, explique de forma motivadora este exercício para mim:
Exercício/Pergunta: "${questionText}"
Tipo do desafio: "${instructions}"
Gabarito Oficial: "${correctAnswer}"

Retorne 2-3 parágrafos curtos, lúdicos e didáticos adicionando emojis de cabrito 🐐 e símbolos de livros.`,
    models: [
      MODELS.openRouterChat(),
    ],
  },

  correction: {
    id: 'correction',
    label: 'Correção de redação ENEM',
    buildPrompt: (title: string, contentToEvaluate: string) => {
      const systemPrompt = `Você é um corretor oficial do ENEM. Retorne APENAS o JSON de avaliação estrito sem rodeios nem introduções estruturado exatamente como solicitado.`
      const userPrompt = `O título/tema proposto da redação é: "${title || "Sem título"}"

Redação do aluno:
"""
${contentToEvaluate}
"""

CRITÉRIOS OFICIAIS DO ENEM 2025 (CARTILHA DO PARTICIPANTE) - Use EXATAMENTE estes níveis:
... [critérios completos] ...

PROCEDIMENTO DE CALIBRAÇÃO DE NOTA E TRAVAS OBRIGATÓRIAS (CAPPING RULES):
Aplique rigorosamente as travas abaixo ANTES de definir a nota final de cada competência:
... [travas completas] ...`

      return JSON.stringify({ system: systemPrompt, user: userPrompt })
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
    'Preparando desafios personalizados para você…',
    'A IA está estudando o edital do Enem…',
    'Calculando a melhor rota de estudos…',
    'Revisando os tópicos mais cobrados…',
    'Afiando os lápis e preparando as questões…',
    'Conectando com o banco de questões da IA…',
    'Elaborando enunciados no estilo Enem…',
    'Separando as alternativas certas das pegadinhas…',
    'A inteligência artificial está aquecendo os neurônios…',
    'Montando um simulado sob medida para você…',
    'Buscando questões inéditas nos arquivos da IA…',
    'Preparando o gabarito comentado…',
    'Organizando as competências e habilidades…',
    'A IA está revisando a Cartilha do Participante…',
    'Criando situações-problema contextualizadas…',
    'Equilibrando o nível de dificuldade das questões…',
    'A IA está calibrando os descritores…',
    'Preparando explicações detalhadas para cada questão…',
    'Ajustando a curva de aprendizado…',
    'A IA está mergulhada nos dados do INEP…',
    'Cruzando referências com o banco do Enem…',
    'Preparando o terreno para você gabaritar…',
  ]
}

export function getKeySwitchMessages(): string[] {
  return [
    'Esta chave esgotou o limite. Buscando rota alternativa… 🔄',
    'Redirecionando para outro servidor de IA…',
    'Achou que era só uma chave? Temos backup! 🔑',
    'Quota excedida. Acionando plano de contingência…',
    'Trocando de canal para acelerar o processo…',
    'Servidor ocupado. Conectando em outro nó…',
    'Falha na chave anterior. Iniciando failover… ⚡',
    'Redundância ativada. Tentando próximo endpoint…',
    'Balanceador de carga redirecionando requisição…',
    'Chave esgotada. Gatilho de recuperação acionado! 🔄',
  ]
}
