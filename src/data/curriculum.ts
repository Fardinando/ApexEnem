import type { CurriculumSubject, CurriculumModule, CurriculumChapter } from '../types';

export const CURRICULUM: CurriculumSubject[] = [
  {
    id: 'matematica',
    name: 'Matemática',
    modules: [
      {
        id: 'mat-numeros',
        title: 'Números e Operações',
        description: 'Conjuntos numéricos, operações fundamentais, MMC, MDC, frações, decimais, potenciação e radiciação.',
        chapters: [
          { id: 'mat-num-conjuntos', title: 'Conjuntos Numéricos', description: 'Naturais, inteiros, racionais, irracionais e reais. Propriedades e operações.', difficulty: 1, estimatedMinutes: 25 },
          { id: 'mat-num-mmc-mdc', title: 'MMC e MDC', description: 'Mínimo múltiplo comum e máximo divisor comum. Decomposição em fatores primos.', difficulty: 1, estimatedMinutes: 20 },
          { id: 'mat-num-fraccoes', title: 'Frações e Decimais', description: 'Operações com frações, frações geratrizes, dízimas periódicas.', difficulty: 1, estimatedMinutes: 30 },
          { id: 'mat-num-potencia', title: 'Potenciação e Radiciação', description: 'Propriedades de potências, raiz quadrada, cubica, n-ésima. Expressões com radicais.', difficulty: 2, estimatedMinutes: 30 },
        ],
      },
      {
        id: 'mat-algebra',
        title: 'Álgebra',
        description: 'Equações, inequações, sistemas lineares, funções e expressões algébricas.',
        chapters: [
          { id: 'mat-alg-1grau', title: 'Equações do 1º Grau', description: 'Equações lineares, inequações do 1º grau, problemas de proporcionalidade.', difficulty: 1, estimatedMinutes: 25 },
          { id: 'mat-alg-2grau', title: 'Equações do 2º Grau', description: 'Discriminante, Bhaskara, relação de Viète, situações do cotidiano.', difficulty: 2, estimatedMinutes: 35 },
          { id: 'mat-alg-sistemas', title: 'Sistemas Lineares', description: 'Métodos de resolução: substituição, adição, escalonamento, regra de Cramer.', difficulty: 2, estimatedMinutes: 30 },
          { id: 'mat-alg-inequacoes', title: 'Inequações', description: 'Inequações do 1º e 2º grau, sistemas de inequações, representação na reta.', difficulty: 2, estimatedMinutes: 25 },
          { id: 'mat-alg-funcoes', title: 'Funções', description: 'Função do 1º e 2º grau, domínio, imagem, composta, inversa, função modular.', difficulty: 3, estimatedMinutes: 40 },
        ],
      },
      {
        id: 'mat-geometria',
        title: 'Geometria',
        description: 'Geometria plana, espacial e analítica. Áreas, volumes, semelhança, congruência.',
        chapters: [
          { id: 'mat-geo-plana', title: 'Geometria Plana', description: 'Triângulos, quadriláteros, polígonos, circunferência, área e perímetro.', difficulty: 2, estimatedMinutes: 35 },
          { id: 'mat-geo-espacial', title: 'Geometria Espacial', description: 'Prismas, cilindros, pirâmides, cones, esferas. Volume e área superficial.', difficulty: 2, estimatedMinutes: 35 },
          { id: 'mat-geo-analitica', title: 'Geometria Analítica', description: 'Distância entre pontos, equações de retas, ponto médio, ângulo entre retas.', difficulty: 3, estimatedMinutes: 35 },
          { id: 'mat-geo-semelhanca', title: 'Semelhança e Congruência', description: 'Critérios de semelhança e congruência, Teorema de Tales, razão trigonométrica.', difficulty: 2, estimatedMinutes: 30 },
        ],
      },
      {
        id: 'mat-trigonometria',
        title: 'Trigonometria',
        description: 'Razões trigonométricas, círculo trigonométrico, leis dos senos e cossenos.',
        chapters: [
          { id: 'mat-tri-razoes', title: 'Razões Trigonométricas', description: 'Seno, cosseno, tangente, cotangente. Triângulo retângulo.', difficulty: 2, estimatedMinutes: 30 },
          { id: 'mat-tri-circulo', title: 'Círculo Trigonométrico', description: 'Ângulos notáveis, periodicidade, arco seno, arco cosseno, arco tangente.', difficulty: 3, estimatedMinutes: 35 },
          { id: 'mat-tri-leis', title: 'Leis dos Senos e Cossenos', description: 'Aplicação em triângulos não retângulos, área de triângulo.', difficulty: 3, estimatedMinutes: 30 },
        ],
      },
      {
        id: 'mat-prob-estat',
        title: 'Probabilidade e Estatística',
        description: 'Análise combinatória, probabilidade, estatística descritiva, gráficos.',
        chapters: [
          { id: 'mat-pe-combinatoria', title: 'Análise Combinatória', description: 'Princípio multiplicativo, arranjo, permutação, combinação, triângulo de Pascal.', difficulty: 2, estimatedMinutes: 35 },
          { id: 'mat-pe-probabilidade', title: 'Probabilidade', description: 'Espaço amostral, eventos, probabilidade clássica, condicional, independente.', difficulty: 2, estimatedMinutes: 30 },
          { id: 'mat-pe-estatistica', title: 'Estatística Descritiva', description: 'Média, mediana, moda, desvio padrão, amplitude, gráficos.', difficulty: 1, estimatedMinutes: 25 },
        ],
      },
      {
        id: 'mat-progressoes',
        title: 'Progressões',
        description: 'Progressão aritmética e progressão geométrica. Propriedades e somatórios.',
        chapters: [
          { id: 'mat-prog-pa', title: 'Progressão Aritmética (PA)', description: 'Razão, termo geral, soma dos n primeiros termos, propriedades.', difficulty: 2, estimatedMinutes: 25 },
          { id: 'mat-prog-pg', title: 'Progressão Geométrica (PG)', description: 'Razão, termo geral, soma dos n primeiros termos, soma infinita.', difficulty: 2, estimatedMinutes: 30 },
        ],
      },
    ],
  },
  {
    id: 'natureza',
    name: 'Natureza',
    modules: [
      {
        id: 'nat-biologia',
        title: 'Biologia',
        description: 'Citologia, genética, ecologia, fisiologia humana e evolução.',
        chapters: [
          { id: 'nat-bio-citologia', title: 'Citologia', description: 'Células procarióticas e eucarióticas, organelas, membrana plasmática, divisão celular.', difficulty: 1, estimatedMinutes: 30 },
          { id: 'nat-bio-genetica', title: 'Genética', description: 'Leis de Mendel, heredogramas, codominância, alelos letais, ligação gênica.', difficulty: 2, estimatedMinutes: 35 },
          { id: 'nat-bio-dna', title: 'DNA e Biotecnologia', description: 'Replicação, transcrição, tradução, código genético, engenharia genética, GMO.', difficulty: 3, estimatedMinutes: 35 },
          { id: 'nat-bio-ecologia', title: 'Ecologia', description: 'Cadeias alimentares, ciclos biogeoquímicos, biomas, impacto ambiental.', difficulty: 1, estimatedMinutes: 25 },
          { id: 'nat-bio-fisiologia', title: 'Fisiologia Humana', description: 'Sistemas: circulatório, respiratório, digestório, nervoso, excretor, reprodutor.', difficulty: 2, estimatedMinutes: 35 },
          { id: 'nat-bio-evolucao', title: 'Evolução', description: 'Teorias evolutivas, seleção natural, especiação, homologia e analogia.', difficulty: 2, estimatedMinutes: 25 },
        ],
      },
      {
        id: 'nat-quimica',
        title: 'Química',
        description: 'Ligações químicas, estequiometria, soluções, química orgânica e ambiental.',
        chapters: [
          { id: 'nat-quim-ligacoes', title: 'Ligações Químicas', description: 'Iônica, covalente, metálica. Polaridade, propriedades físico-químicas.', difficulty: 1, estimatedMinutes: 25 },
          { id: 'nat-quim-estequiometria', title: 'Estequiometria', description: 'Mol, massa molar, concentração, rendimento, reações limitantes.', difficulty: 2, estimatedMinutes: 35 },
          { id: 'nat-quim-solucoes', title: 'Soluções', description: 'Tipos, concentração (molaridade, massica, fracional), diluição, propriedades coligativas.', difficulty: 2, estimatedMinutes: 30 },
          { id: 'nat-quim-organica', title: 'Química Orgânica', description: 'Hidrocarbonetos, funções orgânicas, nomenclatura, isomeria, reações orgânicas.', difficulty: 2, estimatedMinutes: 35 },
          { id: 'nat-quim-ambiental', title: 'Química Ambiental', description: 'Poluição, camada de ozônio, efeito estufa, combustíveis, energia renovável.', difficulty: 1, estimatedMinutes: 20 },
        ],
      },
      {
        id: 'nat-fisica',
        title: 'Física',
        description: 'Mecânica, termodinâmica, eletromagnetismo, óptica e ondas.',
        chapters: [
          { id: 'nat-fis-cinematica', title: 'Cinemática', description: 'MRU, MRUV, MRUP, queda livre, lançamento oblíquo, gráficos de movimento.', difficulty: 2, estimatedMinutes: 35 },
          { id: 'nat-fis-dinamica', title: 'Dinâmica', description: 'Leis de Newton, atrito, plano inclinado, força elástica, ação e reação.', difficulty: 2, estimatedMinutes: 35 },
          { id: 'nat-fis-trabalho', title: 'Trabalho e Energia', description: 'Trabalho, energia cinética, potencial, conservação, potência.', difficulty: 2, estimatedMinutes: 30 },
          { id: 'nat-fis-termo', title: 'Termodinâmica', description: 'Temperatura, calor, primeiro e segundo leis, transformações termodinâmicas.', difficulty: 2, estimatedMinutes: 30 },
          { id: 'nat-fis-eletricidade', title: 'Eletricidade', description: 'Carga, campo elétrico, potencial, circuitos, Lei de Ohm, potência elétrica.', difficulty: 2, estimatedMinutes: 35 },
          { id: 'nat-fis-optica', title: 'Óptica', description: 'Propagação reta, reflexão, refração, espelhos, lentes, fenômenos ondulatórios.', difficulty: 2, estimatedMinutes: 30 },
        ],
      },
    ],
  },
  {
    id: 'humanas',
    name: 'Humanas',
    modules: [
      {
        id: 'hum-historia',
        title: 'História do Brasil',
        description: 'Períodos históricos do Brasil: colonial, independente, república, era Vargas, ditadura.',
        chapters: [
          { id: 'hum-hist-pre', title: 'Pré-Colonial e Descobrimento', description: 'Povos originários, chegada dos portugueses, capitanias hereditárias.', difficulty: 1, estimatedMinutes: 25 },
          { id: 'hum-hist-colonial', title: 'Brasil Colônia', description: 'Ciclo do açúcar, escravidão, ouro, D. João VI, invasões holandesas.', difficulty: 1, estimatedMinutes: 30 },
          { id: 'hum-hist-imperio', title: 'Independência e Império', description: 'Independência, regências, Segundo Reinado, Guerra do Paraguai, abolição.', difficulty: 2, estimatedMinutes: 30 },
          { id: 'hum-hist-republica', title: 'República Velha', description: 'Proclamação da República, política do café com leite, revoltas, modernismo.', difficulty: 2, estimatedMinutes: 25 },
          { id: 'hum-hist-vargas', title: 'Era Vargas', description: 'Revolução de 30,Estado Novo, trabalhismo,getúlio, legado.', difficulty: 2, estimatedMinutes: 25 },
          { id: 'hum-hist-ditadura', title: 'Ditadura Militar', description: '1964-1985, AI-5, "milagre econômico", resistência, redemocratização.', difficulty: 2, estimatedMinutes: 25 },
          { id: 'hum-hist-contemporaneo', title: 'Brasil Contemporâneo', description: 'Nova República, PT, Lula, Dilma, Bolsonaro, Lula III, desafios atuais.', difficulty: 1, estimatedMinutes: 20 },
        ],
      },
      {
        id: 'hum-geografia',
        title: 'Geografia',
        description: 'Geografia do Brasil e do mundo, geopolítica, urbanização, clima, população.',
        chapters: [
          { id: 'hum-geo-brazil', title: 'Geografia do Brasil', description: 'Relevo, clima, hidrografia, biomas, regiões econômicas, divisão política.', difficulty: 1, estimatedMinutes: 30 },
          { id: 'hum-geo-populacao', title: 'Demografia e População', description: 'Transição demográfica, migração, distribuição populacional, indicadores sociais.', difficulty: 2, estimatedMinutes: 25 },
          { id: 'hum-geo-urbanizacao', title: 'Urbanização', description: 'Metrópoles, periferização, mobilidade urbana, segregação espacial.', difficulty: 2, estimatedMinutes: 25 },
          { id: 'hum-geo-geopolitica', title: 'Geopolítica Mundial', description: 'Guerra Fria, blocos econômicos, ONU, conflitos contemporâneos, BRICS.', difficulty: 2, estimatedMinutes: 30 },
          { id: 'hum-geo-meioambiente', title: 'Meio Ambiente', description: 'Desmatamento, aquecimento global, recursos hídricos, energia, sustentabilidade.', difficulty: 1, estimatedMinutes: 25 },
        ],
      },
      {
        id: 'hum-filosofia',
        title: 'Filosofia',
        description: 'Correntes filosóficas, pensadores clássicos e modernos, ética, política.',
        chapters: [
          { id: 'hum-fil-antiga', title: 'Filosofia Antiga', description: 'Sócrates, Platão, Aristóteles. Lógica, ética, política, metafísica.', difficulty: 2, estimatedMinutes: 30 },
          { id: 'hum-fil-moderna', title: 'Filosofia Moderna', description: 'Descartes, Hobbes, Locke, Rousseau, Kant. Iluminismo, contrato social.', difficulty: 2, estimatedMinutes: 30 },
          { id: 'hum-fil-contemporanea', title: 'Filosofia Contemporânea', description: 'Marx, Nietzsche, Freud, Sartre, Habermas. Existencialismo, pós-modernidade.', difficulty: 3, estimatedMinutes: 30 },
        ],
      },
      {
        id: 'hum-sociologia',
        title: 'Sociologia',
        description: 'Pensadores clássicos, movimentos sociais, cultura, identidade, desigualdade.',
        chapters: [
          { id: 'hum-soc-classicos', title: 'Sociologia Clássica', description: 'Durkheim, Weber, Marx. Fato social, burocracia, luta de classes.', difficulty: 2, estimatedMinutes: 30 },
          { id: 'hum-soc-movimentos', title: 'Movimentos Sociais', description: 'Sindicalismo, feminismo, movimentos negros, LGBTQ+, ambientalismo.', difficulty: 2, estimatedMinutes: 25 },
          { id: 'hum-soc-contemporanea', title: 'Sociedade Contemporânea', description: 'Globalização, desigualdade, cultura de massa, mídia, educação.', difficulty: 1, estimatedMinutes: 25 },
        ],
      },
    ],
  },
  {
    id: 'linguagens',
    name: 'Linguagens',
    modules: [
      {
        id: 'lin-interpretacao',
        title: 'Interpretação de Texto',
        description: 'Leitura crítica, inferência, gêneros textuais, estratégia de resolução.',
        chapters: [
          { id: 'lin-int-leitura', title: 'Técnicas de Leitura', description: 'Leitura rápida, skimming, scanning, sublinhado, resumo.', difficulty: 1, estimatedMinutes: 20 },
          { id: 'lin-int-generos', title: 'Gêneros Textuais', description: 'Notícia, artigo, crônica, charges, anúncios, textos informativos e opinativos.', difficulty: 1, estimatedMinutes: 25 },
          { id: 'lin-int-inferencia', title: 'Inferência e Implicitude', description: 'O que o texto não diz diretamente. Pressuposto, subentendido, ironia.', difficulty: 2, estimatedMinutes: 25 },
        ],
      },
      {
        id: 'lin-gramatica',
        title: 'Gramática',
        description: 'Sintaxe, concordância, regência, pontuação, crase, classes de palavras.',
        chapters: [
          { id: 'lin-gra-classes', title: 'Classes de Palavras', description: 'Substantivos, adjetivos, advérbios, verbos, pronomes, preposições, conjunções.', difficulty: 1, estimatedMinutes: 25 },
          { id: 'lin-gra-sintaxe', title: 'Análise Sintática', description: 'Sujeito, predicado, objetos, adjunto adverbial, adnominal, orações.', difficulty: 2, estimatedMinutes: 30 },
          { id: 'lin-gra-concordancia', title: 'Concordância Verbal e Nominal', description: 'Regras de concordância, sujeito coletivo, expressões partitivas.', difficulty: 2, estimatedMinutes: 25 },
          { id: 'lin-gra-regencia', title: 'Regência e Crase', description: 'Regência verbal e nominal, crase facultativa, obrigatória, proibida.', difficulty: 2, estimatedMinutes: 30 },
          { id: 'lin-gra-pontuacao', title: 'Pontuação', description: 'Vírgula, ponto e vírgula, dois-pontos, ponto final, travessão, parênteses.', difficulty: 2, estimatedMinutes: 25 },
        ],
      },
      {
        id: 'lin-linguagem',
        title: 'Linguagem e Estilo',
        description: 'Figuras de linguagem, variação linguística, oralidade, coesão.',
        chapters: [
          { id: 'lin-lin-figuras', title: 'Figuras de Linguagem', description: 'Metáfora, metonímia, antítese, hipérbole, eufemismo, ironia, personificação.', difficulty: 1, estimatedMinutes: 25 },
          { id: 'lin-lin-variacao', title: 'Variação Linguística', description: 'Norma culta, coloquial, regionalismos, gírias, registro formal e informal.', difficulty: 1, estimatedMinutes: 20 },
          { id: 'lin-lin-coesao', title: 'Coesão Textual', description: 'Referência, substituição, elipse, conjunções, sequenciação, progressão.', difficulty: 2, estimatedMinutes: 25 },
        ],
      },
      {
        id: 'lin-literatura',
        title: 'Literatura Brasileira',
        description: 'Escolas literárias, autores, obras, movimentos, contexto histórico-literário.',
        chapters: [
          { id: 'lin-lit-colonial', title: 'Literatura Colonial', description: 'Barroco, Arcadismo, Gregório de Matos, Cláudio Manuel da Costa, Basílio da Gama.', difficulty: 2, estimatedMinutes: 25 },
          { id: 'lin-lit-romantismo', title: 'Romantismo', description: 'Castro Alves, José de Alencar, Gonçalves Dias. Indianismo, mal-do-século.', difficulty: 2, estimatedMinutes: 25 },
          { id: 'lin-lit-realismo', title: 'Realismo e Naturalismo', description: 'Machado de Assis, Aluísio Azevedo. Memórias Póstumas, O Cortiço.', difficulty: 2, estimatedMinutes: 30 },
          { id: 'lin-lit-modernismo', title: 'Modernismo', description: 'Semana de 22, Mário de Andrade, Oswald de Andrade, Drummond, Clarice Lispector.', difficulty: 2, estimatedMinutes: 30 },
        ],
      },
    ],
  },
  {
    id: 'redacao',
    name: 'Redação',
    modules: [
      {
        id: 'red-estrutura',
        title: 'Estrutura e Tese',
        description: 'Estrutura do texto dissertativo-argumentativo, construção de tese, argumentação.',
        chapters: [
          { id: 'red-est-tese', title: 'Tese e Argumentação', description: 'Como construir uma tese, argumentos de autoridade, analogia, dados estatísticos.', difficulty: 1, estimatedMinutes: 25 },
          { id: 'red-est-estrutura', title: 'Estrutura do Texto', description: 'Introdução (gancho + tese), desenvolvimento (2-3 parágrafos), conclusão (proposta).', difficulty: 1, estimatedMinutes: 25 },
          { id: 'red-est-repertorio', title: 'Repertório Sociocultural', description: 'Como usar dados, leis, obras literárias, fatos históricos como argumento.', difficulty: 2, estimatedMinutes: 25 },
        ],
      },
      {
        id: 'red-mecanicas',
        title: 'Mecanismos da Escrita',
        description: 'Coesão, conectivos, norma culta, proposta de intervenção.',
        chapters: [
          { id: 'red-mec-conectivos', title: 'Coesão e Conectivos', description: 'Adição, causalidade, consecutiva, adversativa, condicional, concessiva.', difficulty: 1, estimatedMinutes: 20 },
          { id: 'red-mec-norma', title: 'Norma Culta (C1)', description: 'Concordância, regência, crase, pontuação, vocabulário preciso.', difficulty: 2, estimatedMinutes: 30 },
          { id: 'red-mec-intervencao', title: 'Proposta de Intervenção', description: 'Agentes, ações, meios, finalidades, detalhamento. Erros comuns.', difficulty: 2, estimatedMinutes: 25 },
        ],
      },
    ],
  },
];

export function getSubjectCurriculum(subjectName: string): CurriculumSubject | undefined {
  return CURRICULUM.find(s => s.name === subjectName);
}

export function getChapterById(chapterId: string): { subject: CurriculumSubject; module: CurriculumModule; chapter: CurriculumChapter } | undefined {
  for (const subject of CURRICULUM) {
    for (const mod of subject.modules) {
      const chapter = mod.chapters.find(c => c.id === chapterId);
      if (chapter) return { subject, module: mod, chapter };
    }
  }
  return undefined;
}

export function getChapterProgressKey(chapterId: string): string {
  return `chapter_${chapterId}`;
}
