/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Clock,
  Check,
  X,
  Award,
  ArrowLeft,
  ArrowRight,
  Flag,
  RotateCcw,
  BookOpen,
  AlertTriangle,
  Loader2,
  AlertOctagon,
  Target,
  BarChart3,
  Zap,
  Shield,
  Save,
  ChevronDown,
} from 'lucide-react';
import { renderToString } from 'katex';
import { SimuladoConfig, SimuladoQuestion, SimuladoState, WrongAnswer } from '../types';
import AdPlaceholder from './AdPlaceholder';
import RewardAdOverlay, { shouldShowRewardAd, incrementRewardCounter } from './RewardAdOverlay';

interface SimuladosViewProps {
  onSaveSimuladoResult: (scorePercent: number, subject: string) => void;
  onWrongAnswer?: (subject: string, source: 'simulado' | 'pergunta-ia') => void;
  accessToken?: string;
  wrongAnswers?: WrongAnswer[];
}

const ENEM_API_BASE = 'https://api.enem.dev/v1';
const ENEM_YEARS = ['2023', '2022', '2021', '2020'];
const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 15;
const SECONDS_PER_QUESTION = 3 * 60;

type SubjectOption = SimuladoConfig['subject'] | 'Recomendado';

const SUBJECT_LABELS: Record<SubjectOption, string> = {
  'Linguagens': 'Linguagens e Códigos',
  'Humanas': 'Ciências Humanas',
  'Natureza': 'Ciências da Natureza',
  'Matemática': 'Matemática',
  'Geral': 'Geral (Todas as Áreas)',
  'Recomendado': 'Recomendado (Baseado no seu desempenho)',
};

const SUBJECT_OPTIONS: SubjectOption[] = ['Recomendado', 'Matemática', 'Natureza', 'Humanas', 'Linguagens', 'Geral'];

const DISCIPLINE_TO_API: Record<string, string> = {
  'Matemática': 'matematica',
  'Natureza': 'ciencias-natureza',
  'Humanas': 'ciencias-humanas',
  'Linguagens': 'linguagens',
};

const API_TO_DISCIPLINE_DISPLAY: Record<string, string> = {
  'matematica': 'Matemática',
  'ciencias-natureza': 'Ciências da Natureza',
  'ciencias-humanas': 'Ciências Humanas',
  'linguagens': 'Linguagens e Códigos',
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
};

function resolveRecommendedSubject(wrongAnswers?: WrongAnswer[]): SimuladoConfig['subject'] {
  if (!wrongAnswers || wrongAnswers.length === 0) return 'Matemática';
  const counts: Record<string, number> = {};
  for (const wa of wrongAnswers) {
    if (['Matemática', 'Humanas', 'Natureza', 'Linguagens'].includes(wa.subject)) {
      counts[wa.subject] = (counts[wa.subject] || 0) + 1;
    }
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) return sorted[0][0] as SimuladoConfig['subject'];
  return 'Matemática';
}

const IMAGE_URL_RE = /https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?[^\s]*)?/gi;
const MARKDOWN_IMG_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;
const DISPLAY_MATH_RE = /\$\$([^$]+)\$\$/g;
const INLINE_MATH_RE = /\$([^$]+)\$/g;

function renderMath(expr: string, display: boolean): string {
  try {
    return renderToString(expr, { displayMode: display, throwOnError: false });
  } catch {
    return expr;
  }
}

