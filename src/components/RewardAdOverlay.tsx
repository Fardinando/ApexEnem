import React, { useEffect } from 'react';

const STORAGE_PREFIX = 'ApexEnem_reward_';

interface RewardAdOverlayProps {
  action: string;
  onContinue: () => void;
  onClose?: () => void;
}

export function shouldShowRewardAd(_action: string, _frequency: number): boolean {
  return false;
}

export function incrementRewardCounter(_action: string): void {}

export default function RewardAdOverlay({ onContinue }: RewardAdOverlayProps) {
  useEffect(() => {
    onContinue();
  }, []);
  return null;
}
