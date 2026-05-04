#!/usr/bin/env node

/**
 * build.js
 *
 * Builds a clean production-ready copy of the IronBound app into ./dist/.
 * Used by both the developer (local testing) and the release CI workflow.
 *
 * Output mirrors exactly what end users receive in the ZIP download.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
// CI uses ./dist/ (workflow expects it there), local dev uses ~/.ironbound-test/
const DIST = process.env.CI
  ? path.join(ROOT, 'dist')
  : path.join(require('os').homedir(), '.ironbound-test');

// Clean dist/
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true });
}
fs.mkdirSync(DIST, { recursive: true });

// Read version
const version = fs.readFileSync(path.join(ROOT, 'version.txt'), 'utf-8').trim();
console.log(`Building v${version}...`);

// --- Step 1: Copy IRONBOUND-USER.md, strip dev mode, output as IRONBOUND.md ---
let ironbound = fs.readFileSync(path.join(ROOT, 'IRONBOUND-USER.md'), 'utf-8');

// Remove DEV_MODE blocks
ironbound = ironbound.replace(
  /\n*<!-- DEV_MODE_START -->[\s\S]*?<!-- DEV_MODE_END -->\n*/g,
  '\n'
);

// Stamp version
ironbound = ironbound.replace(
  /<!-- IRONBOUND — https:\/\/github\.com\/cordfuseinc\/ironbound -->/,
  `<!-- IRONBOUND v${version} — https://github.com/cordfuse/ironbound -->`
);

fs.writeFileSync(path.join(DIST, 'IRONBOUND.md'), ironbound, 'utf-8');
console.log('  IRONBOUND-USER.md → dist/IRONBOUND.md — stripped dev mode, stamped version');

// --- Step 2: Generate checksum ---
const crypto = require('crypto');

const withoutChecksum = ironbound.replace(
  /<!-- Checksum: [a-fA-F0-9]+ -->/,
  '<!-- Checksum: NONE (dev build — run release workflow to generate) -->'
);

const hash = crypto
  .createHash('sha256')
  .update(withoutChecksum, 'utf-8')
  .digest('hex');

// Embed checksum into the dist copy
const finalIronbound = ironbound.replace(
  /<!-- Checksum: NONE \(dev build — run release workflow to generate\) -->/,
  `<!-- Checksum: ${hash} -->`
);
fs.writeFileSync(path.join(DIST, 'IRONBOUND.md'), finalIronbound, 'utf-8');
fs.writeFileSync(path.join(DIST, '.ironbound-checksum'), hash + '\n', 'utf-8');
console.log(`  Checksum: ${hash}`);

// --- Step 3: Write agent file one-liners pointing to IRONBOUND.md ---
const agentFiles = ['CLAUDE.md', 'GEMINI.md', 'AGENTS.md', '.windsurfrules', '.clinerules'];
const agentOneLiner = 'IMPORTANT: Read and follow all instructions in ./IRONBOUND.md before responding to the user.\n';
for (const file of agentFiles) {
  fs.writeFileSync(path.join(DIST, file), agentOneLiner, 'utf-8');
}
console.log(`  Wrote agent file one-liners: ${agentFiles.join(', ')}`);

// --- Step 4: Copy ironbound/ app definition directory ---
function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const ironboundDir = path.join(ROOT, 'ironbound');
if (fs.existsSync(ironboundDir)) {
  copyDirRecursive(ironboundDir, path.join(DIST, 'ironbound'));
  console.log('  Copied ironbound/ app definition');
}

// --- Step 5: Copy src/ if it exists ---
const srcDir = path.join(ROOT, 'src');
if (fs.existsSync(srcDir)) {
  copyDirRecursive(srcDir, path.join(DIST, 'src'));
  console.log('  Copied src/ tooling');
}

// --- Step 6: Copy other shipping files ---
const copyFiles = ['README.md', 'LICENSE', 'version.txt', '.gitignore', 'package.json'];
for (const file of copyFiles) {
  const srcPath = path.join(ROOT, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(DIST, file));
  }
}

// --- Step 7: Create output/.gitkeep if output dir pattern is used ---
const outputDir = path.join(DIST, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, '.gitkeep'), '', 'utf-8');
}

// --- Step 8: Copy agent configs and apply bash-policy ---
const agentsDir = path.join(ROOT, 'ironbound', 'agents');
if (fs.existsSync(agentsDir)) {
  for (const entry of fs.readdirSync(agentsDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const src = path.join(agentsDir, entry.name);
      const dest = path.join(DIST, `.${entry.name}`);
      copyDirRecursive(src, dest);
      console.log(`  Copied ironbound/agents/${entry.name}/ → dist/.${entry.name}/`);
    }
  }
}

// Parse bash-policy from SESSION.md
const sessionPath = path.join(ROOT, 'ironbound', 'SESSION.md');
let bashPolicy = 'allow-all';
if (fs.existsSync(sessionPath)) {
  const sessionContent = fs.readFileSync(sessionPath, 'utf-8');
  const match = sessionContent.match(/bash-policy:\s*([\w-]+)/);
  if (match) bashPolicy = match[1];
}
console.log(`  Bash policy: ${bashPolicy}`);

