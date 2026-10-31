import React, { useState } from 'react';
import { PlayCircle, Sparkles, Loader2, Clock, Lightbulb, Film, Lock, AlertCircle, BookOpen, Zap, ArrowRight, Target } from 'lucide-react';
import { useCoinGate } from '../lib/useCoinGate';
import { addCoins, getFeatureCost } from '../lib/coins';
import CoinGateModal from './CoinGateModal';
import { trackLessonCompleted } from '../lib/salasTracking';

interface AulasViewProps {
  currentUser: { name: string; id?: string; hardSubjects?: string[]; serie?: string };
  wrongAnswers?: { subject: string; topic?: string; method?: string }[];
}

type Area = 'Matemática' | 'Linguagens' | 'Humanas' | 'Natureza' | 'Redação';
type Tab = 'ia' | 'professores';

interface LessonBlock { heading: string; body: string }
interface LessonExample { statement: string; solution: string; answer: string }

interface Lesson {
  title: string;
  subtitle?: string;
  intro?: string;
  content: LessonBlock[];
  examples?: LessonExample[];
  commonMistakes?: string[];
  quickReview?: string[];
  tips?: string[];
  nextSteps?: string[];
}

const AREAS: Area[] = ['Matemática', 'Linguagens', 'Humanas', 'Natureza', 'Redação'];

function normalizeLesson(parsed: any): Lesson | null {
  if (!parsed || !parsed.title || !Array.isArray(parsed.content) || parsed.content.length < 3) return null;
  // Compat: content pode vir como string[]
  const content: LessonBlock[] = parsed.content.map((c: any, i: number) => (
    typeof c === 'string'
      ? { heading: `Parte ${i + 1}`, body: c }
      : { heading: String(c?.heading || `Parte ${i + 1}`), body: String(c?.body || '') }
  ));
  return {
    title: String(parsed.title),
    subtitle: parsed.subtitle ? String(parsed.subtitle) : '',
    intro: parsed.intro ? String(parsed.intro) : '',
    content,
    examples: Array.isArray(parsed.examples) ? parsed.examples.map((e: any) => ({
      statement: String(e?.statement || ''), solution: String(e?.solution || ''), answer: String(e?.answer || ''),
    })).filter((e: LessonExample) => e.statement) : [],
    commonMistakes: Array.isArray(parsed.commonMistakes) ? parsed.commonMistakes.map(String) : [],
    quickReview: Array.isArray(parsed.quickReview) ? parsed.quickReview.map(String) : [],
    tips: Array.isArray(parsed.tips) ? parsed.tips.map(String) : [],
    nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.map(String) : [],
  };
}

async function fetchLesson(area: Area, opts: { weakTopics?: string[]; wrongAnswers?: any[]; serie?: string }): Promise<Lesson | null> {
  try {
    const r = await fetch('/api/lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        area,
        level: 6,
        topicIndex: Math.floor(Math.random() * 500),
        weakTopics: opts.weakTopics || [],
        wrongAnswers: opts.wrongAnswers || [],
        serie: opts.serie,
      }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    if (data?.pending && data?.cura) {
      // polling simples
      const deadline = Date.now() + 90000;
      while (Date.now() < deadline) {
        await new Promise((res) => setTimeout(res, 2500));
        const s = await fetch(`/api/ai-task/${encodeURIComponent(data.cura)}`).catch(() => null);
        if (!s || !s.ok) continue;
        const sd = await s.json().catch(() => null);
        if (sd?.status === 'done' && sd?.result) {
          try {
            const cleaned = String(sd.result).replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned.match(/\{[\s\S]*\}/)?.[0] || cleaned);
            const lesson = normalizeLesson(parsed);
            if (lesson) return lesson;
          } catch { /* ignora */ }
        }
      }
      return null;
    }
    return normalizeLesson(data);
  } catch {
    return null;
  }
}

