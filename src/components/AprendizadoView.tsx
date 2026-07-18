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

interface AiLessonContent {
  title: string;
  subtitle: string;
  content: string[];
  tips: string[];
}

function getFallbackLesson(area: string): AiLessonContent {
  const fallbacks: Record<string, AiLessonContent> = {
    Redação: {
      title: 'Redação Nota 1000',
      subtitle: 'Estratégias que garantem pontuação máxima',
      content: [
        'A redação do ENEM é avaliada em 5 competências, cada uma valendo até 200 pontos. Dominar cada uma é essencial para atingir a nota 1000.',
        'Competência 1: Domínio da norma culta. Isso significa escrever com gramática impecável, usar coesão correta e evitar erros grosseiros de português.',
        'Competência 2: Compreensão da proposta. Leia atentamente o texto motivador e aplique conceitos de várias áreas do conhecimento ao seu argumento.',
        'Competência 3: Seleção de informações. Organize seus argumentos de forma lógica e relevante, sempre conectando com o tema proposto.',
        'Competência 4: Mecanismos linguísticos. Use conectivos variados e organize seus parágrafos com clareza e coerência.',
        'Competência 5: Proposta de intervenção detalhada. Quem faz, o quê, como, onde e quando — tudo deve estar claro e ser viável.'
      ],
      tips: [
        'Comece com uma contextualização que use repertório legitimo (filosofia, história, sociologia).',
        'Desenvolva pelo menos 2 argumentos consistentes em parágrafos separados.',
        'Sempre inclua a proposta de intervenção detalhada com os 5 elementos obrigatórios.'
      ]
    },
    Linguagens: {
      title: 'Linguagens e Códigos',
      subtitle: 'Interpretação, literatura e gramática no ENEM',
      content: [
        'A prova de Linguagens abrange Português, Literatura, Língua Estrangeira, Artes e Educação Física. É a área que mais exige interpretação profunda.',
        'Na interpretação textual, identifique o tema central, os argumentos do autor e a intencionalidade comunicativa. O ENEM cobra leitura crítica, não decoreba.',
        'Na gramática contextualizada, foque em concordância verbal e nominal, regência, crase e pontuação. Cada questão traz um texto real como base.',
        'A literatura brasileira cai todos os anos: Modernismo, Realismo, Naturalismo e movimentos contemporâneos. Conheça os principais autores e suas obras.',
        'Para Língua Estrangeira, pratique com textos autênticos. O nível é intermediário — foque em vocabulário temático e estruturas gramaticais essenciais.',
        'Artes e Educação Física são interdisciplinares. Relacione expressões artísticas e práticas esportivas com aspectos sociais e culturais.'
      ],
      tips: [
        'Pratique interpretação de textos variados: crônicas, poemas, charges, textos argumentativos.',
        'Revise concordância verbal com sujeito composto e orações impessoais.',
        'Estude os movimentos literários com foco no que mais cai: Modernismo de 22 e Generação de 30.'
      ]
    },
    Humanas: {
      title: 'Ciências Humanas',
      subtitle: 'História, Geografia, Filosofia e Sociologia aplicadas',
      content: [
        'As Ciências Humanas do ENEM misturam História, Geografia, Filosofia e Sociologia em uma única prova interdisciplinar.',
        'Na História do Brasil, foque em: Colônia (escravidão e ciclo do açúcar), Independência, República Velha, Era Vargas e Redemocratização.',
        'Geografia cobra muito leitura de mapas, gráficos e dados. Domine urbanização, globalização, geopolítica e questões ambientais como mudanças climáticas.',
        'Filosofia aparece com pensadores clássicos: Sócrates, Platão, Aristóteles, Marx, Kant e os existencialistas. Entenda suas ideias centrais.',
        'Sociologia foca em classes sociais, movimentos sociais, educação e trabalho. Relacione com a realidade brasileira contemporânea.',
        'O segredo é conectar conteúdo histórico com a realidade atual — o ENEM adora questões que pedem essa relação.'
      ],
      tips: [
        'Associe cada evento histórico às suas causas e consequências em cadeia.',
        'Pratique a leitura de mapas temáticos, gráficos e infográficos.',
        'Para Filosofia, memorize apenas a ideia central de cada filósofo, não tentdecorar biografias.'
      ]
    },
    Natureza: {
      title: 'Ciências da Natureza',
      subtitle: 'Biologia, Química e Física para o ENEM',
      content: [
        'A prova de Natureza reúne Biologia, Química e Física. As questões são interdisciplinares e exigem raciocínio lógico aplicado.',
        'Em Biologia, foque em genética (leis de Mendel, heredogramas), ecologia (cadeias alimentares, bioacumulação) e biotecnologia.',
        'A Química do ENEM cobra estequiometria, ligações químicas, orgânica e eletroquímica. Saiba aplicar conceitos em situações do dia a dia.',
        'Na Física, domine cinemática, dinâmica, óptica e circuitos elétricos. O ENEM adora questões com contexto de tecnologia e engenharia.',
        'Questões de laboratório e métodos científicos aparecem todos os anos. Entenda hipótese, tese, variáveis e análise de dados.',
        'A interdisciplinaridade é a chave: uma mesma questão pode envolver conceitos de biologia e química ao mesmo tempo.'
      ],
      tips: [
        'Resolva muitos exercícios com dados e gráficos — é assim que o ENEM cobraNatureza.',
        'Monte um caderno de fórmulas organizado por disciplina e revise semanalmente.',
        'Estude os ciclos biogeoquímicos e a relação entre poluição e impactos ambientais.'
      ]
    },
    Matemática: {
      title: 'Matemática',
      subtitle: 'Domine os tópicos que mais caem no ENEM',
      content: [
        'A Matemática do ENEM é puro raciocínio lógico aplicado a situações cotidianas. Não basta decorar fórmulas — é preciso saber quando e como usá-las.',
        'Funções são o coração da prova: linear, quadrática, exponencial e logarítmica. Entenda como interpretar gráficos e identificar comportamentos.',
        'Análise combinatória cai todo ano: permutação, arranjo e combinação. Domine as fórmulas e saiba identificar quando cada uma se aplica.',
        'Estatística e Probabilidade aparecem com frequência: média, mediana, moda, desvio padrão, probabilidade simples e composta.',
        'Geometria analítica e trigonometria resolvem problemas de áreas, distâncias e ângulos. Saiba aplicar no plano cartesiano.',
        'Regra de três composta e progressões aritméticas e geométricas são clássicos — domine os conceitos e resolva questões rápidas.'
      ],
      tips: [
        'Resolva provas anteriores com cronômetro — a tempo é crucial na Matemática.',
        'Aprenda a interpretar gráficos e tabelas rapidamente, identificando padrões.',
        'Use a técnica de eliminação nas alternativas quando não souber resolver diretamente.'
      ]
    },
    Recomendado: {
      title: 'Revisão Personalizada',
      subtitle: 'Plano focado nos seus pontos fracos',
      content: [
        'Analisamos seus erros e pontos fracos para criar um plano de estudo personalizado focado onde mais precisa.',
        'A repetição espaçada é o método mais eficiente para fixar conteúdo: revise o mesmo tema em intervalos crescentes de tempo.',
        'Foque nos temas onde mais errou — identificar padrões de erro é mais eficiente que estudar tudo igualmente.',
        'Pratique diariamente, mesmo que por apenas 15 minutos. A consistência supera maratonas de estudo ocasionais.',
        'Use mapas mentais e resumos visuais para conectar conceitos e facilitar a memorização de longo prazo.'
      ],
      tips: [
        'Não pule etapas — volte aos fundamentos se sentir dificuldade em tópicos avançados.',
        'Grupos de estudo ajudam a fixar conceitos através da explicação para colegas.',
        'Revise seus erros de simulados anteriores antes de fazer novos — é onde está seu maior ganho.'
      ]
    }
  };
  return fallbacks[area] || fallbacks['Recomendado'];
}

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
  const [aiLesson, setAiLesson] = useState<AiLessonContent | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [lessonTopicIndex, setLessonTopicIndex] = useState(0);

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

  const [aiLessonCycle, setAiLessonCycle] = useState<LessonCycle | null>(null);
  const [aiQuestoes, setAiQuestoes] = useState<AiQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questaoFeedback, setQuestaoFeedback] = useState('');
  const [questaoTopic, setQuestaoTopic] = useState('');
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

  const fetchLessonCycle = async (cat: CategoryCard, topicIdx: number) => {
    setLoadingLesson(true);
    setAiLessonCycle(null);
    try {
      const wrongSubjects = (wrongAnswers || []).map(w => w.subject);
      const resp = await fetch('/api/lesson-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: cat.area, level: 5, weakTopics: wrongSubjects, topicIndex: topicIdx }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.title && Array.isArray(data.cycles) && data.cycles.length > 0) {
          setAiLessonCycle(data);
        }
      }
    } catch {}
    setLoadingLesson(false);
  };

  const fetchQuestoesAI = async (area: string) => {
    setLoadingQuestions(true);
    try {
      const wrongSubjects = (wrongAnswers || []).map(w => w.subject);
      const resp = await fetch('/api/questoes-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area, count: 5, weakTopics: wrongSubjects }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          setAiQuestoes(data.questions.map((q: any, i: number) => ({
            id: q.id || `ai-q-${i}`, statement: q.statement || '',
            options: q.options || [], correctAnswer: q.correctAnswer || 'A',
            explanation: q.explanation || '', topic: q.topic || '',
          })));
        } else { setAiQuestoes([]); }
      } else { setAiQuestoes([]); }
    } catch { setAiQuestoes([]); }
    setLoadingQuestions(false);
  };

  const handleAdGateContinue = useCallback(() => {
    setAdGateActive(false);
    setAdGateSecondsLeft(0);
    if (adGateTarget === 'cursinho' && activeCategory) {
      setViewMode('lesson');
      setLessonStep(0);
      const nextIdx = lessonTopicIndex + 1;
      setLessonTopicIndex(nextIdx);
      fetchLessonCycle(activeCategory, nextIdx);
    } else if (adGateTarget === 'questoes' && questoesArea) {
      setViewMode('questoes-play');
      fetchQuestoesAI(questoesArea);
    }
    setAdGateTarget(null);
  }, [adGateTarget, activeCategory, questoesArea]);

  const handleStartCursinhoCategory = (cat: CategoryCard) => {
    setActiveCategory(cat);
    if (cat.area === 'Recomendado' && wrongAnswers && wrongAnswers.length < 3) return;
    setAdGateTarget('cursinho');
    setAdGateActive(true);
    setAdGateSecondsLeft(60);
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
    setAdGateTarget('questoes');
    setAdGateActive(true);
    setAdGateSecondsLeft(60);
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

  const handleQuestaoCheck = () => {
    if (!selectedLetter || hasChecked) return;
    const activeList = aiQuestoes.length > 0 ? aiQuestoes : questoesList;
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
    const activeList = aiQuestoes.length > 0 ? aiQuestoes : questoesList;
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
    setAiLesson(null);
    setAiLessonCycle(null);
    setAiQuestoes([]);
    setLoadingLesson(false);
  };

  const getLessonContent = (): AiLessonContent | null => {
    if (!activeCategory) return null;
    if (aiLesson) return aiLesson;
    return getFallbackLesson(activeCategory.area);
  };

  const lessonContent = getLessonContent();
  const totalLessonSteps = aiLessonCycle
    ? aiLessonCycle.cycles.length
    : lessonContent
      ? lessonContent.content.length + lessonContent.tips.length
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

    if (viewMode === 'lesson' && activeCategory) {
      const blockTypeLabels: Record<string, string> = {
        story: '📖 História do Cabrito',
        explanation: '📚 Explicação',
        interactive: '🎯 Resolva comigo!',
        challenge: '🏆 Desafio de fixação',
      };

      if (aiLessonCycle && lessonStep < aiLessonCycle.cycles.length) {
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
                    <button type="button" disabled={interactiveAnswer === null} onClick={() => setInteractiveChecked(true)} className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${interactiveAnswer !== null ? 'bg-blue-600 hover:bg-blue-700 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}`}>Verificar Resposta</button>
                  ) : (
                    <div className="space-y-3">
                      <div className={`p-3 rounded-xl text-xs font-semibold ${interactiveAnswer === block.correctIndex ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
                        {interactiveAnswer === block.correctIndex ? '✅ Correto! Excelente!' : '❌ Incorreto!'}
                        {block.explanation && <p className="mt-1 font-normal opacity-80">{block.explanation}</p>}
                      </div>
                      <button type="button" onClick={() => { setLessonStep(prev => prev + 1); setInteractiveAnswer(null); setInteractiveChecked(false); }} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md">
                        <span>{lessonStep + 1 >= totalLessonSteps ? 'Finalizar' : 'Próximo'}</span> <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!isInteractive && (
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={handleBackToCategories} className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer transition">Sair</button>
                  <button type="button" onClick={() => { setLessonStep(prev => prev + 1); setInteractiveAnswer(null); setInteractiveChecked(false); }} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md">
                    <span>{lessonStep + 1 >= totalLessonSteps ? 'Finalizar' : 'Próximo'}</span> <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {lessonStep + 1 >= totalLessonSteps && interactiveChecked && (
                <div className="text-center pt-2">
                  <button type="button" onClick={() => { const nextIdx = lessonTopicIndex + 1; setLessonTopicIndex(nextIdx); setLessonStep(0); setInteractiveAnswer(null); setInteractiveChecked(false); fetchLessonCycle(activeCategory, nextIdx); }} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md mx-auto">
                    <Sparkles className="h-4 w-4" /><span>Próxima Aula</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (lessonContent) {
        const cabritoSpeeches = ['Vamos lá! Eu, o Cabrito, vou te ensinar o essencial! 🐐', 'Preste atenção nestas dicas valiosas!', 'Quase lá! Você está ficando mais forte!', 'Continue! O conhecimento é o melhor caminho!', 'Essa é uma parte crucial — anote! 📝', 'Você está indo muito bem! Continue assim!'];
        const speechIdx = Math.min(lessonStep, cabritoSpeeches.length - 1);

        if (lessonStep < lessonContent.content.length) {
          return (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <button type="button" onClick={handleBackToCategories} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer transition">← Voltar</button>
                <div className="flex items-center gap-2">
                  <div className="w-40 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${((lessonStep + 1) / totalLessonSteps) * 100}%` }} /></div>
                  <span className="text-[10px] font-mono text-slate-400">{lessonStep + 1}/{totalLessonSteps}</span>
                </div>
              </div>
              <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative animate-bounce"><span className="text-5xl">🐐</span><div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 text-white text-[8px] font-extrabold flex items-center justify-center rounded-full animate-pulse border border-white">IA</div></div>
                  <div className="bg-blue-50 dark:bg-[#0f172a] p-4 rounded-2xl border border-blue-200/50 dark:border-slate-800 relative text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
                    <div className="absolute -left-2 top-4 w-4 h-4 bg-blue-50 dark:bg-[#0f172a] border-t border-l border-blue-200/50 dark:border-slate-800 rotate-45" />
                    <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Cabrito do Mil:</p><p>{cabritoSpeeches[speechIdx]}</p>
                  </div>
                </div>
                <div className={`p-4 rounded-2xl border ${activeCategory.bgColor} ${activeCategory.darkBgColor} ${activeCategory.borderColor}`}>
                  <div className="flex items-center gap-2 mb-3"><span className={activeCategory.color}>{activeCategory.icon}</span><div><h3 className="font-display font-black text-sm text-slate-800 dark:text-slate-100">{lessonContent.title}</h3>{lessonContent.subtitle && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{lessonContent.subtitle}</p>}</div></div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{lessonContent.content[lessonStep]}</p>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={handleBackToCategories} className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer transition">Sair</button>
                  <button type="button" onClick={() => setLessonStep(prev => prev + 1)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"><span>Próximo</span><ArrowRight className="h-4 w-4" /></button>
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
              <button type="button" onClick={handleBackToCategories} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer transition">← Voltar</button>
              <div className="flex items-center gap-2">
                <div className="w-40 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${((lessonStep + 1) / totalLessonSteps) * 100}%` }} /></div>
                <span className="text-[10px] font-mono text-slate-400">{lessonStep + 1}/{totalLessonSteps}</span>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative animate-bounce"><span className="text-5xl">🐐</span><div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 text-white text-[8px] font-extrabold flex items-center justify-center rounded-full animate-pulse border border-white">IA</div></div>
                <div className="bg-blue-50 dark:bg-[#0f172a] p-4 rounded-2xl border border-blue-200/50 dark:border-slate-800 relative text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
                  <div className="absolute -left-2 top-4 w-4 h-4 bg-blue-50 dark:bg-[#0f172a] border-t border-l border-blue-200/50 dark:border-slate-800 rotate-45" />
                  <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Cabrito do Mil:</p><p>Última parte! Essas dicas são ouro para o ENEM!</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                <div className="flex items-center gap-2 mb-3"><Sparkles className="h-5 w-5 text-amber-500" /><h3 className="font-display font-black text-sm text-slate-800 dark:text-slate-100">Dica #{tipIdx + 1}</h3></div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{tip}</p>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={handleBackToCategories} className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer transition">Sair</button>
                {tipIdx < lessonContent.tips.length - 1 ? (
                  <button type="button" onClick={() => setLessonStep(prev => prev + 1)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"><span>Próximo</span><ArrowRight className="h-4 w-4" /></button>
                ) : (
                  <div className="flex gap-2">
                    <button type="button" onClick={handleBackToCategories} className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer transition">Menu</button>
                    <button type="button" onClick={() => { const nextIdx = lessonTopicIndex + 1; setLessonTopicIndex(nextIdx); setLessonStep(0); fetchLessonCycle(activeCategory, nextIdx); }} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"><Sparkles className="h-4 w-4" /><span>Próxima Aula</span></button>
                  </div>
                )}
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
      const activeQListForStats = aiQuestoes.length > 0 ? aiQuestoes : questoesList;
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

      const activeQList = aiQuestoes.length > 0 ? aiQuestoes : questoesList;
      const q = activeQList[questaoIdx];
      if (!q) return null;

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
                  setShowAdGate(false);
                  setAdGateTarget(null);
                  setAdGateActive(false);
                  setAdGateSecondsLeft(0);
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
