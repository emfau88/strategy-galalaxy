import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createSiteServer } from "../scripts/dev-server.mjs";
import { ASSET_GROUPS } from "../src/assets.js";
import { ASSET_GROUPS as experimentAssets } from "../experiments/last-shipyard/src/assets.js";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const dist = resolve(root, "dist");
const baseline = "ed8802b2652d07ae2e7884f1dc2eabd195b34057";
const git = args => execFileSync("git", args, { cwd: root, windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
const canonical = (bytes, path) => /\.(js|html)$/.test(path) ? Buffer.from(bytes.toString().replaceAll("\r\n", "\n")) : bytes;
const classicAssets = [...new Set(["boot", "level1", "level2", "combatVfx"].flatMap(group => Object.values(ASSET_GROUPS[group])))];
const sourcePaths = git(["ls-tree", "-r", "--name-only", baseline, "--", "src"]).toString().trim().split("\n");
const classicFiles = ["index.html", ...sourcePaths, ...classicAssets];
for (const path of classicFiles) assert.ok(canonical(readFileSync(resolve(dist, path)), path).equals(canonical(git(["show", `${baseline}:${path}`]), path)), `Published Classic baseline preserved: ${path}`);
const walk = folder => readdirSync(folder, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(resolve(folder, entry.name)) : [resolve(folder, entry.name)]);
const builtClassic = walk(dist).map(path => relative(dist, path).replaceAll("\\", "/")).filter(path => !path.startsWith("experiments/"));
assert.deepEqual(builtClassic.sort(), [...classicFiles, ".nojekyll"].sort(), "No unwanted Classic files in the artifact");
const prefix = "/strategy-galalaxy/";
const experimentPath = prefix + "experiments/last-shipyard/";
const server = createSiteServer();
await new Promise(done => server.listen(0, "127.0.0.1", done));
try {
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const url of [prefix, experimentPath]) {
    assert.equal((await fetch(origin + url)).status, 200);
    const redirect = await fetch(origin + url.slice(0, -1), { redirect: "manual" });
    assert.equal(redirect.status, 308);
    assert.equal(redirect.headers.get("location"), url);
    assert.equal((await fetch(origin + url + "src/main.js")).status, 200);
  }
  for (const path of Object.values(experimentAssets).flatMap(Object.values)) assert.equal((await fetch(origin + experimentPath + path)).status, 200, path);
  assert.equal((await fetch(origin + prefix + "experiments/last-shipyard/src/not-present.js")).status, 404, "Missing experiment file must not fall back to Classic");
  assert.equal((await fetch(origin + prefix + "%2e%2e%5c.git%5cconfig")).status, 403);
  assert.equal((await fetch(origin + "/src/main.js")).status, 404);
} finally { await new Promise(done => server.close(done)); }
console.log(`PASS: ${classicFiles.length} Classic artifact files match public baseline; both nested paths, redirects, experiment assets and missing-file isolation verified.`);
