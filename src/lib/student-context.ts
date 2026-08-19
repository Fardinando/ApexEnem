export interface StudentContext {
  name: string;
  location: string;
  recentWrongAnswers: Array<{ subject: string; topic: string; source: string }>;
  subjectAccuracy: Record<string, { correct: number; total: number }>;
  weakSubjects: Array<{ subject: string; accuracy: number; total: number }>;
  totalQuestions: number;
  avgEssayScore: number | null;
  recentEssays: Array<{ score: number; date: string }>;
}

export async function fetchStudentContext(
  userId: string,
  apiBase?: string
): Promise<StudentContext | null> {
  if (!userId) return null;
  const base = apiBase || "";
  try {
    const res = await fetch(`${base}/api/student-context/${encodeURIComponent(userId)}`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
