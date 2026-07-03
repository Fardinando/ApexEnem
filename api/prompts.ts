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
    timeout: 9500,
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
    maxTokens: 4096,
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
5. Sobre notação matemática:

Use **símbolos Unicode** em vez de LaTeX para fórmulas e expressões matemáticas.

Correto: "5e²" (usando ² superscript Unicode), "x² + y² = z²", "√4 = 2", "π ≈ 3,14", "x₁ + x₂", "Δ = b² – 4ac"

Errado: "5e^{2}", "x^{2} + y^{2} = z^{2}", "\\sqrt{4} = 2", "x_{1} + x_{2}"

Isso é essencial para que o JSON seja válido (LaTeX usa \\ e {} que quebram o parse) e para que a questão seja legível sem processamento adicional.

INSTRUÇÃO FINAL E OBRIGATÓRIA:
Retorne exclusivamente o array JSON puro. Não insira textos de saudação, comentários, marcadores de código (como \`\`\`json) ou qualquer outro caractere fora da estrutura JSON. A saída deve ser parseável diretamente por um parser JSON padrão.`,
    models: [
      MODELS.geminiFlash(),
      MODELS.openRouterFree(),
    ],
  },

  exercises: {
    id: 'exercises',
    label: 'Gerar exercícios de aprendizado',
    buildPrompt: (chapterTitle: string, chapterArea: string, weakAreas: string[], count: number) => {
      const system = `Você é um gerador de exercícios educacionais especialista na matriz do ENEM, com domínio pleno das competências, habilidades e critérios de elaboração de itens do exame.`

      const user = `Sua tarefa é gerar exatamente ${count || 3} exercícios **inéditos**, **variados** (ou seja, com tipos distintos entre si, salvo se a quantidade de questões exigir repetição) e de **nível avançado** (dificuldade 4 ou 5), rigorosamente alinhados ao tópico "${chapterTitle}", dentro da área de conhecimento "${chapterArea}".

**Foco obrigatório:** Os exercícios devem explorar **prioritariamente** os pontos fracos identificados: ${weakAreas?.join(', ') || 'conteúdo geral'}. Cada questão deve exigir raciocínio crítico, interpretação contextualizada e aplicação de conceitos, jamais memorização ou contas diretas.

---

### TIPOS DE EXERCÍCIO PERMITIDOS (escolha a combinação mais adequada para gerar variedade):

1. **\`choice\`** – Múltipla escolha padrão ENEM.
2. **\`true-false\`** – Questão de certo/errado com afirmação única e robusta.
3. **\`reorder\`** – Ordenação de etapas, eventos ou sequência lógica.
4. **\`matching\`** – Associação entre colunas (conceitos × definições, datas × eventos, etc.).

---

### REGRAS DE CONSTRUÇÃO POR TIPO (OBRIGATÓRIAS):

#### 1. PARA O TIPO \`choice\`:
- **Enunciado:** Longo, contextualizado e auto-suficiente (dados, citação, situação-problema, charge descrita ou experimento). Deve conter um comando claro no final.
- **Alternativas:** Exatamente 5 (A, B, C, D, E), todas **plausíveis**, com extensão e complexidade sintática semelhantes. Os distratores devem representar erros conceituais comuns ou interpretações equivocadas.
- **Correta:** Não óbvia, exigindo inferência ou análise profunda.
- **Explicação:** Obrigatoriamente dividida em:
  1. **Resolução passo a passo** – demonstração do raciocínio até a correta.
  2. **Análise de cada distrator** – justificativa específica do erro de cada uma das 4 alternativas incorretas.

#### 2. PARA O TIPO \`true-false\`:
- **Enunciado:** Deve apresentar uma **afirmação complexa** e contextualizada (não uma verdade óbvia). Pode ser uma interpretação de um gráfico, uma implicação de um texto filosófico, uma conclusão experimental, etc.
- **Alternativas:** Fixas e obrigatórias:
  - A) Certo
  - B) Errado
- **Correta:** A ou B, com justificativa baseada em evidências do enunciado.
- **Explicação:** Exposição detalhada dos argumentos que comprovam a veracidade ou falsidade da afirmação, citando conceitos e dados.

#### 3. PARA O TIPO \`reorder\`:
- **Enunciado:** Apresenta um processo, uma linha do tempo, uma cadeia de causa-efeito ou uma sequência de raciocínio lógico. O comando deve pedir a ordenação correta.
- **Itens:** Um array de objetos com \`id\` (numérico ou alfabético) e \`text\` (descrição de cada etapa/item). Mínimo de 4 itens.
- **Ordem correta:** Array contendo os \`id\`s na sequência exata esperada.
- **Explicação:** Detalhamento da lógica da sequência (cronológica, hierárquica, causal ou procedural) e por que outras ordens seriam inválidas.

#### 4. PARA O TIPO \`matching\`:
- **Enunciado:** Contextualiza um conjunto de elementos (ex: teorias, autores, fenômenos) que precisam ser associados a suas respectivas definições, características ou consequências.
- **Colunas:**
  - \`leftItems\`: array de objetos com \`id\` e \`text\` (elementos a serem associados).
  - \`rightItems\`: array de objetos com \`id\` e \`text\` (elementos que servirão de correspondência).
  - Tamanhos devem ser iguais ou, no máximo, a coluna da direita pode ter um item a mais como distrator (se for o caso, especifique no enunciado).
- **Correspondências corretas:** Um objeto mapeando cada \`id\` da esquerda para o \`id\` da direita correspondente.
- **Explicação:** Justificativa conceitual para cada par associado e, se houver distrator, explicação do porquê ele não se encaixa.

---

### REGRAS GERAIS (APLICÁVEIS A TODOS OS TIPOS):

- **Contextualização ENEM:** Todo enunciado deve remeter a uma situação real, texto, dado ou problema aplicado, evitando perguntas soltas ou puramente teóricas.
- **Nível Avançado:** As questões devem desafiar até mesmo alunos bem-preparados, exigindo articulação entre múltiplos conceitos.
- **Foco nos pontos fracos:** O conteúdo e a abordagem de cada questão devem, prioritariamente, atacar as deficiências listadas em ${weakAreas?.join(', ') || 'conteúdo geral'}.
- **Originalidade:** Questões absolutamente inéditas – não copie ou adapte superficialmente itens existentes.

---

### FORMATO DE SAÍDA (JSON ESTRITAMENTE VÁLIDO):

Retorne **apenas um array JSON** contendo os objetos das questões. Cada objeto **deve** conter obrigatoriamente os campos:

- \`"type"\`: string – um dos valores: \`"choice"\`, \`"true-false"\`, \`"reorder"\`, \`"matching"\`.
- \`"statement"\`: string – enunciado completo (com escape de aspas duplas internas).
- \`"explanation"\`: string – explicação detalhada (com escape de aspas duplas internas).
- E, **dependentes do tipo**, os campos específicos conforme os exemplos abaixo.

**Exemplos de estrutura por tipo (use como referência exata):**

**Para \`choice\`:**
\`\`\`json
{
  "type": "choice",
  "statement": "Enunciado contextualizado...",
  "options": [
    {"letter": "A", "text": "Texto da A"},
    {"letter": "B", "text": "Texto da B"},
    {"letter": "C", "text": "Texto da C"},
    {"letter": "D", "text": "Texto da D"},
    {"letter": "E", "text": "Texto da E"}
  ],
  "correctAnswer": "A",
  "explanation": "Resolução: ... Análise dos distratores: A) ... B) ... C) ... D) ... E) ..."
}
\`\`\`

**Para \`true-false\`:**
\`\`\`json
{
  "type": "true-false",
  "statement": "Afirmação contextualizada complexa...",
  "options": [
    {"letter": "A", "text": "Certo"},
    {"letter": "B", "text": "Errado"}
  ],
  "correctAnswer": "A",
  "explanation": "Justificativa completa da veracidade ou falsidade..."
}
\`\`\`

**Para \`reorder\`:**
\`\`\`json
{
  "type": "reorder",
  "statement": "Contexto e comando para ordenar...",
  "items": [
    {"id": "1", "text": "Item 1"},
    {"id": "2", "text": "Item 2"},
    {"id": "3", "text": "Item 3"}
  ],
  "correctOrder": ["2", "1", "3"],
  "explanation": "Explicação da ordem correta..."
}
\`\`\`

**Para \`matching\`:**
\`\`\`json
{
  "type": "matching",
  "statement": "Contexto e comando para associar...",
  "leftItems": [
    {"id": "1", "text": "Conceito A"},
    {"id": "2", "text": "Conceito B"}
  ],
  "rightItems": [
    {"id": "a", "text": "Definição 1"},
    {"id": "b", "text": "Definição 2"}
  ],
  "correctMatches": {"1": "a", "2": "b"},
  "explanation": "Explicação de cada associação..."
}
\`\`\`

INSTRUÇÃO FINAL E OBRIGATÓRIA:
Retorne exclusivamente o array JSON puro.

Não adicione texto introdutório, conclusivo, marcadores de código (ex: \`\`\`json) ou qualquer caractere fora da estrutura JSON.

Não utilize vírgulas no final dos objetos ou arrays (trailing commas).

A saída deve ser parseável diretamente por um parser JSON padrão.`
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
      const system = `Você é um corretor oficial do ENEM, com vasta experiência na aplicação da matriz de referência para correção de redações. Seu papel é analisar redações de forma rigorosa, justa e profundamente didática, seguindo os mesmos critérios utilizados pelos corretores oficiais do exame.`

      const user = `### REDAÇÃO PARA CORREÇÃO

**Título:** ${title || "Sem título"}

---

**Texto da redação:**

${contentToEvaluate}

---

### INSTRUÇÕES DE CORREÇÃO

Avalie a redação de acordo com as **5 competências do ENEM**, atribuindo uma nota de **0 a 200 pontos** para cada uma (totalizando 0 a 1000 pontos). Seja rigoroso(a) e detalhista, seguindo os parâmetros oficiais abaixo.

---

### COMPETÊNCIA 1 — Domínio da modalidade escrita formal da Língua Portuguesa (0–200 pts)

**O que avaliar:**
- Desvios gramaticais: ortografia, acentuação, regência, concordância (nominal e verbal), crase, pontuação.
- Estrutura sintática: frases claras e completas, períodos bem construídos.
- Registro formal: ausência de marcas de oralidade, gírias ou coloquialismos inadequados.

**Faixas de pontuação:**
- 160–200: Excelente domínio, pouquíssimos ou nenhum desvio.
- 120–159: Bom domínio, alguns desvios que não comprometem a compreensão.
- 80–119: Domínio mediano, desvios frequentes mas ainda compreensível.
- 40–79: Domínio insuficiente, muitos desvios comprometendo a legibilidade.
- 0–39: Domínio muito precário, erros graves e generalizados.

---

### COMPETÊNCIA 2 — Compreensão da proposta e aplicação dos conceitos das várias áreas de conhecimento (0–200 pts)

**O que avaliar:**
- Compreensão do tema proposto: a redação aborda o tema central sem tangenciamentos ou fuga?
- Repertório sociocultural: uso de citações, dados históricos, referências literárias, filosóficas, artísticas, científicas ou culturais.
- Pertinência: o repertório é legitimamente relacionado ao tema ou é artificial ("coringa")?

**Faixas de pontuação:**
- 160–200: Excelente desenvolvimento do tema com repertório diverso, pertinente e bem integrado.
- 120–159: Bom desenvolvimento, repertório adequado mas pouco diverso.
- 80–119: Desenvolvimento mediano, repertório superficial ou parcialmente pertinente.
- 40–79: Desenvolvimento insuficiente, tangenciamento do tema ou repertório inadequado.
- 0–39: Fuga total ao tema ou repertório inexistente/irrelevante.

---

### COMPETÊNCIA 3 — Seleção, relação, organização e interpretação de informações, fatos, opiniões e argumentos em defesa de um ponto de vista (0–200 pts)

**O que avaliar:**
- Tese clara: há um posicionamento explícito e consistente ao longo do texto?
- Argumentação: os argumentos são relevantes, bem fundamentados e articulados entre si?
- Progressão textual: as ideias evoluem de forma lógica, com encadeamento coerente.
- Relação com o repertório: os argumentos dialogam com as referências apresentadas.

**Faixas de pontuação:**
- 160–200: Excelente estrutura argumentativa, tese clara, argumentos robustos e progressão lógica impecável.
- 120–159: Boa argumentação, tese presente, mas com lapsos pontuais de articulação.
- 80–119: Argumentação mediana, tese frágil ou argumentos pouco desenvolvidos.
- 40–79: Argumentação insuficiente, predomínio de opiniões sem fundamento ou contradições.
- 0–39: Ausência de argumentação ou texto meramente opinativo/desorganizado.

---

### COMPETÊNCIA 4 — Conhecimento dos mecanismos linguísticos necessários para a construção da argumentação (0–200 pts)

**O que avaliar:**
- Coesão textual: uso adequado de conectivos, pronomes, elipses, sinônimos e outros mecanismos de coesão.
- Progressão referencial: retomada correta de termos, sujeitos e ideias ao longo do texto.
- Variedade de recursos coesivos: não repete sempre os mesmos conectivos ("além disso", "portanto", "dessa forma").

**Faixas de pontuação:**
- 160–200: Excelente uso de mecanismos coesivos, variedade e precisão na articulação das ideias.
- 120–159: Bom uso, coesão presente mas com repetições ou deslizes pontuais.
- 80–119: Uso mediano, coesão básica com pouca variedade de recursos.
- 40–79: Uso insuficiente, problemas de coesão que comprometem a fluidez.
- 0–39: Ausência de coesão, texto fragmentado ou incompreensível.

---

### COMPETÊNCIA 5 — Elaboração de proposta de intervenção para o problema abordado, com respeito aos direitos humanos (0–200 pts)

**O que avaliar:**
- Presença de proposta de intervenção explícita.
- Elementos obrigatórios: **agente** (quem executa), **ação** (o que fazer), **meio** (como fazer), **finalidade** (para que fazer), **detalhamento** (modo, contexto ou justificativa).
- Viabilidade: a proposta é concreta e exequível?
- Respeito aos Direitos Humanos: a proposta não fere princípios fundamentais (dignidade, liberdade, igualdade).

**Faixas de pontuação:**
- 160–200: Proposta excelente, com todos os elementos bem desenvolvidos, viável e alinhada aos DH.
- 120–159: Boa proposta, com a maioria dos elementos presentes, mas carece de detalhamento.
- 80–119: Proposta mediana, elementos incompletos ou genéricos.
- 40–79: Proposta insuficiente, mencionada de forma vaga ou sem elementos essenciais.
- 0–39: Ausência de proposta ou proposta que fere os Direitos Humanos.

---

### FORMATO DE SAÍDA (JSON ESTRITAMENTE VÁLIDO)

Retorne **exclusivamente** um objeto JSON com a seguinte estrutura (sem texto antes ou depois):

\`\`\`json
{
  "totalScore": 640,
  "competencies": {
    "c1": {
      "score": 160,
      "feedback": "Análise detalhada do desempenho na Competência 1, apontando acertos e desvios específicos.",
      "strengths": ["Pontos fortes observados na C1"],
      "weaknesses": ["Pontos a melhorar na C1"]
    },
    "c2": {
      "score": 120,
      "feedback": "Análise detalhada do desempenho na Competência 2.",
      "strengths": [],
      "weaknesses": []
    },
    "c3": {
      "score": 120,
      "feedback": "Análise detalhada do desempenho na Competência 3.",
      "strengths": [],
      "weaknesses": []
    },
    "c4": {
      "score": 120,
      "feedback": "Análise detalhada do desempenho na Competência 4.",
      "strengths": [],
      "weaknesses": []
    },
    "c5": {
      "score": 120,
      "feedback": "Análise detalhada do desempenho na Competência 5.",
      "strengths": [],
      "weaknesses": []
    }
  },
  "overallFeedback": "Parecer geral sobre a redação, apontando o que o aluno fez bem e o que precisa melhorar para aumentar a nota. Seja construtivo e específico.",
  "strengths": [
    "Resumo dos principais pontos fortes do texto"
  ],
  "weaknesses": [
    "Resumo dos principais pontos fracos do texto"
  ]
}
\`\`\`

### DIRETRIZES FINAIS

1. **Seja rigoroso(a), mas construtivo(a):** Aponte os erros com clareza, mas sempre ofereça uma orientação de como o aluno pode melhorar.
2. **Feedback específico:** Não use frases genéricas. Mencione trechos ou aspectos concretos da redação.
3. **Coerência entre as notas:** A soma das 5 competências deve ser igual ao \`totalScore\`.
4. **Escapes:** Todas as aspas duplas dentro das strings devem ser escapadas com \\".
5. **Sem texto extra:** Retorne **apenas o objeto JSON**. Sem saudação, comentários, marcadores de código ou texto adicional.

A saída deve ser parseável diretamente por um parser JSON padrão.`
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
