import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { CONFIG } from "../src/config.js";
import { TEAM, LANE } from "../src/core/constants.js";
import { ORBITAL_GARDEN, UNIT_DEFINITIONS } from "../src/data/definitions.js";
import { BattleSimulation } from "../src/simulation/battleSimulation.js";
import { createBattleState } from "../src/simulation/battleState.js";

const composition = ["scout", "fighter", "bomber", "frigate"];
const simulation = new BattleSimulation({ state: createBattleState({ map: ORBITAL_GARDEN }) });

for (const structure of simulation.state.structures.values()) {
  structure.hp = 1e9;
  structure.maxHp = 1e9;
}
for (const team of [TEAM.PLAYER, TEAM.ENEMY]) {
  const originY = team === TEAM.PLAYER ? 650 : 530;
  for (let index = 0; index < CONFIG.caps.unitsPerLaneTeam; index += 1) {
    const unit = simulation.spawnUnit(team, LANE.CENTER, composition[index % composition.length], {
      x: 210 + (index % 4 - 1.5) * 8,
      y: originY + Math.floor(index / 4) * (team === TEAM.PLAYER ? 5 : -5),
      spawnCycle: index,
    });
    unit.hp = 1e9;
    unit.maxHp = 1e9;
  }
}

const fixedStep = CONFIG.timing.fixedStepSeconds;
for (let index = 0; index < 600; index += 1) simulation.step(fixedStep);

const previousX = new Map([...simulation.state.units.values()].map((unit) => [unit.id, unit.x]));
const previousDirection = new Map();
const reversals = new Map([...simulation.state.units.values()].map((unit) => [unit.id, 0]));
let overlapSamples = 0;
let overlapTotal = 0;
let peakOverlaps = 0;
const startedAt = performance.now();

for (let step = 0; step < 1200; step += 1) {
  simulation.step(fixedStep);
  for (const unit of simulation.state.units.values()) {
    const dx = unit.x - previousX.get(unit.id);
    previousX.set(unit.id, unit.x);
    const direction = dx > 0.04 ? 1 : dx < -0.04 ? -1 : 0;
    const lastDirection = previousDirection.get(unit.id) ?? 0;
    if (direction && lastDirection && direction !== lastDirection) reversals.set(unit.id, reversals.get(unit.id) + 1);
    if (direction) previousDirection.set(unit.id, direction);
  }
  if (step % 10 !== 0) continue;
  let overlaps = 0;
  for (const team of [TEAM.PLAYER, TEAM.ENEMY]) {
    const units = [...simulation.state.units.values()].filter((unit) => unit.team === team);
    for (let left = 0; left < units.length; left += 1) {
      for (let right = left + 1; right < units.length; right += 1) {
        const leftRadius = UNIT_DEFINITIONS[units[left].unitType].spacingRadius;
        const rightRadius = UNIT_DEFINITIONS[units[right].unitType].spacingRadius;
        const minimum = (leftRadius + rightRadius) * ORBITAL_GARDEN.spacingScale + 6;
        if (Math.hypot(units[left].x - units[right].x, units[left].y - units[right].y) < minimum) overlaps += 1;
      }
    }
  }
  overlapSamples += 1;
  overlapTotal += overlaps;
  peakOverlaps = Math.max(peakOverlaps, overlaps);
}

const reversalValues = [...reversals.values()];
const averageFriendlyOverlaps = Math.round(overlapTotal / overlapSamples * 10) / 10;
const reversalLeaders = [...simulation.state.units.values()]
  .map((unit) => ({ id: unit.id, team: unit.team, unitType: unit.unitType, reversals: reversals.get(unit.id), x: Math.round(unit.x), y: Math.round(unit.y) }))
  .sort((left, right) => right.reversals - left.reversals)
  .slice(0, 6);
console.log(JSON.stringify({
  ships: simulation.state.units.size,
  sampledSeconds: 20,
  averageFriendlyOverlaps,
  peakFriendlyOverlaps: peakOverlaps,
  shipsWithMoreThanTenLateralReversals: reversalValues.filter((count) => count > 10).length,
  maximumLateralReversals: Math.max(...reversalValues),
  reversalLeaders,
  averageMillisecondsPerStep: Math.round((performance.now() - startedAt) / 1200 * 1000) / 1000,
}, null, 2));

assert.ok(averageFriendlyOverlaps <= 130, "dense fleets must keep resolving friendly overlaps");
assert.ok(peakOverlaps <= 225, "a dense fleet must not collapse back into its initial cluster");
assert.ok(Math.max(...reversalValues) <= 10, "no ship may visibly alternate its lateral direction more than once every two seconds");
