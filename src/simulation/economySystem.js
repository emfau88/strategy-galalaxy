import { TEAM } from "../core/constants.js";

const teams = Object.freeze([TEAM.PLAYER, TEAM.ENEMY]);

export class EconomySystem {
  constructor({ balance }) {
    this.balance = balance;
    this.teams = new Map(teams.map((team) => [team, {
      energy: balance.startingEnergy,
      economyLevel: 0,
      turretLevel: 0,
      weaponLevel: 0,
      logisticsLevel: 0,
      pendingEconomyLevels: 0,
      pendingTurretLevels: 0,
      pendingWeaponLevels: 0,
      pendingLogisticsLevels: 0,
      spending: { fleet: 0, economy: 0, research: 0 },
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

  reinforcementLimit(team) {
    return this.balance.maxPurchasedReinforcementsPerDeployment
      + this.get(team).logisticsLevel * this.balance.logisticsUpgradeSlotBonus;
  }

  weaponDamageMultiplier(team) {
    return 1 + this.get(team).weaponLevel * this.balance.weaponUpgradeDamageBonus;
  }

  recordFleetPurchase(team, amount) {
    this.get(team).spending.fleet += amount;
  }

  recordFleetRefund(team, amount) {
    this.get(team).spending.fleet = Math.max(0, this.get(team).spending.fleet - amount);
  }

  upgradeFields(upgradeId) {
    return {
      economy: ["economyLevel", "pendingEconomyLevels", "economyUpgradeBaseCost", "economyUpgradeCostGrowth", "economyUpgradeMaxLevel"],
      weapons: ["weaponLevel", "pendingWeaponLevels", "weaponUpgradeBaseCost", "weaponUpgradeCostGrowth", "weaponUpgradeMaxLevel"],
      turret: ["turretLevel", "pendingTurretLevels", "turretUpgradeBaseCost", "turretUpgradeCostGrowth", "turretUpgradeMaxLevel"],
      logistics: ["logisticsLevel", "pendingLogisticsLevels", "logisticsUpgradeBaseCost", "logisticsUpgradeCostGrowth", "logisticsUpgradeMaxLevel"],
    }[upgradeId] ?? null;
  }

  upgradeCost(team, upgradeId) {
    const economy = this.get(team);
    const fields = this.upgradeFields(upgradeId);
    if (!fields) return null;
    const [activeKey, pendingKey, baseCostKey, growthKey, maximumKey] = fields;
    const level = economy[activeKey] + economy[pendingKey];
    return level >= this.balance[maximumKey] ? null : Math.ceil(this.balance[baseCostKey] * this.balance[growthKey] ** level);
  }

  buyUpgrade(team, upgradeId) {
    const fields = this.upgradeFields(upgradeId);
    if (!fields) return { ok: false, reason: "UNKNOWN_UPGRADE" };
    const cost = this.upgradeCost(team, upgradeId);
    if (cost === null) return { ok: false, reason: "MAX_LEVEL" };
    const economy = this.get(team);
    if (economy.energy < cost) return { ok: false, reason: "INSUFFICIENT_ENERGY" };
    economy.energy -= cost;
    const [activeKey, pendingKey] = fields;
    economy[pendingKey] += 1;
    economy.spending[upgradeId === "economy" ? "economy" : "research"] += cost;
    const level = economy[activeKey] + economy[pendingKey];
    return { ok: true, cost, level, activatesNextDeployment: true };
  }

  activatePendingUpgrades() {
    const activated = [];
    for (const team of teams) {
      const economy = this.get(team);
      if (economy.pendingEconomyLevels || economy.pendingTurretLevels || economy.pendingWeaponLevels || economy.pendingLogisticsLevels) {
        activated.push({ team, economy: economy.pendingEconomyLevels, turret: economy.pendingTurretLevels, weapons: economy.pendingWeaponLevels, logistics: economy.pendingLogisticsLevels });
      }
      economy.economyLevel += economy.pendingEconomyLevels;
      economy.turretLevel += economy.pendingTurretLevels;
      economy.weaponLevel += economy.pendingWeaponLevels;
      economy.logisticsLevel += economy.pendingLogisticsLevels;
      economy.pendingEconomyLevels = 0;
      economy.pendingTurretLevels = 0;
      economy.pendingWeaponLevels = 0;
      economy.pendingLogisticsLevels = 0;
    }
    return activated;
  }
}
