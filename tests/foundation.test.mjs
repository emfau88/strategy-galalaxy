import assert from "node:assert/strict";
import { GameClock } from "../src/core/clock.js";
import { MATCH_STATE } from "../src/core/constants.js";
import { SeededRng } from "../src/core/rng.js";
import { computeViewportTransform, toDesignPoint } from "../src/core/viewport.js";
import { AssetLoader } from "../src/rendering/assetLoader.js";
import { BattleSimulation, createDemoBattle } from "../src/simulation/battleSimulation.js";
import { LANE, TEAM } from "../src/core/constants.js";
import { UNIT_DEFINITIONS } from "../src/data/definitions.js";

const timing = { fixedStepSeconds: 1 / 60, maxFrameDeltaSeconds: 0.1, maxCatchUpSteps: 6 };
const targetViewports = [[360, 800], [390, 844], [393, 852], [412, 915], [420, 760]];
for (const [viewportWidth, viewportHeight] of targetViewports) {
  const transform = computeViewportTransform({ viewportWidth, viewportHeight, designWidth: 420, designHeight: 760, devicePixelRatio: 2, maxDevicePixelRatio: 1.5 });
  assert.ok(transform.scale > 0, `${viewportWidth}x${viewportHeight} receives a positive scale`);
  assert.ok(transform.contentWidth <= viewportWidth + 0.001);
  assert.ok(transform.contentHeight <= viewportHeight + 0.001);
  const center = toDesignPoint(transform.offsetX + 210 * transform.scale, transform.offsetY + 380 * transform.scale, { left: 0, top: 0 }, transform);
  assert.ok(Math.abs(center.x - 210) < 0.0001);
  assert.ok(Math.abs(center.y - 380) < 0.0001);
}

const clock = new GameClock(timing);
clock.advance(1, MATCH_STATE.COMMAND);
assert.equal(clock.phaseElapsed, 0.1);
assert.equal(clock.simulationTime, 0);
clock.advance(0.05, MATCH_STATE.BATTLE);
assert.equal(clock.simulationTime, 0.05);
const frozenSimulation = clock.simulationTime;
const frozenPhase = clock.phaseElapsed;
clock.advance(0.05, MATCH_STATE.PAUSED);
assert.equal(clock.simulationTime, frozenSimulation);
assert.equal(clock.phaseElapsed, frozenPhase);
assert.equal(clock.frameTime, 0.2);

const first = new SeededRng(77);
const second = new SeededRng(77);
assert.deepEqual([first.next(), first.next(), first.next()], [second.next(), second.next(), second.next()]);

const loader = await new AssetLoader(Object.freeze({})).load();
assert.equal(loader.progress, 1);
assert.equal(loader.isSettled, true);

const laneSimulation = new BattleSimulation();
laneSimulation.spawnFormation(TEAM.PLAYER, LANE.LEFT, ["scout", "fighter"]);
laneSimulation.spawnFormation(TEAM.ENEMY, LANE.LEFT, ["scout", "frigate"]);
laneSimulation.spawnFormation(TEAM.PLAYER, LANE.RIGHT, ["bomber"]);
laneSimulation.spawnFormation(TEAM.ENEMY, LANE.RIGHT, ["fighter"]);
for (let index = 0; index < 900; index += 1) laneSimulation.step(1 / 60);
assert.ok(laneSimulation.state.events.some((event) => event.type === "hit"));
assert.ok([...laneSimulation.state.units.values()].every((unit) => unit.laneId === LANE.LEFT || unit.laneId === LANE.RIGHT));
assert.ok([...laneSimulation.state.projectiles.values()].every((projectile) => projectile.laneId === LANE.LEFT || projectile.laneId === LANE.RIGHT));

const isolatedLanes = new BattleSimulation();
const leftUnit = isolatedLanes.spawnUnit(TEAM.PLAYER, LANE.LEFT, "scout", { x: 132, y: 330 });
const rightEnemy = isolatedLanes.spawnUnit(TEAM.ENEMY, LANE.RIGHT, "scout", { x: 288, y: 330 });
isolatedLanes.step(1 / 60);
assert.notEqual(leftUnit.targetId, rightEnemy.id);
assert.equal(leftUnit.targetId, "enemy-left-turret");

assert.notEqual(UNIT_DEFINITIONS.scout.speed, UNIT_DEFINITIONS.frigate.speed);
assert.ok(UNIT_DEFINITIONS.frigate.maxHp > UNIT_DEFINITIONS.fighter.maxHp);
assert.ok(UNIT_DEFINITIONS.bomber.damage > UNIT_DEFINITIONS.fighter.damage);
assert.equal(UNIT_DEFINITIONS.battlecruiser.enabled, false);
assert.equal(UNIT_DEFINITIONS.dreadnought.enabled, false);

const hqSimulation = new BattleSimulation();
const enemyTurret = hqSimulation.state.structures.get("enemy-left-turret");
enemyTurret.alive = false;
const enemyHq = hqSimulation.state.structures.get("enemy-hq");
enemyHq.hp = 34;
hqSimulation.spawnUnit(TEAM.PLAYER, LANE.LEFT, "bomber", { x: 180, y: 118 });
for (let index = 0; index < 600 && !hqSimulation.state.terminalTeam; index += 1) hqSimulation.step(1 / 60);
assert.equal(hqSimulation.state.terminalTeam, TEAM.PLAYER);
assert.ok(hqSimulation.state.events.some((event) => event.type === "shot" && event.ownerId === "enemy-hq"));

const turretSimulation = new BattleSimulation();
const intruder = turretSimulation.spawnUnit(TEAM.ENEMY, LANE.LEFT, "scout", { x: 132, y: 555 });
for (let index = 0; index < 180; index += 1) turretSimulation.step(1 / 60);
assert.ok(turretSimulation.state.events.some((event) => event.type === "shot" && event.ownerId === "player-left-turret"));
assert.ok(!turretSimulation.state.units.has(intruder.id) || turretSimulation.state.units.get(intruder.id).hp < intruder.maxHp);

const firstBattle = createDemoBattle();
const secondBattle = createDemoBattle();
for (let index = 0; index < 480; index += 1) {
  firstBattle.step(1 / 60);
  secondBattle.step(1 / 60);
}
assert.deepEqual(firstBattle.snapshot(), secondBattle.snapshot());

console.log(`Foundation and battle checks passed for ${targetViewports.length} target viewports.`);
