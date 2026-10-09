import assert from "node:assert/strict";
import { EXPANSION_ID, EXPANSION_MISSIONS } from "../src/data/campaignExpansion.js";
import { ExpansionProgress } from "../src/campaign/expansionProgress.js";
import { CampaignProgress } from "../src/campaign/progress.js";
import { objectiveOutcome, objectiveStepSeconds, stationOccupation } from "../src/campaign/objectiveRules.js";
import { MISSIONS, missionMatchOptions } from "../src/data/campaign.js";
import { STORAGE_KEYS } from "../src/experiment.js";
import { TEAM, MATCH_STATE } from "../src/core/constants.js";
import { playerHoldLine } from "../src/simulation/tacticalAnchors.js";
import { MatchDirector } from "../src/simulation/matchDirector.js";
import { createBattleState } from "../src/simulation/battleState.js";
import { expansionUiLayout } from "../src/ui/expansionUi.js";
import { campaignActionAt } from "../src/ui/campaignUi.js";
import { BattlefieldCamera } from "../src/core/battlefieldCamera.js";
import { CONFIG } from "../src/config.js";

assert.equal(EXPANSION_MISSIONS.length, 8);
assert.equal(new Set(EXPANSION_MISSIONS.map(m => m.id)).size, 8);
for (const m of EXPANSION_MISSIONS) {
  assert.ok(!MISSIONS.some(old => old.id === m.id));
  assert.equal(m.campaignId, EXPANSION_ID);
  assert.equal(m.available, [2, 4].includes(m.number));
  assert.throws(() => missionMatchOptions(m), /not playable/);
  const director = new MatchDirector({ mission: m, mapDefinition: m.map });
  assert.equal(director.start(), false, "A preview cannot become an ordinary assault mission");
  assert.equal(director.state, MATCH_STATE.TITLE);
  assert.equal(director.simulation, null);
  const points = [...m.map.structures, ...m.map.markers, ...m.map.buildPads,
    ...m.map.lanes.flatMap(l => [l.playerSpawn, l.enemySpawn, { x: l.centerX, y: l.anchors.holdY }])];
  for (const p of points) assert.ok(p.x >= 0 && p.x <= m.map.bounds.width && p.y >= 0 && p.y <= m.map.bounds.height, `${m.id}: point inside map`);
  const ids = new Set([...m.map.structures, ...m.map.markers].map(p => p.id));
  for (const id of [...m.goal.requiredAlive, ...(m.goal.targets ?? []), ...[m.goal.controlTarget, m.goal.projectTarget].filter(Boolean)]) assert.ok(ids.has(id), `${m.id}: goal references a known site`);
  assert.ok(m.map.buildPads.length <= 2);
  const state = createBattleState({ map: m.map });
  state.laneStances = new Map(m.map.lanes.map(l => [l.id, "hold"]));
  for (const l of m.map.lanes) assert.equal(playerHoldLine(state, l.id, true), l.anchors.holdY);
  const camera = new BattlefieldCamera({ worldHeight: m.map.bounds.height, designWidth: 420, designHeight: 760, config: CONFIG.camera });
  camera.jumpToWorld(10000); assert.equal(camera.y, camera.maximumY);
  camera.jumpToWorld(-10000); assert.equal(camera.y, 0);
}
const legacyDefense = missionMatchOptions(MISSIONS[2]).mapDefinition;
assert.equal(legacyDefense.defenseLineY, 780);
assert.equal(legacyDefense.lanes[0].enemySpawn.y, 420);
const finale = new MatchDirector(missionMatchOptions(MISSIONS[5])); finale.start();
const finalState = finale.simulation.state, left = finalState.map.lanes[0].id;
finalState.structures.get("enemy-relay-0").alive = false;
assert.equal(playerHoldLine(finalState, left, true), 400, "Cleared lane waits at the original shield staging line");
finalState.laneStances.set(left, "hold"); assert.equal(playerHoldLine(finalState, left, true), 780);
finale.pause(); const pausedTime = finalState.time; finale.advanceLive(10); assert.equal(finalState.time, pausedTime);

