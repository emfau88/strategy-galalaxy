import { PROJECTILE_DEFINITIONS } from "../data/definitions.js";

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

  const horizon = ctx.createRadialGradient(368, 718, 42, 368, 718, 164);
  horizon.addColorStop(0, "rgba(244,177,123,0.22)");
  horizon.addColorStop(0.48, "rgba(126,133,191,0.12)");
  horizon.addColorStop(0.54, "rgba(33,42,78,0.08)");
  horizon.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = horizon;
  ctx.beginPath();
  ctx.arc(368, 718, 164, Math.PI, Math.PI * 2);
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
  for (const [center, tint] of [[112, "rgba(103,190,215,0.055)"], [308, "rgba(186,137,185,0.055)"]]) {
    const gradient = ctx.createRadialGradient(center, (top + bottom) / 2, 28, center, (top + bottom) / 2, 230);
    gradient.addColorStop(0, tint.replace("0.055", "0.09"));
    gradient.addColorStop(0.7, tint);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(center - 70, top, 140, bottom - top);
  }
  ctx.setLineDash([3, 12]);
  ctx.strokeStyle = "rgba(211,231,246,0.09)";
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

const drawStructure = (ctx, structure, state, assets) => {
  const isHq = structure.structureType === "hq";
  const size = isHq ? 112 : 60;
  const color = teamColor(structure.team);
  const sprite = asset(assets, isHq ? "structure-hq" : "structure-turret");
  const damaged = state.time - structure.lastDamagedAt < 0.13;
  ctx.save();
  ctx.translate(structure.x, structure.y);
  ctx.fillStyle = `${color}18`;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.47, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `${color}88`;
  ctx.lineWidth = isHq ? 2.2 : 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.43, 0, Math.PI * 2);
  ctx.stroke();
  if (sprite) {
    if (structure.team !== "TEAM_PLAYER") ctx.rotate(Math.PI);
    if (damaged) ctx.filter = "brightness(1.9) saturate(0.4)";
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
  }
  if (!isHq) {
    const target = state.units.get(structure.targetId);
    const angle = target ? Math.atan2(target.y - structure.y, target.x - structure.x) : (structure.team === "TEAM_PLAYER" ? -Math.PI / 2 : Math.PI / 2);
    ctx.rotate(angle - (structure.team !== "TEAM_PLAYER" ? Math.PI : 0));
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(22, 0);
    ctx.stroke();
  }
  ctx.restore();
  drawBar(ctx, structure.x, structure.y + size * 0.45, isHq ? 82 : 48, structure.hp / structure.maxHp, color, isHq ? 5 : 4);
};

