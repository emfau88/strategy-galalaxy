import { TEAM, MATCH_STATE } from "../core/constants.js";
import { interruptWeapons } from "./weaponStatus.js";
export const DISRUPTION = Object.freeze({ cost: 100, duration: 3.5, cooldown: 32 });
export class DisruptionSystem {
  constructor(equipped = false) { this.equipped = equipped; this.activeRemaining = 0; this.cooldownRemaining = 0; this.laneId = null; }
  availability(director, laneId) {
    if (director.state !== MATCH_STATE.LIVE_MATCH) return { ok: false, reason: "WRONG_PHASE" };
    if (!this.equipped) return { ok: false, reason: "ABILITY_NOT_EQUIPPED" };
    if (!director.simulation.state.lanes.has(laneId)) return { ok: false, reason: "INVALID_TEAM_OR_LANE" };
    if (!director.simulation.state.structures.get("player-hq")?.alive) return { ok: false, reason: "NO_CARRIER" };
    if (this.cooldownRemaining > 0) return { ok: false, reason: "ABILITY_COOLDOWN" };
    if (director.economy.get(TEAM.PLAYER).energy < DISRUPTION.cost) return { ok: false, reason: "INSUFFICIENT_ENERGY" };
    const targets = [...director.simulation.state.units.values()].filter(unit => unit.alive && unit.team === TEAM.ENEMY && unit.laneId === laneId);
    if (!targets.length) return { ok: false, reason: "NO_ABILITY_TARGETS" };
    return { ok: true, targets };
  }
  activate(director, laneId) {
    const result = this.availability(director, laneId); if (!result.ok) return result;
    director.economy.get(TEAM.PLAYER).energy -= DISRUPTION.cost;
    this.activeRemaining = DISRUPTION.duration; this.cooldownRemaining = DISRUPTION.cooldown; this.laneId = laneId;
    result.targets.forEach(unit => interruptWeapons(director.simulation.state, unit, DISRUPTION.duration));
    return { ok: true, cost: DISRUPTION.cost, targets: result.targets.length };
  }
  advance(dt) { this.activeRemaining = Math.max(0, this.activeRemaining - dt); this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt); }
  cancel() { this.activeRemaining = 0; this.laneId = null; }
}
