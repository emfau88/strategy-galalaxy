import { STRUCTURE_DEFINITIONS, UNIT_DEFINITIONS } from "../data/definitions.js";
import { TEAM } from "../core/constants.js";
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

const targetCapacity = (candidate) => {
  if (candidate?.structureType === "hq") return 10;
  if (candidate?.structureType === "turret") return 4;
  return ({ drone: 2, scout: 2, fighter: 2, bomber: 3, frigate: 4 })[candidate?.unitType] ?? 2;
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

const unitTargetCandidates = (state, unit, positions = null) => {
  const definition = UNIT_DEFINITIONS[unit.unitType];
  const friendlyHq = [...state.structures.values()].find((structure) => structure.team === unit.team && structure.structureType === "hq");
  const homeDefenseRange = STRUCTURE_DEFINITIONS.hq.attackRange + 85;
  const hostileIds = laneFor(state, unit.laneId).unitIds.get(enemyOf(unit.team));
  const candidates = hostileIds
    .map((id) => state.units.get(id))
    .filter((candidate) => candidate?.alive
      && !candidate.launching
      && (isHostileUnitAhead(unit, candidate, positions)
        || (friendlyHq && inRange(positioned(friendlyHq, positions), positioned(candidate, positions), homeDefenseRange)))
      && inRange(positioned(unit, positions), positioned(candidate, positions), definition.aggroRange));
  const current = getEntity(state, unit.targetId);
  if (isValidUnitTarget(state, unit, current, positions)
    && rolePriority(unit, current) <= 2
    && !candidates.some((candidate) => candidate.id === current.id)) candidates.push(current);
  const structureTarget = nextStructureTarget(state, unit);
  if (unit.unitType === "bomber" && structureTarget && !candidates.some((candidate) => candidate.id === structureTarget.id)) candidates.push(structureTarget);
  if (candidates.length) return candidates;
  if (unit.unitType === "scout") {
    const node = [...state.nodes.values()].find((item) => item.laneId === unit.laneId);
    const nodeIsAhead = node && (node.y - unit.y) * forwardDirection(unit.team) >= -node.radius;
    if (nodeIsAhead && node.ownerTeam !== unit.team) return [];
  }
  return structureTarget ? [structureTarget] : [];
};

// Assign all targets from the same immutable position snapshot. Soft capacity keeps
// attackers distributed without leaving surplus ships idle when only one target is
// available. Current-target bias stabilizes the result across fixed simulation steps.
export const planUnitTargets = (state, positions = null) => {
  const assignments = new Map();
  const targetLoads = new Map();
  const attackers = [...state.units.values()]
    .filter((unit) => unit.alive && !unit.launching)
    .sort((left, right) => left.team.localeCompare(right.team)
      || left.laneId.localeCompare(right.laneId)
      || left.id.localeCompare(right.id));
  for (const unit of attackers) {
    const candidates = unitTargetCandidates(state, unit, positions);
    candidates.sort((left, right) => {
      const priority = rolePriority(unit, left) - rolePriority(unit, right);
      if (priority) return priority;
      const leftLoad = (targetLoads.get(left.id) ?? 0) / targetCapacity(left) - (left.id === unit.targetId ? 0.2 : 0);
      const rightLoad = (targetLoads.get(right.id) ?? 0) / targetCapacity(right) - (right.id === unit.targetId ? 0.2 : 0);
      return leftLoad - rightLoad
        || squaredDistance(positioned(unit, positions), positioned(left, positions)) - squaredDistance(positioned(unit, positions), positioned(right, positions))
        || left.id.localeCompare(right.id);
    });
    const selected = candidates[0] ?? null;
    assignments.set(unit.id, selected?.id ?? null);
    if (selected) targetLoads.set(selected.id, (targetLoads.get(selected.id) ?? 0) + 1);
  }
  return assignments;
};

export const acquireUnitTarget = (state, unit, positions = null) => {
  const current = getEntity(state, unit.targetId);
  if (isValidUnitTarget(state, unit, current, positions) && rolePriority(unit, current) <= 2) return current;
  const candidates = unitTargetCandidates(state, unit, positions);
  candidates.sort((a, b) => rolePriority(unit, a) - rolePriority(unit, b)
    || squaredDistance(positioned(unit, positions), positioned(a, positions)) - squaredDistance(positioned(unit, positions), positioned(b, positions))
    || a.id.localeCompare(b.id));
  if (candidates[0]) return candidates[0];
  return null;
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
  candidates.sort((a, b) => squaredDistance(positioned(structure, positions), positioned(a, positions)) - squaredDistance(positioned(structure, positions), positioned(b, positions))
    || a.laneId.localeCompare(b.laneId)
    || a.id.localeCompare(b.id));
  return candidates[0] ?? null;
};

export { squaredDistance, inRange };
