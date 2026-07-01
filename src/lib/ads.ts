import type { UserProfile } from '../types';
import { ADSENSE_PUBLISHER_ID } from '../config/ads';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function pushAd(): void {
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch {
    /* ad blocker or not loaded */
  }
}

export function isAdsenseConfigured(): boolean {
  const envId = typeof import.meta.env !== 'undefined' ? (import.meta.env as any).VITE_ADSENSE_PUBLISHER_ID : undefined;
  return !!(envId || ADSENSE_PUBLISHER_ID);
}

const STORAGE_KEY = 'ApexEnem_house_ad_seen';

export function getHouseAdContent(user?: Partial<UserProfile>): { emoji: string; title: string; text: string; cta: string; action?: string } {
  const hard = user?.hardSubjects || [];
  const serie = user?.serie || '';
  const target = user?.targetScore || 0;

  if (hard.includes('Matemática')) {
    return { emoji: '📐', title: 'Matemática', text: 'Domine Matemática com questões comentadas e passo a passo detalhado.', cta: 'Praticar Matemática', action: 'perguntas' };
  }
  if (hard.includes('Redação')) {
    return { emoji: '✍️', title: 'Redação Nota 1000', text: 'Treine redação e receba correção instantânea por IAs especialistas.', cta: 'Escrever Redação', action: 'redacao' };
  }
  if (hard.includes('Natureza')) {
    return { emoji: '🔬', title: 'Ciências da Natureza', text: 'Domine Física, Química e Biologia com exercícios práticos.', cta: 'Estudar Natureza', action: 'perguntas' };
  }
  if (hard.includes('Humanas')) {
    return { emoji: '📜', title: 'Ciências Humanas', text: 'Entenda História, Geografia, Filosofia e Sociologia de verdade.', cta: 'Estudar Humanas', action: 'perguntas' };
  }
  if (hard.includes('Linguagens')) {
    return { emoji: '💬', title: 'Linguagens', text: 'Melhore sua interpretação de texto e gramática.', cta: 'Praticar Linguagens', action: 'perguntas' };
  }

  if (serie === '3_medio' || serie === 'cursinho' || target >= 700) {
    return { emoji: '🎯', title: 'Meta Alta', text: 'Foco total nos estudos! Simulados cronometrados com questões reais do ENEM.', cta: 'Fazer Simulado', action: 'simulados' };
  }
  if (serie === '9_fundamental' || serie === '1_medio') {
    return { emoji: '🌱', title: 'Comece Bem', text: 'Construa uma base sólida desde já. Aprenda no seu ritmo com o Cabrito.', cta: 'Aprender Agora', action: 'aprendizado' };
  }

  return { emoji: '🚀', title: 'ApexEnem', text: 'Sua plataforma completa para arrasar no ENEM: redação, simulados, questões e mais!', cta: 'Explorar', action: 'dashboard' };
}

export function markHouseAdSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  } catch { /* noop */ }
}

export function shouldShowHouseAd(): boolean {
  try {
    const last = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
    return Date.now() - last > 30000;
  } catch {
    return true;
  }
}
