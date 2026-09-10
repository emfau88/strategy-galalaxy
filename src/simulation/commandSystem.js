import { MATCH_STATE, TEAM } from "../core/constants.js";
import { emitSimulationEvent } from "./battleState.js";

const validTeams = new Set([TEAM.PLAYER, TEAM.ENEMY]);

export class CommandSystem {
  execute(director, command) {
    if (command?.type === "DEPLOY_UNIT") return this.deployUnit(director, command);
    if (command?.type === "BUY_UPGRADE") return this.buyUpgrade(director, command);
    return { ok: false, reason: "UNKNOWN_COMMAND" };
  }

  deployUnit(director, { team, laneId, unitType }) {
    if (director.state !== MATCH_STATE.LIVE_MATCH) return { ok: false, reason: "WRONG_PHASE" };
    if (!validTeams.has(team)) return { ok: false, reason: "INVALID_TEAM_OR_LANE" };
    return director.liveDeployment.deploy({ simulation: director.simulation, economy: director.economy, team, laneId, unitType });
  }

  buyUpgrade(director, { team, upgradeId }) {
    if (director.state !== MATCH_STATE.LIVE_MATCH) return { ok: false, reason: "WRONG_PHASE" };
    if (!validTeams.has(team)) return { ok: false, reason: "INVALID_TEAM_OR_LANE" };
    if (upgradeId === "logistics" || (upgradeId === "turret" && director.mapDefinition.features?.defensiveTurrets === false)) {
      return { ok: false, reason: "UNAVAILABLE_UPGRADE" };
    }
    const result = director.economy.buyUpgrade(team, upgradeId);
    if (!result.ok) return result;
    const headquarters = director.simulation.state.structures.get(team === TEAM.PLAYER ? "player-hq" : "enemy-hq");
    const event = { type: "upgrade_activated", team, upgradeId, level: result.level, x: headquarters?.x, y: headquarters?.y };
    emitSimulationEvent(director.simulation.state, event);
    return { ...result, event };
  }
}
