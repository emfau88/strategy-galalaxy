import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { GameClock } from "../src/core/clock.js";
import { BattlefieldCamera } from "../src/core/battlefieldCamera.js";
import { MATCH_STATE } from "../src/core/constants.js";
import { SeededRng } from "../src/core/rng.js";
import { computeViewportTransform, responsivePortraitDesignHeight, toDesignPoint } from "../src/core/viewport.js";
import { AssetLoader } from "../src/rendering/assetLoader.js";
import { BattleSimulation, createDemoBattle } from "../src/simulation/battleSimulation.js";
import { LANE, TEAM } from "../src/core/constants.js";
import { CLASSIC_LANES, ORBITAL_GARDEN, STRUCTURE_DEFINITIONS, UNIT_DEFINITIONS } from "../src/data/definitions.js";
import { CONFIG } from "../src/config.js";
import { MatchDirector } from "../src/simulation/matchDirector.js";
import { AI_PROFILES } from "../src/simulation/opponentAi.js";
import { createBattleState, emitSimulationEvent } from "../src/simulation/battleState.js";
import { acquireStructureTarget, acquireUnitTarget } from "../src/simulation/targeting.js";
import { ASSET_GROUPS } from "../src/assets.js";
import { PresentationEffects } from "../src/rendering/presentationEffects.js";
import { SoundSystem } from "../src/audio/soundSystem.js";
import { commandActionAt, commandUiLayout, endActionAt, fullscreenActionAt, pauseActionAt, titleActionAt, utilityActionAt } from "../src/ui/commandUi.js";
import { cameraNavigatorRatioAt } from "../src/ui/cameraUi.js";

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

  const responsiveHeight = responsivePortraitDesignHeight({ viewportWidth, viewportHeight, designWidth: 420, minimumDesignHeight: 760 });
  const responsiveTransform = computeViewportTransform({ viewportWidth, viewportHeight, designWidth: 420, designHeight: responsiveHeight, devicePixelRatio: 2, maxDevicePixelRatio: 1.5 });
  assert.ok(Math.abs(responsiveTransform.contentHeight - viewportHeight) < 0.001, `${viewportWidth}x${viewportHeight} uses the full portrait height`);
  assert.ok(Math.abs(responsiveTransform.offsetY) < 0.001, `${viewportWidth}x${viewportHeight} has no portrait letterbox`);
}

const camera = new BattlefieldCamera({
  worldHeight: CLASSIC_LANES.bounds.height,
  designWidth: CONFIG.app.designWidth,
  designHeight: CONFIG.app.designHeight,
  config: CONFIG.camera,
});
assert.equal(camera.viewport.height, 622);
assert.equal(camera.y, camera.maximumY, "camera begins at the player HQ sector");
camera.beginPan(180, 0);
camera.panTo(380, 16);
assert.ok(camera.y < camera.maximumY, "dragging downward pans toward the enemy sector");
camera.endPan();
const releasedCameraY = camera.y;
camera.update(1 / 60);
assert.ok(camera.y < releasedCameraY, "released camera retains bounded inertia");
camera.jumpToRatio(0.5);
assert.ok(Math.abs(camera.screenToWorldY(camera.worldToScreenY(590)) - 590) < 0.0001);
assert.ok(Math.abs(cameraNavigatorRatioAt({ x: 405, y: camera.viewport.y + camera.viewport.height / 2 }, camera.viewport) - 0.5) < 0.02);
camera.setBottomInset(CONFIG.camera.battlefieldCommandBottomInset);
assert.equal(camera.viewport.height, 462);
camera.resize(CONFIG.app.designWidth, 909);
assert.equal(camera.viewport.height, 611);
camera.setBottomInset(CONFIG.camera.battlefieldBottomInset);
assert.equal(camera.viewport.height, 771);
assert.ok(camera.y >= 0 && camera.y <= camera.maximumY);

const clock = new GameClock(timing);
clock.advance(0.1, MATCH_STATE.LIVE_MATCH);
assert.equal(clock.phaseElapsed, 0.1);
assert.ok(Math.abs(clock.simulationTime - 0.1) < 0.000001);
const frozenSimulation = clock.simulationTime;
const frozenPhase = clock.phaseElapsed;
clock.advance(0.05, MATCH_STATE.PAUSED);
assert.equal(clock.simulationTime, frozenSimulation);
assert.equal(clock.phaseElapsed, frozenPhase);
assert.ok(Math.abs(clock.frameTime - 0.15) < 0.000001);

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
const leftUnit = isolatedLanes.spawnUnit(TEAM.PLAYER, LANE.LEFT, "fighter", { x: 132, y: 330 });
const rightEnemy = isolatedLanes.spawnUnit(TEAM.ENEMY, LANE.RIGHT, "scout", { x: 288, y: 330 });
isolatedLanes.step(1 / 60);
assert.notEqual(leftUnit.targetId, rightEnemy.id);
assert.equal(leftUnit.targetId, "enemy-left-turret");

