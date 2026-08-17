# ============================================================
# ApexAI - Setup Completo do Servidor
# Execute este script no PC que vai rodar o ApexAI
# Requer: Windows 10+, PowerShell 7+, Git, Node.js 20+
# ============================================================

param(
  [string]$InstallDir = "C:\apexai",
  [string]$AppName = "apexai",
  [int]$Port = 3001
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) {
  Write-Host "`n>> $msg" -ForegroundColor Cyan
}

function Write-Ok($msg) {
  Write-Host "   OK: $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
  Write-Host "   AVISO: $msg" -ForegroundColor Yellow
}

function Write-Fail($msg) {
  Write-Host "   ERRO: $msg" -ForegroundColor Red
}

# ── 1. Verificar pré-requisitos ─────────────────────────────────
Write-Step "Verificando pre-requisitos"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Fail "Git nao encontrado. Instale: winget install Git.Git"
  exit 1
}
Write-Ok "Git encontrado"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Fail "Node.js nao encontrado. Instale: winget install OpenJS.NodeJS.LTS"
  exit 1
}
$nodeVersion = node --version
Write-Ok "Node.js $nodeVersion encontrado"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Fail "npm nao encontrado"
  exit 1
}
Write-Ok "npm encontrado"

# ── 2. Verificar/Instalar PM2 ───────────────────────────────────
Write-Step "Verificando PM2"
$pm2Found = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2Found) {
  Write-Warn "PM2 nao encontrado. Instalando..."
  npm install -g pm2
  npm install -g pm2-windows-startup
  Write-Ok "PM2 instalado"
} else {
  Write-Ok "PM2 encontrado"
}

# ── 3. Verificar/Instalar Tailscale ─────────────────────────────
Write-Step "Verificando Tailscale"
$tailscaleFound = Get-Command tailscale -ErrorAction SilentlyContinue
if (-not $tailscaleFound) {
  Write-Warn "Tailscale nao encontrado."
  Write-Host "   Instale manualmente: https://tailscale.com/download" -ForegroundColor Yellow
  Write-Host "   Ou rode: winget install Tailscale.Tailscale" -ForegroundColor Yellow
  Write-Host "   Depois execute: tailscale up" -ForegroundColor Yellow
  Write-Host "   E rode este script novamente." -ForegroundColor Yellow
  exit 1
}
Write-Ok "Tailscale encontrado"

# Verificar se esta logado
$tsStatus = & tailscale status 2>&1 | Out-String
if ($tsStatus -match "Logged out" -or $tsStatus -match "NeedsLogin") {
  Write-Warn "Tailscale nao esta logado. Fazendo login..."
  & tailscale up
  Start-Sleep -Seconds 5
}
Write-Ok "Tailscale logado"

# ── 4. Copiar/Atualizar arquivos ────────────────────────────────
Write-Step "Preparando diretorio $InstallDir"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if (Test-Path $InstallDir) {
  Write-Warn "Diretorio $InstallDir ja existe. Atualizando..."
  # Atualizar apenas server.js e keepalive
  Copy-Item (Join-Path $scriptDir "server.js") (Join-Path $InstallDir "server.js") -Force
  Copy-Item (Join-Path $scriptDir "keepalive.ps1") (Join-Path $InstallDir "keepalive.ps1") -Force
  Copy-Item (Join-Path $scriptDir "package.json") (Join-Path $InstallDir "package.json") -Force
} else {
  New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
  Copy-Item (Join-Path $scriptDir "server.js") (Join-Path $InstallDir "server.js")
  Copy-Item (Join-Path $scriptDir "keepalive.ps1") (Join-Path $InstallDir "keepalive.ps1")
  Copy-Item (Join-Path $scriptDir "package.json") (Join-Path $InstallDir "package.json")
}

# ── 5. Instalar dependencias ────────────────────────────────────
Write-Step "Instalando dependencias"
Push-Location $InstallDir
npm install --production
Pop-Location
Write-Ok "Dependencias instaladas"

# ── 6. Criar .env se nao existir ────────────────────────────────
Write-Step "Configurando variaveis de ambiente"
$envFile = Join-Path $InstallDir ".env"
if (-not (Test-Path $envFile)) {
  $template = @"
PORT=$Port
GOOGLE_API_KEY=

GROQ_API_KEY_V1=
GROQ_API_KEY_V2=
GROQ_API_KEY_V3=
GROQ_API_KEY_V4=
GROQ_API_KEY_V5=
GROQ_API_KEY_V6=
GROQ_API_KEY_V7=
GROQ_API_KEY_V8=
GROQ_API_KEY_V9=
GROQ_API_KEY_V10=

OPENROUTER_API_KEY_V1=
OPENROUTER_API_KEY_V2=
OPENROUTER_API_KEY_V3=
OPENROUTER_API_KEY_V4=
OPENROUTER_API_KEY_V5=
OPENROUTER_API_KEY_V6=
OPENROUTER_API_KEY_V7=
OPENROUTER_API_KEY_V8=
OPENROUTER_API_KEY_V9=
OPENROUTER_API_KEY_V10=
"@
  Set-Content -Path $envFile -Value $template -Encoding UTF8
  Write-Warn "Arquivo .env criado em $envFile"
  Write-Host "   Preencha com suas chaves de API!" -ForegroundColor Yellow
  Write-Host "   Depois rode: pm2 start $AppName" -ForegroundColor Yellow
  exit 0
} else {
  Write-Ok "Arquivo .env ja existe"
}

# ── 7. Iniciar com PM2 ─────────────────────────────────────────
Write-Step "Iniciando ApexAI com PM2"
Push-Location $InstallDir

# Parar se ja estiver rodando
& pm2 delete $AppName 2>&1 | Out-Null

# Iniciar
& pm2 start server.js --name $AppName
& pm2 save
& pm2 startup

Pop-Location
Write-Ok "ApexAI iniciado"

# ── 8. Ativar Tailscale Funnel ──────────────────────────────────
Write-Step "Ativando Tailscale Funnel na porta $Port"
try {
  & tailscale funnel $Port 2>&1 | Out-Null
  Start-Sleep -Seconds 3
  Write-Ok "Tailscale Funnel ativo"
} catch {
  Write-Warn "Falha ao ativar Tailscale Funnel. Execute manualmente: tailscale funnel $Port"
}

# ── 9. Verificacao final ───────────────────────────────────────
Write-Step "Verificacao final"
Start-Sleep -Seconds 3

try {
  $r = Invoke-WebRequest -Uri "http://localhost:$Port/api/health" -UseBasicParsing -TimeoutSec 5
  if ($r.StatusCode -eq 200) {
    Write-Ok "ApexAI respondendo na porta $Port"
  }
} catch {
  Write-Fail "ApexAI nao respondeu. Verifique os logs: pm2 logs $AppName"
}

# Pegar URL do Tailscale
try {
  $tsStatus = & tailscale funnel status 2>&1 | Out-String
  if ($tsStatus -match "https://[^\s]+") {
    $url = $Matches[0]
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " URL do ApexAI (configure no Vercel):" -ForegroundColor Green
    Write-Host " $url" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "No Vercel Dashboard, va em Settings > Environment Variables" -ForegroundColor Cyan
    Write-Host "e defina: RENDER_PROCESS_URL = $url" -ForegroundColor Cyan
  }
} catch {}

Write-Host "`nSetup concluido!" -ForegroundColor Green
Write-Host "Para verificar: pm2 status" -ForegroundColor Gray
Write-Host "Para ver logs: pm2 logs $AppName" -ForegroundColor Gray
Write-Host "Para reiniciar: pm2 restart $AppName" -ForegroundColor Gray
