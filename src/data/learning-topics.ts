export interface SubjectTopic {
  id: string;
  title: string;
  description: string;
  isRecommended?: boolean;
}

export const SUBJECT_TOPICS: Record<string, SubjectTopic[]> = {
  'Matemática': [
    { id: 'mat-recomendados', title: 'Recomendados', description: 'Assuntos que você mais erra em Matemática', isRecommended: true },
    { id: 'mat-bhaskara', title: 'Bhaskara', description: 'Equações do 2º grau e a fórmula resolutiva' },
    { id: 'mat-operacoes', title: 'Adição e Subtração', description: 'Operações fundamentais, incluindo decimais e frações' },
    { id: 'mat-multiplicacao-divisao', title: 'Multiplicação e Divisão', description: 'Operações com inteiros, decimais e frações' },
    { id: 'mat-potenciacao', title: 'Potenciação e Radiciação', description: 'Propriedades de potências e raízes' },
    { id: 'mat-porcentagem', title: 'Porcentagem', description: 'Cálculo percentual, descontos e acréscimos' },
    { id: 'mat-regra-tres', title: 'Regra de Três', description: 'Proporcionalidade direta e inversa' },
    { id: 'mat-funcoes', title: 'Funções', description: 'Funções do 1º e 2º grau, domínio e imagem' },
    { id: 'mat-trigonometria', title: 'Trigonometria', description: 'Seno, cosseno, tangente e círculo trigonométrico' },
    { id: 'mat-geometria-plana', title: 'Geometria Plana', description: 'Áreas e perímetros de figuras planas' },
    { id: 'mat-geometria-espacial', title: 'Geometria Espacial', description: 'Sólidos: prismas, cilindros, cones e esferas' },
    { id: 'mat-geometria-analitica', title: 'Geometria Analítica', description: 'Plano cartesiano, retas e circunferências' },
    { id: 'mat-probabilidade', title: 'Probabilidade', description: 'Espaço amostral e cálculo de probabilidades' },
    { id: 'mat-estatistica', title: 'Estatística', description: 'Média, mediana, moda e análise de gráficos' },
    { id: 'mat-combinatoria', title: 'Análise Combinatória', description: 'Permutações, arranjos e combinações' },
    { id: 'mat-progressoes', title: 'Progressões', description: 'Progressão aritmética e geométrica' },
  ],
  'Natureza': [
    { id: 'nat-recomendados', title: 'Recomendados', description: 'Assuntos que você mais erra em Ciências da Natureza', isRecommended: true },
    { id: 'nat-genetica', title: 'Genética', description: 'Leis de Mendel, heredogramas e DNA' },
    { id: 'nat-citologia', title: 'Citologia', description: 'Células, organelas e membranas' },
    { id: 'nat-ecologia', title: 'Ecologia', description: 'Cadeias alimentares, biomas e sustentabilidade' },
    { id: 'nat-fisiologia', title: 'Fisiologia Humana', description: 'Sistemas do corpo humano' },
    { id: 'nat-quimica-organica', title: 'Química Orgânica', description: 'Hidrocarbonetos, funções orgânicas e reações' },
    { id: 'nat-estequiometria', title: 'Estequiometria', description: 'Cálculos com mol, massa e volume' },
    { id: 'nat-fisico-quimica', title: 'Físico-Química', description: 'Termoquímica, cinética e equilíbrio químico' },
    { id: 'nat-mecanica', title: 'Mecânica', description: 'Cinemática, Leis de Newton e trabalho' },
    { id: 'nat-termodinamica', title: 'Termodinâmica', description: 'Calor, temperatura e transformações de energia' },
    { id: 'nat-eletromagnetismo', title: 'Eletromagnetismo', description: 'Cargas, campos e circuitos elétricos' },
    { id: 'nat-optica', title: 'Óptica', description: 'Espelhos, lentes e fenômenos da luz' },
  ],
  'Humanas': [
    { id: 'hum-recomendados', title: 'Recomendados', description: 'Assuntos que você mais erra em Ciências Humanas', isRecommended: true },
    { id: 'hum-brasil-colonial', title: 'Brasil Colônia', description: 'Ciclo do açúcar, escravidão e economia colonial' },
    { id: 'hum-brasil-imperio', title: 'Brasil Império', description: 'Independência, Segundo Reinado e abolição' },
    { id: 'hum-eras-vargas', title: 'Era Vargas', description: '1930-1945: política, trabalhismo e Estado Novo' },
    { id: 'hum-ditadura', title: 'Ditadura Militar', description: '1964-1985: regime, AI-5 e redemocratização' },
    { id: 'hum-geopolitica', title: 'Geopolítica', description: 'Conflitos mundiais, blocos e relações internacionais' },
    { id: 'hum-clima-vegetacao', title: 'Clima e Vegetação', description: 'Climas do Brasil e do mundo, biomas' },
    { id: 'hum-urbanizacao', title: 'Urbanização', description: 'Crescimento urbano, mobilidade e segregação' },
    { id: 'hum-filosofia-antiga', title: 'Filosofia Antiga', description: 'Sócrates, Platão e Aristóteles' },
    { id: 'hum-filosofia-moderna', title: 'Filosofia Moderna', description: 'Iluminismo, Kant e contratualistas' },
    { id: 'hum-sociologia', title: 'Sociologia', description: 'Durkheim, Weber, Marx e sociedade contemporânea' },
    { id: 'hum-atualidades', title: 'Atualidades', description: 'Questões contemporâneas do Brasil e do mundo' },
  ],
  'Linguagens': [
    { id: 'lin-recomendados', title: 'Recomendados', description: 'Assuntos que você mais erra em Linguagens', isRecommended: true },
    { id: 'lin-interpretacao', title: 'Interpretação de Texto', description: 'Leitura, inferência e compreensão de gêneros' },
    { id: 'lin-figuras', title: 'Figuras de Linguagem', description: 'Metáfora, antítese, hipérbole e outras' },
    { id: 'lin-concordancia', title: 'Concordância Verbal e Nominal', description: 'Regras de concordância na norma culta' },
    { id: 'lin-regencia', title: 'Regência e Crase', description: 'Regência verbal e nominal, uso da crase' },
    { id: 'lin-pontuacao', title: 'Pontuação', description: 'Vírgula, ponto e vírgula e outros sinais' },
    { id: 'lin-literatura', title: 'Literatura Brasileira', description: 'Escolas literárias e obras do ENEM' },
    { id: 'lin-modernismo', title: 'Modernismo', description: 'Semana de 22 e as gerações modernistas' },
    { id: 'lin-generos', title: 'Gêneros Textuais', description: 'Notícia, artigo, crônica, anúncio e mais' },
    { id: 'lin-variacao', title: 'Variação Linguística', description: 'Norma culta, coloquial e regionalismos' },
  ],
  'Redação': [
    { id: 'red-recomendados', title: 'Recomendados', description: 'Competências que você mais precisa melhorar', isRecommended: true },
    { id: 'red-estrutura', title: 'Estrutura da Redação', description: 'Introdução, desenvolvimento e conclusão' },
    { id: 'red-tese', title: 'Tese e Argumentação', description: 'Construção de tese e defesa de ponto de vista' },
    { id: 'red-coesao', title: 'Coesão e Conectivos', description: 'Mecanismos coesivos e progressão textual' },
    { id: 'red-repertorio', title: 'Repertório Sociocultural', description: 'Referências legitimadas e produtivas' },
    { id: 'red-intervencao', title: 'Proposta de Intervenção', description: 'Agente, ação, meio, finalidade e detalhamento' },
    { id: 'red-competencia-1', title: 'Norma Culta (C1)', description: 'Domínio da modalidade escrita formal' },
  ],
};

export function getSubjectTopics(area: string): SubjectTopic[] {
  return SUBJECT_TOPICS[area] || [];
}
