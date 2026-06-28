import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Heart, 
  Award, 
  Check, 
  X, 
  Sparkles, 
  Lock, 
  ArrowRight, 
  BookOpen, 
  ShieldAlert, 
  RefreshCw, 
  Trophy, 
  HelpCircle,
  GraduationCap
} from 'lucide-react';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';

// Interfaces for our Duolingo module
export interface LearningChapter {
  id: string;
  title: string;
  area: 'Humanas' | 'Linguagens' | 'Redação' | 'Natureza' | 'Matemática';
  description: string;
  level: number;
  maxLevel: number;
  unlocked: boolean;
  xpValue: number;
}

export interface DragWord {
  id: string;
  text: string;
}

export type ExerciseType = 'choice' | 'true-false' | 'reorder' | 'matching';

export interface Exercise {
  id: string;
  type: ExerciseType;
  instructions: string;
  statement: string;
  
  // For 'choice'
  options?: { letter: string; text: string }[];
  correctLetter?: string;
  
  // For 'true-false'
  correctBoolean?: boolean;
  
  // For 'reorder'
  shuffledWords?: string[];
  correctSentenceWords?: string[]; // exact order expected
  
  // For 'matching'
  matchingPairs?: { left: string; right: string }[]; // left side matches right side
  
  explanation: string;
}

// 1. Chapters definitions
const INITIAL_CHAPTERS: LearningChapter[] = [
  {
    id: 'red-tese',
    title: 'Arquitetando a Tese Perfeita',
    area: 'Redação',
    description: 'Aprenda a estruturar o núcleo da sua introdução utilizando conectivos lógicos indispensáveis.',
    level: 0,
    maxLevel: 3,
    unlocked: true,
    xpValue: 20
  },
  {
    id: 'hum-med',
    title: 'Idade Média e Mentalidades',
    area: 'Humanas',
    description: 'Entenda os conceitos chave do feudalismo, teocentrismo e corporações de ofício do medievo.',
    level: 0,
    maxLevel: 3,
    unlocked: true,
    xpValue: 25
  },
  {
    id: 'lin-mod',
    title: 'Modernismo de 22',
    area: 'Linguagens',
    description: 'Domine a Semana de Arte Moderna, a contestação parnasiana e o Manifesto Antropofágico.',
    level: 0,
    maxLevel: 3,
    unlocked: false,
    xpValue: 25
  },
  {
    id: 'nat-eco',
    title: 'Cadeias Alimentares e Poluição',
    area: 'Natureza',
    description: 'Mapeie o fluxo de energia nos ecossistemas e entenda o fenômeno de bioacumulação celular.',
    level: 0,
    maxLevel: 3,
    unlocked: false,
    xpValue: 30
  },
  {
    id: 'mat-r3',
    title: 'Proporcionalidade Dinâmica',
    area: 'Matemática',
    description: 'Gabarite problemas de regra de três composta aplicando análise direta e inversa.',
    level: 0,
    maxLevel: 3,
    unlocked: false,
    xpValue: 30
  }
];

