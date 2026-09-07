import { LANE, TEAM } from "../core/constants.js";

const laneIds = Object.freeze([LANE.LEFT, LANE.RIGHT]);
const teams = Object.freeze([TEAM.PLAYER, TEAM.ENEMY]);
const emptyTeamLanes = () => new Map(teams.map((team) => [team, new Map(laneIds.map((laneId) => [laneId, []]))]));

/** Owns the continuous deployment cadence and both teams' future waves. */
export class DeploymentDirector {
  constructor({ config }) {
    this.config = config;
    this.reset();
  }

  reset() {
    this.cycleNumber = 0;
    this.timeUntilDeployment = this.config.timing.deploymentIntervalSeconds;
    this.lastDeploymentAt = null;
    this.queuedWaves = emptyTeamLanes();
    this.baseWaveBacklog = emptyTeamLanes();
    this.nextQueueSequence = 1;
  }

  queuesFor(team) {
    return this.queuedWaves.get(team);
  }

  get locked() {
    return this.timeUntilDeployment <= this.config.timing.deploymentLockSeconds + Number.EPSILON;
  }

  purchasedCount(team) {
    return [...this.queuesFor(team).values()].reduce((sum, entries) => sum + entries.length, 0);
  }

  advance(step) {
    this.timeUntilDeployment = Math.max(0, this.timeUntilDeployment - step);
    return this.timeUntilDeployment <= Number.EPSILON;
  }

  deploy(simulation) {
    const deployment = [];
    for (const team of teams) {
      for (const laneId of laneIds) {
        const pendingBase = this.baseWaveBacklog.get(team).get(laneId);
        const baseEntries = [...pendingBase, ...Array.from({ length: this.config.balance.baseWaveScoutsPerLane }, () => "scout")];
        const paidEntries = this.queuesFor(team).get(laneId);
        const active = simulation.state.lanes.get(laneId).unitIds.get(team).length;
        const available = Math.max(0, this.config.caps.unitsPerLaneTeam - active);
        const acceptedBase = baseEntries.slice(0, available);
        const acceptedPaid = paidEntries.slice(0, Math.max(0, available - acceptedBase.length));
        this.baseWaveBacklog.get(team).set(laneId, baseEntries.slice(acceptedBase.length));
        this.queuesFor(team).set(laneId, paidEntries.slice(acceptedPaid.length));
        deployment.push({ team, laneId, unitTypes: [...acceptedBase, ...acceptedPaid.map((entry) => entry.unitType)] });
      }
    }

    this.cycleNumber += 1;
    for (const entry of deployment) simulation.spawnFormation(entry.team, entry.laneId, entry.unitTypes, this.cycleNumber);
    this.lastDeploymentAt = simulation.state.time;
    this.timeUntilDeployment = this.config.timing.deploymentIntervalSeconds;
    return { cycle: this.cycleNumber, deployment };
  }
}