const drawNode = (ctx, node, frameTime, assets) => {
  const color = node.ownerTeam === "TEAM_PLAYER" ? "#a6e6f2" : node.ownerTeam === "TEAM_ENEMY" ? "#f3a58e" : "#d9d5ee";
  const ring = node.contested ? "#f2cd83" : color;
  const sprite = asset(assets, "structure-node");
  ctx.save();
  ctx.translate(node.x, node.y);
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(0, 0, node.radius + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = `${ring}99`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, node.radius - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.abs(node.progress) / 100);
  ctx.stroke();
  ctx.rotate(frameTime * 0.18);
  ctx.strokeStyle = `${ring}55`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, 29, 18, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.rotate(-frameTime * 0.32);
  if (sprite) { ctx.globalCompositeOperation = "screen"; ctx.drawImage(sprite, -27, -27, 54, 54); ctx.globalCompositeOperation = "source-over"; }
  else { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
};

const drawProjectile = (ctx, projectile) => {
  const definition = PROJECTILE_DEFINITIONS[projectile.projectileType] ?? PROJECTILE_DEFINITIONS.light_bolt;
  const angle = Math.atan2(projectile.vy, projectile.vx);
  const color = projectile.ownerTeam === "TEAM_PLAYER" ? definition.color : (definition.visual === "missile" ? "#f5a17e" : "#f3a28d");
  ctx.save();
  ctx.lineCap = "round";
  if (definition.visual === "missile") {
    ctx.globalAlpha = 0.38;
    ctx.strokeStyle = projectile.ownerTeam === "TEAM_PLAYER" ? "#9edce8" : "#edb09e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(projectile.x - Math.cos(angle) * 18, projectile.y - Math.sin(angle) * 18);
    ctx.lineTo(projectile.x, projectile.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.translate(projectile.x, projectile.y);
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
    ctx.moveTo(projectile.x - Math.cos(angle) * length, projectile.y - Math.sin(angle) * length);
    ctx.lineTo(projectile.x + Math.cos(angle) * 2, projectile.y + Math.sin(angle) * 2);
    ctx.stroke();
  }
  ctx.restore();
};

export const renderEntityLayer = (ctx, model) => {
  const simulation = model.simulation;
  if (!simulation) return;
  const { nodes, structures, units, projectiles } = simulation.state;
  for (const node of nodes.values()) drawNode(ctx, node, model.frameTime, model.assets);
  for (const structure of structures.values()) {
    ctx.globalAlpha = structure.alive ? 1 : 0.16;
    drawStructure(ctx, structure, simulation.state, model.assets);
  }
  ctx.globalAlpha = 1;
  for (const unit of units.values()) {
    const size = unitSize(unit.unitType);
    const sprite = asset(model.assets, factionKey(unit));
    const engineDirection = unit.team === "TEAM_PLAYER" ? 1 : -1;
    const pulse = 0.8 + Math.sin(model.frameTime * 7 + unit.x) * 0.12;
    ctx.save();
    ctx.globalAlpha = 0.28 * pulse;
    ctx.fillStyle = teamColor(unit.team);
    ctx.beginPath();
    ctx.ellipse(unit.x, unit.y + engineDirection * size * 0.37, Math.max(2, size * 0.1), size * 0.28 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(unit.x, unit.y);
    if (unit.team !== "TEAM_PLAYER") ctx.rotate(Math.PI);
    if (simulation.state.time - unit.lastDamagedAt < 0.12) ctx.filter = "brightness(2.2) saturate(0.35)";
    if (sprite) {
      const crop = shipCrop(unit.unitType);
      ctx.globalCompositeOperation = "screen";
      ctx.drawImage(sprite, crop.x, crop.y, crop.width, crop.height, -size / 2, -size / 2, size, size);
      ctx.globalCompositeOperation = "source-over";
    }
    else { ctx.fillStyle = teamColor(unit.team); ctx.beginPath(); ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    const hpRatio = unit.hp / unit.maxHp;
    if (hpRatio < 0.75 || simulation.state.time - unit.lastDamagedAt < 1.8) drawBar(ctx, unit.x, unit.y + size * 0.52, size * 0.82, hpRatio, teamColor(unit.team));
  }
  for (const projectile of projectiles.values()) drawProjectile(ctx, projectile);
};

const seededAngle = (seed, index) => ((seed * 2.17 + index * 2.399) % (Math.PI * 2));

export const renderEffectsLayer = (ctx, model) => {
  for (const effect of model.effects ?? []) {
    const progress = 1 - effect.life / effect.maxLife;
    const alpha = Math.max(0, 1 - progress);
    const color = teamColor(effect.team);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (effect.type === "muzzle") {
      ctx.fillStyle = "#fff4cf";
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 2 + progress * 5, 0, Math.PI * 2);
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
        ctx.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner);
        ctx.lineTo(effect.x + Math.cos(angle) * outer, effect.y + Math.sin(angle) * outer);
        ctx.stroke();
      }
      if (effect.projectileType === "siege_missile") {
        ctx.strokeStyle = "#f2aa7c";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, 5 + progress * 18, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      const radius = effect.scale * (6 + progress * 24);
      const gradient = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, radius);
      gradient.addColorStop(0, "rgba(255,247,207,0.95)");
      gradient.addColorStop(0.3, effect.entityType === "frigate" || effect.entityType === "hq" || effect.entityType === "turret" ? "rgba(244,164,111,0.72)" : `${color}aa`);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `${color}aa`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius * 0.72, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
};
