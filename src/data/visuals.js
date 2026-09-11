import { TEAM } from "../core/constants.js";

const freeze = (value) => Object.freeze(value);
const layer = (assetKey, frameCount, fps, releaseFrame = null) => freeze({ assetKey, frameCount, fps, releaseFrame });
const engine = (x, y, scale = 1) => freeze({ x, y, scale });

// Pixel-space nozzle metadata is authored against the 384×384 unified hulls. The
// emitted flame itself comes from Galalaxy's original animated Nairan/Kla'ed layers.
export const UNIFIED_HULL_VISUALS = freeze({
  player: freeze({
    drone: freeze({ engineHardpoints: freeze([engine(192, 310, 0.58)]) }),
    scout: freeze({ engineHardpoints: freeze([engine(192, 310, 0.62)]) }),
    fighter: freeze({ engineHardpoints: freeze([engine(192, 317, 0.58)]) }),
    bomber: freeze({ engineHardpoints: freeze([engine(120, 325, 0.72), engine(264, 325, 0.72), engine(156, 332, 0.43), engine(228, 332, 0.43)]) }),
    frigate: freeze({ engineHardpoints: freeze([engine(192, 356, 0.7), engine(140, 343, 0.52), engine(244, 343, 0.52)]) }),
  }),
  enemy: freeze({
    drone: freeze({ engineHardpoints: freeze([engine(192, 310, 0.58)]) }),
    scout: freeze({ engineHardpoints: freeze([engine(192, 310, 0.62)]) }),
    fighter: freeze({ engineHardpoints: freeze([engine(192, 317, 0.58)]) }),
    bomber: freeze({ engineHardpoints: freeze([engine(120, 325, 0.72), engine(264, 325, 0.72), engine(156, 332, 0.43), engine(228, 332, 0.43)]) }),
    frigate: freeze({ engineHardpoints: freeze([engine(192, 356, 0.7), engine(140, 343, 0.52), engine(244, 343, 0.52)]) }),
  }),
});
export const FLEET_VISUALS = freeze({
  nairan: freeze({
    scout: freeze({ frameSize: 64, engine: layer("nairan-scout-engine", 8, 10), weapon: layer("nairan-scout-weapon", 6, 10, 2), shield: layer("nairan-scout-shield", 18, 10), destruction: layer("nairan-scout-destruction", 16, 14) }),
    fighter: freeze({ frameSize: 64, engine: layer("nairan-fighter-engine", 8, 10), weapon: layer("nairan-fighter-weapon", 28, 12, 11), shield: layer("nairan-fighter-shield", 20, 10), destruction: layer("nairan-fighter-destruction", 18, 14) }),
    bomber: freeze({ frameSize: 64, engine: layer("nairan-bomber-engine", 8, 10), weapon: null, shield: layer("nairan-bomber-shield", 10, 10), destruction: layer("nairan-bomber-destruction", 16, 14) }),
    frigate: freeze({ frameSize: 64, engine: layer("nairan-frigate-engine", 8, 10), weapon: layer("nairan-frigate-weapon", 5, 10, 2), shield: layer("nairan-frigate-shield", 8, 10), destruction: layer("nairan-frigate-destruction", 16, 14) }),
  }),
  klaed: freeze({
    scout: freeze({ frameSize: 64, engine: layer("klaed-scout-engine", 10, 10), weapon: layer("klaed-scout-weapon", 6, 10, 2), shield: layer("klaed-scout-shield", 14, 10), destruction: layer("klaed-scout-destruction", 10, 14) }),
    fighter: freeze({ frameSize: 64, engine: layer("klaed-fighter-engine", 10, 10), weapon: layer("klaed-fighter-weapon", 6, 10, 2), shield: layer("klaed-fighter-shield", 10, 10), destruction: layer("klaed-fighter-destruction", 9, 14) }),
    bomber: freeze({ frameSize: 64, engine: layer("klaed-bomber-engine", 10, 10), weapon: null, shield: layer("klaed-bomber-shield", 6, 10), destruction: layer("klaed-bomber-destruction", 8, 14) }),
    frigate: freeze({ frameSize: 64, engine: layer("klaed-frigate-engine", 12, 10), weapon: layer("klaed-frigate-weapon", 6, 10, 2), shield: layer("klaed-frigate-shield", 40, 12), destruction: layer("klaed-frigate-destruction", 9, 14) }),
  }),
});

const projectile = (assetKey, frameWidth, frameHeight, frameCount, fps, width, height, extra = {}) => freeze({
  assetKey, frameWidth, frameHeight, frameCount, fps, width, height, rotationOffset: Math.PI / 2, ...extra,
});

export const PROJECTILE_VISUALS = freeze({
  scout_pulse: freeze({
    [TEAM.PLAYER]: projectile("nairan-bolt", 9, 9, 5, 14, 12, 12),
    [TEAM.ENEMY]: projectile("klaed-bullet", 4, 16, 4, 12, 9, 20),
  }),
  fighter_laser: freeze({
    [TEAM.PLAYER]: projectile("nairan-ray", 18, 38, 4, 14, 11, 24),
    [TEAM.ENEMY]: projectile("klaed-ray", 18, 38, 4, 12, 11, 24),
  }),
  siege_missile: freeze({
    [TEAM.PLAYER]: projectile("nairan-rocket", 9, 16, 4, 12, 18, 34, { trail: "missile" }),
    [TEAM.ENEMY]: projectile("klaed-torpedo", 11, 32, 3, 10, 18, 36, { trail: "missile" }),
  }),
  heavy_cannon: freeze({
    [TEAM.PLAYER]: projectile("nairan-torpedo", 9, 24, 3, 10, 13, 28, { trail: "heavy" }),
    [TEAM.ENEMY]: projectile("klaed-big-bullet", 8, 16, 4, 10, 12, 24, { trail: "heavy" }),
  }),
});

export const fleetVisualFor = (team, unitType) => {
  const visualType = unitType === "drone" ? "scout" : unitType;
  return FLEET_VISUALS[team === TEAM.PLAYER ? "nairan" : "klaed"]?.[visualType] ?? null;
};
// The unified player hulls use cyan lamps while the rival hulls use coral. The
// source packs name their exhaust palettes the other way around, so thrust is
// selected by emitted color rather than by the hull pack used for destruction.
export const engineVisualFor = (team) => team === TEAM.PLAYER ? FLEET_VISUALS.klaed.scout : FLEET_VISUALS.nairan.scout;
export const projectileVisualFor = (team, projectileType) => PROJECTILE_VISUALS[projectileType]?.[team] ?? null;
export const unifiedHullVisualFor = (team, unitType) => UNIFIED_HULL_VISUALS[team === TEAM.PLAYER ? "player" : "enemy"]?.[unitType] ?? null;
