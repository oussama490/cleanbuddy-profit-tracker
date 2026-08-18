import { chmodSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wrapper = path.join(root, "scripts", "opennextjs-cloudflare.mjs");
const binDir = path.join(root, "node_modules", ".bin");
const unixBin = path.join(binDir, "opennextjs-cloudflare");

if (!existsSync(binDir) || !existsSync(wrapper)) process.exit(0);

const shim = `#!/usr/bin/env node
import ${JSON.stringify(pathToFileURL(wrapper).href)};
`;

writeFileSync(unixBin, shim);
try {
  chmodSync(unixBin, 0o755);
} catch {
  // Windows local installs may not support chmod.
}
