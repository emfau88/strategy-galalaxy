import { LANE, TEAM } from "../core/constants.js";

const freeze = (value) => Object.freeze(value);

export const UNIT_DEFINITIONS = freeze({
  scout: freeze({ id: "scout", role: "light", cost: 50, maxHp: 40, speed: 110, collisionRadius: 8, attackRange: 68, aggroRange: 126, targetLeash: 158, damage: 7, fireInterval: 0.72, projectileId: "light_bolt", color: "#7ee7ff" }),
  fighter: freeze({ id: "fighter", role: "light", cost: 90, maxHp: 76, speed: 88, collisionRadius: 10, attackRange: 78, aggroRange: 142, targetLeash: 176, damage: 14, fireInterval: 0.82, projectileId: "light_bolt", color: "#a9c7ff" }),
  bomber: freeze({ id: "bomber", role: "siege", cost: 140, maxHp: 58, speed: 62, collisionRadius: 11, attackRange: 94, aggroRange: 154, targetLeash: 190, damage: 34, fireInterval: 1.05, projectileId: "heavy_bolt", color: "#ffd58a" }),
  frigate: freeze({ id: "frigate", role: "heavy", cost: 180, maxHp: 190, speed: 48, collisionRadius: 15, attackRange: 86, aggroRange: 148, targetLeash: 184, damage: 21, fireInterval: 0.7, projectileId: "heavy_bolt", color: "#b69cff" }),
  battlecruiser: freeze({ id: "battlecruiser", role: "capital", cost: 320, maxHp: 480, speed: 34, collisionRadius: 22, attackRange: 110, aggroRange: 180, targetLeash: 216, damage: 46, fireInterval: 0.9, projectileId: "heavy_bolt", color: "#d4b5ff", enabled: false }),
  dreadnought: freeze({ id: "dreadnought", role: "capital", cost: 520, maxHp: 880, speed: 26, collisionRadius: 29, attackRange: 125, aggroRange: 200, targetLeash: 240, damage: 82, fireInterval: 1.15, projectileId: "heavy_bolt", color: "#f0b5ff", enabled: false }),
});

export const PROJECTILE_DEFINITIONS = freeze({
  light_bolt: freeze({ id: "light_bolt", speed: 330, lifetime: 1.25, hitRadius: 4, color: "#b9f4ff" }),
  heavy_bolt: freeze({ id: "heavy_bolt", speed: 270, lifetime: 1.45, hitRadius: 5, color: "#ffd27b" }),
});

export const STRUCTURE_DEFINITIONS = freeze({
  hq: freeze({ id: "hq", maxHp: 1800, collisionRadius: 30, attackRange: 150, targetLeash: 185, damage: 18, fireInterval: 0.78, projectileId: "light_bolt", color: "#e2f3ff" }),
  turret: freeze({ id: "turret", maxHp: 340, collisionRadius: 20, attackRange: 142, targetLeash: 172, damage: 16, fireInterval: 0.7, projectileId: "light_bolt", color: "#95d4ff" }),
});

export const CLASSIC_LANES = freeze({
  id: "classic_lanes",
  bounds: freeze({ width: 420, height: 760 }),
  lanes: freeze([
    freeze({ id: LANE.LEFT, centerX: 132, width: 118, playerSpawn: freeze({ x: 132, y: 650 }), enemySpawn: freeze({ x: 132, y: 110 }) }),
    freeze({ id: LANE.RIGHT, centerX: 288, width: 118, playerSpawn: freeze({ x: 288, y: 650 }), enemySpawn: freeze({ x: 288, y: 110 }) }),
  ]),
  structures: freeze([
    freeze({ id: "player-hq", team: TEAM.PLAYER, laneId: null, structureType: "hq", x: 210, y: 710 }),
    freeze({ id: "enemy-hq", team: TEAM.ENEMY, laneId: null, structureType: "hq", x: 210, y: 50 }),
    freeze({ id: "player-left-turret", team: TEAM.PLAYER, laneId: LANE.LEFT, structureType: "turret", x: 132, y: 595 }),
    freeze({ id: "player-right-turret", team: TEAM.PLAYER, laneId: LANE.RIGHT, structureType: "turret", x: 288, y: 595 }),
    freeze({ id: "enemy-left-turret", team: TEAM.ENEMY, laneId: LANE.LEFT, structureType: "turret", x: 132, y: 165 }),
    freeze({ id: "enemy-right-turret", team: TEAM.ENEMY, laneId: LANE.RIGHT, structureType: "turret", x: 288, y: 165 }),
  ]),
});
