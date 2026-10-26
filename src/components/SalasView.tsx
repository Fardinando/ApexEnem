import React, { useEffect, useState } from 'react';
import { Users, Plus, LogIn, Trophy, Copy, Check, Loader2, LogOut, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Sala {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  created_at: string;
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

export default function SalasView({ currentUser }: { currentUser: { name: string; id?: string } }) {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [selectedSala, setSelectedSala] = useState<string | null>(null);
  const [ranking, setRanking] = useState<Ranking[]>([]);
  const [rankingSala, setRankingSala] = useState<Sala | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await authFetch('/api/salas');
      const data = await r.json();
      setSalas(data?.salas || []);
    } catch { setSalas([]); }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim().length < 2) return;
    setErro(null); setEnviando(true);
    try {
      const r = await authFetch('/api/salas', { method: 'POST', body: JSON.stringify({ name: newName.trim() }) });
      const data = await r.json();
      if (!r.ok) { setErro(data?.error || 'Falha ao criar.'); return; }
      setShowCreate(false); setNewName('');
      await refresh();
      abrirSala(data.sala.id);
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
      abrirSala(data.sala.id);
    } finally { setEnviando(false); }
  };

  const abrirSala = async (id: string) => {
    setSelectedSala(id);
    setRanking([]); setRankingSala(null);
    try {
      const r = await authFetch(`/api/salas/${id}`);
      const data = await r.json();
      if (r.ok) { setRankingSala(data.sala); setRanking(data.ranking || []); }
    } catch { /* noop */ }
  };

  const sair = async (id: string) => {
    if (!confirm('Sair desta sala?')) return;
    await authFetch(`/api/salas/${id}/leave`, { method: 'DELETE' });
    setSelectedSala(null);
    await refresh();
  };

  const copiarCodigo = (code: string) => {
    navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] px-4 sm:px-6 lg:px-10 py-8 lg:py-10 pb-20 lg:pb-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-400 mb-3">
            <Trophy className="h-3.5 w-3.5" aria-hidden="true" /> Competição com amigos
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">Suas salas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Crie uma sala, compartilhe o código e dispute XP com seus amigos. Cada atividade (redação, simulado, aula) soma pontos ao seu placar na sala.
          </p>
        </header>

        <div className="flex flex-wrap gap-3 mb-6">
          <button type="button" onClick={() => { setShowCreate(true); setShowJoin(false); setErro(null); }} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer">
            <Plus className="h-4 w-4" /> Criar sala
          </button>
          <button type="button" onClick={() => { setShowJoin(true); setShowCreate(false); setErro(null); }} className="px-4 py-2.5 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer">
            <LogIn className="h-4 w-4" /> Entrar por código
          </button>
        </div>

        {(showCreate || showJoin) && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] p-5 mb-6">
            {showCreate && (
              <form onSubmit={criar} className="flex flex-col sm:flex-row gap-3">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome da sala (ex.: Turma 3ºC)" className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                <button type="submit" disabled={enviando} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl cursor-pointer">{enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}</button>
              </form>
            )}
            {showJoin && (
              <form onSubmit={entrar} className="flex flex-col sm:flex-row gap-3">
                <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="CÓDIGO" maxLength={10} className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-base font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                <button type="submit" disabled={enviando} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl cursor-pointer">{enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}</button>
              </form>
            )}
            {erro && <div className="mt-3 p-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">{erro}</div>}
          </div>
        )}

        {loading ? (
          <div className="h-24 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div>
        ) : salas.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] p-10 text-center">
            <div className="mx-auto mb-5 p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-2xl w-fit"><Users className="h-10 w-10" /></div>
            <h2 className="text-xl font-extrabold tracking-tight mb-2">Nenhuma sala ainda</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">Crie sua primeira sala e chame os amigos pra competir.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {salas.map((s) => (
              <article key={s.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] p-5 space-y-3">
                <header className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm">{s.name}</h3>
                  {s.owner_id === currentUser.id && <span className="text-[10px] font-mono bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-0.5 rounded-full">DONO</span>}
                </header>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-2 py-1.5 bg-slate-50 dark:bg-[#0f172a] rounded-lg text-xs font-mono tracking-widest">{s.code}</code>
                  <button type="button" onClick={() => copiarCodigo(s.code)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer" aria-label="Copiar código">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => abrirSala(s.id)} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer">Ver ranking</button>
                  <button type="button" onClick={() => sair(s.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer" aria-label="Sair"><LogOut className="h-4 w-4" /></button>
                </div>
              </article>
            ))}
          </div>
        )}

        {selectedSala && rankingSala && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setSelectedSala(null)}>
            <div className="w-full max-w-md bg-white dark:bg-[#1e293b] rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <header className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-[#1e293b]">
                <div>
                  <h2 className="font-bold text-base">{rankingSala.name}</h2>
                  <p className="text-[11px] font-mono text-slate-400 tracking-widest">{rankingSala.code}</p>
                </div>
                <button type="button" onClick={() => setSelectedSala(null)} className="text-slate-400 hover:text-slate-600 text-xl cursor-pointer">×</button>
              </header>
              <div className="p-5 space-y-2">
                {ranking.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">Nenhum membro ainda.</p>
                ) : (
                  ranking.map((r) => (
                    <div key={r.user_id} className={`flex items-center gap-3 p-3 rounded-xl ${r.is_me ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40' : 'bg-slate-50 dark:bg-[#0f172a]'}`}>
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${r.position === 1 ? 'bg-amber-100 text-amber-700' : r.position === 2 ? 'bg-slate-200 text-slate-700' : r.position === 3 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                        {r.position === 1 ? <Crown className="h-4 w-4" /> : r.position}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{r.name}{r.is_me && <span className="ml-2 text-[10px] font-mono text-blue-600">VOCÊ</span>}</p>
                      </div>
                      <span className="font-black text-sm text-blue-600">{r.xp_sala} XP</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
