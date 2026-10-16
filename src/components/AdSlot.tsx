import React, { useEffect, useRef, useState } from 'react';
import { getAdSenseClient, hasConsent } from '../lib/consent';

const AD_UNIT_SLOTS: Record<string, string> = {
  'blog-inline': '',
  'blog-list-bottom': '',
  'repertoires-result': '',
  'landing-bottom': '',
};

export default function AdSlot({
  slotId,
  format = 'auto',
  className = '',
  label = 'Publicidade',
}: {
  slotId: string;
  format?: 'auto' | 'horizontal' | 'rectangle';
  className?: string;
  label?: string;
}) {
  const ref = useRef<HTMLModElement | null>(null);
  const [consented, setConsented] = useState(() => hasConsent('marketing'));
  const client = getAdSenseClient();
  const unit = AD_UNIT_SLOTS[slotId];

  useEffect(() => {
    const onChange = () => setConsented(hasConsent('marketing'));
    window.addEventListener('apexenem-consent-change', onChange);
    return () => window.removeEventListener('apexenem-consent-change', onChange);
  }, []);

  useEffect(() => {
    if (client && unit && consented && ref.current) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch {
        /* adsbygoogle not ready */
      }
    }
  }, [client, unit, consented]);

  if (!client || !unit || !consented) {
    return (
      <div
        className={`my-6 flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1e293b]/30 py-6 ${className}`}
        aria-hidden="true"
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600">{label}</span>
        <span className="text-[10px] text-slate-300 dark:text-slate-700">Espaço reservado para anúncio</span>
      </div>
    );
  }

  return (
    <div className={`my-6 ${className}`}>
      <span className="block text-center text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600 mb-1">{label}</span>
      <ins
        ref={ref}
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={unit}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
