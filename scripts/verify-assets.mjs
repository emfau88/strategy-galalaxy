import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { ASSET_GROUPS, mergeAssetGroups, runtimeAssetManifestForLevel } from "../src/assets.js";
import { FLEET_VISUALS, PROJECTILE_VISUALS } from "../src/data/visuals.js";

const projectRoot = new URL("../", import.meta.url);
const manifest = mergeAssetGroups(...Object.values(ASSET_GROUPS));

const pngDimensions = async (path) => {
  const bytes = await readFile(new URL(path, projectRoot));
  assert.equal(bytes.toString("ascii", 1, 4), "PNG", `${path} is a PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes: bytes.length };
};

for (const [key, path] of Object.entries(manifest)) {
  const dimensions = await pngDimensions(path);
  assert.ok(dimensions.width > 0 && dimensions.height > 0, `${key} has drawable dimensions`);
}

for (const faction of Object.values(FLEET_VISUALS)) {
  for (const profile of Object.values(faction)) {
    for (const layer of [profile.engine, profile.weapon, profile.shield, profile.destruction].filter(Boolean)) {
      const path = manifest[layer.assetKey];
      assert.ok(path, `${layer.assetKey} is registered`);
      const { width, height } = await pngDimensions(path);
      assert.ok(width >= profile.frameSize * layer.frameCount, `${layer.assetKey} contains all declared frames`);
      assert.ok(height >= profile.frameSize, `${layer.assetKey} matches its frame height`);
    }
  }
}

for (const profiles of Object.values(PROJECTILE_VISUALS)) {
  for (const profile of Object.values(profiles)) {
    const path = manifest[profile.assetKey];
    assert.ok(path, `${profile.assetKey} is registered`);
    const { width, height } = await pngDimensions(path);
    assert.ok(width >= profile.frameWidth * profile.frameCount, `${profile.assetKey} contains all declared frames`);
    assert.ok(height >= profile.frameHeight, `${profile.assetKey} matches its frame height`);
  }
}

const countFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) count += entry.isDirectory() ? await countFiles(new URL(`${entry.name}/`, directory)) : 1;
  return count;
};

const libraryRoot = new URL("assets/library/galalaxy/", projectRoot);
assert.equal(await countFiles(libraryRoot), 516, "complete asset library is present except the intentionally excluded music file");

const deployManifest = mergeAssetGroups(ASSET_GROUPS.boot, ASSET_GROUPS.level1, ASSET_GROUPS.level2, ASSET_GROUPS.combatVfx);
for (const level of [1, 2]) {
  const activeManifest = runtimeAssetManifestForLevel(level);
  // Eight tiny faction/class shield strips add only about 21 KiB, but remain
  // separate authored animations and therefore raise the request count.
  assert.ok(Object.keys(activeManifest).length <= 48, `level ${level} cold-start request budget stays bounded`);
  const paths = [...new Set(Object.values(activeManifest))];
  const payload = (await Promise.all(paths.map((path) => pngDimensions(path)))).reduce((sum, image) => sum + image.bytes, 0);
  assert.ok(payload < 8 * 1024 * 1024, `level ${level} cold-start payload stays below 8 MiB`);
}

console.log(`Verified ${Object.keys(manifest).length} registered assets, ${new Set(Object.values(deployManifest)).size} deployed images and 516 library files.`);
