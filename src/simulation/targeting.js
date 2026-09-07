import { STRUCTURE_DEFINITIONS, UNIT_DEFINITIONS } from "../data/definitions.js";
import { LANE, TEAM } from "../core/constants.js";
import { enemyOf, laneFor } from "./battleState.js";
import { UNIT_STATE } from "./entities.js";

const squaredDistance = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const inRange = (a, b, range) => squaredDistance(a, b) <= range ** 2 + 1e-6;
const forwardDirection = (team) => (team === TEAM.PLAYER ? -1 : 1);
const positioned = (entity, positions) => positions?.get(entity?.id) ?? entity;

export const getEntity = (state, id) => state.units.get(id) ?? state.structures.get(id) ?? null;

const isHostileUnitAhead = (unit, candidate, positions = null) => (
  positioned(candidate, positions).y - positioned(unit, positions).y
) * forwardDirection(unit.team) >= -18;

const rolePriority = (unit, candidate) => {
  const type = candidate.unitType;
  if (unit.unitType === "bomber") {
    if (candidate.structureType === "turret") return 0;
    if (candidate.structureType === "hq") return 1;
    if (type === "frigate") return 2;
    return 8;
  }
  if (unit.unitType === "fighter") {
    if (type === "bomber") return 0;
    if (type === "drone" || type === "scout" || type === "fighter") return 1;
    if (type === "frigate") return 4;
    return 8;
  }
  if (unit.unitType === "scout" || unit.unitType === "drone") {
    if (type === "drone" || type === "scout" || type === "fighter" || type === "bomber") return 1;
    if (type === "frigate") return 5;
    return 8;
  }
  if (type === "frigate") return 0;
  if (candidate.structureType) return 4;
  return 2;
};

export const isValidUnitTarget = (state, unit, candidate, positions = null) => (
  candidate?.alive
  && !candidate.launching
  && candidate.team !== unit.team
  && candidate.laneId === unit.laneId
  && inRange(positioned(unit, positions), positioned(candidate, positions), UNIT_DEFINITIONS[unit.unitType].targetLeash)
);

const nextStructureTarget = (state, unit) => {
  const enemyTeam = enemyOf(unit.team);
  const turret = [...state.structures.values()].find((structure) => (
    structure.alive && structure.team === enemyTeam && structure.laneId === unit.laneId && structure.structureType === "turret"
  ));
  if (turret) return turret;
  return [...state.structures.values()].find((structure) => structure.alive && structure.team === enemyTeam && structure.structureType === "hq") ?? null;
};

export const acquireUnitTarget = (state, unit, positions = null) => {
  const current = getEntity(state, unit.targetId);
  if (isValidUnitTarget(state, unit, current, positions) && rolePriority(unit, current) <= 2) return current;

  const definition = UNIT_DEFINITIONS[unit.unitType];
  const hostileIds = laneFor(state, unit.laneId).unitIds.get(enemyOf(unit.team));
  const candidates = hostileIds
    .map((id) => state.units.get(id))
    .filter((candidate) => candidate?.alive
      && !candidate.launching
      && isHostileUnitAhead(unit, candidate, positions)
      && inRange(positioned(unit, positions), positioned(candidate, positions), definition.aggroRange));
  const structureTarget = nextStructureTarget(state, unit);
  if (unit.unitType === "bomber" && structureTarget) candidates.push(structureTarget);
  candidates.sort((a, b) => rolePriority(unit, a) - rolePriority(unit, b)
    || squaredDistance(positioned(unit, positions), positioned(a, positions)) - squaredDistance(positioned(unit, positions), positioned(b, positions))
    || a.id.localeCompare(b.id));
  if (candidates[0]) return candidates[0];

  if (unit.unitType === "scout") {
    const node = [...state.nodes.values()].find((item) => item.laneId === unit.laneId);
    const nodeIsAhead = node && (node.y - unit.y) * forwardDirection(unit.team) >= -node.radius;
    if (nodeIsAhead && node.ownerTeam !== unit.team) return null;
  }
  return structureTarget;
};

export const classifyUnitState = (unit, target) => {
  if (!unit.alive) return UNIT_STATE.DEAD;
  if (!target) return UNIT_STATE.ADVANCING;
  return target.structureType ? UNIT_STATE.ATTACKING_STRUCTURE : UNIT_STATE.ENGAGING;
};

export const acquireStructureTarget = (state, structure, positions = null) => {
  const definition = STRUCTURE_DEFINITIONS[structure.structureType];
  const current = getEntity(state, structure.targetId);
  const currentValid = current?.alive && current.team !== structure.team && (!structure.laneId || current.laneId === structure.laneId) && inRange(positioned(structure, positions), positioned(current, positions), definition.targetLeash);
  if (currentValid) return current;

  const laneIds = structure.laneId ? [structure.laneId] : [...state.lanes.keys()];
  const candidates = laneIds.flatMap((laneId) => laneFor(state, laneId).unitIds.get(enemyOf(structure.team)))
    .map((id) => state.units.get(id))
    .filter((unit) => unit?.alive && !unit.launching && inRange(positioned(structure, positions), positioned(unit, positions), definition.attackRange));
  const mirroredTieLane = structure.team === TEAM.PLAYER ? LANE.LEFT : LANE.RIGHT;
  candidates.sort((a, b) => squaredDistance(positioned(structure, positions), positioned(a, positions)) - squaredDistance(positioned(structure, positions), positioned(b, positions))
    || Number(b.laneId === mirroredTieLane) - Number(a.laneId === mirroredTieLane)
    || a.id.localeCompare(b.id));
  return candidates[0] ?? null;
};

export { squaredDistance, inRange };
