import { TEAM } from "../core/constants.js";
import { UNIT_DEFINITIONS } from "../data/definitions.js";
import { openingLayout } from "../ui/openingUi.js";
import { AEGIS } from "../campaign/aegisSystem.js";
import { REPAIR } from "../campaign/repairSupport.js";
import { BASTION } from "../data/expansionScenarios.js";
const C={ink:"#07121e",panel:"#102334",line:"#29475a",text:"#edf3ee",muted:"#9aafbf",cyan:"#8fe7e0",gold:"#e5be83",red:"#f69a87",green:"#98e9b6"};
const text=(ctx,value,x,y,size=12,color=C.text,align="left")=>{ctx.fillStyle=color;ctx.font=`600 ${size}px Inter,system-ui,sans-serif`;ctx.textAlign=align;ctx.textBaseline="middle";ctx.fillText(value,x,y);};
const panel=(ctx,r,accent=C.line)=>{ctx.fillStyle=C.panel;ctx.strokeStyle=accent;ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(r.x,r.y,r.width,r.height,10);ctx.fill();ctx.stroke();};
const line=(ctx,x,y,width,ratio,color)=>{ctx.fillStyle=C.line;ctx.fillRect(x,y,width,3);ctx.fillStyle=color;ctx.fillRect(x,y,width*Math.max(0,Math.min(1,ratio)),3);};
const crop={scout:[115,100,155,185],fighter:[68,60,248,232],bomber:[78,50,228,250]};
export const renderOpeningHud=(ctx,model)=>{
  const d=model.director,state=d.simulation.state,run=d.missionRuntime.snapshot(state),ui=openingLayout(model.height,model.mission),energy=d.economy.get(TEAM.PLAYER).energy;
  ctx.save();ctx.fillStyle=C.ink;ctx.fillRect(0,0,420,110);ctx.fillRect(0,model.height-(ui.sites.length?198:144),420,198);
  text(ctx,`${Math.floor(energy)} E`,14,23,20,C.gold);
  text(ctx,`+${d.config.balance.baseIncomePerSecond}/s`,91,24,11,C.muted);
  const carrier=state.structures.get("player-hq"),count=[...state.units.values()].filter(u=>u.alive&&u.team===TEAM.PLAYER).length;
  text(ctx,`CARRIER ${Math.ceil(carrier.hp/carrier.maxHp*100)}%`,140,16,10,C.cyan);
  line(ctx,140,28,123,carrier.hp/carrier.maxHp,C.cyan);text(ctx,`${count}/${d.config.caps.unitsPerTeamByTeam[TEAM.PLAYER]} SCHIFFE`,140,43,10,C.muted);
  for(const [x,label] of [[284,model.state==="PAUSED"?"▶":"Ⅱ"],[328,model.soundEnabled?"♪":"×"],[372,"□"]]){panel(ctx,{x,y:9,width:40,height:42});text(ctx,label,x+20,30,16,C.text,"center");}
  text(ctx,`${String(model.mission.number).padStart(2,"0")}  ${model.mission.title.toUpperCase()}`,14,69,13,C.text);
  const warning=d.missionRuntime.salvo?.warning;
  const message=warning?`SCHWERE SALVE IN ${Math.ceil(warning.remaining)}s · ${d.aegis.activeRemaining>0?"AEGIS AKTIV":"AEGIS BEREIT?"}`:d.missionRuntime.phase==="warning"?`${Math.ceil(run.remaining)}s · ${run.threat}`:run.counter+" · "+({intro:"Flotte aufstellen",capture:"Scouts sichern das Relais",assault:"Feindkontakt",recovery:"Kurze Atempause",siege:"Blockadeträger zerstören",secure:"Stellung sichern"}[run.phase]??run.label);
  ctx.save();ctx.beginPath();ctx.rect(12,80,396,27);ctx.clip();text(ctx,message,14,93,11,warning||run.phase==="warning"?C.gold:C.muted);ctx.restore();
  for(const rect of ui.units){
    const def=UNIT_DEFINITIONS[rect.unitType],availability=d.liveDeployment.availability({simulation:d.simulation,economy:d.economy,team:TEAM.PLAYER,laneId:model.selectedLaneId,unitType:rect.unitType});
    panel(ctx,rect,availability.ok?C.cyan:C.line);
    const image=model.assets.get(`unified-player-${rect.unitType}`),source=crop[rect.unitType];
    if(image&&source){const scale=32/Math.max(source[2],source[3]);ctx.drawImage(image,...source,rect.x+11,rect.y+10,source[2]*scale,source[3]*scale);}
    const name={scout:"SCOUTS ×3",fighter:"FIGHTER ×2",bomber:"BOMBER"}[rect.unitType];
    text(ctx,name,rect.x+48,rect.y+20,11,availability.ok?C.text:C.muted);
    text(ctx,`${def.cost} E`,rect.x+48,rect.y+39,13,C.gold);
    const reason=availability.ok?{scout:"Schirm · Eroberung",fighter:"Jäger · Eskorte",bomber:"Gegen schwere Ziele"}[rect.unitType]:availability.reason==="COOLDOWN_ACTIVE"?`${d.liveDeployment.cooldownRemaining(TEAM.PLAYER,rect.unitType).toFixed(1)}s`:availability.reason==="INSUFFICIENT_ENERGY"?`Noch ${Math.ceil(def.cost-energy)} E`:"Flotte voll";
    text(ctx,reason,rect.x+rect.width/2,rect.y+55,9,C.muted,"center");
  }
  const repair=d.equippedAbility==="repair",ability=d.carrierAbility,spec=repair?REPAIR:AEGIS,available=ability.availability(d,model.selectedLaneId).ok;
  panel(ctx,ui.ability,ability.activeRemaining?repair?C.green:C.cyan:available?C.gold:C.line);
  text(ctx,`${repair?"REPARATURSCHIFF":"AEGIS"} · ${spec.cost} E`,ui.ability.x+13,ui.ability.y+16,13,repair?C.green:C.cyan);
  const status=ability.activeRemaining>0?`${Math.ceil(ability.activeRemaining)}s aktiv${repair?` · ${Math.round(ability.totalHealed)} Hülle repariert`:" · 60% Schutz"}`:ability.cooldownRemaining>0?`${Math.ceil(ability.cooldownRemaining)}s bis bereit`:repair?"18s · 2 Ziele · benötigt 1 Flottenplatz":"6s · Flotte und Missionsanlage schützen";
  text(ctx,status,ui.ability.x+13,ui.ability.y+34,10,C.muted);
  panel(ctx,ui.front);text(ctx,"ZUR FRONT ↑",ui.front.x+ui.front.width/2,ui.front.y+24,12,C.text,"center");
  for(const r of ui.sites){panel(ctx,r);text(ctx,r.site==="objective"?model.mission.number===2?"RELAIS":"HAFENDOCK":ui.sites.length===2?"BASTION BAUEN":r.index===0?"BAU VORNE":"BAU HINTEN",r.x+r.width/2,r.y+22,11,C.cyan,"center");}
  if(model.selectedSiteId){
    panel(ctx,ui.panel,C.cyan);text(ctx,"×",380,ui.panel.y+24,19,C.muted,"center");
    const pad=model.mapDefinition.buildPads.find(p=>p.id===model.selectedSiteId),building=[...state.structures.values()].find(s=>s.padId===pad?.id);
    text(ctx,pad?"BASTION · FESTE VERTEIDIGUNG":model.mission.number===2?"RELAIS BESATZUNG":"HAFENDOCK SCHÜTZEN",26,ui.panel.y+24,12,C.cyan);
    text(ctx,pad?"140 E fehlen dann für Flotte und Unterstützung.":model.mission.number===2?"Scouts erobern schneller. Feinde blockieren die Kontrolle.":`Hülle ${Math.ceil(state.structures.get("harbor-dock").hp)} / 900 · Verlust beendet den Einsatz`,26,ui.panel.y+49,10,C.muted);
    panel(ctx,ui.build,pad&&!building?.alive&&energy>=BASTION.cost?C.gold:C.line);
    text(ctx,pad?building?.alive?building.constructionRemaining>0?`BAU LÄUFT · ${Math.ceil(building.constructionRemaining)}s`:"BASTION EINSATZBEREIT":`BASTION BAUEN · 140 E · 8s`:model.mission.number===2?run.occupation.secure?"STELLUNG GESICHERT":"KAUF-SCHIFFE IM RELAISBEREICH BENÖTIGT":"FLOTTE UND BASTIONEN SCHÜTZEN DAS DOCK",210,ui.build.y+22,11,C.text,"center");
  }
  if(model.commandFeedback){panel(ctx,{x:30,y:model.height-(ui.sites.length?225:171),width:360,height:25});text(ctx,model.commandFeedback,210,model.height-(ui.sites.length?212:158),10,C.gold,"center");}
  ctx.restore();
};