function AulasIA({ currentUser, wrongAnswers }: { currentUser: AulasViewProps['currentUser']; wrongAnswers: AulasViewProps['wrongAnswers'] }) {
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
    const l = await fetchLesson(area, {
      weakTopics: currentUser.hardSubjects || [],
      wrongAnswers: wrongAnswers || [],
      serie: currentUser.serie,
    });
    if (!l) {
      addCoins(getFeatureCost('lesson'), 'Reembolso: falha ao gerar aula');
      setErro('Não conseguimos gerar a aula agora. Tente novamente em instantes.');
    } else {
      setLesson(l);
      // Conta como aula consumida no ranking semanal das salas
      trackLessonCompleted(1);
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
        <article className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] overflow-hidden">
          {/* Hero */}
          <header className="p-6 sm:p-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/15 backdrop-blur rounded-full text-[10px] font-mono uppercase tracking-wider mb-3">
              <BookOpen className="h-3 w-3" aria-hidden="true" /> Aula de {area}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 leading-tight">{lesson.title}</h2>
            {lesson.subtitle && <p className="text-sm sm:text-base text-white/85 leading-relaxed">{lesson.subtitle}</p>}
          </header>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Introdução */}
            {lesson.intro && (
              <section>
                <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">Introdução</h3>
                <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{lesson.intro}</div>
              </section>
            )}

            {/* Blocos de conteúdo */}
            <section className="space-y-6">
              <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Conteúdo</h3>
              {lesson.content.map((block, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-baseline gap-3">
                    <span className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-black">{i + 1}</span>
                    <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100 leading-snug">{block.heading}</h4>
                  </div>
                  <p className="ml-10 text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{block.body}</p>
                </div>
              ))}
            </section>

            {/* Exercícios resolvidos */}
            {lesson.examples && lesson.examples.length > 0 && (
              <section>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> Exercícios resolvidos
                </h3>
                <div className="space-y-5">
                  {lesson.examples.map((ex, i) => (
                    <details key={i} className="group rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 overflow-hidden">
                      <summary className="p-4 sm:p-5 cursor-pointer list-none flex items-start gap-3">
                        <span className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full bg-emerald-600 text-white text-xs font-black">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-mono uppercase text-emerald-700 dark:text-emerald-400 tracking-wider mb-1">Questão</p>
                          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{ex.statement}</p>
                        </div>
                        <span className="shrink-0 text-emerald-600 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                      </summary>
                      <div className="px-4 sm:px-5 pb-5 pl-14 space-y-3">
                        <div>
                          <p className="text-[10px] font-mono uppercase text-emerald-700 dark:text-emerald-400 tracking-wider mb-1">Resolução passo a passo</p>
                          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{ex.solution}</p>
                        </div>
                        {ex.answer && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold">
                            Resposta: {ex.answer}
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Erros comuns */}
            {lesson.commonMistakes && lesson.commonMistakes.length > 0 && (
              <section className="rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" /> Erros clássicos a evitar
                </h3>
                <ul className="space-y-2 text-sm text-red-900 dark:text-red-200">
                  {lesson.commonMistakes.map((m, i) => (<li key={i} className="flex gap-2"><span className="text-red-500">•</span><span className="leading-relaxed">{m}</span></li>))}
                </ul>
              </section>
            )}

            {/* Revisão rápida */}
            {lesson.quickReview && lesson.quickReview.length > 0 && (
              <section className="rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 p-5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4" aria-hidden="true" /> Revisão em bullets (bom pra véspera)
                </h3>
                <ul className="space-y-2 text-sm text-indigo-900 dark:text-indigo-200">
                  {lesson.quickReview.map((r, i) => (<li key={i} className="flex gap-2"><span className="text-indigo-500">▸</span><span className="leading-relaxed">{r}</span></li>))}
                </ul>
              </section>
            )}

            {/* Dicas */}
            {lesson.tips && lesson.tips.length > 0 && (
              <section className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" aria-hidden="true" /> Dicas estratégicas pro dia da prova
                </h3>
                <ul className="space-y-2 text-sm text-amber-900 dark:text-amber-200">
                  {lesson.tips.map((t, i) => (<li key={i} className="flex gap-2"><span className="text-amber-500">🎯</span><span className="leading-relaxed">{t}</span></li>))}
                </ul>
              </section>
            )}

            {/* Próximos passos */}
            {lesson.nextSteps && lesson.nextSteps.length > 0 && (
              <section className="rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" /> O que estudar em seguida
                </h3>
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                  {lesson.nextSteps.map((n, i) => (<li key={i} className="flex gap-2"><span className="text-slate-400">→</span><span className="leading-relaxed">{n}</span></li>))}
                </ul>
              </section>
            )}
          </div>
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

export default function AulasView({ currentUser, wrongAnswers }: AulasViewProps) {
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

        {tab === 'ia' ? <AulasIA currentUser={currentUser} wrongAnswers={wrongAnswers} /> : <AulasProfessores currentUser={currentUser} />}
      </div>
    </div>
  );
}
