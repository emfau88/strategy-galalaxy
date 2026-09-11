import { STRUCTURE_DEFINITIONS, UNIT_DEFINITIONS } from "../data/definitions.js";

export const UNIT_STATE = Object.freeze({
  ADVANCING: "ADVANCING",
  ENGAGING: "ENGAGING",
  HOLDING: "HOLDING",
  ATTACKING_STRUCTURE: "ATTACKING_STRUCTURE",
  DEAD: "DEAD",
});

export const createUnit = ({ id, team, laneId, unitType, x, y, slotOffsetX = 0, slotOffsetY = 0, spawnCycle = 0, formationId = null, heading = -Math.PI / 2, launch = null }) => {
  const definition = UNIT_DEFINITIONS[unitType];
  if (!definition) throw new Error(`Unknown unit type: ${unitType}`);
  return {
    id, team, laneId, unitType, x: launch?.x ?? x, y: launch?.y ?? y, slotOffsetX, slotOffsetY, spawnCycle, formationId,
    vx: 0, vy: 0, separationVx: 0, heading, broadsideSide: slotOffsetX < 0 ? -1 : 1,
    hp: definition.maxHp, maxHp: definition.maxHp, shield: 0, maxShield: 0,
    lastShieldHitAt: -Infinity, lastShieldActivatedAt: -Infinity, lastShieldImpactAngle: heading,
    fireCooldown: 0, lastShotAt: -Infinity,
    targetId: null, state: UNIT_STATE.ADVANCING, alive: true, lastDamagedAt: -Infinity,
    launching: Boolean(launch), launchElapsed: -(launch?.delay ?? 0), launchDuration: launch?.duration ?? 0,
    launchOriginX: launch?.x ?? x, launchOriginY: launch?.y ?? y,
    launchTargetX: x, launchTargetY: y,
  };
};

export const createStructure = ({ id, team, laneId, structureType, x, y }) => {
  const definition = STRUCTURE_DEFINITIONS[structureType];
  if (!definition) throw new Error(`Unknown structure type: ${structureType}`);
  return {
    id, team, laneId, structureType, x, y,
    hp: definition.maxHp, maxHp: definition.maxHp, fireCooldown: 0, lastShotAt: -Infinity,
    targetId: null, alive: true, lastDamagedAt: -Infinity,
  };
};

export const createProjectile = ({ id, ownerId, ownerTeam, laneId, projectileType, x, y, vx, vy, damage, targetId, launchDelay = 0, hardpointIndex = 0, salvoCount = 1 }) => ({
  id, ownerId, ownerTeam, laneId, projectileType, x, y, vx, vy, damage, targetId, hardpointIndex, salvoCount,
  previousX: x, previousY: y, age: -launchDelay, remainingLife: 0, trail: [], alive: true,
});
