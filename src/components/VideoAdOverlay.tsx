import React from 'react';

const STORAGE_KEY = 'ApexEnem_video_ad_count';

export function shouldShowVideoAd(): boolean {
  return false;
}

export function incrementVideoAdCounter(): void {}

export default function VideoAdOverlay({ onContinue }: { onContinue: () => void }) {
  React.useEffect(() => { onContinue(); }, []);
  return null;
}