assert.notEqual(UNIT_DEFINITIONS.scout.speed, UNIT_DEFINITIONS.frigate.speed);
assert.ok(UNIT_DEFINITIONS.frigate.maxHp > UNIT_DEFINITIONS.fighter.maxHp);
assert.ok(UNIT_DEFINITIONS.bomber.damage > UNIT_DEFINITIONS.fighter.damage);
assert.ok(UNIT_DEFINITIONS.fighter.fireInterval < UNIT_DEFINITIONS.frigate.fireInterval);
assert.equal(CONFIG.timing.deploymentIntervalSeconds, 22);
assert.equal(CONFIG.timing.deploymentLockSeconds, 2);
assert.equal(CONFIG.caps.projectilesPerLaneTeam, 64);
assert.equal((CLASSIC_LANES.structures.find((structure) => structure.id === "player-hq").y + CLASSIC_LANES.structures.find((structure) => structure.id === "enemy-hq").y) / 2, CLASSIC_LANES.lanes[0].node.y);
assert.equal(UNIT_DEFINITIONS.battlecruiser.enabled, false);
assert.equal(UNIT_DEFINITIONS.dreadnought.enabled, false);

const structureTieSimulation = new BattleSimulation();
structureTieSimulation.spawnUnit(TEAM.PLAYER, LANE.LEFT, "scout", { x: 105, y: 150 });
structureTieSimulation.spawnUnit(TEAM.PLAYER, LANE.RIGHT, "scout", { x: 315, y: 150 });
structureTieSimulation.spawnUnit(TEAM.ENEMY, LANE.LEFT, "scout", { x: 105, y: 1030 });
structureTieSimulation.spawnUnit(TEAM.ENEMY, LANE.RIGHT, "scout", { x: 315, y: 1030 });
const enemyHqTieTarget = acquireStructureTarget(structureTieSimulation.state, structureTieSimulation.state.structures.get("enemy-hq"));
const playerHqTieTarget = acquireStructureTarget(structureTieSimulation.state, structureTieSimulation.state.structures.get("player-hq"));
assert.equal(enemyHqTieTarget.laneId, playerHqTieTarget.laneId, "mirrored HQs resolve equal-distance targets identically");

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
const playerLeftTurret = turretSimulation.state.structures.get("player-left-turret");
const intruder = turretSimulation.spawnUnit(TEAM.ENEMY, LANE.LEFT, "scout", { x: playerLeftTurret.x + 20, y: playerLeftTurret.y - 70 });
for (let index = 0; index < 180; index += 1) turretSimulation.step(1 / 60);
assert.ok(turretSimulation.state.events.some((event) => event.type === "shot" && event.ownerId === "player-left-turret"));
assert.ok(!turretSimulation.state.units.has(intruder.id) || turretSimulation.state.units.get(intruder.id).hp < intruder.maxHp);

const homeDefenseSimulation = new BattleSimulation({ state: createBattleState({ map: ORBITAL_GARDEN }) });
const freshDefender = homeDefenseSimulation.spawnUnit(TEAM.PLAYER, LANE.CENTER, "fighter", { x: 210, y: 980 });
const baseIntruder = homeDefenseSimulation.spawnUnit(TEAM.ENEMY, LANE.CENTER, "scout", { x: 210, y: 1045 });
assert.equal(acquireUnitTarget(homeDefenseSimulation.state, freshDefender)?.id, baseIntruder.id, "fresh defenders acquire intruders behind them inside the HQ defense zone");
const firstFirePosition = homeDefenseSimulation.tacticalPosition({ ...freshDefender, x: 120, y: 950 }, baseIntruder, UNIT_DEFINITIONS.fighter);
const secondFirePosition = homeDefenseSimulation.tacticalPosition({ ...freshDefender, x: 300, y: 1090 }, baseIntruder, UNIT_DEFINITIONS.fighter);
assert.deepEqual({ x: firstFirePosition.x, y: firstFirePosition.y }, { x: secondFirePosition.x, y: secondFirePosition.y }, "firing positions remain fixed instead of rotating around the target");
assert.ok(Math.hypot(firstFirePosition.x - baseIntruder.x, firstFirePosition.y - baseIntruder.y) >= UNIT_DEFINITIONS.fighter.attackRange * 0.84, "ships hold a readable firing standoff");

const firstBattle = createDemoBattle();
const secondBattle = createDemoBattle();
for (let index = 0; index < 480; index += 1) {
  firstBattle.step(1 / 60);
  secondBattle.step(1 / 60);
}
assert.deepEqual(firstBattle.snapshot(), secondBattle.snapshot());

const projectileBudget = new BattleSimulation();
const budgetOwner = projectileBudget.spawnUnit(TEAM.PLAYER, LANE.LEFT, "fighter", { x: 112, y: 330 });
const budgetTarget = projectileBudget.spawnUnit(TEAM.ENEMY, LANE.LEFT, "scout", { x: 112, y: 280 });
for (let index = 0; index < CONFIG.caps.projectilesPerLaneTeam + 5; index += 1) {
  projectileBudget.fire(budgetOwner, budgetTarget, UNIT_DEFINITIONS.fighter);
}
assert.equal(projectileBudget.state.projectiles.size, CONFIG.caps.projectilesPerLaneTeam);
assert.ok(projectileBudget.state.events.some((event) => event.type === "projectile_rejected" && event.reason === "lane_team_budget"));

