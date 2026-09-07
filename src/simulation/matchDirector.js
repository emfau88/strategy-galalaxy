import { CONFIG } from "../config.js";
import { LANE, MATCH_STATE, TEAM } from "../core/constants.js";
import { createBattleState } from "./battleState.js";
import { BattleSimulation } from "./battleSimulation.js";
import { CaptureSystem } from "./captureSystem.js";
import { CommandSystem } from "./commandSystem.js";
import { DeploymentDirector } from "./deploymentDirector.js";
import { EconomySystem } from "./economySystem.js";
import { AI_PROFILES, OpponentAi } from "./opponentAi.js";

/** Coordinates a continuous match; specialized systems own combat, economy, capture, and deployment. */
export class MatchDirector {
  constructor({ config = CONFIG, aiProfile = AI_PROFILES.TACTICIAN, aiPreferredLane = LANE.LEFT } = {}) {
    this.config = config;
    this.aiProfile = aiProfile;
    this.aiPreferredLane = aiPreferredLane;
    this.state = MATCH_STATE.TITLE;
    this.resumeState = null;
    this.activeMatchSeconds = 0;
    this.simulation = null;
    this.economy = new EconomySystem({ balance: config.balance });
    this.capture = new CaptureSystem({ captureRatePerSecond: config.balance.nodeCaptureRatePerSecond });
    this.commands = new CommandSystem();
    this.deployment = new DeploymentDirector({ config });
    this.events = [];
    this.ai = new OpponentAi({ profile: this.aiProfile, preferredLane: this.aiPreferredLane });
    this.lastAiDecision = null;
    this.aiReplannedForCycle = null;
  }

  start() {
    this.state = MATCH_STATE.LIVE_MATCH;
    this.resumeState = null;
    this.activeMatchSeconds = 0;
    this.economy = new EconomySystem({ balance: this.config.balance });
    this.simulation = new BattleSimulation({ state: createBattleState(), economy: this.economy });
    this.deployment = new DeploymentDirector({ config: this.config });
    this.events = [{ type: "MATCH_STARTED", state: this.state }];
    this.ai = new OpponentAi({ profile: this.aiProfile, preferredLane: this.aiPreferredLane });
    this.lastAiDecision = null;
    this.aiReplannedForCycle = null;

    // Start with symmetric free pressure; the first paid planning window begins immediately.
    this.deployWaves();
    this.planAi();
    return true;
  }

  executeCommand(command) {
    return this.commands.execute(this, command);
  }

  advanceLive(step) {
    if (this.state !== MATCH_STATE.LIVE_MATCH) return false;
    this.economy.advance(this.simulation.state, step, this.activeMatchSeconds);
    this.simulation.step(step);
    this.capture.advance(this.simulation.state, step);
    this.activeMatchSeconds += step;

    if (this.simulation.state.terminalTeam) {
      this.state = this.simulation.state.terminalTeam === TEAM.PLAYER
        ? MATCH_STATE.VICTORY
        : this.simulation.state.terminalTeam === TEAM.ENEMY ? MATCH_STATE.DEFEAT : MATCH_STATE.DRAW;
      this.events.push({ type: "MATCH_ENDED", state: this.state, cycle: this.cycle });
      return true;
    }

    if (!this.deployment.advance(step)) {
      this.maybeReplanAi();
      return false;
    }
    this.economy.activatePendingUpgrades();
    this.deployWaves();
    this.planAi();
    return true;
  }

  /** QA helper. Normal gameplay deploys only through the continuous timer. */
  forceDeployment() {
    if (this.state !== MATCH_STATE.LIVE_MATCH) return false;
    this.economy.activatePendingUpgrades();
    this.deployWaves();
    this.planAi();
    return true;
  }

  deployWaves() {
    const result = this.deployment.deploy(this.simulation);
    this.events.push({ type: "WAVE_DEPLOYED", ...result });
    return result;
  }

  planAi({ revise = false } = {}) {
    if (revise) {
      for (const laneId of [LANE.LEFT, LANE.RIGHT]) {
        for (const entry of [...this.queuedWaves.get(TEAM.ENEMY).get(laneId)].reverse()) {
          this.executeCommand({ type: "REMOVE_QUEUED_UNIT", team: TEAM.ENEMY, laneId, queueEntryId: entry.id });
        }
      }
    }
    const result = this.ai.plan(this);
    if (result.ok) {
      this.lastAiDecision = result.decision;
      this.events.push({ type: "AI_PLANNED", decision: result.decision });
    }
    return result;
  }

  maybeReplanAi() {
    if (this.queueLocked || this.aiReplannedForCycle === this.cycle) return false;
    if (this.phaseRemaining > this.config.timing.aiReplanSecondsBeforeDeployment) return false;
    const result = this.planAi({ revise: true });
    if (!result.ok) return false;
    this.aiReplannedForCycle = this.cycle;
    this.events.push({ type: "AI_REPLANNED", cycle: this.cycle, decision: result.decision });
    return true;
  }

  setAiProfile(profile) {
    if (!Object.values(AI_PROFILES).includes(profile) || this.state === MATCH_STATE.LIVE_MATCH) return false;
    this.aiProfile = profile;
    this.ai = new OpponentAi({ profile, preferredLane: this.aiPreferredLane });
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

  get queuedWaves() { return this.deployment.queuedWaves; }
  get baseWaveBacklog() { return this.deployment.baseWaveBacklog; }
  get nextQueueSequence() { return this.deployment.nextQueueSequence; }
  set nextQueueSequence(value) { this.deployment.nextQueueSequence = value; }
  get cycle() { return this.deployment.cycleNumber; }
  get lastDeploymentAt() { return this.deployment.lastDeploymentAt; }
  lastDeploymentAtFor(team, laneId) { return this.deployment.lastDeploymentAtByTeamLane.get(team)?.get(laneId) ?? null; }
  get phaseRemaining() { return this.deployment.timeUntilDeployment; }
  get queueLocked() { return this.deployment.locked; }
  get activeBattleSeconds() { return this.activeMatchSeconds; }
}
