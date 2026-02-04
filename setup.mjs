/**
 * This script runs `npx @convex-dev/auth` to help with setting up
 * environment variables for Convex Auth.
 *
 * You can safely delete it and remove it from package.json scripts.
 */

import fs from "fs";
import { config as loadEnvFile } from "dotenv";
import { spawnSync } from "child_process";
import readline from "readline/promises";

const envPath = ".env.local";
const envExamplePath = ".env.example";

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
  } else {
    fs.writeFileSync(envPath, "");
  }
}

const config = {};
loadEnvFile({ path: envPath, processEnv: config, quiet: true });

const runOnceWorkflow = process.argv.includes("--once");

if (runOnceWorkflow && config.SETUP_SCRIPT_RAN !== undefined) {
  // The script has already ran once, skip.
  process.exit(0);
}

const setEnvValue = (key, value) => {
  const contents = fs.readFileSync(envPath, "utf8");
  const pattern = new RegExp(`^${key}=.*$`, "m");
  const nextLine = `${key}=${value}`;
  if (pattern.test(contents)) {
    const updated = contents.replace(pattern, nextLine);
    fs.writeFileSync(envPath, updated);
    return;
  }
  const separator =
    contents.endsWith("\n") || contents.length === 0 ? "" : "\n";
  fs.writeFileSync(envPath, `${contents}${separator}${nextLine}\n`);
};

const shouldPrompt = process.stdin.isTTY && process.stdout.isTTY;
let useSelfHosted = false;

if (shouldPrompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await rl.question("Use a self-hosted Convex instance? (y/N) ");
  useSelfHosted = answer.trim().toLowerCase().startsWith("y");
  if (useSelfHosted) {
    const url = await rl.question("Self-hosted Convex URL: ");
    const adminKey = await rl.question("Self-hosted admin key: ");
    if (url) {
      setEnvValue("CONVEX_SELF_HOSTED_URL", url.trim());
      setEnvValue("NEXT_PUBLIC_CONVEX_URL", url.trim());
    }
    if (adminKey) {
      setEnvValue("CONVEX_SELF_HOSTED_ADMIN_KEY", adminKey.trim());
    }
  }
  await rl.close();
}

let result = { status: 0 };
if (!useSelfHosted) {
  result = spawnSync("npx", ["@convex-dev/auth", "--skip-git-check"], {
    stdio: "inherit",
  });
}

if (runOnceWorkflow) {
  fs.writeFileSync(envPath, `\nSETUP_SCRIPT_RAN=1\n`, { flag: "a" });
}

process.exit(result.status);
