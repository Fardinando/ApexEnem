import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart,
  Check,
  X,
  Sparkles,
  Lock,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  Trophy,
  GraduationCap,
  BookOpen,
  PenLine,
  FlaskConical,
  Globe2,
  Calculator,
  Star,
  ChevronRight,
  Play,
  Zap,
  CheckCircle2,
  XCircle,
  BarChart3,
  Clock,
  MessageCircle,
} from 'lucide-react';
import MathRenderer from './MathRenderer';
import { motion, AnimatePresence } from 'motion/react';
import type {
  LearningChapter,
  Exercise,
  EssayCorrection,
  UserProfile,
  WrongAnswer,
  LessonCycle,
  LessonBlock,
  AiQuestion,
  TopicDifficulty,
} from '../types';
import { INITIAL_CHAPTERS, CHAPTER_EXERCISES } from '../data/learning-exercises';
import { saveLearningProgress, fetchLearningProgress } from '../lib/supabase';
import { computeTopicDifficulty } from '../lib/gamification';
import AdPlaceholder from './AdPlaceholder';
import RewardAdOverlay, {
  shouldShowRewardAd,
  incrementRewardCounter,
} from './RewardAdOverlay';

interface AprendizadoViewProps {
  essayCorrections?: EssayCorrection[];
  simuladosHistory?: {
    scorePercent: number;
    date: string;
    subject: string;
  }[];
  currentUser?: UserProfile;
  accessToken?: string;
  wrongAnswers?: WrongAnswer[];
  onWrongAnswer?: (subject: string, source: 'simulado' | 'pergunta-ia' | 'redacao' | 'aula') => void;
}

type MainTab = 'cursinho' | 'questoes';
type ViewMode = 'categories' | 'lesson' | 'questoes-play';

interface CategoryCard {
  id: string;
  title: string;
  area:
    | 'Redação'
    | 'Linguagens'
    | 'Humanas'
    | 'Natureza'
    | 'Matemática'
    | 'Recomendado';
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  darkBgColor: string;
  borderColor: string;
}

const CATEGORIES: CategoryCard[] = [
  {
    id: 'redacao',
    title: 'Redação',
    area: 'Redação',
    description: 'Como fazer uma redação nota 1000 no ENEM',
    icon: <PenLine className="h-6 w-6" />,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50',
    darkBgColor: 'dark:bg-indigo-950/40',
    borderColor: 'border-indigo-200 dark:border-indigo-800/40',
  },
  {
    id: 'linguagens',
    title: 'Linguagens e Códigos',
    area: 'Linguagens',
    description:
      'Português, Literatura, Língua Estrangeira, Artes e Educação Física',
    icon: <BookOpen className="h-6 w-6" />,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50',
    darkBgColor: 'dark:bg-purple-950/40',
    borderColor: 'border-purple-200 dark:border-purple-800/40',
  },
  {
    id: 'humanas',
    title: 'Ciências Humanas',
    area: 'Humanas',
    description: 'História, Geografia, Filosofia e Sociologia',
    icon: <Globe2 className="h-6 w-6" />,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50',
    darkBgColor: 'dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800/40',
  },
  {
    id: 'natureza',
    title: 'Ciências da Natureza',
    area: 'Natureza',
    description: 'Biologia, Química e Física',
    icon: <FlaskConical className="h-6 w-6" />,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50',
    darkBgColor: 'dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800/40',
  },
  {
    id: 'matematica',
    title: 'Matemática',
    area: 'Matemática',
    description: 'Matemática',
    icon: <Calculator className="h-6 w-6" />,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50',
    darkBgColor: 'dark:bg-rose-950/40',
    borderColor: 'border-rose-200 dark:border-rose-800/40',
  },
  {
    id: 'recomendado',
    title: 'Recomendado',
    area: 'Recomendado',
    description: 'Tópicos com base nos seus pontos fracos',
    icon: <Star className="h-6 w-6" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50',
    darkBgColor: 'dark:bg-blue-950/40',
    borderColor: 'border-blue-200 dark:border-blue-800/40',
  },
];

function getWeakAreas(
  essays?: EssayCorrection[],
  simHistory?: { scorePercent: number; subject: string }[],
  hardSubjects?: string[],
  wrongAnswers?: WrongAnswer[]
): string[] {
  const weak: string[] = [];
  if (essays) {
    const lowScore = essays.filter(e => (e.score || 0) < 700);
    if (lowScore.length > 0) weak.push('Redação (abaixo de 700)');
    essays.forEach(e => {
      if (e.weaknesses) weak.push(...e.weaknesses);
    });
  }
  if (simHistory) {
    const lowSim = simHistory.filter(s => s.scorePercent < 50);
    if (lowSim.length > 0) weak.push(`${lowSim.length} simulados com < 50%`);
  }
  if (hardSubjects) weak.push(...hardSubjects);
  if (wrongAnswers && wrongAnswers.length > 0) {
    const counts: Record<string, number> = {};
    wrongAnswers.forEach(w => {
      counts[w.subject] = (counts[w.subject] || 0) + 1;
    });
    Object.entries(counts)
      .filter(([, count]) => count >= 3)
      .sort(([, a], [, b]) => b - a)
      .forEach(([subject]) => {
        weak.push(`${subject} (${counts[subject]} erros)`);
      });
  }
  return weak;
}

function AdGateVideo() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const loadedRef = React.useRef(false);
  const adCode = `<div id="inter-container" style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;"><iframe src="https://www.effectivecpmnetwork.com/c0wk6m25f0?key=5438e836339cdee7370c0f68bcb24d00" style="width:100%;height:100%;border:none;border-radius:12px;min-height:280px;" scrolling="no" allowfullscreen></iframe></div>`;
  React.useEffect(() => {
    if (loadedRef.current || !containerRef.current) return;
    loadedRef.current = true;
    containerRef.current.innerHTML = adCode;
  }, []);
  return (
    <div
      ref={containerRef}
      className="w-full h-[320px] bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center"
    />
  );
}

