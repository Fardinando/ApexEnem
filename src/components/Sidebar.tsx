import React, { useState } from 'react';
import {
  GraduationCap, LayoutDashboard, FileText, HelpCircle, BookOpen,
  Settings, Flame, LogOut, Target, Sun, Moon, Trophy, X, Plus, User, Zap
} from 'lucide-react';
import { UserProfile } from '../types';
import { getLevelFromXp, getLevelTitle, type GamificationStats } from '../lib/gamification';
import AdPlaceholder from './AdPlaceholder';

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
  { id: 'aprendizado', label: 'Estudos', icon: Trophy },
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
  const levelInfo = getLevelFromXp((currentUser as any).totalXp || 0);
  const levelTitle = getLevelTitle(levelInfo.level);

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
            </div>

            <div className="space-y-1 border-t border-slate-200 dark:border-slate-800 pt-4">
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
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md"><GraduationCap className="h-6 w-6" /></div>
          <span className="font-display font-extrabold text-xl tracking-tight text-blue-600 dark:text-blue-400">ApexEnem</span>
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
        </div>

        {/* Desktop navigation */}
        <nav className="flex-1 space-y-1" id="nav-group-desktop">
          {[...MAIN_TABS, { id: 'perfil', label: 'Perfil', icon: User }, { id: 'configuracoes', label: 'Configurações', icon: Settings }].map((item) => {
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
    </>
  );
}
