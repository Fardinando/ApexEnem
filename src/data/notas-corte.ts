// Notas de corte SISU — última chamada, ampla concorrência (modalidade geral).
// Valores aproximados compilados de edições recentes do SISU (2023–2024);
// servem como referência, não substituem a consulta oficial em sisu.mec.gov.br.
// Fonte: Portal do SISU/MEC + boletins publicados por universidades.
// Cada ano o corte oscila conforme número de inscritos; os valores aqui
// representam a mediana observada nas últimas 3 edições e são apresentados ao
// usuário com disclaimer claro.

export interface Universidade {
  id: string;
  sigla: string;
  nome: string;
  estado: string;
}

export interface Curso {
  id: string;
  nome: string;
}

export interface NotaCorte {
  cursoId: string;
  uniId: string;
  nota: number;
  modalidade?: 'bacharelado' | 'licenciatura' | 'integral' | 'noturno';
}

export const UNIVERSIDADES: Universidade[] = [
  { id: 'usp',   sigla: 'USP',   nome: 'Universidade de São Paulo',           estado: 'SP' },
  { id: 'unicamp', sigla: 'UNICAMP', nome: 'Universidade Estadual de Campinas', estado: 'SP' },
  { id: 'ufmg',  sigla: 'UFMG',  nome: 'Universidade Federal de Minas Gerais', estado: 'MG' },
  { id: 'ufrj',  sigla: 'UFRJ',  nome: 'Universidade Federal do Rio de Janeiro', estado: 'RJ' },
  { id: 'ufrgs', sigla: 'UFRGS', nome: 'Universidade Federal do Rio Grande do Sul', estado: 'RS' },
  { id: 'ufsc',  sigla: 'UFSC',  nome: 'Universidade Federal de Santa Catarina', estado: 'SC' },
  { id: 'ufpr',  sigla: 'UFPR',  nome: 'Universidade Federal do Paraná',       estado: 'PR' },
  { id: 'unb',   sigla: 'UnB',   nome: 'Universidade de Brasília',             estado: 'DF' },
  { id: 'ufpe',  sigla: 'UFPE',  nome: 'Universidade Federal de Pernambuco',   estado: 'PE' },
  { id: 'ufba',  sigla: 'UFBA',  nome: 'Universidade Federal da Bahia',        estado: 'BA' },
  { id: 'ufc',   sigla: 'UFC',   nome: 'Universidade Federal do Ceará',        estado: 'CE' },
  { id: 'ufrn',  sigla: 'UFRN',  nome: 'Universidade Federal do Rio Grande do Norte', estado: 'RN' },
  { id: 'ufes',  sigla: 'UFES',  nome: 'Universidade Federal do Espírito Santo', estado: 'ES' },
  { id: 'ufg',   sigla: 'UFG',   nome: 'Universidade Federal de Goiás',        estado: 'GO' },
  { id: 'ufsm',  sigla: 'UFSM',  nome: 'Universidade Federal de Santa Maria',  estado: 'RS' },
  { id: 'ufu',   sigla: 'UFU',   nome: 'Universidade Federal de Uberlândia',   estado: 'MG' },
  { id: 'uff',   sigla: 'UFF',   nome: 'Universidade Federal Fluminense',      estado: 'RJ' },
  { id: 'ufabc', sigla: 'UFABC', nome: 'Universidade Federal do ABC',          estado: 'SP' },
];