// Exercises for Redação: Tese
const EXERCISES_RED_TESE: Exercise[] = [
  {
    id: 'red-tese-ex1',
    type: 'reorder',
    instructions: 'Duolingo de Redação: Ordene os blocos de texto abaixo para articular uma tese clássica estruturada com dois focos de argumentação.',
    statement: 'Construa a tese estruturada:',
    shuffledWords: ['Assim,', 'torna-se fulcral', 'analisar não apenas', 'a omissão governamental,', 'mas também', 'a passividade social.'],
    correctSentenceWords: ['Assim,', 'torna-se fulcral', 'analisar não apenas', 'a omissão governamental,', 'mas também', 'a passividade social.'],
    explanation: 'A correta estruturação da tese do ENEM exige o uso de conectivos introdutórios ("Assim,", "Portanto,") seguidos da indicação explícita dos dois fatores-problema que serão desenvolvidos nos parágrafos D1 e D2 ("não apenas A, mas também B").'
  },
  {
    id: 'red-tese-ex2',
    type: 'choice',
    instructions: 'Escolha a alternativa correta sobre o posicionamento da Tese.',
    statement: 'Em um projeto de texto estratégico voltado para a Apex Enem, a tese de uma redação do ENEM deve aparecer idealmente em qual trecho da escrita?',
    options: [
      { letter: 'A', text: 'No primeiro parágrafo, servindo de encerramento da Introdução.' },
      { letter: 'B', text: 'No início do desenvolvimento 1, guiando o corretor.' },
      { letter: 'C', text: 'Apenas no parágrafo final, como conclusão das propostas.' },
      { letter: 'D', text: 'Diluída implicitamente ao longo de todo o texto sem termos definidos.' },
      { letter: 'E', text: 'No título do projeto de texto de modo literário.' }
    ],
    correctLetter: 'A',
    explanation: 'Excelente! A tese é o encerramento natural do parágrafo introdutório. É um posicionamento claro e explícito que define os trilhos que o corretor seguirá nos desenvolvimentos.'
  },
  {
    id: 'red-tese-ex3',
    type: 'true-false',
    instructions: 'Responda com Verdadeiro ou Falso à premissa técnica.',
    statement: 'A tese da redação do ENEM pode ser apenas uma pergunta retórica ou uma dúvida abstrata, deixando que o corretor decida os rumos da argumentação.',
    correctBoolean: false,
    explanation: 'Falso! A tese é, por definição do manual do corretor do INEP, uma tomada de posição firme e assertiva. Jamais encerre sua introdução com perguntas, pois demonstra fragilidade autoral no projeto de texto.'
  },
  {
    id: 'red-tese-ex4',
    type: 'matching',
    instructions: 'Associe os elementos constitutivos de um projeto de texto com suas respectivas finalidades:',
    statement: 'Associe os elementos de redação:',
    matchingPairs: [
      { left: 'Contextualização', right: 'Alusão filosófica ou dado para prender o leitor' },
      { left: 'Tese do Aluno', right: 'Opinião explícita fundamentadora de dois eixos' },
      { left: 'Proposta de Intervenção', right: 'Resolução prática resolvendo os focos do problema' }
    ],
    explanation: 'Perfeito! Todo bom texto do ENEM divide sua Introdução em: Contextualização (repertório legítimo), apresentação do Problema e proposição clara da Tese (posicionamento explícito).'
  }
];

