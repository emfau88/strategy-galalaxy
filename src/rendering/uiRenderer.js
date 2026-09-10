import { LANE, MATCH_STATE, TEAM } from "../core/constants.js";
import { UNIT_DEFINITIONS } from "../data/definitions.js";
import { commandUiLayout, overlayUiLayout } from "../ui/commandUi.js";
import { cameraNavigatorLayout } from "../ui/cameraUi.js";

const C = Object.freeze({
  panel: "rgba(18, 34, 53, 0.94)", outline: "rgba(244, 228, 190, 0.52)", text: "#fff8e9", muted: "#bdc9d9",
  player: "#74f2f0", enemy: "#ff927d", gold: "#ffd679", select: "rgba(47, 119, 132, 0.88)", card: "rgba(34, 65, 86, 0.96)",
});
const UPGRADE_UI = Object.freeze({
  economy: Object.freeze({ label: "REACTOR", active: "economyLevel", effect: (balance) => `+${Math.round(balance.baseIncomePerSecond * balance.economyUpgradeIncomeBonus * 10) / 10} BASE E/s` }),
  weapons: Object.freeze({ label: "ARSENAL", active: "weaponLevel", effect: (balance) => `+${Math.round(balance.weaponUpgradeDamageBonus * 100)}% FLEET DMG` }),
});
const text = (ctx, value, x, y, size, color, align = "left", weight = 700) => {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px Inter, system-ui, sans-serif`; ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillText(value, x, y);
};
const box = (ctx, rect, fill = C.panel, stroke = C.outline, radius = 8) => {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(rect.x, rect.y, rect.width, rect.height, radius); else ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
};
const commandFrame = (ctx, rect, { fill = C.panel, strong = false, radius = 10 } = {}) => {
  ctx.save();
  ctx.shadowColor = "rgba(2,8,18,0.72)";
  ctx.shadowBlur = strong ? 8 : 5;
  box(ctx, rect, fill, strong ? "rgba(255,214,121,0.86)" : "rgba(239,199,127,0.58)", radius);
  ctx.shadowBlur = 0;
  const inset = strong ? 5 : 4;
  ctx.strokeStyle = strong ? "rgba(255,244,210,0.28)" : "rgba(190,224,236,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(rect.x + inset, rect.y + inset, rect.width - inset * 2, rect.height - inset * 2, Math.max(3, radius - 4));
  else ctx.rect(rect.x + inset, rect.y + inset, rect.width - inset * 2, rect.height - inset * 2);
  ctx.stroke();
  const corner = strong ? 13 : 10;
  const offset = 2;
  ctx.strokeStyle = strong ? C.gold : "rgba(239,199,127,0.72)";
  ctx.lineWidth = strong ? 1.5 : 1;
  for (const [x, y, sx, sy] of [
    [rect.x + offset, rect.y + offset, 1, 1], [rect.x + rect.width - offset, rect.y + offset, -1, 1],
    [rect.x + offset, rect.y + rect.height - offset, 1, -1], [rect.x + rect.width - offset, rect.y + rect.height - offset, -1, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x, y + sy * corner); ctx.lineTo(x, y); ctx.lineTo(x + sx * corner, y); ctx.stroke();
  }
  if (strong) {
    for (const y of [rect.y + 1, rect.y + rect.height - 1]) {
      ctx.save(); ctx.translate(rect.x + rect.width / 2, y); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = C.gold; ctx.fillRect(-2.5, -2.5, 5, 5); ctx.restore();
    }
  }
  ctx.restore();
};
const laneName = (laneId) => (laneId === LANE.CENTER ? "MAIN" : laneId === LANE.LEFT ? "LEFT" : "RIGHT");
const laneIdsFor = (model) => model.simulation?.state.map.lanes.map((lane) => lane.id) ?? model.mapDefinition?.lanes.map((lane) => lane.id) ?? [LANE.LEFT, LANE.RIGHT];
const structure = (simulation, id) => simulation?.state.structures.get(id);
const ratio = (target) => target?.alive ? Math.max(0, target.hp / target.maxHp) : 0;
const laneStrength = (model, laneId, team) => {
  const lane = model.simulation.state.lanes.get(laneId);
  return lane.unitIds.get(team).map((id) => model.simulation.state.units.get(id)).reduce((sum, unit) => {
    const def = UNIT_DEFINITIONS[unit.unitType];
    return sum + def.maxHp * 0.08 + def.damage * 3;
  }, 0);
};

const miniBar = (ctx, x, y, width, value, color, align = "left") => {
  const start = align === "right" ? x - width : x;
  ctx.fillStyle = "rgba(214,231,240,0.14)";
  ctx.fillRect(start, y, width, 4);
  ctx.fillStyle = color;
  const fill = width * Math.max(0, Math.min(1, value));
  ctx.fillRect(align === "right" ? x - fill : x, y, fill, 4);
};

const header = (ctx, model, ui) => {
  const economy = model.economy;
  const playerHq = structure(model.simulation, "player-hq");
  const enemyHq = structure(model.simulation, "enemy-hq");
  const income = economy && model.simulation ? Math.round(economy.incomePerSecond(model.simulation.state, TEAM.PLAYER, model.activeBattleSeconds)) : 0;
  const nodeIncome = economy && model.simulation
    ? Math.round(economy.controlledNodes(model.simulation.state, TEAM.PLAYER) * economy.balance.nodeIncomePerSecond * economy.escalationMultiplier(model.activeBattleSeconds))
    : 0;
  commandFrame(ctx, { x: 8, y: 8, width: model.width - 16, height: 48 }, { fill: "rgba(13,29,47,0.96)", strong: true, radius: 10 });
  text(ctx, `YOU  ${Math.round(ratio(playerHq) * 100)}%`, 18, 22, 11, C.player);
  miniBar(ctx, 18, 31, 102, ratio(playerHq), C.player);
  const incomeLabel = model.simulation?.state.map.features?.captureNodes === false
    ? `${economy ? Math.floor(economy.get(TEAM.PLAYER).energy) : 0} E · +${income}/s`
    : `${economy ? Math.floor(economy.get(TEAM.PLAYER).energy) : 0} E · +${income}/s · NODE ${nodeIncome}`;
  text(ctx, incomeLabel, 18, 44, 8, C.text);
  text(ctx, "NEXT WAVE", 158, 22, 9, C.text, "center");
  text(ctx, `${Math.ceil(model.phaseRemaining ?? 0)}s`, 158, 42, 14, C.text, "center");
  text(ctx, `${Math.round(ratio(enemyHq) * 100)}%  RIVAL`, 300, 22, 10, C.enemy, "right");
  miniBar(ctx, 300, 31, 92, ratio(enemyHq), C.enemy, "right");
  text(ctx, "LIVE DEPLOY", 300, 44, 8, C.muted, "right", 600);
  box(ctx, { x: 308, y: 12, width: 30, height: 34 }, "rgba(36, 68, 91, 0.72)", "rgba(190,229,239,0.24)", 7);
  text(ctx, model.state === MATCH_STATE.PAUSED ? "▶" : "Ⅱ", 323, 29, 12, C.text, "center");
  box(ctx, { x: 343, y: 12, width: 30, height: 34 }, "rgba(36, 68, 91, 0.72)", "rgba(190,229,239,0.24)", 7);
  text(ctx, model.soundEnabled ? "♪" : "×", 358, 29, 13, model.soundEnabled ? C.text : C.muted, "center");
  box(ctx, ui.fullscreen, "rgba(36, 68, 91, 0.82)", "rgba(190,229,239,0.4)", 7);
  text(ctx, model.fullscreenActive ? "×" : "□", 395, 29, 16, C.text, "center");
};

const drawShipIcon = (ctx, model, unitType, x, y, size = 22) => {
  const spriteType = unitType;
  const unifiedSprite = model.assets?.get(`unified-player-${spriteType}`);
  const sprite = unifiedSprite ?? model.assets?.get(`nairan-${spriteType}`);
  const crop = { scout: [20, 23, 24, 22], fighter: [17, 20, 30, 27], bomber: [16, 18, 32, 30], frigate: [11, 9, 42, 42] }[unitType] ?? [0, 0, 64, 64];
  const unifiedCrop = {
    drone: [101, 116, 182, 190], scout: [115, 100, 155, 185],
    fighter: [68, 60, 248, 232], bomber: [78, 50, 228, 250], frigate: [105, 18, 174, 298],
  }[unitType] ?? [0, 0, 384, 384];
  if (unifiedSprite) {
    const [, , sourceWidth, sourceHeight] = unifiedCrop;
    const scale = size / Math.max(sourceWidth, sourceHeight);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    ctx.drawImage(unifiedSprite, ...unifiedCrop, x - width / 2, y - height / 2, width, height);
  }
  else if (sprite) { ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.drawImage(sprite, ...crop, x - size / 2, y - size / 2, size, size); ctx.restore(); }
  else { ctx.fillStyle = UNIT_DEFINITIONS[unitType]?.color ?? C.player; ctx.beginPath(); ctx.arc(x, y, size * 0.3, 0, Math.PI * 2); ctx.fill(); }
};

const footerLaneSelector = (ctx, model, rect) => {
  const selected = model.selectedLaneId === rect.laneId;
  const player = laneStrength(model, rect.laneId, TEAM.PLAYER);
  const enemy = laneStrength(model, rect.laneId, TEAM.ENEMY);
  const total = Math.max(1, player + enemy);
  box(ctx, rect, selected ? "rgba(47,119,132,0.82)" : "rgba(18,42,63,0.92)", selected ? C.gold : "rgba(123,185,203,0.34)", 6);
  text(ctx, laneName(rect.laneId), rect.x + rect.width / 2, rect.y + 12, 8, selected ? C.text : C.muted, "center");
  ctx.fillStyle = "rgba(224,235,242,0.16)";
  ctx.fillRect(rect.x + 6, rect.y + 26, rect.width - 12, 3);
  ctx.fillStyle = C.player;
  ctx.fillRect(rect.x + 6, rect.y + 26, (rect.width - 12) * player / total, 3);
  ctx.fillStyle = C.enemy;
  ctx.fillRect(rect.x + 6 + (rect.width - 12) * player / total, rect.y + 26, (rect.width - 12) * enemy / total, 3);
};

const strategicNavigator = (ctx, model) => {
  const camera = model.camera;
  const state = model.simulation?.state;
  if (!camera || !state) return;
  const layout = cameraNavigatorLayout(camera.viewport);
  const { track } = layout;
  const worldHeight = Math.max(1, camera.worldHeight);
  const trackY = (worldY) => track.y + Math.max(0, Math.min(1, worldY / worldHeight)) * track.height;
  const laneIds = state.map.lanes.map((lane) => lane.id);
  const laneX = (laneId) => {
    const index = Math.max(0, laneIds.indexOf(laneId));
    return laneIds.length === 1 ? track.x + track.width / 2 : track.x + 4 + index * 6;
  };

  box(ctx, { x: track.x - 3, y: track.y - 5, width: track.width + 6, height: track.height + 10 }, "rgba(8,18,34,0.68)", "rgba(178,219,234,0.2)", 7);
  ctx.strokeStyle = "rgba(210,232,241,0.22)";
  ctx.lineWidth = 1;
  for (const x of laneIds.map(laneX)) {
    ctx.beginPath();
    ctx.moveTo(x, track.y);
    ctx.lineTo(x, track.y + track.height);
    ctx.stroke();
  }

  for (const node of state.nodes.values()) {
    ctx.fillStyle = node.ownerTeam === TEAM.PLAYER ? C.player : node.ownerTeam === TEAM.ENEMY ? C.enemy : C.muted;
    ctx.globalAlpha = 0.82;
    ctx.save();
    ctx.translate(laneX(node.laneId), trackY(node.y));
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-2.2, -2.2, 4.4, 4.4);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  for (const structure of state.structures.values()) {
    const y = trackY(structure.y);
    const color = structure.team === TEAM.PLAYER ? C.player : C.enemy;
    ctx.fillStyle = color;
    ctx.globalAlpha = structure.alive ? 0.9 : 0.22;
    if (structure.structureType === "hq") ctx.fillRect(track.x + 2, y - 1.5, track.width - 4, 3);
    else {
      const x = laneX(structure.laneId);
      const direction = structure.team === TEAM.PLAYER ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(x, y + direction * -3);
      ctx.lineTo(x - 2.7, y + direction * 2.5);
      ctx.lineTo(x + 2.7, y + direction * 2.5);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  for (const laneId of laneIds) {
    const lane = state.lanes.get(laneId);
    for (const team of [TEAM.PLAYER, TEAM.ENEMY]) {
      const units = lane.unitIds.get(team).map((id) => state.units.get(id)).filter((unit) => unit?.alive);
      if (!units.length) continue;
      const averageY = units.reduce((sum, unit) => sum + unit.y, 0) / units.length;
      const radius = Math.min(4, 1.5 + Math.sqrt(units.length) * 0.45);
      ctx.fillStyle = team === TEAM.PLAYER ? C.player : C.enemy;
      const x = laneX(laneId) + (team === TEAM.PLAYER ? -1.5 : 1.5);
      const y = trackY(averageY);
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x - radius * 0.72, y - radius, radius * 1.44, radius * 2, radius * 0.72);
      else ctx.rect(x - radius * 0.7, y - radius, radius * 1.4, radius * 2);
      ctx.fill();
    }
  }

  const recentOffscreenCombat = state.events.filter((event) => (
    (event.type === "hit" || event.type === "destroyed")
    && Number.isFinite(event.time)
    && Number.isFinite(event.y)
    && state.time - event.time < 0.9
    && (event.y < camera.y || event.y > camera.y + camera.viewport.height)
  )).slice(-8);
  for (const event of recentOffscreenCombat) {
    const age = state.time - event.time;
    const progress = Math.max(0, Math.min(1, age / 0.9));
    const laneId = event.laneId ?? laneIds[Math.min(laneIds.length - 1, Math.floor(event.x / state.map.bounds.width * laneIds.length))];
    const x = laneX(laneId);
    const y = trackY(event.y);
    ctx.globalAlpha = 0.85 * (1 - progress);
    ctx.strokeStyle = event.type === "destroyed" ? C.gold : event.team === TEAM.PLAYER ? C.player : C.enemy;
    ctx.lineWidth = event.type === "destroyed" ? 2 : 1;
    ctx.beginPath();
    ctx.arc(x, y, 2.5 + progress * 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const windowTop = trackY(camera.y);
  const windowBottom = trackY(camera.y + camera.viewport.height);
  ctx.fillStyle = "rgba(255,214,121,0.055)";
  ctx.fillRect(track.x - 2, windowTop, track.width + 4, Math.max(8, windowBottom - windowTop));
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(track.x - 2, windowTop, track.width + 4, Math.max(8, windowBottom - windowTop));
};

const unitCard = (ctx, model, rect) => {
  const def = UNIT_DEFINITIONS[rect.unitType];
  const availability = model.director?.liveDeployment.availability({
    simulation: model.simulation,
    economy: model.economy,
    team: TEAM.PLAYER,
    laneId: model.selectedLaneId,
    unitType: rect.unitType,
  }) ?? { ok: false, reason: "UNAVAILABLE_UNIT" };
  box(ctx, rect, availability.ok ? C.card : "rgba(35, 45, 58, 0.82)", availability.ok ? C.outline : "rgba(132,151,166,0.2)", 8);
  const role = { scout: "SCREEN", fighter: "ANTI-LIGHT", bomber: "SIEGE", frigate: "FRONTLINE" }[rect.unitType];
  drawShipIcon(ctx, model, rect.unitType, rect.x + 24, rect.y + 25, 38);
  text(ctx, def.deploymentLabel ?? def.id.toUpperCase(), rect.x + 49, rect.y + 16, 10, availability.ok ? C.text : C.muted);
  const count = def.squadSize > 1 ? ` ×${def.squadSize}` : "";
  const detail = availability.reason === "COOLDOWN_ACTIVE"
    ? `CD ${availability.cooldownRemaining.toFixed(1)}s · ${def.cost} E`
    : availability.reason === "INSUFFICIENT_ENERGY"
      ? `NEED ${Math.ceil(availability.missingEnergy)} E · COST ${def.cost}`
      : availability.reason === "LANE_CAPACITY"
        ? `LANE FULL · NEED ${def.squadSize ?? 1} SLOTS`
        : `${role}${count} · ${def.cost} E`;
  text(ctx, detail, rect.x + 49, rect.y + 35, 8, availability.ok ? C.gold : availability.reason === "COOLDOWN_ACTIVE" ? C.enemy : C.muted, "left", 650);
  if (availability.reason === "COOLDOWN_ACTIVE") {
    const ratio = Math.max(0, Math.min(1, availability.cooldownRemaining / def.deploymentCooldownSeconds));
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(rect.x + 49, rect.y + rect.height - 5, rect.width - 58, 2);
    ctx.fillStyle = C.enemy;
    ctx.fillRect(rect.x + 49, rect.y + rect.height - 5, (rect.width - 58) * ratio, 2);
  }
};

const upgradeCard = (ctx, model, rect) => {
  const cost = model.economy.upgradeCost(TEAM.PLAYER, rect.upgradeId);
  const economy = model.economy.get(TEAM.PLAYER);
  const upgrade = UPGRADE_UI[rect.upgradeId];
  const activeKey = upgrade.active;
  const affordable = cost !== null && economy.energy >= cost;
  const level = economy[activeKey];
  box(ctx, rect, affordable ? "rgba(55, 94, 88, 0.88)" : "rgba(45, 48, 62, 0.82)", affordable ? C.outline : null, 8);
  text(ctx, upgrade.label, rect.x + 10, rect.y + 11, 9, affordable ? C.text : C.muted);
  text(ctx, upgrade.effect(model.economy.balance), rect.x + 10, rect.y + 27, 8, affordable ? C.gold : C.muted, "left", 650);
  const detail = cost === null
    ? `MAX · LV ${level}`
    : affordable ? `LV ${level} · ${cost} E · INSTANT` : `LV ${level} · NEED ${Math.ceil(cost - economy.energy)} E`;
  text(ctx, detail, rect.x + 10, rect.y + 42, 8, affordable ? C.text : C.muted, "left", 650);
};

const drawCommandMedallion = (ctx, model, x, y, size) => {
  const medallion = model.assets?.get("ui-command-medallion");
  if (medallion) ctx.drawImage(medallion, x, y, size, size);
  else {
    ctx.fillStyle = C.player;
    ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size * 0.3, 0, Math.PI * 2); ctx.fill();
  }
};

const commandSelectionLink = (ctx, model, ui) => {
  const hq = structure(model.simulation, "player-hq");
  if (!hq?.alive || !model.camera) return;
  const screenY = model.camera.viewport.y + hq.y - model.camera.y;
  if (screenY < model.camera.viewport.y - 50 || screenY > model.camera.viewport.y + model.camera.viewport.height + 50) return;
  ctx.save();
  ctx.strokeStyle = "rgba(110,255,247,0.88)";
  ctx.shadowColor = C.player; ctx.shadowBlur = 9; ctx.lineWidth = 2;
  const halfWidth = 72;
  const halfHeight = 47;
  const cornerLength = 15;
  ctx.beginPath();
  ctx.moveTo(hq.x - halfWidth, screenY - halfHeight + cornerLength);
  ctx.lineTo(hq.x - halfWidth, screenY - halfHeight);
  ctx.lineTo(hq.x - halfWidth + cornerLength, screenY - halfHeight);
  ctx.moveTo(hq.x + halfWidth - cornerLength, screenY - halfHeight);
  ctx.lineTo(hq.x + halfWidth, screenY - halfHeight);
  ctx.lineTo(hq.x + halfWidth, screenY - halfHeight + cornerLength);
  ctx.moveTo(hq.x - halfWidth, screenY + halfHeight - cornerLength);
  ctx.lineTo(hq.x - halfWidth, screenY + halfHeight);
  ctx.lineTo(hq.x - halfWidth + cornerLength, screenY + halfHeight);
  ctx.moveTo(hq.x + halfWidth - cornerLength, screenY + halfHeight);
  ctx.lineTo(hq.x + halfWidth, screenY + halfHeight);
  ctx.lineTo(hq.x + halfWidth, screenY + halfHeight - cornerLength);
  ctx.stroke();
  ctx.shadowColor = C.gold; ctx.strokeStyle = "rgba(255,214,121,0.9)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(hq.x, screenY + halfHeight + 3); ctx.lineTo(model.width / 2, ui.panel.y - 1); ctx.stroke();
  ctx.restore();
};

const collapsedCommandDock = (ctx, model, ui) => {
  commandFrame(ctx, ui.panel, { fill: "rgba(13,29,47,0.97)", strong: true, radius: 10 });
  box(ctx, ui.command, "rgba(45,70,82,0.98)", C.gold, 8);
  drawCommandMedallion(ctx, model, ui.command.x + 6, ui.command.y + 4, 40);
  text(ctx, "COMMAND", ui.command.x + 82, ui.command.y + 24, 10, C.text, "center");
  box(ctx, ui.deploy, "rgba(17,42,63,0.94)", "rgba(116,242,240,0.28)", 7);
  text(ctx, laneName(model.selectedLaneId), ui.deploy.x + 8, ui.deploy.y + 12, 8, C.player);
  text(ctx, "INSTANT DEPLOY", ui.deploy.x + ui.deploy.width / 2, ui.deploy.y + 33, 9, C.text, "center");
  box(ctx, ui.status, "rgba(21,54,72,0.96)", "rgba(116,242,240,0.34)", 7);
  text(ctx, "AUTO WAVE", ui.status.x + ui.status.width / 2, ui.status.y + 12, 8, C.text, "center");
  text(ctx, `${Math.ceil(model.phaseRemaining ?? 0)}s`, ui.status.x + ui.status.width / 2, ui.status.y + 33, 17, C.player, "center");
};

const expandedCommandPanel = (ctx, model, ui) => {
  commandSelectionLink(ctx, model, ui);
  commandFrame(ctx, ui.panel, { fill: "rgba(13,29,47,0.985)", strong: true, radius: 12 });
  box(ctx, ui.close, "rgba(255,214,121,0.92)", "#fff2c7", 7);
  text(ctx, "⌄", ui.close.x + 8, ui.close.y + 20, 12, "#23374b", "center");
  box(ctx, ui.fleetTab, model.commandMenu === "units" ? "rgba(68,91,93,0.98)" : "rgba(20,45,67,0.94)", model.commandMenu === "units" ? C.gold : "rgba(125,180,201,0.34)", 8);
  drawCommandMedallion(ctx, model, ui.fleetTab.x + 10, ui.fleetTab.y + 6, 30);
  text(ctx, "FLEET", ui.fleetTab.x + 112, ui.fleetTab.y + 21, 11, model.commandMenu === "units" ? C.text : C.muted, "center");
  box(ctx, ui.upgradeTab, model.commandMenu === "upgrades" ? "rgba(68,91,93,0.98)" : "rgba(20,45,67,0.94)", model.commandMenu === "upgrades" ? C.gold : "rgba(125,180,201,0.34)", 8);
  text(ctx, "⌃  UPGRADES", ui.upgradeTab.x + ui.upgradeTab.width / 2, ui.upgradeTab.y + 21, 10, model.commandMenu === "upgrades" ? C.text : C.muted, "center");
  const cards = model.commandMenu === "units" ? ui.units : ui.upgrades;
  for (const rect of cards) model.commandMenu === "units" ? unitCard(ctx, model, rect) : upgradeCard(ctx, model, rect);
  for (const rect of ui.lanes) footerLaneSelector(ctx, model, rect);
  box(ctx, ui.undo, "rgba(31,66,78,0.9)", null, 6);
  text(ctx, "LIVE", ui.undo.x + ui.undo.width / 2, ui.undo.y + 18, 8, C.player, "center");
  box(ctx, ui.deploy, "rgba(17,42,63,0.96)", "rgba(116,242,240,0.28)", 6);
  text(ctx, "TAP SHIP TO LAUNCH", ui.deploy.x + ui.deploy.width / 2, ui.deploy.y + 18, 8, C.text, "center");
  box(ctx, ui.status, "rgba(21,54,72,0.96)", "rgba(116,242,240,0.34)", 6);
  text(ctx, "WAVE", ui.status.x + ui.status.width / 2, ui.status.y + 10, 8, C.text, "center");
  text(ctx, `${Math.ceil(model.phaseRemaining ?? 0)}s`, ui.status.x + ui.status.width / 2, ui.status.y + 26, 14, C.player, "center");
  const tutorial = model.activeBattleSeconds < 10
    ? (laneIdsFor(model).length === 1 ? "TAP A SHIP · DEPLOY NOW" : "PICK A LANE · TAP A SHIP")
    : null;
  const feedback = model.commandFeedback ?? tutorial;
  if (feedback) {
    box(ctx, { x: 78, y: ui.feedbackY - 9, width: 264, height: 18 }, "rgba(10,22,42,0.88)", null, 7);
    text(ctx, feedback, model.width / 2, ui.feedbackY, 9, C.gold, "center");
  }
};

const commandPanel = (ctx, model, ui) => model.commandDockOpen
  ? expandedCommandPanel(ctx, model, ui)
  : collapsedCommandDock(ctx, model, ui);

const title = (ctx, model) => {
  const offsetY = model.height / 2 - 380;
  const ui = commandUiLayout(model.height);
  box(ctx, ui.fullscreen, "rgba(36, 68, 91, 0.82)", "rgba(190,229,239,0.4)", 7);
  text(ctx, model.fullscreenActive ? "×" : "□", 395, 29, 16, C.text, "center");
  box(ctx, { x: 343, y: 12, width: 30, height: 34 }, "rgba(36, 68, 91, 0.72)", "rgba(190,229,239,0.24)", 7);
  text(ctx, model.soundEnabled ? "♪" : "×", 358, 29, 13, model.soundEnabled ? C.text : C.muted, "center");
  const singleLane = model.mapDefinition?.lanes.length === 1;
  const halo = ctx.createRadialGradient(model.width / 2, 224 + offsetY, 8, model.width / 2, 224 + offsetY, 150);
  halo.addColorStop(0, "rgba(239,199,127,0.28)");
  halo.addColorStop(1, "rgba(239,199,127,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(38, 78 + offsetY, model.width - 76, 292);
  text(ctx, "ORBITAL COMMAND", model.width / 2, 166 + offsetY, 9, C.gold, "center", 650);
  text(ctx, "STRATEGY", model.width / 2, 201 + offsetY, 30, C.text, "center");
  text(ctx, "GALALAXY", model.width / 2, 233 + offsetY, 30, C.text, "center");
  text(ctx, "BUILD A FLEET · HOLD THE LINE", model.width / 2, 265 + offsetY, 10, C.muted, "center", 650);
  commandFrame(ctx, { x: 52, y: 288 + offsetY, width: model.width - 104, height: 240 }, { fill: "rgba(12,28,48,0.9)", strong: true, radius: 14 });
  text(ctx, singleLane ? "ONE LANE · ONE SUNWELL · LIVE COMBAT" : "TWO LANES · LIVE COMBAT", model.width / 2, 315 + offsetY, 9, C.text, "center", 600);
  text(ctx, "SWIPE THE MAP · PLAN EACH 22s WAVE", model.width / 2, 337 + offsetY, 8, C.muted, "center", 600);
  text(ctx, "‹  MISSION  ›", model.width / 2, 382 + offsetY, 8, C.gold, "center", 650);
  box(ctx, { x: 104, y: 398 + offsetY, width: 212, height: 32 }, "rgba(83,78,65,0.9)", "rgba(239,199,127,0.62)", 8);
  text(ctx, `LEVEL ${model.selectedLevel ?? 1} · ${model.mapDefinition?.title ?? "ORBITAL GARDEN"}`, model.width / 2, 414 + offsetY, 10, C.gold, "center");
  box(ctx, { ...ui.fullscreen, x: 104, y: 438 + offsetY, width: 212, height: 32 }, "rgba(37,72,93,0.82)", "rgba(190,229,239,0.32)", 8);
  const difficulty = { cadet: "CADET · RELAXED", tactician: "TACTICIAN · NORMAL", admiral: "ADMIRAL · HARD" }[model.aiProfile] ?? "TACTICIAN · NORMAL";
  text(ctx, difficulty, model.width / 2, 454 + offsetY, 10, C.text, "center");
  box(ctx, { x: 104, y: 478 + offsetY, width: 212, height: 38 }, model.levelLoading ? "rgba(65,72,78,0.9)" : "rgba(54,139,145,0.88)", model.levelLoading ? C.gold : "#b8edf0", 9);
  text(ctx, model.levelLoading ? "PREPARING MISSION…" : "START MATCH", model.width / 2, 497 + offsetY, 11, C.text, "center");
};
const loading = (ctx, model) => {
  const progress = Math.max(0, Math.min(1, model.assetProgress ?? 0));
  const panel = { x: 48, y: model.height / 2 - 78, width: model.width - 96, height: 156 };
  commandFrame(ctx, panel, { fill: "rgba(10,24,43,0.96)", strong: true, radius: 14 });
  text(ctx, "ORBITAL COMMAND", model.width / 2, panel.y + 34, 9, C.gold, "center", 650);
  text(ctx, "PREPARING FLEET", model.width / 2, panel.y + 62, 18, C.text, "center");
  ctx.fillStyle = "rgba(214,231,240,0.14)"; ctx.fillRect(panel.x + 28, panel.y + 91, panel.width - 56, 6);
  ctx.fillStyle = C.player; ctx.fillRect(panel.x + 28, panel.y + 91, (panel.width - 56) * progress, 6);
  text(ctx, `${Math.round(progress * 100)}%`, model.width / 2, panel.y + 117, 9, C.muted, "center", 650);
  if (model.assetErrors) text(ctx, "RETRYING SLOW ASSETS", model.width / 2, panel.y + 137, 8, C.gold, "center", 650);
};
const endState = (ctx, model) => {
  const win = model.state === MATCH_STATE.VICTORY;
  const draw = model.state === MATCH_STATE.DRAW;
  const color = draw ? C.gold : win ? C.player : C.enemy;
  const ui = overlayUiLayout(model.height);
  box(ctx, ui.endPanel, "rgba(10,24,43,0.94)", color, 14);
  text(ctx, draw ? "STALEMATE" : win ? "VICTORY" : "DEFEAT", model.width / 2, model.height / 2 - 48, 24, color, "center");
  text(ctx, "THE ORBITAL FRONT IS QUIET", model.width / 2, model.height / 2 - 15, 9, C.muted, "center", 600);
  box(ctx, ui.endRestart, "rgba(54,139,145,0.88)", "#b8edf0", 9);
  text(ctx, "PLAY AGAIN", ui.endRestart.x + ui.endRestart.width / 2, ui.endRestart.y + 23, 10, C.text, "center");
  box(ctx, ui.endMenu, "rgba(83,78,65,0.9)", "rgba(239,199,127,0.62)", 9);
  text(ctx, "MAIN MENU", ui.endMenu.x + ui.endMenu.width / 2, ui.endMenu.y + 23, 10, C.gold, "center");
};

const paused = (ctx, model) => {
  const ui = overlayUiLayout(model.height);
  const y = model.height / 2;
  box(ctx, ui.pausePanel, "rgba(10,24,43,0.95)", C.gold, 14);
  text(ctx, "PAUSED", model.width / 2, y - 58, 22, C.gold, "center");
  text(ctx, "THE BATTLE IS ON HOLD", model.width / 2, y - 27, 9, C.muted, "center", 600);
  box(ctx, ui.pauseResume, "rgba(54,139,145,0.88)", "#b8edf0", 9);
  text(ctx, "RESUME", ui.pauseResume.x + ui.pauseResume.width / 2, ui.pauseResume.y + 23, 10, C.text, "center");
  box(ctx, ui.pauseMenu, "rgba(83,78,65,0.9)", "rgba(239,199,127,0.62)", 9);
  text(ctx, "MAIN MENU", ui.pauseMenu.x + ui.pauseMenu.width / 2, ui.pauseMenu.y + 23, 10, C.gold, "center");
};

export const renderUiLayer = (ctx, model) => {
  if (model.state === MATCH_STATE.LOADING) return loading(ctx, model);
  if (model.state === MATCH_STATE.TITLE) return title(ctx, model);
  const ui = commandUiLayout(model.height, laneIdsFor(model), model.commandDockOpen);
  header(ctx, model, ui);
  if ((model.state === MATCH_STATE.LIVE_MATCH || model.state === MATCH_STATE.PAUSED) && model.simulation) {
    strategicNavigator(ctx, model);
    commandPanel(ctx, model, ui);
    if (model.state === MATCH_STATE.PAUSED) paused(ctx, model);
  } else if ([MATCH_STATE.VICTORY, MATCH_STATE.DEFEAT, MATCH_STATE.DRAW].includes(model.state)) endState(ctx, model);
  if (model.debugEnabled && model.lastAiDecision) text(ctx, `QA · AI ${laneName(model.lastAiDecision.defenseLane)} HOLD / ${laneName(model.lastAiDecision.pushLane)} PUSH`, model.width / 2, ui.debugY, 8, "#b8afcf", "center");
};
