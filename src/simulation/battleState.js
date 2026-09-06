import { CLASSIC_LANES } from "../data/definitions.js";
import { LANE, TEAM } from "../core/constants.js";
import { createIdFactory } from "../core/ids.js";
import { createStructure } from "./entities.js";

export const createBattleState = ({ map = CLASSIC_LANES } = {}) => {
  const state = {
    map,
    time: 0,
    units: new Map(),
    structures: new Map(),
    projectiles: new Map(),
    nodes: new Map(),
    lanes: new Map(),
    events: [],
    terminalTeam: null,
    ids: createIdFactory("entity"),
  };
  for (const lane of map.lanes) {
    state.lanes.set(lane.id, {
      id: lane.id,
      unitIds: new Map([[TEAM.PLAYER, []], [TEAM.ENEMY, []]]),
      projectileIds: [],
    });
    state.nodes.set(lane.node.id, {
      id: lane.node.id, laneId: lane.id, x: lane.node.x, y: lane.node.y, radius: lane.node.radius,
      progress: 0, ownerTeam: null, contested: false,
    });
  }
  for (const structure of map.structures) state.structures.set(structure.id, createStructure(structure));
  return state;
};

export const laneFor = (state, laneId) => {
  const lane = state.lanes.get(laneId);
  if (!lane) throw new Error(`Unknown lane: ${laneId}`);
  return lane;
};

export const enemyOf = (team) => (team === TEAM.PLAYER ? TEAM.ENEMY : TEAM.PLAYER);

export const addUnitToState = (state, unit) => {
  state.units.set(unit.id, unit);
  laneFor(state, unit.laneId).unitIds.get(unit.team).push(unit.id);
  return unit;
};

export const addProjectileToState = (state, projectile) => {
  state.projectiles.set(projectile.id, projectile);
  laneFor(state, projectile.laneId).projectileIds.push(projectile.id);
  return projectile;
};

export const removeDeadEntities = (state) => {
  for (const lane of state.lanes.values()) {
    for (const team of [TEAM.PLAYER, TEAM.ENEMY]) {
      const active = lane.unitIds.get(team);
      lane.unitIds.set(team, active.filter((id) => state.units.get(id)?.alive));
    }
    lane.projectileIds = lane.projectileIds.filter((id) => state.projectiles.get(id)?.alive);
  }
  for (const [id, unit] of state.units) if (!unit.alive) state.units.delete(id);
  for (const [id, projectile] of state.projectiles) if (!projectile.alive) state.projectiles.delete(id);
};

export const defaultLaneIds = Object.freeze([LANE.LEFT, LANE.RIGHT]);
