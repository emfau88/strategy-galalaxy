import { ACTIVE_PHASES, MATCH_STATE } from "./constants.js";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Owns presentation and simulation time separately. Future gameplay must only
 * advance from onSimulationStep; renderers may always use frameTime.
 */
export class GameClock {
  constructor(timing) {
    this.timing = timing;
    this.reset();
  }

  reset() {
    this.frameTime = 0;
    this.phaseElapsed = 0;
    this.simulationTime = 0;
    this.battleElapsed = 0;
    this.accumulator = 0;
  }

  beginPhase() {
    this.phaseElapsed = 0;
    this.accumulator = 0;
  }

  advance(rawDeltaSeconds, matchState, { onPhaseTick, onSimulationStep } = {}) {
    const delta = clamp(Number.isFinite(rawDeltaSeconds) ? rawDeltaSeconds : 0, 0, this.timing.maxFrameDeltaSeconds);
    this.frameTime += delta;

    if (!ACTIVE_PHASES.has(matchState)) {
      return { delta, simulationSteps: 0 };
    }

    this.phaseElapsed += delta;
    onPhaseTick?.(delta, this.phaseElapsed);

    if (matchState !== MATCH_STATE.BATTLE) {
      return { delta, simulationSteps: 0 };
    }

    this.accumulator += delta;
    let simulationSteps = 0;
    while (this.accumulator >= this.timing.fixedStepSeconds && simulationSteps < this.timing.maxCatchUpSteps) {
      this.accumulator -= this.timing.fixedStepSeconds;
      this.simulationTime += this.timing.fixedStepSeconds;
      this.battleElapsed += this.timing.fixedStepSeconds;
      simulationSteps += 1;
      onSimulationStep?.(this.timing.fixedStepSeconds, this.simulationTime);
    }

    if (simulationSteps === this.timing.maxCatchUpSteps) {
      this.accumulator = 0;
    }

    return { delta, simulationSteps };
  }
}