export const renderOpeningEffects=(ctx,model)=>{
  if(!model.mapDefinition.qualityOpening)return;
  const d=model.director,state=d.simulation.state,sy=y=>model.camera.viewport.y+y-model.camera.y,repair=d.repair;
  const ship=state.units.get(repair?.unitId);
  ctx.save();
  if(ship?.alive){
    const y=sy(ship.y),image=model.assets.get("repair-support");
    if(image)ctx.drawImage(image,ship.x-28,y-28,56,56);
    ctx.strokeStyle="rgba(133,241,175,.22)";ctx.setLineDash([3,8]);ctx.beginPath();ctx.arc(ship.x,y,REPAIR.radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    for(const id of repair.links){const u=state.units.get(id);if(!u?.alive)continue;ctx.strokeStyle="#98e9b6";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ship.x,y);ctx.lineTo(u.x,sy(u.y));ctx.stroke();ctx.fillStyle="#c7ffdc";ctx.beginPath();ctx.arc(u.x,sy(u.y),4,0,Math.PI*2);ctx.fill();}
    line(ctx,ship.x-24,y+32,48,ship.hp/ship.maxHp,C.green);text(ctx,`${Math.ceil(repair.activeRemaining)}s`,ship.x,y+45,10,C.green,"center");
  }
  const salvo=d.missionRuntime.salvo,warning=salvo?.warning,impact=salvo?.impact;
  if(d.mission.number===3 && d.missionRuntime.attackNumber===2 && d.missionRuntime.phase==="warning"){
    const y=sy(500);ctx.strokeStyle=C.red;ctx.lineWidth=2;ctx.beginPath();ctx.arc(55,y,28,0,Math.PI*2);ctx.stroke();text(ctx,"BOMBER-ANFLUG",85,y-40,10,C.red,"center");
  }
  if(warning){
    const y=sy(warning.y);ctx.fillStyle="rgba(246,115,90,.07)";ctx.strokeStyle="#f6a183";ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.beginPath();ctx.arc(warning.x,y,warning.radius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);
    text(ctx,`SALVE · ${Math.ceil(warning.remaining)}s`,Math.max(65,Math.min(355,warning.x)),Math.max(model.camera.viewport.y+16,y-warning.radius-13),13,C.gold,"center");
    ctx.strokeStyle="rgba(246,115,90,.45)";ctx.beginPath();ctx.moveTo(warning.sourceX,sy(warning.sourceY));ctx.lineTo(warning.x,y-warning.radius);ctx.stroke();
  }
  if(impact){ctx.globalAlpha=impact.life/.7;ctx.strokeStyle=C.red;ctx.lineWidth=3;ctx.beginPath();ctx.arc(impact.x,sy(impact.y),impact.radius*(1-impact.life/.9),0,Math.PI*2);ctx.stroke();}
  ctx.restore();
};
