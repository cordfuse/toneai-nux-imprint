# ToneAI installer — Windows (PowerShell)
#
# Usage:
#   irm https://github.com/steve-krisjanovs/toneai-nux/releases/latest/download/install.ps1 | iex
#
# What this does:
#   1. Ensures Bun is installed (installs if missing)
#   2. Downloads the ToneAI setup wizard (TypeScript source)
#   3. Runs the wizard, which downloads ToneAI itself and prints how to launch it

$ErrorActionPreference = "Stop"

$Repo       = "steve-krisjanovs/toneai-nux"
$WizardUrl  = "https://github.com/$Repo/releases/latest/download/toneai-nux.ts"
$WizardDir  = Join-Path $env:USERPROFILE ".toneai-nux"
$WizardPath = Join-Path $WizardDir "wizard.ts"

# ── Banner ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ToneAI installer" -ForegroundColor White
Write-Host "  AI-powered NUX MightyAmp tone assistant - no API key required"
Write-Host ""

# ── Bun check / install ─────────────────────────────────────────────────────
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Host "  Bun runtime not found - installing..."
    Write-Host ""
    Invoke-Expression (Invoke-RestMethod https://bun.sh/install.ps1)
    $env:Path = "$env:USERPROFILE\.bun\bin;$env:Path"
    if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
        Write-Host ""
        Write-Host "  Bun install failed." -ForegroundColor Red
        Write-Host "  Install manually from https://bun.sh and re-run."
        Write-Host ""
        exit 1
    }
    Write-Host ""
    Write-Host "  [OK] Bun installed" -ForegroundColor Green
}

# ── Fetch wizard ────────────────────────────────────────────────────────────
if (-not (Test-Path $WizardDir)) {
    New-Item -ItemType Directory -Path $WizardDir -Force | Out-Null
}

Write-Host "  Fetching setup wizard..."
try {
    Invoke-WebRequest -Uri $WizardUrl -OutFile $WizardPath -UseBasicParsing
} catch {
    Write-Host ""
    Write-Host "  Failed to download setup wizard." -ForegroundColor Red
    Write-Host "  Check your connection and try again."
    Write-Host ""
    exit 1
}

# ── Run wizard ──────────────────────────────────────────────────────────────
Write-Host ""
& bun $WizardPath