const values = new Map([["classic-sentinel", "keep"]]);
const storage = { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k) };
const original = new CampaignProgress(storage); original.complete("first-contact");
const savedOriginal = values.get(STORAGE_KEYS.progress), id = EXPANSION_MISSIONS[3].id;
const preview = new ExpansionProgress(storage); assert.equal(preview.selectPreview(id), true);
assert.equal(preview.selectPreview("first-contact"), false);
assert.equal(new ExpansionProgress(storage).data.lastPreviewId, id);
assert.deepEqual(preview.data.completed, []);
original.reset(); assert.equal(new ExpansionProgress(storage).data.lastPreviewId, id);
values.set(STORAGE_KEYS.progress, savedOriginal); preview.reset(); assert.equal(values.get(STORAGE_KEYS.progress), savedOriginal);
values.set(STORAGE_KEYS.expansionProgress, JSON.stringify({ version: 1, campaignId: EXPANSION_ID, lastPreviewId: id, completed: EXPANSION_MISSIONS.map(m => m.id) }));
assert.deepEqual(new ExpansionProgress(storage).data.completed, [], "Preview data cannot manufacture victories");
values.set(STORAGE_KEYS.expansionProgress, JSON.stringify({ version: 1, campaignId: "wrong-campaign", lastPreviewId: id }));
assert.equal(new ExpansionProgress(storage).data.lastPreviewId, null);
values.set(STORAGE_KEYS.expansionProgress, "broken-json"); assert.equal(new ExpansionProgress(storage).data.lastPreviewId, null);
const unavailable = new ExpansionProgress({ getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); } });
assert.equal(unavailable.selectPreview(id), true); assert.equal(unavailable.persistent, false);
assert.equal(values.get("classic-sentinel"), "keep");

const station = { laneId: left, x: 100, y: 600, radius: 50 };
const unit = (unitType, team = TEAM.PLAYER) => ({ alive: true, launching: false, unitType, team, laneId: left, x: 100, y: 600 });
const state = { units: new Map([[1, unit("drone")]]), structures: new Map([["player-hq", { alive: true }]]), projectiles: new Map() };
assert.equal(stationOccupation(state, station).occupied, false, "Free drones cannot operate the station");
state.units.set(2, unit("scout")); assert.equal(stationOccupation(state, station).secure, true);
state.units.set(3, unit("drone", TEAM.ENEMY)); assert.equal(stationOccupation(state, station).secure, false, "Even a weak enemy interrupts a stronger occupying force");
state.units.get(3).alive = false; state.units.get(2).launching = true; assert.equal(stationOccupation(state, station).occupied, false);
state.units.clear();
const goal = { requiredAlive: ["player-hq"], requireClearBattle: true };
assert.equal(objectiveOutcome(state, goal, false), null);
state.projectiles.set("last-shot", { alive: true, ownerTeam: TEAM.ENEMY }); assert.equal(objectiveOutcome(state, goal, true), null);
state.projectiles.clear(); assert.equal(objectiveOutcome(state, goal, true).team, TEAM.PLAYER);
state.structures.get("player-hq").alive = false; assert.equal(objectiveOutcome(state, goal, true).team, TEAM.ENEMY, "Loss beats simultaneous completion");
for (const status of [MATCH_STATE.TITLE, MATCH_STATE.PAUSED, MATCH_STATE.VICTORY, MATCH_STATE.DEFEAT]) assert.equal(objectiveStepSeconds(status, 5), 0);
assert.equal(objectiveStepSeconds(MATCH_STATE.LIVE_MATCH, -2), 0);
assert.equal(objectiveStepSeconds(MATCH_STATE.LIVE_MATCH, 0.25), 0.25);

for (const height of [760, 844, 933]) {
  const ui = expansionUiLayout(height), center = r => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
  assert.equal(campaignActionAt(center(ui.entry), "missions", height).type, "OPEN_EXPANSION");
  for (const r of ui.missions) {
    assert.ok(r.y + r.height < ui.back.y && r.height >= 44);
    assert.equal(campaignActionAt(center(r), "expansion", height).missionId, r.missionId);
  }
  assert.equal(campaignActionAt({ x: 210, y: 620 + height / 2 - 380 }, "expansion-map", height), null, "No hidden legacy START_MISSION hitbox");
}
console.log("PASS: eight bounded preview layouts, no draft starts, data-driven anchors, save isolation, occupation/loss/pause contracts and touch targets.");
