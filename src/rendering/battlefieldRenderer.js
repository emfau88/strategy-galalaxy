const stars = Object.freeze([
  [28, 74, 1.2], [96, 122, 0.7], [178, 56, 1], [238, 176, 0.8], [362, 98, 1.3],
  [74, 340, 0.9], [148, 448, 1.1], [286, 356, 0.7], [388, 510, 1], [202, 632, 0.9],
]);

const asset = (assets, key) => assets?.get(key) ?? null;

export const renderBackground = (ctx, width, height, frameTime, assets) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#102b58");
  gradient.addColorStop(0.52, "#081b3a");
  gradient.addColorStop(1, "#050d20");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const voidLayer = asset(assets, "background-void");
  const starLayer = asset(assets, "background-stars");
  const planet = asset(assets, "background-planet");
  const asteroid = asset(assets, "background-asteroid");
  if (voidLayer) ctx.drawImage(voidLayer, 0, 0, width, height);
  if (starLayer) {
    ctx.globalAlpha = 0.34;
    ctx.drawImage(starLayer, 0, 0, width, height);
  }
  if (planet) {
    ctx.globalAlpha = 0.17;
    ctx.drawImage(planet, -78, 268, 174, 174);
  }
  if (asteroid) {
    ctx.globalAlpha = 0.24;
    ctx.drawImage(asteroid, width - 75, 290, 58, 58);
  }
  ctx.globalAlpha = 1;

  for (const [x, y, radius] of stars) {
    ctx.globalAlpha = 0.42 + Math.sin(frameTime * 1.6 + x) * 0.18;
    ctx.fillStyle = "#c7eaff";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

export const renderBattlefieldLayer = (ctx, width, height) => {
  const laneTop = 152;
  const laneBottom = height - 128;
  ctx.strokeStyle = "rgba(126, 207, 255, 0.18)";
  ctx.lineWidth = 1.5;
  for (const x of [width * 0.29, width * 0.71]) {
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
const unitSize = (unitType) => ({ scout: 22, fighter: 27, bomber: 31, frigate: 37 }[unitType] ?? 28);

const drawBar = (ctx, x, y, width, ratio, color) => {
  ctx.fillStyle = "rgba(3, 10, 23, 0.72)";
  ctx.fillRect(x - width / 2, y, width, 3);
  ctx.fillStyle = color;
  ctx.fillRect(x - width / 2, y, width * Math.max(0, ratio), 3);
};

const drawStructure = (ctx, structure) => {
  const radius = structure.structureType === "hq" ? 27 : 18;
  const color = teamColor(structure.team);
  ctx.save();
  ctx.translate(structure.x, structure.y);
  ctx.rotate(structure.structureType === "hq" ? Math.PI / 4 : 0);
  ctx.fillStyle = structure.structureType === "hq" ? "#112947" : "#173858";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (structure.structureType === "hq") ctx.rect(-radius * 0.72, -radius * 0.72, radius * 1.44, radius * 1.44);
  else if (ctx.roundRect) ctx.roundRect(-radius, -radius * 0.62, radius * 2, radius * 1.24, 5);
  else ctx.rect(-radius, -radius * 0.62, radius * 2, radius * 1.24);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  drawBar(ctx, structure.x, structure.y + radius + 6, structure.structureType === "hq" ? 48 : 32, structure.hp / structure.maxHp, color);
};

export const renderEntityLayer = (ctx, model) => {
  const simulation = model.simulation;
  if (!simulation) return;
  const { nodes, structures, units, projectiles } = simulation.state;
  for (const node of nodes.values()) {
    const color = node.ownerTeam === "TEAM_PLAYER" ? "#6fddff" : node.ownerTeam === "TEAM_ENEMY" ? "#ff958f" : "#d5dce9";
    ctx.fillStyle = `${color}33`;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = node.contested ? "#ffd37f" : color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(node.x, node.y, 12, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const structure of structures.values()) {
    ctx.globalAlpha = structure.alive ? 1 : 0.22;
    drawStructure(ctx, structure);
  }
  for (const unit of units.values()) {
    const size = unitSize(unit.unitType);
    const sprite = asset(model.assets, factionKey(unit));
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
