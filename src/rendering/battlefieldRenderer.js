const stars = Object.freeze([
  [28, 74, 1.2], [96, 122, 0.7], [178, 56, 1], [238, 176, 0.8], [362, 98, 1.3],
  [74, 340, 0.9], [148, 448, 1.1], [286, 356, 0.7], [388, 510, 1], [202, 632, 0.9],
]);

export const renderBackground = (ctx, width, height, frameTime) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#102b58");
  gradient.addColorStop(0.52, "#081b3a");
  gradient.addColorStop(1, "#050d20");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

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
    ctx.fillStyle = structure.structureType === "hq" ? teamColor(structure.team) : "#8aaed4";
    ctx.beginPath();
    ctx.arc(structure.x, structure.y, structure.structureType === "hq" ? 24 : 15, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const unit of units.values()) {
    ctx.fillStyle = teamColor(unit.team);
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, 6 + (unit.unitType === "frigate" ? 3 : 0), 0, Math.PI * 2);
    ctx.fill();
  }
  for (const projectile of projectiles.values()) {
    ctx.fillStyle = "#fff3bd";
    ctx.fillRect(projectile.x - 2, projectile.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
};

export const renderEffectsLayer = () => {};
