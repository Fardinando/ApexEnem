# ============================================================
# ApexAI - Setup do Ollama para modelos locais
# Instala Ollama + baixa modelos qwen2.5:0.5b e qwen2.5:3b
# Requer: Windows 10+, PowerShell 7+, ~4GB RAM livre
# ============================================================

param(
  [string]$OllamaModels = "qwen2.5:0.5b,qwen2.5:3b",
  [int]$Port = 11434
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

# ── 1. Verificar se Ollama ja esta instalado ──────────────────────
Write-Step "Verificando Ollama"

$ollamaFound = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollamaFound) {
  Write-Warn "Ollama nao encontrado. Instalando..."

  # Tentar via winget primeiro
  $wingetFound = Get-Command winget -ErrorAction SilentlyContinue
  if ($wingetFound) {
    Write-Host "   Instalando via winget..." -ForegroundColor Gray
    winget install Ollama.Ollama --accept-source-agreements --accept-package-agreements
  } else {
    # Download manual
    Write-Host "   winget nao encontrado. Fazendo download manual..." -ForegroundColor Gray
    $downloadUrl = "https://ollama.com/download/OllamaSetup.exe"
    $installerPath = Join-Path $env:TEMP "OllamaSetup.exe"
    try {
      Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
      Write-Host "   Baixado OllamaSetup.exe. Iniciando instalacao..." -ForegroundColor Gray
      Start-Process -FilePath $installerPath -Wait
    } catch {
      Write-Fail "Falha ao baixar Ollama. Baixe manualmente: https://ollama.com/download"
      exit 1
    }
  }

  # Recarregar PATH
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
  $ollamaFound = Get-Command ollama -ErrorAction SilentlyContinue
  if (-not $ollamaFound) {
    Write-Fail "Ollama instalado mas nao encontrado no PATH. Abra um novo terminal e execute este script novamente."
    exit 1
  }
  Write-Ok "Ollama instalado"
} else {
  Write-Ok "Ollama encontrado"
}

# ── 2. Iniciar servico Ollama ─────────────────────────────────────
Write-Step "Verificando servico Ollama"

$ollamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if (-not $ollamaProcess) {
  Write-Warn "Ollama nao esta rodando. Iniciando..."
  Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden
  Start-Sleep -Seconds 5

  # Verificar se iniciou
  $ollamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
  if (-not $ollamaProcess) {
    Write-Fail "Nao foi possivel iniciar o Ollama. Execute manualmente: ollama serve"
    exit 1
  }
}
Write-Ok "Ollama rodando"

# ── 3. Verificar conectividade ────────────────────────────────────
Write-Step "Testando conexao com Ollama"

$retries = 0
$maxRetries = 10
$connected = $false
while ($retries -lt $maxRetries -and -not $connected) {
  try {
    $health = Invoke-WebRequest -Uri "http://localhost:$Port/api/tags" -UseBasicParsing -TimeoutSec 5
    if ($health.StatusCode -eq 200) {
      $connected = $true
    }
  } catch {
    $retries++
    Start-Sleep -Seconds 2
  }
}

if (-not $connected) {
  Write-Fail "Ollama nao respondeu em http://localhost:$Port"
  exit 1
}
Write-Ok "Ollama respondendo na porta $Port"

# ── 4. Baixar modelos ─────────────────────────────────────────────
Write-Step "Baixando modelos: $OllamaModels"

$modelList = $OllamaModels -split ","
foreach ($model in $modelList) {
  $model = $model.Trim()
  if (-not $model) { continue }

  Write-Host "   Baixando $model ..." -ForegroundColor Gray
  try {
    & ollama pull $model
    Write-Ok "Modelo $model pronto"
  } catch {
    Write-Fail "Falha ao baixar $model"
    Write-Host "   Execute manualmente: ollama pull $model" -ForegroundColor Yellow
  }
}

# ── 5. Verificar modelos instalados ───────────────────────────────
Write-Step "Modelos instalados"

try {
  $tags = & ollama list 2>&1 | Out-String
  Write-Host $tags -ForegroundColor Gray
} catch {
  Write-Warn "Nao foi possivel listar modelos"
}

# ── 6. Criar processo PM2 para Ollama (opcional) ──────────────────
Write-Step "Configurando auto-start do Ollama"

$pm2Found = Get-Command pm2 -ErrorAction SilentlyContinue
if ($pm2Found) {
  & pm2 delete ollama 2>&1 | Out-Null

  # Encontrar caminho do ollama
  $ollamaPath = (Get-Command ollama).Source
  & pm2 start $ollamaPath --name ollama -- serve
  & pm2 save

  Write-Ok "Ollama registrado no PM2 (inicia automaticamente)"
} else {
  Write-Warn "PM2 nao encontrado. Ollama NAO iniciara automaticamente."
  Write-Host "   Para auto-start, instale PM2 e rode:" -ForegroundColor Yellow
  Write-Host "   pm2 start ollama --name ollama -- serve" -ForegroundColor Yellow
  Write-Host "   pm2 save && pm2 startup" -ForegroundColor Yellow

  # Criar tarefa agendada como alternativa
  Write-Host ""
  Write-Host "   Alternativa: criando tarefa agendada do Windows..." -ForegroundColor Gray
  try {
    $action = New-ScheduledTaskAction -Execute "ollama.exe" -Argument "serve"
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero)
    Register-ScheduledTask -TaskName "OllamaServe" -Action $action -Trigger $trigger -Settings $settings -Description "Inicia o Ollama automaticamente" -Force | Out-Null
    Write-Ok "Tarefa agendada 'OllamaServe' criada"
  } catch {
    Write-Warn "Falha ao criar tarefa agendada. Ollama precisa ser iniciado manualmente."
  }
}

# ── 7. Informacoes finais ────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Setup do Ollama concluido!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Modelos disponiveis:" -ForegroundColor Cyan
Write-Host "  - qwen2.5:0.5b  (contexto do aluno, rapido)" -ForegroundColor Gray
Write-Host "  - qwen2.5:3b    (geracao de ensino)" -ForegroundColor Gray
Write-Host ""
Write-Host "API local: http://localhost:$Port" -ForegroundColor Cyan
Write-Host ""
Write-Host "No arquivo .env do ApexAI, adicione:" -ForegroundColor Yellow
Write-Host "  OLLAMA_URL=http://127.0.0.1:$Port" -ForegroundColor Gray
Write-Host ""
Write-Host "Teste rapido:" -ForegroundColor Cyan
Write-Host '  ollama run qwen2.5:0.5b "Ola, tudo bem?"' -ForegroundColor Gray
Write-Host ""
Write-Host "Verificar modelos instalados: ollama list" -ForegroundColor Gray
Write-Host "Remover modelo: ollama rm qwen2.5:0.5b" -ForegroundColor Gray
