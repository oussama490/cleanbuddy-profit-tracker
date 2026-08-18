#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const pkgDir = path.dirname(
  require.resolve("@opennextjs/cloudflare/package.json"),
);
const realCli = path.join(pkgDir, "dist/cli/index.js");
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