const salvoSimulation = new BattleSimulation();
const salvoScout = salvoSimulation.spawnUnit(TEAM.PLAYER, LANE.LEFT, "scout", { x: 105, y: 600, spawnCycle: 61 });
const salvoTarget = salvoSimulation.spawnUnit(TEAM.ENEMY, LANE.LEFT, "scout", { x: 105, y: 540, spawnCycle: 61 });
salvoSimulation.fire(salvoScout, salvoTarget, UNIT_DEFINITIONS.scout);
assert.equal(salvoSimulation.state.projectiles.size, 2, "scout fire is presented as a two-shot salvo");
const salvoDamage = [...salvoSimulation.state.projectiles.values()].reduce((sum, projectile) => sum + projectile.damage, 0);
assert.equal(salvoDamage, UNIT_DEFINITIONS.scout.damage, "extra projectiles do not multiply salvo damage");
const hardpointSimulation = new BattleSimulation();
const hardpointFrigate = hardpointSimulation.spawnUnit(TEAM.PLAYER, LANE.LEFT, "frigate", { x: 105, y: 620, spawnCycle: 62 });
const hardpointTarget = hardpointSimulation.spawnUnit(TEAM.ENEMY, LANE.LEFT, "frigate", { x: 105, y: 520, spawnCycle: 62 });
hardpointFrigate.heading = 0;
hardpointSimulation.fire(hardpointFrigate, hardpointTarget, UNIT_DEFINITIONS.frigate);
const broadsideShots = [...hardpointSimulation.state.projectiles.values()];
assert.equal(broadsideShots.length, 3);
assert.equal(new Set(broadsideShots.map((projectile) => Math.round(projectile.x))).size, 3, "frigate salvos originate at three hull hardpoints");
assert.deepEqual(broadsideShots.map((projectile) => Number(projectile.age.toFixed(2))), [0, -0.15, -0.3], "broadside hardpoints launch as a readable sequence");
assert.equal(hardpointSimulation.state.events.filter((event) => event.type === "shot").length, 1);
hardpointSimulation.step(0.16);
assert.equal(hardpointSimulation.state.events.filter((event) => event.type === "shot").length, 2);
hardpointSimulation.step(0.15);
assert.equal(hardpointSimulation.state.events.filter((event) => event.type === "shot").length, 3);

const splitSquadSimulation = new BattleSimulation({ state: createBattleState({ map: ORBITAL_GARDEN }) });
const splitSquad = splitSquadSimulation.spawnFormation(TEAM.PLAYER, LANE.CENTER, ["scout", "fighter"], 77);
splitSquad.forEach((unit) => { unit.launching = false; });
splitSquad[0].state = "HOLDING";
splitSquad[1].state = "ADVANCING";
const splitSquadAnchor = splitSquadSimulation.squads.get(splitSquad[0].formationId);
const anchorBefore = splitSquadAnchor.y;
splitSquadSimulation.advanceSquadAnchors(0.5);
assert.ok(splitSquadAnchor.y < anchorBefore, "one holding ship no longer freezes advancing squadmates");

const boundedEvents = new BattleSimulation();
for (let index = 0; index < 1100; index += 1) emitSimulationEvent(boundedEvents.state, { type: "stress_event" });
assert.equal(boundedEvents.state.events.length, 1024);
assert.equal(boundedEvents.state.events[0].sequence, 77);
assert.equal(boundedEvents.state.events.at(-1).sequence, 1100);

const match = new MatchDirector({ config: { ...CONFIG, timing: { ...CONFIG.timing, deploymentIntervalSeconds: 0.2, deploymentLockSeconds: 0.05 } } });
match.start();
assert.equal(match.state, MATCH_STATE.LIVE_MATCH);
assert.equal(match.cycle, 1);
assert.equal(match.lastDeploymentAt, 0);
assert.equal(match.lastDeploymentAtFor(TEAM.PLAYER, LANE.LEFT), 0);
assert.equal(match.lastDeploymentAtFor(TEAM.ENEMY, LANE.RIGHT), 0);
assert.equal(match.simulation.state.units.size, 12);
assert.equal(match.simulation.state.lanes.get(LANE.LEFT).unitIds.get(TEAM.PLAYER).length, 3);
assert.ok([...match.simulation.state.units.values()].every((unit) => unit.unitType === "drone"), "the automatic opening wave contains only skirmisher drones");
const positionsBeforePause = match.simulation.snapshot();
match.pause();
assert.equal(match.advanceLive(1 / 60), false);
assert.deepEqual(match.simulation.snapshot(), positionsBeforePause);
match.resume();
const survivorIds = new Set(match.simulation.snapshot().units.map((unit) => unit.id));
for (let index = 0; index < 12; index += 1) match.advanceLive(1 / 60);
assert.equal(match.state, MATCH_STATE.LIVE_MATCH);
assert.equal(match.cycle, 2);
assert.ok(match.lastDeploymentAt > 0);
assert.ok([...survivorIds].every((id) => match.simulation.state.units.has(id)));

const terminalMatch = new MatchDirector();
terminalMatch.start();
terminalMatch.simulation.state.terminalTeam = TEAM.PLAYER;
terminalMatch.advanceLive(1 / 60);
assert.equal(terminalMatch.state, MATCH_STATE.VICTORY);
terminalMatch.restart();
assert.equal(terminalMatch.state, MATCH_STATE.LIVE_MATCH);
assert.equal(terminalMatch.simulation.state.units.size, 12);