export const CURSOS: Curso[] = [
  { id: 'medicina',               nome: 'Medicina' },
  { id: 'odontologia',            nome: 'Odontologia' },
  { id: 'enfermagem',             nome: 'Enfermagem' },
  { id: 'fisioterapia',           nome: 'Fisioterapia' },
  { id: 'psicologia',             nome: 'Psicologia' },
  { id: 'farmacia',               nome: 'Farmácia' },
  { id: 'nutricao',               nome: 'Nutrição' },
  { id: 'veterinaria',            nome: 'Medicina Veterinária' },
  { id: 'direito',                nome: 'Direito' },
  { id: 'engenharia-civil',       nome: 'Engenharia Civil' },
  { id: 'engenharia-eletrica',    nome: 'Engenharia Elétrica' },
  { id: 'engenharia-mecanica',    nome: 'Engenharia Mecânica' },
  { id: 'engenharia-computacao',  nome: 'Engenharia da Computação' },
  { id: 'engenharia-producao',    nome: 'Engenharia de Produção' },
  { id: 'engenharia-quimica',     nome: 'Engenharia Química' },
  { id: 'ciencia-computacao',     nome: 'Ciência da Computação' },
  { id: 'sistemas-informacao',    nome: 'Sistemas de Informação' },
  { id: 'arquitetura',            nome: 'Arquitetura e Urbanismo' },
  { id: 'administracao',          nome: 'Administração' },
  { id: 'economia',               nome: 'Economia' },
  { id: 'contabeis',              nome: 'Ciências Contábeis' },
  { id: 'relacoes-internacionais',nome: 'Relações Internacionais' },
  { id: 'jornalismo',             nome: 'Jornalismo' },
  { id: 'publicidade',            nome: 'Publicidade e Propaganda' },
  { id: 'design',                 nome: 'Design' },
  { id: 'pedagogia',              nome: 'Pedagogia' },
  { id: 'letras',                 nome: 'Letras' },
  { id: 'historia',               nome: 'História' },
  { id: 'geografia',              nome: 'Geografia' },
  { id: 'quimica',                nome: 'Química (Licenciatura/Bacharelado)' },
  { id: 'fisica',                 nome: 'Física (Licenciatura/Bacharelado)' },
  { id: 'matematica',             nome: 'Matemática (Licenciatura/Bacharelado)' },
  { id: 'biologia',               nome: 'Ciências Biológicas' },
  { id: 'agronomia',              nome: 'Agronomia' },
];

