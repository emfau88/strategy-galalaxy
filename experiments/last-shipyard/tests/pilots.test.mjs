import assert from "node:assert/strict";
import { MatchDirector } from "../src/simulation/matchDirector.js";
import { EXPANSION_MISSIONS } from "../src/data/campaignExpansion.js";
import { expansionMatchOptions, BASTION, EVACUATION } from "../src/data/expansionScenarios.js";
import { ExpansionProgress } from "../src/campaign/expansionProgress.js";
import { TEAM, MATCH_STATE } from "../src/core/constants.js";
import { stationOccupation } from "../src/campaign/objectiveRules.js";
import { acquireUnitTarget } from "../src/simulation/targeting.js";
import { stationUiLayout, stationActionAt, worldSiteAt } from "../src/ui/stationUi.js";

const create = (number = 2) => { const d = new MatchDirector(expansionMatchOptions(EXPANSION_MISSIONS[number - 1])); assert.equal(d.start(), true); return d; };
const step = (d, seconds) => { for (let i = 0; i < Math.round(seconds * 60); i++) d.advanceLive(1 / 60); };
const state = d => d.simulation.state;
const hit = (d, id) => d.simulation.applyDamage([{ targetId: id, damage: 100000, ownerTeam: TEAM.ENEMY }]);
const build = d => d.executeCommand({ type: "BUILD_STATION", team: TEAM.PLAYER, padId: d.mapDefinition.buildPads[0].id, module: "bastion" });
const charge = d => d.executeCommand({ type: "START_PROJECT", team: TEAM.PLAYER, stationId: "evacuation-gate" });
const place = (d, type, team = TEAM.PLAYER, point = d.missionRuntime.site) => d.simulation.spawnUnit(team, point.laneId, type, { x: point.x, y: point.y });

// Construction transactions, vulnerable sites, pause, stale projectiles and clean retry.
const d = create(), energy = d.economy.get(TEAM.PLAYER).energy;
assert.equal(d.executeCommand({ type: "BUILD_STATION", team: TEAM.PLAYER, padId: "invented", module: "bastion" }).ok, false);
assert.equal(d.economy.get(TEAM.PLAYER).energy, energy);
const idle = create();
for (let i = 0; i < 30; i++) idle.forceWave();
assert.equal(state(idle).units.size, 2, "Waiting never fills the entire fleet with free Drones");
assert.equal(idle.missionRuntime.triggered, false);
assert.equal(idle.executeCommand({ type: "DEPLOY_UNIT", team: TEAM.PLAYER, laneId: idle.mapDefinition.lanes[0].id, unitType: "scout" }).ok, true);
const built = build(d); assert.equal(built.ok, true);
assert.equal(d.economy.get(TEAM.PLAYER).energy, energy - BASTION.cost);
assert.equal(build(d).reason, "SITE_OCCUPIED");
const bastion = state(d).structures.get(built.entityId);
const enemy = place(d, "fighter", TEAM.ENEMY, { ...d.missionRuntime.site, x: bastion.x, y: bastion.y - 90 });
d.simulation.updateStructure(bastion, 1); assert.equal(bastion.lastShotAt, -Infinity, "Unfinished guns cannot fire");
d.pause(); const remaining = bastion.constructionRemaining; step(d, 3); assert.equal(bastion.constructionRemaining, remaining);
assert.equal(build(d).reason, "WRONG_PHASE"); d.resume();
d.simulation.updateStructure(bastion, BASTION.buildSeconds); assert.ok(Number.isFinite(bastion.lastShotAt), "Completed Bastion can fire");
hit(d, bastion.id); assert.equal(bastion.alive, false);
d.economy.get(TEAM.PLAYER).energy = BASTION.cost;
const replacement = build(d); assert.equal(replacement.ok, true); assert.notEqual(replacement.entityId, bastion.id);
hit(d, bastion.id); assert.equal(state(d).structures.get(replacement.entityId).hp, BASTION.maxHp, "Old targets cannot damage rebuilt pad");
hit(d, replacement.entityId); assert.equal(state(d).structures.get(replacement.entityId).alive, false, "Construction is destructible");
assert.equal(build(d).reason, "INSUFFICIENT_ENERGY");
hit(d, "player-hq"); step(d, .1); assert.equal(d.state, MATCH_STATE.DEFEAT);
d.restart(); assert.equal(state(d).structures.size, 1); assert.equal(d.missionRuntime.triggered, false);
assert.equal(d.economy.get(TEAM.PLAYER).energy, energy);

// Drones do not capture, first capture triggers exactly two attacks, recapture is allowed.
const capture = create(), site = capture.missionRuntime.site, node = state(capture).nodes.get(site.id);
place(capture, "drone"); capture.capture.advance(state(capture), 10); assert.equal(node.progress, 0);
const scout = place(capture, "scout"); capture.capture.advance(state(capture), 10); assert.equal(node.ownerTeam, TEAM.PLAYER);
capture.missionRuntime.advance(capture, .1); assert.equal(capture.missionRuntime.phase, "warning");
scout.alive = false; const hostile = place(capture, "scout", TEAM.ENEMY);
capture.capture.advance(state(capture), 20); assert.equal(node.ownerTeam, TEAM.ENEMY);
hostile.alive = false; place(capture, "fighter"); capture.capture.advance(state(capture), 30); assert.equal(node.ownerTeam, TEAM.PLAYER);
capture.missionRuntime.advance(capture, 1); assert.equal(capture.missionRuntime.remaining, 7, "Recapture does not reset the first warning");
capture.missionRuntime.defeatedAttacks = 2;
state(capture).projectiles.set("late-volley", { alive: true, ownerTeam: TEAM.ENEMY });
assert.equal(capture.missionRuntime.evaluateGoal(capture), null, "Final hostile shot must clear");
state(capture).projectiles.clear(); assert.equal(capture.missionRuntime.evaluateGoal(capture).team, TEAM.PLAYER);
hit(capture, "player-hq"); assert.equal(capture.missionRuntime.evaluateGoal(capture).team, TEAM.ENEMY, "Own loss outranks completion");

