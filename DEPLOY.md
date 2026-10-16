# Guia de Deploy — ApexEnem

Guia **passo a passo, do zero**, para colocar o ApexEnem no ar. Feito para quem
nunca publicou este projeto (ou nunca usou Vercel/Render/Supabase). Siga na ordem.

> **Domínio atual do site:** `https://apexenem.vercel.app` (domínio grátis da Vercel).
> Ter um domínio próprio é **opcional** e pode ser feito depois (Passo 4).

> Legenda: 🔴 obrigatório · 🟡 recomendado · ⚪ opcional

---

## 0. Visão geral da arquitetura

| Peça | O que é | Onde hospeda | Custo |
|------|---------|--------------|-------|
| **Frontend + Backend** | App React (Vite) + API Express (`api/index.ts`) | **Vercel** | Grátis |
| **Banco + Auth + Storage** | Postgres, login, arquivos | **Supabase** | Grátis (free tier) |
| **Serviço de IA** | `render/server.js` — 20 chaves de IA em fila | **Render** | Grátis (com cold start) |
| **Rate limit distribuído** | Rate limiting por IP | **Upstash Redis** | Grátis |
| **E-mails** | Confirmação de conta / contato | **Resend** | Grátis |
| **Anúncios** | Google AdSense | Google | — |
| **Analytics** | Google Analytics 4 | Google | — |

Fluxo de uma requisição de IA:
`Navegador → Vercel (/api/*) → Render (com header x-internal-key) → Provedor de IA`

Contas necessárias: **GitHub**, **Vercel**, **Supabase**, **Render**,
(🟡) **Upstash**, (🟡) **Resend**, (🟡) **Google (AdSense + Analytics)**.

Antes de tudo, confirme que o projeto roda localmente:

```bash
npm install
npm run lint     # checagem de tipos (tsc --noEmit)
npm run build     # gera a pasta dist/
```

---

## 1. 🔴 Supabase (banco, login e storage)

1. Acesse <https://supabase.com> e crie uma conta (pode entrar com GitHub).
2. **New project**:
   - **Name:** `ApexEnem`
   - **Database Password:** gere e **guarde** (não é usada pelo app, mas evite perder).
   - **Region:** `South America (São Paulo)` para menor latência no Brasil.
3. Aguarde o projeto provisionar (~2 min).

### 1.1 Criar as tabelas

1. No menu lateral, abra **SQL Editor** → **New query**.
2. Cole todo o conteúdo de **`supabase-setup.sql`** (na raiz do repositório) e clique **Run**.
3. Se houver erros de política (RLS), rode também **`fix-rls.sql`**.
4. Confirme em **Table Editor** que as tabelas foram criadas.

### 1.2 Pegar as chaves

**Project Settings** (engrenagem) → **API**. Copie:

- **Project URL** → será `SUPABASE_URL` e `VITE_SUPABASE_URL`
- **anon public** key → será `SUPABASE_ANON_KEY` e `VITE_SUPABASE_ANON_KEY`
- **service_role** key (clique em *Reveal*) → será `SUPABASE_SERVICE_ROLE_KEY` 🔒 **nunca** exponha no frontend

(⚪ Opcional) Para criação automática de tabelas, crie um token em
**Account → Access Tokens** → será `SUPABASE_MANAGEMENT_KEY`.

### 1.3 Configurar Auth

1. **Authentication → URL Configuration**:
   - **Site URL:** `https://apexenem.vercel.app`
   - **Redirect URLs** (adicione todas):
     ```
     https://apexenem.vercel.app
     https://apexenem.vercel.app/**
     http://localhost:5173
     http://localhost:5173/**
     ```
2. **Authentication → Providers → Email**: deixe **habilitado**.
   - Para testes rápidos, você pode desligar *Confirm email* (⚪). Em produção, mantenha ligado.
3. (⚪) **Authentication → Security → Bot Detection**: se ativar hCaptcha,
   pegue o **site key** e coloque em `VITE_HCAPTCHA_SITE_KEY`.

---

## 2. 🔴 Serviço de IA no Render

Este serviço (`render/server.js`) guarda até 10 chaves Groq + 10 OpenRouter e faz
a fila/rotação. O backend da Vercel conversa com ele por `RENDER_PROCESS_URL`.

1. Acesse <https://render.com> e crie uma conta (pode entrar com GitHub).
2. **New → Web Service** → conecte o mesmo repositório do GitHub.
3. Configurações:
   - **Name:** `apexenem-ia`
   - **Root Directory:** `render`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free
