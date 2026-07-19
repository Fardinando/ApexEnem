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

function parseQuestoesJson(content: string): any[] | null {
  const c = content.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    const p = JSON.parse(c);
    if (p.questions && Array.isArray(p.questions) && p.questions.length >= 1) return p.questions;
  } catch {
    const m = c.match(/\[[\s\S]*\]/);
    if (m) { try { const p = JSON.parse(m[0]); if (Array.isArray(p) && p.length >= 1) return p; } catch {} }
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
  for (let i = 0; i < OPENROUTER_KEYS.length; i++) {
    const key = nextOrKey();
    const r = await openrouterCall(key, systemPrompt, userPrompt, maxTokens, timeoutMs);
    if (r) return r;
  }
  return null;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { area, count, weakTopics } = req.body;
    if (!area) return res.status(400).json({ error: 'area is required' });

    const weakSection = weakTopics?.length ? `\nPontos fracos: ${weakTopics.join(', ')}. Foque nessas questões.` : '';

    const systemPrompt = `Gere ${count || 3} questões ENEM de múltipla escolha para "${area}". Nível: médio/difícil. ${weakSection}

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

Retorne APENAS o JSON.`;

    const userPrompt = `Gere ${count || 3} questões estilo ENEM para "${area}". Retorne APENAS o JSON:`;
    const fullPrompt = systemPrompt + '\n\n' + userPrompt;

    const text = await geminiCall(fullPrompt, 2048, 7000);
    if (text) {
      const questions = parseQuestoesJson(text);
      if (questions && questions.length > 0) return res.json({ questions });
    }

    const orText = await tryOpenRouter(systemPrompt, userPrompt, 2048, 7000);
    if (orText) {
      const questions = parseQuestoesJson(orText);
      if (questions && questions.length > 0) return res.json({ questions });
    }

    return res.status(503).json({ error: 'IA não conseguiu gerar questões. Tente novamente.' });
  } catch (err) {
    return res.status(503).json({ error: 'Erro ao gerar questões.' });
  }
}
