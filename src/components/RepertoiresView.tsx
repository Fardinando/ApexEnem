import React, { useEffect, useState } from 'react';
import { Search, Sparkles, Loader2, ExternalLink, Star, Clapperboard, BookOpen, BarChart3, Scale, Lightbulb, Tv } from 'lucide-react';
import PublicLayout from './PublicLayout';
import AdSlot from './AdSlot';
import { applySeo } from '../lib/seo';
import { navigate } from '../lib/nav';

interface RepertoireItem {
  title: string;
  creator?: string;
  studio?: string;
  year?: number | string;
  synopsis?: string;
  rating?: string;
  watch?: { platform: string; url: string }[];
}

interface RepertoireCategory {
  name: string;
  items: RepertoireItem[];
}

const SUGGESTED_THEMES = [
  'Desafios para a valorização da saúde mental no Brasil',
  'Caminhos para combater a desinformação nas redes sociais',
  'Desafios da educação a distância no Brasil',
  'Impactos da inteligência artificial no mercado de trabalho',
  'O combate ao trabalho infantil no Brasil',
  'Desafios para a inclusão de pessoas com deficiência',
];

function categoryIcon(name: string) {
  const n = name.toUpperCase();
  if (n.includes('FILME')) return Clapperboard;
  if (n.includes('LIVRO') || n.includes('LITERATURA')) return BookOpen;
  if (n.includes('SÉRIE') || n.includes('SERIE')) return Tv;
  if (n.includes('DADO') || n.includes('ESTAT')) return BarChart3;
  if (n.includes('LEI') || n.includes('JUR')) return Scale;
  return Lightbulb;
}

export default function RepertoiresView() {
  const [theme, setTheme] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<RepertoireCategory[] | null>(null);
  const [usedTheme, setUsedTheme] = useState('');

  useEffect(() => {
    applySeo({
      title: 'Pesquisa de Repertórios para Redação do ENEM',
      description:
        'Encontre repertórios socioculturais para qualquer tema do ENEM: filmes, livros, séries, dados, leis e filosofia, com sinopse e onde assistir. Ferramenta gratuita do ApexEnem.',
      path: '/repertorios',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Pesquisa de Repertórios — ApexEnem',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        url: 'https://apexenem.app/repertorios',
      },
    });
  }, []);

  const search = async (value: string) => {
    const q = value.trim();
    if (q.length < 4) {
      setError('Digite um tema com pelo menos 4 caracteres.');
      return;
    }
    setLoading(true);
    setError(null);
    setCategories(null);
    setUsedTheme(q);
    try {
      const res = await fetch('/api/repertoires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: q }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Não foi possível buscar repertórios agora. Tente novamente.');
        return;
      }
      if (data.pending) {
        setError('A busca está em processamento. Tente novamente em alguns segundos.');
        return;
      }
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch {
      setError('Falha de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout crumbs={[{ label: 'Início', path: '/' }, { label: 'Repertórios' }]}>
      <section className="max-w-4xl mx-auto px-4 pt-10 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-400 mb-5">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Ferramenta gratuita com IA
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Pesquisa de Repertórios para a Redação</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mb-8 leading-relaxed">
          Digite um tema e receba sugestões de filmes, livros, séries, dados, leis e conceitos filosóficos para enriquecer
          seu argumento — com sinopse e onde assistir ou encontrar.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            search(theme);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex.: Desafios da saúde mental no Brasil"
              aria-label="Tema da redação"
              className="w-full pl-9 pr-3 py-3.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
            {loading ? 'Buscando...' : 'Buscar repertórios'}
          </button>
        </form>

        <div className="flex flex-wrap gap-2 mt-4">
          {SUGGESTED_THEMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTheme(t);
                search(t);
              }}
              className="px-3 py-1.5 text-[11px] font-medium rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 transition cursor-pointer"
            >
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        )}

        {categories && categories.length > 0 && (
          <div className="mt-10 space-y-10">
            <p className="text-sm text-slate-400">
              Repertórios sugeridos para: <span className="font-semibold text-slate-600 dark:text-slate-300">{usedTheme}</span>
            </p>
            {categories.map((cat, ci) => {
              const Icon = categoryIcon(cat.name);
              return (
                <section key={ci}>
                  <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight mb-4">
                    <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    {cat.name}
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {(cat.items || []).map((item, ii) => (
                      <article key={ii} className="p-5 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
                        <h3 className="text-sm font-bold mb-1">{item.title}</h3>
                        <p className="text-[11px] text-slate-400 mb-2">
                          {[item.creator, item.studio, item.year].filter(Boolean).join(' · ')}
                        </p>
                        {item.synopsis && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">{item.synopsis}</p>
                        )}
                        {item.rating && (
                          <p className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold mb-3">
                            <Star className="h-3 w-3 fill-current" aria-hidden="true" /> {item.rating}
                          </p>
                        )}
                        {item.watch && item.watch.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {item.watch.map((w, wi) => (
                              <a
                                key={wi}
                                href={w.url}
                                target="_blank"
                                rel="noopener noreferrer nofollow sponsored"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition"
                              >
                                {w.platform} <ExternalLink className="h-3 w-3" aria-hidden="true" />
                              </a>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                  {ci === 0 && <AdSlot slotId="repertoires-result" />}
                </section>
              );
            })}
          </div>
        )}

        {!categories && !loading && !error && (
          <div className="mt-12 p-8 rounded-2xl bg-slate-50 dark:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-sm font-bold mb-1">Como funciona</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              Nossa IA analisa o tema e monta uma lista de repertórios por categoria. Quer a experiência completa, com correção
              de redação e plano de estudos personalizado?
            </p>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="mt-5 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition cursor-pointer"
            >
              Criar conta grátis
            </button>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
