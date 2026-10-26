import React, { useEffect, useState } from 'react';
import { Shield, ShieldCheck, Loader2, Copy, Check, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

// 2FA (TOTP) opcional via Supabase MFA.
// Fluxo: enroll → mostra QR + secret → verify com código do app → listado como ativo.
export default function TwoFactorSection() {
  const [factors, setFactors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [pending, setPending] = useState<{ factorId: string; qr: string; secret: string; challengeId?: string } | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      // only verified TOTP factors
      setFactors((data?.totp || []).filter((f: any) => f.status === 'verified'));
    } catch {
      setFactors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const iniciarEnroll = async () => {
    setErro(null);
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `ApexEnem ${new Date().toLocaleDateString('pt-BR')}` });
      if (error) throw error;
      setPending({
        factorId: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
      });
      // cria challenge pra verificação
      const chRes = await supabase.auth.mfa.challenge({ factorId: data.id });
      if (chRes.error) throw chRes.error;
      setPending((p) => (p ? { ...p, challengeId: chRes.data.id } : p));
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível iniciar o cadastro 2FA.');
    } finally {
      setEnrolling(false);
    }
  };

  const confirmar = async () => {
    if (!pending?.challengeId) return;
    if (!/^\d{6}$/.test(code.trim())) {
      setErro('Digite o código de 6 dígitos gerado no app autenticador.');
      return;
    }
    setErro(null);
    setVerifying(true);
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId: pending.factorId,
        challengeId: pending.challengeId,
        code: code.trim(),
      });
      if (error) throw error;
      setPending(null);
      setCode('');
      await refresh();
    } catch (err: any) {
      setErro(err?.message || 'Código inválido. Tente de novo.');
    } finally {
      setVerifying(false);
    }
  };

  const cancelar = async () => {
    if (pending) {
      try { await supabase.auth.mfa.unenroll({ factorId: pending.factorId }); } catch { /* ignora */ }
    }
    setPending(null);
    setCode('');
    setErro(null);
  };

  const remover = async (factorId: string) => {
    if (!confirm('Remover a autenticação em duas etapas? Sua conta ficará menos protegida.')) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      setErro(error.message);
      return;
    }
    await refresh();
  };

  const copiarSecret = () => {
    if (!pending) return;
    navigator.clipboard?.writeText(pending.secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
      <header className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
          {factors.length > 0 ? <ShieldCheck className="h-5 w-5" aria-hidden="true" /> : <Shield className="h-5 w-5" aria-hidden="true" />}
        </div>
        <div>
          <h3 className="font-bold text-sm">Autenticação em duas etapas (2FA)</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Protege sua conta mesmo se a senha vazar. Use um app autenticador (Google Authenticator, Authy, 1Password, Bitwarden).</p>
        </div>
      </header>

      {loading ? (
        <div className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
      ) : factors.length > 0 ? (
        <div className="space-y-2">
          {factors.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 truncate">2FA ativa</p>
                  <p className="text-[10px] text-emerald-800/70 dark:text-emerald-400/70 truncate">{f.friendly_name || 'Dispositivo'}</p>
                </div>
              </div>
              <button type="button" onClick={() => remover(f.id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer" aria-label="Remover 2FA">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : pending ? (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">1. Abra seu app autenticador e <strong>escaneie o QR</strong> abaixo (ou cole o código secreto).</p>
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
            <img src={pending.qr} alt="QR Code 2FA" className="w-40 h-40 bg-white rounded-xl p-2" />
            <div className="flex-1 w-full">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Código secreto</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono break-all">{pending.secret}</code>
                <button type="button" onClick={copiarSecret} className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" aria-label="Copiar">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">Guarde esse código em um local seguro — ele serve de backup.</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">2. Digite o <strong>código de 6 dígitos</strong> gerado agora pelo app:</p>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-base font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white"
            />
            <button
              type="button"
              onClick={confirmar}
              disabled={verifying || code.length !== 6}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl cursor-pointer"
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
            </button>
          </div>

          {erro && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-400">{erro}</div>}

          <button type="button" onClick={cancelar} className="text-xs text-slate-500 hover:text-red-600 underline cursor-pointer">
            Cancelar e remover este cadastro
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {erro && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-400">{erro}</div>}
          <button
            type="button"
            onClick={iniciarEnroll}
            disabled={enrolling}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            {enrolling ? 'Preparando...' : 'Ativar 2FA'}
          </button>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Depois de ativar, você vai precisar do código do app autenticador toda vez que entrar na conta.
          </p>
        </div>
      )}
    </section>
  );
}
