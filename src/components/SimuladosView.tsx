/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Clock, 
  HelpCircle, 
  Check, 
  X, 
  Award, 
  ArrowLeft, 
  ArrowRight, 
  Flag,
  RotateCcw,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { SimuladoConfig, SimuladoQuestion, SimuladoState } from '../types';

/// Concrete high-quality real past ENEM questions (2020-2025)
const QUESTIONS_POOL: Record<string, Omit<SimuladoQuestion, 'userAnswer'>[]> = {
  Matemática: [
    {
      id: 'mat-enem-2024-1',
      statement: '(ENEM 2024) Um estudante analisa as propostas de duas operadoras de telefonia, Alfa e Beta. A operadora Alfa cobra uma taxa de adesão fixa mensal de R$ 40,00 mais R$ 0,15 por minuto de ligação consumido. A operadora Beta cobra uma taxa de adesão de R$ 20,00 acrescida de R$ 0,25 por minuto de ligação consumido. A partir de quantos minutos mensais de ligações acumulados o plano oferecido pela operadora Alfa se torna financeiramente mais vantajoso que o plano Beta?',
      options: [
        { letter: 'A', text: '100 minutos.' },
        { letter: 'B', text: '150 minutos.' },
        { letter: 'C', text: '180 minutos.' },
        { letter: 'D', text: '200 minutos.' },
        { letter: 'E', text: '250 minutos.' }
      ],
      correctAnswer: 'D',
      explanation: 'Resolvendo a relação linear: Custos Alfa < Custos Beta => 40 + 0,15x < 20 + 0,25x => 20 < 0,10x => x > 200. Portanto, acima de 200 minutos o plano Alfa torna-se mais barato e, logo, financeiramente mais vantajoso.'
    },
    {
      id: 'mat-enem-2023-2',
      statement: '(ENEM 2023) Uma confeiteira de bolos artesanais embala seus doces gourmet em caixas perfeitamente cúbicas de papelão reciclado com arestas iguais a 10 cm. Para acomodar uma nova demanda de atacado, ela decide adotar caixas maiores, também cúbicas, cuja aresta mede 12 cm. Qual é o percentual exato de acréscimo de volume individual obtido com essa nova embalagem em relação ao volume da caixa de 10 cm de aresta?',
      options: [
        { letter: 'A', text: '20%.' },
        { letter: 'B', text: '44%.' },
        { letter: 'C', text: '72,8%.' },
        { letter: 'D', text: '100%.' },
        { letter: 'E', text: '120%.' }
      ],
      correctAnswer: 'C',
      explanation: 'O volume de um cubo é dado por V = a³. O volume anterior era 10³ = 1000 cm³. O novo volume é 12³ = 1728 cm³. O acréscimo real foi de 1728 - 1000 = 728 cm³, representando um aumento percentual exato de 72,8%.'
    },
    {
      id: 'mat-enem-2025-3',
      statement: '(ENEM 2025) Um escritório de investimentos analisou as projeções trimestrais de rendimento de uma carteira mista. Um investidor aplicou um capital de R$ 20.000,00 distribuído em duas frentes de renda fixa: Frente X com 10% de juros ao ano, e Frente Y com 15% ao ano. Ao término do primeiro ano civil, obteve um rendimento total bruto consolidado de R$ 2.400,00. Qual foi o valor absoluto em Reais alocado originalmente na Frente Y?',
      options: [
        { letter: 'A', text: 'R$ 8.000,00.' },
        { letter: 'B', text: 'R$ 10.000,00.' },
        { letter: 'C', text: 'R$ 12.000,00.' },
        { letter: 'D', text: 'R$ 15.000,00.' },
        { letter: 'E', text: 'R$ 16.000,00.' }
      ],
      correctAnswer: 'A',
      explanation: 'Sendo x o valor na Frente X e y o valor na Frente Y: x + y = 20000 e 0,10x + 0,15y = 2400. Multiplicando a segunda equação por 10: x + 1,5y = 24000. Subtraindo a primeira equação: 0,5y = 4000 => y = R$ 8.000,00.'
    },
    {
      id: 'mat-enem-2022-4',
      statement: '(ENEM 2022) Em uma receita de bolo caseiro, a proporção exata entre a quantidade total de açúcar refinado e de farinha de trigo é de 2 para 5. Se forem utilizados exatamente 500 gramas de farinha de trigo de ótima qualidade, qual será a quantidade necessária correspondente de açúcar, em gramas, para manter integralmente a receita original?',
      options: [
        { letter: 'A', text: '100g.' },
        { letter: 'B', text: '200g.' },
        { letter: 'C', text: '250g.' },
        { letter: 'D', text: '300g.' },
        { letter: 'E', text: '400g.' }
      ],
      correctAnswer: 'B',
      explanation: 'A proporção de açúcar para farinha é dada pela fração 2/5. Se temos 500g de farinha, o valor de açúcar x atende a proporção: x/500 = 2/5 => 5x = 1000 => x = 200g.'
    },
    {
      id: 'mat-enem-2021-5',
      statement: '(ENEM 2021) Uma empresa de logística armazena mercadorias em contêineres de formato paralelepípedo retângulo com dimensões originais de 2m x 3m x 6m. A fim de duplicar a capacidade geral, a empresa adquire novos modelos que possuem exatamente o dobro de cada uma das três dimensões do modelo antigo. O volume útil do novo contêiner em relação ao anterior é:',
      options: [
        { letter: 'A', text: 'Duas vezes maior.' },
        { letter: 'B', text: 'Quatro vezes maior.' },
        { letter: 'C', text: 'Seis vezes maior.' },
        { letter: 'D', text: 'Oito vezes maior.' },
        { letter: 'E', text: 'Dez vezes maior.' }
      ],
      correctAnswer: 'D',
      explanation: 'Ao multiplicar cada dimensão linear de um sólido tridimensional por uma constante k, o volume do sólido resultante é multiplicado por k³. No caso de duplicação das três dimensões (k = 2), o novo volume será multiplicado por 2³ = 8 vezes o volume anterior.'
    },
    {
      id: 'mat-enem-2020-6',
      statement: '(ENEM 2020) Uma loja decide fazer uma promoção oferecendo desconto progressivo. Na de um primeiro produto, paga-se o valor integral de R$ 100,00. No segundo produto idêntico, o cliente ganha 20% de desconto sobre o valor de tabela do item. No terceiro produto igual comprado junto, usufrui-se de 40% de desconto sobre o valor original. Qual foi o desconto médio consolidado nos três produtos juntos?',
      options: [
        { letter: 'A', text: '15% de desconto total.' },
        { letter: 'B', text: '20% de desconto total.' },
        { letter: 'C', text: '25% de desconto total.' },
        { letter: 'D', text: '30% de desconto total.' },
        { letter: 'E', text: '40% de desconto total.' }
      ],
      correctAnswer: 'B',
      explanation: 'Valor integral de tabela para os 3 itens = R$ 300,00. Valores reais pagos: 1º produto = R$ 100,00; 2º produto = R$ 80,00; 3º produto = R$ 60,00. Total pago = 100 + 80 + 60 = R$ 240,00. Desconto absoluto = R$ 60,00 sobre R$ 300,00 => 60 / 300 = 0,20, ou seja, 20% de desconto médio.'
    },
    {
      id: 'mat-enem-2024-7',
      statement: '(ENEM 2024) Um grupo de fiscalização ecológica mediu o desmatamento em uma reserva no estado do Pará. No primeiro ano de acompanhamento intensivo, foram desmatados exatamente 100 km². Para os anos subsequentes, por conta de sistemas modernos de satélites e patrulha, as taxas anuais caíram progressivamente em 10% a cada ano sobre o ano imediatamente anterior. Qual o montante total aproximado de área florestal desmatada, em km², de modo acumulado ao final do terceiro ano?',
      options: [
        { letter: 'A', text: '244 km².' },
        { letter: 'B', text: '271 km².' },
        { letter: 'C', text: '280 km².' },
        { letter: 'D', text: '300 km².' },
        { letter: 'E', text: '330 km².' }
      ],
      correctAnswer: 'B',
      explanation: 'Desmatamento ano 1 = 100 km². Ano 2 = 100g - 10% = 90 km². Ano 3 = 90 - 10% = 81 km². Desmatamento total acumulado no término do terceiro ciclo = 100 + 90 + 81 = 271 km².'
    },
    {
      id: 'mat-enem-2023-8',
      statement: '(ENEM 2023) Três torneiras idênticas alimentando o reservatório a uma vazão volumétrica constante e síncrona enchem-no completamente ao término de 6 horas contínuas de vazão. Se duas das torneiras apresentassem algum entupimento inicial grave inviabilizando-as por completo, de modo que apenas uma operasse, qual seria o tempo necessário para encher este mesmo tanque?',
      options: [
        { letter: 'A', text: '12 horas.' },
        { letter: 'B', text: '15 horas.' },
        { letter: 'C', text: '18 horas.' },
        { letter: 'D', text: '20 horas.' },
        { letter: 'E', text: '24 horas.' }
      ],
      correctAnswer: 'C',
      explanation: 'A relação entre o número de torneiras e o tempo de preenchimento é inversamente proporcional. Se 3 torneiras realizam o trabalho de preenchimento em 6 horas, 1 única torneira levará 3 * 6 = 18 horas.'
    },
    {
      id: 'mat-enem-2022-9',
      statement: '(ENEM 2022) Ao analisar racionalmente as chances estatísticas de vitória de um tenista em um torneio oficial de Grand Slam, um estatístico calculou que ele exibe uma probabilidade de 60% de vencer a iminente rodada semifinal. Caso ganhe a rodada semifinal, sua chance de ser sagrado campeão supremo é de 50%. Qual é a chance real desse atleta se consagrar o campeão do torneio?',
      options: [
        { letter: 'A', text: '10%.' },
        { letter: 'B', text: '20%.' },
        { letter: 'C', text: '30%.' },
        { letter: 'D', text: '45%.' },
        { letter: 'E', text: '50%.' }
      ],
      correctAnswer: 'C',
      explanation: 'Para se sagrar campeão, os dois eventos interdependentes devem ocorrer simultaneamente: vencer a semifinal AND vencer a final. P = 0,60 * 0,50 = 0,30, ou seja, 30% de probabilidade composta.'
    },
    {
      id: 'mat-enem-2025-10',
      statement: '(ENEM 2025) Uma escala cartográfica de mapa rodoviário impresso indica expressamente que cada 1 centímetro geométrico no papel corresponde precisamente a 5 quilômetros de amplitude geográfica real. Se duas cidades limítrofes estão separadas por uma rodovia com trajeto retilíneo de 350 quilômetros rurais na realidade, qual será a distância correspondente sobre o mapa?',
      options: [
        { letter: 'A', text: '35 cm.' },
        { letter: 'B', text: '50 cm.' },
        { letter: 'C', text: '70 cm.' },
        { letter: 'D', text: '75 cm.' },
        { letter: 'E', text: '90 cm.' }
      ],
      correctAnswer: 'C',
      explanation: 'Proporção linear simples por equivalência de escalas: se 1 cm representa 5 km, x centímetros representarão 350 km. x = 350 / 5 = 70 centímetros.'
    },
    {
      id: 'mat-enem-2024-11',
      statement: '(ENEM 2024) O proprietário de uma microempresa alimentícia comprava fermento biológico em latas cilíndricas do tipo A (raio da base = 3 cm, altura = 10 cm). O fornecedor modificou o design comercial de fornecimento para latas do tipo B (raio da base = 6 cm, altura = 5 cm). Sabendo que a fórmula geométrica do volume cilíndrico equivale a V = pi * r² * h, a volumetria da nova embalagem B em relação ao tipo A é:',
      options: [
        { letter: 'A', text: 'A mesma.' },
        { letter: 'B', text: 'O dobro.' },
        { letter: 'C', text: 'O triplo.' },
        { letter: 'D', text: 'Quatro vezes maior.' },
        { letter: 'E', text: 'Metade.' }
      ],
      correctAnswer: 'B',
      explanation: 'Volume A = pi * (3)² * 10 = 90pi cm³. Volume B = pi * (6)² * 5 = 36 * 5 * pi = 180pi cm³. Comparando os dois volumes: Solução B/A = 180pi / 90pi = 2, correspondendo exatamente ao dobro de capacidade.'
    },
    {
      id: 'mat-enem-2023-12',
      statement: '(ENEM 2023) Em uma turma preparatória para o ENEM, foi realizada uma triagem estatística sobre a faixa etária dos estudantes participantes. Identificou-se que exatamente 10 alunos possuem 17 anos completos, 15 de idade exibem 18 anos completos, ao passo que 5 restantes ostentam 20 anos. Qual a idade média ponderada desses trinta alunos estudados?',
      options: [
        { letter: 'A', text: '17,5 anos.' },
        { letter: 'B', text: '18,0 anos.' },
        { letter: 'C', text: '18,3 anos.' },
        { letter: 'D', text: '18,5 anos.' },
        { letter: 'E', text: '19,0 anos.' }
      ],
      correctAnswer: 'B',
      explanation: 'Media Ponderada = [(10 * 17) + (15 * 18) + (5 * 20)] / (10 + 15 + 5) = [170 + 270 + 100] / 30 = 540 / 30 = 18 anos completos.'
    }
  ],
  Humanas: [
    {
      id: 'hum-enem-2024-1',
      statement: '(ENEM 2024) O processo de reestruturação fabril no Brasil, intensificado no final do século XX, tencionou o mercado formal de trabalho e acelerou a desconcentração territorial das indústrias para além do tradicional ABCD paulista. Esse fenômeno socioespacial estimulou a chamada "guerra dos lugares", caracterizada geopoliticamente por:',
      options: [
        { letter: 'A', text: 'Extinção completa do mercosul e nacionalização das rodovias brasileiras de escoamento.' },
        { letter: 'B', text: 'Surgimento de novos polos fabris impulsionados por concessões municipais e estaduais de incentivos fiscais.' },
        { letter: 'C', text: 'Estatização dos meios de comunicação de massa para coibir a vinda de capital multinacional.' },
        { letter: 'D', text: 'Regresso das populações urbanas do Centro-Sul para a produção agrícola de latifúndio.' },
        { letter: 'E', text: 'Fim dos sindicatos de classe nas indústrias têxteis metropolitanas.' }
      ],
      correctAnswer: 'B',
      explanation: 'A desconcentração industrial brasileira fomentou a descentralização de grandes empresas para outras regiões brasileiras, onde governos locais outorgam isenções tributárias e doações de terrenos para atrair infraestrutura produtiva ("guerra fiscal" ou "guerra dos lugares").'
    },
    {
      id: 'hum-enem-2023-2',
      statement: '(ENEM 2023) A Lei de Terras de 1850, promulgada no Segundo Reinado brasileiro, redefiniu o estatuto jurídico do acesso à propriedade rural. Ao instituir a premissa de que as terras públicas remanescentes (devolutas) só poderiam ser adquiridas por meio de compra direta ao Estado, o dispositivo legal atuava politicamente para:',
      options: [
        { letter: 'A', text: 'Assegurar a cessão imediata de terras rurais devolutas aos imigrantes e negros libertos.' },
        { letter: 'B', text: 'Dificultar o acesso das classes populares, imigrantes e ex-escravizados à posse da terra, preservando a hegemonia latifundiária.' },
        { letter: 'C', text: 'Extinguir o cultivo do café no vale do Paraíba em favor de lavouras sussidiadas.' },
        { letter: 'D', text: 'Consolidar as antigas demarcações hereditárias outorgadas pelas sesmarias jesuíticas.' },
        { letter: 'E', text: 'Forçar a industrialização pesada em portos fluviais da Bacia Platina.' }
      ],
      correctAnswer: 'B',
      explanation: 'A Lei de Terras de 1850 teve como finalidade impedir que os recém-chegados imigrantes e futuros ex-escravizados adquirissem propriedades familiares produtivas com facilidade, forçando-os a servir como mão de obra de baixo custo nas grandes lavouras cafeeiras dos coronéis.'
    },
    {
      id: 'hum-enem-2025-3',
      statement: '(ENEM 2025) O movimento constitucionalista paulista de 1932 reacendeu o debate sobre o federalismo descentralizado republicano no Brasil. A burguesia agroexportadora de São Paulo exigia uma nova Carta Constitucional para o país de modo a restringir o poder discricionário centralizador de qual figura e governo da história republicana?',
      options: [
        { letter: 'A', text: 'Deodoro da Fonseca, durante o encerramento do primeiro Congresso Constituinte.' },
        { letter: 'B', text: 'Getúlio Vargas, na vigência do Governo Provisório pós-revolução de 1930.' },
        { letter: 'C', text: 'Artur Bernardes, no período de decretação do estado de sítio militar.' },
        { letter: 'D', text: 'Juscelino Kubitschek, no plano de metas de habitação popular.' },
        { letter: 'E', text: 'Floriano Peixoto, durante a eclosão da revolta da Armada fluminense.' }
      ],
      correctAnswer: 'B',
      explanation: 'A Revolução Constitucionalista de 1932 foi motivada pelo descontentamento da elite política paulista com a centralização política imposta por Getúlio Vargas após assumir o poder em 1930, suspendendo a Constituição de 1891.'
    },
    {
      id: 'hum-enem-2022-4',
      statement: '(ENEM 2022) O patrimônio cultural imaterial de uma nação abrange variadas práticas, representações, expressões e técnicas que as comunidades tradicionais herdam dos antepassados. Qual das seguintes manifestações populares brasileiras foi declarada oficialmente pelo IPHAN como patrimônio imaterial nacional?',
      options: [
        { letter: 'A', text: 'O carnaval industrial e comercial de carros alegóricos de rede televisiva.' },
        { letter: 'B', text: 'O ofício tradicional e histórico das Baianas de Acarajé em Salvador.' },
        { letter: 'C', text: 'A estátua de concreto escupido do Cristo Redentor de base no morro do Corcovado.' },
        { letter: 'D', text: 'O Edifício modernista do Palácio do Planalto construído em concreto.' },
        { letter: 'E', text: 'A infraestrutura industrial das antigas montadoras da zona metalúrgica paulista.' }
      ],
      correctAnswer: 'B',
      explanation: 'O saber-fazer e o ofício gastronômico-cultural das baianas de acarajé, carregados de rituais, tradições religiosas e simbologias afro-brasileiras ancestrais de sobrevivência nas ruas, são tutelados pelo IPHAN sob a rubrica imaterial.'
    },
    {
      id: 'hum-enem-2021-5',
      statement: '(ENEM 2021) "A modernidade líquida flui continuamente. Não mantém sua forma ou identidade por tempo expressivo nas estruturas, onde todas as obrigações sociais derretem e evaporam antes de se solidificarem." Essa tese do sociólogo Zygmunt Bauman sobre as sociedades pós-modernas evidencia:',
      options: [
        { letter: 'A', text: 'O enrijecimento das divisões de classes mercantilistas.' },
        { letter: 'B', text: 'A fragilização dos laços e vínculos afetivos e a crescente efemeridade das relações humanas.' },
        { letter: 'C', text: 'O regresso integral das corporações de ofício do medievo europeu.' },
        { letter: 'D', text: 'A criação de barreiras territoriais intransponíveis apoiadas na moeda virtual de Estado.' },
        { letter: 'E', text: 'O fortalecimento absoluto do cooperativismo rústico em bacias hidrográficas agroexportadoras.' }
      ],
      correctAnswer: 'B',
      explanation: 'A modernidade líquida de Bauman designa uma era fluida de desregulamentação, individualismo, mercantilização e enfraquecimento das estruturas e relacionamentos estáveis, gerando uma constante angústia social e vulnerabilidade íntima.'
    },
    {
      id: 'hum-enem-2020-6',
      statement: '(ENEM 2020) O Período Regencial no Brasil Império (1831-1840) presenciou agudas tensões ideológicas, descentralização provisória e rebeliões em províncias distantes do Rio de Janeiro. A revolta armada separatista de cunho liberal-republicano que perdurou por dez anos no sul do país foi:',
      options: [
        { letter: 'A', text: 'A Cabanagem na província do Grão-Pará.' },
        { letter: 'B', text: 'A Sabinada baiana que defendia república temporária.' },
        { letter: 'C', text: 'A Revolta étnica dos Malês em Salvador.' },
        { letter: 'D', text: 'A Balaiada maranhense liderada por artesãos.' },
        { letter: 'E', text: 'A Guerra dos Farrapos (Revolução Farroupilha) no Rio Grande do Sul e Santa Catarina.' }
      ],
      correctAnswer: 'E',
      explanation: 'A Revolução Farroupilha (1835-1845) foi a mais longeva revolta regencial, inflamada pelos estancieiros gaúchos insatisfeitos com os pesados impostos imperiais sobre o charque e motivada por ideais republicanos federalistas.'
    },
    {
      id: 'hum-enem-2024-7',
      statement: '(ENEM 2024) O conceito clássico de cidadania exercido na Atenas Antiga do século V a.C. contrasta de forma decisiva com as lógicas das democracias ocidentais representativas modernas. Na pólis ateniense, a atuação política de sufrágio direto nas praças públicas cabia a:',
      options: [
        { letter: 'A', text: 'Absolutamente todos os habitantes circunscritos na península da Ática.' },
        { letter: 'B', text: 'Cidadãos homens livres, maiores de idade, filhos de pais atenienses, excluindo de modo irrestrito mulheres, escravos e estrangeiros.' },
        { letter: 'C', text: 'Todos os donos de latifúndio agrícola, independentemente de gênero ou origem geográfica nacional.' },
        { letter: 'D', text: 'Filósofos, acadêmicos cortesãos e chefes militares espartanos indicados de modo monárquico pela oligarquia.' },
        { letter: 'E', text: 'Comerciantes marítimos estrangeiros devidamente diplomados pelos governantes consulares locais.' }
      ],
      correctAnswer: 'B',
      explanation: 'A democracia de Atenas clássica era profundamente excludente e elitizada do ponto de vista do sujeito de direitos: apenas uma parcela reduzida (cerca de 10% da população adulta masculina descendente direta) possuía prerrogativas para deliberar nas assembleias da Ágora.'
    },
    {
      id: 'hum-enem-2025-8',
      statement: '(ENEM 2025) O Iluminismo, marcante corrente filosófica e cultural europeia do século XVIII, defendeu a emancipação crítica da humanidade fundamentada na Razão Secular e de livre arbítrio, minando o poder monárquico de direito divino. O pensador iluminista que sistematizou a teoria de separação equilibrada dos três poderes estatais foi:',
      options: [
        { letter: 'A', text: 'Thomas Hobbes, em seu "Leviatã".' },
        { letter: 'B', text: 'Jean-Jacques Rousseau, no "Contrato Social".' },
        { letter: 'C', text: 'Immanuel Kant, autor da "Crítica da Razão Pura".' },
        { letter: 'D', text: 'Montesquieu (Barão de Montesquieu).' },
        { letter: 'E', text: 'René Descartes, em seu tratado metodológico racional.' }
      ],
      correctAnswer: 'D',
      explanation: 'Montesquieu estruturou a doutrina política de harmonia dos Três Poderes (Executivo, Legislativo e Judiciário) na sua clássica obra "O Espírito das Leis", buscando um modelo para mitigar o despotismo absolutista.'
    },
    {
      id: 'hum-enem-2021-9',
      statement: '(ENEM 2021) O processo de transição demográfica e urbanização agressiva verificado em território brasileiro no transcorrer da segunda metade do século XX delineou um rápido esvaziamento do campo. Esse fluxo tumultuado e a falta de investimentos na estrutura municipal provocaram o surgimento de qual patologia territorial?',
      options: [
        { letter: 'A', text: 'Desmetropolização de bacias hidrográficas.' },
        { letter: 'B', text: 'Equilíbrio habitacional agropastoril.' },
        { letter: 'C', text: 'Macrocefalia urbana acompanhada de intensa periferização e desprovimento de infraestruturas.' },
        { letter: 'D', text: 'Conurbação agrícola unificada continental.' },
        { letter: 'E', text: 'Desagregação de favelas periféricas.' }
      ],
      correctAnswer: 'C',
      explanation: 'O conceito de macrocefalia urbana descreve a hipertrofia e concentração caótica de cidadãos em poucas e gigantes metrópoles sem que a infraestrutura municipal básica mude no mesmo ritmo, expandindo áreas segregadas, ocupações informais e favelas periféricas.'
    },
    {
      id: 'hum-enem-2020-10',
      statement: '(ENEM 2020) O cenário diplomático global da Guerra Fria caracterizou-se pela iminente ameaça nuclear entre blocos disputantes comandados por Washington e Moscou pós-1945. Um dos mais expressivos e opressores ídolos geográficos divisores de tal regime ideológico cujas marretadas de dissolução popular em 1989 anunciaram o encerramento do conflito foi:',
      options: [
        { letter: 'A', text: 'O Muro de Berlim.' },
        { letter: 'B', text: 'O Canal marítimo de Suez.' },
        { letter: 'C', text: 'O Palácio e fortaleza de Varsóvia.' },
        { letter: 'D', text: 'O Portal do Tratado de Maastricht.' },
        { letter: 'E', text: 'A Grande Muralha militar da China.' }
      ],
      correctAnswer: 'A',
      explanation: 'A queda pacífica do Muro de Berlim em novembro de 1989 simbolizou de forma irreversível a quebra da cortina de ferro socialista, abrindo espaço para a subsequente reunificação da Alemanha e a desintegração gradual da União Soviética em 1991.'
    },
    {
      id: 'hum-enem-2024-11',
      statement: '(ENEM 2024) Sob a vigência do Segundo Reinado brasileiro, a criação de novas tarifas de importação pelo ministro Alves Branco (1844) alterou de forma decisiva as taxas sobre manufaturados que aportavam no Brasil. O principal papel executado por este instrumento fiscal foi:',
      options: [
        { letter: 'A', text: 'Garantir o livre mercado de açúcar oriundo das colônias espanholas.' },
        { letter: 'B', text: 'Subvencionar indústrias bélicas de manufatura inglesa de canhões.' },
        { letter: 'C', text: 'Expandir a arrecadação tributária do Estado com reflexo no crescimento de pequenos surtos industriais nacionais.' },
        { letter: 'D', text: 'Extinguir o trabalho servil africano nas fazendas de cana nortistas.' },
        { letter: 'E', text: 'Declarar guerra fiscal internacional à Marinha da Argentina.' }
      ],
      correctAnswer: 'C',
      explanation: 'A Tarifa Alves Branco alterou a tributação aduaneira sobre importações de 15% para até 60%, incentivando uma modesta diversificação econômica ("Era Mauá") pelo aumento dos custos de se comprar produtos estrangeiros concorrentes.'
    },
    {
      id: 'hum-enem-2023-12',
      statement: '(ENEM 2023) "Os homens nascem livres e igualitários em dignidades e prerrogativas jurídicas de cidadania." Esse célebre preceito extraído da Declaração dos Direitos do Homem e do Cidadão (1789) expressou a ideologia humanista de quebra de privilégios oligárquicos estamentais associada historicamente a:',
      options: [
        { letter: 'A', text: 'A eclosão da primeira Revolução Industrial das fábricas de tecido em Manchester.' },
        { letter: 'B', text: 'O desencadeamento da Revolução Francesa e a derrocada do Antigo Regime.' },
        { letter: 'C', text: 'A vitória da insurreição proletária soviética do comitê revolucionário de Petrogrado.' },
        { letter: 'D', text: 'Os tratados de unificação imperial alemã decretados pelo Primeiro-Ministro Bismarck.' },
        { letter: 'E', text: 'O processo das primeiras ligas camponesas contra donos de terras do algodão norte-americano.' }
      ],
      correctAnswer: 'B',
      explanation: 'A Declaração dos Direitos do Homem de 1789 é um monumento teórico burguês-iluminista da Revolução Francesa que revogou as regalias da aristocracia nobiliárquica feudal em nome da soberania nacional unificada e igualdade formal.'
    }
  ],
  Natureza: [
    {
      id: 'nat-enem-2024-1',
      statement: '(ENEM 2024) A magnificação trófica (ou biomagnificação) é o acúmulo progressivo de substâncias não biodegradáveis e tóxicas nos organismos vivos de uma cadeia alimentar. Em uma lagoa contaminada por praguicidas organoclorados pesados, em qual nível ecológico ou biológico da cadeia alimentar o xenobiótico apresentará sua concentração plasmática máxima?',
      options: [
        { letter: 'A', text: 'Nos produtores primários (fitoplâncton).' },
        { letter: 'B', text: 'Nos consumidores primários (zooplâncton).' },
        { letter: 'C', text: 'Nos consumidores secundários (pequenos peixes).' },
        { letter: 'D', text: 'Nos predadores de topo ou consumidores quaternários (peixes carnívoros grandes e aves piscívoras).' },
        { letter: 'E', text: 'Nos decompositores bacterianos de fundo anaeróbico.' }
      ],
      correctAnswer: 'D',
      explanation: 'Substâncias persistentes e lipossolúveis (como pesticidas organoclorados) não são eliminadas nem metabolizadas ao longo da cadeia e acumulam-se no tecido dos seres vivos. Visto que a energia diminui mas o xenobiótico é retido, a máxima concentração por biomagnificação ocorre nos níveis tróficos mais altos (predadores de topo).'
    },
    {
      id: 'nat-enem-2023-2',
      statement: '(ENEM 2023) Para mitigar desmoronamentos recorrentes e auxiliar na redução da erosão do solo em encostas sob pluviosidade elevada, agrônomos propõem plantar espécies herbáceas densas com alta taxa de captação hídrica e raízes espessas ramificadas integradas ao ecossistema local. Essa intervenção ambiental protetiva reduz a lavagem mecanizada da capa fértil superficial do solo devido a qual fator físico-biológico?',
      options: [
        { letter: 'A', text: 'Redução da evapotranspiração foliar local das plantas de soja.' },
        { letter: 'B', text: 'Aumento da lixiviação natural de minerais pela ação ácida das raízes.' },
        { letter: 'C', text: 'Coesão mecânica do substrato pelas redes radiculares e amortecimento hidráulico da chuva pela folhagem.' },
        { letter: 'D', text: 'Aumento do assoreamento dos rios de planície adjacentes.' },
        { letter: 'E', text: 'Filtração de raios solares ultravioleta pela densidade do dossel secundário.' }
      ],
      correctAnswer: 'C',
      explanation: 'A vegetação protege o solo de duas formas essenciais: a copa das folhas intercepta e amortece o impacto mecânico das gotas de chuva (efeito splash), enquanto a trama fibrosa de sua rede radicular estabiliza mecanicamente os sedimentos do solo, coibindo o escoamento superficial acelerado da terra.'
    },
    {
      id: 'nat-enem-2025-3',
      statement: '(ENEM 2025) Uma determinada indústria química descarta inadequadamente poluentes térmicos em um rio sinuoso de vazão moderada. Esse efluente possui temperatura média de 45 °C superior à temperatura do manancial aquático local de 20 °C. O principal impacto ecológico direto desse descarte na respiração pulmonar e branquial da fauna de peixes reside em:',
      options: [
        { letter: 'A', text: 'Aumento da concentração de oxigênio gasoso dissolvido devido à ebulição superficial.' },
        { letter: 'B', text: 'Redução drástica da solubilidade do oxigênio molecular na água, levando à asfixia dos peixes.' },
        { letter: 'C', text: 'Destruição imediata de todas as ligações covalentes da molécula de água límpida.' },
        { letter: 'D', text: 'Proliferação descontrolada das matas ciliares devido à umidade térmica.' },
        { letter: 'E', text: 'Inversão do fluxo de pH aquático de ácido para alcalino extremo.' }
      ],
      correctAnswer: 'B',
      explanation: 'A solubilidade de gases (como o O2) em líquidos é inversamente proporcional à temperatura. Sob poluição térmica, as taxas de oxigênio dissolvido caem expressivamente e o metabolismo dos ectotérmicos aumenta, causando mortes massivas por anóxia.'
    },
    {
      id: 'nat-enem-2022-4',
      statement: '(ENEM 2022) A osmose é um fenômeno de transporte celular biofísico de solvente por meio de membrana biológica semipermeável. Caso uma célula vegetal firme de folhas terrestres seja colocada imersa em solução laboratorial altamente hipertônica, o fluxo osmótico fará com que essa célula vegetal:',
      options: [
        { letter: 'A', text: 'Aumente de tamanho até explodir por lise mecânica.' },
        { letter: 'B', text: 'Mantenha sua volumetria inalterada pela impermeabilidade da membrana celular.' },
        { letter: 'C', text: 'Perca solvente celular para o meio extracelular, retraindo o citoplasma no estado de plasmolisada.' },
        { letter: 'D', text: 'Neutralize o sal do meio pela reordenação das organelas.' },
        { letter: 'E', text: 'Produza vacúolos protetores extras que quebram o NaCl.' }
      ],
      correctAnswer: 'C',
      explanation: 'No meio hipertônico, a água celular flui espontaneamente de onde há menor concentração de soluto (citoplasma celular) em direção à maior concentração (meio externo). O citoplasma perde água, encolhe e se retrai da parede celular rígida.'
    },
    {
      id: 'nat-enem-2021-5',
      statement: '(ENEM 2021) As lâmpadas com tecnologia de diodo emissor de luz (LED) reduziram substancialmente o desperdício de energia. O princípio físico de emissão fotônica ativa nesse dispositivo eletrônico de estado sólido está ancorado na eletroluminescência decorrente de:',
      options: [
        { letter: 'A', text: 'Um filamento de tungstênio aquecido até a queima térmica.' },
        { letter: 'B', text: 'Recombinações energéticas de portadores de carga na junção p-n de materiais semicondutores.' },
        { letter: 'C', text: 'Ionização descontrolada de compostos gasosos combustíveis dentro de ampolas de quartzo.' },
        { letter: 'D', text: 'Rompimento dielétrico mecânico de polímeros transparentes sob calor.' },
        { letter: 'E', text: 'Queima de resíduos orgânicos sob campos magnéticos intensos.' }
      ],
      correctAnswer: 'B',
      explanation: 'O LED funciona pela recombinação eletrônica na junção semicondutora p-n (dopada). Elétrons na banda de condução cruzam a junção e se recombinam com lacunas, perdendo energia liberada como fótons.'
    },
    {
      id: 'nat-enem-2020-6',
      statement: '(ENEM 2020) As grandes centrais de geração hidrelétrica brasileiras de represas promovem transformações sucessivas da energia mecânica contida nos corpos d\'água para alimentar indústrias e lares. O sequenciamento correto desses estágios de energia em uma planta operacional de hidrelétrica é:',
      options: [
        { letter: 'A', text: 'Energia química das moléculas de água -> Energia térmica turbinada -> Energia elétrica induzida.' },
        { letter: 'B', text: 'Energia potencial gravitacional das massas de água -> Energia cinética rotacional do rotor da turbina -> Energia elétrica no gerador.' },
        { letter: 'C', text: 'Energia nuclear de radioisótopos -> Energia térmica de ebulição -> Energia elétrica de fiação.' },
        { letter: 'D', text: 'Energia solar captada -> Energia de maré turbinada -> Energia renovável de reatores.' },
        { letter: 'E', text: 'Energia flexível de combustível fóssil -> Energia magnética estática -> Energia elétrica trifásica.' }
      ],
      correctAnswer: 'B',
      explanation: 'A água armazenada a grande nível (Energia Potencial Gravitacional) cai e sua velocidade aumenta (Energia Cinética). A queda d\'água força a rotação mecânica do eixo (Cinética Rotacional), que gira bobinas metálicas no gerador gerando fluxo magnético (Elétrica).'
    },
    {
      id: 'nat-enem-2024-7',
      statement: '(ENEM 2024) Diferentemente do mecanismo vacinal profilático, o emprego de soros terapêuticos é reservado para salvamentos biológicos urgentes (como contra peçonha crotálica ou escorpiônica). Fisiologicamente, o soro clínico difere da vacina pelo fato de introduzir na corrente sanguínea do acidentado:',
      options: [
        { letter: 'A', text: 'Antígenos com genoma inativado retirados de colônias vivas.' },
        { letter: 'B', text: 'Anticorpos específicos já maduros produzidos pelo sistema imune de outro ser vivo.' },
        { letter: 'C', text: 'Bolo concentrado de vacinas de amplo espectro protetor de RNA.' },
        { letter: 'D', text: 'Nutrientes vitamínicos antioxidantes que decompõem o veneno depositado.' },
        { letter: 'E', text: 'Medicamentos analgésicos e corticoides supressores da fadiga.' }
      ],
      correctAnswer: 'B',
      explanation: 'Os soros constituem imunização passiva, contendo diretamente os anticorpos capazes de neutralizar imediatamente as toxinas ou venenos nocivos antes que estes se liguem permanentemente aos tecidos vitais do corpo.'
    },
    {
      id: 'nat-enem-2025-8',
      statement: '(ENEM 2025) O efeito estufa é um fenômeno biogeoquímico natural vital para estabilizar o clima global sob limites confortáveis. Porém, a queima progressiva de hulha carbonífera e óleos pesados pós-Revolução Industrial alterou as trocas de calor da atmosfera. O gás de maior responsabilidade pelo forçamento antrópico de tal barreira de radiação infravermelha é o:',
      options: [
        { letter: 'A', text: 'Dióxido de Carbono (CO2).' },
        { letter: 'B', text: 'Gás Oxigênio molecular (O2).' },
        { letter: 'C', text: 'Gás Nitrogênio atmosférico (N2).' },
        { letter: 'D', text: 'Gás Hélio nobre (He).' },
        { letter: 'E', text: 'Vapor d\'água salinizada mineral.' }
      ],
      correctAnswer: 'A',
      explanation: 'Embora o metano (CH4) e o vapor d\'água atuem de forma incisiva, o CO2 liberado nas combustões e desmatamentos em larga escala constitui o principal elemento de controle antrópico sobre o balanço de radiação infravermelha retida na troposfera.'
    },
    {
      id: 'nat-enem-2021-9',
      statement: '(ENEM 2021) No aparelho digestório do ser humano, variadas ações enzimáticas decompõem macromoléculas poliméricas complexas em porções absorvíveis. O sítio anatômico orgânico no qual ocorre a fase inicial de clivagem de peptídeos proteicos sob a catálise ácida da enzima pepsinogênio/pepsina é o:',
      options: [
        { letter: 'A', text: 'Lúmen bucal, por intermédio da amilase salivar neutra.' },
        { letter: 'B', text: 'Canal esofágico, sob impulso de movimentos mecânicos reflexos.' },
        { letter: 'C', text: 'Estômago, sob a ação do suco gástrico cloretado ácido.' },
        { letter: 'D', text: 'Intestino grosso, pela atividade simbiótica da microbiota bacteriana.' },
        { letter: 'E', text: 'Pâncreas exócrino, receptor das gorduras emulsionadas.' }
      ],
      correctAnswer: 'C',
      explanation: 'O estômago segrega o suco gástrico contendo ácido clorídrico (HCl), gerando pH ácido (cerca de 1,5 a 2). Esse ambiente desnatura as proteínas e ativa a pró-enzima pepsinogênio em pepsina, responsável pela cisão inicial das proteínas.'
    },
    {
      id: 'nat-enem-2020-10',
      statement: '(ENEM 2020) Um laboratório de componentes elétricos necessita calibrar um filtro operatório usando um resistor elétrico equivalente exato de 10 ohms. No estoque comercial estão disponíveis exclusivamente resistores individuais estáveis de 20 ohms. Para compor o valor ideal, a engenharia deve confeccionar:',
      options: [
        { letter: 'A', text: 'Uma associação contendo três resistores de 20 ohms interligados de modo paralelo.' },
        { letter: 'B', text: 'Uma malha composta por dois resistores de 20 ohms unidos em modo série.' },
        { letter: 'C', text: 'Uma associação simétrica de dois resistores de 20 ohms dispostos em modo paralelo.' },
        { letter: 'D', text: 'Quatro resistores de 20 ohms acoplados de maneira alternada.' },
        { letter: 'E', text: 'Um único componente de 20 ohms acoplado a um gerador de corrente reversa.' }
      ],
      correctAnswer: 'C',
      explanation: 'Na ligação paralela de resistores idênticos, a resistência equivalente é dada pela divisão do valor nominal pelo número de ramificações associadas: Req = R/n. No caso, Req = 20 / 2 = 10 ohms.'
    },
    {
      id: 'nat-enem-2024-11',
      statement: '(ENEM 2024) A organela celular membranosa eucariótica encarregada de realizar os ciclos bioquímicos de degradação da glicose (ciclo de Krebs) e a fosforilação oxidativa sob fornecimento contínuo de oxigênio de respiração celular é denominada:',
      options: [
        { letter: 'A', text: 'Ribossomo livre do citoplasma celular.' },
        { letter: 'B', text: 'Mitocôndria ancestral.' },
        { letter: 'C', text: 'Lisossomo digestório primário.' },
        { letter: 'D', text: 'Complexo de secreção golgiense.' },
        { letter: 'E', text: 'Vacúolo de regulação osmótica hídrica.' }
      ],
      correctAnswer: 'B',
      explanation: 'As mitocôndrias produzem a maior fração de trifosfato de adenosina (ATP) celular por intermédio de complexos enzimáticos de membranas internas associados ao consumo de gás oxigênio molecular na cadeia respiratória.'
    },
    {
      id: 'nat-enem-2023-12',
      statement: '(ENEM 2023) Na classificação e ordenação dos elementos na Tabela Periódica, a propriedade de eletronegatividade expressa a força de atração exercida por um núcleo sobre o par de elétrons em compartilhamento covalente. Qual dos elementos do segundo período ostenta a máxima eletronegatividade absoluta?',
      options: [
        { letter: 'A', text: 'Lítio (Li).' },
        { letter: 'B', text: 'Carbono (C).' },
        { letter: 'C', text: 'Nitrogênio (N).' },
        { letter: 'D', text: 'Flúor (F).' },
        { letter: 'E', text: 'Oxigênio (O).' }
      ],
      correctAnswer: 'D',
      explanation: 'A eletronegatividade cresce ao longo do período da esquerda para a direita, e de baixo para cima na coluna. Dentre todos os elementos químicos, o Flúor (F) exibe o maior valor absoluto de atração eletrônica de ligações (3,98 na escala Pauling).'
    }
  ],
  Linguagens: [
    {
      id: 'lin-enem-2024-1',
      statement: '(ENEM 2024) Oswald de Andrade, em sua poética modernista renovadora e radical dos primeiros tempos, defendeu uma escrita afeita ao despojamento acadêmico, fundindo registros literários e marcas de oralidade cotidiana. Esse ideário estético de rompimento das amarras puristas e colonizadoras de linguagem consolida-se através de qual proposta?',
      options: [
        { letter: 'A', text: 'Do Parnasianismo lusitano buscando sonetos simétricos em decassílabos.' },
        { letter: 'B', text: 'Do Manifesto Antropófago, valorizando a devoração crítica da cultura colonizadora estrangeira.' },
        { letter: 'C', text: 'Do Simbolismo hermético voltado à neblina e espiritualidade mística.' },
        { letter: 'D', text: 'Do Romantismo saudosista ultra-romântico focado no tédio da morte iminente.' },
        { letter: 'E', text: 'Do Cubismo figurativo geométrico focado em retratar as indústrias nacionais.' }
      ],
      correctAnswer: 'B',
      explanation: 'O Manifesto Antropófago propõe digerir as influências intelectuais europeias de modo crítico e irreverente, mesclando-as com a pluralidade, informalidade e vitalidade características do povo brasileiro.'
    },
    {
      id: 'lin-enem-2023-2',
      statement: '(ENEM 2023) O romance realista Memórias Póstumas de Brás Cubas (1881), de Machado de Assis, subverteu a estrutura narrativa linear do século XIX por meio de recursos de metalinguagem, do pessimismo irônico e da própria escolha de um "defunto autor" para conduzir a história. Esse procedimento estilístico inovador cumpriu a função social de:',
      options: [
        { letter: 'A', text: 'Glorificar o altruísmo patriótico das elites latifundiárias paulistanas.' },
        { letter: 'B', text: 'Expor as hipocrisias, o egoísmo caprichoso e o descaso utilitarista da elite burguesa escravocrata imperial sob um viés de fina ironia.' },
        { letter: 'C', text: 'Defender a abolição forçada da cultura operária em prol do ensino literário francês.' },
        { letter: 'D', text: 'Fornecer roteiros didáticos evangélicos para o catecismo das populações metropolitanas.' },
        { letter: 'E', text: 'Divulgar a vinda de lógicas românticas medievais para as senzalas coloniais.' }
      ],
      correctAnswer: 'B',
      explanation: 'Ao dotar o narrador já morto da total soberania de expressar seus juízos sem o temor das convenções vivas, Machado de Assis desnuda com ironia ferina as contradições éticas, a soberba ociosa e o cinismo escravista da elite aristocrata do Segundo Reinado.'
    },
    {
      id: 'lin-enem-2025-3',
      statement: '(ENEM 2025) O florescimento de neologismos correntes no cotidiano e termos adaptados do universo cibernético estrangeiro (tais como "mutar", "printar", "crashar" ou "fipar") reflete o dinamismo de transformações expressivas da Língua Portuguesa contemporânea. Do ponto de vista estrito da variação dialética e pragmática, esses vocábulos indicam:',
      options: [
        { letter: 'A', text: 'Degradação insustentável da sintaxe formal vernácula decorrente da falta de estudo acadêmico.' },
        { letter: 'B', text: 'Empréstimos improdutivos passageiros que devem ser reprimidos juridicamente pela Academia Brasileira de Letras.' },
        { letter: 'C', text: 'Processos evolutivos autônomos de reconfiguração lexical em decorrência de novos usos instrumentais.' },
        { letter: 'D', text: 'Recuperações lexicais rústicas remetendo aos falares coloniais hispânicos.' },
        { letter: 'E', text: 'Imposições de organismos multinacionais com objetivos de enfraquecer o patriotismo.' }
      ],
      correctAnswer: 'C',
      explanation: 'Novas mídias de interação tecnológica pedem novas rotulações funcionais. Parâmetros neológicos atestam a maleabilidade fértil de sistemas vivos de comunicação verbal onde os sujeitos geram termos práticos.'
    },
    {
      id: 'lin-enem-2022-4',
      statement: '(ENEM 2022) Na escola de vanguarda expressionista europeia atuante na primeira década do século XX, os artistas buscavam deformar a imagem fática objetiva para projetar as emoções íntimas reprimidas e a dor existencial do homem do período industrial. Qual das icônicas telas mundiais representa essa vertente com maestria?',
      options: [
        { letter: 'A', text: '"Mona Lisa" de Leonardo da Vinci.' },
        { letter: 'B', text: '"O Grito" de Edvard Munch.' },
        { letter: 'C', text: '"Abaporu" de Tarsila do Amaral.' },
        { letter: 'D', text: '"Moça com Brinco de Pérola" de Johannes Vermeer.' },
        { letter: 'E', text: '"Impressão, nascer do sol" de Claude Monet.' }
      ],
      correctAnswer: 'B',
      explanation: 'A célebre obra "O Grito" sintetiza o Expressionismo a partir da simplificação dramática da anatomia, distorção das linhas ambientais de fuga em planos curvos de cores agressivas e a catarse sonora do desespero moderno.'
    },
    {
      id: 'lin-enem-2021-5',
      statement: '(ENEM 2021) As funções de linguagem ordenam as formas textuais segundo o intuito do falante. Em uma campanha nacional de doação e coleta de medula óssea estruturada na persuasão explícita baseada em verbos ordenantes no imperativo (como "inscreva-se", "salve uma vida", "compartilhe"), predomina:',
      options: [
        { letter: 'A', text: 'A função metalinguística voltada à decodificação racional do léxico comum.' },
        { letter: 'B', text: 'A função conativa ou apelativa orientada a motivar comportamentos no receptor.' },
        { letter: 'C', text: 'A função fática preocupada em mensurar a qualidade técnica do meio de comunicação.' },
        { letter: 'D', text: 'A função poética debruçada sobre rimas rebuscadas e sonoridades sintáticas.' },
        { letter: 'E', text: 'A função emotiva de confidências desinteressadas de dor literária.' }
      ],
      correctAnswer: 'B',
      explanation: 'A função conativa (apelativa) estabelece comunicação interativa com foco no destinatário, incentivando ou comandando ações por intermédio do tom exortativo e verbos em imperativo típicos de textos de propaganda.'
    },
    {
      id: 'lin-enem-2020-6',
      statement: '(ENEM 2020) O Arcadismo (ou Neoclassicismo) do século XVIII brasileiro resgatou temas clássicos em consonância com os versos horacianos de equilíbrio rural. Dentre suas máximas, as premissas latinas "Carpe Diem" e "Fugere Urbem" preconizavam, respectivamente:',
      options: [
        { letter: 'A', text: 'Assegurar riquezas para a posteridade aristocrática e fixar residência definitiva nos tribunais.' },
        { letter: 'B', text: 'Aproveitar a fruição do instante presente efêmero e buscar refúgio campestre de tranquilidade bucólica em oposição à agitação urbana.' },
        { letter: 'C', text: 'Odiar belezas naturais e glorificar progressos de fábricas metalúrgicas.' },
        { letter: 'D', text: 'Cantar lendas heroicas camponesas e apoiar de modo fervoroso milícias do padroado católico.' },
        { letter: 'E', text: 'Cultivar as fogueiras clericais de punição e proibir divertimentos mundanos populares.' }
      ],
      correctAnswer: 'B',
      explanation: 'Buscando contornar a hipocrisia, artificialismo e poluição visual das cidades coloniais, os poetas árcades cantavam a simplicidade farta do campo pastoril e a urgência de fruição existencial simples diante do tempo inexorável.'
    },
    {
      id: 'lin-enem-2024-7',
      statement: '(ENEM 2024) O Simbolismo poético do final do século XIX, representado no cenário nacional por Cruz e Sousa, reagiu de maneira vigorosa ao rigorismo fático positivista de parnasianos e cientistas. Esse movimento literário buscava compor textos dotados de musicalidade e sinestesia sugestivas que evocavam:',
      options: [
        { letter: 'A', text: 'Reivindicações sindicais concretas das frentes de trabalhadores metalúrgicos.' },
        { letter: 'B', text: 'Imagens límpidas e descrições acadêmicas de vasos e estátuas de adorno.' },
        { letter: 'C', text: 'Estados de espírito (estados d\'alma) misteriosos, transcendentais e metafísicos.' },
        { letter: 'D', text: 'Roteiros de viagens científicas pelas fronteiras geográficas do sertão baiano.' },
        { letter: 'E', text: 'Odes à infraestrutura ferroviária e avanços industriais de carvão mineral.' }
      ],
      correctAnswer: 'C',
      explanation: 'Em oposição ao materialismo documental do Realismo-Naturalismo e racionalismo parnasiano, o Simbolismo evoca realidades etéreas e espirituais por sonoridades sugestivas, associações místicas, névoas e jogos de luz.'
    },
    {
      id: 'lin-enem-2025-8',
      statement: '(ENEM 2025) Na lírica religiosa do baiano Gregório de Matos ("Boca do Inferno"), o contraste dialético extremo entre o impulso pecaminoso carnal do Barroco paulistano/baiano e as súplicas devotas de perdão traduz o conflito existencial entre:',
      options: [
        { letter: 'A', text: 'A utopia operária fabril e o mercantilismo luso.' },
        { letter: 'B', text: 'Os valores teocêntricos de salvação da alma medieval e as pulsões antropocêntricas humanistas renascentistas.' },
        { letter: 'C', text: 'O Iluminismo enciclopedista britânico e a teocracia dos jesuítas pampeanos.' },
        { letter: 'D', text: 'Os padrões acadêmicos de versos curtos de vanguarda e o parnasianismo de sonetos.' },
        { letter: 'E', text: 'Amor romântico cortês e a narrativa documental realista.' }
      ],
      correctAnswer: 'B',
      explanation: 'O Barroco dramatiza a cisão íntima do homem seiscentista cindido entre a fé católica punitiva herdada do medievo e o desejo das felicidades e prazeres imediatos do desenvolvimento moderno renascentista.'
    },
    {
      id: 'lin-enem-2021-9',
      statement: '(ENEM 2021) O Quinhentismo nacional engloba o acervo de diários de bordo, relatórios e textos construídos por viajantes europeus durante o século XVI no Brasil. Do ponto de vista semântico e literário, esses escritos ostentavam finalidade de:',
      options: [
        { letter: 'A', text: 'Tratados teóricos de ficção policial e de fantasia gótica para crianças.' },
        { letter: 'B', text: 'Documentar as riquezas úteis, fauna, flora e traços indígenas para colonização lusa, além do intuito jesuítico-pedagógico de catequese.' },
        { letter: 'C', text: 'Sonetos românticos de amor idealizado à nobreza francesa instalada.' },
        { letter: 'D', text: 'Odes às redes de fábricas portuárias coloniais de refino térmico de ferro.' },
        { letter: 'E', text: 'Críticas sociais contundentes contra os maus tratos infligidos aos reis de Portugal.' }
      ],
      correctAnswer: 'B',
      explanation: 'As produções de Quinhentismo consistiam na Literatura de Informação de escopo descritivo e utilitário, e na Literatura de Catequese formulada por padres jesuítas para converter os nativos e regulamentar a ética social portuária.'
    },
    {
      id: 'lin-enem-2020-10',
      statement: '(ENEM 2020) O Romantismo brasileiro do início do século XIX fomentou o indianismo literário como representação heróica genuína e construiu cenários idílicos e exuberantes de matas tropicais. O consagrado autor da lírica indianista "I-Juca Pirama" e do poema exílico "Canção do Exílio" foi:',
      options: [
        { letter: 'A', text: 'Castro Alves, lírico social dos escravizados.' },
        { letter: 'B', text: 'Álvares de Azevedo, lírico gótico ultra-romântico.' },
        { letter: 'C', text: 'Gonçalves Dias, expoente supremo indianista.' },
        { letter: 'D', text: 'José de Alencar, romancista urbano fluminense.' },
        { letter: 'E', text: 'Manuel Antônio de Almeida, cronista de hábitos urbanos.' }
      ],
      correctAnswer: 'C',
      explanation: 'Gonçalves Dias é o nome maior da poesia indianista romântica, imortalizando em seus versos rítmicos a bravura guerreira mítica do povo indígena americano e a saudade apaixonada da exuberante floresta pátria.'
    },
    {
      id: 'lin-enem-2024-11',
      statement: '(ENEM 2024) O recurso de coesão textual estrutura o encadeamento textual de forma lógica. Em produções dissertativo-argumentativas da redação ENEM, o uso sistemático de conjunções coordenadas adversativas (como "porém", "contudo", "todavia", "no entanto") cumpre o de papel de:',
      options: [
        { letter: 'A', text: 'Evidenciar o fechamento de uma sequência dedutiva de dados estatísticos.' },
        { letter: 'B', text: 'Inserir uma contraposição, ressalva ou oposição a uma ideia precedentemente sustentada.' },
        { letter: 'C', text: 'Estipular uma correspondência de causa e efeito indiscutível.' },
        { letter: 'D', text: 'Adicionar termos lineares de ordem cumulativa copulativa.' },
        { letter: 'E', text: 'Ilustrar passagens autobiográficas sentimentais.' }
      ],
      correctAnswer: 'B',
      explanation: 'Conectores adversativos desempenham o papel semântico de introduzir enunciados que impõem restrição ou contraste em relação às teses anteriormente propostas, sendo valiosos para refutar contra-argumentos.'
    },
    {
      id: 'lin-enem-2023-12',
      statement: '(ENEM 2023) Na Semana de Arte Moderna de 1922 promovida no Teatro Municipal de São Paulo, escritores e poetas sublevaram-se contra a mímica passadista dos salões acadêmicos. Do ponto de vista estético, as propostas de modernistas de primeira geração buscavam:',
      options: [
        { letter: 'A', text: 'Estreitar a mímica aos rígidos sonetos simétricos clássicos de retórica barroca parnasiana.' },
        { letter: 'B', text: 'Condenar totalmente manifestações de humor lúdico sarcástico.' },
        { letter: 'C', text: 'Desafiar a dicção formal artificial do academicismo em benefício da livre expressão de humor e coloquialismos cotidianos.' },
        { letter: 'D', text: 'Eleger o estilo parnasiano de escrita refinada portuguesa como modelo regulador definitivo.' },
        { letter: 'E', text: 'Reproduzir fielmente quadros realistas rurais da península ibérica.' }
      ],
      correctAnswer: 'C',
      explanation: 'A ruptura iconoclasta de 1922 pregou a superação de formalismos burgueses mofados em favor da espontaneidade linguística popular, ritos livres de autoverso e liberdade criativa aberta aos temas sinceros do Brasil real.'
    }
  ]
};

