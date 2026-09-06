import { TEAM } from "../core/constants.js";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export class CaptureSystem {
  constructor({ captureRatePerSecond }) {
    this.captureRatePerSecond = captureRatePerSecond;
  }

  advance(state, delta) {
    for (const node of state.nodes.values()) {
      const lane = state.lanes.get(node.laneId);
      const count = (team) => lane.unitIds.get(team)
        .map((id) => state.units.get(id))
        .filter((unit) => unit?.alive && Math.hypot(unit.x - node.x, unit.y - node.y) <= node.radius).length;
      const playerCount = count(TEAM.PLAYER);
      const enemyCount = count(TEAM.ENEMY);
      node.contested = playerCount > 0 && enemyCount > 0;
      if (node.contested || (playerCount === 0 && enemyCount === 0)) continue;

      const direction = playerCount > 0 ? 1 : -1;
      const previousProgress = node.progress;
      const previousOwner = node.ownerTeam;
      node.progress = clamp(node.progress + direction * this.captureRatePerSecond * delta, -100, 100);
      if ((previousOwner === TEAM.PLAYER && node.progress <= 0) || (previousOwner === TEAM.ENEMY && node.progress >= 0)) {
        node.ownerTeam = null;
        state.events.push({ type: "NODE_NEUTRALIZED", nodeId: node.id });
      }
      if (node.progress === 100 && node.ownerTeam !== TEAM.PLAYER) {
        node.ownerTeam = TEAM.PLAYER;
        state.events.push({ type: "NODE_CAPTURED", nodeId: node.id, team: TEAM.PLAYER });
      }
      if (node.progress === -100 && node.ownerTeam !== TEAM.ENEMY) {
        node.ownerTeam = TEAM.ENEMY;
        state.events.push({ type: "NODE_CAPTURED", nodeId: node.id, team: TEAM.ENEMY });
      }
      if (node.progress !== previousProgress && node.ownerTeam !== previousOwner) state.events.push({ type: "NODE_OWNER_CHANGED", nodeId: node.id, team: node.ownerTeam });
    }
  }
}