function renderMathSegments(segment: string): (React.ReactNode | string)[] {
  const parts: (React.ReactNode | string)[] = [];
  let last = 0;
  const matches: { index: number; length: number; node: React.ReactNode }[] = [];

  for (const m of segment.matchAll(DISPLAY_MATH_RE)) {
    matches.push({
      index: m.index!,
      length: m[0].length,
      node: <span key={`dm-${m.index}`} dangerouslySetInnerHTML={{ __html: renderMath(m[1].trim(), true) }} />
    });
  }

  for (const m of segment.matchAll(INLINE_MATH_RE)) {
    const skip = matches.some(c => m.index! >= c.index && m.index! < c.index + c.length);
    if (!skip) {
      matches.push({
        index: m.index!,
        length: m[0].length,
        node: <span key={`im-${m.index}`} dangerouslySetInnerHTML={{ __html: renderMath(m[1].trim(), false) }} />
      });
    }
  }

  matches.sort((a, b) => a.index - b.index);

  for (const item of matches) {
    if (item.index > last) parts.push(segment.slice(last, item.index));
    parts.push(item.node);
    last = item.index + item.length;
  }

  if (last < segment.length) parts.push(segment.slice(last));
  return parts.length > 0 ? parts : [segment];
}

function renderContent(text: string): (React.ReactNode | string)[] {
  const parts: (React.ReactNode | string)[] = [];
  let lastIndex = 0;
  const combined: { index: number; length: number; node: React.ReactNode }[] = [];

  for (const match of text.matchAll(MARKDOWN_IMG_RE)) {
    combined.push({
      index: match.index!,
      length: match[0].length,
      node: <img key={`md-${match.index}`} src={match[2]} alt={match[1] || 'Imagem'} className="max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700 my-2" loading="lazy" />
    });
  }

  for (const match of text.matchAll(IMAGE_URL_RE)) {
    const skip = combined.some(c => match.index! >= c.index && match.index! < c.index + c.length);
    if (!skip) {
      combined.push({
        index: match.index!,
        length: match[0].length,
        node: <img key={`url-${match.index}`} src={match[0]} alt="Imagem da questão" className="max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700 my-2" loading="lazy" />
      });
    }
  }

  combined.sort((a, b) => a.index - b.index);

  for (const item of combined) {
    if (item.index > lastIndex) {
      parts.push(...renderMathSegments(text.slice(lastIndex, item.index)));
    }
    parts.push(item.node);
    lastIndex = item.index + item.length;
  }

  if (lastIndex < text.length) {
    parts.push(...renderMathSegments(text.slice(lastIndex)));
  }

  return parts.length > 0 ? parts : [text];
}

async function fetchENEMQuestions(subject: SimuladoConfig['subject'], count: number): Promise<SimuladoQuestion[]> {
  const discipline = DISCIPLINE_TO_API[subject];
  const targetTotal = Math.min(count * 4, 200);
  let allRaw: any[] = [];

  for (const year of ENEM_YEARS) {
    if (allRaw.length >= targetTotal) break;
    let offset = 0;
    while (allRaw.length < targetTotal) {
      try {
        const res = await fetch(`${ENEM_API_BASE}/exams/${year}/questions?limit=50&offset=${offset}`);
        if (!res.ok) break;
        const data = await res.json();
        const questions = data.questions || [];
        if (questions.length === 0) break;
        allRaw.push(...questions);
        offset += 50;
        if (!data.metadata?.hasMore) break;
      } catch {
        break;
      }
    }
  }

  if (allRaw.length === 0) {
    throw new Error('Não foi possível carregar questões do ENEM. Verifique sua conexão e tente novamente.');
  }

  if (discipline) {
    allRaw = allRaw.filter(q => q.discipline === discipline);
  }

  if (allRaw.length === 0) {
    throw new Error(`Nenhuma questão disponível para ${SUBJECT_LABELS[subject] || subject}.`);
  }

  const shuffled = shuffleArray(allRaw);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((q) => ({
    id: `enem-${q.year}-${q.index}`,
    statement: [q.context, q.alternativesIntroduction].filter(Boolean).join('\n\n') || 'Enunciado não disponível.',
    options: (q.alternatives || []).map((alt: any) => ({
      letter: alt.letter as 'A' | 'B' | 'C' | 'D' | 'E',
      text: alt.text || '',
      image: alt.file || undefined,
    })),
    correctAnswer: q.correctAlternative as 'A' | 'B' | 'C' | 'D' | 'E',
    explanation: 'Esta é uma questão oficial do ENEM. Para resolução detalhada, consulte os gabaritos oficiais do INEP disponíveis em.gov.br ou converse com seu professor.',
    image: q.files?.[0] || undefined,
    imageAlt: q.title || undefined,
  }));
}

