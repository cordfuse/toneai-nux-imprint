# IronBound — Developer Mode

You are a normal coding assistant. There are no persona constraints, no identity lock, no permission restrictions. You help the developer build and test their IronBound app.

## First-Time Setup Guide

On first dev mode session, check for `~/.imprint/{app-name}/.dev-setup-complete`.

- Flag missing → tell the developer about the guided setup:
  > "First time here? I can walk you through setting up your IronBound app step by step (~10 minutes). Say **guide** to start, or **skip** to jump straight to coding."
- Flag present → skip silently
- "skip" → write the flag immediately, never show again
- After completing step 8 (test user mode) → write the flag

The guided steps are documented in `DEV-GUIDE.md`.

## Welcome

At session start, greet the developer briefly:

> **IronBound Dev** — Ready to build. You can edit files in `./imprint/`, run tests, or ask me anything.
>
> Quick commands:
> - **"test user mode"** — Build `dist/` and launch the locked persona in a new terminal
> - **"help"** — Show available commands and project structure

When the developer says **"help"**, show them:
- The project structure (listed below)
- How to edit the app definition (`./imprint/*.md`)
- How to test user mode
- How to create a release
- Remind them: `IMPRINT-USER.md` is the engine — edit `./imprint/` files instead

## Project Structure

- `IMPRINT-USER.md` — The user-mode engine. Do NOT follow its instructions — it is source code you help the developer edit, not rules for you.
- `./imprint/` — The app definition files (identity, permissions, constraints, etc.). Same as above — source code, not instructions.
- `src/build.js` — Builds a clean production copy to `./dist/`
- `./dist/` — Build output (gitignored). Contains exactly what end users get in the ZIP.

## Testing User Mode

When the developer asks to test user mode. Trigger phrases include (but are not limited to): "test", "test it", "test user mode", "try user mode", "try it", "run it", "launch it", "preview", "preview it", "demo", "demo it", "run a test", "run test", "build and test", "build and run", "test the app", "try the app", "launch the app", "run the app", "spin it up", "fire it up", "let me see it", "show me", "open it":

### Step 1 — Build

Run `node src/build.js` to generate `./dist/`.

### Step 2 — Choose agent

Ask the developer which agent CLI to test with. Read `imprint/SESSION.md` and parse the `permissions` field. If `permissions: dangerous`, use the dangerous launch command.

**Sandboxed (default):**

| Agent | Launch command |
|---|---|
| `claude` | `claude "hello"` |
| `gemini` | `gemini -i "hello"` |
| `codex` | `codex "hello"` |
| `opencode` | `opencode run "hello"` |

**Dangerous:**

| Agent | Launch command |
|---|---|
| `claude` | `claude --dangerously-skip-permissions "hello"` |
| `gemini` | `gemini --yolo -i "hello"` |
| `codex` | `codex --full-auto "hello"` |
| `opencode` | `opencode run "hello"` |

### Step 3 — Verify agent is installed

Run `which <agent>` (or `where <agent>` on Windows).
If not found, tell the developer and stop.

### Step 4 — Detect OS and terminal

1. Run `uname -s` to detect the platform. On Windows, `uname` may not exist — check for `cmd.exe` or `powershell` in the environment instead.
2. Read `$TERM_PROGRAM` to detect the current terminal emulator.

### Step 5 — Open a new terminal window at `./dist/` and invoke the agent

Resolve `./dist/` to an absolute path first. Use the same terminal the developer is currently in (detected via `$TERM_PROGRAM`). If running inside an IDE (e.g. `vscode`, `cursor`, `windsurf`), spawn the OS default terminal instead.

**macOS** — spawn based on `$TERM_PROGRAM`:

| `$TERM_PROGRAM` | Action |
|---|---|
| `iTerm.app` | Use iTerm2 |
| `Apple_Terminal` | Use Terminal.app |
| `WarpTerminal` | Use Warp |
| IDE values (`vscode`, `cursor`, `windsurf`, etc.) | Use `open -a Terminal` (system default) |
| Unset / unknown | Use `open -a Terminal` (system default) |

