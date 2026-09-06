import { TEAM } from "../core/constants.js";

const teams = Object.freeze([TEAM.PLAYER, TEAM.ENEMY]);

export class EconomySystem {
  constructor({ balance }) {
    this.balance = balance;
    this.teams = new Map(teams.map((team) => [team, { energy: balance.startingEnergy, economyLevel: 0, turretLevel: 0 }]));
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
    for (const team of teams) this.get(team).energy += this.incomePerSecond(state, team, activeBattleSeconds) * delta;
  }

  upgradeCost(team, upgradeId) {
    const economy = this.get(team);
    if (upgradeId === "economy") return Math.ceil(this.balance.economyUpgradeBaseCost * this.balance.economyUpgradeCostGrowth ** economy.economyLevel);
    if (upgradeId === "turret") return Math.ceil(this.balance.turretUpgradeBaseCost * this.balance.turretUpgradeCostGrowth ** economy.turretLevel);
    return null;
  }

  buyUpgrade(team, upgradeId) {
    const cost = this.upgradeCost(team, upgradeId);
    if (cost === null) return { ok: false, reason: "UNKNOWN_UPGRADE" };
    const economy = this.get(team);
    if (economy.energy < cost) return { ok: false, reason: "INSUFFICIENT_ENERGY" };
    economy.energy -= cost;
    if (upgradeId === "economy") economy.economyLevel += 1;
    else economy.turretLevel += 1;
    return { ok: true, cost, level: upgradeId === "economy" ? economy.economyLevel : economy.turretLevel };
  }
}
