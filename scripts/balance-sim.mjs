import { CONFIG } from "../src/config.js";
import { MATCH_STATE, TEAM } from "../src/core/constants.js";
import { CLASSIC_LANES, ORBITAL_GARDEN } from "../src/data/definitions.js";
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
  }),
});
const validProfiles = new Set(Object.values(AI_PROFILES));
const fixedPlayerProfile = validProfiles.has(process.env.SG_PLAYER_AI_PROFILE) ? process.env.SG_PLAYER_AI_PROFILE : null;
const fixedEnemyProfile = validProfiles.has(process.env.SG_ENEMY_AI_PROFILE) ? process.env.SG_ENEMY_AI_PROFILE : null;
const validInvestmentBiases = new Set(Object.values(INVESTMENT_BIASES));
const playerInvestmentBias = validInvestmentBiases.has(process.env.SG_PLAYER_INVESTMENT_BIAS) ? process.env.SG_PLAYER_INVESTMENT_BIAS : INVESTMENT_BIASES.BALANCED;
const enemyInvestmentBias = validInvestmentBiases.has(process.env.SG_ENEMY_INVESTMENT_BIAS) ? process.env.SG_ENEMY_INVESTMENT_BIAS : INVESTMENT_BIASES.BALANCED;
const mapDefinition = process.env.SG_LEVEL === "1" ? ORBITAL_GARDEN : CLASSIC_LANES;
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
  upgrades: Object.fromEntries(teams.map((team) => [team, { economy: 0, weapons: 0, fireRate: 0, salvo: 0, turret: 0 }])),
  spending: Object.fromEntries(teams.map((team) => [team, { fleet: 0, economy: 0, research: 0 }])),
  finalEnergy: Object.fromEntries(teams.map((team) => [team, []])),
  firstContactSeconds: [],
  visibleExchangeSeconds: [],
  combatZones: { rival: 0, center: 0, player: 0 },
  decisionModes: Object.fromEntries(teams.map((team) => [team, { saving: 0, push: 0, reacting: 0, investing: 0, waiting: 0 }])),
  peakUnits: 0,
  peakProjectiles: 0,
};

const recordDecision = (decision) => {
  if (!decision) return;
  for (const purchase of decision.purchases) metrics.purchases[decision.team][purchase.unitType] += 1;
  for (const upgrade of decision.upgrades) {
    metrics.upgrades[decision.team][upgrade.upgradeId] = (metrics.upgrades[decision.team][upgrade.upgradeId] ?? 0) + 1;
  }
  metrics.decisionModes[decision.team][decision.mode] = (metrics.decisionModes[decision.team][decision.mode] ?? 0) + 1;
};

const runMatch = (index) => {
  const playerProfile = fixedPlayerProfile ?? (index % 4 < 2 ? AI_PROFILES.ADMIRAL : AI_PROFILES.TACTICIAN);
  const enemyProfile = fixedEnemyProfile ?? (index % 4 < 2 ? AI_PROFILES.TACTICIAN : AI_PROFILES.ADMIRAL);
  const laneIds = mapDefinition.lanes.map((lane) => lane.id);
  const playerPreferredLane = laneIds[index % laneIds.length];
  const enemyPreferredLane = laneIds[(index + 1) % laneIds.length];
  const director = new MatchDirector({ config: runConfig, mapDefinition, aiProfile: enemyProfile, aiPreferredLane: enemyPreferredLane, aiInvestmentBias: enemyInvestmentBias });
  director.start();
  const playerAi = new OpponentAi({
    team: TEAM.PLAYER,
    preferredLane: playerPreferredLane,
    profile: playerProfile,
    investmentBias: playerInvestmentBias,
  });
  let playerDecision = playerAi.plan(director).decision;
  let playerDecisionRemaining = playerAi.decisionIntervalSeconds(runConfig.timing.aiDecisionIntervalSeconds);
  let enemyDecisionNumber = director.lastAiDecision?.decisionNumber ?? 0;
  recordDecision(director.lastAiDecision);
  recordDecision(playerDecision);
  let lastEventSequence = 0;
  let firstContact = null;
  let firstShipLoss = null;

  while (director.state === MATCH_STATE.LIVE_MATCH && director.activeMatchSeconds < maximumSeconds) {
    director.advanceLive(step);
    metrics.peakUnits = Math.max(metrics.peakUnits, director.simulation.state.units.size);
    metrics.peakProjectiles = Math.max(metrics.peakProjectiles, director.simulation.state.projectiles.size);

    const newEvents = director.simulation.state.events.filter((event) => event.sequence > lastEventSequence);
    if (newEvents.length) lastEventSequence = newEvents.at(-1).sequence;
    for (const event of newEvents) {
      if (event.type === "hit") {
        if (firstContact === null) firstContact = director.activeMatchSeconds;
        const ratio = event.y / mapDefinition.bounds.height;
        metrics.combatZones[ratio < 1 / 3 ? "rival" : ratio > 2 / 3 ? "player" : "center"] += 1;
      }
      if (firstShipLoss === null && event.type === "destroyed" && unitTypes.includes(event.entityType)) {
        firstShipLoss = director.activeMatchSeconds;
      }
    }
    if ((director.lastAiDecision?.decisionNumber ?? 0) !== enemyDecisionNumber) {
      enemyDecisionNumber = director.lastAiDecision.decisionNumber;
      recordDecision(director.lastAiDecision);
    }
    playerDecisionRemaining -= step;
    if (director.state === MATCH_STATE.LIVE_MATCH && playerDecisionRemaining <= Number.EPSILON) {
      playerDecision = playerAi.plan(director).decision;
      recordDecision(playerDecision);
      playerDecisionRemaining += playerAi.decisionIntervalSeconds(runConfig.timing.aiDecisionIntervalSeconds);
    }
  }

  metrics.durations.push(director.activeMatchSeconds);
  metrics.cycles.push(director.cycle);
  if (firstContact !== null) metrics.firstContactSeconds.push(firstContact);
  if (firstContact !== null && firstShipLoss !== null) metrics.visibleExchangeSeconds.push(firstShipLoss - firstContact);
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
  averageFirstContactSeconds: rounded(average(metrics.firstContactSeconds)),
  averageVisibleExchangeSeconds: rounded(average(metrics.visibleExchangeSeconds)),
  purchases: metrics.purchases,
  upgrades: metrics.upgrades,
  spending: metrics.spending,
  averageFinalEnergy: Object.fromEntries(teams.map((team) => [team, rounded(average(metrics.finalEnergy[team]))])),
  combatZoneHits: metrics.combatZones,
  decisionModes: metrics.decisionModes,
  peaks: { units: metrics.peakUnits, projectiles: metrics.peakProjectiles },
  configuration: {
    deploymentIntervalSeconds: CONFIG.timing.deploymentIntervalSeconds,
    maximumMatchSeconds: maximumSeconds,
    level: mapDefinition.level,
    map: mapDefinition.id,
    baseIncomePerSecond: runConfig.balance.baseIncomePerSecond,
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
