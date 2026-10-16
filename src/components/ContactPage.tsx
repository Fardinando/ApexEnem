import React, { useEffect, useState } from 'react';
import { Mail, Send, Loader2, CheckCircle2, MessageSquare, ShieldQuestion } from 'lucide-react';
import PublicLayout from './PublicLayout';
import { applySeo } from '../lib/seo';
import { navigate } from '../lib/nav';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    applySeo({
      title: 'Contato',
      description: 'Fale com a equipe do ApexEnem. Dúvidas, sugestões, imprensa, privacidade e suporte — estamos à disposição.',
      path: '/contato',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Contato — ApexEnem',
        url: 'https://apexenem.vercel.app/contato',
      },
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (message.trim().length < 10) {
      setError('Escreva uma mensagem com pelo menos 10 caracteres.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Não foi possível enviar sua mensagem. Tente novamente.');
        return;
      }
      setSent(true);
    } catch {
      setError('Falha de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <PublicLayout crumbs={[{ label: 'Início', path: '/' }, { label: 'Contato' }]}>
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Fale com a gente</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mb-10">
          Tem dúvidas, sugestões, encontrou um problema ou quer propor uma parceria? Preencha o formulário e responderemos.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {sent ? (
              <div className="p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm font-bold mb-1">Mensagem enviada!</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Obrigado pelo contato. Nossa equipe responderá em breve no e-mail informado.</p>
                <button type="button" onClick={() => { setSent(false); setName(''); setEmail(''); setSubject(''); setMessage(''); }} className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer">
                  Enviar outra mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-bold mb-1.5">Nome</label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-bold mb-1.5">E-mail</label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-subject" className="block text-xs font-bold mb-1.5">Assunto (opcional)</label>
                  <input
                    id="contact-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex.: Dúvida sobre correção de redação"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-xs font-bold mb-1.5">Mensagem</label>
                  <textarea
                    id="contact-message"
                    required
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-y"
                  />
                </div>
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400">{error}</div>
                )}
                <button
                  type="submit"
                  disabled={sending}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                  {sending ? 'Enviando...' : 'Enviar mensagem'}
                </button>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Ao enviar, você concorda com o tratamento dos dados informados conforme nossa{' '}
                  <button type="button" onClick={() => navigate('/privacidade')} className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Política de Privacidade</button>.
                </p>
              </form>
            )}
          </div>

          <aside className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-slate-800">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-2" aria-hidden="true" />
              <p className="text-sm font-bold mb-1">E-mail</p>
              <a href="mailto:contato@apexenem.app" className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 transition break-all">contato@apexenem.app</a>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-slate-800">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-2" aria-hidden="true" />
              <p className="text-sm font-bold mb-1">Suporte</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Respondemos em até 2 dias úteis.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-slate-800">
              <ShieldQuestion className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-2" aria-hidden="true" />
              <p className="text-sm font-bold mb-1">Privacidade / LGPD</p>
              <button type="button" onClick={() => navigate('/privacidade')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Ver Política de Privacidade</button>
            </div>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}
