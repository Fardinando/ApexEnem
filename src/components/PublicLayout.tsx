import React, { useState } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';
import Logo from './Logo';
import { navigate, isActive } from '../lib/nav';

export interface Crumb {
  label: string;
  path?: string;
}

const NAV_LINKS: { label: string; path: string }[] = [
  { label: 'Início', path: '/' },
  { label: 'Blog', path: '/blog' },
  { label: 'Repertórios', path: '/repertorios' },
  { label: 'Autores', path: '/autores' },
  { label: 'Sobre', path: '/sobre' },
  { label: 'Contato', path: '/contato' },
];

export default function PublicLayout({
  children,
  crumbs,
  onLogin,
  onSignup,
}: {
  children: React.ReactNode;
  crumbs?: Crumb[];
  onLogin?: () => void;
  onSignup?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const path = window.location.pathname;

  const go = (p: string) => {
    setMenuOpen(false);
    navigate(p);
  };

  const login = onLogin || (() => go('/login'));
  const signup = onSignup || (() => go('/signup'));

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0814] text-slate-800 dark:text-slate-100 flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0a0814]/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button type="button" onClick={() => go('/')} className="flex items-center gap-2.5 cursor-pointer" aria-label="ApexEnem — página inicial">
            <Logo variant="favicon-a" className="h-7 w-auto" />
          </button>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-500 dark:text-slate-400" aria-label="Navegação principal">
            {NAV_LINKS.map((l) => (
              <button
                key={l.path}
                type="button"
                onClick={() => go(l.path)}
                className={`transition cursor-pointer ${isActive(path, l.path) ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'hover:text-blue-600 dark:hover:text-blue-400'}`}
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button type="button" onClick={login} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition cursor-pointer">Entrar</button>
            <button type="button" onClick={signup} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition cursor-pointer">Cadastrar</button>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 cursor-pointer"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white dark:bg-[#0a0814] border-t border-slate-100 dark:border-slate-800 px-4 py-3">
            <nav className="flex flex-col gap-1" aria-label="Navegação principal (mobile)">
              {NAV_LINKS.map((l) => (
                <button key={l.path} type="button" onClick={() => go(l.path)} className="text-left py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer">
                  {l.label}
                </button>
              ))}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={login} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">Entrar</button>
                <button type="button" onClick={signup} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl cursor-pointer">Cadastrar</button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-grow pt-16">
        {crumbs && crumbs.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 pt-6">
            <nav aria-label="Trilha de navegação" className="flex items-center flex-wrap gap-1 text-xs text-slate-400">
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3" aria-hidden="true" />}
                  {c.path ? (
                    <button type="button" onClick={() => go(c.path!)} className="hover:text-blue-600 transition cursor-pointer">{c.label}</button>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-300 font-medium" aria-current="page">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>
        )}
        {children}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 pt-12 pb-8 mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <button type="button" onClick={() => go('/')} className="flex items-center gap-2 mb-3 cursor-pointer">
                <Logo variant="favicon-a" className="h-6 w-auto" />
              </button>
              <p className="text-xs text-slate-400 leading-relaxed">
                Plataforma educacional adaptativa para a preparação do ENEM.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Produto</h3>
              <ul className="space-y-2 text-xs">
                <li><button type="button" onClick={signup} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 transition cursor-pointer">Criar conta</button></li>
                <li><button type="button" onClick={() => go('/planos')} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 transition cursor-pointer">Planos e preços</button></li>
                <li><button type="button" onClick={() => go('/repertorios')} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 transition cursor-pointer">Pesquisa de repertórios</button></li>
                <li><button type="button" onClick={() => go('/blog')} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 transition cursor-pointer">Blog</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Institucional</h3>
              <ul className="space-y-2 text-xs">
                <li><button type="button" onClick={() => go('/sobre')} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 transition cursor-pointer">Sobre nós</button></li>
                <li><button type="button" onClick={() => go('/autores')} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 transition cursor-pointer">Autores</button></li>
                <li><button type="button" onClick={() => go('/contato')} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 transition cursor-pointer">Contato</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Legal</h3>
              <ul className="space-y-2 text-xs">
                <li><button type="button" onClick={() => go('/termos')} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 transition cursor-pointer">Termos de Uso</button></li>
                <li><button type="button" onClick={() => go('/privacidade')} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 transition cursor-pointer">Privacidade (LGPD)</button></li>
                <li><button type="button" onClick={() => go('/cookies')} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 transition cursor-pointer">Política de Cookies</button></li>
                <li><button type="button" onClick={() => go('/assinatura')} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 transition cursor-pointer">Termos de Assinatura</button></li>
                <li><button type="button" onClick={() => go('/reembolso')} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 transition cursor-pointer">Política de Reembolso</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
            ApexEnem © {new Date().getFullYear()} — Plataforma Educacional Adaptativa
          </div>
        </div>
      </footer>
    </div>
  );
}
