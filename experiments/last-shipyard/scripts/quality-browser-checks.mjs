import assert from "node:assert/strict";
import { expansionUiLayout } from "../src/ui/expansionUi.js";
import { openingLayout } from "../src/ui/openingUi.js";
import { campaignUiLayout, campaignResultLayout } from "../src/ui/campaignUi.js";
import { EXPANSION_MISSIONS } from "../src/data/campaignExpansion.js";
import { COMMAND_UI, overlayUiLayout } from "../src/ui/commandUi.js";
import { TEAM } from "../src/core/constants.js";
export const checkQuality=async({evaluate,tap,capture,send,delay,waitReady})=>{
 const read=exp=>evaluate(`(()=>{const g=window.__lastShipyard,d=g.match;return (${exp});})()`);
 const run=body=>evaluate(`(()=>{const g=window.__lastShipyard,d=g.match;const step=()=>{d.advanceLive(1/60);g.effects.observe(d.simulation?.state.events??[]);g.effects.update(1/60);g.clock.frameTime+=1/60;};${body.replaceAll('d.advanceLive(1/60)','step()')}})()`);
 const height=await read('g.transform.designHeight'),ui=expansionUiLayout(height);
 await tap(campaignUiLayout(height).campaign);assert.equal(await read('g.menuScreen'),'expansion');
 await capture('quality-campaign.png');await tap(ui.openingMissions[1]);await tap(ui.openingStart);assert.equal(await read('d.state'),'TITLE');await tap(ui.back);
 for(const number of [1,2,3]){
   await tap(ui.openingMissions[number-1]);await evaluate('(window.__lastShipyard.levelLoadPromise??Promise.resolve()).then(()=>true)');
   if(number===2)await tap(ui.supportRepair);if(number===3)await tap(ui.supportAegis);
   await capture(`quality-m${number}-briefing.png`);await tap(ui.openingStart);assert.equal(await read('d.state'),'LIVE_MATCH');
   const controls=openingLayout(height,EXPANSION_MISSIONS[number-1]);
   await tap(controls.units[0]);await tap(controls.units[1]);
   if(number===2){assert.equal(await read('d.equippedAbility'),'repair');}
   // Capture a real combat decision, not only the empty starting map.
   await run(`for(let f=0;f<${number===1?12:number===2?24:15}*60&&d.state==='LIVE_MATCH';f++)d.advanceLive(1/60);g.syncMatchState();`);
   await tap(controls.front);await capture(`quality-m${number}-decision.png`);
   if(number===1){assert.ok(await read('d.missionRuntime.salvo.warning'));await tap(controls.ability);assert.ok(await read('d.aegis.activeRemaining')>0);}
   if(number===2){await tap(controls.ability);assert.ok(await read('d.repair.activeRemaining')>0);}
   await capture(`quality-m${number}-ability.png`);
   if(number>1){
     await run(`for(let f=0;f<20*60&&d.state==='LIVE_MATCH'&&d.economy.get('${TEAM.PLAYER}').energy<140;f++)d.advanceLive(1/60);g.syncMatchState();`);
     await tap(controls.sites[1]);await capture(`quality-m${number}-build.png`);await tap(controls.build);
     assert.ok(await read('[...d.simulation.state.structures.values()].some(s=>s.padId&&s.alive)'));
     await tap(controls.close);
   }
   await tap(COMMAND_UI.pause);assert.equal(await read('d.state'),'PAUSED');await tap(overlayUiLayout(height).pauseResume);
   await run('g.qualityEvidence={purchases:0,healing:false,flank:false};');
   let result;
   for(let checkpoint=0;checkpoint<4;checkpoint++){
    result=await run(`const evidence=g.qualityEvidence;let event=null;for(let f=0;f<240*60&&d.state==='LIVE_MATCH';f++){
     if(f%60===0){
       const lane=d.mapDefinition.lanes[0].id;
       const recipe=d.mission.number===3?['fighter','bomber','fighter','bomber']:['scout','fighter','fighter'];
       const cost=d.mission.number===1&&d.missionRuntime.salvo.warning?80:0;
       if(d.economy.get('${TEAM.PLAYER}').energy>cost&&d.executeCommand({type:'DEPLOY_UNIT',team:'${TEAM.PLAYER}',laneId:lane,unitType:recipe[evidence.purchases%recipe.length]}).ok)evidence.purchases++;
       if((d.missionRuntime.salvo?.warning?.remaining<2)||(d.mission.number>1&&[...d.simulation.state.units.values()].some(u=>u.team==='${TEAM.PLAYER}'&&u.hp<u.maxHp*.65)))d.executeCommand({type:'ACTIVATE_CARRIER',team:'${TEAM.PLAYER}',laneId:lane});
     }d.advanceLive(1/60);
     if(!evidence.healing&&d.repair.totalHealed>1&&d.repair.links.length){evidence.healing=true;event='healing';break;}
     if(!evidence.flank&&d.mission.number===3&&d.missionRuntime.attackNumber===2&&d.missionRuntime.phase==='warning'){evidence.flank=true;event='flank';break;}
   }g.syncMatchState();return {event,state:d.state,seconds:Math.round(d.activeMatchSeconds),dock:d.simulation.state.structures.get('harbor-dock')?.hp,prevented:d.missionRuntime.salvo?.prevented,...evidence};`);
    if(!result.event)break;
    if(result.event==='healing')await tap(controls.front);
    if(result.event==='flank'){await tap(controls.sites[0]);await tap(controls.close);}
    await capture(`quality-m${number}-${result.event}.png`);
    if(result.event==='flank'){
      await send('Emulation.setDeviceMetricsOverride',{width:360,height:640,deviceScaleFactor:1,mobile:true});await delay(100);await capture('quality-m3-combat-360x640.png');
      await send('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:1,mobile:true});await delay(100);
    }
   }
   if(number===1)assert.ok(result.prevented>0,'Intro shield must actually intercept the salvo');
   if(number===2)assert.ok(result.healing,'Repair support must heal during real combat');
   if(number===3)assert.ok(result.flank,'Third attack has a visible flank warning');
   console.log(JSON.stringify({qualityMission:number,...result}));
   assert.equal(result.state,'VICTORY',JSON.stringify({number,...result}));await capture(`quality-m${number}-result.png`);
   await tap(campaignResultLayout(height).menu);assert.equal(await read('g.menuScreen'),'expansion');
 }
 await capture('quality-harbor-saved.png');
 for(const[width,h]of [[360,640],[390,844]]){await send('Emulation.setDeviceMetricsOverride',{width,height:h,deviceScaleFactor:1,mobile:true});await delay(100);await capture(`quality-overview-${width}x${h}.png`);}
 await send('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:1,mobile:true});await delay(100);
 await tap(ui.openingMissions[1]);await tap(ui.supportRepair);
 await send('Page.reload',{ignoreCache:true});await delay(100);await waitReady();
 assert.equal(await read('g.expansion.data.ability'),'repair');assert.equal(await read('g.expansion.data.completed.length'),3);
};
