import React, { useState, useEffect } from 'react';

export default function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      console.error('ErrorBoundary caught:', event.error);
      setHasError(true);
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl text-center max-w-md space-y-4">
          <div className="text-5xl">😓</div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Algo deu errado</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Ocorreu um erro inesperado. Recarregue a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