const simultaneousHqLoss = new BattleSimulation();
simultaneousHqLoss.applyDamage([
  { projectileId: "p1", projectileType: "heavy_cannon", targetId: "player-hq", damage: 1800, ownerTeam: TEAM.ENEMY },
  { projectileId: "p2", projectileType: "heavy_cannon", targetId: "enemy-hq", damage: 1800, ownerTeam: TEAM.PLAYER },
]);
assert.equal(simultaneousHqLoss.state.terminalTeam, TEAM.DRAW, "same-step HQ destruction is a draw rather than an update-order advantage");

const lockMatch = new MatchDirector();
lockMatch.start();
assert.deepEqual(lockMatch.executeCommand({ type: "QUEUE_UNIT", team: TEAM.PLAYER, laneId: LANE.LEFT, unitType: "drone" }), { ok: false, reason: "UNAVAILABLE_UNIT" });
lockMatch.deployment.timeUntilDeployment = CONFIG.timing.deploymentLockSeconds;
assert.equal(lockMatch.queueLocked, true);
assert.deepEqual(lockMatch.executeCommand({ type: "QUEUE_UNIT", team: TEAM.PLAYER, laneId: LANE.LEFT, unitType: "scout" }), { ok: false, reason: "QUEUE_LOCKED" });

const formationSimulation = new BattleSimulation();
const formation = formationSimulation.spawnFormation(TEAM.PLAYER, LANE.LEFT, ["scout", "scout", "scout", "scout", "scout", "scout"]);
assert.ok(formation.every((unit) => unit.launching));
assert.ok(formation.every((unit) => unit.x === 176 && unit.y === 1065), "left-lane ships begin inside the player HQ hangar");
for (let index = 0; index < 60; index += 1) formationSimulation.step(1 / 60);
assert.ok(formation.every((unit) => !unit.launching));
assert.ok(new Set(formation.map((unit) => `${unit.x},${unit.y}`)).size >= 5);
assert.ok(formation.every((unit) => Math.abs(unit.x - CLASSIC_LANES.lanes[0].centerX) <= CLASSIC_LANES.lanes[0].width / 2));

const accelerationSimulation = new BattleSimulation();
for (const structure of accelerationSimulation.state.structures.values()) {
  if (structure.team === TEAM.ENEMY) structure.alive = false;
}
const acceleratingFighter = accelerationSimulation.spawnUnit(TEAM.PLAYER, LANE.LEFT, "fighter", { x: 105, y: 820, spawnCycle: 71 });
accelerationSimulation.step(1 / 60);
assert.ok(Math.hypot(acceleratingFighter.vx, acceleratingFighter.vy) > 0, "ships begin accelerating instead of remaining static");
assert.ok(Math.hypot(acceleratingFighter.vx, acceleratingFighter.vy) < UNIT_DEFINITIONS.fighter.speed, "ships do not jump to full speed in one step");
for (let index = 0; index < 240; index += 1) accelerationSimulation.step(1 / 60);
assert.ok(Math.hypot(acceleratingFighter.vx, acceleratingFighter.vy) <= UNIT_DEFINITIONS.fighter.speed + 1e-6);

const squadSimulation = new BattleSimulation();
for (const structure of squadSimulation.state.structures.values()) {
  if (structure.team === TEAM.ENEMY) structure.alive = false;
}
const stableSquad = squadSimulation.spawnFormation(TEAM.PLAYER, LANE.LEFT, ["fighter", "bomber", "frigate"], 72);
for (let index = 0; index < 240; index += 1) squadSimulation.step(1 / 60);
const [squadFighter, squadBomber, squadFrigate] = stableSquad;
assert.ok(squadFrigate.y < squadFighter.y && squadFighter.y < squadBomber.y, "front, escort, and siege slots stay ordered while advancing");
assert.ok(stableSquad.every((unit) => Math.abs(unit.x - (CLASSIC_LANES.lanes[0].centerX + unit.slotOffsetX)) < 9), "squad members return to their lateral slots");

const broadsideSimulation = new BattleSimulation();
const broadsideFrigate = broadsideSimulation.spawnUnit(TEAM.PLAYER, LANE.LEFT, "frigate", { x: 105, y: 620, slotOffsetX: -30, spawnCycle: 73 });
const broadsideTarget = broadsideSimulation.spawnUnit(TEAM.ENEMY, LANE.LEFT, "fighter", { x: 105, y: 520, spawnCycle: 73 });
for (let index = 0; index < 180; index += 1) broadsideSimulation.step(1 / 60);
const targetBearing = Math.atan2(broadsideTarget.y - broadsideFrigate.y, broadsideTarget.x - broadsideFrigate.x);
const desiredBroadside = targetBearing - broadsideFrigate.broadsideSide * Math.PI / 2;
const broadsideError = Math.abs(Math.atan2(Math.sin(broadsideFrigate.heading - desiredBroadside), Math.cos(broadsideFrigate.heading - desiredBroadside)));
assert.ok(broadsideError < 0.4, "frigates turn their hull perpendicular to the firing line");
assert.ok(broadsideSimulation.state.events.some((event) => event.type === "shot" && event.ownerId === broadsideFrigate.id), "frigates fire after reaching broadside alignment");

