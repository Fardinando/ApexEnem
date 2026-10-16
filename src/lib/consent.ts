export interface ConsentState {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  ts: number;
  version: number;
}

export type ConsentCategory = 'analytics' | 'marketing';

const STORAGE_KEY = 'ApexEnem_cookie_consent';
const CONSENT_VERSION = 2;

type Listener = (state: ConsentState | null) => void;
const listeners = new Set<Listener>();

export function getConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    if (raw === 'accepted') {
      return { necessary: true, analytics: true, marketing: true, ts: 0, version: 1 };
    }
    if (raw === 'rejected') {
      return { necessary: true, analytics: false, marketing: false, ts: 0, version: 1 };
    }
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setConsent(categories: { analytics: boolean; marketing: boolean }): ConsentState {
  const state: ConsentState = {
    necessary: true,
    analytics: categories.analytics,
    marketing: categories.marketing,
    ts: Date.now(),
    version: CONSENT_VERSION,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l(state));
  applyConsent(state);
  try {
    window.dispatchEvent(new Event('apexenem-consent-change'));
  } catch {
    /* noop */
  }
  return state;
}

export function clearConsent() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
  listeners.forEach((l) => l(null));
}

export function hasConsent(category: ConsentCategory): boolean {
  const c = getConsent();
  return !!c && c[category] === true;
}

export function onConsentChange(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

let analyticsLoaded = false;
let adsenseLoaded = false;

export function loadAnalytics() {
  if (analyticsLoaded || !hasConsent('analytics')) return;
  const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;
  if (!GA_ID) return;
  analyticsLoaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).gtag = function () {
    (window as any).dataLayer.push(arguments);
  };
  (window as any).gtag('js', new Date());
  (window as any).gtag('config', GA_ID, { anonymize_ip: true });
}

export function loadAdSense() {
  if (adsenseLoaded || !hasConsent('marketing')) return;
  const client = getAdSenseClient();
  if (!client) return;
  adsenseLoaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  document.head.appendChild(s);
}

export function getAdSenseClient(): string | undefined {
  return (import.meta.env.VITE_ADSENSE_CLIENT as string | undefined) || undefined;
}

export function applyConsent(state: ConsentState) {
  if (state.analytics) loadAnalytics();
  if (state.marketing) loadAdSense();
}

export function initConsentServices() {
  const state = getConsent();
  if (state) applyConsent(state);
}
