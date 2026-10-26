import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { supabase, getProfile, fetchEssays, fetchSimulados, fetchLogs, saveEssay, saveSimulado, saveLog, upsertProfile, fetchLearningProgress, saveLearningProgress, deleteEssaysByUser, deleteSimuladosByUser, deleteLogsByUser } from './lib/supabase';
import type { EssayCorrection, ActivityLog, WrongAnswer, QuestionMeta, QuestionResponse, TriProfile } from './types';
import { classifyQuestion } from './lib/api';
import { computeTriProfile, EMPTY_TRI_PROFILE } from './lib/tri';
import { saveQuestionResponses, fetchQuestionResponses } from './lib/supabase';
import { calculateStreak, XP_REWARDS, getUnlockedAchievements, getAllAchievements, computeGamificationStats, type GamificationStats } from './lib/gamification';
import { loadSpecialAds } from './lib/ads';
import AuthView from './components/AuthView';
import OnboardingView from './components/OnboardingView';
import Sidebar from './components/Sidebar';
import LandingPage from './components/LandingPage';
import AboutPage from './components/AboutPage';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import CookiePolicyPage from './components/CookiePolicyPage';
import CookieConsentBanner from './components/CookieConsentBanner';
import SubscriptionTermsPage from './components/SubscriptionTermsPage';
import RefundPolicyPage from './components/RefundPolicyPage';
import DenunciarPage from './components/DenunciarPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import ResponsavelPage from './components/ResponsavelPage';
import BlogView from './components/BlogView';
import AuthorsView from './components/AuthorsView';
import ContactPage from './components/ContactPage';
import RepertoiresView, { RepertoireSearch } from './components/RepertoiresView';
import PlansPage from './components/PlansPage';
import { setWalletAuthToken } from './lib/coins';

const DashboardView = lazy(() => import('./components/DashboardView'));
const RedacaoView = lazy(() => import('./components/RedacaoView'));
const PerguntasView = lazy(() => import('./components/PerguntasView'));
const SimuladosView = lazy(() => import('./components/SimuladosView'));
const ConfiguracoesView = lazy(() => import('./components/ConfiguracoesView'));
const AprendizadoView = lazy(() => import('./components/AprendizadoView'));
const AulasView = lazy(() => import('./components/AulasView'));
const SalasView = lazy(() => import('./components/SalasView'));
const PerfilView = lazy(() => import('./components/PerfilView'));
const TeacherPlanView = lazy(() => import('./components/TeacherPlanView'));

function ViewSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center space-y-3">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-slate-400">Carregando módulo...</p>
      </div>
    </div>
  );
}



