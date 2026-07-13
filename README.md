# ToneAI

Tell ToneAI what song you want to sound like. It searches the web for the original recording gear, builds a NUX MightyAmp preset, and saves a QR code you scan straight into the NUX app.

It runs inside your existing AI account — Claude, Gemini, or OpenAI. No API keys. No extra subscription. Download, open, and play.

Real session, asking for Kashmir on a Plug Pro:

![Asking for the tone](assets/toneai-request.png)

![ToneAI's response](assets/toneai-response.png)

![Generated QR](assets/toneai-qr.png)

---

## Getting started

### Install

**macOS / Linux:**
```
curl -fsSL https://cdn.jsdelivr.net/gh/cordfuse/toneai-nux-imprint@latest/install.sh | bash
```

**Windows (PowerShell):**
```
irm https://github.com/cordfuse/toneai-nux-imprint/releases/latest/download/install.ps1 | iex
```

The installer ensures Bun is available, downloads ToneAI, and prints the launch command. Requires an AI agent CLI to be installed first (see Requirements).

### Launch

```
cd ~/toneai
claude        # or: gemini / agy / codex / opencode
```

**Supported agents (any desktop OS):**

| Agent | Command |
|---|---|
| Claude Code | `claude` |
| Gemini CLI | `gemini` *(⚠ OAuth/Google-One unpaid tier sunsets 2026-06-18 — migrate to Antigravity below)* |
| Antigravity CLI | `agy` *(Google's official Gemini CLI successor)* |
| Codex CLI | `codex` |
| OpenCode | `opencode` |

On first launch ToneAI asks which NUX device you have, where to save QR images, and whether you play guitar or bass. After that it goes straight to work each session.

## Claude web and mobile — the Claude Skill

No install, no CLI, works on your phone.

1. Download **`toneai-nux-skill-v<version>.zip`** from the [latest release](https://github.com/cordfuse/toneai-nux-imprint/releases/latest) — the small one, about 600 KB.
2. At **claude.ai → Settings → Capabilities → Skills**, click **Upload skill** and pick the ZIP. Don't unzip it.
3. That's it. ToneAI is in every chat from then on, web and mobile.

The skill carries its own QR generator and runs entirely inside Claude's sandbox — no network, no dependencies. Presets are byte-identical to the desktop app's: it is the same encoder. It asks once which NUX device and pickups you have, then remembers.

Skills need a paid Claude plan (Pro, Max, Team, or Enterprise).

### Not supported

| Surface | Status |
|---|---|
| Claude Desktop (Chat / Cowork / Projects) | ❌ Hardened against persona injection — refuses pipe install, blocks IMPRINT.md as a jailbreak vector, Cowork has a locked system prompt |
| ChatGPT Desktop | ❌ Sandboxed — no local network or filesystem access |
| Gemini Desktop | ❌ Requires manual project seeding each session — not viable as a recurring tool |
| Claude Projects | ❌ ZIP uploads not accepted — use the Skill above |
| ChatGPT web | ❌ Safety layer rejects the persona-takeover pattern |
| Gemini web | ❌ Emits a JSON output file instead of running as ToneAI |

If none of these fit, use the [Mighty AI QR web app](https://mighty-ai-qr-web.onrender.com) — same NUX-tone-from-prompt experience, browser-hosted, no install.

---

## How it works

You give ToneAI a song, an album, or just an artist name. It searches for the original recording gear — which amp, which guitar, which effects — then maps that to the closest available models on your device. The preset comes out as a decorated PNG QR code saved to your output folder.

Scan it in the NUX app and you're playing.

```
ToneAI: What song or artist are we dialling in?

You: Comfortably Numb

ToneAI: Gilmour used a Hiwatt DR103 into a Hi Watt 4x12 for the solos,
        with a Colorsound Power Boost and CE-2 chorus. On the Plug Pro
        I'm mapping that to the Brit 100 amp, a touch of chorus in the
        efx slot, and a long plate reverb. Single coils on the Strat,
        so I've nudged the gain up slightly and raised the noise gate.
        Generating...

        Saved to ~/Documents/ToneAI/PinkFloyd-ComfortablyNumb.png
        Scan it in the NUX app. How does it sound?
```

ToneAI keeps a roster of your instruments. Switch mid-session and it recalibrates:

```
You: Grabbing the Les Paul

ToneAI: Switching to the Les Paul — pulling back gain a touch for humbuckers.
```

For albums, one request generates a full set — one preset per track, researched individually.

---

## Supported devices

**Pro format** (full effect chain, preset name embedded in QR):
`Plug Pro` · `Space` · `Lite MK2` · `8BT MK2` · `20BT MK2` · `40BT MK2` · `60BT MK2`

**Standard format** (device-specific effect IDs):
`Plug Air V1/V2` · `Mighty Air V1/V2` · `Mighty Go` · `Lite` · `8BT` · `20/40BT (original)` · `40BT (original)`

Bass players: BassMate amp, TR212Pro cab, compressor always on.

---

## Requirements

- An AI agent CLI with an active account ([Claude Code](https://claude.ai/download), [Gemini CLI](https://github.com/google-gemini/gemini-cli), [Antigravity CLI](https://github.com/google-antigravity/antigravity-cli), [Codex](https://platform.openai.com/codex), or [OpenCode](https://opencode.ai))
- Node.js
- A NUX MightyAmp device and the NUX app to scan QR codes

---

<sub>Built on [Imprint](https://github.com/cordfuse/imprint)</sub>
