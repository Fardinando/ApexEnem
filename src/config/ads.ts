export interface AdSlot {
  code: string;
  width: number;
  height: number;
}

export const AD_SLOTS: Record<string, AdSlot> = {};

export const SPECIAL_ADS: string[] = [];
export const SMARTLINK_SLOT = 'smartlink_url';

export function hasAdSlotsConfigured(): boolean {
  return false;
}

export const VIDEO_AD_CONFIG = {
  enabled: false,
  intervalActions: 3,
  duration: 10,
  tagUrl: '',
};