// Exercises for Humanas: Idade Média
const EXERCISES_HUM_MED: Exercise[] = [
  {
    id: 'hum-med-ex1',
    type: 'choice',
    instructions: 'Analise a questão sobre a economia feudal.',
    statement: 'No auge da Idade Média Ocidental, a posse de terras regia o prestígio social e político. Contudo, nas cidades amuralhadas (burgos), o florescimento econômico era capitaneado pelas corporações de ofício jurídicas de artesãos. Qual das seguintes era a principal atribuição de uma corporação de ofício?',
    options: [
      { letter: 'A', text: 'Financiamento de grandes expedições marítimas rumo às Américas.' },
      { letter: 'B', text: 'Regulamentação e controle estrito de preços, pesos e padrões das manufaturas urbanas, garantindo o monopólio local.' },
      { letter: 'C', text: 'Criação de milícias mercenárias para depor vassalos fiéis ao papa reformista.' },
      { letter: 'D', text: 'Isenção total de dízimos para servos de gleba rebelados.' },
      { letter: 'E', text: 'Estabelecer a abolição da moenda e das talhas feudais.' }
    ],
    correctLetter: 'B',
    explanation: 'As corporações de ofício organizavam a produção urbana protegendo os mestres artesãos contra a concorrência externa. Elas controlavam o preço de venda, fiscalizavam a qualidade e ditavam as regras de jornada e aprendizado.'
  },
  {
    id: 'hum-med-ex2',
    type: 'matching',
    instructions: 'Associe as três ordens medievais descritas por Adalberon de Laon com as suas atribuições corporais:',
    statement: 'Mentalidade das Ordens:',
    matchingPairs: [
      { left: 'Belatores', right: 'Guerreiros que asseguravam a defesa física geral' },
      { left: 'Oratores', right: 'Clero encarregado da salvação espiritual da sociedade' },
      { left: 'Laboratores', right: 'Servos que mantinham o sustento agrícola de todos' }
    ],
    explanation: 'Muito bem! A sociedade feudal medieval era enxergada como um corpo orgânico harmônico dividido por desígnio divino em três pilares: os Guerreiros (belatores), os Sacerdotes (oratores) e os Trabalhadores (laboratores).'
  },
  {
    id: 'hum-med-ex3',
    type: 'reorder',
    instructions: 'Duolingo de Humanas: Reordene as palavras para formar a premissa central da mentalidade clerical medieval.',
    statement: 'O pilar teológico supremo:',
    shuffledWords: ['Deus', 'representa o', 'centro de tudo,', 'legitimando', 'as divisões sociais', 'feudais terrestres.'],
    correctSentenceWords: ['Deus', 'representa o', 'centro de tudo,', 'legitimando', 'as divisões sociais', 'feudais terrestres.'],
    explanation: 'Sob o Teocentrismo dominador católico medieval, Deus era o eixo explicador e ordenador da sociedade. Toda autoridade, nobreza e servidão era retratada como vontade divina inquestionável.'
  }
];

// Exercises for Linguagens: Modernismo
const EXERCISES_LIN_MOD: Exercise[] = [
  {
    id: 'lin-mod-ex1',
    type: 'choice',
    instructions: 'Escolha a alternativa correta sobre a Geração de 22.',
    statement: 'A Semana de Arte Moderna de 1922 ocorreu no Teatro Municipal de São Paulo, sendo considerada um marco de rotura estética. Qual era a principal crítica dos modernistas em relação à literatura parnasiana que dominava a época?',
    options: [
      { letter: 'A', text: 'A excessiva valorização de temas mitológicos locais e regionalistas.' },
      { letter: 'B', text: 'O uso de verso livre e a ausência completa de pontuação nos poemas clássicos.' },
      { letter: 'C', text: 'O rigor formal exacerbado, as rimas raras e a obsessão academicista com a métrica tradicional.' },
      { letter: 'D', text: 'A defesa veemente da aproximação conceitual com as crônicas românticas portuguesas.' },
      { letter: 'E', text: 'O fato de o parnasianismo repudiar as formas rítmicas francesas.' }
    ],
    correctLetter: 'C',
    explanation: 'O Modernismo insurgiu-se contra o Parnasianismo porque este cultuava o preciosismo, as regras fixas de versificação ("arte pela arte") e as métricas rígidas, ignorando a coloquialidade, o dinamismo e as rimas naturais da vida cotidiana e nacional.'
  },
  {
    id: 'lin-mod-ex2',
    type: 'true-false',
    instructions: 'Responda com Verdadeiro ou Falso à premissa estética.',
    statement: 'O Manifesto Antropófago, escrito por Oswald de Andrade em 1928, defendia que a cultura estrangeira europeia deveria ser rejeitada por completo e proibida de circular no país para preservar a pureza intocada do folclore brasileiro.',
    correctBoolean: false,
    explanation: 'Falso! A Antropofagia modernista não defendia a xenofobia. Pelo contrário: propunha engolir assimilando criticamente os conceitos artísticos importados da Europa, digerindo-os e recriando-os de forma autoral com as cores brasileiras (como os rituais canibais indígenas).'
  },
  {
    id: 'lin-mod-ex3',
    type: 'matching',
    instructions: 'Associe as grandes figuras da Geração de 22 com suas principais contribuições artísticas:',
    statement: 'Ícones Modernistas:',
    matchingPairs: [
      { left: 'Mário de Andrade', right: 'Autor de "Macunaíma", herói sem nenhum caráter' },
      { left: 'Oswald de Andrade', right: 'Escreveu os manifestos Pau-Brasil e Antropófago' },
      { left: 'Anita Malfatti', right: 'Pintora cuja exposição expressionista de 1917 sacudiu as bases parnasianas' }
    ],
    explanation: 'Certíssimo! Anita Malfatti chocou a crítica da época (inclusive Monteiro Lobato). Oswald de Andrade trouxe a irreverência teórica de vanguarda e Mário de Andrade investigou o folclore nacional de forma monumental no romance Macunaíma.'
  }
];

