import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { GameClock } from "../src/core/clock.js";
import { MATCH_STATE } from "../src/core/constants.js";
import { SeededRng } from "../src/core/rng.js";
import { computeViewportTransform, toDesignPoint } from "../src/core/viewport.js";
import { AssetLoader } from "../src/rendering/assetLoader.js";
import { BattleSimulation, createDemoBattle } from "../src/simulation/battleSimulation.js";
import { LANE, TEAM } from "../src/core/constants.js";
import { UNIT_DEFINITIONS } from "../src/data/definitions.js";
import { STRUCTURE_DEFINITIONS } from "../src/data/definitions.js";
import { CONFIG } from "../src/config.js";
import { MatchDirector } from "../src/simulation/matchDirector.js";
import { ASSET_GROUPS } from "../src/assets.js";
import { PresentationEffects } from "../src/rendering/presentationEffects.js";
import { commandActionAt, fullscreenActionAt } from "../src/ui/commandUi.js";

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

const match = new MatchDirector({ config: { ...CONFIG, timing: { ...CONFIG.timing, commandPhaseSeconds: 0.1, battlePhaseSeconds: 0.2 } } });
match.start();
assert.equal(match.state, MATCH_STATE.COMMAND);
assert.equal(match.simulation.state.units.size, 0);
match.advanceCommand(0.1);
assert.equal(match.state, MATCH_STATE.BATTLE);
assert.equal(match.cycle, 1);
assert.ok(match.simulation.state.units.size >= 8);
assert.equal(match.simulation.state.lanes.get(LANE.LEFT).unitIds.get(TEAM.PLAYER).length, 2);
assert.ok(match.simulation.state.lanes.get(LANE.LEFT).unitIds.get(TEAM.ENEMY).length >= 2);
const positionsBeforePause = match.simulation.snapshot();
match.pause();
assert.equal(match.advanceBattle(1 / 60), false);
assert.deepEqual(match.simulation.snapshot(), positionsBeforePause);
match.resume();
for (let index = 0; index < 12; index += 1) match.advanceBattle(1 / 60);
assert.equal(match.state, MATCH_STATE.COMMAND);
assert.equal(match.cycle, 1);
const survivorIds = new Set(match.simulation.snapshot().units.map((unit) => unit.id));
match.deployNow();
assert.equal(match.state, MATCH_STATE.BATTLE);
assert.equal(match.cycle, 2);
assert.ok([...survivorIds].every((id) => match.simulation.state.units.has(id)));

const terminalMatch = new MatchDirector();
terminalMatch.start();
terminalMatch.deployNow();
terminalMatch.simulation.state.terminalTeam = TEAM.PLAYER;
terminalMatch.advanceBattle(1 / 60);
assert.equal(terminalMatch.state, MATCH_STATE.VICTORY);
terminalMatch.restart();
assert.equal(terminalMatch.state, MATCH_STATE.COMMAND);
assert.equal(terminalMatch.simulation.state.units.size, 0);

const manualCommandMatch = new MatchDirector();
manualCommandMatch.start();
assert.equal(manualCommandMatch.phaseRemaining, null);
assert.equal(manualCommandMatch.advanceCommand(999), false);
assert.equal(manualCommandMatch.state, MATCH_STATE.COMMAND);
manualCommandMatch.deployNow();
assert.equal(manualCommandMatch.state, MATCH_STATE.BATTLE);

const formationSimulation = new BattleSimulation();
const formation = formationSimulation.spawnFormation(TEAM.PLAYER, LANE.LEFT, ["scout", "scout", "scout", "scout", "scout", "scout"]);
assert.equal(new Set(formation.map((unit) => unit.y)).size, 2);
formationSimulation.step(1 / 60);
assert.ok(formation.every((unit) => Math.abs(unit.x - 112) <= 47));

const economyMatch = new MatchDirector();
economyMatch.start();
assert.equal(economyMatch.economy.get(TEAM.PLAYER).energy, 300);
economyMatch.advanceCommand(1);
assert.equal(economyMatch.economy.get(TEAM.PLAYER).energy, 300);
const queued = economyMatch.executeCommand({ type: "QUEUE_UNIT", team: TEAM.PLAYER, laneId: LANE.LEFT, unitType: "fighter" });
assert.equal(queued.ok, true);
assert.equal(economyMatch.economy.get(TEAM.PLAYER).energy, 210);
const removed = economyMatch.executeCommand({ type: "REMOVE_QUEUED_UNIT", team: TEAM.PLAYER, laneId: LANE.LEFT, queueEntryId: queued.entry.id });
assert.deepEqual({ ok: removed.ok, refunded: removed.refunded }, { ok: true, refunded: 90 });
assert.equal(economyMatch.economy.get(TEAM.PLAYER).energy, 300);
const economyUpgrade = economyMatch.executeCommand({ type: "BUY_UPGRADE", team: TEAM.PLAYER, upgradeId: "economy" });
assert.deepEqual({ ok: economyUpgrade.ok, cost: economyUpgrade.cost, level: economyUpgrade.level }, { ok: true, cost: 240, level: 1 });
assert.equal(economyMatch.economy.get(TEAM.PLAYER).energy, 60);
assert.equal(economyMatch.economy.incomePerSecond(economyMatch.simulation.state, TEAM.PLAYER, 0), 24);
economyMatch.deployNow();
economyMatch.advanceBattle(1);
assert.equal(economyMatch.economy.get(TEAM.PLAYER).energy, 84);

