import { PROJECTILE_DEFINITIONS, UNIT_DEFINITIONS } from "../data/definitions.js";
import { fleetVisualFor, unifiedHullVisualFor } from "../data/visuals.js";
import { LANE, TEAM } from "../core/constants.js";

const stars = Object.freeze([
  [28, 74, 1.2], [96, 122, 0.7], [178, 56, 1], [238, 176, 0.8], [362, 98, 1.3],
  [74, 340, 0.9], [148, 448, 1.1], [286, 356, 0.7], [388, 510, 1], [202, 632, 0.9],
  [42, 568, 0.7], [332, 628, 1.2], [188, 286, 0.6], [402, 406, 0.8],
]);
const foundryDrift = Object.freeze([
  [24, 96, 0.7], [48, 276, 1.1], [71, 744, 0.65], [32, 1030, 0.9],
  [349, 168, 0.8], [386, 432, 1.05], [365, 826, 0.7], [397, 1108, 0.95],
]);

const asset = (assets, key) => assets?.get(key) ?? null;
const teamColor = (team) => (team === "TEAM_PLAYER" ? "#86dff2" : "#f29a83");
const factionKey = (unit) => `unified-${unit.team === "TEAM_PLAYER" ? "player" : "enemy"}-${unit.unitType}`;
const legacyFactionKey = (unit) => `${unit.team === "TEAM_PLAYER" ? "nairan" : "klaed"}-${unit.unitType === "drone" ? "scout" : unit.unitType}`;
const projectileFamily = (projectileType) => ({
  scout_pulse: "scout-pulse",
  light_bolt: "scout-pulse",
  fighter_laser: "fighter-laser",
  siege_missile: "siege-missile",
  heavy_cannon: "heavy-cannon",
  heavy_bolt: "heavy-cannon",
}[projectileType] ?? null);
const unifiedProjectileKey = (team, projectileType) => {
  const family = projectileFamily(projectileType);
  return family ? `unified-${team === TEAM.PLAYER ? "player" : "enemy"}-${family}` : null;
};
const unitSize = (unitType) => ({ drone: 23.5, scout: 32.5, fighter: 39, bomber: 48, frigate: 58, battlecruiser: 74, dreadnought: 92 }[unitType] ?? 39);
const projectilePresentation = Object.freeze({
  "scout-pulse": Object.freeze({ width: 9, height: 9, ghostCount: 2, ghostStep: 2, ghostScale: 0.58, composite: "screen" }),
  "fighter-laser": Object.freeze({ width: 7, height: 28, ghostCount: 2, ghostStep: 2, ghostScale: 0.72, composite: "screen" }),
  "siege-missile": Object.freeze({ width: 11, height: 25, ghostCount: 1, ghostStep: 3, ghostScale: 0.68, composite: "source-over" }),
  "heavy-cannon": Object.freeze({ width: 13, height: 23, ghostCount: 2, ghostStep: 2, ghostScale: 0.68, composite: "screen" }),
});
const shipCrop = (unitType) => ({
  drone: { x: 20, y: 23, width: 24, height: 22 },
  scout: { x: 20, y: 23, width: 24, height: 22 }, fighter: { x: 17, y: 20, width: 30, height: 27 },
  bomber: { x: 16, y: 18, width: 32, height: 30 }, frigate: { x: 11, y: 9, width: 42, height: 42 },
}[unitType] ?? { x: 0, y: 0, width: 64, height: 64 });

const shipCellSize = (unitType, frameSize = 64) => {
  const crop = shipCrop(unitType);
  return unitSize(unitType) * frameSize / Math.max(crop.width, crop.height);
};

const drawStripFrame = (ctx, image, layer, frameSize, elapsed, displaySize, loop = true) => {
  if (!image || !layer) return false;
  const rawFrame = Math.max(0, Math.floor(elapsed * layer.fps));
  const frame = loop ? rawFrame % layer.frameCount : Math.min(layer.frameCount - 1, rawFrame);
  ctx.drawImage(image, frame * frameSize, 0, frameSize, frameSize, -displaySize / 2, -displaySize / 2, displaySize, displaySize);
  return true;
};

const drawTimedStrip = (ctx, image, layer, frameSize, elapsed, displaySize, duration) => {
  if (!image || !layer || elapsed < 0 || elapsed >= duration) return false;
  const frame = Math.min(layer.frameCount - 1, Math.floor(elapsed / duration * layer.frameCount));
  ctx.drawImage(image, frame * frameSize, 0, frameSize, frameSize, -displaySize / 2, -displaySize / 2, displaySize, displaySize);
  return true;
};

const stableFrameOffset = (id, frameCount) => [...String(id)].reduce((value, character) => value + character.charCodeAt(0), 0) % frameCount;

// These are tight crops inside Galalaxy's original Nairan/Kla'ed Scout engine frames.
// Reusing the animated source flame at authored nozzle coordinates keeps the existing
// high-resolution hulls while preserving Galalaxy's crisp hand-authored motion.
const galalaxyEngineCrop = Object.freeze({
  player: Object.freeze({ x: 23, y: 39, width: 18, height: 22, widthScale: 0.22 }),
  enemy: Object.freeze({ x: 25, y: 34, width: 14, height: 20, widthScale: 0.18 }),
});

const drawGalalaxyEngine = (ctx, image, visual, unit, elapsed, displaySize) => {
  if (!image?.naturalWidth || !visual?.engine) return false;
  const hardpoints = unifiedHullVisualFor(unit.team, unit.unitType)?.engineHardpoints ?? [];
  if (!hardpoints.length) return false;
  const definition = UNIT_DEFINITIONS[unit.unitType];
  const forwardVelocity = Math.cos(unit.heading) * unit.vx + Math.sin(unit.heading) * unit.vy;
  const thrust = Math.max(0, Math.min(1, forwardVelocity / Math.max(1, definition?.speed ?? 1)));
  const idle = unit.state === "HOLDING" ? 0.18 : unit.state === "ENGAGING" || unit.state === "ATTACKING_STRUCTURE" ? 0.32 : 0.46;
  const plumeStrength = Math.max(idle, thrust);
  const faction = unit.team === TEAM.PLAYER ? "player" : "enemy";
  const crop = galalaxyEngineCrop[faction];
  const phase = stableFrameOffset(unit.id, visual.engine.frameCount) / visual.engine.fps;
  const frame = Math.floor((elapsed + phase) * visual.engine.fps) % visual.engine.frameCount;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha *= (unit.team === TEAM.PLAYER ? 0.92 : 0.96) * (0.48 + plumeStrength * 0.52);
  ctx.imageSmoothingEnabled = false;
  for (const hardpoint of hardpoints) {
    const width = displaySize * crop.widthScale * hardpoint.scale * (0.9 + plumeStrength * 0.1);
    const height = displaySize * (0.3 + plumeStrength * 0.18) * hardpoint.scale;
    const x = (hardpoint.x / 384 - 0.5) * displaySize - width / 2;
    const y = (hardpoint.y / 384 - 0.5) * displaySize - height * 0.03;
    ctx.drawImage(image, frame * visual.frameSize + crop.x, crop.y, crop.width, crop.height, x, y, width, height);
  }
  ctx.restore();
  return true;
};

