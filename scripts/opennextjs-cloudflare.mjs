#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function resolveCli() {
  const fromCwd = path.join(
    process.cwd(),
    "node_modules/@opennextjs/cloudflare/dist/cli/index.js",
  );
  if (existsSync(fromCwd)) return fromCwd;

  try {
    const apiHref = import.meta.resolve("@opennextjs/cloudflare");
    const candidate = path.resolve(
      path.dirname(fileURLToPath(apiHref)),
      "..",
      "cli",
      "index.js",
    );
    if (existsSync(candidate)) return candidate;
  } catch {
    // Fall through.
  }

  throw new Error(
    "Could not find @opennextjs/cloudflare CLI at dist/cli/index.js",
  );
}

const realCli = resolveCli();
const args = process.argv.slice(2);
const command = args[0] ?? "help";

console.error(`[cleanbuddy] opennext ${command} -> ${realCli}`);

const result = spawnSync(process.execPath, [realCli, ...args], {
  stdio: "inherit",
  env: {
    ...process.env,
    CI: process.env.CI || "true",
  },
});

process.exit(result.status ?? 1);
