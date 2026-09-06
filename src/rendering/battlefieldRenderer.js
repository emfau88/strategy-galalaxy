const stars = Object.freeze([
  [28, 74, 1.2], [96, 122, 0.7], [178, 56, 1], [238, 176, 0.8], [362, 98, 1.3],
  [74, 340, 0.9], [148, 448, 1.1], [286, 356, 0.7], [388, 510, 1], [202, 632, 0.9],
]);

const asset = (assets, key) => assets?.get(key) ?? null;

export const renderBackground = (ctx, width, height, frameTime, assets) => {
  const generatedBackground = asset(assets, "background-placeholder");
  if (generatedBackground) {
    ctx.drawImage(generatedBackground, 0, 0, width, height);
    return;
  }
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#0a1730");
  gradient.addColorStop(0.52, "#071228");
  gradient.addColorStop(1, "#050b19");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const starLayer = asset(assets, "background-stars");
  const planet = asset(assets, "background-planet");
  if (starLayer) {
    ctx.globalAlpha = 0.07;
    ctx.drawImage(starLayer, 0, 0, width, height);
  }
  if (planet) {
    ctx.globalAlpha = 0.07;
    ctx.drawImage(planet, width - 104, 544, 148, 148);
  }
  ctx.globalAlpha = 1;

  for (const [x, y, radius] of stars) {
    ctx.globalAlpha = 0.22 + Math.sin(frameTime * 1.1 + x) * 0.05;
    ctx.fillStyle = "#c7eaff";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

export const renderBattlefieldLayer = (ctx, width, height) => {
  const laneTop = 108;
  const laneBottom = height - 164;
  ctx.strokeStyle = "rgba(126, 207, 255, 0.18)";
  ctx.lineWidth = 1.5;
  for (const x of [112, 308]) {
    ctx.beginPath();
    ctx.moveTo(x, laneTop);
    ctx.lineTo(x, laneBottom);
    ctx.stroke();
  }
  ctx.setLineDash([6, 9]);
  ctx.strokeStyle = "rgba(175, 227, 255, 0.1)";
  ctx.beginPath();
  ctx.moveTo(width / 2, laneTop);
  ctx.lineTo(width / 2, laneBottom);
  ctx.stroke();
  ctx.setLineDash([]);
};

const teamColor = (team) => (team === "TEAM_PLAYER" ? "#6fddff" : "#ff958f");
const factionKey = (unit) => `${unit.team === "TEAM_PLAYER" ? "nairan" : "klaed"}-${unit.unitType}`;
const unitSize = (unitType) => ({ scout: 44, fighter: 54, bomber: 62, frigate: 74 }[unitType] ?? 56);

const drawBar = (ctx, x, y, width, ratio, color) => {
  ctx.fillStyle = "rgba(3, 10, 23, 0.72)";
  ctx.fillRect(x - width / 2, y, width, 3);
  ctx.fillStyle = color;
  ctx.fillRect(x - width / 2, y, width * Math.max(0, ratio), 3);
};

const clipPolygon = (ctx, radius, sides = 8) => {
  ctx.beginPath();
  for (let index = 0; index < sides; index += 1) {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / sides;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
};

const drawStructure = (ctx, structure, assets) => {
  const radius = structure.structureType === "hq" ? 32 : 23;
  const color = teamColor(structure.team);
  const sprite = asset(assets, structure.structureType === "hq" ? "structure-hq" : "structure-turret");
  ctx.save();
  ctx.translate(structure.x, structure.y);
  ctx.fillStyle = `${color}22`;
  ctx.beginPath();
  ctx.arc(0, 0, radius + 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  clipPolygon(ctx, radius, structure.structureType === "hq" ? 8 : 6);
  ctx.clip();
  if (sprite) {
    if (structure.team !== "TEAM_PLAYER") ctx.rotate(Math.PI);
    ctx.drawImage(sprite, -radius, -radius, radius * 2, radius * 2);
  } else {
    ctx.fillStyle = "#173858";
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  }
  ctx.restore();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  clipPolygon(ctx, radius, structure.structureType === "hq" ? 8 : 6);
  ctx.stroke();
  ctx.restore();
  drawBar(ctx, structure.x, structure.y + radius + 5, structure.structureType === "hq" ? 54 : 38, structure.hp / structure.maxHp, color);
};

export const renderEntityLayer = (ctx, model) => {
  const simulation = model.simulation;
  if (!simulation) return;
  const { nodes, structures, units, projectiles } = simulation.state;
  for (const node of nodes.values()) {
    const color = node.ownerTeam === "TEAM_PLAYER" ? "#6fddff" : node.ownerTeam === "TEAM_ENEMY" ? "#ff958f" : "#d5dce9";
    const sprite = asset(model.assets, "structure-node");
    ctx.fillStyle = `${color}22`;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(node.x, node.y);
    ctx.save();
    clipPolygon(ctx, 22, 6);
    ctx.clip();
    if (sprite) ctx.drawImage(sprite, -22, -22, 44, 44);
    ctx.restore();
    ctx.strokeStyle = node.contested ? "#ffd37f" : color;
    ctx.lineWidth = 2;
    clipPolygon(ctx, 22, 6);
    ctx.stroke();
    ctx.restore();
  }
  for (const structure of structures.values()) {
    ctx.globalAlpha = structure.alive ? 1 : 0.22;
    drawStructure(ctx, structure, model.assets);
  }
  for (const unit of units.values()) {
    const size = unitSize(unit.unitType);
    const sprite = asset(model.assets, factionKey(unit));
    const engineDirection = unit.team === "TEAM_PLAYER" ? 1 : -1;
    const pulse = 0.72 + Math.sin(model.frameTime * 7 + unit.x) * 0.16;
    ctx.save();
    ctx.globalAlpha = 0.3 * pulse;
    ctx.fillStyle = teamColor(unit.team);
    ctx.beginPath();
    ctx.ellipse(unit.x, unit.y + engineDirection * size * 0.34, size * 0.18, size * 0.32 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(unit.x, unit.y);
    if (unit.team !== "TEAM_PLAYER") ctx.rotate(Math.PI);
    if (sprite) ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    else {
      ctx.fillStyle = teamColor(unit.team);
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    drawBar(ctx, unit.x, unit.y + size * 0.55, size * 0.82, unit.hp / unit.maxHp, teamColor(unit.team));
  }
  for (const projectile of projectiles.values()) {
    const sprite = asset(model.assets, projectile.ownerTeam === "TEAM_PLAYER" ? "nairan-bolt" : "klaed-bullet");
    const angle = Math.atan2(projectile.vy, projectile.vx) + Math.PI / 2;
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(angle);
    if (sprite) ctx.drawImage(sprite, -5, -5, 10, 10);
    else {
      ctx.fillStyle = "#fff3bd";
      ctx.fillRect(-2, -2, 4, 4);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
};

export const renderEffectsLayer = (ctx, model) => {
  for (const effect of model.effects ?? []) {
    const progress = 1 - effect.life / effect.maxLife;
    const color = teamColor(effect.team);
    ctx.globalAlpha = Math.max(0, 1 - progress);
    ctx.strokeStyle = effect.type === "hit" ? "#fff0b0" : color;
    ctx.lineWidth = effect.type === "hit" ? 2 : 3;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.type === "hit" ? 4 + progress * 9 : 8 + progress * 22, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};
