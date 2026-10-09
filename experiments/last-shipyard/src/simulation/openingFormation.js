import { TEAM } from "../core/constants.js";
import { compareUnitOrder } from "./entities.js";

// Quiet phases need actual resting positions: steering every squad back to
// the same line otherwise continually fights separation and piles up hulls.
export const openingHoldPositions = (state, laneId, line) => {
  const allies = [...state.units.values()].filter(u => u.alive && u.team === TEAM.PLAYER && u.laneId === laneId && u.unitType !== "repair")
    .sort((a,b) => Number(a.unitType === "bomber") - Number(b.unitType === "bomber") || compareUnitOrder(a,b));
  const occupied = [...state.map.buildPads, ...state.map.markers.filter(m => m.kind === "protect"), ...state.map.structures];
  const candidates = [];
  for (const dy of [-30, 30, 90, -90, 150, -150]) {
    for (const x of [84, 168, 252, 336]) {
      const y = line + dy;
      if (y < 120 || y > state.map.bounds.height - 90) continue;
      if (occupied.some(site => Math.hypot(x-site.x, y-site.y) < (site.structureType === "hq" ? 95 : site.kind === "protect" ? 90 : 58))) continue;
      candidates.push({x,y});
    }
  }
  return new Map(allies.map((unit,index) => [unit.id,candidates[index]]));
};
