/**
 * Opens the Convex dashboard.
 * Uses CONVEX_DASHBOARD_URL from .env.local if set (self-hosted),
 * otherwise falls back to `npx convex dashboard` (cloud).
 */

import { config as loadEnvFile } from "dotenv";
import { exec, execSync } from "child_process";

const env = {};
loadEnvFile({ path: ".env.local", processEnv: env, quiet: true });

const url = env.CONVEX_DASHBOARD_URL;

if (url) {
  const cmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";
  exec(`${cmd} ${url}`);
} else {
  execSync("npx convex dashboard", { stdio: "inherit" });
}
