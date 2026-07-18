/**
 * Gamification engine: XP, streak, achievements, levels
 */

import type { WrongAnswer, TopicDifficulty } from '../types';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  condition: (stats: GamificationStats) => boolean;
}

export interface GamificationStats {
  totalEssays: number;
  avgEssayScore: number;
  bestEssayScore: number;
  totalSimulados: number;
  avgSimuladoScore: number;
  bestSimuladoScore: number;
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  totalQuestionsAnswered: number;
  perfectSimulados: number;
}

export const XP_REWARDS: Record<string, number> = {
  ESSAY_CORRECTION: 50,
  SIMULADO_PASS: 30,
  SIMULADO_HIGH_SCORE: 80,
  SIMULADO_PERFECT: 200,
  STREAK_DAILY: 10,
  QUESTION_CORRECT: 5,
  LEARNING_CHAPTER: 40,
};

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800,
  4700, 5700, 6800, 8000, 9500, 11000, 13000, 15000, 17500, 20000,
] as const;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_essay', title: 'Primeira Redação', description: 'Enviou sua primeira redação para correção', icon: '✍️', condition: (s) => s.totalEssays >= 1 },
  { id: 'essay_5', title: 'Escritor Dedicado', description: 'Enviou 5 redações', icon: '📝', condition: (s) => s.totalEssays >= 5 },
  { id: 'essay_10', title: 'Mestre da Escrita', description: 'Enviou 10 redações', icon: '📚', condition: (s) => s.totalEssays >= 10 },
  { id: 'essay_25', title: 'Pluma de Ouro', description: 'Enviou 25 redações', icon: '🪶', condition: (s) => s.totalEssays >= 25 },
  { id: 'score_800', title: 'Nota Alta', description: 'Alcançou 800+ pontos em uma redação', icon: '🎯', condition: (s) => s.bestEssayScore >= 800 },
  { id: 'score_900', title: 'Quase Perfeita', description: 'Alcançou 900+ pontos em uma redação', icon: '🌟', condition: (s) => s.bestEssayScore >= 900 },
  { id: 'score_1000', title: 'Redação Nota 1000', description: 'Alcançou a nota máxima em uma redação', icon: '👑', condition: (s) => s.bestEssayScore >= 1000 },
  { id: 'first_simulado', title: 'Primeiro Simulado', description: 'Completou seu primeiro simulado', icon: '🧠', condition: (s) => s.totalSimulados >= 1 },
  { id: 'simulado_5', title: 'Atleta Mental', description: 'Completou 5 simulados', icon: '💪', condition: (s) => s.totalSimulados >= 5 },
  { id: 'simulado_10', title: 'Veterano de Provas', description: 'Completou 10 simulados', icon: '🎖️', condition: (s) => s.totalSimulados >= 10 },
  { id: 'simulado_25', title: 'Máquina de Simulados', description: 'Completou 25 simulados', icon: '🏆', condition: (s) => s.totalSimulados >= 25 },
  { id: 'perfect_simulado', title: '100% de Acerto', description: 'Acertou todas as questões de um simulado', icon: '💯', condition: (s) => s.perfectSimulados >= 1 },
  { id: 'streak_3', title: 'Fogo Aceso', description: 'Manteve sequência de 3 dias', icon: '🔥', condition: (s) => s.longestStreak >= 3 },
  { id: 'streak_7', title: 'Semana Perfeita', description: 'Manteve sequência de 7 dias', icon: '⚡', condition: (s) => s.longestStreak >= 7 },
  { id: 'streak_14', title: 'Disciplina Total', description: 'Manteve sequência de 14 dias', icon: '🛡️', condition: (s) => s.longestStreak >= 14 },
  { id: 'streak_30', title: 'Lenda do Estudo', description: 'Manteve sequência de 30 dias', icon: '🏅', condition: (s) => s.longestStreak >= 30 },
  { id: 'xp_1000', title: 'Milhar de XP', description: 'Acumulou 1000 pontos de experiência', icon: '⭐', condition: (s) => s.totalXp >= 1000 },
  { id: 'xp_5000', title: 'Experiência Máxima', description: 'Acumulou 5000 pontos de experiência', icon: '💎', condition: (s) => s.totalXp >= 5000 },
];

