import React, { useEffect, useRef, useState } from 'react';
import { pushAd, isAdsenseConfigured } from '../lib/ads';
import { AD_SLOTS } from '../config/ads';

const STORAGE_PREFIX = 'ApexEnem_reward_';

interface RewardAdOverlayProps {
  action: string;
  onContinue: () => void;
  onClose?: () => void;
}

export function shouldShowRewardAd(action: string, frequency: number): boolean {
  try {
    const key = `${STORAGE_PREFIX}${action}_count`;
    const count = parseInt(localStorage.getItem(key) || '0');
    return count > 0 && count % frequency === 0;
  } catch {
    return false;
  }
}

export function incrementRewardCounter(action: string): void {
  try {
    const key = `${STORAGE_PREFIX}${action}_count`;
    const count = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, String(count + 1));
  } catch { /* noop */ }
}

export default function RewardAdOverlay({ action, onContinue, onClose }: RewardAdOverlayProps) {
  const [countdown, setCountdown] = useState(7);
  const pushedRef = useRef(false);
  const adCode = AD_SLOTS['rewarded'];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (!pushedRef.current && isAdsenseConfigured()) {
      pushAd();
      pushedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleContinue = () => {
    document.body.style.overflow = '';
    onContinue();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 text-center relative animate-in zoom-in-95 duration-300">
        <button
          onClick={() => { document.body.style.overflow = ''; onClose?.(); }}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-bold"
        >
          ✕
        </button>

        <div className="mb-4">
          <span className="text-3xl">🎬</span>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-2">Anúncio Rápido</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Assista ao anúncio para desbloquear esta funcionalidade.
          </p>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden mb-4 min-h-[200px] flex items-center justify-center">
          {isAdsenseConfigured() && adCode ? (
            <div dangerouslySetInnerHTML={{ __html: adCode }} />
          ) : (
            <div className="text-center px-4 py-8">
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">ApexEnem</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Continue estudando e arrase no ENEM!
              </p>
            </div>
          )}
        </div>

        {countdown > 0 ? (
          <div className="text-sm text-slate-400 dark:text-slate-500">
            Liberado em <span className="font-bold text-indigo-600 dark:text-indigo-400">{countdown}</span> segundos...
          </div>
        ) : (
          <button
            onClick={handleContinue}
            className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-200 text-sm"
          >
            Continuar →
          </button>
        )}
      </div>
    </div>
  );
}
