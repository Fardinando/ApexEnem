import React, { useEffect, useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Logo from './Logo';
import MarmitaCodeCredit from './MarmitaCodeCredit';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [sessaoRecovery, setSessaoRecovery] = useState<boolean | null>(null);

  // Supabase emite evento PASSWORD_RECOVERY quando chega via link do e-mail.
  // Pode também cair direto na sessão (hash já consumido pelo supabase-js).
  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessaoRecovery(true);
    });
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) setSessaoRecovery(true);
      else if (sessaoRecovery === null) {
        // dá uns ms pro supabase-js consumir o hash
        setTimeout(async () => {
          const d = await supabase.auth.getSession();
          setSessaoRecovery(!!d.data.session);
        }, 800);
      }
    })();
    return () => sub.data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (password.length < 8) {
      setErro('A nova senha precisa de pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setErro('As duas senhas não coincidem.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setErro(error.message || 'Não foi possível atualizar a senha.');
      return;
    }
    setSucesso(true);
    await supabase.auth.signOut();
    setTimeout(() => { window.location.replace('/login'); }, 2500);
  };

  return (
    <div className="relative min-h-screen bg-[#fcf8ff] dark:bg-[#0a0814] text-[#1b1b24] dark:text-[#f3effc] flex items-center justify-center p-4 pb-16">
      <div className="absolute bottom-3 inset-x-0 flex justify-center z-10 pointer-events-none">
        <div className="pointer-events-auto"><MarmitaCodeCredit /></div>
      </div>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Logo variant="favicon-a" className="h-8 w-auto" />
        </div>

        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          {sucesso ? (
            <div className="text-center space-y-4">
              <div className="mx-auto p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-full w-fit">
                <CheckCircle className="h-8 w-8" aria-hidden="true" />
              </div>
              <h2 className="font-display font-extrabold text-lg">Senha atualizada!</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Vamos redirecionar você para o login em instantes.
              </p>
            </div>
          ) : sessaoRecovery === false ? (
            <div className="text-center space-y-4">
              <div className="mx-auto p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-full w-fit">
                <AlertTriangle className="h-8 w-8" aria-hidden="true" />
              </div>
              <h2 className="font-display font-extrabold text-lg">Link inválido ou expirado</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Peça um novo link de redefinição na página de login.
              </p>
              <a href="/login" className="inline-block mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition cursor-pointer">
                Ir para o login
              </a>
            </div>
          ) : (
            <form onSubmit={salvar} className="space-y-5">
              <div>
                <h1 className="font-display font-extrabold text-xl mb-1">Nova senha</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Escolha uma senha segura com pelo menos 8 caracteres.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="new-pwd">Nova senha</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400"><Lock className="h-4.5 w-4.5" /></span>
                  <input
                    id="new-pwd"
                    type={showPwd ? 'text' : 'password'}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 inset-y-0 text-slate-400 hover:text-slate-600 cursor-pointer" aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}>
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="confirm-pwd">Confirmar nova senha</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400"><Lock className="h-4.5 w-4.5" /></span>
                  <input
                    id="confirm-pwd"
                    type={showPwd ? 'text' : 'password'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {erro && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-400">{erro}</div>}

              <button type="submit" disabled={loading || sessaoRecovery !== true} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition cursor-pointer">
                {loading ? 'Salvando…' : 'Salvar nova senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
