import { MATCH_STATE, TEAM } from "../core/constants.js";
import { emitSimulationEvent } from "../simulation/battleState.js";

export const AEGIS = Object.freeze({ cost: 80, duration: 6, cooldown: 28, absorption: 0.6 });

/** Temporary damage mitigation, independent of permanent shield research or hull repairs. */
export class AegisSystem {
  constructor(equipped = false) { this.equipped = equipped; this.activeRemaining = 0; this.cooldownRemaining = 0; this.laneId = null; }
  availability(director, laneId) {
    if (director.state !== MATCH_STATE.LIVE_MATCH) return { ok: false, reason: "WRONG_PHASE" };
    if (!this.equipped) return { ok: false, reason: "ABILITY_NOT_EQUIPPED" };
    if (!director.simulation.state.lanes.has(laneId)) return { ok: false, reason: "INVALID_TEAM_OR_LANE" };
    if (!director.simulation.state.structures.get("player-hq")?.alive) return { ok: false, reason: "NO_CARRIER" };
    if (this.cooldownRemaining > Number.EPSILON) return { ok: false, reason: "ABILITY_COOLDOWN" };
    if (director.economy.get(TEAM.PLAYER).energy < AEGIS.cost) return { ok: false, reason: "INSUFFICIENT_ENERGY" };
    return { ok: true };
  }
  activate(director, laneId) {
    const allowed = this.availability(director, laneId);
    if (!allowed.ok) return allowed;
    director.economy.get(TEAM.PLAYER).energy -= AEGIS.cost;
    this.activeRemaining = AEGIS.duration; this.cooldownRemaining = AEGIS.cooldown; this.laneId = laneId;
    const carrier = director.simulation.state.structures.get("player-hq");
    emitSimulationEvent(director.simulation.state, { type: "aegis_activated", team: TEAM.PLAYER, laneId, x: carrier.x, y: carrier.y });
    return { ok: true, cost: AEGIS.cost };
  }
  advance(dt) { this.activeRemaining = Math.max(0, this.activeRemaining - dt); this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt); }
  protects(entity) { return this.activeRemaining > 0 && entity.team === TEAM.PLAYER
    && (entity.structureType === "hq" || (!entity.structureType && entity.laneId === this.laneId)); }
  absorbedDamage(entity, damage) { return this.protects(entity) ? damage * AEGIS.absorption : 0; }
  cancel() { this.activeRemaining = 0; this.laneId = null; }
}
