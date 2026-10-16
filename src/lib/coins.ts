import type { PlanId } from '../types';
import { MONTHLY_COINS, COIN_COSTS, REWARDED_COINS, REWARDED_DAILY_LIMIT, type CoinFeature } from '../config/plans';

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
  dailyRewarded: { date: string; count: number };
  history: CoinHistoryEntry[];
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultWallet(): WalletState {
  return {
    plan: 'free',
    coins: MONTHLY_COINS.free,
    refreshedAt: new Date().toISOString(),
    dailyRewarded: { date: todayStr(), count: 0 },
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
  if (changed && opts.grantMonthly !== false) {
    state.coins += MONTHLY_COINS[plan];
    state.refreshedAt = new Date().toISOString();
    pushHistory(MONTHLY_COINS[plan], `Bônus inicial do plano ${plan.toUpperCase()}`);
  }
  persist();
}

/** Concede a cota mensal quando virou o mês. */
export function ensureMonthlyAllowance() {
  const now = new Date();
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

export function getRewardedRemaining(): number {
  if (state.dailyRewarded.date !== todayStr()) return REWARDED_DAILY_LIMIT;
  return Math.max(0, REWARDED_DAILY_LIMIT - state.dailyRewarded.count);
}

/** Registra um anúncio recompensado assistido e credita as moedas. */
export function grantRewarded(reason = 'Anúncio recompensado'): { ok: boolean; coins?: number; remaining: number } {
  if (state.dailyRewarded.date !== todayStr()) {
    state.dailyRewarded = { date: todayStr(), count: 0 };
  }
  if (state.dailyRewarded.count >= REWARDED_DAILY_LIMIT) {
    return { ok: false, remaining: 0 };
  }
  state.dailyRewarded.count += 1;
  state.coins += REWARDED_COINS;
  pushHistory(REWARDED_COINS, reason);
  persist();
  return { ok: true, coins: REWARDED_COINS, remaining: getRewardedRemaining() };
}

export { REWARDED_COINS, REWARDED_DAILY_LIMIT, COIN_COSTS };
