import { LANE, TEAM } from "../core/constants.js";

const freeze = (value) => Object.freeze(value);

export const UNIT_DEFINITIONS = freeze({
  drone: freeze({ id: "drone", role: "skirmisher", cost: 0, purchasable: false, maxHp: 28, speed: 64, acceleration: 160, turnRate: 6.2, collisionRadius: 5, spacingRadius: 9, attackRange: 68, aggroRange: 110, targetLeash: 142, damage: 2, fireInterval: 1.45, projectileId: "scout_pulse", muzzleOffset: 6, captureStrength: 0.2, color: "#b8f4ff" }),
  scout: freeze({ id: "scout", role: "screen", cost: 50, maxHp: 62, speed: 70, acceleration: 150, turnRate: 5.4, collisionRadius: 7, spacingRadius: 12, attackRange: 76, aggroRange: 130, targetLeash: 166, damage: 4, fireInterval: 1.2, projectileId: "scout_pulse", muzzleOffset: 8, salvoCount: 2, salvoSpread: 0.035, hardpointSpacing: 4, captureStrength: 2, color: "#9cecff" }),
  fighter: freeze({ id: "fighter", role: "escort", cost: 90, maxHp: 112, speed: 56, acceleration: 112, turnRate: 4.4, collisionRadius: 9, spacingRadius: 15, attackRange: 105, aggroRange: 170, targetLeash: 210, damage: 7, fireInterval: 0.72, projectileId: "fighter_laser", muzzleOffset: 11, salvoCount: 3, salvoSpread: 0.026, hardpointSpacing: 6, captureStrength: 1, color: "#c7e8ff" }),
  bomber: freeze({ id: "bomber", role: "siege", cost: 140, maxHp: 96, speed: 34, acceleration: 58, turnRate: 2.6, collisionRadius: 11, spacingRadius: 18, attackRange: 148, aggroRange: 215, targetLeash: 260, damage: 34, fireInterval: 2.25, projectileId: "siege_missile", muzzleOffset: 14, captureStrength: 0.5, color: "#ffd5a0" }),
  frigate: freeze({ id: "frigate", role: "heavy", cost: 180, maxHp: 390, speed: 27, acceleration: 40, turnRate: 1.7, collisionRadius: 14, spacingRadius: 24, attackRange: 132, aggroRange: 190, targetLeash: 230, damage: 18, fireInterval: 1.32, projectileId: "heavy_cannon", muzzleOffset: 18, salvoCount: 3, salvoSpread: 0.018, hardpointSpacing: 13, captureStrength: 0.75, broadside: true, color: "#c4b9ff" }),
  battlecruiser: freeze({ id: "battlecruiser", role: "capital", cost: 320, maxHp: 480, speed: 23, acceleration: 30, turnRate: 1.35, collisionRadius: 22, spacingRadius: 30, attackRange: 154, aggroRange: 220, targetLeash: 266, damage: 46, fireInterval: 0.9, projectileId: "heavy_bolt", muzzleOffset: 24, salvoCount: 5, salvoSpread: 0.016, hardpointSpacing: 14, broadside: true, color: "#d4b5ff", enabled: false }),
  dreadnought: freeze({ id: "dreadnought", role: "capital", cost: 520, maxHp: 880, speed: 18, acceleration: 22, turnRate: 1.05, collisionRadius: 29, spacingRadius: 36, attackRange: 176, aggroRange: 245, targetLeash: 294, damage: 82, fireInterval: 1.15, projectileId: "heavy_bolt", muzzleOffset: 30, salvoCount: 7, salvoSpread: 0.014, hardpointSpacing: 15, broadside: true, color: "#f0b5ff", enabled: false }),
});

