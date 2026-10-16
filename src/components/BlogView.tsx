import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Calendar, Tag, ArrowRight, ArrowLeft, Search } from 'lucide-react';
import PublicLayout from './PublicLayout';
import AdSlot from './AdSlot';
import { ARTICLES, CATEGORIES, getArticle, relatedArticles, formatDate, type Article, type ArticleBlock } from '../data/blog';
import { getAuthor } from '../data/authors';
import { applySeo } from '../lib/seo';
import { navigate } from '../lib/nav';

function AuthorChip({ slug, date, minutes }: { slug: string; date: string; minutes: number }) {
  const author = getAuthor(slug);
  return (
    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
      {author && (
        <button type="button" onClick={() => navigate(`/autor/${author.slug}`)} className="flex items-center gap-2 hover:text-blue-600 transition cursor-pointer">
          {author.photo ? (
            <img src={author.photo} alt={author.name} width={24} height={24} className="w-6 h-6 rounded-full object-cover" loading="lazy" />
          ) : (
            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">
              {author.name.charAt(0)}
            </span>
          )}
          <span className="font-medium text-slate-600 dark:text-slate-300">{author.name}</span>
        </button>
      )}
      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" aria-hidden="true" /> <time dateTime={date}>{formatDate(date)}</time></span>
      <span className="flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden="true" /> {minutes} min de leitura</span>
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const author = getAuthor(article.authorSlug);
  return (
    <article className="group flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition">
      <button type="button" onClick={() => navigate(`/blog/${article.slug}`)} className="block aspect-[16/9] overflow-hidden cursor-pointer" aria-label={article.title}>
        <img src={article.cover} alt={article.coverAlt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
      </button>
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
            <Tag className="h-3 w-3" aria-hidden="true" /> {article.category}
          </span>
        </div>
        <h3 className="text-base font-bold leading-snug mb-2">
          <button type="button" onClick={() => navigate(`/blog/${article.slug}`)} className="text-left hover:text-blue-600 transition cursor-pointer">{article.title}</button>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 flex-grow">{article.description}</p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">{author?.name}</span>
          <button type="button" onClick={() => navigate(`/blog/${article.slug}`)} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:gap-2 transition-all cursor-pointer">
            Ler <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

function BlockRenderer({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case 'h2':
      return <h2 className="text-2xl font-extrabold tracking-tight mt-10 mb-4 text-slate-800 dark:text-slate-100">{block.text}</h2>;
    case 'h3':
      return <h3 className="text-lg font-bold mt-6 mb-3 text-slate-800 dark:text-slate-100">{block.text}</h3>;
    case 'p':
      return <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-300 my-4">{block.text}</p>;
    case 'ul':
      return (
        <ul className="my-4 space-y-2 pl-1">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
              <span className="text-blue-500 mt-1.5" aria-hidden="true">•</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      );
    case 'quote':
      return (
        <blockquote className="my-6 border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 px-5 py-3 rounded-r-xl">
          <p className="text-[15px] italic text-slate-700 dark:text-slate-200">{block.text}</p>
          {block.source && <cite className="block not-italic text-xs text-slate-400 mt-1">— {block.source}</cite>}
        </blockquote>
      );
    case 'img':
      return (
        <figure className="my-8">
          <img src={block.src} alt={block.alt} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800" loading="lazy" />
          {block.caption && <figcaption className="text-xs text-slate-400 text-center mt-2">{block.caption}</figcaption>}
        </figure>
      );
    default:
      return null;
  }
}

function ArticleView({ article }: { article: Article }) {
  const author = getAuthor(article.authorSlug);
  const related = relatedArticles(article, 3);

  useEffect(() => {
    applySeo({
      title: article.title,
      description: article.description,
      path: `/blog/${article.slug}`,
      type: 'article',
      image: article.cover,
      publishedTime: article.date,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title,
        description: article.description,
        image: `https://apexenem.com.br${article.cover}`,
        datePublished: article.date,
        author: author ? { '@type': 'Person', name: author.name } : undefined,
        publisher: { '@type': 'Organization', name: 'ApexEnem' },
        mainEntityOfPage: `https://apexenem.com.br/blog/${article.slug}`,
        keywords: article.keywords.join(', '),
      },
    });
  }, [article, author]);

  return (
    <PublicLayout crumbs={[{ label: 'Início', path: '/' }, { label: 'Blog', path: '/blog' }, { label: article.title }]}>
      <article className="max-w-3xl mx-auto px-4 pt-8 pb-4">
        <div className="mb-6">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded">
            <Tag className="h-3 w-3" aria-hidden="true" /> {article.category}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-5">{article.title}</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{article.description}</p>
        <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
          <AuthorChip slug={article.authorSlug} date={article.date} minutes={article.readingMinutes} />
        </div>

        <figure className="mt-6">
          <img src={article.cover} alt={article.coverAlt} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800" />
        </figure>

        <div className="mt-2">
          {article.blocks.map((b, i) => (
            <React.Fragment key={i}>
              <BlockRenderer block={b} />
              {i === 1 && <AdSlot slotId={`blog-inline-${article.slug}`} />}
            </React.Fragment>
          ))}
        </div>

        {author && (
          <div className="mt-12 p-6 rounded-2xl bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              {author.photo ? (
                <img src={author.photo} alt={author.name} width={56} height={56} className="w-14 h-14 rounded-full object-cover" loading="lazy" />
              ) : (
                <span className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg font-bold">{author.name.charAt(0)}</span>
              )}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">Escrito por</p>
                <button type="button" onClick={() => navigate(`/autor/${author.slug}`)} className="text-sm font-bold hover:text-blue-600 transition cursor-pointer">{author.name}</button>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{author.role}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-4">{author.bio}</p>
          </div>
        )}

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-extrabold tracking-tight mb-5">Leia também</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {related.map((r) => (
                <React.Fragment key={r.slug}>
                  <ArticleCard article={r} />
                </React.Fragment>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10">
          <button type="button" onClick={() => navigate('/blog')} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:gap-3 transition-all cursor-pointer">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Ver todos os artigos
          </button>
        </div>
      </article>
    </PublicLayout>
  );
}

export default function BlogView({ slug }: { slug?: string }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('Todos');
  const article = slug ? getArticle(slug) : undefined;

  useEffect(() => {
    if (!slug) {
      applySeo({
        title: 'Blog — Dicas e conteúdos para o ENEM',
        description: 'Artigos sobre redação, matemática, ciências e métodos de estudo para mandar bem no ENEM. Conteúdo produzido pela equipe ApexEnem.',
        path: '/blog',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Blog ApexEnem',
          url: 'https://apexenem.com.br/blog',
        },
      });
    }
  }, [slug]);

  const filtered = useMemo(() => {
    return ARTICLES.filter((a) => (category === 'Todos' ? true : a.category === category)).filter((a) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.keywords.some((k) => k.toLowerCase().includes(q));
    });
  }, [query, category]);

  if (slug) {
    if (!article) {
      return (
        <PublicLayout crumbs={[{ label: 'Início', path: '/' }, { label: 'Blog', path: '/blog' }, { label: 'Não encontrado' }]}>
          <div className="max-w-xl mx-auto px-4 py-24 text-center">
            <h1 className="text-2xl font-extrabold mb-3">Artigo não encontrado</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">O conteúdo que você procura pode ter sido movido ou não existe.</p>
            <button type="button" onClick={() => navigate('/blog')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition cursor-pointer">Voltar ao blog</button>
          </div>
        </PublicLayout>
      );
    }
    return <ArticleView article={article} />;
  }

  return (
    <PublicLayout crumbs={[{ label: 'Início', path: '/' }, { label: 'Blog' }]}>
      <section className="max-w-6xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Blog ApexEnem</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mb-8">Conteúdo prático sobre redação, exatas, humanas e métodos de estudo para você alcançar seu ápice no ENEM.</p>

        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar artigos..."
              aria-label="Buscar artigos"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['Todos', ...CATEGORIES].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition cursor-pointer ${
                  category === c
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 py-16 text-center">Nenhum artigo encontrado para sua busca.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((a) => (
              <React.Fragment key={a.slug}>
                <ArticleCard article={a} />
              </React.Fragment>
            ))}
          </div>
        )}
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-10">
        <AdSlot slotId="blog-list-bottom" />
      </div>
    </PublicLayout>
  );
}
