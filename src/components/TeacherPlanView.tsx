import React, { useState } from 'react';
import { GraduationCap, Loader2, Sparkles, Crown, Clock, Target, ListChecks, BookOpen, ClipboardCheck, Home } from 'lucide-react';
import { getPlanId, chargeFeature, addCoins, getFeatureCost } from '../lib/coins';
import { planHasTeacherAI } from '../config/plans';
import { navigate } from '../lib/nav';

interface TeacherPlan {
  title: string;
  objectives?: string[];
  materials?: string[];
  steps?: { title: string; duration?: string; description: string }[];
  assessment?: string[];
  homework?: string[];
}

const SUBJECTS = ['Matemática', 'Português', 'Redação', 'História', 'Geografia', 'Biologia', 'Química', 'Física', 'Filosofia', 'Sociologia', 'Inglês'];

export default function TeacherPlanView({ accessToken, onUpgrade }: { accessToken?: string; onUpgrade?: () => void }) {
  const [subject, setSubject] = useState('Matemática');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Ensino Médio');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<TeacherPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isApex = planHasTeacherAI(getPlanId());

  if (!isApex) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="mx-auto mb-5 p-3 w-fit rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
          <Crown className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight mb-3">IA Professora</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
          Gere planos de aula completos, alinhados à BNCC e ao ENEM, com objetivos, materiais, passo a passo, avaliação e tarefa de casa. Exclusivo do plano <strong>Apex</strong>.
        </p>
        <button
          type="button"
          onClick={onUpgrade || (() => navigate('/planos'))}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition cursor-pointer"
        >
          Fazer upgrade para o Apex
        </button>
      </div>
    );
  }

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (topic.trim().length < 2) {
      setError('Informe o tema da aula.');
      return;
    }
    if (!chargeFeature('teacherPlan')) {
      setError('Saldo de moedas insuficiente para gerar um plano de aula. Recarregue assistindo a anúncios ou aguarde a cota mensal.');
      return;
    }
    setLoading(true);
    setPlan(null);
    try {
      const res = await fetch('/api/teacher-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ subject, topic, level }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Não foi possível gerar o plano agora.');
        addCoins(getFeatureCost('teacherPlan'), 'Reembolso: falha no plano de aula');
        return;
      }
      if (data.pending) {
        setError('O plano está sendo processado. Tente novamente em instantes.');
        addCoins(getFeatureCost('teacherPlan'), 'Reembolso: plano pendente');
        return;
      }
      setPlan(data as TeacherPlan);
    } catch {
      setError('Falha de conexão. Tente novamente.');
      addCoins(getFeatureCost('teacherPlan'), 'Reembolso: falha de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
          <GraduationCap className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">IA Professora</h1>
          <p className="text-xs text-slate-400">Planos de aula personalizados, alinhados à BNCC e ao ENEM.</p>
        </div>
      </div>

      <form onSubmit={generate} className="p-5 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tp-subject" className="block text-xs font-bold mb-1.5">Disciplina</label>
            <select id="tp-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="tp-level" className="block text-xs font-bold mb-1.5">Nível</label>
            <select id="tp-level" value={level} onChange={(e) => setLevel(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              {['9º ano', 'Ensino Médio', 'Cursinho', 'Pré-ENEM'].map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="tp-topic" className="block text-xs font-bold mb-1.5">Tema da aula</label>
          <input id="tp-topic" type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex.: Funções do 2º grau e gráficos" className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
        {error && <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-700 dark:text-amber-400">{error}</div>}
        <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
          {loading ? 'Gerando plano...' : 'Gerar plano de aula'}
        </button>
      </form>

      {plan && (
        <article className="mt-6 p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 space-y-6">
          <h2 className="text-lg font-extrabold tracking-tight">{plan.title}</h2>

          {plan.objectives && plan.objectives.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold mb-2"><Target className="h-4 w-4 text-blue-500" aria-hidden="true" /> Objetivos</h3>
              <ul className="space-y-1.5">{plan.objectives.map((o, i) => <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2"><span className="text-blue-500">•</span>{o}</li>)}</ul>
            </section>
          )}

          {plan.materials && plan.materials.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold mb-2"><BookOpen className="h-4 w-4 text-blue-500" aria-hidden="true" /> Materiais</h3>
              <ul className="space-y-1.5">{plan.materials.map((m, i) => <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2"><span className="text-blue-500">•</span>{m}</li>)}</ul>
            </section>
          )}

          {plan.steps && plan.steps.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold mb-2"><ListChecks className="h-4 w-4 text-blue-500" aria-hidden="true" /> Passo a passo</h3>
              <ol className="space-y-3">
                {plan.steps.map((s, i) => (
                  <li key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-bold">{i + 1}. {s.title}</span>
                      {s.duration && <span className="flex items-center gap-1 text-[11px] text-slate-400"><Clock className="h-3 w-3" aria-hidden="true" /> {s.duration}</span>}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{s.description}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {plan.assessment && plan.assessment.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold mb-2"><ClipboardCheck className="h-4 w-4 text-blue-500" aria-hidden="true" /> Avaliação</h3>
              <ul className="space-y-1.5">{plan.assessment.map((a, i) => <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2"><span className="text-blue-500">•</span>{a}</li>)}</ul>
            </section>
          )}

          {plan.homework && plan.homework.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold mb-2"><Home className="h-4 w-4 text-blue-500" aria-hidden="true" /> Tarefa de casa</h3>
              <ul className="space-y-1.5">{plan.homework.map((h, i) => <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2"><span className="text-blue-500">•</span>{h}</li>)}</ul>
            </section>
          )}
        </article>
      )}
    </div>
  );
}
