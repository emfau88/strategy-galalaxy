import { TEAM } from "../core/constants.js";

const teams = Object.freeze([TEAM.PLAYER, TEAM.ENEMY]);

export class EconomySystem {
  constructor({ balance }) {
    this.balance = balance;
    this.teams = new Map(teams.map((team) => [team, {
      energy: balance.startingEnergy,
      economyLevel: 0,
      turretLevel: 0,
      pendingEconomyLevels: 0,
      pendingTurretLevels: 0,
    }]));
  }

  get(team) {
    const value = this.teams.get(team);
    if (!value) throw new Error(`Unknown team: ${team}`);
    return value;
  }

  escalationMultiplier(activeBattleSeconds) {
    return this.balance.escalation.reduce((current, stage) => (activeBattleSeconds >= stage.fromBattleSeconds ? stage.multiplier : current), 1);
  }

  controlledNodes(state, team) {
    return [...state.nodes.values()].filter((node) => node.ownerTeam === team).length;
  }

  incomePerSecond(state, team, activeBattleSeconds) {
    const economy = this.get(team);
    const baseIncome = this.balance.baseIncomePerSecond * (1 + economy.economyLevel * this.balance.economyUpgradeIncomeBonus);
    const nodeIncome = this.controlledNodes(state, team) * this.balance.nodeIncomePerSecond;
    return (baseIncome + nodeIncome) * this.escalationMultiplier(activeBattleSeconds);
  }

  advance(state, delta, activeBattleSeconds) {
    for (const team of teams) {
      const economy = this.get(team);
      economy.energy = Math.min(this.balance.energyCap, economy.energy + this.incomePerSecond(state, team, activeBattleSeconds) * delta);
    }
  }

  upgradeCost(team, upgradeId) {
    const economy = this.get(team);
    if (upgradeId === "economy") {
      const level = economy.economyLevel + economy.pendingEconomyLevels;
      return level >= this.balance.economyUpgradeMaxLevel ? null : Math.ceil(this.balance.economyUpgradeBaseCost * this.balance.economyUpgradeCostGrowth ** level);
    }
    if (upgradeId === "turret") {
      const level = economy.turretLevel + economy.pendingTurretLevels;
      return level >= this.balance.turretUpgradeMaxLevel ? null : Math.ceil(this.balance.turretUpgradeBaseCost * this.balance.turretUpgradeCostGrowth ** level);
    }
    return null;
  }

  buyUpgrade(team, upgradeId) {
    if (upgradeId !== "economy" && upgradeId !== "turret") return { ok: false, reason: "UNKNOWN_UPGRADE" };
    const cost = this.upgradeCost(team, upgradeId);
    if (cost === null) return { ok: false, reason: "MAX_LEVEL" };
    const economy = this.get(team);
    if (economy.energy < cost) return { ok: false, reason: "INSUFFICIENT_ENERGY" };
    economy.energy -= cost;
    if (upgradeId === "economy") economy.pendingEconomyLevels += 1;
    else economy.pendingTurretLevels += 1;
    const level = upgradeId === "economy"
      ? economy.economyLevel + economy.pendingEconomyLevels
      : economy.turretLevel + economy.pendingTurretLevels;
    return { ok: true, cost, level, activatesNextDeployment: true };
  }

  activatePendingUpgrades() {
    const activated = [];
    for (const team of teams) {
      const economy = this.get(team);
      if (economy.pendingEconomyLevels || economy.pendingTurretLevels) {
        activated.push({ team, economy: economy.pendingEconomyLevels, turret: economy.pendingTurretLevels });
      }
      economy.economyLevel += economy.pendingEconomyLevels;
      economy.turretLevel += economy.pendingTurretLevels;
      economy.pendingEconomyLevels = 0;
      economy.pendingTurretLevels = 0;
    }
    return activated;
  }
}