const captureMatch = new MatchDirector();
captureMatch.start();
const captureUnit = captureMatch.simulation.spawnUnit(TEAM.PLAYER, LANE.LEFT, "scout", { x: 112, y: 332 });
captureMatch.capture.advance(captureMatch.simulation.state, 2);
const leftNode = captureMatch.simulation.state.nodes.get("left-node");
assert.equal(leftNode.ownerTeam, TEAM.PLAYER);
const enemyCaptor = captureMatch.simulation.spawnUnit(TEAM.ENEMY, LANE.LEFT, "scout", { x: 112, y: 332 });
captureMatch.capture.advance(captureMatch.simulation.state, 1);
assert.equal(leftNode.contested, true);
assert.equal(leftNode.progress, 100);
captureUnit.alive = false;
captureMatch.capture.advance(captureMatch.simulation.state, 2.1);
assert.equal(leftNode.ownerTeam, null);
assert.ok(leftNode.progress < 0);
leftNode.ownerTeam = TEAM.PLAYER;
leftNode.progress = 100;
assert.equal(captureMatch.economy.incomePerSecond(captureMatch.simulation.state, TEAM.PLAYER, 120), 45);

const turretMatch = new MatchDirector();
turretMatch.start();
const turretUpgrade = turretMatch.executeCommand({ type: "BUY_UPGRADE", team: TEAM.PLAYER, upgradeId: "turret" });
assert.equal(turretUpgrade.ok, true);
const playerTurret = turretMatch.simulation.state.structures.get("player-left-turret");
assert.equal(turretMatch.simulation.damageFor(playerTurret, STRUCTURE_DEFINITIONS.turret), STRUCTURE_DEFINITIONS.turret.damage * 1.2);

const capacityMatch = new MatchDirector({ config: { ...CONFIG, caps: { ...CONFIG.caps, unitsPerLaneTeam: 2 } } });
capacityMatch.start();
const rejected = capacityMatch.executeCommand({ type: "QUEUE_UNIT", team: TEAM.PLAYER, laneId: LANE.LEFT, unitType: "scout" });
assert.deepEqual(rejected, { ok: false, reason: "CAPACITY_RESERVED" });
assert.equal(capacityMatch.economy.get(TEAM.PLAYER).energy, 300);

const aiMatch = new MatchDirector();
aiMatch.start();
assert.ok(aiMatch.lastAiDecision);
assert.equal(aiMatch.lastAiDecision.team, TEAM.ENEMY);
assert.ok(aiMatch.lastAiDecision.purchases.length > 0);
assert.ok(aiMatch.lastAiDecision.spent <= 300);
assert.ok(aiMatch.economy.get(TEAM.ENEMY).energy >= 0);
const aiQueuedBeforeBattle = [LANE.LEFT, LANE.RIGHT].flatMap((laneId) => aiMatch.queuedWaves.get(TEAM.ENEMY).get(laneId));
assert.equal(aiQueuedBeforeBattle.length, aiMatch.lastAiDecision.purchases.length);
aiMatch.deployNow();
for (let index = 0; index < 22 * 60; index += 1) aiMatch.advanceBattle(1 / 60);
assert.equal(aiMatch.state, MATCH_STATE.COMMAND);
assert.equal(aiMatch.lastAiDecision.cycle, 2);
assert.ok(aiMatch.economy.get(TEAM.ENEMY).energy >= 0);

for (const path of Object.values(ASSET_GROUPS.boot)) await access(new URL(`../${path}`, import.meta.url));
const effects = new PresentationEffects();
effects.observe([{ type: "hit", x: 12, y: 24, team: TEAM.PLAYER }, { type: "destroyed", x: 48, y: 96, team: TEAM.ENEMY }]);
assert.equal(effects.effects.length, 2);
effects.update(1);
assert.equal(effects.effects.length, 0);

assert.deepEqual(commandActionAt({ x: 24, y: 224 }), { type: "SELECT_LANE", laneId: LANE.LEFT });
assert.deepEqual(commandActionAt({ x: 344, y: 224 }), { type: "SELECT_LANE", laneId: LANE.RIGHT });
assert.deepEqual(commandActionAt({ x: 24, y: 662 }), { type: "QUEUE_UNIT", unitType: "scout" });
assert.deepEqual(commandActionAt({ x: 160, y: 662 }), { type: "QUEUE_UNIT", unitType: "fighter" });
assert.deepEqual(commandActionAt({ x: 300, y: 620 }), { type: "TOGGLE_MENU" });
assert.deepEqual(commandActionAt({ x: 160, y: 662 }, "upgrades"), { type: "BUY_UPGRADE", upgradeId: "turret" });
assert.deepEqual(commandActionAt({ x: 300, y: 662 }), { type: "DEPLOY" });
assert.deepEqual(fullscreenActionAt({ x: 380, y: 26 }), { type: "TOGGLE_FULLSCREEN" });
assert.equal(fullscreenActionAt({ x: 210, y: 26 }), null);

console.log(`Foundation, battle, match, and economy checks passed for ${targetViewports.length} target viewports.`);
