/**
 * build-skill.js — packages ToneAI as a Claude Skill.
 *
 * This is how ToneAI reaches Claude web. A skill can carry supporting files, so the QR
 * generator ships inside the skill and runs from beside SKILL.md — no npx, no network,
 * no separate download. The sandbox runs it exactly the way Lester runs it in cortex and
 * the way the desktop app runs it on a machine: write the preset JSON, run the generator,
 * show the PNG. Same encoder everywhere.
 *
 * SKILL.md is COMPOSED from imprint/IDENTITY.md, never copy-pasted. The persona, the
 * device list and the pickup calibration keep exactly one source, so the skill cannot
 * drift from the app.
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
 * The section that replaces the app's "## QR Code Generation" heading.
 *
 * The don't-read rule is not pedantry. nux-qr-tool.js is a compiled bundle — about
 * 1.4 MB, most of it base64 font data. An agent that decides to read the tool before
 * running it pulls all of that into context and stalls out mid-request. That has already
 * happened once, in a real session, and the model never recovered.
 */
const SANDBOX_SECTION = `## Running here

You are running as a Claude Skill, in a sandbox. Three things follow from that:

- **The generator ships with you** — \`nux-qr-tool.js\`, sitting next to this file. Run it with \`node\`. Do not \`npx\` it, and do not try to install anything: there is no network.
- **Never open, read, or print \`nux-qr-tool.js\`.** It is a compiled bundle, roughly 1.4 MB of minified code and embedded fonts. There is nothing in it for you to learn, and reading it will flood your context and wedge the request. **Execute it. Never inspect it.**
- **Show the player the PNG it writes.** Attach it to your reply so they can scan it off the screen with their phone. Never describe the QR, and never paste the payload — nobody can scan text.

## Remembering their rig

Ask **once** which NUX device they own and what they play — guitar, and which pickups. Then remember it, so you never ask again in a later chat.

The device decides the payload format and the amp/effect ids, so a patch for the wrong one is a wasted scan. The pickups decide gain staging and the noise gate: a single coil (Strat/Tele, **P-90**, lipstick, foil) hums, and worse the more gain sits in front of it, where a humbucker cancels that by construction. Use the calibration table above.

If they mention switching guitars mid-chat ("I'm on the Strat"), take it and recalibrate from then on — one line of acknowledgement, no ceremony.

## QR Code Generation`;

/**
 * SKILL.md = IDENTITY.md, retargeted for the sandbox. Every rewrite below throws if its
 * source line goes missing, so an edit to IDENTITY.md can never silently ship a skill
 * that runs a command which no longer exists.
 */
function composeSkillMd(version) {
  const identity = fs.readFileSync(path.join(ROOT, 'imprint', 'IDENTITY.md'), 'utf-8');

  const swapped = replaceOrThrow(
    identity,
    'npx @cordfuse/nux-qr-tool ./preset.json',
    `node nux-qr-tool.js ./preset.json --app-name "ToneAI" --app-version "${version}"`,
    'the npx generator command',
  );

  // The desktop app displays the PNG with the agent's Read tool. There is no Read tool in
  // the sandbox — the skill attaches the file to the reply instead.
  const displayed = replaceOrThrow(
    swapped,
    'Display the QR code image inline using the Read tool on the output PNG path. Then say "Scan it in the NUX app."',
    'Attach the PNG to your reply so the player sees it. Then say "Scan it in the NUX app."',
    'the display step',
  );

  return replaceOrThrow(displayed, '## QR Code Generation', SANDBOX_SECTION, 'the QR generation heading');
}

function replaceOrThrow(text, find, replace, what) {
  if (!text.includes(find)) {
    throw new Error(`IDENTITY.md no longer contains ${what} — SKILL.md would ship the wrong instructions`);
  }
  return text.replace(find, replace);
}

function buildSkill(outDir, version) {
  if (!fs.existsSync(TOOL)) {
    throw new Error(`@cordfuse/nux-qr-tool is not installed (expected ${TOOL}) — run npm ci`);
  }
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  fs.copyFileSync(TOOL, path.join(outDir, 'nux-qr-tool.js'));
  fs.writeFileSync(path.join(outDir, 'SKILL.md'), composeSkillMd(version), 'utf-8');
  smokeRun(path.join(outDir, 'nux-qr-tool.js'));

  return { bytes: fs.statSync(path.join(outDir, 'nux-qr-tool.js')).size };
}

/**
 * Run the generator the way the sandbox will: bare `node`, one file, an empty directory,
 * no node_modules, no network.
 */
function smokeRun(toolPath) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'toneai-smoke-'));
  try {
    fs.copyFileSync(toolPath, path.join(tmp, 'nux-qr-tool.js'));
    fs.writeFileSync(path.join(tmp, 'preset.json'), JSON.stringify(SMOKE_PRESET), 'utf-8');
    execFileSync(process.execPath, ['nux-qr-tool.js', 'preset.json', '--output', '.'], { cwd: tmp, stdio: 'pipe' });
    const pngs = fs.readdirSync(tmp).filter((f) => f.endsWith('.png'));
    if (pngs.length === 0) throw new Error('generator produced no PNG');
    if (fs.statSync(path.join(tmp, pngs[0])).size < 1000) throw new Error(`PNG is suspiciously small: ${pngs[0]}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

module.exports = { buildSkill };
