import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
const matches = Number.parseInt(process.argv[2] ?? "30", 10);
const variants = [
  { id: "lean", base: 14, node: 6 },
  { id: "recommended", base: 16, node: 7 },
  { id: "generous", base: 18, node: 8 },
];

const reports = variants.map((variant) => {
  const result = spawnSync(process.execPath, [resolve(root, "scripts", "balance-sim.mjs"), String(matches)], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      SG_BASE_INCOME: String(variant.base),
      SG_NODE_INCOME: String(variant.node),
      SG_PLAYER_AI_PROFILE: "tactician",
      SG_ENEMY_AI_PROFILE: "admiral",
    },
  });
  if (result.status !== 0) throw new Error(result.stderr || `Balance variant ${variant.id} failed`);
  const report = JSON.parse(result.stdout);
  return {
    id: variant.id,
    baseIncomePerSecond: variant.base,
    nodeIncomePerSecond: variant.node,
    wins: report.wins,
    winsByProfile: report.winsByProfile,
    averageDurationSeconds: report.averageDurationSeconds,
    averageDeploymentCycles: report.averageDeploymentCycles,
    averageFinalEnergy: report.averageFinalEnergy,
    upgrades: report.upgrades,
    nodeControlSeconds: report.nodeControlSeconds,
  };
});

console.log(JSON.stringify({ matchesPerVariant: matches, reports }, null, 2));
