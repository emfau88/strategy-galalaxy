import { CONFIG } from "../src/config.js";
import { LANE, MATCH_STATE, TEAM } from "../src/core/constants.js";
import { AI_PROFILES, INVESTMENT_BIASES, OpponentAi } from "../src/simulation/opponentAi.js";
import { MatchDirector } from "../src/simulation/matchDirector.js";

const requestedMatches = Number.parseInt(process.argv[2] ?? "100", 10);
const matchCount = Number.isFinite(requestedMatches) && requestedMatches > 0 ? requestedMatches : 100;
const numericOverride = (name, fallback) => {
  const value = Number.parseFloat(process.env[name] ?? "");
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};
const runConfig = Object.freeze({
  ...CONFIG,
  balance: Object.freeze({
    ...CONFIG.balance,
    baseIncomePerSecond: numericOverride("SG_BASE_INCOME", CONFIG.balance.baseIncomePerSecond),
    nodeIncomePerSecond: numericOverride("SG_NODE_INCOME", CONFIG.balance.nodeIncomePerSecond),
  }),
});
const validProfiles = new Set(Object.values(AI_PROFILES));
const fixedPlayerProfile = validProfiles.has(process.env.SG_PLAYER_AI_PROFILE) ? process.env.SG_PLAYER_AI_PROFILE : null;
const fixedEnemyProfile = validProfiles.has(process.env.SG_ENEMY_AI_PROFILE) ? process.env.SG_ENEMY_AI_PROFILE : null;
const validInvestmentBiases = new Set(Object.values(INVESTMENT_BIASES));
const playerInvestmentBias = validInvestmentBiases.has(process.env.SG_PLAYER_INVESTMENT_BIAS) ? process.env.SG_PLAYER_INVESTMENT_BIAS : INVESTMENT_BIASES.BALANCED;
const enemyInvestmentBias = validInvestmentBiases.has(process.env.SG_ENEMY_INVESTMENT_BIAS) ? process.env.SG_ENEMY_INVESTMENT_BIAS : INVESTMENT_BIASES.BALANCED;
const maximumSeconds = 8 * 60;
const step = CONFIG.timing.fixedStepSeconds;
const teams = [TEAM.PLAYER, TEAM.ENEMY];
const unitTypes = ["scout", "fighter", "bomber", "frigate"];

const metrics = {
  matches: matchCount,
  wins: { [TEAM.PLAYER]: 0, [TEAM.ENEMY]: 0, draw: 0, timeout: 0 },
  winsByProfile: { [AI_PROFILES.CADET]: 0, [AI_PROFILES.TACTICIAN]: 0, [AI_PROFILES.ADMIRAL]: 0, draw: 0, timeout: 0 },
  durations: [],
  cycles: [],
  purchases: Object.fromEntries(teams.map((team) => [team, Object.fromEntries(unitTypes.map((type) => [type, 0]))])),
  upgrades: Object.fromEntries(teams.map((team) => [team, { economy: 0, weapons: 0, turret: 0 }])),
  spending: Object.fromEntries(teams.map((team) => [team, { fleet: 0, economy: 0, research: 0 }])),
  finalEnergy: Object.fromEntries(teams.map((team) => [team, []])),
  nodeControlSeconds: Object.fromEntries(teams.map((team) => [team, 0])),
  firstTurretLossSeconds: [],
  peakUnits: 0,
  peakProjectiles: 0,
};

const recordDecision = (decision) => {
  if (!decision) return;
  for (const purchase of decision.purchases) metrics.purchases[decision.team][purchase.unitType] += 1;
  for (const upgrade of decision.upgrades) metrics.upgrades[decision.team][upgrade.upgradeId] += 1;
};

