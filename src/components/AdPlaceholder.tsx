import React from 'react';

interface AdPlaceholderProps {
  slot: string;
  format?: 'banner' | 'rectangle' | 'skyscraper';
  className?: string;
  user?: any;
  setActiveTab?: (tab: string) => void;
}

export default function AdPlaceholder({ slot, format = 'banner', className = '' }: AdPlaceholderProps) {
  return (
    <div className={`relative flex justify-center items-center overflow-hidden ${className}`} style={{ minHeight: 40 }}>
      <div className="text-[10px] text-slate-300 dark:text-slate-700 italic select-none">Aqui seria um anúncio</div>
    </div>
  );
}
