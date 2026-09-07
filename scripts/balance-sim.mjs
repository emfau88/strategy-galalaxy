import { CONFIG } from "../src/config.js";
import { LANE, MATCH_STATE, TEAM } from "../src/core/constants.js";
import { OpponentAi } from "../src/simulation/opponentAi.js";
import { MatchDirector } from "../src/simulation/matchDirector.js";

const requestedMatches = Number.parseInt(process.argv[2] ?? "100", 10);
const matchCount = Number.isFinite(requestedMatches) && requestedMatches > 0 ? requestedMatches : 100;
const maximumSeconds = 8 * 60;
const step = CONFIG.timing.fixedStepSeconds;
const teams = [TEAM.PLAYER, TEAM.ENEMY];
const unitTypes = ["scout", "fighter", "bomber", "frigate"];

const metrics = {
  matches: matchCount,
  wins: { [TEAM.PLAYER]: 0, [TEAM.ENEMY]: 0, timeout: 0 },
  durations: [],
  cycles: [],
  purchases: Object.fromEntries(teams.map((team) => [team, Object.fromEntries(unitTypes.map((type) => [type, 0]))])),
  nodeControlSeconds: Object.fromEntries(teams.map((team) => [team, 0])),
  firstTurretLossSeconds: [],
  peakUnits: 0,
  peakProjectiles: 0,
};

const recordDecision = (decision) => {
  if (!decision) return;
  for (const purchase of decision.purchases) metrics.purchases[decision.team][purchase.unitType] += 1;
};

const runMatch = (index) => {
  const director = new MatchDirector();
  director.start();
  const playerAi = new OpponentAi({
    team: TEAM.PLAYER,
    preferredLane: index % 2 === 0 ? LANE.RIGHT : LANE.LEFT,
  });
  recordDecision(director.lastAiDecision);
  recordDecision(playerAi.plan(director).decision);
  let knownCycle = director.cycle;
  let firstTurretLoss = null;

  while (director.state === MATCH_STATE.LIVE_MATCH && director.activeMatchSeconds < maximumSeconds) {
    director.advanceLive(step);
    metrics.peakUnits = Math.max(metrics.peakUnits, director.simulation.state.units.size);
    metrics.peakProjectiles = Math.max(metrics.peakProjectiles, director.simulation.state.projectiles.size);

    for (const node of director.simulation.state.nodes.values()) {
      if (node.ownerTeam) metrics.nodeControlSeconds[node.ownerTeam] += step;
    }
    if (firstTurretLoss === null) {
      const turretLost = [...director.simulation.state.structures.values()].some((structure) => structure.structureType === "turret" && !structure.alive);
      if (turretLost) firstTurretLoss = director.activeMatchSeconds;
    }
    if (director.state === MATCH_STATE.LIVE_MATCH && director.cycle !== knownCycle) {
      knownCycle = director.cycle;
      recordDecision(director.lastAiDecision);
      recordDecision(playerAi.plan(director).decision);
    }
  }

  metrics.durations.push(director.activeMatchSeconds);
  metrics.cycles.push(director.cycle);
  if (firstTurretLoss !== null) metrics.firstTurretLossSeconds.push(firstTurretLoss);
  if (director.state === MATCH_STATE.VICTORY) metrics.wins[TEAM.PLAYER] += 1;
  else if (director.state === MATCH_STATE.DEFEAT) metrics.wins[TEAM.ENEMY] += 1;
  else metrics.wins.timeout += 1;
};

for (let index = 0; index < matchCount; index += 1) runMatch(index);

const average = (values) => values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
const rounded = (value) => value === null ? null : Math.round(value * 10) / 10;
const report = {
  matches: metrics.matches,
  wins: metrics.wins,
  averageDurationSeconds: rounded(average(metrics.durations)),
  averageDeploymentCycles: rounded(average(metrics.cycles)),
  averageFirstTurretLossSeconds: rounded(average(metrics.firstTurretLossSeconds)),
  purchases: metrics.purchases,
  nodeControlSeconds: Object.fromEntries(teams.map((team) => [team, rounded(metrics.nodeControlSeconds[team])])),
  peaks: { units: metrics.peakUnits, projectiles: metrics.peakProjectiles },
  configuration: {
    deploymentIntervalSeconds: CONFIG.timing.deploymentIntervalSeconds,
    lockSeconds: CONFIG.timing.deploymentLockSeconds,
    maximumMatchSeconds: maximumSeconds,
  },
};

console.log(JSON.stringify(report, null, 2));
if (metrics.wins.timeout === matchCount) {
  console.error("Balance gate failed: every simulated match reached the time limit.");
  process.exitCode = 1;
}
