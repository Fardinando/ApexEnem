import type { ItemParameters } from '../types';

export const DEFAULT_AI_PARAMS: ItemParameters = { a: 1.0, b: 0.0, c: 0.20 };

const ENEM_MEDIUM_PARAMS: ItemParameters = { a: 1.2, b: 0.3, c: 0.18 };
const ENEM_HARD_PARAMS: ItemParameters = { a: 1.5, b: 1.0, c: 0.15 };
const ENEM_EASY_PARAMS: ItemParameters = { a: 0.8, b: -0.8, c: 0.22 };

const DIFFICULTY_MAP: Record<number, ItemParameters> = {
  1: ENEM_EASY_PARAMS,
  2: ENEM_MEDIUM_PARAMS,
  3: ENEM_HARD_PARAMS,
};

export function getParamsForQuestion(source: string, difficulty?: number): ItemParameters {
  if (source === 'simulado' && difficulty !== undefined) {
    return DIFFICULTY_MAP[difficulty] || ENEM_MEDIUM_PARAMS;
  }
  if (source === 'simulado') {
    return ENEM_MEDIUM_PARAMS;
  }
  return { ...DEFAULT_AI_PARAMS };
}

export function updateParamsFromResponses(
  currentParams: ItemParameters,
  responses: { isCorrect: boolean }[],
): ItemParameters {
  if (responses.length < 10) return currentParams;

  const correctRate = responses.filter(r => r.isCorrect).length / responses.length;
  const estimatedB = 1.5 - 3 * correctRate;
  const clampedB = Math.max(-3, Math.min(3, estimatedB));
  const estimatedA = 0.8 + Math.min(responses.length / 50, 1) * 0.7;
  const estimatedC = Math.max(0.05, 0.25 - responses.length * 0.005);

  return {
    a: Math.round(estimatedA * 100) / 100,
    b: Math.round(clampedB * 100) / 100,
    c: Math.round(estimatedC * 100) / 100,
  };
}

export function generateQuestionId(source: string, statement: string): string {
  let hash = 0;
  const str = `${source}:${statement}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `q-${Math.abs(hash).toString(36)}-${Date.now().toString(36)}`;
}