// Exercises for Natureza: Cadeias Alimentares
const EXERCISES_NAT_ECO: Exercise[] = [
  {
    id: 'nat-eco-ex1',
    type: 'choice',
    instructions: 'Escolha a alternativa sobre a magnificação trófica.',
    statement: 'A bioacumulação celular de xenobióticos de difícil degradação (como mercúrio e pesticida organoclorado) acarreta graves consequências ecológicas. Ao longo de uma cadeia trófica composta por Fitoplâncton -> Zooplâncton -> Pequenos Peixes -> Aves Piscívoras, qual grupo de organismos acumulará a maior quantidade proporcional do metal pesado?',
    options: [
      { letter: 'A', text: 'Os produtores clorofilados de fitoplâncton.' },
      { letter: 'B', text: 'Os peixes pequenos de zooplâncton.' },
      { letter: 'C', text: 'As aves piscívoras predadoras do topo da cadeia.' },
      { letter: 'D', text: 'Os fungos decompositores de matéria orgânica litorânea.' },
      { letter: 'E', text: 'Todos os elos acumularão quantidades perfeitamente idênticas.' }
    ],
    correctLetter: 'C',
    explanation: 'Isso mesmo! Substâncias não biodegradáveis não são excretadas pelos seres vivos. Desse modo, o teor de contaminação amplia-se a cada nível trófico ascendente (magnificação trófica), concentrando-se pesadamente nos animais que ocupam o topo da cadeia.'
  },
  {
    id: 'nat-eco-ex2',
    type: 'true-false',
    instructions: 'Responda com Verdadeiro ou Falso à premissa energética.',
    statement: 'Ao longo dos níveis tróficos de uma cadeia alimentar, as taxas de energia útil disponível aumentam progressivamente dos produtores aos predadores de topo, de forma que o leão consome energia nutricional de teor muito superior à grampolina inicial.',
    correctBoolean: false,
    explanation: 'Falso! O fluxo de energia nos ecossistemas é estritamente unidirecional e decrescente. Grande parte da energia útil é perdida na forma de calor metabólico a cada degrau trófico. Logo, os predadores de topo dispõem de menos energia acumulada disponível, devendo consumir maior volume biológico.'
  },
  {
    id: 'nat-eco-ex3',
    type: 'reorder',
    instructions: 'Ordene o ciclo clássico de matéria de um ecossistema equilibrado:',
    statement: 'Ciclo de Matéria:',
    shuffledWords: ['Produtores fixam energia,', 'animais a consomem,', 'e os decompositores', 'reciclam nutrientes ao solo.'],
    correctSentenceWords: ['Produtores fixam energia,', 'animais a consomem,', 'e os decompositores', 'reciclam nutrientes ao solo.'],
    explanation: 'Diferente da energia que flui de maneira unidirecional decrescente, a matéria em um ecossistema circula ciclicamente: a decomposição de matéria orgânica em inorgânica repõe minerais ricos no solo para que sejam captados novamente pelas plantas e reintroduzidos na biosfera.'
  }
];