const roleTargeting = new BattleSimulation();
const fighterHunter = roleTargeting.spawnUnit(TEAM.PLAYER, LANE.LEFT, "fighter", { x: 112, y: 330 });
roleTargeting.spawnUnit(TEAM.ENEMY, LANE.LEFT, "frigate", { x: 112, y: 280 });
const priorityBomber = roleTargeting.spawnUnit(TEAM.ENEMY, LANE.LEFT, "bomber", { x: 145, y: 270 });
roleTargeting.step(1 / 60);
assert.equal(fighterHunter.targetId, priorityBomber.id, "fighters prioritize vulnerable bombers over the nearest heavy");
const siegeTargeting = new BattleSimulation();
const siegeBomber = siegeTargeting.spawnUnit(TEAM.PLAYER, LANE.LEFT, "bomber", { x: 112, y: 330 });
siegeTargeting.spawnUnit(TEAM.ENEMY, LANE.LEFT, "fighter", { x: 112, y: 290 });
siegeTargeting.step(1 / 60);
assert.equal(siegeBomber.targetId, "enemy-left-turret", "bombers prioritize lane structures over light screens");
assert.ok(roleTargeting.damageMultiplier(fighterHunter, priorityBomber) > 1);
assert.ok(roleTargeting.damageMultiplier(fighterHunter, roleTargeting.state.structures.get("enemy-left-turret")) < 1);
assert.ok(siegeTargeting.damageMultiplier(siegeBomber, siegeTargeting.state.structures.get("enemy-left-turret")) > 1);

const laneBounds = new BattleSimulation();
laneBounds.spawnFormation(TEAM.PLAYER, LANE.LEFT, ["scout", "fighter", "bomber", "frigate", "fighter", "scout"]);
laneBounds.spawnFormation(TEAM.ENEMY, LANE.RIGHT, ["scout", "fighter", "bomber", "frigate", "fighter", "scout"]);
for (let index = 0; index < 300; index += 1) laneBounds.step(1 / 60);
assert.ok([...laneBounds.state.units.values()].every((unit) => unit.laneId === LANE.LEFT ? unit.x >= 42 && unit.x <= 182 : unit.x >= 238 && unit.x <= 378));

const economyMatch = new MatchDirector();
economyMatch.start();
assert.equal(economyMatch.economy.get(TEAM.PLAYER).energy, 300);
const queued = economyMatch.executeCommand({ type: "QUEUE_UNIT", team: TEAM.PLAYER, laneId: LANE.LEFT, unitType: "fighter" });
assert.equal(queued.ok, true);
assert.equal(economyMatch.economy.get(TEAM.PLAYER).energy, 210);
const removed = economyMatch.executeCommand({ type: "REMOVE_QUEUED_UNIT", team: TEAM.PLAYER, laneId: LANE.LEFT, queueEntryId: queued.entry.id });
assert.deepEqual({ ok: removed.ok, refunded: removed.refunded }, { ok: true, refunded: 90 });
assert.equal(economyMatch.economy.get(TEAM.PLAYER).energy, 300);
assert.deepEqual(economyMatch.economy.get(TEAM.PLAYER).spending, { fleet: 0, economy: 0, research: 0 });

const slotMatch = new MatchDirector({ config: { ...CONFIG, balance: { ...CONFIG.balance, startingEnergy: 1000 } } });
slotMatch.start();
for (const [laneId, unitType] of [[LANE.LEFT, "scout"], [LANE.RIGHT, "fighter"], [LANE.LEFT, "bomber"], [LANE.RIGHT, "frigate"]]) {
  assert.equal(slotMatch.executeCommand({ type: "QUEUE_UNIT", team: TEAM.PLAYER, laneId, unitType }).ok, true);
}
const overSlotLimit = slotMatch.executeCommand({ type: "QUEUE_UNIT", team: TEAM.PLAYER, laneId: LANE.LEFT, unitType: "scout" });
assert.deepEqual(overSlotLimit, { ok: false, reason: "REINFORCEMENT_LIMIT" });
const rightQueue = slotMatch.queuedWaves.get(TEAM.PLAYER).get(LANE.RIGHT);
const slotUndo = slotMatch.executeCommand({ type: "REMOVE_QUEUED_UNIT", team: TEAM.PLAYER, laneId: LANE.RIGHT, queueEntryId: rightQueue.at(-1).id });
assert.equal(slotUndo.ok, true);
assert.equal(slotMatch.executeCommand({ type: "QUEUE_UNIT", team: TEAM.PLAYER, laneId: LANE.LEFT, unitType: "scout" }).ok, true, "undo reopens a shared reinforcement slot");
const economyUpgrade = economyMatch.executeCommand({ type: "BUY_UPGRADE", team: TEAM.PLAYER, upgradeId: "economy" });
assert.deepEqual({ ok: economyUpgrade.ok, cost: economyUpgrade.cost, level: economyUpgrade.level }, { ok: true, cost: 220, level: 1 });
assert.equal(economyMatch.economy.get(TEAM.PLAYER).energy, 80);
assert.equal(economyMatch.economy.get(TEAM.PLAYER).spending.economy, 220);
assert.equal(economyMatch.economy.get(TEAM.PLAYER).economyLevel, 0);
assert.equal(economyMatch.economy.get(TEAM.PLAYER).pendingEconomyLevels, 1);
assert.equal(economyMatch.economy.incomePerSecond(economyMatch.simulation.state, TEAM.PLAYER, 0), 16);
economyMatch.forceDeployment();
assert.equal(economyMatch.economy.get(TEAM.PLAYER).economyLevel, 1);
assert.ok(economyMatch.simulation.state.events.some((event) => event.type === "upgrade_activated" && event.upgradeId === "economy" && event.level === 1));
economyMatch.advanceLive(1);
assert.ok(Math.abs(economyMatch.economy.get(TEAM.PLAYER).energy - 99.52) < 0.000001);
economyMatch.economy.get(TEAM.PLAYER).energy = CONFIG.balance.energyCap - 1;
economyMatch.advanceLive(1);
assert.equal(economyMatch.economy.get(TEAM.PLAYER).energy, CONFIG.balance.energyCap, "passive income respects the energy cap");

