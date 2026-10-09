import { MATCH_STATE, TEAM } from "../core/constants.js";

export const REPAIR = Object.freeze({ cost: 90, duration: 18, cooldown: 32, radius: 125, rate: 12, targets: 2 });

/** A temporary, targetable ship. Its healing is local, capped and never restores structures. */
export class RepairSupport {
  constructor(equipped = false) { this.equipped = equipped; this.cooldownRemaining = 0; this.activeRemaining = 0; this.unitId = null; this.links = []; this.totalHealed = 0; }
  availability(director, laneId) {
    if (director.state !== MATCH_STATE.LIVE_MATCH) return { ok: false, reason: "WRONG_PHASE" };
    if (!this.equipped) return { ok: false, reason: "ABILITY_NOT_EQUIPPED" };
    if (!director.simulation.state.lanes.has(laneId)) return { ok: false, reason: "INVALID_TEAM_OR_LANE" };
    if (!director.simulation.state.structures.get("player-hq")?.alive) return { ok: false, reason: "NO_CARRIER" };
    if (this.cooldownRemaining > 0) return { ok: false, reason: "ABILITY_COOLDOWN" };
    if (director.economy.get(TEAM.PLAYER).energy < REPAIR.cost) return { ok: false, reason: "INSUFFICIENT_ENERGY" };
    const units = [...director.simulation.state.units.values()].filter(u => u.alive && u.team === TEAM.PLAYER);
    if (units.length >= director.config.caps.unitsPerTeamByTeam[TEAM.PLAYER]
      || units.filter(u => u.laneId === laneId).length >= director.config.caps.unitsPerLaneTeamByTeam[TEAM.PLAYER]) return { ok: false, reason: "LANE_CAPACITY" };
    return { ok: true };
  }
  activate(director, laneId) {
    const allowed = this.availability(director, laneId); if (!allowed.ok) return allowed;
    const state = director.simulation.state, lane = state.map.lanes.find(l => l.id === laneId);
    const allies = [...state.units.values()].filter(u => u.alive && u.team === TEAM.PLAYER && u.laneId === laneId && !u.launching && u.unitType !== "drone");
    const front = allies.length ? Math.min(...allies.map(u => u.y)) : lane.playerSpawn.y;
    const unit = director.simulation.spawnUnit(TEAM.PLAYER, laneId, "repair", { x: lane.centerX + 65, y: Math.min(lane.playerSpawn.y, front + 75) });
    if (!unit) return { ok: false, reason: "LANE_CAPACITY" };
    director.economy.get(TEAM.PLAYER).energy -= REPAIR.cost;
    this.unitId = unit.id; this.laneId = laneId; this.cooldownRemaining = REPAIR.cooldown; this.activeRemaining = REPAIR.duration;
    this.links = []; this.totalHealed = 0; return { ok: true, cost: REPAIR.cost };
  }
  advance(dt, director) {
    this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt); this.links = [];
    const state = director.simulation.state, ship = state.units.get(this.unitId);
    if (!ship?.alive) { this.activeRemaining = 0; return; }
    const activeStep = Math.min(dt, this.activeRemaining);
    this.activeRemaining = Math.max(0, this.activeRemaining - dt);
    const allies = [...state.units.values()].filter(u => u.alive && !u.launching && u.team === TEAM.PLAYER && u.laneId === this.laneId && u.unitType !== "repair" && u.unitType !== "drone");
    const wounded = allies.filter(u => u.hp < u.maxHp).sort((a,b) => a.hp/a.maxHp - b.hp/b.maxHp);
    const escort = wounded[0] ?? allies.sort((a,b) => a.y-b.y)[0];
    if (escort) {
      const lane = state.map.lanes.find(l => l.id === this.laneId);
      const tx = Math.max(lane.centerX-lane.width/2+22, Math.min(lane.centerX+lane.width/2-22, escort.x+50));
      const ty = Math.min(state.map.bounds.height-70, escort.y+60), dx=tx-ship.x, dy=ty-ship.y, distance=Math.hypot(dx,dy);
      const amount=Math.min(distance, 46*activeStep);
      if (distance > 0) { ship.x += dx/distance*amount; ship.y += dy/distance*amount; }
    }
    for (const unit of wounded.filter(u => Math.hypot(u.x-ship.x,u.y-ship.y) <= REPAIR.radius).slice(0,REPAIR.targets)) {
      const heal = Math.min(unit.maxHp-unit.hp, REPAIR.rate*activeStep); unit.hp += heal; this.totalHealed += heal; this.links.push(unit.id);
    }
    if (this.activeRemaining === 0) ship.alive = false;
  }
  cancel() { this.activeRemaining = 0; this.links = []; }
}