const runMatch = (index) => {
  const playerProfile = fixedPlayerProfile ?? (index % 4 < 2 ? AI_PROFILES.ADMIRAL : AI_PROFILES.TACTICIAN);
  const enemyProfile = fixedEnemyProfile ?? (index % 4 < 2 ? AI_PROFILES.TACTICIAN : AI_PROFILES.ADMIRAL);
  const playerPreferredLane = index % 2 === 0 ? LANE.RIGHT : LANE.LEFT;
  const enemyPreferredLane = playerPreferredLane === LANE.LEFT ? LANE.RIGHT : LANE.LEFT;
  const director = new MatchDirector({ config: runConfig, aiProfile: enemyProfile, aiPreferredLane: enemyPreferredLane, aiInvestmentBias: enemyInvestmentBias });
  director.start();
  const playerAi = new OpponentAi({
    team: TEAM.PLAYER,
    preferredLane: playerPreferredLane,
    profile: playerProfile,
    investmentBias: playerInvestmentBias,
  });
  let playerDecision = playerAi.plan(director).decision;
  let knownCycle = director.cycle;
  let firstTurretLoss = null;

  while (director.state === MATCH_STATE.LIVE_MATCH && director.activeMatchSeconds < maximumSeconds) {
    const enemyDecisionBeforeStep = director.lastAiDecision;
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
      recordDecision(enemyDecisionBeforeStep);
      recordDecision(playerDecision);
      knownCycle = director.cycle;
      playerDecision = playerAi.plan(director).decision;
    }
  }

  metrics.durations.push(director.activeMatchSeconds);
  metrics.cycles.push(director.cycle);
  if (firstTurretLoss !== null) metrics.firstTurretLossSeconds.push(firstTurretLoss);
  for (const team of teams) metrics.finalEnergy[team].push(director.economy.get(team).energy);
  for (const team of teams) {
    for (const category of ["fleet", "economy", "research"]) metrics.spending[team][category] += director.economy.get(team).spending[category];
  }
  if (director.state === MATCH_STATE.VICTORY) {
    metrics.wins[TEAM.PLAYER] += 1;
    metrics.winsByProfile[playerProfile] += 1;
  } else if (director.state === MATCH_STATE.DEFEAT) {
    metrics.wins[TEAM.ENEMY] += 1;
    metrics.winsByProfile[enemyProfile] += 1;
  } else if (director.state === MATCH_STATE.DRAW) {
    metrics.wins.draw += 1;
    metrics.winsByProfile.draw += 1;
  } else {
    metrics.wins.timeout += 1;
    metrics.winsByProfile.timeout += 1;
  }
};

for (let index = 0; index < matchCount; index += 1) runMatch(index);

const average = (values) => values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
const rounded = (value) => value === null ? null : Math.round(value * 10) / 10;
const report = {
  matches: metrics.matches,
  wins: metrics.wins,
  winsByProfile: metrics.winsByProfile,
  averageDurationSeconds: rounded(average(metrics.durations)),
  averageDeploymentCycles: rounded(average(metrics.cycles)),
  averageFirstTurretLossSeconds: rounded(average(metrics.firstTurretLossSeconds)),
  purchases: metrics.purchases,
  upgrades: metrics.upgrades,
  spending: metrics.spending,
  averageFinalEnergy: Object.fromEntries(teams.map((team) => [team, rounded(average(metrics.finalEnergy[team]))])),
  nodeControlSeconds: Object.fromEntries(teams.map((team) => [team, rounded(metrics.nodeControlSeconds[team])])),
  peaks: { units: metrics.peakUnits, projectiles: metrics.peakProjectiles },
  configuration: {
    deploymentIntervalSeconds: CONFIG.timing.deploymentIntervalSeconds,
    maximumMatchSeconds: maximumSeconds,
    baseIncomePerSecond: runConfig.balance.baseIncomePerSecond,
    nodeIncomePerSecond: runConfig.balance.nodeIncomePerSecond,
    matchup: fixedPlayerProfile || fixedEnemyProfile
      ? `${fixedPlayerProfile ?? AI_PROFILES.TACTICIAN} vs ${fixedEnemyProfile ?? AI_PROFILES.TACTICIAN}`
      : "four-way side/lane-mirrored admiral vs tactician",
    investmentBias: `${playerInvestmentBias} vs ${enemyInvestmentBias}`,
  },
};

console.log(JSON.stringify(report, null, 2));
if (metrics.wins.timeout === matchCount) {
  console.error("Balance gate failed: every simulated match reached the time limit.");
  process.exitCode = 1;
}