export default function SimuladosView({ onSaveSimuladoResult, onWrongAnswer, accessToken, wrongAnswers }: SimuladosViewProps) {
  const [selectedSubject, setSelectedSubject] = useState<SubjectOption>('Recomendado');
  const [questionCount, setQuestionCount] = useState(5);

  const [simulado, setSimulado] = useState<SimuladoState | null>(null);
  const [showGabarito, setShowGabarito] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [showRewardAd, setShowRewardAd] = useState(false);
  const [resultsSaved, setResultsSaved] = useState(false);

  const [warningCount, setWarningCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const questionDisciplinesRef = useRef<Map<string, string>>(new Map());

  const resolvedRecommended = resolveRecommendedSubject(wrongAnswers);
  const effectiveSubject = selectedSubject === 'Recomendado' ? resolvedRecommended : selectedSubject;

  useEffect(() => {
    if (simulado && simulado.isActive && simulado.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setSimulado((prev) => {
          if (!prev) return null;
          if (prev.timeLeft <= 1) {
            clearInterval(timerRef.current!);
            setTimerExpired(true);
            return {
              ...prev,
              timeLeft: 0,
              isActive: false,
              ...calculateResults(prev.questions, prev.timeLeft)
            };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [simulado?.isActive]);

  useEffect(() => {
    if (timerExpired && simulado && !simulado.isActive && simulado.scorePercent !== undefined && !resultsSaved) {
      setTimerExpired(false);
      setResultsSaved(true);
      onSaveSimuladoResult(simulado.scorePercent, simulado.config.subject);
      if (onWrongAnswer && simulado.config.subject !== 'Geral') {
        simulado.questions.forEach(q => {
          if (q.userAnswer && q.userAnswer !== q.correctAnswer) {
            onWrongAnswer(simulado.config.subject, 'simulado');
          }
        });
      }
    }
  }, [timerExpired]);

  const triggerWarning = useCallback(() => {
    setWarningCount(c => c + 1);
    setShowWarning(true);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => setShowWarning(false), 8000);
  }, []);

  useEffect(() => {
    if (!simulado?.isActive) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') triggerWarning();
    };
    const handleCopy = (e: ClipboardEvent) => { e.preventDefault(); triggerWarning(); };
    const handlePaste = (e: ClipboardEvent) => { e.preventDefault(); triggerWarning(); };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [simulado?.isActive, triggerWarning]);

  const handleStartSimulado = async () => {
    setLoadingQuestions(true);
    setLoadingError(null);
    questionDisciplinesRef.current.clear();

    try {
      const questions = await fetchENEMQuestions(effectiveSubject, questionCount);

      if (questions.length === 0) {
        setLoadingError('Nenhuma questão disponível para esta configuração.');
        return;
      }

      const totalDurationSeconds = questions.length * SECONDS_PER_QUESTION;

      setSimulado({
        config: { subject: effectiveSubject, questionCount: questions.length },
        questions,
        currentQuestionIndex: 0,
        timeLeft: totalDurationSeconds,
        isActive: true,
        dateStarted: new Date().toLocaleDateString('pt-BR')
      });
      setResultsSaved(false);
      setShowGabarito(false);
      setWarningCount(0);
      setShowWarning(false);
    } catch (err: any) {
      setLoadingError(err.message || 'Erro ao carregar questões. Tente novamente.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const calculateResults = (questionsList: SimuladoQuestion[], timeLeft?: number) => {
    if (questionsList.length === 0) return { scorePercent: 0, averageTimeGasp: 0 };
    const corrects = questionsList.filter(q => q.userAnswer === q.correctAnswer).length;
    const scorePercent = Math.round((corrects / questionsList.length) * 100);
    const totalTimeAllowed = questionsList.length * SECONDS_PER_QUESTION;
    const remainingTime = timeLeft ?? simulado?.timeLeft ?? 0;
    const totalTimeSpent = totalTimeAllowed - remainingTime;
    const averageTimeGasp = Math.round(totalTimeSpent / questionsList.length);
    return { scorePercent, averageTimeGasp };
  };

  const handleSelectAnswer = (letter: 'A' | 'B' | 'C' | 'D' | 'E') => {
    if (!simulado) return;
    const updated = [...simulado.questions];
    updated[simulado.currentQuestionIndex].userAnswer = letter;
    setSimulado({ ...simulado, questions: updated });
  };

  const handleNextQuestion = () => {
    if (!simulado) return;
    if (simulado.currentQuestionIndex < simulado.questions.length - 1) {
      setSimulado({ ...simulado, currentQuestionIndex: simulado.currentQuestionIndex + 1 });
    }
  };

  const handlePrevQuestion = () => {
    if (!simulado) return;
    if (simulado.currentQuestionIndex > 0) {
      setSimulado({ ...simulado, currentQuestionIndex: simulado.currentQuestionIndex - 1 });
    }
  };

  const handleFinishExamClick = () => {
    if (!simulado) return;
    setShowFinishModal(true);
  };

  const handleConfirmFinishExam = () => {
    if (!simulado) return;
    setShowFinishModal(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const results = calculateResults(simulado.questions, simulado.timeLeft);
    setSimulado({ ...simulado, isActive: false, ...results });
    if (!resultsSaved) {
      setResultsSaved(true);
      onSaveSimuladoResult(results.scorePercent, simulado.config.subject);
    }
    if (onWrongAnswer && simulado.config.subject !== 'Geral') {
      simulado.questions.forEach(q => {
        if (q.userAnswer && q.userAnswer !== q.correctAnswer) {
          onWrongAnswer(simulado.config.subject, 'simulado');
        }
      });
    }
  };

  const handleConfirmCancelExam = () => {
    setShowCancelModal(false);
    setSimulado(null);
    questionDisciplinesRef.current.clear();
  };

  const handleSaveResult = () => {
    if (!simulado || resultsSaved) return;
    setResultsSaved(true);
    onSaveSimuladoResult(simulado.scorePercent ?? 0, simulado.config.subject);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeQuestion = simulado?.questions[simulado.currentQuestionIndex];

  const handleToggleGabarito = () => {
    if (!showGabarito) {
      if (shouldShowRewardAd('gabarito', 2)) {
        setShowRewardAd(true);
        return;
      }
    }
    setShowGabarito(!showGabarito);
  };

  const getSubjectAccuracyMap = () => {
    if (!simulado || simulado.isActive) return [];
    const map: Record<string, { total: number; correct: number; label: string }> = {};
    for (const q of simulado.questions) {
      const disc = questionDisciplinesRef.current.get(q.id) || 'Geral';
      const label = API_TO_DISCIPLINE_DISPLAY[disc] || disc;
      if (!map[disc]) map[disc] = { total: 0, correct: 0, label };
      map[disc].total++;
      if (q.userAnswer === q.correctAnswer) map[disc].correct++;
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  };

  const unansweredCount = simulado?.questions.filter(q => !q.userAnswer).length ?? 0;
  const answeredCount = simulado ? simulado.questions.length - unansweredCount : 0;

  return (
    <>
      <div id="simulados-wrapper" className="space-y-6 animate-fade-in">

        <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Simulados ENEM Cronometrados
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Questões reais do ENEM via enem.dev com cronômetro proporcional e gestão ativa de tempo.
          </p>
        </div>

        <AdPlaceholder slot="simulados-topo" format="banner" className="my-4" />

        {/* STAGE A: SETUP SCREEN */}
        {!simulado && (
          <div className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-xl mx-auto space-y-6 animate-fade-in" id="setup-view">

            <div className="text-center space-y-1.5 pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100">Configurar Novo Simulado</h3>
              <p className="text-xs text-slate-450">Escolha a área e a quantidade de questões para iniciar o cronômetro</p>
            </div>

            {loadingError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{loadingError}</span>
              </div>
            )}

            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleStartSimulado(); }}>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-750 dark:text-slate-200" htmlFor="sim-subject">Área do Conhecimento</label>
                <div className="relative">
                  <select
                    id="sim-subject"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-100 appearance-none cursor-pointer"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value as SubjectOption)}
                  >
                    {SUBJECT_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{SUBJECT_LABELS[opt]}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
                {selectedSubject === 'Recomendado' && (
                  <p className="text-[11px] text-blue-500 dark:text-blue-400 mt-1">
                    <Zap className="h-3 w-3 inline mr-1" />
                    Recomendamos <strong>{SUBJECT_LABELS[resolvedRecommended]}</strong> com base nas suas respostas incorretas.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-750 dark:text-slate-200">Quantidade de Questões</label>
                  <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-lg">
                    {questionCount}
                  </span>
                </div>
                <input
                  type="range"
                  min={MIN_QUESTIONS}
                  max={MAX_QUESTIONS}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono px-0.5">
                  <span>{MIN_QUESTIONS} questões</span>
                  <span>{Math.round(questionCount * SECONDS_PER_QUESTION / 60)} min de prova</span>
                  <span>{MAX_QUESTIONS} questões</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-850 rounded-xl flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
                <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold">Regras do Simulado ApexEnem:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[#777587]">
                    <li>O tempo médio por questão do ENEM é de 3 minutos.</li>
                    <li>Cronômetro proporcional ao número de questões ({questionCount * 3} min total).</li>
                    <li>Você pode avançar ou retroceder livremente entre as questões.</li>
                    <li>Resultado com estatísticas detalhadas e gabarito ao final.</li>
                  </ul>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-xl flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-400/80">
                <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Sistema anti-batota ativo: trocar de aba ou copiar/colar durante o simulado será registrado.</span>
              </div>

              <button
                id="btn-start-countdown-exam"
                type="submit"
                disabled={loadingQuestions}
                className="w-full py-3.5 bg-gradient-to-r from-[#21c55d] to-[#04a753] hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingQuestions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-white" />}
                <span>{loadingQuestions ? 'Carregando questões do ENEM...' : 'Iniciar Simulado'}</span>
              </button>

            </form>
          </div>
        )}

        {/* STAGE B: ACTIVE TEST IN-PROGRESS SCREEN */}
        {simulado && simulado.isActive && activeQuestion && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="active-exam-view">

            {showWarning && (
              <div className="lg:col-span-12 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 flex items-start gap-2 animate-fade-in">
                <AlertOctagon className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    Detectamos comportamento suspeito! Isso afeta sua nota.
                  </p>
                  <p className="text-[10px] text-amber-600/70 dark:text-amber-400/60">
                    Acha que isso é um erro?{' '}
                    <a
                      href="mailto:suporte@apexenem.com.br?subject=Reporte%20-%20Comportamento%20suspeito%20no%20Simulado"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-amber-700 dark:hover:text-amber-300 transition"
                    >
                      Reporte aqui
                    </a>
                    {warningCount > 1 && <span className="ml-1 font-semibold">({warningCount} alertas registrados)</span>}
                  </p>
                </div>
              </div>
            )}

            <div className="lg:col-span-8 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-sm">

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase font-bold">
                  <span>QUESTÃO {simulado.currentQuestionIndex + 1} DE {simulado.questions.length}</span>
                  <span>{SUBJECT_LABELS[simulado.config.subject] || simulado.config.subject}</span>
                </div>

                <div className="flex flex-wrap gap-1.5" id="hud-nav-dots">
                  {simulado.questions.map((q, idx) => {
                    const isCurrent = idx === simulado.currentQuestionIndex;
                    const isAnswered = !!q.userAnswer;
                    let dotBg = 'bg-slate-100 text-slate-400 dark:bg-[#0f172a] dark:text-slate-650';
                    if (isCurrent) dotBg = 'bg-blue-600 text-white ring-2 ring-blue-500/20 scale-110';
                    else if (isAnswered) dotBg = 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setSimulado({ ...simulado, currentQuestionIndex: idx })}
                        className={`h-7 w-7 rounded-lg text-xs font-bold transition flex items-center justify-center font-mono cursor-pointer ${dotBg}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-slate-100 dark:bg-[#0f172a] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(answeredCount / simulado.questions.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{answeredCount}/{simulado.questions.length}</span>
                </div>
              </div>

              <div className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 font-sans">
                {activeQuestion.image && (
                  <img
                    src={activeQuestion.image}
                    alt={activeQuestion.imageAlt || 'Questão'}
                    className="max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700"
                    loading="lazy"
                  />
                )}
                <p className="whitespace-pre-wrap">{renderContent(activeQuestion.statement)}</p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-2" id={`active-choices-panel-${activeQuestion.id}`}>
                {activeQuestion.options.map((opt) => {
                  const isSelected = activeQuestion.userAnswer === opt.letter;
                  return (
                    <button
                      key={opt.letter}
                      type="button"
                      onClick={() => handleSelectAnswer(opt.letter)}
                      className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-[#0f172a] border-blue-500 text-blue-900 dark:text-blue-300 font-bold ring-1 ring-blue-500/20'
                          : 'bg-slate-50 dark:bg-[#0f172a]/45 border-slate-200 dark:border-slate-800 text-slate-705 hover:border-blue-500 dark:text-slate-300'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-[#0f172a]/80 text-slate-600 dark:text-slate-400'
                      }`}>
                        {opt.letter}
                      </span>
                      <span className="leading-relaxed mt-0.5">
                        {opt.image && (
                          <img
                            src={opt.image}
                            alt={`Opção ${opt.letter}`}
                            className="max-w-full h-auto rounded mb-1 border border-slate-200 dark:border-slate-700"
                            loading="lazy"
                          />
                        )}
                        {renderContent(opt.text)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-5 border-t border-slate-200 dark:border-slate-800" id="hud-lower-navigation">
                <button
                  type="button"
                  disabled={simulado.currentQuestionIndex === 0}
                  onClick={handlePrevQuestion}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 hover:bg-slate-50 transition cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center gap-2">
                  {unansweredCount > 0 && (
                    <span className="text-[10px] font-mono text-amber-500 dark:text-amber-400">
                      {unansweredCount} em branco
                    </span>
                  )}

                  {simulado.currentQuestionIndex < simulado.questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-105 dark:bg-[#0f172a] dark:text-blue-400 text-blue-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Próxima</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinishExamClick}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer"
                    >
                      <Flag className="h-4 w-4" />
                      <span>Finalizar Simulado</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4" id="timer-column">
              <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
                <div className="flex justify-center items-center gap-2 text-slate-400">
                  <Clock className="h-5 w-5 animate-pulse text-blue-600" />
                  <span className="text-[10px] uppercase tracking-wider font-mono font-extrabold font-bold">Cronômetro</span>
                </div>

                <div className={`text-4xl lg:text-5xl font-mono font-extrabold ${
                  simulado.timeLeft < 120
                    ? 'text-red-600 dark:text-red-400'
                    : simulado.timeLeft < 300
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-[#1b1b24] dark:text-[#f3effc]'
                }`}>
                  {formatTime(simulado.timeLeft)}
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-450 px-2 leading-relaxed">
                    Gerencie sua velocidade para concluir todas as {simulado.questions.length} questões!
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {Math.floor(simulado.timeLeft / 60)}min restantes · {answeredCount}/{simulado.questions.length} respondidas
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleFinishExamClick}
                    className="w-full py-2.5 bg-gradient-to-r from-[#21c55d] to-[#04a753] hover:opacity-90 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    <span>Entregar Prova</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="w-full py-2.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-500 border border-slate-200 dark:bg-[#0f172a] dark:border-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancelar Teste
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1e293b] p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase font-bold">
                  <Target className="h-3.5 w-3.5" />
                  <span>Navegação Rápida</span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {simulado.questions.map((q, idx) => {
                    const isCurrent = idx === simulado.currentQuestionIndex;
                    const isAnswered = !!q.userAnswer;
                    return (
                      <button
                        key={`quick-${q.id}`}
                        type="button"
                        onClick={() => setSimulado({ ...simulado, currentQuestionIndex: idx })}
                        className={`h-8 rounded-md text-[10px] font-bold font-mono transition flex items-center justify-center cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-600 text-white'
                            : isAnswered
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                              : 'bg-slate-100 text-slate-400 dark:bg-[#0f172a] dark:text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STAGE C: FINAL RESULTS CARD */}
        {simulado && !simulado.isActive && (
          <div className="bg-white dark:bg-[#1e293b] max-w-2xl mx-auto rounded-3xl border border-slate-200 dark:border-slate-800/80 p-6 md:p-10 shadow-xl space-y-8 animate-fade-in" id="exam-results-card">

            <div className="text-center space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="inline-flex p-4 bg-blue-50 dark:bg-blue-950/45 text-blue-600 dark:text-emerald-400 rounded-full shadow">
                <Award className="h-10 w-10" />
              </div>

              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Simulado Concluído!</h2>
              <p className="text-xs text-slate-450 max-w-sm mx-auto leading-relaxed">
                Exame em <b>{SUBJECT_LABELS[simulado.config.subject] || simulado.config.subject}</b> com {simulado.questions.length} questões reais do ENEM.
              </p>

              <div className="flex flex-col md:flex-row justify-center items-center gap-6 py-4">
                <div className="bg-slate-50 dark:bg-[#0f172a] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center min-w-[170px]">
                  <span className={`text-4xl lg:text-5xl font-display font-black ${
                    (simulado.scorePercent ?? 0) >= 70
                      ? 'text-green-600 dark:text-green-400'
                      : (simulado.scorePercent ?? 0) >= 50
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}>
                    {simulado.scorePercent}%
                  </span>
                  <span className="text-xs text-slate-450 block mt-1 uppercase tracking-wider font-mono">Taxa de Acerto</span>
                </div>

                <div className="bg-slate-50 dark:bg-[#0f172a] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center min-w-[170px]">
                  <span className="text-3xl lg:text-4xl font-mono font-black text-slate-700 dark:text-gray-300">
                    {simulado.averageTimeGasp}s
                  </span>
                  <span className="text-xs text-slate-450 block mt-2.5 uppercase tracking-wider font-mono">Tempo Médio/Questão</span>
                </div>
              </div>

              {warningCount > 0 && (
                <div className="inline-flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-mono bg-amber-50 dark:bg-amber-950/20 px-3 py-1 rounded-full">
                  <AlertOctagon className="h-3 w-3" />
                  {warningCount} alerta(s) de comportamento suspeito registrado(s)
                </div>
              )}
            </div>

            {simulado.config.subject === 'Geral' && (
              <div className="space-y-3">
                <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  Desempenho por Área
                </h3>
                <div className="space-y-2">
                  {getSubjectAccuracyMap().map((disc) => {
                    const pct = disc.total > 0 ? Math.round((disc.correct / disc.total) * 100) : 0;
                    return (
                      <div key={disc.label} className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 w-36 flex-shrink-0 truncate">{disc.label}</span>
                        <div className="flex-1 bg-slate-100 dark:bg-[#0f172a] rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 w-16 text-right">
                          {disc.correct}/{disc.total} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">Gabarito e Resolução</h3>
                <button
                  type="button"
                  onClick={handleToggleGabarito}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-[#0f172a] transition cursor-pointer"
                >
                  {showGabarito ? 'Esconder Gabarito' : 'Ver Gabarito Detalhado'}
                </button>
              </div>

              {showGabarito && (
                <div className="space-y-4 animate-slide-up" id="review-gabarito-list">
                  {simulado.questions.map((q, idx) => {
                    const isCorrect = q.userAnswer === q.correctAnswer;
                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-xl border space-y-3 bg-slate-50/50 ${
                          isCorrect
                            ? 'border-green-200 dark:border-green-950/30'
                            : 'border-red-100 dark:border-red-950/30'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono font-semibold uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-600 px-2 py-0.5 rounded">
                            QUESTÃO {idx + 1}
                          </span>
                          <span className={`text-xs font-bold leading-none ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                            {isCorrect ? 'Acertou ✓' : `Sua: ${q.userAnswer || '—'} | Correto: ${q.correctAnswer}`}
                          </span>
                        </div>

                        {q.image && (
                          <img
                            src={q.image}
                            alt={q.imageAlt || 'Questão'}
                            className="max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700"
                            loading="lazy"
                          />
                        )}
                        <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed italic pr-4 select-all">
                          {renderContent(q.statement)}
                        </div>

                        <div className="bg-white dark:bg-[#0f172a] p-3.5 border border-slate-200 dark:border-slate-800 text-[11px] rounded-lg text-slate-650 dark:text-slate-350 leading-relaxed font-sans space-y-1.5">
                          <p className="font-bold flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                            Resposta Correta: {q.correctAnswer}
                          </p>
                          <p className="text-slate-400 dark:text-slate-500 italic">{q.explanation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveResult}
                disabled={resultsSaved}
                className={`px-6 py-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  resultsSaved
                    ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/40 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow'
                }`}
              >
                {resultsSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                <span>{resultsSaved ? 'Resultado Salvo ✓' : 'Salvar Resultado'}</span>
              </button>
              <button
                type="button"
                onClick={() => { setSimulado(null); questionDisciplinesRef.current.clear(); }}
                className="px-6 py-3 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 text-slate-500 hover:text-slate-800 dark:hover:text-white dark:border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Fazer Outro Simulado</span>
              </button>
            </div>
          </div>
        )}

        {/* MODAL: CONFIRM FINISH EXAM */}
        {showFinishModal && simulado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" id="finish-exam-modal">
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl space-y-5 text-center">
              <div className="inline-flex p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-2xl">
                <AlertTriangle className="h-7 w-7 text-amber-500" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Finalizar Simulado?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {unansweredCount > 0
                    ? `Atenção: Você ainda possui ${unansweredCount} questão(ões) em branco! Deseja realmente concluir o simulado?`
                    : 'Excelente! Todas as questões foram respondidas. Pronto para ver seu resultado?'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFinishModal(false)}
                  className="py-2.5 px-4 text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-455 rounded-xl transition cursor-pointer"
                >
                  Voltar à Prova
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFinishExam}
                  className="py-2.5 px-4 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow transition cursor-pointer"
                >
                  Sim, Finalizar!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CONFIRM CANCEL EXAM */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" id="cancel-exam-modal">
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full shadow-2xl space-y-5 text-center">
              <div className="inline-flex p-3.5 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-2xl">
                <X className="h-7 w-7 text-red-500" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Abandonar Simulado?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Seu tempo e progresso serão completamente perdidos. Esta ação não pode ser desfeita.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="py-2.5 px-4 text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-455 rounded-xl transition cursor-pointer"
                >
                  Continuar Prova
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelExam}
                  className="py-2.5 px-4 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow transition cursor-pointer"
                >
                  Abandonar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-start justify-center gap-4 mt-6">
          <AdPlaceholder slot="simulados-conteudo" format="banner" />
          <AdPlaceholder slot="simulados-rodape" format="banner" />
        </div>
      </div>

      {showRewardAd && (
        <RewardAdOverlay
          action="gabarito"
          onContinue={() => {
            setShowRewardAd(false);
            setShowGabarito(true);
          }}
          onClose={() => setShowRewardAd(false)}
        />
      )}
    </>
  );
}
