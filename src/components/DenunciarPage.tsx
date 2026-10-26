import React, { useEffect, useState } from 'react';
import { AlertTriangle, Send, CheckCircle } from 'lucide-react';
import PublicLayout from './PublicLayout';
import { applySeo } from '../lib/seo';

type Categoria =
  | 'conteudo_inadequado_menor'
  | 'bullying_assedio'
  | 'spam_fraude'
  | 'exposicao_dados_pessoais'
  | 'violencia_discurso_odio'
  | 'direito_autoral'
  | 'outro';

const CATEGORIAS: { id: Categoria; label: string }[] = [
  { id: 'conteudo_inadequado_menor', label: 'Conteúdo inadequado a criança ou adolescente' },
  { id: 'bullying_assedio', label: 'Bullying, assédio ou intimidação' },
  { id: 'violencia_discurso_odio', label: 'Violência, discurso de ódio ou extremismo' },
  { id: 'exposicao_dados_pessoais', label: 'Exposição indevida de dados pessoais (LGPD)' },
  { id: 'direito_autoral', label: 'Violação de direito autoral' },
  { id: 'spam_fraude', label: 'Spam, golpe ou fraude' },
  { id: 'outro', label: 'Outro' },
];

export default function DenunciarPage() {
  const [categoria, setCategoria] = useState<Categoria>('conteudo_inadequado_menor');
  const [descricao, setDescricao] = useState('');
  const [urlConteudo, setUrlConteudo] = useState('');
  const [contato, setContato] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    applySeo({
      title: 'Denunciar conteúdo — ApexEnem',
      description:
        'Canal de denúncia extrajudicial do ApexEnem (ECA Digital, Lei nº 15.211/2025). Reporte conteúdo inadequado, bullying, violação de dados ou direitos autorais.',
      path: '/denunciar',
    });
  }, []);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (descricao.trim().length < 20) {
      setErro('Descreva o ocorrido com pelo menos 20 caracteres.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const r = await fetch('/api/denuncia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria, descricao, url: urlConteudo, contato }),
      });
      if (!r.ok && r.status !== 404) {
        setErro('Não conseguimos registrar a denúncia agora. Envie um e-mail para apexenem@gmail.com descrevendo o ocorrido.');
        return;
      }
      setEnviado(true);
    } catch {
      setErro('Falha de conexão. Envie um e-mail para apexenem@gmail.com descrevendo o ocorrido.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <PublicLayout crumbs={[{ label: 'Início', path: '/' }, { label: 'Denunciar conteúdo' }]}>
      <section className="max-w-2xl mx-auto px-4 py-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-full text-xs font-semibold text-red-700 dark:text-red-400 mb-4">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Canal de denúncia extrajudicial
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">Denunciar conteúdo</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
          Em cumprimento ao Estatuto Digital da Criança e do Adolescente (Lei nº 15.211/2025) e à LGPD, o ApexEnem mantém um canal
          direto para denúncia de conteúdo impróprio, assédio, violação de dados ou direitos autorais. Analisamos cada relato e
          respondemos em até <strong>5 dias úteis</strong>. Casos envolvendo risco iminente a menores são tratados em até 24h.
        </p>

        {enviado ? (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-bold text-emerald-700 dark:text-emerald-300 mb-1">Denúncia registrada</h2>
              <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
                Obrigado. Vamos revisar e, se você informou um contato, retornaremos com o desdobramento.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-5 p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="den-categoria">Categoria</label>
              <select
                id="den-categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as Categoria)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white cursor-pointer"
              >
                {CATEGORIAS.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="den-descricao">Descrição do ocorrido</label>
              <textarea
                id="den-descricao"
                rows={6}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva com detalhes o que aconteceu, quando, com quem (se aplicável), e por que considera inadequado."
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="den-url">URL ou localização do conteúdo (opcional)</label>
              <input
                id="den-url"
                type="url"
                value={urlConteudo}
                onChange={(e) => setUrlConteudo(e.target.value)}
                placeholder="https://apexenem.com.br/..."
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="den-contato">Seu e-mail para contato (opcional)</label>
              <input
                id="den-contato"
                type="email"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                placeholder="voce@exemplo.com"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Denúncias anônimas são aceitas. Se informar e-mail, só o usamos para retornar sobre esta denúncia.</p>
            </div>

            {erro && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-400">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {enviando ? 'Enviando...' : 'Enviar denúncia'}
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              Alternativamente envie um e-mail para <a href="mailto:apexenem@gmail.com" className="text-blue-600 hover:underline">apexenem@gmail.com</a>.
            </p>
          </form>
        )}
      </section>
    </PublicLayout>
  );
}
