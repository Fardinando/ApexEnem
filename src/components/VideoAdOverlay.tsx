import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VIDEO_AD_CONFIG } from '../config/ads';

const STORAGE_KEY = 'ApexEnem_video_ad_count';

export function shouldShowVideoAd(): boolean {
  if (!VIDEO_AD_CONFIG.enabled) return false;
  try {
    const count = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
    return count > 0 && count % VIDEO_AD_CONFIG.intervalActions === 0;
  } catch {
    return false;
  }
}

export function incrementVideoAdCounter(): void {
  try {
    const count = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
    localStorage.setItem(STORAGE_KEY, String(count + 1));
  } catch { /* noop */ }
}

interface VideoAdOverlayProps {
  onContinue: () => void;
}

export default function VideoAdOverlay({ onContinue }: VideoAdOverlayProps) {
  const [countdown, setCountdown] = useState(VIDEO_AD_CONFIG.duration);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleContinue = () => {
    document.body.style.overflow = '';
    setVisible(false);
    incrementVideoAdCounter();
    onContinue();
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full h-full sm:w-[90vw] sm:h-[80vh] sm:max-w-3xl sm:max-h-[600px] bg-black rounded-none sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        >
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#0a0a1a] to-[#1a1a2e] min-h-0">
            {VIDEO_AD_CONFIG.tagUrl ? (
              <iframe
                src={VIDEO_AD_CONFIG.tagUrl}
                className="w-full h-full border-none"
                allow="autoplay; fullscreen; picture-in-picture"
                title="video-ad"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-indigo-600/20 flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-white font-bold text-lg mb-1">ApexEnem</p>
                <p className="text-slate-400 text-sm">Anúncio em breve</p>
              </div>
            )}
          </div>

          <div className="bg-[#0f0f23] border-t border-slate-800 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
            {countdown > 0 ? (
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-700" />
                    <circle
                      cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2"
                      className="text-indigo-500"
                      strokeDasharray={100.53}
                      strokeDashoffset={100.53 * (1 - countdown / VIDEO_AD_CONFIG.duration)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                    {countdown}
                  </span>
                </div>
                <span className="text-sm text-slate-400">Anúncio termina em {countdown}s</span>
              </div>
            ) : (
              <span className="text-sm text-green-400 font-medium">Anúncio finalizado</span>
            )}

            <button
              onClick={handleContinue}
              disabled={countdown > 0}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                countdown > 0
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25'
              }`}
            >
              {countdown > 0 ? `Aguarde ${countdown}s` : 'Continuar →'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
