import { TEAM, MATCH_STATE } from "../core/constants.js";
import { UNIT_DEFINITIONS } from "../data/definitions.js";

// Shared contract for V2-1. Ownership alone is not occupation. Every hostile ship
// blocks a project, even if friendly capture strength is greater.
export const stationOccupation = (state, station) => {
  if (!station) return { occupied: false, blocked: false, secure: false };
  const nearby = [...state.units.values()].filter(unit => unit.alive && !unit.launching
    && (station.laneId === null || unit.laneId === station.laneId)
    && Math.hypot(unit.x - station.x, unit.y - station.y) <= station.radius);
  const occupied = nearby.some(unit => unit.team === TEAM.PLAYER && UNIT_DEFINITIONS[unit.unitType]?.purchasable !== false
    && (UNIT_DEFINITIONS[unit.unitType]?.cost ?? 0) > 0 && UNIT_DEFINITIONS[unit.unitType]?.enabled !== false);
  const blocked = nearby.some(unit => unit.team === TEAM.ENEMY);
  return { occupied, blocked, secure: occupied && !blocked };
};

// Future objective runtimes provide objectiveComplete only after their own steps.
// Neutral/unactivated required structures must already exist and be alive.
export const objectiveOutcome = (state, goal, objectiveComplete) => {
  if (goal.requiredAlive.some(id => !state.structures.get(id)?.alive)) return { team: TEAM.ENEMY, reason: "REQUIRED_STRUCTURE_DESTROYED" };
  if (objectiveComplete !== true) return null;
  if (goal.requireClearBattle && ([...state.units.values()].some(unit => unit.alive && unit.team === TEAM.ENEMY)
    || [...state.projectiles.values()].some(projectile => projectile.alive && projectile.ownerTeam === TEAM.ENEMY))) return null;
  return { team: TEAM.PLAYER, reason: "OBJECTIVE_COMPLETE" };
};

export const objectiveStepSeconds = (matchState, delta) => matchState === MATCH_STATE.LIVE_MATCH && Number.isFinite(delta) ? Math.max(0, delta) : 0;
