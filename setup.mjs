/**
 * Interactive setup script for Nexus + Convex Auth.
 *
 * Handles:
 *  1. Self-hosted vs cloud Convex prompt (deployment URL, HTTP actions URL, dashboard URL)
 *  2. JWT key generation (JWKS + JWT_PRIVATE_KEY)
 *  3. SITE_URL configuration (Convex HTTP actions endpoint)
 *  4. Pushing SITE_URL, JWT_PRIVATE_KEY, and JWKS to `npx convex env set`
 *
 * Usage:
 *   npm run setup          # full interactive setup (always runs)
 *   node setup.mjs --once  # used by postinstall, skips if already ran
 */

import fs from "fs";
import { config as loadEnvFile } from "dotenv";
import { spawnSync } from "child_process";
import readline from "readline/promises";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const envPath = ".env.local";
const envExamplePath = ".env.example";
const VERSION = JSON.parse(fs.readFileSync("package.json", "utf8")).version;

// ── Banner ───────────────────────────────────────────

console.log(`\n  Nexus v${VERSION} — https://github.com/Northstack-Devs/nexus\n`);

// ── Helpers ──────────────────────────────────────────

/** Ensure .env.local exists (seed from .env.example when available). */
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
  process.exit(0);
}

/** Batch-update values in .env.local (single read/write). */
const setEnvValues = (entries) => {
  let contents = fs.readFileSync(envPath, "utf8");
  for (const [key, value] of Object.entries(entries)) {
    const pattern = new RegExp(`^${key}=.*$`, "m");
    const line = `${key}=${value}`;
    if (pattern.test(contents)) {
      contents = contents.replace(pattern, line);
    } else {
      const sep = contents.endsWith("\n") || contents.length === 0 ? "" : "\n";
      contents += `${sep}${line}\n`;
    }
  }
  fs.writeFileSync(envPath, contents);
};

/** Run `npx convex env set KEY value` via stdin to avoid CLI flag parsing. */
const convexEnvSet = (key, value) => {
  const r = spawnSync("npx", ["convex", "env", "set", key], {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
  });
  return r.status;
};

/** Run `npx convex env get KEY` and return the value or null. */
const convexEnvGet = (key) => {
  const r = spawnSync("npx", ["convex", "env", "get", key], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (r.status !== 0) return null;
  return r.stdout.toString().trim() || null;
};

/** Validate a URL string (must start with http:// or https://). */
const validateUrl = (input) => {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\/.+/.test(trimmed)) {
    console.error("Error: URL must start with http:// or https://");
    process.exit(1);
  }
  return trimmed;
};

// ── Interactive prompt ───────────────────────────────

const shouldPrompt = process.stdin.isTTY && process.stdout.isTTY;
let useSelfHosted = false;
let httpActionsUrl = "";

if (shouldPrompt) {
  // Skip prompt when self-hosted values are already configured.
  if (config.CONVEX_SELF_HOSTED_URL) {
    useSelfHosted = true;
    httpActionsUrl = config.CONVEX_SELF_HOSTED_HTTP_URL || "";
  } else {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const answer = await rl.question(
      "Use a self-hosted Convex instance? (y/N) ",
    );
    useSelfHosted = answer.trim().toLowerCase().startsWith("y");
    if (useSelfHosted) {
      console.log(
        "\nSelf-hosted Convex requires three URLs:\n" +
          "  1. Deployment URL    - backend endpoint (e.g. https://my-app.cloud.example.dev)\n" +
          "  2. HTTP Actions URL  - serves auth endpoints / HTTP routes\n" +
          "  3. Dashboard URL     - web UI for managing your deployment\n",
      );

      const deployUrl = validateUrl(
        await rl.question("Deployment URL (http:// or https://): "),
      );
      httpActionsUrl = validateUrl(
        await rl.question("HTTP Actions URL (http:// or https://): "),
      );
      const dashboardUrl = validateUrl(
        await rl.question("Dashboard URL (http:// or https://): "),
      );
      const adminKey = await rl.question("Admin key: ");

      const env = {};
      if (deployUrl) {
        env.CONVEX_SELF_HOSTED_URL = deployUrl;
        env.NEXT_PUBLIC_CONVEX_URL = deployUrl;
      }
      if (httpActionsUrl) {
        env.CONVEX_SELF_HOSTED_HTTP_URL = httpActionsUrl;
        env.NEXT_PUBLIC_CONVEX_HTTP_URL = httpActionsUrl;
      }
      if (dashboardUrl) {
        env.CONVEX_DASHBOARD_URL = dashboardUrl;
      }
      if (adminKey.trim()) {
        env.CONVEX_SELF_HOSTED_ADMIN_KEY = adminKey.trim();
      }
      if (Object.keys(env).length > 0) {
        setEnvValues(env);
      }
    }
    rl.close();
  }
}

