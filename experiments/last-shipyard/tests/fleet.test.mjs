import assert from "node:assert/strict";
import { MatchDirector } from "../src/simulation/matchDirector.js";
import { missionById, missionMatchOptions } from "../src/data/campaign.js";
import { CampaignProgress } from "../src/campaign/progress.js";
import { interruptWeapons } from "../src/campaign/weaponStatus.js";
import { TEAM, MATCH_STATE } from "../src/core/constants.js";
const create = (id = "split-front", ability = null, bomberVariant = "standard") => { const d = new MatchDirector({ ...missionMatchOptions(missionById(id), { bomberVariant }), equippedAbility: ability }); d.start(); return d; };
const buy = (d, unitType, lane = d.mapDefinition.lanes[0].id) => d.executeCommand({ type: "DEPLOY_UNIT", team: TEAM.PLAYER, laneId: lane, unitType });
const caps = create(), [left, right] = caps.mapDefinition.lanes.map(l => l.id);
assert.equal(caps.simulation.state.laneStances.get(left), "hold"); assert.equal(caps.simulation.state.laneStances.get(right), "push");
caps.simulation.spawnFormation(TEAM.PLAYER, left, Array(10).fill("fighter"));
caps.simulation.spawnFormation(TEAM.PLAYER, right, Array(6).fill("fighter"));
assert.equal([...caps.simulation.state.units.values()].filter(u => u.team === TEAM.PLAYER).length, 18);
const energy = caps.economy.get(TEAM.PLAYER).energy;
assert.equal(buy(caps, "bomber", right).reason, "TEAM_CAPACITY"); assert.equal(caps.economy.get(TEAM.PLAYER).energy, energy);
caps.forceWave(); assert.equal([...caps.simulation.state.units.values()].filter(u => u.team === TEAM.PLAYER).length, 18, "Automatic waves respect shared budget");
assert.equal(caps.executeCommand({type:"SET_LANE_STANCE",team:TEAM.PLAYER,laneId:left,stance:"push"}).ok, true);
assert.equal(caps.simulation.state.laneStances.get(left), "push");
const standard = create("the-window"), ion = create("the-window", null, "ion");
assert.equal(buy(standard, "bomber").spawned[0].bomberVariant, "standard");
const ionShip = buy(ion, "bomber").spawned[0]; assert.equal(ionShip.bomberVariant, "ion");
assert.ok(ion.simulation.damageMultiplier(ionShip, {structureType:"hq"}) < standard.simulation.damageMultiplier({unitType:"bomber"}, {structureType:"hq"}));
const target = ion.simulation.spawnFormation(TEAM.ENEMY, ion.mapDefinition.lanes[0].id, ["frigate"])[0];
ion.simulation.applyDamage([{targetId:target.id,damage:10,ionSeconds:2,ownerTeam:TEAM.PLAYER}]);
assert.equal(target.weaponsDisabledUntil, 2);
const hq = ion.simulation.state.structures.get("enemy-hq"); assert.equal(interruptWeapons(ion.simulation.state, hq, 3), false);
assert.equal(hq.weaponsDisabledUntil, undefined, "Carrier immune to weapon interruption");
const emp = create("the-window", "disrupt");
assert.equal(emp.executeCommand({type:"ACTIVATE_CARRIER",team:TEAM.PLAYER,laneId:emp.mapDefinition.lanes[0].id}).reason, "NO_ABILITY_TARGETS");
assert.equal(emp.economy.get(TEAM.PLAYER).energy, 320);
const enemy = emp.simulation.spawnFormation(TEAM.ENEMY, emp.mapDefinition.lanes[0].id, ["frigate"])[0];
assert.equal(emp.executeCommand({type:"ACTIVATE_CARRIER",team:TEAM.PLAYER,laneId:enemy.laneId}).ok, true);
assert.equal(emp.economy.get(TEAM.PLAYER).energy, 220); assert.equal(enemy.weaponsDisabledUntil, 3.5);
emp.pause(); emp.advanceLive(5); assert.equal(emp.disrupt.activeRemaining, 3.5); emp.resume();
emp.returnToTitle(); assert.equal(emp.disrupt.activeRemaining, 0);
const saved = new Map(), storage = {getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
let progress = new CampaignProgress(storage);
for (const id of ["first-contact","heavy-resistance","harbor-fire","split-front","the-window"]) assert.equal(progress.complete(id),true);
assert.equal(progress.toggleBomber(),true); assert.equal(progress.data.equipment.bomberVariant,"ion");
progress.toggleAegis(); assert.equal(progress.data.equipment.ability,"disrupt");
progress = new CampaignProgress(storage); assert.equal(progress.data.equipment.ability,"disrupt"); assert.equal(progress.data.equipment.bomberVariant,"ion");

const battles = [];
for (const id of ["split-front", "the-window"]) {
  const d = create(id, "aegis"); let nextBuy = 0, choice = 0, switched = false;
  const lanes = d.mapDefinition.lanes.map(l=>l.id);
  const recipe = id === "split-front" ? [["frigate",0],["fighter",1],["bomber",1],["scout",0],["bomber",1],["fighter",1]] : [["frigate",0],["fighter",0],["bomber",0],["bomber",0],["fighter",0]];
  while(d.state === MATCH_STATE.LIVE_MATCH && d.activeBattleSeconds < 480) {
    if(id === "the-window" && d.missionRuntime.phase === "recovery" && !switched) { d.executeCommand({type:"SET_LANE_STANCE",team:TEAM.PLAYER,laneId:lanes[0],stance:"push"}); switched=true; }
    if(d.activeBattleSeconds>=nextBuy) {
      const [type,lane] = recipe[choice % recipe.length]; if(buy(d,type,lanes[lane]).ok) choice++;
      nextBuy=d.activeBattleSeconds+2;
    }
    if(d.missionRuntime.phase === "assault" && d.aegis.cooldownRemaining === 0) d.executeCommand({type:"ACTIVATE_CARRIER",team:TEAM.PLAYER,laneId:lanes[0]});
    d.advanceLive(1/60);
  }
  battles.push({id,state:d.state,seconds:Math.round(d.activeBattleSeconds),launches:choice});
  assert.equal(d.state,MATCH_STATE.VICTORY,JSON.stringify(battles));
}
console.log("PASS: shared fleet budgets, lane stance, ion tradeoff and immunity, disruption costs/pause, saved loadout; two representative missions.",JSON.stringify(battles));
