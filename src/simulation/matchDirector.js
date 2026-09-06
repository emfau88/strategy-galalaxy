import { CONFIG } from "../config.js";
import { LANE, MATCH_STATE, TEAM } from "../core/constants.js";
import { createBattleState } from "./battleState.js";
import { BattleSimulation } from "./battleSimulation.js";

const laneIds = Object.freeze([LANE.LEFT, LANE.RIGHT]);
const teams = Object.freeze([TEAM.PLAYER, TEAM.ENEMY]);
const emptyTeamLanes = () => new Map(teams.map((team) => [team, new Map(laneIds.map((laneId) => [laneId, []]))]));

/** Owns match phases and deployment boundaries; BattleSimulation owns combat. */
export class MatchDirector {
  constructor({ config = CONFIG } = {}) {
    this.config = config;
    this.state = MATCH_STATE.TITLE;
    this.resumeState = null;
    this.cycle = 0;
    this.phaseElapsed = 0;
    this.activeBattleSeconds = 0;
    this.simulation = null;
    this.queuedWaves = emptyTeamLanes();
    this.baseWaveBacklog = emptyTeamLanes();
    this.events = [];
  }

  start() {
    this.state = MATCH_STATE.COMMAND;
    this.resumeState = null;
    this.cycle = 0;
    this.phaseElapsed = 0;
    this.activeBattleSeconds = 0;
    this.simulation = new BattleSimulation({ state: createBattleState() });
    this.queuedWaves = emptyTeamLanes();
    this.baseWaveBacklog = emptyTeamLanes();
    this.events = [{ type: "PHASE_CHANGED", state: this.state }];
    return true;
  }

  advanceCommand(delta) {
    if (this.state !== MATCH_STATE.COMMAND) return false;
    this.phaseElapsed += delta;
    if (this.phaseElapsed + Number.EPSILON < this.config.timing.commandPhaseSeconds) return false;
    this.deployWaves();
    return true;
  }

  advanceBattle(step) {
    if (this.state !== MATCH_STATE.BATTLE) return false;
    this.simulation.step(step);
    this.phaseElapsed += step;
    this.activeBattleSeconds += step;
    if (this.simulation.state.terminalTeam) {
      this.state = this.simulation.state.terminalTeam === TEAM.PLAYER ? MATCH_STATE.VICTORY : MATCH_STATE.DEFEAT;
      this.events.push({ type: "MATCH_ENDED", state: this.state, cycle: this.cycle });
      return true;
    }
    if (this.phaseElapsed + Number.EPSILON < this.config.timing.battlePhaseSeconds) return false;
    this.enterCommand();
    return true;
  }

  deployNow() {
    if (this.state !== MATCH_STATE.COMMAND) return false;
    this.deployWaves();
    return true;
  }

  deployWaves() {
    const deployment = [];
    for (const team of teams) {
      for (const laneId of laneIds) {
        const pendingBase = this.baseWaveBacklog.get(team).get(laneId);
        const baseEntries = [...pendingBase, ...Array.from({ length: this.config.balance.baseWaveScoutsPerLane }, () => "scout")];
        const paidEntries = this.queuedWaves.get(team).get(laneId);
        const active = this.simulation.state.lanes.get(laneId).unitIds.get(team).length;
        const available = Math.max(0, this.config.caps.unitsPerLaneTeam - active);
        const acceptedBase = baseEntries.slice(0, available);
        const acceptedPaid = paidEntries.slice(0, Math.max(0, available - acceptedBase.length));
        this.baseWaveBacklog.get(team).set(laneId, baseEntries.slice(acceptedBase.length));
        this.queuedWaves.get(team).set(laneId, paidEntries.slice(acceptedPaid.length));
        deployment.push({ team, laneId, unitTypes: [...acceptedBase, ...acceptedPaid] });
      }
    }
    this.cycle += 1;
    for (const entry of deployment) this.simulation.spawnFormation(entry.team, entry.laneId, entry.unitTypes, this.cycle);
    this.state = MATCH_STATE.BATTLE;
    this.phaseElapsed = 0;
    this.events.push({ type: "WAVE_DEPLOYED", cycle: this.cycle, deployment });
    this.events.push({ type: "PHASE_CHANGED", state: this.state });
  }

  enterCommand() {
    this.state = MATCH_STATE.COMMAND;
    this.phaseElapsed = 0;
    this.events.push({ type: "PHASE_CHANGED", state: this.state });
  }

  pause() {
    if (this.state !== MATCH_STATE.COMMAND && this.state !== MATCH_STATE.BATTLE) return false;
    this.resumeState = this.state;
    this.state = MATCH_STATE.PAUSED;
    this.events.push({ type: "PHASE_CHANGED", state: this.state });
    return true;
  }

  resume() {
    if (this.state !== MATCH_STATE.PAUSED || !this.resumeState) return false;
    this.state = this.resumeState;
    this.resumeState = null;
    this.events.push({ type: "PHASE_CHANGED", state: this.state });
    return true;
  }

  restart() {
    if (this.state !== MATCH_STATE.VICTORY && this.state !== MATCH_STATE.DEFEAT) return false;
    return this.start();
  }

  get phaseRemaining() {
    const activeState = this.state === MATCH_STATE.PAUSED ? this.resumeState : this.state;
    const duration = activeState === MATCH_STATE.COMMAND ? this.config.timing.commandPhaseSeconds : this.config.timing.battlePhaseSeconds;
    return Math.max(0, duration - this.phaseElapsed);
  }
}
