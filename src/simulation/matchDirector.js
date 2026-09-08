import { CONFIG } from "../config.js";
import { LANE, MATCH_STATE, TEAM } from "../core/constants.js";
import { createBattleState, emitSimulationEvent } from "./battleState.js";
import { BattleSimulation } from "./battleSimulation.js";
import { CaptureSystem } from "./captureSystem.js";
import { CommandSystem } from "./commandSystem.js";
import { DeploymentDirector } from "./deploymentDirector.js";
import { EconomySystem } from "./economySystem.js";
import { AI_PROFILES, INVESTMENT_BIASES, OpponentAi } from "./opponentAi.js";
import { CLASSIC_LANES } from "../data/definitions.js";

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
    this.capture = new CaptureSystem({ captureRatePerSecond: this.config.balance.nodeCaptureRatePerSecond });
    this.commands = new CommandSystem();
    this.deployment = new DeploymentDirector({ config: this.config, laneIds: mapDefinition.lanes.map((lane) => lane.id) });
    this.events = [];
    this.ai = new OpponentAi({ profile: this.aiProfile, preferredLane: this.aiPreferredLane, investmentBias: this.aiInvestmentBias });
    this.lastAiDecision = null;
    this.aiReplannedForCycle = null;
    this.lastUpgradeActivations = [];
  }

  start() {
    this.state = MATCH_STATE.LIVE_MATCH;
    this.resumeState = null;
    this.activeMatchSeconds = 0;
    this.economy = new EconomySystem({ balance: this.config.balance });
    this.simulation = new BattleSimulation({ state: createBattleState({ map: this.mapDefinition }), economy: this.economy });
    this.deployment = new DeploymentDirector({ config: this.config, laneIds: this.mapDefinition.lanes.map((lane) => lane.id) });
    this.events = [{ type: "MATCH_STARTED", state: this.state }];
    this.ai = new OpponentAi({ profile: this.aiProfile, preferredLane: this.aiPreferredLane, investmentBias: this.aiInvestmentBias });
    this.lastAiDecision = null;
    this.aiReplannedForCycle = null;
    this.lastUpgradeActivations = [];

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
    this.activatePendingUpgrades();
    this.deployWaves();
    this.planAi();
    return true;
  }

  /** QA helper. Normal gameplay deploys only through the continuous timer. */
  forceDeployment() {
    if (this.state !== MATCH_STATE.LIVE_MATCH) return false;
    this.activatePendingUpgrades();
    this.deployWaves();
    this.planAi();
    return true;
  }

  deployWaves() {
    const result = this.deployment.deploy(this.simulation);
    this.events.push({ type: "WAVE_DEPLOYED", ...result });
    return result;
  }

  activatePendingUpgrades() {
    const fields = {
      economy: ["economy", "economyLevel"],
      weapons: ["weapons", "weaponLevel"],
      turret: ["turret", "turretLevel"],
      logistics: ["logistics", "logisticsLevel"],
    };
    this.lastUpgradeActivations = [];
    for (const activation of this.economy.activatePendingUpgrades()) {
      const headquarters = this.simulation.state.structures.get(activation.team === TEAM.PLAYER ? "player-hq" : "enemy-hq");
      for (const [upgradeId, [amountKey, levelKey]] of Object.entries(fields)) {
        if (!activation[amountKey]) continue;
        const event = {
          type: "upgrade_activated",
          team: activation.team,
          upgradeId,
          level: this.economy.get(activation.team)[levelKey],
          x: headquarters?.x,
          y: headquarters?.y,
        };
        this.lastUpgradeActivations.push(event);
        emitSimulationEvent(this.simulation.state, event);
      }
    }
    return this.lastUpgradeActivations;
  }

  planAi({ revise = false } = {}) {
    if (revise) {
      for (const laneId of this.mapDefinition.lanes.map((lane) => lane.id)) {
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
