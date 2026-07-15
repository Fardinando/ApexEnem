import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Sparkles, BookOpen, PenLine, BarChart3, Users, ArrowRight, ChevronDown, Brain, Shield, Zap, MapPin, ChevronRight, X } from 'lucide-react';
import { REGIONS, REGION_COLORS, STATES, getStatesByRegion, getCitiesByState, type RegionBR } from '../data/brazil-locations';

interface Stats {
  totalUsers: number;
  regionCounts: Record<string, number>;
  tablesExist?: boolean;
}

function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) return;
    let start = 0;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <>{display}</>;
}

function DoughnutChart({ data }: { data?: Record<string, number> }) {
  if (!data || typeof data !== 'object') {
    return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Nenhum dado disponível ainda</div>;
  }
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Nenhum dado disponível ainda</div>;
  }
  const values = REGIONS.map(r => data[r] || 0);
  const totalVal = values.reduce((a, b) => a + b, 0);
  let cumulativePercent = 0;
  const slices = values.map((v, i) => {
    const percent = v / totalVal;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    return { percent, startPercent, color: REGION_COLORS[REGIONS[i]], label: REGIONS[i], value: v };
  });
  const cx = 120, cy = 120, r = 90, strokeWidth = 28;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center">
        <svg width="240" height="240" viewBox="0 0 240 240" className="-rotate-90">
          {slices.map((slice, i) => {
            if (slice.percent === 0) return null;
            const offset = circumference * (1 - slice.startPercent);
            const len = circumference * slice.percent;
            return (
              <motion.circle
                key={i}
                cx={cx} cy={cy} r={r}
                fill="none" stroke={slice.color} strokeWidth={strokeWidth}
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={offset}
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray: `${len} ${circumference - len}` }}
                transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={r - strokeWidth / 2} fill="white" className="dark:fill-[#0a0814]" />
        </svg>
        <div className="absolute flex flex-col items-center pointer-events-none">
          <span className="text-3xl font-extrabold text-slate-800 dark:text-white"><AnimatedCounter value={totalVal} /></span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Usuários</span>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-3 w-full max-w-md">
        {slices.map((s, i) => (
          <div key={i} className="text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: s.color }} />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{s.label}</span>
            </div>
            <span className="text-xs font-mono text-slate-400">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CascataMap({ onRegionSelect }: { onRegionSelect?: (r: string, s: string, c: string) => void }) {
  const [hoveredRegion, setHoveredRegion] = useState<RegionBR | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionBR | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const statesInRegion = useMemo(() => selectedRegion ? getStatesByRegion(selectedRegion) : [], [selectedRegion]);
  const selectedStateObj = useMemo(() => selectedState ? STATES.find(s => s.code === selectedState) : null, [selectedState]);
  const citiesInState = useMemo(() => selectedStateObj ? selectedStateObj.cities : [], [selectedStateObj]);

  const handleRegionClick = (region: RegionBR) => {
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

  const regionPaths: Record<RegionBR, string> = {
    Norte: 'M 120 20 L 180 15 L 220 25 L 240 50 L 230 80 L 200 95 L 170 90 L 140 85 L 110 70 L 100 45 Z',
    Nordeste: 'M 200 95 L 240 80 L 280 85 L 310 100 L 320 130 L 300 155 L 270 160 L 240 150 L 220 130 L 210 110 Z',
    'Centro-Oeste': 'M 140 85 L 170 90 L 200 95 L 210 110 L 220 130 L 210 160 L 180 170 L 150 165 L 120 150 L 110 120 L 115 95 Z',
    Sudeste: 'M 210 160 L 240 150 L 270 160 L 280 180 L 270 200 L 250 210 L 230 205 L 215 190 L 200 175 Z',
    Sul: 'M 180 170 L 210 160 L 200 175 L 215 190 L 230 205 L 225 225 L 210 240 L 190 245 L 175 235 L 170 215 L 165 195 Z',
  };

  const regionLabels: Record<RegionBR, { x: number; y: number }> = {
    Norte: { x: 165, y: 55 },
    Nordeste: { x: 265, y: 120 },
    'Centro-Oeste': { x: 165, y: 130 },
    Sudeste: { x: 245, y: 185 },
    Sul: { x: 195, y: 215 },
  };

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {!selectedRegion ? 'Explore o Brasil' : !selectedState ? `Região ${selectedRegion}` : !selectedCity ? `${selectedStateObj?.name} — Escolha uma cidade` : `${selectedCity}, ${selectedStateObj?.name}`}
          </span>
        </div>
        {(selectedRegion || selectedState || selectedCity) && (
          <button onClick={handleBack} className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer">
            <ChevronRight className="h-3 w-3 rotate-180" /> Voltar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* SVG Map */}
        <div className="flex justify-center">
          <svg viewBox="0 0 360 270" className="w-full max-w-md" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
              </filter>
            </defs>

            {REGIONS.map((region) => {
              const isHovered = hoveredRegion === region;
              const isSelected = selectedRegion === region;
              const isActive = isHovered || isSelected;
              const baseColor = REGION_COLORS[region];
              const fillOpacity = isActive ? 0.5 : 0.25;
              const strokeW = isActive ? 2.5 : 1.5;

              return (
                <g
                  key={region}
                  onMouseEnter={() => setHoveredRegion(region)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => handleRegionClick(region)}
                  className="cursor-pointer transition-all"
                  style={{ filter: isActive ? 'url(#glow)' : 'none' }}
                >
                  <path
                    d={regionPaths[region]}
                    fill={baseColor}
                    fillOpacity={fillOpacity}
                    stroke={baseColor}
                    strokeWidth={strokeW}
                    strokeLinejoin="round"
                    className="transition-all duration-200"
                  />
                  <text
                    x={regionLabels[region].x}
                    y={regionLabels[region].y}
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                    fill={isActive ? baseColor : '#64748b'}
                    fontSize={isActive ? '11' : '9'}
                    fontWeight={isActive ? '800' : '600'}
                    fontFamily="system-ui, sans-serif"
                  >
                    {region}
                  </text>
                </g>
              );
            })}

            {/* Brazil outline hint */}
            <text x="180" y="262" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
              {selectedRegion ? 'Clique em "Voltar" para ver o mapa' : 'Clique em uma região para explorar'}
            </text>
          </svg>
        </div>

        {/* Drill-down panel */}
        <div className="min-h-[280px]">
          <AnimatePresence mode="wait">
            {!selectedRegion && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Clique em uma região no mapa para ver os estados</p>
                {REGIONS.map((region) => (
                  <motion.button
                    key={region}
                    whileHover={{ x: 4 }}
                    onClick={() => handleRegionClick(region)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer text-left group"
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: REGION_COLORS[region] }} />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{region}</span>
                      <span className="text-[10px] text-slate-400 ml-2">{getStatesByRegion(region).length} estados</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 transition" />
                  </motion.button>
                ))}
              </motion.div>
            )}

            {selectedRegion && !selectedState && (
              <motion.div
                key="states"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: REGION_COLORS[selectedRegion] }} />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{selectedRegion}</span>
                  <span className="text-[10px] text-slate-400">— {statesInRegion.length} estados</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {statesInRegion.map((state) => (
                    <motion.button
                      key={state.code}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStateClick(state.code)}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all cursor-pointer"
                    >
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">{state.name}</span>
                      <span className="text-[10px] text-slate-400">{state.cities.length} cidades</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {selectedRegion && selectedState && selectedStateObj && (
              <motion.div
                key="cities"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: REGION_COLORS[selectedRegion] }} />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{selectedStateObj.name}</span>
                  <span className="text-[10px] text-slate-400">— {citiesInState.length} cidades</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-1">
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
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {selectedCity && selectedStateObj && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 text-center"
            >
              <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                {selectedCity}, {selectedStateObj.name} · {selectedRegion}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cadastre-se e comece a estudar!</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onStart, onSignup }: { onStart: () => void; onSignup?: () => void }) {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, regionCounts: { Norte: 0, Nordeste: 0, 'Centro-Oeste': 0, Sudeste: 0, Sul: 0 }, tablesExist: false });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        setStats(data);
      } catch {} finally {
        setStatsLoading(false);
      }
    })();
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
            <button type="button" onClick={() => scrollTo('stats-section')} className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer">Estatísticas</button>
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

      <section id="stats-section" className="py-20 md:py-28 bg-slate-50/50 dark:bg-[#0f0a1e]/50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Impacto em Todo o Brasil</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Estudantes de todas as regiões usando a plataforma para alcançar o ápice no ENEM.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
            <div className="relative flex items-center justify-center">
              {statsLoading ? (
                <div className="w-60 h-60 rounded-full bg-slate-100 dark:bg-[#1e293b] animate-pulse flex items-center justify-center text-slate-400 text-sm">Carregando...</div>
              ) : (
                <div className="relative">
                  <DoughnutChart data={stats.regionCounts} />
                </div>
              )}
            </div>
            <div className="text-center md:text-left space-y-6">
              <div>
                <span className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {statsLoading ? '...' : <AnimatedCounter value={stats.totalUsers} />}
                </span>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-wider">Usuários Ativos</p>
              </div>
              <div className="space-y-3">
                {REGIONS.map((r, i) => {
                  const rc = stats.regionCounts || {} as Record<string, number>;
                  const count = rc[r] || 0;
                  const pct = stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0;
                  return (
                    <div key={r} className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: REGION_COLORS[r] }} />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300 w-28">{r}</span>
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-[#1e293b] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: REGION_COLORS[r] }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                        />
                      </div>
                      <span className="text-xs font-mono text-slate-400 w-10 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
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
