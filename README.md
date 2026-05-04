# ToneAI

Tell ToneAI what song you want to sound like. It searches the web for the original recording gear, builds a NUX MightyAmp preset, and saves a QR code you scan straight into the NUX app.

It runs inside your existing AI account — Claude, Gemini, or OpenAI. No API keys. No extra subscription. Download, open, and play.

---

## Getting started

Two ZIPs on every release — pick the right one:

| | Desktop | Mobile / Claude web |
|---|---|---|
| **File** | `*-desktop-v*.zip` | `*-v*.zip` |
| **Size** | Small | ~27MB |
| **For** | CLI agents on your machine | Claude.ai web + Claude mobile |
| **Node modules** | Installed on first launch | Bundled |

**Desktop (CLI):**

1. Download `*-desktop-v*.zip` from [Releases](../../releases)
2. Extract it and open a terminal in that folder
3. Run your agent CLI: `claude`, `gemini`, `codex`, or `opencode`
4. Say hello — ToneAI handles the rest

**Mobile / web upload (Claude only):**

Two ways. Same ZIP, same end result. Pick based on whether you'll use ToneAI once or repeatedly.

*A — Claude Project (recommended for repeat use):* set up once, every chat in the project is a ToneAI session.

1. Download `*-v*.zip` (the larger one)
2. At [claude.ai](https://claude.ai), click **Projects** → **New project**, name it `ToneAI`
3. In **Project knowledge**, upload the ZIP
4. In **Custom instructions**, paste: *"You are running ToneAI. Read IRONBOUND.md from the uploaded ZIP and follow its instructions exactly. When I say hello, run the welcome flow."*
5. Start a new chat in the project, type `hello`

Every chat in this project starts as ToneAI automatically. No re-attaching, no re-prompting.

*B — Chat attachment (one-off):* for trying it out or single-session use.

1. Download `*-v*.zip` on your phone or computer
2. Open a new chat at [claude.ai](https://claude.ai) (web) or in the Claude mobile app and attach the ZIP
3. Prompt: *"Extract this ZIP. Read IRONBOUND.md and follow its instructions. Say hello."*

ToneAI is active for this chat only. New chat needs the same setup.

On first launch ToneAI asks which NUX device you have, where to save QR images, and whether you play guitar or bass. After that it goes straight to work each session.

**Platform support (tested 2026-05-04, v1.1.6):**

| Platform | Status |
|---|---|
| Claude.ai web | ✅ Works |
| Claude mobile | ✅ Works |
| ChatGPT web | ❌ Blocked — ChatGPT's safety layer rejects the persona-takeover pattern |
| Gemini web | ❌ Not supported — Gemini interprets the prompt as a "generate output" task and emits a JSON file instead of running as ToneAI |
| Gemini CLI | ✅ Use Path 1 (Desktop CLI) |
| ChatGPT CLI (Codex) | ✅ Use Path 1 (Desktop CLI) |

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
