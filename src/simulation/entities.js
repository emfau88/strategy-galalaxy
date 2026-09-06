import { STRUCTURE_DEFINITIONS, UNIT_DEFINITIONS } from "../data/definitions.js";

export const UNIT_STATE = Object.freeze({
  ADVANCING: "ADVANCING",
  ENGAGING: "ENGAGING",
  HOLDING: "HOLDING",
  ATTACKING_STRUCTURE: "ATTACKING_STRUCTURE",
  DEAD: "DEAD",
});

export const createUnit = ({ id, team, laneId, unitType, x, y, slotOffsetX = 0, spawnCycle = 0 }) => {
  const definition = UNIT_DEFINITIONS[unitType];
  if (!definition) throw new Error(`Unknown unit type: ${unitType}`);
  return {
    id, team, laneId, unitType, x, y, slotOffsetX, spawnCycle,
    hp: definition.maxHp, maxHp: definition.maxHp, fireCooldown: 0,
    targetId: null, state: UNIT_STATE.ADVANCING, alive: true,
  };
};

export const createStructure = ({ id, team, laneId, structureType, x, y }) => {
  const definition = STRUCTURE_DEFINITIONS[structureType];
  if (!definition) throw new Error(`Unknown structure type: ${structureType}`);
  return {
    id, team, laneId, structureType, x, y,
    hp: definition.maxHp, maxHp: definition.maxHp, fireCooldown: 0,
    targetId: null, alive: true,
  };
};

export const createProjectile = ({ id, ownerId, ownerTeam, laneId, projectileType, x, y, vx, vy, damage, targetId }) => ({
  id, ownerId, ownerTeam, laneId, projectileType, x, y, vx, vy, damage, targetId,
  remainingLife: 0, alive: true,
});
