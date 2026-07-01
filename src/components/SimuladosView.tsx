/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Clock, 
  HelpCircle, 
  Check, 
  X, 
  Award, 
  ArrowLeft, 
  ArrowRight, 
  Flag,
  RotateCcw,
  BookOpen,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { SimuladoConfig, SimuladoQuestion, SimuladoState } from '../types';
import AdPlaceholder from './AdPlaceholder';
import RewardAdOverlay, { shouldShowRewardAd, incrementRewardCounter } from './RewardAdOverlay';

interface SimuladosViewProps {
  onSaveSimuladoResult: (scorePercent: number, subject: string) => void;
  accessToken?: string;
}

// Durable Fisher-Yates array shuffling implementation
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

export default function SimuladosView({ onSaveSimuladoResult, accessToken }: SimuladosViewProps) {
  const [config, setConfig] = useState<SimuladoConfig>({
    subject: 'Matemática',
    questionCount: 3
  });

  const [simulado, setSimulado] = useState<SimuladoState | null>(null);
  const [showGabarito, setShowGabarito] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showRewardAd, setShowRewardAd] = useState(false);

  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // COUNTDOWN CHRONOMETER ENGINE
  useEffect(() => {
    if (simulado && simulado.isActive && simulado.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setSimulado((prev) => {
          if (!prev) return null;
          if (prev.timeLeft <= 1) {
            clearInterval(timerRef.current!);
            return {
              ...prev,
              timeLeft: 0,
              isActive: false,
              ...calculateResults(prev.questions, prev.config.questionCount, prev.timeLeft)
            };
          }
          return {
            ...prev,
            timeLeft: prev.timeLeft - 1
          };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [simulado?.isActive]);

  const handleStartSimulado = async () => {
    setLoadingQuestions(true);
    try {
      const headers: Record<string, string> = {};
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const res = await fetch(`/api/enem-questions?subject=${encodeURIComponent(config.subject)}&count=${config.questionCount}`, { headers });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro HTTP ${res.status}`);
      }

      const data = await res.json();
      const questions: SimuladoQuestion[] = (data.questions || []).map((q: any) => ({ ...q, userAnswer: undefined }));

      if (questions.length === 0) {
        alert('Nenhuma questão disponível para esta matéria.');
        return;
      }

      const totalDurationSeconds = questions.length * 3 * 60;

      setSimulado({
        config,
        questions,
        currentQuestionIndex: 0,
        timeLeft: totalDurationSeconds,
        isActive: true,
        dateStarted: new Date().toLocaleDateString('pt-BR')
      });
      setShowGabarito(false);
    } catch (err) {
      alert('Erro ao carregar questões. Tente novamente.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const calculateResults = (questionsList: SimuladoQuestion[], totalCount: number, timeLeft?: number) => {
    if (questionsList.length === 0) return { scorePercent: 0, averageTimeGasp: 0 };
    
    const corrects = questionsList.filter(q => q.userAnswer === q.correctAnswer).length;
    const scorePercent = Math.round((corrects / questionsList.length) * 100);
    
    // Average time spent
    const totalTimeAllowed = questionsList.length * 3 * 60;
    const remainingTime = timeLeft ?? simulado?.timeLeft ?? 0;
    const totalTimeSpent = totalTimeAllowed - remainingTime;
    const averageTimeGasp = Math.round(totalTimeSpent / questionsList.length);

    return {
      scorePercent,
      averageTimeGasp
    };
  };

  const handleSelectAnswerInExam = (letter: 'A' | 'B' | 'C' | 'D' | 'E') => {
    if (!simulado) return;

    const updatedQuestions = [...simulado.questions];
    updatedQuestions[simulado.currentQuestionIndex].userAnswer = letter;

    setSimulado({
      ...simulado,
      questions: updatedQuestions
    });
  };

  const handleNextQuestion = () => {
    if (!simulado) return;
    if (simulado.currentQuestionIndex < simulado.questions.length - 1) {
      setSimulado({
        ...simulado,
        currentQuestionIndex: simulado.currentQuestionIndex + 1
      });
    }
  };

  const handlePrevQuestion = () => {
    if (!simulado) return;
    if (simulado.currentQuestionIndex > 0) {
      setSimulado({
        ...simulado,
        currentQuestionIndex: simulado.currentQuestionIndex - 1
      });
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
    
    const results = calculateResults(simulado.questions, simulado.config.questionCount, simulado.timeLeft);

    setSimulado({
      ...simulado,
      isActive: false,
      ...results
    });

    onSaveSimuladoResult(results.scorePercent, simulado.config.subject);
  };

  const handleConfirmCancelExam = () => {
    setShowCancelModal(false);
    setSimulado(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeQuestion = simulado?.questions[simulado.currentQuestionIndex];

  const handleToggleGabarito = () => {
    if (!showGabarito) {
      incrementRewardCounter('gabarito');
      if (shouldShowRewardAd('gabarito', 2)) {
        setShowRewardAd(true);
        return;
      }
    }
    setShowGabarito(!showGabarito);
  };

  return (
    <>
    <div id="simulados-wrapper" className="space-y-6 animate-fade-in" style={{ contentVisibility: 'auto' }}>
      
      {/* HUD Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Simulizados Cronometrados
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          Teste sua agilidade mental resolvendo blocos cronometrados de questões oficiais anteriores com gestão ativa de tempo.
        </p>
      </div>

      <AdPlaceholder slot="simulados-topo" format="banner" className="my-4" />

      {/* RENDER VIEW ACCORDING TO SIMULATED STAGE */}
      
      {/* STAGE A: SETUP SCREEN */}
      {!simulado && (
        <div className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-xl mx-auto space-y-6 animate-fade-in" id="setup-view">
          
          <div className="text-center space-y-1.5 pb-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100">Configurar Novo Simulado</h3>
            <p className="text-xs text-slate-450">Selecione a matéria principal e o tamanho do teste para iniciar o tempo</p>
          </div>

          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleStartSimulado(); }}>
            
            {/* Subject Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-750 dark:text-slate-200" htmlFor="sim-subject">Matéria do Teste</label>
              <select
                id="sim-subject"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-100"
                value={config.subject}
                onChange={(e) => setConfig({ ...config, subject: e.target.value as any })}
              >
                <option value="Matemática">Matemática e suas Tecnologias</option>
                <option value="Natureza">Ciências da Natureza e suas Tecnologias</option>
                <option value="Humanas">Ciências Humanas e suas Tecnologias</option>
                <option value="Linguagens">Linguagens, Códigos e suas Tecnologias</option>
                <option value="Geral">Simulado ENEM Geral (Todas as Áreas)</option>
              </select>
            </div>

            {/* Questions quantity selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-755 dark:text-slate-200">Quantidade de Questões</label>
              
              <div className="grid grid-cols-3 gap-2" id="question-count-selectors">
                {[3, 5, 10].map((num) => (
                  <button
                    key={num}
                    id={`btn-count-set-${num}`}
                    type="button"
                    onClick={() => setConfig({ ...config, questionCount: num })}
                    className={`py-2 text-center text-xs font-bold rounded-xl transition border cursor-pointer ${
                      config.questionCount === num
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100/40 font-bold'
                        : 'bg-white text-slate-700 border-slate-200 dark:bg-[#0f172a] dark:border-slate-800 dark:text-slate-350 hover:border-blue-400'
                    }`}
                  >
                    <span>{num} Questões</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated instructions disclaimer card */}
            <div className="p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-850 rounded-xl flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold">Regras de Simulado ApexEnem:</p>
                <ul className="list-disc pl-4 space-y-1 text-[#777587]">
                  <li>O tempo médio por questão do ENEM é de 3 minutos, então o cronômetro será proporcional.</li>
                  <li>Você pode avançar ou retroceder livremente pelas perguntas do HUD.</li>
                  <li>O resultado mostrará estatísticas detalhadas e gabarito ao final.</li>
                </ul>
              </div>
            </div>

            {/* Play Trigger */}
            <button
              id="btn-start-countdown-exam"
              type="submit"
              disabled={loadingQuestions}
              className="w-full py-3.5 bg-gradient-to-r from-[#21c55d] to-[#04a753] hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loadingQuestions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-white" />}
              <span>{loadingQuestions ? 'Carregando...' : 'Iniciar Prova Cronometrada'}</span>
            </button>

          </form>

        </div>
      )}

      {/* STAGE B: ACTIVE TEST IN-PROGRESS SCREEN */}
      {simulado && simulado.isActive && activeQuestion && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="active-exam-view">
          
          {/* Main Question HUD Section */}
          <div className="lg:col-span-8 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-sm">
            
            {/* Top dots navigation stack */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase font-bold">
                <span>RELAÇÃO DE QUESTÕES</span>
                <span>FOCO: {simulado.config.subject}</span>
              </div>
              
              {/* Question dots list */}
              <div className="flex flex-wrap gap-1.5" id="hud-nav-dots">
                {simulado.questions.map((q, idx) => {
                  const isCurrent = idx === simulado.currentQuestionIndex;
                  const isAnswered = !!q.userAnswer;
                  
                  let dotBg = 'bg-slate-100 text-slate-400 dark:bg-[#0f172a] dark:text-slate-650';
                  if (isCurrent) {
                    dotBg = 'bg-blue-600 text-white ring-2 ring-blue-500/20 scale-110';
                  } else if (isAnswered) {
                    dotBg = 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
                  }

                  return (
                    <button
                      key={q.id}
                      id={`dot-nav-question-${q.id}`}
                      type="button"
                      onClick={() => setSimulado({ ...simulado, currentQuestionIndex: idx })}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition flex items-center justify-center font-mono cursor-pointer ${dotBg}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Statement block */}
            <div className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 font-sans">
              <p className="whitespace-pre-wrap">{activeQuestion.statement}</p>
            </div>

            {/* Exam Alternatives Choices A-E */}
            <div className="grid grid-cols-1 gap-2.5 pt-2" id={`active-choices-panel-${activeQuestion.id}`}>
              {activeQuestion.options.map((opt) => {
                const isSelected = activeQuestion.userAnswer === opt.letter;
                
                return (
                  <button
                    key={opt.letter}
                    type="button"
                    onClick={() => handleSelectAnswerInExam(opt.letter)}
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
                    <span className="leading-relaxed mt-0.5">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom controls footer of active exam (Anterior, Proxima, Finalizar) */}
            <div className="flex justify-between items-center pt-5 border-t border-slate-200 dark:border-slate-800" id="hud-lower-navigation">
              <button
                id="btn-exam-prev"
                type="button"
                disabled={simulado.currentQuestionIndex === 0}
                onClick={handlePrevQuestion}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 hover:bg-slate-50 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>

              {simulado.currentQuestionIndex < simulado.questions.length - 1 ? (
                <button
                  id="btn-exam-next"
                  type="button"
                  onClick={handleNextQuestion}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-105 dark:bg-[#0f172a] dark:text-blue-400 text-blue-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <span>Próxima</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  id="btn-exam-finish"
                  type="button"
                  onClick={handleFinishExamClick}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
                >
                  <Flag className="h-4 w-4" />
                  <span>Finalizar Simulado</span>
                </button>
              )}
            </div>

          </div>

          {/* Right Chronometer Clock Section */}
          <div className="lg:col-span-4 space-y-4" id="timer-column">
            
            {/* Countdown box */}
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
              
              <div className="flex justify-center items-center gap-2 text-slate-400">
                <Clock className="h-5 w-5 animate-pulse text-blue-600" />
                <span className="text-[10px] uppercase tracking-wider font-mono font-extrabold font-bold">Cronômetro de Prova</span>
              </div>

              {/* Digital count text */}
              <div className="text-4xl lg:text-5xl font-mono font-extrabold text-[#1b1b24] dark:text-[#f3effc]">
                {formatTime(simulado.timeLeft)}
              </div>

              <p className="text-xs text-slate-450 px-2 leading-relaxed">
                Gerencie sua velocidade para concluir todas as {simulado.questions.length} perguntas antes que o tempo se esgote!
              </p>

              <button
                id="btn-exam-cancel"
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="w-full mt-2 py-2.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-500 border border-slate-200 dark:bg-[#0f172a] dark:border-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar Teste
              </button>
            </div>

          </div>

        </div>
      )}

      {/* STAGE C: FINAL RESULTS CARD */}
      {simulado && !simulado.isActive && (
        <div className="bg-white dark:bg-[#1e293b] max-w-2xl mx-auto rounded-3xl border border-slate-200 dark:border-slate-800/80 p-6 md:p-10 shadow-xl space-y-8 animate-fade-in" id="exam-results-card">
          
          {/* Top Score Banner */}
          <div className="text-center space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            
            <div className="inline-flex p-4 bg-blue-50 dark:bg-blue-950/45 text-blue-600 dark:text-emerald-400 rounded-full shadow">
              <Award className="h-10 w-10" />
            </div>

            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Simulado Concluído!</h2>
            <p className="text-xs text-slate-450 max-w-sm mx-auto leading-relaxed">
              Exame simulado em <b>{simulado.config.subject}</b> com {simulado.questions.length} questões. Aqui estão suas métricas adaptativas:
            </p>

            {/* Huge Percent Correct circular HUD */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-8 py-4">
              
              {/* Massive Score Percent Indicator */}
              <div className="bg-slate-50 dark:bg-[#0f172a] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center min-w-[170px]">
                <span className="text-4xl lg:text-5xl font-display font-black text-blue-600 dark:text-blue-400">
                  {simulado.scorePercent}%
                </span>
                <span className="text-xs text-slate-450 block mt-1 uppercase tracking-wider font-mono">Taxa de Acerto</span>
              </div>

              {/* Time Spents Indicator */}
              <div className="bg-slate-50 dark:bg-[#0f172a] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center min-w-[170px]">
                <span className="text-3xl lg:text-4xl font-mono font-black text-slate-700 dark:text-gray-300">
                  {simulado.averageTimeGasp}s
                </span>
                <span className="text-xs text-slate-450 block mt-2.5 uppercase tracking-wider font-mono">Tempo por Questão</span>
              </div>

            </div>
          </div>

          {/* Toggle show gabarito list */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">Revisão de Desvio (Gabarito)</h3>
              <button
                id="btn-toggle-review-gabarito"
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
                          {isCorrect ? 'Acertou ✓' : `Sua Resposta: ${q.userAnswer || 'Em branco'} | Correto: ${q.correctAnswer}`}
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed italic pr-4 select-all">
                        "{q.statement.substring(0, 160)}..."
                      </p>

                      <div className="bg-white dark:bg-[#0f172a] p-3.5 border border-slate-200 dark:border-slate-800 text-[11px] rounded-lg text-slate-650 dark:text-slate-350 leading-relaxed font-sans space-y-1.5">
                        <p className="font-bold flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-blue-600" />Resolução:</p>
                        <p>{q.explanation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reset button to setup list screen */}
          <div className="flex justify-center pt-2">
            <button
              id="btn-reset-exam-flow"
              type="button"
              onClick={() => setSimulado(null)}
              className="px-6 py-3 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 text-slate-500 hover:text-slate-800 dark:hover:text-white dark:border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Fazer Outro Simulado</span>
            </button>
          </div>

        </div>
      )}

      {/* 4. MODAL: CONFIRM FINISH EXAM */}
      {showFinishModal && simulado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" id="finish-exam-modal">
          <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl space-y-5 text-center">
            <div className="inline-flex p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-2xl">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Finalizar Simulado?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {(() => {
                  const unanswered = simulado.questions.filter(q => !q.userAnswer).length;
                  return unanswered > 0 
                    ? `Atenção: Você ainda possui ${unanswered} questão(ões) em branco! Deseja realmente concluir o simulado no estado atual?`
                    : 'Excelente! Todas as questões foram respondidas com garra acadêmica. Pronto para colher seu feedback detalhado?';
                })()}
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

      {/* 5. MODAL: CONFIRM CANCEL EXAM */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" id="cancel-exam-modal">
          <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full shadow-2xl space-y-5 text-center">
            <div className="inline-flex p-3.5 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-2xl">
              <X className="h-7 w-7 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Abandonar Simulado?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Atenção: Seu tempo e progresso nesta prova ativa em andamento serão completamente limpos e perdidos. Confirma o abandono?
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

      <AdPlaceholder slot="simulados-rodape" format="banner" className="mt-6" />

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
