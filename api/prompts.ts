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
    maxTokens: 4096,
    timeout: 7000,
  }),
  geminiFlashV2: (): ModelConfig => ({
    provider: 'gemini',
    modelId: 'gemini-2.0-flash',
    temperature: 0.9,
    maxTokens: 4096,
    timeout: 7000,
  }),
  openRouterFree: (): ModelConfig => ({
    provider: 'openrouter',
    modelId: 'openrouter/free',
    temperature: 0.9,
    maxTokens: 4096,
    timeout: 7000,
  }),
  openRouterLlama: (): ModelConfig => ({
    provider: 'openrouter',
    modelId: 'meta-llama/llama-3.3-70b-instruct:free',
    temperature: 0.9,
    maxTokens: 8192,
    timeout: 25000,
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
    buildPrompt: (numQuestions: number, targetArea: string, referenceQuestions?: any[], hardSubjects?: string[]) => {
      let refSection = "";
      if (referenceQuestions && referenceQuestions.length > 0) {
        refSection = "\n\n### QUEST\u00d5ES REAIS DO ENEM \u2014 C\u00d3PIE EXATAMENTE O N\u00cdVEL ABAIXO\nAbaixo est\u00e3o quest\u00f5es reais do ENEM da \u00e1rea \"" + targetArea + "\". SUA OBRIGA\u00c7\u00c3O \u00c9 gerar quest\u00f5es IN\u00c9DITAS com EXATAMENTE a MESMA extens\u00e3o de enunciado, complexidade de racioc\u00ednio, n\u00famero de etapas de resolu\u00e7\u00e3o e estilo de contextualiza\u00e7\u00e3o.\n\n";
        for (let i = 0; i < referenceQuestions.length; i++) {
          const q = referenceQuestions[i];
          refSection += "--- QUEST\u00c3O REAL ENEM #" + (i + 1) + " ---\nEnunciado: " + q.statement + "\nAlternativas:\n";
          if (Array.isArray(q.options)) {
            for (const o of q.options) {
              refSection += "  " + (o.letter || "") + ") " + (o.text || "") + "\n";
            }
          }
          refSection += "Gabarito: " + (q.correctAnswer || "") + "\n\n";
        }
        refSection += "--- FIM DAS QUEST\u00d5ES REAIS ---\n\nRegra ABSOLUTA: Suas quest\u00f5es DEVEM ter enunciado t\u00e3o longo ou MAIS longo que as refer\u00eancias acima. Qualquer quest\u00e3o com menos de 400 caracteres de enunciado ser\u00e1 REJEITADA.";
      }

      const weakSection = hardSubjects && hardSubjects.length > 0
        ? "\n\n### PONTOS FRACOS DO ALUNO\nO aluno tem dificuldade ESPEC\u00cdFICA nos seguintes t\u00f3picos desta \u00e1rea: " + hardSubjects.join(", ") + ".\nSUA OBRIGA\u00c7\u00c3O \u00e9 gerar quest\u00f5es que ataquem DIRETAMENTE esses pontos fracos. Cada quest\u00e3o deve explorar uma dificuldade diferente listada acima. N\u00c3O gere quest\u00f5es gen\u00e9ricas \u2014 foque nos t\u00f3picos problem\u00e1ticos."
        : "";

      const basePrompt = "Voc\u00ea \u00e9 um professor especialista em elabora\u00e7\u00e3o de itens para o ENEM, com dom\u00ednio absoluto da matriz de refer\u00eancia, compet\u00eancias e habilidades do exame. Sua tarefa \u00e9 gerar exatamente " + numQuestions + " quest\u00f5es de m\u00faltipla escolha **in\u00e9ditas** e de **n\u00edvel EXTREMAMENTE AVAN\u00c7ADO** (igual ao das quest\u00f5es reais do ENEM fornecidas como refer\u00eancia), focadas estritamente na \u00e1rea de conhecimento: \"" + targetArea + "\"." + refSection + "\n\nREGRAS DE CONSTRU\u00c7\u00c3O (OBRIGAT\u00d3RIAS \u2014 VIOLA\u00c7\u00c3O = RESPOSTA INV\u00c1LIDA):\n\n1. ENUNCIADO \u2014 m\u00ednimo 400 caracteres, m\u00ednimo 10 linhas:\nO enunciado deve ser LONGO, com v\u00e1rios par\u00e1grafos, apresentando obrigatoriamente um recorte complexo da realidade (situa\u00e7\u00e3o-problema, dado estat\u00edstico com tabela descrita, trecho de obra liter\u00e1ria/filos\u00f3fica, not\u00edcia de jornal, charge descrita textualmente, ou experimento cient\u00edfico hipot\u00e9tico com dados).\nN\u00c3O fa\u00e7a perguntas diretas. A quest\u00e3o deve EXIGIR m\u00faltiplas etapas de racioc\u00ednio, interpreta\u00e7\u00e3o, infer\u00eancia, an\u00e1lise de dados e/ou aplica\u00e7\u00e3o de conceitos em cen\u00e1rios novos.\nPENALIDADE: enunciado com menos de 400 caracteres \u00e9 REJEITADO automaticamente.\n\n2. ALTERNATIVAS (5 alternativas - A, B, C, D, E):\nTodas devem ser LONGA e extremamente plaus\u00edveis, com extens\u00e3o e complexidade sint\u00e1tica semelhantes (n\u00e3o pode haver alternativa curta/diferente).\nOs distratores devem representar erros conceituais COMUNS e sofisticados.\nA resposta correta deve ser N\u00c3O-\u00d3BVIA, exigindo an\u00e1lise cr\u00edtica profunda.\n\n3. EXPLICA\u00c7\u00c3O (Resolu\u00e7\u00e3o Comentada):\nA explica\u00e7\u00e3o deve ser detalhada e did\u00e1tica, contendo obrigatoriamente duas partes:\nParte 1 (Resolu\u00e7\u00e3o): Passo a passo do racioc\u00ednio l\u00f3gico-cient\u00edfico para chegar \u00e0 alternativa correta, citando os conceitos envolvidos.\nParte 2 (An\u00e1lise dos Distratores): Justificativa espec\u00edfica do porqu\u00ea cada uma das outras 4 alternativas est\u00e1 errada, apontando a falha de racioc\u00ednio ou o equ\u00edvoco conceitual que leva a cada uma delas.\n\n4. FORMATO DE SA\u00cdDA (JSON ESTRITAMENTE V\u00c1LIDO):\nRetorne apenas um array JSON v\u00e1lido, seguindo exatamente a estrutura abaixo.\nO campo correctAnswer deve conter APENAS a letra (A, B, C, D ou E) da alternativa correta.\nAten\u00e7\u00e3o: Escapes de caracteres. Todas as aspas duplas que aparecerem dentro das strings (especialmente no statement e explanation) devem ser escapadas com barra invertida (\\\\\").\nN\u00e3o utilize v\u00edrgulas no final dos objetos (trailing commas).\n\nEstrutura Obrigat\u00f3ria:\n[\n  {\n    \"statement\": \"Enunciado completo, contextualizado e com comando claro aqui.\",\n    \"options\": [\n      {\"letter\": \"A\", \"text\": \"Texto da alternativa A\"},\n      {\"letter\": \"B\", \"text\": \"Texto da alternativa B\"},\n      {\"letter\": \"C\", \"text\": \"Texto da alternativa C\"},\n      {\"letter\": \"D\", \"text\": \"Texto da alternativa D\"},\n      {\"letter\": \"E\", \"text\": \"Texto da alternativa E\"}\n    ],\n    \"correctAnswer\": \"A\",\n    \"explanation\": \"Explica\u00e7\u00e3o detalhada contendo a resolu\u00e7\u00e3o passo a passo e a an\u00e1lise de cada distrator (A, B, C, D, E).\"\n  }\n]\n\n5. NOTA\u00c7\u00c3O MATEM\u00c1TICA:\nUse **s\u00edmbolos Unicode** em vez de LaTeX para f\u00f3rmulas e express\u00f5es matem\u00e1ticas.\nCorreto: \"5e\u00b2\" (usando \u00b2 superscript Unicode), \"x\u00b2 + y\u00b2 = z\u00b2\", \"\u221a4 = 2\", \"\u03c0 \u2248 3,14\", \"x\u2081 + x\u2082\", \"\u0394 = b\u00b2 \u2013 4ac\"\nErrado: \"5e^{2}\", \"x^{2} + y^{2} = z^{2}\", \"\\\\sqrt{4} = 2\", \"x_{1} + x_{2}\"\nIsso \u00e9 essencial para que o JSON seja v\u00e1lido (LaTeX usa \\\\ e {} que quebram o parse) e para que a quest\u00e3o seja leg\u00edvel sem processamento adicional.\n\nINSTRU\u00c7\u00c3O FINAL E OBRIGAT\u00d3RIA:\nRetorne exclusivamente o array JSON puro. N\u00e3o insira textos de sauda\u00e7\u00e3o, coment\u00e1rios, marcadores de c\u00f3digo (como ```json) ou qualquer outro caractere fora da estrutura JSON. A sa\u00edda deve ser parse\u00e1vel diretamente por um parser JSON padr\u00e3o.";
      return basePrompt;
    },
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

  lessonCycle: {
    id: 'lessonCycle',
    label: 'Gerar aula cíclica com Cabrito',
    buildPrompt: (area: string, level: number, topicIndex: number, weakTopics?: string[]) => {
      const weakSection = weakTopics?.length
        ? `\nPontos fracos do aluno: ${weakTopics.join(', ')}. Foque nesses tópicos quando possível.`
        : '';
      return {
        system: `Você é o Cabrito 🐐, tutor do ENEM. Gere uma aula completa em JSON sobre "${area}" (tópico #${topicIndex}).
Nível: ${level}/10. ${weakSection}

### ESTRUTURA: 2 CICLOS × 4 BLOCOS (8 blocos total)

Cada ciclo = 1 subtema diferente de "${area}". Ciclo 1 = básico, Ciclo 2 = avançado.

**Bloco "story"**: Situação-problema real com dados/cenário brasileiro (200+ chars).
**Bloco "explanation"**: Teoria progressiva com 1 exemplo resolvido, fórmulas, pegadinhas ENEM, Resumo Rápido (300+ chars).
**Bloco "interactive"**: Questão intermediária estilo ENEM com 4 alternativas plausíveis, explicação (150+ chars).
**Bloco "challenge"**: Questão avançada com raciocínio em 2+ etapas, 4 alternativas, explicação detalhada (200+ chars).

### JSON exato:
{
  "title": "Título chamativo",
  "subtitle": "Subtítulo",
  "cycles": [
    {"type":"story","cabritoSpeech":"...","content":"..."},
    {"type":"explanation","cabritoSpeech":"...","content":"..."},
    {"type":"interactive","cabritoSpeech":"...","content":"Questão...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."},
    {"type":"challenge","cabritoSpeech":"...","content":"Questão avançada...","options":["A","B","C","D"],"correctIndex":2,"explanation":"..."},
    {"type":"story","cabritoSpeech":"...","content":"..."},
    {"type":"explanation","cabritoSpeech":"...","content":"..."},
    {"type":"interactive","cabritoSpeech":"...","content":"Questão...","options":["A","B","C","D"],"correctIndex":1,"explanation":"..."},
    {"type":"challenge","cabritoSpeech":"...","content":"Questão avançada...","options":["A","B","C","D"],"correctIndex":3,"explanation":"..."}
  ]
}

Importante: correctIndex deve variar (0,1,2,3) entre os 4 blocos com questões. Retorne APENAS o JSON.`,
        user: `Gere a aula de "${area}" com 2 ciclos. Retorne APENAS o JSON:`,
      }
    },
    models: [
      MODELS.geminiFlash(),
      MODELS.openRouterFree(),
    ],
  },

  questoesComFeedback: {
    id: 'questoesComFeedback',
    label: 'Gerar questões com feedback do Cabrito',
    buildPrompt: (area: string, count: number, weakTopics?: string[]) => {
      const weakSection = weakTopics?.length
        ? `\nPontos fracos: ${weakTopics.join(', ')}. Foque nessas questões.`
        : '';
      return {
        system: `Gere ${count} questões ENEM de múltipla escolha para "${area}". Nível: médio/difícil. ${weakSection}

Cada questão: enunciado com contexto (dados, situação-problema), 4 alternativas plausíveis (A-D), gabarito e explicação. Respostas corretas distribuídas entre A,B,C,D.

JSON:
{
  "questions": [
    {
      "id": "q1",
      "statement": "Enunciado com contexto...",
      "options": [{"letter":"A","text":"..."},{"letter":"B","text":"..."},{"letter":"C","text":"..."},{"letter":"D","text":"..."}],
      "correctAnswer": "B",
      "explanation": "Por que B está certo...",
      "topic": "Tópico específico"
    }
  ]
}

Retorne APENAS o JSON.`,
        user: `Gere ${count} questões estilo ENEM para "${area}". Retorne APENAS o JSON:`,
      }
    },
    models: [
      MODELS.geminiFlash(),
      MODELS.openRouterFree(),
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