export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requireOnboarding, setRequireOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('ApexEnem_dark_theme');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [essayCorrections, setEssayCorrections] = useState<EssayCorrection[]>([]);
  const [simuladosHistory, setSimuladosHistory] = useState<{ scorePercent: number; date: string; subject: string }[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [totalXp, setTotalXp] = useState(() => {
    const saved = localStorage.getItem('ApexEnem_total_xp');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [longestStreak, setLongestStreak] = useState(() => {
    const saved = localStorage.getItem('ApexEnem_longest_streak');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [triProfile, setTriProfile] = useState<TriProfile>(EMPTY_TRI_PROFILE);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  useEffect(() => {
    // Supabase e provedores OAuth entregam access_token/refresh_token/code no hash
    // ou query da URL (magic link, recovery, OAuth). Removemos imediatamente da barra
    // de endereços para não vazar em Referer, histórico, analytics ou screenshots.
    // EXCEÇÃO: na página /reset-password o supabase-js precisa processar o hash
    // antes — removemos só depois (ele mesmo faz replaceState no onAuthStateChange).
    const isResetPage = window.location.pathname === '/reset-password';
    const url = new URL(window.location.href);
    const SENSITIVE = ['access_token', 'refresh_token', 'provider_token', 'token', 'token_hash', 'code', 'type', 'expires_in', 'expires_at'];
    let changed = false;
    for (const k of SENSITIVE) {
      if (url.searchParams.has(k)) { url.searchParams.delete(k); changed = true; }
    }
    if (!isResetPage && window.location.hash && /access_token=|refresh_token=|type=recovery/.test(window.location.hash)) {
      url.hash = '';
      changed = true;
    }
    if (changed) {
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }

    const onPop = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    supabase.auth.getSession()
      .then(({ data: { session: s } }) => {
        if (s) setSession(s);
      })
      .catch(() => { /* session fetch failed */ })
      .finally(() => setLoading(false));

    const sub = supabase.auth.onAuthStateChange((event, s) => {
      if (s && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        setSession(s);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
      }
    });

    return () => {
      window.removeEventListener('popstate', onPop);
      sub.data.subscription.unsubscribe();
    };
  }, []);

  // Mantém a carteira de moedas sincronizada com o servidor (persistente por conta).
  useEffect(() => {
    if (session?.user && session?.access_token) {
      setWalletAuthToken(session.access_token);
    } else {
      setWalletAuthToken(null);
    }
  }, [session?.user?.id, session?.access_token]);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      setRequireOnboarding(false);
      setEssayCorrections([]);
      setSimuladosHistory([]);
      setActivityLogs([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const p = await getProfile(session.user.id);
        if (cancelled) return;
        setProfile(p);
        setRequireOnboarding(!p?.serie);

        // Persiste birthdate pra consent.ts aplicar TFUA/TFCD/NPA no AdSense
        // (ECA Digital + LGPD Art. 14 §3º — proibido perfilamento publicitário
        // de menores, mesmo com consentimento parental).
        const bd = p?.birthdate || session.user.user_metadata?.birthdate;
        if (bd) {
          try { localStorage.setItem('ApexEnem_user_birthdate', bd); } catch { /* noop */ }
        } else {
          try { localStorage.removeItem('ApexEnem_user_birthdate'); } catch { /* noop */ }
        }

        // Sync XP/streak from server to localStorage if server has data
        const localXp = parseInt(localStorage.getItem('ApexEnem_total_xp') || '0', 10);
        const localStreak = parseInt(localStorage.getItem('ApexEnem_longest_streak') || '0', 10);
        if (p?.total_xp && p.total_xp > localXp) {
          setTotalXp(p.total_xp);
          localStorage.setItem('ApexEnem_total_xp', String(p.total_xp));
        }
        if (p?.longest_streak && p.longest_streak > localStreak) {
          setLongestStreak(p.longest_streak);
          localStorage.setItem('ApexEnem_longest_streak', String(p.longest_streak));
        }

        // Calculate and update streak
        if (p) {
          const todayStr = new Date().toISOString().split('T')[0];
          const serverLastLogin = p.last_login_date || '';
          const localLastLogin = localStorage.getItem('ApexEnem_last_login') || '';

          // Use whichever is more recent
          const effectiveLastLogin = serverLastLogin > localLastLogin ? serverLastLogin : localLastLogin;

          const { newStreak, isNewDay, streakBroken } = calculateStreak(effectiveLastLogin);
          if (isNewDay && newStreak > 0) {
            const updatedStreak = streakBroken ? 1 : (p.streak || 0) + newStreak;
            const newLongest = Math.max(updatedStreak, longestStreak);
            setLongestStreak(newLongest);
            localStorage.setItem('ApexEnem_longest_streak', String(newLongest));
            localStorage.setItem('ApexEnem_last_login', todayStr);
            await upsertProfile({
              id: session.user.id,
              streak: updatedStreak,
              longest_streak: newLongest,
              last_login_date: todayStr,
            }).catch(() => {});
            setProfile((prev: any) => ({ ...prev, streak: updatedStreak, last_login_date: todayStr }));
          }
        }

        const [essays, sims, logs, progress] = await Promise.all([
          fetchEssays(session.user.id),
          fetchSimulados(session.user.id),
          fetchLogs(session.user.id),
          session.user.email ? fetchLearningProgress(session.user.email).catch(() => null) : Promise.resolve(null),
        ]);

        if (cancelled) return;
        setEssayCorrections(essays);
        setSimuladosHistory(sims);
        setActivityLogs(logs);
        if (progress?.wrongAnswers) setWrongAnswers(progress.wrongAnswers);

        const responses = await fetchQuestionResponses(session.user.id).catch(() => [] as QuestionResponse[]);
        if (!cancelled && responses.length > 0) {
          setTriProfile(computeTriProfile(responses));
        }
      } catch (err) {
        console.error("Failed to load user data:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  const handleWrongAnswer = (subject: string, source: 'simulado' | 'pergunta-ia' | 'redacao' | 'aula', meta?: QuestionMeta) => {
    const entry: WrongAnswer = {
      subject,
      method: meta?.method,
      topic: meta?.topic,
      source,
      timestamp: Date.now(),
    };
    const updated = [entry, ...wrongAnswers];
    setWrongAnswers(updated);
    if (session?.user?.email) {
      saveLearningProgress(session.user.email, { wrongAnswers: updated }).catch(() => {});
    }

    if (meta?.statement && !entry.topic && !entry.method) {
      classifyQuestion(meta.statement, subject).then((cls) => {
        if (!cls.topic && !cls.method) return;
        setWrongAnswers((current) => {
          const next = current.map((w) =>
            w.timestamp === entry.timestamp
              ? { ...w, subject: cls.subject || w.subject, method: cls.method || w.method, topic: cls.topic || w.topic }
              : w
          );
          if (session?.user?.email) {
            saveLearningProgress(session.user.email, { wrongAnswers: next }).catch(() => {});
          }
          return next;
        });
      }).catch(() => {});
    }
  };

  const handleSaveQuestionResponses = useCallback(async (responses: QuestionResponse[]) => {
    if (!session?.user?.id || responses.length === 0) return;
    await saveQuestionResponses(session.user.id, responses).catch(() => {});
    const allResponses = await fetchQuestionResponses(session.user.id).catch(() => [] as QuestionResponse[]);
    if (allResponses.length > 0) {
      setTriProfile(computeTriProfile(allResponses));
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ApexEnem_dark_theme', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    if (!session?.user) return;
    const cleanup = loadSpecialAds();
    return cleanup;
  }, [session?.user?.id]);



  const handleAuthSuccess = async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s) setSession(s);
    // Limpa /login, /signup e qualquer query string residual da URL depois de autenticar
    if (window.location.pathname !== '/' || window.location.search || window.location.hash) {
      window.history.replaceState({}, '', '/');
      setCurrentPath('/');
    }
  };

  const handleOnboardingCompleted = async (data: { serie: string; targetScore: number; hardSubjects: string[] }) => {
    if (!session?.user) return;
    try {
      const updated = await upsertProfile({
        id: session.user.id,
        name: session.user.user_metadata?.name || 'Estudante',
        region: session.user.user_metadata?.region,
        state: session.user.user_metadata?.state,
        city: session.user.user_metadata?.city,
        serie: data.serie,
        target_score: data.targetScore,
        hard_subjects: data.hardSubjects,
      });
      setProfile(updated || { serie: data.serie, target_score: data.targetScore, hard_subjects: data.hardSubjects });
      setRequireOnboarding(false);

      const newLog: ActivityLog = {
        id: `act-${Date.now()}`,
        type: 'onboarding',
        title: 'Plano Adaptativo Personalizado',
        description: `Série mapeada: ${data.serie}. Meta estabelecida: ${data.targetScore} pontos.`,
        timeAgo: 'Agora mesmo',
        date: new Date().toISOString(),
      };

      await saveLog({ ...newLog, user_id: session.user.id });
      setActivityLogs(prev => [newLog, ...prev]);
    } catch (err) {
      console.error("Failed to save onboarding:", err);
    }
  };

  const handleAddCorrection = async (newCorr: EssayCorrection, log: ActivityLog) => {
    if (!session?.user) return;
    try {
      await saveEssay({ ...newCorr, user_id: session.user.id });
      await saveLog({ ...log, user_id: session.user.id });
      setEssayCorrections(prev => [newCorr, ...prev]);
      setActivityLogs(prev => [log, ...prev]);
      const p = await getProfile(session.user.id);
      if (p) setProfile(p);
      if ((newCorr.score || 0) < 700) {
        handleWrongAnswer('Redação', 'redacao');
      }
      // Award XP for essay
      const xpEarned = XP_REWARDS.ESSAY_CORRECTION;
      const newXp = totalXp + xpEarned;
      setTotalXp(newXp);
      localStorage.setItem('ApexEnem_total_xp', String(newXp));
      await upsertProfile({ id: session.user.id, total_xp: newXp });
    } catch (err) {
      console.error("Failed to save correction:", err);
    }
  };

  const handleSaveSimuladoResult = async (scorePercent: number, subject: string) => {
    if (!session?.user) return;

    const newSim = { scorePercent, date: new Date().toLocaleDateString('pt-BR'), subject };
    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      type: 'simulado',
      title: 'Simulado Finalizado',
      description: `Matéria: ${subject}. Acerto: ${scorePercent}%.`,
      timeAgo: 'Agora mesmo',
      date: new Date().toISOString(),
    };

    try {
      await saveSimulado({ ...newSim, user_id: session.user.id });
      await saveLog({ ...log, user_id: session.user.id });
      setSimuladosHistory(prev => [newSim, ...prev]);
      setActivityLogs(prev => [log, ...prev]);
      const p = await getProfile(session.user.id);
      if (p) setProfile(p);
      // Award XP for simulado
      let xpEarned = XP_REWARDS.SIMULADO_PASS;
      if (scorePercent >= 80) xpEarned = XP_REWARDS.SIMULADO_HIGH_SCORE;
      if (scorePercent === 100) xpEarned = XP_REWARDS.SIMULADO_PERFECT;
      const newXp = totalXp + xpEarned;
      setTotalXp(newXp);
      localStorage.setItem('ApexEnem_total_xp', String(newXp));
      await upsertProfile({ id: session.user.id, total_xp: newXp });
    } catch (err) {
      console.error("Failed to save simulado result:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleUpdateProfile = async (updated: any) => {
    if (!session?.user) return;
    try {
      await upsertProfile({ id: session.user.id, ...updated });
      const p = await getProfile(session.user.id);
      if (p) setProfile(p);
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  const handleClearLocalData = async () => {
    if (!session?.user) return;
    try {
      await deleteEssaysByUser(session.user.id);
      await deleteSimuladosByUser(session.user.id);
      await deleteLogsByUser(session.user.id);

      setEssayCorrections([]);
      setSimuladosHistory([]);
      setActivityLogs([]);
      setRequireOnboarding(true);

      const p = await getProfile(session.user.id);
      setProfile(p);
    } catch (err) {
      console.error("Failed to clear data:", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.user || !confirm('Tem certeza? Esta ação é irreversível.')) return;

    try {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      const token = activeSession?.access_token;

      if (!token) {
        console.error("No access token found");
        return;
      }

      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ confirm: 'APAGAR MINHA CONTA' }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("Delete account failed:", body.error || res.statusText);
        return;
      }

      await supabase.auth.signOut();
    } catch (err) {
      console.error("Failed to delete account:", err);
    }
  };

  const currentUser = useMemo(() => ({
    name: profile?.name || 'Estudante',
    email: session?.user?.email || '',
    region: profile?.region,
    state: profile?.state,
    city: profile?.city,
    avatar: profile?.avatar,
    serie: profile?.serie,
    targetScore: profile?.target_score,
    hardSubjects: profile?.hard_subjects,
    streak: profile?.streak || 1,
    lastLoginDate: profile?.last_login_date,
    confirmed: true,
    totalXp,
    longestStreak: Math.max(longestStreak, profile?.streak || 1),
  }), [profile, session, totalXp, longestStreak]);

  const gamificationStats = useMemo(() => computeGamificationStats({
    essays: essayCorrections,
    simulados: simuladosHistory,
    streak: profile?.streak || 1,
    longestStreak: Math.max(longestStreak, profile?.streak || 1),
    totalXp,
  }), [essayCorrections, simuladosHistory, profile, longestStreak, totalXp]);

  const unlockedAchievements = useMemo(() => getUnlockedAchievements(gamificationStats), [gamificationStats]);
  const allAchievements = useMemo(() => getAllAchievements(gamificationStats), [gamificationStats]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcf8ff] dark:bg-[#0a0814]">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (currentPath === '/sobre') {
    return (
      <>
        <AboutPage onStart={() => navigate('/login')} onSignup={() => navigate('/signup')} onBack={() => navigate('/')} />
        <CookieConsentBanner />
      </>
    );
  }

  if (currentPath === '/termos') {
    return (
      <>
        <TermsPage onBack={() => navigate('/signup')} onSignup={() => navigate('/signup')} />
        <CookieConsentBanner />
      </>
    );
  }

  if (currentPath === '/privacidade') {
    return (
      <>
        <PrivacyPage onBack={() => navigate('/signup')} onSignup={() => navigate('/signup')} />
        <CookieConsentBanner />
      </>
    );
  }

  if (currentPath === '/cookies') {
    return (
      <>
        <CookiePolicyPage onBack={() => navigate('/signup')} onSignup={() => navigate('/signup')} />
        <CookieConsentBanner />
      </>
    );
  }

  if (currentPath === '/assinatura') {
    return (
      <>
        <SubscriptionTermsPage onBack={() => navigate('/signup')} onSignup={() => navigate('/signup')} />
        <CookieConsentBanner />
      </>
    );
  }

  if (currentPath === '/reembolso') {
    return (
      <>
        <RefundPolicyPage onBack={() => navigate('/signup')} onSignup={() => navigate('/signup')} />
        <CookieConsentBanner />
      </>
    );
  }

  if (currentPath === '/denunciar') {
    return (
      <>
        <DenunciarPage />
        <CookieConsentBanner />
      </>
    );
  }

  if (currentPath === '/reset-password') {
    return (
      <>
        <ResetPasswordPage />
        <CookieConsentBanner />
      </>
    );
  }

  if (currentPath === '/responsavel') {
    return (
      <>
        <ResponsavelPage />
        <CookieConsentBanner />
      </>
    );
  }

  if (currentPath === '/blog' || currentPath.startsWith('/blog/')) {
    const slug = currentPath.startsWith('/blog/') ? decodeURIComponent(currentPath.slice('/blog/'.length)) : undefined;
    return (
      <>
        <BlogView slug={slug} />
        <CookieConsentBanner />
      </>
    );
  }

  if (currentPath === '/autores' || currentPath.startsWith('/autor/')) {
    const slug = currentPath.startsWith('/autor/') ? decodeURIComponent(currentPath.slice('/autor/'.length)) : undefined;
    return (
      <>
        <AuthorsView slug={slug} />
        <CookieConsentBanner />
      </>
    );
  }

  if (currentPath === '/contato') {
    return (
      <>
        <ContactPage />
        <CookieConsentBanner />
      </>
    );
  }

  if (currentPath === '/repertorios') {
    return (
      <>
        <RepertoiresView />
        <CookieConsentBanner />
      </>
    );
  }

  if (currentPath === '/planos') {
    return (
      <>
        <PlansPage onSignup={() => navigate('/signup')} onLogin={() => navigate('/login')} />
        <CookieConsentBanner />
      </>
    );
  }

  if (!session?.user) {
    if (currentPath === '/login' || currentPath === '/signup') {
      return (
        <>
          <AuthView defaultTab={currentPath === '/login' ? 'login' : 'signup'} onSuccess={handleAuthSuccess} onBack={() => navigate('/')} />
          <CookieConsentBanner />
        </>
      );
    }
    return (
      <>
        <LandingPage onStart={() => navigate('/login')} onSignup={() => navigate('/signup')} />
        <CookieConsentBanner />
      </>
    );
  }

  if (requireOnboarding) {
    const userProfile = {
      name: profile?.name || 'Estudante',
      email: session.user.email || '',
      region: profile?.region,
      state: profile?.state,
      city: profile?.city,
      confirmed: true,
      streak: profile?.streak || 1,
      lastLoginDate: new Date().toISOString().split('T')[0],
    };
    return (
      <>
        <OnboardingView currentUser={userProfile as any} onCompleted={handleOnboardingCompleted} />
      </>
    );
  }

  return (
    <>
      <div id="app-workspace" className="min-h-screen lg:h-screen bg-slate-50 dark:bg-[#0f172a] text-[#1b1b24] dark:text-[#f3effc] flex flex-col lg:flex-row transition-colors duration-300 pb-16 lg:pb-0 lg:overflow-hidden">
      <Sidebar
        currentUser={currentUser as any}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
      <main id="view-pane" className="flex-grow p-4 sm:p-6 md:p-10 lg:p-12 pb-24 lg:pb-12 max-w-7xl mx-auto w-full lg:overflow-y-auto lg:h-screen overflow-x-hidden">
        <Suspense fallback={<ViewSpinner />}>
          {activeTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser as any}
              setActiveTab={setActiveTab}
              essayCorrections={essayCorrections}
              simuladosHistory={simuladosHistory}
              activityLogs={activityLogs}
              gamificationStats={gamificationStats}
              achievements={allAchievements}
              triProfile={triProfile}
            />
          )}
          {activeTab === 'redacao' && (
            <RedacaoView
              onAddCorrection={handleAddCorrection}
              essayCorrections={essayCorrections}
            />
          )}
          {activeTab === 'perguntas' && (
            <PerguntasView onWrongAnswer={handleWrongAnswer} hardSubjects={profile?.hard_subjects || []} triProfile={triProfile} onSaveResponses={handleSaveQuestionResponses} />
          )}
          {activeTab === 'simulados' && (
            <SimuladosView
              onSaveSimuladoResult={handleSaveSimuladoResult}
              onWrongAnswer={handleWrongAnswer}
              accessToken={session.access_token}
              triProfile={triProfile}
              onSaveResponses={handleSaveQuestionResponses}
            />
          )}
          {activeTab === 'aulas' && (
            <AulasView currentUser={currentUser as any} />
          )}
          {activeTab === 'salas' && (
            <SalasView currentUser={currentUser as any} />
          )}
          {activeTab === 'aprendizado' && (
            <AprendizadoView
              essayCorrections={essayCorrections}
              simuladosHistory={simuladosHistory}
              currentUser={currentUser as any}
              accessToken={session.access_token}
              wrongAnswers={wrongAnswers}
              onWrongAnswer={handleWrongAnswer}
              triProfile={triProfile}
              onSaveResponses={handleSaveQuestionResponses}
            />
          )}
          {activeTab === 'configuracoes' && (
            <ConfiguracoesView
              currentUser={currentUser as any}
              isDarkMode={isDarkMode}
              toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              onLogout={handleLogout}
              onClearLocalData={handleClearLocalData}
              onDeleteAccount={handleDeleteAccount}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
          {activeTab === 'perfil' && (
            <PerfilView
              currentUser={currentUser as any}
              essayCorrections={essayCorrections}
              simuladosHistory={simuladosHistory}
              activityLogs={activityLogs}
              wrongAnswers={wrongAnswers}
              gamificationStats={gamificationStats}
              achievements={allAchievements}
              setActiveTab={setActiveTab}
              triProfile={triProfile}
            />
          )}
          {activeTab === 'repertorios' && <RepertoireSearch embedded />}
          {activeTab === 'teacher' && (
            <TeacherPlanView
              accessToken={session.access_token}
              onUpgrade={() => { window.history.pushState({}, '', '/planos'); setCurrentPath('/planos'); }}
            />
          )}
        </Suspense>
      </main>
      </div>
    </>
  );
}
