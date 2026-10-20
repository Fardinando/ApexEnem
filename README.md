# ApexEnem

Plataforma brasileira de estudos para o **ENEM**: correção de redação por IA,
simulados cronometrados, questões inéditas, plano de estudo adaptativo,
pesquisa de repertório sociocultural e uma **IA Professora** (planos de aula).

Site: <https://apexenem.com.br>

## Stack

- **Frontend:** React 19 + Vite 6 + Tailwind CSS 4 + motion + lucide-react
- **Backend:** Express em função serverless (`api/index.ts`) na Vercel
- **Banco/Auth/Storage:** Supabase
- **Serviço de IA:** `render/server.js` no Render (fila em memória + rotação de ~20 chaves Groq/OpenRouter)
- **Rate limit:** Upstash Redis (com fallback em memória)
- **E-mails:** Resend
- **Anúncios/Analytics:** Google AdSense + Analytics 4 (gated por consentimento LGPD)

## Rodando localmente

**Pré-requisitos:** Node.js 20+, npm.

```bash
npm install
cp .env.example .env      # preencha as variáveis (ver DEPLOY.md)
npm run dev               # sobe a API + Vite em modo dev
```

Outros comandos:

```bash
npm run lint              # checagem de tipos (tsc --noEmit)
npm run build             # build de produção (gera dist/)
```

## Configuração

Todas as variáveis de ambiente estão documentadas em **`.env.example`**.
O guia de deploy passo a passo (Supabase, Render, Vercel, DNS, AdSense,
Analytics, Upstash, Resend) está em **[`DEPLOY.md`](./DEPLOY.md)**.

## Estrutura

```
api/            Backend Express (serverless na Vercel)
render/         Serviço de IA (Render)
src/
  components/   Telas e componentes React
  config/       Configurações (planos/moedas, ads)
  data/         Conteúdo do blog e autores
  lib/          Libs (consent, seo, nav, coins, gamification...)
  types.ts      Tipos compartilhados
public/         Estáticos (robots, sitemap, ads.txt, logos, media)
supabase-setup.sql   Schema inicial do banco
vercel.json     Build, rewrites e cron
```

## Contribuição

1. Crie uma branch a partir de `main`.
2. Rode `npm run lint` e `npm run build` antes de abrir o PR.
3. O CI (`.github/workflows/ci.yml`) roda lint + build automaticamente.

## Licença

Projeto privado. Todos os direitos reservados.
