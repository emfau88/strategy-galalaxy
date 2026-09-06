export const CONFIG = Object.freeze({
  app: Object.freeze({
    title: "Strategy Galalaxy",
    designWidth: 420,
    designHeight: 760,
  }),
  viewport: Object.freeze({
    maxDevicePixelRatio: 2,
    coarsePointerPixelRatio: 1.5,
  }),
  timing: Object.freeze({
    fixedStepSeconds: 1 / 60,
    maxFrameDeltaSeconds: 0.1,
    maxCatchUpSteps: 6,
    commandPhaseSeconds: null,
    battlePhaseSeconds: 22,
  }),
  caps: Object.freeze({
    unitsPerLaneTeam: 40,
    projectiles: 180,
    particles: 240,
  }),
  balance: Object.freeze({
    startingEnergy: 300,
    baseIncomePerSecond: 20,
    nodeIncomePerSecond: 10,
    baseWaveScoutsPerLane: 2,
    nodeCaptureRatePerSecond: 50,
    economyUpgradeBaseCost: 240,
    economyUpgradeCostGrowth: 1.75,
    economyUpgradeIncomeBonus: 0.2,
    turretUpgradeBaseCost: 180,
    turretUpgradeCostGrowth: 1.65,
    turretUpgradeDamageBonus: 0.2,
    escalation: Object.freeze([
      Object.freeze({ fromBattleSeconds: 0, multiplier: 1 }),
      Object.freeze({ fromBattleSeconds: 120, multiplier: 1.5 }),
      Object.freeze({ fromBattleSeconds: 240, multiplier: 2 }),
      Object.freeze({ fromBattleSeconds: 360, multiplier: 3 }),
    ]),
  }),
  assets: Object.freeze({
    timeoutMs: 9000,
  }),
});
