import assert from "node:assert/strict";
import { CONFIG } from "../src/config.js";
import { TEAM } from "../src/core/constants.js";
import { CLASSIC_LANES, ORBITAL_GARDEN } from "../src/data/definitions.js";
import { BattleSimulation } from "../src/simulation/battleSimulation.js";
import { createBattleState } from "../src/simulation/battleState.js";

const composition = ["scout", "fighter", "bomber", "frigate"];
const reports = [];
for (const mapDefinition of [ORBITAL_GARDEN, CLASSIC_LANES]) {
  const simulation = new BattleSimulation({ state: createBattleState({ map: mapDefinition }) });
  for (const laneId of mapDefinition.lanes.map((lane) => lane.id)) {
    for (const team of [TEAM.PLAYER, TEAM.ENEMY]) {
      const units = Array.from({ length: CONFIG.caps.unitsPerLaneTeam }, (_, index) => composition[index % composition.length]);
      simulation.spawnFormation(team, laneId, units);
    }
  }

  let peakProjectiles = 0;
  let peakUnits = simulation.state.units.size;
  for (let index = 0; index < 60 * 90 && !simulation.state.terminalTeam; index += 1) {
    simulation.step(CONFIG.timing.fixedStepSeconds);
    peakProjectiles = Math.max(peakProjectiles, simulation.state.projectiles.size);
    peakUnits = Math.max(peakUnits, simulation.state.units.size);
    assert.ok(simulation.state.projectiles.size <= CONFIG.caps.projectiles);
    assert.ok(simulation.state.events.length <= 1024);
    assert.ok([...simulation.state.projectiles.values()].every((projectile) => projectile.trail.length <= 14));
    for (const laneId of mapDefinition.lanes.map((lane) => lane.id)) {
      for (const team of [TEAM.PLAYER, TEAM.ENEMY]) {
        const active = [...simulation.state.projectiles.values()].filter((projectile) => projectile.laneId === laneId && projectile.ownerTeam === team).length;
        assert.ok(active <= CONFIG.caps.projectilesPerLaneTeam);
      }
    }
  }
  reports.push({
    level: mapDefinition.level,
    map: mapDefinition.id,
    simulatedSeconds: Math.round(simulation.state.time * 10) / 10,
    peakUnits,
    peakProjectiles,
    remainingUnits: simulation.state.units.size,
    retainedEvents: simulation.state.events.length,
    terminalTeam: simulation.state.terminalTeam,
  });
}

console.log(JSON.stringify({ reports }, null, 2));
