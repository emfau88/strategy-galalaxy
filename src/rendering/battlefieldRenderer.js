import { PROJECTILE_DEFINITIONS } from "../data/definitions.js";
import { fleetVisualFor, projectileVisualFor } from "../data/visuals.js";
import { LANE, TEAM } from "../core/constants.js";

const stars = Object.freeze([
  [28, 74, 1.2], [96, 122, 0.7], [178, 56, 1], [238, 176, 0.8], [362, 98, 1.3],
  [74, 340, 0.9], [148, 448, 1.1], [286, 356, 0.7], [388, 510, 1], [202, 632, 0.9],
  [42, 568, 0.7], [332, 628, 1.2], [188, 286, 0.6], [402, 406, 0.8],
]);

const asset = (assets, key) => assets?.get(key) ?? null;
const teamColor = (team) => (team === "TEAM_PLAYER" ? "#86dff2" : "#f29a83");
const factionKey = (unit) => `${unit.team === "TEAM_PLAYER" ? "nairan" : "klaed"}-${unit.unitType === "drone" ? "scout" : unit.unitType}`;
const unitSize = (unitType) => ({ drone: 21, scout: 29, fighter: 35, bomber: 43, frigate: 55, battlecruiser: 70, dreadnought: 88 }[unitType] ?? 35);
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
  if (map.visualTheme === "orbital_garden") {
    const garden = asset(model.assets, "background-orbital-garden");
    if (garden) {
      ctx.save();
      ctx.globalAlpha = 0.94;
      ctx.drawImage(garden, 0, projection.y(0), map.bounds.width, map.bounds.height);
      ctx.restore();
    }
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
    if (map.visualTheme === "orbital_garden") continue;
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
      const pulse = 0.06 + (Math.sin(model.frameTime * 1.4 + worldY) + 1) * 0.025;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = "#f1cb88";
      ctx.beginPath();
      ctx.arc(lane.centerX + side * 34, y, 1.25, 0, Math.PI * 2);
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

const drawTurretHead = (ctx, structure, state, assets, projection, color) => {
  const target = state.units.get(structure.targetId);
  const defaultAngle = structure.team === "TEAM_PLAYER" ? -Math.PI / 2 : Math.PI / 2;
  const desiredAngle = target?.alive
    ? Math.atan2(projection.y(target.y) - projection.y(structure.y), target.x - structure.x)
    : defaultAngle;
  const angle = smoothAimAngle(structure, desiredAngle, state.time);
  const shotAge = state.time - structure.lastShotAt;
  const recoil = shotAge >= 0 && shotAge < 0.16 ? Math.sin(shotAge / 0.16 * Math.PI) * 3.5 : 0;
  const sprite = asset(assets, "structure-turret-head");
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.82;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 12.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  if (sprite) {
    ctx.rotate(angle + Math.PI / 2);
    ctx.drawImage(sprite, -27, -34 + recoil, 54, 54);
  } else {
    ctx.rotate(angle);
    ctx.fillStyle = "#7c8da3";
    ctx.fillRect(-5, -6, 12, 12);
    ctx.fillStyle = "#b8c5d1";
    ctx.fillRect(5 - recoil, -5, 19, 3.5);
    ctx.fillRect(5 - recoil, 1.5, 19, 3.5);
  }
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.96;
  ctx.beginPath();
  ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawHqBay = (ctx, side, openness, frameTime, color, hpRatio) => {
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
  const damageAttenuation = hpRatio <= 0.34 ? (side < 0 ? 0.42 : 0.08) : hpRatio <= 0.67 ? 0.68 : 1;
  const lampAlpha = (0.42 + (Math.sin(frameTime * 6 + side * 1.7) + 1) * 0.2) * damageAttenuation;
  ctx.globalAlpha = lampAlpha;
  ctx.fillStyle = color;
  ctx.fillRect(side * 47 - 1.5, -27, 3, 3);
  ctx.globalAlpha = 1;
};

const drawHqHangars = (ctx, structure, model, frameTime, color) => {
  const state = model.simulation.state;
  const hpRatio = structure.hp / structure.maxHp;
  const laneIds = state.map.lanes.map((lane) => lane.id);
  for (const side of [-1, 1]) {
    const screenSide = structure.team === TEAM.PLAYER ? side : -side;
    const laneId = laneIds.length === 1 ? laneIds[0] : screenSide < 0 ? LANE.LEFT : LANE.RIGHT;
    const deployedAt = model.director?.lastDeploymentAtFor(structure.team, laneId);
    const delay = screenSide > 0 ? 0.07 : 0;
    const animationAt = Number.isFinite(deployedAt) ? deployedAt + delay : null;
    drawHqBay(ctx, side, hqDoorOpenness(state.time, animationAt), frameTime, color, hpRatio);
  }
};

const drawStructureUpgradeDetails = (ctx, structure, model, size, color) => {
  const economy = model.economy?.get(structure.team);
  if (!economy) return;
  if (structure.structureType === "hq") {
    if (economy.economyLevel > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.28 + economy.economyLevel * 0.12;
      ctx.fillStyle = "#f3c47e";
      ctx.beginPath();
      ctx.arc(0, 3, 8 + economy.economyLevel * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      for (let index = 0; index < economy.economyLevel; index += 1) {
        ctx.fillStyle = "#f4cf8f";
        ctx.fillRect(-5 + index * 7, size * 0.29, 4, 2);
      }
    }
    for (let index = 0; index < economy.logisticsLevel; index += 1) {
      const offset = 39 + index * 7;
      ctx.fillStyle = "#ffd69b";
      ctx.globalAlpha = 0.72;
      ctx.fillRect(-offset, -31, 3, 3);
      ctx.fillRect(offset - 3, -31, 3, 3);
    }
    ctx.globalAlpha = 1;
    return;
  }
  for (let index = 0; index < economy.turretLevel; index += 1) {
    const side = index % 2 ? 1 : -1;
    const row = Math.floor(index / 2);
    ctx.fillStyle = "rgba(239, 193, 119, 0.82)";
    ctx.fillRect(side * (22 + row * 3) - 3, 11 - row * 8, 6, 5);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.strokeRect(side * (22 + row * 3) - 4, 10 - row * 8, 8, 7);
  }
  ctx.globalAlpha = 1;
};

const drawStructure = (ctx, structure, model, projection) => {
  const state = model.simulation.state;
  const isHq = structure.structureType === "hq";
  const gardenHq = isHq && state.map.visualTheme === "orbital_garden";
  const gardenTurret = !isHq && state.map.visualTheme === "orbital_garden";
  const size = gardenHq ? 230 : gardenTurret ? 94 : isHq ? 128 : 74;
  const spriteWidth = gardenHq ? 330 : size;
  const spriteHeight = gardenHq ? 227 : size;
  const color = teamColor(structure.team);
  const sprite = asset(model.assets, gardenHq ? "structure-hq-garden" : gardenTurret ? "structure-turret-garden" : isHq ? "structure-hq" : "structure-turret");
  const damaged = state.time - structure.lastDamagedAt < 0.13;
  const hpRatio = structure.hp / structure.maxHp;
  const y = projection.y(structure.y);
  ctx.save();
  ctx.translate(structure.x, y);
  if (isHq && structure.team !== "TEAM_PLAYER") ctx.rotate(Math.PI);
  if (sprite) {
    if (damaged) ctx.filter = "brightness(1.9) saturate(0.4)";
    else if (hpRatio <= 0.34) ctx.filter = "brightness(0.72) saturate(0.52)";
    else if (hpRatio <= 0.67) ctx.filter = "brightness(0.88) saturate(0.76)";
    if (gardenHq || gardenTurret) ctx.globalCompositeOperation = "screen";
    ctx.drawImage(sprite, -spriteWidth / 2, -spriteHeight / 2, spriteWidth, spriteHeight);
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
  }
  if (gardenHq) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.48;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 8, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.86;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 8, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (gardenTurret) {
    ctx.globalAlpha = 0.88;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = color;
    for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 39, Math.sin(angle) * 39, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  drawStructureUpgradeDetails(ctx, structure, model, size, color);
  if (isHq) drawHqHangars(ctx, structure, model, model.frameTime, color);
  else drawTurretHead(ctx, structure, state, model.assets, projection, color);
  drawDamageDetails(ctx, structure, size, hpRatio, model.frameTime);
  ctx.restore();
  drawBar(ctx, structure.x, y + size * 0.45, isHq ? 84 : 50, hpRatio, color, isHq ? 5 : 4);
};

const drawNode = (ctx, node, frameTime, assets, projection, visualTheme) => {
  const color = node.ownerTeam === "TEAM_PLAYER" ? "#a6e6f2" : node.ownerTeam === "TEAM_ENEMY" ? "#f3a58e" : "#d9d5ee";
  const sunwell = visualTheme === "orbital_garden";
  const sprite = asset(assets, sunwell ? "structure-node-sunwell" : "structure-node");
  const y = projection.y(node.y);
  ctx.save();
  ctx.translate(node.x, y);
  const auraRadius = sunwell ? 104 : 46;
  const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, auraRadius);
  aura.addColorStop(0, node.ownerTeam ? `${color}35` : "rgba(235,199,139,0.22)");
  aura.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
  ctx.fill();
  if (sprite) {
    ctx.globalCompositeOperation = "screen";
    if (sunwell) ctx.drawImage(sprite, -128, -106, 256, 212);
    else ctx.drawImage(sprite, -29, -29, 58, 58);
    ctx.globalCompositeOperation = "source-over";
  }
  else { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); }
  const progress = Math.min(1, Math.abs(node.progress) / 100);
  const progressColor = node.progress > 0 ? "#a6e6f2" : node.progress < 0 ? "#f3a58e" : color;
  ctx.fillStyle = "rgba(7,15,28,0.72)";
  const barY = sunwell ? 108 : 24;
  const barWidth = sunwell ? 92 : 42;
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
  const assets = model.assets;
  const definition = PROJECTILE_DEFINITIONS[projectile.projectileType] ?? PROJECTILE_DEFINITIONS.light_bolt;
  const visual = projectileVisualFor(projectile.ownerTeam, projectile.projectileType);
  const x = projectile.x;
  const y = projection.y(projectile.y);
  const angle = Math.atan2(projection.velocityY(projectile.vy), projectile.vx);
  const color = projectile.ownerTeam === "TEAM_PLAYER" ? definition.color : (definition.visual === "missile" ? "#f5a17e" : "#f3a28d");
  const economy = model.economy?.get(projectile.ownerTeam);
  const techLevel = projectile.ownerId?.includes("turret") ? economy?.turretLevel ?? 0
    : projectile.ownerId?.includes("hq") ? 0 : economy?.weaponLevel ?? 0;
  ctx.save();
  ctx.lineCap = "round";
  if (visual?.trail && projectile.trail?.length) {
    ctx.strokeStyle = projectile.ownerTeam === "TEAM_PLAYER" ? "#a8eaf3" : "#f0ad95";
    ctx.lineWidth = (visual.trail === "heavy" ? 2.4 : 3) + techLevel * 0.35;
    ctx.globalAlpha = (visual.trail === "heavy" ? 0.26 : 0.42) + techLevel * 0.06;
    ctx.beginPath();
    projectile.trail.forEach((point, index) => {
      const pointY = projection.y(point.y);
      if (index === 0) ctx.moveTo(point.x, pointY); else ctx.lineTo(point.x, pointY);
    });
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  const sprite = visual ? asset(assets, visual.assetKey) : null;
  if (visual && sprite) {
    const frame = Math.floor(projectile.age * visual.fps) % visual.frameCount;
    const techScale = 1 + techLevel * 0.08;
    ctx.translate(x, y);
    ctx.rotate(angle + visual.rotationOffset);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(sprite, frame * visual.frameWidth, 0, visual.frameWidth, visual.frameHeight, -visual.width * techScale / 2, -visual.height * techScale / 2, visual.width * techScale, visual.height * techScale);
  } else if (definition.visual === "missile") {
    ctx.globalAlpha = 1;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(7, 0); ctx.lineTo(-5, -3); ctx.lineTo(-3, 0); ctx.lineTo(-5, 3); ctx.closePath();
    ctx.fill();
  } else {
    const length = definition.visual === "laser" ? 12 : definition.visual === "heavy" ? 9 : 6;
    ctx.strokeStyle = color;
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
    const fleetScale = simulation.state.map.visualTheme === "orbital_garden" ? 1.28 : 1;
    const size = unitSize(unit.unitType) * fleetScale;
    const sprite = asset(model.assets, factionKey(unit));
    const visual = fleetVisualFor(unit.team, unit.unitType);
    const frameSize = visual?.frameSize ?? 64;
    const displaySize = shipCellSize(unit.unitType, frameSize) * fleetScale;
    const heading = Number.isFinite(unit.heading) ? unit.heading : (unit.team === TEAM.PLAYER ? -Math.PI / 2 : Math.PI / 2);
    const renderRotation = heading + Math.PI / 2;
    const pulse = 0.8 + Math.sin(model.frameTime * 7 + unit.x) * 0.12;
    const y = projection.y(unit.y);
    const launchProgress = unit.launching ? Math.min(1, Math.max(0, unit.launchElapsed / unit.launchDuration)) : 1;
    ctx.save();
    ctx.globalAlpha = 0.28 * pulse;
    ctx.fillStyle = teamColor(unit.team);
    ctx.beginPath();
    const exhaustX = unit.x - Math.cos(heading) * size * 0.37;
    const exhaustY = y - Math.sin(heading) * size * 0.37;
    ctx.ellipse(exhaustX, exhaustY, Math.max(2, size * 0.1), size * 0.28 * pulse, renderRotation, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(unit.x, y);
    ctx.globalAlpha = 0.62 + launchProgress * 0.38;
    ctx.scale(0.78 + launchProgress * 0.22, 0.78 + launchProgress * 0.22);
    ctx.rotate(renderRotation);
    if (simulation.state.time - unit.lastDamagedAt < 0.12) ctx.filter = "brightness(2.2) saturate(0.35)";
    ctx.globalCompositeOperation = "screen";
    if (visual?.engine) drawStripFrame(ctx, asset(model.assets, visual.engine.assetKey), visual.engine, frameSize, simulation.state.time, displaySize);
    ctx.globalCompositeOperation = "source-over";
    if (sprite) {
      ctx.drawImage(sprite, 0, 0, frameSize, frameSize, -displaySize / 2, -displaySize / 2, displaySize, displaySize);
    }
    else { ctx.fillStyle = teamColor(unit.team); ctx.beginPath(); ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2); ctx.fill(); }
    const weaponLevel = model.economy?.get(unit.team).weaponLevel ?? 0;
    if (weaponLevel > 0) {
      ctx.fillStyle = "#f4ca82";
      ctx.globalAlpha = 0.72;
      for (let index = 0; index < weaponLevel; index += 1) {
        const offset = (index - (weaponLevel - 1) / 2) * 5;
        ctx.fillRect(offset - 1.5, -size * 0.34, 3, 2);
      }
      ctx.globalAlpha = 1;
    }
    if (visual?.weapon) drawTimedStrip(ctx, asset(model.assets, visual.weapon.assetKey), visual.weapon, frameSize, simulation.state.time - unit.lastShotAt, displaySize, 0.42);
    if (visual?.shield) drawTimedStrip(ctx, asset(model.assets, visual.shield.assetKey), visual.shield, frameSize, simulation.state.time - unit.lastDamagedAt, displaySize, unit.unitType === "frigate" ? 0.82 : 0.62);
    const damageAge = simulation.state.time - unit.lastDamagedAt;
    if ((unit.unitType === "frigate" || unit.unitType === "bomber") && damageAge >= 0 && damageAge < 0.34) {
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = (1 - damageAge / 0.34) * 0.72;
      ctx.strokeStyle = teamColor(unit.team);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.48, size * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
    const hpRatio = unit.hp / unit.maxHp;
    if (hpRatio < 0.75 || simulation.state.time - unit.lastDamagedAt < 1.8) drawBar(ctx, unit.x, y + size * 0.52, size * 0.82, hpRatio, teamColor(unit.team));
  }
  for (const projectile of projectiles.values()) if (visible(projectile.y, 50)) drawProjectile(ctx, projectile, projection, model);
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
      ctx.fillStyle = "#fff4cf";
      ctx.beginPath();
      ctx.arc(effect.x, y, 2 + progress * 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (effect.type === "hit") {
      ctx.strokeStyle = effect.projectileType === "siege_missile" ? "#ffd096" : "#f7f4d7";
      ctx.lineWidth = 1.6;
      const count = effect.projectileType === "siege_missile" ? 9 : 6;
      for (let index = 0; index < count; index += 1) {
        const angle = seededAngle(effect.seed, index);
        const inner = 2 + progress * 3;
        const outer = inner + 5 + progress * (effect.projectileType === "siege_missile" ? 12 : 6);
        ctx.beginPath();
        ctx.moveTo(effect.x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
        ctx.lineTo(effect.x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
        ctx.stroke();
      }
      if (effect.projectileType === "siege_missile") {
        ctx.strokeStyle = "#f2aa7c";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(effect.x, y, 5 + progress * 18, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      const radius = effect.scale * (6 + progress * 24);
      const visual = fleetVisualFor(effect.team, effect.entityType);
      const destructionImage = visual?.destruction ? asset(model.assets, visual.destruction.assetKey) : null;
      if (destructionImage) {
        const displaySize = shipCellSize(effect.entityType, visual.frameSize);
        ctx.save();
        ctx.translate(effect.x, y);
        if (Number.isFinite(effect.heading)) ctx.rotate(effect.heading + Math.PI / 2);
        else if (effect.team !== "TEAM_PLAYER") ctx.rotate(Math.PI);
        ctx.globalCompositeOperation = "screen";
        drawStripFrame(ctx, destructionImage, visual.destruction, visual.frameSize, effect.maxLife - effect.life, displaySize, false);
        ctx.restore();
      }
      const gradient = ctx.createRadialGradient(effect.x, y, 0, effect.x, y, radius);
      gradient.addColorStop(0, "rgba(255,247,207,0.95)");
      gradient.addColorStop(0.3, effect.entityType === "frigate" || effect.entityType === "hq" || effect.entityType === "turret" ? "rgba(244,164,111,0.72)" : `${color}aa`);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(effect.x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `${color}aa`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(effect.x, y, radius * 0.72, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
};
