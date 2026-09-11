import { LANE, MATCH_STATE, TEAM } from "../core/constants.js";
import { STRUCTURE_DEFINITIONS, UNIT_DEFINITIONS, isMapFeatureEnabled } from "../data/definitions.js";

const opponentOf = (team) => (team === TEAM.PLAYER ? TEAM.ENEMY : TEAM.PLAYER);
export const AI_PROFILES = Object.freeze({ CADET: "cadet", TACTICIAN: "tactician", ADMIRAL: "admiral" });
export const INVESTMENT_BIASES = Object.freeze({ BALANCED: "balanced", FLEET: "fleet", ECONOMY: "economy", WEAPONS: "weapons" });

const unitStrength = (unit) => {
  const definition = UNIT_DEFINITIONS[unit.unitType];
  if (!definition || !unit.alive) return 0;
  return (definition.damage * 4 + definition.maxHp * 0.12 + definition.attackRange * 0.08) * (unit.hp / unit.maxHp);
};

const turretStrength = (state, team, laneId) => {
  const turret = [...state.structures.values()].find((structure) => structure.team === team && structure.laneId === laneId && structure.structureType === "turret");
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
    this.decisionNumber = 0;
    this.pushPlan = null;
    this.upgradePlan = null;
  }

  decisionIntervalSeconds(baseInterval) {
    return baseInterval * ({ [AI_PROFILES.CADET]: 1.45, [AI_PROFILES.TACTICIAN]: 1, [AI_PROFILES.ADMIRAL]: 0.78 }[this.profile] ?? 1);
  }

  laneTieBreak(left, right) {
    if (left.laneId === this.preferredLane && right.laneId !== this.preferredLane) return -1;
    if (right.laneId === this.preferredLane && left.laneId !== this.preferredLane) return 1;
    return left.laneId.localeCompare(right.laneId);
  }

  laneAssessment(director, laneId) {
    const { state } = director.simulation;
    const usesTurrets = isMapFeatureEnabled(state.map, "defensiveTurrets");
    const usesCaptureNodes = isMapFeatureEnabled(state.map, "captureNodes");
    const enemyTeam = opponentOf(this.team);
    const lane = state.lanes.get(laneId);
    const friendlyUnits = lane.unitIds.get(this.team).map((id) => state.units.get(id)).reduce((total, unit) => total + unitStrength(unit), 0);
    const enemyUnits = lane.unitIds.get(enemyTeam).map((id) => state.units.get(id)).reduce((total, unit) => total + unitStrength(unit), 0);
    const friendlyTurret = usesTurrets ? turretStrength(state, this.team, laneId) : 0;
    const enemyTurret = usesTurrets ? turretStrength(state, enemyTeam, laneId) : 0;
    const node = usesCaptureNodes ? [...state.nodes.values()].find((value) => value.laneId === laneId) : null;
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
    if (director.state !== MATCH_STATE.LIVE_MATCH || !director.simulation) return { ok: false, reason: "WRONG_PHASE" };
    this.decisionNumber += 1;
    const assessments = director.simulation.state.map.lanes.map((lane) => this.laneAssessment(director, lane.id));
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
    const deploy = (laneId, unitType) => {
      const result = director.executeCommand({ type: "DEPLOY_UNIT", team: this.team, laneId, unitType });
      if (result.ok) purchases.push({ laneId, unitType, cost: result.cost, spawnedIds: result.spawnedIds });
      return result.ok;
    };
    const finish = (mode, savingFor = null) => {
      const spent = purchases.reduce((total, purchase) => total + purchase.cost, 0) + upgrades.reduce((total, upgrade) => total + upgrade.cost, 0);
      this.lastDecision = {
        decisionNumber: this.decisionNumber,
        cycle: director.cycle,
        team: this.team,
        profile: this.profile,
        investmentBias: this.investmentBias,
        mode,
        savingFor,
        defenseLane: defense.laneId,
        pushLane: push.laneId,
        assessments,
        upgrades,
        purchases,
        spent,
        energyRemaining: Math.floor(economy.energy),
      };
      return { ok: true, decision: this.lastDecision };
    };

    const nextUpgrade = () => {
      const available = (upgradeId) => director.economy.upgradeCost(this.team, upgradeId) !== null;
      if (this.investmentBias === INVESTMENT_BIASES.ECONOMY) return available("economy") ? "economy" : null;
      if (this.investmentBias === INVESTMENT_BIASES.WEAPONS) {
        if (economy.weaponLevel < 1 && available("weapons")) return "weapons";
        if (economy.fireRateLevel < 1 && available("fireRate")) return "fireRate";
        if (economy.salvoLevel < 1 && available("salvo")) return "salvo";
        if (economy.shieldLevel < 1 && available("shield")) return "shield";
        return null;
      }
      if (economy.economyLevel < 1 && available("economy")) return "economy";
      if (defense.threat > 20 && economy.shieldLevel < 1 && available("shield")) return "shield";
      if (economy.weaponLevel < 1 && available("weapons")) return "weapons";
      if (economy.fireRateLevel < 1 && available("fireRate")) return "fireRate";
      if (economy.economyLevel < 2 && available("economy")) return "economy";
      if (economy.shieldLevel < 2 && available("shield")) return "shield";
      if (economy.salvoLevel < 1 && available("salvo")) return "salvo";
      return ["weapons", "shield", "fireRate", "economy"].find(available) ?? null;
    };

    // Every few live decisions the AI banks Energy for a two-part push. This is
    // deterministic, visible through a quiet saving window, and uses normal
    // player-facing deployment commands when the reserve is ready.
    const pushCadence = { [AI_PROFILES.CADET]: 15, [AI_PROFILES.TACTICIAN]: 10, [AI_PROFILES.ADMIRAL]: 8 }[this.profile];
    if (!this.pushPlan && !this.upgradePlan && this.decisionNumber > 1 && this.decisionNumber % pushCadence === 0) {
      const unitTypes = this.profile === AI_PROFILES.CADET ? ["bomber", "fighter"] : ["frigate", "fighter"];
      this.pushPlan = {
        laneId: push.laneId,
        unitTypes,
        targetEnergy: unitTypes.reduce((sum, unitType) => sum + UNIT_DEFINITIONS[unitType].cost, 0),
      };
    }
    if (this.pushPlan) {
      if (economy.energy + Number.EPSILON < this.pushPlan.targetEnergy) {
        return finish("saving", { type: "push", laneId: this.pushPlan.laneId, targetEnergy: this.pushPlan.targetEnergy });
      }
      const plan = this.pushPlan;
      for (const unitType of plan.unitTypes) deploy(plan.laneId, unitType);
      this.pushPlan = null;
      return finish("push");
    }

    // Research is a real plan, not a one-tick impulse: once selected the AI
    // visibly banks Energy and buys through the exact same command as the player.
    const upgradeCadence = this.profile === AI_PROFILES.ADMIRAL ? 7 : 9;
    if (!this.upgradePlan && this.profile !== AI_PROFILES.CADET && this.investmentBias !== INVESTMENT_BIASES.FLEET && this.decisionNumber % upgradeCadence === 0) {
      const upgradeId = defense.threat > 70 && isMapFeatureEnabled(director.mapDefinition, "defensiveTurrets")
        ? "turret"
        : nextUpgrade();
      const cost = upgradeId ? director.economy.upgradeCost(this.team, upgradeId) : null;
      if (upgradeId && cost !== null) this.upgradePlan = { upgradeId, targetEnergy: cost + 90 };
    }
    if (this.upgradePlan) {
      const cost = director.economy.upgradeCost(this.team, this.upgradePlan.upgradeId);
      if (cost === null) this.upgradePlan = null;
      else if (economy.energy + Number.EPSILON < cost + 90) {
        return finish("saving", { type: "upgrade", upgradeId: this.upgradePlan.upgradeId, targetEnergy: cost + 90 });
      } else {
        const plan = this.upgradePlan;
        this.upgradePlan = null;
        buy(plan.upgradeId, 90);
        return finish("investing");
      }
    }

    const defenseChoice = defense.enemyComposition.bomber > defense.friendlyComposition.fighter
      ? "fighter"
      : defense.enemyComposition.frigate > defense.friendlyComposition.bomber && economy.energy >= UNIT_DEFINITIONS.bomber.cost + 80
        ? "bomber"
        : economy.energy >= UNIT_DEFINITIONS.frigate.cost + 90 && defense.threat > 35 ? "frigate" : "fighter";
    const desiredLane = defense.threat > 20 ? defense.laneId : push.laneId;
    const desiredType = defense.threat > 20 ? defenseChoice
      : push.enemyComposition.frigate > push.friendlyComposition.bomber ? "bomber"
        : this.decisionNumber % 3 === 0 ? "scout" : "fighter";
    const availability = director.liveDeployment.availability({
      simulation: director.simulation,
      economy: director.economy,
      team: this.team,
      laneId: desiredLane,
      unitType: desiredType,
    });
    if (!availability.ok && availability.reason === "INSUFFICIENT_ENERGY") {
      return finish("saving", { type: "unit", laneId: desiredLane, unitType: desiredType, targetEnergy: UNIT_DEFINITIONS[desiredType].cost });
    }
    if (availability.ok) deploy(desiredLane, desiredType);
    else {
      const fallback = ["fighter", "scout", "bomber"].find((unitType) => director.liveDeployment.availability({
        simulation: director.simulation,
        economy: director.economy,
        team: this.team,
        laneId: desiredLane,
        unitType,
      }).ok);
      if (fallback) deploy(desiredLane, fallback);
    }
    return finish(upgrades.length ? "investing" : purchases.length ? "reacting" : "waiting");
  }
}
