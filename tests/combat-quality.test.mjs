import assert from "node:assert/strict";
import { CONFIG } from "../src/config.js";
import { TEAM } from "../src/core/constants.js";
import { ORBITAL_GARDEN, CLASSIC_LANES, UNIT_DEFINITIONS } from "../src/data/definitions.js";
import { BattleSimulation } from "../src/simulation/battleSimulation.js";
import { createBattleState } from "../src/simulation/battleState.js";
import { planUnitTargets } from "../src/simulation/targeting.js";
import { MatchDirector } from "../src/simulation/matchDirector.js";

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
    for (const type of ["scout_pulse", "fighter_laser", "siege_missile", "heavy_cannon"]) {
      assert.ok(simulation.state.events.some((event) => event.type === "hit" && event.projectileType === type && event.hullDamage > 0), `${type} actually hits the assigned target`);
    }
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

for (const team of [TEAM.PLAYER, TEAM.ENEMY]) {
  const simulation = new BattleSimulation({ state: createBattleState({ map: ORBITAL_GARDEN }) });
  const other = team === TEAM.PLAYER ? TEAM.ENEMY : TEAM.PLAYER;
  const direction = team === TEAM.PLAYER ? -1 : 1;
  const bomber = simulation.spawnUnit(team, lane.id, "bomber", { x: 210, y: 590 });
  const heavy = simulation.spawnUnit(other, lane.id, "frigate", { x: 210, y: 590 + direction * 110 });
  const light = simulation.spawnUnit(other, lane.id, "fighter", { x: 220, y: 590 + direction * 70 });
  assert.equal(planUnitTargets(simulation.state).get(bomber.id), heavy.id, "bomber counters the local heavy ship before a distant carrier");
  heavy.alive = false;
  assert.equal(planUnitTargets(simulation.state).get(bomber.id), light.id, "bomber engages the remaining local front instead of chasing a distant carrier");
  light.alive = false;
  const carrier = [...simulation.state.structures.values()].find((s) => s.team === other);
  assert.equal(planUnitTargets(simulation.state).get(bomber.id), carrier.id, "bomber advances to siege the carrier after the local front clears");
}
console.log("Mirrored bomber heavy-target, fallback and carrier advance checks passed.");

const emergency = new MatchDirector({ mapDefinition: ORBITAL_GARDEN });
emergency.start();
for (let i = 0; i < 8; i += 1) emergency.simulation.spawnUnit(TEAM.PLAYER, lane.id, "fighter", { x: 210 + i * 4, y: 100, spawnCycle: 800 + i });
emergency.liveDeployment.advance(10);
emergency.economy.get(TEAM.ENEMY).energy = 150;
emergency.ai.upgradePlan = { upgradeId: "economy", targetEnergy: 310 };
const response = emergency.ai.plan(emergency).decision;
assert.ok(response.purchases.length > 0 && response.upgrades.length === 0, "AI interrupts an investment to reinforce an immediately threatened carrier");
assert.equal(emergency.ai.upgradePlan, null);
assert.equal(emergency.economy.get(TEAM.ENEMY).energy, 60, "emergency reinforcement still pays the normal player cost");
console.log("Carrier emergency interrupts banking and uses normal deployment costs.");

const spacing = new BattleSimulation({ state: createBattleState({ map: ORBITAL_GARDEN }) });
const left = spacing.spawnUnit(TEAM.PLAYER, lane.id, "fighter", { x: 200, y: 650, spawnCycle: 901 });
const right = spacing.spawnUnit(TEAM.PLAYER, lane.id, "fighter", { x: 220, y: 660, spawnCycle: 902 });
spacing.combatSlots.set(left.id, { lateral: 44 });
spacing.combatSlots.set(right.id, { lateral: -44 });
const separated = spacing.resolveLaneSpacing(1 / 60);
assert.ok(separated.get(left.id) < 0 && separated.get(right.id) > 0, "independent target-local slot signs never pull overlapping allies together");
assert.ok(left.separationVy < 0 && right.separationVy > 0, "depth overlaps receive opposing spacing pressure");

const opening = new MatchDirector({ mapDefinition: ORBITAL_GARDEN });
opening.start();
assert.equal(opening.ai.laneAssessment(opening, lane.id).threat, 0, "still-launching purchases cannot bias sequential opening decisions");
const launchEvents = opening.simulation.state.events.filter((event) => event.type === "launch");
assert.equal(launchEvents.length, 1, "only the paid opening emits navigator launch feedback");
const launchCount = launchEvents.length;
opening.executeCommand({ type: "DEPLOY_UNIT", team: TEAM.ENEMY, laneId: lane.id, unitType: "fighter" });
assert.equal(opening.simulation.state.events.filter((event) => event.type === "launch").length, launchCount, "a rejected purchase never announces a launch");
console.log("Overlap direction, unbiased launch assessment and successful-only launch feedback passed.");

const birthOrder = new BattleSimulation({ state: createBattleState({ map: ORBITAL_GARDEN }) });
for (let i = 0; i < 8; i += 1) birthOrder.state.ids.next();
const older = birthOrder.spawnUnit(TEAM.PLAYER, lane.id, "fighter", { x: 210, y: 650 });
const newer = birthOrder.spawnUnit(TEAM.PLAYER, lane.id, "fighter", { x: 210, y: 650 });
assert.equal(older.id, "entity-9");
assert.equal(newer.id, "entity-10");
const orderedSlots = birthOrder.combatSlotsFor(new Map([[older.id, "enemy-hq"], [newer.id, "enemy-hq"]]));
assert.equal(orderedSlots.get(older.id).lateral, 0, "the older ship keeps first claim when IDs cross a decimal boundary");
assert.notEqual(orderedSlots.get(newer.id).lateral, 0);
console.log("Decimal ID boundaries preserve chronological formation claims.");
