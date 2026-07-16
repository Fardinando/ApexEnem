import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Sparkles, BookOpen, PenLine, BarChart3, Users, ArrowRight, ChevronDown, Brain, Shield, Zap, MapPin, ChevronRight, X } from 'lucide-react';
import { REGIONS, REGION_COLORS, STATES, getStatesByRegion, getCitiesByState, type RegionBR } from '../data/brazil-locations';
import { REGION_MAP_DATA, BRAZIL_VIEWBOX, getStateBBox } from '../data/brazil-map-paths';
import { CITY_COORDINATES } from '../data/brazil-city-coordinates';

function projectCityToSVG(lat: number, lon: number, stateCode: string): { x: number; y: number } | null {
  const bbox = getStateBBox(stateCode);
  if (!bbox) return null;
  const pad = 4;
  const xMin = bbox.minX + pad;
  const xMax = bbox.maxX - pad;
  const yMin = bbox.minY + pad;
  const yMax = bbox.maxY - pad;
  const lonMin = -74.0, lonMax = -34.8;
  const latMin = -33.7, latMax = 5.3;
  const nx = (lon - lonMin) / (lonMax - lonMin);
  const yMercTop = Math.log(Math.tan((Math.PI / 2) + (latMax * Math.PI / 360)));
  const yMercBot = Math.log(Math.tan((Math.PI / 2) + (latMin * Math.PI / 360)));
  const yMercCur = Math.log(Math.tan((Math.PI / 2) + (lat * Math.PI / 360)));
  const ny = (yMercTop - yMercCur) / (yMercTop - yMercBot);
  return { x: xMin + nx * (xMax - xMin), y: yMin + ny * (yMax - yMin) };
}