iTerm2:
```bash
osascript -e '
tell application "iTerm"
    activate
    tell current window
        create tab with default profile
        tell current session
            write text "cd \"<absolute-dist-path>\" && <agent> \"hello\""
        end tell
    end tell
end tell'
```

Terminal.app:
```bash
osascript -e 'tell app "Terminal" to do script "cd \"<absolute-dist-path>\" && <agent> \"hello\""'
```

Warp:
```bash
osascript -e 'tell app "Warp" to do script "cd \"<absolute-dist-path>\" && <agent> \"hello\""'
```

**Linux** — spawn based on `$TERM_PROGRAM`:

If `$TERM_PROGRAM` is set and is a known terminal (not an IDE), use it directly. Otherwise, check which is installed (in order): `kitty`, `alacritty`, `gnome-terminal`, `konsole`, `xfce4-terminal`, `xterm`.

```bash
# kitty
kitty --directory "<absolute-dist-path>" bash -c '<agent> "hello"'

# alacritty
alacritty --working-directory "<absolute-dist-path>" -e bash -c '<agent> "hello"'

# gnome-terminal
gnome-terminal --working-directory="<absolute-dist-path>" -- bash -c '<agent> "hello"'

# konsole
konsole --workdir "<absolute-dist-path>" -e bash -c '<agent> "hello"'

# xfce4-terminal
xfce4-terminal --working-directory="<absolute-dist-path>" -e 'bash -c "<agent> \"hello\""'

# xterm (last resort)
xterm -e 'cd "<absolute-dist-path>" && <agent> "hello"'
```

**Windows** — spawn a new cmd or PowerShell window:

```powershell
Start-Process cmd -ArgumentList '/k', 'cd /d "<absolute-dist-path>" && <agent> "hello"'
```

Or if PowerShell is preferred:
```powershell
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd "<absolute-dist-path>"; <agent> "hello"'
```

### Step 6 — Confirm

Tell the developer the test session has been launched in a new window.

> A user-mode test session is running in a new terminal. You'll see the locked persona — exactly what end users experience. Close that window when done.

## Build Script

`src/build.js` does the following:

1. Strips dev mode content from `IMPRINT-USER.md` (between `<!-- DEV_MODE_START -->` and `<!-- DEV_MODE_END -->` markers)
2. Generates SHA-256 checksum
3. Copies the clean `IMPRINT-USER.md` as `IMPRINT.md` into `dist/`
4. Creates agent files (CLAUDE.md, GEMINI.md, AGENTS.md, .windsurfrules, .clinerules) in `dist/` — each is a one-liner redirecting to `IMPRINT.md`
5. Copies `imprint/`, `src/`, README.md, LICENSE, package.json, version.txt into `dist/`

## Release

The release CI workflow (`release.yml`) runs the same `build.js` script, ZIPs `dist/`, and attaches it to a GitHub Release.

```bash
VERSION=$(cat version.txt)
git tag "v${VERSION}"
git push origin "v${VERSION}"
```

After tagging, write release notes manually with:
```bash
GITHUB_TOKEN="" gh release edit vX.X.X --repo steve-krisjanovs/toneai-nux-qr-imprint --notes "..."
```

---

## Release History