// Exercises for Matemática: Regra de Três
const EXERCISES_MAT_R3: Exercise[] = [
  {
    id: 'mat-r3-ex1',
    type: 'choice',
    instructions: 'Resolva a regra de três composta analisando as grandezas.',
    statement: 'Em um canteiro de obras, 4 operários trabalhando 6 horas por dia conseguem pavimentar uma rampa de 64 m² em exatamente 8 dias. Mantendo o ritmo de serviço idêntico, quantos dias serão necessários para 6 operários trabalhando 8 horas por dia pavimentarem uma rampa com 120 m²?',
    options: [
      { letter: 'A', text: '5 dias.' },
      { letter: 'B', text: '6 dias.' },
      { letter: 'C', text: '7,5 dias.' },
      { letter: 'D', text: '8 dias.' },
      { letter: 'E', text: '10 dias.' }
    ],
    correctLetter: 'C',
    explanation: 'Operários (↑), Horas/dia (↑), Área (↓), Dias (x). Montando a razão: 8/x = (6/4) * (8/6) * (64/120) => 8/x = (48/24) * (64/120) => 8/x = 2 * (64/120) => 8/x = 128/120 => 128x = 960 => x = 7,5 dias.'
  },
  {
    id: 'mat-r3-ex2',
    type: 'true-false',
    instructions: 'Responda com Verdadeiro ou Falso à premissa de proporção.',
    statement: 'A velocidade média empregada por um ônibus de viagem de São Paulo ao Rio e o tempo total de viagem gasto para percorrer essa mesma distância fixa constituem grandezas diretamente proporcionais, pois se a velocidade aumenta, o tempo obrigatoriamente cresce.',
    correctBoolean: false,
    explanation: 'Falso! Velocidade média e Tempo total de deslocamento são grandezas inversamente proporcionais. Se a velocidade média do ônibus aumenta para trafegar na rodovia, o tempo de viagem exigido para cobrir o mesmo trajeto será proporcionalmente menor.'
  }
];

