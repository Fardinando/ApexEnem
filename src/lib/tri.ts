import type { ItemParameters, QuestionResponse, TriProfile } from '../types';

export const EMPTY_TRI_PROFILE: TriProfile = {
  subjectThetas: {},
  totalResponses: {},
  lastUpdated: 0,
};

export function triProbability(theta: number, a: number, b: number, c: number): number {
  const exponent = -a * (theta - b);
  const clampedExp = Math.max(-500, Math.min(500, exponent));
  return c + (1 - c) / (1 + Math.exp(clampedExp));
}

export function triLikelihood(theta: number, responses: { isCorrect: boolean; params: ItemParameters }[]): number {
  let logLikelihood = 0;
  for (const r of responses) {
    const p = triProbability(theta, r.params.a, r.params.b, r.params.c);
    const prob = Math.max(1e-10, Math.min(1 - 1e-10, p));
    logLikelihood += r.isCorrect ? Math.log(prob) : Math.log(1 - prob);
  }
  return Math.exp(logLikelihood);
}

export function estimateThetaEAP(responses: { isCorrect: boolean; params: ItemParameters }[]): number {
  if (responses.length === 0) return 0;

  const priorMean = 0;
  const priorSD = 1;
  const gridPoints = 40;
  const thetaMin = -4;
  const thetaMax = 4;
  const step = (thetaMax - thetaMin) / (gridPoints - 1);

  let weightedSum = 0;
  let weightSum = 0;

  for (let i = 0; i < gridPoints; i++) {
    const theta = thetaMin + i * step;
    const likelihood = triLikelihood(theta, responses);
    const z = (theta - priorMean) / priorSD;
    const prior = Math.exp(-0.5 * z * z) / (priorSD * Math.sqrt(2 * Math.PI));
    const posterior = likelihood * prior;
    weightedSum += theta * posterior;
    weightSum += posterior;
  }

  if (weightSum < 1e-20) return 0;
  const thetaEstimate = weightedSum / weightSum;
  return Math.max(-4, Math.min(4, thetaEstimate));
}

export function triScore(theta: number): number {
  return Math.round(500 + theta * 100);
}

export function thetaToLabel(theta: number): string {
  const score = triScore(theta);
  if (score < 350) return 'Iniciante';
  if (score < 450) return 'Básico';
  if (score < 550) return 'Intermediário';
  if (score < 650) return 'Avançado';
  if (score < 750) return 'Muito Avançado';
  return 'Excelente';
}

export function thetaToColor(theta: number): string {
  const score = triScore(theta);
  if (score < 400) return '#ef4444';
  if (score < 500) return '#f59e0b';
  if (score < 600) return '#22c55e';
  if (score < 700) return '#3b82f6';
  return '#8b5cf6';
}

export function computeTriProfile(responses: QuestionResponse[]): TriProfile {
  const subjects = ['Matemática', 'Natureza', 'Humanas', 'Linguagens'];
  const subjectThetas: Record<string, number> = {};
  const totalResponses: Record<string, number> = {};

  for (const subject of subjects) {
    const subjectResponses = responses.filter(r => r.subject === subject);
    totalResponses[subject] = subjectResponses.length;

    if (subjectResponses.length < 3) {
      subjectThetas[subject] = 0;
      continue;
    }

    const formatted = subjectResponses.map(r => ({
      isCorrect: r.isCorrect,
      params: r.itemParams,
    }));

    subjectThetas[subject] = estimateThetaEAP(formatted);
  }

  return {
    subjectThetas,
    totalResponses,
    lastUpdated: Date.now(),
  };
}

export function getMinimumResponsesForReliable(): number {
  return 5;
}
