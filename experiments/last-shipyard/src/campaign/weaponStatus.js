import { emitSimulationEvent } from "../simulation/battleState.js";

export const interruptWeapons = (state, entity, seconds) => {
  if (!entity?.alive || entity.structureType || seconds <= 0) return false;
  entity.weaponsDisabledUntil = Math.max(entity.weaponsDisabledUntil ?? 0, state.time + seconds);
  emitSimulationEvent(state, { type: "weapons_interrupted", entityId: entity.id, team: entity.team,
    laneId: entity.laneId, x: entity.x, y: entity.y, duration: seconds });
  return true;
};
