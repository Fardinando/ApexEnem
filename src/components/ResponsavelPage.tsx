import React, { useEffect, useState } from 'react';
import { Shield, Clock, FileText, Target, AlertTriangle, Mail, Loader2, GraduationCap } from 'lucide-react';
import Logo from './Logo';
import MarmitaCodeCredit from './MarmitaCodeCredit';

interface Dashboard {
  profile: {
    name: string;
    birthdate?: string;
    parent_email?: string;
    serie?: string;
    target_score?: number;
    created_at?: string;
    last_login_date?: string;
    longest_streak?: number;
  } | null;
  activity: { type: string; title: string; date: string }[];
  essays: { title: string; score: number; created_at: string }[];
  simulados: { area: string; total: number; correct: number; created_at: string }[];
}

function ageFrom(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

export default function ResponsavelPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('s');
    const t = params.get('t');
    if (!s || !t) {
      setErro('Link inválido. Verifique o endereço do e-mail.');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const r = await fetch(`/api/responsavel/dashboard?s=${encodeURIComponent(s)}&t=${encodeURIComponent(t)}`);
        if (!r.ok) {
          setErro('Este link não é mais válido. Peça ao(à) estudante um novo link ou escreva para apexenem@gmail.com.');
        } else {
          setData(await r.json());
        }
      } catch {
        setErro('Falha de conexão. Tente novamente em instantes.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const age = ageFrom(data?.profile?.birthdate);

  return (
    <div className="relative min-h-screen bg-[#fcf8ff] dark:bg-[#0a0814] text-[#1b1b24] dark:text-[#f3effc] pb-16">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2"><Logo variant="favicon-a" className="h-7 w-auto" /></div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-full text-[11px] font-semibold text-blue-700 dark:text-blue-400">
            <Shield className="h-3.5 w-3.5" aria-hidden="true" /> Painel do Responsável
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {loading && (
          <div className="h-40 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}

        {!loading && erro && (
          <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-bold text-amber-700 dark:text-amber-300 mb-1">Não foi possível abrir o painel</h2>
              <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{erro}</p>
            </div>
          </div>
        )}

        {!loading && data && (
          <>
            <section className="p-6 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2">Estudante: {data.profile?.name || '—'}</h1>
              <div className="grid sm:grid-cols-3 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-[10px] font-mono uppercase text-slate-400">Idade</p>
                  <p className="font-bold">{age !== null ? `${age} anos` : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase text-slate-400">Série</p>
                  <p className="font-bold">{data.profile?.serie || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase text-slate-400">Meta ENEM</p>
                  <p className="font-bold">{data.profile?.target_score || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase text-slate-400">Último acesso</p>
                  <p className="font-bold">{data.profile?.last_login_date || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase text-slate-400">Maior sequência</p>
                  <p className="font-bold">{data.profile?.longest_streak || 0} dias</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase text-slate-400">Conta criada em</p>
                  <p className="font-bold">{data.profile?.created_at ? new Date(data.profile.created_at).toLocaleDateString('pt-BR') : '—'}</p>
                </div>
              </div>
            </section>

            <section className="p-6 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-blue-600" aria-hidden="true" /> Redações corrigidas (últimas 10)</h2>
              {data.essays.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhuma redação enviada ainda.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.essays.map((e, i) => (
                    <li key={i} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-[#0f172a]">
                      <span className="truncate pr-2">{e.title || 'Sem título'}</span>
                      <span className="font-bold text-blue-600 shrink-0">{e.score} / 1000</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="p-6 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-blue-600" aria-hidden="true" /> Simulados (últimos 10)</h2>
              {data.simulados.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhum simulado concluído ainda.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.simulados.map((s, i) => (
                    <li key={i} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-[#0f172a]">
                      <span>{s.area}</span>
                      <span className="font-bold text-emerald-600 shrink-0">{s.correct}/{s.total}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="p-6 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2"><Clock className="h-4 w-4 text-blue-600" aria-hidden="true" /> Atividade recente</h2>
              {data.activity.length === 0 ? (
                <p className="text-xs text-slate-500">Sem atividade registrada.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.activity.slice(0, 10).map((a, i) => (
                    <li key={i} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-[#0f172a]">
                      <span className="truncate pr-2">{a.title}</span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{new Date(a.date).toLocaleDateString('pt-BR')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
              <h2 className="text-sm font-bold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" aria-hidden="true" /> Direitos do responsável (LGPD + ECA Digital)</h2>
              <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1 leading-relaxed">
                <li>• Pedir correção, limitação ou exclusão de dados pessoais do(a) menor</li>
                <li>• Revogar o consentimento a qualquer momento</li>
                <li>• Receber relatório detalhado dos tratamentos realizados</li>
                <li>• Entrar em contato: <a href="mailto:apexenem@gmail.com" className="font-bold underline inline-flex items-center gap-1"><Mail className="h-3 w-3" /> apexenem@gmail.com</a></li>
              </ul>
            </section>
          </>
        )}
      </main>

      <div className="fixed bottom-3 inset-x-0 flex justify-center z-10 pointer-events-none">
        <div className="pointer-events-auto"><MarmitaCodeCredit /></div>
      </div>
    </div>
  );
}

// Target icon import placeholder to satisfy unused warning if needed
export const _Target = Target;
