import assert from "node:assert/strict";
import { CampaignProgress, CAMPAIGN_STORAGE_KEY } from "../src/campaign/progress.js";
import { MISSIONS, missionMatchOptions, missionUnlocked } from "../src/data/campaign.js";
import { MATCH_STATE, TEAM } from "../src/core/constants.js";
import { MatchDirector } from "../src/simulation/matchDirector.js";
import { OpponentAi, AI_PROFILES } from "../src/simulation/opponentAi.js";
import { CONFIG } from "../src/config.js";
import { ORBITAL_GARDEN } from "../src/data/definitions.js";
import { commandActionAt, commandUiLayout, endActionAt } from "../src/ui/commandUi.js";
import { campaignActionAt, campaignUiLayout } from "../src/ui/campaignUi.js";

const values = new Map();
const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
let progress = new CampaignProgress(storage);
assert.equal(progress.begin(MISSIONS[1].id), false, "a preview cannot become an active mission");
assert.equal(progress.complete("unknown"), false);
assert.equal(missionUnlocked(MISSIONS[1], progress.data.completed), false);
assert.equal(progress.begin(MISSIONS[0].id), true);
progress = new CampaignProgress(storage);
assert.equal(progress.data.lastMissionId, MISSIONS[0].id, "returning players retain their last mission");
assert.equal(progress.data.completed.length, 0, "starting does not complete or unlock a mission");
progress.complete(MISSIONS[0].id);
progress.complete(MISSIONS[0].id);
progress = new CampaignProgress(storage);
assert.deepEqual(progress.data.completed, [MISSIONS[0].id]);
assert.equal(missionUnlocked(MISSIONS[1], progress.data.completed), true);
assert.equal(missionUnlocked(MISSIONS[2], progress.data.completed), false);
assert.throws(() => missionMatchOptions(MISSIONS[1]));
values.set(CAMPAIGN_STORAGE_KEY, "{damaged");
assert.deepEqual(new CampaignProgress(storage).data.completed, []);
values.set(CAMPAIGN_STORAGE_KEY, JSON.stringify({ version: 1, completed: ["unknown", MISSIONS[1].id], lastMissionId: MISSIONS[2].id }));
assert.deepEqual(new CampaignProgress(storage).data.completed, []);
const blockedStorage = { getItem: () => { throw Error("blocked"); }, setItem: () => { throw Error("blocked"); } };
const session = new CampaignProgress(blockedStorage);
assert.equal(session.begin(MISSIONS[0].id), true);
session.complete(MISSIONS[0].id);
assert.equal(session.snapshot().persistent, false);
assert.deepEqual(session.data.completed, [MISSIONS[0].id], "unavailable storage does not block session progress");

const mission = MISSIONS[0];
const director = new MatchDirector(missionMatchOptions(mission));
director.start();
const lane = mission.map.lanes[0].id;
for (const team of [TEAM.PLAYER, TEAM.ENEMY]) {
  const before = director.economy.get(team).energy;
  assert.equal(director.executeCommand({ type: "DEPLOY_UNIT", team, laneId: lane, unitType: "bomber" }).reason, "MISSION_LOCKED_UNIT");
  assert.equal(director.executeCommand({ type: "BUY_UPGRADE", team, upgradeId: "shield" }).reason, "MISSION_LOCKED_UPGRADE");
  assert.equal(director.economy.get(team).energy, before);
  assert.equal(director.liveDeployment.cooldownRemaining(team, "bomber"), 0);
  assert.equal(director.simulation.state.structures.get(team === TEAM.PLAYER ? "player-hq" : "enemy-hq").maxHp, 900);
}
director.executeCommand({ type: "DEPLOY_UNIT", team: TEAM.PLAYER, laneId: lane, unitType: "fighter" });
director.simulation.spawnFormation(TEAM.PLAYER, lane, Array(9).fill("scout"), 99);
assert.equal(director.simulation.state.lanes.get(lane).unitIds.get(TEAM.PLAYER).length, 12);
const energy = director.economy.get(TEAM.PLAYER).energy;
assert.equal(director.executeCommand({ type: "DEPLOY_UNIT", team: TEAM.PLAYER, laneId: lane, unitType: "scout" }).reason, "LANE_CAPACITY");
assert.equal(director.economy.get(TEAM.PLAYER).energy, energy);
for (let wave = 0; wave < 10; wave += 1) director.forceWave();
assert.equal(director.baseWaveBacklog.get(TEAM.PLAYER).get(lane).length, 1, "full lanes never bank more than one free mission wave");
director.pause();
const paused = { time: director.activeMatchSeconds, energy: director.economy.get(TEAM.PLAYER).energy };
director.advanceLive(10);
assert.deepEqual({ time: director.activeMatchSeconds, energy: director.economy.get(TEAM.PLAYER).energy }, paused);
director.resume();

