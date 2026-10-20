# update.md — Migração para o domínio próprio `apexenem.com.br`

Este guia é o **adendo ao `DEPLOY.md` antigo** (que você já executou). Ele cobre
**somente o que mudou** agora que o site passou a usar o domínio próprio
`https://apexenem.com.br`.

> Suposição: o deploy base já foi feito (Vercel + Render + Supabase + chaves no ar)
> e o domínio `apexenem.com.br` **já está configurado na Vercel** (o
> `apexenem.vercel.app` redireciona para ele).

Legenda: 🔴 obrigatório · 🟡 recomendado · ⚪ opcional

---

## 0. O que já foi alterado no código (nada a fazer aqui)

Já trocei o domínio em todo o projeto, de `apexenem.vercel.app` para
`apexenem.com.br`:

- `index.html` — `canonical`, `og:url`, `og:image`, `twitter:image` e JSON-LD.
- `public/sitemap.xml` — todas as URLs.
- `public/robots.txt` — linha `Sitemap:`.
- `src/lib/seo.ts` — fallback da URL canônica.
- `src/components/AboutPage.tsx`, `AuthorsView.tsx`, `ContactPage.tsx`,
  `RepertoiresView.tsx` — URLs em JSON-LD.
- `render/server.js` — header `HTTP-Referer` do OpenRouter.
- `README.md` — link do site.
- `.env.example` — novas variáveis (`APP_URL`, `ALLOWED_ORIGINS`).
- `api/index.ts` — `getBaseUrl()` agora usa **`APP_URL`** para montar os links
  dos e-mails (antes usava a URL de preview da Vercel). Isso é importante: sem
  `APP_URL`, os links de confirmação de e-mail podem apontar para o domínio
  temporário da Vercel.

**Ação:** apenas garantir que esse commit chegou na Vercel (ela redeploya sozinha
ao receber o push na `main`). Se quiser forçar: **Vercel → Deployments → Redeploy**.

---

## 1. 🔴 Vercel — variáveis + redeploy

**Project → Settings → Environment Variables** (Production e Preview). Adicione/ajuste:

| Variável | Valor |
|----------|-------|
| `VITE_SITE_URL` | `https://apexenem.com.br` |
| `APP_URL` | `https://apexenem.com.br` |
| `ALLOWED_ORIGINS` | `https://apexenem.com.br,https://www.apexenem.com.br` |

As demais (`VITE_SUPABASE_*`, `SUPABASE_*`, `RENDER_PROCESS_URL`,
`INTERNAL_API_KEY`, `HMAC_SECRET`, etc.) **já estão** do deploy antigo.

**Settings → Domains** — confirme:
- `apexenem.com.br` como **principal** (Primary).
- `www.apexenem.com.br` como **redirect** para o principal (ou vice-versa, mas
  escolha **um** como canônico — recomendado: sem `www`).

Depois de salvar as variáveis: **Deployments → ⋯ → Redeploy** (variáveis só valem
após novo deploy).

---

## 2. 🔴 Render (serviço de IA) — CORS + redeploy

No painel do Render, no serviço `render/server.js`:

| Variável | Valor |
|----------|-------|
| `ALLOWED_ORIGINS` | `https://apexenem.com.br,https://www.apexenem.com.br` |

- Confirme que `INTERNAL_API_KEY` é **idêntico** ao da Vercel.
- Salve → o Render redeploya sozinho.

> Sem isso, o backend da Vercel chama o Render e recebe **CORS bloqueado**.

---

## 3. 🔴 Supabase — URLs de autenticação

**Authentication → URL Configuration:**

- **Site URL:** `https://apexenem.com.br`
- **Redirect URLs** (adicione todas):
  - `https://apexenem.com.br/**`
  - `https://www.apexenem.com.br/**`
  - `https://apexenem.vercel.app/**` (mantenha, para previews da Vercel)

**Authentication → Providers → Google** (se você usa login Google):
- O **Authorized redirect URI** do Google Cloud deve incluir
  `https://<seu-projeto>.supabase.co/auth/v1/callback` e as **origens
  autorizadas** devem incluir `https://apexenem.com.br`.

**E-mail de confirmação:** os templates usam o **Site URL**; com o valor acima,
os links de confirmação/reset passam a apontar para o domínio próprio.

> Se ainda **não** rodou: `supabase-setup.sql` e `fix-rls.sql` no **SQL Editor**
> (do deploy antigo). E mantenha o `keep-alive` (já no `vercel.json`, cron diário).

---

## 4. 🟡 Resend — enviar e-mail pelo domínio (agora é possível)

Antes não dava (não tinha domínio). Agora que tem:

