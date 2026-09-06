import { TEAM } from "../core/constants.js";
import { UNIT_DEFINITIONS } from "../data/definitions.js";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export class CaptureSystem {
  constructor({ captureRatePerSecond }) {
    this.captureRatePerSecond = captureRatePerSecond;
  }

  advance(state, delta) {
    for (const node of state.nodes.values()) {
      const lane = state.lanes.get(node.laneId);
      const power = (team) => lane.unitIds.get(team)
        .map((id) => state.units.get(id))
        .filter((unit) => unit?.alive && Math.hypot(unit.x - node.x, unit.y - node.y) <= node.radius)
        .reduce((sum, unit) => sum + (UNIT_DEFINITIONS[unit.unitType].captureStrength ?? 1), 0);
      const playerPower = power(TEAM.PLAYER);
      const enemyPower = power(TEAM.ENEMY);
      const netPower = playerPower - enemyPower;
      node.capturePower = { [TEAM.PLAYER]: playerPower, [TEAM.ENEMY]: enemyPower };
      node.contested = playerPower > 0 && enemyPower > 0 && Math.abs(netPower) < 0.1;
      if (node.contested || Math.abs(netPower) < 0.1) continue;

      const previousProgress = node.progress;
      const previousOwner = node.ownerTeam;
      node.progress = clamp(node.progress + netPower * this.captureRatePerSecond * delta, -100, 100);
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