const escalatingWaveMatch = new MatchDirector();
assert.equal(escalatingWaveMatch.deployment.baseWaveSize(0), 3);
assert.equal(escalatingWaveMatch.deployment.baseWaveSize(120), 3);
assert.equal(escalatingWaveMatch.deployment.baseWaveSize(150), 4);
assert.equal(escalatingWaveMatch.deployment.baseWaveSize(999), 5, "free drone escalation is capped");

const captureMatch = new MatchDirector();
captureMatch.start();
const leftNode = captureMatch.simulation.state.nodes.get("left-node");
const captureUnit = captureMatch.simulation.spawnUnit(TEAM.PLAYER, LANE.LEFT, "scout", { x: leftNode.x, y: leftNode.y + 9 });
captureMatch.capture.advance(captureMatch.simulation.state, 2);
assert.equal(leftNode.ownerTeam, TEAM.PLAYER);
const enemyCaptor = captureMatch.simulation.spawnUnit(TEAM.ENEMY, LANE.LEFT, "scout", { x: leftNode.x, y: leftNode.y + 9 });
captureMatch.capture.advance(captureMatch.simulation.state, 1);
assert.equal(leftNode.contested, true);
assert.equal(leftNode.progress, 100);
captureUnit.alive = false;
captureMatch.capture.advance(captureMatch.simulation.state, 1.1);
assert.equal(leftNode.ownerTeam, null);
assert.ok(leftNode.progress < 0);
leftNode.ownerTeam = TEAM.PLAYER;
leftNode.progress = 100;
assert.equal(captureMatch.economy.incomePerSecond(captureMatch.simulation.state, TEAM.PLAYER, 120), 26.45);

const cappedUpgradeMatch = new MatchDirector();
cappedUpgradeMatch.start();
cappedUpgradeMatch.economy.get(TEAM.PLAYER).energy = 3000;
for (let level = 0; level < CONFIG.balance.economyUpgradeMaxLevel; level += 1) {
  assert.equal(cappedUpgradeMatch.executeCommand({ type: "BUY_UPGRADE", team: TEAM.PLAYER, upgradeId: "economy" }).ok, true);
  cappedUpgradeMatch.forceDeployment();
}
assert.deepEqual(cappedUpgradeMatch.executeCommand({ type: "BUY_UPGRADE", team: TEAM.PLAYER, upgradeId: "economy" }), { ok: false, reason: "MAX_LEVEL" });

const researchMatch = new MatchDirector({ config: { ...CONFIG, balance: { ...CONFIG.balance, startingEnergy: 900 } } });
researchMatch.start();
const researchFighter = researchMatch.simulation.spawnUnit(TEAM.PLAYER, LANE.LEFT, "fighter", { x: 105, y: 820, spawnCycle: 80 });
const baseWeaponDamage = researchMatch.simulation.damageFor(researchFighter, UNIT_DEFINITIONS.fighter);
assert.equal(researchMatch.executeCommand({ type: "BUY_UPGRADE", team: TEAM.PLAYER, upgradeId: "weapons" }).ok, true);
assert.deepEqual(researchMatch.executeCommand({ type: "BUY_UPGRADE", team: TEAM.PLAYER, upgradeId: "logistics" }), { ok: false, reason: "RESEARCH_SLOT_USED" });
assert.equal(researchMatch.simulation.damageFor(researchFighter, UNIT_DEFINITIONS.fighter), baseWeaponDamage, "research waits for the deployment boundary");
researchMatch.forceDeployment();
assert.equal(researchMatch.economy.get(TEAM.PLAYER).weaponLevel, 1);
assert.equal(researchMatch.simulation.damageFor(researchFighter, UNIT_DEFINITIONS.fighter), baseWeaponDamage * 1.12);
assert.equal(researchMatch.economy.get(TEAM.PLAYER).spending.research, 220);