const drawProjectileSprite = (ctx, image, presentation, x, y, angle, alpha, scale = 1) => {
  if (!image || !presentation || alpha <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);
  ctx.globalCompositeOperation = presentation.composite ?? "source-over";
  ctx.globalAlpha = alpha;
  ctx.drawImage(
    image,
    -presentation.width * scale / 2,
    -presentation.height * scale / 2,
    presentation.width * scale,
    presentation.height * scale,
  );
  ctx.restore();
};

const battlefieldProjection = (model) => {
  const camera = model.camera;
  return Object.freeze({
    y: (value) => camera ? camera.viewport.y + value - camera.y : value,
    velocityY: (value) => value,
  });
};

const radialWash = (ctx, x, y, radius, inner, outer = "rgba(0,0,0,0)") => {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(1, outer);
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
};

const drawGardenSector = (ctx, image, projection, worldY, width, height, cropEdge) => {
  if (!image?.naturalWidth || !image?.naturalHeight) return;
  const sourceHeight = Math.min(image.naturalHeight, height * image.naturalWidth / width);
  const sourceY = cropEdge === "bottom" ? image.naturalHeight - sourceHeight : 0;
  ctx.drawImage(image, 0, sourceY, image.naturalWidth, sourceHeight, 0, projection.y(worldY), width, height);
};

let sectorWorldCache = null;
const composeSectorWorld = (rivalSector, playerSector, width, height) => {
  if (sectorWorldCache?.rivalSector === rivalSector && sectorWorldCache?.playerSector === playerSector
    && sectorWorldCache.width === width && sectorWorldCache.height === height) return sectorWorldCache.canvas;
  if (!rivalSector?.naturalWidth || !playerSector?.naturalWidth) return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const worldCtx = canvas.getContext("2d");
  const identityProjection = { y: (value) => value };
  const overlap = 100;
  const sectorHeight = (height + overlap) / 2;
  const playerStart = height - sectorHeight;
  drawGardenSector(worldCtx, rivalSector, identityProjection, 0, width, sectorHeight, "top");
  worldCtx.save();
  worldCtx.beginPath();
  worldCtx.rect(0, sectorHeight, width, height - sectorHeight);
  worldCtx.clip();
  drawGardenSector(worldCtx, playerSector, identityProjection, playerStart, width, sectorHeight, "bottom");
  worldCtx.restore();
  const blendSteps = 20;
  for (let index = 0; index < blendSteps; index += 1) {
    const stripY = playerStart + overlap * index / blendSteps;
    worldCtx.save();
    worldCtx.beginPath();
    worldCtx.rect(0, stripY, width, overlap / blendSteps + 0.5);
    worldCtx.clip();
    worldCtx.globalAlpha = (index + 1) / blendSteps;
    drawGardenSector(worldCtx, playerSector, identityProjection, playerStart, width, sectorHeight, "bottom");
    worldCtx.restore();
  }
  const seamMist = worldCtx.createLinearGradient(0, height / 2 - 68, 0, height / 2 + 68);
  seamMist.addColorStop(0, "rgba(8,18,38,0)");
  seamMist.addColorStop(0.5, "rgba(8,18,38,0.24)");
  seamMist.addColorStop(1, "rgba(8,18,38,0)");
  worldCtx.fillStyle = seamMist;
  worldCtx.fillRect(0, height / 2 - 68, width, 136);
  sectorWorldCache = { rivalSector, playerSector, width, height, canvas };
  return canvas;
};

