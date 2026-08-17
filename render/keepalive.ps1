# ============================================================
# ApexAI KeepAlive - watchdog do ApexAI via PM2 + Tailscale
# Copie este arquivo para a MESMA pasta do server.js na
# maquina onde o ApexAI roda (ex.: C:\apexai\).
# ============================================================

param(
  [string]$AppName = "apexai",
  [string]$HeartbeatUrl = "http://localhost:3001/api/health",
  [int]$HeartbeatTimeoutSec = 5,
  [string]$TailscaleFunnelPort = "3001"
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppFile   = Join-Path $ScriptDir "server.js"
$LogFile   = Join-Path $ScriptDir "keepalive.log"

function Write-Log($msg) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
  Write-Output $line
  Add-Content -Path $LogFile -Value $line -Encoding utf8
}

function Test-ApexAIActive {
  try {
    $r = Invoke-WebRequest -Uri $HeartbeatUrl -UseBasicParsing -TimeoutSec $HeartbeatTimeoutSec
    return $r.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Test-TailscaleFunnel {
  try {
    $output = & tailscale funnel status 2>&1 | Out-String
    return $output -match "http://localhost:$TailscaleFunnelPort"
  } catch {
    return $false
  }
}

function Invoke-Pm2([string]$argsLine) {
  try {
    $output = & pm2 $argsLine 2>&1 | Out-String
    return $output
  } catch {
    return "ERRO_PM2: $($_.Exception.Message)"
  }
}

# 1) ApexAI saudavel? Sair.
if (Test-ApexAIActive) {
  # Verificar Tailscale Funnel tambem
  if (-not (Test-TailscaleFunnel)) {
    Write-Log "[keepalive] ApexAI ativo mas Tailscale Funnel ausente. Reativando..."
    try {
      & tailscale funnel $TailscaleFunnelPort 2>&1 | Out-Null
      Write-Log "[keepalive] Tailscale Funnel reativado na porta $TailscaleFunnelPort."
    } catch {
      Write-Log "[keepalive] Falha ao reativar Tailscale Funnel: $($_.Exception.Message)"
    }
  }
  exit 0
}

Write-Log "[keepalive] ApexAI fora do ar. Tentando reativar..."

# 2) PM2 disponivel?
if (-not (Get-Command pm2.cmd -ErrorAction SilentlyContinue) -and
    -not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
  Write-Log "[keepalive] pm2 nao encontrado no PATH. Instale: npm i -g pm2"
  exit 1
}

# 3) pm2 resurrect
Invoke-Pm2 "resurrect" | Out-Null
Start-Sleep -Seconds 3

if (Test-ApexAIActive) {
  Write-Log "[keepalive] ApexAI reativado via pm2 resurrect."
} else {
  # 4) Restart ou start
  $describe = Invoke-Pm2 "describe $AppName"
  if ($describe -match "online|stopped|errored" -and $describe -notmatch "not found") {
    Invoke-Pm2 "restart $AppName" | Out-Null
    Write-Log "[keepalive] pm2 restart $AppName executado."
  } else {
    Push-Location $ScriptDir
    Invoke-Pm2 "start `"$AppFile`" --name $AppName" | Out-Null
    Pop-Location
    Invoke-Pm2 "save" | Out-Null
    Write-Log "[keepalive] pm2 start $AppName + save executados."
  }
  Start-Sleep -Seconds 5
}

# 5) Reativar Tailscale Funnel se necessario
if (-not (Test-TailscaleFunnel)) {
  Write-Log "[keepalive] Ativando Tailscale Funnel na porta $TailscaleFunnelPort..."
  try {
    Start-Process tailscale -ArgumentList "funnel", $TailscaleFunnelPort -NoNewWindow -PassThru
    Start-Sleep -Seconds 5
    Write-Log "[keepalive] Tailscale Funnel iniciado."
  } catch {
    Write-Log "[keepalive] Falha ao iniciar Tailscale Funnel: $($_.Exception.Message)"
  }
}

# 6) Verificacao final
Start-Sleep -Seconds 3
if (Test-ApexAIActive) {
  Write-Log "[keepalive] ApexAI operacional."
  if (Test-TailscaleFunnel) {
    Write-Log "[keepalive] Tailscale Funnel ativo."
  } else {
    Write-Log "[keepalive] AVISO: Tailscale Funnel pode nao estar ativo."
  }
} else {
  Write-Log "[keepalive] ApexAI AINDA fora do ar. Verifique manualmente."
  exit 2
}
