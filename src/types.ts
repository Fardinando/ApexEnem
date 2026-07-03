/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StudySerie = '9_fundamental' | '1_medio' | '2_medio' | '3_medio' | 'cursinho' | 'outro';

export type RegionBR = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';

export interface UserProfile {
  name: string;
  email: string;
  password?: string; // only stored locally
  region?: RegionBR;
  state?: string;
  city?: string;
  confirmed?: boolean;
  serie?: StudySerie;
  targetScore?: number;
  hardSubjects?: string[];
  streak?: number;
  lastLoginDate?: string;
  avatar?: string;
}

export interface PendingUser {
  name: string;
  email: string;
  password: string;
  region: RegionBR;
  state: string;
  city: string;
  confirmationCode: string;
  createdAt: string;
}

export interface CompetencyScore {
  id: number;
  name: string; // Competência 1 a 5
  description: string;
  score: number; // 0 a 200
  feedback: string; // Detalhes e dicas de melhoria específicas para a competência
}

export interface EssayCorrection {
  id: string;
  title: string;
  text: string;
  score: number; // 0 - 1000
  generalFeedback: string;
  competencies: CompetencyScore[];
  strengths: string[];
  weaknesses: string[];
  date: string;
}

export interface Question {
  id: string;
  area: 'Matemática' | 'Humanas' | 'Natureza' | 'Linguagens';
  statement: string;
  options: {
    letter: 'A' | 'B' | 'C' | 'D' | 'E';
    text: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string;
}

export interface SimuladoConfig {
  subject: 'Matemática' | 'Humanas' | 'Natureza' | 'Linguagens' | 'Geral';
  questionCount: number;
}

export interface SimuladoQuestion {
  id: string;
  statement: string;
  options: {
    letter: 'A' | 'B' | 'C' | 'D' | 'E';
    text: string;
    image?: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string;
  userAnswer?: 'A' | 'B' | 'C' | 'D' | 'E';
  image?: string;
  imageAlt?: string;
}

export interface SimuladoState {
  config: SimuladoConfig;
  questions: SimuladoQuestion[];
  currentQuestionIndex: number;
  timeLeft: number; // em segundos
  isActive: boolean;
  scorePercent?: number;
  averageTimeGasp?: number; // tempo médio por questão em segundos
  dateStarted?: string;
}

export interface ActivityLog {
  id: string;
  type: 'redacao' | 'pergunta' | 'simulado' | 'onboarding' | 'streak';
  title: string;
  description: string;
  timeAgo: string;
  date: string;
}

export interface WrongAnswer {
  subject: string;
  source: 'simulado' | 'pergunta-ia' | 'redacao';
  timestamp: number;
}

export interface LearningChapter {
  id: string;
  title: string;
  area: 'Humanas' | 'Linguagens' | 'Redação' | 'Natureza' | 'Matemática';
  description: string;
  level: number;
  maxLevel: number;
  unlocked: boolean;
  xpValue: number;
}

export type ExerciseType = 'choice' | 'true-false' | 'reorder' | 'matching';

export interface Exercise {
  id: string;
  type: ExerciseType;
  instructions: string;
  statement: string;

  // For 'choice'
  options?: { letter: string; text: string }[];
  correctLetter?: string;

  // For 'true-false'
  correctBoolean?: boolean;

  // For 'reorder'
  shuffledWords?: string[];
  correctSentenceWords?: string[];

  // For 'matching'
  matchingPairs?: { left: string; right: string }[];

  explanation: string;
}