// ── Convex Auth bootstrap (cloud only) ───────────────

let result = { status: 0 };
if (!useSelfHosted) {
  result = spawnSync("npx", ["@convex-dev/auth", "--skip-git-check"], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status);
  }
}

// ── JWT keys + SITE_URL ──────────────────────────────

// Reload config after the cloud auth step may have mutated .env.local.
const freshConfig = {};
loadEnvFile({ path: envPath, processEnv: freshConfig, quiet: true });

// For SITE_URL: prefer the dedicated HTTP actions URL, fall back to deployment URL.
const siteUrl =
  freshConfig.CONVEX_SELF_HOSTED_HTTP_URL ||
  httpActionsUrl ||
  freshConfig.CONVEX_SELF_HOSTED_URL ||
  freshConfig.NEXT_PUBLIC_CONVEX_URL;

if (siteUrl) {
  console.log("Checking Convex environment variables...\n");

  // Check which vars are already set on the deployment.
  const envKeys = ["SITE_URL", "JWT_PRIVATE_KEY", "JWKS"];
  const existing = {};
  for (const key of envKeys) {
    existing[key] = convexEnvGet(key);
  }

  const allSet = Object.values(existing).every(Boolean);

  if (allSet) {
    console.log("  SITE_URL         ✓ already set");
    console.log("  JWT_PRIVATE_KEY  ✓ already set");
    console.log("  JWKS             ✓ already set");
    console.log("\nAll Convex Auth env vars are already configured.");

    if (shouldPrompt) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const regen = await rl.question(
        "Regenerate keys and overwrite? (y/N) ",
      );
      rl.close();
      if (!regen.trim().toLowerCase().startsWith("y")) {
        console.log("Skipping key generation.\n");
        if (runOnceWorkflow) {
          setEnvValues({ SETUP_SCRIPT_RAN: "1" });
        }
        process.exit(0);
      }
    } else {
      // Non-interactive and already configured — nothing to do.
      if (runOnceWorkflow) {
        setEnvValues({ SETUP_SCRIPT_RAN: "1" });
      }
      process.exit(0);
    }
  } else {
    // Show status for partial setups.
    for (const key of envKeys) {
      const status = existing[key] ? "✓ already set" : "✗ not set";
      console.log(`  ${key.padEnd(16)} ${status}`);
    }
    console.log();
  }

  // Generate JWT key pair.
  console.log("Generating RSA-256 key pair...");
  const keys = await generateKeyPair("RS256", { extractable: true });
  const privateKey = await exportPKCS8(keys.privateKey);
  const publicKey = await exportJWK(keys.publicKey);
  const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });
  const jwtPrivateKey = privateKey.trimEnd().replace(/\n/g, " ");

  // Push SITE_URL, JWT_PRIVATE_KEY, and JWKS to the Convex deployment.
  const vars = {
    SITE_URL: siteUrl,
    JWT_PRIVATE_KEY: jwtPrivateKey,
    JWKS: jwks,
  };

  let failed = false;
  for (const [key, value] of Object.entries(vars)) {
    console.log(`  Setting ${key}...`);
    const code = convexEnvSet(key, value);
    if (code !== 0) {
      console.error(`  Failed to set ${key} (exit code ${code})`);
      failed = true;
      break;
    }
  }

  if (failed) {
    console.error(
      "\nCould not push env vars. You can set them manually:\n" +
        '  npx convex env set SITE_URL "..."\n' +
        '  npx convex env set JWT_PRIVATE_KEY "..."\n' +
        "  npx convex env set JWKS '...'\n" +
        "Run `node generateKeys.mjs` to regenerate keys.\n",
    );
  } else {
    console.log("\nSITE_URL, JWT_PRIVATE_KEY, and JWKS configured.");
  }
}

// ── Mark complete ────────────────────────────────────

if (runOnceWorkflow) {
  setEnvValues({ SETUP_SCRIPT_RAN: "1" });
}

console.log("Done. https://github.com/Northstack-Devs/nexus\n");
process.exit(result.status);
