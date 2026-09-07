import { LANE, MATCH_STATE, TEAM } from "../core/constants.js";
import { STRUCTURE_DEFINITIONS, UNIT_DEFINITIONS } from "../data/definitions.js";

const lanes = Object.freeze([LANE.LEFT, LANE.RIGHT]);
const opponentOf = (team) => (team === TEAM.PLAYER ? TEAM.ENEMY : TEAM.PLAYER);

const unitStrength = (unit) => {
  const definition = UNIT_DEFINITIONS[unit.unitType];
  if (!definition || !unit.alive) return 0;
  return (definition.damage * 4 + definition.maxHp * 0.12 + definition.attackRange * 0.08) * (unit.hp / unit.maxHp);
};

const turretStrength = (state, team, laneId) => {
  const turret = state.structures.get(`${team === TEAM.PLAYER ? "player" : "enemy"}-${laneId === LANE.LEFT ? "left" : "right"}-turret`);
  if (!turret?.alive) return 0;
  return (STRUCTURE_DEFINITIONS.turret.damage * 5 + STRUCTURE_DEFINITIONS.turret.maxHp * 0.1) * (turret.hp / turret.maxHp);
};

/**
 * A deterministic, rule-bound opponent planner. It makes no simulation changes
 * directly: all purchases travel through CommandSystem and therefore use the
 * identical budget, costs, capacity, and phase restrictions as player commands.
 */
export class OpponentAi {
  constructor({ team = TEAM.ENEMY, preferredLane = LANE.LEFT } = {}) {
    this.team = team;
    this.preferredLane = preferredLane;
    this.lastDecision = null;
  }

  laneTieBreak(left, right) {
    if (left.laneId === this.preferredLane && right.laneId !== this.preferredLane) return -1;
    if (right.laneId === this.preferredLane && left.laneId !== this.preferredLane) return 1;
    return left.laneId.localeCompare(right.laneId);
  }

  laneAssessment(director, laneId) {
    const { state } = director.simulation;
    const enemyTeam = opponentOf(this.team);
    const lane = state.lanes.get(laneId);
    const friendlyUnits = lane.unitIds.get(this.team).map((id) => state.units.get(id)).reduce((total, unit) => total + unitStrength(unit), 0);
    const enemyUnits = lane.unitIds.get(enemyTeam).map((id) => state.units.get(id)).reduce((total, unit) => total + unitStrength(unit), 0);
    const friendlyTurret = turretStrength(state, this.team, laneId);
    const enemyTurret = turretStrength(state, enemyTeam, laneId);
    const node = [...state.nodes.values()].find((value) => value.laneId === laneId);
    const nodePressure = node?.ownerTeam === enemyTeam ? 42 : node?.ownerTeam === this.team ? -18 : 0;
    return {
      laneId,
      friendlyUnits: Math.round(friendlyUnits),
      enemyUnits: Math.round(enemyUnits),
      friendlyTurret: Math.round(friendlyTurret),
      enemyTurret: Math.round(enemyTurret),
      nodeOwner: node?.ownerTeam ?? null,
      threat: Math.round(enemyUnits + nodePressure - friendlyUnits - friendlyTurret * 0.35),
      opportunity: Math.round(friendlyUnits + friendlyTurret * 0.55 - enemyUnits - enemyTurret * 0.35 - nodePressure),
    };
  }

  plan(director) {
    if (director.state !== MATCH_STATE.LIVE_MATCH || director.queueLocked || !director.simulation) return { ok: false, reason: "WRONG_PHASE" };
    const assessments = lanes.map((laneId) => this.laneAssessment(director, laneId));
    const defense = [...assessments].sort((left, right) => right.threat - left.threat || this.laneTieBreak(left, right))[0];
    const push = [...assessments].sort((left, right) => right.opportunity - left.opportunity || this.laneTieBreak(left, right))[0];
    const purchases = [];
    const upgrades = [];
    const economy = director.economy.get(this.team);
    const buy = (upgradeId, reserve) => {
      const cost = director.economy.upgradeCost(this.team, upgradeId);
      if (cost !== null && economy.energy >= cost + reserve) {
        const result = director.executeCommand({ type: "BUY_UPGRADE", team: this.team, upgradeId });
        if (result.ok) upgrades.push({ upgradeId, cost: result.cost });
      }
    };
    const queue = (laneId, unitType) => {
      const result = director.executeCommand({ type: "QUEUE_UNIT", team: this.team, laneId, unitType });
      if (result.ok) purchases.push({ laneId, unitType, cost: result.entry.paidCost });
      return result.ok;
    };

    // Economy is preferred while the match is still open; immediate defense is
    // preferred when a lane is actually under pressure.
    if (defense.threat > 70) buy("turret", 110);
    else if (economy.economyLevel < 2) buy("economy", 150);

    queue(defense.laneId, economy.energy >= UNIT_DEFINITIONS.frigate.cost + 110 && defense.threat > 35 ? "frigate" : "fighter");
    queue(push.laneId, economy.energy >= UNIT_DEFINITIONS.bomber.cost ? "bomber" : "scout");
    if (push.laneId !== defense.laneId && economy.energy >= UNIT_DEFINITIONS.fighter.cost) queue(push.laneId, "fighter");
    if (economy.energy >= UNIT_DEFINITIONS.scout.cost + 70) queue(defense.laneId, "scout");

    const spent = purchases.reduce((total, purchase) => total + purchase.cost, 0) + upgrades.reduce((total, upgrade) => total + upgrade.cost, 0);
    this.lastDecision = {
      cycle: director.cycle + 1,
      team: this.team,
      defenseLane: defense.laneId,
      pushLane: push.laneId,
      assessments,
      upgrades,
      purchases,
      spent,
      energyRemaining: Math.floor(economy.energy),
    };
    return { ok: true, decision: this.lastDecision };
  }
}
