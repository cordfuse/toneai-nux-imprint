# ToneAI

Tell ToneAI what song you want to sound like. It searches the web for the original recording gear, builds a NUX MightyAmp preset, and saves a QR code you scan straight into the NUX app.

It runs inside your existing AI account — Claude, Gemini, or OpenAI. No API keys. No extra subscription. Download, open, and play.

---

## Getting started

Three install paths — pick the one that fits.

### Setup wizard (recommended for non-developers)

| Platform | Install |
|---|---|
| **Windows** | Download and run `toneai-setup.exe` from [Releases](../../releases) |
| **macOS** | `brew tap steve-krisjanovs/tools && brew install toneai-setup && toneai-setup` |
| **Linux (Debian/Ubuntu)** | `sudo dpkg -i toneai-setup_*_amd64.deb` |
| **Linux (Fedora/RHEL)** | `sudo rpm -i toneai-setup-*-1.x86_64.rpm` |

The wizard handles agent install, project location, and first-launch defaults. No terminal experience required after `toneai-setup` runs.

### Single-prompt install for chat web (no download, no upload)

For **Claude.ai**, **ChatGPT**, or **Gemini web**:

1. Open [`toneai-web-install-v*.txt`](../../releases/latest) from the latest release
2. Select all (Ctrl-A / Cmd-A), copy
3. Paste into your chat client of choice
4. Hit send. ToneAI is ready in that chat.

One file, one paste, one send. No project setup, no ZIP upload required.

### Desktop CLI (developers, lean download)

1. Download `*-desktop-v*.zip` from [Releases](../../releases)
2. Extract it and open a terminal in that folder
3. Run your agent CLI: `claude`, `gemini`, `codex`, or `opencode`
4. Say hello — ToneAI handles the rest

### Full bundle (mobile-compatible, ~27MB)

For Claude.ai / ChatGPT mobile **projects** where the single-prompt paste is too long for the input field:

1. Download `*-v*.zip` (the larger one)
2. Upload it as a project knowledge file
3. Prompt: *"Extract this ZIP. Read CLAUDE.md and follow its instructions. Say hello."* (use AGENTS.md for ChatGPT)

On first launch ToneAI asks which NUX device you have, where to save QR images, and whether you play guitar or bass. After that it goes straight to work each session.

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
