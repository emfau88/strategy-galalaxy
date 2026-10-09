import assert from "node:assert/strict";
import { EXPANSION_ID, EXPANSION_MISSIONS, expansionUnlocks } from "../src/data/campaignExpansion.js";
import { expansionMatchOptions } from "../src/data/expansionScenarios.js";
import { ExpansionProgress } from "../src/campaign/expansionProgress.js";
import { AegisSystem } from "../src/campaign/aegisSystem.js";
import { MatchDirector } from "../src/simulation/matchDirector.js";
import { acquireUnitTarget } from "../src/simulation/targeting.js";
import { TEAM, MATCH_STATE } from "../src/core/constants.js";
import { STORAGE_KEYS } from "../src/experiment.js";
import { stationUiLayout, stationActionAt } from "../src/ui/stationUi.js";

const values = new Map([[STORAGE_KEYS.progress, "old-campaign-sentinel"]]);
const storage = { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) };
const ids = EXPANSION_MISSIONS.map(m => m.id);
values.set(STORAGE_KEYS.expansionProgress, JSON.stringify({ version: 2, campaignId: EXPANSION_ID, lastPreviewId: ids[3], completed: [ids[1], ids[3], ids[4]] }));
let progress = new ExpansionProgress(storage);
assert.deepEqual(progress.data.pilotCompleted, [ids[1], ids[3]], "V2-1 wins remain free-pilot wins");
assert.deepEqual(progress.data.completed, []);
assert.equal(progress.data.lastPreviewId, ids[3]);
assert.equal(progress.canStart(ids[0]), true);
assert.equal(progress.canStart(ids[1]), false);
assert.equal(progress.complete(ids[3]), false, "Cannot skip the learning sequence");
assert.equal(progress.canStart(ids[3], "pilots"), true);
assert.equal(progress.canStart(ids[0], "pilots"), false);
assert.equal(progress.canStart(ids[4], "pilots"), false);

// New mission loops: one representative legal route each, existing M2/M4 routes in pilots.test.
for (const number of [1, 3]) {
  const d = new MatchDirector(expansionMatchOptions(EXPANSION_MISSIONS[number - 1])); d.start();
  const laneId = d.mapDefinition.lanes[0].id;
  if (number === 1) {
    assert.equal(d.executeCommand({ type: "DEPLOY_UNIT", team: TEAM.PLAYER, laneId, unitType: "bomber" }).reason, "MISSION_LOCKED_UNIT");
    assert.equal(d.aegis.equipped, false); assert.equal(d.mapDefinition.buildPads.length, 0);
  } else {
    assert.equal(d.mapDefinition.buildPads.length, 2); assert.equal(d.aegis.equipped, false);
    const pad = d.mapDefinition.buildPads[0];
    assert.equal(d.executeCommand({ type: "BUILD_STATION", team: TEAM.PLAYER, module: "bastion", padId: pad.id }).ok, true);
  }
  let purchases = 0;
  for (let frame = 0; frame < 260 * 60 && d.state === MATCH_STATE.LIVE_MATCH; frame++) {
    if (frame % 60 === 0) {
      const type = number === 1 ? purchases === 0 ? "scout" : "fighter" : ["fighter", "bomber", "fighter"][purchases % 3];
      if (d.executeCommand({ type: "DEPLOY_UNIT", team: TEAM.PLAYER, laneId, unitType: type }).ok) purchases++;
    }
    d.advanceLive(1/60);
  }
  console.log(JSON.stringify({ number, state: d.state, seconds: Math.round(d.activeMatchSeconds), purchases, attacks: d.missionRuntime.defeatedAttacks,
    dock: d.simulation.state.structures.get("harbor-dock")?.hp }));
  assert.equal(d.state, MATCH_STATE.VICTORY);
  if (number === 3) assert.equal(d.missionRuntime.defeatedAttacks, 3);
  d.restart(); const own = d.simulation.state.structures.get(number === 3 ? "harbor-dock" : "player-hq");
  d.simulation.applyDamage([{ targetId: own.id, damage: 10000, ownerTeam: TEAM.ENEMY }]); d.advanceLive(1/60);
  assert.equal(d.state, MATCH_STATE.DEFEAT); d.restart(); assert.equal(d.missionRuntime.defeatedAttacks, 0);
  assert.ok(d.simulation.state.structures.get(own.id).alive);
}

for (let i = 0; i < 4; i++) {
  assert.equal(progress.canStart(ids[i]), true); assert.equal(progress.complete(ids[i]), true);
  const expected = ["bastion", "bomber", "aegis", "frigate"].slice(0, i + 1);
  assert.deepEqual(progress.snapshot().unlocks, expected);
  assert.equal(progress.snapshot().harborActive, i >= 2);
  progress = new ExpansionProgress(storage); assert.deepEqual(expansionUnlocks(progress.data.completed), expected);
}
assert.equal(progress.canStart(ids[4]), false, "Act II remains a preview");
assert.equal(values.get(STORAGE_KEYS.progress), "old-campaign-sentinel");
assert.equal(progress.complete(ids[3]), true); assert.equal(progress.data.completed.length, 4);

const f = new MatchDirector(expansionMatchOptions(EXPANSION_MISSIONS[3])); f.start();
const gate = f.simulation.state.structures.get("evacuation-gate"), lanes = f.mapDefinition.lanes;
const ability = f.executeCommand({ type: "ACTIVATE_CARRIER", team: TEAM.PLAYER, laneId: lanes[0].id });
assert.equal(ability.ok, true); assert.equal(f.aegis.protects(gate), true);
const before = gate.hp; f.simulation.applyDamage([{ targetId: gate.id, damage: 100, ownerTeam: TEAM.ENEMY }]); assert.equal(gate.hp, before - 40);
assert.equal(f.aegis.protects({ id: "built-bastion", structureType: "turret", team: TEAM.PLAYER, laneId: lanes[0].id }), false);
f.aegis.laneId = lanes[1].id; assert.equal(f.aegis.protects(gate), false, "Wrong lane does not shield the station");
f.pause(); const remaining = f.aegis.activeRemaining; f.advanceLive(10); assert.equal(f.aegis.activeRemaining, remaining);
f.resume(); f.aegis.advance(6); assert.equal(f.aegis.protects(gate), false);
const shared = new AegisSystem(true, ["future-core"]); shared.activeRemaining = 1; shared.laneId = lanes[0].id;
assert.equal(shared.protects({ id: "future-core", structureType: "station", team: TEAM.PLAYER, laneId: null }), true);
assert.equal(shared.protects({ id: "future-core", structureType: "station", team: TEAM.ENEMY, laneId: null }), false);
const harbor = new MatchDirector(expansionMatchOptions(EXPANSION_MISSIONS[2])); harbor.start();
const dock = harbor.simulation.state.structures.get("harbor-dock");
const bomber = harbor.simulation.spawnUnit(TEAM.ENEMY, dock.laneId, "bomber", { x: dock.x, y: dock.y - 90 });
assert.equal(acquireUnitTarget(harbor.simulation.state, bomber)?.id, dock.id);
const layout = stationUiLayout(760, 2);
for (const [index, rect] of layout.pads.entries()) assert.equal(stationActionAt({ x: rect.x + 20, y: rect.y + 20 }, 760, null, false, 2).index, index);
console.log("PASS: new M1/M3 legal victories and losses, ordered unlocks/reload, V2-1 migration, two build pads, station targeting and lane-specific Aegis.");