function CascataMap({ onRegionSelect }: { onRegionSelect?: (r: string, s: string, c: string) => void }) {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [stats, setStats] = useState<{ totalUsers: number; regionCounts: Record<string, number>; stateCounts: Record<string, number>; cityCounts: Record<string, number> } | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const statesInRegion = useMemo(
    () => selectedRegion ? getStatesByRegion(selectedRegion) : [],
    [selectedRegion]
  );
  const selectedStateObj = useMemo(
    () => selectedState ? STATES.find(s => s.code === selectedState) : null,
    [selectedState]
  );
  const citiesInState = useMemo(
    () => selectedStateObj ? selectedStateObj.cities : [],
    [selectedStateObj]
  );

  const currentViewBox = useMemo(() => {
    if (selectedState && selectedRegion) {
      const bbox = getStateBBox(selectedState);
      if (bbox) {
        const pad = 12;
        const w = bbox.maxX - bbox.minX + pad * 2;
        const h = bbox.maxY - bbox.minY + pad * 2;
        return `${bbox.minX - pad} ${bbox.minY - pad} ${w} ${h}`;
      }
      const regionData = REGION_MAP_DATA[selectedRegion];
      const stateData = regionData?.states.find(s => s.code === selectedState);
      if (stateData && regionData) {
        const [x, y] = regionData.viewBox.split(' ').map(Number);
        const sx = stateData.labelX - 40;
        const sy = stateData.labelY - 35;
        return `${Math.max(x, sx)} ${Math.max(y, sy)} 85 75`;
      }
    }
    if (selectedRegion && REGION_MAP_DATA[selectedRegion]) {
      return REGION_MAP_DATA[selectedRegion].viewBox;
    }
    return BRAZIL_VIEWBOX;
  }, [selectedRegion, selectedState]);

  const handleRegionClick = (region: string) => {
    setSelectedRegion(region);
    setSelectedState(null);
    setSelectedCity(null);
  };

  const handleStateClick = (stateCode: string) => {
    setSelectedState(stateCode);
    setSelectedCity(null);
  };

  const handleCityClick = (city: string) => {
    setSelectedCity(city);
    onRegionSelect?.(selectedRegion!, selectedState!, city);
  };

  const handleBack = () => {
    if (selectedCity) { setSelectedCity(null); }
    else if (selectedState) { setSelectedState(null); }
    else if (selectedRegion) { setSelectedRegion(null); }
  };

  const regionColors: Record<string, string> = {
    Norte: '#22c55e',
    Nordeste: '#f59e0b',
    'Centro-Oeste': '#3b82f6',
    Sudeste: '#ef4444',
    Sul: '#8b5cf6',
  };

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {!selectedRegion
              ? 'Explore o Brasil'
              : !selectedState
                ? `${selectedRegion} — Clique em um estado`
                : !selectedCity
                  ? `${selectedStateObj?.name} — Escolha uma cidade`
                  : `${selectedCity}, ${selectedStateObj?.name}`}
            {stats && stats.totalUsers > 0 && (
              <span className="ml-2 text-[10px] font-normal text-slate-400">({stats.totalUsers} {stats.totalUsers === 1 ? 'aluno' : 'alunos'})</span>
            )}
          </span>
        </div>
        {(selectedRegion || selectedState || selectedCity) && (
          <button onClick={handleBack} className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer">
            <ChevronRight className="h-3 w-3 rotate-180" /> Voltar
          </button>
        )}
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* SVG Map */}
        <div className="w-full flex justify-center">
          <svg
            viewBox={currentViewBox}
            className="w-full max-w-2xl transition-[viewBox] duration-700 ease-in-out"
            xmlns="http://www.w3.org/2000/svg"
            style={{ aspectRatio: '4/3' }}
          >
            <defs>
              <filter id="map-glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {!selectedRegion && REGIONS.map((region) => {
              const data = REGION_MAP_DATA[region];
              if (!data) return null;
              const isHovered = hoveredElement === region;
              return (
                <g
                  key={region}
                  onMouseEnter={() => setHoveredElement(region)}
                  onMouseLeave={() => setHoveredElement(null)}
                  onClick={() => handleRegionClick(region)}
                  className="cursor-pointer"
                  style={{ filter: isHovered ? 'url(#map-glow)' : 'none' }}
                >
                  {data.states.map((state) => (
                    <path
                      key={state.code}
                      d={state.path}
                      fill={data.color}
                      fillOpacity={isHovered ? 0.55 : 0.3}
                      stroke={data.color}
                      strokeWidth={isHovered ? 1.2 : 0.6}
                      strokeOpacity={0.7}
                      strokeLinejoin="round"
                      className="transition-all duration-300"
                    />
                  ))}
                  <text
                    x={data.states.reduce((a, s) => a + s.labelX, 0) / data.states.length}
                    y={data.states.reduce((a, s) => a + s.labelY, 0) / data.states.length - 5}
                    textAnchor="middle"
                    fill={isHovered ? data.color : '#64748b'}
                    fontSize={isHovered ? '12' : '9'}
                    fontWeight="700"
                    fontFamily="system-ui, sans-serif"
                    className="pointer-events-none select-none transition-all duration-300"
                  >
                    {region}
                  </text>
                  {stats && (
                    <text
                      x={data.states.reduce((a, s) => a + s.labelX, 0) / data.states.length}
                      y={data.states.reduce((a, s) => a + s.labelY, 0) / data.states.length + 8}
                      textAnchor="middle"
                      fill={isHovered ? data.color : '#94a3b8'}
                      fontSize="8"
                      fontWeight="700"
                      fontFamily="system-ui, sans-serif"
                      className="pointer-events-none select-none"
                    >
                      {stats.regionCounts?.[region] || 0} alunos
                    </text>
                  )}
                </g>
              );
            })}

            {selectedRegion && !selectedState && REGION_MAP_DATA[selectedRegion] && (
              <>
                {REGION_MAP_DATA[selectedRegion].states.map((state) => {
                  const isHovered = hoveredElement === state.code;
                  const regionColor = REGION_MAP_DATA[selectedRegion].color;
                  const bbox = getStateBBox(state.code);
                  const stateW = bbox ? bbox.maxX - bbox.minX : 80;
                  const scale = Math.min(1, stateW / 90);
                  const codeFs = Math.max(3, Math.round(5 + scale * 4));
                  const nameFs = Math.max(2, Math.round(2.5 + scale * 2));
                  const countFs = Math.max(2, Math.round(2.5 + scale * 2));
                  return (
                    <g
                      key={state.code}
                      onMouseEnter={() => setHoveredElement(state.code)}
                      onMouseLeave={() => setHoveredElement(null)}
                      onClick={() => handleStateClick(state.code)}
                      className="cursor-pointer"
                      style={{ filter: isHovered ? 'url(#map-glow)' : 'none' }}
                    >
                      <path
                        d={state.path}
                        fill={regionColor}
                        fillOpacity={isHovered ? 0.6 : 0.35}
                        stroke={regionColor}
                        strokeWidth={isHovered ? 2 : 1}
                        strokeOpacity={0.8}
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                      />
                      <text
                        x={state.labelX}
                        y={state.labelY - 3}
                        textAnchor="middle"
                        fill={isHovered ? regionColor : '#334155'}
                        fontSize={isHovered ? codeFs + 2 : codeFs}
                        fontWeight="700"
                        fontFamily="system-ui, sans-serif"
                        className="pointer-events-none select-none transition-all duration-300"
                      >
                        {state.code}
                      </text>
                      <text
                        x={state.labelX}
                        y={state.labelY + 4}
                        textAnchor="middle"
                        fill={isHovered ? '#1e293b' : '#64748b'}
                        fontSize={nameFs}
                        fontFamily="system-ui, sans-serif"
                        className="pointer-events-none select-none transition-all duration-300"
                      >
                        {state.name}
                      </text>
                      {stats && (
                        <text
                          x={state.labelX}
                          y={state.labelY + 4 + nameFs + 1}
                          textAnchor="middle"
                          fill={regionColor}
                          fontSize={countFs}
                          fontWeight="700"
                          fontFamily="system-ui, sans-serif"
                          className="pointer-events-none select-none"
                        >
                          {stats.stateCounts?.[state.code] || 0} alunos
                        </text>
                      )}
                    </g>
                  );
                })}
              </>
            )}

            {selectedRegion && selectedState && selectedStateObj && (
              <>
                {(() => {
                  const regionColor = REGION_MAP_DATA[selectedRegion]?.color || '#3b82f6';
                  const statePathData = REGION_MAP_DATA[selectedRegion]?.states.find(s => s.code === selectedState);
                  if (statePathData) {
                    return (
                      <path
                        d={statePathData.path}
                        fill={regionColor}
                        fillOpacity={0.25}
                        stroke={regionColor}
                        strokeWidth={2}
                        strokeLinejoin="round"
                      />
                    );
                  }
                  return null;
                })()}
                {citiesInState.map((city) => {
                  const stateCode = selectedState!;
                  const coordKey = `${stateCode}:${city}`;
                  const cityCoord = CITY_COORDINATES[coordKey];
                  if (!cityCoord) return null;
                  const projected = projectCityToSVG(cityCoord.lat, cityCoord.lon, stateCode);
                  if (!projected) return null;
                  const px = projected.x;
                  const py = projected.y;
                  const isSelected = selectedCity === city;
                  const isHov = hoveredElement === city;
                  const hasUsers = stats && (stats.cityCounts?.[city] ?? 0) > 0;
                  const userCount = stats?.cityCounts?.[city] ?? 0;
                  return (
                    <g
                      key={city}
                      onMouseEnter={() => setHoveredElement(city)}
                      onMouseLeave={() => setHoveredElement(null)}
                      onClick={() => handleCityClick(city)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={px}
                        cy={py}
                        r={isSelected ? 2.8 : isHov ? 2.2 : hasUsers ? 1.6 : 1}
                        fill={isSelected ? REGION_MAP_DATA[selectedRegion]?.color : isHov ? '#3b82f6' : hasUsers ? '#3b82f6' : '#94a3b8'}
                        fillOpacity={hasUsers ? 1 : 0.4}
                        className="transition-all duration-200"
                      />
                      {(isSelected || isHov) && (
                        <text
                          x={px}
                          y={py - 4}
                          textAnchor="middle"
                          fill={isSelected ? REGION_MAP_DATA[selectedRegion]?.color : '#1e293b'}
                          fontSize="3.5"
                          fontWeight="700"
                          fontFamily="system-ui, sans-serif"
                          className="pointer-events-none select-none"
                        >
                          {city}{userCount > 0 ? ` (${userCount})` : ''}
                        </text>
                      )}
                    </g>
                  );
                })}
              </>
            )}
          </svg>
        </div>

        {/* City list below map when in city view */}
        {selectedRegion && selectedState && selectedStateObj && (
          <div className="w-full max-w-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: regionColors[selectedRegion] || '#3b82f6' }} />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{selectedStateObj.name}</span>
              <span className="text-[10px] text-slate-400">— {citiesInState.length} cidades</span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
              {citiesInState.map((city) => (
                <motion.button
                  key={city}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCityClick(city)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedCity === city
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
                  }`}
                >
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{city}</span>
                  {stats && stats.cityCounts?.[city] != null && stats.cityCounts[city] > 0 && (
                    <span className="text-[9px] text-blue-500 font-mono ml-1">{stats.cityCounts[city]}</span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Region list when no region selected */}
        {!selectedRegion && (
          <div className="grid grid-cols-5 gap-2 w-full max-w-lg">
            {REGIONS.map((region) => {
              const isHov = hoveredElement === region;
              return (
                <button
                  key={region}
                  onMouseEnter={() => setHoveredElement(region)}
                  onMouseLeave={() => setHoveredElement(null)}
                  onClick={() => handleRegionClick(region)}
                  className={`p-2 rounded-xl text-center transition-all cursor-pointer border ${
                    isHov ? 'shadow-md scale-105' : ''
                  }`}
                  style={{
                    borderColor: isHov ? regionColors[region] : 'transparent',
                    backgroundColor: isHov ? `${regionColors[region]}15` : `${regionColors[region]}08`,
                  }}
                >
                  <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: regionColors[region] }} />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 block leading-tight">{region}</span>
                </button>
              );
            })}
          </div>
        )}

        {selectedCity && selectedStateObj && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 text-center"
          >
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
              {selectedCity}, {selectedStateObj.name} · {selectedRegion}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cadastre-se e comece a estudar!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function LandingPage({ onStart, onSignup }: { onStart: () => void; onSignup?: () => void }) {
  const [stats, setStats] = useState<{ totalUsers: number } | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    { icon: Zap, title: 'Correção de Redação', desc: 'Envie sua redação e receba correção detalhada seguindo as 5 competências do ENEM, com nota de 0 a 1000.', color: 'from-blue-500 to-blue-600' },
    { icon: Brain, title: 'Questões Mágicas', desc: 'A IA gera questões inéditas e personalizadas no estilo ENEM, focadas nas áreas onde você precisa treinar mais.', color: 'from-purple-500 to-purple-600' },
    { icon: BarChart3, title: 'Simulados Reais', desc: 'Resolva questões autênticas do ENEM dos anos anteriores, com correção automática e análise detalhada.', color: 'from-emerald-500 to-emerald-600' },
    { icon: BookOpen, title: 'Plano Adaptativo', desc: 'Com base nos seus erros, a plataforma cria um plano de estudos personalizado, priorizando seus pontos fracos.', color: 'from-amber-500 to-amber-600' },
    { icon: Users, title: 'Acompanhamento', desc: 'Veja sua evolução ao longo do tempo com gráficos e estatísticas para monitorar seu progresso.', color: 'from-rose-500 to-rose-600' },
    { icon: Shield, title: 'Erro? A IA Corrige', desc: 'Encontrou um erro em uma questão? Reporte e nossa IA investiga, corrige e faz o deploy automaticamente.', color: 'from-cyan-500 to-cyan-600' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0814] text-slate-800 dark:text-slate-100">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0a0814]/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-display font-extrabold text-lg tracking-tight">Apex<span className="text-blue-600">Enem</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
            <button type="button" onClick={() => scrollTo('features')} className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer">Recursos</button>
            <button type="button" onClick={() => scrollTo('map-section')} className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer">Mapa</button>
          </nav>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onStart} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition cursor-pointer">Entrar</button>
            <button type="button" onClick={onSignup} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition cursor-pointer">Cadastrar</button>
          </div>
        </div>
      </header>

      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-[#0a0814] dark:via-[#0f0a1e] dark:to-[#0a0814]" />
        <div className="absolute top-1/4 -left-32 w-80 h-80 bg-blue-400/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-400/20 rounded-full blur-[120px]" />
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-400 mb-8">
              <Sparkles className="h-3.5 w-3.5" />
              Plataforma Inteligente para o ENEM
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6">
            Alcance seu{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ápice</span>
            {' '}no ENEM
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Correção de redações por IA, simulados personalizados, questões inéditas no estilo ENEM e acompanhamento completo da sua evolução — tudo gratuito.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button type="button" onClick={onSignup} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-200/50 dark:shadow-none flex items-center gap-2 cursor-pointer">
              Criar Conta Grátis <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={onStart} className="px-8 py-3.5 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-300 font-semibold text-sm rounded-xl transition flex items-center gap-2 cursor-pointer">
              Já tenho conta → Entrar
            </button>
            <button type="button" onClick={() => scrollTo('features')} className="px-8 py-3.5 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-300 font-semibold text-sm rounded-xl transition flex items-center gap-2 cursor-pointer">
              Ver Recursos <ChevronDown className="h-4 w-4" />
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Brain, label: '10 IAs na Correção', desc: 'Redações analisadas por múltiplos modelos' },
              { icon: PenLine, label: 'Questões Inéditas', desc: 'Geradas no estilo ENEM por IA' },
              { icon: BarChart3, label: 'Simulados Reais', desc: 'Questões do ENEM autênticas' },
              { icon: Shield, label: '100% Gratuito', desc: 'Sem taxa, sem assinatura, sem limites' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-100 dark:border-slate-800 text-center">
                <div className="mx-auto mb-3 p-2 w-fit bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold mb-1">{item.label}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {stats && stats.totalUsers > 0 && (
        <section className="py-12 border-y border-slate-100 dark:border-slate-800/50 bg-white dark:bg-[#0a0814]">
          <div className="max-w-4xl mx-auto px-4 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-950/40 rounded-xl">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stats.totalUsers.toLocaleString('pt-BR')}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                  {stats.totalUsers === 1 ? 'aluno cadastrado' : 'alunos cadastrados'}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section id="features" className="py-20 md:py-28 bg-slate-50/50 dark:bg-[#0f0a1e]/50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Tudo que você precisa para gabaritar</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Ferramentas completas de preparação para o ENEM, combinadas com inteligência artificial de ponta.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }} whileHover={{ y: -4 }} className="p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition group">
                <div className={`p-3 w-fit rounded-xl bg-gradient-to-br ${feature.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold mb-2">{feature.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="map-section" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Estudantes de Todo o Brasil</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Explore nossa comunidade por região, estado e cidade. Selecione sua localização para encontrar colegas próximos.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <CascataMap />
          </motion.div>
        </div>
      </section>

      <section id="cta" className="py-20 md:py-28 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">Pronto para alcançar seu ápice?</h2>
            <p className="text-lg text-white/80 max-w-xl mx-auto mb-10 leading-relaxed">
              Junte-se a centenas de estudantes que já estão usando a plataforma para transformar seus estudos e garantir a vaga na universidade dos sonhos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={onSignup} className="px-10 py-4 bg-white text-blue-700 font-bold text-sm rounded-xl transition shadow-xl hover:shadow-2xl flex items-center gap-2 cursor-pointer">
                Criar Conta Grátis <ArrowRight className="h-4 w-4" />
              </motion.button>
              <button type="button" onClick={onStart} className="px-8 py-4 border border-white/30 text-white font-semibold text-sm rounded-xl hover:bg-white/10 transition cursor-pointer">
                Já tenho conta
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <GraduationCap className="h-4 w-4" />
            ApexEnem © 2026 — Plataforma Educacional Adaptativa
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <span>Feito com 💙 para estudantes brasileiros</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