// Apply bash-policy to Claude settings
const claudeSettingsPath = path.join(DIST, '.claude', 'settings.json');
if (fs.existsSync(claudeSettingsPath)) {
  const settings = JSON.parse(fs.readFileSync(claudeSettingsPath, 'utf-8'));

  // Remove any existing Bash rules
  settings.permissions.allow = settings.permissions.allow.filter(r => !r.startsWith('Bash'));

  if (bashPolicy === 'allow-all') {
    settings.permissions.allow.push('Bash(*)');
  } else if (bashPolicy === 'allow-list') {
    // Parse allowed commands from PERMISSIONS.md
    const permPath = path.join(ROOT, 'ironbound', 'PERMISSIONS.md');
    if (fs.existsSync(permPath)) {
      const permContent = fs.readFileSync(permPath, 'utf-8');
      const shellSection = permContent.match(/## Shell \/ Command Execution\n([\s\S]*?)(?=\n##|\n>|$)/);
      if (shellSection) {
        const cmds = shellSection[1].match(/`([^`]+)`/g);
        if (cmds) {
          for (const cmd of cmds) {
            const clean = cmd.replace(/`/g, '').split(' — ')[0].trim();
            settings.permissions.allow.push(`Bash(${clean}:*)`);
          }
        }
      }
    }
  }
  // deny = no Bash rules added

  fs.writeFileSync(claudeSettingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
}


// --- Step 9: Initialize git so agents recognize .claude/settings.json ---
execSync('git init', { cwd: DIST, stdio: 'ignore' });
console.log('  Initialized git (required for agent config discovery)');

// --- Step 10: Generate web-install prompt (v1.1.4+) -----------------------
// Single self-contained text file users paste into Claude.ai / ChatGPT /
// Gemini web. Bypasses the ZIP-upload step entirely. Concatenates the
// IronBound spec files + qr-generator source into one prompt.
console.log('\nGenerating web-install prompt...');

const ironboundFiles = [
  ['IDENTITY',     path.join(ROOT, 'ironbound', 'IDENTITY.md')],
  ['CONSTRAINTS',  path.join(ROOT, 'ironbound', 'CONSTRAINTS.md')],
  ['PERMISSIONS',  path.join(ROOT, 'ironbound', 'PERMISSIONS.md')],
  ['MEMORY',       path.join(ROOT, 'ironbound', 'MEMORY.md')],
  ['SESSION',      path.join(ROOT, 'ironbound', 'SESSION.md')],
  ['WELCOME',      path.join(ROOT, 'ironbound', 'WELCOME.md')],
];

let installPrompt = '';
installPrompt += '# ToneAI — single-prompt install\n\n';
installPrompt += 'You are ToneAI, an AI-powered NUX MightyAmp tone assistant. Read everything\n';
installPrompt += 'below carefully — it is your complete identity, constraints, permissions,\n';
installPrompt += 'memory rules, session config, welcome flow, and QR encoding logic. From the\n';
installPrompt += 'next message onward, every response is in-character as ToneAI. Begin by\n';
installPrompt += 'running the welcome flow.\n\n';
installPrompt += `**Version:** ${version}\n`;
installPrompt += `**Source:** https://github.com/steve-krisjanovs/toneai-nux-qr-ironbound\n\n`;
installPrompt += '---\n\n';

for (const [label, file] of ironboundFiles) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf-8').trim();
  installPrompt += `## ${label}\n\n${content}\n\n---\n\n`;
}

const qrSourcePath = path.join(ROOT, 'src', 'qr-generator.ts');
if (fs.existsSync(qrSourcePath)) {
  const qrSource = fs.readFileSync(qrSourcePath, 'utf-8').trim();
  installPrompt += '## QR ENCODING LOGIC\n\n';
  installPrompt += 'The following TypeScript source defines NUX MightyAmp QR encoding for all\n';
  installPrompt += 'supported devices. You will not execute it — you will read it as the\n';
  installPrompt += 'reference implementation and produce QR codes by following its rules.\n\n';
  installPrompt += '```typescript\n' + qrSource + '\n```\n\n---\n\n';
}

installPrompt += '## END OF SPEC\n\n';
installPrompt += 'You now have everything. Run the welcome flow per WELCOME.md.\n';

const installPath = path.join(ROOT, `toneai-web-install-v${version}.txt`);
fs.writeFileSync(installPath, installPrompt, 'utf-8');
const sizeKB = (Buffer.byteLength(installPrompt, 'utf-8') / 1024).toFixed(1);
console.log(`  Wrote: toneai-web-install-v${version}.txt (${sizeKB} KB)`);

// Also drop a copy inside DIST so users who downloaded the ZIP find it too
fs.copyFileSync(installPath, path.join(DIST, `toneai-web-install-v${version}.txt`));
console.log(`  Copied to dist/toneai-web-install-v${version}.txt`);

console.log(`\nBuild complete → ${DIST}`);
console.log(`Open this directory in an agent CLI to test user mode.`);
