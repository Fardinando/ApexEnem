const GEMINI_KEY = process.env.GOOGLE_API_KEY || '';
const GROQ_KEY = process.env.GROQ_API_KEY || '';
const OPENROUTER_KEYS = [
  process.env.OPENROUTER_API_KEY,
  process.env.OPENROUTER_API_KEY_V1,
  process.env.OPENROUTER_API_KEY_V2,
  process.env.OPENROUTER_API_KEY_V3,
  process.env.OPENROUTER_API_KEY_V4,
  process.env.OPENROUTER_API_KEY_V5,
].filter(Boolean) as string[];

let orIdx = 0;
function nextOrKey(): string {
  if (!OPENROUTER_KEYS.length) return '';
  const k = OPENROUTER_KEYS[orIdx % OPENROUTER_KEYS.length];
  orIdx++;
  return k;
}

function parseLessonJson(content: string): any | null {
  const c = content.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    const p = JSON.parse(c);
    if (p.title && Array.isArray(p.cycles) && p.cycles.length >= 4) return p;
  } catch {
    const m = c.match(/\{[\s\S]*\}/);
    if (m) { try { const p = JSON.parse(m[0]); if (p.title && Array.isArray(p.cycles)) return p; } catch {} }
  }
  return null;
}

async function geminiCall(prompt: string, maxTokens: number, timeoutMs: number): Promise<string | null> {
  if (!GEMINI_KEY) return null;
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
        generationConfig: { temperature: 0.85, maxOutputTokens: maxTokens },
      }),
      signal: ctrl.signal,
    });
    clearTimeout(tid);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch { clearTimeout(tid); return null; }
}

async function openrouterCall(key: string, systemPrompt: string, userPrompt: string, maxTokens: number, timeoutMs: number): Promise<string | null> {
  if (!key) return null;
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'HTTP-Referer': 'https://apexenem.vercel.app', 'X-Title': 'ApexEnem' },
      body: JSON.stringify({ model: 'openrouter/free', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: maxTokens, temperature: 0.85 }),
      signal: ctrl.signal,
    });
    clearTimeout(tid);
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { clearTimeout(tid); return null; }
}

async function groqCall(systemPrompt: string, userPrompt: string, maxTokens: number, timeoutMs: number): Promise<string | null> {
  if (!GROQ_KEY) return null;
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: maxTokens, temperature: 0.85 }),
      signal: ctrl.signal,
    });
    clearTimeout(tid);
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { clearTimeout(tid); return null; }
}

