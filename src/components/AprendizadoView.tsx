import React, { useState, useEffect } from 'react';
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
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { LearningChapter, Exercise, EssayCorrection, UserProfile } from '../types';
import { INITIAL_CHAPTERS, CHAPTER_EXERCISES } from '../data/learning-exercises';
import AdPlaceholder from './AdPlaceholder';
import RewardAdOverlay, { shouldShowRewardAd, incrementRewardCounter } from './RewardAdOverlay';

interface AprendizadoViewProps {
  essayCorrections?: EssayCorrection[];
  simuladosHistory?: { scorePercent: number; date: string; subject: string }[];
  currentUser?: UserProfile;
  accessToken?: string;
}

function getWeakAreas(essays?: EssayCorrection[], simHistory?: { scorePercent: number; subject: string }[], hardSubjects?: string[]): string[] {
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
  return weak;
}

export default function AprendizadoView({ essayCorrections, simuladosHistory, currentUser, accessToken }: AprendizadoViewProps) {
  const [chapters, setChapters] = useState<LearningChapter[]>(INITIAL_CHAPTERS);
  const [activeChapter, setActiveChapter] = useState<LearningChapter | null>(null);

  const [activeExercises, setActiveExercises] = useState<Exercise[]>([]);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [xpPoints, setXpPoints] = useState(0);
  const [streak, setStreak] = useState(1);
  const [lessonActive, setLessonActive] = useState(false);

  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedBoolean, setSelectedBoolean] = useState<boolean | null>(null);
  const [reorderedWords, setReorderedWords] = useState<string[]>([]);
  const [matchingSelections, setMatchingSelections] = useState<{ left: string | null; right: string | null }>({ left: null, right: null });
  const [matchingCompleted, setMatchingCompleted] = useState<{ [key: string]: boolean }>({});
  const [matchingStatusText, setMatchingStatusText] = useState('Clique em uma palavra da esquerda e depois na sua explicação');

  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);

  const [loadingAiExplanation, setLoadingAiExplanation] = useState(false);
  const [aiSpeechText, setAiSpeechText] = useState<string | null>(null);
  const [openRouterConfigured, setOpenRouterConfigured] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('Local');

  const [originalCount, setOriginalCount] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [lessonPassed, setLessonPassed] = useState(false);
  const [lessonScore, setLessonScore] = useState(0);
  const [showRewardAd, setShowRewardAd] = useState(false);
  const [pendingChapter, setPendingChapter] = useState<LearningChapter | null>(null);

  const weakAreas = getWeakAreas(
    essayCorrections,
    simuladosHistory,
    (currentUser as any)?.hardSubjects
  );

  useEffect(() => {
    try {
      const sessionUser = localStorage.getItem('ApexEnem_current_user');
      if (sessionUser) {
        const user = JSON.parse(sessionUser);
        setStreak(user.streak || 1);

        const keyPrefix = user.email.toLowerCase().replace(/[@.]/g, '_');

        const savedChapters = localStorage.getItem(`ApexEnem_learn_chapters_${keyPrefix}`);
        if (savedChapters) {
          try {
            setChapters(JSON.parse(savedChapters));
          } catch { /* corrupted data */ }
        }

        const savedXP = localStorage.getItem(`ApexEnem_learn_xp_${keyPrefix}`);
        if (savedXP) {
          const xp = parseInt(savedXP, 10);
          if (!isNaN(xp)) setXpPoints(xp);
        }
      }
    } catch { /* localStorage corrupted */ }

    checkCredentials();
  }, []);

  const checkCredentials = async () => {
    try {
      const res = await fetch('/api/credentials-status');
      if (res.ok) {
        const data = await res.json();
        setOpenRouterConfigured(data.openRouter);
        setSupabaseConfigured(data.supabase);
        if (data.supabase) {
          setSyncStatus('Nuvem');
          loadProgressFromSupabase();
        }
      }
    } catch {
      // safe fallback
    }
  };

  const getAuthHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    return headers;
  };

  const loadProgressFromSupabase = async () => {
    try {
      if (!accessToken) return;
      const res = await fetch(`/api/supabase/get-progress`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.progress) {
          if (data.progress.chapters) {
            setChapters(data.progress.chapters);
            try {
              const sessionUser = localStorage.getItem('ApexEnem_current_user');
              if (sessionUser) {
                const user = JSON.parse(sessionUser);
                const keyPrefix = user.email.toLowerCase().replace(/[@.]/g, '_');
                localStorage.setItem(`ApexEnem_learn_chapters_${keyPrefix}`, JSON.stringify(data.progress.chapters));
              }
            } catch { /* localStorage corrupted */ }
          }
          if (data.progress.xpPoints) {
            setXpPoints(data.progress.xpPoints);
          }
        }
      }
    } catch (e) {
      console.warn("Supabase load error: ", e);
    }
  };

  const syncProgressToCloud = async (updatedChapters: LearningChapter[], newXP: number) => {
    try {
      const sessionUser = localStorage.getItem('ApexEnem_current_user');
      if (!sessionUser) return;
      const user = JSON.parse(sessionUser);

      const keyPrefix = user.email.toLowerCase().replace(/[@.]/g, '_');
      localStorage.setItem(`ApexEnem_learn_chapters_${keyPrefix}`, JSON.stringify(updatedChapters));
      localStorage.setItem(`ApexEnem_learn_xp_${keyPrefix}`, newXP.toString());

      if (supabaseConfigured) {
        await fetch('/api/supabase/save-progress', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            progress: {
              chapters: updatedChapters,
              xpPoints: newXP
            }
          })
        });
      }
    } catch (e) {
      console.warn("Supabase save error:", e);
    }
  };

  const generateExercisesWithAI = async (chap: LearningChapter): Promise<Exercise[] | null> => {
    try {
      const res = await fetch('/api/generate-learning-exercises', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          chapterId: chap.id,
          chapterTitle: chap.title,
          chapterArea: chap.area,
          weakAreas,
          count: 5
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.exercises && Array.isArray(data.exercises) && data.exercises.length > 0) {
          return data.exercises as Exercise[];
        }
      }
    } catch (e) {
      console.warn("AI generation failed:", e);
    }
    return null;
  };

  const handleStartLesson = async (chap: LearningChapter) => {
    setActiveChapter(chap);
    setHearts(5);
    setCurrentExerciseIdx(0);
    setHasChecked(false);
    setIsCorrectAnswer(false);
    setAiSpeechText(null);

    setSelectedLetter(null);
    setSelectedBoolean(null);
    setReorderedWords([]);
    setMatchingSelections({ left: null, right: null });
    setMatchingCompleted({});
    setMatchingStatusText('Escolha uma palavra da de esquerda e depois sua resposta à direita.');

    incrementRewardCounter('ai-exercises');
    if (shouldShowRewardAd('ai-exercises', 3)) {
      setPendingChapter(chap);
      setShowRewardAd(true);
      return;
    }

    await doStartLesson(chap);
  };

  const doStartLesson = async (chap: LearningChapter) => {

    let pool: Exercise[] = [];

    const aiExercises = await generateExercisesWithAI(chap);
    if (aiExercises) {
      pool = aiExercises;
    }

    if (pool.length === 0) {
      pool = CHAPTER_EXERCISES[chap.id] || CHAPTER_EXERCISES['red-tese'] || [];
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    setActiveExercises(shuffled);
    setOriginalCount(shuffled.length);
    setErrorsCount(0);
    setLessonCompleted(false);
    setLessonPassed(false);
    setLessonScore(0);

    setLessonActive(true);
  };

  const handleWordTap = (word: string, isFromAnswer: boolean) => {
    if (hasChecked) return;
    if (isFromAnswer) {
      setReorderedWords(reorderedWords.filter(w => w !== word));
    } else {
      if (!reorderedWords.includes(word)) {
        setReorderedWords([...reorderedWords, word]);
      }
    }
  };

  const handleMatchingTap = (value: string, side: 'left' | 'right', exercise: Exercise) => {
    if (hasChecked) return;

    const newSel = { ...matchingSelections };
    newSel[side] = value;

    setMatchingSelections(newSel);

    if (newSel.left && newSel.right) {
      const match = exercise.matchingPairs?.find(p => p.left === newSel.left);
      if (match && match.right === newSel.right) {
        setMatchingCompleted(prev => ({ ...prev, [newSel.left!]: true }));
        setMatchingStatusText(`Sucesso! Conectou "${newSel.left}" corretamente.`);
      } else {
        setMatchingStatusText(`Ops! O termo "${newSel.left}" não está associado a "${newSel.right}". Tente de novo!`);
      }
      setMatchingSelections({ left: null, right: null });
    }
  };

  const handleAskCorujitoIa = async () => {
    if (loadingAiExplanation) return;
    setLoadingAiExplanation(true);
    setAiSpeechText("Carregando as asas do Corujito IA com conhecimento de alto nível...");

    const currentEx = activeExercises[currentExerciseIdx];

    try {
      const response = await fetch('/api/openrouter-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: currentEx.statement,
          instructions: currentEx.instructions,
          correctAnswer: currentEx.type === 'choice' ? currentEx.correctLetter : currentEx.correctBoolean ? 'Verdadeiro' : 'Falso'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiSpeechText(data.explanation || data.text);
      } else {
        setAiSpeechText(`Olhou, voou! Devido a limites de internet, eis a dica: ${currentEx.explanation}`);
      }
    } catch {
      setAiSpeechText(`Eis a sabedoria do Corujito: ${currentEx.explanation}`);
    } finally {
      setLoadingAiExplanation(false);
    }
  };

  const handleCheckAnswer = () => {
    const currentEx = activeExercises[currentExerciseIdx];
    let correct = false;

    if (currentEx.type === 'choice') {
      correct = selectedLetter === currentEx.correctLetter;
    } else if (currentEx.type === 'true-false') {
      correct = selectedBoolean === currentEx.correctBoolean;
    } else if (currentEx.type === 'reorder') {
      correct = JSON.stringify(reorderedWords) === JSON.stringify(currentEx.correctSentenceWords);
    } else if (currentEx.type === 'matching') {
      const leftElements = currentEx.matchingPairs?.map(p => p.left) || [];
      correct = leftElements.every(elem => matchingCompleted[elem] === true);
    }

    setIsCorrectAnswer(correct);
    setHasChecked(true);

    if (!correct) {
      setHearts(prev => Math.max(0, prev - 1));
      setErrorsCount(prev => prev + 1);

      setActiveExercises(prev => {
        const copy = { ...currentEx, id: `${currentEx.id}-retry-${Date.now()}` };
        return [...prev, copy];
      });
    }
  };

  const handleContinue = () => {
    setHasChecked(false);
    setAiSpeechText(null);
    setSelectedLetter(null);
    setSelectedBoolean(null);
    setReorderedWords([]);
    setMatchingSelections({ left: null, right: null });
    setMatchingCompleted({});
    setMatchingStatusText('Escolha uma palavra da esquerda e depois sua resposta à direita.');

    if (currentExerciseIdx + 1 < activeExercises.length) {
      setCurrentExerciseIdx(currentExerciseIdx + 1);
    } else {
      const rawScore = originalCount > 0 ? Math.round(((originalCount - errorsCount) / originalCount) * 100) : 100;
      const finalScorePercent = Math.max(0, rawScore);
      const passed = finalScorePercent >= 70;

      setLessonScore(finalScorePercent);
      setLessonPassed(passed);
      setLessonCompleted(true);

      if (passed) {
        handleLessonSuccess();
      }
    }
  };

  const handleLessonSuccess = () => {
    if (!activeChapter) return;

    const gainXp = activeChapter.xpValue;
    const newXp = xpPoints + gainXp;
    setXpPoints(newXp);

    const updatedChapters = chapters.map(chap => {
      if (chap.id === activeChapter.id) {
        const nextLevel = Math.min(chap.level + 1, chap.maxLevel);
        return {
          ...chap,
          level: nextLevel
        };
      }
      return chap;
    });

    let anyUnlocked = false;
    const finalChapters = updatedChapters.map((chap, idx) => {
      if (idx > 0 && updatedChapters[idx - 1].level > 0 && !chap.unlocked) {
        anyUnlocked = true;
        return { ...chap, unlocked: true };
      }
      return chap;
    });

    setChapters(finalChapters);

    syncProgressToCloud(finalChapters, newXp);
  };

  const getCorujitoMessage = () => {
    if (hasChecked) {
      return isCorrectAnswer
        ? ["Excelente! Você voou alto!", "Sensacional, gabarito impecável!", "Você está se aproximando do 1000!"][currentExerciseIdx % 3]
        : "Ops! Não chore, o erro pavimenta o caminho da perfeição escolar! Veja a resolução pedagógica.";
    }
    return [
      "Concentração total! Leia atentamente os enunciados educacionais.",
      "O tempo passa devagar se você exercita sua inteligência!",
      "A Redação Apex Enem exige vocabulário e argumentação precisa.",
      "Duolingo do ENEM! Pratique 5 minutos por dia para asas robustas!"
    ][currentExerciseIdx % 4];
  };

  return (
    <>
    <div id="aprendizado-view" className="space-y-6 animate-fade-in" style={{ contentVisibility: 'auto' }}>

      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            Arena de Aprendizado Corujito
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Domine conteúdos críticos e as matrizes do ENEM jogando sessões gamificadas hiper-rápidas no estilo Duolingo.
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
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              Sincronizado Supabase (Nuvem)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-xs font-semibold text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800/40">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              Progresso Local (Offline)
            </span>
          )}

          <div className="flex items-center gap-2 bg-blue-100/50 dark:bg-blue-950/50 px-3 py-1 rounded-full text-xs font-bold text-blue-700 dark:text-blue-400 border border-blue-200/50">
            <Trophy className="h-4 w-4 text-blue-600 animate-bounce" />
            <span>{xpPoints} XP</span>
          </div>
        </div>
      </div>

      {/* Ad banner after header */}
      <AdPlaceholder slot="aprendizado-topo" format="banner" user={currentUser} />

      {!lessonActive ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-8 shadow-sm">
              <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100">Caminho do Conhecimento ENEM</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">Complete as trilhas ordenadamente para desbloquear o conhecimento definitivo da universidade.</p>
              </div>

              <div className="flex flex-col items-center justify-center space-y-12 relative py-8" id="duolingo-path-curve">
                <div className="absolute top-12 bottom-12 w-1.5 bg-dashed border-l border-blue-300 dark:border-slate-700 pointer-events-none z-0"></div>

                {chapters.map((chap, idx) => {
                  const nodeOffsets = [
                    'translate-x-0',
                    'translate-x-12 sm:translate-x-20',
                    '-translate-x-12 sm:-translate-x-20',
                    'translate-x-0',
                    '-translate-x-12 sm:-translate-x-20',
                    'translate-x-12 sm:translate-x-20'
                  ];

                  const positionClass = nodeOffsets[idx % nodeOffsets.length];
                  const finishedFully = chap.level === chap.maxLevel;
                  const percent = Math.round((chap.level / chap.maxLevel) * 100);

                  return (
                    <div
                      key={chap.id}
                      className={`flex flex-col sm:flex-row items-center gap-4 z-10 p-2 text-center sm:text-left ${positionClass} animate-fade-in relative`}
                    >
                      <button
                        id={`chapter-${chap.id}`}
                        type="button"
                        disabled={!chap.unlocked}
                        onClick={() => handleStartLesson(chap)}
                        className={`h-20 w-20 rounded-full flex flex-col items-center justify-center border-4 relative shadow-lg cursor-pointer transition transform duration-200 hover:scale-110 active:scale-95 ${
                          chap.unlocked
                            ? finishedFully
                              ? 'bg-emerald-500 border-emerald-300 text-white hover:bg-emerald-600'
                              : 'bg-blue-600 border-blue-400 text-white hover:bg-blue-700'
                            : 'bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        {!chap.unlocked ? (
                          <Lock className="h-7 w-7" />
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            <span className="font-display font-black text-xl tracking-tight uppercase leading-none">Nível</span>
                            <span className="text-sm font-bold font-mono">{chap.level}</span>
                          </div>
                        )}

                        {chap.unlocked && (
                          <div className="absolute -top-2.5 -right-2.5 px-1.5 py-0.5 bg-[#0f172a] text-[9px] text-[#f8fafc] dark:bg-blue-500 dark:text-[#f8fafc] rounded-full font-mono font-black border border-slate-300 dark:border-blue-300">
                            {percent}%
                          </div>
                        )}
                      </button>

                      <div className="max-w-[200px] sm:max-w-xs space-y-1">
                        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[10px] font-mono leading-none tracking-wider font-extrabold uppercase">
                          <span className={`px-2 py-0.5 rounded-md text-white font-bold ${
                            chap.area === 'Redação' ? 'bg-indigo-500' :
                            chap.area === 'Humanas' ? 'bg-amber-600' :
                            chap.area === 'Linguagens' ? 'bg-purple-500' :
                            chap.area === 'Natureza' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}>
                            {chap.area}
                          </span>
                          {!chap.unlocked && <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-0.5">● BLOQUEADO</span>}
                        </div>
                        <h4 className={`font-display font-black text-sm block ${chap.unlocked ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
                          {chap.title}
                        </h4>
                        <p className="text-[11px] text-slate-450 leading-snug truncate sm:whitespace-normal">
                          {chap.description}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">

              <div className="flex flex-col items-center">
                <div className="relative animate-bounce">
                  <span className="text-5xl">🦉</span>
                  <div className="absolute -top-3 -right-3 h-5 w-5 bg-blue-500 dark:bg-blue-400 text-white text-[10px] font-extrabold flex items-center justify-center rounded-full animate-pulse border border-white">
                    IA
                  </div>
                </div>
                <h4 className="font-display font-black text-sm text-slate-800 dark:text-slate-100 mt-3">Corujito do Mil</h4>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">Conselheiro de Trilha</span>
              </div>

              <div className="bg-blue-50 dark:bg-[#0f172a] p-4 rounded-2xl border border-blue-200/50 dark:border-slate-800 relative text-xs text-left text-slate-700 dark:text-slate-300 leading-relaxed font-sans space-y-2">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-50 dark:bg-[#0f172a] border-t border-l border-blue-200/50 dark:border-slate-800 rotate-45"></div>
                <p className="font-semibold">"Seja muito bem-vindo, estudioso(a)!"</p>
                <p>Nesta arena gamificada, você ganha XP valiosos. Seus acertos sobem sua média do dashboard e fortificam sua ofensiva.</p>
                <p className="font-bold text-blue-600 dark:text-blue-400">Clique em qualquer círculo liberado da trilha à esquerda para decolar!</p>
              </div>

              {weakAreas.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl text-[11px] border border-amber-200 dark:border-amber-800/40 text-left space-y-1.5">
                  <p className="font-semibold text-amber-700 dark:text-amber-400">📊 Seus pontos de melhoria:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-amber-600 dark:text-amber-300">
                    {weakAreas.slice(0, 5).map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              {/* Ad inside sidebar */}
              <AdPlaceholder slot="aprendizado-sidebar" format="rectangle" user={currentUser} />

            </div>
          </div>

        </div>
      ) : (
        <div className="max-w-4xl mx-auto" id="active-lesson-gaming-container">

          {lessonCompleted ? (
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl text-center space-y-6 max-w-lg mx-auto animate-fade-in" id="lesson-completed-card">

              {lessonPassed ? (
                <div className="space-y-4">
                  <div className="inline-flex p-4 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-500 rounded-3xl shadow-sm animate-bounce">
                    <Trophy className="h-12 w-12" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">Nível Concluído!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Fantástico! Você demonstrou domínio acadêmico e alcançou mais de 70% de precisão de voo de primeira tentativa! Seu nível foi atualizado e novos desafios foram desbloqueados.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="inline-flex p-4 bg-red-50 dark:bg-red-950/40 text-red-500 rounded-3xl shadow-sm">
                    <ShieldAlert className="h-12 w-12" />
                  </div>
                  <h3 className="text-2xl font-black text-red-650 dark:text-red-450">Nível não Concluído!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Sua precisão nesta rodada foi de <strong>{lessonScore}%</strong>. Para avançar de nível na arena do Corujito, você precisa obter pelo menos <strong>70% de precisão de acertos</strong> nas suas primeiras tentativas. Não desanime! O erro é parte integral do aprendizado.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-[#0f172a]/70 rounded-2xl border border-slate-200 dark:border-slate-800/60 text-center">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider font-mono">Precisão</span>
                  <span className={`text-xl font-black font-mono block ${lessonPassed ? 'text-green-600' : 'text-red-500'}`}>{lessonScore}%</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider font-mono">Recompensas</span>
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono block">+{lessonPassed ? activeChapter?.xpValue : 0} XP</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider font-mono">Correções</span>
                  <span className="text-xl font-black text-amber-500 font-mono block">{errorsCount} 🔥</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {lessonPassed ? (
                  <button
                    type="button"
                    onClick={() => {
                      setLessonCompleted(false);
                      setLessonActive(false);
                      setActiveChapter(null);
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Excelente, Continuar!</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setLessonCompleted(false);
                        handleStartLesson(activeChapter!);
                      }}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Tentar Novamente</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLessonCompleted(false);
                        setLessonActive(false);
                        setActiveChapter(null);
                      }}
                      className="w-full py-3 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Voltar ao Menu
                    </button>
                  </>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[500px]">

            <div className="flex-grow p-6 md:p-8 flex flex-col justify-between space-y-6 md:border-r border-slate-200 dark:border-slate-800">

              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Deseja realmente abandonar seu progresso nesta rodada do Duolingo?')) {
                      setLessonActive(false);
                      setActiveChapter(null);
                    }
                  }}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-lg text-xs font-bold font-sans cursor-pointer"
                >
                  Sair do Desafio
                </button>

                <div className="w-1/3 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mx-4 relative border border-slate-200 dark:border-slate-700">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${((currentExerciseIdx + 1) / activeExercises.length) * 100}%` }}
                  ></div>
                </div>

                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Heart
                      key={i}
                      className={`h-4.5 w-4.5 ${i < hearts ? 'fill-red-500 text-red-500 animate-pulse' : 'text-slate-300 dark:text-slate-700'}`}
                    />
                  ))}
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-1">({hearts}/5)</span>
                </div>
              </div>

              <div className="space-y-6 py-4 flex-grow">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono leading-none font-black text-blue-600 dark:text-blue-400 block tracking-wider uppercase">
                    Etapa {currentExerciseIdx + 1} de {activeExercises.length} • {activeExercises[currentExerciseIdx].type.toUpperCase()}
                  </span>
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-300">
                    {activeExercises[currentExerciseIdx].instructions}
                  </h3>
                </div>

                <div className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-850 p-4 rounded-2xl md:p-6 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                  <p className="font-semibold text-sm leading-relaxed whitespace-pre-wrap">
                    {activeExercises[currentExerciseIdx].statement}
                  </p>
                </div>

                {hearts > 0 ? (
                  <div className="space-y-4" id="dinamyc-lesson-content-swapper">

                    {activeExercises[currentExerciseIdx].type === 'choice' && (
                      <div className="grid grid-cols-1 gap-2.5">
                        {activeExercises[currentExerciseIdx].options?.map((opt) => {
                          const isSelected = selectedLetter === opt.letter;
                          return (
                            <button
                              key={opt.letter}
                              type="button"
                              onClick={() => { if (!hasChecked) setSelectedLetter(opt.letter); }}
                              disabled={hasChecked}
                              className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-start gap-3 w-full cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-50 dark:bg-[#1e293b] border-blue-500 text-blue-900 dark:text-blue-300 font-bold ring-1 ring-blue-500/20'
                                  : 'bg-white dark:bg-[#1e293b]/45 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-350 hover:border-blue-400/65'
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500'
                              }`}>
                                {opt.letter}
                              </span>
                              <span className="leading-tight pt-0.5">{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {activeExercises[currentExerciseIdx].type === 'true-false' && (
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => { if (!hasChecked) setSelectedBoolean(true); }}
                          disabled={hasChecked}
                          className={`p-6 rounded-2xl border text-center text-sm font-bold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                            selectedBoolean === true
                              ? 'bg-green-50 dark:bg-green-950/20 border-green-500 text-green-700 dark:text-green-400 shadow-sm'
                              : 'bg-white dark:bg-[#1e293b]/40 border-slate-200 dark:border-slate-850 text-slate-650'
                          }`}
                        >
                          <span className="text-2xl font-black">V</span>
                          <span>Afirmação Verdadeira</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { if (!hasChecked) setSelectedBoolean(false); }}
                          disabled={hasChecked}
                          className={`p-6 rounded-2xl border text-center text-sm font-bold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                            selectedBoolean === false
                              ? 'bg-red-50 dark:bg-red-950/20 border-red-500 text-red-700 dark:text-red-400 shadow-sm'
                              : 'bg-white dark:bg-[#1e293b]/40 border-slate-200 dark:border-slate-850 text-slate-650'
                          }`}
                        >
                          <span className="text-2xl font-black">F</span>
                          <span>Afirmação Falsa</span>
                        </button>
                      </div>
                    )}

                    {activeExercises[currentExerciseIdx].type === 'reorder' && (
                      <div className="space-y-6">

                        <div className="min-h-[75px] p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-wrap items-center gap-2 relative">
                          {reorderedWords.length === 0 && (
                            <span className="text-xs text-slate-400 absolute inset-0 flex items-center justify-center pointer-events-none">
                              Toque nos blocos abaixo para posicionar na ordem correta
                            </span>
                          )}
                          {reorderedWords.map((word) => (
                            <button
                              key={word}
                              type="button"
                              onClick={() => handleWordTap(word, true)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 cursor-pointer shadow-sm animate-fade-in"
                            >
                              {word}
                            </button>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2.5 p-3.5 bg-slate-50/50 rounded-2xl border border-slate-200 dark:border-slate-850">
                          {activeExercises[currentExerciseIdx].shuffledWords?.map((word) => {
                            const isChosen = reorderedWords.includes(word);
                            return (
                              <button
                                key={word}
                                type="button"
                                disabled={isChosen || hasChecked}
                                onClick={() => handleWordTap(word, false)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                                  isChosen
                                    ? 'bg-slate-200 select-none pointer-events-none text-slate-200 border-transparent dark:bg-slate-800'
                                    : 'bg-white text-slate-750 dark:bg-slate-800 dark:text-slate-100 hover:border-blue-400 border border-slate-200 shadow-sm'
                                }`}
                              >
                                {word}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {activeExercises[currentExerciseIdx].type === 'matching' && (
                      <div className="space-y-4">
                        <div className="p-2 py-2.5 bg-blue-50/45 dark:bg-[#0f172a]/45 rounded-xl border border-blue-100 dark:border-slate-800 text-[11px] text-center text-blue-600 dark:text-blue-400 font-semibold font-mono animate-pulse">
                          {matchingStatusText}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Termo</span>
                            {activeExercises[currentExerciseIdx].matchingPairs?.map((pair) => {
                              const isCompleted = !!matchingCompleted[pair.left];
                              const isSelected = matchingSelections.left === pair.left;
                              return (
                                <button
                                  key={pair.left}
                                  type="button"
                                  disabled={isCompleted || hasChecked}
                                  onClick={() => handleMatchingTap(pair.left, 'left', activeExercises[currentExerciseIdx])}
                                  className={`w-full p-3.5 rounded-xl text-[11.5px] border font-bold text-center transition cursor-pointer ${
                                    isCompleted
                                      ? 'bg-green-500 text-white border-transparent select-none line-through opacity-45'
                                      : isSelected
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                        : 'bg-white dark:bg-[#1e293b]/45 border-slate-200 dark:border-slate-850 hover:bg-slate-50'
                                  }`}
                                >
                                  {pair.left}
                                </button>
                              );
                            })}
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Significado</span>
                            {activeExercises[currentExerciseIdx].matchingPairs?.map((pair) => {
                              const leftPartner = activeExercises[currentExerciseIdx].matchingPairs?.find(p => p.right === pair.right)?.left || '';
                              const isCompleted = !!matchingCompleted[leftPartner];
                              const isSelected = matchingSelections.right === pair.right;

                              return (
                                <button
                                  key={pair.right}
                                  type="button"
                                  disabled={isCompleted || hasChecked}
                                  onClick={() => handleMatchingTap(pair.right, 'right', activeExercises[currentExerciseIdx])}
                                  className={`w-full p-3 md:p-3.5 rounded-xl text-[10.5px] leading-tight border text-left transition cursor-pointer min-h-[52px] ${
                                    isCompleted
                                      ? 'bg-green-500 text-white border-transparent select-none line-through opacity-45'
                                      : isSelected
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md font-semibold'
                                        : 'bg-white dark:bg-[#1e293b]/45 border-slate-200 dark:border-slate-850 hover:bg-slate-50 text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  {pair.right}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="text-center py-8 space-y-5 animate-fade-in">
                    <span className="text-5xl">😭</span>
                    <div className="space-y-2">
                      <h4 className="font-display font-black text-lg text-red-600">As energias de voo acabaram!</h4>
                      <p className="text-xs text-slate-450 leading-relaxed max-w-sm mx-auto">
                        Ops, as 5 vidas do Corujito foram esgotadas. Estudar exige perseverança e revisar os pontos mais duros!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartLesson(activeChapter!)}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Tentar Novamente
                    </button>
                  </div>
                )}
              </div>

              {hearts > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">

                  {hasChecked && (
                    <div className={`p-4 rounded-2xl flex items-start gap-3.5 text-xs animate-fade-in ${
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
                        <p className="font-bold">{isCorrectAnswer ? 'Gabaritou!' : 'Resposta incorreta!'}</p>
                        <p>{activeExercises[currentExerciseIdx].explanation}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center gap-3">

                    <button
                      id="btn-lesson-ask-ai"
                      type="button"
                      onClick={handleAskCorujitoIa}
                      className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 rounded-xl text-xs font-bold font-sans cursor-pointer flex items-center gap-2 shadow-sm"
                    >
                      <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                      <span>{loadingAiExplanation ? 'Invocando IA...' : 'Explicar com Corujito IA'}</span>
                    </button>

                    {!hasChecked ? (
                      <button
                        id="btn-lesson-verify"
                        type="button"
                        onClick={handleCheckAnswer}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <span>Verificar Resposta</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        id="btn-lesson-continue"
                        type="button"
                        onClick={handleContinue}
                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <span>Continuar Estudando</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}

                  </div>

                </div>
              )}

            </div>

            <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900/40 p-6 flex flex-col justify-start items-center space-y-4">

              <div className="text-center space-y-2">
                <span className="text-5xl animate-bounce duration-1000 block">🦉</span>
                <span className="text-[10px] font-mono uppercase bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full font-extrabold max-w-max mx-auto block leading-none">
                  Tutor de Bolso
                </span>
              </div>

              <div className="w-full bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs leading-relaxed text-slate-700 dark:text-slate-350 relative shadow-sm">
                <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Corujito:</p>
                <p>"{getCorujitoMessage()}"</p>
              </div>

              {/* Ad inside lesson sidebar */}
              <AdPlaceholder slot="aprendizado-lesson-sidebar" format="skyscraper" user={currentUser} />

              <AnimatePresence>
                {aiSpeechText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="w-full bg-blue-50 dark:bg-[#111827] p-4 rounded-2xl border border-blue-200 dark:border-slate-800 text-xs text-slate-750 dark:text-slate-300 leading-relaxed font-sans space-y-2.5 shadow-md relative mt-4 block"
                  >
                    <div className="flex justify-between items-center border-b border-blue-100 dark:border-slate-800 pb-1.5 select-none">
                      <span className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                        <Sparkles className="h-3.5 w-3.5" />
                        Corujito IA Ensina:
                      </span>
                      <button
                        onClick={() => setAiSpeechText(null)}
                        className="text-slate-400 hover:text-slate-600 shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <p className="whitespace-pre-wrap select-all">{aiSpeechText}</p>

                    <p className="text-[9px] text-[#4285F4] font-semibold flex items-center gap-1 font-mono uppercase">
                      ● Resposta gerada via OpenRouter (Gemini)
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>
          )}

        </div>
      )}

      {/* Ad banner at bottom */}
      <AdPlaceholder slot="aprendizado-rodape" format="banner" user={currentUser} />

    </div>

    {showRewardAd && pendingChapter && (
      <RewardAdOverlay
        action="ai-exercises"
        onContinue={() => {
          setShowRewardAd(false);
          const chap = pendingChapter;
          setPendingChapter(null);
          doStartLesson(chap);
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
