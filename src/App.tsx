/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, EssayCorrection, ActivityLog } from './types';
import AuthView from './components/AuthView';
import OnboardingView from './components/OnboardingView';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import RedacaoView from './components/RedacaoView';
import PerguntasView from './components/PerguntasView';
import SimuladosView from './components/SimuladosView';
import ConfiguracoesView from './components/ConfiguracoesView';
import AprendizadoView from './components/AprendizadoView';

// Standard Seed Data to motivate students on direct entry
const DEFAULT_CORRECTIONS_SEED: EssayCorrection[] = [
  {
    id: 'seed-1',
    title: 'O Estigma Associado às Doenças Mentais no Brasil',
    text: 'Na obra Michel Foucault discute a "História da Loucura", mapeando como a sociedade excluiu aqueles em desacordo com a razão padrão. No Brasil contemporâneo, esse panorama persiste sob a forma de estigmas graves contra enfermidades mentais. Configura-se, pois, um cenário de omissão estatal e falta de conscientização coletiva que carece de intervenção célere...',
    score: 840,
    generalFeedback: 'Sua redação apresenta excelente estrutura formal e amplo repertório de base filosófica, incorporando Michel Foucault de modo produtivo. Porém, atente-se a vírgulas antes de conjunções adversativas e busque detalhar de forma mais profunda o agente público na proposta final.',
    competencies: [
      { id: 1, name: 'C1 - Domínio Escrito Formal', description: 'Demonstrar domínio da norma culta.', score: 160, feedback: 'Excelente vocabulário. Apenas dois desvios leves quanto à regência verbal na linha 14.' },
      { id: 2, name: 'C2 - Compreensão e Repertório', description: 'Compreender o tema e aplicar conceitos variados.', score: 200, feedback: 'Gabaritou. Integrou perfeitamente a alusão foucaultiana com o problema concreto.' },
      { id: 3, name: 'C3 - Seleção e Organização', description: 'Selecionar e relacionar argumentos estruturados.', score: 160, feedback: 'Projeto de texto muito evidente. Senti falta de maior aprofundamento do argumento de responsabilidade midiática.' },
      { id: 4, name: 'C4 - Coesão e Conectivos', description: 'Demonstrar conhecimento dos mecanismos linguísticos de coesão.', score: 160, feedback: 'Emprego variado de conectivos argumentativos interparágrafos. Evite repetir "pois" de maneira consecutiva.' },
      { id: 5, name: 'C5 - Proposta de Intervenção', description: 'Elaborar proposta respeitando direitos humanos.', score: 160, feedback: 'Apresenta objetivo (conscientização), meio (palestras escolares) e efeito. Detalhe melhor QUEM irá financiar.' }
    ],
    strengths: [
      'Alusão histórica e filosófica extremamente pertinente e bem posicionada.',
      'Excelente divisão de parágrafos mantendo um projeto de texto linear constante.'
    ],
    weaknesses: [
      'Pequena repetição de operadores lógicos de conclusão (pois, portanto).',
      'Breve negligência no detalhamento fino do órgão executor governamental.'
    ],
    date: '15/05/2026'
  },
  {
    id: 'seed-2',
    title: 'Caminhos Para Combater a Intolerância Religiosa',
    text: 'A Constituição Federal de 1988 preconiza o livre exercício dos cultos religiosos de qualquer ordem. Entretanto, a persistência de atos agressivos de matriz africana revela que esse direito sagrado sofre constantes violações mercê de preconceitos históricos herdados do pelourinho...',
    score: 720,
    generalFeedback: 'Bom texto argumentativo apresentando sólida tese sobre a herança colonial nos cultos. No entanto, houve tangenciamento parcial nas justificativas lógicas do desenvolvimento e a proposta esquera-se incompleta.',
    competencies: [
      { id: 1, name: 'C1 - Domínio Escrito Formal', description: 'Demonstrar domínio da norma culta.', score: 120, feedback: 'Surgiram alguns desvios visíveis de concordância plural e pontuação inadequada.' },
      { id: 2, name: 'C2 - Compreensão e Repertório', description: 'Compreender o tema e aplicar conceitos variados.', score: 160, feedback: 'Boa apropriação dos dados da Magna Carta de 88.' },
      { id: 3, name: 'C3 - Seleção e Organização', description: 'Selecionar e relacionar argumentos estruturados.', score: 120, feedback: 'Tese clara, mas a argumentação secundária apoia-se excessivamente em dados implícitos.' },
      { id: 4, name: 'C4 - Coesão e Conectivos', description: 'Demonstrar conhecimento dos mecanismos linguísticos de coesão.', score: 160, feedback: 'Boa articulação de coesão, sem ambiguidades comprometedoras.' },
      { id: 5, name: 'C5 - Proposta de Intervenção', description: 'Elaborar proposta respeitando direitos humanos.', score: 165, feedback: 'O detalhamento é bom, mas o agente público do Ministério da Cultura ficou ambiguo.' }
    ],
    strengths: [
      'Boa incorporação jurídica e histórica remetendo ao Brasil Império.',
      'Uso assertivo de pronomes demonstrativos mantendo o laço referencial.'
    ],
    weaknesses: [
      'Desvios gramaticais de concordância que tiram tração da competência formativa.',
      'Faltou um elemento final detalhado justificando a relação causa-efeito na intervenção.'
    ],
    date: '02/05/2026'
  }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [requireOnboarding, setRequireOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // States loaded from local persistence
  const [essayCorrections, setEssayCorrections] = useState<EssayCorrection[]>([]);
  const [simuladosHistory, setSimuladosHistory] = useState<{ scorePercent: number; date: string; subject: string }[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // 1. Check active sessions and load previous entries on boot
  useEffect(() => {
    // One-time automatic deletion of the test account as explicitly requested
    const cleared = localStorage.getItem('notamil_registered_clear_v2');
    if (!cleared) {
      localStorage.removeItem('notamil_current_user');
      localStorage.setItem('notamil_registered_clear_v2', 'true');
      
      const usersRaw = localStorage.getItem('notamil_users');
      if (usersRaw) {
        try {
          const users: UserProfile[] = JSON.parse(usersRaw);
          const filtered = users.filter((u) => u.email.toLowerCase() !== 'fernandoanderson.sousa@gmail.com');
          localStorage.setItem('notamil_users', JSON.stringify(filtered));
        } catch (e) {}
      }
    }

    const sessionUser = localStorage.getItem('notamil_current_user');
    if (sessionUser) {
      const user: UserProfile = JSON.parse(sessionUser);
      setCurrentUser(user);
      
      // Onboarding checker
      setRequireOnboarding(!user.serie);
      loadUserData(user.email, !user.serie);
    }

    // Load persisted theme or fallback to preference
    const savedTheme = localStorage.getItem('notamil_dark_theme');
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === 'true');
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemPrefersDark);
    }
  }, []);

  // 2. Class CSS binding when Theme toggles
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('notamil_dark_theme', String(isDarkMode));
  }, [isDarkMode]);

  const loadUserData = (email: string, isBrandNew: boolean = false) => {
    const keyPrefix = email.toLowerCase().replace(/[@.]/g, '_');
    
    // Load Essay corrections or seed Default
    const localCorrections = localStorage.getItem(`notamil_corr_${keyPrefix}`);
    if (localCorrections) {
      setEssayCorrections(JSON.parse(localCorrections));
    } else {
      const initialCorr = isBrandNew ? [] : DEFAULT_CORRECTIONS_SEED;
      setEssayCorrections(initialCorr);
      localStorage.setItem(`notamil_corr_${keyPrefix}`, JSON.stringify(initialCorr));
    }

    // Load Simulados
    const localSimHistory = localStorage.getItem(`notamil_sim_${keyPrefix}`);
    if (localSimHistory) {
      setSimuladosHistory(JSON.parse(localSimHistory));
    } else {
      const initialSims = isBrandNew ? [] : [
        { scorePercent: 80, date: '14/05/2026', subject: 'Matemática' },
        { scorePercent: 60, date: '08/05/2026', subject: 'Humanas' }
      ];
      setSimuladosHistory(initialSims);
      localStorage.setItem(`notamil_sim_${keyPrefix}`, JSON.stringify(initialSims));
    }

    // Load Logs
    const localLogs = localStorage.getItem(`notamil_logs_${keyPrefix}`);
    if (localLogs) {
      setActivityLogs(JSON.parse(localLogs));
    } else {
      const initialLogs = isBrandNew ? [] : [
        { id: 'start-0', type: 'streak', title: 'Estudos Iniciados', description: 'Deu os passos iniciais rumo ao mil!', timeAgo: 'Há 3 dias', date: 'Hoje' },
        { id: 'start-1', type: 'redacao', title: 'Redação avaliada', description: 'A redação "Doenças Mentais" foi revisada com nota 840.', timeAgo: 'Há 5 dias', date: 'Hoje' }
      ];
      setActivityLogs(initialLogs);
      localStorage.setItem(`notamil_logs_${keyPrefix}`, JSON.stringify(initialLogs));
    }
  };

  const handleAuthSuccess = (user: UserProfile, requireOnb: boolean) => {
    setCurrentUser(user);
    setRequireOnboarding(requireOnb);
    loadUserData(user.email, requireOnb);
    setActiveTab('dashboard');
  };

  const handleOnboardingCompleted = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    setRequireOnboarding(false);
    
    // Log onboarding activity event
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      type: 'onboarding',
      title: 'Plano Adaptativo Personalizado',
      description: `Série mapeada: ${updatedUser.serie}. Meta estabelecida: ${updatedUser.targetScore} pontos.`,
      timeAgo: 'Agora mesmo',
      date: new Date().toISOString()
    };

    const keyPrefix = updatedUser.email.toLowerCase().replace(/[@.]/g, '_');
    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);
    localStorage.setItem(`notamil_logs_${keyPrefix}`, JSON.stringify(updatedLogs));
  };

  const handleAddCorrection = (newCorr: EssayCorrection, log: ActivityLog) => {
    if (!currentUser) return;

    const keyPrefix = currentUser.email.toLowerCase().replace(/[@.]/g, '_');
    const updatedCorr = [newCorr, ...essayCorrections];
    setEssayCorrections(updatedCorr);
    localStorage.setItem(`notamil_corr_${keyPrefix}`, JSON.stringify(updatedCorr));

    const updatedLogs = [log, ...activityLogs];
    setActivityLogs(updatedLogs);
    localStorage.setItem(`notamil_logs_${keyPrefix}`, JSON.stringify(updatedLogs));
  };

  const handleSaveSimuladoResult = (scorePercent: number, subject: string) => {
    if (!currentUser) return;

    const keyPrefix = currentUser.email.toLowerCase().replace(/[@.]/g, '_');
    
    // Save history
    const newSim = { scorePercent, date: new Date().toLocaleDateString('pt-BR'), subject };
    const updatedHistory = [newSim, ...simuladosHistory];
    setSimuladosHistory(updatedHistory);
    localStorage.setItem(`notamil_sim_${keyPrefix}`, JSON.stringify(updatedHistory));

    // Save log
    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      type: 'simulado',
      title: 'Simulado Finalizado',
      description: `Matéria: ${subject}. Acerto: ${scorePercent}%.`,
      timeAgo: 'Agora mesmo',
      date: new Date().toISOString()
    };

    const updatedLogs = [log, ...activityLogs];
    setActivityLogs(updatedLogs);
    localStorage.setItem(`notamil_logs_${keyPrefix}`, JSON.stringify(updatedLogs));
  };

  const handleLogout = () => {
    localStorage.removeItem('notamil_current_user');
    setCurrentUser(null);
    setRequireOnboarding(false);
    setEssayCorrections([]);
    setSimuladosHistory([]);
    setActivityLogs([]);
  };

  const handleClearLocalData = () => {
    if (!currentUser) return;
    const keyPrefix = currentUser.email.toLowerCase().replace(/[@.]/g, '_');
    
    // Clean keys
    localStorage.removeItem(`notamil_corr_${keyPrefix}`);
    localStorage.removeItem(`notamil_sim_${keyPrefix}`);
    localStorage.removeItem(`notamil_logs_${keyPrefix}`);
    
    // reset onboarding in current user
    const resetUser: UserProfile = {
      name: currentUser.name,
      email: currentUser.email,
      streak: 1,
      lastLoginDate: new Date().toISOString().split('T')[0]
    };

    localStorage.setItem('notamil_current_user', JSON.stringify(resetUser));
    setCurrentUser(resetUser);
    setRequireOnboarding(true);
    setEssayCorrections([]);
    setSimuladosHistory([]);
    setActivityLogs([]);
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return;
    const emailToDelete = currentUser.email.toLowerCase();
    const keyPrefix = emailToDelete.replace(/[@.]/g, '_');

    // 1. Clear database lists for this user
    localStorage.removeItem(`notamil_corr_${keyPrefix}`);
    localStorage.removeItem(`notamil_sim_${keyPrefix}`);
    localStorage.removeItem(`notamil_logs_${keyPrefix}`);

    // 2. Remove profile from users index
    const usersRaw = localStorage.getItem('notamil_users');
    if (usersRaw) {
      try {
        const users: UserProfile[] = JSON.parse(usersRaw);
        const filteredUsers = users.filter((u) => u.email.toLowerCase() !== emailToDelete);
        localStorage.setItem('notamil_users', JSON.stringify(filteredUsers));
      } catch (err) {
        console.error("Error updating user list on deletion:", err);
      }
    }

    // 3. Destroy active session
    localStorage.removeItem('notamil_current_user');

    // 4. Reset component states
    setCurrentUser(null);
    setRequireOnboarding(false);
    setEssayCorrections([]);
    setSimuladosHistory([]);
    setActivityLogs([]);
  };

  const handleUpdateProfile = (updatedUser: UserProfile) => {
    // Save live session
    localStorage.setItem('notamil_current_user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);

    // Save in user database index
    const usersRaw = localStorage.getItem('notamil_users');
    if (usersRaw) {
      try {
        const users: UserProfile[] = JSON.parse(usersRaw);
        const updatedUsers = users.map((u) => 
          u.email.toLowerCase() === updatedUser.email.toLowerCase() ? updatedUser : u
        );
        localStorage.setItem('notamil_users', JSON.stringify(updatedUsers));
      } catch (err) {
        console.error("Error updating user list:", err);
      }
    }
  };

  // Rendering Gateways
  if (currentUser === null) {
    return <AuthView onSuccess={handleAuthSuccess} />;
  }

  if (requireOnboarding) {
    return <OnboardingView currentUser={currentUser} onCompleted={handleOnboardingCompleted} />;
  }

  return (
    <div id="app-workspace" className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-[#1b1b24] dark:text-[#f3effc] flex flex-col lg:flex-row transition-colors duration-300">
      
      {/* Dynamic Navigation Sidebar */}
      <Sidebar 
        currentUser={currentUser} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Panel Content Feed */}
      <main id="view-pane" className="flex-grow p-6 md:p-10 lg:p-12 max-w-7xl mx-auto w-full overflow-y-auto">
        {activeTab === 'dashboard' && (
          <DashboardView 
            currentUser={currentUser} 
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
          <AprendizadoView />
        )}

        {activeTab === 'configuracoes' && (
          <ConfiguracoesView 
            currentUser={currentUser}
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