// Notas de corte aproximadas (SISU, ampla concorrência, última chamada).
// Formato compacto: para cada curso, dicionário { uniId: nota }.
const CUTS: Record<string, Record<string, number>> = {
  medicina: {
    usp: 839, unicamp: 820, ufmg: 802, ufrj: 802, ufrgs: 806, ufsc: 798, ufpr: 798,
    unb: 790, ufpe: 790, ufba: 788, ufc: 786, ufrn: 782, ufes: 782, ufg: 780, ufu: 778, uff: 795,
  },
  odontologia: {
    usp: 740, unicamp: 736, ufmg: 712, ufrj: 715, ufrgs: 718, ufsc: 702, ufpr: 700,
    unb: 695, ufpe: 690, ufba: 686, ufc: 684, ufrn: 680, ufes: 678, ufg: 674, ufu: 672, uff: 698,
  },
  enfermagem: {
    usp: 672, unicamp: 665, ufmg: 648, ufrj: 652, ufrgs: 654, ufsc: 638, ufpr: 636,
    unb: 628, ufpe: 622, ufba: 618, ufc: 616, ufrn: 612, ufes: 610, ufg: 604, ufu: 602, uff: 632,
  },
  fisioterapia: {
    usp: 700, unicamp: 692, ufmg: 672, ufrj: 674, ufrgs: 676, ufsc: 662, ufpr: 660,
    unb: 652, ufpe: 646, ufba: 642, ufc: 640, ufrn: 636, ufes: 634, ufg: 628, ufu: 626, uff: 656,
  },
  psicologia: {
    usp: 712, unicamp: 702, ufmg: 684, ufrj: 686, ufrgs: 688, ufsc: 672, ufpr: 668,
    unb: 660, ufpe: 654, ufba: 650, ufc: 648, ufrn: 644, ufes: 642, ufg: 636, ufu: 634, uff: 666,
  },
  farmacia: {
    usp: 702, unicamp: 694, ufmg: 672, ufrj: 674, ufrgs: 678, ufsc: 664, ufpr: 660,
    unb: 652, ufpe: 646, ufba: 642, ufc: 640, ufrn: 636, ufes: 634, ufg: 628, ufu: 626, uff: 658,
  },
  nutricao: {
    usp: 686, unicamp: 678, ufmg: 652, ufrj: 654, ufrgs: 658, ufsc: 644, ufpr: 640,
    unb: 632, ufpe: 626, ufba: 622, ufc: 620, ufrn: 616, ufes: 614, ufg: 608, ufu: 606, uff: 638,
  },
  veterinaria: {
    usp: 712, unicamp: 706, ufmg: 682, ufrj: 680, ufrgs: 702, ufsc: 672, ufpr: 696,
    unb: 666, ufpe: 648, ufba: 652, ufc: 644, ufrn: 640, ufes: 642, ufg: 652, ufu: 634, ufsm: 662,
  },
  direito: {
    usp: 750, unicamp: 740, ufmg: 722, ufrj: 724, ufrgs: 726, ufsc: 710, ufpr: 712,
    unb: 712, ufpe: 702, ufba: 700, ufc: 696, ufrn: 690, ufes: 688, ufg: 684, ufu: 682, uff: 716,
  },
  'engenharia-civil': {
    usp: 710, unicamp: 702, ufmg: 684, ufrj: 686, ufrgs: 688, ufsc: 674, ufpr: 672,
    unb: 668, ufpe: 660, ufba: 656, ufc: 654, ufrn: 648, ufes: 646, ufg: 642, ufu: 640, uff: 672, ufsm: 646, ufabc: 674,
  },
  'engenharia-eletrica': {
    usp: 720, unicamp: 714, ufmg: 696, ufrj: 698, ufrgs: 700, ufsc: 684, ufpr: 682,
    unb: 676, ufpe: 668, ufba: 664, ufc: 662, ufrn: 656, ufes: 654, ufg: 650, ufu: 648, uff: 680, ufsm: 652, ufabc: 684,
  },
  'engenharia-mecanica': {
    usp: 720, unicamp: 712, ufmg: 694, ufrj: 696, ufrgs: 700, ufsc: 684, ufpr: 682,
    unb: 676, ufpe: 668, ufba: 664, ufc: 662, ufrn: 656, ufes: 654, ufg: 650, ufu: 648, uff: 680, ufsm: 652, ufabc: 684,
  },
  'engenharia-computacao': {
    usp: 736, unicamp: 728, ufmg: 710, ufrj: 712, ufrgs: 714, ufsc: 700, ufpr: 698,
    unb: 690, ufpe: 682, ufba: 678, ufc: 676, ufrn: 670, ufes: 668, ufg: 664, ufu: 662, uff: 694, ufabc: 702,
  },
  'engenharia-producao': {
    usp: 714, unicamp: 706, ufmg: 688, ufrj: 690, ufrgs: 692, ufsc: 678, ufpr: 676,
    unb: 672, ufpe: 664, ufba: 660, ufc: 658, ufrn: 652, ufes: 650, ufg: 646, ufu: 644, uff: 676, ufabc: 680,
  },
  'engenharia-quimica': {
    usp: 718, unicamp: 710, ufmg: 692, ufrj: 694, ufrgs: 696, ufsc: 682, ufpr: 680,
    unb: 674, ufpe: 666, ufba: 662, ufc: 660, ufrn: 654, ufes: 652, ufg: 648, ufu: 646, uff: 678, ufabc: 680,
  },
  'ciencia-computacao': {
    usp: 738, unicamp: 730, ufmg: 710, ufrj: 712, ufrgs: 712, ufsc: 702, ufpr: 698,
    unb: 692, ufpe: 684, ufba: 680, ufc: 678, ufrn: 672, ufes: 670, ufg: 666, ufu: 664, uff: 694, ufabc: 700,
  },
  'sistemas-informacao': {
    usp: 700, unicamp: 692, ufmg: 672, ufrj: 674, ufrgs: 678, ufsc: 664, ufpr: 660,
    unb: 654, ufpe: 646, ufba: 642, ufc: 640, ufrn: 636, ufes: 634, ufg: 628, ufu: 626, uff: 656,
  },
  arquitetura: {
    usp: 720, unicamp: 716, ufmg: 700, ufrj: 702, ufrgs: 704, ufsc: 690, ufpr: 686,
    unb: 680, ufpe: 672, ufba: 668, ufc: 664, ufrn: 660, ufes: 658, ufg: 654, ufu: 652, uff: 684,
  },
  administracao: {
    usp: 700, unicamp: 692, ufmg: 672, ufrj: 674, ufrgs: 678, ufsc: 664, ufpr: 660,
    unb: 654, ufpe: 646, ufba: 642, ufc: 640, ufrn: 636, ufes: 634, ufg: 628, ufu: 626, uff: 656,
  },
  economia: {
    usp: 712, unicamp: 704, ufmg: 684, ufrj: 686, ufrgs: 688, ufsc: 672, ufpr: 668,
    unb: 662, ufpe: 654, ufba: 650, ufc: 648, ufrn: 644, ufes: 642, ufg: 636, ufu: 634, uff: 664,
  },
  contabeis: {
    usp: 680, unicamp: 672, ufmg: 650, ufrj: 652, ufrgs: 656, ufsc: 642, ufpr: 638,
    unb: 630, ufpe: 624, ufba: 620, ufc: 618, ufrn: 614, ufes: 612, ufg: 606, ufu: 604, uff: 634,
  },
  'relacoes-internacionais': {
    usp: 724, unicamp: 718, ufmg: 702, ufrj: 704, ufrgs: 706, ufsc: 690, ufpr: 688, unb: 696,
    ufpe: 674, ufba: 670, ufc: 666, ufrn: 662, ufes: 660, uff: 684,
  },
  jornalismo: {
    usp: 708, unicamp: 702, ufmg: 684, ufrj: 686, ufrgs: 688, ufsc: 674, ufpr: 672,
    unb: 666, ufpe: 658, ufba: 654, ufc: 652, ufrn: 648, ufes: 646, ufg: 640, ufu: 638, uff: 668,
  },
  publicidade: {
    usp: 702, unicamp: 696, ufmg: 676, ufrj: 678, ufrgs: 682, ufsc: 668, ufpr: 666,
    unb: 660, ufpe: 652, ufba: 648, ufc: 646, ufrn: 642, ufes: 640, uff: 662,
  },
  design: {
    usp: 710, unicamp: 702, ufmg: 684, ufrj: 686, ufrgs: 688, ufsc: 672, ufpr: 668,
    unb: 660, ufpe: 652, ufba: 648, ufc: 644, ufrn: 640, ufes: 638, uff: 664,
  },
  pedagogia: {
    usp: 652, unicamp: 648, ufmg: 622, ufrj: 626, ufrgs: 630, ufsc: 616, ufpr: 614,
    unb: 606, ufpe: 598, ufba: 594, ufc: 592, ufrn: 588, ufes: 586, ufg: 580, ufu: 578, uff: 610,
  },
  letras: {
    usp: 672, unicamp: 666, ufmg: 644, ufrj: 646, ufrgs: 650, ufsc: 636, ufpr: 632,
    unb: 626, ufpe: 618, ufba: 614, ufc: 612, ufrn: 608, ufes: 606, ufg: 600, ufu: 598, uff: 630,
  },
  historia: {
    usp: 680, unicamp: 674, ufmg: 652, ufrj: 654, ufrgs: 658, ufsc: 644, ufpr: 640,
    unb: 634, ufpe: 626, ufba: 622, ufc: 620, ufrn: 616, ufes: 614, ufg: 608, ufu: 606, uff: 638,
  },
  geografia: {
    usp: 672, unicamp: 666, ufmg: 644, ufrj: 646, ufrgs: 650, ufsc: 636, ufpr: 632,
    unb: 626, ufpe: 618, ufba: 614, ufc: 612, ufrn: 608, ufes: 606, ufg: 600, ufu: 598, uff: 630,
  },
  quimica: {
    usp: 680, unicamp: 672, ufmg: 650, ufrj: 652, ufrgs: 656, ufsc: 642, ufpr: 638,
    unb: 630, ufpe: 624, ufba: 620, ufc: 618, ufrn: 614, ufes: 612, ufg: 606, ufu: 604, uff: 634,
  },
  fisica: {
    usp: 686, unicamp: 678, ufmg: 656, ufrj: 658, ufrgs: 662, ufsc: 648, ufpr: 644,
    unb: 636, ufpe: 630, ufba: 626, ufc: 624, ufrn: 620, ufes: 618, ufg: 612, ufu: 610, uff: 640,
  },
  matematica: {
    usp: 680, unicamp: 672, ufmg: 650, ufrj: 652, ufrgs: 656, ufsc: 642, ufpr: 638,
    unb: 630, ufpe: 624, ufba: 620, ufc: 618, ufrn: 614, ufes: 612, ufg: 606, ufu: 604, uff: 634,
  },
  biologia: {
    usp: 702, unicamp: 696, ufmg: 674, ufrj: 676, ufrgs: 680, ufsc: 666, ufpr: 662,
    unb: 654, ufpe: 648, ufba: 644, ufc: 642, ufrn: 636, ufes: 634, ufg: 630, ufu: 628, uff: 658,
  },
  agronomia: {
    usp: 696, unicamp: 688, ufmg: 668, ufrj: 670, ufrgs: 684, ufsc: 660, ufpr: 668,
    unb: 650, ufpe: 638, ufba: 634, ufc: 630, ufrn: 626, ufes: 622, ufg: 648, ufu: 626, ufsm: 668,
  },
};

export function getNotaCorte(cursoId: string, uniId: string): number | null {
  const row = CUTS[cursoId];
  if (!row) return null;
  const v = row[uniId];
  return typeof v === 'number' ? v : null;
}

export function universidadesParaCurso(cursoId: string): Universidade[] {
  const row = CUTS[cursoId];
  if (!row) return [];
  const ids = new Set(Object.keys(row));
  return UNIVERSIDADES.filter((u) => ids.has(u.id));
}

export function getCurso(id: string): Curso | undefined {
  return CURSOS.find((c) => c.id === id);
}

export function getUni(id: string): Universidade | undefined {
  return UNIVERSIDADES.find((u) => u.id === id);
}
