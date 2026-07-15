import React, { useState, useEffect } from 'react';

function getAnonId(): string {
  const raw = localStorage.getItem('apex_session') || localStorage.getItem('apex_user_id') || '';
  if (!raw) return 'anon_' + Date.now();
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return 'user_' + Math.abs(hash).toString(36);
}

export default function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorStack, setErrorStack] = useState('');
  const [reported, setReported] = useState(false);
  const [sending, setSending] = useState(false);
  const [userNote, setUserNote] = useState('');

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error('ErrorBoundary caught:', event.error);
      setErrorMsg(event.error?.message || String(event.error || 'Unknown error'));
      setErrorStack(event.error?.stack || '');
      setHasError(true);
      event.preventDefault();
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      console.error('Unhandled rejection:', event.reason);
      const reason = event.reason;
      setErrorMsg(reason?.message || String(reason || 'Unhandled promise rejection'));
      setErrorStack(reason?.stack || '');
      setHasError(true);
      event.preventDefault();
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  const reportToApexGuardian = async () => {
    if (reported || sending) return;
    setSending(true);
    try {
      const base = import.meta.env.VITE_APEXGUARDIAN_URL || 'https://apexguardian.onrender.com';
      await fetch(base + '/webhook/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshot_base64: '',
          description: `[Frontend Error]\nMessage: ${errorMsg}\n\nStack: ${errorStack}\n\nUser Note: ${userNote || 'Nenhuma nota'}`,
          timestamp_frontend: Date.now(),
          user_id_anon: getAnonId(),
        }),
      });
      setReported(true);
    } catch {
      setReported(true);
    } finally {
      setSending(false);
    }
  };

  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl text-center max-w-md space-y-4">
          <div className="text-5xl">😓</div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Algo deu errado</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Ocorreu um erro inesperado. Recarregue a página ou reporte o erro.
          </p>
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-left">
              <p className="text-xs font-mono text-red-700 dark:text-red-300 break-all">
                {errorMsg}
              </p>
            </div>
          )}
          {!reported && (
            <textarea
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="(Opcional) Descreva o que voce fez antes do erro..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          )}
          <div className="flex flex-col gap-2">
            {!reported ? (
              <button
                onClick={reportToApexGuardian}
                disabled={sending}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {sending ? 'Enviando...' : 'Reportar Erro ao ApexGuardian'}
              </button>
            ) : (
              <div className="px-6 py-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold">
                ✅ Reportado!
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
