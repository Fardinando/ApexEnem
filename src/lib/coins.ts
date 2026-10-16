import type { PlanId } from '../types';
import { MONTHLY_COINS, WEEKLY_RESET_COINS, COIN_COSTS, REWARDED_COINS, type CoinFeature } from '../config/plans';

export type { CoinFeature };

const STORAGE_KEY = 'ApexEnem_wallet_v2';

export interface CoinHistoryEntry {
  ts: number;
  delta: number;
  reason: string;
}

export interface WalletState {
  plan: PlanId;
  coins: number;
  refreshedAt: string;
  weeklyResetAt: string;
  history: CoinHistoryEntry[];
}

/** Chave da semana ISO no formato "2026-W03". */
function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function defaultWallet(): WalletState {
  return {
    plan: 'free',
    coins: WEEKLY_RESET_COINS,
    refreshedAt: new Date().toISOString(),
    weeklyResetAt: isoWeekKey(new Date()),
    history: [],
  };
}

function load(): WalletState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultWallet();
    const parsed = JSON.parse(raw) as WalletState;
    return { ...defaultWallet(), ...parsed };
  } catch {
    return defaultWallet();
  }
}

let state: WalletState = load();
const listeners = new Set<(w: WalletState) => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l(state));
}

function pushHistory(delta: number, reason: string) {
  state.history = [{ ts: Date.now(), delta, reason }, ...state.history].slice(0, 100);
}

export function subscribeWallet(cb: (w: WalletState) => void): () => void {
  listeners.add(cb);
  cb(state);
  return () => listeners.delete(cb);
}

export function getWallet(): WalletState {
  return state;
}

export function getPlanId(): PlanId {
  return state.plan;
}

export function getCoins(): number {
  return state.coins;
}

/** Ajusta o plano do usuário (ex.: após confirmar assinatura). */
export function setPlan(plan: PlanId, opts: { grantMonthly?: boolean } = {}) {
  const changed = plan !== state.plan;
  state.plan = plan;
  const now = new Date();
  if (changed && opts.grantMonthly !== false) {
    if (plan === 'free') {
      state.coins = WEEKLY_RESET_COINS;
      state.weeklyResetAt = isoWeekKey(now);
      pushHistory(WEEKLY_RESET_COINS, 'Recarga semanal do plano Free');
    } else {
      state.coins += MONTHLY_COINS[plan];
      state.refreshedAt = now.toISOString();
      pushHistory(MONTHLY_COINS[plan], `Bônus inicial do plano ${plan.toUpperCase()}`);
    }
  }
  persist();
}

/**
 * Aplica as regras de recarga: plano Free reseta para 10 moedas no início de
 * cada semana; planos pagos recebem a cota mensal quando vira o mês.
 */
export function ensureAllowances() {
  const now = new Date();
  if (state.plan === 'free') {
    const week = isoWeekKey(now);
    if (state.weeklyResetAt !== week) {
      state.coins = WEEKLY_RESET_COINS;
      state.weeklyResetAt = week;
      pushHistory(WEEKLY_RESET_COINS, 'Recarga semanal do plano Free');
      persist();
    }
    return;
  }
  const last = new Date(state.refreshedAt);
  if (isNaN(last.getTime()) || now.getMonth() !== last.getMonth() || now.getFullYear() !== last.getFullYear()) {
    state.coins += MONTHLY_COINS[state.plan];
    state.refreshedAt = now.toISOString();
    pushHistory(MONTHLY_COINS[state.plan], `Cota mensal do plano ${state.plan.toUpperCase()}`);
    persist();
  }
}

export function addCoins(amount: number, reason: string) {
  if (amount <= 0) return;
  state.coins += amount;
  pushHistory(amount, reason);
  persist();
}

export function canAfford(amount: number): boolean {
  return state.coins >= amount;
}

export function getFeatureCost(feature: CoinFeature): number {
  return COIN_COSTS[feature];
}

/**
 * Tenta cobrar o custo de uma funcionalidade de IA.
 * Retorna true se o saldo foi debitado com sucesso.
 */
export function chargeFeature(feature: CoinFeature, reason?: string): boolean {
  const cost = COIN_COSTS[feature];
  if (cost <= 0) return true;
  if (state.coins < cost) return false;
  state.coins -= cost;
  pushHistory(-cost, reason || `Uso: ${feature}`);
  persist();
  return true;
}

/** Registra um anúncio recompensado assistido e credita as moedas (sem limite). */
export function grantRewarded(reason = 'Anúncio recompensado'): { ok: boolean; coins: number } {
  state.coins += REWARDED_COINS;
  pushHistory(REWARDED_COINS, reason);
  persist();
  return { ok: true, coins: REWARDED_COINS };
}

export { REWARDED_COINS, COIN_COSTS };
