import { CONFIG } from "../config.js";
import { LANE, MATCH_STATE, TEAM } from "../core/constants.js";
import { createBattleState } from "./battleState.js";
import { BattleSimulation } from "./battleSimulation.js";
import { CaptureSystem } from "./captureSystem.js";
import { CommandSystem } from "./commandSystem.js";
import { DeploymentDirector } from "./deploymentDirector.js";
import { EconomySystem } from "./economySystem.js";
import { LiveDeploymentSystem } from "./liveDeploymentSystem.js";
import { AI_PROFILES, INVESTMENT_BIASES, OpponentAi } from "./opponentAi.js";
import { CLASSIC_LANES, isMapFeatureEnabled } from "../data/definitions.js";

/** Coordinates a continuous match; specialized systems own combat, economy, capture, and deployment. */
export class MatchDirector {
  constructor({ config = CONFIG, mapDefinition = CLASSIC_LANES, aiProfile = AI_PROFILES.TACTICIAN, aiPreferredLane = null, aiInvestmentBias = INVESTMENT_BIASES.BALANCED } = {}) {
    this.config = { ...config, balance: { ...config.balance, ...(mapDefinition.balanceOverrides ?? {}) } };
    this.mapDefinition = mapDefinition;
    this.aiProfile = aiProfile;
    this.aiPreferredLane = aiPreferredLane ?? mapDefinition.lanes[0].id;
    this.aiInvestmentBias = aiInvestmentBias;
    this.state = MATCH_STATE.TITLE;
    this.resumeState = null;
    this.activeMatchSeconds = 0;
    this.simulation = null;
    this.economy = new EconomySystem({ balance: this.config.balance });
    this.capture = isMapFeatureEnabled(mapDefinition, "captureNodes")
      ? new CaptureSystem({ captureRatePerSecond: this.config.balance.nodeCaptureRatePerSecond })
      : null;
    this.commands = new CommandSystem();
    this.deployment = new DeploymentDirector({ config: this.config, laneIds: mapDefinition.lanes.map((lane) => lane.id) });
    this.liveDeployment = new LiveDeploymentSystem({ config: this.config });
    this.events = [];
    this.ai = new OpponentAi({ profile: this.aiProfile, preferredLane: this.aiPreferredLane, investmentBias: this.aiInvestmentBias });
    this.lastAiDecision = null;
    this.aiDecisionRemaining = 0;
  }

  start() {
    this.state = MATCH_STATE.LIVE_MATCH;
    this.resumeState = null;
    this.activeMatchSeconds = 0;
    this.economy = new EconomySystem({ balance: this.config.balance });
    this.simulation = new BattleSimulation({ state: createBattleState({ map: this.mapDefinition }), economy: this.economy, config: this.config });
    this.deployment = new DeploymentDirector({ config: this.config, laneIds: this.mapDefinition.lanes.map((lane) => lane.id) });
    this.liveDeployment = new LiveDeploymentSystem({ config: this.config });
    this.events = [{ type: "MATCH_STARTED", state: this.state }];
    this.ai = new OpponentAi({ profile: this.aiProfile, preferredLane: this.aiPreferredLane, investmentBias: this.aiInvestmentBias });
    this.lastAiDecision = null;
    this.aiDecisionRemaining = 0;

    // Free pressure starts immediately; paid commands remain independent of this cadence.
    this.deployWaves();
    this.planAi();
    this.aiDecisionRemaining = this.ai.decisionIntervalSeconds(this.config.timing.aiDecisionIntervalSeconds);
    return true;
  }

  executeCommand(command) {
    return this.commands.execute(this, command);
  }

  advanceLive(step) {
    if (this.state !== MATCH_STATE.LIVE_MATCH) return false;
    this.economy.advance(this.simulation.state, step, this.activeMatchSeconds);
    this.liveDeployment.advance(step);
    this.simulation.step(step);
    this.capture?.advance(this.simulation.state, step);
    this.activeMatchSeconds += step;

    if (this.simulation.state.terminalTeam) {
      this.state = this.simulation.state.terminalTeam === TEAM.PLAYER
        ? MATCH_STATE.VICTORY
        : this.simulation.state.terminalTeam === TEAM.ENEMY ? MATCH_STATE.DEFEAT : MATCH_STATE.DRAW;
      this.events.push({ type: "MATCH_ENDED", state: this.state, cycle: this.cycle });
      return true;
    }

    this.aiDecisionRemaining -= step;
    let liveDecision = false;
    if (this.aiDecisionRemaining <= Number.EPSILON) {
      this.planAi();
      this.aiDecisionRemaining += this.ai.decisionIntervalSeconds(this.config.timing.aiDecisionIntervalSeconds);
      liveDecision = true;
    }

    if (!this.deployment.advance(step)) return liveDecision;
    this.deployWaves();
    return true;
  }

  /** QA helper. Normal automatic waves deploy only through the continuous timer. */
  forceWave() {
    if (this.state !== MATCH_STATE.LIVE_MATCH) return false;
    this.deployWaves();
    return true;
  }

  deployWaves() {
    const result = this.deployment.deploy(this.simulation);
    this.events.push({ type: "WAVE_DEPLOYED", ...result });
    return result;
  }

  planAi() {
    const result = this.ai.plan(this);
    if (result.ok) {
      this.lastAiDecision = result.decision;
      this.events.push({ type: "AI_PLANNED", decision: result.decision });
    }
    return result;
  }

  setAiProfile(profile) {
    if (!Object.values(AI_PROFILES).includes(profile) || this.state === MATCH_STATE.LIVE_MATCH) return false;
    this.aiProfile = profile;
    this.ai = new OpponentAi({ profile, preferredLane: this.aiPreferredLane, investmentBias: this.aiInvestmentBias });
    return true;
  }

  pause() {
    if (this.state !== MATCH_STATE.LIVE_MATCH) return false;
    this.resumeState = this.state;
    this.state = MATCH_STATE.PAUSED;
    this.events.push({ type: "MATCH_PAUSED" });
    return true;
  }

  resume() {
    if (this.state !== MATCH_STATE.PAUSED || this.resumeState !== MATCH_STATE.LIVE_MATCH) return false;
    this.state = this.resumeState;
    this.resumeState = null;
    this.events.push({ type: "MATCH_RESUMED" });
    return true;
  }

  restart() {
    if (![MATCH_STATE.VICTORY, MATCH_STATE.DEFEAT, MATCH_STATE.DRAW].includes(this.state)) return false;
    return this.start();
  }

  returnToTitle() {
    if (this.state === MATCH_STATE.TITLE) return false;
    this.state = MATCH_STATE.TITLE;
    this.resumeState = null;
    this.simulation = null;
    this.activeMatchSeconds = 0;
    this.events.push({ type: "RETURNED_TO_TITLE" });
    return true;
  }

  get baseWaveBacklog() { return this.deployment.baseWaveBacklog; }
  get cycle() { return this.deployment.cycleNumber; }
  get lastDeploymentAt() { return this.deployment.lastDeploymentAt; }
  lastDeploymentAtFor(team, laneId) {
    const waveAt = this.deployment.lastDeploymentAtByTeamLane.get(team)?.get(laneId);
    const liveAt = this.liveDeployment.lastDeploymentAtFor(team, laneId);
    if (waveAt === null || waveAt === undefined) return liveAt;
    if (liveAt === null || liveAt === undefined) return waveAt;
    return Math.max(waveAt, liveAt);
  }
  get phaseRemaining() { return this.deployment.timeUntilDeployment; }
  get activeBattleSeconds() { return this.activeMatchSeconds; }
}
