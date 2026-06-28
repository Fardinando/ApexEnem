/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { 
  User, 
  Settings, 
  Trash2, 
  LogOut, 
  ShieldAlert, 
  Award, 
  BookOpen, 
  Mail, 
  Sun, 
  Moon,
  Camera,
  X
} from 'lucide-react';
import { UserProfile } from '../types';
import AdPlaceholder from './AdPlaceholder';

interface ConfiguracoesViewProps {
  currentUser: UserProfile;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onLogout: () => void;
  onClearLocalData: () => void;
  onDeleteAccount: () => void;
  onUpdateProfile: (updated: UserProfile) => void;
}

export default function ConfiguracoesView({
  currentUser,
  isDarkMode,
  toggleDarkMode,
  onLogout,
  onClearLocalData,
  onDeleteAccount,
  onUpdateProfile
}: ConfiguracoesViewProps) {

  const [isEditing, setIsEditing] = React.useState(false);
  const [newName, setNewName] = React.useState(currentUser.name);
  const [newSerie, setNewSerie] = React.useState(currentUser.serie || '3_medio');
  const [newScore, setNewScore] = React.useState(currentUser.targetScore || 750);
  const [newHardSubjects, setNewHardSubjects] = React.useState<string[]>(currentUser.hardSubjects || []);
  const [newAvatar, setNewAvatar] = React.useState<string | undefined>(currentUser.avatar);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Selecione apenas arquivos de imagem (PNG, JPEG, WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setNewAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => setNewAvatar(undefined);

  // Update local states if currentUser changes underneath (e.g. on account clean or swap)
  React.useEffect(() => {
    setNewName(currentUser.name);
    setNewSerie(currentUser.serie || '3_medio');
    setNewScore(currentUser.targetScore || 750);
    setNewHardSubjects(currentUser.hardSubjects || []);
    setNewAvatar(currentUser.avatar);
  }, [currentUser]);

  const formatSerie = (code?: string) => {
    switch (code) {
      case '9_fundamental': return '9º Ano Ensino Fundamental';
      case '1_medio': return '1º Ano Ensino Médio';
      case '2_medio': return '2º Ano Ensino Médio';
      case '3_medio': return '3º Ano Ensino Médio';
      case 'cursinho': return 'Pré-Vestibular / Cursinho';
      case 'outro': return 'Outro perfil de estudante';
      default: return 'Não especificado';
    }
  };

  const handleToggleHardSubject = (subject: string) => {
    if (newHardSubjects.includes(subject)) {
      setNewHardSubjects(newHardSubjects.filter((s) => s !== subject));
    } else {
      setNewHardSubjects([...newHardSubjects, subject]);
    }
  };

  const handleSaveProfile = () => {
    if (!newName.trim()) {
      alert("Por favor, informe seu nome.");
      return;
    }
    onUpdateProfile({
      ...currentUser,
      name: newName,
      serie: newSerie,
      targetScore: Number(newScore),
      hardSubjects: newHardSubjects,
      avatar: newAvatar,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setNewName(currentUser.name);
    setNewSerie(currentUser.serie || '3_medio');
    setNewScore(currentUser.targetScore || 750);
    setNewHardSubjects(currentUser.hardSubjects || []);
    setNewAvatar(currentUser.avatar);
    setIsEditing(false);
  };

  return (
    <div id="configuracoes-container" className="space-y-6 max-w-2xl mx-auto animate-fade-in" style={{ contentVisibility: 'auto' }}>
      
      {/* Top Banner */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Configurações da Conta
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-405 mt-1.5">
          Gerencie suas preferências de perfil educacional, alterne o modo escuro ou reinicie seu progresso acadêmico.
        </p>
      </div>

      <AdPlaceholder slot="configuracoes-topo" format="banner" className="my-4" />

      <div className="space-y-6" id="settings-blocks-stack">
        
        {/* Block 1: Student Information Card */}
        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          
          <div className="flex justify-between items-center pb-3 border-b border-slate-200/60 dark:border-slate-800">
            <h3 className="font-display font-black text-sm text-slate-850 dark:text-slate-105 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-blue-600" />
              <span>{isEditing ? 'Editar Perfil Estudantil' : 'Perfil do Estudante'}</span>
            </h3>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <span>✏ Editar Perfil</span>
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4 text-xs animate-fade-in" id="edit-profile-form">
              {/* Avatar upload */}
              <div className="space-y-2">
                <label className="text-slate-500 font-semibold block">Foto de Perfil</label>
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-xl bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center">
                    {newAvatar ? (
                      <img src={newAvatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>{newAvatar ? 'Trocar' : 'Upload'}</span>
                    </button>
                    {newAvatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Remover</span>
                      </button>
                    )}
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>
              </div>

              {/* Name input */}
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold block" htmlFor="edit-name">Nome Completo</label>
                <input
                  id="edit-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Seu nome"
                />
              </div>

              {/* Serie Select dropdown */}
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold block" htmlFor="edit-serie">Ano Escolar / Série</label>
                <select
                  id="edit-serie"
                  value={newSerie}
                  onChange={(e: any) => setNewSerie(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="9_fundamental">9º Ano Ensino Fundamental</option>
                  <option value="1_medio">1º Ano Ensino Médio</option>
                  <option value="2_medio">2º Ano Ensino Médio</option>
                  <option value="3_medio">3º Ano Ensino Médio</option>
                  <option value="cursinho">Pré-Vestibular / Cursinho</option>
                  <option value="outro">Outro perfil de estudante</option>
                </select>
              </div>

              {/* Target ENEM score slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-slate-500 font-semibold" htmlFor="edit-score">Meta de Nota ENEM</label>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">{newScore} pontos</span>
                </div>
                <input
                  id="edit-score"
                  type="range"
                  min="600"
                  max="1000"
                  step="10"
                  value={newScore}
                  onChange={(e) => setNewScore(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>600 pto</span>
                  <span>Meta Ideal</span>
                  <span>1000 Apex Enem</span>
                </div>
              </div>

              {/* Difficult academic fields to practice */}
              <div className="space-y-2 pt-1">
                <span className="text-slate-500 font-semibold block">Suas Disciplinas mais Desafiadoras</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" id="edit-hard-subjects-grid">
                  {['Matemática', 'Natureza', 'Humanas', 'Linguagens', 'Redação'].map((subject) => {
                    const active = newHardSubjects.includes(subject);
                    return (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => handleToggleHardSubject(subject)}
                        className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition cursor-pointer select-none ${
                          active
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900'
                            : 'bg-slate-50 text-slate-600 dark:bg-[#0f172a] dark:text-slate-350 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {active ? '⚠ ' : ''}{subject}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  ✓ Salvar Alterações
                </button>
              </div>

            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 pb-4 mb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="h-14 w-14 rounded-xl bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100 block">{currentUser.name}</span>
                  <span className="text-[11px] text-slate-400">{currentUser.email}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Name */}
                <div className="space-y-1 p-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl">
                  <span className="text-slate-400 font-mono block">Nome Completo</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{currentUser.name}</span>
                </div>

                {/* Email */}
                <div className="space-y-1 p-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-[#0f172a] rounded-xl">
                  <span className="text-slate-400 font-mono block">E-mail Cadastrado</span>
                  <span className="font-bold text-slate-850 dark:text-slate-100">{currentUser.email}</span>
                </div>

                {/* Serie */}
                <div className="space-y-1 p-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-[#0f172a] rounded-xl">
                  <span className="text-slate-400 font-mono block">Série / Ano Escolar</span>
                  <span className="font-bold text-slate-850 dark:text-slate-100">{formatSerie(currentUser.serie)}</span>
                </div>

                {/* Score Meta */}
                <div className="space-y-1 p-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-[#0f172a] rounded-xl">
                  <span className="text-slate-400 font-mono block">Meta de Nota ENEM</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{currentUser.targetScore || 750} pontos</span>
                </div>
              </div>

              {/* Hard subjects list chips */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-mono text-[#777587] uppercase font-bold tracking-wider block">Seus Desafios de Estudos:</span>
                {currentUser.hardSubjects && currentUser.hardSubjects.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5" id="hard-subjects-chips">
                    {currentUser.hardSubjects.map((s) => (
                      <span key={s} className="px-2.5 py-1 bg-red-50 text-red-600 dark:bg-red-950/25 dark:text-red-400 font-bold text-[10px] rounded-lg border border-red-100 dark:border-red-950/40">
                        ⚠ {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">Nenhuma matéria desafiadora configurada.</span>
                )}
              </div>
            </>
          )}

        </div>

        <AdPlaceholder slot="configuracoes-meio" format="rectangle" className="my-4" />

        {/* Block 2: Dark Mode Options */}
        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          
          <h3 className="font-display font-black text-sm text-slate-850 dark:text-slate-105 flex items-center gap-2 pb-3 border-b border-slate-200/60 dark:border-slate-800">
            <Sun className="h-4.5 w-4.5 text-amber-500" />
            <span>Aparência e Design</span>
          </h3>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-100">Modo de Visualização Escuro</p>
              <p className="text-slate-400 text-[11px]">Inverta a iluminação da interface para poupar a vista em estudos noturnos.</p>
            </div>

            <button
              id="settings-theme-toggle-btn"
              type="button"
              onClick={toggleDarkMode}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                isDarkMode
                  ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  : 'bg-blue-50 text-blue-600 border-blue-150 hover:bg-blue-105 dark:bg-[#0f172a] dark:text-blue-400 dark:border-slate-800'
              }`}
            >
              {isDarkMode ? (
                <>
                  <Sun className="h-4 w-4 text-amber-600" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-blue-600" />
                  <span>Modo Escuro</span>
                </>
              )}
            </button>
          </div>

        </div>

        <AdPlaceholder slot="configuracoes-rodape" format="banner" className="my-4" />

        {/* Block 3: Danger Zone */}
        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-red-105 dark:border-red-950/40 shadow-sm space-y-5">
          
          <h3 className="font-display font-black text-sm text-red-650 dark:text-red-400 flex items-center gap-2 pb-3 border-b border-red-50 dark:border-red-950/40">
            <ShieldAlert className="h-4.5 w-4.5" />
            <span>Zona de Perigo</span>
          </h3>

          <p className="text-xs text-slate-450 leading-relaxed">
            As seguintes ações são destrutivas e irreversíveis. Certifique-se dos comandos antes de clicar nos botões abaixo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1" id="danger-actions-grid">
            
            {/* Clear Data Button */}
            <button
              id="btn-settings-clear-data"
              type="button"
              onClick={() => {
                const check = confirm(
                  'ATENÇÃO: Isso deletará todas as suas redações avaliadas por IA, seu histórico acadêmico escolar e reiniciará o onboarding. Deseja realmente prosseguir?'
                );
                if (check) {
                  onClearLocalData();
                  alert('Sua conta foi redefinida para o zero absoluta! Complete o onboarding para criar um novo plano.');
                }
              }}
              className="py-3 px-4 rounded-xl border border-red-200 text-xs font-bold text-red-700 hover:bg-red-50 flex items-center justify-center gap-2 transition cursor-pointer dark:border-red-950/40 dark:hover:bg-red-950/15 dark:text-red-400"
            >
              <Trash2 className="h-4.5 w-4.5" />
              <span>Reiniciar Conta para o Zero</span>
            </button>

            {/* Logout button */}
            <button
              id="btn-settings-logout"
              type="button"
              onClick={() => {
                if (confirm('Deseja realmente sair da Plataforma ApexEnem?')) {
                  onLogout();
                }
              }}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>Sair da Plataforma</span>
            </button>

            {/* Permanent Account Deletion button */}
            <button
              id="btn-settings-delete-account"
              type="button"
              onClick={() => {
                const step1 = confirm('ATENÇÃO EXTREMA: Deseja realmente DELETAR sua conta permanentemente? Isso apagará todos os seus registros de cadastro e dados guardados no app.');
                if (step1) {
                  const step2 = confirm('Essa operação é irreversível! Clique em OK se deseja desconectar e liberar seu e-mail para um cadastro novo do zero.');
                  if (step2) {
                    onDeleteAccount();
                    alert('Sua conta foi excluída permanentemente com sucesso!');
                  }
                }
              }}
              className="py-3 px-4 col-span-1 md:col-span-2 bg-red-650 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <Trash2 className="h-4.5 w-4.5" />
              <span>Excluir Minha Conta Permanentemente</span>
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
