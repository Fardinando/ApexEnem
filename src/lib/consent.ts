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

// ECA Digital (Lei 15.211/2025) + LGPD Art. 14 §3º proíbem perfilamento
// publicitário de crianças e adolescentes. Mesmo com consentimento do
// responsável, mantemos ads não-personalizados (NPA) e aplicamos TFUA
// (tag_for_under_age_of_consent) para menores de 16 e TFCD para < 13.
function readAgeFromProfile(): number | null {
  try {
    const raw = localStorage.getItem('ApexEnem_user_birthdate');
    if (!raw) return null;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  } catch {
    return null;
  }
}

export function loadAdSense() {
  if (adsenseLoaded || !hasConsent('marketing')) return;
  const client = getAdSenseClient();
  if (!client) return;
  adsenseLoaded = true;

  const age = readAgeFromProfile();
  const isMinor = age !== null && age < 18;
  const underAgeOfConsent = age !== null && age < 16;
  const childDirected = age !== null && age < 13;

  (window as any).adsbygoogle = (window as any).adsbygoogle || [];
  if (isMinor || age === null) {
    // non-personalized ads por padrão quando idade desconhecida ou menor
    (window as any).adsbygoogle.requestNonPersonalizedAds = 1;
  }
  (window as any).adsbygoogle.pauseAdRequests = 0;
  (window as any).adsbygoogle.push = (window as any).adsbygoogle.push || function (c: any) {
    (window as any).adsbygoogle.length = ((window as any).adsbygoogle.length || 0) + 1;
    return c;
  };

  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  if (underAgeOfConsent) s.setAttribute('data-tag-for-under-age-of-consent', '1');
  if (childDirected) s.setAttribute('data-tag-for-child-directed-treatment', '1');
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
