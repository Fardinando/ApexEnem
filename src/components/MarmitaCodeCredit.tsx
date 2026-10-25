import React from 'react';

export default function MarmitaCodeCredit({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-1.5 text-xs text-slate-400 ${className}`}>
      <span>Desenvolvido por</span>
      <a
        href="https://marmitacode.vercel.app"
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold tracking-tight bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent hover:from-amber-400 hover:to-orange-500 transition"
        aria-label="MarmitaCode — abre em nova aba"
      >
        MarmitaCode
      </a>
    </div>
  );
}
