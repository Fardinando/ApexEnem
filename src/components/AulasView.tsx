import React, { useState } from 'react';
import { PlayCircle, Sparkles, Loader2, Clock, Lightbulb, Film, Lock } from 'lucide-react';
import { useCoinGate } from '../lib/useCoinGate';
import { addCoins, getFeatureCost } from '../lib/coins';
import CoinGateModal from './CoinGateModal';

interface AulasViewProps {
  currentUser: { name: string; id?: string };
}

type Area = 'Matemática' | 'Linguagens' | 'Humanas' | 'Natureza' | 'Redação';
type Tab = 'ia' | 'professores';

interface Lesson {
  title: string;
  subtitle?: string;
  content: string[];
  tips?: string[];
}

const AREAS: Area[] = ['Matemática', 'Linguagens', 'Humanas', 'Natureza', 'Redação'];

async function fetchLesson(area: Area): Promise<Lesson | null> {
  try {
    const r = await fetch('/api/lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ area, level: 6, topicIndex: Math.floor(Math.random() * 500) }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    if (data?.pending && data?.cura) {
      // polling simples
      const deadline = Date.now() + 60000;
      while (Date.now() < deadline) {
        await new Promise((res) => setTimeout(res, 2500));
        const s = await fetch(`/api/ai-task/${encodeURIComponent(data.cura)}`).catch(() => null);
        if (!s || !s.ok) continue;
        const sd = await s.json().catch(() => null);
        if (sd?.status === 'done' && sd?.result) {
          try {
            const cleaned = String(sd.result).replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned.match(/\{[\s\S]*\}/)?.[0] || cleaned);
            if (parsed?.title && Array.isArray(parsed.content)) return parsed;
          } catch { /* ignora */ }
        }
      }
      return null;
    }
    if (data?.title && Array.isArray(data.content)) return data;
    return null;
  } catch {
    return null;
  }
}

function AulasIA() {
  const [area, setArea] = useState<Area>('Matemática');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const coinGate = useCoinGate();

  const gerar = async () => {
    if (!coinGate.trySpend('lesson')) return;
    setLoading(true);
    setErro(null);
    setLesson(null);
    const l = await fetchLesson(area);
    if (!l) {
      addCoins(getFeatureCost('lesson'), 'Reembolso: falha ao gerar aula');
      setErro('Não conseguimos gerar a aula agora. Tente novamente em instantes.');
    } else {
      setLesson(l);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] p-5 sm:p-6">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" aria-hidden="true" />
          Gerar uma aula agora
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={area}
            onChange={(e) => setArea(e.target.value as Area)}
            className="flex-1 min-w-[160px] px-3 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white cursor-pointer"
            disabled={loading}
          >
            {AREAS.map((a) => (<option key={a} value={a}>{a}</option>))}
          </select>
          <button
            type="button"
            onClick={gerar}
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
            {loading ? 'Gerando...' : 'Gerar aula'}
          </button>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
          Aula gerada por IA em formato texto. Para videoaulas gravadas com professores, use a aba <strong>Professores</strong>.
        </p>
      </div>

      {erro && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-sm text-red-700 dark:text-red-400">
          {erro}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (<div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />))}
        </div>
      )}

      {lesson && !loading && (
        <article className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] p-6 sm:p-8 space-y-5">
          <header>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2">{lesson.title}</h2>
            {lesson.subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{lesson.subtitle}</p>}
          </header>
          <div className="space-y-4">
            {lesson.content.map((block, i) => (
              <p key={i} className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                <span className="inline-block text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 mr-2">#{i + 1}</span>
                {block}
              </p>
            ))}
          </div>
          {lesson.tips && lesson.tips.length > 0 && (
            <aside className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" aria-hidden="true" /> Dicas práticas ENEM
              </h3>
              <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                {lesson.tips.map((t, i) => (<li key={i} className="flex gap-2"><span>•</span><span>{t}</span></li>))}
              </ul>
            </aside>
          )}
        </article>
      )}

      <CoinGateModal open={!!coinGate.gate} cost={coinGate.gate?.cost ?? 0} feature="aulas por IA" onClose={coinGate.closeGate} />
    </div>
  );
}

function AulasProfessores({ currentUser }: { currentUser: { name: string; id?: string } }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] p-10 sm:p-14 text-center">
      <div className="mx-auto mb-5 p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl w-fit">
        <Clock className="h-10 w-10" aria-hidden="true" />
      </div>
      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-3">Videoaulas em preparação</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
        Os professores do ApexEnem estão gravando conteúdo original. Enquanto isso, você pode gerar aulas em texto na aba IA.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400">
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
        Vídeos sem download + marca d'água: {currentUser.name} ({(currentUser.id || '').slice(0, 8)})
      </div>
    </div>
  );
}

export default function AulasView({ currentUser }: AulasViewProps) {
  const [tab, setTab] = useState<Tab>('ia');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] px-4 sm:px-6 lg:px-10 py-8 lg:py-10 pb-20 lg:pb-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-400 mb-3">
            <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" /> Aulas
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">Olá, {currentUser.name.split(' ')[0]}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Duas trilhas de aprendizado: aulas em texto geradas por IA sob demanda, e videoaulas gravadas pelos professores do ApexEnem.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl mb-6 max-w-md">
          <button
            type="button"
            onClick={() => setTab('ia')}
            className={`py-2.5 text-center text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
              tab === 'ia' ? 'bg-white dark:bg-[#1e293b] text-blue-600 dark:text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" /> IA (texto)
          </button>
          <button
            type="button"
            onClick={() => setTab('professores')}
            className={`py-2.5 text-center text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
              tab === 'professores' ? 'bg-white dark:bg-[#1e293b] text-blue-600 dark:text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Film className="h-4 w-4" aria-hidden="true" /> Professores (vídeo)
          </button>
        </div>

        {tab === 'ia' ? <AulasIA /> : <AulasProfessores currentUser={currentUser} />}
      </div>
    </div>
  );
}
