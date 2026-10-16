import type { PlanId } from '../types';

export interface PlanFeature {
  label: string;
  included: boolean;
  hint?: string;
}

export interface PlanDef {
  id: PlanId;
  name: string;
  tagline: string;
  priceBRL: number;
  monthlyCoins: number;
  highlight?: boolean;
  features: PlanFeature[];
}

// ─────────────────────────────────────────────────────────────────────────────
// VALORES-SEMENTE (ajustáveis). Centralize aqui qualquer mudança de preço,
// cota de moedas ou custo de funcionalidade. Nada mais no app precisa mudar.
// ─────────────────────────────────────────────────────────────────────────────

/** Moedas concedidas por mês em cada plano (PRO/Apex). */
export const MONTHLY_COINS: Record<PlanId, number> = {
  free: 10,
  pro: 600,
  apex: 2000,
};

/** No plano Free, o saldo "zera" para este valor no início de cada semana. */
export const WEEKLY_RESET_COINS = 10;

/** Custo em moedas de cada funcionalidade de IA (0 = livre). */
export const COIN_COSTS = {
  essayCorrection: 10,
  aiQuestion: 10,
  studyPlan: 10,
  teacherPlan: 10,
} as const;

export type CoinFeature = keyof typeof COIN_COSTS;

/** Moedas ganhas por assistir a um anúncio recompensado. */
export const REWARDED_COINS = 20;

/** Limite diário de anúncios recompensados por usuário. */
export const REWARDED_DAILY_LIMIT = 10;

/** No plano Free, o saldo de moedas pode ser recarregado assistindo anúncios. */
export const ADS_TO_COINS_PLANS: PlanId[] = ['free'];

/** Recursos exclusivos por plano. */
export function planHasTeacherAI(plan: PlanId | undefined): boolean {
  return plan === 'apex';
}

export function planDisablesAds(plan: PlanId | undefined): boolean {
  return plan === 'pro' || plan === 'apex';
}

export const PLANS: PlanDef[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Para começar sem pagar nada',
    priceBRL: 0,
    monthlyCoins: MONTHLY_COINS.free,
    features: [
      { label: 'Correção de redação por IA', included: true },
      { label: 'Questões inéditas com IA', included: true },
      { label: 'Simulados com questões reais do ENEM', included: true },
      { label: 'Plano de estudos adaptativo', included: true },
      { label: 'Pesquisa de repertórios', included: true },
      { label: `${WEEKLY_RESET_COINS} moedas por semana (renovadas toda semana)`, included: true },
      { label: `Recarga via anúncios (+${REWARDED_COINS} moedas, até ${REWARDED_DAILY_LIMIT}/dia)`, included: true },
      { label: 'Sem anúncios', included: false },
      { label: 'IA Professora (planos de aula)', included: false },
      { label: 'Vídeos sem limite', included: true },
    ],
  },
  {
    id: 'pro',
    name: 'PRO',
    tagline: 'Sem anúncios e com muito mais IA',
    priceBRL: 10,
    monthlyCoins: MONTHLY_COINS.pro,
    highlight: true,
    features: [
      { label: 'Tudo do Free', included: true },
      { label: 'Sem anúncios', included: true },
      { label: `${MONTHLY_COINS.pro} moedas por mês`, included: true },
      { label: 'Vídeos sem limite', included: true },
      { label: 'Ao esgotar a cota, recarga com anúncios (opcional)', included: true },
      { label: 'IA Professora (planos de aula)', included: false },
    ],
  },
  {
    id: 'apex',
    name: 'Apex',
    tagline: 'Para quem quer o máximo da IA',
    priceBRL: 25,
    monthlyCoins: MONTHLY_COINS.apex,
    features: [
      { label: 'Tudo do PRO', included: true },
      { label: `${MONTHLY_COINS.apex} moedas por mês`, included: true },
      { label: 'IA Professora: planos de aula personalizados', included: true },
      { label: 'Prioridade no processamento da IA', included: true },
      { label: 'Suporte prioritário', included: true },
    ],
  },
];

export function getPlan(id: PlanId | undefined): PlanDef {
  return PLANS.find((p) => p.id === (id || 'free')) || PLANS[0];
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