async function tryOpenRouter(systemPrompt: string, userPrompt: string, maxTokens: number, timeoutMs: number): Promise<string | null> {
  const key = nextOrKey();
  return openrouterCall(key, systemPrompt, userPrompt, maxTokens, timeoutMs);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { area, level, weakTopics, topicIndex } = req.body;
    if (!area) return res.status(400).json({ error: 'area is required' });

    const topicNum = typeof topicIndex === 'number' ? topicIndex : Math.floor(Math.random() * 100);
    const weakSection = weakTopics?.length ? `\nPontos fracos do aluno: ${weakTopics.join(', ')}. Foque nesses tópicos quando possível.` : '';
    const areaContext: Record<string, string> = {
      'Matemática': 'Matemática do ENEM: Álgebra, Geometria (plana, espacial, analítica), Trigonometria, Estatística, Probabilidade, Funções, Números e Operações.',
      'Natureza': 'Ciências da Natureza do ENEM: Física (mecânica, ótica, eletromagnetismo), Química (ligações, estequiometria, orgânica), Biologia (genética, ecologia, citologia).',
      'Humanas': 'Ciências Humanas do ENEM: História do Brasil e Mundial, Geografia (clima, população, urbanização), Filosofia, Sociologia, Atualidades.',
      'Linguagens': 'Linguagens e Códigos do ENEM: Interpretação de textos (literários e não-literários), gramática (sintaxe, concordância, regência, ortografia), figurino de linguagem, gêneros textuais, oralidade, literatura brasileira, língua inglesa e espanhola.',
      'Redação': 'Redação do ENEM: 5 competências (domínio da norma culta, compreensão da proposta, seleção de argumentos, conhecimento dos mecanismos linguísticos, proposta de intervenção). Estrutura: introdução, desenvolvimento, conclusão. Teses, argumentos, coesão.',
    };
    const context = areaContext[area] || `ENEM: tópicos de "${area}".`;

    const systemPrompt = `Você é o Cabrito 🐐, tutor do ENEM. Gere uma aula completa em JSON sobre "${area}" (tópico #${topicNum}).
Área: ${context}
Nível: ${level || 5}/10. ${weakSection}

### ESTRUTURA: 3 CICLOS × 6 BLOCOS (18 blocos total)

Cada ciclo = 1 subtema diferente. Ciclo 1 = básico, Ciclo 2 = intermediário, Ciclo 3 = avançado.

Cada ciclo tem EXATAMENTE 6 blocos:
**story**: Situação-problema REAL e DETALHADA com dados, cenário brasileiro, personagens, narrativa com começo, meio e fim (700-1000+ chars).
**explanation**: Teoria COMPLETA: definições, fórmulas, leis, exemplo resolvido passo a passo, Resumo Rápido, pegadinhas ENEM (800-1100+ chars).
**interactive**: Questão intermediária estilo ENEM com enunciado longo, 4 alternativas, explicação detalhada (400-600+ chars).
**explanation**: Aprofundamento — erros comuns, o que a banca espera, conexões, dicas de prova (700-1000+ chars).
**challenge**: Questão AVANÇADA com raciocínio em 2+ etapas, 4 alternativas traiçoeiras, análise completa dos distratores (500-700+ chars).
**explanation**: Consolidação do ciclo, revisão, dicas práticas (700-1000+ chars).

Ordem por ciclo: story → explanation → interactive → explanation → challenge → explanation

### JSON com 18 blocos:
{
  "title": "Título chamativo",
  "subtitle": "Subtítulo detalhado",
  "cycles": [
    {"type":"story","cabritoSpeech":"...","content":"Narrativa longa e detalhada com dados reais..."},
    {"type":"explanation","cabritoSpeech":"...","content":"Teoria completa com fórmulas, exemplos, resumo..."},
    {"type":"interactive","cabritoSpeech":"...","content":"Questão contextualizada...","options":["A","B","C","D"],"correctIndex":0,"explanation":"Resolução detalhada..."},
    {"type":"explanation","cabritoSpeech":"...","content":"Erros comuns, conexões ENEM, dicas..."},
    {"type":"challenge","cabritoSpeech":"...","content":"Questão avançada com pegadinha...","options":["A","B","C","D"],"correctIndex":2,"explanation":"Análise completa..."},
    {"type":"explanation","cabritoSpeech":"...","content":"Consolidação do ciclo básico..."},
    {"type":"story","cabritoSpeech":"...","content":"Nova narrativa intermediária detalhada..."},
    {"type":"explanation","cabritoSpeech":"...","content":"Teoria intermediária densa..."},
    {"type":"interactive","cabritoSpeech":"...","content":"Questão intermediária...","options":["A","B","C","D"],"correctIndex":1,"explanation":"Explicação detalhada..."},
    {"type":"explanation","cabritoSpeech":"...","content":"Relações entre tópicos, erros frequentes..."},
    {"type":"challenge","cabritoSpeech":"...","content":"Questão avançada intermediária...","options":["A","B","C","D"],"correctIndex":3,"explanation":"Análise completa..."},
    {"type":"explanation","cabritoSpeech":"...","content":"Pegadinhas clássicas do ENEM..."},
    {"type":"story","cabritoSpeech":"...","content":"Narrativa avançada com dados complexos..."},
    {"type":"explanation","cabritoSpeech":"...","content":"Teoria avançada profunda..."},
    {"type":"interactive","cabritoSpeech":"...","content":"Questão avançada estilo ENEM real...","options":["A","B","C","D"],"correctIndex":2,"explanation":"Resolução expert..."},
    {"type":"explanation","cabritoSpeech":"...","content":"Integração multi-área, raciocínio complexo..."},
    {"type":"challenge","cabritoSpeech":"...","content":"Questão de dificuldade máxima...","options":["A","B","C","D"],"correctIndex":0,"explanation":"Análise completa..."},
    {"type":"explanation","cabritoSpeech":"...","content":"Síntese completa do ciclo avançado..."}
  ]
}

Retorne APENAS o JSON válido. Conteúdo LONGO e DETALHADO em cada bloco.`;

    const userPrompt = `Gere a aula de "${area}" com 3 ciclos (básico, intermediário, avançado), cada um com 6 blocos de conteúdo LONGO. Retorne APENAS o JSON:`;
    const fullPrompt = systemPrompt + '\n\n' + userPrompt;

    const geminiPromise = geminiCall(fullPrompt, 8192, 9000).then(text => {
      if (!text) return null;
      return parseLessonJson(text);
    });

    const groqPromise = groqCall(systemPrompt, userPrompt, 8192, 9000).then(text => {
      if (!text) return null;
      return parseLessonJson(text);
    });

    const orPromise = tryOpenRouter(systemPrompt, userPrompt, 8192, 9000).then(text => {
      if (!text) return null;
      return parseLessonJson(text);
    });

    const results = await Promise.allSettled([geminiPromise, groqPromise, orPromise]);
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) return res.json(r.value);
    }

    return res.status(503).json({ error: 'IA não conseguiu gerar a aula. Tente novamente.' });
  } catch (err) {
    return res.status(503).json({ error: 'Erro ao gerar aula.' });
  }
};
