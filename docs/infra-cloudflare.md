# Cloudflare Free na frente do ApexEnem

Resolve os 3 achados principais do relatório **GoCache Security Radar**
(WAF ausente, bot mitigation ausente, CDN de borda ausente) **de graça**.

## Passo-a-passo (15 min + ~24h de propagação DNS)

### 1. Criar conta e adicionar o site
1. [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) — conta gratuita.
2. **Add a Site** → `apexenem.com.br` → plano **Free**.
3. Cloudflare importa os registros DNS atuais. **Confira** se os registros `A`/`CNAME` apontam para o IP/alias da Vercel (`cname.vercel-dns.com`).

### 2. Trocar nameservers no registrador
1. Cloudflare mostra dois nameservers (ex.: `kai.ns.cloudflare.com` + `tim.ns.cloudflare.com`).
2. No seu registrador atual (Registro.br, GoDaddy, Namecheap etc.), substitua os nameservers antigos por esses dois.
3. Propagação leva de 10 min a 24h. Status aparece em verde no painel Cloudflare quando terminar.

### 3. SSL/TLS
- **SSL/TLS → Overview**: modo **Full (strict)**. Nunca **Flexible** (pula o HTTPS entre Cloudflare e Vercel).
- **SSL/TLS → Edge Certificates**: ligar **Always Use HTTPS**, **HSTS** (max-age 1 ano, include subdomains, preload — bate com o que o Vercel já envia), **Minimum TLS 1.2**, **TLS 1.3 ON**, **Automatic HTTPS Rewrites ON**.

### 4. WAF (achado GoCache crítico)
- **Security → WAF → Managed rules**: ativar **Cloudflare Managed Ruleset** (cobre OWASP Top 10, SQLi, XSS, RCE). No plano Free vem com regras essenciais, suficiente pra sair de 0% de proteção.
- **Security → WAF → Rate limiting rules**: adicionar regra `POST /api/*` → **10 req/min por IP** (defesa em profundidade além do nosso rate limit).

### 5. Bot mitigation (achado GoCache)
- **Security → Bots → Bot Fight Mode**: ligar. Bloqueia bots conhecidos automaticamente no plano Free.

### 6. DDoS
Já vem ligado por padrão no plano Free. Nada a fazer.

### 7. Cache / CDN
- **Caching → Configuration → Browser Cache TTL**: **Respect Existing Headers** (nosso `vercel.json` já cuida).
- **Caching → Tiered Cache**: ON. Reduz carga na origem Vercel.
- **Speed → Optimization → Auto Minify**: desligar (Vite já minifica). Evita quebrar hashes.

### 8. Page Rules / redirect www
- **Rules → Page Rules**: `www.apexenem.com.br/*` → **Forwarding URL 301** para `https://apexenem.com.br/$1`. Mantém SEO consolidado no domínio apex.

### 9. Verificar
```bash
curl -I https://apexenem.com.br
# Deve ter headers: cf-ray, cf-cache-status, server: cloudflare
```
Reexecutar o GoCache Radar após 24h. Score esperado: **85+/100** (vs 43 atual).

## O que **não** usar no Free
- **Workers** (tem quota mensal baixa). Se quiser lógica em edge, usar Vercel Edge Functions.
- **Access** (SSO) — pago.
- **Transform Rules complexas** — limite baixo no Free.

## Rollback
Trocar os nameservers de volta no registrador. O Cloudflare para de intermediar em 10 min a 24h; nada no código do ApexEnem precisa mudar.

## Impacto no CSP
Nada muda — nosso CSP em `vercel.json` continua valendo e Cloudflare não modifica cabeçalhos quando não há Auto Minify / Rocket Loader ativados.
