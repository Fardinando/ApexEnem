const GEMINI_KEY = process.env.GOOGLE_API_KEY || '';
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
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
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

    const systemPrompt = `Você é o Cabrito 🐐, tutor do ENEM. Gere uma aula completa em JSON sobre "${area}" (tópico #${topicNum}).
Nível: ${level || 5}/10. ${weakSection}

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

Retorne APENAS o JSON.`;

    const userPrompt = `Gere a aula de "${area}" com 2 ciclos. Retorne APENAS o JSON:`;
    const fullPrompt = systemPrompt + '\n\n' + userPrompt;

    const geminiPromise = geminiCall(fullPrompt, 3072, 3000).then(text => {
      if (!text) return null;
      return parseLessonJson(text);
    });

    const orPromise = tryOpenRouter(systemPrompt, userPrompt, 3072, 3000).then(text => {
      if (!text) return null;
      return parseLessonJson(text);
    });

    const results = await Promise.allSettled([geminiPromise, orPromise]);
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) return res.json(r.value);
    }

    return res.status(503).json({ error: 'IA não conseguiu gerar a aula. Tente novamente.' });
  } catch (err) {
    return res.status(503).json({ error: 'Erro ao gerar aula.' });
  }
};