1. <https://resend.com> → **Domains → Add Domain** → `apexenem.com.br`.
2. Crie os registros **DNS** (SPF/DKIM) que o Resend mostrar, no Registro.br.
3. Aguarde "Verified".
4. Na **Vercel**, ajuste:
   - `EMAIL_FROM` = `ApexEnem <no-reply@apexenem.com.br>`
   - `CONTACT_EMAIL` = `apexenem@gmail.com` (você recebe os contatos aqui)

> Se **não** quiser configurar agora, deixe `EMAIL_FROM` como
> `ApexEnem <onboarding@resend.dev>` (modo teste) — funciona para testar.

---

## 5. 🟡 Google — SEO, Analytics e AdSense

**Search Console** — <https://search.google.com/search-console>
1. **Add property → Domain** → `apexenem.com.br`.
2. Verifique por **DNS** (crie o registro TXT indicado).
3. **Sitemaps → Add** → `https://apexenem.com.br/sitemap.xml`.

**Google Analytics 4**
1. Crie um **fluxo de dados (Web)** para `https://apexenem.com.br`.
2. Copie o `G-XXXXXXX` e defina `VITE_GA_ID` na Vercel → Redeploy.

**AdSense** — <https://adsense.google.com>
1. **Sites → Add site** → `apexenem.com.br` (agora aprovável, com domínio próprio).
2. Confirme que `https://apexenem.com.br/ads.txt` responde com o seu `pub-…`
   (o arquivo `public/ads.txt` já está correto).
3. Opcional: `VITE_ADSENSE_CLIENT=ca-pub-…` na Vercel → Redeploy.

> O **anúncio recompensado** (sistema de moedas) exige **Google Ad Manager**, não
> o AdSense comum. Enquanto não integrar, `VITE_REWARDED_ENABLED=false` (o modal
> de moedas funciona em modo de teste).

---

## 6. ✅ Preparação para o Beta Testing

Checklist técnico (o que conferir antes de liberar para os testers):

**Contas e acesso**
- [ ] Confirmar que novos cadastros funcionam e (se ativado) o e-mail de
      confirmação chega.
- [ ] Login e-mail/senha e (se houver) login Google funcionam no domínio novo.
- [ ] Fluxo de **recuperação de senha** aponta para `apexenem.com.br`.

**Funcionalidades (no domínio novo)**
- [ ] Correção de redação retorna nota (consome **10 moedas**).
- [ ] Questões com IA geram (consome **10 moedas**).
- [ ] Pesquisa de repertórios retorna categorias (grátis, sem moedas).
- [ ] IA Professora (plano Apex) gera plano de aula.
- [ ] "Ganhar moedas" credita **+20** por anúncio, **sem limite diário**.
- [ ] Plano Free volta a **10 moedas** no início da semana.
- [ ] Simulados e Estudos abrem e salvam progresso.

**Infra / segurança**
- [ ] `ALLOWED_ORIGINS` correto na Vercel **e** no Render (senão IA falha).
- [ ] `APP_URL` definido (senão links de e-mail apontam para a URL da Vercel).
- [ ] `INTERNAL_API_KEY` idêntico na Vercel e no Render.
- [ ] Logs da Vercel e do Render **sem erros** (Render "live").
- [ ] `/api/stats` responde JSON em produção.
- [ ] `robots.txt` e `sitemap.xml` respondem no domínio novo.
- [ ] RLS do Supabase conferido (dados de um usuário não vazam para outro).
- [ ] Rate limit ativo (Upstash, se configurado).
- [ ] LGPD: banner de cookies OK ("Recusar" não carrega GA/AdSense).

**Beta**
- [ ] Criar 1–2 **contas de teste** e rodar o fluxo completo.
- [ ] Definir canal de suporte (ex.: `apexenem@gmail.com` na `/contato`).
- [ ] Aviso de "versão beta" (o `DevNoticeBanner` já existe no app).
- [ ] Backup do Supabase (Database → Backups) ativo.

---

## 7. Verificação rápida final

Abra no navegador (anonimamente):

- [ ] `https://apexenem.com.br` abre a landing com HTTPS.
- [ ] `https://apexenem.vercel.app` redireciona para `https://apexenem.com.br`.
- [ ] `https://apexenem.com.br/sitemap.xml` mostra URLs com o `.com.br`.
- [ ] `https://apexenem.com.br/robots.txt` aponta o sitemap no `.com.br`.
- [ ] Inspecionar `canonical` na página → deve ser `https://apexenem.com.br/`.

Pronto. Com isso o ApexEnem fica consistente no domínio próprio e pronto para o beta.
