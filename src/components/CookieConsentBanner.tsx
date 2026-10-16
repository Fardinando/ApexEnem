import React, { useState, useEffect } from 'react';
import { Cookie, X, Settings, Check } from 'lucide-react';
import { getConsent, setConsent } from '../lib/consent';
import { navigate } from '../lib/nav';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    setVisible(getConsent() === null);
  }, []);

  if (!visible) return null;

  const finish = (a: boolean, m: boolean) => {
    setConsent({ analytics: a, marketing: m });
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-3 md:p-6" role="dialog" aria-modal="false" aria-label="Aviso de cookies">
      <div className="max-w-3xl mx-auto bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <Cookie className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold mb-1">Nós usamos cookies</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Usamos cookies essenciais para o funcionamento da plataforma e, com seu consentimento, cookies de análise e
              publicidade para melhorar a experiência e manter o serviço gratuito. Saiba mais na nossa{' '}
              <button type="button" onClick={() => navigate('/cookies')} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer">
                Política de Cookies
              </button>
              .
            </p>

            {showPrefs && (
              <div className="mt-4 space-y-3">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0f172a]/40">
                  <input type="checkbox" checked disabled className="mt-0.5 accent-blue-600" aria-label="Cookies necessários (sempre ativos)" />
                  <span>
                    <span className="block text-xs font-bold">Necessários (sempre ativos)</span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">Autenticação, segurança e preferências básicas como o tema.</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-0.5 accent-blue-600" />
                  <span>
                    <span className="block text-xs font-bold">Análise</span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">Ajuda a entender como a plataforma é usada (Google Analytics).</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5 accent-blue-600" />
                  <span>
                    <span className="block text-xs font-bold">Publicidade</span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">Permite exibir anúncios personalizados (Google AdSense).</span>
                  </span>
                </label>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button type="button" onClick={() => finish(true, true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer">
                Aceitar todos
              </button>
              <button type="button" onClick={() => finish(false, false)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer">
                Recusar
              </button>
              {showPrefs ? (
                <button type="button" onClick={() => finish(analytics, marketing)} className="px-4 py-2 border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" /> Salvar preferências
                </button>
              ) : (
                <button type="button" onClick={() => setShowPrefs(true)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5">
                  <Settings className="h-3.5 w-3.5" aria-hidden="true" /> Personalizar
                </button>
              )}
            </div>
          </div>
          <button type="button" onClick={() => finish(false, false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer shrink-0" aria-label="Fechar e recusar cookies opcionais">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
