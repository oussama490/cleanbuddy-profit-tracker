import { chmodSync, existsSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wrapper = path.join(root, "scripts", "opennextjs-cloudflare.mjs");
const binDir = path.join(root, "node_modules", ".bin");
const unixBin = path.join(binDir, "opennextjs-cloudflare");

function runNativeInstall(relPath) {
  const file = path.join(root, "node_modules", ...relPath.split("/"));
  if (!existsSync(file)) return;
  console.log(`[cleanbuddy] running ${relPath}`);
  spawnSync(process.execPath, [file], {
    stdio: "inherit",
    cwd: path.dirname(file),
    env: process.env,
  });
}

function wrapOpenNextBin() {
  if (!existsSync(binDir) || !existsSync(wrapper)) return;

  const shim = `#!/usr/bin/env node
import ${JSON.stringify(pathToFileURL(wrapper).href)};
`;

  writeFileSync(unixBin, shim);
  try {
    chmodSync(unixBin, 0o755);
  } catch {
    // Windows local installs may not support chmod.
  }
}

function wrapWranglerBin() {
  const wranglerBin = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");
  if (!existsSync(wranglerBin)) return;

  writeFileSync(
    wranglerBin,
    `#!/usr/bin/env node
process.env.CI = process.env.CI || "true";
process.env.OPEN_NEXT_DEPLOY = "true";

const { spawn } = require("child_process");
const path = require("path");

const args = process.argv.slice(2);
if (args[0] === "deploy" && !args.includes("--keep-vars")) {
  args.push("--keep-vars");
}

if (args[0] === "deploy") {
  console.error("[cleanbuddy] wrangler deploy via OpenNext build.command (no OpenNext intercept)");
}

const child = spawn(
  process.execPath,
  ["--no-warnings", path.join(__dirname, "../wrangler-dist/cli.js"), ...args],
  { stdio: "inherit" },
);
child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
`,
  );
  try {
    chmodSync(wranglerBin, 0o755);
  } catch {
    // Windows local installs may not support chmod.
  }
}

runNativeInstall("esbuild/install.js");
runNativeInstall("wrangler/node_modules/esbuild/install.js");
runNativeInstall("workerd/install.js");
runNativeInstall("unrs-resolver/postinstall.js");
wrapOpenNextBin();
wrapWranglerBin();
