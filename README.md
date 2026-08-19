<div align="center">

# ApexEnem

**Plataforma inteligente de preparação para o ENEM com IA**

Correção de redações por 10 IAs | Simulados TRI personalizados | Cursinho gamificado

[![Deploy no Vercel](https://vercel.com/button)](https://apexenem.vercel.app)

</div>

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Vercel)                       │
│  React 19 + Vite + Tailwind CSS 4 + Framer Motion           │
│  Deploy automático da branch main via GitHub                 │
└────────────────────────┬────────────────────────────────────┘
                         │ fetch()
┌────────────────────────▼────────────────────────────────────┐
│                   API Routes (Vercel Functions)              │
│  api/index.ts — Express montado como serverless function     │
│  Auth middleware (Supabase JWT) + Rate limiting (30/min/IP)  │
├─────────────────────────────────────────────────────────────┤
│  /api/correct         — Correção de redação (10 IAs)        │
│  /api/questions       — Geração de questões (3 paralelas)    │
│  /api/lesson-v2       — Geração de aulas personalizadas      │
│  /api/chapter-lesson  — Aulas por capítulo do cursinho       │
│  /api/student-context — Dados do aluno (para IA local)       │
│  /api/admin/*         — Painel admin (beta requests)         │
└────────────────────────┬────────────────────────────────────┘
                         │ fetch()
┌────────────────────────▼────────────────────────────────────┐
│              ApexAI Server (PC separada + Tailscale)         │
│  Node.js + Express na porta 3001                             │
│  Job queue: max 6 simultâneos, 250 enfileirados              │
├─────────────────────────────────────────────────────────────┤
│  Provider chain (tentativa automática):                      │
│  1. Groq (qwen3.6-27b)     — 10 keys, rate-limit 30 RPM    │
│  2. Gemini (2.5-flash)      — fallback                      │
│  3. OpenRouter (5 modelos free) — último recurso             │
│  4. Ollama local (qwen2.5)  — em implementação              │
└─────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     Supabase                                 │
│  PostgreSQL + Auth (email/senha) + Row Level Security        │
│  Tabelas: profiles, wrong_answers, question_responses,       │
│           essay_corrections, simulado_history,               │
│           activity_logs, learning_progress, beta_requests    │
└─────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológica

| Camada | Tecnologias |
|---|---|
| **Frontend** | React 19, Vite 6, Tailwind CSS 4, Framer Motion, KaTeX, Lucide Icons |
| **API (Vercel)** | Express 4 (serverless), TypeScript, Supabase JS, rate-limit |
| **AI Server** | Node.js, Express, Tailscale Funnel, PM2, Groq/Gemini/OpenRouter |
| **IA Local (futuro)** | Ollama, qwen2.5:0.5b (contexto), qwen2.5:3b (ensino) |
| **Banco** | Supabase (PostgreSQL), RLS policies |
| **Auth** | Supabase Auth, hCaptcha (opcional) |
| **Deploy** | Vercel (frontend + API), PM2 (AI server) |

---

## Funcionalidades

- **Correção de Redação** — 10 IAs corretoras em paralelo, nota 0-1000, 5 competências ENEM
- **Simulados TRI** — Motor de TRI (3PL) com distribuição por área, tempo, explicação
- **Questões IA** — Geração paralela de questões personalizadas por matéria
- **Cursinho Gamificado** — Módulos → Capítulos → Aulas interativas com XP, hearts, streaks
- **Dashboard** — Gráfico de desempenho,雷达 de competências, histórico
- **Perfil TRI** — Theta por matéria, evolução, breakdown de erros
- **Onboarding** — Coleta de perfil, meta ENEM, matérias difíceis
- **Whitelist** — Cadastro restrito por email + formulário de solicitação beta

---

## Setup Local

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase
- Chaves de API (ver `.env.example`)

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas chaves. As obrigatórias são:

| Variável | Onde usar | Descrição |
|---|---|---|
| `SUPABASE_URL` | Backend | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Backend | Chave anônima do Supabase |
| `VITE_SUPABASE_URL` | Frontend | Mesma URL do Supabase |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Mesma chave anônima |
| `VITE_GOOGLE_API_KEY` | Frontend | Chave Gemini pra chamadas diretas |
| `HMAC_SECRET` | Backend | Segredo pra tokens (`openssl rand -hex 32`) |

### 3. Rodar

```bash
npm run dev
```

O app roda em `http://localhost:5173`.

---

## Deploy no Vercel

### Produção (main)

O Vercel faz deploy automático quando algo é pushado na branch `main`.

### Preview (development)

Para ver mudanças antes de merge:

**Opção 1 — Preview automático via PR:**
1. Abra um PR de `development` → `main` no GitHub
2. O Vercel gera automaticamente uma URL tipo `apexenem-git-development-fardinando.vercel.app`
3. Teste nessa URL
4. Quando OK, faça merge no `main`

**Opção 2 — Projeto separado no Vercel:**
1. No Vercel Dashboard, crie um novo projeto
2. Conecte ao mesmo repo `Fardinando/ApexEnem`
3. Em Settings > Git, defina Production Branch = `development`
4. As variáveis de ambiente precisam ser configuradas separadamente

### Variáveis de ambiente no Vercel

No Vercel Dashboard > Settings > Environment Variables, adicione todas as variáveis do `.env.example`. As que começam com `VITE_` são embutidas no build do frontend.

---

## Deploy do ApexAI Server

O servidor de IA roda em uma PC separada (não na Vercel).

### Setup inicial

```powershell
# Na PC do servidor (C:\apexai)
git clone https://github.com/Fardinando/ApexEnem.git C:\apexai
cd C:\apexai\render
npm install
npm install -g pm2

# Configurar .env
copy .env.example .env
# Edite .env com suas chaves

# Iniciar
pm2 start server.js --name apexai
pm2 save
pm2 startup
```

### Configurar Tailscale Funnel

```powershell
tailscale funnel --bg 3001
# Anota a URL pública (https://xxx.tail1656a6.ts.net)
```

Essa URL é o valor de `RENDER_PROCESS_URL` no Vercel.

### Atualizar o servidor

```powershell
cd C:\apexai
git fetch origin
git checkout origin/main -- render/server.js
copy render\server.js server.js
pm2 restart apexai
```

### Ollama (modelos locais — opcional)

```powershell
cd C:\apexai\render
.\ollama-setup.ps1
```

Instala Ollama e baixa `qwen2.5:0.5b` + `qwen2.5:3b`.

---

## Estrutura do Projeto

```
ApexEnem/
├── api/                        # API routes (Vercel Functions)
│   ├── index.ts                # Todas as rotas Express
│   └── prompts.ts              # Prompts de IA (questões, aulas, etc.)
├── render/                     # ApexAI Server (PC separada)
│   ├── server.js               # Express server com job queue
│   ├── package.json
│   ├── setup.ps1               # Script de setup automatizado
│   ├── ollama-setup.ps1        # Setup dos modelos locais
│   ├── keepalive.ps1           # Watchdog + Tailscale Funnel
│   └── Dockerfile
├── src/
│   ├── components/             # Componentes React
│   │   ├── AuthView.tsx        # Login + Cadastro + Whitelist
│   │   ├── DashboardView.tsx   # Dashboard principal
│   │   ├── PerguntasView.tsx   # Questões IA
│   │   ├── SimuladosView.tsx   # Simulados TRI
│   │   ├── RedacaoView.tsx     # Correção de redação
│   │   ├── AprendizadoView.tsx # Cursinho gamificado
│   │   ├── PerfilView.tsx      # Perfil + TRI
│   │   ├── AdminBetaRequests.tsx # Painel admin beta
│   │   ├── LoadingOverlay.tsx  # Tela de loading global
│   │   ├── MathRenderer.tsx    # Renderização LaTeX/KaTeX
│   │   ├── Logo.tsx            # Logo variants
│   │   └── ...
│   ├── lib/
│   │   ├── supabase.ts         # Cliente Supabase + helpers
│   │   ├── tri.ts              # Motor TRI (3PL, scoring)
│   │   ├── tri-params.ts       # Parâmetros de item
│   │   ├── gamification.ts     # XP, níveis, conquistas
│   │   ├── prompts.ts          # Prompts e loading messages
│   │   ├── student-context.ts  # Fetch dados do aluno
│   │   └── api.ts              # Helpers de API
│   ├── data/
│   │   ├── curriculum.ts       # Matriz ENEM completa
│   │   ├── learning-topics.ts  # Tópicos do cursinho
│   │   ├── learning-exercises.ts # Exercícios pré-definidos
│   │   └── brazil-*.ts         # Dados geográficos BR
│   ├── types.ts                # TypeScript types
│   ├── App.tsx                 # Router + estado global
│   └── main.tsx                # Entry point
├── public/
│   └── logos/                  # 5 variantes do logo
├── supabase-setup.sql          # Schema do banco
├── .env.example                # Variáveis documentadas
├── vite.config.ts              # Config Vite
└── package.json
```

---

## Variáveis de Ambiente

Ver `.env.example` para documentação completa. Resumo:

| Variável | Obrigatória | Escopo |
|---|---|---|
| `SUPABASE_URL` | Sim | Backend |
| `SUPABASE_ANON_KEY` | Sim | Backend |
| `VITE_SUPABASE_URL` | Sim | Frontend |
| `VITE_SUPABASE_ANON_KEY` | Sim | Frontend |
| `VITE_GOOGLE_API_KEY` | Sim | Frontend |
| `HMAC_SECRET` | Sim | Backend |
| `GROQ_API_KEY_V1-V10` | Não | Backend (AI Server) |
| `GOOGLE_API_KEY` | Não | Backend (AI Server) |
| `OPENROUTER_API_KEY_V1-V10` | Não | Backend (AI Server) |
| `SUPABASE_SERVICE_ROLE_KEY` | Não | Backend |
| `VITE_HCAPTCHA_SITE_KEY` | Não | Frontend |
| `VITE_ALLOWED_EMAILS` | Não | Frontend (whitelist) |
| `OLLAMA_URL` | Não | AI Server (modelos locais) |
| `RENDER_PROCESS_URL` | Sim | Backend (URL do AI Server) |

---

## Estrutura de Branches

```
main ──────── Produção (Vercel deploya automaticamente)
  │
development ── Staging / Preview (testes antes do merge)
```

- **main**: Código estável, deploy automático no Vercel
- **development**: Novas features, bugfixes. Abra PR pra preview no Vercel
- Para deploy: `development` → PR → Review → Merge em `main`

---

## API Routes

### Públicas (sem auth)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/correct` | Correção de redação |
| POST | `/api/questions` | Geração de questões |
| POST | `/api/beta-request` | Solicitação de acesso beta |
| GET | `/api/questions/status/:cura` | Status de job de questões |
| GET | `/api/questions/status-batch` | Status de múltiplos jobs |
| GET | `/api/ai-task/:id` | Status de qualquer job |
| GET | `/api/status/:cura` | Status genérico de job |
| GET | `/api/student-context/:userId` | Dados do aluno (para IA) |
| GET | `/api/admin/beta-requests` | Lista de pedidos beta |
| POST | `/api/admin/beta-requests/:id/status` | Aprovar/rejeitar beta |

### Protegidas (requer Bearer token do Supabase)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/lesson-v2` | Geração de aula |
| POST | `/api/chapter-lesson` | Aula por capítulo |
| POST | `/api/questoes-ai` | Questões por matéria |
| POST | `/api/pratica-questoes` | Questões de prática |
| POST | `/api/simulado-explanation` | Explicação pós-simulado |
| GET | `/api/credentials-status` | Status das credenciais |

---

## Banco de Dados (Supabase)

Execute `supabase-setup.sql` no SQL Editor do Supabase para criar todas as tabelas e triggers.

Tabelas principais:
- `profiles` — Perfis dos usuários (auto-criado via trigger)
- `wrong_answers` — Respostas erradas do aluno
- `question_responses` — Respostas a questões ( TRI)
- `essay_corrections` — Correções de redação
- `simulado_history` — Histórico de simulados
- `activity_logs` — Log de atividades
- `learning_progress` — Progresso do cursinho
- `beta_requests` — Solicitações de acesso beta

---

## Licença

Projeto privado. Todos os direitos reservados.
