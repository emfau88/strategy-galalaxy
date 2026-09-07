import { LANE, TEAM } from "../core/constants.js";

const freeze = (value) => Object.freeze(value);

export const UNIT_DEFINITIONS = freeze({
  scout: freeze({ id: "scout", role: "light", cost: 50, maxHp: 62, speed: 96, collisionRadius: 7, attackRange: 62, aggroRange: 102, targetLeash: 132, damage: 4, fireInterval: 1.2, projectileId: "scout_pulse", captureStrength: 2, color: "#9cecff" }),
  fighter: freeze({ id: "fighter", role: "light", cost: 90, maxHp: 112, speed: 76, collisionRadius: 9, attackRange: 82, aggroRange: 148, targetLeash: 182, damage: 7, fireInterval: 0.58, projectileId: "fighter_laser", captureStrength: 1, color: "#c7e8ff" }),
  bomber: freeze({ id: "bomber", role: "siege", cost: 140, maxHp: 96, speed: 45, collisionRadius: 11, attackRange: 112, aggroRange: 184, targetLeash: 224, damage: 34, fireInterval: 2.25, projectileId: "siege_missile", captureStrength: 0.5, color: "#ffd5a0" }),
  frigate: freeze({ id: "frigate", role: "heavy", cost: 180, maxHp: 390, speed: 38, collisionRadius: 14, attackRange: 94, aggroRange: 158, targetLeash: 196, damage: 18, fireInterval: 1.32, projectileId: "heavy_cannon", captureStrength: 0.75, color: "#c4b9ff" }),
  battlecruiser: freeze({ id: "battlecruiser", role: "capital", cost: 320, maxHp: 480, speed: 34, collisionRadius: 22, attackRange: 110, aggroRange: 180, targetLeash: 216, damage: 46, fireInterval: 0.9, projectileId: "heavy_bolt", color: "#d4b5ff", enabled: false }),
  dreadnought: freeze({ id: "dreadnought", role: "capital", cost: 520, maxHp: 880, speed: 26, collisionRadius: 29, attackRange: 125, aggroRange: 200, targetLeash: 240, damage: 82, fireInterval: 1.15, projectileId: "heavy_bolt", color: "#f0b5ff", enabled: false }),
});

export const PROJECTILE_DEFINITIONS = freeze({
  scout_pulse: freeze({ id: "scout_pulse", speed: 300, lifetime: 1.25, hitRadius: 3, color: "#c7f5ff", visual: "pulse" }),
  fighter_laser: freeze({ id: "fighter_laser", speed: 390, lifetime: 1.05, hitRadius: 3, color: "#8ee7ff", visual: "laser" }),
  siege_missile: freeze({ id: "siege_missile", speed: 145, lifetime: 2.8, hitRadius: 6, color: "#ffc27d", visual: "missile", homing: true, turnRate: 2.8, acceleration: 42 }),
  heavy_cannon: freeze({ id: "heavy_cannon", speed: 235, lifetime: 1.8, hitRadius: 5, color: "#d9caff", visual: "heavy" }),
  light_bolt: freeze({ id: "light_bolt", speed: 290, lifetime: 1.5, hitRadius: 4, color: "#b9f4ff", visual: "pulse" }),
  heavy_bolt: freeze({ id: "heavy_bolt", speed: 220, lifetime: 1.9, hitRadius: 5, color: "#ffd27b", visual: "heavy" }),
});

export const STRUCTURE_DEFINITIONS = freeze({
  hq: freeze({ id: "hq", maxHp: 1800, collisionRadius: 45, attackRange: 150, targetLeash: 185, damage: 12, fireInterval: 1.65, projectileId: "heavy_cannon", color: "#e2f3ff" }),
  turret: freeze({ id: "turret", maxHp: 340, collisionRadius: 25, attackRange: 142, targetLeash: 172, damage: 9, fireInterval: 1.25, projectileId: "fighter_laser", color: "#95d4ff" }),
});

export const CLASSIC_LANES = freeze({
  id: "classic_lanes",
  bounds: freeze({ width: 420, height: 760 }),
  lanes: freeze([
    freeze({ id: LANE.LEFT, centerX: 112, width: 140, node: freeze({ id: "left-node", x: 112, y: 323, radius: 38 }), playerSpawn: freeze({ x: 112, y: 508 }), enemySpawn: freeze({ x: 112, y: 138 }) }),
    freeze({ id: LANE.RIGHT, centerX: 308, width: 140, node: freeze({ id: "right-node", x: 308, y: 323, radius: 38 }), playerSpawn: freeze({ x: 308, y: 508 }), enemySpawn: freeze({ x: 308, y: 138 }) }),
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
