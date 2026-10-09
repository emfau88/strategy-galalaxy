import { TEAM } from "../core/constants.js";

/** A visible command-carrier weapon, only in the short introductory mission. */
export class TelegraphSalvo {
  constructor() { this.nextAt = 11; this.warning = null; this.impact = null; this.fired = 0; this.prevented = 0; }
  advance(director, dt) {
    const state=director.simulation.state, source=state.structures.get("enemy-hq");
    if (this.impact) { this.impact.life -= dt; if (this.impact.life <= 0) this.impact = null; }
    if (!source?.alive) { this.warning = null; return; }
    if (this.warning) {
      this.warning.remaining -= dt;
      if (this.warning.remaining <= 0) {
        const target=this.warning;
        const victims=[...state.units.values()].filter(u=>u.alive && !u.launching && u.team===TEAM.PLAYER && Math.hypot(u.x-target.x,u.y-target.y)<=target.radius);
        this.prevented += victims.reduce((sum,u)=>sum+(director.aegis.absorbedDamage(u,64)),0);
        director.simulation.applyDamage(victims.map(u=>({targetId:u.id,damage:64,ownerTeam:TEAM.ENEMY,laneId:u.laneId})));
        this.impact={...target,life:.7}; this.warning=null; this.fired++; this.nextAt=state.time+21;
      }
    } else if (state.time >= this.nextAt) {
      const front=[...state.units.values()].filter(u=>u.alive && !u.launching && u.team===TEAM.PLAYER && u.unitType!=="drone").sort((a,b)=>a.y-b.y)[0];
      if (front) this.warning={x:front.x,y:front.y,radius:110,remaining:4,sourceX:source.x,sourceY:source.y};
    }
  }
}
