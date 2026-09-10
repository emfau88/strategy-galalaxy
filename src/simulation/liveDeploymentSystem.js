import { TEAM } from "../core/constants.js";
import { UNIT_DEFINITIONS } from "../data/definitions.js";

const teams = Object.freeze([TEAM.PLAYER, TEAM.ENEMY]);
const purchasableUnitTypes = Object.freeze(Object.values(UNIT_DEFINITIONS)
  .filter((definition) => definition.enabled !== false && definition.purchasable !== false && definition.cost > 0)
  .map((definition) => definition.id));

const emptyCooldowns = () => new Map(teams.map((team) => [
  team,
  new Map(purchasableUnitTypes.map((unitType) => [unitType, 0])),
]));
const emptyDeploymentTimes = () => new Map(teams.map((team) => [team, new Map()]));

/**
 * Owns paid real-time launches. Automatic reinforcement waves deliberately use
 * DeploymentDirector instead and never touch Energy or these cooldowns.
 */
export class LiveDeploymentSystem {
  constructor({ config }) {
    this.config = config;
    this.reset();
  }

  reset() {
    this.cooldowns = emptyCooldowns();
    this.lastDeploymentAtByTeamLane = emptyDeploymentTimes();
    this.nextFormationSequence = 1;
    this.lastDeployment = null;
  }

  cooldownRemaining(team, unitType) {
    return this.cooldowns.get(team)?.get(unitType) ?? 0;
  }

  advance(step) {
    for (const cooldowns of this.cooldowns.values()) {
      for (const [unitType, remaining] of cooldowns) {
        cooldowns.set(unitType, Math.max(0, remaining - step));
      }
    }
  }

  deploy({ simulation, economy, team, laneId, unitType }) {
    const definition = UNIT_DEFINITIONS[unitType];
    if (!definition || definition.enabled === false || definition.purchasable === false || definition.cost <= 0) {
      return { ok: false, reason: "UNAVAILABLE_UNIT" };
    }
    if (!this.cooldowns.has(team) || !simulation?.state.lanes.has(laneId)) {
      return { ok: false, reason: "INVALID_TEAM_OR_LANE" };
    }

    const cooldown = this.cooldownRemaining(team, unitType);
    if (cooldown > Number.EPSILON) {
      return { ok: false, reason: "COOLDOWN_ACTIVE", cooldownRemaining: cooldown };
    }

    // Bulk 2 launches one member per purchase. Bulk 3 expands this array from
    // squad definitions without changing the atomic validation path.
    const memberTypes = [unitType];
    const lane = simulation.state.lanes.get(laneId);
    const active = lane.unitIds.get(team).length;
    if (active + memberTypes.length > this.config.caps.unitsPerLaneTeam) {
      return { ok: false, reason: "LANE_CAPACITY" };
    }

    const teamEconomy = economy.get(team);
    if (teamEconomy.energy < definition.cost) {
      return { ok: false, reason: "INSUFFICIENT_ENERGY" };
    }

    const formationSequence = -this.nextFormationSequence;
    const spawned = simulation.spawnFormation(team, laneId, memberTypes, formationSequence);
    if (spawned.length !== memberTypes.length) {
      // Validation and BattleSimulation use the same cap, so this is a defensive
      // guard against future spawn rules. No cost or cooldown has been mutated.
      return { ok: false, reason: "LANE_CAPACITY" };
    }

    teamEconomy.energy -= definition.cost;
    economy.recordFleetPurchase(team, definition.cost);
    this.cooldowns.get(team).set(unitType, definition.deploymentCooldownSeconds ?? 0);
    this.nextFormationSequence += 1;
    this.lastDeployment = {
      team,
      laneId,
      unitType,
      cost: definition.cost,
      memberTypes,
      spawnedIds: spawned.map((unit) => unit.id),
      at: simulation.state.time,
    };
    this.lastDeploymentAtByTeamLane.get(team).set(laneId, simulation.state.time);
    return { ok: true, ...this.lastDeployment, cooldown: definition.deploymentCooldownSeconds ?? 0, spawned };
  }

  lastDeploymentAtFor(team, laneId) {
    return this.lastDeploymentAtByTeamLane.get(team)?.get(laneId) ?? null;
  }
}
