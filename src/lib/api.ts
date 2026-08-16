export interface QuestionClassification {
  subject: string;
  method: string;
  topic: string;
}

export async function classifyQuestion(
  statement: string,
  subject?: string
): Promise<QuestionClassification> {
  try {
    const res = await fetch('/api/classify-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statement, subject }),
    });
    if (!res.ok) {
      return { subject: subject || '', method: '', topic: '' };
    }
    const data = await res.json();
    return {
      subject: typeof data?.subject === 'string' ? data.subject : subject || '',
      method: typeof data?.method === 'string' ? data.method : '',
      topic: typeof data?.topic === 'string' ? data.topic : '',
    };
  } catch {
    return { subject: subject || '', method: '', topic: '' };
  }
}
