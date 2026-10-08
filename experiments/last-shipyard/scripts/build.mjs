import assert from "node:assert/strict";
import { copyFile, cp, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { ASSET_GROUPS } from "../src/assets.js";
import { EXPERIMENT } from "../src/experiment.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repository = resolve(root, "../..");
export const buildExperiment = async () => {
  const tempRoot = resolve(repository, "tmp");
  await mkdir(tempRoot, { recursive: true });
  const destination = await mkdtemp(resolve(tempRoot, "last-shipyard-build-"));
  assert.ok(destination.startsWith(tempRoot + sep), "Experiment build stays in its own temporary directory");
  await copyFile(resolve(root, "index.html"), resolve(destination, "index.html"));
  await cp(resolve(root, "src"), resolve(destination, "src"), { recursive: true });
  for (const relative of new Set(Object.values(ASSET_GROUPS).flatMap(Object.values))) {
    assert.ok(relative.startsWith("assets/") && !relative.includes(".."));
    const path = resolve(destination, relative);
    assert.ok(path.startsWith(destination + sep));
    await mkdir(dirname(path), { recursive: true });
    await copyFile(resolve(root, relative), path);
  }
  const metadata = JSON.parse(await (await import("node:fs/promises")).readFile(resolve(root, "version.json"), "utf8"));
  assert.equal(metadata.version, EXPERIMENT.version);
  metadata.buildCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repository, encoding: "utf8", windowsHide: true }).trim();
  await writeFile(resolve(destination, "version.json"), JSON.stringify(metadata, null, 2) + "\n");
  console.log(`Built Die letzte Werft ${EXPERIMENT.version}: ${destination}`);
  return destination;
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await buildExperiment();