const logisticsMatch = new MatchDirector({ config: { ...CONFIG, balance: { ...CONFIG.balance, startingEnergy: 900 } } });
logisticsMatch.start();
assert.equal(logisticsMatch.economy.reinforcementLimit(TEAM.PLAYER), 4);
assert.equal(logisticsMatch.executeCommand({ type: "BUY_UPGRADE", team: TEAM.PLAYER, upgradeId: "logistics" }).ok, true);
assert.equal(logisticsMatch.economy.reinforcementLimit(TEAM.PLAYER), 4, "pending logistics does not grant an early slot");
logisticsMatch.forceDeployment();
assert.equal(logisticsMatch.economy.reinforcementLimit(TEAM.PLAYER), 5);
logisticsMatch.economy.get(TEAM.PLAYER).energy = 900;
for (let index = 0; index < 5; index += 1) {
  assert.equal(logisticsMatch.executeCommand({ type: "QUEUE_UNIT", team: TEAM.PLAYER, laneId: index % 2 ? LANE.RIGHT : LANE.LEFT, unitType: "scout" }).ok, true);
}
assert.deepEqual(logisticsMatch.executeCommand({ type: "QUEUE_UNIT", team: TEAM.PLAYER, laneId: LANE.LEFT, unitType: "scout" }), { ok: false, reason: "REINFORCEMENT_LIMIT" });

const replanMatch = new MatchDirector({ aiProfile: AI_PROFILES.ADMIRAL });
replanMatch.start();
const firstEnemyQueueIds = [LANE.LEFT, LANE.RIGHT].flatMap((laneId) => replanMatch.queuedWaves.get(TEAM.ENEMY).get(laneId).map((entry) => entry.id));
replanMatch.deployment.timeUntilDeployment = CONFIG.timing.aiReplanSecondsBeforeDeployment + 0.01;
replanMatch.advanceLive(1 / 60);
const revisedEnemyQueueIds = [LANE.LEFT, LANE.RIGHT].flatMap((laneId) => replanMatch.queuedWaves.get(TEAM.ENEMY).get(laneId).map((entry) => entry.id));
assert.equal(replanMatch.aiReplannedForCycle, replanMatch.cycle);
assert.ok(revisedEnemyQueueIds.length > 0);
assert.ok(revisedEnemyQueueIds.every((id) => !firstEnemyQueueIds.includes(id)), "AI revises through refunded public queue commands");
assert.ok(replanMatch.economy.get(TEAM.ENEMY).energy >= 0);

const scoutCapture = new MatchDirector();
scoutCapture.start();
const captureNode = scoutCapture.simulation.state.nodes.get("left-node");
scoutCapture.simulation.spawnUnit(TEAM.PLAYER, LANE.LEFT, "scout", { x: captureNode.x, y: captureNode.y + 9 });
scoutCapture.capture.advance(scoutCapture.simulation.state, 0.5);
const fighterCapture = new MatchDirector();
fighterCapture.start();
fighterCapture.simulation.spawnUnit(TEAM.PLAYER, LANE.LEFT, "fighter", { x: captureNode.x, y: captureNode.y + 9 });
fighterCapture.capture.advance(fighterCapture.simulation.state, 0.5);
assert.ok(scoutCapture.simulation.state.nodes.get("left-node").progress > fighterCapture.simulation.state.nodes.get("left-node").progress, "scouts capture faster than fighters");

const turretMatch = new MatchDirector();
turretMatch.start();
const turretUpgrade = turretMatch.executeCommand({ type: "BUY_UPGRADE", team: TEAM.PLAYER, upgradeId: "turret" });
assert.equal(turretUpgrade.ok, true);
const playerTurret = turretMatch.simulation.state.structures.get("player-left-turret");
assert.equal(turretMatch.simulation.damageFor(playerTurret, STRUCTURE_DEFINITIONS.turret), STRUCTURE_DEFINITIONS.turret.damage);
turretMatch.forceDeployment();
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
const cadetMatch = new MatchDirector({ aiProfile: AI_PROFILES.CADET });
cadetMatch.start();
assert.ok(cadetMatch.lastAiDecision.purchases.length <= 2);
assert.equal(cadetMatch.lastAiDecision.upgrades.length, 0);
const aiQueuedBeforeBattle = [LANE.LEFT, LANE.RIGHT].flatMap((laneId) => aiMatch.queuedWaves.get(TEAM.ENEMY).get(laneId));
assert.equal(aiQueuedBeforeBattle.length, aiMatch.lastAiDecision.purchases.length);
assert.ok(aiQueuedBeforeBattle.length <= CONFIG.balance.maxPurchasedReinforcementsPerDeployment);
for (let index = 0; index < CONFIG.timing.deploymentIntervalSeconds * 60; index += 1) aiMatch.advanceLive(1 / 60);
assert.equal(aiMatch.state, MATCH_STATE.LIVE_MATCH);
assert.equal(aiMatch.cycle, 2);
assert.equal(aiMatch.lastAiDecision.cycle, 3);
assert.ok(aiMatch.economy.get(TEAM.ENEMY).energy >= 0);

for (const path of Object.values(ASSET_GROUPS.boot)) await access(new URL(`../${path}`, import.meta.url));
const effects = new PresentationEffects();
effects.observe([{ type: "hit", x: 12, y: 24, team: TEAM.PLAYER }, { type: "destroyed", x: 48, y: 96, team: TEAM.ENEMY }, { type: "upgrade_activated", x: 210, y: 1090, team: TEAM.PLAYER, upgradeId: "economy", level: 1 }]);
assert.ok(effects.effects.some((effect) => effect.type === "upgrade" && effect.upgradeId === "economy"));
assert.equal(effects.effects.length, 3);
effects.update(1);
assert.equal(effects.effects.length, 1);

