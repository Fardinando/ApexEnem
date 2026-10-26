import React from 'react';
import { PlayCircle, Lock, Clock } from 'lucide-react';

interface AulasViewProps {
  currentUser: { name: string; id?: string };
}

export default function AulasView({ currentUser }: AulasViewProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] px-4 sm:px-6 lg:px-10 py-8 lg:py-10 pb-20 lg:pb-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-400 mb-3">
            <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" /> Aulas gravadas
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">Olá, {currentUser.name.split(' ')[0]} — suas aulas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Em breve você vai acompanhar aqui aulas gravadas das quatro áreas do ENEM, com playlist, progresso e questões de fixação ao fim de cada módulo.
          </p>
        </header>

        <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] p-10 sm:p-14 text-center">
          <div className="mx-auto mb-5 p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl w-fit">
            <Clock className="h-10 w-10" aria-hidden="true" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-3">Aulas em preparação</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
            A equipe do ApexEnem está gravando conteúdo original para você. Enquanto isso, aproveite para fazer simulados, treinar questões de IA e corrigir redações.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Vídeos protegidos (sem download) + marca d'água com seu nome e ID
          </div>
        </div>
      </div>
    </div>
  );
}
