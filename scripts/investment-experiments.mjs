import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
const matches = Number.parseInt(process.argv[2] ?? "8", 10);
const variants = [
  { id: "rush", player: "fleet", enemy: "balanced" },
  { id: "rush-mirror", player: "balanced", enemy: "fleet" },
  { id: "greed", player: "economy", enemy: "fleet" },
  { id: "greed-mirror", player: "fleet", enemy: "economy" },
  { id: "weapons-tech", player: "weapons", enemy: "economy" },
  { id: "weapons-tech-mirror", player: "economy", enemy: "weapons" },
  { id: "mixed", player: "balanced", enemy: "balanced" },
];

const reports = variants.map((variant) => {
  const result = spawnSync(process.execPath, [resolve(root, "scripts", "balance-sim.mjs"), String(matches)], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      SG_PLAYER_AI_PROFILE: "tactician",
      SG_ENEMY_AI_PROFILE: "tactician",
      SG_PLAYER_INVESTMENT_BIAS: variant.player,
      SG_ENEMY_INVESTMENT_BIAS: variant.enemy,
    },
  });
  if (result.status !== 0) throw new Error(result.stderr || `Investment variant ${variant.id} failed`);
  const report = JSON.parse(result.stdout);
  return {
    ...variant,
    wins: report.wins,
    averageDurationSeconds: report.averageDurationSeconds,
    averageFinalEnergy: report.averageFinalEnergy,
    spending: report.spending,
    upgrades: report.upgrades,
  };
});

console.log(JSON.stringify({ matchesPerVariant: matches, reports }, null, 2));