assert.deepEqual(commandActionAt({ x: 50, y: 718 }), { type: "TOGGLE_COMMAND_DOCK" });
assert.equal(commandActionAt({ x: 24, y: 620 }), null, "ship cards stay hidden in the compact dock");
assert.deepEqual(commandActionAt({ x: 40, y: 726 }, "units", 760, [LANE.LEFT, LANE.RIGHT], true), { type: "SELECT_LANE", laneId: LANE.LEFT });
assert.deepEqual(commandActionAt({ x: 82, y: 726 }, "units", 760, [LANE.LEFT, LANE.RIGHT], true), { type: "SELECT_LANE", laneId: LANE.RIGHT });
assert.deepEqual(commandActionAt({ x: 24, y: 620 }, "units", 760, [LANE.LEFT, LANE.RIGHT], true), { type: "QUEUE_UNIT", unitType: "scout" });
assert.deepEqual(commandActionAt({ x: 220, y: 620 }, "units", 760, [LANE.LEFT, LANE.RIGHT], true), { type: "QUEUE_UNIT", unitType: "fighter" });
assert.deepEqual(commandActionAt({ x: 300, y: 565 }, "units", 760, [LANE.LEFT, LANE.RIGHT], true), { type: "SET_COMMAND_MENU", menu: "upgrades" });
assert.deepEqual(commandActionAt({ x: 220, y: 620 }, "upgrades", 760, [LANE.LEFT, LANE.RIGHT], true), { type: "BUY_UPGRADE", upgradeId: "weapons" });
assert.deepEqual(commandActionAt({ x: 24, y: 676 }, "upgrades", 760, [LANE.LEFT, LANE.RIGHT], true), { type: "BUY_UPGRADE", upgradeId: "turret" });
assert.deepEqual(commandActionAt({ x: 220, y: 676 }, "upgrades", 760, [LANE.LEFT, LANE.RIGHT], true), { type: "BUY_UPGRADE", upgradeId: "logistics" });
assert.deepEqual(commandActionAt({ x: 80, y: 726 }, "units", 760, [LANE.CENTER], true), { type: "SELECT_LANE", laneId: LANE.CENTER });
const tallCommandUi = commandUiLayout(909, [LANE.LEFT, LANE.RIGHT], true);
assert.equal(tallCommandUi.panel.y, 683);
assert.equal(tallCommandUi.status.y + tallCommandUi.status.height, 893);
assert.equal(tallCommandUi.lanes[0].y, 857);
assert.deepEqual(commandActionAt({ x: 24, y: 769 }, "units", 909, [LANE.LEFT, LANE.RIGHT], true), { type: "QUEUE_UNIT", unitType: "scout" });
assert.deepEqual(fullscreenActionAt({ x: 380, y: 26 }), { type: "TOGGLE_FULLSCREEN" });
assert.equal(fullscreenActionAt({ x: 210, y: 26 }), null);
assert.deepEqual(utilityActionAt({ x: 320, y: 26 }), { type: "TOGGLE_PAUSE" });
assert.deepEqual(utilityActionAt({ x: 355, y: 26 }), { type: "TOGGLE_SOUND" });
assert.deepEqual(titleActionAt({ x: 210, y: 414 }), { type: "CYCLE_LEVEL" });
assert.deepEqual(titleActionAt({ x: 210, y: 454 }), { type: "CYCLE_DIFFICULTY" });
assert.deepEqual(titleActionAt({ x: 210, y: 497 }), { type: "START_MATCH" });
assert.deepEqual(pauseActionAt({ x: 146, y: 407 }), { type: "RESUME_MATCH" });
assert.deepEqual(pauseActionAt({ x: 274, y: 407 }), { type: "RETURN_TO_TITLE" });
assert.deepEqual(endActionAt({ x: 146, y: 419 }), { type: "RESTART_MATCH" });
assert.deepEqual(endActionAt({ x: 274, y: 419 }), { type: "RETURN_TO_TITLE" });

const gardenMatch = new MatchDirector({ mapDefinition: ORBITAL_GARDEN });
gardenMatch.start();
assert.deepEqual([...gardenMatch.simulation.state.lanes.keys()], [LANE.CENTER]);
assert.equal(gardenMatch.simulation.state.lanes.get(LANE.CENTER).unitIds.get(TEAM.PLAYER).length, 2);
assert.equal(gardenMatch.economy.reinforcementLimit(TEAM.PLAYER), 3);
assert.equal(gardenMatch.pause(), true);
assert.equal(gardenMatch.returnToTitle(), true);
assert.equal(gardenMatch.state, MATCH_STATE.TITLE);
assert.equal(gardenMatch.simulation, null);

const sound = new SoundSystem();
assert.equal(sound.userInteracted, false);
assert.equal(sound.vibrate(10), false);
assert.equal(sound.toggleMuted(), true);
assert.equal(sound.enabled, false);
assert.equal(sound.play("deploy"), false);
assert.equal(sound.toggleMuted(), false);

console.log(`Foundation, battle, match, and economy checks passed for ${targetViewports.length} target viewports.`);
