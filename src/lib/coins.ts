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

// ─── Sincronização com o servidor (Supabase, por usuário) ────────────────────
// A carteira vive no servidor para persistir entre aparelhos. O localStorage é
// apenas um cache offline (e a fonte para visitantes não autenticados).
let authToken: string | null = null;
let remoteEnabled = false;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncInFlight = false;
let syncQueued = false;

/** Define (ou limpa) o token de autenticação e hidrata a carteira do servidor. */
export function setWalletAuthToken(token: string | null) {
  authToken = token || null;
  remoteEnabled = !!authToken;
  if (!authToken) {
    if (syncTimer) {
      clearTimeout(syncTimer);
      syncTimer = null;
    }
    return;
  }
  void loadFromServer();
}

/** Unifica estado local com o do servidor (servidor é a fonte da verdade). */
export function hydrateWallet(remote: Partial<WalletState> | null | undefined) {
  if (!remote) return;
  const next: WalletState = {
    plan: (['free', 'pro', 'apex'] as PlanId[]).includes(remote.plan as PlanId) ? (remote.plan as PlanId) : state.plan,
    coins: Number.isFinite(remote.coins) ? Math.max(0, Math.floor(remote.coins as number)) : state.coins,
    refreshedAt: typeof remote.refreshedAt === 'string' && remote.refreshedAt ? remote.refreshedAt : state.refreshedAt,
    weeklyResetAt: typeof remote.weeklyResetAt === 'string' && remote.weeklyResetAt ? remote.weeklyResetAt : state.weeklyResetAt,
    history: Array.isArray(remote.history) ? remote.history.slice(0, 100) : state.history,
  };
  state = next;
  cacheOnly();
  listeners.forEach((l) => l(state));
}

function cacheOnly() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

async function loadFromServer() {
  const token = authToken;
  if (!token) return;
  try {
    const res = await fetch('/api/wallet', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const data = await res.json().catch(() => null);
    if (authToken !== token) return; // sessão mudou durante o fetch
    if (data?.wallet) hydrateWallet(data.wallet);
  } catch {
    /* offline: mantém o cache local */
  }
}

async function pushToServer() {
  const token = authToken;
  if (!token || !remoteEnabled) return;
  if (syncInFlight) {
    syncQueued = true;
    return;
  }
  syncInFlight = true;
  try {
    const res = await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(state),
    });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data?.wallet) hydrateWallet(data.wallet);
    }
  } catch {
    /* offline: o próximo persist reenvia */
  } finally {
    syncInFlight = false;
    if (syncQueued) {
      syncQueued = false;
      void pushToServer();
    }
  }
}

function persist() {
  cacheOnly();
  listeners.forEach((l) => l(state));
  if (remoteEnabled) {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      syncTimer = null;
      void pushToServer();
    }, 600);
  }
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
