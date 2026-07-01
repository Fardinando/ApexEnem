import React, { useEffect, useRef } from 'react';
import { pushAd, isAdsenseConfigured, getHouseAdContent, markHouseAdSeen, shouldShowHouseAd } from '../lib/ads';
import { AD_SLOTS } from '../config/ads';
import type { UserProfile } from '../types';

interface AdPlaceholderProps {
  slot: string;
  format?: 'banner' | 'rectangle' | 'skyscraper';
  className?: string;
  user?: Partial<UserProfile>;
  setActiveTab?: (tab: string) => void;
}

const FORMAT_CLASSES: Record<string, string> = {
  banner: 'w-full',
  rectangle: 'w-full max-w-sm',
  skyscraper: 'w-40'
};

export default function AdPlaceholder({ slot, format = 'banner', className = '', user, setActiveTab }: AdPlaceholderProps) {
  const pushedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const adsenseEnabled = isAdsenseConfigured();
  const adCode = AD_SLOTS[slot];

  useEffect(() => {
    if (!adsenseEnabled || !adCode) return;
    // Wait for DOM insertion then push ad
    const timer = setTimeout(() => {
      if (!pushedRef.current) {
        pushAd();
        pushedRef.current = true;
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [slot, adsenseEnabled, adCode]);

  // Repush on slot change
  useEffect(() => {
    pushedRef.current = false;
  }, [slot]);

  // AdSense mode — render the <ins> code from config
  if (adsenseEnabled && adCode) {
    return (
      <div
        ref={containerRef}
        className={`relative flex justify-center items-start overflow-hidden ${FORMAT_CLASSES[format]} ${className}`}
        dangerouslySetInnerHTML={{ __html: adCode }}
      />
    );
  }

  // Fallback: personalized house ads
  if (!shouldShowHouseAd()) return null;
  markHouseAdSeen();

  const ad = getHouseAdContent(user);
  if (!ad) return null;

  const handleClick = () => {
    if (setActiveTab && ad.action) {
      setActiveTab(ad.action);
    }
  };

  const containerClass = `relative flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-200/50 dark:border-indigo-800/30 rounded-xl overflow-hidden select-none ${FORMAT_CLASSES[format]} ${className} ${setActiveTab && ad.action ? 'cursor-pointer hover:from-indigo-100 hover:to-blue-100 dark:hover:from-indigo-900/50 dark:hover:to-blue-900/50 transition-all duration-200' : ''}`;

  return (
    <div className={containerClass} onClick={handleClick} role={setActiveTab && ad.action ? 'button' : undefined} tabIndex={setActiveTab && ad.action ? 0 : undefined} onKeyDown={e => { if (e.key === 'Enter' && setActiveTab && ad.action) { handleClick(); } }}>
      <div className="text-2xl sm:text-3xl flex-shrink-0">{ad.emoji}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">{ad.title}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 leading-tight">{ad.text}</p>
        {setActiveTab && ad.action && (
          <span className="inline-block mt-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">{ad.cta} →</span>
        )}
      </div>
    </div>
  );
}
