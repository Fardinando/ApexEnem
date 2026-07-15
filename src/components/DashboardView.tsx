/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  FileText, 
  BookOpen, 
  TrendingUp, 
  BarChart2, 
  ArrowUpRight, 
  Sparkles, 
  CheckCircle,
  HelpCircle,
  Clock,
  Trophy,
  Zap,
  Star
} from 'lucide-react';
import { UserProfile, EssayCorrection, ActivityLog } from '../types';
import { getLevelFromXp, getLevelTitle, type GamificationStats, type Achievement } from '../lib/gamification';
import AdPlaceholder from './AdPlaceholder';

interface DashboardViewProps {
  currentUser: UserProfile;
  setActiveTab: (tab: string) => void;
  essayCorrections: EssayCorrection[];
  simuladosHistory: { scorePercent: number; date: string; subject: string }[];
  activityLogs: ActivityLog[];
  gamificationStats: GamificationStats;
  achievements: Achievement[];
}

export default function DashboardView({ 
  currentUser, 
  setActiveTab, 
  essayCorrections, 
  simuladosHistory,
  activityLogs,
  gamificationStats,
  achievements,
}: DashboardViewProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const levelInfo = getLevelFromXp(currentUser.totalXp || 0);
  const levelTitle = getLevelTitle(levelInfo.level);

  // Subject breakdown from simulados
  const subjectBreakdown: Record<string, { count: number; avgScore: number }> = {};
  simuladosHistory.forEach(s => {
    if (!subjectBreakdown[s.subject]) subjectBreakdown[s.subject] = { count: 0, avgScore: 0 };
    subjectBreakdown[s.subject].count++;
    subjectBreakdown[s.subject].avgScore += s.scorePercent;
  });
  Object.keys(subjectBreakdown).forEach(k => {
    subjectBreakdown[k].avgScore = Math.round(subjectBreakdown[k].avgScore / subjectBreakdown[k].count);
  });
  const sortedSubjects = Object.entries(subjectBreakdown).sort((a, b) => b[1].count - a[1].count);

  // Initialize stats with real data
  const totalEssays = essayCorrections.length;
  const avgEssayScore = essayCorrections.length 
    ? Math.round(essayCorrections.reduce((acc, curr) => acc + curr.score, 0) / essayCorrections.length)
    : 0;

  const totalSimulados = simuladosHistory.length;
  const avgCorrectRate = simuladosHistory.length
    ? Math.round(simuladosHistory.reduce((acc, curr) => acc + curr.scorePercent, 0) / simuladosHistory.length)
    : 0;

  // Let's model essay scores for lines
  // Use real data only, strictly representing veridical stats
  const essayHistoryScores = essayCorrections.map(e => e.score).reverse();

  const essayLabels = essayCorrections.map(e => e.title.substring(0, 10) + '...').reverse();

  // Radar chart competencies values (sum of real values)
  const compValues = essayCorrections.length
    ? [1, 2, 3, 4, 5].map(id => {
        let sum = 0;
        essayCorrections.forEach(e => {
          const comp = (e.competencies || []).find(c => c.id === id);
          sum += comp ? comp.score : 0;
        });
        return Math.round(sum / essayCorrections.length);
      })
    : [0, 0, 0, 0, 0];

  // Radar computations
  const maxVal = 200;
  const rLimit = 85; 
  const cX = 120;
  const cY = 110;

  const radarPoints = compValues.map((score, index) => {
    const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
    const r = (score / maxVal) * rLimit;
    return {
      x: cX + r * Math.cos(angle),
      y: cY + r * Math.sin(angle),
    };
  });

  const radarPath = radarPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Standard guide rings coordinates
  const getRingPointsPath = (radius: number) => {
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      pts.push(`${cX + radius * Math.cos(angle)},${cY + radius * Math.sin(angle)}`);
    }
    return pts.join(' ');
  };

  const getDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div id="dashboard-container" className="space-y-8 pb-12 animate-fade-in">
      
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            {getDayGreeting()}, {currentUser.name.split(' ')[0]}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Acompanhe seu avanço em rumo aos {currentUser.targetScore || 900}+ pontos no ENEM.
          </p>
        </div>

        {/* Target Meta Highlight Badge */}
        <div className="flex items-center gap-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl shadow-lg shadow-blue-100 dark:shadow-none">
          <TrendingUp className="h-5 w-5 text-blue-100" />
          <div>
            <span className="block text-[10px] uppercase font-mono tracking-wider opacity-85 font-bold">Foco no Sonho</span>
            <span className="text-sm font-bold font-display">Simulando {currentUser.targetScore || 920} pontos</span>
          </div>
        </div>
      </div>

      <AdPlaceholder slot="dashboard-topo" format="banner" className="my-6" user={currentUser} setActiveTab={setActiveTab} />

      {/* Grid Bento Box System layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5" id="bento-box-grid">
        
        {/* Bento Card 1: Streak / Ofensiva Flame Card (Small Box but highly visual - Amber Bento style with centered 3D glass fire of current days) */}
        <div id="bento-streak" className="md:col-span-4 !bg-gradient-to-br !from-[#F59E0B] !to-[#D97706] text-white border-none p-5 rounded-3xl flex flex-col justify-between items-center text-center min-h-[220px] relative overflow-hidden shadow-lg transition-all hover:scale-[1.02] duration-300">
          
          <div className="relative z-10">
            <span className="text-[10px] uppercase tracking-wider font-mono font-extrabold opacity-80 text-amber-50">Nível {levelInfo.level} — {levelTitle}</span>
            <h3 className="font-display font-black text-xl mt-0.5 text-white">Foco Diário</h3>
          </div>

          {/* Centered Large 3D Glass Fire container - placed in the middle of the box */}
          <div className="relative w-36 h-36 my-2 flex items-center justify-center pointer-events-none select-none z-10 transition-transform">
            {/* Background heat glow */}
            <div className="absolute w-28 h-28 bg-red-600/30 rounded-full filter blur-xl animate-pulse"></div>
            <div className="absolute w-20 h-20 bg-yellow-400/40 rounded-full filter blur-lg animate-pulse delay-75"></div>
            
            {/* 3D Glass Teardrop Flame Shape */}
            <div className="absolute w-24 h-24 bg-white/10 border-2 border-white/50 rounded-[50%_0_55%_50%] rotate-[-45deg] backdrop-blur-[6px] shadow-[inset_0_4px_12px_rgba(255,255,255,0.6),_0_8px_24px_rgba(0,0,0,0.15)] flex items-center justify-center">
              {/* Internal Flame Ripple */}
              <div className="absolute w-12 h-12 bg-gradient-to-tr from-[#EA580C] to-[#FACC15] rounded-[50%_0_50%_50%] opacity-40 shadow-inner"></div>
            </div>
            
            {/* Number of days inside the flame */}
            <div className="absolute inset-0 flex flex-col justify-center items-center z-20">
              <span className="text-4xl font-extrabold font-display text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.55)] flex items-center justify-center leading-none">
                {currentUser.streak || 1}
              </span>
              <span className="text-[9px] uppercase tracking-wider font-mono font-black text-amber-50 drop-shadow-sm leading-none mt-0.5 block">
                Dias
              </span>
            </div>
          </div>

          <div className="relative z-10 space-y-1">
            <div>
              <span className="text-sm font-display font-bold tracking-tight text-white">{currentUser.streak || 1} dias de garra</span>
            </div>
            <p className="text-[10px] opacity-90 leading-relaxed text-amber-50 max-w-[90%] mx-auto">
              Complete simulados e redações para expandir seu fogo!
            </p>
            {/* XP Progress Bar */}
            <div className="mt-2">
              <div className="flex justify-between text-[9px] font-mono text-amber-100 mb-0.5">
                <span>{levelInfo.currentXp} XP</span>
                <span>{levelInfo.nextThreshold} XP</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${levelInfo.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bento Card 2: Quick Statistic Grid Panel */}
        <div id="bento-stats" className="md:col-span-8 bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-6 bento-card">
          
          {/* Stat Item 1: Redacoes */}
          <div className="flex flex-col justify-between p-4 bg-slate-50 dark:bg-[#0f172a]/60 border border-slate-200/60 dark:border-slate-800/60 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-extrabold">Redações</span>
              <FileText className="h-4.5 w-4.5 text-blue-500" />
            </div>
            <div>
              <span className="block text-2xl font-display font-black text-slate-800 dark:text-slate-100">
                {totalEssays}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">corrigidas por IA</p>
            </div>
          </div>

          {/* Stat Item 2: Media Redacao */}
          <div className="flex flex-col justify-between p-4 bg-slate-50 dark:bg-[#0f172a]/60 border border-slate-200/60 dark:border-slate-800/60 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-extrabold">Nota Média</span>
              <Sparkles className="h-4.5 w-4.5 text-amber-500" />
            </div>
            <div>
              <span className="block text-2xl font-display font-black text-slate-800 dark:text-slate-100">
                {avgEssayScore}
              </span>
              <p className="text-[10px] text-green-500 mt-1 font-semibold">↑ No alvo {currentUser.targetScore}</p>
            </div>
          </div>

          {/* Stat Item 3: Simulados */}
          <div className="flex flex-col justify-between p-4 bg-slate-50 dark:bg-[#0f172a]/60 border border-slate-200/60 dark:border-slate-800/60 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-extrabold">Simulados</span>
              <BookOpen className="h-4.5 w-4.5 text-purple-500" />
            </div>
            <div>
              <span className="block text-2xl font-display font-black text-slate-800 dark:text-slate-100">
                {totalSimulados}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">completados</p>
            </div>
          </div>

          {/* Stat Item 4: Acertos */}
          <div className="flex flex-col justify-between p-4 bg-slate-50 dark:bg-[#0f172a]/60 border border-slate-200/60 dark:border-slate-800/60 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-extrabold">Acertos (M)</span>
              <BarChart2 className="h-4.5 w-4.5 text-emerald-500" />
            </div>
            <div>
              <span className="block text-2xl font-display font-black text-slate-800 dark:text-slate-100">
                {avgCorrectRate}%
              </span>
              <p className="text-[10px] text-slate-500 mt-1">taxa de acertos</p>
            </div>
          </div>

        </div>

        {/* Bento Card 3: Line Chart (Evolução em Redação) - Large Column */}
        <div id="bento-chart-line" className="md:col-span-8 bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bento-card flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display font-extrabold text-slate-800 dark:text-slate-100 text-sm md:text-base flex items-center gap-1.5">
                <TrendingUp className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                Evolução Teórica em Redação
              </h3>
              <p className="text-slate-400 text-xs">Acompanhamento dos scores agregados das redações submetidas</p>
            </div>
            <button
              onClick={() => setActiveTab('redacao')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl transition cursor-pointer"
            >
              <span>Escrever Nova</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          {/* Custom SVG Line Chart */}
          <div className="w-full h-44 relative" id="line-svg-container">
            {essayCorrections.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-slate-50/50 dark:bg-[#0f172a]/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <FileText className="h-7 w-7 text-blue-500/65 mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-350">Nenhuma redação enviada</p>
                <p className="text-[10px] text-slate-450 max-w-sm mt-0.5 leading-relaxed">As notas das suas redações corrigidas por Inteligência Artificial aparecerão aqui de forma clara e cronológica.</p>
              </div>
            ) : (
              <svg viewBox="0 0 500 160" className="w-full h-full text-blue-500">
                {/* Gradients */}
                <defs>
                  <linearGradient id="glow-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Grid Lines horizontal */}
                <line x1="30" y1="30" x2="480" y2="30" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="3 3" />
                <line x1="30" y1="65" x2="480" y2="65" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="3 3" />
                <line x1="30" y1="100" x2="480" y2="100" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="3 3" />
                <line x1="30" y1="135" x2="480" y2="135" stroke="currentColor" strokeOpacity="0.1" />

                {/* Grid labels */}
                <text x="5" y="34" className="text-[8px] font-mono fill-slate-400">1000</text>
                <text x="5" y="69" className="text-[8px] font-mono fill-slate-400">750</text>
                <text x="5" y="104" className="text-[8px] font-mono fill-slate-400">500</text>
                <text x="5" y="139" className="text-[8px] font-mono fill-slate-400">250</text>

                {/* Spline Path Drawing */}
                {(() => {
                  const count = essayHistoryScores.length;
                  const points = essayHistoryScores.map((score, idx) => {
                    const x = 40 + (idx * 410) / (count - 1 || 1);
                    // Map score 0-1000 to y-pos 135 to 20
                    const y = 135 - ((score - 100) / 900) * 115;
                    return { x, y, score };
                  });

                  // Path points
                  const pathData = points.reduce((acc, p, idx) => {
                    return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
                  }, '');

                  // Fill area Path points
                  const fillPath = points.length > 0 
                    ? `${pathData} L ${points[points.length - 1].x} 135 L ${points[0].x} 135 Z`
                    : '';

                  return (
                    <>
                      {/* Glowing undercoat area */}
                      {fillPath && <path d={fillPath} fill="url(#glow-grad)" />}

                      {/* Smooth bold line */}
                      {pathData && (
                        <path
                          d={pathData}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                          className="stroke-blue-600 dark:stroke-blue-400 drop-shadow-md"
                        />
                      )}

                      {/* Interactable Dots */}
                      {points.map((p, idx) => (
                        <g 
                          key={idx} 
                          className="cursor-pointer group"
                          onMouseEnter={() => setHoveredPoint(idx)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        >
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={hoveredPoint === idx ? '8' : '5'}
                            className="fill-blue-600 dark:fill-blue-400 transition-all duration-150"
                          />
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={hoveredPoint === idx ? '11' : '0'}
                            className="stroke-blue-300 dark:stroke-blue-800 fill-none transition-all duration-150"
                            strokeWidth="2"
                          />
                          {/* Dot Label score */}
                          <text
                            x={p.x}
                            y={p.y - 12}
                            textAnchor="middle"
                            className={`text-[9.5px] font-display font-extrabold fill-slate-800 dark:fill-slate-100 transition-opacity duration-200 ${
                              hoveredPoint === idx ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'
                            }`}
                          >
                            {p.score}
                          </text>
                        </g>
                      ))}

                      {/* X Axis Labels */}
                      {points.map((p, idx) => (
                        <text
                          key={`lbl-${idx}`}
                          x={p.x}
                          y="152"
                          textAnchor="middle"
                          className="text-[8px] font-mono fill-slate-450"
                        >
                          {essayLabels[idx]}
                        </text>
                      ))}
                    </>
                  );
                })()}
              </svg>
            )}
          </div>
        </div>

        {/* Bento Card 4: Radar Chart (Competências) - Small Column */}
        <div id="bento-chart-radar" className="md:col-span-4 bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bento-card flex flex-col justify-between relative overflow-hidden">
          <div>
            <h3 className="font-display font-extrabold text-slate-800 dark:text-slate-100 text-sm">
              Análise de Competências
            </h3>
            <p className="text-slate-400 text-[10px] mt-0.5">Visão espacial das 5 habilidades do ENEM</p>
          </div>

          {/* SVG Radar Chart Renderer */}
          <div className="flex justify-center py-2 relative" id="radar-chart-stage">
            {essayCorrections.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 bg-slate-50/50 dark:bg-[#0f172a]/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 z-10">
                <BarChart2 className="h-6 w-6 text-purple-500/65 mb-1.5" />
                <p className="text-[11px] font-bold text-slate-705 dark:text-slate-350">Radar vazio</p>
                <p className="text-[9px] text-slate-400 max-w-xs mt-0.5 leading-relaxed">Sua primeira correção de redação mapeará o gráfico poligonal aqui em tempo real.</p>
              </div>
            )}
            <svg width="240" height="225" className="text-blue-500 dark:text-blue-400">
              {/* Pentagonal Guides */}
              <polygon points={getRingPointsPath(rLimit)} className="fill-none stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
              <polygon points={getRingPointsPath(rLimit * 0.75)} className="fill-none stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
              <polygon points={getRingPointsPath(rLimit * 0.5)} className="fill-none stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
              <polygon points={getRingPointsPath(rLimit * 0.25)} className="fill-none stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />

              {/* Core Axis Lines */}
              {Array.from({ length: 5 }).map((_, i) => {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                return (
                  <line
                    key={`axis-${i}`}
                    x1={cX}
                    y1={cY}
                    x2={cX + rLimit * Math.cos(angle)}
                    y2={cY + rLimit * Math.sin(angle)}
                    className="stroke-slate-100 dark:stroke-slate-800"
                    strokeWidth="1.2"
                  />
                );
              })}

              {/* Value Polygon area */}
              <polygon
                points={radarPath}
                className="fill-blue-500/10 dark:fill-blue-400/20 stroke-blue-500 dark:stroke-blue-400"
                strokeWidth="2.5"
              />

              {/* Data points */}
              {radarPoints.map((p, idx) => (
                <circle
                  key={`dot-${idx}`}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  className="fill-blue-600 dark:fill-blue-400"
                />
              ))}

              {/* Radar labels C1C2C3C4C5 with micro placements */}
              {(() => {
                const labelPlacements = [
                  { text: 'Comp 1', dx: cX, dy: cY - rLimit - 12, anchor: 'middle' },
                  { text: 'Comp 2', dx: cX + rLimit + 14, dy: cY - 18, anchor: 'start' },
                  { text: 'Comp 3', dx: cX + rLimit - 14, dy: cY + rLimit + 10, anchor: 'start' },
                  { text: 'Comp 4', dx: cX - rLimit + 14, dy: cY + rLimit + 10, anchor: 'end' },
                  { text: 'Comp 5', dx: cX - rLimit - 14, dy: cY - 18, anchor: 'end' },
                ];
                return labelPlacements.map((pos, i) => (
                  <text
                    key={`lbl-rad-${i}`}
                    x={pos.dx}
                    y={pos.dy}
                    textAnchor={pos.anchor}
                    className="text-[9px] font-mono fill-slate-500 dark:fill-slate-400 font-semibold"
                  >
                    {pos.text} ({compValues[i]})
                  </text>
                ));
              })()}
            </svg>
          </div>

          <div className="text-[10px] text-slate-400 text-center border-t border-slate-200 dark:border-slate-800 pt-2 font-mono">
            Meta: Equilibrar e expandir rumo às pontas (200 pts)
          </div>
        </div>

        {/* Bento Card 5: Recent Activity & Feed - Medium/Long Column */}
        <div id="bento-activity-feed" className="md:col-span-6 bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bento-card">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-display font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                <Clock className="h-4.5 w-4.5 text-blue-500" />
                Feed de Atividades
              </h3>
              <p className="text-slate-450 text-[10px] mt-0.5">Seu histórico de rotina de estudos</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-450 rounded font-mono font-bold">
              ATIVO
            </span>
          </div>

          {/* Activity Logs Stack */}
          <div className="relative border-l border-slate-200 dark:border-slate-700 pl-4 py-1.5 space-y-5" id="feed-list">
            {activityLogs.length === 0 ? (
              <div className="py-8 text-center" id="empty-activities-text font-sans text-xs">
                <p className="text-xs text-slate-400 italic">Nenhuma atividade registrada ainda.</p>
                <p className="text-[10px] text-slate-400 mt-1">Conclua redações ou responda simulados para rastrear seus avanços!</p>
              </div>
            ) : (
              activityLogs.map((log) => {
                const markerColors: Record<string, string> = {
                  redacao: 'bg-blue-600 ring-blue-100',
                  simulado: 'bg-indigo-600 ring-indigo-100',
                  streak: 'bg-amber-500 ring-amber-100',
                  onboarding: 'bg-emerald-500 ring-emerald-100',
                };

                const activeColor = markerColors[log.type] || 'bg-gray-400 ring-gray-100';

                return (
                  <div key={log.id} className="relative group" id={`activity-${log.id}`}>
                    {/* Glowing Node Point */}
                    <span className={`absolute -left-[20.5px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#1e293b] ring-4 ${activeColor} transition-all`}></span>
                    
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-baseline gap-2">
                        <p className="font-display font-bold text-xs text-slate-800 dark:text-slate-100">
                          {log.title}
                        </p>
                        <span className="text-[9px] text-slate-400 font-mono flex-shrink-0">
                          {log.timeAgo}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-350">
                        {log.description}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="md:col-span-12 flex flex-wrap items-start justify-center gap-4">
          <AdPlaceholder slot="dashboard-conteudo" format="skyscraper" user={currentUser} />
          <AdPlaceholder slot="dashboard-sidebar" format="rectangle" user={currentUser} />
        </div>

        {/* Bento Card 6: Shortcuts & Motivation - Column */}
        <div id="bento-shortcuts" className="md:col-span-6 bg-slate-900 text-white border-none p-6 rounded-3xl bento-card flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl">💡</span>
              <h3 className="font-display font-extrabold text-sm text-white">
                Dica da IA ApexEnem
              </h3>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              Com base no seu onboarding, percebemos que focar na Proposta de Intervenção ou redações adaptativas é a menor distância rumo à aprovação. Experimente agora:
            </p>

            <ul className="space-y-2 text-xs text-slate-800">
              <li className="flex items-start gap-2 bg-slate-800/80 text-white p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-blue-400">🎯</span>
                <div>
                  <b className="text-white">Próximo Passo Recomendado:</b> Corrija uma Redação enviando uma foto da sua folha manuscrita para simular o dia de prova.
                </div>
              </li>
              <li className="flex items-start gap-2 bg-slate-800/80 text-white p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-amber-400">🪄</span>
                <div>
                  <b className="text-white">Praticar:</b> Gere 3 questões mágicas focadas nas matérias mais desafiadoras selecionadas.
                </div>
              </li>
              <li className="flex items-start gap-2 bg-slate-800/80 text-white p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-emerald-400">🐐</span>
                <div>
                  <b className="text-emerald-400">Duolingo do ENEM:</b> Pratique nas trilhas de micro-desafios gamificados da nossa nova Arena de Aprendizado.
                </div>
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-2.5 mt-6 justify-end pt-4 border-t border-slate-800 relative z-10">
            <button
              onClick={() => setActiveTab('perguntas')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white transition rounded-xl text-xs font-bold cursor-pointer border border-slate-700"
            >
              Mágica de Questões
            </button>
            <button
              onClick={() => setActiveTab('aprendizado')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>🐐 Jogar Arena</span>
            </button>
            <button
              onClick={() => setActiveTab('simulados')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>Fazer Simulado</span>
            </button>
          </div>

          <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-blue-500 opacity-20 blur-2xl"></div>
        </div>

        {/* Bento Card 7: Achievements / Conquistas */}
        <div id="bento-achievements" className="md:col-span-6 bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bento-card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-display font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                <Trophy className="h-4.5 w-4.5 text-amber-500" />
                Conquistas Desbloqueadas
              </h3>
              <p className="text-slate-450 text-[10px] mt-0.5">{achievements.length} de 18 conquistas</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded font-mono font-bold">
              {Math.round((achievements.length / 18) * 100)}%
            </span>
          </div>

          {achievements.length === 0 ? (
            <div className="py-6 text-center">
              <Trophy className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Complete atividades para desbloquear conquistas!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {achievements.slice(0, 6).map((ach) => (
                <div
                  key={ach.id}
                  className="p-3 bg-slate-50 dark:bg-[#0f172a]/60 border border-slate-200/60 dark:border-slate-800/60 rounded-xl text-center space-y-1 transition hover:scale-[1.03]"
                >
                  <span className="text-xl">{ach.icon}</span>
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 leading-tight">{ach.title}</p>
                </div>
              ))}
            </div>
          )}

          {/* Progress bar towards next achievement */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Progresso Geral</span>
              <span>{achievements.length}/18</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-700"
                style={{ width: `${(achievements.length / 18) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bento Card 8: Subject Performance Breakdown */}
        {sortedSubjects.length > 0 && (
          <div id="bento-subject-breakdown" className="md:col-span-12 bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bento-card">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-display font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                  <BarChart2 className="h-4.5 w-4.5 text-purple-500" />
                  Desempenho por Matéria
                </h3>
                <p className="text-slate-450 text-[10px] mt-0.5">Média de acertos nos simulados por área de conhecimento</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {sortedSubjects.map(([subject, data]) => {
                const colors: Record<string, string> = {
                  'Matemática': 'from-blue-500 to-blue-600',
                  'Humanas': 'from-purple-500 to-purple-600',
                  'Natureza': 'from-emerald-500 to-emerald-600',
                  'Linguagens': 'from-amber-500 to-amber-600',
                  'Geral': 'from-slate-500 to-slate-600',
                };
                const barColor = colors[subject] || 'from-slate-500 to-slate-600';
                return (
                  <div key={subject} className="p-4 bg-slate-50 dark:bg-[#0f172a]/60 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">{subject}</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{data.avgScore}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700`}
                        style={{ width: `${data.avgScore}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400">{data.count} simulado{data.count > 1 ? 's' : ''}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      <AdPlaceholder slot="dashboard-rodape" format="banner" className="mt-6" user={currentUser} />

    </div>
  );
}
