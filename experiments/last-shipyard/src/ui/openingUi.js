import { containsPoint } from "./commandUi.js";

export const openingLayout = (height, mission) => {
  const units = mission.units.map((unitType,index) => ({unitType,x:12+index*(396/mission.units.length+4/mission.units.length),y:height-76,width:396/mission.units.length-4,height:64}));
  const pads = mission.map.buildPads;
  return { units, ability:{x:12,y:height-134,width:248,height:48},front:{x:268,y:height-134,width:140,height:48},
    sites: mission.map.markers.length ? [{x:12,y:height-188,width:124,height:44,site:"objective"},...pads.map((p,index)=>({x:144+index*(pads.length===1?0:136),y:height-188,width:pads.length===1?264:128,height:44,site:"pad",index}))] : [],
    panel:{x:12,y:height-326,width:396,height:130},close:{x:358,y:height-322,width:44,height:44},build:{x:26,y:height-253,width:368,height:44} };
};
export const openingActionAt = (point,height,mission,selectedSite) => {
  const ui=openingLayout(height,mission);
  for(const rect of ui.units) if(containsPoint(rect,point))return {type:"DEPLOY_UNIT",unitType:rect.unitType};
  if(containsPoint(ui.ability,point))return {type:"ACTIVATE_CARRIER"};
  if(containsPoint(ui.front,point))return {type:"FOCUS_FRONT"};
  for(const rect of ui.sites) if(containsPoint(rect,point))return {type:"FOCUS_SITE",site:rect.site,index:rect.index};
  if(selectedSite) {
    if(containsPoint(ui.close,point))return {type:"CLOSE_SITE"};
    if(mission.map.buildPads.some(p=>p.id===selectedSite)&&containsPoint(ui.build,point))return {type:"SITE_COMMAND"};
    if(containsPoint(ui.panel,point))return {type:"SITE_PANEL"};
  }
  return null;
};
