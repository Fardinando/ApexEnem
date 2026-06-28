import React from 'react';

interface AdPlaceholderProps {
  slot: string;
  format?: 'banner' | 'rectangle' | 'skyscraper';
  className?: string;
}

const FORMAT_CLASSES = {
  banner: 'w-full h-20',
  rectangle: 'w-full max-w-sm h-64',
  skyscraper: 'w-40 h-96'
};

const FORMAT_LABELS = {
  banner: 'Banner 728x90',
  rectangle: 'Retângulo 336x280',
  skyscraper: 'Arranha-céu 160x600'
};

export default function AdPlaceholder({ slot, format = 'banner', className = '' }: AdPlaceholderProps) {
  return (
    <div
      id={`ad-${slot}`}
      className={`relative flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden select-none ${FORMAT_CLASSES[format]} ${className}`}
    >
      <div className="text-center px-4 py-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block">
          Anúncio
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
          {FORMAT_LABELS[format]} — {slot}
        </span>
        <span className="text-[9px] text-slate-300 dark:text-slate-600 mt-0.5 block">
          Espaço reservado para publicidade personalizada
        </span>
      </div>
    </div>
  );
}
