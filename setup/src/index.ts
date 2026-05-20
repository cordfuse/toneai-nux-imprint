#!/usr/bin/env bun
import { spawnSync } from "child_process";
import { existsSync, mkdirSync, createWriteStream } from "fs";
import { homedir, platform, tmpdir } from "os";
import { join } from "path";
import * as readline from "readline";
import * as https from "https";

// ── ANSI helpers ──────────────────────────────────────────────────────────────

const c = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  red:    "\x1b[31m",
  cyan:   "\x1b[36m",
  white:  "\x1b[37m",
};

const ok   = (s: string) => `${c.green}✓${c.reset} ${s}`;
const warn = (s: string) => `${c.yellow}!${c.reset} ${s}`;
const err  = (s: string) => `${c.red}✗${c.reset} ${s}`;
const bold = (s: string) => `${c.bold}${s}${c.reset}`;
const dim  = (s: string) => `${c.dim}${s}${c.reset}`;
const cyan = (s: string) => `${c.cyan}${s}${c.reset}`;

const IS_WIN   = platform() === "win32";
const IS_MAC   = platform() === "darwin";
const IS_LINUX = platform() === "linux";

const REPO    = "steve-krisjanovs/toneai-nux";
const ZIP_URL = `https://github.com/${REPO}/releases/latest/download/toneai-source.zip`;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve));
}

function run(cmd: string, args: string[], cwd?: string): boolean {
  const result = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: IS_WIN });
  return result.status === 0;
}

function check(cmd: string, args: string[] = ["--version"]): string | null {
  const result = spawnSync(cmd, args, { stdio: "pipe", shell: IS_WIN });
  if (result.status === 0) return result.stdout.toString().trim().split("\n")[0];
  return null;
}

function openUrl(url: string) {
  const cmd = IS_WIN ? "start" : IS_MAC ? "open" : "xdg-open";
  spawnSync(cmd, [url], { shell: true, stdio: "ignore" });
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    const request = (u: string) => {
      https.get(u, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          request(res.headers.location!);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} fetching ${u}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => { file.close(); resolve(); });
      }).on("error", reject);
    };
    request(url);
  });
}

function unzipFile(zipPath: string, targetDir: string): boolean {
  if (IS_WIN) {
    return run("powershell", [
      "-NoProfile", "-Command",
      `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${targetDir}' -Force`
    ]);
  }
  if (IS_LINUX && !check("unzip")) {
    if (check("apt-get", ["--version"])) run("sudo", ["apt-get", "install", "-y", "unzip"]);
    else if (check("dnf",    ["--version"])) run("sudo", ["dnf",    "install", "-y", "unzip"]);
    else if (check("pacman", ["--version"])) run("sudo", ["pacman", "-S", "--noconfirm", "unzip"]);
  }
  return run("unzip", ["-q", "-o", zipPath, "-d", targetDir]);
}

// ── Node.js installer (npm needed for ToneAI runtime deps) ────────────────────

