import { UNIT_DEFINITIONS } from "../data/definitions.js";
import { LANE, MATCH_STATE, TEAM } from "../core/constants.js";

const validTeams = new Set([TEAM.PLAYER, TEAM.ENEMY]);
const validLanes = new Set([LANE.LEFT, LANE.RIGHT]);

export class CommandSystem {
  execute(director, command) {
    if (command?.type === "QUEUE_UNIT") return this.queueUnit(director, command);
    if (command?.type === "REMOVE_QUEUED_UNIT") return this.removeQueuedUnit(director, command);
    if (command?.type === "BUY_UPGRADE") return this.buyUpgrade(director, command);
    return { ok: false, reason: "UNKNOWN_COMMAND" };
  }

  queueUnit(director, { team, laneId, unitType }) {
    if (director.state !== MATCH_STATE.LIVE_MATCH) return { ok: false, reason: "WRONG_PHASE" };
    if (director.queueLocked) return { ok: false, reason: "QUEUE_LOCKED" };
    if (!validTeams.has(team) || !validLanes.has(laneId)) return { ok: false, reason: "INVALID_TEAM_OR_LANE" };
    const definition = UNIT_DEFINITIONS[unitType];
    if (!definition || definition.enabled === false) return { ok: false, reason: "UNAVAILABLE_UNIT" };
    const queue = director.queuedWaves.get(team).get(laneId);
    const purchased = [...director.queuedWaves.get(team).values()].reduce((sum, entries) => sum + entries.length, 0);
    if (purchased >= director.config.balance.maxPurchasedReinforcementsPerDeployment) return { ok: false, reason: "REINFORCEMENT_LIMIT" };
    const active = director.simulation.state.lanes.get(laneId).unitIds.get(team).length;
    const reservedBase = director.baseWaveBacklog.get(team).get(laneId).length + director.deployment.baseWaveSize(director.simulation.state.time);
    if (active + reservedBase + queue.length >= director.config.caps.unitsPerLaneTeam) return { ok: false, reason: "CAPACITY_RESERVED" };
    const economy = director.economy.get(team);
    if (economy.energy < definition.cost) return { ok: false, reason: "INSUFFICIENT_ENERGY" };
    economy.energy -= definition.cost;
    const entry = { id: `queue-${director.nextQueueSequence}`, unitType, paidCost: definition.cost, source: "purchased", sequence: director.nextQueueSequence };
    director.nextQueueSequence += 1;
    queue.push(entry);
    return { ok: true, entry };
  }

  removeQueuedUnit(director, { team, laneId, queueEntryId }) {
    if (director.state !== MATCH_STATE.LIVE_MATCH) return { ok: false, reason: "WRONG_PHASE" };
    if (director.queueLocked) return { ok: false, reason: "QUEUE_LOCKED" };
    if (!validTeams.has(team) || !validLanes.has(laneId)) return { ok: false, reason: "INVALID_TEAM_OR_LANE" };
    const queue = director.queuedWaves.get(team).get(laneId);
    const index = queue.findIndex((entry) => entry.id === queueEntryId);
    if (index < 0) return { ok: false, reason: "UNKNOWN_QUEUE_ENTRY" };
    const [entry] = queue.splice(index, 1);
    director.economy.get(team).energy += entry.paidCost;
    return { ok: true, refunded: entry.paidCost, entry };
  }

  buyUpgrade(director, { team, upgradeId }) {
    if (director.state !== MATCH_STATE.LIVE_MATCH) return { ok: false, reason: "WRONG_PHASE" };
    if (director.queueLocked) return { ok: false, reason: "QUEUE_LOCKED" };
    if (!validTeams.has(team)) return { ok: false, reason: "INVALID_TEAM_OR_LANE" };
    return director.economy.buyUpgrade(team, upgradeId);
  }
}
