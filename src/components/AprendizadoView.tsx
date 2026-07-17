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
} from 'lucide-react';
import MathRenderer from './MathRenderer';
import { motion, AnimatePresence } from 'motion/react';
import type {
  LearningChapter,
  Exercise,
  EssayCorrection,
  UserProfile,
  WrongAnswer,
} from '../types';
import { INITIAL_CHAPTERS, CHAPTER_EXERCISES } from '../data/learning-exercises';
import { saveLearningProgress, fetchLearningProgress } from '../lib/supabase';
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

interface PlaceholderQuestion {
  id: string;
  area: string;
  statement: string;
  options: { letter: string; text: string }[];
  correctLetter: string;
  explanation: string;
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

function generatePlaceholderQuestions(
  area: string,
  count: number
): PlaceholderQuestion[] {
  const allQuestions: PlaceholderQuestion[] = [
    {
      id: 'p-mat-1',
      area: 'Matemática',
      statement:
        'Qual é o resultado da equação 2x + 5 = 15? Qual é o valor de x?',
      options: [
        { letter: 'A', text: 'x = 5' },
        { letter: 'B', text: 'x = 10' },
        { letter: 'C', text: 'x = 3' },
        { letter: 'D', text: 'x = 7' },
        { letter: 'E', text: 'x = 2' },
      ],
      correctLetter: 'A',
      explanation:
        'Isolando x: 2x = 15 - 5 = 10, logo x = 5. Equação linear simples!',
    },
    {
      id: 'p-mat-2',
      area: 'Matemática',
      statement:
        'Em uma progressão aritmética, o primeiro termo é 3 e a razão é 4. Qual é o 5º termo?',
      options: [
        { letter: 'A', text: '19' },
        { letter: 'B', text: '23' },
        { letter: 'C', text: '15' },
        { letter: 'D', text: '27' },
        { letter: 'E', text: '21' },
      ],
      correctLetter: 'A',
      explanation:
        'O termo geral é a_n = a₁ + (n-1)r = 3 + 4×4 = 3 + 16 = 19.',
    },
    {
      id: 'p-hum-1',
      area: 'Humanas',
      statement:
        'A Proclamação da República no Brasil ocorreu em qual ano?',
      options: [
        { letter: 'A', text: '1889' },
        { letter: 'B', text: '1822' },
        { letter: 'C', text: '1500' },
        { letter: 'D', text: '1930' },
        { letter: 'E', text: '1888' },
      ],
      correctLetter: 'A',
      explanation:
        'A Proclamação da República foi em 15 de novembro de 1889, liderada pelo Marechal Deodoro da Fonseca.',
    },
    {
      id: 'p-hum-2',
      area: 'Humanas',
      statement:
        'Qual é a principal característica do sistema econômico capitalista?',
      options: [
        {
          letter: 'A',
          text: 'Propriedade privada dos meios de produção',
        },
        { letter: 'B', text: 'Propriedade coletiva da terra' },
        { letter: 'C', text: 'Alocação centralizada do governo' },
        { letter: 'D', text: 'Troca por escambo' },
        { letter: 'E', text: 'Produção artesanal' },
      ],
      correctLetter: 'A',
      explanation:
        'No capitalismo, os meios de produção são de propriedade privada, regidos pela oferta e demanda.',
    },
    {
      id: 'p-nat-1',
      area: 'Natureza',
      statement:
        'Qual organela celular é responsável pela respiração celular?',
      options: [
        { letter: 'A', text: 'Mitocôndria' },
        { letter: 'B', text: 'Ribossomo' },
        { letter: 'C', text: 'Lisossomo' },
        { letter: 'D', text: 'Complexo de Golgi' },
        { letter: 'E', text: 'Retículo endoplasmático' },
      ],
      correctLetter: 'A',
      explanation:
        'A mitocôndria é a "usina de energia" da célula, onde ocorre a fosforilação oxidativa e produção de ATP.',
    },
    {
      id: 'p-nat-2',
      area: 'Natureza',
      statement:
        'Na tabela periódica, qual elemento químico possui o símbolo "Fe"?',
      options: [
        { letter: 'A', text: 'Ferro' },
        { letter: 'B', text: 'Flúor' },
        { letter: 'C', text: 'Fósforo' },
        { letter: 'D', text: 'Fermium' },
        { letter: 'E', text: 'Francium' },
      ],
      correctLetter: 'A',
      explanation:
        'Fe vem do latim "Ferrum". O ferro é essencial para a hemoglobina e transporte de oxigênio no sangue.',
    },
    {
      id: 'p-ling-1',
      area: 'Linguagens',
      statement:
        'Na frase "Os livros que comprei ontem são interessantes", qual é o sujeito?',
      options: [
        { letter: 'A', text: 'Os livros' },
        { letter: 'B', text: 'Que comprei ontem' },
        { letter: 'C', text: 'Eu' },
        { letter: 'D', text: 'São interessantes' },
        { letter: 'E', text: 'Ontem' },
      ],
      correctLetter: 'A',
      explanation:
        'O sujeito da oração principal é "Os livros". "Que comprei ontem" é oração subordinada adjetiva restritiva.',
    },
    {
      id: 'p-ling-2',
      area: 'Linguagens',
      statement:
        'Em Machado de Assis, qual obra é considerada a obra-prima do realismo brasileiro?',
      options: [
        { letter: 'A', text: 'Dom Casmurro' },
        { letter: 'B', text: 'Memórias Póstumas de Brás Cubas' },
        { letter: 'C', text: 'O Alquimista' },
        { letter: 'D', text: 'Quincas Borba' },
        { letter: 'E', text: 'A Carta' },
      ],
      correctLetter: 'B',
      explanation:
        'Memórias Póstumas de Brás Cubas (1881) é considerado a obra-prima de Machado e marco do realismo brasileiro.',
    },
    {
      id: 'p-red-1',
      area: 'Redação',
      statement:
        'Qual é a primeira competência avaliada na redação do ENEM?',
      options: [
        {
          letter: 'A',
          text: 'Demonstrar domínio da norma culta da língua portuguesa',
        },
        {
          letter: 'B',
          text: 'Compreender a proposta e aplicar conceitos de várias áreas',
        },
        {
          letter: 'C',
          text: 'Selecionar, relacionar, organizar e interpretar informações',
        },
        {
          letter: 'D',
          text: 'Demonstrar conhecimento dos mecanismos linguísticos de argumentação',
        },
        {
          letter: 'E',
          text: 'Elaborar proposta de intervenção detalhada',
        },
      ],
      correctLetter: 'A',
      explanation:
        'A Competência 1 do ENEM avalia o domínio da norma culta, incluindo gramática, ortografia e coesão.',
    },
    {
      id: 'p-red-2',
      area: 'Redação',
      statement:
        'Uma boa redação nota 1000 no ENEM deve ter no mínimo:',
      options: [
        {
          letter: 'A',
          text: '30 linhas escritas com texto dissertativo-argumentativo',
        },
        { letter: 'B', text: '10 linhas com texto narrativo' },
        {
          letter: 'C',
          text: '5 linhas com uma lista de argumentos',
        },
        { letter: 'D', text: 'Apenas a proposta de intervenção' },
        {
          letter: 'E',
          text: 'Não existe mínimo de linhas',
        },
      ],
      correctLetter: 'A',
      explanation:
        'O ENEM exige no mínimo 30 linhas de texto dissertativo-argumentativo com proposta de intervenção.',
    },
    {
      id: 'p-rec-1',
      area: 'Recomendado',
      statement:
        'Em estatística, qual medida de tendência central é mais afetada por valores extremos?',
      options: [
        { letter: 'A', text: 'Média aritmética' },
        { letter: 'B', text: 'Mediana' },
        { letter: 'C', text: 'Moda' },
        { letter: 'D', text: 'Variância' },
        { letter: 'E', text: 'Desvio padrão' },
      ],
      correctLetter: 'A',
      explanation:
        'A média aritmética é sensível a outliers (valores extremos), enquanto a mediana é mais robusta.',
    },
    {
      id: 'p-rec-2',
      area: 'Recomendado',
      statement:
        'Qual é a principal função da literatura de acordo com o ENEM?',
      options: [
        {
          letter: 'A',
          text: 'Refletir sobre a condição humana e a sociedade',
        },
        { letter: 'B', text: 'Apenas entreter o leitor' },
        { letter: 'C', text: 'Descrever fatos históricos' },
        {
          letter: 'D',
          text: 'Ensinhar regras gramaticais',
        },
        {
          letter: 'E',
          text: 'Promover um único ponto de vista',
        },
      ],
      correctLetter: 'A',
      explanation:
        'A literatura no ENEM é vista como ferramenta de reflexão crítica sobre a humanidade e seus contextos sociais.',
    },
  ];

  const filtered =
    area === 'Recomendado'
      ? allQuestions
      : allQuestions.filter(q => q.area === area);

  const pool = filtered.length > 0 ? filtered : allQuestions;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

const CABRITO_LESSON_CONTENT: Record<
  string,
  { title: string; content: string[]; tips: string[] }
> = {
  Redação: {
    title: 'Estrutura da Redação Nota 1000',
    content: [
      'A redação do ENEM é avaliada em 5 competências, cada uma valendo até 200 pontos.',
      'Competência 1: Domínio da norma culta — gramática impecável, coesão e sem erros grosseiros.',
      'Competência 2: Compreensão da proposta — ler o texto motivador e aplicar conceitos de várias áreas.',
      'Competência 3: Seleção de informações — organize argumentos de forma lógica e relevante.',
      'Competência 4: Conhecimento dos mecanismos linguísticos — use conectivos e organize parágrafos.',
      'Competência 5: Proposta de intervenção — detalhe quem, o quê, como, onde e quando.',
    ],
    tips: [
      'Comece com uma introdução que contextualize o tema.',
      'Desenvolva pelo menos 2 argumentos consistentes.',
      'Sempre inclua a proposta de intervenção detalhada.',
      'Revise erros de português antes de entregar.',
    ],
  },
  Linguagens: {
    title: 'Linguagens e Códigos — O que Cobrar',
    content: [
      'Português: gramática, interpretação de texto, gêneros textuais.',
      'Literatura: movimentos literários, autores clássicos e contemporâneos.',
      'Língua Estrangeira: inglês e espanhol (básico a intermediário).',
      'Artes: expressões artísticas, cinema, história da arte.',
      'Educação Física: esporte e sociedade, saúde, legislação esportiva.',
    ],
    tips: [
      'Pratique interpretação de textos variados (crônicas, poesias, textos argumentativos).',
      'Estude os principais movimentos literários brasileiros.',
      'Revise regras gramaticais: concordância, regência e pontuação.',
    ],
  },
  Humanas: {
    title: 'Ciências Humanas — Mapa do Conhecimento',
    content: [
      'História: Brasil Colonial, Independência, República, Era Vargas, Ditadura e Redemocratização.',
      'Geografia: geopolítica, urbanização, globalização, questões ambientais.',
      'Filosofia: pensadores clássicos, ética, política, conhecimento.',
      'Sociologia:_classes sociais, movimentos sociais, educação, trabalho.',
    ],
    tips: [
      'Associe eventos históricos a suas causas e consequências.',
      'Pratique a leitura de mapas e gráficos geográficos.',
      'Estude os principais filósofos e suas ideias centrais.',
    ],
  },
  Natureza: {
    title: 'Ciências da Natureza — Essenciais',
    content: [
      'Biologia: genética, ecologia, citologia, evolução, biotecnologia.',
      'Química: ligações químicas, estequiometria, orgânica, eletroquímica.',
      'Física: mecânica, óptica, eletricidade, termodinâmica.',
    ],
    tips: [
      'Resolva muitos exercícios de cálculo para Física e Química.',
      'Decorar fórmulas é importante, mas saber aplicá-las é essencial.',
      'Estude os ciclos biogeoquímicos e questões ambientais.',
    ],
  },
  Matemática: {
    title: 'Matemática — Domine os Tópicos',
    content: [
      'Álgebra: equações, inequações, sistemas lineares, funções.',
      'Geometria: plana, espacial, analítica, trigonometria.',
      'Análise combinatória: permutação,Arranjo, Combinação.',
      'Estatística e Probabilidade: média, mediana, desvio padrão.',
      'Funções: progressões aritméticas e geométricas.',
    ],
    tips: [
      'Resolva provas anteriores do ENEM para treinar.',
      'Aprenda a interpretar gráficos e tabelas rapidamente.',
      'Domine as operações com conjuntos e lógica.',
    ],
  },
  Recomendado: {
    title: 'Revisão Personalizada',
    content: [
      'Analisamos seus erros e pontos fracos para criar um plano focado.',
      'Revise os temas onde você mais errou nas questões anteriores.',
      'Pratique diariamente para consolidar o aprendizado.',
      'Use o método de repetição espaçada para fixar o conteúdo.',
    ],
    tips: [
      'Não pule etapas — volte aos fundamentos se necessário.',
      'Grupos de estudo ajudam a fixar conceitos.',
      'Use resumos e mapas mentais para revisar.',
    ],
  },
};

export default function AprendizadoView({
  essayCorrections,
  simuladosHistory,
  currentUser,
  accessToken,
  wrongAnswers,
}: AprendizadoViewProps) {
  const [mainTab, setMainTab] = useState<MainTab>('cursinho');
  const [viewMode, setViewMode] = useState<ViewMode>('categories');

  const [activeCategory, setActiveCategory] = useState<CategoryCard | null>(
    null
  );
  const [lessonStep, setLessonStep] = useState(0);

  const [questoesArea, setQuestoesArea] = useState<string>('');
  const [questoesList, setQuestoesList] = useState<PlaceholderQuestion[]>([]);
  const [questaoIdx, setQuestaoIdx] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [questaoHearts, setQuestaoHearts] = useState(5);
  const [questaoXp, setQuestaoXp] = useState(0);
  const [questaoCompleted, setQuestaoCompleted] = useState(false);
  const [questaoCorrectCount, setQuestaoCorrectCount] = useState(0);

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
  const [lessonCompleted, setLessonCompleted] = useState(false);
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

  const handleAdGateContinue = useCallback(() => {
    setShowAdGate(false);
    if (adGateTarget === 'cursinho' && activeCategory) {
      setViewMode('lesson');
      setLessonStep(0);
    } else if (adGateTarget === 'questoes' && questoesArea) {
      const questions = generatePlaceholderQuestions(questoesArea, 5);
      setQuestoesList(questions);
      setQuestaoIdx(0);
      setSelectedLetter(null);
      setHasChecked(false);
      setQuestaoHearts(5);
      setQuestaoXp(0);
      setQuestaoCorrectCount(0);
      setQuestaoCompleted(false);
      setViewMode('questoes-play');
    }
    setAdGateTarget(null);
  }, [adGateTarget, activeCategory, questoesArea]);

  const handleStartCursinhoCategory = (cat: CategoryCard) => {
    setActiveCategory(cat);
    if (cat.area === 'Recomendado' && wrongAnswers && wrongAnswers.length < 3) {
      return;
    }
    if (shouldShowRewardAd('cursinho-lesson', 2)) {
      setAdGateTarget('cursinho');
      setShowAdGate(true);
      return;
    }
    setViewMode('lesson');
    setLessonStep(0);
  };

  const handleStartQuestoes = (area: string) => {
    setQuestoesArea(area);
    if (shouldShowRewardAd('questoes-session', 2)) {
      setAdGateTarget('questoes');
      setShowAdGate(true);
      return;
    }
    const questions = generatePlaceholderQuestions(area, 5);
    setQuestoesList(questions);
    setQuestaoIdx(0);
    setSelectedLetter(null);
    setHasChecked(false);
    setQuestaoHearts(5);
    setQuestaoXp(0);
    setQuestaoCorrectCount(0);
    setQuestaoCompleted(false);
    setViewMode('questoes-play');
  };

  const handleQuestaoCheck = () => {
    if (!selectedLetter) return;
    const q = questoesList[questaoIdx];
    const correct = selectedLetter === q.correctLetter;
    setIsCorrectAnswer(correct);
    setHasChecked(true);
    if (correct) {
      setQuestaoXp(prev => prev + 10);
      setQuestaoCorrectCount(prev => prev + 1);
    } else {
      setQuestaoHearts(prev => prev - 1);
    }
  };

  const handleQuestaoContinue = () => {
    if (questaoHearts <= 0) {
      setQuestaoCompleted(true);
      return;
    }
    if (questaoIdx + 1 < questoesList.length) {
      setQuestaoIdx(questaoIdx + 1);
      setSelectedLetter(null);
      setHasChecked(false);
    } else {
      setQuestaoCompleted(true);
      const bonus = questaoCorrectCount >= questoesList.length * 0.7 ? 15 : 0;
      setQuestaoXp(prev => prev + bonus);
      setXpPoints(prev => prev + questaoXp + bonus);
    }
  };

  const handleBackToCategories = () => {
    setViewMode('categories');
    setActiveCategory(null);
    setQuestoesArea('');
    setLessonActive(false);
    setActiveChapter(null);
  };

  const getLessonContent = () => {
    if (!activeCategory) return null;
    return CABRITO_LESSON_CONTENT[activeCategory.area] || CABRITO_LESSON_CONTENT['Recomendado'];
  };

  const lessonContent = getLessonContent();
  const totalLessonSteps = lessonContent
    ? lessonContent.content.length + lessonContent.tips.length
    : 0;

  const renderCursinhoTab = () => {
    if (viewMode === 'lesson' && activeCategory && lessonContent) {
      const cabritoSpeeches = [
        'Vamos lá! Eu, o Cabrito, vou te ensinar o essencial! 🐐',
        'Preste atenção nestas dicas valiosas!',
        'Quase lá! Você está ficando mais forte!',
        'Continue! O conhecimento é o melhor caminho!',
        'Essa é uma parte crucial — anote! 📝',
        'Você está indo muito bem! Continue assim!',
      ];
      const speechIdx = Math.min(lessonStep, cabritoSpeeches.length - 1);

      if (lessonStep < lessonContent.content.length) {
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackToCategories}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer transition"
              >
                ← Voltar
              </button>
              <div className="flex items-center gap-2">
                <div className="w-40 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${((lessonStep + 1) / totalLessonSteps) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {lessonStep + 1}/{totalLessonSteps}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative animate-bounce">
                  <span className="text-5xl">🐐</span>
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 text-white text-[8px] font-extrabold flex items-center justify-center rounded-full animate-pulse border border-white">
                    IA
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-[#0f172a] p-4 rounded-2xl border border-blue-200/50 dark:border-slate-800 relative text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
                  <div className="absolute -left-2 top-4 w-4 h-4 bg-blue-50 dark:bg-[#0f172a] border-t border-l border-blue-200/50 dark:border-slate-800 rotate-45" />
                  <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">
                    Cabrito do Mil:
                  </p>
                  <p>{cabritoSpeeches[speechIdx]}</p>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border ${activeCategory.bgColor} ${activeCategory.darkBgColor} ${activeCategory.borderColor}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={activeCategory.color}>
                    {activeCategory.icon}
                  </span>
                  <h3 className="font-display font-black text-sm text-slate-800 dark:text-slate-100">
                    {lessonContent.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {lessonContent.content[lessonStep]}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleBackToCategories}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  Sair
                </button>
                <button
                  type="button"
                  onClick={() => setLessonStep(prev => prev + 1)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Próximo</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      }

      const tipIdx = lessonStep - lessonContent.content.length;
      const tip = lessonContent.tips[tipIdx];

      return (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToCategories}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer transition"
            >
              ← Voltar
            </button>
            <div className="flex items-center gap-2">
              <div className="w-40 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${((lessonStep + 1) / totalLessonSteps) * 100}%`,
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {lessonStep + 1}/{totalLessonSteps}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative animate-bounce">
                <span className="text-5xl">🐐</span>
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 text-white text-[8px] font-extrabold flex items-center justify-center rounded-full animate-pulse border border-white">
                  IA
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-[#0f172a] p-4 rounded-2xl border border-blue-200/50 dark:border-slate-800 relative text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
                <div className="absolute -left-2 top-4 w-4 h-4 bg-blue-50 dark:bg-[#0f172a] border-t border-l border-blue-200/50 dark:border-slate-800 rotate-45" />
                <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">
                  Cabrito do Mil:
                </p>
                <p>
                  Última parte! Essas dicas são ouro para o ENEM! Preste atenção!
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h3 className="font-display font-black text-sm text-slate-800 dark:text-slate-100">
                  Dica #{tipIdx + 1}
                </h3>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {tip}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleBackToCategories}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Sair
              </button>
              {tipIdx < lessonContent.tips.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setLessonStep(prev => prev + 1)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Próximo</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBackToCategories}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Check className="h-4 w-4" />
                  <span>Aula Concluída!</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map(cat => {
            const isRecomendado =
              cat.area === 'Recomendado' &&
              wrongAnswers &&
              wrongAnswers.length < 3;
            return (
              <div
                key={cat.id}
                className={`bg-white dark:bg-[#1e293b] rounded-2xl border ${cat.borderColor} p-5 space-y-4 shadow-sm hover:shadow-md transition-all duration-200 ${
                  isRecomendado ? 'opacity-50' : ''
                }`}
              >
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
                {isRecomendado ? (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    ⚠️ Resolva pelo menos 3 questões para desbloquear
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartCursinhoCategory(cat)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Começar a Aprender</span>
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
      if (questaoCompleted) {
        const passed =
          questaoCorrectCount >= questoesList.length * 0.7;
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
                      {questaoCorrectCount}/{questoesList.length}
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
                      {questaoCorrectCount}/{questoesList.length}
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
                      (questaoCorrectCount / questoesList.length) * 100
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

      const q = questoesList[questaoIdx];
      if (!q) return null;

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
                        ((questaoIdx + 1) / questoesList.length) * 100
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
                <span className="text-[10px] font-mono leading-none font-black text-blue-600 dark:text-blue-400 block tracking-wider uppercase">
                  Questão {questaoIdx + 1} de {questoesList.length} •{' '}
                  {q.area}
                </span>
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
                {q.options.map(opt => {
                  const isSelected = selectedLetter === opt.letter;
                  const isCorrect = opt.letter === q.correctLetter;
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
                      key={opt.letter}
                      type="button"
                      onClick={() => {
                        if (!hasChecked) setSelectedLetter(opt.letter);
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
                        {opt.letter}
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
                  className={`p-4 rounded-2xl flex items-start gap-3.5 text-xs ${
                    isCorrectAnswer
                      ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 text-green-800 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-300'
                  }`}
                >
                  {isCorrectAnswer ? (
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                  )}
                  <div className="space-y-1 leading-relaxed">
                    <p className="font-bold">
                      {isCorrectAnswer ? 'Correto!' : 'Incorreto!'}
                    </p>
                    <p>{q.explanation}</p>
                  </div>
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
            const isRecomendado =
              cat.area === 'Recomendado' &&
              wrongAnswers &&
              wrongAnswers.length < 3;
            return (
              <div
                key={cat.id}
                className={`bg-white dark:bg-[#1e293b] rounded-2xl border ${cat.borderColor} p-5 space-y-4 shadow-sm hover:shadow-md transition-all duration-200 ${
                  isRecomendado ? 'opacity-50' : ''
                }`}
              >
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
                {isRecomendado ? (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    ⚠️ Resolva pelo menos 3 questões para desbloquear
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartQuestoes(cat.area)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>Começar Questões</span>
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

              {mainTab === 'cursinho' && viewMode === 'categories' && (
                <div className="flex flex-col items-center justify-center space-y-12 relative py-8">
                  <div className="absolute top-12 bottom-12 w-1.5 bg-dashed border-l border-blue-300 dark:border-slate-700 pointer-events-none z-0" />
                  {(() => {
                    const wrongCounts: Record<string, number> = {};
                    (wrongAnswers || []).forEach(w => {
                      wrongCounts[w.subject] =
                        (wrongCounts[w.subject] || 0) + 1;
                    });
                    (essayCorrections || []).forEach(e => {
                      if ((e.score || 0) < 700) {
                        wrongCounts['Redação'] =
                          (wrongCounts['Redação'] || 0) + 1;
                      }
                    });

                    return chapters.map((chap, idx) => {
                      const nodeOffsets = [
                        'translate-x-0',
                        'translate-x-12 sm:translate-x-20',
                        '-translate-x-12 sm:-translate-x-20',
                        'translate-x-0',
                        '-translate-x-12 sm:-translate-x-20',
                        'translate-x-12 sm:translate-x-20',
                      ];

                      const positionClass =
                        nodeOffsets[idx % nodeOffsets.length];
                      const finishedFully =
                        chap.level === chap.maxLevel;
                      const percent = Math.round(
                        (chap.level / chap.maxLevel) * 100
                      );
                      const hasRequiredWrongs =
                        (wrongCounts[chap.area] || 0) >= 2;
                      const canAttempt = hasRequiredWrongs || idx === 0;

                      return (
                        <div
                          key={chap.id}
                          className={`flex flex-col sm:flex-row items-center gap-4 z-10 p-2 text-center sm:text-left ${positionClass} animate-fade-in relative`}
                        >
                          <button
                            id={`chapter-${chap.id}`}
                            type="button"
                            disabled={!canAttempt}
                            onClick={() => {
                              setActiveChapter(chap);
                              setHearts(5);
                              setCurrentExerciseIdx(0);
                              setHasCheckedLesson(false);
                              setIsCorrectLesson(false);
                              setAiSpeechText(null);
                              setSelectedLetter(null);
                              setSelectedBool(null);
                              setReorderedWords([]);
                              setMatchingSelections({
                                left: null,
                                right: null,
                              });
                              setMatchingCompleted({});

                              const pool =
                                CHAPTER_EXERCISES[chap.id] ||
                                CHAPTER_EXERCISES['red-tese'] ||
                                [];
                              const shuffled = [...pool].sort(
                                () => Math.random() - 0.5
                              );
                              setActiveExercises(shuffled);
                              setOriginalCount(shuffled.length);
                              setErrorsCount(0);
                              setLessonCompleted(false);
                              setLessonPassed(false);
                              setLessonScore(0);
                              setLessonActive(true);
                              setViewMode('categories');
                            }}
                            className={`h-20 w-20 rounded-full flex flex-col items-center justify-center border-4 relative shadow-lg cursor-pointer transition transform duration-200 hover:scale-110 active:scale-95 ${
                              canAttempt
                                ? finishedFully
                                  ? 'bg-emerald-500 border-emerald-300 text-white hover:bg-emerald-600'
                                  : 'bg-blue-600 border-blue-400 text-white hover:bg-blue-700'
                                : 'bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            {!canAttempt ? (
                              <Lock className="h-7 w-7" />
                            ) : (
                              <div className="flex flex-col items-center text-center">
                                <span className="font-display font-black text-xl tracking-tight uppercase leading-none">
                                  Nível
                                </span>
                                <span className="text-sm font-bold font-mono">
                                  {chap.level}
                                </span>
                              </div>
                            )}

                            {canAttempt && (
                              <div className="absolute -top-2.5 -right-2.5 px-1.5 py-0.5 bg-[#0f172a] text-[9px] text-[#f8fafc] dark:bg-blue-500 dark:text-[#f8fafc] rounded-full font-mono font-black border border-slate-300 dark:border-blue-300">
                                {percent}%
                              </div>
                            )}
                          </button>

                          <div className="max-w-[200px] sm:max-w-xs space-y-1">
                            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[10px] font-mono leading-none tracking-wider font-extrabold uppercase">
                              <span
                                className={`px-2 py-0.5 rounded-md text-white font-bold ${
                                  chap.area === 'Redação'
                                    ? 'bg-indigo-500'
                                    : chap.area === 'Humanas'
                                    ? 'bg-amber-600'
                                    : chap.area === 'Linguagens'
                                    ? 'bg-purple-500'
                                    : chap.area === 'Natureza'
                                    ? 'bg-emerald-500'
                                    : 'bg-rose-500'
                                }`}
                              >
                                {chap.area}
                              </span>
                              {!canAttempt && (
                                <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-0.5">
                                  ● PRECISA DE 2 ERROS
                                </span>
                              )}
                            </div>
                            <h4
                              className={`font-display font-black text-sm block ${
                                canAttempt
                                  ? 'text-slate-800 dark:text-slate-100'
                                  : 'text-slate-400'
                              }`}
                            >
                              {chap.title}
                            </h4>
                            <p className="text-[11px] text-slate-450 leading-snug truncate sm:whitespace-normal">
                              {!canAttempt
                                ? `Responda ${Math.max(
                                    0,
                                    2 - (wrongCounts[chap.area] || 0)
                                  )} questão(ões) de ${
                                    chap.area
                                  } incorretamente para desbloquear`
                                : chap.description}
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {mainTab === 'cursinho' && viewMode === 'categories' && (
                <>{renderCursinhoTab()}</>
              )}

              {mainTab === 'cursinho' && viewMode === 'lesson' && (
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

      {showAdGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl max-w-md w-full space-y-6 animate-fade-in">
            <div className="text-center space-y-3">
              <span className="text-5xl block animate-bounce">🐐</span>
              <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100">
                Antes de Continuar...
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Assista 1 minuto de anúncio para continuar
              </p>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-6 text-center space-y-3">
              <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                <span className="text-slate-400 dark:text-slate-500 text-xs font-mono">
                  Espaço para anúncio
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Anúncio será exibido aqui em breve
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAdGate(false);
                  setAdGateTarget(null);
                }}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdGateContinue}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Play className="h-4 w-4" />
                <span>Continuar</span>
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