async function installNode(): Promise<boolean> {
  console.log(`  ${dim("Installing Node.js...")}`);

  if (IS_WIN) {
    const tmp = join(homedir(), "AppData", "Local", "Temp", "node-installer.msi");
    console.log(`  ${dim("Downloading Node.js LTS for Windows...")}`);
    await downloadFile(
      "https://nodejs.org/dist/v20.14.0/node-v20.14.0-x64.msi",
      tmp
    );
    return run("msiexec", ["/i", tmp, "/quiet", "/norestart", "ADDLOCAL=ALL"]);
  }

  if (IS_MAC) {
    if (check("brew")) {
      return run("brew", ["install", "node@20"]);
    }
    console.log(`  ${dim("Opening Node.js download page...")}`);
    openUrl("https://nodejs.org/en/download/");
    console.log();
    await ask("  Press Enter once Node.js is installed... ");
    return !!(check("node") || check("node", ["-v"]));
  }

  if (IS_LINUX) {
    if (check("apt-get", ["--version"])) {
      run("bash", ["-c", "curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -"]);
      return run("sudo", ["apt-get", "install", "-y", "nodejs"]);
    } else if (check("dnf", ["--version"])) {
      run("bash", ["-c", "curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -"]);
      return run("sudo", ["dnf", "install", "-y", "nodejs"]);
    } else if (check("pacman", ["--version"])) {
      return run("sudo", ["pacman", "-S", "--noconfirm", "nodejs", "npm"]);
    }
  }

  return false;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.clear();
  console.log();
  console.log(`${c.bold}${c.white}  ToneAI-NUX${c.reset}`);
  console.log(`  ${dim("AI-powered NUX MightyAmp tone assistant — no API key required")}`);
  console.log();
  console.log("  This wizard will get you running in a few minutes.");
  console.log();

  // ── Step 1: Prerequisites ──────────────────────────────────────────────────

  console.log(bold("── Step 1: Prerequisites ──────────────────────────────────────"));
  console.log();

  // node (for ToneAI runtime npm install)
  let nodeVersion = check("node") ?? check("node", ["-v"]);
  if (!nodeVersion) {
    console.log(warn("Node.js not found — installing..."));
    const installed = await installNode();
    nodeVersion = check("node") ?? check("node", ["-v"]);
    if (!installed || !nodeVersion) {
      console.log(err("Node.js installation failed."));
      console.log("  Please install Node.js 20 LTS manually from https://nodejs.org and re-run.");
      process.exit(1);
    }
  }
  console.log(ok(`Node.js — ${dim(nodeVersion)}`));

  // AI agent CLI
  const agents = [
    { cmd: "claude",   label: "Claude Code" },
    { cmd: "gemini",   label: "Gemini CLI"  },
    { cmd: "agy",      label: "Antigravity CLI" },
    { cmd: "opencode", label: "OpenCode"    },
    { cmd: "codex",    label: "OpenAI Codex CLI" },
  ];
  const foundAgents = agents.filter(a => check(a.cmd, ["--version"]) || check(a.cmd, ["--help"]));

  if (foundAgents.length === 0) {
    console.log(warn("No AI agent CLI found."));
    console.log("  ToneAI runs inside your AI agent — no extra subscription needed.");
    console.log("  Recommended: Claude Code — https://claude.ai/download");
    console.log();
    const cont = await ask("  Continue anyway? [y/N] ");
    if (cont.toLowerCase() !== "y") process.exit(0);
  } else {
    for (const a of foundAgents) console.log(ok(a.label));
  }

  console.log();

  // ── Step 2: Download ToneAI ───────────────────────────────────────────────

  console.log(bold("── Step 2: Download ToneAI ────────────────────────────────────"));
  console.log();

  const defaultDir = join(homedir(), "toneai");
  const userDir = await ask(`  Where to install? [${defaultDir}] `);
  const targetDir = userDir.trim() || defaultDir;

  if (existsSync(targetDir)) {
    console.log(warn(`${targetDir} already exists — skipping download.`));
  } else {
    console.log(`  Downloading into ${cyan(targetDir)}...`);
    console.log();

    mkdirSync(targetDir, { recursive: true });
    const zipPath = join(tmpdir(), `toneai-source-${Date.now()}.zip`);

    try {
      await downloadFile(ZIP_URL, zipPath);
    } catch (e) {
      console.log();
      console.log(err(`Download failed: ${String(e)}`));
      console.log("  Check your internet connection and re-run.");
      process.exit(1);
    }

    const extracted = unzipFile(zipPath, targetDir);
    if (!extracted) {
      console.log();
      console.log(err("Extraction failed."));
      process.exit(1);
    }
  }

  console.log();
  console.log(ok("ToneAI downloaded."));
  console.log();

  // ── Done ──────────────────────────────────────────────────────────────────
  // (npm install is handled by the agent on first launch — see WELCOME.md.)

  console.log(bold("── Done ───────────────────────────────────────────────────────"));
  console.log();
  console.log(`  ${c.green}${c.bold}ToneAI is ready.${c.reset}`);
  console.log();
  console.log("  To start:");
  console.log();
  console.log(`    ${cyan(`cd ${targetDir}`)}`);

  if (foundAgents.length > 0) {
    console.log(`    ${cyan(foundAgents[0].cmd)}`);
  } else {
    console.log(`    ${cyan("claude")}   ${dim("# or: gemini / agy / codex / opencode")}`);
  }

  console.log();
  console.log("  Tell ToneAI what song or artist you want to sound like.");
  console.log("  It builds the preset and saves a QR code you scan into your NUX app.");
  console.log();

  rl.close();
}

main().catch(e => {
  console.error(err(String(e)));
  process.exit(1);
});
