import assert from "node:assert/strict";
import { MatchDirector } from "../src/simulation/matchDirector.js";
import { EXPANSION_MISSIONS } from "../src/data/campaignExpansion.js";
import { expansionMatchOptions } from "../src/data/expansionScenarios.js";
import { ExpansionProgress } from "../src/campaign/expansionProgress.js";
import { TEAM } from "../src/core/constants.js";
import { acquireUnitTarget } from "../src/simulation/targeting.js";
import { REPAIR } from "../src/campaign/repairSupport.js";
import { openingLayout, openingActionAt } from "../src/ui/openingUi.js";
import { stationOccupation } from "../src/campaign/objectiveRules.js";
import { openingHoldPositions } from "../src/simulation/openingFormation.js";
const make=(n,ability="aegis")=>{const d=new MatchDirector(expansionMatchOptions(EXPANSION_MISSIONS[n-1],{ability}));d.start();return d;};
const activate=d=>d.executeCommand({type:"ACTIVATE_CARRIER",team:TEAM.PLAYER,laneId:d.mapDefinition.lanes[0].id});
const step=(d,t)=>{for(let i=0;i<t*60;i++)d.advanceLive(1/60);};
// One source of truth for visual selection, damage and saved equipment.
const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
const progress=new ExpansionProgress(storage);progress.selectAbility("repair");assert.equal(new ExpansionProgress(storage).data.ability,"repair");
assert.equal(make(1,"repair").equippedAbility,"aegis");assert.equal(make(2,"repair").equippedAbility,"repair");
const d=make(2,"repair"),lane=d.mapDefinition.lanes[0].id;
const allies=[0,1,2].map(i=>d.simulation.spawnUnit(TEAM.PLAYER,lane,"fighter",{x:170+i*25,y:430}));
allies.forEach(u=>u.hp=20);const before=d.economy.get(TEAM.PLAYER).energy;
assert.equal(activate(d).ok,true);assert.equal(d.economy.get(TEAM.PLAYER).energy,before-REPAIR.cost);
assert.equal(activate(d).reason,"ABILITY_COOLDOWN");
d.repair.advance(1,d);assert.equal(d.repair.links.length,2);assert.equal(allies.reduce((sum,u)=>sum+u.hp-20,0),24);
const ship=d.simulation.state.units.get(d.repair.unitId);assert.equal(ship.unitType,"repair");
const ghostSite={laneId:lane,x:ship.x,y:ship.y,radius:1};assert.equal(stationOccupation(d.simulation.state,ghostSite).occupied,false);
d.pause();const frozen=d.repair.activeRemaining;step(d,2);assert.equal(d.repair.activeRemaining,frozen);assert.equal(activate(d).reason,"WRONG_PHASE");d.resume();
d.simulation.applyDamage([{targetId:ship.id,damage:1000,ownerTeam:TEAM.ENEMY}]);d.repair.advance(1,d);assert.equal(d.repair.activeRemaining,0);assert.deepEqual(d.repair.links,[]);
const targetable=make(2,"repair");activate(targetable);const support=targetable.simulation.state.units.get(targetable.repair.unitId);support.launching=false;
const hunter=targetable.simulation.spawnUnit(TEAM.ENEMY,lane,"fighter",{x:support.x,y:support.y-40});assert.equal(acquireUnitTarget(targetable.simulation.state,hunter)?.id,support.id);
const expire=make(2,"repair");activate(expire);const expiring=expire.simulation.state.units.get(expire.repair.unitId);expire.repair.advance(30,expire);assert.equal(expiring.alive,false);
const poor=make(2,"repair");poor.economy.get(TEAM.PLAYER).energy=89;assert.equal(activate(poor).reason,"INSUFFICIENT_ENERGY");assert.equal(poor.simulation.state.units.size,0);
const full=make(2,"repair");for(let i=0;i<12;i++)full.simulation.spawnUnit(TEAM.PLAYER,lane,"scout");const saved=full.economy.get(TEAM.PLAYER).energy;assert.equal(activate(full).reason,"LANE_CAPACITY");assert.equal(full.economy.get(TEAM.PLAYER).energy,saved);
// The introduction's explicit threat is real damage, mitigated by the same Aegis rule as combat.
for(const protectedFleet of [false,true]){
 const m=make(1),unit=m.simulation.spawnUnit(TEAM.PLAYER,lane,"fighter",{x:210,y:370});
 m.missionRuntime.salvo.warning={x:210,y:370,radius:110,remaining:.01};
 if(protectedFleet)assert.equal(activate(m).ok,true);
 m.missionRuntime.salvo.advance(m,.02);assert.ok(Math.abs(unit.hp-(112-(protectedFleet?25.6:64)))<1e-6);
}
for(const n of [1,2,3]){const m=EXPANSION_MISSIONS[n-1],ui=openingLayout(760,m);for(const rect of [...ui.units,ui.ability,ui.front,...ui.sites]){assert.ok(rect.height>=44);assert.ok(rect.x+rect.width<=420);assert.ok(openingActionAt({x:rect.x+rect.width/2,y:rect.y+rect.height/2},760,m,null));}}
for(const number of [2,3]){
 const formation=make(number),state=formation.simulation.state;
 for(let i=0;i<12;i++)formation.simulation.spawnUnit(TEAM.PLAYER,lane,i<8?'fighter':'bomber');
 const slots=[...openingHoldPositions(state,lane,formation.mapDefinition.lanes[0].defenseLineY).values()];
 assert.equal(slots.length,12);assert.ok(slots.every(Boolean),'Every allowed ship has its own resting slot');
 for(let a=0;a<slots.length;a++)for(let b=a+1;b<slots.length;b++)assert.ok(Math.hypot(slots[a].x-slots[b].x,slots[a].y-slots[b].y)>=60);
 assert.ok(slots.every(p=>!state.map.markers.filter(m=>m.kind==='protect').some(m=>Math.hypot(m.x-p.x,m.y-p.y)<90)),'Dock silhouette stays clear');
 for(let frame=0;frame<40*60;frame++)formation.simulation.step(1/60);
 const settled=[...state.units.values()];
 for(let a=0;a<settled.length;a++)for(let b=a+1;b<settled.length;b++)assert.ok(Math.hypot(settled[a].x-settled[b].x,settled[a].y-settled[b].y)>45,'Actual resting hulls remain separate');
}
console.log("PASS: selectable persistent support, real capped healing, damage/expiry/pause, atomic failed casts, Aegis salvo mitigation, direct touch targets.");
