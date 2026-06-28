/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  GraduationCap, 
  LayoutDashboard, 
  FileText, 
  HelpCircle, 
  BookOpen, 
  Settings, 
  Flame, 
  LogOut, 
  Menu, 
  X,
  Target,
  Sun,
  Moon,
  Trophy
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  currentUser: UserProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Sidebar({ 
  currentUser, 
  activeTab, 
  setActiveTab, 
  onLogout,
  isDarkMode,
  toggleDarkMode
}: SidebarProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'redacao', label: 'Correção de Redação', icon: FileText },
    { id: 'aprendizado', label: 'Aprendizado Corujito', icon: Trophy },
    { id: 'perguntas', label: 'Perguntas IA', icon: HelpCircle },
    { id: 'simulados', label: 'Simulados ENEM', icon: BookOpen },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'E';
    const parts = nameStr.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const menuTransitionStyle = isOpenMobile 
    ? "translate-x-0" 
    : "-translate-x-full lg:translate-x-0";

  return (
    <>
      {/* Mobile Header bar with Bento blue style */}
      <header className="lg:hidden bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 flex justify-between items-center sticky top-0 z-40 w-full" id="mobile-header">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg">
            <GraduationCap className="h-5.5 w-5.5" />
          </div>
          <span className="font-display font-black text-lg tracking-tight text-blue-600 dark:text-blue-400">NotaMil</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Streak inside header */}
          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
            <Flame className="h-4 w-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span>{currentUser.streak || 1}d</span>
          </div>

          <button
            id="mobile-menu-burger"
            type="button"
            className="p-1.5 text-slate-800 dark:text-slate-200 focus:outline-none"
            onClick={() => setIsOpenMobile(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Sidebar background overlay for mobile when drawer is active */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Main Sidebar Drawer Controller with Bento blue and slate theme */}
      <aside
        id="main-sidebar"
        className={`fixed lg:sticky top-0 left-0 bottom-0 w-64 bg-white dark:bg-[#1e293b] border-r border-slate-200 dark:border-slate-800 z-50 p-5 flex flex-col justify-between transition-transform duration-350 ease-out h-screen ${menuTransitionStyle}`}
      >
        
        {/* Top Branding Section with Close trigger for mobile */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span className="font-display font-extrabold text-xl tracking-tight text-blue-600 dark:text-blue-400">NotaMil</span>
            </div>

            <button
              id="mobile-close-sidebar"
              type="button"
              className="lg:hidden p-1 bg-slate-50 dark:bg-[#0f172a] text-slate-500 rounded-lg border border-slate-200 dark:border-slate-800"
              onClick={() => setIsOpenMobile(false)}
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* User Profile Mini Badge Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200/60 dark:border-slate-800/60 space-y-3.5 relative overflow-hidden">
            {/* Top Row: Details */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 font-display font-bold text-sm dark:bg-blue-950/40 dark:text-blue-400 rounded-xl flex items-center justify-center shadow-inner">
                {getInitials(currentUser.name)}
              </div>
              <div className="overflow-hidden">
                <p className="font-display font-bold text-xs truncate text-slate-800 dark:text-slate-100">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-500 font-mono truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>

            {/* Bottom Row: Key metrics */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-center">
              {/* Streak */}
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Ofensiva</span>
                <div className="flex items-center justify-center gap-1 text-xs font-extrabold text-[#D97706] dark:text-amber-400">
                  <span className="text-sm animate-pulse">🔥</span>
                  <span>{currentUser.streak || 1} dias</span>
                </div>
              </div>

              {/* Target Score */}
              <div className="space-y-0.5 border-l border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Meta ENEM</span>
                <div className="flex items-center justify-center gap-0.5 text-xs font-extrabold text-blue-600 dark:text-blue-400">
                  <Target className="h-3.5 w-3.5" />
                  <span>{currentUser.targetScore || 750}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Items List with Bento active highlight model */}
          <nav className="space-y-1.5 pt-2" id="nav-group">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  id={`nav-item-${item.id}`}
                  key={item.id}
                  type="button"
                  className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-semibold flex items-center gap-3.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-900/30'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpenMobile(false);
                  }}
                >
                  <Icon className={`h-5 w-5 transition-transform group-hover:scale-105 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

        </div>

        {/* Bottom Sidebar Action Utilities */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          
          <button
            id="sidebar-theme-toggle"
            type="button"
            onClick={toggleDarkMode}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              {isDarkMode ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-blue-600" />}
              <span>{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-50 dark:bg-[#0f172a] dark:text-slate-400 rounded">
              AUTO
            </span>
          </button>

          <button
            id="sidebar-logout"
            type="button"
            onClick={() => {
              if (confirm('Deseja realmente sair da Plataforma NotaMil?')) {
                onLogout();
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl text-left text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300 flex items-center gap-3.5 transition cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            <span>Sair do sistema</span>
          </button>
        </div>

      </aside>
    </>
  );
}
