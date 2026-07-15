export interface State {
  code: string;
  name: string;
  region: string;
  cities: string[];
}

export const REGIONS = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'] as const;
export type RegionBR = (typeof REGIONS)[number];

export const REGION_COLORS: Record<RegionBR, string> = {
  Norte: '#3b82f6',
  Nordeste: '#22c55e',
  'Centro-Oeste': '#eab308',
  Sudeste: '#ef4444',
  Sul: '#a855f7',
};

export const STATES: State[] = [
  { code: 'AC', name: 'Acre', region: 'Norte', cities: ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá', 'Feijó'] },
  { code: 'AL', name: 'Alagoas', region: 'Nordeste', cities: ['Maceió', 'Arapiraca', 'Penedo', 'Palmeira dos Índios', 'Delmiro Gouveia'] },
  { code: 'AP', name: 'Amapá', region: 'Norte', cities: ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Mazagão'] },
  { code: 'AM', name: 'Amazonas', region: 'Norte', cities: ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Tefé'] },
  { code: 'BA', name: 'Bahia', region: 'Nordeste', cities: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Itabuna', 'Juazeiro', 'Lauro de Freitas'] },
  { code: 'CE', name: 'Ceará', region: 'Nordeste', cities: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral', 'Crato'] },
  { code: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste', cities: ['Brasília', 'Taguatinga', 'Ceilândia', 'Plano Piloto', 'Águas Claras'] },
  { code: 'ES', name: 'Espírito Santo', region: 'Sudeste', cities: ['Vitória', 'Vila Velha', 'Serra', 'Cariacica', 'Linhares', 'Cachoeiro de Itapemirim'] },
  { code: 'GO', name: 'Goiás', region: 'Centro-Oeste', cities: ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia', 'Águas Lindas de Goiás'] },
  { code: 'MA', name: 'Maranhão', region: 'Nordeste', cities: ['São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias'] },
  { code: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste', cities: ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra'] },
  { code: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste', cities: ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã'] },
  { code: 'MG', name: 'Minas Gerais', region: 'Sudeste', cities: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros', 'Ribeirão das Neves'] },
  { code: 'PA', name: 'Pará', region: 'Norte', cities: ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Castanhal', 'Parauapebas'] },
  { code: 'PB', name: 'Paraíba', region: 'Nordeste', cities: ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux'] },
  { code: 'PR', name: 'Paraná', region: 'Sul', cities: ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'São José dos Pinhais'] },
  { code: 'PE', name: 'Pernambuco', region: 'Nordeste', cities: ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina', 'Paulista'] },
  { code: 'PI', name: 'Piauí', region: 'Nordeste', cities: ['Teresina', 'Parnaíbas', 'Picos', 'Piripiri', 'Floriano'] },
  { code: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste', cities: ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói', 'Campos dos Goytacazes', 'Belford Roxo'] },
  { code: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste', cities: ['Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba'] },
  { code: 'RS', name: 'Rio Grande do Sul', region: 'Sul', cities: ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria', 'Gravataí', 'Viamão'] },
  { code: 'RO', name: 'Rondônia', region: 'Norte', cities: ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal'] },
  { code: 'RR', name: 'Roraima', region: 'Norte', cities: ['Boa Vista', 'Rorainópolis', 'Caracaraí', 'Pacaraima'] },
  { code: 'SC', name: 'Santa Catarina', region: 'Sul', cities: ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Chapecó', 'Criciúma', 'Itajaí'] },
  { code: 'SP', name: 'São Paulo', region: 'Sudeste', cities: ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André', 'São José dos Campos', 'Osasco', 'Ribeirão Preto'] },
  { code: 'SE', name: 'Sergipe', region: 'Nordeste', cities: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão'] },
  { code: 'TO', name: 'Tocantins', region: 'Norte', cities: ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins'] },
];

export function getStatesByRegion(region: RegionBR): State[] {
  return STATES.filter(s => s.region === region);
}

export function getCitiesByState(stateCode: string): string[] {
  const state = STATES.find(s => s.code === stateCode);
  return state?.cities || [];
}