export default function AprendizadoView() {
  const [chapters, setChapters] = useState<LearningChapter[]>(INITIAL_CHAPTERS);
  const [activeChapter, setActiveChapter] = useState<LearningChapter | null>(null);
  
  // Lesson loop state
  const [activeExercises, setActiveExercises] = useState<Exercise[]>([]);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [xpPoints, setXpPoints] = useState(0);
  const [streak, setStreak] = useState(1);
  const [lessonActive, setLessonActive] = useState(false);
  
  // Exercise interactions
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedBoolean, setSelectedBoolean] = useState<boolean | null>(null);
  const [reorderedWords, setReorderedWords] = useState<string[]>([]);
  const [matchingSelections, setMatchingSelections] = useState<{ left: string | null; right: string | null }>({ left: null, right: null });
  const [matchingCompleted, setMatchingCompleted] = useState<{ [key: string]: boolean }>({}); // tracks which left items are resolved
  const [matchingStatusText, setMatchingStatusText] = useState('Clique em uma palavra da esquerda e depois na sua explicação');
  
  // Answer status showing green/red banner
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  
  // OpenRouter key check & interactive explanation box
  const [loadingAiExplanation, setLoadingAiExplanation] = useState(false);
  const [aiSpeechText, setAiSpeechText] = useState<string | null>(null);
  const [openRouterConfigured, setOpenRouterConfigured] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('Local'); // 'Local' or 'Nuvem'

  // Score thresholding & recursion variables
  const [originalCount, setOriginalCount] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [lessonPassed, setLessonPassed] = useState(false);
  const [lessonScore, setLessonScore] = useState(0);

  // Load progress initially and check OpenRouter
  useEffect(() => {
    // Look up local user
    const sessionUser = localStorage.getItem('ApexEnem_current_user');
    if (sessionUser) {
      const user = JSON.parse(sessionUser);
      setStreak(user.streak || 1);
      
      const keyPrefix = user.email.toLowerCase().replace(/[@.]/g, '_');
      
      // Load saved learning levels
      const savedChapters = localStorage.getItem(`ApexEnem_learn_chapters_${keyPrefix}`);
      if (savedChapters) {
        setChapters(JSON.parse(savedChapters));
      }
      
      const savedXP = localStorage.getItem(`ApexEnem_learn_xp_${keyPrefix}`);
      if (savedXP) {
        setXpPoints(parseInt(savedXP, 10));
      }
    }
    
    // Check if OpenRouter is declared (via server info or we can probe the endpoint)
    // We'll create custom endpoints to safely do this.
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

  const loadProgressFromSupabase = async () => {
    try {
      const sessionUser = localStorage.getItem('ApexEnem_current_user');
      if (!sessionUser) return;
      const user = JSON.parse(sessionUser);
      
      const res = await fetch(`/api/supabase/get-progress?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.progress) {
          if (data.progress.chapters) {
            setChapters(data.progress.chapters);
            const keyPrefix = user.email.toLowerCase().replace(/[@.]/g, '_');
            localStorage.setItem(`ApexEnem_learn_chapters_${keyPrefix}`, JSON.stringify(data.progress.chapters));
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
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

  // 2. Start Lesson action
  const handleStartLesson = (chap: LearningChapter) => {
    setActiveChapter(chap);
    setHearts(5);
    setCurrentExerciseIdx(0);
    setHasChecked(false);
    setIsCorrectAnswer(false);
    setAiSpeechText(null);
    
    // Reset answers
    setSelectedLetter(null);
    setSelectedBoolean(null);
    setReorderedWords([]);
    setMatchingSelections({ left: null, right: null });
    setMatchingCompleted({});
    setMatchingStatusText('Escolha uma palavra da de esquerda e depois sua resposta à direita.');

    // Select exercises list
    let pool: Exercise[] = [];
    if (chap.id === 'red-tese') {
      pool = EXERCISES_RED_TESE;
    } else if (chap.id === 'hum-med') {
      pool = EXERCISES_HUM_MED;
    } else if (chap.id === 'lin-mod') {
      pool = EXERCISES_LIN_MOD;
    } else if (chap.id === 'nat-eco') {
      pool = EXERCISES_NAT_ECO;
    } else if (chap.id === 'mat-r3') {
      pool = EXERCISES_MAT_R3;
    } else {
      pool = EXERCISES_RED_TESE;
    }

    // Shuffle pool to vary the questions: "deixe as perguntas diferentes"
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

  // Left vs Right column selection
  const handleMatchingTap = (value: string, side: 'left' | 'right', exercise: Exercise) => {
    if (hasChecked) return;
    
    const newSel = { ...matchingSelections };
    newSel[side] = value;
    
    setMatchingSelections(newSel);

    // If both sides are selected, check match
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

  // 3. AIS Teacher AI Help (using OpenRouter/Gemini free models)
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

  // 4. Verify user answers
  const handleCheckAnswer = () => {
    const currentEx = activeExercises[currentExerciseIdx];
    let correct = false;

    if (currentEx.type === 'choice') {
      correct = selectedLetter === currentEx.correctLetter;
    } else if (currentEx.type === 'true-false') {
      correct = selectedBoolean === currentEx.correctBoolean;
    } else if (currentEx.type === 'reorder') {
      // check list order
      correct = JSON.stringify(reorderedWords) === JSON.stringify(currentEx.correctSentenceWords);
    } else if (currentEx.type === 'matching') {
      // Check if all left elements are resolved
      const leftElements = currentEx.matchingPairs?.map(p => p.left) || [];
      correct = leftElements.every(elem => matchingCompleted[elem] === true);
    }

    setIsCorrectAnswer(correct);
    setHasChecked(true);

    if (!correct) {
      setHearts(prev => Math.max(0, prev - 1));
      setErrorsCount(prev => prev + 1);

      // Append incorrect question to the end: "se eu errar faça a pergunta reaparecer no fim"
      setActiveExercises(prev => {
        const copy = { ...currentEx, id: `${currentEx.id}-retry-${Date.now()}` };
        return [...prev, copy];
      });
    }
  };

  // 5. Progress to next challenge
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
      // Lesson COMPLETE! Let's calculate the real first-attempt score.
      // Score = (originalCount - errorsCount) / originalCount. If they did worse, cap at 0.
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
    
    // Gain XP
    const gainXp = activeChapter.xpValue;
    const newXp = xpPoints + gainXp;
    setXpPoints(newXp);

    // Update chapter level
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

    // Unlock sequels sequential (Duolingo classic road!)
    let anyUnlocked = false;
    const finalChapters = updatedChapters.map((chap, idx) => {
      if (idx > 0 && updatedChapters[idx - 1].level > 0 && !chap.unlocked) {
        anyUnlocked = true;
        return { ...chap, unlocked: true };
      }
      return chap;
    });

    setChapters(finalChapters);

    // Sync state
    syncProgressToCloud(finalChapters, newXp);
  };

  // Mascot quotes
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
    <div id="aprendizado-view" className="space-y-6 animate-fade-in" style={{ contentVisibility: 'auto' }}>
      
      {/* HUD Header Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            Arena de Aprendizado Corujito
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Domine conteúdos críticos e as matrizes do ENEM jogando sessões gamificadas hiper-rápidas no estilo Duolingo.
          </p>
        </div>

        {/* Sync Indicator */}
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

      {/* Main road layout when lesson is off */}
      {!lessonActive ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Chapter S-Curve Road */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-8 shadow-sm">
              <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100">Caminho do Conhecimento ENEM</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">Complete as trilhas ordenadamente para desbloquear o conhecimento definitivo da universidade.</p>
              </div>

              {/* Sequential Maps Layout */}
              <div className="flex flex-col items-center justify-center space-y-12 relative py-8" id="duolingo-path-curve">
                {/* Connecting S-Line behind */}
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
                      {/* Circle Map Trigger */}
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
                        {/* Progress ring or icon */}
                        {!chap.unlocked ? (
                          <Lock className="h-7 w-7" />
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            <span className="font-display font-black text-xl tracking-tight uppercase leading-none">Nível</span>
                            <span className="text-sm font-bold font-mono">{chap.level}</span>
                          </div>
                        )}

                        {/* Top float badge percent */}
                        {chap.unlocked && (
                          <div className="absolute -top-2.5 -right-2.5 px-1.5 py-0.5 bg-[#0f172a] text-[9px] text-[#f8fafc] dark:bg-blue-500 dark:text-[#f8fafc] rounded-full font-mono font-black border border-slate-300 dark:border-blue-300">
                            {percent}%
                          </div>
                        )}
                      </button>

                      {/* Text card descriptor */}
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

          {/* Right side companion card of wisdom with mascot Corujito */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
              
              {/* Cute Mascot Mascot */}
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

              {/* Chat Speech Bubble */}
              <div className="bg-blue-50 dark:bg-[#0f172a] p-4 rounded-2xl border border-blue-200/50 dark:border-slate-800 relative text-xs text-left text-slate-700 dark:text-slate-300 leading-relaxed font-sans space-y-2">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-50 dark:bg-[#0f172a] border-t border-l border-blue-200/50 dark:border-slate-800 rotate-45"></div>
                <p className="font-semibold">"Seja muito bem-vindo, estudioso(a)!"</p>
                <p>Nesta arena gamificada, você ganha XP valiosos. Seus acertos sobem sua média do dashboard e fortificam sua ofensiva.</p>
                <p className="font-bold text-blue-600 dark:text-blue-400">Clique em qualquer círculo liberado da trilha à esquerda para decolar!</p>
              </div>

              {/* Mini Info Card about OpenRouter models */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-[11px] text-slate-450 border border-slate-200 dark:border-slate-800 text-left space-y-2 leading-relaxed">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Modelos Científicos Gratuitos:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><b>OpenRouter integration</b> que habilita assessoria personalizada.</li>
                  <li>Sessões totalmente seguras sem limites de buscas e respostas.</li>
                  <li>Dicas contextuais pedagógicas ao errar qualquer etapa técnica.</li>
                </ul>
              </div>

            </div>
          </div>

        </div>
      ) : (
        /* SESSÃO DE ESTUDO ATIVA (Duolingo Lesson Game Box screen!) */
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

              {/* Stats Grid */}
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

              {/* Footer Actions */}
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
            
            {/* Left Main interactive workspace of the lesson challenge */}
            <div className="flex-grow p-6 md:p-8 flex flex-col justify-between space-y-6 md:border-r border-slate-200 dark:border-slate-800">
              
              {/* TOP HUD ROW: Progress indicators, Hearts */}
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

                {/* Progress bar percentage */}
                <div className="w-1/3 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mx-4 relative border border-slate-200 dark:border-slate-700">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${((currentExerciseIdx + 1) / activeExercises.length) * 100}%` }}
                  ></div>
                </div>

                {/* Hearts representation of lives */}
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

              {/* MIDDLE interactive card showing appropriate exercise */}
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

                {/* dynamic exercise widgets */}
                {hearts > 0 ? (
                  <div className="space-y-4" id="dinamyc-lesson-content-swapper">
                    
                    {/* TYPE 1: MULTIPLE CHOICE */}
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

                    {/* TYPE 2: TRUE-FALSE SELECTOR */}
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

                    {/* TYPE 3: DRAG/TAP REORDER WORD BLOCKS */}
                    {activeExercises[currentExerciseIdx].type === 'reorder' && (
                      <div className="space-y-6">
                        
                        {/* Word puzzle placement slot */}
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

                        {/* Word bank pool selector */}
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

                    {/* TYPE 4: MATCHING COLUMNS (CONEXÕES DE LINHA) */}
                    {activeExercises[currentExerciseIdx].type === 'matching' && (
                      <div className="space-y-4">
                        <div className="p-2 py-2.5 bg-blue-50/45 dark:bg-[#0f172a]/45 rounded-xl border border-blue-100 dark:border-slate-800 text-[11px] text-center text-blue-600 dark:text-blue-400 font-semibold font-mono animate-pulse">
                          {matchingStatusText}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Column Left (Terms) */}
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

                          {/* Column Right (Definitions) */}
                          <div className="space-y-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Significado</span>
                            {/* We shuffle definitions or show them statically */}
                            {activeExercises[currentExerciseIdx].matchingPairs?.map((pair) => {
                              // Find key mapping
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
                  /* LIFE RUN OUT (FAIL STAGE) */
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

              {/* LOWER BANNER & ACTIONS: VERIFY OR CONTINUE WITH FEEDBACK */}
              {hearts > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  
                  {/* Explanatory visual banner is unlocked after Check */}
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
                    
                    {/* Ask AI Explanation Button */}
                    <button
                      id="btn-lesson-ask-ai"
                      type="button"
                      onClick={handleAskCorujitoIa}
                      className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 rounded-xl text-xs font-bold font-sans cursor-pointer flex items-center gap-2 shadow-sm"
                    >
                      <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                      <span>{loadingAiExplanation ? 'Invocando IA...' : 'Explicar com Corujito IA'}</span>
                    </button>

                    {/* Verify/Next Button */}
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

            {/* Right side companion panel: Corujito commenting live */}
            <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900/40 p-6 flex flex-col justify-start items-center space-y-4">
              
              <div className="text-center space-y-2">
                <span className="text-5xl animate-bounce duration-1000 block">🦉</span>
                <span className="text-[10px] font-mono uppercase bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full font-extrabold max-w-max mx-auto block leading-none">
                  Tutor de Bolso
                </span>
              </div>

              {/* Speech bubble */}
              <div className="w-full bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs leading-relaxed text-slate-700 dark:text-slate-350 relative shadow-sm">
                <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Corujito:</p>
                <p>"{getCorujitoMessage()}"</p>
              </div>

              {/* AI SPEECH POPUP ELEMENT (When AI explains) */}
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

    </div>
  );
}
