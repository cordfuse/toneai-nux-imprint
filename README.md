# ToneAI

Tell ToneAI what song you want to sound like. It searches the web for the original recording gear, builds a NUX MightyAmp preset, and saves a QR code you scan straight into the NUX app.

It runs inside your existing AI account — Claude, Gemini, or OpenAI. No API keys. No extra subscription. Download, open, and play.

---

## Getting started

Two install paths — setup wizard for non-developers, CLI for developers. Both run on any desktop OS.

### Path 1 — Setup wizard (recommended for non-developers)

| Platform | Install |
|---|---|
| **Windows** | Download and run `toneai-setup.exe` from [Releases](../../releases) |
| **macOS** | `brew tap steve-krisjanovs/tools && brew install toneai-setup && toneai-setup` |
| **Linux (Debian/Ubuntu)** | `sudo dpkg -i toneai-setup_*_amd64.deb` |
| **Linux (Fedora/RHEL)** | `sudo rpm -i toneai-setup-*-1.x86_64.rpm` |

The wizard handles agent install, project location, and first-launch defaults. No terminal experience required after `toneai-setup` runs.

### Path 2 — Desktop CLI (developers)

1. Download `*-desktop-v*.zip` from [Releases](../../releases)
2. Extract it and open the folder in any supported agent CLI
3. Say hello — ToneAI handles the rest

**Supported agents (any desktop OS):**

| Agent | Command | Notes |
|---|---|---|
| Claude Code | `claude` | Anthropic's CLI; works in any terminal, including Claude Desktop's built-in CLI |
| Gemini CLI | `gemini` | Google's official CLI |
| Codex CLI | `codex` | OpenAI's CLI |
| OpenCode | `opencode` | Open-source alternative |

On first launch ToneAI asks which NUX device you have, where to save QR images, and whether you play guitar or bass. After that it goes straight to work each session.

### Not supported

Web/mobile chat clients are not viable for ToneAI as a recurring tool. Tested 2026-05-04:

| Surface | Status |
|---|---|
| Claude.ai web/mobile chat | ⚠️ Technically works as a one-off (attach ZIP, send prompt), but each new chat requires re-attaching and re-prompting. Use Path 1 or Path 2 for repeat use. |
| Claude Projects | ❌ ZIP uploads not accepted; GitHub-as-knowledge connection doesn't run as the persona |
| ChatGPT web | ❌ Safety layer rejects the persona-takeover pattern |
| Gemini web | ❌ Emits a JSON output file instead of running as ToneAI |

If you can't install Path 1 or Path 2, ToneAI isn't the right shape for your environment. Use the [Mighty AI QR web app](https://mighty-ai-qr-web.onrender.com) — same NUX-tone-from-prompt experience, browser-hosted, no install.

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
`Plug Pro` · `Space` · `Lite MK2` · `8BT MK2`

**Standard format** (device-specific effect IDs):
`Plug Air V1/V2` · `Mighty Air V1/V2` · `Lite` · `8BT` · `2040BT`

Bass players: BassMate amp, TR212Pro cab, compressor always on.

---

## Requirements

- An AI agent CLI with an active account ([Claude Code](https://claude.ai/download), [Gemini CLI](https://github.com/google-gemini/gemini-cli), [Codex](https://platform.openai.com/codex), or [OpenCode](https://opencode.ai))
- Node.js — or let ToneAI install a portable copy if you don't have it
- A NUX MightyAmp device and the NUX app to scan QR codes

---

<sub>Built on [IronBound](https://github.com/cordfuse/ironbound)</sub>