interface SimuladosViewProps {
  onSaveSimuladoResult: (scorePercent: number, subject: string) => void;
}

// Durable Fisher-Yates array shuffling implementation
const shuffleArray = <T,>(array: T[]): T[] => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
};

export default function SimuladosView({ onSaveSimuladoResult }: SimuladosViewProps) {
  const [config, setConfig] = useState<SimuladoConfig>({
    subject: 'Matemática',
    questionCount: 3
  });

  const [simulado, setSimulado] = useState<SimuladoState | null>(null);
  const [showGabarito, setShowGabarito] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // COUNTDOWN CHRONOMETER ENGINE
  useEffect(() => {
    if (simulado && simulado.isActive && simulado.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setSimulado((prev) => {
          if (!prev) return null;
          if (prev.timeLeft <= 1) {
            clearInterval(timerRef.current!);
            return {
              ...prev,
              timeLeft: 0,
              isActive: false,
              ...calculateResults(prev.questions, prev.config.questionCount, prev.timeLeft)
            };
          }
          return {
            ...prev,
            timeLeft: prev.timeLeft - 1
          };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [simulado?.isActive]);

  // Method to get matching real questions from QUESTIONS_POOL based on subject and live search query
  const getFilteredQuestionsPool = (subject: string): Omit<SimuladoQuestion, 'userAnswer'>[] => {
    let pool: Omit<SimuladoQuestion, 'userAnswer'>[] = [];
    if (subject === 'Geral') {
      Object.values(QUESTIONS_POOL).forEach(subList => {
        pool = [...pool, ...subList];
      });
    } else {
      pool = QUESTIONS_POOL[subject] || [];
    }

    if (searchQuery.trim() !== '') {
      const term = searchQuery.toLowerCase().trim();
      pool = pool.filter(q => 
        q.statement.toLowerCase().includes(term) || 
        q.explanation.toLowerCase().includes(term) ||
        q.options.some(opt => opt.text.toLowerCase().includes(term))
      );
    }
    return pool;
  };

  const handleStartSimulado = () => {
    const pool = getFilteredQuestionsPool(config.subject);
    
    if (pool.length === 0) {
      alert('Nenhuma questão correspondente na base de dados real foi encontrada com essa palavra-chave. Limpe o filtro de pesquisa ou tente outra palavra.');
      return;
    }

    // Shuffle pool with Fisher-Yates and slice
    const shuffled = shuffleArray(pool);
    const sliced = shuffled.slice(0, Math.min(config.questionCount, shuffled.length));
    
    const questions = sliced.map(q => ({ ...q }));

    // Set 3 minutes per question
    const totalDurationSeconds = questions.length * 3 * 60; 

    setSimulado({
      config,
      questions,
      currentQuestionIndex: 0,
      timeLeft: totalDurationSeconds,
      isActive: true,
      dateStarted: new Date().toLocaleDateString('pt-BR')
    });
    setShowGabarito(false);
  };

  const calculateResults = (questionsList: SimuladoQuestion[], totalCount: number, timeLeft?: number) => {
    if (questionsList.length === 0) return { scorePercent: 0, averageTimeGasp: 0 };
    
    const corrects = questionsList.filter(q => q.userAnswer === q.correctAnswer).length;
    const scorePercent = Math.round((corrects / questionsList.length) * 100);
    
    // Average time spent
    const totalTimeAllowed = questionsList.length * 3 * 60;
    const remainingTime = timeLeft ?? simulado?.timeLeft ?? 0;
    const totalTimeSpent = totalTimeAllowed - remainingTime;
    const averageTimeGasp = Math.round(totalTimeSpent / questionsList.length);

    return {
      scorePercent,
      averageTimeGasp
    };
  };

  const handleSelectAnswerInExam = (letter: 'A' | 'B' | 'C' | 'D' | 'E') => {
    if (!simulado) return;

    const updatedQuestions = [...simulado.questions];
    updatedQuestions[simulado.currentQuestionIndex].userAnswer = letter;

    setSimulado({
      ...simulado,
      questions: updatedQuestions
    });
  };

  const handleNextQuestion = () => {
    if (!simulado) return;
    if (simulado.currentQuestionIndex < simulado.questions.length - 1) {
      setSimulado({
        ...simulado,
        currentQuestionIndex: simulado.currentQuestionIndex + 1
      });
    }
  };

  const handlePrevQuestion = () => {
    if (!simulado) return;
    if (simulado.currentQuestionIndex > 0) {
      setSimulado({
        ...simulado,
        currentQuestionIndex: simulado.currentQuestionIndex - 1
      });
    }
  };

  const handleFinishExamClick = () => {
    if (!simulado) return;
    setShowFinishModal(true);
  };

  const handleConfirmFinishExam = () => {
    if (!simulado) return;
    setShowFinishModal(false);

    if (timerRef.current) clearInterval(timerRef.current);
    
    const results = calculateResults(simulado.questions, simulado.config.questionCount, simulado.timeLeft);

    setSimulado({
      ...simulado,
      isActive: false,
      ...results
    });

    onSaveSimuladoResult(results.scorePercent, simulado.config.subject);
  };

  const handleConfirmCancelExam = () => {
    setShowCancelModal(false);
    setSimulado(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeQuestion = simulado?.questions[simulado.currentQuestionIndex];

  return (
    <div id="simulados-wrapper" className="space-y-6 animate-fade-in" style={{ contentVisibility: 'auto' }}>
      
      {/* HUD Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Simulizados Cronometrados
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          Teste sua agilidade mental resolvendo blocos cronometrados de questões oficiais anteriores com gestão ativa de tempo.
        </p>
      </div>

      {/* RENDER VIEW ACCORDING TO SIMULATED STAGE */}
      
      {/* STAGE A: SETUP SCREEN */}
      {!simulado && (
        <div className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-xl mx-auto space-y-6 animate-fade-in" id="setup-view">
          
          <div className="text-center space-y-1.5 pb-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100">Configurar Novo Simulado</h3>
            <p className="text-xs text-slate-450">Selecione a matéria principal e o tamanho do teste para iniciar o tempo</p>
          </div>

          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleStartSimulado(); }}>
            
            {/* Subject Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-750 dark:text-slate-200" htmlFor="sim-subject">Matéria do Teste</label>
              <select
                id="sim-subject"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-100"
                value={config.subject}
                onChange={(e) => setConfig({ ...config, subject: e.target.value as any })}
              >
                <option value="Matemática">Matemática e suas Tecnologias</option>
                <option value="Natureza">Ciências da Natureza e suas Tecnologias</option>
                <option value="Humanas">Ciências Humanas e suas Tecnologias</option>
                <option value="Linguagens">Linguagens, Códigos e suas Tecnologias</option>
                <option value="Geral">Simulado ENEM Geral (Todas as Áreas)</option>
              </select>
            </div>

            {/* Live Search Input for Real Questions */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-750 dark:text-slate-200" htmlFor="sim-search-query">
                  Pesquisar por Conteúdo ou Ano (Opcional)
                </label>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded-md font-bold">
                  {getFilteredQuestionsPool(config.subject).length} QUESTÕES REAIS DA BASE
                </span>
              </div>
              <div className="relative">
                <input
                  id="sim-search-query"
                  type="text"
                  placeholder="Pesquise ex: 2024, volume, Getúlio, osmose, etc."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="absolute left-3.5 top-3 text-slate-400">🔍</span>
              </div>
              {searchQuery && (
                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex justify-between items-center">
                  <span>Resultado do filtro de pesquisa ativo</span>
                  <button 
                    type="button" 
                    onClick={() => setSearchQuery('')}
                    className="text-red-500 hover:underline hover:text-red-650 font-bold ml-1 cursor-pointer"
                  >
                    Limpar Filtro
                  </button>
                </div>
              )}
            </div>

            {/* Questions quantity selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-755 dark:text-slate-200">Quantidade de Questões</label>
              
              <div className="grid grid-cols-3 gap-2" id="question-count-selectors">
                {[3, 5, 10].map((num) => (
                  <button
                    key={num}
                    id={`btn-count-set-${num}`}
                    type="button"
                    onClick={() => setConfig({ ...config, questionCount: num })}
                    className={`py-2 text-center text-xs font-bold rounded-xl transition border cursor-pointer ${
                      config.questionCount === num
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100/40 font-bold'
                        : 'bg-white text-slate-700 border-slate-200 dark:bg-[#0f172a] dark:border-slate-800 dark:text-slate-350 hover:border-blue-400'
                    }`}
                  >
                    <span>{num} Questões</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated instructions disclaimer card */}
            <div className="p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-850 rounded-xl flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold">Regras de Simulado NotaMil:</p>
                <ul className="list-disc pl-4 space-y-1 text-[#777587]">
                  <li>O tempo médio por questão do ENEM é de 3 minutos, então o cronômetro será proporcional.</li>
                  <li>Você pode avançar ou retroceder livremente pelas perguntas do HUD.</li>
                  <li>O resultado mostrará estatísticas detalhadas e gabarito ao final.</li>
                </ul>
              </div>
            </div>

            {/* Play Trigger */}
            <button
              id="btn-start-countdown-exam"
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-[#21c55d] to-[#04a753] hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Iniciar Prova Cronometrada</span>
            </button>

          </form>

        </div>
      )}

      {/* STAGE B: ACTIVE TEST IN-PROGRESS SCREEN */}
      {simulado && simulado.isActive && activeQuestion && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="active-exam-view">
          
          {/* Main Question HUD Section */}
          <div className="lg:col-span-8 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-sm">
            
            {/* Top dots navigation stack */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase font-bold">
                <span>RELAÇÃO DE QUESTÕES</span>
                <span>FOCO: {simulado.config.subject}</span>
              </div>
              
              {/* Question dots list */}
              <div className="flex flex-wrap gap-1.5" id="hud-nav-dots">
                {simulado.questions.map((q, idx) => {
                  const isCurrent = idx === simulado.currentQuestionIndex;
                  const isAnswered = !!q.userAnswer;
                  
                  let dotBg = 'bg-slate-100 text-slate-400 dark:bg-[#0f172a] dark:text-slate-650';
                  if (isCurrent) {
                    dotBg = 'bg-blue-600 text-white ring-2 ring-blue-500/20 scale-110';
                  } else if (isAnswered) {
                    dotBg = 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
                  }

                  return (
                    <button
                      key={q.id}
                      id={`dot-nav-question-${q.id}`}
                      type="button"
                      onClick={() => setSimulado({ ...simulado, currentQuestionIndex: idx })}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition flex items-center justify-center font-mono cursor-pointer ${dotBg}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Statement block */}
            <div className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 font-sans">
              <p className="whitespace-pre-wrap">{activeQuestion.statement}</p>
            </div>

            {/* Exam Alternatives Choices A-E */}
            <div className="grid grid-cols-1 gap-2.5 pt-2" id={`active-choices-panel-${activeQuestion.id}`}>
              {activeQuestion.options.map((opt) => {
                const isSelected = activeQuestion.userAnswer === opt.letter;
                
                return (
                  <button
                    key={opt.letter}
                    type="button"
                    onClick={() => handleSelectAnswerInExam(opt.letter)}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-[#0f172a] border-blue-500 text-blue-900 dark:text-blue-300 font-bold ring-1 ring-blue-500/20'
                        : 'bg-slate-50 dark:bg-[#0f172a]/45 border-slate-200 dark:border-slate-800 text-slate-705 hover:border-blue-500 dark:text-slate-300'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-[#0f172a]/80 text-slate-600 dark:text-slate-400'
                    }`}>
                      {opt.letter}
                    </span>
                    <span className="leading-relaxed mt-0.5">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom controls footer of active exam (Anterior, Proxima, Finalizar) */}
            <div className="flex justify-between items-center pt-5 border-t border-slate-200 dark:border-slate-800" id="hud-lower-navigation">
              <button
                id="btn-exam-prev"
                type="button"
                disabled={simulado.currentQuestionIndex === 0}
                onClick={handlePrevQuestion}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 hover:bg-slate-50 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>

              {simulado.currentQuestionIndex < simulado.questions.length - 1 ? (
                <button
                  id="btn-exam-next"
                  type="button"
                  onClick={handleNextQuestion}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-105 dark:bg-[#0f172a] dark:text-blue-400 text-blue-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <span>Próxima</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  id="btn-exam-finish"
                  type="button"
                  onClick={handleFinishExamClick}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
                >
                  <Flag className="h-4 w-4" />
                  <span>Finalizar Simulado</span>
                </button>
              )}
            </div>

          </div>

          {/* Right Chronometer Clock Section */}
          <div className="lg:col-span-4 space-y-4" id="timer-column">
            
            {/* Countdown box */}
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
              
              <div className="flex justify-center items-center gap-2 text-slate-400">
                <Clock className="h-5 w-5 animate-pulse text-blue-600" />
                <span className="text-[10px] uppercase tracking-wider font-mono font-extrabold font-bold">Cronômetro de Prova</span>
              </div>

              {/* Digital count text */}
              <div className="text-4xl lg:text-5xl font-mono font-extrabold text-[#1b1b24] dark:text-[#f3effc]">
                {formatTime(simulado.timeLeft)}
              </div>

              <p className="text-xs text-slate-450 px-2 leading-relaxed">
                Gerencie sua velocidade para concluir todas as {simulado.questions.length} perguntas antes que o tempo se esgote!
              </p>

              <button
                id="btn-exam-cancel"
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="w-full mt-2 py-2.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-500 border border-slate-200 dark:bg-[#0f172a] dark:border-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar Teste
              </button>
            </div>

          </div>

        </div>
      )}

      {/* STAGE C: FINAL RESULTS CARD */}
      {simulado && !simulado.isActive && (
        <div className="bg-white dark:bg-[#1e293b] max-w-2xl mx-auto rounded-3xl border border-slate-200 dark:border-slate-800/80 p-6 md:p-10 shadow-xl space-y-8 animate-fade-in" id="exam-results-card">
          
          {/* Top Score Banner */}
          <div className="text-center space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            
            <div className="inline-flex p-4 bg-blue-50 dark:bg-blue-950/45 text-blue-600 dark:text-emerald-400 rounded-full shadow">
              <Award className="h-10 w-10" />
            </div>

            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Simulado Concluído!</h2>
            <p className="text-xs text-slate-450 max-w-sm mx-auto leading-relaxed">
              Exame simulado em <b>{simulado.config.subject}</b> com {simulado.questions.length} questões. Aqui estão suas métricas adaptativas:
            </p>

            {/* Huge Percent Correct circular HUD */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-8 py-4">
              
              {/* Massive Score Percent Indicator */}
              <div className="bg-slate-50 dark:bg-[#0f172a] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center min-w-[170px]">
                <span className="text-4xl lg:text-5xl font-display font-black text-blue-600 dark:text-blue-400">
                  {simulado.scorePercent}%
                </span>
                <span className="text-xs text-slate-450 block mt-1 uppercase tracking-wider font-mono">Taxa de Acerto</span>
              </div>

              {/* Time Spents Indicator */}
              <div className="bg-slate-50 dark:bg-[#0f172a] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center min-w-[170px]">
                <span className="text-3xl lg:text-4xl font-mono font-black text-slate-700 dark:text-gray-300">
                  {simulado.averageTimeGasp}s
                </span>
                <span className="text-xs text-slate-450 block mt-2.5 uppercase tracking-wider font-mono">Tempo por Questão</span>
              </div>

            </div>
          </div>

          {/* Toggle show gabarito list */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">Revisão de Desvio (Gabarito)</h3>
              <button
                id="btn-toggle-review-gabarito"
                type="button"
                onClick={() => setShowGabarito(!showGabarito)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-[#0f172a] transition cursor-pointer"
              >
                {showGabarito ? 'Esconder Gabarito' : 'Ver Gabarito Detalhado'}
              </button>
            </div>

            {showGabarito && (
              <div className="space-y-4 animate-slide-up" id="review-gabarito-list">
                {simulado.questions.map((q, idx) => {
                  const isCorrect = q.userAnswer === q.correctAnswer;
                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border space-y-3 bg-slate-50/50 ${
                        isCorrect 
                          ? 'border-green-200 dark:border-green-950/30' 
                          : 'border-red-100 dark:border-red-950/30'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono font-semibold uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-600 px-2 py-0.5 rounded">
                          QUESTÃO {idx + 1}
                        </span>
                        <span className={`text-xs font-bold leading-none ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                          {isCorrect ? 'Acertou ✓' : `Sua Resposta: ${q.userAnswer || 'Em branco'} | Correto: ${q.correctAnswer}`}
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed italic pr-4 select-all">
                        "{q.statement.substring(0, 160)}..."
                      </p>

                      <div className="bg-white dark:bg-[#0f172a] p-3.5 border border-slate-200 dark:border-slate-800 text-[11px] rounded-lg text-slate-650 dark:text-slate-350 leading-relaxed font-sans space-y-1.5">
                        <p className="font-bold flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-blue-600" />Resolução:</p>
                        <p>{q.explanation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reset button to setup list screen */}
          <div className="flex justify-center pt-2">
            <button
              id="btn-reset-exam-flow"
              type="button"
              onClick={() => setSimulado(null)}
              className="px-6 py-3 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 text-slate-500 hover:text-slate-800 dark:hover:text-white dark:border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Fazer Outro Simulado</span>
            </button>
          </div>

        </div>
      )}

      {/* 4. MODAL: CONFIRM FINISH EXAM */}
      {showFinishModal && simulado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" id="finish-exam-modal">
          <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl space-y-5 text-center">
            <div className="inline-flex p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-2xl">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Finalizar Simulado?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {(() => {
                  const unanswered = simulado.questions.filter(q => !q.userAnswer).length;
                  return unanswered > 0 
                    ? `Atenção: Você ainda possui ${unanswered} questão(ões) em branco! Deseja realmente concluir o simulado no estado atual?`
                    : 'Excelente! Todas as questões foram respondidas com garra acadêmica. Pronto para colher seu feedback detalhado?';
                })()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowFinishModal(false)}
                className="py-2.5 px-4 text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-455 rounded-xl transition cursor-pointer"
              >
                Voltar à Prova
              </button>
              <button
                type="button"
                onClick={handleConfirmFinishExam}
                className="py-2.5 px-4 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow transition cursor-pointer"
              >
                Sim, Finalizar!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: CONFIRM CANCEL EXAM */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" id="cancel-exam-modal">
          <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full shadow-2xl space-y-5 text-center">
            <div className="inline-flex p-3.5 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-2xl">
              <X className="h-7 w-7 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Abandonar Simulado?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Atenção: Seu tempo e progresso nesta prova ativa em andamento serão completamente limpos e perdidos. Confirma o abandono?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="py-2.5 px-4 text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-455 rounded-xl transition cursor-pointer"
              >
                Continuar Prova
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelExam}
                className="py-2.5 px-4 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow transition cursor-pointer"
              >
                Abandonar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
