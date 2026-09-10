import { copyFile, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ASSET_GROUPS, mergeAssetGroups } from "../src/assets.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destination = resolve(root, "dist");
const deployManifest = mergeAssetGroups(
  ASSET_GROUPS.boot,
  ASSET_GROUPS.level1,
  ASSET_GROUPS.level2,
  ASSET_GROUPS.combatVfx,
);

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await copyFile(resolve(root, "index.html"), resolve(destination, "index.html"));
await cp(resolve(root, "src"), resolve(destination, "src"), { recursive: true });
await writeFile(resolve(destination, ".nojekyll"), "");

for (const relativePath of new Set(Object.values(deployManifest))) {
  const outputPath = resolve(destination, relativePath);
  await mkdir(dirname(outputPath), { recursive: true });
  await copyFile(resolve(root, relativePath), outputPath);
}

console.log(`Built GitHub Pages artifact with ${new Set(Object.values(deployManifest)).size} curated image assets.`);
