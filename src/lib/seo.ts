const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) || 'https://apexenem.vercel.app';
const DEFAULT_TITLE = 'ApexEnem — Plataforma de estudos e correção de redação por IA para o ENEM';
const DEFAULT_DESC =
  'Plataforma brasileira de preparação para o ENEM: correção de redação por inteligência artificial, simulados, questões inéditas, plano de estudos adaptativo e pesquisa de repertório sociocultural.';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(id: string, data: unknown) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export interface SeoOptions {
  title?: string;
  description?: string;
  path?: string;
  type?: 'website' | 'article';
  image?: string;
  publishedTime?: string;
  jsonLd?: unknown;
}

export function applySeo(opts: SeoOptions = {}) {
  const title = opts.title ? `${opts.title} | ApexEnem` : DEFAULT_TITLE;
  const description = opts.description || DEFAULT_DESC;
  const url = SITE_URL + (opts.path || '/');

  document.title = title;
  setMeta('name', 'description', description);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:type', opts.type || 'website');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  if (opts.image) {
    setMeta('property', 'og:image', opts.image.startsWith('http') ? opts.image : SITE_URL + opts.image);
    setMeta('name', 'twitter:image', opts.image.startsWith('http') ? opts.image : SITE_URL + opts.image);
  }
  if (opts.publishedTime) {
    setMeta('property', 'article:published_time', opts.publishedTime);
  }
  setLink('canonical', url);
  setJsonLd('page-jsonld', opts.jsonLd || {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url,
  });
}
