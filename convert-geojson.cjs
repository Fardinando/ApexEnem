const fs = require('fs');
const path = require('path');

const GEOJSON_PATH = 'C:\\Users\\Fernando Sousa\\.local\\share\\opencode\\tool-output\\tool_f67eecadc001ff2ql1UMSiXsgt';
const OUTPUT_PATH = path.join(__dirname, 'src', 'data', 'brazil-map-paths.ts');

const REGIONS = {
  Norte: { color: '#22c55e', states: ['AC', 'AM', 'AP', 'PA', 'RR', 'TO'] },
  Nordeste: { color: '#f59e0b', states: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'] },
  'Centro-Oeste': { color: '#3b82f6', states: ['DF', 'GO', 'MS', 'MT'] },
  Sudeste: { color: '#ef4444', states: ['ES', 'MG', 'RJ', 'SP'] },
  Sul: { color: '#8b5cf6', states: ['PR', 'RS', 'SC'] },
};

const STATE_NAMES = {
  AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá',
  BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
  GO: 'Goiás', MA: 'Maranhão', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul',
  MT: 'Mato Grosso', PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco',
  PR: 'Paraná', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RO: 'Rondônia', RR: 'Roraima', RS: 'Rio Grande do Sul', SC: 'Santa Catarina',
  SE: 'Sergipe', SP: 'São Paulo', TO: 'Tocantins',
};

const TARGET_WIDTH = 740;
const TARGET_HEIGHT = 680;

const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf8'));

const stateFeatures = {};
for (const feature of geojson.features) {
  const sigla = feature.properties.sigla;
  if (sigla) stateFeatures[sigla] = feature.geometry;
}

// Compute Mercator bounds for all of Brazil
let globalMinLon = Infinity, globalMaxLon = -Infinity;
let globalMinLat = Infinity, globalMaxLat = -Infinity;

for (const sigla of Object.keys(stateFeatures)) {
  const coords = extractAllCoords(stateFeatures[sigla]);
  for (const [lon, lat] of coords) {
    if (lon < globalMinLon) globalMinLon = lon;
    if (lon > globalMaxLon) globalMaxLon = lon;
    if (lat < globalMinLat) globalMinLat = lat;
    if (lat > globalMaxLat) globalMaxLat = lat;
  }
}

function extractAllCoords(geometry) {
  const coords = [];
  if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) {
        for (const c of ring) coords.push(c);
      }
    }
  } else if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) {
      for (const c of ring) coords.push(c);
    }
  }
  return coords;
}

function projectLon(lon) {
  return ((lon - globalMinLon) / (globalMaxLon - globalMinLon)) * TARGET_WIDTH;
}

function projectLat(lat) {
  return ((globalMaxLat - lat) / (globalMaxLat - globalMinLat)) * TARGET_HEIGHT;
}

function projectCoord([lon, lat]) {
  return [Math.round(projectLon(lon) * 10) / 10, Math.round(projectLat(lat) * 10) / 10];
}

function simplifyDecimate(points, skipFactor) {
  if (points.length <= 4) return points;
  const simplified = [points[0]];
  for (let i = 1; i < points.length - 1; i += skipFactor) {
    simplified.push(points[i]);
  }
  simplified.push(points[points.length - 1]);
  return simplified;
}