for (const height of [760, 933.3, 908.9, 910.5, 932.8]) {
  const ui = campaignUiLayout(height);
  const center = (r) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
  assert.deepEqual(campaignActionAt(center(ui.campaign), "main", height), { type: "OPEN_CAMPAIGN" });
  assert.deepEqual(campaignActionAt(center(ui.missions[0]), "missions", height), { type: "SELECT_MISSION", missionId: mission.id });
  assert.deepEqual(campaignActionAt(center(ui.start), "briefing", height), { type: "START_MISSION" });
  const command = commandUiLayout(height, [lane], true, "units", { units: mission.units, upgrades: mission.upgrades });
  assert.equal(command.units.length, 2);
  assert.equal(command.upgrades.length, 0);
  assert.equal(commandActionAt({ x: 30, y: command.panel.y + 145 }, "units", height, [lane], true, { units: mission.units, upgrades: mission.upgrades }), null);
  assert.equal(endActionAt({ x: 270, y: height / 2 + 30 }, height, true).type, "RETURN_TO_MISSIONS");
}

const reports = [];
// Small timing shifts previously turned this beginner battle into a ten-minute
// fight. Exercise different legal openings, not repeated identical simulations.
for (const [profile, offset] of [
  ...[0, 0.1].map((offset) => [AI_PROFILES.TACTICIAN, offset]),
  [AI_PROFILES.ADMIRAL, 0],
]) {
  const match = new MatchDirector(missionMatchOptions(mission));
  match.start();
  const player = new OpponentAi({ team: TEAM.PLAYER, preferredLane: lane, profile });
  let next = offset;
  let peak = 0;
  while (match.state === MATCH_STATE.LIVE_MATCH && match.activeMatchSeconds < 480) {
    match.advanceLive(1 / 60);
    next -= 1 / 60;
    if (next <= 0 && match.state === MATCH_STATE.LIVE_MATCH) {
      player.plan(match);
      next += player.decisionIntervalSeconds(match.config.timing.aiDecisionIntervalSeconds);
    }
    for (const unit of match.simulation.state.units.values()) assert.ok(["drone", ...mission.units].includes(unit.unitType));
    for (const team of [TEAM.PLAYER, TEAM.ENEMY]) assert.ok(match.simulation.state.lanes.get(lane).unitIds.get(team).length <= 12);
    peak = Math.max(peak, match.simulation.state.units.size);
  }
  assert.equal(match.state, MATCH_STATE.VICTORY, `${profile} can complete the mission through legal purchases`);
  assert.equal(match.economy.get(TEAM.ENEMY).spending.research, 0);
  assert.equal(match.economy.get(TEAM.PLAYER).spending.research, 0);
  reports.push({ profile, offset, duration: Math.round(match.activeMatchSeconds * 10) / 10, peakUnits: peak });
  match.restart();
  assert.equal(match.mission.id, mission.id);
  assert.equal(match.config.caps.unitsPerLaneTeam, 12);
}
const free = new MatchDirector({ mapDefinition: ORBITAL_GARDEN });
assert.equal(free.config.caps.unitsPerLaneTeam, CONFIG.caps.unitsPerLaneTeam);
assert.equal(free.config.balance.startingEnergy, 270);
assert.equal(free.mission, null);
assert.equal(free.aiDecisionIntervalSeconds, CONFIG.timing.aiDecisionIntervalSeconds);
assert.equal(director.aiDecisionIntervalSeconds, 2 * 1.45);
console.log("Campaign save recovery, mission restrictions, caps, bounded waves, pause, restart and touch layouts passed.");
console.log(JSON.stringify({ mission: mission.id, reports }, null, 2));
