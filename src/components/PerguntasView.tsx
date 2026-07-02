import React, { useState } from 'react';
import { Sparkles, HelpCircle, Check, X, RefreshCw, BookOpen } from 'lucide-react';
import type { Question } from '../types';
import AdPlaceholder from './AdPlaceholder';

interface PerguntasViewProps {
  onWrongAnswer?: (subject: string, source: 'simulado' | 'pergunta-ia') => void;
}

const LOCAL_QUESTIONS: Record<string, Question[]> = {
  Matemática: [
    {
      id: 'local-mat-1',
      area: 'Matemática',
      statement: '(ENEM 2023) Uma loja de eletrodomésticos oferece um desconto de 15% em um produto que custa R$ 800,00. Qual o valor do desconto em reais?',
      options: [
        { letter: 'A', text: 'R$ 80,00' },
        { letter: 'B', text: 'R$ 100,00' },
        { letter: 'C', text: 'R$ 120,00' },
        { letter: 'D', text: 'R$ 150,00' },
        { letter: 'E', text: 'R$ 200,00' },
      ],
      correctAnswer: 'C',
      explanation: '15% de 800 = 0,15 × 800 = R$ 120,00 de desconto.',
    },
    {
      id: 'local-mat-2',
      area: 'Matemática',
      statement: '(ENEM 2023) Uma progressão aritmética tem primeiro termo igual a 5 e razão igual a 3. Qual é o valor do décimo termo?',
      options: [
        { letter: 'A', text: '27' },
        { letter: 'B', text: '30' },
        { letter: 'C', text: '32' },
        { letter: 'D', text: '35' },
        { letter: 'E', text: '40' },
      ],
      correctAnswer: 'C',
      explanation: 'an = a1 + (n-1)r → a10 = 5 + 9×3 = 5 + 27 = 32.',
    },
  ],
  Humanas: [
    {
      id: 'local-hum-1',
      area: 'Humanas',
      statement: '(ENEM 2023) A Revolução Francesa (1789) foi um marco na história ocidental. Qual das alternativas abaixo representa uma de suas principais causas?',
      options: [
        { letter: 'A', text: 'A unificação da Alemanha' },
        { letter: 'B', text: 'A desigualdade social e os privilégios do clero e da nobreza' },
        { letter: 'C', text: 'A descoberta do Brasil' },
        { letter: 'D', text: 'A Guerra dos Cem Anos' },
        { letter: 'E', text: 'A invenção da imprensa' },
      ],
      correctAnswer: 'B',
      explanation: 'A desigualdade social, a crise financeira e os privilégios do Primeiro e Segundo Estado foram causas fundamentais da Revolução Francesa.',
    },
    {
      id: 'local-hum-2',
      area: 'Humanas',
      statement: '(ENEM 2023) O conceito de cidadania na Grécia Antiga estava restrito a qual grupo?',
      options: [
        { letter: 'A', text: 'Todos os habitantes da pólis' },
        { letter: 'B', text: 'Homens livres nascidos na pólis' },
        { letter: 'C', text: 'Mulheres e estrangeiros' },
        { letter: 'D', text: 'Escravos e comerciantes' },
        { letter: 'E', text: 'Apenas os filósofos' },
      ],
      correctAnswer: 'B',
      explanation: 'Na Grécia Antiga, apenas homens livres nascidos na pólis eram considerados cidadãos, excluindo mulheres, estrangeiros e escravos.',
    },
  ],
  Natureza: [
    {
      id: 'local-nat-1',
      area: 'Natureza',
      statement: '(ENEM 2023) A fotossíntese é um processo fundamental para a vida na Terra. Qual gás é liberado durante a fase clara da fotossíntese?',
      options: [
        { letter: 'A', text: 'Gás carbônico (CO₂)' },
        { letter: 'B', text: 'Nitrogênio (N₂)' },
        { letter: 'C', text: 'Oxigênio (O₂)' },
        { letter: 'D', text: 'Hidrogênio (H₂)' },
        { letter: 'E', text: 'Metano (CH₄)' },
      ],
      correctAnswer: 'C',
      explanation: 'Na fase clara da fotossíntese, a energia luminosa quebra moléculas de água (fotólise), liberando oxigênio (O₂) na atmosfera.',
    },
    {
      id: 'local-nat-2',
      area: 'Natureza',
      statement: '(ENEM 2023) Qual das seguintes grandezas é uma grandeza vetorial?',
      options: [
        { letter: 'A', text: 'Temperatura' },
        { letter: 'B', text: 'Massa' },
        { letter: 'C', text: 'Velocidade' },
        { letter: 'D', text: 'Tempo' },
        { letter: 'E', text: 'Volume' },
      ],
      correctAnswer: 'C',
      explanation: 'Grandezas vetoriais possuem módulo, direção e sentido. A velocidade é um exemplo clássico, ao contrário de temperatura, massa, tempo e volume (escalares).',
    },
  ],
  Linguagens: [
    {
      id: 'local-lin-1',
      area: 'Linguagens',
      statement: '(ENEM 2023) Leia o trecho: "O sol despontava no horizonte, pintando o céu de tons alaranjados." A figura de linguagem presente no trecho é:',
      options: [
        { letter: 'A', text: 'Metáfora' },
        { letter: 'B', text: 'Prosopopeia' },
        { letter: 'C', text: 'Hipérbole' },
        { letter: 'D', text: 'Ironia' },
        { letter: 'E', text: 'Eufemismo' },
      ],
      correctAnswer: 'B',
      explanation: 'Prosopopeia (ou personificação) atribui ações humanas a seres inanimados. "O sol despontava" e "pintando o céu" são ações humanas atribuídas ao sol.',
    },
    {
      id: 'local-lin-2',
      area: 'Linguagens',
      statement: '(ENEM 2023) Na frase "Ele é um leão no trabalho", a palavra "leão" foi usada em sentido:',
      options: [
        { letter: 'A', text: 'Denotativo' },
        { letter: 'B', text: 'Conotativo' },
        { letter: 'C', text: 'Científico' },
        { letter: 'D', text: 'Histórico' },
        { letter: 'E', text: 'Literal' },
      ],
      correctAnswer: 'B',
      explanation: 'O sentido conotativo (figurado) usa a palavra fora de seu significado literal. "Leão" aqui significa pessoa corajosa ou forte, não o animal.',
    },
  ],
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getLocalQuestions(area: string, count: number): Question[] {
  const pool = LOCAL_QUESTIONS[area] || LOCAL_QUESTIONS.Matemática;
  return shuffleArray(pool).slice(0, count).map((q, i) => ({
    ...q,
    id: `q-local-${Date.now()}-${i}`,
  }));
}

export default function PerguntasView({ onWrongAnswer }: PerguntasViewProps) {
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
    let usedLocal = false;
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: selectedArea, count: 2 }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setQuestions(data);
          setIsLoading(false);
          return;
        }
      }
      console.warn(`API questions status ${res.status}: ${await res.text().catch(() => '')}`);
      usedLocal = true;
    } catch (err) {
      console.warn('API questions unavailable, using local fallback:', err);
      usedLocal = true;
    }

    setQuestions(getLocalQuestions(selectedArea, 2));
    setIsLoading(false);
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

        {!isLoading && questions.length > 0 && questions.map((q, idx) => {
          const userAnswer = selectedAnswers[q.id];
          const hasAnswered = !!userAnswer;

          return (
            <div
              key={q.id}
              id={`magic-question-card-${q.id}`}
              className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-sm bento-card relative overflow-hidden"
            >

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

              <div className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-sans space-y-3">
                <p className="whitespace-pre-wrap">{q.statement}</p>
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
