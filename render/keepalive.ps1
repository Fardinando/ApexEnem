# ============================================================
# ApexAI KeepAlive - watchdog do ApexAI via PM2
# Copie este arquivo para a MESMA pasta do server.js na
# maquina onde o ApexAI roda (ex.: C:\ApexEnem\render\).
# Ele encontra server.js sozinho (mesma pasta deste script).
# ============================================================

param(
  [string]$AppName = "apexai",
  [string]$HeartbeatUrl = "http://localhost:3001/api/health",
  [int]$HeartbeatTimeoutSec = 5
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

function Invoke-Pm2([string]$argsLine) {
  try {
    $output = & pm2 $argsLine 2>&1 | Out-String
    return $output
  } catch {
    return "ERRO_PM2: $($_.Exception.Message)"
  }
}

# 1) Ja esta saudavel? Sai sem fazer nada.
if (Test-ApexAIActive) { exit 0 }

Write-Log "[keepalive] ApexAI fora do ar. Tentando reativar..."

# 2) PM2 disponivel?
if (-not (Get-Command pm2.cmd -ErrorAction SilentlyContinue) -and
    -not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
  Write-Log "[keepalive] pm2 nao encontrado no PATH. Instale: npm i -g pm2 e adicione o Node ao PATH."
  exit 1
}

# 3) pm2 resurrect (sobe o daemon e restaura as apps salvas com pm2 save)
Invoke-Pm2 "resurrect" | Out-Null
Start-Sleep -Seconds 3

if (Test-ApexAIActive) {
  Write-Log "[keepalive] ApexAI reativado via pm2 resurrect."
  exit 0
}

# 4) App ainda registrada no PM2? Reinicia; se nao, inicia do zero.
$describe = Invoke-Pm2 "describe $AppName"
if ($describe -match "online|stopped|errored" -and $describe -notmatch "not found") {
  Invoke-Pm2 "restart $AppName" | Out-Null
  Write-Log "[keepalive] pm2 restart $AppName executado."
} else {
  Push-Location $ScriptDir
  Invoke-Pm2 "start `"$AppFile`" --name $AppName" | Out-Null
  Pop-Location
  Invoke-Pm2 "save" | Out-Null
  Write-Log "[keepalive] pm2 start `"$AppFile`" --name $AppName + save executados."
}

Start-Sleep -Seconds 5

if (Test-ApexAIActive) {
  Write-Log "[keepalive] ApexAI operacional."
} else {
  Write-Log "[keepalive] ApexAI AINDA fora do ar. Verifique o servidor manualmente."
  exit 2
}
