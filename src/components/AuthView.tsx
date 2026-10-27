import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, MapPin, Globe, CheckCircle, Send, X } from 'lucide-react';
import Logo from './Logo';
import MarmitaCodeCredit from './MarmitaCodeCredit';
import type { RegionBR } from '../types';
import { REGIONS as BRAZIL_REGIONS, STATES, getCitiesByState, getStatesByRegion } from '../data/brazil-locations';

const ALLOWED_EMAILS_RAW = import.meta.env.VITE_ALLOWED_EMAILS || '';
const ALLOWED_LIST = ALLOWED_EMAILS_RAW.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean);
const ACCESS_DISABLED = ALLOWED_LIST.length > 0;

interface AuthViewProps {
  onSuccess: () => void;
  defaultTab?: 'login' | 'signup';
  onBack?: () => void;
}

declare const hcaptcha: any;

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '';

export default function AuthView({ onSuccess, defaultTab, onBack }: AuthViewProps) {
  const [isLoginTab, setIsLoginTab] = useState(defaultTab !== 'signup');
  const [step, setStep] = useState<'form' | 'confirm' | 'mfa'>('form');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaChallengeId, setMfaChallengeId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [succMessage, setSuccMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [region, setRegion] = useState<RegionBR>('Sudeste');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  // Lei Felca / ECA Digital (Lei 15.211/2025) + LGPD Art. 14:
  // data de nascimento é obrigatória; < 13 bloqueado; 13-17 exige e-mail do
  // responsável (consentimento parental destacado) e consentimento explícito.
  const [birthdate, setBirthdate] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentConsent, setParentConsent] = useState(false);
  const [showBetaRequest, setShowBetaRequest] = useState(false);
  const [betaRequestSent, setBetaRequestSent] = useState(false);
  const [betaRequestLoading, setBetaRequestLoading] = useState(false);

  const states = getStatesByRegion(region);
  const selectedStateObj = states.find(s => s.name === state);
  const cities = selectedStateObj ? selectedStateObj.cities : [];
  const [hcaptchaReady, setHcaptchaReady] = useState(false);

  useEffect(() => {
    if (!HCAPTCHA_SITE_KEY) return;
    const url = `https://js.hcaptcha.com/1/api.js?onload=hcaptchaOnLoad&render=explicit`;
    if (document.querySelector(`script[src="${url}"]`)) {
      if (typeof (window as any).hcaptcha !== 'undefined') {
        setHcaptchaReady(true);
      } else {
        (window as any).hcaptchaOnLoad = () => setHcaptchaReady(true);
      }
      return;
    }
    (window as any).hcaptchaOnLoad = () => setHcaptchaReady(true);
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!HCAPTCHA_SITE_KEY || !hcaptchaReady) return;
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
    if (HCAPTCHA_SITE_KEY && !captchaToken) {
      setErrorMessage('Resolva o desafio de verificação (hCaptcha) antes de entrar.');
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken: captchaToken || undefined },
    });
    if (hcaptcha) hcaptcha.reset();
    setCaptchaToken('');
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
    // Se o usuário tem 2FA ativa (AAL2 required), Supabase retorna AAL1 e exige
    // challenge/verify antes de considerar autenticado.
    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2') {
        const { data: fs } = await supabase.auth.mfa.listFactors();
        const first = (fs?.totp || []).find((f: any) => f.status === 'verified');
        if (first) {
          const ch = await supabase.auth.mfa.challenge({ factorId: first.id });
          if (!ch.error) {
            setMfaFactorId(first.id);
            setMfaChallengeId(ch.data.id);
            setStep('mfa');
            return;
          }
        }
      }
    } catch { /* se MFA checar falhar, segue fluxo normal */ }
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get('redirect_to');
    if (redirectTo) {
      // Whitelist estrita: só redireciona pra apexenem.com.br (ou subdomínio) e
      // nunca envia tokens pela query. Se precisar passar sessão, usa fragmento (#).
      try {
        const target = new URL(redirectTo);
        const host = target.hostname.toLowerCase();
        const ok = host === 'apexenem.com.br' || host.endsWith('.apexenem.com.br');
        if (ok) {
          window.location.replace(target.toString());
          return;
        }
      } catch { /* URL inválida, ignora */ }
    }
    onSuccess();
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!/^\d{6}$/.test(mfaCode)) {
      setErrorMessage('Digite o código de 6 dígitos do app autenticador.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.mfa.verify({ factorId: mfaFactorId, challengeId: mfaChallengeId, code: mfaCode });
    setLoading(false);
    if (error) {
      setErrorMessage('Código inválido. Tente de novo.');
      return;
    }
    setMfaCode('');
    setStep('form');
    onSuccess();
  };

  const computeAge = (iso: string): number | null => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!name || !email || !password) {
      setErrorMessage('Preencha nome, e-mail e senha.');
      return;
    }
    if (email.toLowerCase().trim() !== emailConfirm.toLowerCase().trim()) {
      setErrorMessage('Os dois e-mails informados não coincidem. Confira com atenção — o link de confirmação será enviado pro endereço digitado.');
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMessage('As duas senhas informadas não coincidem.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('A senha precisa de pelo menos 8 caracteres.');
      return;
    }
    if (!birthdate) {
      setErrorMessage('Informe sua data de nascimento.');
      return;
    }
    const age = computeAge(birthdate);
    if (age === null || age < 0 || age > 120) {
      setErrorMessage('Data de nascimento inválida.');
      return;
    }
    if (age < 13) {
      setErrorMessage('O ApexEnem é destinado a estudantes a partir dos 13 anos. Peça a um responsável para criar a conta por você quando atingir essa idade.');
      return;
    }
    if (age < 18) {
      if (!parentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
        setErrorMessage('Para menores de 18 anos é obrigatório informar o e-mail de um responsável legal (LGPD Art. 14 + ECA Digital).');
        return;
      }
      if (parentEmail.toLowerCase().trim() === email.toLowerCase().trim()) {
        setErrorMessage('O e-mail do responsável deve ser diferente do seu.');
        return;
      }
      if (!parentConsent) {
        setErrorMessage('É necessário confirmar que um responsável autorizou o cadastro.');
        return;
      }
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
    if (!acceptedTerms) {
      setErrorMessage('Você precisa aceitar os Termos de Uso para criar uma conta.');
      return;
    }
    if (ACCESS_DISABLED && !ALLOWED_LIST.includes(email.toLowerCase().trim())) {
      setErrorMessage('Este e-mail não está na lista de acesso autorizado. Solicite acesso ao Beta Testing.');
      setShowBetaRequest(true);
      return;
    }
    setLoading(true);
    const isMinor = age < 18;
    const { data: signupData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          region,
          state,
          city,
          birthdate,
          is_minor: isMinor,
          parent_email: isMinor ? parentEmail.toLowerCase().trim() : null,
          parent_consent_at: isMinor ? new Date().toISOString() : null,
          consent_version: '2026-10-26-eca-digital',
        },
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

    // Se menor, dispara e-mail ao responsável com link do Painel do Responsável
    const studentId = signupData?.user?.id;
    if (isMinor && studentId) {
      fetch('/api/send-parental-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          student_name: name,
          student_email: email.toLowerCase().trim(),
          parent_email: parentEmail.toLowerCase().trim(),
          birthdate,
        }),
      }).catch(() => { /* não bloqueia o cadastro se falhar */ });
    }

    setStep('confirm');
    setSuccMessage(`Enviamos um e-mail de confirmação para ${email.toLowerCase()}. Verifique sua caixa de entrada e clique no link para ativar sua conta.`);
  };

  return (
    <div className={`relative min-h-screen bg-[#fcf8ff] dark:bg-[#0a0814] text-[#1b1b24] dark:text-[#f3effc] transition-colors duration-300 ${step === 'confirm' || step === 'mfa' ? 'flex items-center justify-center p-4 pb-14' : 'grid grid-cols-1 lg:grid-cols-12 pb-10'}`}>
      <div className="absolute bottom-3 inset-x-0 flex justify-center z-10 pointer-events-none">
        <div className="pointer-events-auto"><MarmitaCodeCredit /></div>
      </div>
      {step === 'mfa' ? (
        <form onSubmit={handleMfaVerify} className="w-full max-w-md animate-fade-in">
          <div className="bg-white dark:bg-[#1e293b] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
            <div className="mx-auto p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-full w-fit">
              <Lock className="h-8 w-8" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg mb-1">Verificação em duas etapas</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Digite o código de 6 dígitos do seu app autenticador.</p>
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-xl font-mono text-center tracking-[0.6em] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white"
              autoFocus
            />
            {errorMessage && <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">{errorMessage}</div>}
            <button type="submit" disabled={loading || mfaCode.length !== 6} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition cursor-pointer">
              {loading ? 'Verificando…' : 'Confirmar e entrar'}
            </button>
            <button type="button" onClick={async () => { await supabase.auth.signOut(); setStep('form'); setMfaCode(''); setErrorMessage(''); }} className="text-xs text-slate-500 hover:text-red-600 underline cursor-pointer">
              Cancelar e sair
            </button>
          </div>
        </form>
      ) : step === 'confirm' ? (
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
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Logo variant="favicon-a" className="h-8 w-auto brightness-0 invert" />
              </div>
              {onBack && (
                <button type="button" onClick={onBack} className="text-white/60 hover:text-white text-xs transition cursor-pointer flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">
                  ← Voltar
                </button>
              )}
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
                <div className="flex justify-center items-center mb-2">
                  <Logo variant="horizontal" className="h-10 w-auto" />
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
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="reg-birthdate">Data de Nascimento</label>
                        <input
                          id="reg-birthdate"
                          type="date"
                          max={new Date().toISOString().slice(0,10)}
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800 dark:text-white"
                          value={birthdate}
                          onChange={(e) => setBirthdate(e.target.value)}
                          required
                        />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Idade mínima: 13 anos. Entre 13 e 17 anos é exigido o e-mail de um responsável (LGPD Art. 14 + ECA Digital).
                        </p>
                      </div>
                      {(() => { const a = computeAge(birthdate); return a !== null && a >= 13 && a < 18; })() && (
                        <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl">
                          <label className="text-xs font-bold text-blue-700 dark:text-blue-400" htmlFor="reg-parent-email">E-mail do Responsável Legal (obrigatório)</label>
                          <input
                            id="reg-parent-email"
                            type="email"
                            className="w-full px-3 py-2.5 bg-white dark:bg-[#0f172a] border border-blue-200 dark:border-blue-900/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800 dark:text-white"
                            placeholder="responsavel@exemplo.com"
                            value={parentEmail}
                            onChange={(e) => setParentEmail(e.target.value)}
                          />
                          <label className="flex items-start gap-2 text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed cursor-pointer">
                            <input
                              type="checkbox"
                              checked={parentConsent}
                              onChange={(e) => setParentConsent(e.target.checked)}
                              className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer shrink-0"
                            />
                            <span>Declaro que meu responsável legal autorizou expressamente a criação desta conta e o tratamento dos meus dados pessoais pelo ApexEnem, conforme o Art. 14 da LGPD e a Lei nº 15.211/2025 (ECA Digital).</span>
                          </label>
                        </div>
                      )}
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>Os campos de região, estado e cidade abaixo são <strong>apenas para métricas internas</strong> da plataforma — ajudam a entender a distribuição geográfica dos estudantes.</span>
                      </div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Região</label>
                          <select value={region} onChange={(e) => { setRegion(e.target.value as RegionBR); setState(''); setCity(''); }} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white cursor-pointer">
                            {BRAZIL_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Estado</label>
                          <select value={state} onChange={(e) => { setState(e.target.value); setCity(''); }} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white cursor-pointer">
                            <option value="">Selecione</option>
                            {states.map((s) => <option key={s.code} value={s.name}>{s.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="reg-city">Cidade</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400"><Globe className="h-4.5 w-4.5" /></span>
                          <select
                            id="reg-city"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800 dark:text-white cursor-pointer"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                          >
                            <option value="">{state ? 'Selecione a cidade' : 'Selecione um estado primeiro'}</option>
                            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl">
                        <input
                          id="accept-terms"
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer shrink-0"
                        />
                        <label htmlFor="accept-terms" className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed cursor-pointer">
                          Li e aceito os{' '}
                          <a
                            href="/termos"
                            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                            onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/termos'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                          >
                            Termos de Uso
                          </a>{' '}
                          e a{' '}
                          <a
                            href="/privacidade"
                            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                            onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/privacidade'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                          >
                            Política de Privacidade
                          </a>{' '}
                          do ApexEnem.
                        </label>
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="email-input">E-mail</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400"><Mail className="h-4.5 w-4.5" /></span>
                      <input id="email-input" type="email" autoComplete="email" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800 dark:text-white" placeholder="nome@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} onPaste={!isLoginTab ? (e) => { e.preventDefault(); setErrorMessage('Por segurança, digite o e-mail no lugar de colar — você vai confirmá-lo abaixo.'); } : undefined} />
                    </div>
                  </div>

                  {!isLoginTab && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="email-confirm">Confirme o e-mail</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400"><Mail className="h-4.5 w-4.5" /></span>
                        <input
                          id="email-confirm"
                          type="email"
                          autoComplete="off"
                          className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition text-slate-800 dark:text-white ${emailConfirm && emailConfirm.toLowerCase().trim() !== email.toLowerCase().trim() ? 'border-red-400 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-blue-500'}`}
                          placeholder="Digite de novo o mesmo e-mail"
                          value={emailConfirm}
                          onChange={(e) => setEmailConfirm(e.target.value)}
                          onPaste={(e) => { e.preventDefault(); setErrorMessage('Digite o e-mail de novo — colar derrota o objetivo da verificação.'); }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        O link de confirmação será enviado para esse endereço. Digite com atenção.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="password-input">Senha</label>
                      {isLoginTab && (
                        <button
                          type="button"
                          className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
                          onClick={async () => {
                            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                              setErrorMessage('Digite seu e-mail antes de pedir a redefinição.');
                              return;
                            }
                            try {
                              await fetch('/api/password-reset-request', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: email.toLowerCase().trim() }),
                              });
                            } catch { /* ignora: resposta é sempre ok */ }
                            setSuccMessage(`Se o e-mail ${email.toLowerCase()} estiver cadastrado, você receberá um link de redefinição em alguns minutos.`);
                            setErrorMessage('');
                          }}
                        >Esqueci minha senha</button>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400"><Lock className="h-4.5 w-4.5" /></span>
                      <input id="password-input" type={showPassword ? 'text' : 'password'} autoComplete={isLoginTab ? 'current-password' : 'new-password'} className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800 dark:text-white" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-blue-600 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}</button>
                    </div>
                    {!isLoginTab && password.length > 0 && password.length < 8 && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400">A senha precisa de pelo menos 8 caracteres.</p>
                    )}
                  </div>

                  {!isLoginTab && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="password-confirm">Confirme a senha</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400"><Lock className="h-4.5 w-4.5" /></span>
                        <input
                          id="password-confirm"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition text-slate-800 dark:text-white ${passwordConfirm && passwordConfirm !== password ? 'border-red-400 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-blue-500'}`}
                          placeholder="Digite a mesma senha de novo"
                          value={passwordConfirm}
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {HCAPTCHA_SITE_KEY && (
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
                Estude com IAs de ponta para a Apex Enem.
              </div>
            </div>
          </div>
        </>
      )}
      {showBetaRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowBetaRequest(false)}>
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 max-w-md w-full space-y-5 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-lg text-slate-800 dark:text-slate-100">Solicitar Acesso Beta</h3>
              <button type="button" onClick={() => { setShowBetaRequest(false); setBetaRequestSent(false); }} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><X className="h-4 w-4 text-slate-400" /></button>
            </div>
            {betaRequestSent ? (
              <div className="text-center space-y-4 py-6">
                <div className="mx-auto p-3 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-full w-fit"><CheckCircle className="h-8 w-8" /></div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Solicitação enviada!</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Analisaremos seu pedido e você receberá um e-mail quando sua conta for liberada.</p>
                <button type="button" onClick={() => { setShowBetaRequest(false); setBetaRequestSent(false); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer">Fechar</button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">O cadastro está temporariamente restrito a participantes autorizados do Programa Beta Testing. Solicite seu acesso abaixo:</p>
                <div className="space-y-2">
                  <input type="text" placeholder="Seu nome completo" id="beta-name" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white" />
                  <input type="email" placeholder="Seu e-mail" id="beta-email" defaultValue={email} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white" />
                  <textarea placeholder="Por que você quer participar do Beta? (opcional)" id="beta-reason" rows={3} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white resize-none" />
                </div>
                <button type="button" disabled={betaRequestLoading}
                  onClick={async () => {
                    const bName = (document.getElementById('beta-name') as HTMLInputElement)?.value || '';
                    const bEmail = (document.getElementById('beta-email') as HTMLInputElement)?.value || '';
                    const bReason = (document.getElementById('beta-reason') as HTMLTextAreaElement)?.value || '';
                    if (!bName.trim() || !bEmail.trim()) return;
                    setBetaRequestLoading(true);
                    try {
                      await fetch('/api/beta-request', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: bName.trim(), email: bEmail.trim(), reason: bReason.trim() }),
                      });
                    } catch { /* ok */ }
                    setBetaRequestLoading(false);
                    setBetaRequestSent(true);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <Send className="h-3.5 w-3.5" />
                  {betaRequestLoading ? 'Enviando...' : 'Enviar Solicitação'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
