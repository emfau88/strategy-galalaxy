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
      fireRateLevel: 0,
      salvoLevel: 0,
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

  weaponDamageMultiplier(team) {
    return 1 + this.get(team).weaponLevel * this.balance.weaponUpgradeDamageBonus;
  }

  fireIntervalMultiplier(team) {
    return 1 - this.get(team).fireRateLevel * this.balance.fireRateUpgradeIntervalReduction;
  }

  salvoBonus(team, unitType) {
    if (!unitType || unitType === "drone") return 0;
    return this.get(team).salvoLevel * this.balance.salvoUpgradeBonusProjectiles;
  }

  salvoDamageMultiplier(team, unitType) {
    if (!unitType || unitType === "drone") return 1;
    return 1 + this.get(team).salvoLevel * this.balance.salvoUpgradeDamageBonus;
  }

  recordFleetPurchase(team, amount) {
    this.get(team).spending.fleet += amount;
  }

  upgradeFields(upgradeId) {
    return {
      economy: ["economyLevel", "economyUpgradeBaseCost", "economyUpgradeCostGrowth", "economyUpgradeMaxLevel"],
      weapons: ["weaponLevel", "weaponUpgradeBaseCost", "weaponUpgradeCostGrowth", "weaponUpgradeMaxLevel"],
      fireRate: ["fireRateLevel", "fireRateUpgradeBaseCost", "fireRateUpgradeCostGrowth", "fireRateUpgradeMaxLevel"],
      salvo: ["salvoLevel", "salvoUpgradeBaseCost", "salvoUpgradeCostGrowth", "salvoUpgradeMaxLevel"],
      turret: ["turretLevel", "turretUpgradeBaseCost", "turretUpgradeCostGrowth", "turretUpgradeMaxLevel"],
    }[upgradeId] ?? null;
  }

  upgradeCost(team, upgradeId) {
    const economy = this.get(team);
    const fields = this.upgradeFields(upgradeId);
    if (!fields) return null;
    const [activeKey, baseCostKey, growthKey, maximumKey] = fields;
    const level = economy[activeKey];
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
    const [activeKey] = fields;
    economy[activeKey] += 1;
    economy.spending[upgradeId === "economy" ? "economy" : "research"] += cost;
    return { ok: true, cost, level: economy[activeKey], activatesImmediately: true };
  }
}
