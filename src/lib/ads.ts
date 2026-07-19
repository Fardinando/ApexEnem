import type { UserProfile } from '../types';

export function isAnyAdConfigured(): boolean {
  return false;
}

export function loadSpecialAds(): () => void {
  return () => {};
}

export function getSmartlinkUrl(): string | null {
  return null;
}

export function getHouseAdContent(_user?: Partial<UserProfile>): { emoji: string; title: string; text: string; cta: string; action?: string } {
  return { emoji: '🚀', title: 'ApexEnem', text: 'Sua plataforma para arrasar no ENEM!', cta: 'Explorar', action: 'dashboard' };
}

export function markHouseAdSeen(): void {}

export function shouldShowHouseAd(): boolean {
  return false;
}
