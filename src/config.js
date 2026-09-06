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
    commandPhaseSeconds: 8,
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
  }),
  assets: Object.freeze({
    timeoutMs: 9000,
  }),
});
