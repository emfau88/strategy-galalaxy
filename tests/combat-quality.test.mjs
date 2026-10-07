import assert from "node:assert/strict";
import { CONFIG } from "../src/config.js";
import { TEAM } from "../src/core/constants.js";
import { ORBITAL_GARDEN, CLASSIC_LANES, UNIT_DEFINITIONS } from "../src/data/definitions.js";
import { BattleSimulation } from "../src/simulation/battleSimulation.js";
import { createBattleState } from "../src/simulation/battleState.js";

let scenarios = 0;
for (const map of [ORBITAL_GARDEN, CLASSIC_LANES]) for (const lane of map.lanes) for (const team of [TEAM.PLAYER, TEAM.ENEMY]) {
  const direction = team === TEAM.PLAYER ? -1 : 1;
  const other = team === TEAM.PLAYER ? TEAM.ENEMY : TEAM.PLAYER;
  for (const structureTarget of [false, true]) for (const offset of [-lane.width * 0.3, 0, lane.width * 0.3]) {
    const simulation = new BattleSimulation({ state: createBattleState({ map }) });
    const target = structureTarget
      ? [...simulation.state.structures.values()].find((s) => s.team === other && s.structureType === "hq")
      : simulation.spawnUnit(other, lane.id, "frigate", { x: lane.centerX + offset, y: 590, spawnCycle: 1 });
    target.hp = target.maxHp = 1e9;
    const members = Array.from({ length: 12 }, (_, i) => simulation.spawnUnit(team, lane.id, ["scout", "fighter", "bomber", "frigate"][i % 4], { x: lane.centerX, y: target.y - direction * 160, spawnCycle: 100 + i }));
    const assignments = new Map(members.map((u) => [u.id, target.id]));
    const slots = simulation.combatSlotsFor(assignments);
    for (const unit of members) {
      const definition = UNIT_DEFINITIONS[unit.unitType];
      const destination = simulation.tacticalPosition(unit, target, definition, slots.get(unit.id));
      assert.ok(Math.hypot(destination.x - target.x, destination.y - target.y) < definition.attackRange, `${map.id}/${lane.id}/${unit.unitType}: every combat destination must reach its target`);
      const inset = definition.collisionRadius + 5;
      assert.ok(destination.x >= lane.centerX - lane.width / 2 + inset - 1e-6 && destination.x <= lane.centerX + lane.width / 2 - inset + 1e-6, "firing positions respect the same lane bounds as movement");
      unit.x = destination.x;
      unit.y = destination.y;
      unit.heading = destination.heading;
      unit.fireCooldown = 0;
    }
    // Keep the target stationary to distinguish formation failures from pursuit.
    for (let step = 0; step < 180; step += 1) {
      simulation.state.time += CONFIG.timing.fixedStepSeconds;
      for (const unit of members) simulation.updateUnit(unit, CONFIG.timing.fixedStepSeconds, null, assignments, slots);
      simulation.applyDamage(simulation.updateProjectiles(CONFIG.timing.fixedStepSeconds));
    }
    assert.ok(members.every((unit) => Number.isFinite(unit.lastShotAt)), "all roles and rear members actually fire from the assigned formation");
    assert.ok(target.hp < target.maxHp, "the formation delivers damage, not just nominal firing positions");
    scenarios += 1;
  }
}

const advance = new BattleSimulation({ state: createBattleState({ map: ORBITAL_GARDEN }) });
const lane = ORBITAL_GARDEN.lanes[0];
const survivor = advance.spawnUnit(TEAM.PLAYER, lane.id, "fighter", { x: 210, y: 610 });
const defeated = advance.spawnUnit(TEAM.ENEMY, lane.id, "drone", { x: 210, y: 550 });
for (let i = 0; i < 120; i += 1) advance.step(1 / 60);
defeated.alive = false;
const before = survivor.y;
for (let i = 0; i < 240; i += 1) advance.step(1 / 60);
assert.ok(survivor.y < before - 20, "surviving ships resume advancing after target loss");
console.log(`Combat geometry and actual fire verified in ${scenarios} mirrored ship/structure scenarios; target-loss advance passed.`);
