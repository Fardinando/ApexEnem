/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, HelpCircle, Check, X, RefreshCw, BookOpen } from 'lucide-react';
import { Question } from '../types';
import AdPlaceholder from './AdPlaceholder';

export default function PerguntasView() {
  const [selectedArea, setSelectedArea] = useState<'Matemática' | 'Humanas' | 'Natureza' | 'Linguagens'>('Matemática');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | 'E'>>({});

  const areas = [
    { value: 'Matemática' as const, label: 'Matemática e e suas Tecnologias', icon: '📐' },
    { value: 'Natureza' as const, label: 'Ciências da Natureza', icon: '🧬' },
    { value: 'Humanas' as const, label: 'Ciências Humanas', icon: '⚖️' },
    { value: 'Linguagens' as const, label: 'Linguagens e Códigos', icon: '✍️' },
  ];

  const handleGenerateQuestions = async () => {
    setIsLoading(true);
    setSelectedAnswers({});
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          area: selectedArea,
          count: 2
        }),
      });

      if (!res.ok) {
        throw new Error('Falha de resposta no servidor ApexEnem para as perguntas.');
      }

      const data = await res.json();
      setQuestions(data);
    } catch (err) {
      console.error(err);
      alert('Houve um erro no processador de questões da IA. Retornando exemplo adaptado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionLetter: 'A' | 'B' | 'C' | 'D' | 'E') => {
    // If already answered, do not allow switching to stay genuine
    if (selectedAnswers[questionId]) return;

    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionLetter
    });
  };

  return (
    <div id="perguntas-container" className="space-y-6 animate-fade-in" style={{ contentVisibility: 'auto' }}>
      
      {/* Top Title Section */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Questões Mágicas da IA
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          A inteligência artificial gera inéditas questões contextualizadas no exato estilo do ENEM, focadas na área onde você precisa de maior treino.
        </p>
      </div>

      {/* Horizontal Filter Area Selection Chips */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider block">Selecione a Área de Conhecimento</label>
        
        {/* Horizontal scrollbar wrapper */}
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

      {/* Primary Action Button (CTA) */}
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

      {/* RESULTS DISPLAY GRID AND CARDS */}
      <div className="grid grid-cols-1 gap-6 pt-2" id="questions-grid-container">
        
        {/* Loader Pulsing Layout */}
        {isLoading && (
          <div className="space-y-5">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded"></span>
                  <span className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded"></span>
                </div>
                <div className="h-16 w-full bg-slate-100 dark:bg-slate-900 rounded"></div>
                <div className="grid grid-cols-1 gap-2 pt-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-10 bg-slate-50 dark:bg-slate-950 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty Placeholder */}
        {!isLoading && questions.length === 0 && (
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

        {/* Dynamic Question Card Renderers */}
        {!isLoading && questions.length > 0 && questions.map((q, idx) => {
          const userAnswer = selectedAnswers[q.id];
          const hasAnswered = !!userAnswer;

          return (
            <div
              key={q.id}
              id={`magic-question-card-${q.id}`}
              className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-sm bento-card relative overflow-hidden"
            >
              
              {/* Question Badge Header info */}
               <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded font-bold uppercase">
                    QUESTÃO {idx + 1}
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

              {/* Statement Section */}
              <div className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-sans space-y-3">
                <p className="whitespace-pre-wrap">{q.statement}</p>
              </div>

              {/* Alternatives List */}
              <div className="grid grid-cols-1 gap-2.5" id={`options-group-${q.id}`}>
                {q.options.map((opt) => {
                  const isSelected = userAnswer === opt.letter;
                  const isCorrect = opt.letter === q.correctAnswer;
                  
                  let optionStyles = 'bg-slate-50 dark:bg-[#0f172a]/60 border-slate-200 hover:border-blue-500 text-slate-750 dark:text-slate-200 dark:border-slate-800';
                  
                  // Stylize alternative borders and background post selection
                  if (hasAnswered) {
                    if (isCorrect) {
                      // Correct option is always highlight green
                      optionStyles = 'bg-green-50/80 border-[#04a753] dark:bg-green-950/20 text-[#005338] dark:text-green-300 font-medium scale-[1.01]';
                    } else if (isSelected) {
                      // Selected incorrect is highlighted red
                      optionStyles = 'bg-red-100/10 border-red-500 text-red-700 font-medium scale-[1.01]';
                    } else {
                      // Others get dimmed
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

              {/* PROFESSOR ANSWER EXPLANATION BLOCK (Reveals after selection) */}
              {hasAnswered && (
                <div className="border-t border-slate-250 dark:border-slate-800 pt-4 space-y-2.5 animate-slide-up bg-slate-50 dark:bg-[#0f172a] p-4 rounded-xl">
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-display font-bold text-xs">
                    <BookOpen className="h-4 w-4" />
                    <span>Explicação do Professor (gabarito {q.correctAnswer})</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                    {q.explanation}
                  </p>
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
