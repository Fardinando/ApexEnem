/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, GraduationCap, ArrowRight, User } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthViewProps {
  onSuccess: (user: UserProfile, requireOnboarding: boolean) => void;
}

export default function AuthView({ onSuccess }: AuthViewProps) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    if (!isLoginTab && !name) {
      setErrorMessage('Por favor, digite o seu nome para o cadastro.');
      return;
    }

    // Load existing users or initialize empty db
    const usersRaw = localStorage.getItem('notamil_users');
    const users: UserProfile[] = usersRaw ? JSON.parse(usersRaw) : [];

    if (isLoginTab) {
      // Handle login
      const matchedUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (email.toLowerCase() === 'test@example.com' || matchedUser) {
        // Mock user fallback check or load matched
        let userToLogIn: UserProfile;
        if (matchedUser) {
          userToLogIn = matchedUser;
        } else {
          userToLogIn = {
            name: 'Estudante NotaMil',
            email: 'test@example.com',
            streak: 3,
            lastLoginDate: new Date().toISOString().split('T')[0],
            targetScore: 920,
            serie: '3_medio',
            hardSubjects: ['Matemática', 'Natureza']
          };
        }

        // Check if onboarding was completed
        const hasCompletedOnboarding = !!userToLogIn.serie;

        localStorage.setItem('notamil_current_user', JSON.stringify(userToLogIn));
        onSuccess(userToLogIn, !hasCompletedOnboarding);
      } else {
        // Autoregister or warn, let's allow easy testing with password
        setErrorMessage('E-mail não encontrado ou senha inválida. Experimente outro e-mail ou crie uma conta!');
      }
    } else {
      // Handle Sign-Up/Cadastro
      const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        setErrorMessage('Este e-mail já está cadastrado. Vá para a aba de Login.');
        return;
      }

      const newUser: UserProfile = {
        name,
        email: email.toLowerCase(),
        streak: 1,
        lastLoginDate: new Date().toISOString().split('T')[0]
      };

      // Save to users db
      users.push(newUser);
      localStorage.setItem('notamil_users', JSON.stringify(users));
      localStorage.setItem('notamil_current_user', JSON.stringify(newUser));

      // New users always go to Onboarding
      onSuccess(newUser, true);
    }
  };

  return (
    <div id="auth-panel" className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#fcf8ff] text-[#1b1b24] transition-colors duration-300 dark:bg-[#0a0814] dark:text-[#f3effc]">
      
      {/* Visual Abstract Left Side Panel */}
      <div id="auth-hero" className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-br from-[#1b1574] via-[#3525cd] to-[#712ae2] flex-col justify-between p-12 overflow-hidden text-white">
        {/* Abstract futuristic mesh grids lines */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <circle cx="20%" cy="30%" r="180" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 15" />
            <circle cx="80%" cy="70%" r="220" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5 10" />
          </svg>
        </div>

        {/* Floating blurred ambient light circles */}
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#712ae2] rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-[#006e4b] rounded-full blur-[120px] opacity-25"></div>

        {/* Top Branding Section */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight">NotaMil</span>
        </div>

        {/* Core Slogan Card Panel */}
        <div className="relative z-10 max-w-md my-auto">
          <h1 className="font-display text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight space-y-4 mb-6 text-white">
            Alcance a sua <br />
            <span className="text-[#dad7ff] bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm shadow-inner">Nota Mil</span><br />
            no ENEM.
          </h1>
          <p className="text-white/80 text-lg leading-relaxed mb-10 font-light">
            Plataforma inteligente de estudos com correção de redações oficiais por inteligência artificial estruturada e simulados personalizados inovadores.
          </p>

          {/* Spark Values Features */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md shadow-lg">
              <span className="block text-xl mb-1">✨</span>
              <p className="font-display font-medium text-xs uppercase tracking-wider text-white">Correção Instantânea</p>
              <p className="text-xs text-white/70 mt-1">Análise minuciosa de desvios por IA.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md shadow-lg">
              <span className="block text-xl mb-1">📈</span>
              <p className="font-display font-medium text-xs uppercase tracking-wider text-white">Evolução Monitorada</p>
              <p className="text-xs text-white/70 mt-1">Sua pontuação crescendo por dia.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-white/60 text-xs font-mono">
          PLATAFORMA EDUCACIONAL ADAPTATIVA © 2026
        </div>
      </div>

      {/* Form Right Side Panel */}
      <div id="auth-form-side" className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center px-6 py-12 md:px-16 lg:px-24">
        <div className="w-full max-w-md space-y-8">
          
          {/* Top Logo and Tagline */}
          <div className="text-center space-y-2">
            <div className="flex justify-center items-center gap-2 mb-2">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 dark:shadow-none">
                <GraduationCap className="h-8 w-8" />
              </div>
              <span className="font-display font-extrabold text-2xl tracking-tight text-blue-600 dark:text-blue-400">NotaMil</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Bem-vindo à excelência na preparação intelectual para o ENEM
            </p>
          </div>

          {/* Form container */}
          <div className="bg-white dark:bg-[#1e293b] p-7 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-100/20 dark:shadow-none animate-fade-in">
            
            {/* Tabs for Login vs Cadastro */}
            <div className="bg-slate-100 dark:bg-[#0f172a]/70 p-1 rounded-xl grid grid-cols-2 gap-1 mb-8" id="auth-tabs">
              <button
                id="tab-login"
                type="button"
                className={`py-2 text-center text-sm font-medium rounded-lg transition-all ${
                  isLoginTab
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-[#1e293b] dark:text-white font-bold'
                    : 'text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white'
                }`}
                onClick={() => {
                  setIsLoginTab(true);
                  setErrorMessage('');
                }}
              >
                Login
              </button>
              <button
                id="tab-cadastro"
                type="button"
                className={`py-2 text-center text-sm font-medium rounded-lg transition-all ${
                  !isLoginTab
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-[#1e293b] dark:text-white font-bold'
                    : 'text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white'
                }`}
                onClick={() => {
                  setIsLoginTab(false);
                  setErrorMessage('');
                }}
              >
                Cadastro
              </button>
            </div>

            {/* Error Message display */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg mb-6 leading-relaxed flex items-start gap-2">
                <span className="font-bold">Aviso:</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Interactive Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Name field (Cadastro only) */}
              {!isLoginTab && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="reg-name">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                      <User className="h-4.5 w-4.5" />
                    </span>
                    <input
                      id="reg-name"
                      type="text"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="email-input">
                  E-mail
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <input
                    id="email-input"
                    type="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    placeholder="nome@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="password-input">
                    Senha
                  </label>
                  {isLoginTab && (
                    <a
                      href="#"
                      className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Digite qualquer e-mail e clique em Entrar! No ambiente acadêmico, o login é facilitado.');
                      }}
                    >
                      Esqueci minha senha
                    </a>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-blue-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {/* Submission CTA */}
              <button
                id="btn-auth-submit"
                type="submit"
                className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-100/50 dark:shadow-none flex items-center justify-center gap-2"
              >
                <span>{isLoginTab ? 'Entrar' : 'Registrar uma Nova Conta'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Bottom Swapper Link */}
            <p className="text-center text-xs mt-4 text-slate-400">
              {isLoginTab ? 'Não tem uma conta?' : 'Já possui conta?'} &nbsp;
              <button
                type="button"
                className="font-bold text-blue-600 hover:underline dark:text-blue-400"
                onClick={() => {
                  setIsLoginTab(!isLoginTab);
                  setErrorMessage('');
                }}
              >
                {isLoginTab ? 'Cadastrar-se' : 'Entrar na conta'}
              </button>
            </p>

          </div>

          <div className="text-center font-mono text-[10px] text-[#777587]">
            Estude com IA de ponta para a nota mil.
          </div>

        </div>
      </div>

    </div>
  );
}
