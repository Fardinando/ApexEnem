import React, { useState, useEffect } from 'react';
import { supabase, getProfile, fetchEssays, fetchSimulados, fetchLogs, saveEssay, saveSimulado, saveLog, upsertProfile } from './lib/supabase';
import type { EssayCorrection, ActivityLog } from './types';
import AuthView from './components/AuthView';
import OnboardingView from './components/OnboardingView';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import RedacaoView from './components/RedacaoView';
import PerguntasView from './components/PerguntasView';
import SimuladosView from './components/SimuladosView';
import ConfiguracoesView from './components/ConfiguracoesView';
import AprendizadoView from './components/AprendizadoView';



export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requireOnboarding, setRequireOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [essayCorrections, setEssayCorrections] = useState<EssayCorrection[]>([]);
  const [simuladosHistory, setSimuladosHistory] = useState<{ scorePercent: number; date: string; subject: string }[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) setSession(s);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (s && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        setSession(s);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      setRequireOnboarding(false);
      setEssayCorrections([]);
      setSimuladosHistory([]);
      setActivityLogs([]);
      return;
    }

    (async () => {
      const p = await getProfile(session.user.id);
      setProfile(p);
      setRequireOnboarding(!p?.serie);

      const [essays, sims, logs] = await Promise.all([
        fetchEssays(session.user.id),
        fetchSimulados(session.user.id),
        fetchLogs(session.user.id),
      ]);

      setEssayCorrections(essays);
      setSimuladosHistory(sims);
      setActivityLogs(logs);
    })();
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
    const savedTheme = localStorage.getItem('ApexEnem_dark_theme');
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === 'true');
    } else {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  const handleAuthSuccess = async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s) setSession(s);
  };

  const handleOnboardingCompleted = async (data: { serie: string; targetScore: number; hardSubjects: string[] }) => {
    if (!session?.user) return;
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
  };

  const handleAddCorrection = async (newCorr: EssayCorrection, log: ActivityLog) => {
    if (!session?.user) return;
    await saveEssay({ ...newCorr, user_id: session.user.id });
    await saveLog({ ...log, user_id: session.user.id });

    setEssayCorrections(prev => [newCorr, ...prev]);
    setActivityLogs(prev => [log, ...prev]);
  };

  const handleSaveSimuladoResult = async (scorePercent: number, subject: string) => {
    if (!session?.user) return;

    const newSim = { scorePercent, date: new Date().toLocaleDateString('pt-BR'), subject };
    await saveSimulado({ ...newSim, user_id: session.user.id });

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      type: 'simulado',
      title: 'Simulado Finalizado',
      description: `Matéria: ${subject}. Acerto: ${scorePercent}%.`,
      timeAgo: 'Agora mesmo',
      date: new Date().toISOString(),
    };
    await saveLog({ ...log, user_id: session.user.id });

    setSimuladosHistory(prev => [newSim, ...prev]);
    setActivityLogs(prev => [log, ...prev]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleUpdateProfile = async (updated: any) => {
    if (!session?.user) return;
    await upsertProfile({ id: session.user.id, ...updated });
    setProfile((prev: any) => ({ ...prev, ...updated }));
  };

  const handleClearLocalData = async () => {
    if (!session?.user) return;
    await supabase.from('essay_corrections').delete().eq('user_id', session.user.id);
    await supabase.from('simulado_history').delete().eq('user_id', session.user.id);
    await supabase.from('activity_logs').delete().eq('user_id', session.user.id);

    setEssayCorrections([]);
    setSimuladosHistory([]);
    setActivityLogs([]);
    setRequireOnboarding(true);

    const p = await getProfile(session.user.id);
    setProfile(p);
  };

  const handleDeleteAccount = async () => {
    if (!session?.user || !confirm('Tem certeza? Esta ação é irreversível.')) return;

    await supabase.from('essay_corrections').delete().eq('user_id', session.user.id);
    await supabase.from('simulado_history').delete().eq('user_id', session.user.id);
    await supabase.from('activity_logs').delete().eq('user_id', session.user.id);
    await supabase.from('profiles').delete().eq('id', session.user.id);
    await supabase.auth.admin.deleteUser(session.user.id);
    await supabase.auth.signOut();
  };

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

  if (!session?.user) {
    return <AuthView onSuccess={handleAuthSuccess} />;
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
    return <OnboardingView currentUser={userProfile as any} onCompleted={handleOnboardingCompleted} />;
  }

  const currentUser = {
    name: profile?.name || 'Estudante',
    email: session.user.email || '',
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
  };

  return (
    <div id="app-workspace" className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-[#1b1b24] dark:text-[#f3effc] flex flex-col lg:flex-row transition-colors duration-300 pb-16 lg:pb-0">
      <Sidebar
        currentUser={currentUser as any}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
      <main id="view-pane" className="flex-grow p-6 md:p-10 lg:p-12 max-w-7xl mx-auto w-full overflow-y-auto">
        {activeTab === 'dashboard' && (
          <DashboardView
            currentUser={currentUser as any}
            setActiveTab={setActiveTab}
            essayCorrections={essayCorrections}
            simuladosHistory={simuladosHistory}
            activityLogs={activityLogs}
          />
        )}
        {activeTab === 'redacao' && (
          <RedacaoView
            onAddCorrection={handleAddCorrection}
            essayCorrections={essayCorrections}
          />
        )}
        {activeTab === 'perguntas' && (
          <PerguntasView />
        )}
        {activeTab === 'simulados' && (
          <SimuladosView
            onSaveSimuladoResult={handleSaveSimuladoResult}
          />
        )}
        {activeTab === 'aprendizado' && (
          <AprendizadoView
            essayCorrections={essayCorrections}
            simuladosHistory={simuladosHistory}
            currentUser={currentUser as any}
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
      </main>
    </div>
  );
}