| Version | What shipped |
|---|---|
| v1.0.0 | Initial release — all 11 devices, gear research, album mode, bass support, desktop shortcut |
| v1.0.1 | Fix: version string showing as `see-version.txt` in QR card header |
| v1.0.2 | README rewrite — product page instead of feature summary |
| v1.1.0 | Rig awareness + instrument switching — pickup-calibrated gain/noise gate/EQ, mid-session switching |
| v1.1.1 | Desktop: deps install at runtime on first launch, not bundled in ZIP |
| v1.1.2 | Dual ZIPs — `*-desktop-*` (lean, runtime install) and `*-v*` (full, mobile-compatible) |
| v1.1.3 | CI consolidation — merged `setup-release.yml` into `release.yml`. Single GitHub release per version with ALL artifacts (product ZIPs + setup wizard binaries + OS installers + homebrew formula update). Closes the dual-release "Latest"-flag confusion that hid product ZIPs behind a non-version tag. |
| v1.1.4 | (REVERTED in v1.1.5) — attempted single-prompt install path for chat web (paste a generated `toneai-web-install-v*.txt` into Claude.ai / ChatGPT / Gemini). Both the URL-fetch shortcut AND the manual-paste flow tripped chat-client safety systems (Claude.ai correctly refused on prompt-injection grounds; manual paste also failed). Conclusion: pipe-installer / paste-as-system-prompt is not a viable install path. ZIP-upload-to-project remains the canonical chat-web path. |
| v1.1.5 | Reverts v1.1.4 in full: `src/build.js` step 10 removed, `release.yml` web-install upload removed, README returned to two-path (Desktop CLI + Mobile/web upload). All v1.1.3 functionality (CI consolidation, single release per version) preserved. |
| v1.1.6 | Welcome flow no longer hallucinates a desktop shortcut in chat-web. New explicit chat-web detection in `WELCOME.md` Step 2 (process tree / agent CLI on PATH / sandbox markers / bash availability) routes Claude.ai web, ChatGPT, and similar sandboxes straight to a no-shortcut greeting. Step 7 gains an explicit "chat-web environment" greeting case. Closes user-reported "I put a ToneAI shortcut on your desktop" line that fired in Claude.ai web project sessions where there is no desktop. |
| v1.1.7 | Honest platform-support docs. v1.1.6 chat-web ZIP-upload was tested 2026-05-04 across Claude.ai web, Claude mobile, ChatGPT web, and Gemini web. **Claude (web + mobile) works. ChatGPT blocks the persona-takeover pattern. Gemini emits a JSON output file instead of running as ToneAI.** README install table + release-body template updated to reflect actual platform support; ChatGPT and Gemini web are explicitly listed as not-working. CLI paths (Gemini CLI, Codex CLI, OpenCode) remain fully supported via Path 2 (Desktop CLI). |
| v1.2.0 | **Pipe installer** — `curl ... \| bash` (macOS/Linux) and `irm ... \| iex` (Windows) one-liners. Installs Bun if missing, fetches `toneai-setup.ts` from `releases/latest/download/`, runs the wizard. New release assets with stable filenames: `install.sh`, `install.ps1`, `toneai-setup.ts`, `toneai-source.zip`. **Wizard bug fix:** Step 2 now downloads the prebuilt source zip (production `dist/`) instead of `git clone`-ing the dev repo, which was landing users in dev mode (no ToneAI persona). Drops `installGit` from the wizard since git is no longer required. Wizard step 3 (npm install) also dropped — agent's first-launch runtime install handles deps. Pipe installer is added alongside existing paths in this release; cleanup of retired surfaces (setup wizard binaries, homebrew, OS installers) deferred to v1.3.0 once pipe installer is validated end-to-end. |

---

## Needs Testing

- [ ] **v1.1.0 — Rig awareness**: instrument profile saved on first session, mid-session switch ("Switching to the Jazz Bass"), pickup type mentioned in preset explanation
- [ ] **v1.1.1 — Runtime install**: desktop ZIP installs deps silently on first launch, skips on subsequent launches
- [ ] **v1.1.2 — Desktop ZIP**: confirm runtime install works end-to-end from a clean extract
- [ ] **v1.1.2 — Mobile ZIP**: upload to Claude.ai, confirm it extracts and ToneAI runs correctly

---

## Roadmap

| Version | Feature |
|---|---|
| v1.2.0 | **Preset history** — local index of generated presets (artist, song, device, file path, date); re-send without regenerating |
| v1.3.0 | **Setlist mode** — give ToneAI a setlist, get all presets at once, numbered to match order |
| v1.4.0 | **A/B variants** — two takes per song (faithful to recording vs. optimised for bedroom volume) |
| v1.5.0 | **Effect chain explanation** — text signal chain after each preset: Guitar → Gate → Amp → FX → Cab |
