import assert from "node:assert/strict";
import { CONFIG } from "../src/config.js";
import { MATCH_STATE, TEAM } from "../src/core/constants.js";
import { CLASSIC_LANES, ORBITAL_GARDEN, UNIT_DEFINITIONS } from "../src/data/definitions.js";
import { AI_PROFILES, INVESTMENT_BIASES, OpponentAi } from "../src/simulation/opponentAi.js";
import { MatchDirector } from "../src/simulation/matchDirector.js";

// Decisions always run at their normal cadence; sampling never drives the AI.
const requestedLevel = Number(process.env.SG_LEVEL ?? 0);
const maps = [ORBITAL_GARDEN, CLASSIC_LANES].filter((map) => !requestedLevel || map.level === requestedLevel);
const maximumSeconds = Number(process.env.SG_MAX_SECONDS ?? 480);
const full = process.argv.includes("--full");
const diagnostic = process.argv.includes("--diagnostic");
const balanced = INVESTMENT_BIASES.BALANCED;
const cases = [
  ["admiral-tactician", AI_PROFILES.ADMIRAL, AI_PROFILES.TACTICIAN, balanced, balanced],
  ...(full ? [
    ["tactician-cadet", AI_PROFILES.TACTICIAN, AI_PROFILES.CADET, balanced, balanced],
    ["fleet-economy", AI_PROFILES.TACTICIAN, AI_PROFILES.TACTICIAN, INVESTMENT_BIASES.FLEET, INVESTMENT_BIASES.ECONOMY],
    ["weapons-balanced", AI_PROFILES.TACTICIAN, AI_PROFILES.TACTICIAN, INVESTMENT_BIASES.WEAPONS, balanced],
  ] : []),
];
const reports = [];
for (const mapDefinition of maps) for (const [name, leftProfile, rightProfile, leftBias, rightBias] of cases) for (const mirrored of [false, true]) {
  const playerProfile = mirrored ? rightProfile : leftProfile;
  const enemyProfile = mirrored ? leftProfile : rightProfile;
  const laneIds = mapDefinition.lanes.map((lane) => lane.id);
  const director = new MatchDirector({ mapDefinition, aiProfile: enemyProfile, aiPreferredLane: laneIds[mirrored ? 0 : laneIds.length - 1], aiInvestmentBias: mirrored ? leftBias : rightBias });
  director.start();
  const playerAi = new OpponentAi({ team: TEAM.PLAYER, preferredLane: laneIds[mirrored ? laneIds.length - 1 : 0], profile: playerProfile, investmentBias: mirrored ? rightBias : leftBias });
  playerAi.plan(director);
  let decisionRemaining = playerAi.decisionIntervalSeconds(CONFIG.timing.aiDecisionIntervalSeconds);
  let lastSequence = 0;
  let firstContact = null;
  let peakUnits = 0;
  let peakProjectiles = 0;
  const shots = {};
  let shipSamples = 0;
  let outOfRangeSamples = 0;
  let overlapSamples = 0;
  let overlaps = 0;
  let stepNumber = 0;
  while (director.state === MATCH_STATE.LIVE_MATCH && director.activeMatchSeconds < maximumSeconds) {
    director.advanceLive(CONFIG.timing.fixedStepSeconds);
    decisionRemaining -= CONFIG.timing.fixedStepSeconds;
    if (director.state === MATCH_STATE.LIVE_MATCH && decisionRemaining <= Number.EPSILON) {
      playerAi.plan(director);
      decisionRemaining += playerAi.decisionIntervalSeconds(CONFIG.timing.aiDecisionIntervalSeconds);
    }
    const state = director.simulation.state;
    peakUnits = Math.max(peakUnits, state.units.size);
    peakProjectiles = Math.max(peakProjectiles, state.projectiles.size);
    for (const event of state.events) {
      if (event.sequence <= lastSequence) continue;
      if (event.type === "hit" && firstContact === null) firstContact = state.time;
      if (event.type === "shot") shots[event.projectileType] = (shots[event.projectileType] ?? 0) + 1;
    }
    lastSequence = state.events.at(-1)?.sequence ?? lastSequence;
    if (++stepNumber % 30 !== 0) continue;
    const units = [...state.units.values()].filter((unit) => unit.alive && !unit.launching);
    for (const unit of units) {
      const target = state.units.get(unit.targetId) ?? state.structures.get(unit.targetId);
      if (!target?.alive || !["ENGAGING", "ATTACKING_STRUCTURE"].includes(unit.state)) continue;
      shipSamples += 1;
      if (Math.hypot(unit.x - target.x, unit.y - target.y) > UNIT_DEFINITIONS[unit.unitType].attackRange) outOfRangeSamples += 1;
    }
    for (let i = 0; i < units.length; i += 1) for (let j = i + 1; j < units.length; j += 1) {
      if (units[i].team !== units[j].team || units[i].laneId !== units[j].laneId) continue;
      const separation = (UNIT_DEFINITIONS[units[i].unitType].spacingRadius + UNIT_DEFINITIONS[units[j].unitType].spacingRadius) * (mapDefinition.spacingScale ?? 1) + 6;
      if (Math.hypot(units[i].x - units[j].x, units[i].y - units[j].y) < separation) overlaps += 1;
    }
    overlapSamples += 1;
  }
  const state = director.simulation.state;
  const report = { level: mapDefinition.level, case: name, mirrored, playerProfile, enemyProfile, result: director.state, duration: Math.round(state.time * 10) / 10, firstContact: firstContact === null ? null : Math.round(firstContact * 10) / 10, peakUnits, peakProjectiles, shots, engagedOutOfRangeFraction: shipSamples ? Math.round(outOfRangeSamples / shipSamples * 1000) / 1000 : 0, averageFriendlyOverlaps: overlapSamples ? Math.round(overlaps / overlapSamples * 10) / 10 : 0, carriers: [...state.structures.values()].filter((s) => s.structureType === "hq").map((s) => ({ team: s.team, hp: Math.round(s.hp) })) };
  if (diagnostic) report.units = [...state.units.values()].filter((u) => u.alive).map((u) => ({ id: u.id, type: u.unitType, team: u.team, state: u.state, x: Math.round(u.x), y: Math.round(u.y), target: u.targetId, lastShot: Math.round(u.lastShotAt), cooldown: u.fireCooldown }));
  reports.push(report);
  console.log(JSON.stringify(report));
}
if (process.argv.includes("--gate")) assert.ok(reports.every((report) => report.result !== MATCH_STATE.LIVE_MATCH), "Every representative match must end before the simulation limit");
