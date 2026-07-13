/**
 * build-skill.js — packages ToneAI as a Claude Skill (claude.ai upload).
 *
 * Claude web runs code in a sandbox, so it generates a QR exactly the way Lester does
 * in cortex and the way the desktop app does on a machine: write the preset JSON, run
 * the generator, show the PNG. Same encoder, same command shape, nothing new to trust.
 *
 * The one difference is that the sandbox has no network, so `npx @cordfuse/nux-qr-tool`
 * cannot fetch anything. The tool's published bundle is already a single self-contained
 * file (fonts and all), so we vendor it into the skill and run it directly.
 *
 * The build SMOKE-RUNS the vendored generator on a real preset. If it does not produce a
 * PNG, the build fails — we do not ship a generator we have not just watched work.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TOOL = path.join(ROOT, 'node_modules', '@cordfuse', 'nux-qr-tool', 'dist', 'qr-generator.js');

const SMOKE_PRESET = {
  device: 'plugpro',
  artist: 'ToneAI',
  song: 'Smoke Test',
  preset_name: 'Smoke Test',
  preset_name_short: 'Smoke',
  amp: { id: 5, gain: 42, master: 61, bass: 50, mid: 55, treble: 60 },
  cabinet: { id: 2, level_db: 0, low_cut_hz: 20, high_cut: 100 },
  noise_gate: { enabled: true, sensitivity: 30, decay: 40 },
  delay: { enabled: true, id: 2, p1: 40, p2: 35, p3: 50 },
  reverb: { enabled: true, id: 1, p1: 30, p2: 40 },
  master_db: 0,
};

/**
 * The skill's SKILL.md is ToneAI's IDENTITY.md with the QR step retargeted at the
 * vendored generator. Composed, not copy-pasted: the persona, the device list and the
 * pickup calibration have exactly one source, so the skill cannot drift from the app.
 */
function composeSkillMd(version) {
  const identity = fs.readFileSync(path.join(ROOT, 'imprint', 'IDENTITY.md'), 'utf-8');

  // The app's offline fallback points at tool/nux-qr-tool.js, which is where the app ZIP
  // puts it. In the skill the generator sits right next to SKILL.md, so that path is
  // wrong here — strip the block. The "Running here" section below says the same thing
  // with the correct path.
  const stripped = identity.replace(
    /\n<!-- OFFLINE_FALLBACK -->\n[\s\S]*?```bash\nnode tool\/nux-qr-tool\.js \.\/preset\.json\n```\n/,
    '',
  );
  if (stripped === identity) {
    throw new Error('IDENTITY.md offline-fallback block not found — SKILL.md would ship a generator path that does not exist in the skill');
  }

  const swapped = stripped.replace(
    'npx @cordfuse/nux-qr-tool ./preset.json',
    'node nux-qr-tool.js ./preset.json --app-name "ToneAI" --app-version "' + version + '"',
  );
  if (swapped === identity) {
    throw new Error('IDENTITY.md no longer contains the npx generator command — SKILL.md would ship the wrong one');
  }

  // The desktop app displays the PNG with the agent's Read tool. There is no Read tool
  // in the sandbox — the skill has to attach the file to the reply instead.
  const displayed = swapped.replace(
    'Display the QR code image inline using the Read tool on the output PNG path. Then say "Scan it in the NUX app."',
    'Attach the PNG to your reply so the player sees it. Then say "Scan it in the NUX app."',
  );
  if (displayed === swapped) {
    throw new Error('IDENTITY.md no longer contains the display step — SKILL.md would tell the sandbox to use a tool it does not have');
  }

  return displayed.replace(
    '## QR Code Generation',
    `## Running here

You are running as a Claude Skill, in a sandbox. Two things follow from that:

- **The generator is bundled with you** — \`nux-qr-tool.js\`, sitting next to this file. Run it with \`node\`. Do not \`npx\` it and do not try to install anything; there is no network.
- **Show the player the PNG it writes.** Attach it to your reply so they can scan it off the screen with their phone. Do not describe the QR, do not paste the payload — they cannot scan text.

## QR Code Generation`,
  );
}

/**
 * Vendors the generator into the app itself (dist/tool/), for the offline fallback in
 * IDENTITY.md. This is the ONLY generator the app ZIP carries.
 *
 * Deliberately NOT the skill package: that lives outside dist/, because the skill's
 * SKILL.md is a second copy of ToneAI's persona and shipping it inside the app would put
 * two identity documents in one tree for the agent to trip over.
 */
function vendorTool(appDir) {
  requireTool();
  const dest = path.join(appDir, 'tool');
  fs.mkdirSync(dest, { recursive: true });
  fs.copyFileSync(TOOL, path.join(dest, 'nux-qr-tool.js'));
  smokeRun(path.join(dest, 'nux-qr-tool.js'));
  return { bytes: fs.statSync(path.join(dest, 'nux-qr-tool.js')).size };
}

function requireTool() {
  if (!fs.existsSync(TOOL)) {
    throw new Error(`@cordfuse/nux-qr-tool is not installed (expected ${TOOL}) — run npm ci`);
  }
}

function buildSkill(outDir, version) {
  requireTool();
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  fs.copyFileSync(TOOL, path.join(outDir, 'nux-qr-tool.js'));
  fs.writeFileSync(path.join(outDir, 'SKILL.md'), composeSkillMd(version), 'utf-8');
  smokeRun(path.join(outDir, 'nux-qr-tool.js'));

  return { bytes: fs.statSync(path.join(outDir, 'nux-qr-tool.js')).size };
}

/**
 * Run the vendored generator the way it will actually be run: bare `node`, one file, an
 * empty directory, no node_modules, no network. Throws if it doesn't produce a PNG — we
 * don't ship a generator we haven't just watched work.
 */
function smokeRun(toolPath) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'toneai-smoke-'));
  try {
    fs.copyFileSync(toolPath, path.join(tmp, 'nux-qr-tool.js'));
    fs.writeFileSync(path.join(tmp, 'preset.json'), JSON.stringify(SMOKE_PRESET), 'utf-8');
    execFileSync(process.execPath, ['nux-qr-tool.js', 'preset.json', '--output', '.'], {
      cwd: tmp,
      stdio: 'pipe',
    });
    const pngs = fs.readdirSync(tmp).filter((f) => f.endsWith('.png'));
    if (pngs.length === 0) throw new Error('generator produced no PNG');
    if (fs.statSync(path.join(tmp, pngs[0])).size < 1000) throw new Error(`PNG is suspiciously small: ${pngs[0]}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

module.exports = { buildSkill, vendorTool };
