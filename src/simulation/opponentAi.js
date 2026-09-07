import { LANE, MATCH_STATE, TEAM } from "../core/constants.js";
import { STRUCTURE_DEFINITIONS, UNIT_DEFINITIONS } from "../data/definitions.js";

const lanes = Object.freeze([LANE.LEFT, LANE.RIGHT]);
const opponentOf = (team) => (team === TEAM.PLAYER ? TEAM.ENEMY : TEAM.PLAYER);
export const AI_PROFILES = Object.freeze({ CADET: "cadet", TACTICIAN: "tactician", ADMIRAL: "admiral" });
export const INVESTMENT_BIASES = Object.freeze({ BALANCED: "balanced", FLEET: "fleet", ECONOMY: "economy", WEAPONS: "weapons", LOGISTICS: "logistics" });

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
  constructor({ team = TEAM.ENEMY, preferredLane = LANE.LEFT, profile = AI_PROFILES.TACTICIAN, investmentBias = INVESTMENT_BIASES.BALANCED } = {}) {
    this.team = team;
    this.preferredLane = preferredLane;
    this.profile = Object.values(AI_PROFILES).includes(profile) ? profile : AI_PROFILES.TACTICIAN;
    this.investmentBias = Object.values(INVESTMENT_BIASES).includes(investmentBias) ? investmentBias : INVESTMENT_BIASES.BALANCED;
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
    const composition = (ids) => ids.map((id) => state.units.get(id)).filter((unit) => unit?.alive).reduce((counts, unit) => {
      counts[unit.unitType] = (counts[unit.unitType] ?? 0) + 1;
      return counts;
    }, { drone: 0, scout: 0, fighter: 0, bomber: 0, frigate: 0 });
    const friendlyComposition = composition(lane.unitIds.get(this.team));
    const enemyComposition = composition(lane.unitIds.get(enemyTeam));
    const nodePressure = node?.ownerTeam === enemyTeam ? 42 : node?.ownerTeam === this.team ? -18 : 0;
    return {
      laneId,
      friendlyUnits: Math.round(friendlyUnits),
      enemyUnits: Math.round(enemyUnits),
      friendlyTurret: Math.round(friendlyTurret),
      enemyTurret: Math.round(enemyTurret),
      nodeOwner: node?.ownerTeam ?? null,
      friendlyComposition,
      enemyComposition,
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
    const purchaseLimit = this.profile === AI_PROFILES.CADET ? 2 : director.economy.reinforcementLimit(this.team);
    const buy = (upgradeId, reserve) => {
      const cost = director.economy.upgradeCost(this.team, upgradeId);
      if (cost !== null && economy.energy >= cost + reserve) {
        const result = director.executeCommand({ type: "BUY_UPGRADE", team: this.team, upgradeId });
        if (result.ok) upgrades.push({ upgradeId, cost: result.cost });
      }
    };
    const queue = (laneId, unitType) => {
      if (purchases.length >= purchaseLimit) return false;
      const result = director.executeCommand({ type: "QUEUE_UNIT", team: this.team, laneId, unitType });
      if (result.ok) purchases.push({ laneId, unitType, cost: result.entry.paidCost });
      return result.ok;
    };

    // Economy is preferred while the match is still open; immediate defense is
    // preferred when a lane is actually under pressure.
    if (this.profile !== AI_PROFILES.CADET && this.investmentBias !== INVESTMENT_BIASES.FLEET) {
      if (defense.threat > 70) buy("turret", 110);
      else if (this.investmentBias === INVESTMENT_BIASES.ECONOMY) buy("economy", 120);
      else if (this.investmentBias === INVESTMENT_BIASES.WEAPONS) buy("weapons", 130);
      else if (this.investmentBias === INVESTMENT_BIASES.LOGISTICS) buy("logistics", 150);
      else if (this.profile === AI_PROFILES.ADMIRAL && economy.weaponLevel < 2) buy("weapons", 120);
      else if (economy.economyLevel < 2) buy("economy", 150);
      else if (economy.logisticsLevel < 1) buy("logistics", 160);
    }

    const defenseChoice = defense.enemyComposition.bomber > defense.friendlyComposition.fighter
      ? "fighter"
      : defense.enemyComposition.frigate > defense.friendlyComposition.bomber && economy.energy >= UNIT_DEFINITIONS.bomber.cost + 80
        ? "bomber"
        : economy.energy >= UNIT_DEFINITIONS.frigate.cost + 90 && defense.threat > 35 ? "frigate" : "fighter";
    const pushChoice = push.nodeOwner === opponentOf(this.team) && push.friendlyComposition.scout === 0
      ? "scout"
      : economy.energy >= UNIT_DEFINITIONS.bomber.cost ? "bomber" : "scout";
    queue(defense.laneId, defenseChoice);
    queue(push.laneId, pushChoice);
    if (push.laneId !== defense.laneId && economy.energy >= UNIT_DEFINITIONS.fighter.cost) queue(push.laneId, "fighter");
    if (economy.energy >= UNIT_DEFINITIONS.scout.cost + 70) queue(this.profile === AI_PROFILES.ADMIRAL ? push.laneId : defense.laneId, this.profile === AI_PROFILES.ADMIRAL ? "bomber" : "scout");

    const spent = purchases.reduce((total, purchase) => total + purchase.cost, 0) + upgrades.reduce((total, upgrade) => total + upgrade.cost, 0);
    this.lastDecision = {
      cycle: director.cycle + 1,
      team: this.team,
      profile: this.profile,
      investmentBias: this.investmentBias,
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