export const PROJECTILE_DEFINITIONS = freeze({
  scout_pulse: freeze({ id: "scout_pulse", speed: 300, lifetime: 1.25, hitRadius: 3, color: "#c7f5ff", visual: "pulse" }),
  fighter_laser: freeze({ id: "fighter_laser", speed: 420, lifetime: 1.15, hitRadius: 3, color: "#8ee7ff", visual: "laser" }),
  siege_missile: freeze({ id: "siege_missile", speed: 145, lifetime: 2.8, hitRadius: 6, color: "#ffc27d", visual: "missile", homing: true, turnRate: 2.8, acceleration: 42 }),
  heavy_cannon: freeze({ id: "heavy_cannon", speed: 260, lifetime: 1.8, hitRadius: 5, color: "#d9caff", visual: "heavy" }),
  light_bolt: freeze({ id: "light_bolt", speed: 290, lifetime: 1.5, hitRadius: 4, color: "#b9f4ff", visual: "pulse" }),
  heavy_bolt: freeze({ id: "heavy_bolt", speed: 220, lifetime: 1.9, hitRadius: 5, color: "#ffd27b", visual: "heavy" }),
});

export const STRUCTURE_DEFINITIONS = freeze({
  hq: freeze({ id: "hq", maxHp: 1800, collisionRadius: 45, attackRange: 150, targetLeash: 185, damage: 12, fireInterval: 1.65, projectileId: "heavy_cannon", color: "#e2f3ff" }),
  turret: freeze({ id: "turret", maxHp: 340, collisionRadius: 25, attackRange: 142, targetLeash: 172, damage: 9, fireInterval: 1.25, projectileId: "fighter_laser", color: "#95d4ff" }),
});

export const ORBITAL_GARDEN = freeze({
  id: "orbital_garden",
  level: 1,
  title: "ORBITAL GARDEN",
  visualTheme: "orbital_garden",
  bounds: freeze({ width: 420, height: 1280 }),
  lanes: freeze([
    freeze({
      id: LANE.CENTER,
      centerX: 210,
      width: 330,
      node: freeze({ id: "sunwell-node", x: 210, y: 640, radius: 68 }),
      playerSpawn: freeze({ x: 210, y: 1082 }),
      enemySpawn: freeze({ x: 210, y: 198 }),
    }),
  ]),
  structures: freeze([
    freeze({ id: "player-hq", team: TEAM.PLAYER, laneId: null, structureType: "hq", x: 210, y: 1190 }),
    freeze({ id: "enemy-hq", team: TEAM.ENEMY, laneId: null, structureType: "hq", x: 210, y: 90 }),
    freeze({ id: "player-center-turret", team: TEAM.PLAYER, laneId: LANE.CENTER, structureType: "turret", x: 210, y: 1010 }),
    freeze({ id: "enemy-center-turret", team: TEAM.ENEMY, laneId: LANE.CENTER, structureType: "turret", x: 210, y: 270 }),
  ]),
});

export const CLASSIC_LANES = freeze({
  id: "classic_lanes",
  level: 2,
  title: "TWIN FRONTS",
  bounds: freeze({ width: 420, height: 1180 }),
  lanes: freeze([
    freeze({ id: LANE.LEFT, centerX: 105, width: 170, node: freeze({ id: "left-node", x: 105, y: 590, radius: 42 }), playerSpawn: freeze({ x: 105, y: 1000 }), enemySpawn: freeze({ x: 105, y: 180 }) }),
    freeze({ id: LANE.RIGHT, centerX: 315, width: 170, node: freeze({ id: "right-node", x: 315, y: 590, radius: 42 }), playerSpawn: freeze({ x: 315, y: 1000 }), enemySpawn: freeze({ x: 315, y: 180 }) }),
  ]),
  structures: freeze([
    freeze({ id: "player-hq", team: TEAM.PLAYER, laneId: null, structureType: "hq", x: 210, y: 1090 }),
    freeze({ id: "enemy-hq", team: TEAM.ENEMY, laneId: null, structureType: "hq", x: 210, y: 90 }),
    freeze({ id: "player-left-turret", team: TEAM.PLAYER, laneId: LANE.LEFT, structureType: "turret", x: 105, y: 930 }),
    freeze({ id: "player-right-turret", team: TEAM.PLAYER, laneId: LANE.RIGHT, structureType: "turret", x: 315, y: 930 }),
    freeze({ id: "enemy-left-turret", team: TEAM.ENEMY, laneId: LANE.LEFT, structureType: "turret", x: 105, y: 250 }),
    freeze({ id: "enemy-right-turret", team: TEAM.ENEMY, laneId: LANE.RIGHT, structureType: "turret", x: 315, y: 250 }),
  ]),
});
