import React, { useEffect, useState } from 'react';
import { Coins, Play, Check, X, Loader2 } from 'lucide-react';
import { grantRewarded, getCoins, REWARDED_COINS } from '../lib/coins';

type Phase = 'idle' | 'watching' | 'done';

export default function RewardCoinsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(5);
  const [coins, setCoins] = useState(getCoins());
  const rewardedEnabled = String(import.meta.env.VITE_REWARDED_ENABLED || '').toLowerCase() === 'true';

  useEffect(() => {
    if (open) {
      setPhase('idle');
      setSeconds(5);
    }
  }, [open]);

  useEffect(() => {
    if (phase !== 'watching') return;
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, seconds]);

  useEffect(() => {
    if (phase === 'watching' && seconds === 0) {
      grantRewarded();
      setCoins(getCoins());
      setPhase('done');
    }
  }, [phase, seconds]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Ganhar moedas">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 text-center">
        <button type="button" onClick={onClose} className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer" aria-label="Fechar">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="mx-auto mb-4 p-3 w-fit rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
          <Coins className="h-7 w-7" aria-hidden="true" />
        </div>

        <h2 className="text-lg font-extrabold mb-1">Ganhar moedas</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Saldo atual: <strong className="text-amber-600 dark:text-amber-400">{coins}</strong> moedas
        </p>

        {phase === 'idle' && (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
              Assista a um anúncio curto e ganhe <strong className="text-amber-600 dark:text-amber-400">+{REWARDED_COINS} moedas</strong> para usar na correção de redação e nas funcionalidades de IA.
            </p>
            <button type="button" onClick={() => { setSeconds(5); setPhase('watching'); }} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer">
              <Play className="h-4 w-4" aria-hidden="true" /> Assistir anúncio
            </button>
            {!rewardedEnabled && (
              <p className="text-[10px] text-slate-400 mt-3">Modo de teste: o anúncio recompensado real será ativado quando o Google Ad Manager for configurado.</p>
            )}
          </>
        )}

        {phase === 'watching' && (
          <div className="py-4">
            <div className="mx-auto mb-4 h-24 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <span className="text-xs text-slate-400">Anúncio recompensado…</span>
            </div>
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin mx-auto mb-2" aria-hidden="true" />
            <p className="text-xs text-slate-400">Aguarde {seconds}s…</p>
          </div>
        )}

        {phase === 'done' && (
          <>
            <div className="mx-auto mb-3 p-2 w-fit rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Check className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-1">+{REWARDED_COINS} moedas creditadas!</p>
            <p className="text-xs text-slate-400 mb-5">Novo saldo: {coins} moedas.</p>
            <button type="button" onClick={onClose} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition cursor-pointer">Continuar</button>
          </>
        )}
      </div>
    </div>
  );
}
