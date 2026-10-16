import React, { useState } from 'react';
import { Coins, X, Crown, Play } from 'lucide-react';
import RewardCoinsModal from './RewardCoinsModal';
import { navigate } from '../lib/nav';

export default function CoinGateModal({ open, cost, feature, onClose }: { open: boolean; cost: number; feature?: string; onClose: () => void }) {
  const [showReward, setShowReward] = useState(false);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[105] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Moedas insuficientes">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 text-center">
          <button type="button" onClick={onClose} className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer" aria-label="Fechar">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="mx-auto mb-4 p-3 w-fit rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Coins className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-extrabold mb-1">Moedas insuficientes</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
            Esta funcionalidade custa <strong className="text-amber-600 dark:text-amber-400">{cost} moedas</strong>{feature ? ` (${feature})` : ''} e você não tem saldo suficiente. Ganhe moedas assistindo a um anúncio ou faça upgrade.
          </p>
          <div className="space-y-2">
            <button type="button" onClick={() => setShowReward(true)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer">
              <Play className="h-4 w-4" aria-hidden="true" /> Ganhar moedas
            </button>
            <button type="button" onClick={() => { onClose(); navigate('/planos'); }} className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-95 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer">
              <Crown className="h-4 w-4" aria-hidden="true" /> Ver planos
            </button>
          </div>
        </div>
      </div>
      <RewardCoinsModal open={showReward} onClose={() => setShowReward(false)} />
    </>
  );
}
