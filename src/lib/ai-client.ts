const GEMINI_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

const OPENROUTER_KEYS = [
  import.meta.env.VITE_OPENROUTER_API_KEY_V1 || '',
  import.meta.env.VITE_OPENROUTER_API_KEY_V2 || '',
  import.meta.env.VITE_OPENROUTER_API_KEY_V3 || '',
  import.meta.env.VITE_OPENROUTER_API_KEY_V4 || '',
  import.meta.env.VITE_OPENROUTER_API_KEY_V5 || '',
].filter(Boolean);

let orKeyIndex = 0;
function getNextOrKey(): string {
  if (OPENROUTER_KEYS.length === 0) return '';
  const key = OPENROUTER_KEYS[orKeyIndex % OPENROUTER_KEYS.length];
  orKeyIndex++;
  return key;
}

function parseLessonJson(content: string): any | null {
  const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.title && Array.isArray(parsed.cycles) && parsed.cycles.length >= 4) return parsed;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (parsed.title && Array.isArray(parsed.cycles)) return parsed;
      } catch {}
    }
  }
  return null;
}

function parseQuestoesJson(content: string): any[] | null {
  const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length >= 1) {
      return parsed.questions;
    }
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length >= 1) return parsed;
      } catch {}
    }
  }
  return null;
}

async function callGemini(prompt: string, maxTokens: number, timeoutMs: number): Promise<string | null> {
  if (!GEMINI_KEY) return null;
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
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
      }
    );
    clearTimeout(tid);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    clearTimeout(tid);
    return null;
  }
}

async function callOpenRouterWithKey(key: string, systemPrompt: string, userPrompt: string, maxTokens: number, timeoutMs: number): Promise<string | null> {
  if (!key) return null;
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'ApexEnem',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.85,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(tid);
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    clearTimeout(tid);
    return null;
  }
}

async function callOpenRouterFallback(systemPrompt: string, userPrompt: string, maxTokens: number, timeoutMs: number): Promise<string | null> {
  for (let i = 0; i < OPENROUTER_KEYS.length; i++) {
    const key = getNextOrKey();
    if (!key) continue;
    const result = await callOpenRouterWithKey(key, systemPrompt, userPrompt, maxTokens, timeoutMs);
    if (result) return result;
  }
  return null;
}

export async function fetchLessonCycleClient(area: string, level: number, topicIndex: number, weakTopics: string[]): Promise<any | null> {
  const weakSection = weakTopics?.length
    ? `\nPontos fracos do aluno: ${weakTopics.join(', ')}. Foque nesses tópicos quando possível.`
    : '';

  const systemPrompt = `Você é o Cabrito 🐐, tutor do ENEM. Gere uma aula completa em JSON sobre "${area}" (tópico #${topicIndex}).
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

Importante: correctIndex deve variar (0,1,2,3) entre os 4 blocos com questões. Retorne APENAS o JSON.`;

  const userPrompt = `Gere a aula de "${area}" com 2 ciclos. Retorne APENAS o JSON:`;
  const fullPrompt = systemPrompt + '\n\n' + userPrompt;

  const text = await callGemini(fullPrompt, 4096, 25000);
  if (text) {
    const lesson = parseLessonJson(text);
    if (lesson) return lesson;
  }

  const orText = await callOpenRouterFallback(systemPrompt, userPrompt, 4096, 25000);
  if (orText) return parseLessonJson(orText);

  return null;
}

export async function fetchQuestoesAIClient(area: string, count: number, weakTopics: string[]): Promise<any[] | null> {
  const weakSection = weakTopics?.length
    ? `\nPontos fracos: ${weakTopics.join(', ')}. Foque nessas questões.`
    : '';

  const systemPrompt = `Gere ${count} questões ENEM de múltipla escolha para "${area}". Nível: médio/difícil. ${weakSection}

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

  const userPrompt = `Gere ${count} questões estilo ENEM para "${area}". Retorne APENAS o JSON:`;
  const fullPrompt = systemPrompt + '\n\n' + userPrompt;

  const text = await callGemini(fullPrompt, 2048, 25000);
  if (text) {
    const questions = parseQuestoesJson(text);
    if (questions && questions.length > 0) return questions;
  }

  const orText = await callOpenRouterFallback(systemPrompt, userPrompt, 2048, 25000);
  if (orText) {
    const questions = parseQuestoesJson(orText);
    if (questions && questions.length > 0) return questions;
  }

  return null;
}
