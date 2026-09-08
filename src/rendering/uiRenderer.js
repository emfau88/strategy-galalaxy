import { LANE, MATCH_STATE, TEAM } from "../core/constants.js";
import { UNIT_DEFINITIONS } from "../data/definitions.js";
import { commandUiLayout } from "../ui/commandUi.js";
import { cameraNavigatorLayout } from "../ui/cameraUi.js";

const C = Object.freeze({
  panel: "rgba(29, 37, 58, 0.82)", outline: "rgba(218, 211, 205, 0.34)", text: "#f6f0e7", muted: "#c5bec1",
  player: "#8ddbdc", enemy: "#ed9b83", gold: "#efc77f", select: "rgba(61, 125, 133, 0.78)", card: "rgba(49, 68, 82, 0.86)",
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
const laneName = (laneId) => (laneId === LANE.LEFT ? "LEFT" : "RIGHT");
const queue = (model, laneId, team = TEAM.PLAYER) => model.director?.queuedWaves.get(team).get(laneId) ?? [];
const purchasedCount = (model, team = TEAM.PLAYER) => [LANE.LEFT, LANE.RIGHT].reduce((sum, laneId) => sum + queue(model, laneId, team).length, 0);
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
  const sprite = model.assets?.get(`nairan-${unitType}`);
  const crop = { scout: [20, 23, 24, 22], fighter: [17, 20, 30, 27], bomber: [16, 18, 32, 30], frigate: [11, 9, 42, 42] }[unitType] ?? [0, 0, 64, 64];
  if (sprite) { ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.drawImage(sprite, ...crop, x - size / 2, y - size / 2, size, size); ctx.restore(); }
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

const strategicNavigator = (ctx, model) => {
  const camera = model.camera;
  const state = model.simulation?.state;
  if (!camera || !state) return;
  const layout = cameraNavigatorLayout(camera.viewport);
  const { track } = layout;
  const worldHeight = Math.max(1, camera.worldHeight);
  const trackY = (worldY) => track.y + Math.max(0, Math.min(1, worldY / worldHeight)) * track.height;
  const laneX = (laneId) => track.x + (laneId === LANE.LEFT ? 4 : 10);

  box(ctx, { x: track.x - 3, y: track.y - 5, width: track.width + 6, height: track.height + 10 }, "rgba(8,18,34,0.68)", "rgba(178,219,234,0.2)", 7);
  ctx.strokeStyle = "rgba(210,232,241,0.22)";
  ctx.lineWidth = 1;
  for (const x of [laneX(LANE.LEFT), laneX(LANE.RIGHT)]) {
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

  for (const laneId of [LANE.LEFT, LANE.RIGHT]) {
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
    const laneId = event.laneId ?? (event.x < state.map.bounds.width / 2 ? LANE.LEFT : LANE.RIGHT);
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
  drawShipIcon(ctx, model, rect.unitType, rect.x + 22, rect.y + 25, 30);
  text(ctx, def.id.toUpperCase(), rect.x + 42, rect.y + 16, 11, affordable ? C.text : C.muted);
  text(ctx, `${role} · ${def.cost} E`, rect.x + 42, rect.y + 35, 8, affordable ? C.gold : C.muted, "left", 650);
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

const commandPanel = (ctx, model, ui) => {
  const entries = queue(model, model.selectedLaneId);
  const total = purchasedCount(model);
  const limit = model.economy.reinforcementLimit(TEAM.PLAYER);
  box(ctx, ui.panel, "rgba(13, 27, 50, 0.82)", "rgba(180, 222, 235, 0.34)", 10);
  for (const rect of ui.lanes) laneSelector(ctx, model, rect);
  box(ctx, ui.undo, entries.length ? "rgba(99, 67, 91, 0.82)" : "rgba(38, 47, 60, 0.68)", null);
  text(ctx, "UNDO", ui.undo.x + 56, ui.undo.y + 22, 11, entries.length ? "#f3d6df" : C.muted, "center");
  box(ctx, ui.menu, "rgba(37, 72, 93, 0.8)", null);
  text(ctx, model.commandMenu === "units" ? "UPGRADES" : "SHIPS", ui.menu.x + 56, ui.menu.y + 22, 10, C.text, "center");
  const cards = model.commandMenu === "units" ? ui.units : ui.upgrades;
  for (const rect of cards) model.commandMenu === "units" ? unitCard(ctx, model, rect) : upgradeCard(ctx, model, rect);
  box(ctx, ui.deploy, model.queueLocked ? "rgba(113, 76, 82, 0.88)" : "rgba(54, 119, 139, 0.88)", model.queueLocked ? C.gold : "#b8edf0", 9);
  text(ctx, "NEXT", ui.deploy.x + 55, ui.deploy.y + 25, 10, C.muted, "center");
  text(ctx, `${Math.ceil(model.phaseRemaining ?? 0)}s`, ui.deploy.x + 55, ui.deploy.y + 57, 23, model.queueLocked ? C.gold : C.text, "center");
  text(ctx, model.queueLocked ? "LOCKED" : `SLOTS ${total}/${limit}`, ui.deploy.x + 55, ui.deploy.y + 88, 9, model.queueLocked || total >= limit ? C.gold : "#d7f2f2", "center");
  const tutorial = model.activeBattleSeconds < 10 && total === 0 ? "PICK A LANE · QUEUE YOUR NEXT WAVE" : null;
  const feedback = model.commandFeedback ?? tutorial;
  if (feedback) {
    box(ctx, { x: 78, y: ui.feedbackY - 9, width: 264, height: 18 }, "rgba(10,22,42,0.88)", null, 7);
    text(ctx, feedback, model.width / 2, ui.feedbackY, 9, C.gold, "center");
  }
};

const title = (ctx, model) => {
  const offsetY = model.height / 2 - 380;
  const ui = commandUiLayout(model.height);
  box(ctx, ui.fullscreen, "rgba(36, 68, 91, 0.82)", "rgba(190,229,239,0.4)", 7);
  text(ctx, model.fullscreenActive ? "×" : "□", 395, 29, 16, C.text, "center");
  box(ctx, { x: 343, y: 12, width: 30, height: 34 }, "rgba(36, 68, 91, 0.72)", "rgba(190,229,239,0.24)", 7);
  text(ctx, model.soundEnabled ? "♪" : "×", 358, 29, 13, model.soundEnabled ? C.text : C.muted, "center");
  box(ctx, { x: 52, y: 264 + offsetY, width: model.width - 104, height: 234 }, "rgba(16, 33, 58, 0.84)", C.player, 12);
  text(ctx, "STRATEGY GALALAXY", model.width / 2, 294 + offsetY, 19, C.text, "center");
  text(ctx, "PLAN · DEPLOY · WATCH THE LINE", model.width / 2, 320 + offsetY, 11, C.muted, "center");
  text(ctx, "1  DRAG TO EXPLORE THE FRONT", model.width / 2, 352 + offsetY, 10, C.text, "center", 600);
  text(ctx, "2  PICK LEFT OR RIGHT", model.width / 2, 372 + offsetY, 10, C.text, "center", 600);
  text(ctx, "3  QUEUE UP TO 4 SHIPS", model.width / 2, 392 + offsetY, 10, C.text, "center", 600);
  box(ctx, { ...ui.fullscreen, x: 104, y: 408 + offsetY, width: 212, height: 32 }, "rgba(37,72,93,0.82)", "rgba(190,229,239,0.32)", 8);
  const difficulty = { cadet: "CADET · RELAXED", tactician: "TACTICIAN · NORMAL", admiral: "ADMIRAL · HARD" }[model.aiProfile] ?? "TACTICIAN · NORMAL";
  text(ctx, difficulty, model.width / 2, 424 + offsetY, 10, C.text, "center");
  box(ctx, { x: 104, y: 448 + offsetY, width: 212, height: 38 }, "rgba(54,139,145,0.88)", "#b8edf0", 9);
  text(ctx, "START MATCH", model.width / 2, 467 + offsetY, 11, C.text, "center");
};
const endState = (ctx, model) => {
  const win = model.state === MATCH_STATE.VICTORY;
  const draw = model.state === MATCH_STATE.DRAW;
  const offsetY = model.height / 2 - 380;
  const color = draw ? C.gold : win ? C.player : C.enemy;
  box(ctx, { x: 72, y: 324 + offsetY, width: model.width - 144, height: 118 }, "rgba(16,33,58,0.84)", color, 12);
  text(ctx, draw ? "STALEMATE" : win ? "VICTORY" : "DEFEAT", model.width / 2, 360 + offsetY, 24, color, "center");
  text(ctx, "TAP FOR A NEW MATCH", model.width / 2, 408 + offsetY, 11, C.text, "center");
};

const paused = (ctx, model) => {
  const y = model.height / 2;
  box(ctx, { x: 112, y: y - 42, width: 196, height: 84 }, "rgba(10,22,42,0.9)", C.gold, 12);
  text(ctx, "PAUSED", model.width / 2, y - 10, 22, C.gold, "center");
  text(ctx, "PRESS P TO RESUME", model.width / 2, y + 20, 10, C.text, "center");
};

export const renderUiLayer = (ctx, model) => {
  if (model.state === MATCH_STATE.TITLE) return title(ctx, model);
  const ui = commandUiLayout(model.height);
  header(ctx, model, ui);
  if ((model.state === MATCH_STATE.LIVE_MATCH || model.state === MATCH_STATE.PAUSED) && model.simulation) {
    strategicNavigator(ctx, model);
    commandPanel(ctx, model, ui);
    if (model.state === MATCH_STATE.PAUSED) paused(ctx, model);
  } else if ([MATCH_STATE.VICTORY, MATCH_STATE.DEFEAT, MATCH_STATE.DRAW].includes(model.state)) endState(ctx, model);
  if (model.debugEnabled && model.lastAiDecision) text(ctx, `AI: ${laneName(model.lastAiDecision.defenseLane)} DEFEND · ${laneName(model.lastAiDecision.pushLane)} PUSH`, model.width / 2, ui.debugY, 9, "#d6c8ec", "center");
};
