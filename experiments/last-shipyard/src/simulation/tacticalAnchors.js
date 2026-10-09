import { TEAM } from "../core/constants.js";
import { laneWaitingForShield } from "../campaign/relayShield.js";

// One source for movement and the line drawn in the HUD. Existing missions retain
// their coordinates; new layouts can override an anchor for each individual lane.
export const playerHoldLine = (state, laneId, allowLaneStance = false) => {
  const map = state?.map, lane = map?.lanes.find(item => item.id === laneId);
  if (!lane) return null;
  if (allowLaneStance && state.laneStances?.get(laneId) === "hold") return lane.anchors?.holdY ?? map.anchors?.holdY ?? null;
  if (laneWaitingForShield(state, { team: TEAM.PLAYER, laneId })) return lane.anchors?.relayStagingY ?? map.anchors?.relayStagingY ?? null;
  return lane.defenseLineY ?? map.defenseLineY ?? null;
};