export default function AprendizadoView({
  essayCorrections,
  simuladosHistory,
  currentUser,
  accessToken,
  wrongAnswers,
  onWrongAnswer,
}: AprendizadoViewProps) {
  const [mainTab, setMainTab] = useState<MainTab>('cursinho');
  const [viewMode, setViewMode] = useState<ViewMode>('categories');

  const [activeCategory, setActiveCategory] = useState<CategoryCard | null>(
    null
  );
  const [lessonStep, setLessonStep] = useState(0);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [lessonTopicIndex, setLessonTopicIndex] = useState(0);

  const [questoesArea, setQuestoesArea] = useState<string>('');
  const [questaoIdx, setQuestaoIdx] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [questaoHearts, setQuestaoHearts] = useState(5);
  const [questaoXp, setQuestaoXp] = useState(0);
  const [questaoCompleted, setQuestaoCompleted] = useState(false);
  const [questaoCorrectCount, setQuestaoCorrectCount] = useState(0);

  const [aiLessonCycle, setAiLessonCycle] = useState<LessonCycle | null>(null);
  const [aiQuestoes, setAiQuestoes] = useState<AiQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questaoFeedback, setQuestaoFeedback] = useState('');
  const [questaoTopic, setQuestaoTopic] = useState('');
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [lessonCorrectCount, setLessonCorrectCount] = useState(0);
  const [lessonTotalInteractive, setLessonTotalInteractive] = useState(0);
  const [lessonXpEarned, setLessonXpEarned] = useState(0);
  const [adGateSecondsLeft, setAdGateSecondsLeft] = useState(0);
  const [adGateActive, setAdGateActive] = useState(false);
  const [interactiveAnswer, setInteractiveAnswer] = useState<number | null>(null);
  const [interactiveChecked, setInteractiveChecked] = useState(false);

  const [chapters, setChapters] = useState<LearningChapter[]>(INITIAL_CHAPTERS);
  const [activeChapter, setActiveChapter] = useState<LearningChapter | null>(
    null
  );
  const [activeExercises, setActiveExercises] = useState<Exercise[]>([]);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [xpPoints, setXpPoints] = useState(0);
  const [lessonActive, setLessonActive] = useState(false);
  const [selectedBool, setSelectedBool] = useState<boolean | null>(null);
  const [reorderedWords, setReorderedWords] = useState<string[]>([]);
  const [matchingSelections, setMatchingSelections] = useState<{
    left: string | null;
    right: string | null;
  }>({ left: null, right: null });
  const [matchingCompleted, setMatchingCompleted] = useState<{
    [key: string]: boolean;
  }>({});
  const [matchingStatusText, setMatchingStatusText] = useState(
    'Clique em uma palavra da esquerda e depois na sua explicação'
  );
  const [hasCheckedLesson, setHasCheckedLesson] = useState(false);
  const [isCorrectLesson, setIsCorrectLesson] = useState(false);
  const [loadingAiExplanation, setLoadingAiExplanation] = useState(false);
  const [aiSpeechText, setAiSpeechText] = useState<string | null>(null);
  const [originalCount, setOriginalCount] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  const [lessonPassed, setLessonPassed] = useState(false);
  const [lessonScore, setLessonScore] = useState(0);
  const [showRewardAd, setShowRewardAd] = useState(false);
  const [pendingChapter, setPendingChapter] = useState<LearningChapter | null>(
    null
  );
  const [showAdGate, setShowAdGate] = useState(false);
  const [adGateTarget, setAdGateTarget] = useState<
    'cursinho' | 'questoes' | null
  >(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('Local');

  const weakAreas = getWeakAreas(
    essayCorrections,
    simuladosHistory,
    (currentUser as any)?.hardSubjects,
    wrongAnswers
  );

  const topicDifficulties = computeTopicDifficulty(wrongAnswers || []);
  const topWeakTopics = topicDifficulties.slice(0, 10);

  useEffect(() => {
    if (currentUser?.email) {
      fetchLearningProgress(currentUser.email)
        .then(progress => {
          if (progress) {
            if (progress.chapters) setChapters(progress.chapters);
            if (typeof progress.xpPoints === 'number')
              setXpPoints(progress.xpPoints);
          }
        })
        .catch(() => {});
    }
    checkCredentials();
  }, []);

  const checkCredentials = async () => {
    try {
      const res = await fetch('/api/credentials-status');
      if (res.ok) {
        const data = await res.json();
        if (data.supabase) {
          setSupabaseConfigured(true);
          setSyncStatus('Nuvem');
        }
      }
    } catch {
      // safe fallback
    }
  };

  const syncProgressToCloud = async (
    updatedChapters: LearningChapter[],
    newXP: number
  ) => {
    if (!currentUser?.email) return;
    try {
      await saveLearningProgress(currentUser.email, {
        chapters: updatedChapters,
        xpPoints: newXP,
      });
    } catch (e) {
      console.warn('Supabase save error:', e);
    }
  };

  const [lessonError, setLessonError] = useState(false);
  const [questoesError, setQuestoesError] = useState(false);

  const fetchLessonCycle = async (cat: CategoryCard, topicIdx: number, retry = 0) => {
    setLoadingLesson(true);
    setAiLessonCycle(null);
    setLessonError(false);
    try {
      const wrongSubjects = (wrongAnswers || []).map(w => w.subject);
      const resp = await fetch('/api/lesson-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: cat.area, level: 5, weakTopics: wrongSubjects, topicIndex: topicIdx }),
      });
      if (!resp.ok) {
        if (retry < 2) {
          await new Promise(r => setTimeout(r, 2000));
          setLoadingLesson(false);
          return fetchLessonCycle(cat, topicIdx, retry + 1);
        }
        setLessonError(true);
        setLoadingLesson(false);
        return;
      }
      const data = await resp.json();
      if (data && data.title && Array.isArray(data.cycles) && data.cycles.length >= 4) {
        setAiLessonCycle(data);
      } else {
        if (retry < 2) {
          await new Promise(r => setTimeout(r, 2000));
          setLoadingLesson(false);
          return fetchLessonCycle(cat, topicIdx, retry + 1);
        }
        setLessonError(true);
      }
    } catch {
      if (retry < 2) {
        await new Promise(r => setTimeout(r, 2000));
        setLoadingLesson(false);
        return fetchLessonCycle(cat, topicIdx, retry + 1);
      }
      setLessonError(true);
    }
    setLoadingLesson(false);
  };

  const fetchQuestoesAI = async (area: string, retry = 0) => {
    setLoadingQuestions(true);
    setAiQuestoes([]);
    setQuestoesError(false);
    try {
      const wrongSubjects = (wrongAnswers || []).map(w => w.subject);
      const resp = await fetch('/api/questoes-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area, count: 3, weakTopics: wrongSubjects }),
      });
      if (!resp.ok) {
        if (retry < 2) {
          await new Promise(r => setTimeout(r, 2000));
          setLoadingQuestions(false);
          return fetchQuestoesAI(area, retry + 1);
        }
        setQuestoesError(true);
        setLoadingQuestions(false);
        return;
      }
      const data = await resp.json();
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setAiQuestoes(data.questions.map((q: any, i: number) => ({
          id: q.id || `ai-q-${i}`, statement: q.statement || '',
          options: q.options || [], correctAnswer: q.correctAnswer || 'A',
          explanation: q.explanation || '', topic: q.topic || '',
        })));
      } else {
        if (retry < 2) {
          await new Promise(r => setTimeout(r, 2000));
          setLoadingQuestions(false);
          return fetchQuestoesAI(area, retry + 1);
        }
        setQuestoesError(true);
      }
    } catch {
      if (retry < 2) {
        await new Promise(r => setTimeout(r, 2000));
        setLoadingQuestions(false);
        return fetchQuestoesAI(area, retry + 1);
      }
      setQuestoesError(true);
    }
    setLoadingQuestions(false);
  };

  const [prefetchTarget, setPrefetchTarget] = useState<{ type: 'cursinho'; cat: CategoryCard; idx: number } | { type: 'questoes'; area: string } | null>(null);

  const handleAdGateContinue = useCallback(() => {
    setAdGateActive(false);
    setAdGateSecondsLeft(0);
    if (adGateTarget === 'cursinho' && activeCategory) {
      setViewMode('lesson');
      setLessonStep(0);
      setLessonCompleted(false);
      setLessonCorrectCount(0);
      setLessonTotalInteractive(0);
      setLessonXpEarned(0);
      setInteractiveAnswer(null);
      setInteractiveChecked(false);
    } else if (adGateTarget === 'questoes' && questoesArea) {
      setViewMode('questoes-play');
    }
    setAdGateTarget(null);
  }, [adGateTarget, activeCategory, questoesArea]);

  useEffect(() => {
    if (!adGateActive || !prefetchTarget) return;
    if (prefetchTarget.type === 'cursinho') {
      fetchLessonCycle(prefetchTarget.cat, prefetchTarget.idx);
    } else if (prefetchTarget.type === 'questoes') {
      fetchQuestoesAI(prefetchTarget.area);
    }
    setPrefetchTarget(null);
  }, [adGateActive, prefetchTarget]);

  const handleStartCursinhoCategory = (cat: CategoryCard) => {
    setActiveCategory(cat);
    if (cat.area === 'Recomendado' && wrongAnswers && wrongAnswers.length < 3) return;
    setLessonStep(0);
    setLessonCompleted(false);
    setLessonCorrectCount(0);
    setLessonTotalInteractive(0);
    setLessonXpEarned(0);
    setInteractiveAnswer(null);
    setInteractiveChecked(false);
    const nextIdx = lessonTopicIndex + 1;
    setLessonTopicIndex(nextIdx);
    setPrefetchTarget({ type: 'cursinho', cat, idx: nextIdx });
    setAdGateTarget('cursinho');
    setAdGateActive(true);
    setAdGateSecondsLeft(30);
  };

  const handleStartQuestoes = (area: string) => {
    setQuestoesArea(area);
    setQuestaoIdx(0);
    setSelectedLetter(null);
    setHasChecked(false);
    setIsCorrectAnswer(null);
    setQuestaoHearts(5);
    setQuestaoXp(0);
    setQuestaoCompleted(false);
    setQuestaoCorrectCount(0);
    setQuestaoFeedback('');
    setQuestaoTopic('');
    setAiQuestoes([]);
    setPrefetchTarget({ type: 'questoes', area });
    setAdGateTarget('questoes');
    setAdGateActive(true);
    setAdGateSecondsLeft(30);
  };

  useEffect(() => {
    if (!adGateActive || adGateSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setAdGateSecondsLeft(prev => {
        if (prev <= 1) { return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [adGateActive, adGateSecondsLeft]);

  useEffect(() => {
    if (adGateActive && adGateSecondsLeft <= 0) {
      handleAdGateContinue();
    }
  }, [adGateActive, adGateSecondsLeft]);

  useEffect(() => {
    if (aiLessonCycle?.cycles) {
      const count = aiLessonCycle.cycles.filter((b: any) => b.type === 'interactive' || b.type === 'challenge').length;
      setLessonTotalInteractive(count);
    }
  }, [aiLessonCycle]);

  const handleQuestaoCheck = () => {
    if (!selectedLetter || hasChecked) return;
    const activeList = aiQuestoes;
    const currentQ: any = activeList[questaoIdx];
    if (!currentQ) return;
    const correctLetter = currentQ.correctAnswer || currentQ.correctLetter;
    const correct = selectedLetter === correctLetter;
    setHasChecked(true);
    setIsCorrectAnswer(correct);
    setQuestaoFeedback(currentQ.explanation || '');
    setQuestaoTopic(currentQ.topic || '');
    if (correct) {
      setQuestaoXp(prev => prev + 10);
      setQuestaoCorrectCount(prev => prev + 1);
    } else {
      setQuestaoHearts(prev => prev - 1);
    }
  };

  const handleQuestaoContinue = () => {
    const activeList = aiQuestoes;
    if (questaoHearts <= 0 || questaoIdx + 1 >= activeList.length) {
      setQuestaoCompleted(true);
      const bonus = questaoCorrectCount >= activeList.length * 0.7 ? 15 : 0;
      setQuestaoXp(prev => prev + bonus);
      setXpPoints(prev => prev + questaoXp + bonus);
      return;
    }
    setQuestaoIdx(questaoIdx + 1);
    setSelectedLetter(null);
    setHasChecked(false);
    setIsCorrectAnswer(null);
    setQuestaoFeedback('');
    setQuestaoTopic('');
  };

  const handleBackToCategories = () => {
    setViewMode('categories');
    setActiveCategory(null);
    setQuestoesArea('');
    setLessonActive(false);
    setActiveChapter(null);
    setAiLessonCycle(null);
    setAiQuestoes([]);
    setLoadingLesson(false);
  };

  const totalLessonSteps = aiLessonCycle
    ? aiLessonCycle.cycles.length
    : 0;

  const renderCursinhoTab = () => {
    if (viewMode === 'lesson' && activeCategory && loadingLesson) {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-6 animate-fade-in">
          <div className="relative">
            <span className="text-7xl animate-bounce">🐐</span>
            <div className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 text-white text-[9px] font-extrabold flex items-center justify-center rounded-full animate-pulse border border-white">
              IA
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100">
              Preparando sua aula...
            </h3>
            <p className="text-xs text-slate-400 max-w-xs">
              O Cabrito está pesquisando o melhor conteúdo de{' '}
              <strong>{activeCategory.title}</strong> para você!
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      );
    }

    if (viewMode === 'lesson' && activeCategory && lessonError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-6 animate-fade-in">
          <div className="relative">
            <span className="text-7xl">🐐</span>
            <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center rounded-full border border-white">
              ✕
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100">
              A IA não conseguiu gerar a aula
            </h3>
            <p className="text-xs text-slate-400 max-w-xs">
              O serviço de IA pode estar sobrecarregado. Tente novamente em alguns segundos.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <button
              type="button"
              onClick={() => fetchLessonCycle(activeCategory!, lessonTopicIndex)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Tentar Novamente</span>
            </button>
            <button
              type="button"
              onClick={handleBackToCategories}
              className="w-full py-3 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Voltar ao Menu
            </button>
          </div>
        </div>
      );
    }

    if (viewMode === 'lesson' && activeCategory) {
      const blockTypeLabels: Record<string, string> = {
        story: '📖 História do Cabrito',
        explanation: '📚 Explicação',
        interactive: '🎯 Resolva comigo!',
        challenge: '🏆 Desafio de fixação',
      };

      if (aiLessonCycle && lessonStep < aiLessonCycle.cycles.length && !lessonCompleted) {
        const block = aiLessonCycle.cycles[lessonStep];
        const isInteractive = block.type === 'interactive' || block.type === 'challenge';

        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <button type="button" onClick={handleBackToCategories} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer transition">← Voltar</button>
              <div className="flex items-center gap-2">
                <div className="w-40 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${((lessonStep + 1) / totalLessonSteps) * 100}%` }} />
                </div>
                <span className="text-[10px] font-mono text-slate-400">{lessonStep + 1}/{totalLessonSteps}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">{blockTypeLabels[block.type] || 'Aula'}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative animate-bounce">
                  <span className="text-5xl">🐐</span>
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 text-white text-[8px] font-extrabold flex items-center justify-center rounded-full animate-pulse border border-white">IA</div>
                </div>
                <div className="bg-blue-50 dark:bg-[#0f172a] p-4 rounded-2xl border border-blue-200/50 dark:border-slate-800 relative text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
                  <div className="absolute -left-2 top-4 w-4 h-4 bg-blue-50 dark:bg-[#0f172a] border-t border-l border-blue-200/50 dark:border-slate-800 rotate-45" />
                  <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Cabrito do Mil:</p>
                  <p>{block.cabritoSpeech}</p>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${block.type === 'story' ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40' : block.type === 'explanation' ? `${activeCategory.bgColor} ${activeCategory.darkBgColor} ${activeCategory.borderColor}` : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/40'}`}>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{block.content}</p>
              </div>

              {isInteractive && block.options && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selecione sua resposta:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {block.options.map((opt, i) => {
                      const letter = String.fromCharCode(65 + i);
                      const isSelected = interactiveAnswer === i;
                      const isCorrect = i === block.correctIndex;
                      let optClass = 'bg-slate-50 dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500';
                      if (interactiveChecked) {
                        if (isCorrect) optClass = 'bg-green-50 dark:bg-green-950/30 border-green-400 dark:border-green-600 ring-2 ring-green-200 dark:ring-green-800';
                        else if (isSelected && !isCorrect) optClass = 'bg-red-50 dark:bg-red-950/30 border-red-400 dark:border-red-600 ring-2 ring-red-200 dark:ring-red-800';
                      } else if (isSelected) {
                        optClass = 'bg-blue-50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800';
                      }
                      return (
                        <button key={i} type="button" disabled={interactiveChecked} onClick={() => { setInteractiveAnswer(i); }} className={`px-4 py-3 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${optClass}`}>
                          <span className="font-bold mr-2">{letter})</span>{opt}
                        </button>
                      );
                    })}
                  </div>
                  {!interactiveChecked ? (
                    <button type="button" disabled={interactiveAnswer === null} onClick={() => { setInteractiveChecked(true); if (interactiveAnswer === block.correctIndex) { setLessonCorrectCount(prev => prev + 1); setLessonXpEarned(prev => prev + 10); } else { setLessonXpEarned(prev => prev + 2); if (onWrongAnswer && activeCategory) onWrongAnswer(activeCategory.area, 'aula'); } }} className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${interactiveAnswer !== null ? 'bg-blue-600 hover:bg-blue-700 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}`}>Verificar Resposta</button>
                  ) : (
                    <div className="space-y-3">
                      <div className={`p-3 rounded-xl text-xs font-semibold ${interactiveAnswer === block.correctIndex ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
                        {interactiveAnswer === block.correctIndex ? '✅ Correto! Excelente!' : '❌ Incorreto!'}
                        {block.explanation && <p className="mt-1 font-normal opacity-80">{block.explanation}</p>}
                      </div>
                      <button type="button" onClick={() => { if (lessonStep + 1 >= totalLessonSteps) { setLessonCompleted(true); } else { setLessonStep(prev => prev + 1); setInteractiveAnswer(null); setInteractiveChecked(false); } }} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md">
                        <span>{lessonStep + 1 >= totalLessonSteps ? 'Finalizar' : 'Próximo'}</span> <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!isInteractive && (
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={handleBackToCategories} className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer transition">Sair</button>
                  <button type="button" onClick={() => { if (lessonStep + 1 >= totalLessonSteps) { setLessonCompleted(true); } else { setLessonStep(prev => prev + 1); setInteractiveAnswer(null); setInteractiveChecked(false); } }} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md">
                    <span>{lessonStep + 1 >= totalLessonSteps ? 'Finalizar' : 'Próximo'}</span> <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (lessonCompleted && aiLessonCycle) {
        const totalBlocks = aiLessonCycle.cycles.length;
        const accuracy = lessonTotalInteractive > 0 ? Math.round((lessonCorrectCount / lessonTotalInteractive) * 100) : 100;
        const passed = accuracy >= 50;
        return (
          <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl text-center space-y-6">
              {passed ? (
                <div className="space-y-4">
                  <div className="inline-flex p-4 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-500 rounded-3xl shadow-sm animate-bounce">
                    <Trophy className="h-12 w-12" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                    Aula Concluída!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Parabéns! Você completou a aula de <strong>{activeCategory?.title}</strong> e acertou{' '}
                    <strong>{lessonCorrectCount}/{lessonTotalInteractive}</strong> dos desafios. Continue assim!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <span className="text-5xl block">🐐</span>
                  <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    Aula Finalizada!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Você acertou <strong>{lessonCorrectCount}/{lessonTotalInteractive}</strong> dos desafios de{' '}
                    <strong>{activeCategory?.title}</strong>. Revise o conteúdo e tente novamente para melhorar!
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-[#0f172a]/70 rounded-2xl border border-slate-200 dark:border-slate-800/60 text-center">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider font-mono">
                    Precisão
                  </span>
                  <span className={`text-xl font-black font-mono block ${passed ? 'text-green-600' : 'text-amber-500'}`}>
                    {accuracy}%
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider font-mono">
                    XP Ganho
                  </span>
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono block">
                    +{lessonXpEarned}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider font-mono">
                    Blocos
                  </span>
                  <span className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono block">
                    {totalBlocks}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = lessonTopicIndex + 1;
                    setLessonTopicIndex(nextIdx);
                    setLessonStep(0);
                    setLessonCompleted(false);
                    setLessonCorrectCount(0);
                    setLessonTotalInteractive(0);
                    setLessonXpEarned(0);
                    setInteractiveAnswer(null);
                    setInteractiveChecked(false);
                    fetchLessonCycle(activeCategory!, nextIdx);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Próxima Aula</span>
                </button>
                <button
                  type="button"
                  onClick={handleBackToCategories}
                  className="w-full py-3 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Voltar ao Menu
                </button>
              </div>
            </div>
          </div>
        );
      }

    }

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map(cat => {
            const isRecomendadoLocked =
              cat.area === 'Recomendado' &&
              wrongAnswers &&
              wrongAnswers.length < 3;
            const isRecomendado = cat.area === 'Recomendado' && !isRecomendadoLocked;
            const weakCount = topWeakTopics.length;
            return (
              <div
                key={cat.id}
                className={`rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-all duration-200 ${
                  isRecomendado
                    ? 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-2 border-purple-300 dark:border-purple-700/50 ring-1 ring-purple-200/50 dark:ring-purple-800/30'
                    : isRecomendadoLocked
                      ? `bg-white dark:bg-[#1e293b] border ${cat.borderColor} opacity-50`
                      : `bg-white dark:bg-[#1e293b] border ${cat.borderColor}`
                }`}
              >
                {isRecomendado && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-[9px] font-bold w-fit border border-purple-200 dark:border-purple-800/40">
                    <Sparkles className="h-3 w-3" />
                    Baseado nos seus erros
                  </div>
                )}
                <div
                  className={`${cat.bgColor} ${cat.darkBgColor} w-12 h-12 rounded-xl flex items-center justify-center ${cat.color}`}
                >
                  {cat.icon}
                </div>
                <div>
                  <h3 className="font-display font-black text-sm text-slate-800 dark:text-slate-100">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                {isRecomendado && weakCount > 0 && (
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                    🎯 {weakCount} assunto{weakCount !== 1 ? 's' : ''} fraco{weakCount !== 1 ? 's' : ''} identificado{weakCount !== 1 ? 's' : ''}
                  </p>
                )}
                {isRecomendadoLocked ? (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    ⚠️ Resolva pelo menos 3 questões para desbloquear
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartCursinhoCategory(cat)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                      isRecomendado
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>{isRecomendado ? 'Estudar Pontos Fracos' : 'Começar a Aprender'}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderQuestoesTab = () => {
    if (viewMode === 'questoes-play') {
      if (loadingQuestions) {
        return (
          <div className="flex flex-col items-center justify-center py-16 space-y-6 animate-fade-in">
            <div className="relative">
              <span className="text-7xl animate-bounce">🐐</span>
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 text-white text-[9px] font-extrabold flex items-center justify-center rounded-full animate-pulse border border-white">IA</div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100">Preparando suas questões...</h3>
              <p className="text-xs text-slate-400 max-w-xs">O Cabrito está preparando questões personalizadas para você!</p>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        );
      }

      if (questoesError) {
        return (
          <div className="flex flex-col items-center justify-center py-16 space-y-6 animate-fade-in">
            <div className="relative">
              <span className="text-7xl">🐐</span>
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center rounded-full border border-white">✕</div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100">A IA não conseguiu gerar questões</h3>
              <p className="text-xs text-slate-400 max-w-xs">O serviço de IA pode estar sobrecarregado. Tente novamente em alguns segundos.</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <button
                type="button"
                onClick={() => fetchQuestoesAI(questoesArea)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Tentar Novamente</span>
              </button>
              <button
                type="button"
                onClick={handleBackToCategories}
                className="w-full py-3 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Voltar ao Menu
              </button>
            </div>
          </div>
        );
      }
      const activeQListForStats = aiQuestoes;
      if (questaoCompleted) {
        const passed =
          questaoCorrectCount >= activeQListForStats.length * 0.7;
        return (
          <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl text-center space-y-6">
              {passed ? (
                <div className="space-y-4">
                  <div className="inline-flex p-4 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-500 rounded-3xl shadow-sm animate-bounce">
                    <Trophy className="h-12 w-12" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                    Sessão Concluída!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Excelente desempenho! Você acertou{' '}
                    <strong>
                      {questaoCorrectCount}/{activeQListForStats.length}
                    </strong>{' '}
                    das questões. Continue assim para dominar o ENEM!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="inline-flex p-4 bg-red-50 dark:bg-red-950/40 text-red-500 rounded-3xl shadow-sm">
                    <ShieldAlert className="h-12 w-12" />
                  </div>
                  <h3 className="text-2xl font-black text-red-600 dark:text-red-400">
                    Sessão Encerrada
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Você acertou{' '}
                    <strong>
                      {questaoCorrectCount}/{activeQListForStats.length}
                    </strong>{' '}
                    questões. Tente novamente para melhorar sua pontuação!
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-[#0f172a]/70 rounded-2xl border border-slate-200 dark:border-slate-800/60 text-center">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider font-mono">
                    Precisão
                  </span>
                  <span
                    className={`text-xl font-black font-mono block ${
                      passed ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {Math.round(
                      (questaoCorrectCount / activeQListForStats.length) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider font-mono">
                    XP Ganho
                  </span>
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono block">
                    +{questaoXp}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider font-mono">
                    Vidas
                  </span>
                  <span className="text-xl font-black text-amber-500 font-mono block">
                    {questaoHearts}/5
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleStartQuestoes(questoesArea)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Tentar Novamente</span>
                </button>
                <button
                  type="button"
                  onClick={handleBackToCategories}
                  className="w-full py-3 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Voltar ao Menu
                </button>
              </div>
            </div>
          </div>
        );
      }

      const activeQList = aiQuestoes;
      const q = activeQList[questaoIdx];
      if (!q || activeQList.length === 0) return null;

      const qAny = q as any;
      const qTopic = qAny.topic || '';
      const qExplanation = qAny.explanation || (qAny as any).explanation || '';

      return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackToCategories}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-lg text-xs font-bold font-sans cursor-pointer"
              >
                Sair
              </button>
              <div className="flex items-center gap-3">
                <div className="w-1/3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        ((questaoIdx + 1) / activeQList.length) * 100
                      }%`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Heart
                      key={i}
                      className={`h-4 w-4 ${
                        i < questaoHearts
                          ? 'fill-red-500 text-red-500'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono leading-none font-black text-blue-600 dark:text-blue-400 block tracking-wider uppercase">
                    Questão {questaoIdx + 1} de {activeQList.length}
                  </span>
                  {qTopic && (
                    <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-full text-[9px] font-bold border border-purple-200 dark:border-purple-800/40">
                      📌 {qTopic}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
                  Selecione a alternativa correta:
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                <p className="font-semibold">
                  <MathRenderer text={q.statement} />
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {q.options.map((opt: any) => {
                  const letter = opt.letter || String.fromCharCode(65 + q.options.indexOf(opt));
                  const isSelected = selectedLetter === letter;
                  const correctLetter = qAny.correctAnswer || qAny.correctLetter || 'A';
                  const isCorrect = letter === correctLetter;
                  let optStyle = '';
                  if (hasChecked) {
                    if (isCorrect) {
                      optStyle =
                        'bg-green-50 dark:bg-green-950/20 border-green-500 text-green-800 dark:text-green-300 ring-1 ring-green-500/20';
                    } else if (isSelected && !isCorrect) {
                      optStyle =
                        'bg-red-50 dark:bg-red-950/20 border-red-500 text-red-800 dark:text-red-300';
                    } else {
                      optStyle =
                        'bg-white dark:bg-[#1e293b]/45 border-slate-200 dark:border-slate-800 text-slate-400';
                    }
                  } else if (isSelected) {
                    optStyle =
                      'bg-blue-50 dark:bg-[#1e293b] border-blue-500 text-blue-900 dark:text-blue-300 font-bold ring-1 ring-blue-500/20';
                  } else {
                    optStyle =
                      'bg-white dark:bg-[#1e293b]/45 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400/65';
                  }

                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => {
                        if (!hasChecked) setSelectedLetter(letter);
                      }}
                      disabled={hasChecked}
                      className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-start gap-3 w-full cursor-pointer ${optStyle}`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="leading-tight pt-0.5">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {hasChecked && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className={`p-4 rounded-2xl flex items-start gap-3.5 text-xs ${
                    isCorrectAnswer
                      ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 text-green-800 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-300'
                  }`}>
                    {isCorrectAnswer ? (
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                    )}
                    <div className="space-y-1 leading-relaxed">
                      <p className="font-bold">
                        {isCorrectAnswer ? 'Correto!' : 'Incorreto!'}
                      </p>
                      <p>{questaoFeedback || qExplanation}</p>
                    </div>
                  </div>

                  {questaoFeedback && (
                    <div className="flex items-start gap-3 bg-blue-50 dark:bg-[#0f172a] p-4 rounded-2xl border border-blue-200/50 dark:border-slate-800">
                      <div className="relative flex-shrink-0">
                        <span className="text-2xl">🐐</span>
                        <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-blue-500 text-white text-[7px] font-extrabold flex items-center justify-center rounded-full border border-white">IA</div>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
                        <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Cabrito do Mil:</p>
                        <p>{questaoFeedback}</p>
                        {questaoTopic && (
                          <p className="mt-2 text-[10px] text-purple-500 font-semibold">
                            📌 Assunto: {questaoTopic}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {questaoHearts <= 0 && !hasChecked && (
                <div className="text-center py-6 space-y-4">
                  <span className="text-4xl">🐐</span>
                  <div className="space-y-2">
                    <h4 className="font-display font-black text-lg text-red-600 dark:text-red-400">
                      As energias do Cabrito acabaram!
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                      Suas vidas se esgotaram. Tente novamente!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartQuestoes(questoesArea)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Tentar Novamente
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                {!hasChecked ? (
                  <button
                    type="button"
                    onClick={handleQuestaoCheck}
                    disabled={!selectedLetter || questaoHearts <= 0}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>Verificar</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleQuestaoContinue}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map(cat => {
            const isRecomendadoLocked =
              cat.area === 'Recomendado' &&
              wrongAnswers &&
              wrongAnswers.length < 3;
            const isRecomendado = cat.area === 'Recomendado' && !isRecomendadoLocked;
            const weakCount = topWeakTopics.length;
            return (
              <div
                key={cat.id}
                className={`rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-all duration-200 ${
                  isRecomendado
                    ? 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-2 border-purple-300 dark:border-purple-700/50 ring-1 ring-purple-200/50 dark:ring-purple-800/30'
                    : isRecomendadoLocked
                      ? `bg-white dark:bg-[#1e293b] border ${cat.borderColor} opacity-50`
                      : `bg-white dark:bg-[#1e293b] border ${cat.borderColor}`
                }`}
              >
                {isRecomendado && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-[9px] font-bold w-fit border border-purple-200 dark:border-purple-800/40">
                    <Sparkles className="h-3 w-3" />
                    Baseado nos seus erros
                  </div>
                )}
                <div
                  className={`${cat.bgColor} ${cat.darkBgColor} w-12 h-12 rounded-xl flex items-center justify-center ${cat.color}`}
                >
                  {cat.icon}
                </div>
                <div>
                  <h3 className="font-display font-black text-sm text-slate-800 dark:text-slate-100">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                {isRecomendado && weakCount > 0 && (
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                    🎯 {weakCount} assunto{weakCount !== 1 ? 's' : ''} fraco{weakCount !== 1 ? 's' : ''} identificado{weakCount !== 1 ? 's' : ''}
                  </p>
                )}
                {isRecomendadoLocked ? (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    ⚠️ Resolva pelo menos 3 questões para desbloquear
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartQuestoes(cat.area)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                      isRecomendado
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>{isRecomendado ? 'Treinar Pontos Fracos' : 'Começar Questões'}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        id="aprendizado-view"
        className="space-y-6 animate-fade-in"
      >
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              Arena de Aprendizado Cabrito
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Domine conteúdos críticos e as matrizes do ENEM jogando sessões
              gamificadas hiper-rápidas no estilo Duolingo.
            </p>
            {weakAreas.length > 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                Foco em: {weakAreas.slice(0, 3).join(', ')}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {supabaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-950/40 text-xs font-semibold text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800/40">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Sincronizado (Nuvem)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-xs font-semibold text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800/40">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Progresso Local
              </span>
            )}

            <div className="flex items-center gap-2 bg-blue-100/50 dark:bg-blue-950/50 px-3 py-1 rounded-full text-xs font-bold text-blue-700 dark:text-blue-400 border border-blue-200/50">
              <Trophy className="h-4 w-4 text-blue-600 animate-bounce" />
              <span>{xpPoints} XP</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => {
              setMainTab('cursinho');
              setViewMode('categories');
              setActiveCategory(null);
            }}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              mainTab === 'cursinho'
                ? 'bg-white dark:bg-[#1e293b] text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Cursinho
          </button>
          <button
            type="button"
            onClick={() => {
              setMainTab('questoes');
              setViewMode('categories');
              setQuestoesArea('');
            }}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              mainTab === 'questoes'
                ? 'bg-white dark:bg-[#1e293b] text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="h-4 w-4" />
            Questões
          </button>
        </div>

        <AdPlaceholder slot="aprendizado-topo" format="banner" user={currentUser} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-8 shadow-sm">
              <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100">
                  {mainTab === 'cursinho'
                    ? 'Cursinho ENEM'
                    : 'Arena de Questões ENEM'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {mainTab === 'cursinho'
                    ? 'Estude cada área do ENEM com lições guiadas pelo Cabrito.'
                    : 'Pratique com questões estilo Duolingo e ganhe XP!'}
                </p>
              </div>

              {mainTab === 'cursinho' && (
                <>{renderCursinhoTab()}</>
              )}

              {mainTab === 'questoes' && viewMode === 'categories' && (
                <>{renderQuestoesTab()}</>
              )}

              {mainTab === 'questoes' && viewMode === 'questoes-play' && (
                <>{renderQuestoesTab()}</>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-8 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
              <div className="flex flex-col items-center">
                <div className="relative animate-bounce">
                  <span className="text-5xl">🐐</span>
                  <div className="absolute -top-3 -right-3 h-5 w-5 bg-blue-500 dark:bg-blue-400 text-white text-[10px] font-extrabold flex items-center justify-center rounded-full animate-pulse border border-white">
                    IA
                  </div>
                </div>
                <h4 className="font-display font-black text-sm text-slate-800 dark:text-slate-100 mt-3">
                  Cabrito do Mil
                </h4>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                  {mainTab === 'cursinho'
                    ? 'Tutor de Bolso'
                    : 'Companheiro de Questões'}
                </span>
              </div>

              <div className="bg-blue-50 dark:bg-[#0f172a] p-4 rounded-2xl border border-blue-200/50 dark:border-slate-800 relative text-xs text-left text-slate-700 dark:text-slate-300 leading-relaxed font-sans space-y-2">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-50 dark:bg-[#0f172a] border-t border-l border-blue-200/50 dark:border-slate-800 rotate-45" />
                {mainTab === 'cursinho' && viewMode === 'lesson' && activeCategory ? (
                  <>
                    <p className="font-semibold">
                      "Seu professor particular está aqui!"
                    </p>
                    <p>
                      Eu, o Cabrito, vou te guiar por esta aula sobre{' '}
                      <strong>{activeCategory.title}</strong>. Preste atenção
                      e avance quando estiver pronto!
                    </p>
                  </>
                ) : mainTab === 'questoes' && viewMode === 'questoes-play' ? (
                  <>
                    <p className="font-semibold">
                      "Mantenha o foco, estudioso(a)!"
                    </p>
                    <p>
                      Responda com atenção. Cada acerto te aproxima do
                      ENEM dos sonhos!
                    </p>
                    {questaoHearts <= 2 && questaoHearts > 0 && (
                      <p className="font-bold text-amber-600 dark:text-amber-400">
                        ⚠️ Cuidado! Estão sobrando poucas vidas!
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-semibold">
                      "Seja muito bem-vindo, estudioso(a)!"
                    </p>
                    <p>
                      {mainTab === 'cursinho'
                        ? 'Escolha uma categoria para começar uma aula guiada com o Cabrito. Cada lição é uma jornada de conhecimento!'
                        : 'Escolha uma categoria para praticar questões estilo Duolingo e ganhar XP!'}
                    </p>
                    <p className="font-bold text-blue-600 dark:text-blue-400">
                      {mainTab === 'cursinho'
                        ? 'Clique em "Começar a Aprender" para iniciar sua jornada!'
                        : 'Clique em "Começar Questões" para desafiar seus conhecimentos!'}
                    </p>
                  </>
                )}
              </div>

              {weakAreas.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl text-[11px] border border-amber-200 dark:border-amber-800/40 text-left space-y-1.5">
                  <p className="font-semibold text-amber-700 dark:text-amber-400">
                    📊 Seus pontos de melhoria:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-amber-600 dark:text-amber-300">
                    {weakAreas.slice(0, 5).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <AdPlaceholder
                slot="aprendizado-sidebar"
                format="rectangle"
                user={currentUser}
              />
            </div>
          </div>
        </div>

        <AdPlaceholder
          slot="aprendizado-rodape"
          format="banner"
          user={currentUser}
        />
      </div>

      {adGateActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl max-w-md w-full space-y-6 animate-fade-in">
            <div className="text-center space-y-3">
              <span className="text-5xl block animate-bounce">🐐</span>
              <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100">
                Antes de Continuar...
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Assista 30 segundos de anúncio para continuar
              </p>
              {(loadingLesson || loadingQuestions) && (
                <div className="flex items-center justify-center gap-2 text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                  <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span>Preparando conteúdo em segundo plano...</span>
                </div>
              )}
            </div>

            <AdGateVideo />

            {adGateActive && adGateSecondsLeft > 0 && (
              <div className="flex items-center justify-center gap-2 py-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/40">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                  {Math.floor(adGateSecondsLeft / 60)}:{String(adGateSecondsLeft % 60).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-blue-500/70 dark:text-blue-400/60 font-medium">
                  restante
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdGateTarget(null);
                  setAdGateActive(false);
                  setAdGateSecondsLeft(0);
                  setPrefetchTarget(null);
                }}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdGateContinue}
                disabled={adGateActive && adGateSecondsLeft > 0}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                {adGateActive && adGateSecondsLeft > 0 ? (
                  <>
                    <Clock className="h-4 w-4 animate-pulse" />
                    <span>Aguarde {adGateSecondsLeft}s...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span>Continuar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRewardAd && pendingChapter && (
        <RewardAdOverlay
          action="cursinho-lesson"
          onContinue={() => {
            setShowRewardAd(false);
            const chap = pendingChapter;
            setPendingChapter(null);
            setActiveChapter(chap);
            setHearts(5);
            setCurrentExerciseIdx(0);
            setHasCheckedLesson(false);
            setIsCorrectLesson(false);
            setAiSpeechText(null);
            setSelectedLetter(null);
            setSelectedBool(null);
            setReorderedWords([]);
            setMatchingSelections({ left: null, right: null });
            setMatchingCompleted({});

            const pool =
              CHAPTER_EXERCISES[chap.id] ||
              CHAPTER_EXERCISES['red-tese'] ||
              [];
            const shuffled = [...pool].sort(() => Math.random() - 0.5);
            setActiveExercises(shuffled);
            setOriginalCount(shuffled.length);
            setErrorsCount(0);
            setLessonCompleted(false);
            setLessonPassed(false);
            setLessonScore(0);
            setLessonActive(true);
          }}
          onClose={() => {
            setShowRewardAd(false);
            setPendingChapter(null);
          }}
        />
      )}
    </>
  );
}
