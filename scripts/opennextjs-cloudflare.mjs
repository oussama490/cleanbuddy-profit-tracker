#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function resolveCli() {
  const candidates = [];

  try {
    const apiHref = import.meta.resolve("@opennextjs/cloudflare");
    candidates.push(
      path.resolve(path.dirname(fileURLToPath(apiHref)), "..", "cli", "index.js"),
    );
  } catch {
    // Fall through to the node_modules path.
  }

  candidates.push(
    path.join(
      process.cwd(),
      "node_modules/@opennextjs/cloudflare/dist/cli/index.js",
    ),
  );

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  throw new Error(
    "Could not find @opennextjs/cloudflare CLI at dist/cli/index.js",
  );
}

const realCli = resolveCli();
const args = process.argv.slice(2);
const command = args[0];

function run(cliArgs) {
  const result = spawnSync(process.execPath, [realCli, ...cliArgs], {
    stdio: "inherit",
    env: process.env,
  });
  process.exitCode = result.status ?? 1;
  if (result.status) process.exit(result.status);
}

if (command === "deploy" || command === "upload") {
  run(["build"]);
}

run(args);
