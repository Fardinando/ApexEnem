import React, { useEffect } from 'react';
import { Link2, ArrowLeft } from 'lucide-react';
import PublicLayout from './PublicLayout';
import { AUTHORS, getAuthor, type Author } from '../data/authors';
import { applySeo } from '../lib/seo';
import { navigate } from '../lib/nav';

function AuthorAvatar({ author, size = 'lg' }: { author: Author; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-12 h-12 text-base';
  if (author.photo) {
    return <img src={author.photo} alt={author.name} className={`${cls} rounded-full object-cover`} loading="lazy" />;
  }
  return (
    <span className={`${cls} rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold`}>
      {author.name.charAt(0)}
    </span>
  );
}

export default function AuthorsView({ slug }: { slug?: string }) {
  const author = slug ? getAuthor(slug) : undefined;

  useEffect(() => {
    if (slug && author) {
      applySeo({
        title: author.name,
        description: `${author.name} — ${author.role} no ApexEnem. ${author.bio}`,
        path: `/autor/${author.slug}`,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: author.name,
          jobTitle: author.role,
          description: author.bio,
          url: `https://apexenem.com.br/autor/${author.slug}`,
          worksFor: { '@type': 'Organization', name: 'ApexEnem' },
        },
      });
    } else if (!slug) {
      applySeo({
        title: 'Autores e equipe ApexEnem',
        description: 'Conheça as pessoas que constroem o ApexEnem: desenvolvedores, designers e pesquisadores por trás da plataforma.',
        path: '/autores',
      });
    }
  }, [slug, author]);

  if (slug) {
    if (!author) {
      return (
        <PublicLayout crumbs={[{ label: 'Início', path: '/' }, { label: 'Autores', path: '/autores' }, { label: 'Não encontrado' }]}>
          <div className="max-w-xl mx-auto px-4 py-24 text-center">
            <h1 className="text-2xl font-extrabold mb-3">Autor não encontrado</h1>
            <button type="button" onClick={() => navigate('/autores')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition cursor-pointer">Ver todos os autores</button>
          </div>
        </PublicLayout>
      );
    }

    return (
      <PublicLayout crumbs={[{ label: 'Início', path: '/' }, { label: 'Autores', path: '/autores' }, { label: author.name }]}>
        <section className="max-w-3xl mx-auto px-4 pt-8 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <AuthorAvatar author={author} />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{author.name}</h1>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-3">{author.role}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{author.bio}</p>
              {author.links && author.links.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                  {author.links.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition">
                      <Link2 className="h-3.5 w-3.5" aria-hidden="true" /> {l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-10">
            <button type="button" onClick={() => navigate('/autores')} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:gap-3 transition-all cursor-pointer">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Ver todos os autores
            </button>
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout crumbs={[{ label: 'Início', path: '/' }, { label: 'Autores' }]}>
      <section className="max-w-4xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Nossa equipe</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mb-10">
          O ApexEnem é construído por estudantes e desenvolvedores que acreditam em educação acessível de qualidade.
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
          {AUTHORS.map((a) => (
            <button
              key={a.slug}
              type="button"
              onClick={() => navigate(`/autor/${a.slug}`)}
              className="text-left p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-3">
                <AuthorAvatar author={a} size="sm" />
                <div>
                  <p className="text-sm font-bold">{a.name}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{a.role}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">{a.bio}</p>
            </button>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
