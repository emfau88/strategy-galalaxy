import assert from "node:assert/strict";
import { MatchDirector } from "../src/simulation/matchDirector.js";
import { missionById, missionMatchOptions, missionForProgress } from "../src/data/campaign.js";
import { CampaignProgress } from "../src/campaign/progress.js";
import { createBattleState, removeDeadEntities } from "../src/simulation/battleState.js";
import { TEAM, MATCH_STATE } from "../src/core/constants.js";
const create = (id = "harbor-fire", equippedAbility = "aegis") => {
  const director = new MatchDirector({ ...missionMatchOptions(missionById(id)), equippedAbility }); director.start(); return director;
};
const hit = (director, target, damage, ownerTeam = TEAM.ENEMY) => director.simulation.applyDamage([{ targetId: target.id, damage, ownerTeam }]);
const activate = director => director.executeCommand({ type: "ACTIVATE_AEGIS", team: TEAM.PLAYER, laneId: director.mapDefinition.lanes[0].id });
const equipped = create(), lane = equipped.mapDefinition.lanes[0].id;
assert.equal(equipped.simulation.state.structures.has("enemy-hq"), false, "Defense attacks enter through corridor, not an invulnerable HQ");
assert.equal(equipped.economy.get(TEAM.PLAYER).energy, 250);
assert.equal(activate(equipped).ok, true);
assert.equal(equipped.economy.get(TEAM.PLAYER).energy, 170);
assert.equal(activate(equipped).reason, "ABILITY_COOLDOWN");
assert.equal(equipped.economy.get(TEAM.PLAYER).energy, 170, "Rejected ability costs nothing");
const ownHq = equipped.simulation.state.structures.get("player-hq");
hit(equipped, ownHq, 100); assert.equal(ownHq.hp, 1360, "Aegis reduces carrier damage by 60%");
const ownUnit = [...equipped.simulation.state.units.values()][0], hp = ownUnit.hp;
hit(equipped, ownUnit, 10); assert.equal(ownUnit.hp, hp - 4, "Selected-lane ships receive temporary protection");
assert.equal(equipped.economy.get(TEAM.PLAYER).shieldLevel, 0, "No permanent research shield");
const hostile = equipped.simulation.spawnFormation(TEAM.ENEMY, lane, ["frigate"])[0];
hit(equipped, hostile, 10, TEAM.PLAYER); assert.equal(hostile.hp, hostile.maxHp - 10, "Opponent receives no Aegis");
equipped.pause(); const active = equipped.aegis.activeRemaining, cooldown = equipped.aegis.cooldownRemaining;
equipped.advanceLive(10); assert.equal(equipped.aegis.activeRemaining, active); assert.equal(equipped.aegis.cooldownRemaining, cooldown);
equipped.resume(); for (let i = 0; i < 7 * 60; i++) equipped.advanceLive(1 / 60);
assert.equal(equipped.aegis.activeRemaining, 0); const unprotectedHp = ownHq.hp;
hit(equipped, ownHq, 100); assert.equal(ownHq.hp, unprotectedHp - 100, "Temporary protection expires");
hit(equipped, ownHq, 10000); equipped.advanceLive(1 / 60); assert.equal(equipped.state, MATCH_STATE.DEFEAT);
assert.equal(equipped.aegis.activeRemaining, 0); equipped.restart();
assert.equal(equipped.aegis.cooldownRemaining, 0); assert.equal(equipped.aegis.activeRemaining, 0);
assert.equal(equipped.economy.get(TEAM.PLAYER).energy, 250, "Restart resets combat economy");
assert.equal(activate(equipped).ok, true); equipped.returnToTitle(); assert.equal(equipped.aegis.activeRemaining, 0);
const poor = create(); poor.economy.get(TEAM.PLAYER).energy = 79;
assert.equal(activate(poor).reason, "INSUFFICIENT_ENERGY"); assert.equal(poor.economy.get(TEAM.PLAYER).energy, 79);
assert.equal(activate(create("harbor-fire", null)).reason, "ABILITY_NOT_EQUIPPED");

const missionOwned = create("first-contact", null), enemyHq = missionOwned.simulation.state.structures.get("enemy-hq");
hit(missionOwned, enemyHq, 10000, TEAM.PLAYER);
assert.equal(missionOwned.simulation.state.terminalTeam, null, "Combat emits HQ destruction without choosing campaign result");
missionOwned.advanceLive(1 / 60); assert.equal(missionOwned.state, MATCH_STATE.VICTORY);
missionOwned.advanceLive(1); assert.equal(missionOwned.events.filter(event => event.type === "MATCH_ENDED").length, 1);