4. **Environment Variables** (aba *Environment*):

   | Variável | Valor |
   |----------|-------|
   | `INTERNAL_API_KEY` | 🔴 o **mesmo** valor que você vai usar na Vercel |
   | `ALLOWED_ORIGINS` | 🔴 `https://apexenem.vercel.app` |
   | `GROQ_API_KEY_V1` … `GROQ_API_KEY_V10` | 🟡 uma chave Groq em cada (só as que tiver) |
   | `OPENROUTER_API_KEY_V1` … `OPENROUTER_API_KEY_V10` | 🟡 uma chave OpenRouter em cada |
   | `GOOGLE_API_KEY` | ⚪ chave do Google AI Studio (Gemini) |

   > Gere o `INTERNAL_API_KEY` com: `openssl rand -hex 32`
   > (ou use a saída de `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

   - Chaves Groq grátis: <https://console.groq.com/keys>
   - Chaves OpenRouter grátis: <https://openrouter.ai/keys>
   - Gemini grátis: <https://aistudio.google.com/apikey>

5. Clique **Create Web Service** e aguarde o deploy. Copie a URL pública
   (ex.: `https://apexenem-ia.onrender.com`) → será `RENDER_PROCESS_URL`.

> ⚠️ No plano Free o serviço "dorme" após ~15 min sem uso; a primeira requisição
> pode levar ~30 s. O repositório já tem um workflow de keep-alive para o Supabase;
> para o Render, considere um ping periódico (ex.: <https://uptimerobot.com>).

---

## 3. 🔴 Frontend + Backend na Vercel

1. Acesse <https://vercel.com> e faça login com GitHub.
2. **Add New… → Project** → importe o repositório do **ApexEnem**.
   - Se pedir um nome, use **`ApexEnem`** (a URL ficará `apexenem.vercel.app`).
3. **Framework Preset:** Vite (detectado automaticamente).
   - **Build Command:** `vite build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - Não precisa mexer: `vercel.json` já configura build, rewrites e o cron.
4. **Environment Variables** (cole uma por uma). Marque para *Production*,
   *Preview* e *Development*:

   **🔴 Obrigatórias**
   | Variável | Valor |
   |----------|-------|
   | `SUPABASE_URL` | URL do Supabase |
   | `SUPABASE_ANON_KEY` | chave anon |
   | `VITE_SUPABASE_URL` | a **mesma** URL |
   | `VITE_SUPABASE_ANON_KEY` | a **mesma** anon key |
   | `INTERNAL_API_KEY` | o **mesmo** valor do Render |
   | `RENDER_PROCESS_URL` | URL do serviço de IA no Render |
   | `HMAC_SECRET` | string aleatória forte (`openssl rand -hex 32`) |
   | `ALLOWED_ORIGINS` | `https://apexenem.vercel.app` |
   | `VITE_SITE_URL` | `https://apexenem.vercel.app` |

   **🟡 Recomendadas**
   | Variável | Valor |
   |----------|-------|
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role (para e-mails/rotas admin) |
   | `UPSTASH_REDIS_REST_URL` | ver Passo 5 |
   | `UPSTASH_REDIS_REST_TOKEN` | ver Passo 5 |
   | `RESEND_API_KEY` | ver Passo 6 |
   | `EMAIL_FROM` | `ApexEnem <onboarding@resend.dev>` (teste) ou do seu domínio verificado |
   | `CONTACT_EMAIL` | e-mail que **você lê** para receber o formulário de contato |
   | `VITE_ADSENSE_CLIENT` | `ca-pub-3858534603619694` (ver Passo 7) |
   | `VITE_GA_ID` | `G-XXXXXXXXXX` (ver Passo 8) |

   **⚪ Opcionais**
   | Variável | Valor |
   |----------|-------|
   | `ALLOWED_EMAILS` | lista de e-mails da beta separados por vírgula (vazio = aberto) |
   | `GOOGLE_API_KEY` | chave Gemini (OCR de redação) |
   | `SUPABASE_MANAGEMENT_KEY` | criação automática de tabelas |
   | `VITE_HCAPTCHA_SITE_KEY` | se ativar hCaptcha |
   | `VITE_REWARDED_ENABLED` | `false` por enquanto (ver Passo 7) |
   | `VITE_APEXGUARDIAN_URL` | `https://apexguardian.onrender.com` |

5. Clique **Deploy**. Aguarde o build (~1–2 min).
6. Abra a URL `https://apexenem.vercel.app` e teste login + uma correção de redação.

> A URL `*.vercel.app` é atribuída automaticamente e já tem HTTPS. Não precisa
> configurar DNS para ela.

---

## 4. ⚪ Domínio próprio (opcional — pode fazer depois)

O site já funciona em `https://apexenem.vercel.app` **sem** domínio próprio.
Quando quiser um domínio (ex.: `apexenem.com.br`), faça:

1. Registre/possua o domínio (ex.: no Registro.br).
2. Na Vercel: **Project → Settings → Domains → Add** → digite o domínio.
3. A Vercel mostrará os registros DNS. No painel do registrador, crie:
   - **A** `@` → `76.76.21.21`
   - **CNAME** `www` → `cname.vercel-dns.com`
4. Aguarde a propagação (minutos a algumas horas). A Vercel emite HTTPS automático.
5. Depois, atualize para refletir o domínio novo:
   - `VITE_SITE_URL` (Vercel) → `https://seudominio.com`
   - `ALLOWED_ORIGINS` (Vercel e Render) → `https://seudominio.com,https://apexenem.vercel.app`
   - `public/sitemap.xml` e `public/robots.txt` (troque a URL base)
   - **Supabase → Authentication → URL Configuration** (Site URL + Redirect URLs)

> ⚠️ **E-mail e AdSense precisam de domínio próprio.** Não é possível enviar
> e-mail "de `@apexenem.vercel.app`" nem (na prática) ser aprovado no AdSense
> apenas com o subdomínio da Vercel. Para isso, use um domínio seu.
> Sem domínio, para **testar** o envio, use `onboarding@resend.dev` no `EMAIL_FROM`.

---

## 5. 🟡 Upstash (rate limit distribuído)

Sem isso, o rate limit usa memória local (funciona, mas não distribui entre
instâncias da Vercel). Em escala, configure:

1. <https://upstash.com> → **Create Database** → escolha a região mais próxima.
2. Na aba **REST API**, copie:
   - **UPSTASH_REDIS_REST_URL** → `UPSTASH_REDIS_REST_URL`
   - **UPSTASH_REDIS_REST_TOKEN** → `UPSTASH_REDIS_REST_TOKEN`
3. Adicione as duas na Vercel e faça **Redeploy**.

---

## 6. 🟡 Resend (e-mails reais)

Sem isso, os e-mails ficam apenas simulados no log.

1. <https://resend.com> → crie conta.
2. Para **produção**, adicione um domínio próprio em **Domains → Add Domain** e
   siga os registros DNS (SPF/DKIM). Sem domínio, você pode testar com o remetente
   `onboarding@resend.dev`.
3. **API Keys → Create** → copie → `RESEND_API_KEY`.
4. Defina `EMAIL_FROM` (ex.: `ApexEnem <onboarding@resend.dev>` para teste, ou do
   seu domínio verificado) e `CONTACT_EMAIL` (padrão: `apexenem@gmail.com`).
5. Adicione na Vercel e faça **Redeploy**.

---

## 7. 🟡 Google AdSense

O arquivo `public/ads.txt` já está presente com o publisher `pub-3858534603619694`.

1. <https://adsense.google.com> → crie/entre na conta.
2. **Sites → Add site** → `apexenem.vercel.app` e conclua a verificação.
   (A aprovação costuma exigir um **domínio próprio**.)
3. Crie uma **unidade de anúncio** (display) e copie o ID `ca-pub-...`.
4. Coloque em `VITE_ADSENSE_CLIENT` (na Vercel) e faça **Redeploy**.
   Os anúncios só carregam **após o usuário aceitar cookies** (LGPD) — isso é
   intencional e está implementado em `src/lib/consent.ts`.
5. **Anúncio recompensado (rewarded):** o AdSense comum **não** permite rewarded.
   Para ativá-lo de verdade é preciso o **Google Ad Manager**. Enquanto isso,
   deixe `VITE_REWARDED_ENABLED=false` — o modal de moedas simula um anúncio de
   teste (não gera receita, mas o fluxo funciona para testes).

> Antes de submeter o site ao AdSense, revise o checklist em
> `C:\Users\ander\Desktop\ApexEnem\desenvolvimento\plano-100k.md` (§7.1):
> ≥30 páginas, artigos 800+ palavras, hierarquia H1→H2→H3, breadcrumbs,
> data visível, sitemap, política/termos LGPD, popup de cookies, mobile OK.

---

## 8. 🟡 Google Analytics 4

1. <https://analytics.google.com> → crie uma propriedade para o seu site.
2. Copie o **Measurement ID** (formato `G-XXXXXXXXXX`).
3. Coloque em `VITE_GA_ID` (na Vercel) e faça **Redeploy**.
   O GA só é carregado após consentimento de *analytics* (LGPD).

---

## 9. 🟡 GitHub (CI + keep-alive)

O repositório já tem:
- `.github/workflows/ci.yml` — roda `npm ci`, `npm run lint` e `npm run build` a cada push/PR.
- `.github/workflows/keep-alive.yml` — pinga o Supabase para evitar o pause do free tier.

Em **GitHub → Settings → Secrets and variables → Actions**, crie:

| Secret | Valor |
|--------|-------|
| `VITE_SUPABASE_URL` | URL do Supabase |
| `VITE_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_URL` | URL do Supabase |
| `SUPABASE_ANON_KEY` | anon key |
| `APP_URL` | `https://apexenem.vercel.app` |

---

## 10. 🟡 Google Search Console

1. <https://search.google.com/search-console> → **Add property** → `https://apexenem.vercel.app`.
2. Verifique por DNS (recomendado) ou meta tag.
   - Para `vercel.app` (subdomínio de terceiro) a verificação por **meta tag HTML**
     funciona melhor: copie a tag e coloque no `<head>` do `index.html`.
3. **Sitemaps → Add** → `https://apexenem.vercel.app/sitemap.xml`.
4. O `robots.txt` já aponta para o sitemap.

---

## 11. ✅ Verificação final (checklist)

Após tudo configurado, teste:

- [ ] `https://apexenem.vercel.app` abre a landing e o HTTPS funciona.
- [ ] Criar conta e confirmar e-mail (se confirmação ativada).
- [ ] Login e chegada ao dashboard.
- [ ] Correção de redação retorna nota (consome moedas).
- [ ] Questões com IA geram (consome 1 moeda).
- [ ] Botão "Ganhar moedas" credita moedas (limite diário respeitado).
- [ ] `/planos` mostra os 3 planos; badge de plano aparece na sidebar.
- [ ] `/blog`, `/blog/:slug`, `/autores`, `/contato`, `/repertorios` abrem.
- [ ] Formulário de contato mostra sucesso (e chega e-mail, se Resend configurado).
- [ ] Banner de cookies aparece; "Recusar" **não** carrega GA/AdSense;
      "Aceitar todos" carrega.
- [ ] `/privacidade` e `/cookies` (políticas) abrem.
- [ ] `https://apexenem.vercel.app/robots.txt` e `/sitemap.xml` respondem.
- [ ] `/api/stats` responde JSON.
- [ ] No painel Vercel, sem erros nos logs; no Render, serviço "live".

---

## Apêndice A — Onde vai cada variável

| Variável | Vercel | Render | GitHub |
|----------|:------:|:------:|:------:|
| `SUPABASE_URL` | ✅ | — | ✅ |
| `SUPABASE_ANON_KEY` | ✅ | — | ✅ |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | ✅ | — | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | — | — |
| `SUPABASE_MANAGEMENT_KEY` | ⚪ | — | — |
| `INTERNAL_API_KEY` | ✅ | ✅ | — |
| `RENDER_PROCESS_URL` | ✅ | — | — |
| `ALLOWED_ORIGINS` | ✅ | ✅ | — |
| `HMAC_SECRET` | ✅ | — | — |
| `ALLOWED_EMAILS` | ⚪ | — | — |
| `UPSTASH_REDIS_REST_URL/TOKEN` | 🟡 | — | — |
| `RESEND_API_KEY` / `EMAIL_FROM` / `CONTACT_EMAIL` | 🟡 | — | — |
| `VITE_ADSENSE_CLIENT` / `VITE_GA_ID` | 🟡 | — | — |
| `VITE_SITE_URL` | ✅ | — | — |
| `VITE_REWARDED_ENABLED` | ⚪ | — | — |
| `GOOGLE_API_KEY` | ⚪ | ⚪ | — |
| `GROQ_API_KEY_V1..V10` | — | 🟡 | — |
| `OPENROUTER_API_KEY_V1..V10` | — | 🟡 | — |
| `APP_URL` | — | — | ✅ |

## Apêndice B — Ações manuais pendentes (fora do código)

Estes itens **só o dono da conta** pode fazer (não são automatizáveis pelo código):

1. Criar as contas (Supabase, Render, Vercel, Upstash, Resend, Google) e preencher as chaves.
2. Rodar o `supabase-setup.sql` no SQL Editor.
3. (Opcional) Registrar um domínio próprio e apontar o DNS.
4. Verificar o domínio no Resend e no AdSense (Recomendado domínio próprio).
5. (Futuro) Integrar o **Google Ad Manager** para o anúncio recompensado real de moedas.
6. (Futuro) Colocar Stripe/Mercado Pago para cobrança real dos planos PRO/Apex —
   hoje `src/lib/coins.ts` é **client-side** (localStorage) e serve para testar a
   experiência; a cobrança de verdade exige backend + gateway.
