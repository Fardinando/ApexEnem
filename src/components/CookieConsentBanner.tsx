import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

const STORAGE_KEY = 'ApexEnem_cookie_consent';

type Consent = 'accepted' | 'rejected' | null;

export default function CookieConsentBanner() {
  const [consent, setConsent] = useState<Consent>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'accepted' || stored === 'rejected') {
      setConsent(stored);
    }
  }, []);

  if (consent !== null || dismissed) return null;

  const handleChoice = (choice: 'accepted' | 'rejected') => {
    localStorage.setItem(STORAGE_KEY, choice);
    setConsent(choice);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6">
      <div className="max-w-3xl mx-auto bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="p-2.5 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
          <Cookie className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold mb-1">Nós usamos cookies</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Utilizamos cookies para melhorar sua experiência e compreender como nossos serviços são usados.
            Nenhum cookie é necessário para criar sua conta ou usar a plataforma.
            Veja nossa{' '}
            <a
              href="/cookies"
              onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/cookies'); window.dispatchEvent(new Event('popstate')); }}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Política de Cookies
            </a>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleChoice('accepted')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Aceitar cookies
          </button>
          <button
            type="button"
            onClick={() => handleChoice('rejected')}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