function pointToLineDist(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = lenSq !== 0 ? dot / lenSq : -1;
  let xx, yy;
  if (param < 0) { xx = x1; yy = y1; }
  else if (param > 1) { xx = x2; yy = y2; }
  else { xx = x1 + param * C; yy = y1 + param * D; }
  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

function douglasPeucker(points, epsilon) {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let maxIdx = 0;
  const first = points[0];
  const last = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = pointToLineDist(points[i][0], points[i][1], first[0], first[1], last[0], last[1]);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIdx + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIdx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}

function geometryToPath(geometry) {
  const allPaths = [];
  const polygonArrays = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];

  for (const polygon of polygonArrays) {
    for (const ring of polygon) {
      let projected = ring.map(projectCoord);

      const totalPoints = projected.length;
      let epsilon = 0.5;
      if (totalPoints > 500) epsilon = 2.0;
      else if (totalPoints > 200) epsilon = 1.0;
      else if (totalPoints > 100) epsilon = 0.7;

      projected = douglasPeucker(projected, epsilon);

      if (projected.length > 4) {
        const skip = Math.max(1, Math.floor(projected.length / 200));
        if (skip > 1) projected = simplifyDecimate(projected, skip);
      }

      if (projected.length < 3) continue;

      let d = `M ${projected[0][0]} ${projected[0][1]}`;
      for (let i = 1; i < projected.length; i++) {
        d += ` L ${projected[i][0]} ${projected[i][1]}`;
      }
      d += ' Z';
      allPaths.push({ d, points: projected });
    }
  }

  // Use the largest ring as the main path for centroid/label calculation
  let mainPath = allPaths[0];
  for (const p of allPaths) {
    if (p.points.length > mainPath.points.length) mainPath = p;
  }

  // Combine all rings into one path string
  const pathD = allPaths.map(p => p.d).join(' ');

  return { d: pathD, points: mainPath.points };
}

function computeCentroid(points) {
  let cx = 0, cy = 0;
  for (const [x, y] of points) { cx += x; cy += y; }
  return [Math.round(cx / points.length * 10) / 10, Math.round(cy / points.length * 10) / 10];
}

function computeRegionBBox(regionStates) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const sigla of regionStates) {
    if (!stateFeatures[sigla]) continue;
    const coords = extractAllCoords(stateFeatures[sigla]);
    for (const [lon, lat] of coords) {
      const [x, y] = projectCoord([lon, lat]);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  const pad = 15;
  return `${Math.round(minX - pad)} ${Math.round(minY - pad)} ${Math.round(maxX - minX + pad * 2)} ${Math.round(maxY - minY + pad * 2)}`;
}

// Generate output
const outputRegions = {};

for (const [regionName, regionDef] of Object.entries(REGIONS)) {
  const states = [];
  for (const sigla of regionDef.states) {
    const geometry = stateFeatures[sigla];
    if (!geometry) {
      console.warn(`Missing geometry for state: ${sigla}`);
      continue;
    }
    const { d, points } = geometryToPath(geometry);
    const [labelX, labelY] = computeCentroid(points);
    states.push({
      code: sigla,
      name: STATE_NAMES[sigla],
      path: d,
      labelX,
      labelY,
    });
  }

  outputRegions[regionName] = {
    name: regionName,
    color: regionDef.color,
    viewBox: computeRegionBBox(regionDef.states),
    states,
  };
}

// Build TypeScript
let ts = `export interface StatePath {
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

export const BRAZIL_VIEWBOX = '0 0 ${TARGET_WIDTH} ${TARGET_HEIGHT}';

export const REGION_MAP_DATA: Record<string, RegionPath> = {
`;

for (const [regionName, regionData] of Object.entries(outputRegions)) {
  const key = regionName.includes('-') ? `'${regionName}'` : regionName;
  ts += `  ${key}: {\n`;
  ts += `    name: '${regionData.name}',\n`;
  ts += `    color: '${regionData.color}',\n`;
  ts += `    viewBox: '${regionData.viewBox}',\n`;
  ts += `    states: [\n`;
  for (const s of regionData.states) {
    ts += `      { code: '${s.code}', name: '${s.name}', path: '${s.path}', labelX: ${s.labelX}, labelY: ${s.labelY} },\n`;
  }
  ts += `    ],\n`;
  ts += `  },\n`;
}

ts += `};

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
`;

fs.writeFileSync(OUTPUT_PATH, ts, 'utf8');
console.log(`Generated ${OUTPUT_PATH}`);
console.log('States processed:', Object.keys(outputRegions).reduce((a, r) => a + outputRegions[r].states.length, 0));
