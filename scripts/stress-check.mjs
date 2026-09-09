import assert from "node:assert/strict";
import { CONFIG } from "../src/config.js";
import { LANE, TEAM } from "../src/core/constants.js";
import { BattleSimulation } from "../src/simulation/battleSimulation.js";

const simulation = new BattleSimulation();
const composition = ["scout", "fighter", "bomber", "frigate"];
for (const laneId of [LANE.LEFT, LANE.RIGHT]) {
  for (const team of [TEAM.PLAYER, TEAM.ENEMY]) {
    const units = Array.from({ length: CONFIG.caps.unitsPerLaneTeam }, (_, index) => composition[index % composition.length]);
    simulation.spawnFormation(team, laneId, units);
  }
}

let peakProjectiles = 0;
for (let index = 0; index < 60 * 90 && !simulation.state.terminalTeam; index += 1) {
  simulation.step(CONFIG.timing.fixedStepSeconds);
  peakProjectiles = Math.max(peakProjectiles, simulation.state.projectiles.size);
  assert.ok(simulation.state.projectiles.size <= CONFIG.caps.projectiles);
  assert.ok(simulation.state.events.length <= 1024);
  assert.ok([...simulation.state.projectiles.values()].every((projectile) => projectile.trail.length <= 18));
  for (const laneId of [LANE.LEFT, LANE.RIGHT]) {
    for (const team of [TEAM.PLAYER, TEAM.ENEMY]) {
      const active = [...simulation.state.projectiles.values()].filter((projectile) => projectile.laneId === laneId && projectile.ownerTeam === team).length;
      assert.ok(active <= CONFIG.caps.projectilesPerLaneTeam);
    }
  }
}

console.log(JSON.stringify({
  simulatedSeconds: Math.round(simulation.state.time * 10) / 10,
  peakProjectiles,
  remainingUnits: simulation.state.units.size,
  retainedEvents: simulation.state.events.length,
  terminalTeam: simulation.state.terminalTeam,
}, null, 2));
