/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Target, Sparkles, CheckCircle2, ChevronRight, ChevronLeft, Award } from 'lucide-react';
import type { StudySerie } from '../types';

interface OnboardingViewProps {
  currentUser: { name: string; email: string };
  onCompleted: (data: { serie: string; targetScore: number; hardSubjects: string[] }) => void;
}

export default function OnboardingView({ currentUser, onCompleted }: OnboardingViewProps) {
  const [step, setStep] = useState(1);
  const [serie, setSerie] = useState<StudySerie | null>(null);
  const [otherSerie, setOtherSerie] = useState('');
  const [targetScore, setTargetScore] = useState(750);
  const [hardSubjects, setHardSubjects] = useState<string[]>([]);

  const seriesOptions = [
    { value: '9_fundamental' as StudySerie, label: '9º Ano Fundamental', desc: 'Iniciando o foco cedo' },
    { value: '1_medio' as StudySerie, label: '1º Ano Médio', desc: 'Construindo as bases teóricas' },
    { value: '2_medio' as StudySerie, label: '2º Ano Médio', desc: 'Consolidando as competências' },
    { value: '3_medio' as StudySerie, label: '3º Ano Médio', desc: 'Ano decisivo de preparação' },
    { value: 'cursinho' as StudySerie, label: 'Cursinho / Pré-Vestibular', desc: 'Foco total nas revisões' },
    { value: 'outro' as StudySerie, label: 'Outro perfil acadêmico', desc: 'Ensino Superior / Concursos' },
  ];

  const subjectsOptions = [
    { name: 'Matemática', icon: '📐', desc: 'Álgebra, Geometria e Estatística', color: 'from-blue-500/20 to-blue-600/20 border-blue-200' },
    { name: 'Natureza', icon: '🧬', desc: 'Física, Química e Biologia', color: 'from-emerald-500/20 to-emerald-600/20 border-emerald-200' },
    { name: 'Humanas', icon: '⚖️', desc: 'História, Geografia, Filosofia e Sociologia', color: 'from-amber-500/20 to-amber-600/20 border-amber-200' },
    { name: 'Linguagens', icon: '✍️', desc: 'Português, Redação, Literatura e Línguas', color: 'from-pink-500/20 to-pink-600/20 border-pink-200' },
  ];

  const toggleSubject = (subjName: string) => {
    if (hardSubjects.includes(subjName)) {
      setHardSubjects(hardSubjects.filter((s) => s !== subjName));
    } else {
      setHardSubjects([...hardSubjects, subjName]);
    }
  };

  const getScoreContext = (score: number) => {
    if (score < 500) return { label: 'Acesso Geral', color: 'text-gray-500', desc: 'Nota suficiente para cursos menos concorridos e ProUni parcial.' };
    if (score < 650) return { label: 'Ampla Oportunidade', color: 'text-indigo-600 dark:text-indigo-400', desc: 'Nota competitiva para Pedagogia, Letras, História nas federais.' };
    if (score < 750) return { label: 'Alto Rendimento', color: 'text-purple-600 dark:text-purple-400', desc: 'Muito competitivo! Ótimo para Direito, Engenharias e Administração.' };
    if (score < 850) return { label: 'Elite ENEM', color: 'text-violet-600 dark:text-violet-400', desc: 'Padrão Federal excelente! Linha de corte para Medicina na maior parte das UFs.' };
    return { label: 'Gênio Apex Enem', color: 'text-emerald-600 dark:text-emerald-400', desc: 'Raridade acadêmica absoluta! Acesso garantido a qualquer curso e vaga no Brasil.' };
  };

  const handleNext = () => {
    if (step === 1 && !serie) {
      alert('Selecione uma série para prosseguir.');
      return;
    }
    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleFinish = () => {
    onCompleted({
      serie: serie || 'outro',
      targetScore,
      hardSubjects,
    });
  };

  const scoreCtx = getScoreContext(targetScore);

  return (
    <div id="onboarding-panel" className="min-h-screen bg-gradient-to-tr from-[#fcf8ff] to-[#eae6f4] dark:from-[#0a0814] dark:to-[#110e24] flex items-center justify-center p-4">
      
      <div className="w-full max-w-2xl bg-white dark:bg-dark-surface rounded-3xl border border-indigo-100/60 dark:border-indigo-950/40 shadow-2xl p-6 md:p-10 space-y-8 relative overflow-hidden">
        
        {/* Abstract vector glow shapes */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#c3c0ff] dark:bg-[#231f47] rounded-full blur-3xl opacity-30"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#928aff] dark:bg-[#712ae2] rounded-full blur-3xl opacity-20"></div>

        {/* Wizard Header Progress Bar */}
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#777587]">
              Passo {step} de 3
            </span>
            <span className="text-right text-xs font-semibold text-[#3525cd] dark:text-[#c3c0ff]">
              {step === 1 ? 'Série Escolar' : step === 2 ? 'Meta de Pontuação' : 'Desafios Teóricos'}
            </span>
          </div>
          {/* Progress track */}
          <div className="w-full bg-[#f0ecf9] dark:bg-[#0d0a21] h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#3525cd] to-[#712ae2] h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Wizard Sliding Step Renderers */}
        <div className="space-y-6 relative z-10" id={`step-container-${step}`}>
          
          {/* STEP 1: SERIES SELECTION */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex p-2.5 bg-indigo-50 dark:bg-dark-bg text-[#3525cd] dark:text-[#c3c0ff] rounded-2xl mb-1">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#1b1b24] dark:text-[#f3effc]">
                  Qual é a sua série ou ano de estudo atual?
                </h2>
                <p className="text-[#464555] dark:text-[#c7c4d8] text-sm">
                  Personalizaremos os feedbacks e o nível das questões com base no seu estágio escolar.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="series-grid">
                {seriesOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSerie(opt.value)}
                    className={`p-4 text-left rounded-2xl border transition-all flex items-start gap-3.5 group cursor-pointer ${
                      serie === opt.value
                        ? 'border-[#3525cd] bg-indigo-50/45 dark:border-[#c3c0ff] dark:bg-[#231f47]/50 ring-2 ring-[#3525cd]/15'
                        : 'border-indigo-50 bg-white hover:border-indigo-100 hover:bg-[#fcf8ff] dark:bg-dark-bg/40 dark:border-indigo-950/40 dark:hover:border-indigo-900/40 dark:hover:bg-dark-bg/60'
                    }`}
                  >
                    <div className={`mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center p-1 transition-all ${
                      serie === opt.value 
                        ? 'border-[#3525cd] bg-[#3525cd] text-white dark:border-[#c3c0ff] dark:bg-[#c3c0ff] dark:text-black' 
                        : 'border-[#777587] group-hover:border-[#3525cd]'
                    }`}>
                      {serie === opt.value && <div className="h-1.5 w-1.5 bg-white dark:bg-dark-bg rounded-full" />}
                    </div>
                    <div>
                      <p className="font-display font-semibold text-sm text-[#1b1b24] dark:text-[#f3effc]">
                        {opt.label}
                      </p>
                      <p className="text-xs text-[#777587] mt-0.5 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {serie === 'outro' && (
                <div className="pt-2 animate-slide-up">
                  <label className="text-xs font-semibold text-[#1b1b24] dark:text-[#f3effc]" htmlFor="other-serie-input">
                    Especifique (opcional)
                  </label>
                  <input
                    id="other-serie-input"
                    type="text"
                    className="w-full mt-1.5 px-4 py-2.5 bg-[#fcf8ff] dark:bg-dark-bg border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                    placeholder="Ex: Concurseiro com foco no ENEM"
                    value={otherSerie}
                    onChange={(e) => setOtherSerie(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: NOTA ALVO SLIDER */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex p-2.5 bg-indigo-50 dark:bg-dark-bg text-[#3525cd] dark:text-[#c3c0ff] rounded-2xl mb-1">
                  <Target className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#1b1b24] dark:text-[#f3effc]">
                  Qual é a sua nota-alvo ideal no ENEM?
                </h2>
                <p className="text-[#464555] dark:text-[#c7c4d8] text-sm">
                  Arraste o cursor para definir sua meta geral de média ou redação. Orientaremos seus treinos.
                </p>
              </div>

              {/* Slider Display Box */}
              <div className="bg-[#fcf8ff] dark:bg-dark-bg p-6 rounded-2xl border border-indigo-50 dark:border-indigo-950 text-center space-y-4">
                
                {/* Score Big Display */}
                <div>
                  <span className="text-5xl font-display font-extrabold tracking-tight text-[#3525cd] dark:text-[#c3c0ff]">
                    {targetScore}
                  </span>
                  <span className="text-[#777587] font-mono text-sm ml-1">/ 1000</span>
                </div>

                {/* Slider Input with unique id */}
                <div className="px-4">
                  <input
                    id="score-target-slider"
                    type="range"
                    min="400"
                    max="1000"
                    step="10"
                    className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-[#712ae2] dark:bg-indigo-950"
                    value={targetScore}
                    onChange={(e) => setTargetScore(parseInt(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] text-[#777587] font-mono mt-1">
                    <span>400</span>
                    <span>700 (Média)</span>
                    <span>1000 (Gabarito)</span>
                  </div>
                </div>

                {/* Score Commentary Dynamic Badge */}
                <div className="border-t border-indigo-50 dark:border-indigo-950/50 pt-4 space-y-1">
                  <div className={`px-2.5 py-1 text-xs font-bold font-display rounded-full inline-block bg-indigo-50 dark:bg-indigo-950/60 ${scoreCtx.color}`}>
                    🎯 Nível: {scoreCtx.label}
                  </div>
                  <p className="text-xs text-[#464555] dark:text-[#c7c4d8] px-4 pt-1 leading-relaxed">
                    {scoreCtx.desc}
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: SUBJECT STRUGGLES MULTI SELECT */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex p-2.5 bg-indigo-50 dark:bg-dark-bg text-[#3525cd] dark:text-[#c3c0ff] rounded-2xl mb-1">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#1b1b24] dark:text-[#f3effc]">
                  Quais as matérias você considera mais complexas?
                </h2>
                <p className="text-[#464555] dark:text-[#c7c4d8] text-sm">
                  Selecione uma ou mais matérias onde você sente maior dificuldade. Geraremos questões focadas nelas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="subjects-grid">
                {subjectsOptions.map((subj) => {
                  const isSelected = hardSubjects.includes(subj.name);
                  return (
                    <button
                      key={subj.name}
                      type="button"
                      onClick={() => toggleSubject(subj.name)}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all relative overflow-hidden group flex gap-3 ${
                        isSelected
                          ? `bg-indigo-50/45 dark:bg-[#231f47]/50 border-[#3525cd] dark:border-[#c3c0ff] ring-2 ring-[#3525cd]/15`
                          : 'bg-white border-indigo-50 hover:bg-[#fcf8ff] dark:bg-dark-bg/40 dark:border-indigo-950/40'
                      }`}
                    >
                      <span className="text-3xl select-none" role="img" aria-label={subj.name}>
                        {subj.icon}
                      </span>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <p className="font-display font-bold text-sm text-[#1b1b24] dark:text-[#f3effc]">
                            {subj.name}
                          </p>
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-[#3525cd] dark:text-[#c3c0ff]" />}
                        </div>
                        <p className="text-xs text-[#777587] leading-relaxed">
                          {subj.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 bg-amber-50/75 border border-amber-100 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:bg-indigo-950/40 dark:border-indigo-900/30 dark:text-indigo-200">
                <span>⚡</span>
                <p className="leading-relaxed">
                  Isso calibrará as <b>Questões Mágicas</b> geradas na aba específica, puxando conteúdos com maior relevância dessas áreas.
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Wizard Controls Footer */}
        <div className="flex justify-between items-center pt-6 border-t border-indigo-50 dark:border-indigo-950/70 relative z-10" id="onboarding-controls">
          {step > 1 ? (
            <button
              id="btn-onb-prev"
              type="button"
              onClick={handlePrev}
              className="px-5 py-2.5 border border-indigo-100 hover:bg-slate-50 dark:border-indigo-900/40 dark:hover:bg-dark-bg/30 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition text-[#777587] hover:text-[#1b1b24] dark:hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Voltar</span>
            </button>
          ) : (
            <div></div> // balance center spacing
          )}

          {step < 3 ? (
            <button
              id="btn-onb-next"
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-[#3525cd] hover:bg-indigo-750 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-md shadow-indigo-100 dark:shadow-none"
            >
              <span>Continuar</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              id="btn-onb-finish"
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 bg-gradient-to-r from-[#21c55d] to-[#04a753] hover:opacity-90 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-green-100 dark:shadow-none"
            >
              <Award className="h-4 w-4" />
              <span>Finalizar Onboarding</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