const defense = create(), run = defense.missionRuntime;
const incidentalHq = createBattleState({ map: missionMatchOptions(missionById("first-contact")).mapDefinition }).structures.get("enemy-hq");
defense.simulation.state.structures.set("enemy-hq", incidentalHq); hit(defense, incidentalHq, 10000, TEAM.PLAYER);
defense.advanceLive(1 / 60); assert.equal(defense.state, MATCH_STATE.LIVE_MATCH, "Enemy HQ destruction cannot prematurely complete defense");
for (let wave = 0; wave < 3; wave++) {
  defense.economy.get(TEAM.ENEMY).energy = 400; defense.liveDeployment.advance(30); run.enter("assault");
  assert.equal(run.evaluateGoal(defense), null, "Announced but not launched attack cannot count as defeated");
  for (let step = 0; run.orderIndex < run.orders.length && step < 30; step++) run.advance(defense, 1);
  assert.equal(run.orderIndex, run.orders.length);
  for (const unit of defense.simulation.state.units.values()) if (unit.alive && unit.team === TEAM.ENEMY) hit(defense, unit, 10000, TEAM.PLAYER);
  removeDeadEntities(defense.simulation.state);
  // An in-flight hostile volley delays completion even after its owners are destroyed.
  defense.simulation.state.projectiles.set("pending-volley", { alive: true, ownerTeam: TEAM.ENEMY });
  assert.equal(run.evaluateGoal(defense), null); assert.equal(run.defeatedAttacks, wave);
  defense.simulation.state.projectiles.delete("pending-volley");
  const result = run.evaluateGoal(defense); assert.equal(run.defeatedAttacks, wave + 1);
  if (wave < 2) { assert.equal(result, null); assert.equal(run.phase, "recovery"); }
  else { assert.equal(result.reason, "ALL_ATTACKS_DEFEATED"); defense.finishMission(result.team, result.reason); }
}
assert.equal(defense.state, MATCH_STATE.VICTORY); assert.equal(defense.finishMission(TEAM.PLAYER, "duplicate"), false);
assert.equal(defense.events.filter(event => event.type === "MATCH_ENDED").length, 1);
const simultaneous = create(); simultaneous.missionRuntime.defeatedAttacks = 2; simultaneous.missionRuntime.phase = "assault";
simultaneous.missionRuntime.orders = []; hit(simultaneous, simultaneous.simulation.state.structures.get("player-hq"), 10000);
simultaneous.advanceLive(1 / 60); assert.equal(simultaneous.state, MATCH_STATE.DEFEAT, "Carrier loss wins over final-wave completion in same step");

const values = new Map(), storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
let progress = new CampaignProgress(storage); assert.equal(progress.toggleAegis(), false);
progress.complete("first-contact"); progress.complete("heavy-resistance"); assert.equal(progress.data.equipment.ability, "aegis");
progress = new CampaignProgress(storage); assert.equal(progress.data.equipment.ability, "aegis");
progress.toggleAegis(); assert.equal(new CampaignProgress(storage).data.equipment.ability, null);
progress.toggleAegis(); progress.complete("harbor-fire"); assert.ok(new CampaignProgress(storage).data.completed.includes("harbor-fire"));
const replay = new MatchDirector(missionMatchOptions(missionForProgress(missionById("harbor-fire"), progress.data.completed))); replay.start();
assert.equal(replay.executeCommand({ type: "DEPLOY_UNIT", team: TEAM.PLAYER, laneId: replay.mapDefinition.lanes[0].id, unitType: "frigate" }).ok, true, "Earned frigate is usable on replay");
progress.reset(); assert.equal(new CampaignProgress(storage).data.equipment.ability, null);

// One representative defense battle with normal purchases and legal Aegis uses.
const played = create(); let nextBuy = 0, choice = 0, abilityUses = 0;
const recipe = ["fighter", "bomber", "scout", "fighter", "bomber"];
while (played.state === MATCH_STATE.LIVE_MATCH && played.activeBattleSeconds < 420) {
  if (played.activeBattleSeconds >= nextBuy) {
    const bought = played.executeCommand({ type: "DEPLOY_UNIT", team: TEAM.PLAYER, laneId: lane, unitType: recipe[choice % recipe.length] });
    if (bought.ok) choice++; nextBuy = played.activeBattleSeconds + 2;
  }
  if (played.missionRuntime.phase === "assault" && played.aegis.cooldownRemaining === 0 && activate(played).ok) abilityUses++;
  played.advanceLive(1 / 60);
}
assert.equal(played.state, MATCH_STATE.VICTORY);
assert.equal(played.missionRuntime.defeatedAttacks, 3);
console.log("PASS: goals, all three fully defeated attacks, pending volleys, loss priority, single result, Aegis costs/damage/expiry/pause/restart, equipment reload.", JSON.stringify({ seconds: Math.round(played.activeBattleSeconds), launches: choice, abilityUses }));