// Paid charges: occupancy, any hostile presence, pause, loss and preservation of paid progress.
const f = create(4), gate = f.missionRuntime.site;
assert.equal(f.carrierAbility.equipped, true);
assert.equal(charge(f).reason, "STATION_UNSECURED");
place(f, "drone"); assert.equal(charge(f).reason, "STATION_UNSECURED");
const crew = place(f, "fighter"), before = f.economy.get(TEAM.PLAYER).energy;
assert.equal(charge(f).ok, true); assert.equal(charge(f).reason, "PROJECT_ALREADY_STARTED");
assert.equal(f.economy.get(TEAM.PLAYER).energy, before - EVACUATION.cost);
f.missionRuntime.advance(f, 5); assert.equal(f.missionRuntime.project.elapsed, 5);
const blocker = place(f, "drone", TEAM.ENEMY); assert.equal(stationOccupation(state(f), gate).secure, false);
f.missionRuntime.advance(f, 5); assert.equal(f.missionRuntime.project.elapsed, 5);
blocker.alive = false; crew.alive = false; f.missionRuntime.advance(f, 2); assert.equal(f.missionRuntime.project.elapsed, 5);
place(f, "scout"); f.pause(); step(f, 3); assert.equal(f.missionRuntime.project.elapsed, 5);
assert.equal(charge(f).reason, "WRONG_PHASE"); f.resume(); f.missionRuntime.advance(f, 11);
assert.equal(f.missionRuntime.project.completed, 1); assert.equal(f.missionRuntime.project.active, false);
assert.equal(f.economy.get(TEAM.PLAYER).energy, before - EVACUATION.cost, "Resuming never bills a second time");
f.missionRuntime.project.completed = 3; hit(f, "evacuation-gate"); step(f, .1);
assert.equal(f.state, MATCH_STATE.DEFEAT, "Destroyed station loses even on the final segment");
f.restart(); assert.deepEqual(f.missionRuntime.project, { completed: 0, active: false, elapsed: 0 });
assert.equal(state(f).structures.get(gate.id).hp, 900);
const bomber = place(f, "bomber", TEAM.ENEMY, { ...gate, y: gate.y - 100 });
assert.equal(acquireUnitTarget(state(f), bomber)?.id, gate.id, "Enemy bombers actually target the mission station");

// Two representative legal-purchase routes, not a balance parameter sweep.
for (const number of [2, 4]) {
  const play = create(number), events = [], own = TEAM.PLAYER;
  assert.equal(build(play).ok, true, "Representative route constructs a real Bastion");
  let purchases = 0, peak = 0;
  for (let frame = 0; frame < 240 * 60 && play.state === MATCH_STATE.LIVE_MATCH; frame++) {
    if (frame % 60 === 0) {
      const seconds = frame / 60, lanes = play.mapDefinition.lanes;
      if (number === 4 && seconds >= 8) charge(play);
      const laneId = lanes[number === 4 ? purchases % 2 : 0].id;
      const unitType = purchases === 0 ? "scout" : "fighter";
      const result = play.executeCommand({ type: "DEPLOY_UNIT", team: own, laneId, unitType });
      if (result.ok) purchases++;
    }
    play.advanceLive(1 / 60);
    peak = Math.max(peak, [...state(play).units.values()].filter(u => u.alive).length);
  }
  events.push({ number, outcome: play.state, seconds: Math.round(play.activeMatchSeconds), purchases, peak,
    carrier: Math.round(state(play).structures.get("player-hq").hp), project: play.missionRuntime.project,
    attacks: play.missionRuntime.defeatedAttacks });
  console.log(JSON.stringify(events[0]));
  assert.equal(play.state, MATCH_STATE.VICTORY, `Mission ${number}: representative route reaches its actual objective`);
}

const values = new Map(), storage = { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) };
const progress = new ExpansionProgress(storage);
assert.equal(progress.complete(EXPANSION_MISSIONS[0].id), false);
progress.complete(EXPANSION_MISSIONS[1].id); progress.complete(EXPANSION_MISSIONS[1].id);
assert.deepEqual(new ExpansionProgress(storage).data.completed, [EXPANSION_MISSIONS[1].id]);
for (const height of [760, 933]) {
  const ui = stationUiLayout(height), center = r => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
  assert.equal(stationActionAt(center(ui.action), height, "site", false).type, "SITE_COMMAND");
  assert.equal(stationActionAt(center(ui.action), height, "site", true), null, "Fleet and site panels never intercept each other");
  assert.equal(stationActionAt(center(ui.close), height, "site", false).type, "CLOSE_SITE");
}
assert.equal(worldSiteAt(d.mapDefinition, d.mapDefinition.buildPads[0]).id, d.mapDefinition.buildPads[0].id);
console.log("PASS: construction, occupation, interrupted paid projects, structure targeting, loss precedence, retry, isolated progress and two legal pilot victories.");
