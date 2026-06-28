import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Eye, EyeOff, GraduationCap, ArrowRight, User, MapPin, Globe, CheckCircle } from 'lucide-react';
import type { RegionBR } from '../types';

interface AuthViewProps {
  onSuccess: () => void;
}

const REGIONS: RegionBR[] = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];

const STATES_BY_REGION: Record<RegionBR, string[]> = {
  'Norte': ['Acre', 'Amapá', 'Amazonas', 'Pará', 'Rondônia', 'Roraima', 'Tocantins'],
  'Nordeste': ['Alagoas', 'Bahia', 'Ceará', 'Maranhão', 'Paraíba', 'Pernambuco', 'Piauí', 'Rio Grande do Norte', 'Sergipe'],
  'Centro-Oeste': ['Distrito Federal', 'Goiás', 'Mato Grosso', 'Mato Grosso do Sul'],
  'Sudeste': ['Espírito Santo', 'Minas Gerais', 'Rio de Janeiro', 'São Paulo'],
  'Sul': ['Paraná', 'Rio Grande do Sul', 'Santa Catarina'],
};

declare const hcaptcha: any;

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '';

export default function AuthView({ onSuccess }: AuthViewProps) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [succMessage, setSuccMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

  const [region, setRegion] = useState<RegionBR>('Sudeste');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');

  const states = STATES_BY_REGION[region] || [];
  const [hcaptchaReady, setHcaptchaReady] = useState(false);

  useEffect(() => {
    if (!HCAPTCHA_SITE_KEY) return;
    const url = `https://js.hcaptcha.com/1/api.js?onload=hcaptchaOnLoad&render=explicit`;
    if (document.querySelector(`script[src="${url}"]`)) return;
    (window as any).hcaptchaOnLoad = () => setHcaptchaReady(true);
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!HCAPTCHA_SITE_KEY || isLoginTab || !hcaptchaReady) return;
    const el = document.getElementById('hcaptcha-container');
    if (!el) return;
    setCaptchaToken('');
    el.innerHTML = '';
    hcaptcha.render('hcaptcha-container', {
      sitekey: HCAPTCHA_SITE_KEY,
      callback: (token: string) => setCaptchaToken(token),
      'expired-callback': () => setCaptchaToken(''),
    });
  }, [isLoginTab, hcaptchaReady]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setErrorMessage('E-mail ou senha incorretos.');
      } else if (error.message.includes('Email not confirmed')) {
        setErrorMessage('E-mail ainda não confirmado. Verifique sua caixa de entrada.');
      } else {
        setErrorMessage(error.message);
      }
      return;
    }
    onSuccess();
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!name || !email || !password) {
      setErrorMessage('Preencha nome, e-mail e senha.');
      return;
    }
    if (!state) {
      setErrorMessage('Selecione um estado.');
      return;
    }
    if (!city.trim()) {
      setErrorMessage('Informe sua cidade.');
      return;
    }
    if (HCAPTCHA_SITE_KEY && !captchaToken) {
      setErrorMessage('Resolva o desafio de verificação (hCaptcha) antes de cadastrar.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, region, state, city },
        captchaToken: captchaToken || undefined,
      },
    });
    setLoading(false);
    if (error) {
      if (error.message.includes('already registered')) {
        setErrorMessage('Este e-mail já está cadastrado. Faça login.');
      } else {
        setErrorMessage(error.message);
      }
      if (hcaptcha) hcaptcha.reset();
      setCaptchaToken('');
      return;
    }
    setStep('confirm');
    setSuccMessage(`Enviamos um e-mail de confirmação para ${email.toLowerCase()}. Verifique sua caixa de entrada e clique no link para ativar sua conta.`);
  };

  return (
    <div className={`min-h-screen bg-[#fcf8ff] dark:bg-[#0a0814] text-[#1b1b24] dark:text-[#f3effc] transition-colors duration-300 ${step === 'confirm' ? 'flex items-center justify-center p-4' : 'grid grid-cols-1 lg:grid-cols-12'}`}>
      {step === 'confirm' ? (
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-white dark:bg-[#1e293b] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
            <div className="mx-auto p-3 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-full w-fit">
              <Mail className="h-8 w-8" />
            </div>
            <h2 className="font-display font-extrabold text-lg">Verifique seu e-mail</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Enviamos um link de confirmação para <strong>{email.toLowerCase()}</strong>.
              Clique no link para ativar sua conta.
            </p>
            <div className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Não recebeu? Verifique sua caixa de spam ou <button type="button" onClick={() => { setStep('form'); }} className="text-blue-600 hover:underline font-semibold cursor-pointer">tente novamente</button>.
            </div>
          </div>
          <p className="text-center text-[10px] font-mono text-slate-400 mt-4">Informações de região/estado/cidade são apenas para métricas internas da plataforma.</p>
        </div>
      ) : (
        <>
          <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-br from-[#1b1574] via-[#3525cd] to-[#712ae2] flex-col justify-between p-12 overflow-hidden text-white">
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" /></pattern></defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <circle cx="20%" cy="30%" r="180" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 15" />
                <circle cx="80%" cy="70%" r="220" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5 10" />
              </svg>
            </div>
            <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#712ae2] rounded-full blur-[120px] opacity-40"></div>
            <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-[#006e4b] rounded-full blur-[120px] opacity-25"></div>
            <div className="relative z-10 flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20"><GraduationCap className="h-6 w-6" /></div>
              <span className="font-display font-extrabold text-xl tracking-tight">ApexEnem</span>
            </div>
            <div className="relative z-10 max-w-md my-auto">
              <h1 className="font-display text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight space-y-4 mb-6 text-white">
                Alcance seu ápice no ENEM <br /><span className="text-[#dad7ff] bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm shadow-inner">com ApexEnem</span>
              </h1>
              <p className="text-white/80 text-lg leading-relaxed mb-10 font-light">Plataforma inteligente com correção de redações por 10 IAs e simulados personalizados.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md">
                  <span className="block text-xl mb-1">✨</span>
                  <p className="font-medium text-xs uppercase tracking-wider text-white">Correção Instantânea</p>
                  <p className="text-xs text-white/70 mt-1">Análise por 10 IAs diferentes.</p>
                </div>
                <div className="p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md">
                  <span className="block text-xl mb-1">📈</span>
                  <p className="font-medium text-xs uppercase tracking-wider text-white">Evolução Monitorada</p>
                  <p className="text-xs text-white/70 mt-1">Sua pontuação crescendo a cada simulado.</p>
                </div>
              </div>
            </div>
            <div className="relative z-10 text-white/60 text-xs font-mono">PLATAFORMA EDUCACIONAL ADAPTATIVA © 2026</div>
          </div>

          <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center px-4 sm:px-6 py-8 md:px-16 lg:px-24">
            <div className="w-full max-w-md space-y-6">
              <div className="text-center space-y-2">
                <div className="flex justify-center items-center gap-2 mb-2">
                  <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg"><GraduationCap className="h-8 w-8" /></div>
                  <span className="font-display font-extrabold text-2xl tracking-tight text-blue-600 dark:text-blue-400">ApexEnem</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Bem-vindo à excelência na preparação para o ENEM</p>
              </div>

              <div className="bg-white dark:bg-[#1e293b] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl animate-fade-in">
                <div className="bg-slate-100 dark:bg-[#0f172a]/70 p-1 rounded-xl grid grid-cols-2 gap-1 mb-6" id="auth-tabs">
                  <button type="button" className={`py-2.5 text-center text-sm font-medium rounded-lg transition-all cursor-pointer ${isLoginTab ? 'bg-white text-blue-600 shadow-sm dark:bg-[#1e293b] dark:text-white font-bold' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`} onClick={() => { setIsLoginTab(true); setErrorMessage(''); }}>Login</button>
                  <button type="button" className={`py-2.5 text-center text-sm font-medium rounded-lg transition-all cursor-pointer ${!isLoginTab ? 'bg-white text-blue-600 shadow-sm dark:bg-[#1e293b] dark:text-white font-bold' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`} onClick={() => { setIsLoginTab(false); setErrorMessage(''); }}>Cadastro</button>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg mb-4 leading-relaxed flex items-start gap-2">
                    <span className="font-bold shrink-0">Aviso:</span><span>{errorMessage}</span>
                  </div>
                )}
                {succMessage && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg mb-4 leading-relaxed">{succMessage}</div>
                )}

                <form onSubmit={isLoginTab ? handleLogin : handleSignup} className="space-y-4">
                  {!isLoginTab && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="reg-name">Nome Completo</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400"><User className="h-4.5 w-4.5" /></span>
                          <input id="reg-name" type="text" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800 dark:text-white" placeholder="Seu nome completo" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                      </div>
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>Os campos de região, estado e cidade abaixo são <strong>apenas para métricas internas</strong> da plataforma — ajudam a entender a distribuição geográfica dos estudantes.</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Região</label>
                          <select value={region} onChange={(e) => { setRegion(e.target.value as RegionBR); setState(''); }} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white cursor-pointer">
                            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Estado</label>
                          <select value={state} onChange={(e) => setState(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white cursor-pointer">
                            <option value="">Selecione</option>
                            {states.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="reg-city">Cidade</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400"><Globe className="h-4.5 w-4.5" /></span>
                          <input id="reg-city" type="text" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800 dark:text-white" placeholder="Sua cidade" value={city} onChange={(e) => setCity(e.target.value)} />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="email-input">E-mail</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400"><Mail className="h-4.5 w-4.5" /></span>
                      <input id="email-input" type="email" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800 dark:text-white" placeholder="nome@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="password-input">Senha</label>
                      {isLoginTab && (
                        <button type="button" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400 cursor-pointer" onClick={() => { supabase.auth.resetPasswordForEmail(email); alert('Se o e-mail estiver cadastrado, enviaremos um link de redefinição.'); }}>Esqueci minha senha</button>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400"><Lock className="h-4.5 w-4.5" /></span>
                      <input id="password-input" type={showPassword ? 'text' : 'password'} className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800 dark:text-white" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-blue-600 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}</button>
                    </div>
                  </div>

                  {!isLoginTab && HCAPTCHA_SITE_KEY && (
                    <div id="hcaptcha-container" className="flex justify-center"></div>
                  )}
                  <button type="submit" disabled={loading} className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer">
                    <span>{loading ? 'Aguarde...' : (isLoginTab ? 'Entrar' : 'Criar Conta')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <p className="text-center text-xs mt-4 text-slate-400">
                  {isLoginTab ? 'Não tem uma conta?' : 'Já possui conta?'} &nbsp;
                  <button type="button" className="font-bold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer" onClick={() => { setIsLoginTab(!isLoginTab); setErrorMessage(''); }}>{isLoginTab ? 'Cadastrar-se' : 'Entrar na conta'}</button>
                </p>
              </div>

              <div className="text-center font-mono text-[10px] text-slate-400">
                Estude com 10 IAs de ponta para a Apex Enem.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
