/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  User,
  Mail,
  MapPin,
  GraduationCap,
  FileText,
  BookOpen,
  BarChart2,
  Flame,
  Trophy,
  Star,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
  Shield,
  Activity,
} from 'lucide-react';
import { UserProfile, EssayCorrection, ActivityLog, WrongAnswer, SimuladoQuestion } from '../types';
import { getLevelFromXp, getLevelTitle, type GamificationStats, type Achievement } from '../lib/gamification';
import AdPlaceholder from './AdPlaceholder';

interface PerfilViewProps {
  currentUser: UserProfile;
  essayCorrections: EssayCorrection[];
  simuladosHistory: { scorePercent: number; date: string; subject: string }[];
  activityLogs: ActivityLog[];
  wrongAnswers: WrongAnswer[];
  gamificationStats: GamificationStats;
  achievements: Achievement[];
  setActiveTab: (tab: string) => void;
}

export default function PerfilView({
  currentUser,
  essayCorrections,
  simuladosHistory,
  activityLogs,
  wrongAnswers,
  gamificationStats,
  achievements,
  setActiveTab,
}: PerfilViewProps) {
  const levelInfo = getLevelFromXp(currentUser.totalXp || 0);
  const levelTitle = getLevelTitle(levelInfo.level);

  const formatSerie = (code?: string) => {
    switch (code) {
      case '9_fundamental': return '9º Ano Ensino Fundamental';
      case '1_medio': return '1º Ano Ensino Médio';
      case '2_medio': return '2º Ano Ensino Médio';
      case '3_medio': return '3º Ano Ensino Médio';
      case 'cursinho': return 'Pré-Vestibular / Cursinho';
      case 'outro': return 'Outro perfil';
      default: return 'Não especificado';
    }
  };

  const totalEssays = essayCorrections.length;
  const avgEssayScore = totalEssays
    ? Math.round(essayCorrections.reduce((a, e) => a + e.score, 0) / totalEssays)
    : 0;

  const totalSimulados = simuladosHistory.length;
  const avgSimuladoAccuracy = totalSimulados
    ? Math.round(simuladosHistory.reduce((a, s) => a + s.scorePercent, 0) / totalSimulados)
    : 0;

  const subjectBreakdown: Record<string, { count: number; avgScore: number }> = {};
  simuladosHistory.forEach(s => {
    if (!subjectBreakdown[s.subject]) subjectBreakdown[s.subject] = { count: 0, avgScore: 0 };
    subjectBreakdown[s.subject].count++;
    subjectBreakdown[s.subject].avgScore += s.scorePercent;
  });
  Object.keys(subjectBreakdown).forEach(k => {
    subjectBreakdown[k].avgScore = Math.round(subjectBreakdown[k].avgScore / subjectBreakdown[k].count);
  });

  const strengths = Object.entries(subjectBreakdown)
    .filter(([, data]) => data.avgScore >= 70)
    .sort((a, b) => b[1].avgScore - a[1].avgScore);

  const weaknesses = Object.entries(subjectBreakdown)
    .filter(([, data]) => data.avgScore < 50)
    .sort((a, b) => a[1].avgScore - b[1].avgScore);

  const compValues = totalEssays
    ? [1, 2, 3, 4, 5].map(id => {
        let sum = 0;
        essayCorrections.forEach(e => {
          const comp = (e.competencies || []).find(c => c.id === id);
          sum += comp ? comp.score : 0;
        });
        return Math.round(sum / totalEssays);
      })
    : [0, 0, 0, 0, 0];

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

  const getRingPointsPath = (radius: number) => {
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      pts.push(`${cX + radius * Math.cos(angle)},${cY + radius * Math.sin(angle)}`);
    }
    return pts.join(' ');
  };

  const wrongBySubject: Record<string, number> = {};
  wrongBySubject['simulado'] = 0;
  wrongBySubject['pergunta-ia'] = 0;
  wrongBySubject['redacao'] = 0;

  const wrongSubjects: Record<string, number> = {};
  wrongAnswers.forEach(w => {
    wrongSubjects[w.subject] = (wrongSubjects[w.subject] || 0) + 1;
  });

  const wrongBySource: Record<string, number> = {};
  wrongAnswers.forEach(w => {
    wrongBySource[w.source] = (wrongBySource[w.source] || 0) + 1;
  });

  const sortedWrongSubjects = Object.entries(wrongSubjects).sort((a, b) => b[1] - a[1]);
  const sortedWrongSources = Object.entries(wrongBySource).sort((a, b) => b[1] - a[1]);

  const sourceLabels: Record<string, string> = {
    'simulado': 'Simulados',
    'pergunta-ia': 'Questões IA',
    'redacao': 'Redações',
    'aula': 'Aulas IA',
  };

  const recentActivity = activityLogs.slice(0, 6);

  return (
    <div id="perfil-container" className="space-y-8 pb-12 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Meu Perfil
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            Visualize suas informações, desempenho e progresso completo.
          </p>
        </div>
        <div className="flex items-center gap-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none">
          <Star className="h-5 w-5 text-indigo-100" />
          <div>
            <span className="block text-[10px] uppercase font-mono tracking-wider opacity-85 font-bold">Nível</span>
            <span className="text-sm font-bold font-display">Nv. {levelInfo.level} — {levelTitle}</span>
          </div>
        </div>
      </div>

      {/* Grid Bento Box System */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

        {/* Profile Identity Card */}
        <div id="bento-profile-identity" className="md:col-span-4 bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bento-card flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-100 dark:shadow-none mb-4">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <User className="h-9 w-9 text-white" />
            )}
          </div>
          <h2 className="font-display font-black text-lg text-slate-800 dark:text-slate-100">
            {currentUser.name}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {currentUser.email}
          </p>
          <div className="mt-3 w-full space-y-1.5">
            {currentUser.state && (
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <MapPin className="h-3 w-3 text-blue-500" />
                {currentUser.city ? `${currentUser.city}, ` : ''}{currentUser.state}
              </div>
            )}
            {currentUser.serie && (
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <GraduationCap className="h-3 w-3 text-purple-500" />
                {formatSerie(currentUser.serie)}
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 w-full">
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
              <span>{levelInfo.currentXp} XP</span>
              <span>{levelInfo.nextThreshold} XP</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700"
                style={{ width: `${levelInfo.progress}%` }}
              />
            </div>
            <p className="text-[9px] text-slate-400 mt-1 font-mono">Progresso para próximo nível</p>
          </div>
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-blue-500/10 blur-2xl rounded-full"></div>
        </div>

        {/* Radar Chart - Competências */}
        <div id="bento-profile-radar" className="md:col-span-4 bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bento-card flex flex-col justify-between relative overflow-hidden">
          <div>
            <h3 className="font-display font-extrabold text-slate-800 dark:text-slate-100 text-sm">
              Análise de Competências
            </h3>
            <p className="text-slate-400 text-[10px] mt-0.5">Habilidades do ENEM por competência</p>
          </div>

          <div className="flex justify-center py-2 relative" id="perfil-radar-stage">
            {totalEssays === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 bg-slate-50/50 dark:bg-[#0f172a]/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 z-10">
                <BarChart2 className="h-6 w-6 text-purple-500/65 mb-1.5" />
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-350">Radar vazio</p>
                <p className="text-[9px] text-slate-400 max-w-xs mt-0.5 leading-relaxed">Envie uma redação para mapear seu gráfico de competências.</p>
              </div>
            )}
            <svg width="240" height="225" className="text-blue-500 dark:text-blue-400">
              <polygon points={getRingPointsPath(rLimit)} className="fill-none stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
              <polygon points={getRingPointsPath(rLimit * 0.75)} className="fill-none stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
              <polygon points={getRingPointsPath(rLimit * 0.5)} className="fill-none stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
              <polygon points={getRingPointsPath(rLimit * 0.25)} className="fill-none stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />

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

              <polygon
                points={radarPath}
                className="fill-blue-500/10 dark:fill-blue-400/20 stroke-blue-500 dark:stroke-blue-400"
                strokeWidth="2.5"
              />

              {radarPoints.map((p, idx) => (
                <circle
                  key={`dot-${idx}`}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  className="fill-blue-600 dark:fill-blue-400"
                />
              ))}

              {(() => {
                const labelPlacements = [
                  { text: 'Norma Culta', dx: cX, dy: cY - rLimit - 12, anchor: 'middle' },
                  { text: 'Compreensão', dx: cX + rLimit + 14, dy: cY - 18, anchor: 'start' },
                  { text: 'Argumentação', dx: cX + rLimit - 14, dy: cY + rLimit + 10, anchor: 'start' },
                  { text: 'Linguagem', dx: cX - rLimit + 14, dy: cY + rLimit + 10, anchor: 'end' },
                  { text: 'Intervenção', dx: cX - rLimit - 14, dy: cY - 18, anchor: 'end' },
                ];
                return labelPlacements.map((pos, i) => (
                  <text
                    key={`lbl-${i}`}
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
            Meta: Equilibrar e expandir rumo a 200 pts
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div id="bento-profile-stats" className="md:col-span-4 bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bento-card space-y-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
            <h3 className="font-display font-extrabold text-slate-800 dark:text-slate-100 text-sm">Estatísticas Detalhadas</h3>
          </div>

          {[
            { icon: <FileText className="h-3.5 w-3.5 text-blue-500" />, label: 'Total de Redações', value: totalEssays, color: 'text-blue-600 dark:text-blue-400' },
            { icon: <Star className="h-3.5 w-3.5 text-amber-500" />, label: 'Nota Média Redação', value: avgEssayScore, color: 'text-amber-600 dark:text-amber-400' },
            { icon: <BookOpen className="h-3.5 w-3.5 text-purple-500" />, label: 'Simulados Feitos', value: totalSimulados, color: 'text-purple-600 dark:text-purple-400' },
            { icon: <Target className="h-3.5 w-3.5 text-emerald-500" />, label: 'Acerto Médio Simulados', value: `${avgSimuladoAccuracy}%`, color: 'text-emerald-600 dark:text-emerald-400' },
            { icon: <Flame className="h-3.5 w-3.5 text-orange-500" />, label: 'Sequência Atual', value: `${gamificationStats.currentStreak} dias`, color: 'text-orange-600 dark:text-orange-400' },
            { icon: <TrendingUp className="h-3.5 w-3.5 text-blue-500" />, label: 'Total de XP', value: currentUser.totalXp || 0, color: 'text-blue-600 dark:text-blue-400' },
            { icon: <Trophy className="h-3.5 w-3.5 text-indigo-500" />, label: 'Nível Atual', value: `Nv. ${levelInfo.level}`, color: 'text-indigo-600 dark:text-indigo-400' },
            { icon: <Shield className="h-3.5 w-3.5 text-rose-500" />, label: 'Maior Sequência', value: `${gamificationStats.longestStreak} dias`, color: 'text-rose-600 dark:text-rose-400' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-[#0f172a]/60 border border-slate-200/60 dark:border-slate-800/60 rounded-xl">
              <div className="flex items-center gap-2">
                {stat.icon}
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">{stat.label}</span>
              </div>
              <span className={`text-sm font-display font-black ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Strengths & Weaknesses */}
        <div id="bento-profile-strengths-weaknesses" className="md:col-span-6 bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bento-card">
          <div className="flex items-center gap-1.5 mb-5">
            <Activity className="h-4.5 w-4.5 text-blue-500" />
            <h3 className="font-display font-extrabold text-slate-800 dark:text-slate-100 text-sm">Pontos Fortes & Melhorias</h3>
          </div>

          {strengths.length === 0 && weaknesses.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <BarChart2 className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Sem dados suficientes</p>
              <p className="text-[10px] text-slate-400 mt-1">Complete mais simulados para ver seus pontos fortes e fracos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-extrabold">Pontos Fortes (&gt; 70%)</span>
                </div>
                {strengths.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic pl-5">Nenhuma matéria acima de 70% ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {strengths.map(([subject, data]) => (
                      <div key={subject} className="p-3 bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 uppercase font-bold">{subject}</span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{data.avgScore}%</span>
                        </div>
                        <div className="h-1.5 bg-emerald-200/50 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                            style={{ width: `${data.avgScore}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-emerald-500/70">{data.count} simulado{data.count > 1 ? 's' : ''}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-[10px] font-mono text-red-600 dark:text-red-400 uppercase font-extrabold">Melhorias (&lt; 50%)</span>
                </div>
                {weaknesses.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic pl-5">Nenhuma matéria abaixo de 50%. Continue assim!</p>
                ) : (
                  <div className="space-y-2">
                    {weaknesses.map(([subject, data]) => (
                      <div key={subject} className="p-3 bg-red-50 dark:bg-red-950/15 border border-red-200/60 dark:border-red-900/40 rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-red-700 dark:text-red-300 uppercase font-bold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {subject}
                          </span>
                          <span className="text-xs font-bold text-red-500 dark:text-red-400">{data.avgScore}%</span>
                        </div>
                        <div className="h-1.5 bg-red-200/50 dark:bg-red-900/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full"
                            style={{ width: `${data.avgScore}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-red-500/70">{data.count} simulado{data.count > 1 ? 's' : ''}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div id="bento-profile-activity" className="md:col-span-6 bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bento-card">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-blue-500" />
              <h3 className="font-display font-extrabold text-slate-800 dark:text-slate-100 text-sm">Atividade Recente</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-450 rounded font-mono font-bold">
              ÚLTIMOS {recentActivity.length}
            </span>
          </div>

          <div className="relative border-l border-slate-200 dark:border-slate-700 pl-4 py-1.5 space-y-5">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-slate-400 italic">Nenhuma atividade registrada ainda.</p>
                <p className="text-[10px] text-slate-400 mt-1">Complete simulados ou envie redações para ver seu histórico.</p>
              </div>
            ) : (
              recentActivity.map((log) => {
                const markerColors: Record<string, string> = {
                  redacao: 'bg-blue-600 ring-blue-100',
                  simulado: 'bg-indigo-600 ring-indigo-100',
                  streak: 'bg-amber-500 ring-amber-100',
                  onboarding: 'bg-emerald-500 ring-emerald-100',
                };
                const activeColor = markerColors[log.type] || 'bg-gray-400 ring-gray-100';

                return (
                  <div key={log.id} className="relative group">
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

        {/* Wrong Answers Breakdown */}
        <div id="bento-profile-wrong" className="md:col-span-12 bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bento-card">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
              <h3 className="font-display font-extrabold text-slate-800 dark:text-slate-100 text-sm">Análise de Erros</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded font-mono font-bold">
              {wrongAnswers.length} ERROS TOTAIS
            </span>
          </div>

          {wrongAnswers.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Nenhum erro registrado!</p>
              <p className="text-[10px] text-slate-400 mt-1">Continue praticando para manter esse desempenho.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* By Subject */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-extrabold">Por Matéria</span>
                <div className="space-y-2">
                  {sortedWrongSubjects.map(([subject, count]) => {
                    const maxCount = sortedWrongSubjects[0]?.[1] || 1;
                    const pct = Math.round((count / maxCount) * 100);
                    const colors: Record<string, string> = {
                      'Matemática': 'from-blue-500 to-blue-600',
                      'Humanas': 'from-purple-500 to-purple-600',
                      'Natureza': 'from-emerald-500 to-emerald-600',
                      'Linguagens': 'from-amber-500 to-amber-600',
                    };
                    const barColor = colors[subject] || 'from-slate-500 to-slate-600';
                    return (
                      <div key={subject} className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-500 uppercase w-24 text-right font-bold truncate">{subject}</span>
                        <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-200 w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By Source */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-extrabold">Por Origem</span>
                <div className="space-y-2.5">
                  {sortedWrongSources.map(([source, count]) => {
                    const maxCount = sortedWrongSources[0]?.[1] || 1;
                    const pct = Math.round((count / maxCount) * 100);
                    const sourceIcons: Record<string, string> = {
                      'simulado': '🧠',
                      'pergunta-ia': '✨',
                      'redacao': '📝',
                    };
                    return (
                      <div key={source} className="p-3 bg-slate-50 dark:bg-[#0f172a]/60 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{sourceIcons[source] || '❓'}</span>
                            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 uppercase font-bold">{sourceLabels[source] || source}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{count} erro{count > 1 ? 's' : ''}</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Achievements Mini */}
        {achievements.length > 0 && (
          <div id="bento-profile-achievements" className="md:col-span-12 bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bento-card">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-1.5">
                <Trophy className="h-4.5 w-4.5 text-amber-500" />
                <h3 className="font-display font-extrabold text-slate-800 dark:text-slate-100 text-sm">Conquistas Recentes</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded font-mono font-bold">
                {achievements.length} / 18
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-2">
              {achievements.slice(0, 9).map((ach) => (
                <div
                  key={ach.id}
                  className="p-3 bg-slate-50 dark:bg-[#0f172a]/60 border border-slate-200/60 dark:border-slate-800/60 rounded-xl text-center space-y-1 transition hover:scale-[1.03]"
                >
                  <span className="text-xl">{ach.icon}</span>
                  <p className="text-[9px] font-bold text-slate-700 dark:text-slate-200 leading-tight">{ach.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <AdPlaceholder slot="perfil-rodape" format="banner" className="mt-6" user={currentUser} setActiveTab={setActiveTab} />
    </div>
  );
}
