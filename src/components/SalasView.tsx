import React, { useEffect, useMemo, useState } from 'react';
import {
  Users, Plus, LogIn, Trophy, Copy, Check, Loader2, LogOut, Crown,
  Flame, Share2, Calendar, Medal, TrendingUp, Target, Sparkles,
  ArrowUpRight, X as XIcon, Hash,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Sala {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  created_at: string;
  max_members?: number;
}

interface Ranking {
  user_id: string;
  name: string;
  xp_sala: number;
  position: number;
  is_me: boolean;
}

async function authFetch(url: string, init?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  return fetch(url, { ...init, headers });
}

const GRADIENTS = [
  'from-blue-500 via-indigo-500 to-purple-600',
  'from-emerald-500 via-teal-500 to-cyan-600',
  'from-amber-500 via-orange-500 to-red-500',
  'from-pink-500 via-fuchsia-500 to-purple-600',
  'from-sky-500 via-blue-500 to-indigo-600',
  'from-rose-500 via-pink-500 to-fuchsia-600',
];

function pickGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

function daysSince(iso: string): number {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function getInitials(name: string): string {
  if (!name) return 'A';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function MedalhaBadge({ pos }: { pos: number }) {
  if (pos > 3) return <span className="font-mono text-xs text-slate-400">#{pos}</span>;
  const cfg = pos === 1
    ? { bg: 'bg-gradient-to-br from-amber-400 to-yellow-600', text: 'text-white', Icon: Crown, label: '1º' }
    : pos === 2
      ? { bg: 'bg-gradient-to-br from-slate-300 to-slate-500', text: 'text-white', Icon: Medal, label: '2º' }
      : { bg: 'bg-gradient-to-br from-orange-400 to-orange-700', text: 'text-white', Icon: Medal, label: '3º' };
  return (
    <div className={`${cfg.bg} ${cfg.text} w-8 h-8 rounded-full flex items-center justify-center shadow-lg`}>
      <cfg.Icon className="h-4 w-4" aria-hidden="true" />
    </div>
  );
}

function MembroAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'w-6 h-6 text-[9px]' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-9 h-9 text-xs';
  const grad = pickGradient(name);
  return (
    <div className={`${dim} rounded-full flex items-center justify-center font-black text-white shadow bg-gradient-to-br ${grad} ring-2 ring-white dark:ring-[#0f172a]`}>
      {getInitials(name)}
    </div>
  );
}

interface SalaDetalhe {
  sala: Sala;
  ranking: Ranking[];
}

export default function SalasView({ currentUser }: { currentUser: { name: string; id?: string } }) {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [detalhes, setDetalhes] = useState<Record<string, { ranking: Ranking[]; loaded: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState('');
  const [maxMembers, setMaxMembers] = useState(20);
  const [joinCode, setJoinCode] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [modal, setModal] = useState<SalaDetalhe | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await authFetch('/api/salas');
      const data = await r.json();
      const minhas: Sala[] = data?.salas || [];
      setSalas(minhas);
      // pré-carrega ranking de cada pra mostrar métricas no card
      const next: Record<string, { ranking: Ranking[]; loaded: boolean }> = {};
      await Promise.all(minhas.map(async (s) => {
        try {
          const dr = await authFetch(`/api/salas/${s.id}`);
          if (dr.ok) {
            const d = await dr.json();
            next[s.id] = { ranking: d.ranking || [], loaded: true };
          }
        } catch { next[s.id] = { ranking: [], loaded: true }; }
      }));
      setDetalhes(next);
    } catch { setSalas([]); }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim().length < 2) return;
    setErro(null); setEnviando(true);
    try {
      const r = await authFetch('/api/salas', { method: 'POST', body: JSON.stringify({ name: newName.trim(), max_members: maxMembers }) });
      const data = await r.json();
      if (!r.ok) { setErro(data?.error || 'Falha ao criar.'); return; }
      setShowCreate(false); setNewName(''); setMaxMembers(20);
      await refresh();
      await abrirModal(data.sala.id);
    } finally { setEnviando(false); }
  };

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) return;
    setErro(null); setEnviando(true);
    try {
      const r = await authFetch('/api/salas/join', { method: 'POST', body: JSON.stringify({ code }) });
      const data = await r.json();
      if (!r.ok) { setErro(data?.error || 'Código inválido.'); return; }
      setShowJoin(false); setJoinCode('');
      await refresh();
      await abrirModal(data.sala.id);
    } finally { setEnviando(false); }
  };

  const abrirModal = async (id: string) => {
    try {
      const r = await authFetch(`/api/salas/${id}`);
      const data = await r.json();
      if (r.ok) {
        setModal({ sala: data.sala, ranking: data.ranking || [] });
        setDetalhes((d) => ({ ...d, [id]: { ranking: data.ranking || [], loaded: true } }));
      }
    } catch { /* noop */ }
  };

  const sair = async (id: string) => {
    if (!confirm('Sair desta sala? Seu XP acumulado nela será perdido.')) return;
    await authFetch(`/api/salas/${id}/leave`, { method: 'DELETE' });
    setModal(null);
    await refresh();
  };

  const copiarCodigo = (code: string) => {
    navigator.clipboard?.writeText(code).then(() => { setCopiedCode(code); setTimeout(() => setCopiedCode(null), 1600); });
  };

  const compartilharWhatsApp = (sala: Sala) => {
    const msg = `🏆 Vem competir comigo no *${sala.name}* no ApexEnem!\n\nUse o código *${sala.code}* em https://apexenem.com.br/`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Visão geral agregada
  const totalXpTodas = useMemo(() => {
    return (Object.values(detalhes) as { ranking: Ranking[]; loaded: boolean }[])
      .reduce((acc, d) => acc + d.ranking.reduce((a, r) => a + r.xp_sala, 0), 0);
  }, [detalhes]);
  const totalAmigos = useMemo(() => {
    const set = new Set<string>();
    (Object.values(detalhes) as { ranking: Ranking[]; loaded: boolean }[])
      .forEach(d => d.ranking.forEach(r => set.add(r.user_id)));
    set.delete(currentUser.id || '');
    return set.size;
  }, [detalhes, currentUser.id]);
  const melhorPosicao = useMemo(() => {
    let best = Infinity;
    (Object.values(detalhes) as { ranking: Ranking[]; loaded: boolean }[]).forEach(d => {
      const me = d.ranking.find(r => r.is_me);
      if (me && me.position < best) best = me.position;
    });
    return isFinite(best) ? best : null;
  }, [detalhes]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] px-4 sm:px-6 lg:px-10 py-6 lg:py-10 pb-20 lg:pb-10">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 mb-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white shadow-xl">
          <div aria-hidden="true" className="absolute -top-20 -right-16 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-10 -left-10 w-56 h-56 bg-fuchsia-400/20 rounded-full blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur rounded-full text-[11px] font-semibold mb-4">
              <Trophy className="h-3.5 w-3.5" aria-hidden="true" /> Competição com amigos
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">Salas do ApexEnem</h1>
            <p className="text-sm sm:text-base text-white/80 max-w-2xl leading-relaxed mb-6">
              Crie uma sala, compartilhe o código e dispute XP com a galera. Toda redação, simulado e aula vale pontos.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatPill icon={Users} label="Minhas salas" value={salas.length} />
              <StatPill icon={Sparkles} label="Amigos competindo" value={totalAmigos} />
              <StatPill icon={TrendingUp} label="XP acumulado" value={totalXpTodas.toLocaleString('pt-BR')} />
              <StatPill icon={Target} label="Melhor posição" value={melhorPosicao ? `#${melhorPosicao}` : '—'} />
            </div>
          </div>
        </section>

        {/* Ações */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button type="button" onClick={() => { setShowCreate(true); setShowJoin(false); setErro(null); }} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20">
            <Plus className="h-4 w-4" /> Criar sala
          </button>
          <button type="button" onClick={() => { setShowJoin(true); setShowCreate(false); setErro(null); }} className="px-5 py-2.5 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer">
            <LogIn className="h-4 w-4" /> Entrar por código
          </button>
        </div>

        {(showCreate || showJoin) && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] p-5 mb-6 animate-fade-in">
            {showCreate && (
              <form onSubmit={criar} className="space-y-3">
                <h3 className="font-bold text-sm mb-1 flex items-center gap-2"><Plus className="h-4 w-4 text-blue-600" /> Criar nova sala</h3>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome da sala (ex.: Turma 3ºC)" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" maxLength={60} />
                <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-[#0f172a] rounded-xl">
                  <label htmlFor="sala-max" className="text-xs text-slate-600 dark:text-slate-300">Máximo de membros</label>
                  <select id="sala-max" value={maxMembers} onChange={(e) => setMaxMembers(Number(e.target.value))} className="px-3 py-1.5 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold cursor-pointer">
                    {[5, 10, 20, 30, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={enviando || newName.trim().length < 2} className="flex-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2">{enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" />Criar sala</>}</button>
                  <button type="button" onClick={() => { setShowCreate(false); setErro(null); }} className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">Cancelar</button>
                </div>
              </form>
            )}
            {showJoin && (
              <form onSubmit={entrar} className="space-y-3">
                <h3 className="font-bold text-sm mb-1 flex items-center gap-2"><LogIn className="h-4 w-4 text-blue-600" /> Entrar com código</h3>
                <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="CÓDIGO" maxLength={10} className="w-full px-3 py-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-xl font-mono text-center tracking-[0.6em] font-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" autoFocus />
                <div className="flex gap-2">
                  <button type="submit" disabled={enviando || joinCode.trim().length < 4} className="flex-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2">{enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowUpRight className="h-4 w-4" />Entrar</>}</button>
                  <button type="button" onClick={() => { setShowJoin(false); setErro(null); }} className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">Cancelar</button>
                </div>
              </form>
            )}
            {erro && <div className="mt-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-400">{erro}</div>}
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => <div key={i} className="h-56 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />)}
          </div>
        ) : salas.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] p-10 sm:p-14 text-center">
            <div className="mx-auto mb-5 p-4 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl w-fit shadow-lg"><Users className="h-10 w-10" aria-hidden="true" /></div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2">Nenhuma sala ainda</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">Crie uma sala agora e desafie os amigos — o primeiro passo pra turbinar seus estudos.</p>
            <button type="button" onClick={() => setShowCreate(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer"><Plus className="h-4 w-4" />Criar primeira sala</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {salas.map((s) => {
              const det = detalhes[s.id];
              const ranking = det?.ranking || [];
              const totalMembros = ranking.length;
              const totalXp = ranking.reduce((a, r) => a + r.xp_sala, 0);
              const minha = ranking.find(r => r.is_me);
              const topMember = ranking[0];
              const grad = pickGradient(s.id);
              const dias = daysSince(s.created_at);
              const isOwner = s.owner_id === currentUser.id;
              return (
                <article key={s.id} className="group rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                  <div className={`relative h-24 bg-gradient-to-br ${grad} p-4 overflow-hidden`}>
                    <div aria-hidden="true" className="absolute -top-6 -right-6 w-24 h-24 bg-white/15 rounded-full blur-xl" />
                    <div className="relative flex items-start justify-between">
                      <div className="min-w-0">
                        <h3 className="font-black text-white text-base truncate drop-shadow">{s.name}</h3>
                        <p className="text-[10px] font-mono text-white/80 tracking-[0.3em]">#{s.code}</p>
                      </div>
                      {isOwner && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-white/25 backdrop-blur rounded-full text-[9px] font-black text-white uppercase tracking-wider">
                          <Crown className="h-3 w-3" aria-hidden="true" /> Dono
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Métricas rápidas */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <MiniStat icon={Users} value={totalMembros} label="membros" />
                      <MiniStat icon={Flame} value={totalXp.toLocaleString('pt-BR')} label="XP total" />
                      <MiniStat icon={Calendar} value={dias} label={dias === 1 ? 'dia' : 'dias'} />
                    </div>

                    {/* Sua posição */}
                    {minha && (
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/40">
                        <div className="shrink-0"><MedalhaBadge pos={minha.position} /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-mono uppercase text-blue-500 dark:text-blue-400 tracking-wider">Sua posição</p>
                          <p className="text-sm font-black text-blue-700 dark:text-blue-300">{minha.position}º lugar · {minha.xp_sala} XP</p>
                        </div>
                      </div>
                    )}

                    {/* Líder */}
                    {topMember && !topMember.is_me && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                        <span className="truncate">Liderando: <strong className="text-slate-700 dark:text-slate-200">{topMember.name}</strong> ({topMember.xp_sala} XP)</span>
                      </div>
                    )}

                    {/* Avatares dos membros */}
                    {ranking.length > 0 && (
                      <div className="flex items-center -space-x-2">
                        {ranking.slice(0, 5).map((r) => (
                          <div key={r.user_id} title={`${r.name} · ${r.xp_sala} XP`}>
                            <MembroAvatar name={r.name} size="sm" />
                          </div>
                        ))}
                        {ranking.length > 5 && (
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-[#0f172a] flex items-center justify-center text-[9px] font-bold text-slate-500 dark:text-slate-300">
                            +{ranking.length - 5}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => abrirModal(s.id)} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5" />Ranking completo
                      </button>
                      <button type="button" onClick={() => copiarCodigo(s.code)} className="p-2 rounded-lg bg-slate-100 dark:bg-[#0f172a] hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-300" aria-label="Copiar código" title="Copiar código">
                        {copiedCode === s.code ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <button type="button" onClick={() => compartilharWhatsApp(s)} className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 cursor-pointer" aria-label="Compartilhar no WhatsApp" title="Compartilhar no WhatsApp">
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Modal de ranking completo */}
        {modal && (
          <ModalRanking
            sala={modal.sala}
            ranking={modal.ranking}
            currentUserId={currentUser.id}
            onClose={() => setModal(null)}
            onCopy={copiarCodigo}
            copied={copiedCode === modal.sala.code}
            onShare={() => compartilharWhatsApp(modal.sala)}
            onLeave={() => sair(modal.sala.id)}
          />
        )}
      </div>
    </div>
  );
}

function StatPill({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="bg-white/15 backdrop-blur border border-white/20 rounded-2xl p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/70 uppercase tracking-wider mb-1">
        <Icon className="h-3 w-3" aria-hidden="true" />
        {label}
      </div>
      <p className="text-lg sm:text-xl font-black">{value}</p>
    </div>
  );
}

function MiniStat({ icon: Icon, value, label }: { icon: any; value: string | number; label: string }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-[#0f172a] px-2 py-2">
      <Icon className="h-3.5 w-3.5 text-slate-400 mx-auto mb-0.5" aria-hidden="true" />
      <p className="text-sm font-black text-slate-700 dark:text-slate-200 leading-none">{value}</p>
      <p className="text-[9px] font-mono uppercase text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function ModalRanking({
  sala, ranking, currentUserId, onClose, onCopy, copied, onShare, onLeave,
}: {
  sala: Sala;
  ranking: Ranking[];
  currentUserId?: string;
  onClose: () => void;
  onCopy: (code: string) => void;
  copied: boolean;
  onShare: () => void;
  onLeave: () => void;
}) {
  const topXp = ranking[0]?.xp_sala || 0;
  const grad = pickGradient(sala.id);
  const dias = daysSince(sala.created_at);
  const isOwner = sala.owner_id === currentUserId;
  const totalXp = ranking.reduce((a, r) => a + r.xp_sala, 0);
  const avgXp = ranking.length > 0 ? Math.round(totalXp / ranking.length) : 0;
  const minha = ranking.find(r => r.is_me);

  // Podium: top 3 em ordem [2º, 1º, 3º] (ou menos se faltar gente)
  const podium = [ranking[1], ranking[0], ranking[2]].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1e293b] sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com gradient */}
        <header className={`relative bg-gradient-to-br ${grad} text-white p-5 sm:p-7 shrink-0`}>
          <div aria-hidden="true" className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <button type="button" onClick={onClose} className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur cursor-pointer" aria-label="Fechar">
            <XIcon className="h-5 w-5" />
          </button>
          <div className="relative">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/25 rounded-full text-[9px] font-black uppercase tracking-wider mb-2">
              <Hash className="h-2.5 w-2.5" aria-hidden="true" />{sala.code}
              <button type="button" onClick={() => onCopy(sala.code)} className="ml-1 text-white/80 hover:text-white cursor-pointer" aria-label="Copiar código">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-1 pr-10">{sala.name}</h2>
            <p className="text-xs text-white/80">{ranking.length} membros · {dias} {dias === 1 ? 'dia' : 'dias'} · XP total {totalXp.toLocaleString('pt-BR')}</p>
          </div>
        </header>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Podium */}
          {ranking.length > 0 && (
            <section className="p-5 sm:p-7 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-4 text-center">Pódio</h3>
              <div className="grid grid-cols-3 gap-3 items-end">
                {podium.map((p, idx) => {
                  const pos = p.position;
                  const h = pos === 1 ? 'h-28' : pos === 2 ? 'h-20' : 'h-16';
                  const bg = pos === 1 ? 'from-amber-400 to-yellow-500' : pos === 2 ? 'from-slate-300 to-slate-500' : 'from-orange-400 to-orange-700';
                  return (
                    <div key={p.user_id} className={`flex flex-col items-center ${idx === 1 ? 'order-2' : idx === 0 ? 'order-1' : 'order-3'}`}>
                      <MembroAvatar name={p.name} size="lg" />
                      <p className={`mt-2 text-xs font-black truncate max-w-full ${p.is_me ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>{p.name}{p.is_me && ' (você)'}</p>
                      <p className="text-[10px] font-mono text-slate-400">{p.xp_sala} XP</p>
                      <div className={`mt-2 ${h} w-full bg-gradient-to-br ${bg} rounded-t-xl flex items-start justify-center pt-1 text-white font-black text-xs shadow-md`}>
                        {pos === 1 ? <Crown className="h-5 w-5" /> : `${pos}º`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Lista 4+ */}
          {ranking.length > 3 && (
            <section className="p-5 sm:p-7 border-b border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">Demais colocações</h3>
              {ranking.slice(3).map((r) => {
                const pct = topXp > 0 ? Math.round((r.xp_sala / topXp) * 100) : 0;
                return (
                  <div key={r.user_id} className={`relative p-3 rounded-xl overflow-hidden ${r.is_me ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40' : 'bg-slate-50 dark:bg-[#0f172a]'}`}>
                    <div aria-hidden="true" className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500/10 to-blue-500/5 dark:from-blue-500/20 dark:to-blue-500/10" style={{ width: `${pct}%` }} />
                    <div className="relative flex items-center gap-3">
                      <span className="shrink-0 w-7 text-center font-black text-sm text-slate-400">#{r.position}</span>
                      <MembroAvatar name={r.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${r.is_me ? 'text-blue-700 dark:text-blue-300' : ''}`}>{r.name}{r.is_me && <span className="ml-1 text-[9px] font-mono text-blue-500">VOCÊ</span>}</p>
                      </div>
                      <span className="font-black text-sm text-slate-600 dark:text-slate-300 shrink-0">{r.xp_sala.toLocaleString('pt-BR')} XP</span>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {ranking.length === 0 && (
            <div className="p-10 text-center">
              <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm text-slate-500">Ninguém pontuou ainda. Seja o primeiro!</p>
            </div>
          )}

          {/* Insights */}
          <section className="p-5 sm:p-7 grid sm:grid-cols-3 gap-3">
            <InsightCard icon={TrendingUp} label="XP médio por membro" value={avgXp.toLocaleString('pt-BR')} />
            <InsightCard icon={Target} label="Sua posição" value={minha ? `${minha.position}º / ${ranking.length}` : '—'} />
            <InsightCard icon={Flame} label="XP pra alcançar líder" value={minha && topXp > minha.xp_sala ? `+${(topXp - minha.xp_sala).toLocaleString('pt-BR')}` : minha?.position === 1 ? 'Você lidera 👑' : '—'} />
          </section>
        </div>

        {/* Footer sticky */}
        <footer className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] flex gap-2 shrink-0">
          <button type="button" onClick={onShare} className="flex-1 px-3 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer">
            <Share2 className="h-4 w-4" />Convidar amigos
          </button>
          {!isOwner && (
            <button type="button" onClick={onLeave} className="px-3 py-2.5 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer flex items-center gap-1.5">
              <LogOut className="h-3.5 w-3.5" />Sair
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0f172a] dark:to-[#1e293b] border border-slate-200 dark:border-slate-800 p-3">
      <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-slate-400 mb-1">
        <Icon className="h-3 w-3" aria-hidden="true" /> {label}
      </div>
      <p className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}
