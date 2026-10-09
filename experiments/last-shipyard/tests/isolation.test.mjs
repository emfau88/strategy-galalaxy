import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ASSET_GROUPS } from "../src/assets.js";
import { STORAGE_KEYS, EXPERIMENT } from "../src/experiment.js";
import { CampaignProgress } from "../src/campaign/progress.js";
import { SoundSystem } from "../src/audio/soundSystem.js";
import { createExperimentServer } from "../scripts/dev-server.mjs";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const repo = resolve(root, "../..");
const manifest = JSON.parse(readFileSync(resolve(root, "provenance/import-manifest.json")));
const walk = folder => readdirSync(folder, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(resolve(folder, entry.name)) : [resolve(folder, entry.name)]);
for (const path of walk(resolve(root, "src"))) {
  if (!path.endsWith(".js")) continue;
  const source = readFileSync(path, "utf8");
  assert.ok(!/localStorage\.clear|serviceWorker|indexedDB/.test(source), `No unscoped storage/cache API: ${path}`);
  for (const match of source.matchAll(/(?:from\s*|import\s*\(\s*|import\s*)["']([^"']+)["']/g)) {
    const specifier = match[1];
    assert.ok(specifier.startsWith("."), `Runtime import must be relative: ${specifier}`);
    const imported = resolve(dirname(path), specifier);
    assert.ok(imported.startsWith(root + sep) && existsSync(imported), `Runtime import belongs to experiment: ${imported}`);
  }
}
const activePaths = [...new Set(Object.values(ASSET_GROUPS).flatMap(Object.values))];
assert.equal(activePaths.length, 56);
const generated = JSON.parse(readFileSync(resolve(root, "provenance/generated-assets.json")));
for (const path of activePaths) {
  assert.ok(path.startsWith("assets/") && !path.includes(".."));
  const entry = manifest.files.find(file => file.destination === path) ?? generated.assets.find(file => file.destination === path);
  assert.ok(entry);
  assert.equal(createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex"), entry.sha256, `Imported image unchanged: ${path}`);
}
// Experiment modules evolve; the Classic runtime below remains byte-for-byte isolated.
const changedClassic = execFileSync("git", ["diff", "--name-only", manifest.classicCommit, "--", "index.html", "src", "assets", "scripts/build-pages.mjs"], { cwd: repo, encoding: "utf8", windowsHide: true });
assert.equal(changedClassic.trim(), "", "Classic runtime and original builder stay at verified public baseline");

const sentinels = { "strategy-galalaxy-campaign-v1": '{"version":1,"completed":["first-contact"]}', "strategy-galalaxy-sound-muted": "false" };
const values = new Map(Object.entries(sentinels));
const accesses = [];
const storage = { getItem: key => { accesses.push(key); return values.get(key) ?? null; }, setItem: (key, value) => { accesses.push(key); values.set(key, value); }, removeItem: key => { accesses.push(key); values.delete(key); } };
let progress = new CampaignProgress(storage);
assert.deepEqual(progress.data.completed, [], "Classic completion is not imported");
assert.equal(progress.begin("first-contact"), true);
assert.equal(progress.complete("first-contact"), true);
assert.deepEqual(new CampaignProgress(storage).data.completed, ["first-contact"]);
assert.equal(progress.complete("shield-network"), false, "Locked finale cannot be completed");
values.set(STORAGE_KEYS.progress, "{broken");
assert.deepEqual(new CampaignProgress(storage).data.completed, []);
const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
try {
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  const sound = new SoundSystem();
  assert.equal(sound.muted, false);
  sound.toggleMuted();
  assert.equal(new SoundSystem().muted, true);
  progress.reset();
  assert.deepEqual(new CampaignProgress(storage).data.completed, []);
  assert.equal(values.has(STORAGE_KEYS.progress), false);
  assert.equal(new SoundSystem().muted, true, "Progress reset retains sound");
} finally {
  if (previous) Object.defineProperty(globalThis, "localStorage", previous); else delete globalThis.localStorage;
}
assert.ok(accesses.every(key => Object.values(STORAGE_KEYS).includes(key)), "All storage operations use experiment keys");
for (const [key, value] of Object.entries(sentinels)) assert.equal(values.get(key), value);
assert.equal(JSON.parse(readFileSync(resolve(root, "version.json"))).version, EXPERIMENT.version);

// Exercise the future Pages subpath using the same standalone server code.
const prefix = "/strategy-galalaxy/experiments/last-shipyard/";
const server = createExperimentServer({ prefix });
await new Promise(done => server.listen(0, "127.0.0.1", done));
try {
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const path of ["", "src/main.js", activePaths[0]]) assert.equal((await fetch(origin + prefix + path)).status, 200);
  assert.equal((await fetch(origin + "/src/main.js")).status, 404, "No Classic fallback");
  assert.equal((await fetch(origin + prefix + ".git/config")).status, 403);
  assert.equal((await fetch(origin + prefix + "%2e%2e%5c%2e%2e%5csrc%5cmain.js")).status, 403);
} finally { await new Promise(done => server.close(done)); }
console.log("PASS: own imports, 56 image hashes, Classic baseline, storage separation, version and nested HTTP paths.");