export const renderBackground = (ctx, width, height, frameTime, assets) => {
  const background = asset(assets, "background-placeholder");
  if (background) ctx.drawImage(background, 0, 0, width, height);
  else {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#152b4a");
    gradient.addColorStop(0.52, "#102440");
    gradient.addColorStop(1, "#111a35");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  radialWash(ctx, 62 + Math.sin(frameTime * 0.035) * 8, 236, 250, "rgba(73,151,160,0.2)");
  radialWash(ctx, 358 + Math.cos(frameTime * 0.03) * 7, 430, 270, "rgba(151,113,159,0.2)");
  radialWash(ctx, 212, 90, 210, "rgba(103,145,177,0.13)");
  radialWash(ctx, 328, height - 116, 230, "rgba(219,145,99,0.13)");
  ctx.restore();

  const horizonY = height - 42;
  const horizon = ctx.createRadialGradient(368, horizonY, 42, 368, horizonY, 164);
  horizon.addColorStop(0, "rgba(244,177,123,0.22)");
  horizon.addColorStop(0.48, "rgba(126,133,191,0.12)");
  horizon.addColorStop(0.54, "rgba(33,42,78,0.08)");
  horizon.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = horizon;
  ctx.beginPath();
  ctx.arc(368, horizonY, 164, Math.PI, Math.PI * 2);
  ctx.fill();

  for (const [x, y, radius] of stars) {
    const driftY = (y + frameTime * 0.6) % height;
    ctx.globalAlpha = 0.36 + Math.sin(frameTime * 0.9 + x) * 0.08;
    ctx.fillStyle = radius > 1 ? "#fff3df" : "#cfdbe5";
    ctx.beginPath();
    ctx.arc(x, driftY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

export const renderBattlefieldLayer = (ctx, model) => {
  const map = model.simulation?.state.map;
  if (!map) return;
  const projection = battlefieldProjection(model);
  const view = model.camera?.viewport ?? { x: 0, y: 0, width: model.width, height: model.height };
  const top = view.y;
  const bottom = view.y + view.height;
  const illustratedWorld = map.visualTheme === "orbital_garden" || map.visualTheme === "twin_foundries";
  if (illustratedWorld) {
    const prefix = map.visualTheme === "orbital_garden" ? "background-orbital-garden" : "background-twin-foundries";
    const rivalSector = asset(model.assets, `${prefix}-rival`);
    const playerSector = asset(model.assets, `${prefix}-player`);
    const world = composeSectorWorld(rivalSector, playerSector, map.bounds.width, map.bounds.height);
    if (world) {
      ctx.save();
      ctx.globalAlpha = 0.99;
      ctx.filter = map.visualTheme === "orbital_garden"
        ? "saturate(1.12) contrast(1.05) brightness(1.03)"
        : "saturate(1.05) contrast(1.08) brightness(0.88)";
      ctx.drawImage(world, 0, projection.y(0));
      ctx.restore();
    }
  }
  if (map.visualTheme === "twin_foundries") {
    ctx.save();
    for (const lane of map.lanes) {
      const corridor = ctx.createLinearGradient(lane.centerX - 68, 0, lane.centerX + 68, 0);
      corridor.addColorStop(0, "rgba(2,7,17,0)");
      corridor.addColorStop(0.25, "rgba(2,7,17,0.07)");
      corridor.addColorStop(0.5, "rgba(2,7,17,0.15)");
      corridor.addColorStop(0.75, "rgba(2,7,17,0.07)");
      corridor.addColorStop(1, "rgba(2,7,17,0)");
      ctx.fillStyle = corridor;
      ctx.fillRect(lane.centerX - 68, projection.y(0), 136, map.bounds.height);
    }
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const [x, baseY, speed] of foundryDrift) {
      const worldY = (baseY + model.frameTime * speed * 5) % map.bounds.height;
      const y = projection.y(worldY);
      if (y < top - 8 || y > bottom + 8) continue;
      ctx.globalAlpha = 0.12 + 0.07 * Math.sin(model.frameTime * 1.3 + baseY);
      ctx.fillStyle = x < map.bounds.width / 2 ? "#f2b06e" : "#a2edf0";
      ctx.fillRect(x, y, 1.2, 2.4);
    }
    ctx.restore();
  }
  const fade = ctx.createLinearGradient(0, top, 0, bottom);
  fade.addColorStop(0, "rgba(202,224,239,0)");
  fade.addColorStop(0.16, "rgba(202,224,239,0.045)");
  fade.addColorStop(0.84, "rgba(202,224,239,0.045)");
  fade.addColorStop(1, "rgba(202,224,239,0)");
  ctx.strokeStyle = fade;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 22]);
  for (const lane of map.lanes) {
    if (illustratedWorld) continue;
    ctx.beginPath();
    ctx.moveTo(lane.centerX, projection.y(0));
    ctx.lineTo(lane.centerX, projection.y(map.bounds.height));
    ctx.stroke();
  }
  ctx.setLineDash([2, 18]);
  ctx.strokeStyle = "rgba(211,231,246,0.025)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(map.bounds.width / 2, projection.y(0));
  ctx.lineTo(map.bounds.width / 2, projection.y(map.bounds.height));
  ctx.stroke();
  ctx.setLineDash([1, 28]);
  ctx.strokeStyle = "rgba(211,231,246,0.022)";
  for (let worldY = 110; worldY < map.bounds.height; worldY += 160) {
    const y = projection.y(worldY);
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(map.bounds.width - 24, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  for (const lane of map.lanes) {
    for (let worldY = 72; worldY < map.bounds.height; worldY += 92) {
      const y = projection.y(worldY);
      if (y < top - 10 || y > bottom + 10) continue;
      const side = Math.floor(worldY / 92) % 2 ? -1 : 1;
      const foundryRoute = map.visualTheme === "twin_foundries";
      const pulse = (foundryRoute ? 0.12 : 0.06) + (Math.sin(model.frameTime * 1.4 + worldY) + 1) * (foundryRoute ? 0.035 : 0.025);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = foundryRoute
        ? worldY < map.bounds.height * 0.36 ? "#f2a08b" : worldY > map.bounds.height * 0.64 ? "#89e7ee" : "#f1cb88"
        : "#f1cb88";
      ctx.beginPath();
      ctx.arc(lane.centerX + side * (foundryRoute ? 48 : 34), y, foundryRoute ? 1.45 : 1.25, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
};

const drawBar = (ctx, x, y, width, ratio, color, height = 3) => {
  ctx.fillStyle = "rgba(10,20,38,0.62)";
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x - width / 2, y, width, height, height / 2);
    ctx.fill();
  } else ctx.fillRect(x - width / 2, y, width, height);
  ctx.fillStyle = color;
  ctx.fillRect(x - width / 2, y, width * Math.max(0, ratio), height);
};

const turretAimState = new Map();

const smoothAimAngle = (structure, desiredAngle, simulationTime) => {
  const previous = turretAimState.get(structure.id);
  if (!previous || simulationTime < previous.time) {
    turretAimState.set(structure.id, { angle: desiredAngle, time: simulationTime });
    return desiredAngle;
  }
  const elapsed = Math.min(0.08, Math.max(0, simulationTime - previous.time));
  const difference = Math.atan2(Math.sin(desiredAngle - previous.angle), Math.cos(desiredAngle - previous.angle));
  const maximumTurn = elapsed * 4.8;
  const angle = previous.angle + Math.max(-maximumTurn, Math.min(maximumTurn, difference));
  turretAimState.set(structure.id, { angle, time: simulationTime });
  return angle;
};

const hqDoorOpenness = (simulationTime, lastDeploymentAt) => {
  if (!Number.isFinite(lastDeploymentAt)) return 0;
  const elapsed = simulationTime - lastDeploymentAt;
  if (elapsed < 0 || elapsed >= 1.25) return 0;
  if (elapsed < 0.22) return elapsed / 0.22;
  if (elapsed < 0.78) return 1;
  return 1 - (elapsed - 0.78) / 0.47;
};

const drawDamageDetails = (ctx, structure, size, hpRatio, frameTime) => {
  if (hpRatio > 0.67) return;
  const severe = hpRatio <= 0.34;
  const direction = structure.id.length % 2 ? 1 : -1;
  ctx.strokeStyle = severe ? "rgba(16,20,28,0.88)" : "rgba(23,27,36,0.65)";
  ctx.lineWidth = severe ? 2.1 : 1.35;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-size * 0.08 * direction, -size * 0.23);
  ctx.lineTo(size * 0.01 * direction, -size * 0.1);
  ctx.lineTo(-size * 0.045 * direction, size * 0.015);
  ctx.lineTo(size * 0.08 * direction, size * 0.14);
  ctx.stroke();
  if (!severe) return;
  ctx.beginPath();
  ctx.moveTo(size * 0.24 * direction, -size * 0.05);
  ctx.lineTo(size * 0.13 * direction, size * 0.04);
  ctx.lineTo(size * 0.2 * direction, size * 0.15);
  ctx.stroke();
  const flicker = Math.sin(frameTime * 15 + structure.id.length) > 0.25;
  if (flicker) {
    ctx.strokeStyle = "rgba(255,185,104,0.72)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-2, -size * 0.12);
    ctx.lineTo(2, -size * 0.18);
    ctx.moveTo(0, -size * 0.13);
    ctx.lineTo(-4, -size * 0.16);
    ctx.stroke();
  }
};

const drawTurretHead = (ctx, structure, state, assets, projection, color, gardenTurret = false) => {
  const target = state.units.get(structure.targetId);
  const defaultAngle = structure.team === "TEAM_PLAYER" ? -Math.PI / 2 : Math.PI / 2;
  const desiredAngle = target?.alive
    ? Math.atan2(projection.y(target.y) - projection.y(structure.y), target.x - structure.x)
    : defaultAngle;
  const angle = smoothAimAngle(structure, desiredAngle, state.time);
  const shotAge = state.time - structure.lastShotAt;
  const firing = shotAge >= 0 && shotAge < 0.2;
  const recoil = firing ? Math.sin(shotAge / 0.2 * Math.PI) * (gardenTurret ? 6 : 4.2) : 0;
  const sprite = asset(assets, gardenTurret ? "structure-turret-head-garden" : "structure-turret-head");
  ctx.save();
  if (sprite) {
    ctx.rotate(angle + Math.PI / 2);
    if (gardenTurret) ctx.globalCompositeOperation = "screen";
    ctx.drawImage(sprite, -27, -34 + recoil, 54, 54);
    ctx.globalCompositeOperation = "source-over";
    if (firing) {
      const flash = 1 - shotAge / 0.2;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = flash;
      for (const barrelX of [-6.2, 6.2]) {
        const glow = ctx.createRadialGradient(barrelX, -27 + recoil, 0, barrelX, -27 + recoil, 8);
        glow.addColorStop(0, "rgba(255,252,221,1)");
        glow.addColorStop(0.32, structure.team === TEAM.PLAYER ? "rgba(121,242,248,0.92)" : "rgba(255,151,115,0.92)");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(barrelX - 9, -36 + recoil, 18, 18);
      }
      ctx.restore();
    }
  } else {
    ctx.rotate(angle);
    ctx.fillStyle = "#263747";
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#d8d2bd";
    ctx.fillRect(5 - recoil, -5, 19, 3.5);
    ctx.fillRect(5 - recoil, 1.5, 19, 3.5);
    ctx.fillStyle = color;
    ctx.fillRect(19 - recoil, -5, 5, 3.5);
    ctx.fillRect(19 - recoil, 1.5, 5, 3.5);
  }
  ctx.restore();
};

const drawStructureFallback = (ctx, isHq, size, color) => {
  ctx.save();
  ctx.fillStyle = "rgba(18,29,39,0.96)";
  ctx.strokeStyle = "rgba(239,211,154,0.9)";
  ctx.lineWidth = isHq ? 2.5 : 1.8;
  if (isHq) {
    const half = size * 0.34;
    ctx.beginPath();
    ctx.moveTo(0, -half); ctx.lineTo(half * 0.82, -half * 0.52);
    ctx.lineTo(half, half * 0.38); ctx.lineTo(half * 0.48, half);
    ctx.lineTo(-half * 0.48, half); ctx.lineTo(-half, half * 0.38);
    ctx.lineTo(-half * 0.82, -half * 0.52); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(226,220,197,0.9)";
    for (const side of [-1, 1]) ctx.fillRect(side * half * 0.9 - 14, -9, 28, 18);
  } else {
    ctx.beginPath(); ctx.arc(0, 0, size * 0.38, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(226,220,197,0.72)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, isHq ? 28 : 16);
  glow.addColorStop(0, color);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(isHq ? -30 : -18, isHq ? -30 : -18, isHq ? 60 : 36, isHq ? 60 : 36);
  ctx.restore();
};

const drawHqBay = (ctx, side, openness) => {
  ctx.save();
  ctx.translate(side * 34, -25);
  ctx.rotate(side * 0.12);
  ctx.beginPath();
  ctx.moveTo(-14, -14);
  ctx.lineTo(14, -14);
  ctx.lineTo(12, 14);
  ctx.lineTo(-12, 14);
  ctx.closePath();
  ctx.clip();
  if (openness > 0.015) {
    const revealedWidth = openness * 25;
    ctx.fillStyle = "rgba(9,19,34,0.98)";
    ctx.fillRect(-revealedWidth / 2, -14, revealedWidth, 28);
    ctx.strokeStyle = "rgba(236,177,91,0.54)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-revealedWidth * 0.38, -11);
    ctx.lineTo(-revealedWidth * 0.25, 12);
    ctx.moveTo(revealedWidth * 0.38, -11);
    ctx.lineTo(revealedWidth * 0.25, 12);
    ctx.stroke();
    ctx.fillStyle = "rgba(138,224,235,0.64)";
    for (const y of [-6, 0, 6]) ctx.fillRect(-1.1, y, 2.2, 2.6);
    ctx.fillStyle = "rgba(214,225,235,0.72)";
    ctx.fillRect(-revealedWidth / 2 - 1, -13, 1.5, 26);
    ctx.fillRect(revealedWidth / 2 - 0.5, -13, 1.5, 26);
  }
  ctx.restore();
};

const drawHqHangars = (ctx, structure, model) => {
  const state = model.simulation.state;
  const laneIds = state.map.lanes.map((lane) => lane.id);
  for (const side of [-1, 1]) {
    const screenSide = structure.team === TEAM.PLAYER ? side : -side;
    const laneId = laneIds.length === 1 ? laneIds[0] : screenSide < 0 ? LANE.LEFT : LANE.RIGHT;
    const deployedAt = model.director?.lastDeploymentAtFor(structure.team, laneId);
    const delay = screenSide > 0 ? 0.07 : 0;
    const animationAt = Number.isFinite(deployedAt) ? deployedAt + delay : null;
    drawHqBay(ctx, side, hqDoorOpenness(state.time, animationAt));
  }
};

const drawStructureUpgradeDetails = (ctx, structure, model, size, color) => {
  const economy = model.economy?.get(structure.team);
  if (!economy) return;
  if (structure.structureType === "hq") {
    if (economy.economyLevel > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.34 + economy.economyLevel * 0.12;
      ctx.strokeStyle = "#f3c47e";
      ctx.lineWidth = 2 + economy.economyLevel * 0.5;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 7, 4);
        ctx.lineTo(side * (22 + economy.economyLevel * 3), 18);
        ctx.lineTo(side * (32 + economy.economyLevel * 3), 30);
        ctx.stroke();
      }
      ctx.restore();
      for (let index = 0; index < economy.economyLevel; index += 1) {
        ctx.fillStyle = "#f4cf8f";
        ctx.fillRect(-5 + index * 7, size * 0.29, 4, 2);
      }
    }
    if (economy.pendingEconomyLevels > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.2 + 0.08 * Math.sin(model.frameTime * 4);
      ctx.strokeStyle = "#f3c47e";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 7, 4);
        ctx.lineTo(side * 25, 20);
        ctx.lineTo(side * 35, 31);
        ctx.stroke();
      }
      ctx.restore();
    }
    for (let index = 0; index < economy.logisticsLevel; index += 1) {
      const offset = 35 + index * 8;
      ctx.fillStyle = "rgba(19,31,42,0.94)";
      ctx.fillRect(-offset - 3, -35, 7, 12);
      ctx.fillRect(offset - 4, -35, 7, 12);
      ctx.fillStyle = "#ffd69b";
      ctx.globalAlpha = 0.8;
      ctx.fillRect(-offset - 1, -32, 3, 7);
      ctx.fillRect(offset - 2, -32, 3, 7);
    }
    if (economy.pendingLogisticsLevels > 0) {
      const offset = 35 + economy.logisticsLevel * 8;
      ctx.fillStyle = "rgba(19,31,42,0.78)";
      ctx.fillRect(-offset - 3, -35, 7, 12);
      ctx.fillRect(offset - 4, -35, 7, 12);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.2 + 0.08 * Math.sin(model.frameTime * 4);
      ctx.fillRect(-offset - 1, -31, 3, 5);
      ctx.fillRect(offset - 2, -31, 3, 5);
    }
    for (let index = 0; index < economy.weaponLevel; index += 1) {
      const y = -6 + index * 8;
      for (const side of [-1, 1]) {
        ctx.fillStyle = "rgba(19,27,36,0.94)";
        ctx.fillRect(side * 27 - 4, y - 2, 8, 5);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.78;
        ctx.fillRect(side * 27 - 2.5, y - 1, 5, 2.5);
      }
    }
    if (economy.pendingWeaponLevels > 0) {
      ctx.save();
      ctx.globalAlpha = 0.22 + 0.08 * Math.sin(model.frameTime * 4);
      ctx.strokeStyle = color;
      ctx.setLineDash([2, 2]);
      for (const side of [-1, 1]) ctx.strokeRect(side * 27 - 4, -8 + economy.weaponLevel * 8, 8, 5);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    return;
  }
  for (let index = 0; index < economy.turretLevel; index += 1) {
    const side = index % 2 ? 1 : -1;
    const row = Math.floor(index / 2);
    ctx.fillStyle = "rgba(30,38,48,0.96)";
    ctx.beginPath();
    ctx.moveTo(side * (16 + row * 3), 5 - row * 7);
    ctx.lineTo(side * (29 + row * 3), 1 - row * 7);
    ctx.lineTo(side * (31 + row * 3), 10 - row * 7);
    ctx.lineTo(side * (18 + row * 3), 13 - row * 7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(239,193,119,0.82)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  if (economy.pendingTurretLevels > 0) {
    const side = economy.turretLevel % 2 ? 1 : -1;
    const row = Math.floor(economy.turretLevel / 2);
    ctx.save();
    ctx.globalAlpha = 0.24 + 0.08 * Math.sin(model.frameTime * 4);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(side * (22 + row * 3) - 5, 1 - row * 7, 10, 11);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
};

const drawStructure = (ctx, structure, model, projection) => {
  const state = model.simulation.state;
  const isHq = structure.structureType === "hq";
  const gardenHq = isHq && state.map.visualTheme === "orbital_garden";
  const gardenTurret = !isHq && state.map.visualTheme === "orbital_garden";
  const size = gardenHq ? 230 : gardenTurret ? 94 : isHq ? 176 : 84;
  const spriteWidth = gardenHq ? 330 : isHq ? 176 : size;
  const spriteHeight = gardenHq ? 227 : isHq ? 176 : size;
  const color = teamColor(structure.team);
  const hqAssetKey = gardenHq ? (structure.team === TEAM.ENEMY ? "structure-hq-garden-rival" : "structure-hq-garden") : "structure-hq";
  const turretAssetKey = gardenTurret ? (structure.team === TEAM.ENEMY ? "structure-turret-garden-rival" : "structure-turret-garden-player") : "structure-turret";
  const sprite = asset(model.assets, isHq ? hqAssetKey : turretAssetKey);
  const damaged = state.time - structure.lastDamagedAt < 0.13;
  const hpRatio = structure.hp / structure.maxHp;
  const y = projection.y(structure.y);
  ctx.save();
  ctx.translate(structure.x, y);
  if (!gardenHq && isHq && structure.team === TEAM.ENEMY) ctx.rotate(Math.PI);
  if (sprite) {
    if (damaged) ctx.filter = "brightness(1.9) saturate(0.4)";
    else if (hpRatio <= 0.34) ctx.filter = "brightness(0.72) saturate(0.52)";
    else if (hpRatio <= 0.67) ctx.filter = "brightness(0.88) saturate(0.76)";
    else ctx.filter = state.map.visualTheme === "twin_foundries" ? "sepia(0.16) saturate(1.12) contrast(1.08)" : "saturate(1.08) contrast(1.05)";
    ctx.globalCompositeOperation = gardenHq || gardenTurret ? "screen" : "source-over";
    ctx.drawImage(sprite, -spriteWidth / 2, -spriteHeight / 2, spriteWidth, spriteHeight);
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
  } else drawStructureFallback(ctx, isHq, size, color);
  drawStructureUpgradeDetails(ctx, structure, model, size, color);
  if (state.map.visualTheme === "twin_foundries") {
    ctx.fillStyle = "rgba(12,18,25,0.96)";
    for (const side of [-1, 1]) ctx.fillRect(side * size * 0.31 - 2.5, -4, 5, 13);
    ctx.fillStyle = color;
    for (const side of [-1, 1]) ctx.fillRect(side * size * 0.31 - 1.25, -1.5, 2.5, 8);
  }
  if (isHq) drawHqHangars(ctx, structure, model);
  else drawTurretHead(ctx, structure, state, model.assets, projection, color, gardenTurret);
  drawDamageDetails(ctx, structure, size, hpRatio, model.frameTime);
  ctx.restore();
  drawBar(ctx, structure.x, y + size * 0.45, isHq ? 84 : 50, hpRatio, color, isHq ? 5 : 4);
};

const drawNode = (ctx, node, frameTime, assets, projection, visualTheme) => {
  const color = node.ownerTeam === "TEAM_PLAYER" ? "#a6e6f2" : node.ownerTeam === "TEAM_ENEMY" ? "#f3a58e" : "#d9d5ee";
  const sunwell = visualTheme === "orbital_garden";
  const sprite = asset(assets, sunwell ? "structure-node-sunwell" : "structure-node-unified");
  const y = projection.y(node.y);
  ctx.save();
  ctx.translate(node.x, y);
  const auraRadius = sunwell ? 104 : 54;
  const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, auraRadius);
  aura.addColorStop(0, node.ownerTeam ? `${color}35` : "rgba(235,199,139,0.22)");
  aura.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
  ctx.fill();
  if (sprite) {
    if (sunwell) ctx.globalCompositeOperation = "screen";
    if (sunwell) ctx.drawImage(sprite, -128, -106, 256, 212);
    else ctx.drawImage(sprite, -36, -36, 72, 72);
    ctx.globalCompositeOperation = "source-over";
  }
  else { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); }
  const progress = Math.min(1, Math.abs(node.progress) / 100);
  const progressColor = node.progress > 0 ? "#a6e6f2" : node.progress < 0 ? "#f3a58e" : color;
  ctx.fillStyle = "rgba(7,15,28,0.72)";
  const barY = sunwell ? 108 : 35;
  const barWidth = sunwell ? 92 : 52;
  ctx.fillRect(-barWidth / 2, barY, barWidth, 3);
  ctx.fillStyle = progressColor;
  ctx.globalAlpha = 0.82;
  ctx.fillRect(-barWidth / 2 + 1, barY + 1, (barWidth - 2) * progress, 1.5);
  if (node.contested) {
    ctx.globalAlpha = 0.5 + Math.sin(frameTime * 6) * 0.18;
    ctx.fillStyle = "#f2cd83";
    ctx.fillRect(-5, -28, 10, 2);
    ctx.fillRect(-5, 27, 10, 2);
  }
  ctx.globalAlpha = 0.36;
  ctx.fillStyle = "#f3cb83";
  for (let index = 0; index < 4; index += 1) {
    const angle = frameTime * 0.08 + index * Math.PI / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * 34, Math.sin(angle) * 34, 1.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

const drawProjectile = (ctx, projectile, projection, model) => {
  const definition = PROJECTILE_DEFINITIONS[projectile.projectileType] ?? PROJECTILE_DEFINITIONS.light_bolt;
  const x = projectile.x;
  const y = projection.y(projectile.y);
  const angle = Math.atan2(projection.velocityY(projectile.vy), projectile.vx);
  const projectileKind = projectileFamily(projectile.projectileType);
  const projectileSprite = asset(model.assets, unifiedProjectileKey(projectile.ownerTeam, projectile.projectileType));
  const presentation = projectilePresentation[projectileKind];
  const economy = model.economy?.get(projectile.ownerTeam);
  const techLevel = projectile.ownerId?.includes("turret") ? economy?.turretLevel ?? 0
    : projectile.ownerId?.includes("hq") ? 0 : economy?.weaponLevel ?? 0;
  const bodyScale = 1 + techLevel * 0.045;
  const factionColor = projectile.ownerTeam === TEAM.PLAYER ? "#68eaf2" : "#ff795f";
  const warmCore = projectile.ownerTeam === TEAM.PLAYER ? "#fff5d5" : "#ffe8cf";
  ctx.save();
  ctx.lineCap = "round";
  if (projectile.trail?.length) {
    const trailBudget = projectileKind === "siege-missile" ? 8 : projectileKind === "fighter-laser" ? 5 : 4;
    const trail = projectile.trail.slice(-trailBudget);
    if (projectileSprite && presentation) {
      for (let ghost = presentation.ghostCount; ghost >= 1; ghost -= 1) {
        const trailIndex = trail.length - 1 - ghost * presentation.ghostStep;
        const point = trail[Math.max(0, trailIndex)];
        if (!point) continue;
        const progress = 1 - ghost / (presentation.ghostCount + 1);
        drawProjectileSprite(
          ctx, projectileSprite, presentation, point.x, projection.y(point.y), angle,
          0.05 + progress * 0.1,
          bodyScale * presentation.ghostScale * (0.84 + progress * 0.16),
        );
      }
    }
    if (projectileKind === "fighter-laser" || projectileKind === "heavy-cannon") {
      ctx.strokeStyle = factionColor;
      ctx.lineWidth = projectileKind === "fighter-laser" ? 1.45 : 1.8;
      ctx.globalAlpha = projectileKind === "fighter-laser" ? 0.56 : 0.34;
      ctx.beginPath();
      trail.forEach((point, index) => {
        const pointY = projection.y(point.y);
        if (index === 0) ctx.moveTo(point.x, pointY); else ctx.lineTo(point.x, pointY);
      });
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (projectileKind === "siege-missile") {
      ctx.globalCompositeOperation = "screen";
      for (let index = 0; index < trail.length; index += 2) {
        const point = trail[index];
        const progress = (index + 1) / trail.length;
        ctx.globalAlpha = 0.12 + progress * 0.32;
        ctx.fillStyle = index % 4 ? factionColor : warmCore;
        ctx.beginPath();
        ctx.arc(point.x, projection.y(point.y), 0.7 + progress * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }
  }
  if (projectileSprite && presentation) {
    drawProjectileSprite(ctx, projectileSprite, presentation, x, y, angle, 0.98, bodyScale);
  } else if (definition.visual === "missile") {
    ctx.globalAlpha = 1;
    ctx.translate(x, y);
    ctx.rotate(angle);
    const hull = projectile.ownerTeam === TEAM.PLAYER ? "#f5ead2" : "#342d39";
    const accent = projectile.ownerTeam === TEAM.PLAYER ? "#62f3f0" : "#ff806b";
    ctx.fillStyle = "#c69a52";
    ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(-9, -8); ctx.lineTo(-7, 0); ctx.lineTo(-9, 8); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(4, -4); ctx.lineTo(-7, -3); ctx.lineTo(-7, 3); ctx.lineTo(4, 4); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#d8aa59"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = accent; ctx.fillRect(-4, -1.25, 8, 2.5);
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(-8, 0, 3.2 + techLevel * 0.25, 0, Math.PI * 2); ctx.fill();
  } else {
    const length = definition.visual === "laser" ? 12 : definition.visual === "heavy" ? 9 : 6;
    ctx.strokeStyle = projectile.ownerTeam === TEAM.PLAYER ? definition.color : "#f3a28d";
    ctx.lineWidth = (definition.visual === "heavy" ? 4 : 2.4) + techLevel * 0.45;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(angle) * length, y - Math.sin(angle) * length);
    ctx.lineTo(x + Math.cos(angle) * 2, y + Math.sin(angle) * 2);
    ctx.stroke();
  }
  ctx.restore();
};

export const renderEntityLayer = (ctx, model) => {
  const simulation = model.simulation;
  if (!simulation) return;
  const { nodes, structures, units, projectiles } = simulation.state;
  const projection = battlefieldProjection(model);
  const view = model.camera?.viewport;
  const visible = (worldY, padding = 100) => {
    if (!view) return true;
    const screenY = projection.y(worldY);
    return screenY >= view.y - padding && screenY <= view.y + view.height + padding;
  };
  for (const node of nodes.values()) if (visible(node.y, 120)) drawNode(ctx, node, model.frameTime, model.assets, projection, simulation.state.map.visualTheme);
  for (const structure of structures.values()) {
    if (!visible(structure.y, structure.structureType === "hq" ? 80 : 50)) continue;
    ctx.globalAlpha = structure.alive ? 1 : 0.16;
    drawStructure(ctx, structure, model, projection);
  }
  ctx.globalAlpha = 1;
  for (const unit of units.values()) {
    if (unit.launching && unit.launchElapsed < 0) continue;
    if (!visible(unit.y, 60)) continue;
    const fleetScale = simulation.state.map.visualTheme === "orbital_garden" ? 1.12 : 1;
    const size = unitSize(unit.unitType) * fleetScale;
    const unifiedSprite = asset(model.assets, factionKey(unit));
    const sprite = unifiedSprite ?? asset(model.assets, legacyFactionKey(unit));
    const visual = fleetVisualFor(unit.team, unit.unitType);
    const engineVisual = fleetVisualFor(unit.team, "scout");
    const frameSize = visual?.frameSize ?? 64;
    const displaySize = unifiedSprite ? size * 1.28 : shipCellSize(unit.unitType, frameSize) * fleetScale;
    const heading = Number.isFinite(unit.heading) ? unit.heading : (unit.team === TEAM.PLAYER ? -Math.PI / 2 : Math.PI / 2);
    const renderRotation = heading + Math.PI / 2;
    const y = projection.y(unit.y);
    const launchProgress = unit.launching ? Math.min(1, Math.max(0, unit.launchElapsed / unit.launchDuration)) : 1;
    ctx.save();
    ctx.translate(unit.x, y);
    ctx.globalAlpha = 0.62 + launchProgress * 0.38;
    ctx.scale(0.78 + launchProgress * 0.22, 0.78 + launchProgress * 0.22);
    ctx.rotate(renderRotation);
    if (engineVisual?.engine) drawGalalaxyEngine(ctx, asset(model.assets, engineVisual.engine.assetKey), engineVisual, unit, simulation.state.time, displaySize);
    ctx.globalCompositeOperation = "source-over";
    const recentlyDamaged = simulation.state.time - unit.lastDamagedAt < 0.11;
    if (recentlyDamaged) ctx.filter = "brightness(1.82) saturate(0.58) contrast(1.08)";
    else if (unifiedSprite && simulation.state.map.visualTheme === "orbital_garden" && unit.team === TEAM.PLAYER) {
      ctx.filter = "drop-shadow(0 1px 1.4px rgba(2,9,18,0.96)) saturate(1.04) contrast(1.12) brightness(1.06)";
    } else if (unifiedSprite) ctx.filter = "drop-shadow(0 1px 0.8px rgba(2,9,18,0.72)) saturate(1.06) contrast(1.07)";
    if (sprite) {
      if (unifiedSprite) ctx.drawImage(sprite, -displaySize / 2, -displaySize / 2, displaySize, displaySize);
      else ctx.drawImage(sprite, 0, 0, frameSize, frameSize, -displaySize / 2, -displaySize / 2, displaySize, displaySize);
    }
    else { ctx.fillStyle = teamColor(unit.team); ctx.beginPath(); ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2); ctx.fill(); }
    const weaponLevel = model.economy?.get(unit.team).weaponLevel ?? 0;
    if (weaponLevel > 0) {
      const mounts = ({
        drone: [[0, -0.28]], scout: [[-0.16, -0.28], [0.16, -0.28]], fighter: [[-0.27, -0.2], [0.27, -0.2]],
        bomber: [[-0.15, -0.12], [0.15, -0.12]], frigate: [[-0.36, -0.03], [0.36, -0.03]],
      })[unit.unitType] ?? [[0, -0.25]];
      for (const [mountX, mountY] of mounts) {
        ctx.fillStyle = "rgba(12,20,30,0.92)";
        ctx.fillRect(mountX * size - 2.2, mountY * size - 2.8, 4.4, 5.6);
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = unit.team === TEAM.PLAYER ? "#fff0b9" : "#ffb07e";
        ctx.globalAlpha = 0.56 + weaponLevel * 0.12;
        ctx.fillRect(mountX * size - 0.9, mountY * size - 2, 1.8, 4);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.globalAlpha = 1;
    }
    if (!unifiedSprite && visual?.weapon) drawTimedStrip(ctx, asset(model.assets, visual.weapon.assetKey), visual.weapon, frameSize, simulation.state.time - unit.lastShotAt, displaySize, 0.42);
    const shotAge = simulation.state.time - unit.lastShotAt;
    if (unit.unitType === "bomber" && shotAge >= 0 && shotAge < 0.32) {
      const flashProgress = shotAge / 0.32;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = (1 - flashProgress) * 0.92;
      ctx.fillStyle = unit.team === TEAM.PLAYER ? "#ffe2a6" : "#ffae83";
      ctx.beginPath();
      ctx.ellipse(0, -size * 0.43, 4 + flashProgress * 5, 8 + flashProgress * 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff4d0";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, -size * 0.43, 5 + flashProgress * 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (!unifiedSprite && visual?.shield) drawTimedStrip(ctx, asset(model.assets, visual.shield.assetKey), visual.shield, frameSize, simulation.state.time - unit.lastDamagedAt, displaySize, unit.unitType === "frigate" ? 0.82 : 0.62);
    const damageAge = simulation.state.time - unit.lastDamagedAt;
    if (damageAge >= 0 && damageAge < 0.22) {
      ctx.globalCompositeOperation = "screen";
      const damageProgress = damageAge / 0.22;
      ctx.globalAlpha = (1 - damageProgress) * 0.5;
      ctx.fillStyle = "rgba(255,245,214,0.34)";
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.27, size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = (1 - damageProgress) * 0.7;
      ctx.strokeStyle = unit.team === TEAM.PLAYER ? "#a9f5f2" : "#ffad8e";
      ctx.lineWidth = unit.unitType === "frigate" ? 1.8 : 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * (0.36 + damageProgress * 0.12), size * (0.28 + damageProgress * 0.1), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
    const hpRatio = unit.hp / unit.maxHp;
    if (hpRatio < 0.75 || simulation.state.time - unit.lastDamagedAt < 1.8) drawBar(ctx, unit.x, y + size * 0.52, size * 0.82, hpRatio, teamColor(unit.team));
  }
  for (const projectile of projectiles.values()) if (projectile.age >= 0 && visible(projectile.y, 50)) drawProjectile(ctx, projectile, projection, model);
};

const seededAngle = (seed, index) => ((seed * 2.17 + index * 2.399) % (Math.PI * 2));

export const renderEffectsLayer = (ctx, model) => {
  const projection = battlefieldProjection(model);
  const view = model.camera?.viewport;
  for (const effect of model.effects ?? []) {
    const effectY = projection.y(effect.y);
    if (view && (effectY < view.y - 80 || effectY > view.y + view.height + 80)) continue;
    const progress = 1 - effect.life / effect.maxLife;
    const alpha = Math.max(0, 1 - progress);
    const color = teamColor(effect.team);
    const y = projection.y(effect.y);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (effect.type === "upgrade") {
      const upgradeColor = effect.upgradeId === "economy" || effect.upgradeId === "logistics" ? "#f2c47d" : color;
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = upgradeColor;
      ctx.lineWidth = 2.4 - progress;
      ctx.beginPath();
      ctx.arc(effect.x, y, 18 + progress * 72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.7;
      ctx.beginPath();
      ctx.arc(effect.x, y, 8 + progress * 42, 0, Math.PI * 2);
      ctx.stroke();
      for (let index = 0; index < 8; index += 1) {
        const angle = seededAngle(effect.seed, index);
        const distance = 14 + progress * (34 + index % 3 * 5);
        ctx.fillStyle = upgradeColor;
        ctx.beginPath();
        ctx.arc(effect.x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (effect.type === "muzzle") {
      const siege = effect.projectileType === "siege_missile";
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = siege ? "#ffd18c" : "#fff4cf";
      ctx.beginPath();
      ctx.arc(effect.x, y, (siege ? 4 : 2) + progress * (siege ? 10 : 5), 0, Math.PI * 2);
      ctx.fill();
      if (siege) {
        ctx.globalAlpha = alpha * 0.8;
        ctx.strokeStyle = "#ffad78";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(effect.x, y, 7 + progress * 17, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (effect.type === "hit") {
      const heavy = effect.projectileType === "siege_missile" || effect.projectileType === "heavy_cannon" || effect.projectileType === "heavy_bolt";
      const flashRadius = heavy ? 15 : effect.projectileType === "fighter_laser" ? 10 : 7;
      ctx.globalCompositeOperation = "screen";
      const impactGlow = ctx.createRadialGradient(effect.x, y, 0, effect.x, y, flashRadius * (0.65 + progress));
      impactGlow.addColorStop(0, `rgba(255,248,218,${0.9 * alpha})`);
      impactGlow.addColorStop(0.28, effect.team === TEAM.PLAYER ? `rgba(114,236,242,${0.66 * alpha})` : `rgba(255,142,111,${0.66 * alpha})`);
      impactGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = impactGlow;
      ctx.fillRect(effect.x - flashRadius * 2, y - flashRadius * 2, flashRadius * 4, flashRadius * 4);
      ctx.strokeStyle = effect.projectileType === "siege_missile" ? "#ffd096" : "#f7f4d7";
      ctx.lineWidth = heavy ? 1.65 : 1.1;
      const count = effect.projectileType === "siege_missile" ? 8 : heavy ? 6 : 4;
      for (let index = 0; index < count; index += 1) {
        const angle = seededAngle(effect.seed, index);
        const inner = 2 + progress * 3;
        const outer = inner + 3 + progress * (effect.projectileType === "siege_missile" ? 8 : 4);
        ctx.beginPath();
        ctx.moveTo(effect.x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
        ctx.lineTo(effect.x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
        ctx.stroke();
      }
      if (effect.projectileType === "siege_missile") {
        ctx.strokeStyle = "#f2aa7c";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(effect.x, y, 4 + progress * 12, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      const visual = fleetVisualFor(effect.team, effect.entityType);
      const destructionImage = visual?.destruction ? asset(model.assets, visual.destruction.assetKey) : null;
      if (destructionImage?.naturalWidth) {
        const sizeScale = ({ drone: 0.68, scout: 0.72, fighter: 0.78, bomber: 0.82, frigate: 0.9 })[effect.entityType] ?? 0.8;
        const fleetScale = model.simulation.state.map.visualTheme === "orbital_garden" ? 1.12 : 1;
        const displaySize = shipCellSize(effect.entityType, visual.frameSize) * sizeScale * fleetScale;
        ctx.save();
        ctx.translate(effect.x, y);
        if (Number.isFinite(effect.heading)) ctx.rotate(effect.heading + Math.PI / 2);
        ctx.globalAlpha = Math.min(1, effect.life * 5);
        ctx.globalCompositeOperation = "source-over";
        ctx.imageSmoothingEnabled = false;
        drawStripFrame(ctx, destructionImage, visual.destruction, visual.frameSize, effect.maxLife - effect.life, displaySize, false);
        ctx.restore();
      } else {
        const baseRadius = effect.entityType === "hq" ? 34 : effect.entityType === "turret" ? 20 : 12;
        const radius = baseRadius * (0.7 + progress * 1.55);
        const gradient = ctx.createRadialGradient(effect.x, y, 0, effect.x, y, radius);
        gradient.addColorStop(0, "rgba(255,247,207,0.95)");
        gradient.addColorStop(0.28, `${color}cc`);
        gradient.addColorStop(0.62, "rgba(219,116,76,0.42)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(effect.x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `${color}aa`;
        ctx.lineWidth = effect.entityType === "hq" ? 3 : 2;
        ctx.beginPath();
        ctx.arc(effect.x, y, radius * 0.82, 0, Math.PI * 2);
        ctx.stroke();
        const debrisCount = effect.entityType === "hq" ? 16 : 10;
        for (let index = 0; index < debrisCount; index += 1) {
          const angle = seededAngle(effect.seed, index);
          const inner = radius * 0.28;
          const outer = radius * (0.52 + (index % 4) * 0.08);
          ctx.beginPath();
          ctx.moveTo(effect.x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
          ctx.lineTo(effect.x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
};
