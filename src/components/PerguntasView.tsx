import React, { useState, useRef } from 'react';
import { Sparkles, HelpCircle, Check, X, RefreshCw, BookOpen, Bug, Send, ExternalLink } from 'lucide-react';
import type { Question } from '../types';
import AdPlaceholder from './AdPlaceholder';
import MathRenderer from './MathRenderer';
import LoadingOverlay from './LoadingOverlay';

interface PerguntasViewProps {
  onWrongAnswer?: (subject: string, source: 'simulado' | 'pergunta-ia' | 'redacao' | 'aula') => void;
  hardSubjects?: string[];
}

export default function PerguntasView({ onWrongAnswer, hardSubjects = [] }: PerguntasViewProps) {
  const [selectedArea, setSelectedArea] = useState<'Matemática' | 'Humanas' | 'Natureza' | 'Linguagens'>('Matemática');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | 'E'>>({});
  const [keySwitchMessage, setKeySwitchMessage] = useState<string | null>(null);
  const keySwitchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reportState, setReportState] = useState<{ questionId: string; feedback: string; sent: boolean } | null>(null);
  const [revealedQuestions, setRevealedQuestions] = useState(1);

  const APEX_GUARDIAN_URL = import.meta.env.VITE_APEXGUARDIAN_URL || 'https://apexguardian.onrender.com';

  const handleReportError = async (q: Question, userAnswer: string, feedback: string) => {
    try {
      const userId = 'anon_perguntas';
      const hashHex = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userId + q.id)).then(h => Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join(''));
      await fetch(`${APEX_GUARDIAN_URL}/webhook/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: `Erro na pergunta ${q.id} (${q.area || 'N/A'}): ${feedback}. Resposta do usuário: ${userAnswer}`,
          timestamp_frontend: Math.floor(Date.now() / 1000),
          user_id_anon: hashHex,
        }),
      });
      setReportState({ questionId: q.id, feedback, sent: true });
    } catch {
      setReportState({ questionId: q.id, feedback, sent: false });
    }
  };

  const areas = [
    { value: 'Matemática' as const, label: 'Matemática e e suas Tecnologias', icon: '📐' },
    { value: 'Natureza' as const, label: 'Ciências da Natureza', icon: '🧬' },
    { value: 'Humanas' as const, label: 'Ciências Humanas', icon: '⚖️' },
    { value: 'Linguagens' as const, label: 'Linguagens e Códigos', icon: '✍️' },
  ];

  const handleGenerateQuestions = async () => {
    setIsLoading(true);
    setError(null);
    setSelectedAnswers({});
    setQuestions([]);
    setKeySwitchMessage(null);
    setRevealedQuestions(1);

    const areaHardSubjects = hardSubjects.filter(s => {
      if (selectedArea === 'Matemática') return s === 'Matemática';
      if (selectedArea === 'Humanas') return s === 'Humanas';
      if (selectedArea === 'Natureza') return s === 'Natureza';
      if (selectedArea === 'Linguagens') return s === 'Linguagens';
      return false;
    });

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: selectedArea, count: 3, hardSubjects: areaHardSubjects }),
      });

      const data = await res.json();

      if (res.ok && Array.isArray(data) && data.length > 0) {
        setQuestions(data);
        setIsLoading(false);
        return;
      }

      setKeySwitchMessage(null);

      const errMsg = data?.error || `Erro ${res.status}: não foi possível gerar questões.`;

      if (data?.details?.length > 0) {
        const firstErr = data.details[0];
        if (firstErr.toLowerCase().includes('429') || firstErr.toLowerCase().includes('402') || firstErr.toLowerCase().includes('quota') || firstErr.toLowerCase().includes('saldo') || firstErr.toLowerCase().includes('timeout') || firstErr.toLowerCase().includes('abort')) {
          setKeySwitchMessage(firstErr);
          if (keySwitchTimeoutRef.current) clearTimeout(keySwitchTimeoutRef.current);
          keySwitchTimeoutRef.current = setTimeout(() => setKeySwitchMessage(null), 6000);
        }
        const detailLines = data.details.slice(0, 5).map((d: string) => `• ${d}`).join('\n');
        setError(`${errMsg}\n\n${detailLines}`);
      } else {
        setError(errMsg);
      }
    } catch (err: any) {
      setKeySwitchMessage('🔄 Falha de conexão com o servidor.');
      if (keySwitchTimeoutRef.current) clearTimeout(keySwitchTimeoutRef.current);
      keySwitchTimeoutRef.current = setTimeout(() => setKeySwitchMessage(null), 5000);
      setError(err?.message || 'Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionLetter: 'A' | 'B' | 'C' | 'D' | 'E') => {
    if (selectedAnswers[questionId]) return;

    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionLetter
    });

    const q = questions.find(q => q.id === questionId);
    if (q && optionLetter !== q.correctAnswer && onWrongAnswer) {
      onWrongAnswer(q.area, 'pergunta-ia');
    }
  };

  return (
    <div id="perguntas-container" className="space-y-6 animate-fade-in">

      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Questões Mágicas da IA
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          A inteligência artificial gera inéditas questões contextualizadas no exato estilo do ENEM, focadas na área onde você precisa de maior treino.
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider block">Selecione a Área de Conhecimento</label>

        <div className="flex gap-2 pb-1.5 overflow-x-auto w-full" id="area-chips-scroll">
          {areas.map((a) => {
            const isSelected = selectedArea === a.value;
            return (
              <button
                key={a.value}
                id={`chip-area-${a.value}`}
                type="button"
                onClick={() => setSelectedArea(a.value)}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-650 shadow-md shadow-blue-100 dark:shadow-none'
                    : 'bg-white text-slate-705 border-slate-200 dark:bg-[#1e293b] dark:border-slate-800 dark:text-slate-350 hover:border-blue-400'
                }`}
              >
                <span>{a.icon}</span>
                <span>{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AdPlaceholder slot="perguntas-topo" format="banner" className="my-4" />

      <div className="flex justify-start">
        <button
          id="btn-generate-magic-questions"
          type="button"
          disabled={isLoading}
          onClick={handleGenerateQuestions}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2.5 shadow-md shadow-blue-100 dark:shadow-none cursor-pointer"
        >
          {isLoading ? (
            <RefreshCw className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <Sparkles className="h-4.5 w-4.5 fill-white" />
          )}
          <span>{isLoading ? 'Conjurando Questões Sob Medida...' : 'Gerar Questões Mágicas com IA'}</span>
        </button>
      </div>

      <AdPlaceholder slot="perguntas-meio" format="banner" className="my-4" />

      <div className="grid grid-cols-1 gap-6 pt-2" id="questions-grid-container">

        <LoadingOverlay isVisible={isLoading} keySwitchMessage={keySwitchMessage} />

        {!isLoading && error && (
          <div className="bg-red-50/80 dark:bg-red-950/20 rounded-3xl border-2 border-red-300 dark:border-red-800 py-10 px-6 text-center space-y-3 flex flex-col items-center">
            <X className="h-8 w-8 text-red-500" />
            <h3 className="font-display font-extrabold text-red-700 dark:text-red-400 text-sm md:text-base">Erro ao gerar questões</h3>
            <p className="text-xs text-red-600 dark:text-red-300 max-w-md leading-relaxed">{error}</p>
          </div>
        )}

        {!isLoading && !error && questions.length === 0 && (
          <div className="bg-slate-50/50 dark:bg-[#1e293b]/60 rounded-3xl border-2 border-dashed border-slate-250 dark:border-slate-800 py-16 text-center space-y-4 flex flex-col items-center justify-center">
            <div className="p-3.5 bg-slate-100 dark:bg-[#0f172a] text-[#777587] rounded-full">
              <HelpCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-display font-extrabold text-slate-850 dark:text-slate-100 text-sm md:text-base">Nenhum treino iniciado</h3>
            <p className="text-xs text-slate-450 max-w-xs leading-relaxed">
              Escolha a área acima e clique em <b>Gerar Questões Mágicas</b> para que o motor de correlação da IA estruture um conjunto de perguntas ENEM personalizadas para você.
            </p>
          </div>
        )}

        {!isLoading && questions.length > 0 && questions.slice(0, revealedQuestions).map((q, idx) => {
          const userAnswer = selectedAnswers[q.id];
          const hasAnswered = !!userAnswer;
          const isLastRevealed = idx === revealedQuestions - 1;

          return (
            <div
              key={q.id}
              id={`magic-question-card-${q.id}`}
              className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-sm bento-card relative overflow-hidden"
            >

              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded font-bold uppercase">
                    QUESTÃO {idx + 1} de {questions.length}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 rounded font-semibold">
                    {q.area}
                  </span>
                </div>

                {hasAnswered && (
                  <div className={`text-xs font-bold font-display ${userAnswer === q.correctAnswer ? 'text-[#04a753]' : 'text-red-600'}`}>
                    {userAnswer === q.correctAnswer ? 'Gabaritou! ✓' : 'Errou! ✗'}
                  </div>
                )}
              </div>

              <div className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-sans space-y-3">
                <p className="whitespace-pre-wrap"><MathRenderer text={q.statement} /></p>
              </div>

              <div className="grid grid-cols-1 gap-2.5" id={`options-group-${q.id}`}>
                {q.options.map((opt) => {
                  const isSelected = userAnswer === opt.letter;
                  const isCorrect = opt.letter === q.correctAnswer;

                  let optionStyles = 'bg-slate-50 dark:bg-[#0f172a]/60 border-slate-200 hover:border-blue-500 text-slate-750 dark:text-slate-200 dark:border-slate-800';

                  if (hasAnswered) {
                    if (isCorrect) {
                      optionStyles = 'bg-green-50/80 border-[#04a753] dark:bg-green-950/20 text-[#005338] dark:text-green-300 font-medium scale-[1.01]';
                    } else if (isSelected) {
                      optionStyles = 'bg-red-100/10 border-red-500 text-red-700 font-medium scale-[1.01]';
                    } else {
                      optionStyles = 'bg-[#fcf8ff]/30 border-slate-100 text-slate-400 opacity-60 pointer-events-none dark:bg-transparent dark:border-slate-800/20';
                    }
                  }

                  return (
                    <button
                      key={opt.letter}
                      type="button"
                      disabled={hasAnswered}
                      onClick={() => handleSelectOption(q.id, opt.letter)}
                      className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-start gap-3 cursor-pointer ${optionStyles}`}
                    >
                      <span className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 ${
                        hasAnswered
                          ? isCorrect
                            ? 'bg-green-600 text-white'
                            : isSelected
                              ? 'bg-red-500 text-white'
                              : 'bg-slate-200 text-slate-500'
                          : 'bg-slate-100 dark:bg-[#0f172a] text-slate-700 dark:text-slate-350 hover:bg-blue-600 hover:text-white transition'
                      }`}>
                        {opt.letter}
                      </span>
                      <span className="leading-relaxed mt-0.5">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {hasAnswered && (
                <div className="border-t border-slate-250 dark:border-slate-800 pt-4 space-y-2.5 animate-slide-up bg-slate-50 dark:bg-[#0f172a] p-4 rounded-xl">
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-display font-bold text-xs">
                    <BookOpen className="h-4 w-4" />
                    <span>Explicação do Professor (gabarito {q.correctAnswer})</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                    {q.explanation}
                  </p>

                  {/* Botão próxima questão (só na última revelada, se houver mais) */}
                  {isLastRevealed && revealedQuestions < questions.length && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setRevealedQuestions(prev => prev + 1)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Próxima Questão →
                      </button>
                    </div>
                  )}

                  {/* Progresso */}
                  {isLastRevealed && (
                    <div className="flex justify-center gap-1.5 pt-1">
                      {Array.from({ length: questions.length }).map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i <= idx ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      ))}
                    </div>
                  )}

                  {APEX_GUARDIAN_URL && reportState?.questionId !== q.id && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setReportState({ questionId: q.id, feedback: '', sent: false })}
                        className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-amber-500 transition cursor-pointer"
                      >
                        <Bug className="h-3 w-3" />
                        Reportar erro na questão
                      </button>
                    </div>
                  )}
                  {APEX_GUARDIAN_URL && reportState?.questionId === q.id && !reportState.sent && (
                    <div className="pt-2 space-y-2 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] text-slate-400">Descreva o erro encontrado:</p>
                      <textarea
                        value={reportState.feedback}
                        onChange={(e) => setReportState({ ...reportState, feedback: e.target.value })}
                        placeholder="Ex: O enunciado está confuso, a alternativa X parece incorreta, etc."
                        className="w-full text-[10px] p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 resize-none h-16 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleReportError(q, userAnswer, reportState.feedback)}
                          disabled={!reportState.feedback.trim()}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[10px] font-semibold rounded-lg transition cursor-pointer"
                        >
                          <Send className="h-3 w-3" /> Enviar Reporte
                        </button>
                        <button
                          type="button"
                          onClick={() => setReportState(null)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 transition cursor-pointer px-2"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                  {APEX_GUARDIAN_URL && reportState?.questionId === q.id && reportState.sent && (
                    <div className="pt-2 text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1 border-t border-slate-200 dark:border-slate-700">
                      <Check className="h-3 w-3" /> Reporte enviado com sucesso!
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}

      </div>

      <AdPlaceholder slot="perguntas-rodape" format="banner" className="mt-6" />

    </div>
  );
}
