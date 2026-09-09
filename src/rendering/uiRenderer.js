import { LANE, MATCH_STATE, TEAM } from "../core/constants.js";
import { UNIT_DEFINITIONS } from "../data/definitions.js";
import { commandUiLayout, overlayUiLayout } from "../ui/commandUi.js";
import { cameraNavigatorLayout } from "../ui/cameraUi.js";

const C = Object.freeze({
  panel: "rgba(18, 34, 53, 0.94)", outline: "rgba(244, 228, 190, 0.52)", text: "#fff8e9", muted: "#bdc9d9",
  player: "#74f2f0", enemy: "#ff927d", gold: "#ffd679", select: "rgba(47, 119, 132, 0.88)", card: "rgba(34, 65, 86, 0.96)",
});
const UPGRADE_UI = Object.freeze({
  economy: Object.freeze({ label: "REACTOR", active: "economyLevel", pending: "pendingEconomyLevels", effect: (balance) => `+${Math.round(balance.baseIncomePerSecond * balance.economyUpgradeIncomeBonus * 10) / 10} BASE E/s` }),
  weapons: Object.freeze({ label: "ARSENAL", active: "weaponLevel", pending: "pendingWeaponLevels", effect: (balance) => `+${Math.round(balance.weaponUpgradeDamageBonus * 100)}% FLEET DMG` }),
  turret: Object.freeze({ label: "BASTION", active: "turretLevel", pending: "pendingTurretLevels", effect: (balance) => `+${Math.round(balance.turretUpgradeDamageBonus * 100)}% TURRET DMG` }),
  logistics: Object.freeze({ label: "HANGAR", active: "logisticsLevel", pending: "pendingLogisticsLevels", effect: (balance) => `+${balance.logisticsUpgradeSlotBonus} WAVE SLOT` }),
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
const laneName = (laneId) => (laneId === LANE.CENTER ? "MAIN" : laneId === LANE.LEFT ? "LEFT" : "RIGHT");
const queue = (model, laneId, team = TEAM.PLAYER) => model.director?.queuedWaves.get(team).get(laneId) ?? [];
const laneIdsFor = (model) => model.simulation?.state.map.lanes.map((lane) => lane.id) ?? model.mapDefinition?.lanes.map((lane) => lane.id) ?? [LANE.LEFT, LANE.RIGHT];
const purchasedCount = (model, team = TEAM.PLAYER) => laneIdsFor(model).reduce((sum, laneId) => sum + queue(model, laneId, team).length, 0);
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
  box(ctx, { x: 8, y: 8, width: model.width - 16, height: 48 }, C.panel, "rgba(190,224,236,0.3)", 10);
  text(ctx, `YOU  ${Math.round(ratio(playerHq) * 100)}%`, 18, 22, 11, C.player);
  miniBar(ctx, 18, 31, 102, ratio(playerHq), C.player);
  text(ctx, `${economy ? Math.floor(economy.get(TEAM.PLAYER).energy) : 0} E · +${income}/s · N${nodeIncome}`, 18, 44, 9, C.text);
  text(ctx, model.queueLocked ? "LOCKED" : "NEXT WAVE", 158, 22, 9, model.queueLocked ? C.gold : C.text, "center");
  text(ctx, `${Math.ceil(model.phaseRemaining ?? 0)}s`, 158, 42, 14, model.queueLocked ? C.gold : C.text, "center");
  text(ctx, `${Math.round(ratio(enemyHq) * 100)}%  RIVAL`, 300, 22, 10, C.enemy, "right");
  miniBar(ctx, 300, 31, 92, ratio(enemyHq), C.enemy, "right");
  text(ctx, `RIVAL +${purchasedCount(model, TEAM.ENEMY)}`, 300, 44, 8, C.muted, "right", 600);
  box(ctx, { x: 308, y: 12, width: 30, height: 34 }, "rgba(36, 68, 91, 0.72)", "rgba(190,229,239,0.24)", 7);
  text(ctx, model.state === MATCH_STATE.PAUSED ? "▶" : "Ⅱ", 323, 29, 12, C.text, "center");
  box(ctx, { x: 343, y: 12, width: 30, height: 34 }, "rgba(36, 68, 91, 0.72)", "rgba(190,229,239,0.24)", 7);
  text(ctx, model.soundEnabled ? "♪" : "×", 358, 29, 13, model.soundEnabled ? C.text : C.muted, "center");
  box(ctx, ui.fullscreen, "rgba(36, 68, 91, 0.82)", "rgba(190,229,239,0.4)", 7);
  text(ctx, model.fullscreenActive ? "×" : "□", 395, 29, 16, C.text, "center");
};

const drawShipIcon = (ctx, model, unitType, x, y, size = 22) => {
  const spriteType = unitType === "drone" ? "scout" : unitType;
  const unifiedSprite = model.assets?.get(`unified-player-${spriteType}`);
  const sprite = unifiedSprite ?? model.assets?.get(`nairan-${spriteType}`);
  const crop = { scout: [20, 23, 24, 22], fighter: [17, 20, 30, 27], bomber: [16, 18, 32, 30], frigate: [11, 9, 42, 42] }[unitType] ?? [0, 0, 64, 64];
  if (unifiedSprite) ctx.drawImage(unifiedSprite, x - size / 2, y - size / 2, size, size);
  else if (sprite) { ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.drawImage(sprite, ...crop, x - size / 2, y - size / 2, size, size); ctx.restore(); }
  else { ctx.fillStyle = UNIT_DEFINITIONS[unitType]?.color ?? C.player; ctx.beginPath(); ctx.arc(x, y, size * 0.3, 0, Math.PI * 2); ctx.fill(); }
};

const iconRow = (ctx, model, entries, startX, y, maxWidth, fallbackTypes = [], gap = 24, size = 21) => {
  const types = entries.length ? entries.map((entry) => entry.unitType ?? entry) : fallbackTypes;
  const visible = types.slice(0, Math.max(1, Math.floor(maxWidth / gap)));
  visible.forEach((unitType, index) => drawShipIcon(ctx, model, unitType, startX + index * gap, y, size));
  if (!types.length) text(ctx, "—", startX, y, 11, C.muted);
};

const laneSelector = (ctx, model, rect) => {
  const selected = model.selectedLaneId === rect.laneId;
  const entries = queue(model, rect.laneId);
  box(ctx, rect, selected ? C.select : "rgba(19, 39, 64, 0.7)", selected ? C.player : "rgba(171, 217, 231, 0.24)", 8);
  text(ctx, laneName(rect.laneId), rect.x + 7, rect.y + 9, 8, selected ? C.text : C.muted);
  iconRow(ctx, model, entries, rect.x + 11, rect.y + 24, 52, [], 14, 12);
  const player = laneStrength(model, rect.laneId, TEAM.PLAYER);
  const enemy = laneStrength(model, rect.laneId, TEAM.ENEMY);
  const total = Math.max(1, player + enemy);
  ctx.fillStyle = "rgba(224,235,242,0.13)";
  ctx.fillRect(rect.x + 7, rect.y + 37, rect.width - 14, 3);
  ctx.fillStyle = C.player;
  ctx.fillRect(rect.x + 7, rect.y + 37, (rect.width - 14) * player / total, 3);
  ctx.fillStyle = C.enemy;
  ctx.fillRect(rect.x + 7 + (rect.width - 14) * player / total, rect.y + 37, (rect.width - 14) * enemy / total, 3);
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
    ctx.fillRect(laneX(node.laneId) - 2, trackY(node.y) - 2, 4, 4);
  }
  ctx.globalAlpha = 1;

  for (const structure of state.structures.values()) {
    const y = trackY(structure.y);
    const color = structure.team === TEAM.PLAYER ? C.player : C.enemy;
    ctx.fillStyle = color;
    ctx.globalAlpha = structure.alive ? 0.9 : 0.22;
    if (structure.structureType === "hq") ctx.fillRect(track.x + 2, y - 1.5, track.width - 4, 3);
    else ctx.fillRect(laneX(structure.laneId) - 2, y - 1.5, 4, 3);
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
      ctx.beginPath();
      ctx.arc(laneX(laneId) + (team === TEAM.PLAYER ? -1.5 : 1.5), trackY(averageY), radius, 0, Math.PI * 2);
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
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(track.x - 2, windowTop, track.width + 4, Math.max(8, windowBottom - windowTop));
};

const unitCard = (ctx, model, rect) => {
  const def = UNIT_DEFINITIONS[rect.unitType];
  const slotsOpen = purchasedCount(model) < model.economy.reinforcementLimit(TEAM.PLAYER);
  const affordable = model.economy.get(TEAM.PLAYER).energy >= def.cost && slotsOpen && !model.queueLocked;
  box(ctx, rect, affordable ? C.card : "rgba(35, 45, 58, 0.76)", affordable ? C.outline : null, 8);
  const role = { scout: "CAPTURE", fighter: "ANTI-LIGHT", bomber: "SIEGE", frigate: "FRONTLINE" }[rect.unitType];
  drawShipIcon(ctx, model, rect.unitType, rect.x + 24, rect.y + 25, 38);
  text(ctx, def.id.toUpperCase(), rect.x + 49, rect.y + 16, 11, affordable ? C.text : C.muted);
  text(ctx, `${role} · ${def.cost} E`, rect.x + 49, rect.y + 35, 8, affordable ? C.gold : C.muted, "left", 650);
};

const upgradeCard = (ctx, model, rect) => {
  const cost = model.economy.upgradeCost(TEAM.PLAYER, rect.upgradeId);
  const economy = model.economy.get(TEAM.PLAYER);
  const upgrade = UPGRADE_UI[rect.upgradeId];
  const activeKey = upgrade.active;
  const pendingKey = upgrade.pending;
  const projectPending = model.economy.pendingUpgradeCount(TEAM.PLAYER) > 0;
  const affordable = cost !== null && !projectPending && economy.energy >= cost && !model.queueLocked;
  const level = economy[activeKey] + economy[pendingKey];
  const isPending = economy[pendingKey] > 0;
  box(ctx, rect, isPending ? "rgba(115, 84, 76, 0.88)" : affordable ? "rgba(55, 94, 88, 0.88)" : "rgba(45, 48, 62, 0.82)", affordable || isPending ? C.outline : null, 8);
  text(ctx, upgrade.label, rect.x + 10, rect.y + 11, 9, affordable || isPending ? C.text : C.muted);
  text(ctx, upgrade.effect(model.economy.balance), rect.x + 10, rect.y + 27, 8, isPending ? "#ffe0b0" : affordable ? C.gold : C.muted, "left", 650);
  const detail = cost === null ? `MAX · LV ${level}` : isPending ? `LV ${economy[activeKey]} → ${level} · NEXT WAVE` : `LV ${level} · ${cost} E`;
  text(ctx, detail, rect.x + 10, rect.y + 42, 8, affordable || isPending ? C.text : C.muted, "left", 650);
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
  const entries = queue(model, model.selectedLaneId);
  const total = purchasedCount(model);
  const limit = model.economy.reinforcementLimit(TEAM.PLAYER);
  box(ctx, ui.panel, "rgba(13,29,47,0.97)", "rgba(255,214,121,0.62)", 10);
  box(ctx, ui.command, "rgba(45,70,82,0.98)", C.gold, 8);
  drawCommandMedallion(ctx, model, ui.command.x + 6, ui.command.y + 4, 40);
  text(ctx, "COMMAND", ui.command.x + 82, ui.command.y + 24, 10, C.text, "center");
  box(ctx, ui.queue, "rgba(17,42,63,0.94)", "rgba(116,242,240,0.28)", 7);
  text(ctx, laneName(model.selectedLaneId), ui.queue.x + 8, ui.queue.y + 10, 7, C.player);
  iconRow(ctx, model, entries, ui.queue.x + 18, ui.queue.y + 31, ui.queue.width - 28, ["scout", "scout"], 29, 24);
  box(ctx, ui.status, model.queueLocked ? "rgba(102,65,61,0.94)" : "rgba(21,54,72,0.96)", model.queueLocked ? C.gold : "rgba(116,242,240,0.34)", 7);
  text(ctx, model.queueLocked ? "LOCKED" : `SLOTS ${total}/${limit}`, ui.status.x + ui.status.width / 2, ui.status.y + 12, 8, model.queueLocked || total >= limit ? C.gold : C.text, "center");
  text(ctx, `${Math.ceil(model.phaseRemaining ?? 0)}s`, ui.status.x + ui.status.width / 2, ui.status.y + 33, 17, model.queueLocked ? C.gold : C.player, "center");
};

const expandedCommandPanel = (ctx, model, ui) => {
  const entries = queue(model, model.selectedLaneId);
  const total = purchasedCount(model);
  const limit = model.economy.reinforcementLimit(TEAM.PLAYER);
  commandSelectionLink(ctx, model, ui);
  box(ctx, ui.panel, "rgba(13,29,47,0.985)", "rgba(255,214,121,0.76)", 12);
  ctx.strokeStyle = "rgba(245,235,207,0.38)"; ctx.lineWidth = 1; ctx.strokeRect(ui.panel.x + 5, ui.panel.y + 5, ui.panel.width - 10, ui.panel.height - 10);
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
  box(ctx, ui.undo, entries.length ? "rgba(104,69,83,0.92)" : "rgba(38,47,60,0.8)", null, 6);
  text(ctx, "↶", ui.undo.x + ui.undo.width / 2, ui.undo.y + 18, 16, entries.length ? "#ffd9dc" : C.muted, "center");
  box(ctx, ui.queue, "rgba(17,42,63,0.96)", "rgba(116,242,240,0.28)", 6);
  iconRow(ctx, model, entries, ui.queue.x + 17, ui.queue.y + 18, ui.queue.width - 20, ["scout", "scout"], 28, 23);
  box(ctx, ui.status, model.queueLocked ? "rgba(102,65,61,0.94)" : "rgba(21,54,72,0.96)", model.queueLocked ? C.gold : "rgba(116,242,240,0.34)", 6);
  text(ctx, model.queueLocked ? "LOCKED" : `SLOTS ${total}/${limit}`, ui.status.x + ui.status.width / 2, ui.status.y + 10, 8, model.queueLocked || total >= limit ? C.gold : C.text, "center");
  text(ctx, `${Math.ceil(model.phaseRemaining ?? 0)}s`, ui.status.x + ui.status.width / 2, ui.status.y + 26, 14, model.queueLocked ? C.gold : C.player, "center");
  const tutorial = model.activeBattleSeconds < 10 && total === 0
    ? (laneIdsFor(model).length === 1 ? "BUILD YOUR NEXT WAVE · HOLD THE SUNWELL" : "PICK A LANE · QUEUE YOUR NEXT WAVE")
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
  box(ctx, { x: 52, y: 288 + offsetY, width: model.width - 104, height: 240 }, "rgba(12, 28, 48, 0.88)", "rgba(239,199,127,0.5)", 14);
  text(ctx, singleLane ? "ONE LANE · ONE SUNWELL · LIVE COMBAT" : "TWO LANES · LIVE COMBAT", model.width / 2, 315 + offsetY, 9, C.text, "center", 600);
  text(ctx, "SWIPE THE MAP · PLAN EACH 22s WAVE", model.width / 2, 337 + offsetY, 8, C.muted, "center", 600);
  text(ctx, "‹  MISSION  ›", model.width / 2, 382 + offsetY, 8, C.gold, "center", 650);
  box(ctx, { x: 104, y: 398 + offsetY, width: 212, height: 32 }, "rgba(83,78,65,0.9)", "rgba(239,199,127,0.62)", 8);
  text(ctx, `LEVEL ${model.selectedLevel ?? 1} · ${model.mapDefinition?.title ?? "ORBITAL GARDEN"}`, model.width / 2, 414 + offsetY, 10, C.gold, "center");
  box(ctx, { ...ui.fullscreen, x: 104, y: 438 + offsetY, width: 212, height: 32 }, "rgba(37,72,93,0.82)", "rgba(190,229,239,0.32)", 8);
  const difficulty = { cadet: "CADET · RELAXED", tactician: "TACTICIAN · NORMAL", admiral: "ADMIRAL · HARD" }[model.aiProfile] ?? "TACTICIAN · NORMAL";
  text(ctx, difficulty, model.width / 2, 454 + offsetY, 10, C.text, "center");
  box(ctx, { x: 104, y: 478 + offsetY, width: 212, height: 38 }, "rgba(54,139,145,0.88)", "#b8edf0", 9);
  text(ctx, "START MATCH", model.width / 2, 497 + offsetY, 11, C.text, "center");
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
  if (model.state === MATCH_STATE.TITLE) return title(ctx, model);
  const ui = commandUiLayout(model.height, laneIdsFor(model), model.commandDockOpen);
  header(ctx, model, ui);
  if ((model.state === MATCH_STATE.LIVE_MATCH || model.state === MATCH_STATE.PAUSED) && model.simulation) {
    strategicNavigator(ctx, model);
    commandPanel(ctx, model, ui);
    if (model.state === MATCH_STATE.PAUSED) paused(ctx, model);
  } else if ([MATCH_STATE.VICTORY, MATCH_STATE.DEFEAT, MATCH_STATE.DRAW].includes(model.state)) endState(ctx, model);
  if (model.debugEnabled && model.lastAiDecision) text(ctx, `AI: ${laneName(model.lastAiDecision.defenseLane)} DEFEND · ${laneName(model.lastAiDecision.pushLane)} PUSH`, model.width / 2, ui.debugY, 9, "#d6c8ec", "center");
};
