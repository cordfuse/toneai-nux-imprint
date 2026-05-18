#!/usr/bin/env bash
# ToneAI installer — macOS / Linux
#
# Usage:
#   curl -fsSL https://github.com/steve-krisjanovs/toneai-nux-imprint/releases/latest/download/install.sh | bash
#
# What this does:
#   1. Ensures Bun is installed (installs if missing)
#   2. Downloads the ToneAI setup wizard (TypeScript source)
#   3. Runs the wizard, which downloads ToneAI itself and prints how to launch it

set -e

REPO="steve-krisjanovs/toneai-nux-imprint"
CDN="https://cdn.jsdelivr.net/gh/${REPO}@latest"
WIZARD_URL="${CDN}/setup/src/index.ts"
WIZARD_DIR="${HOME}/.toneai-nux"
WIZARD_PATH="${WIZARD_DIR}/wizard.ts"

# ── Banner ──────────────────────────────────────────────────────────────────
printf '\n  \033[1mToneAI installer\033[0m\n'
printf '  AI-powered NUX MightyAmp tone assistant — no API key required\n\n'

# ── OS check ────────────────────────────────────────────────────────────────
case "$(uname -s)" in
  Darwin*|Linux*) ;;
  *)
    printf '  \033[31mUnsupported OS.\033[0m Use install.ps1 on Windows:\n'
    printf '    irm https://github.com/%s/releases/latest/download/install.ps1 | iex\n\n' "$REPO"
    exit 1
    ;;
esac

# ── Bun check / install ─────────────────────────────────────────────────────
if ! command -v bun >/dev/null 2>&1; then
  printf '  Bun runtime not found — installing...\n\n'
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="${HOME}/.bun"
  export PATH="${BUN_INSTALL}/bin:${PATH}"
  if ! command -v bun >/dev/null 2>&1; then
    printf '\n  \033[31mBun install failed.\033[0m Install manually from https://bun.sh and re-run.\n\n'
    exit 1
  fi
  printf '\n  \033[32m✓\033[0m Bun installed\n'
fi

# ── Fetch wizard ────────────────────────────────────────────────────────────
mkdir -p "$WIZARD_DIR"
printf '  Fetching setup wizard...\n'
if ! curl -fsSL "$WIZARD_URL" -o "$WIZARD_PATH"; then
  printf '\n  \033[31mFailed to download setup wizard.\033[0m Check your connection and try again.\n\n'
  exit 1
fi

# ── Run wizard ──────────────────────────────────────────────────────────────
# Redirect stdin to /dev/tty so the wizard's prompts work even when this
# script is invoked via `curl ... | bash` (curl pipe owns stdin otherwise).
printf '\n'
exec bun "$WIZARD_PATH" </dev/tty
