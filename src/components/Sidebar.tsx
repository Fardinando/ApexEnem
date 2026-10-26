import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, HelpCircle, BookOpen,
  Settings, Flame, LogOut, Target, Sun, Moon, X, Plus, User, Zap,
  GraduationCap, Coins, Crown, Library, PlayCircle, Users
} from 'lucide-react';
import { UserProfile, PlanId } from '../types';
import { getLevelFromXp, getLevelTitle, type GamificationStats } from '../lib/gamification';
import { subscribeWallet, getCoins, getPlanId } from '../lib/coins';
import { planHasTeacherAI } from '../config/plans';
import Logo from './Logo';
import AdPlaceholder from './AdPlaceholder';
import RewardCoinsModal from './RewardCoinsModal';

interface SidebarProps {
  currentUser: UserProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const MAIN_TABS = [
  { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
  { id: 'redacao', label: 'Redação', icon: FileText },
  { id: 'aulas', label: 'Aulas', icon: PlayCircle },
  { id: 'simulados', label: 'Simulados', icon: BookOpen },
  { id: 'perguntas', label: 'Questões IA', icon: HelpCircle },
];

const getInitials = (nameStr: string) => {
  if (!nameStr) return 'E';
  const parts = nameStr.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function Sidebar({ currentUser, activeTab, setActiveTab, onLogout, isDarkMode, toggleDarkMode }: SidebarProps) {
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [coins, setCoins] = useState(getCoins());
  const [plan, setPlan] = useState<PlanId>(getPlanId());
  const levelInfo = getLevelFromXp((currentUser as any).totalXp || 0);
  const levelTitle = getLevelTitle(levelInfo.level);

  useEffect(() => subscribeWallet((w) => { setCoins(w.coins); setPlan(w.plan); }), []);

  const hasTeacher = planHasTeacherAI(plan);
  const repertorioTab = { id: 'repertorios', label: 'Repertórios', icon: Library };
  const salasTab      = { id: 'salas',       label: 'Salas',       icon: Users   };
  const navTabs = hasTeacher
    ? [...MAIN_TABS, repertorioTab, salasTab, { id: 'teacher', label: 'Professor IA', icon: GraduationCap }]
    : [...MAIN_TABS, repertorioTab, salasTab];

  return (
    <>
      {/* === MOBILE: Bottom Tab Bar === */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#1e293b] border-t border-slate-200 dark:border-slate-800 px-1 safe-area-bottom" id="mobile-bottom-nav">
        <div className="flex items-center justify-around">
          {MAIN_TABS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-0.5 py-2 px-2 min-w-0 flex-1 transition cursor-pointer ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'fill-blue-50 dark:fill-blue-950/30' : ''}`} />
                <span className={`text-[9px] font-semibold truncate w-full text-center ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowMoreSheet(true)}
            className="flex flex-col items-center gap-0.5 py-2 px-2 min-w-0 flex-1 text-slate-400 dark:text-slate-500 transition cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span className="text-[9px] font-semibold">Mais</span>
          </button>
        </div>
      </nav>

      {/* === MOBILE: Bottom Sheet "More" Drawer === */}
      {showMoreSheet && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden" onClick={() => setShowMoreSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#1e293b] rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 pb-10 max-h-[70vh] overflow-y-auto lg:hidden animate-fade-in shadow-2xl" id="mobile-more-sheet">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 bg-blue-50 text-blue-600 font-bold text-sm dark:bg-blue-950/40 dark:text-blue-400 rounded-xl flex items-center justify-center overflow-hidden">
                  {currentUser.avatar ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(currentUser.name)}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-xs truncate text-slate-800 dark:text-slate-100">{currentUser.name}</p>
                  <p className="text-[9px] text-slate-400 truncate">{currentUser.email}</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowMoreSheet(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4 text-xs">
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1.5 rounded-full font-bold text-amber-700 dark:text-amber-400">
                <Flame className="h-3.5 w-3.5 fill-amber-500" />{currentUser.streak || 1}d
              </div>
              <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-950/30 px-2.5 py-1.5 rounded-full font-bold text-purple-600 dark:text-purple-400">
                <Zap className="h-3.5 w-3.5" />Nv.{levelInfo.level}
              </div>
              <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1.5 rounded-full font-bold text-blue-600 dark:text-blue-400">
                <Target className="h-3.5 w-3.5" />Meta: {currentUser.targetScore || 750}
              </div>
              <button type="button" onClick={() => setShowReward(true)} className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1.5 rounded-full font-bold text-amber-700 dark:text-amber-400 cursor-pointer">
                <Coins className="h-3.5 w-3.5" />{coins}
              </button>
            </div>

            <div className="space-y-1 border-t border-slate-200 dark:border-slate-800 pt-4">
              {hasTeacher && (
                <button type="button" onClick={() => { setActiveTab('teacher'); setShowMoreSheet(false); }} className="w-full py-3 px-4 rounded-xl text-left text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0f172a] flex items-center gap-3 transition cursor-pointer">
                  <GraduationCap className="h-4.5 w-4.5" /> Professor IA
                </button>
              )}
              <button type="button" onClick={() => { setActiveTab('repertorios'); setShowMoreSheet(false); }} className="w-full py-3 px-4 rounded-xl text-left text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0f172a] flex items-center gap-3 transition cursor-pointer">
                <Library className="h-4.5 w-4.5" /> Repertórios
              </button>
              <button type="button" onClick={() => { setActiveTab('salas'); setShowMoreSheet(false); }} className="w-full py-3 px-4 rounded-xl text-left text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0f172a] flex items-center gap-3 transition cursor-pointer">
                <Users className="h-4.5 w-4.5" /> Salas (competição)
              </button>
              <button type="button" onClick={() => { setShowMoreSheet(false); window.history.pushState({}, '', '/planos'); window.dispatchEvent(new Event('popstate')); }} className="w-full py-3 px-4 rounded-xl text-left text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0f172a] flex items-center gap-3 transition cursor-pointer">
                <Crown className="h-4.5 w-4.5 text-amber-500" /> Planos & Moedas
              </button>
              <button type="button" onClick={() => { setActiveTab('perfil'); setShowMoreSheet(false); }} className="w-full py-3 px-4 rounded-xl text-left text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0f172a] flex items-center gap-3 transition cursor-pointer">
                <User className="h-4.5 w-4.5" /> Meu Perfil
              </button>
              <button type="button" onClick={() => { setActiveTab('configuracoes'); setShowMoreSheet(false); }} className="w-full py-3 px-4 rounded-xl text-left text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0f172a] flex items-center gap-3 transition cursor-pointer">
                <Settings className="h-4.5 w-4.5" /> Configurações
              </button>
              <button type="button" onClick={toggleDarkMode} className="w-full py-3 px-4 rounded-xl text-left text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0f172a] flex items-center gap-3 transition cursor-pointer">
                {isDarkMode ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-blue-600" />} {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
              </button>
              <button type="button" onClick={() => { if (confirm('Deseja sair?')) { setShowMoreSheet(false); onLogout(); } }} className="w-full py-3 px-4 rounded-xl text-left text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:text-red-400 flex items-center gap-3 transition cursor-pointer">
                <LogOut className="h-4.5 w-4.5" /> Sair
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <AdPlaceholder slot="sidebar-mobile" format="banner" user={currentUser} />
            </div>
          </div>
        </>
      )}

      {/* === DESKTOP: Full Sidebar (hidden on mobile) === */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white dark:bg-[#1e293b] border-r border-slate-200 dark:border-slate-800 p-5 h-screen sticky top-0">
        <div className="flex items-center gap-2.5 mb-6">
          <Logo variant="favicon-a" className="h-8 w-auto" />
        </div>

        {/* User profile */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200/60 dark:border-slate-800/60 mb-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-50 text-blue-600 font-bold text-sm dark:bg-blue-950/40 dark:text-blue-400 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
              {currentUser.avatar ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(currentUser.name)}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="font-bold text-xs truncate text-slate-800 dark:text-slate-100">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 font-mono truncate">{currentUser.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-center">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Ofensiva</span>
              <div className="flex items-center justify-center gap-1 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                <Flame className="h-3.5 w-3.5 fill-amber-500" /><span>{currentUser.streak || 1}d</span>
              </div>
            </div>
            <div className="border-l border-slate-200/60 dark:border-slate-800/60">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Nível</span>
              <div className="flex items-center justify-center gap-0.5 text-xs font-extrabold text-purple-600 dark:text-purple-400">
                <Zap className="h-3.5 w-3.5" /><span>{levelInfo.level}</span>
              </div>
            </div>
            <div className="border-l border-slate-200/60 dark:border-slate-800/60">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Meta ENEM</span>
              <div className="flex items-center justify-center gap-0.5 text-xs font-extrabold text-blue-600 dark:text-blue-400">
                <Target className="h-3.5 w-3.5" /><span>{currentUser.targetScore || 750}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <button type="button" onClick={() => setShowReward(true)} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-950/60 transition cursor-pointer" title="Ganhar moedas assistindo a um anúncio">
              <Coins className="h-3.5 w-3.5" />{coins}
            </button>
            <span className={`px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
              plan === 'apex' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400'
                : plan === 'pro' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              {plan}
            </span>
          </div>
        </div>

        {/* Desktop navigation */}
        <nav className="flex-1 space-y-1" id="nav-group-desktop">
          {[...navTabs, { id: 'perfil', label: 'Perfil', icon: User }, { id: 'configuracoes', label: 'Configurações', icon: Settings }].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} type="button" onClick={() => setActiveTab(item.id)}
                className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-semibold flex items-center gap-3.5 transition-all cursor-pointer ${
                  isActive ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-900/30' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white border border-transparent'
                }`}>
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Desktop bottom */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <AdPlaceholder slot="sidebar-desktop" format="rectangle" user={currentUser} />
          <button type="button" onClick={() => { window.history.pushState({}, '', '/planos'); window.dispatchEvent(new Event('popstate')); }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[11px] font-bold flex items-center justify-center gap-2 transition hover:opacity-95 cursor-pointer">
            <Crown className="h-4 w-4" /> Planos & Moedas
          </button>
          <button type="button" onClick={toggleDarkMode}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between transition cursor-pointer">
            <div className="flex items-center gap-2.5">{isDarkMode ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-blue-600" />}<span>{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span></div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-50 dark:bg-[#0f172a] dark:text-slate-400 rounded">AUTO</span>
          </button>
          <button type="button" onClick={() => { if (confirm('Deseja sair?')) onLogout(); }}
            className="w-full py-2.5 px-4 rounded-xl text-left text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300 flex items-center gap-3.5 transition cursor-pointer">
            <LogOut className="h-5 w-5" /> Sair do sistema
          </button>
        </div>
      </aside>

      <RewardCoinsModal open={showReward} onClose={() => setShowReward(false)} />
    </>
  );
}
