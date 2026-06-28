import type { LearningChapter, Exercise } from '../types';

export const INITIAL_CHAPTERS: LearningChapter[] = [
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
  },
  {
    id: 'lin-fig',
    title: 'Figuras de Linguagem',
    area: 'Linguagens',
    description: 'Identifique metáforas, antíteses, hipérboles e outras figuras essenciais para a interpretação textual.',
    level: 0,
    maxLevel: 3,
    unlocked: false,
    xpValue: 25
  },
  {
    id: 'nat-gen',
    title: 'Genética e Hereditariedade',
    area: 'Natureza',
    description: 'Domine as leis de Mendel, heredogramas, probabilidade genética e DNA recombinante.',
    level: 0,
    maxLevel: 3,
    unlocked: false,
    xpValue: 30
  },
  {
    id: 'hum-brasil',
    title: 'Brasil Colônia e Império',
    area: 'Humanas',
    description: 'Entenda o ciclo do ouro, a escravidão, a chegada da família real e a independência do Brasil.',
    level: 0,
    maxLevel: 3,
    unlocked: false,
    xpValue: 25
  },
  {
    id: 'red-intro',
    title: 'Repertório e Contextualização',
    area: 'Redação',
    description: 'Domine as alusões históricas e filosóficas para uma introdução nota 1000.',
    level: 0,
    maxLevel: 3,
    unlocked: false,
    xpValue: 20
  },
  {
    id: 'mat-prob',
    title: 'Probabilidade e Estatística',
    area: 'Matemática',
    description: 'Resolva problemas de probabilidade, média, moda, mediana e análise de gráficos.',
    level: 0,
    maxLevel: 3,
    unlocked: false,
    xpValue: 30
  }
];

