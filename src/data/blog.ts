export type ArticleBlock =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'img'; src: string; alt: string; caption?: string }
  | { type: 'quote'; text: string; source?: string };

export interface Article {
  slug: string;
  title: string;
  description: string;
  category: string;
  authorSlug: string;
  date: string;
  readingMinutes: number;
  cover: string;
  coverAlt: string;
  keywords: string[];
  blocks: ArticleBlock[];
}

export const CATEGORIES = [
  'Redação',
  'Matemática',
  'Ciências da Natureza',
  'Ciências Humanas',
  'Linguagens',
  'Métodos de Estudo',
];

export const ARTICLES: Article[] = [
  {
    slug: 'como-fazer-uma-redacao-nota-1000-no-enem',
    title: 'Como fazer uma redação nota 1000 no ENEM',
    description:
      'Um guia prático e completo sobre a estrutura da redação do ENEM, as cinco competências avaliadas e as estratégias que levam à nota máxima.',
    category: 'Redação',
    authorSlug: 'fernando-anderson',
    date: '2026-01-12',
    readingMinutes: 9,
    cover: '/media/redacao-nota-1000.svg',
    coverAlt: 'Caderno com anotações de estudo e caneta usados na preparação para a redação do ENEM',
    keywords: ['redação ENEM', 'nota 1000', 'competências', 'dissertação argumentativa'],
    blocks: [
      { type: 'p', text: 'A redação é uma das partes mais decisivas do Exame Nacional do Ensino Médio. Ela vale até 1000 pontos e, em muitos cursos concorridos, é justamente ela que separa a aprovação da reprovação. A boa notícia é que o formato do texto é conhecido e as regras são públicas: entendendo as cinco competências e o modelo dissertativo-argumentativo, é possível treinar de forma direcionada e conquistar a nota máxima.' },
      { type: 'h2', text: 'O que o ENEM espera do seu texto' },
      { type: 'p', text: 'A prova de redação pede um texto dissertativo-argumentativo, também chamado de texto opinativo. Isso significa que você deve apresentar uma tese clara sobre o tema proposto e defendê-la com argumentos consistentes, sempre respeitando os direitos humanos. Não é um texto puramente expositivo nem uma narração: você precisa assumir um ponto de vista e sustentá-lo.' },
      { type: 'p', text: 'O tema sempre tem caráter social, cultural, político ou científico. Espera-se que o candidato demonstre consciência cidadã, repertório sociocultural e capacidade de propor uma solução viável para o problema apresentado.' },
      { type: 'h2', text: 'As cinco competências avaliadas' },
      { type: 'h3', text: 'Competência 1: domínio da norma padrão' },
      { type: 'p', text: 'Avalia ortografia, pontuação, concordância, regência e uso das normas gramaticais. Erros recorrentes derrubam a nota rapidamente. Uma recomendação é revisar os erros mais comuns em provas anteriores: crase, uso da vírgula antes de conjunções e concordância verbal.' },
      { type: 'h3', text: 'Competência 2: compreensão do tema e repertório' },
      { type: 'p', text: 'Aqui se verifica se você entendeu o tema e se utiliza repertório sociocultural produtivo — dados, pesquisas, obras literárias, filmes, leis, acontecimentos históricos. O repertório precisa dialogar com o tema e ser usado para sustentar argumentos, não apenas decorado.' },
      { type: 'h3', text: 'Competência 3: projeto de texto e argumentação' },
      { type: 'p', text: 'Avalia se o texto apresenta uma organização lógica, com introdução, desenvolvimento e conclusão, e se os argumentos realmente defendem a tese. Cada parágrafo de desenvolvimento deve trabalhar uma ideia central, sustentada por evidências.' },
      { type: 'h3', text: 'Competência 4: coesão e coerência' },
      { type: 'p', text: 'Verifica o uso correto dos conectivos e mecanismos de articulação — pronomes, conjunções, advérbios. O texto precisa fluir sem repetições desnecessárias e sem quebras de sentido.' },
      { type: 'h3', text: 'Competência 5: proposta de intervenção' },
      { type: 'p', text: 'Exige uma proposta detalhada que contenha cinco elementos: ação, agente, modo/meio, finalidade e detalhamento. A intervenção deve respeitar os direitos humanos e estar relacionada ao problema discutido no texto.' },
      { type: 'img', src: '/media/estrutura-redacao.svg', alt: 'Esquema em um quadro mostrando a estrutura de uma redação: introdução, desenvolvimento e conclusão', caption: 'A estrutura básica de uma dissertação-argumentativa.' },
      { type: 'h2', text: 'Estrutura recomendada' },
      { type: 'p', text: 'Uma estrutura segura para a redação divide o texto em quatro parágrafos:' },
      { type: 'ul', items: [
        'Introdução: contextualize o tema, apresente a tese e anuncie os dois argumentos que serão desenvolvidos.',
        'Desenvolvimento 1: aprofunde o primeiro argumento com repertório e explicação.',
        'Desenvolvimento 2: desenvolva o segundo argumento, preferencialmente mostrando uma nova dimensão do problema.',
        'Conclusão: retome a tese e apresente a proposta de intervenção completa, com os cinco elementos.',
      ]},
      { type: 'h2', text: 'Repertório sociocultural que funciona' },
      { type: 'p', text: 'Repertório é um dos fatores que mais diferencia textos nota 900 de textos nota 1000. Para construir um repertório forte, organize suas referências por eixos temáticos: cidadania, tecnologia, meio ambiente, direitos humanos, educação, saúde.' },
      { type: 'quote', text: 'Um bom repertório não é o mais famoso: é o mais adequado ao argumento que você está construindo.', source: 'Equipe ApexEnem' },
      { type: 'p', text: 'Ferramentas que ajudam a encontrar referências relevantes para cada tema, como a pesquisa de repertórios do ApexEnem, economizam tempo e ampliam a variedade de referências disponíveis.' },
      { type: 'h2', text: 'Como treinar até a nota 1000' },
      { type: 'p', text: 'Escreva pelo menos uma redação por semana e receba correção por competência. Analise redações nota 1000 reais, disponibilizadas pelo INEP, e observe como cada parágrafo cumpre sua função. Com correção frequente e foco nas competências mais fracas, a evolução é rápida.' },
      { type: 'p', text: 'No ApexEnem, o módulo de redação corrige seu texto competência por competência com inteligência artificial, aponta exatamente onde estão os pontos de perda e sugere melhorias — funcionando como treino guiado até a prova.' },
    ],
  },
  {
    slug: 'repertorio-sociocultural-para-o-enem',
    title: 'Repertório sociocultural para o ENEM: o que é e como usar',
    description:
      'Entenda o que é repertório sociocultural, por que ele é decisivo na Competência 2 da redação e como montar uma biblioteca de referências que funcionam em qualquer tema.',
    category: 'Redação',
    authorSlug: 'giovanna-malgarin',
    date: '2026-01-20',
    readingMinutes: 8,
    cover: '/media/repertorio-sociocultural.svg',
    coverAlt: 'Estante de livros variados usados como repertório sociocultural em redações',
    keywords: ['repertório sociocultural', 'competência 2', 'redação ENEM', 'argumentação'],
    blocks: [
      { type: 'p', text: 'Se você já percebeu que a diferença entre uma redação nota 700 e uma redação nota 1000 está nos detalhes, provavelmente já ouviu falar em repertório sociocultural. Trata-se do conjunto de conhecimentos externos que você usa para sustentar seus argumentos: dados, obras, filmes, leis, conceitos e acontecimentos históricos.' },
      { type: 'h2', text: 'Por que o repertório importa tanto' },
      { type: 'p', text: 'A Competência 2 da redação do ENEM avalia justamente a capacidade de compreender o tema e de aplicar conhecimentos de outras áreas para sustentar um ponto de vista. Usar repertório de forma produtiva demonstra maturidade intelectual e domínio cultural, elementos muito valorizados pelos avaliadores.' },
      { type: 'p', text: 'Mas atenção: não basta citar. O repertório precisa estar integrado ao argumento, ajudando a explicar, comprovar ou aprofundar a ideia defendida. Citações soltas, que não dialogam com o texto, não contribuem para a nota.' },
      { type: 'h2', text: 'Tipos de repertório que funcionam' },
      { type: 'ul', items: [
        'Dados e pesquisas: estatísticas de institutos como IBGE, IPEA e OMS dão objetividade ao argumento.',
        'Obras literárias: livros clássicos e contemporâneos oferecem metáforas poderosas sobre a sociedade.',
        'Filmes e séries: produções audiovisuais contextualizam temas sociais de forma acessível e memorável.',
        'Leis e documentos: a Constituição, o ECA e tratados internacionais dão respaldo jurídico e ético.',
        'Filosofia e sociologia: conceitos de autores como Foucault, Hannah Arendt e Bauman explicam fenômenos sociais.',
      ]},
      { type: 'img', src: '/media/repertorio-categorias.svg', alt: 'Infográfico com categorias de repertório: filmes, livros, séries, dados, leis e filosofia', caption: 'Organize seu repertório por categorias para acessá-lo rapidamente.' },
      { type: 'h2', text: 'Como organizar sua biblioteca de repertórios' },
      { type: 'p', text: 'O erro mais comum é tentar decorar referências de forma aleatória. O ideal é organizar o repertório por eixos temáticos, de modo que você saiba rapidamente quais referências usar em cada tipo de tema.' },
      { type: 'p', text: 'Sugerimos os seguintes eixos: cidadania e direitos humanos, tecnologia e informação, meio ambiente e sustentabilidade, educação, cultura e identidade, saúde pública e desigualdade social. Para cada eixo, guarde de três a cinco referências sólidas.' },
      { type: 'h3', text: 'Exemplo de aplicação' },
      { type: 'p', text: 'Se o tema é sobre a construção da cidadania no Brasil, você pode abrir o texto com a definição de cidadania de um autor de sociologia, contextualizar com um dado histórico e aprofundar com um conceito contemporâneo. Veja como a referência não aparece isolada, mas costurada ao longo do argumento.' },
      { type: 'h2', text: 'Automatize a busca de repertórios' },
      { type: 'p', text: 'Encontrar a referência certa para cada tema consome tempo. Por isso, ferramentas como a pesquisa de repertórios do ApexEnem permitem digitar um tema e receber sugestões de filmes, livros, séries, dados, leis e conceitos filosóficos relevantes, com sinopse, ano e onde assistir ou encontrar cada obra.' },
      { type: 'p', text: 'Com uma biblioteca bem organizada e o hábito de treinar, o repertório deixa de ser um obstáculo e passa a ser o maior diferencial das suas redações.' },
    ],
  },
  {
    slug: 'como-interpretar-graficos-e-tabelas-no-enem',
    title: 'Como interpretar gráficos e tabelas no ENEM',
    description:
      'A leitura de gráficos e tabelas aparece em todas as áreas do ENEM. Aprenda um método em quatro passos para não errar questões de interpretação de dados.',
    category: 'Matemática',
    authorSlug: 'miguel-alves',
    date: '2026-02-02',
    readingMinutes: 7,
    cover: '/media/graficos-tabelas.svg',
    coverAlt: 'Tela com gráficos de barras e linhas representando dados estatísticos',
    keywords: ['gráficos', 'tabelas', 'interpretação de dados', 'ENEM matemática'],
    blocks: [
      { type: 'p', text: 'Boa parte das questões do ENEM não exige cálculos complexos, mas sim a correta leitura e interpretação de gráficos, tabelas e infográficos. Dominar esse tipo de questão é estratégico: com um método consistente, elas se tornam rápidas e seguras.' },
      { type: 'h2', text: 'Por que erramos questões de gráficos' },
      { type: 'p', text: 'O erro mais comum é responder por impulso, comparando visualmente sem verificar os dados. Escalas, unidades e títulos frequentemente escondem armadilhas. Outro erro frequente é ignorar a legenda, que define o significado de cores e símbolos.' },
      { type: 'h2', text: 'Método em quatro passos' },
      { type: 'ul', items: [
        'Leia o título e o enunciado: eles dizem exatamente o que está sendo medido e o que a questão quer.',
        'Confira eixos, unidades e escalas: verifique se começa do zero e qual a relação entre os valores.',
        'Observe a legenda: cores e símbolos têm significados específicos que mudam a interpretação.',
        'Localize os pontos relevantes: destaque apenas os dados necessários para responder, evitando distrações.',
      ]},
      { type: 'img', src: '/media/exemplo-grafico-linhas.svg', alt: 'Gráfico de linhas com eixos identificados, título, legenda e escala destacados', caption: 'Sempre identifique título, eixos, escala e legenda antes de responder.' },
      { type: 'h2', text: 'Gráficos de linhas, barras e setores' },
      { type: 'p', text: 'Cada tipo de gráfico tem uma finalidade. Gráficos de linhas mostram evolução ao longo do tempo. Gráficos de barras comparam categorias entre si. Gráficos de setores, conhecidos como pizzas, mostram a composição de um total em partes. Reconhecer o propósito do gráfico ajuda a identificar a informação principal mais rápido.' },
      { type: 'h3', text: 'Cuidado com os gráficos de setores' },
      { type: 'p', text: 'Em gráficos de pizza, o desenho pode enganar: um setor visualmente maior nem sempre representa o maior valor. Sempre confira os números ou as porcentagens indicadas.' },
      { type: 'h2', text: 'Tabelas: leitura por linhas e colunas' },
      { type: 'p', text: 'Em tabelas, o primeiro passo é entender o que cada linha e cada coluna representam. Em seguida, identifique o cruzamento de informações que a questão pede. Muitas questões de matemática do ENEM simplesmente pedem que você encontre um valor específico numa tabela — e a dificuldade está em não se perder na leitura.' },
      { type: 'h2', text: 'Treino que gera desempenho' },
      { type: 'p', text: 'Resolva questões de interpretação de dados cronometrando o tempo. Com a prática do método, você passa a identificar as armadilhas rapidamente. No ApexEnem, o simulador com correção por inteligência artificial analisa exatamente esse tipo de habilidade e aponta onde a leitura falhou.' },
    ],
  },
  {
    slug: 'cronograma-de-estudos-para-o-enem',
    title: 'Como montar um cronograma de estudos para o ENEM',
    description:
      'Um cronograma realista é a base da preparação. Veja como distribuir as disciplinas, usar técnicas de revisão e manter a constância até a prova.',
    category: 'Métodos de Estudo',
    authorSlug: 'fernando-anderson',
    date: '2026-02-15',
    readingMinutes: 8,
    cover: '/media/cronograma-estudos.svg',
    coverAlt: 'Agenda de estudos aberta com horários coloridos marcados para cada disciplina',
    keywords: ['cronograma de estudos', 'organização', 'ENEM', 'revisão'],
    blocks: [
      { type: 'p', text: 'Uma das maiores causas de queda de desempenho na preparação para o ENEM não é a falta de conteúdo, mas a falta de organização. Montar um cronograma realista e sustentável é o primeiro passo para estudar de forma consistente até o dia da prova.' },
      { type: 'h2', text: 'Comece pela sua realidade' },
      { type: 'p', text: 'Um cronograma só funciona se couber na sua rotina. Antes de distribuir disciplinas, descubra quantas horas livres você realmente tem por dia e por semana. Considere escola, trabalho, sono, deslocamento e descanso. Um plano de seis horas diárias que você não cumpre vale menos do que um plano de duas horas que você segue todos os dias.' },
      { type: 'h2', text: 'Distribua as disciplinas com estratégia' },
      { type: 'p', text: 'As áreas do ENEM têm pesos diferentes dependendo do curso escolhido. Verifique o peso de cada área no curso que você pretende seguir e priorize aquelas com maior peso — sem abandonar as demais, que continuam valendo pontos.' },
      { type: 'ul', items: [
        'Priorize as áreas de maior peso para o seu curso.',
        'Alterne matérias de exatas e humanas no mesmo dia para manter o cérebro engajado.',
        'Reserve blocos fixos para redação: pelo menos uma por semana.',
        'Inclua revisão e resolução de questões, não só leitura de conteúdo.',
      ]},
      { type: 'img', src: '/media/tecnica-pomodoro.svg', alt: 'Relógio e anotações ilustrando a técnica de estudo Pomodoro com blocos de foco e pausa', caption: 'Blocos de foco com pausas curtas aumentam a produtividade.' },
      { type: 'h2', text: 'Técnicas que melhoram a retenção' },
      { type: 'h3', text: 'Estudo em blocos com pausas' },
      { type: 'p', text: 'Divida o estudo em blocos de 25 a 50 minutos de foco, intercalados por pausas curtas. Esse formato reduz a fadiga e mantém a atenção alta ao longo do dia.' },
      { type: 'h3', text: 'Revisão espaçada' },
      { type: 'p', text: 'Revise o conteúdo em intervalos crescentes: um dia, uma semana, um mês. A revisão espaçada combate o esquecimento natural e consolida a memória de longo prazo.' },
      { type: 'h3', text: 'Aprendizagem ativa' },
      { type: 'p', text: 'Em vez de apenas reler, teste-se. Resolver questões e explicar o conteúdo em voz alta são formas de aprendizagem ativa muito mais eficazes do que a leitura passiva.' },
      { type: 'h2', text: 'A constância vale mais que a intensidade' },
      { type: 'p', text: 'Estudar quatro horas todos os dias supera, com folga, estudar doze horas num único dia e depois parar. Trate o estudo como um hábito: cumpra o cronograma mesmo nos dias em que a motivação estiver baixa, ajustando a carga quando necessário.' },
      { type: 'p', text: 'No ApexEnem, o plano de estudos com inteligência artificial adapta o cronograma ao seu ritmo, identifica pontos fracos e reorganiza as prioridades conforme você avança — como um treinador pessoal de estudos.' },
    ],
  },
  {
    slug: 'lei-de-ohms-e-eletricidade',
    title: 'Lei de Ohm e eletricidade: o guia para o ENEM',
    description:
      'Resumo direto sobre corrente elétrica, tensão, resistência e a Lei de Ohm, com aplicações e exemplos que caem na prova de Ciências da Natureza.',
    category: 'Ciências da Natureza',
    authorSlug: 'ottoni-colonnelli',
    date: '2026-02-26',
    readingMinutes: 7,
    cover: '/media/eletricidade.svg',
    coverAlt: 'Placa de circuito eletrônico com resistores, fios e componentes elétricos iluminados',
    keywords: ['Lei de Ohm', 'eletricidade', 'física ENEM', 'corrente elétrica'],
    blocks: [
      { type: 'p', text: 'A eletricidade é um dos temas mais presentes na prova de Física do ENEM. Entender corrente, tensão e resistência é essencial para resolver questões de circuitos, consumo de energia e potência — temas que aparecem todos os anos.' },
      { type: 'h2', text: 'Os três conceitos fundamentais' },
      { type: 'h3', text: 'Corrente elétrica' },
      { type: 'p', text: 'Corrente elétrica é o movimento ordenado de cargas elétricas através de um condutor. Medida em ampères (A), ela representa a quantidade de carga que atravessa uma seção do fio por segundo. Quanto maior a corrente, mais cargas passam por segundo.' },
      { type: 'h3', text: 'Tensão elétrica' },
      { type: 'p', text: 'A tensão, também chamada de diferença de potencial, é medida em volts (V). Ela representa a energia que "empurra" as cargas pelo circuito. Sem tensão, não há corrente: é a tensão que estabelece o fluxo de cargas.' },
      { type: 'h3', text: 'Resistência elétrica' },
      { type: 'p', text: 'A resistência, medida em ohms (Ω), é a oposição que o material oferece à passagem da corrente. Materiais isolantes têm alta resistência; condutores, baixa. A resistência depende do material, do comprimento e da espessura do condutor.' },
      { type: 'img', src: '/media/circuito-simples.svg', alt: 'Esquema de um circuito elétrico simples com bateria, fio condutor e resistor', caption: 'Um circuito simples é composto por fonte, condutor e carga.' },
      { type: 'h2', text: 'A Lei de Ohm' },
      { type: 'p', text: 'A Lei de Ohm relaciona as três grandezas de forma direta: a tensão é igual ao produto da corrente pela resistência.' },
      { type: 'quote', text: 'U = R · i , onde U é a tensão (V), R é a resistência (Ω) e i é a corrente (A).', source: 'Lei de Ohm' },
      { type: 'p', text: 'Isso significa que, mantendo a resistência constante, aumentar a tensão aumenta proporcionalmente a corrente. Da mesma forma, aumentando a resistência e mantendo a tensão, a corrente diminui.' },
      { type: 'h2', text: 'Potência e consumo de energia' },
      { type: 'p', text: 'A potência elétrica é a energia consumida por unidade de tempo e pode ser calculada por diferentes fórmulas, dependendo dos dados disponíveis. Questões do ENEM frequentemente pedem o cálculo do consumo de energia de aparelhos, que aparece na conta de luz em quilowatt-hora (kWh).' },
      { type: 'ul', items: [
        'Potência: P = U · i',
        'Energia consumida: E = P · Δt',
        'Conta de luz: energia em kWh multiplicada pela tarifa.',
      ]},
      { type: 'h2', text: 'Associação de resistores' },
      { type: 'p', text: 'Em série, os resistores são percorridos pela mesma corrente e a resistência equivalente é a soma das resistências. Em paralelo, todos ficam submetidos à mesma tensão e a resistência equivalente é menor que a de qualquer resistor individual. Esse é um dos tópicos mais recorrentes em questões de circuitos.' },
      { type: 'h2', text: 'Como treinar para a prova' },
      { type: 'p', text: 'Pratique resolvendo circuitos simples, calculando consumo de energia de aparelhos do dia a dia e interpretando gráficos de tensão por corrente. No ApexEnem, o simulador com correção por inteligência artificial analisa suas resoluções e identifica exatamente os conceitos que precisam ser reforçados.' },
    ],
  },
  {
    slug: 'globalizacao-e-desigualdade',
    title: 'Globalização e desigualdade: como relacionar os temas',
    description:
      'Entenda o processo de globalização, seus efeitos sociais e como conectar o tema a desigualdade, trabalho e meio ambiente nas provas de Ciências Humanas.',
    category: 'Ciências Humanas',
    authorSlug: 'miguel-alves',
    date: '2026-03-05',
    readingMinutes: 8,
    cover: '/media/globalizacao.svg',
    coverAlt: 'Mapa-múndi com linhas de conexão entre continentes representando a globalização',
    keywords: ['globalização', 'desigualdade', 'ciências humanas', 'ENEM'],
    blocks: [
      { type: 'p', text: 'Globalização é um dos temas mais recorrentes no ENEM, tanto em Ciências Humanas quanto em redação. Entender suas causas, suas fases e, principalmente, seus efeitos sociais é fundamental para responder questões que relacionam economia, cultura e desigualdade.' },
      { type: 'h2', text: 'O que é globalização' },
      { type: 'p', text: 'Globalização é o processo de integração econômica, política, cultural e social entre os países, intensificado a partir do final do século XX com o avanço das tecnologias de comunicação e transporte. Empresas passaram a produzir e vender em escala mundial, e as fronteiras econômicas se tornaram mais permeáveis.' },
      { type: 'p', text: 'O fenômeno não é novo: as Grandes Navegações e a Revolução Industrial já haviam conectado diferentes regiões do mundo. O que muda no século XXI é a velocidade e a profundidade dessas conexões.' },
      { type: 'h2', text: 'As dimensões da globalização' },
      { type: 'ul', items: [
        'Econômica: fluxo de capital, empresas transnacionais e divisão internacional do trabalho.',
        'Cultural: circulação de ideias, costumes e produtos culturais entre os países.',
        'Tecnológica: internet, redes sociais e comunicação instantânea.',
        'Política: organismos internacionais e blocos econômicos.',
      ]},
      { type: 'img', src: '/media/refugiados.svg', alt: 'Pessoas caminhando em uma estação com bagagens, representando movimentos migratórios', caption: 'Movimentos migratórios são um dos efeitos sociais da globalização.' },
      { type: 'h2', text: 'Globalização e desigualdade' },
      { type: 'p', text: 'A globalização ampliou a circulação de riquezas, mas não distribuiu os benefícios de forma igual. Enquanto centros econômicos concentram capital e tecnologia, periferias frequentemente fornecem mão de obra barata e recursos naturais. Esse desequilíbrio alimenta desigualdades entre países e dentro deles.' },
      { type: 'h3', text: 'Concentração de renda' },
      { type: 'p', text: 'A riqueza global concentra-se em poucas mãos e em poucos territórios. A distância entre os mais ricos e os mais pobres cresceu em muitos países, o que se reflete em acesso desigual à educação, à saúde e à tecnologia.' },
      { type: 'h3', text: 'Trabalho e precarização' },
      { type: 'p', text: 'A busca por custos menores levou empresas a transferir etapas da produção para regiões com salários baixos e legislação trabalhista frágil. Isso intensificou a precarização do trabalho e o fenômeno da terceirização global.' },
      { type: 'h2', text: 'Como usar o tema nas provas' },
      { type: 'p', text: 'Em questões objetivas, relacionar globalização a dados de desigualdade, fluxos migratórios e questões ambientais é muito frequente. Na redação, o tema costuma aparecer combinado a outros, como tecnologia, trabalho, cultura ou cidadania.' },
      { type: 'quote', text: 'A globalização conecta o mundo, mas também expõe as contradições entre integração econômica e justiça social.', source: 'Equipe ApexEnem' },
      { type: 'p', text: 'Para treinar, forme repertório sobre o tema usando dados de organismos internacionais, obras de sociologia e casos concretos da atualidade. Estruturar os argumentos com evidências é o que transforma uma opinião em uma questão bem respondida.' },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function articlesByAuthor(authorSlug: string): Article[] {
  return ARTICLES.filter((a) => a.authorSlug === authorSlug);
}

export function articlesByCategory(category: string): Article[] {
  return ARTICLES.filter((a) => a.category === category);
}

export function relatedArticles(article: Article, limit = 3): Article[] {
  return ARTICLES.filter((a) => a.slug !== article.slug && a.category === article.category)
    .concat(ARTICLES.filter((a) => a.slug !== article.slug && a.category !== article.category))
    .slice(0, limit);
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}
