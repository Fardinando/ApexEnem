import React, { useEffect } from 'react';
import { Check, X, Sparkles, Crown, Rocket, Flower2 } from 'lucide-react';
import PublicLayout from './PublicLayout';
import { PLANS, formatBRL } from '../config/plans';
import { applySeo } from '../lib/seo';
import { navigate } from '../lib/nav';

const ICONS = { free: Flower2, pro: Rocket, apex: Crown } as const;

export default function PlansPage({ onSignup, onLogin }: { onSignup?: () => void; onLogin?: () => void }) {
  useEffect(() => {
    applySeo({
      title: 'Planos e preços',
      description:
        'Conheça os planos do ApexEnem: Free, PRO (sem anúncios, mais moedas de IA) e Apex (IA Professora + prioridade). Correção de redação, questões e simulados.',
      path: '/planos',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'ApexEnem',
        description: 'Plataforma de estudos para o ENEM com correção de redação por IA.',
        offers: PLANS.map((p) => ({
          '@type': 'Offer',
          name: p.name,
          price: p.priceBRL.toFixed(2),
          priceCurrency: 'BRL',
        })),
      },
    });
  }, []);

  const go = onSignup || (() => navigate('/signup'));
  const goLogin = onLogin || (() => navigate('/login'));

  return (
    <PublicLayout crumbs={[{ label: 'Início', path: '/' }, { label: 'Planos' }]}>
      <section className="max-w-6xl mx-auto px-4 pt-10 pb-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-400 mb-5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Planos do ApexEnem
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Comece grátis. Suba de nível quando quiser.</h1>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Todos os planos incluem a base completa de estudos. Os planos pagos removem anúncios e dão muito mais moedas de IA.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => {
            const Icon = ICONS[plan.id];
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl border p-6 md:p-8 flex flex-col ${
                  plan.highlight
                    ? 'border-blue-300 dark:border-blue-700 bg-white dark:bg-[#1e293b] shadow-xl shadow-blue-100/50 dark:shadow-none md:-mt-4'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b]'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                    Mais popular
                  </span>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <span className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-lg font-extrabold">{plan.name}</h2>
                    <p className="text-[11px] text-slate-400">{plan.tagline}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-extrabold tracking-tight">
                    {plan.priceBRL === 0 ? 'Grátis' : formatBRL(plan.priceBRL)}
                  </span>
                  {plan.priceBRL > 0 && <span className="text-sm text-slate-400 font-medium">/mês</span>}
                </div>

                <ul className="space-y-3 flex-grow mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      {f.included ? (
                        <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <X className="h-4 w-4 text-slate-300 dark:text-slate-600 mt-0.5 shrink-0" aria-hidden="true" />
                      )}
                      <span className={f.included ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500 line-through'}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.priceBRL === 0 ? (
                  <button type="button" onClick={go} className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold transition cursor-pointer">
                    Criar conta grátis
                  </button>
                ) : (
                  <button type="button" onClick={() => navigate('/contato')} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition cursor-pointer">
                    Assinar {plan.name} · {formatBRL(plan.priceBRL)}/mês
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8 max-w-xl mx-auto leading-relaxed">
          O pagamento dos planos PRO e Apex será habilitado em breve. Ao assinar você concorda com os{' '}
          <button type="button" onClick={() => navigate('/assinatura')} className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Termos de Assinatura</button>{' '}
          e a{' '}
          <button type="button" onClick={() => navigate('/reembolso')} className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Política de Reembolso</button>.
        </p>

        <div className="text-center mt-8">
          <button type="button" onClick={goLogin} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
            Já tenho conta — entrar
          </button>
        </div>
      </section>
    </PublicLayout>
  );
}