export const CHAPTER_EXERCISES: Record<string, Exercise[]> = {
  'red-tese': [
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
    },
    {
      id: 'red-tese-ex5',
      type: 'choice',
      instructions: 'Identifique a tese mais adequada para o tema "Desafios da Mobilidade Urbana no Brasil".',
      statement: 'Qual das alternativas abaixo apresenta uma tese dissertativo-argumentativa bem estruturada para o tema proposto?',
      options: [
        { letter: 'A', text: 'A mobilidade urbana no Brasil enfrenta desafios como superlotação e falta de planejamento.' },
        { letter: 'B', text: 'Diante desse cenário, torna-se urgente discutir não apenas a insuficiência do transporte público, mas também a falta de integração entre os modais.' },
        { letter: 'C', text: 'Muitas pessoas pegam ônibus todos os dias e sofrem com a demora.' },
        { letter: 'D', text: 'O trânsito nas grandes cidades brasileiras é um caos.' },
        { letter: 'E', text: 'Será que a mobilidade urbana um dia vai melhorar no Brasil?' }
      ],
      correctLetter: 'B',
      explanation: 'A tese ideal deve introduzir os dois argumentos que serão desenvolvidos nos parágrafos seguintes, com conectivo de adição ("não apenas... mas também") e posicionamento crítico claro. As demais alternativas são genéricas ou frágeis.'
    }
  ],
  'hum-med': [
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
    },
    {
      id: 'hum-med-ex4',
      type: 'choice',
      instructions: 'Escolha a alternativa correta sobre o trabalho servil.',
      statement: 'No sistema feudal, a relação entre senhores e servos era regida por obrigações mútuas. Qual das alternativas descreve corretamente a corveia?',
      options: [
        { letter: 'A', text: 'Imposto pago em dinheiro pelo uso do forno do senhor.' },
        { letter: 'B', text: 'Trabalho gratuito que o servo era obrigado a realizar nos campos do senhor alguns dias por semana.' },
        { letter: 'C', text: 'Taxa paga pelo servo para se casar com alguém de outro feudo.' },
        { letter: 'D', text: 'Direito do servo de caçar nas florestas do senhor.' },
        { letter: 'E', text: 'Multa aplicada ao servo que descumprisse as obrigações religiosas.' }
      ],
      correctLetter: 'B',
      explanation: 'A corveia era a principal obrigação servil: o servo trabalhava gratuitamente alguns dias na reserva senhorial (terras do senhor). Junto da talha (parte da produção) e das banalidades (taxas de uso), formava o conjunto de obrigações feudais.'
    },
    {
      id: 'hum-med-ex5',
      type: 'true-false',
      instructions: 'Responda sobre a influência da Igreja medieval.',
      statement: 'A Igreja Católica medieval detinha poder não apenas espiritual, mas também político e econômico, chegando a possuir cerca de um terço das terras cultiváveis da Europa Ocidental.',
      correctBoolean: true,
      explanation: 'Verdadeiro! A Igreja era a maior proprietária de terras da Idade Média. Além do dízimo obrigatório, recebia doações de nobres que buscavam salvação eterna. Seu poder político era tamanho que papas chegavam a coroar e depor reis.'
    }
  ],
  'lin-mod': [
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
    },
    {
      id: 'lin-mod-ex4',
      type: 'choice',
      instructions: 'Identifique a escola literária combatida pelos modernistas.',
      statement: 'Os modernistas de 22 criticavam duramente o Parnasianismo brasileiro. Qual característica abaixo NÃO é atribuída ao Parnasianismo?',
      options: [
        { letter: 'A', text: 'Culto à forma perfeita e à métrica rigorosa.' },
        { letter: 'B', text: 'Temas como a mitologia grega e a antiguidade clássica.' },
        { letter: 'C', text: 'Preferência por uma linguagem coloquial e brasileira.' },
        { letter: 'D', text: 'Objetividade e impessoalidade na poesia.' },
        { letter: 'E', text: 'Rimas ricas e vocabulário erudito.' }
      ],
      correctLetter: 'C',
      explanation: 'A linguagem coloquial e brasileira era uma BANDEIRA dos modernistas, não dos parnasianos. O Parnasianismo era marcado pelo preciosismo formal e linguagem erudita, distante da fala popular. Os modernistas queriam justamente "abrasileirar" a língua literária.'
    },
    {
      id: 'lin-mod-ex5',
      type: 'true-false',
      instructions: 'Responda sobre a contribuição de Tarsila do Amaral.',
      statement: 'Tarsila do Amaral foi uma pintora modernista que participou ativamente da Semana de 22 com suas obras expressionistas.',
      correctBoolean: false,
      explanation: 'Falso! Embora Tarsila do Amaral seja a pintora modernista mais célebre (autora de "Abaporu" e "Operários"), ela NÃO participou da Semana de 22, pois estava em Paris na época estudando na Academia Julian. Sua fase antropofágica começou anos depois, em 1928.'
    }
  ],
  'nat-eco': [
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
    },
    {
      id: 'nat-eco-ex4',
      type: 'choice',
      instructions: 'Analise o conceito de nicho ecológico.',
      statement: 'Dois animais de espécies diferentes que vivem no mesmo habitat e se alimentam do mesmo recurso alimentar disputam diretamente entre si. Esta relação ecológica interespecífica é classificada como:',
      options: [
        { letter: 'A', text: 'Comensalismo.' },
        { letter: 'B', text: 'Mutualismo.' },
        { letter: 'C', text: 'Competição.' },
        { letter: 'D', text: 'Predatismo.' },
        { letter: 'E', text: 'Inquilinismo.' }
      ],
      correctLetter: 'C',
      explanation: 'Competição interespecífica ocorre quando indivíduos de espécies diferentes disputam recursos limitados (alimento, espaço, luz). Segundo o Princípio de Gause, duas espécies com o mesmo nicho ecológico não podem coexistir indefinidamente — uma exclui a outra.'
    },
    {
      id: 'nat-eco-ex5',
      type: 'matching',
      instructions: 'Associe os biomas brasileiros às suas características principais:',
      statement: 'Biomas do Brasil:',
      matchingPairs: [
        { left: 'Amazônia', right: 'Maior floresta tropical do mundo, clima equatorial' },
        { left: 'Cerrado', right: 'Savana com árvores retorcidas e estações seca/chuvosa' },
        { left: 'Caatinga', right: 'Semiárido com vegetação xerófila adaptada à seca' }
      ],
      explanation: 'O Brasil possui 6 biomas principais. A Amazônia é o maior (clima equatorial úmido), o Cerrado é a savana mais biodiversa do mundo, e a Caatinga é o único bioma exclusivamente brasileiro, adaptado ao semiárido nordestino.'
    }
  ],
  'mat-r3': [
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
    },
    {
      id: 'mat-r3-ex3',
      type: 'choice',
      instructions: 'Resolva o problema de proporção envolvendo torneiras.',
      statement: 'Uma torneira despeja 45 litros de água a cada 15 minutos. Quantos litros essa mesma torneira despejará em 1 hora e 20 minutos?',
      options: [
        { letter: 'A', text: '180 litros.' },
        { letter: 'B', text: '200 litros.' },
        { letter: 'C', text: '225 litros.' },
        { letter: 'D', text: '240 litros.' },
        { letter: 'E', text: '260 litros.' }
      ],
      correctLetter: 'D',
      explanation: '45L em 15 min = 3L por minuto. 1h20 = 80 minutos. 3 x 80 = 240 litros.'
    },
    {
      id: 'mat-r3-ex4',
      type: 'true-false',
      instructions: 'Analise a afirmação sobre grandezas proporcionais.',
      statement: 'Em uma regra de três simples direta, o produto dos meios é igual ao produto dos extremos. Esta é a propriedade fundamental das proporções.',
      correctBoolean: true,
      explanation: 'Verdadeiro! A propriedade fundamental das proporções diz que, em uma proporção a/b = c/d, temos a*d = b*c (produto dos meios = produto dos extremos). É a base para resolver qualquer regra de três.'
    },
    {
      id: 'mat-r3-ex5',
      type: 'reorder',
      instructions: 'Duolingo de Matemática: ordene as palavras para formar a regra de identificação de grandezas inversamente proporcionais.',
      statement: 'Grandezas inversamente proporcionais:',
      shuffledWords: ['Quando uma', 'grandeza aumenta,', 'a outra', 'diminui na mesma', 'proporção matemática.'],
      correctSentenceWords: ['Quando uma', 'grandeza aumenta,', 'a outra', 'diminui na mesma', 'proporção matemática.'],
      explanation: 'Grandezas inversamente proporcionais andam em sentidos opostos: se uma dobra, a outra cai pela metade. Exemplo: mais operários (↑) = menos dias (↓) para a mesma obra.'
    }
  ],
  'lin-fig': [
    {
      id: 'lin-fig-ex1',
      type: 'choice',
      instructions: 'Identifique a figura de linguagem presente na frase.',
      statement: 'Na frase "O sol beijava as montanhas ao amanhecer", a figura de linguagem predominante é:',
      options: [
        { letter: 'A', text: 'Comparação.' },
        { letter: 'B', text: 'Metáfora.' },
        { letter: 'C', text: 'Proso­po­peia (personificação).' },
        { letter: 'D', text: 'Hipérbole.' },
        { letter: 'E', text: 'Ironia.' }
      ],
      correctLetter: 'C',
      explanation: 'Prosopopeia (ou personificação) atribui ações humanas a seres inanimados ou irracionais. O sol não pode "beijar" — é uma figura que humaniza a natureza. Muito comum na literatura romântica e modernista.'
    },
    {
      id: 'lin-fig-ex2',
      type: 'matching',
      instructions: 'Associe cada figura de linguagem à sua definição correta:',
      statement: 'Figuras de Linguagem:',
      matchingPairs: [
        { left: 'Metáfora', right: 'Comparação implícita sem conectivo comparativo' },
        { left: 'Antítese', right: 'Oposição entre duas ideias opostas' },
        { left: 'Hipérbole', right: 'Exagero intencional para efeito expressivo' }
      ],
      explanation: 'Metáfora: "Ela é uma flor" (comparação sem "como"). Antítese: "O amor é fogo que arde sem se ver" (oposição amor/fogo). Hipérbole: "Estou morrendo de fome" (exagero). Todas são figuras de pensamento.'
    },
    {
      id: 'lin-fig-ex3',
      type: 'true-false',
      instructions: 'Responda sobre a diferença entre metáfora e comparação.',
      statement: 'A diferença fundamental entre metáfora e comparação é que a metáfora usa conectivos comparativos (como, tal qual, feito) enquanto a comparação os omite.',
      correctBoolean: false,
      explanation: 'Falso! É exatamente o oposto. A COMPARAÇÃO usa conectivos comparativos ("Ele é forte COMO um touro"). A METÁFORA omite o conectivo, fazendo uma substituição direta ("Ele é um touro").'
    },
    {
      id: 'lin-fig-ex4',
      type: 'choice',
      instructions: 'Identifique a figura na frase de Machado de Assis.',
      statement: 'Em "Capitu, com os olhos de ressaca, fitava o mar", a expressão "olhos de ressaca" é um exemplo clássico de:',
      options: [
        { letter: 'A', text: 'Comparação.' },
        { letter: 'B', text: 'Metonímia.' },
        { letter: 'C', text: 'Catacrese.' },
        { letter: 'D', text: 'Sinestesia.' },
        { letter: 'E', text: 'Metáfora.' }
      ],
      correctLetter: 'E',
      explanation: 'Machado de Assis constrói uma metáfora genial ao comparar os olhos de Capitu a "ressaca" — sugere que eles têm o poder de "puxar" e envolver as pessoas, assim como as ondas do mar. É uma metáfora, pois não há conectivo.'
    },
    {
      id: 'lin-fig-ex5',
      type: 'true-false',
      instructions: 'Avalie a afirmação sobre eufemismo.',
      statement: 'O eufemismo é uma figura que substitui uma expressão desagradável ou chocante por uma mais suave, como em "ele foi para o andar de cima" no lugar de "ele morreu".',
      correctBoolean: true,
      explanation: 'Verdadeiro! O eufemismo suaviza a realidade. Exemplos clássicos: "desaparecer" (morrer), "funcionário público" (desempregado nas entrelinhas), "país em desenvolvimento" (subdesenvolvido).'
    }
  ],
  'nat-gen': [
    {
      id: 'nat-gen-ex1',
      type: 'choice',
      instructions: 'Resolva o problema de probabilidade genética.',
      statement: 'Em ervilhas, a cor amarela (V) é dominante sobre a verde (v) e a textura lisa (R) é dominante sobre a rugosa (r). Cruzando uma planta VvRr com outra VvRr, qual a probabilidade de nascer uma ervilha amarela e lisa?',
      options: [
        { letter: 'A', text: '1/16.' },
        { letter: 'B', text: '3/16.' },
        { letter: 'C', text: '6/16.' },
        { letter: 'D', text: '9/16.' },
        { letter: 'E', text: '12/16.' }
      ],
      correctLetter: 'D',
      explanation: 'Cruzamento diíbrido VvRr x VvRr (segunda lei de Mendel). Probabilidade de amarela (V_) = 3/4. Probabilidade de lisa (R_) = 3/4. Como são eventos independentes, multiplica-se: 3/4 x 3/4 = 9/16.'
    },
    {
      id: 'nat-gen-ex2',
      type: 'true-false',
      instructions: 'Responda sobre o DNA.', 
      statement: 'O DNA é composto por nucleotídeos formados por um grupo fosfato, uma pentose (desoxirribose) e uma base nitrogenada. As bases adenina e timina se ligam por duas pontes de hidrogênio, enquanto citosina e guanina se ligam por três.',
      correctBoolean: true,
      explanation: 'Verdadeiro! A-T formam 2 pontes de H (ligação dupla) e C-G formam 3 pontes de H (ligação tripla). É por isso que regiões ricas em C-G são mais estáveis e exigem mais energia para desnaturação térmica.'
    },
    {
      id: 'nat-gen-ex3',
      type: 'matching',
      instructions: 'Associe os processos genéticos às suas descrições:',
      statement: 'Processos moleculares:',
      matchingPairs: [
        { left: 'Replicação', right: 'Duplicação do DNA para divisão celular' },
        { left: 'Transcrição', right: 'Produção de RNA mensageiro a partir do DNA' },
        { left: 'Tradução', right: 'Síntese de proteínas nos ribossomos' }
      ],
      explanation: 'Dogma central da Biologia Molecular: DNA -> RNA -> Proteína. A replicação faz cópias do DNA, a transcrição gera mRNA, e a tradução (nos ribossomos) usa o mRNA como molde para fabricar proteínas.'
    },
    {
      id: 'nat-gen-ex4',
      type: 'choice',
      instructions: 'Analise o heredograma descrito.',
      statement: 'Uma doença genética rara aparece em todas as gerações de uma família e afeta igualmente homens e mulheres. Pais afetados sempre têm ao menos um filho afetado. Qual o padrão de herança mais provável?',
      options: [
        { letter: 'A', text: 'Herança autossômica recessiva.' },
        { letter: 'B', text: 'Herança autossômica dominante.' },
        { letter: 'C', text: 'Herança ligada ao X recessiva.' },
        { letter: 'D', text: 'Herança ligada ao Y.' },
        { letter: 'E', text: 'Herança mitocondrial.' }
      ],
      correctLetter: 'B',
      explanation: 'Padrão autossômico dominante: aparece em todas as gerações (transmissão vertical), afeta ambos os sexos igualmente, e pais afetados (heterozigotos) têm 50% de chance de ter filhos afetados. A recessiva pula gerações e a ligada ao X afeta mais homens.'
    },
    {
      id: 'nat-gen-ex5',
      type: 'true-false',
      instructions: 'Responda sobre mutações gênicas.',
      statement: 'Mutações gênicas são sempre prejudiciais ao organismo, pois alteram a sequência de DNA e comprometem a produção de proteínas funcionais.',
      correctBoolean: false,
      explanation: 'Falso! Mutações podem ser neutras, benéficas ou prejudiciais. Mutações neutras não alteram a função proteica (devido à degeneração do código genético). Mutações benéficas são a matéria-prima da evolução. Apenas algumas são deletérias.'
    }
  ],
  'hum-brasil': [
    {
      id: 'hum-brasil-ex1',
      type: 'choice',
      instructions: 'Analise a economia do Brasil Colônia.',
      statement: 'Durante o período colonial brasileiro, a economia girou em torno de ciclos extrativistas e agrícolas. O ciclo econômico que mais contribuiu para o povoamento do interior do Brasil e a formação de cidades históricas em Minas Gerais foi:',
      options: [
        { letter: 'A', text: 'O ciclo da cana-de-açúcar no Nordeste.' },
        { letter: 'B', text: 'O ciclo da borracha na Amazônia.' },
        { letter: 'C', text: 'O ciclo do ouro e dos diamantes.' },
        { letter: 'D', text: 'O ciclo do café no Vale do Paraíba.' },
        { letter: 'E', text: 'O ciclo do pau-brasil no litoral.' }
      ],
      correctLetter: 'C',
      explanation: 'O ciclo do ouro (séc. XVIII) atraiu milhares de pessoas para Minas Gerais, gerando cidades como Ouro Preto, Mariana e Tiradentes. Foi o principal responsável pela interiorização da colonização e pela transferência da capital de Salvador para o Rio de Janeiro.'
    },
    {
      id: 'hum-brasil-ex2',
      type: 'true-false',
      instructions: 'Responda sobre a vinda da família real.',
      statement: 'A vinda da Família Real Portuguesa para o Brasil em 1808 foi motivada exclusivamente por razões econômicas, já que o Brasil era a colônia mais rica de Portugal.',
      correctBoolean: false,
      explanation: 'Falso! O principal motivo foi político-militar: a invasão de Portugal pelas tropas napoleônicas. D. João VI transferiu a corte para o Rio de Janeiro sob proteção da frota inglesa para evitar a prisão da família real, abrindo os portos logo ao chegar.'
    },
    {
      id: 'hum-brasil-ex3',
      type: 'matching',
      instructions: 'Associe os períodos históricos aos eventos marcantes:',
      statement: 'Períodos do Brasil:',
      matchingPairs: [
        { left: 'Brasil Colônia (1500-1822)', right: 'Extrativismo, escravidão e pacto colonial com Portugal' },
        { left: 'Brasil Império (1822-1889)', right: 'Monarquia constitucional, café e abolição da escravatura' },
        { left: 'Brasil República (1889-hoje)', right: 'Federalismo, industrialização e demorada redemocratização' }
      ],
      explanation: 'O Brasil Colônia era regido pelo Pacto Colonial (monopólio português). O Império trouxe independência, mas manteve a escravidão até 1888. A República começou com golpe militar e passou por vários regimes até a democracia atual.'
    },
    {
      id: 'hum-brasil-ex4',
      type: 'choice',
      instructions: 'Identifique o sistema de trabalho escravo colonial.',
      statement: 'No período colonial, os escravizados eram utilizados em larga escala na lavoura, mineração e serviços urbanos. Uma forma de resistência coletiva que resultou em comunidades autossuficientes era chamada de:',
      options: [
        { letter: 'A', text: 'Capitanias Hereditárias.' },
        { letter: 'B', text: 'Quilombos.' },
        { letter: 'C', text: 'Sesmarias.' },
        { letter: 'D', text: 'Corporações de Ofício.' },
        { letter: 'E', text: 'Missões Jesuíticas.' }
      ],
      correctLetter: 'B',
      explanation: 'Quilombos eram comunidades formadas por escravizados fugidos que se organizavam em regiões de difícil acesso. O mais famoso foi Quilombo dos Palmares (AL), liderado por Zumbi. Os quilombos representavam a principal forma de resistência coletiva à escravidão.'
    },
    {
      id: 'hum-brasil-ex5',
      type: 'true-false',
      instructions: 'Responda sobre a Independência do Brasil.',
      statement: 'A Independência do Brasil, proclamada por D. Pedro I em 7 de setembro de 1822, foi um movimento popular amplamente apoiado pelas camadas mais pobres da sociedade, que exigiam o fim da escravidão e a instauração de uma república democrática.',
      correctBoolean: false,
      explanation: 'Falso! A Independência foi um processo conduzido pela elite agrária e comercial que queria manter seus privilégios. Foi um movimento conservador: manteve a monarquia, a escravidão e a estrutura social excludente. O povo foi excluído do processo.'
    }
  ],
  'red-intro': [
    {
      id: 'red-intro-ex1',
      type: 'choice',
      instructions: 'Escolha a melhor contextualização para um tema social.',
      statement: 'Para o tema "A persistência da violência contra a mulher no Brasil", qual das alternativas representa UMA contextualização adequada (repertório legítimo)?',
      options: [
        { letter: 'A', text: 'Segundo a música "Tiro ao Álvaro", de Adoniran Barbosa, a violência está em toda parte.' },
        { letter: 'B', text: 'A Constituição Federal de 1988 estabelece a igualdade de gênero como direito fundamental. No entanto, dados do Fórum Brasileiro de Segurança Pública mostram que o Brasil registrou mais de 66 mil feminicídios na última década.' },
        { letter: 'C', text: 'Eu acho muito triste que as mulheres ainda sofram violência nos dias de hoje.' },
        { letter: 'D', text: 'Segundo a revista Veja, a violência contra a mulher está aumentando.' },
        { letter: 'E', text: 'A violência contra a mulher sempre existiu desde os tempos antigos.' }
      ],
      correctLetter: 'B',
      explanation: 'A alternativa B é a única que combina repertório legítimo formal (Constituição Federal) com dado concreto (Fórum Brasileiro de Segurança Pública). Evite senso comum ("eu acho"), fontes genéricas ("revista Veja" sem dados) ou alusões vagas.'
    },
    {
      id: 'red-intro-ex2',
      type: 'true-false',
      instructions: 'Responda sobre o uso de repertório na redação ENEM.',
      statement: 'Na redação do ENEM, o uso de citações de livros, filmes e músicas é permitido como repertório sociocultural produtivo, desde que esteja explicitamente conectado ao tema e à argumentação desenvolvida.',
      correctBoolean: true,
      explanation: 'Verdadeiro! O repertório deve ser "produtivo" — não apenas decorativo. Uma citação de "1984" de George Orwell sobre vigilância pode ser usada para discutir privacidade digital, por exemplo. A banca valoriza conexão relevante, não quantidade de citações.'
    },
    {
      id: 'red-intro-ex3',
      type: 'matching',
      instructions: 'Associe cada tipo de repertório a um exemplo legítimo:',
      statement: 'Repertórios para redação:',
      matchingPairs: [
        { left: 'Filosófico', right: 'Citação de Milton Santos sobre globalização' },
        { left: 'Histórico', right: 'Referência à Revolução Industrial e às migrações' },
        { left: 'Literário', right: 'Alusão a "Vidas Secas" de Graciliano Ramos' }
      ],
      explanation: 'Repertório filosófico usa pensadores consagrados (Foucault, Bauman, Milton Santos). Histórico usa eventos passados como analogia. Literário usa obras canônicas da literatura. Todos são bem-vistos se conectados ao tema com precisão.'
    },
    {
      id: 'red-intro-ex4',
      type: 'choice',
      instructions: 'Identifique a estrutura correta de introdução ENEM.',
      statement: 'A estrutura clássica de uma introdução nota 1000 no ENEM segue tradicionalmente qual sequência lógica?',
      options: [
        { letter: 'A', text: 'Tese -> Contextualização -> Problema.' },
        { letter: 'B', text: 'Contextualização -> Tese -> Problema.' },
        { letter: 'C', text: 'Contextualização -> Problema -> Tese.' },
        { letter: 'D', text: 'Tese -> Problema -> Contextualização.' },
        { letter: 'E', text: 'Problema -> Tese -> Contextualização.' }
      ],
      correctLetter: 'C',
      explanation: 'A introdução modelo ENEM segue: 1) Contextualização (repertório que prende leitor), 2) Apresentação do Problema (tema em si), 3) Tese (posicionamento com dois argumentos). Exemplo: "Segundo Foucault... [CONTEXTO] Nesse cenário, a saúde mental... [PROBLEMA] Assim, é crucial analisar... [TESE]"'
    },
    {
      id: 'red-intro-ex5',
      type: 'true-false',
      instructions: 'Avalie o uso de dados como repertório.',
      statement: 'Dados estatísticos do IBGE, IPEA ou Datafolha são considerados repertório legítimo na redação do ENEM, desde que apresentados com fonte explícita e contextualizados ao argumento.',
      correctBoolean: true,
      explanation: 'Verdadeiro! Dados de institutos oficiais são repertório de alto valor. Exemplo: "Segundo o IBGE, 33% dos lares brasileiros não têm acesso a esgoto tratado." A fonte deve ser citada e o dado deve se conectar logicamente ao parágrafo.'
    }
  ],
  'mat-prob': [
    {
      id: 'mat-prob-ex1',
      type: 'choice',
      instructions: 'Resolva o problema de probabilidade.',
      statement: 'Em uma urna há 5 bolas vermelhas, 3 azuis e 2 verdes. Retirando-se uma bola ao acaso, qual a probabilidade de ela ser azul?',
      options: [
        { letter: 'A', text: '10%' },
        { letter: 'B', text: '20%' },
        { letter: 'C', text: '30%' },
        { letter: 'D', text: '40%' },
        { letter: 'E', text: '50%' }
      ],
      correctLetter: 'C',
      explanation: 'Total de bolas: 5+3+2 = 10. Bolas azuis: 3. Probabilidade = 3/10 = 0,3 = 30%.'
    },
    {
      id: 'mat-prob-ex2',
      type: 'true-false',
      instructions: 'Responda sobre eventos independentes.',
      statement: 'Em probabilidade, dois eventos são considerados independentes quando a ocorrência de um não afeta a probabilidade de ocorrência do outro.',
      correctBoolean: true,
      explanation: 'Verdadeiro! Eventos independentes: P(A∩B) = P(A) x P(B). Exemplo: jogar uma moeda e depois lançar um dado — o resultado de um não interfere no outro.'
    },
    {
      id: 'mat-prob-ex3',
      type: 'choice',
      instructions: 'Calcule a probabilidade com dados.',
      statement: 'Lançando-se dois dados honestos (não viciados) de 6 faces, qual a probabilidade de que a soma dos resultados seja 7?',
      options: [
        { letter: 'A', text: '1/6' },
        { letter: 'B', text: '5/36' },
        { letter: 'C', text: '1/12' },
        { letter: 'D', text: '1/9' },
        { letter: 'E', text: '1/36' }
      ],
      correctLetter: 'A',
      explanation: 'Total de combinações: 6x6 = 36. Combinações com soma 7: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) => 6 combinações. Probabilidade = 6/36 = 1/6.'
    },
    {
      id: 'mat-prob-ex4',
      type: 'matching',
      instructions: 'Associe cada medida estatística à sua definição:',
      statement: 'Medidas Estatísticas:',
      matchingPairs: [
        { left: 'Média', right: 'Soma dos valores dividida pelo número de termos' },
        { left: 'Mediana', right: 'Valor central quando os dados estão ordenados' },
        { left: 'Moda', right: 'Valor que aparece com maior frequência no conjunto' }
      ],
      explanation: 'Média aritmética é sensível a valores extremos (outliers). Mediana é mais robusta para distribuições assimétricas. Moda é útil para dados qualitativos (não numéricos).'
    },
    {
      id: 'mat-prob-ex5',
      type: 'choice',
      instructions: 'Analise o gráfico de distribuição.',
      statement: 'Em uma distribuição de notas de uma turma, a média foi 6,5 e a mediana foi 8,0. Isso sugere que:',
      options: [
        { letter: 'A', text: 'A distribuição é simétrica.' },
        { letter: 'B', text: 'A maioria dos alunos tirou notas acima da média.' },
        { letter: 'C', text: 'Existem notas muito baixas puxando a média para baixo.' },
        { letter: 'D', text: 'Todos os alunos tiraram notas entre 6,5 e 8,0.' },
        { letter: 'E', text: 'A moda é maior que a mediana.' }
      ],
      correctLetter: 'C',
      explanation: 'Quando a média (6,5) é menor que a mediana (8,0), a distribuição é assimétrica à esquerda (negativa). Isso indica que alguns alunos com notas muito baixas "puxam" a média para baixo, enquanto a mediana (ponto central) é mais alta.'
    }
  ]
};
