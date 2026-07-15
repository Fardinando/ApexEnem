export interface StatePath {
  code: string;
  name: string;
  path: string;
  labelX: number;
  labelY: number;
}

export interface RegionPath {
  name: string;
  color: string;
  viewBox: string;
  states: StatePath[];
}

export const BRAZIL_VIEWBOX = '0 0 740 680';

export const REGION_MAP_DATA: Record<string, RegionPath> = {
  Norte: {
    name: 'Norte',
    color: '#22c55e',
    viewBox: '20 10 340 260',
    states: [
      { code: 'AC', name: 'Acre', path: 'M 25 195 L 55 175 L 85 185 L 95 210 L 80 235 L 50 240 L 30 225 Z', labelX: 58, labelY: 210 },
      { code: 'AM', name: 'Amazonas', path: 'M 30 40 L 130 20 L 195 45 L 210 90 L 195 145 L 155 175 L 100 185 L 55 175 L 25 195 L 15 150 L 20 90 Z', labelX: 115, labelY: 110 },
      { code: 'RR', name: 'Roraima', path: 'M 160 10 L 200 5 L 225 25 L 220 60 L 195 45 L 160 35 Z', labelX: 192, labelY: 30 },
      { code: 'AP', name: 'Amapá', path: 'M 225 15 L 260 5 L 280 25 L 275 55 L 255 65 L 235 55 L 225 30 Z', labelX: 252, labelY: 35 },
      { code: 'PA', name: 'Pará', path: 'M 210 90 L 260 65 L 300 70 L 325 95 L 320 135 L 295 160 L 255 175 L 215 170 L 195 145 L 195 115 Z', labelX: 262, labelY: 125 },
      { code: 'TO', name: 'Tocantins', path: 'M 255 175 L 295 160 L 320 175 L 325 210 L 310 240 L 280 250 L 255 235 L 240 210 L 245 185 Z', labelX: 280, labelY: 210 },
    ],
  },
  Nordeste: {
    name: 'Nordeste',
    color: '#f59e0b',
    viewBox: '240 130 310 230',
    states: [
      { code: 'MA', name: 'Maranhão', path: 'M 280 140 L 320 135 L 355 145 L 370 170 L 360 200 L 330 210 L 300 200 L 280 180 Z', labelX: 322, labelY: 172 },
      { code: 'PI', name: 'Piauí', path: 'M 320 175 L 355 165 L 375 185 L 370 215 L 355 235 L 330 240 L 315 225 L 310 200 Z', labelX: 345, labelY: 208 },
      { code: 'CE', name: 'Ceará', path: 'M 370 145 L 405 140 L 425 155 L 420 180 L 395 190 L 370 185 L 365 165 Z', labelX: 395, labelY: 165 },
      { code: 'RN', name: 'Rio Grande do Norte', path: 'M 425 155 L 445 150 L 458 160 L 455 178 L 435 182 L 420 175 Z', labelX: 440, labelY: 167 },
      { code: 'PB', name: 'Paraíba', path: 'M 420 180 L 445 178 L 458 188 L 455 205 L 435 210 L 420 200 Z', labelX: 438, labelY: 194 },
      { code: 'PE', name: 'Pernambuco', path: 'M 380 195 L 420 200 L 455 205 L 465 220 L 455 240 L 420 245 L 390 235 L 375 215 Z', labelX: 420, labelY: 222 },
      { code: 'AL', name: 'Alagoas', path: 'M 445 245 L 465 240 L 475 252 L 472 268 L 455 272 L 442 262 Z', labelX: 458, labelY: 256 },
      { code: 'SE', name: 'Sergipe', path: 'M 435 270 L 455 268 L 462 280 L 458 295 L 442 298 L 432 288 Z', labelX: 447, labelY: 283 },
      { code: 'BA', name: 'Bahia', path: 'M 330 240 L 370 235 L 420 245 L 442 262 L 432 288 L 415 315 L 380 330 L 340 325 L 315 305 L 310 275 L 315 255 Z', labelX: 375, labelY: 288 },
    ],
  },
  'Centro-Oeste': {
    name: 'Centro-Oeste',
    color: '#3b82f6',
    viewBox: '100 180 260 220',
    states: [
      { code: 'MT', name: 'Mato Grosso', path: 'M 115 185 L 195 175 L 240 185 L 255 215 L 255 260 L 235 290 L 195 300 L 155 295 L 125 275 L 110 245 L 108 215 Z', labelX: 182, labelY: 240 },
      { code: 'GO', name: 'Goiás', path: 'M 255 235 L 290 225 L 315 240 L 320 270 L 310 300 L 285 310 L 260 305 L 245 285 L 248 260 Z', labelX: 282, labelY: 270 },
      { code: 'DF', name: 'Distrito Federal', path: 'M 295 255 L 310 252 L 315 262 L 308 270 L 295 268 Z', labelX: 305, labelY: 262 },
      { code: 'MS', name: 'Mato Grosso do Sul', path: 'M 155 300 L 195 305 L 235 300 L 255 310 L 260 340 L 250 370 L 220 385 L 180 380 L 150 365 L 135 340 L 140 315 Z', labelX: 200, labelY: 345 },
    ],
  },
  Sudeste: {
    name: 'Sudeste',
    color: '#ef4444',
    viewBox: '280 280 180 200',
    states: [
      { code: 'MG', name: 'Minas Gerais', path: 'M 310 290 L 355 280 L 395 290 L 410 315 L 405 350 L 385 375 L 355 385 L 325 380 L 305 360 L 295 330 L 298 305 Z', labelX: 352, labelY: 335 },
      { code: 'ES', name: 'Espírito Santo', path: 'M 405 310 L 430 305 L 445 320 L 442 350 L 425 365 L 408 358 L 400 335 Z', labelX: 422, labelY: 335 },
      { code: 'RJ', name: 'Rio de Janeiro', path: 'M 355 385 L 385 380 L 408 390 L 415 410 L 400 425 L 370 428 L 350 418 L 345 400 Z', labelX: 380, labelY: 408 },
      { code: 'SP', name: 'São Paulo', path: 'M 260 380 L 300 370 L 335 380 L 355 395 L 350 420 L 335 440 L 305 445 L 275 438 L 255 420 L 250 398 Z', labelX: 305, labelY: 412 },
    ],
  },
  Sul: {
    name: 'Sul',
    color: '#8b5cf6',
    viewBox: '200 420 180 180',
    states: [
      { code: 'PR', name: 'Paraná', path: 'M 255 425 L 295 418 L 330 425 L 345 445 L 340 470 L 320 485 L 290 490 L 260 485 L 245 465 L 248 442 Z', labelX: 295, labelY: 458 },
      { code: 'SC', name: 'Santa Catarina', path: 'M 260 490 L 290 492 L 320 490 L 335 505 L 330 525 L 310 538 L 280 540 L 260 532 L 250 515 L 252 500 Z', labelX: 292, labelY: 516 },
      { code: 'RS', name: 'Rio Grande do Sul', path: 'M 252 538 L 280 542 L 310 540 L 325 555 L 320 585 L 305 610 L 280 620 L 255 615 L 240 595 L 238 565 Z', labelX: 280, labelY: 580 },
    ],
  },
};

export function getStatePathByCode(code: string): StatePath | null {
  for (const region of Object.values(REGION_MAP_DATA)) {
    const found = region.states.find(s => s.code === code);
    if (found) return found;
  }
  return null;
}

export function getRegionForState(code: string): string | null {
  for (const [name, region] of Object.entries(REGION_MAP_DATA)) {
    if (region.states.some(s => s.code === code)) return name;
  }
  return null;
}