export function calculateStreak(lastLoginDate?: string): { newStreak: number; isNewDay: boolean; streakBroken: boolean } {
  if (!lastLoginDate) return { newStreak: 1, isNewDay: true, streakBroken: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const last = new Date(lastLoginDate + 'T12:00:00');
  last.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { newStreak: 0, isNewDay: false, streakBroken: false };
  if (diffDays === 1) return { newStreak: 1, isNewDay: true, streakBroken: false };
  return { newStreak: 1, isNewDay: true, streakBroken: true };
}

export function getLevelFromXp(xp: number): { level: number; currentXp: number; nextThreshold: number; progress: number } {
  let level = 0;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i;
    } else {
      break;
    }
  }

  const currentThreshold = LEVEL_THRESHOLDS[level] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 5000;
  const xpInLevel = xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const progress = xpNeeded > 0 ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 100;

  return { level: level + 1, currentXp: xp, nextThreshold, progress };
}

export function getLevelTitle(level: number): string {
  if (level <= 2) return 'Calouro';
  if (level <= 5) return 'Estudante';
  if (level <= 8) return 'Disciplinado';
  if (level <= 12) return 'Experiente';
  if (level <= 15) return 'Mestre';
  if (level <= 18) return 'Lenda';
  return 'Apex Master';
}

export function computeGamificationStats(data: {
  essays: { score: number }[];
  simulados: { scorePercent: number }[];
  streak: number;
  longestStreak: number;
  totalXp: number;
  questionsAnswered?: number;
}): GamificationStats {
  const totalEssays = data.essays.length;
  const avgEssayScore = totalEssays > 0
    ? Math.round(data.essays.reduce((a, e) => a + e.score, 0) / totalEssays)
    : 0;
  const bestEssayScore = totalEssays > 0
    ? Math.max(...data.essays.map(e => e.score))
    : 0;

  const totalSimulados = data.simulados.length;
  const avgSimuladoScore = totalSimulados > 0
    ? Math.round(data.simulados.reduce((a, s) => a + s.scorePercent, 0) / totalSimulados)
    : 0;
  const bestSimuladoScore = totalSimulados > 0
    ? Math.max(...data.simulados.map(s => s.scorePercent))
    : 0;
  const perfectSimulados = data.simulados.filter(s => s.scorePercent === 100).length;

  return {
    totalEssays,
    avgEssayScore,
    bestEssayScore,
    totalSimulados,
    avgSimuladoScore,
    bestSimuladoScore,
    currentStreak: data.streak,
    longestStreak: data.longestStreak,
    totalXp: data.totalXp,
    totalQuestionsAnswered: data.questionsAnswered || 0,
    perfectSimulados,
  };
}

export function getUnlockedAchievements(stats: GamificationStats): Achievement[] {
  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlockedAt: a.condition(stats) ? (a.unlockedAt || new Date().toISOString()) : undefined,
  })).filter(a => a.unlockedAt);
}

export function computeTopicDifficulty(wrongAnswers: WrongAnswer[]): TopicDifficulty[] {
  const topicMap = new Map<string, { subject: string; count: number }>();

  for (const wa of wrongAnswers) {
    const key = wa.subject;
    const existing = topicMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      topicMap.set(key, { subject: wa.subject, count: 1 });
    }
  }

  const results: TopicDifficulty[] = [];
  for (const [topic, data] of topicMap) {
    const score = Math.min(100, Math.round((data.count / Math.max(wrongAnswers.length, 1)) * 200));
    results.push({
      topic,
      subject: data.subject,
      score,
      errorCount: data.count,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}
