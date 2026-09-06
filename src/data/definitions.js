import { LANE, TEAM } from "../core/constants.js";

const freeze = (value) => Object.freeze(value);

export const UNIT_DEFINITIONS = freeze({
  scout: freeze({ id: "scout", role: "light", cost: 50, maxHp: 70, speed: 110, collisionRadius: 8, attackRange: 68, aggroRange: 126, targetLeash: 158, damage: 5, fireInterval: 1, projectileId: "light_bolt", color: "#7ee7ff" }),
  fighter: freeze({ id: "fighter", role: "light", cost: 90, maxHp: 120, speed: 88, collisionRadius: 10, attackRange: 78, aggroRange: 142, targetLeash: 176, damage: 10, fireInterval: 1.05, projectileId: "light_bolt", color: "#a9c7ff" }),
  bomber: freeze({ id: "bomber", role: "siege", cost: 140, maxHp: 100, speed: 62, collisionRadius: 11, attackRange: 94, aggroRange: 154, targetLeash: 190, damage: 26, fireInterval: 1.25, projectileId: "heavy_bolt", color: "#ffd58a" }),
  frigate: freeze({ id: "frigate", role: "heavy", cost: 180, maxHp: 320, speed: 48, collisionRadius: 15, attackRange: 86, aggroRange: 148, targetLeash: 184, damage: 16, fireInterval: 0.9, projectileId: "heavy_bolt", color: "#b69cff" }),
  battlecruiser: freeze({ id: "battlecruiser", role: "capital", cost: 320, maxHp: 480, speed: 34, collisionRadius: 22, attackRange: 110, aggroRange: 180, targetLeash: 216, damage: 46, fireInterval: 0.9, projectileId: "heavy_bolt", color: "#d4b5ff", enabled: false }),
  dreadnought: freeze({ id: "dreadnought", role: "capital", cost: 520, maxHp: 880, speed: 26, collisionRadius: 29, attackRange: 125, aggroRange: 200, targetLeash: 240, damage: 82, fireInterval: 1.15, projectileId: "heavy_bolt", color: "#f0b5ff", enabled: false }),
});

export const PROJECTILE_DEFINITIONS = freeze({
  light_bolt: freeze({ id: "light_bolt", speed: 330, lifetime: 1.25, hitRadius: 4, color: "#b9f4ff" }),
  heavy_bolt: freeze({ id: "heavy_bolt", speed: 270, lifetime: 1.45, hitRadius: 5, color: "#ffd27b" }),
});

export const STRUCTURE_DEFINITIONS = freeze({
  hq: freeze({ id: "hq", maxHp: 1800, collisionRadius: 30, attackRange: 150, targetLeash: 185, damage: 12, fireInterval: 1.3, projectileId: "light_bolt", color: "#e2f3ff" }),
  turret: freeze({ id: "turret", maxHp: 340, collisionRadius: 20, attackRange: 142, targetLeash: 172, damage: 9, fireInterval: 1.2, projectileId: "light_bolt", color: "#95d4ff" }),
});

export const CLASSIC_LANES = freeze({
  id: "classic_lanes",
  bounds: freeze({ width: 420, height: 760 }),
  lanes: freeze([
    freeze({ id: LANE.LEFT, centerX: 112, width: 94, node: freeze({ id: "left-node", x: 112, y: 332, radius: 38 }), playerSpawn: freeze({ x: 112, y: 536 }), enemySpawn: freeze({ x: 112, y: 118 }) }),
    freeze({ id: LANE.RIGHT, centerX: 308, width: 94, node: freeze({ id: "right-node", x: 308, y: 332, radius: 38 }), playerSpawn: freeze({ x: 308, y: 536 }), enemySpawn: freeze({ x: 308, y: 118 }) }),
  ]),
  structures: freeze([
    freeze({ id: "player-hq", team: TEAM.PLAYER, laneId: null, structureType: "hq", x: 210, y: 552 }),
    freeze({ id: "enemy-hq", team: TEAM.ENEMY, laneId: null, structureType: "hq", x: 210, y: 94 }),
    freeze({ id: "player-left-turret", team: TEAM.PLAYER, laneId: LANE.LEFT, structureType: "turret", x: 112, y: 470 }),
    freeze({ id: "player-right-turret", team: TEAM.PLAYER, laneId: LANE.RIGHT, structureType: "turret", x: 308, y: 470 }),
    freeze({ id: "enemy-left-turret", team: TEAM.ENEMY, laneId: LANE.LEFT, structureType: "turret", x: 112, y: 176 }),
    freeze({ id: "enemy-right-turret", team: TEAM.ENEMY, laneId: LANE.RIGHT, structureType: "turret", x: 308, y: 176 }),
  ]),
});
