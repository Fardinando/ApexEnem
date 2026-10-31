import React, { useEffect, useState } from 'react';
import { Shield, Mail, Lock, AlertTriangle, Clock, FileText, Target, Loader2, LogOut, Eye, EyeOff, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Logo from './Logo';
import MarmitaCodeCredit from './MarmitaCodeCredit';

interface Dashboard {
  profile: {
    id: string;
    name: string;
    birthdate?: string;
    parent_email?: string;
    serie?: string;
    target_score?: number;
    created_at?: string;
    last_login_date?: string;
    longest_streak?: number;
    hard_subjects?: string[];
    total_xp?: number;
    is_minor?: boolean;
    target_courses?: { cursoId: string; uniId: string; nota: number }[];
  };
  activity: { type: string; title: string; description?: string; date: string }[];
  essays: { score: number; title: string; created_at: string }[];
  simulados: { area: string; total: number; correct: number; created_at: string }[];
}

function ageFrom(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso); if (isNaN(d.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

export default function ControleParentalPage() {
  // Extrai o student_id da URL: /controleparental/<uuid>
  const studentId = window.location.pathname.replace('/controleparental/', '').replace(/\/+$/, '');

  const [mode, setMode] = useState<'login' | 'signup' | 'dashboard'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [data, setData] = useState<Dashboard | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Verifica se já tem sessão de pai ativa
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setMode('dashboard');
        setEmail(session.user.email || '');
      }
      setCheckingSession(false);
    })();
  }, []);

  useEffect(() => {
    if (mode === 'dashboard' && studentId) carregarDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, studentId]);

  const carregarDashboard = async () => {
    setLoadingData(true);
    setErro(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setMode('login');
        setLoadingData(false);
        return;
      }
      const r = await fetch(`/api/parent/student/${encodeURIComponent(studentId)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (r.status === 403) {
        setErro('Esta conta não é responsável legal deste estudante. Peça o link correto a quem criou o cadastro.');
      } else if (r.status === 404) {
        setErro('Estudante não encontrado. O link pode estar errado.');
      } else if (!r.ok) {
        setErro('Falha ao carregar os dados.');
      } else {
        setData(await r.json());
      }
    } finally { setLoadingData(false); }
  };

  const fazerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null); setSucesso(null);
    if (password.length < 8) { setErro('Senha com pelo menos 8 caracteres.'); return; }
    if (password !== passwordConfirm) { setErro('As duas senhas não coincidem.'); return; }
    setLoading(true);
    try {
      const r = await fetch('/api/parent/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(body.error || 'Falha ao criar conta de responsável.');
        return;
      }
      // Agora loga automaticamente
      const { error } = await supabase.auth.signInWithPassword({ email: email.toLowerCase().trim(), password });
      if (error) {
        setSucesso('Conta criada. Faça login com o e-mail e senha.');
        setMode('login');
      } else {
        setMode('dashboard');
      }
    } finally { setLoading(false); }
  };

  const fazerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null); setSucesso(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    setLoading(false);
    if (error) {
      if (error.message.includes('Invalid login credentials')) setErro('E-mail ou senha incorretos.');
      else setErro(error.message);
      return;
    }
    setMode('dashboard');
  };

  const sair = async () => {
    await supabase.auth.signOut();
    setData(null);
    setMode('login');
    setEmail('');
    setPassword('');
  };

  const age = ageFrom(data?.profile?.birthdate);

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcf8ff] dark:bg-[#0a0814]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#fcf8ff] dark:bg-[#0a0814] text-[#1b1b24] dark:text-[#f3effc] pb-20">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-[#0a0814]/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2"><Logo variant="favicon-a" className="h-7 w-auto" /></div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-full text-[11px] font-semibold text-blue-700 dark:text-blue-400">
              <Shield className="h-3.5 w-3.5" aria-hidden="true" /> Painel do Responsável
            </div>
            {mode === 'dashboard' && (
              <button type="button" onClick={sair} className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer" aria-label="Sair">
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* ─── Login / Signup ─────────────────────────────── */}
        {(mode === 'login' || mode === 'signup') && (
          <section className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-extrabold tracking-tight">Painel do Responsável</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Acompanhe o uso da plataforma pelo seu(sua) filho(a).</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-[#0f172a] rounded-xl mb-5">
              <button type="button" onClick={() => { setMode('login'); setErro(null); setSucesso(null); }} className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${mode === 'login' ? 'bg-white dark:bg-[#1e293b] text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                Entrar
              </button>
              <button type="button" onClick={() => { setMode('signup'); setErro(null); setSucesso(null); }} className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${mode === 'signup' ? 'bg-white dark:bg-[#1e293b] text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                Criar conta
              </button>
            </div>

            {mode === 'signup' && (
              <div className="p-3 mb-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
                Só é possível criar conta de responsável com um e-mail que já foi cadastrado como responsável legal durante o signup de um estudante menor de idade.
              </div>
            )}

            <form onSubmit={mode === 'login' ? fazerLogin : fazerSignup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold" htmlFor="parent-email">E-mail cadastrado como responsável</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Mail className="h-4 w-4" /></span>
                  <input id="parent-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="voce@exemplo.com" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold" htmlFor="parent-pwd">Senha</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Lock className="h-4 w-4" /></span>
                  <input id="parent-pwd" type={showPwd ? 'text' : 'password'} required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Mínimo 8 caracteres" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" htmlFor="parent-pwd2">Confirme a senha</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Lock className="h-4 w-4" /></span>
                    <input id="parent-pwd2" type={showPwd ? 'text' : 'password'} required minLength={8} autoComplete="new-password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)}
                      className={`w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-[#0f172a] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${passwordConfirm && password !== passwordConfirm ? 'border-red-400 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-blue-500'}`} placeholder="Digite a senha de novo" />
                  </div>
                </div>
              )}

              {erro && <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">{erro}</div>}
              {sucesso && <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg">{sucesso}</div>}

              <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === 'login' ? 'Entrar no painel' : 'Criar conta de responsável')}
              </button>
            </form>
          </section>
        )}

        {/* ─── Dashboard ──────────────────────────────────── */}
        {mode === 'dashboard' && loadingData && (
          <div className="h-40 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}

        {mode === 'dashboard' && !loadingData && erro && (
          <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-bold text-amber-700 dark:text-amber-300 mb-1">Não foi possível carregar</h2>
              <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{erro}</p>
            </div>
          </div>
        )}

        {mode === 'dashboard' && !loadingData && data && (
          <>
            {/* Hero do estudante */}
            <section className="p-6 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
              <div aria-hidden="true" className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/15 rounded-full text-[10px] font-mono uppercase tracking-wider mb-2">
                  <Users className="h-3 w-3" /> Estudante
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">{data.profile.name}</h2>
                <p className="text-sm text-white/80">
                  {age !== null && `${age} anos · `}
                  {data.profile.serie || 'série não informada'}
                  {data.profile.target_score && ` · meta ${data.profile.target_score} pontos`}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  <StatPill label="Último acesso" value={data.profile.last_login_date || '—'} />
                  <StatPill label="Maior ofensiva" value={`${data.profile.longest_streak || 0} dias`} />
                  <StatPill label="XP total" value={(data.profile.total_xp || 0).toLocaleString('pt-BR')} />
                  <StatPill label="Conta criada em" value={data.profile.created_at ? new Date(data.profile.created_at).toLocaleDateString('pt-BR') : '—'} />
                </div>
              </div>
            </section>

            {/* Metas de curso */}
            {data.profile.target_courses && data.profile.target_courses.length > 0 && (
              <section className="p-6 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-blue-600" /> Cursos dos sonhos</h3>
                <ul className="space-y-2 text-sm">
                  {data.profile.target_courses.map((t, i) => (
                    <li key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a]">
                      <span className="truncate pr-2">{t.cursoId} · {t.uniId.toUpperCase()}</span>
                      <span className="font-bold text-blue-600 shrink-0">{Math.round(t.nota)} pts</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Pontos fracos declarados */}
            {data.profile.hard_subjects && data.profile.hard_subjects.length > 0 && (
              <section className="p-6 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold mb-3">Áreas que o(a) estudante marcou como difíceis</h3>
                <div className="flex flex-wrap gap-2">
                  {data.profile.hard_subjects.map((s) => (
                    <span key={s} className="px-3 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-900/40">{s}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Redações */}
            <section className="p-6 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-blue-600" aria-hidden="true" /> Redações corrigidas ({data.essays.length})</h3>
              {data.essays.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhuma redação enviada ainda.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.essays.map((e, i) => (
                    <li key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a]">
                      <div className="min-w-0 pr-3">
                        <p className="truncate font-medium">{e.title || 'Sem título'}</p>
                        <p className="text-[10px] text-slate-400">{new Date(e.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <span className="font-black text-blue-600 shrink-0">{e.score} / 1000</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Simulados */}
            <section className="p-6 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold mb-4">Simulados ({data.simulados.length})</h3>
              {data.simulados.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhum simulado concluído ainda.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.simulados.map((s, i) => (
                    <li key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a]">
                      <div>
                        <p className="font-medium">{s.area}</p>
                        <p className="text-[10px] text-slate-400">{new Date(s.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <span className="font-black text-emerald-600 shrink-0">{s.correct}/{s.total}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Atividade */}
            <section className="p-6 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Clock className="h-4 w-4 text-blue-600" aria-hidden="true" /> Atividade recente</h3>
              {data.activity.length === 0 ? (
                <p className="text-xs text-slate-500">Sem atividade registrada.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.activity.slice(0, 20).map((a, i) => (
                    <li key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a]">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{a.title}</p>
                          {a.description && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{a.description}</p>}
                        </div>
                        <span className="shrink-0 text-[10px] font-mono text-slate-400">{new Date(a.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Direitos */}
            <section className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
              <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" aria-hidden="true" /> Seus direitos (LGPD + ECA Digital)</h3>
              <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1 leading-relaxed">
                <li>• Pedir correção, limitação ou <strong>exclusão de dados pessoais</strong> do(a) menor a qualquer momento</li>
                <li>• <strong>Revogar o consentimento</strong> dado durante o cadastro</li>
                <li>• Receber relatório detalhado dos tratamentos de dados realizados pela plataforma</li>
                <li>• Entrar em contato: <a href="mailto:apexenem@gmail.com" className="font-bold underline">apexenem@gmail.com</a></li>
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

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/15 backdrop-blur border border-white/20 rounded-xl p-3">
      <p className="text-[10px] font-mono uppercase tracking-wider text-white/70 mb-0.5">{label}</p>
      <p className="text-sm font-black truncate">{value}</p>
    </div>
  );
}
