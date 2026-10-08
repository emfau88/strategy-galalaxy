import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, readdir, readFile, rm } from "node:fs/promises";
import { resolve, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildExperiment } from "../experiments/last-shipyard/scripts/build.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const target = resolve(dist, "experiments/last-shipyard");
assert.ok(target.startsWith(dist + sep));
execFileSync(process.execPath, [resolve(root, "scripts/build-pages.mjs")], { cwd: root, stdio: "inherit", windowsHide: true });
const hashes = async (folder, base = folder) => {
  const result = {};
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = resolve(folder, entry.name);
    if (entry.isDirectory()) Object.assign(result, await hashes(path, base));
    else result[path.slice(base.length + 1)] = createHash("sha256").update(await readFile(path)).digest("hex");
  }
  return result;
};
const classic = await hashes(dist);
const experiment = await buildExperiment();
try {
  await cp(experiment, target, { recursive: true, force: false, errorOnExist: true });
  for (const [relative, hash] of Object.entries(classic)) {
    assert.equal(createHash("sha256").update(await readFile(resolve(dist, relative))).digest("hex"), hash, `Classic output unchanged: ${relative}`);
  }
  console.log(`Combined Pages artifact: ${Object.keys(classic).length} Classic files preserved, experiment at experiments/last-shipyard/.`);
} finally {
  assert.ok(experiment.startsWith(resolve(root, "tmp") + sep), "Cleanup only the experiment build directory");
  await rm(experiment, { recursive: true, force: true });
}
