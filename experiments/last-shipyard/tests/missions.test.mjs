import assert from "node:assert/strict";
import { MatchDirector } from "../src/simulation/matchDirector.js";
import { missionById, missionMatchOptions } from "../src/data/campaign.js";
import { TEAM, MATCH_STATE } from "../src/core/constants.js";
const create = id => { const director = new MatchDirector(missionMatchOptions(missionById(id))); director.start(); return director; };
const buy = (director, unitType, team = TEAM.PLAYER) => director.executeCommand({ type: "DEPLOY_UNIT", unitType, team, laneId: director.mapDefinition.lanes[0].id });
const first = create("first-contact");
assert.equal(first.simulation.state.units.size, 1, "Only one free player drone starts");
assert.equal(buy(first, "bomber").reason, "MISSION_LOCKED_UNIT");
const initial = first.economy.get(TEAM.PLAYER).energy;
assert.equal(buy(first, "fighter").ok, true);
assert.equal(first.economy.get(TEAM.PLAYER).energy, initial - 90);
assert.equal(buy(first, "fighter").reason, "COOLDOWN_ACTIVE");
assert.equal(first.economy.get(TEAM.PLAYER).energy, initial - 90, "Rejected purchase spends nothing");
assert.equal(first.missionRuntime.purchases.has("fighter"), true);
first.pause(); const time = first.missionRuntime.remaining;
first.advanceLive(3); assert.equal(first.missionRuntime.remaining, time); first.resume();
for (let i = 0; i < 12 * 60 + 1; i++) first.advanceLive(1 / 60);
assert.equal(first.missionRuntime.phase, "warning");
assert.equal([...first.simulation.state.units.values()].filter(unit => unit.team === TEAM.ENEMY).length, 0, "No purchases before warning completes");
for (let i = 0; i < 7 * 60; i++) first.advanceLive(1 / 60);
assert.ok([...first.simulation.state.units.values()].some(unit => unit.team === TEAM.ENEMY && unit.unitType === "scout"));
assert.equal(first.economy.get(TEAM.ENEMY).spending.fleet, 50, "Authored enemy launch really pays");
const second = create("heavy-resistance");
assert.equal(buy(second, "frigate").reason, "MISSION_LOCKED_UNIT");
assert.equal(buy(second, "frigate", TEAM.ENEMY).ok, true, "Enemy arsenal independent of player unlocks");
assert.equal(buy(second, "scout", TEAM.ENEMY).reason, "MISSION_LOCKED_UNIT");
assert.equal(buy(second, "bomber").ok, true);
assert.equal(second.simulation.damageMultiplier({ unitType: "bomber" }, { unitType: "frigate" }), 1.55);
assert.equal(second.simulation.damageMultiplier({ unitType: "bomber" }, { unitType: "fighter" }), 0.4);
const enemyLane = second.simulation.state.lanes.get(second.mapDefinition.lanes[0].id);
second.simulation.spawnFormation(TEAM.ENEMY, second.mapDefinition.lanes[0].id, ["fighter", "fighter", "fighter", "fighter", "fighter", "fighter"]);
assert.equal(enemyLane.unitIds.get(TEAM.ENEMY).length, 7);
const enemyEnergy = second.economy.get(TEAM.ENEMY).energy;
assert.equal(buy(second, "fighter", TEAM.ENEMY).reason, "LANE_CAPACITY");
assert.equal(second.economy.get(TEAM.ENEMY).energy, enemyEnergy);

// Exactly one representative battle per authored mission, through ordinary purchases.
// This verifies reachability, not balance or human comprehension.
const battles = [];
for (const id of ["first-contact", "heavy-resistance"]) {
  const director = create(id);
  let nextBuy = 0, choice = 0;
  const recipe = id === "first-contact" ? ["scout", "fighter", "fighter"] : ["fighter", "bomber", "scout", "bomber", "fighter"];
  while (director.state === MATCH_STATE.LIVE_MATCH && director.activeBattleSeconds < 420) {
    if (director.activeBattleSeconds >= nextBuy) {
      const result = buy(director, recipe[choice % recipe.length]);
      if (result.ok) choice += 1;
      nextBuy = director.activeBattleSeconds + 2;
    }
    director.advanceLive(1 / 60);
  }
  battles.push({ id, result: director.state, seconds: Math.round(director.activeBattleSeconds), launches: choice });
  assert.equal(director.state, MATCH_STATE.VICTORY, `Representative ${id} battle must be finishable: ${JSON.stringify(battles)}`);
  assert.equal(director.events.filter(event => event.type === "MATCH_ENDED").length, 1);
}
console.log("PASS: authored timing, independent legal arsenals/budgets, capacity, bomber role, pause, two representative battles.", JSON.stringify(battles));
