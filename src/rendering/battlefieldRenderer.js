import { PROJECTILE_DEFINITIONS } from "../data/definitions.js";
import { fleetVisualFor, projectileVisualFor } from "../data/visuals.js";

const stars = Object.freeze([
  [28, 74, 1.2], [96, 122, 0.7], [178, 56, 1], [238, 176, 0.8], [362, 98, 1.3],
  [74, 340, 0.9], [148, 448, 1.1], [286, 356, 0.7], [388, 510, 1], [202, 632, 0.9],
  [42, 568, 0.7], [332, 628, 1.2], [188, 286, 0.6], [402, 406, 0.8],
]);

const asset = (assets, key) => assets?.get(key) ?? null;
const teamColor = (team) => (team === "TEAM_PLAYER" ? "#86dff2" : "#f29a83");
const factionKey = (unit) => `${unit.team === "TEAM_PLAYER" ? "nairan" : "klaed"}-${unit.unitType}`;
const unitSize = (unitType) => ({ scout: 23, fighter: 28, bomber: 34, frigate: 44, battlecruiser: 56, dreadnought: 70 }[unitType] ?? 28);
const shipCrop = (unitType) => ({
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

const battlefieldProjection = (height) => {
  const sourceTop = 102;
  const sourceBottom = 590;
  const targetBottom = height - 170;
  const scaleY = (targetBottom - sourceTop) / (sourceBottom - sourceTop);
  return Object.freeze({
    y: (value) => sourceTop + (value - sourceTop) * scaleY,
    velocityY: (value) => value * scaleY,
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
  radialWash(ctx, 62 + Math.sin(frameTime * 0.035) * 8, 236, 250, "rgba(75,156,185,0.18)");
  radialWash(ctx, 358 + Math.cos(frameTime * 0.03) * 7, 430, 270, "rgba(133,112,184,0.17)");
  radialWash(ctx, 212, 90, 210, "rgba(90,153,199,0.12)");
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
    ctx.fillStyle = radius > 1 ? "#edf9ff" : "#c7dff4";
    ctx.beginPath();
    ctx.arc(x, driftY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

export const renderBattlefieldLayer = (ctx, width, height) => {
  const top = 102;
  const bottom = height - 170;
  const fade = ctx.createLinearGradient(0, top, 0, bottom);
  fade.addColorStop(0, "rgba(202,224,239,0)");
  fade.addColorStop(0.16, "rgba(202,224,239,0.045)");
  fade.addColorStop(0.84, "rgba(202,224,239,0.045)");
  fade.addColorStop(1, "rgba(202,224,239,0)");
  ctx.strokeStyle = fade;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 22]);
  for (const center of [112, 308]) {
    ctx.beginPath();
    ctx.moveTo(center, top + 28);
    ctx.lineTo(center, bottom - 28);
    ctx.stroke();
  }
  ctx.setLineDash([2, 18]);
  ctx.strokeStyle = "rgba(211,231,246,0.025)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2, top + 20);
  ctx.lineTo(width / 2, bottom - 20);
  ctx.stroke();
  ctx.setLineDash([]);
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

const drawTurretHead = (ctx, structure, state, projection, color) => {
  const target = state.units.get(structure.targetId);
  const defaultAngle = structure.team === "TEAM_PLAYER" ? -Math.PI / 2 : Math.PI / 2;
  const desiredAngle = target?.alive
    ? Math.atan2(projection.y(target.y) - projection.y(structure.y), target.x - structure.x)
    : defaultAngle;
  const angle = smoothAimAngle(structure, desiredAngle, state.time);
  const shotAge = state.time - structure.lastShotAt;
  const recoil = shotAge >= 0 && shotAge < 0.16 ? Math.sin(shotAge / 0.16 * Math.PI) * 3.5 : 0;
  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle = "rgba(5,12,23,0.72)";
  ctx.fillRect(-7, -7, 15, 14);
  ctx.fillStyle = "#7c8da3";
  ctx.fillRect(-5, -6, 12, 12);
  ctx.fillStyle = "#b8c5d1";
  ctx.fillRect(5 - recoil, -5, 19, 3.5);
  ctx.fillRect(5 - recoil, 1.5, 19, 3.5);
  ctx.fillStyle = "#3d5068";
  ctx.fillRect(9 - recoil, -4, 11, 1);
  ctx.fillRect(9 - recoil, 2.5, 11, 1);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.78;
  ctx.fillRect(-3, -1.5, 7, 3);
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

const drawHqHangars = (ctx, structure, state, frameTime, lastDeploymentAt, color) => {
  const hpRatio = structure.hp / structure.maxHp;
  drawHqBay(ctx, -1, hqDoorOpenness(state.time, lastDeploymentAt), frameTime, color, hpRatio);
  drawHqBay(ctx, 1, hqDoorOpenness(state.time, lastDeploymentAt + 0.07), frameTime, color, hpRatio);
};

const drawStructure = (ctx, structure, model, projection) => {
  const state = model.simulation.state;
  const isHq = structure.structureType === "hq";
  const size = isHq ? 112 : 64;
  const color = teamColor(structure.team);
  const sprite = asset(model.assets, isHq ? "structure-hq" : "structure-turret");
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
    ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    ctx.filter = "none";
  }
  if (isHq) drawHqHangars(ctx, structure, state, model.frameTime, model.director?.lastDeploymentAt, color);
  else drawTurretHead(ctx, structure, state, projection, color);
  drawDamageDetails(ctx, structure, size, hpRatio, model.frameTime);
  ctx.restore();
  drawBar(ctx, structure.x, y + size * 0.45, isHq ? 84 : 50, hpRatio, color, isHq ? 5 : 4);
};

const drawNode = (ctx, node, frameTime, assets, projection) => {
  const color = node.ownerTeam === "TEAM_PLAYER" ? "#a6e6f2" : node.ownerTeam === "TEAM_ENEMY" ? "#f3a58e" : "#d9d5ee";
  const sprite = asset(assets, "structure-node");
  const y = projection.y(node.y);
  ctx.save();
  ctx.translate(node.x, y);
  if (sprite) {
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(sprite, -25, -25, 50, 50);
    ctx.globalCompositeOperation = "source-over";
  }
  else { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); }
  const progress = Math.min(1, Math.abs(node.progress) / 100);
  const progressColor = node.progress > 0 ? "#a6e6f2" : node.progress < 0 ? "#f3a58e" : color;
  ctx.fillStyle = "rgba(7,15,28,0.72)";
  ctx.fillRect(-21, 24, 42, 3);
  ctx.fillStyle = progressColor;
  ctx.globalAlpha = 0.82;
  ctx.fillRect(-20, 25, 40 * progress, 1.5);
  if (node.contested) {
    ctx.globalAlpha = 0.5 + Math.sin(frameTime * 6) * 0.18;
    ctx.fillStyle = "#f2cd83";
    ctx.fillRect(-5, -28, 10, 2);
    ctx.fillRect(-5, 27, 10, 2);
  }
  ctx.restore();
};

const drawProjectile = (ctx, projectile, projection, assets) => {
  const definition = PROJECTILE_DEFINITIONS[projectile.projectileType] ?? PROJECTILE_DEFINITIONS.light_bolt;
  const visual = projectileVisualFor(projectile.ownerTeam, projectile.projectileType);
  const x = projectile.x;
  const y = projection.y(projectile.y);
  const angle = Math.atan2(projection.velocityY(projectile.vy), projectile.vx);
  const color = projectile.ownerTeam === "TEAM_PLAYER" ? definition.color : (definition.visual === "missile" ? "#f5a17e" : "#f3a28d");
  ctx.save();
  ctx.lineCap = "round";
  if (visual?.trail && projectile.trail?.length) {
    ctx.strokeStyle = projectile.ownerTeam === "TEAM_PLAYER" ? "#a8eaf3" : "#f0ad95";
    ctx.lineWidth = visual.trail === "heavy" ? 2.4 : 3;
    ctx.globalAlpha = visual.trail === "heavy" ? 0.26 : 0.42;
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
    ctx.translate(x, y);
    ctx.rotate(angle + visual.rotationOffset);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(sprite, frame * visual.frameWidth, 0, visual.frameWidth, visual.frameHeight, -visual.width / 2, -visual.height / 2, visual.width, visual.height);
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
    ctx.lineWidth = definition.visual === "heavy" ? 4 : 2.4;
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
  const projection = battlefieldProjection(model.height);
  for (const node of nodes.values()) drawNode(ctx, node, model.frameTime, model.assets, projection);
  for (const structure of structures.values()) {
    ctx.globalAlpha = structure.alive ? 1 : 0.16;
    drawStructure(ctx, structure, model, projection);
  }
  ctx.globalAlpha = 1;
  for (const unit of units.values()) {
    const size = unitSize(unit.unitType);
    const sprite = asset(model.assets, factionKey(unit));
    const visual = fleetVisualFor(unit.team, unit.unitType);
    const frameSize = visual?.frameSize ?? 64;
    const displaySize = shipCellSize(unit.unitType, frameSize);
    const engineDirection = unit.team === "TEAM_PLAYER" ? 1 : -1;
    const pulse = 0.8 + Math.sin(model.frameTime * 7 + unit.x) * 0.12;
    const y = projection.y(unit.y);
    ctx.save();
    ctx.globalAlpha = 0.28 * pulse;
    ctx.fillStyle = teamColor(unit.team);
    ctx.beginPath();
    ctx.ellipse(unit.x, y + engineDirection * size * 0.37, Math.max(2, size * 0.1), size * 0.28 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(unit.x, y);
    if (unit.team !== "TEAM_PLAYER") ctx.rotate(Math.PI);
    if (simulation.state.time - unit.lastDamagedAt < 0.12) ctx.filter = "brightness(2.2) saturate(0.35)";
    ctx.globalCompositeOperation = "screen";
    if (visual?.engine) drawStripFrame(ctx, asset(model.assets, visual.engine.assetKey), visual.engine, frameSize, simulation.state.time, displaySize);
    if (sprite) {
      ctx.drawImage(sprite, 0, 0, frameSize, frameSize, -displaySize / 2, -displaySize / 2, displaySize, displaySize);
    }
    else { ctx.fillStyle = teamColor(unit.team); ctx.beginPath(); ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2); ctx.fill(); }
    if (visual?.weapon) drawTimedStrip(ctx, asset(model.assets, visual.weapon.assetKey), visual.weapon, frameSize, simulation.state.time - unit.lastShotAt, displaySize, 0.42);
    if (visual?.shield) drawTimedStrip(ctx, asset(model.assets, visual.shield.assetKey), visual.shield, frameSize, simulation.state.time - unit.lastDamagedAt, displaySize, 0.5);
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
    const hpRatio = unit.hp / unit.maxHp;
    if (hpRatio < 0.75 || simulation.state.time - unit.lastDamagedAt < 1.8) drawBar(ctx, unit.x, y + size * 0.52, size * 0.82, hpRatio, teamColor(unit.team));
  }
  for (const projectile of projectiles.values()) drawProjectile(ctx, projectile, projection, model.assets);
};

const seededAngle = (seed, index) => ((seed * 2.17 + index * 2.399) % (Math.PI * 2));

export const renderEffectsLayer = (ctx, model) => {
  const projection = battlefieldProjection(model.height);
  for (const effect of model.effects ?? []) {
    const progress = 1 - effect.life / effect.maxLife;
    const alpha = Math.max(0, 1 - progress);
    const color = teamColor(effect.team);
    const y = projection.y(effect.y);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (effect.type === "muzzle") {
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
        if (effect.team !== "TEAM_PLAYER") ctx.rotate(Math.PI);
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
