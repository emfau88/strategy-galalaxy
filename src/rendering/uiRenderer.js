import { LANE, MATCH_STATE, TEAM } from "../core/constants.js";
import { UNIT_DEFINITIONS } from "../data/definitions.js";
import { commandUiLayout } from "../ui/commandUi.js";

const C = Object.freeze({
  panel: "rgba(14, 29, 53, 0.78)", outline: "rgba(172, 222, 237, 0.38)", text: "#f4f8fb", muted: "#b4c7d6",
  player: "#91e0ef", enemy: "#f1a08a", gold: "#f1cc89", select: "rgba(54, 123, 149, 0.76)", card: "rgba(31, 60, 86, 0.82)",
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
const plannedCost = (entries) => entries.reduce((total, entry) => total + entry.paidCost, 0);
const purchasedCount = (model, team = TEAM.PLAYER) => [LANE.LEFT, LANE.RIGHT].reduce((sum, laneId) => sum + queue(model, laneId, team).length, 0);
const structure = (simulation, id) => simulation?.state.structures.get(id);
const ratio = (target) => target?.alive ? Math.max(0, target.hp / target.maxHp) : 0;

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
  box(ctx, { x: 8, y: 8, width: model.width - 16, height: 48 }, C.panel, "rgba(190,224,236,0.3)", 10);
  text(ctx, `YOU  ${Math.round(ratio(playerHq) * 100)}%`, 18, 22, 11, C.player);
  miniBar(ctx, 18, 31, 102, ratio(playerHq), C.player);
  text(ctx, `${economy ? Math.floor(economy.get(TEAM.PLAYER).energy) : 0} E  ·  +${income}/s`, 18, 44, 10, C.text);
  const phase = model.state === MATCH_STATE.COMMAND ? "COMMAND" : model.state === MATCH_STATE.BATTLE ? "BATTLE" : model.state;
  text(ctx, phase, model.width / 2, 22, 11, model.state === MATCH_STATE.COMMAND ? C.gold : C.text, "center");
  text(ctx, model.manualCommand ? "READY" : `${Math.ceil(model.phaseRemaining ?? 0)}s`, model.width / 2, 42, 14, model.manualCommand ? C.gold : C.text, "center");
  text(ctx, `${Math.round(ratio(enemyHq) * 100)}%  RIVAL`, 366, 22, 11, C.enemy, "right");
  miniBar(ctx, 366, 31, 102, ratio(enemyHq), C.enemy, "right");
  text(ctx, "HEADQUARTERS", 366, 44, 9, C.muted, "right", 600);
  box(ctx, ui.fullscreen, "rgba(36, 68, 91, 0.82)", "rgba(190,229,239,0.4)", 7);
  text(ctx, model.fullscreenActive ? "×" : "□", 395, 29, 16, C.text, "center");
};

const drawShipIcon = (ctx, model, unitType, x, y, size = 22) => {
  const sprite = model.assets?.get(`nairan-${unitType}`);
  const crop = { scout: [20, 23, 24, 22], fighter: [17, 20, 30, 27], bomber: [16, 18, 32, 30], frigate: [11, 9, 42, 42] }[unitType] ?? [0, 0, 64, 64];
  if (sprite) { ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.drawImage(sprite, ...crop, x - size / 2, y - size / 2, size, size); ctx.restore(); }
  else { ctx.fillStyle = UNIT_DEFINITIONS[unitType]?.color ?? C.player; ctx.beginPath(); ctx.arc(x, y, size * 0.3, 0, Math.PI * 2); ctx.fill(); }
};

const iconRow = (ctx, model, entries, startX, y, maxWidth, fallbackTypes = []) => {
  const types = entries.length ? entries.map((entry) => entry.unitType ?? entry) : fallbackTypes;
  const gap = 24;
  const visible = types.slice(0, Math.max(1, Math.floor(maxWidth / gap)));
  visible.forEach((unitType, index) => drawShipIcon(ctx, model, unitType, startX + index * gap, y, 21));
  if (!types.length) text(ctx, "—", startX, y, 11, C.muted);
};

const laneSelector = (ctx, model, rect) => {
  const selected = model.selectedLaneId === rect.laneId;
  const entries = queue(model, rect.laneId);
  box(ctx, rect, selected ? C.select : "rgba(19, 39, 64, 0.7)", selected ? C.player : "rgba(171, 217, 231, 0.24)", 9);
  text(ctx, laneName(rect.laneId), rect.x + 10, rect.y + 14, 11, selected ? C.text : C.muted);
  text(ctx, "AUTO", rect.x + 10, rect.y + 37, 8, C.muted, "left", 600);
  iconRow(ctx, model, [], rect.x + 53, rect.y + 37, 118, ["scout", "scout"]);
  text(ctx, `+ WAVE  ${entries.length}`, rect.x + 10, rect.y + 64, 8, entries.length ? C.gold : C.muted, "left", 600);
  iconRow(ctx, model, entries, rect.x + 70, rect.y + 64, 108);
};

const unitCard = (ctx, model, rect) => {
  const def = UNIT_DEFINITIONS[rect.unitType];
  const slotsOpen = purchasedCount(model) < model.director.config.balance.maxPurchasedReinforcementsPerDeployment;
  const affordable = model.economy.get(TEAM.PLAYER).energy >= def.cost && slotsOpen;
  box(ctx, rect, affordable ? C.card : "rgba(35, 45, 58, 0.76)", affordable ? C.outline : null, 8);
  drawShipIcon(ctx, model, rect.unitType, rect.x + 22, rect.y + 21, 29);
  text(ctx, def.id.toUpperCase(), rect.x + 42, rect.y + 14, 11, affordable ? C.text : C.muted);
  text(ctx, `${def.cost} E`, rect.x + 42, rect.y + 30, 10, affordable ? C.gold : C.muted);
};

const upgradeCard = (ctx, model, rect) => {
  const cost = model.economy.upgradeCost(TEAM.PLAYER, rect.upgradeId);
  const affordable = model.economy.get(TEAM.PLAYER).energy >= cost;
  const level = model.economy.get(TEAM.PLAYER)[rect.upgradeId === "economy" ? "economyLevel" : "turretLevel"];
  box(ctx, rect, affordable ? "rgba(44, 82, 84, 0.8)" : "rgba(35, 45, 58, 0.76)", affordable ? C.outline : null, 8);
  text(ctx, rect.upgradeId === "economy" ? "ECONOMY" : "TURRETS", rect.x + 11, rect.y + 14, 11, affordable ? C.text : C.muted);
  text(ctx, `LV ${level} · ${cost} E`, rect.x + 11, rect.y + 30, 10, affordable ? C.gold : C.muted);
};

const commandPanel = (ctx, model, ui) => {
  const entries = queue(model, model.selectedLaneId);
  const total = purchasedCount(model);
  const limit = model.director.config.balance.maxPurchasedReinforcementsPerDeployment;
  box(ctx, ui.panel, "rgba(13, 27, 50, 0.82)", "rgba(180, 222, 235, 0.34)", 10);
  text(ctx, `${laneName(model.selectedLaneId)} WAVE`, 18, ui.panel.y + 19, 12, C.text);
  text(ctx, `REINFORCEMENTS  ${total} / ${limit}  ·  ${plannedCost(entries)} E HERE`, 18, ui.panel.y + 38, 10, total >= limit ? C.gold : C.muted);
  box(ctx, ui.undo, entries.length ? "rgba(99, 67, 91, 0.82)" : "rgba(38, 47, 60, 0.68)", null);
  text(ctx, "UNDO", ui.undo.x + 56, ui.undo.y + 17, 11, entries.length ? "#f3d6df" : C.muted, "center");
  box(ctx, ui.menu, "rgba(37, 72, 93, 0.8)", null);
  text(ctx, model.commandMenu === "units" ? "UPGRADES" : "SHIPS", ui.menu.x + 56, ui.menu.y + 17, 10, C.text, "center");
  const cards = model.commandMenu === "units" ? ui.units : ui.upgrades;
  for (const rect of cards) model.commandMenu === "units" ? unitCard(ctx, model, rect) : upgradeCard(ctx, model, rect);
  box(ctx, ui.deploy, "rgba(54, 139, 145, 0.88)", "#b8edf0", 9);
  text(ctx, "DEPLOY", ui.deploy.x + 55, ui.deploy.y + 31, 15, C.text, "center");
  text(ctx, "FLEETS", ui.deploy.x + 55, ui.deploy.y + 51, 14, C.text, "center");
  text(ctx, "MANUAL", ui.deploy.x + 55, ui.deploy.y + 72, 8, "#d7f2f2", "center");
  if (model.commandFeedback) text(ctx, model.commandFeedback, model.width / 2, ui.feedbackY, 10, C.gold, "center");
};

const laneStrength = (model, laneId, team) => {
  const lane = model.simulation.state.lanes.get(laneId);
  return lane.unitIds.get(team).map((id) => model.simulation.state.units.get(id)).reduce((sum, unit) => {
    const def = UNIT_DEFINITIONS[unit.unitType];
    return sum + def.maxHp * 0.08 + def.damage * 3;
  }, 0);
};

const lanePressure = (ctx, model, ui) => {
  box(ctx, ui.pressure, "rgba(17, 33, 55, 0.72)", "rgba(181, 219, 231, 0.24)", 9);
  [LANE.LEFT, LANE.RIGHT].forEach((laneId, index) => {
    const x = index === 0 ? 62 : 220;
    const player = laneStrength(model, laneId, TEAM.PLAYER);
    const enemy = laneStrength(model, laneId, TEAM.ENEMY);
    const total = Math.max(1, player + enemy);
    const node = [...model.simulation.state.nodes.values()].find((item) => item.laneId === laneId);
    text(ctx, laneName(laneId), x, ui.pressure.y + 11, 8, C.muted, "left", 600);
    ctx.fillStyle = "rgba(224,235,242,0.12)"; ctx.fillRect(x, ui.pressure.y + 20, 136, 4);
    ctx.fillStyle = C.player; ctx.fillRect(x, ui.pressure.y + 20, 136 * player / total, 4);
    ctx.fillStyle = C.enemy; ctx.fillRect(x + 136 * player / total, ui.pressure.y + 20, 136 * enemy / total, 4);
    ctx.fillStyle = node.ownerTeam === TEAM.PLAYER ? C.player : node.ownerTeam === TEAM.ENEMY ? C.enemy : node.contested ? C.gold : C.muted;
    ctx.beginPath(); ctx.arc(x + 126, ui.pressure.y + 11, 4, 0, Math.PI * 2); ctx.fill();
  });
};

const title = (ctx, model) => {
  const offsetY = model.height / 2 - 380;
  const ui = commandUiLayout(model.height);
  box(ctx, ui.fullscreen, "rgba(36, 68, 91, 0.82)", "rgba(190,229,239,0.4)", 7);
  text(ctx, model.fullscreenActive ? "×" : "□", 395, 29, 16, C.text, "center");
  box(ctx, { x: 52, y: 318 + offsetY, width: model.width - 104, height: 128 }, "rgba(16, 33, 58, 0.8)", C.player, 12);
  text(ctx, "STRATEGY GALALAXY", model.width / 2, 352 + offsetY, 19, C.text, "center");
  text(ctx, "PLAN · DEPLOY · WATCH THE LINE", model.width / 2, 379 + offsetY, 11, C.muted, "center");
  box(ctx, { x: 104, y: 398 + offsetY, width: model.width - 208, height: 34 }, "rgba(54,139,145,0.88)", "#b8edf0", 9);
  text(ctx, "TAP TO START", model.width / 2, 415 + offsetY, 11, C.text, "center");
};
const endState = (ctx, model) => {
  const win = model.state === MATCH_STATE.VICTORY;
  const offsetY = model.height / 2 - 380;
  box(ctx, { x: 72, y: 324 + offsetY, width: model.width - 144, height: 118 }, "rgba(16,33,58,0.84)", win ? C.player : C.enemy, 12);
  text(ctx, win ? "VICTORY" : "DEFEAT", model.width / 2, 360 + offsetY, 24, win ? C.player : C.enemy, "center");
  text(ctx, "TAP FOR A NEW MATCH", model.width / 2, 408 + offsetY, 11, C.text, "center");
};

export const renderUiLayer = (ctx, model) => {
  if (model.state === MATCH_STATE.TITLE) return title(ctx, model);
  const ui = commandUiLayout(model.height);
  header(ctx, model, ui);
  if (model.state === MATCH_STATE.COMMAND && model.simulation) {
    for (const rect of ui.lanes) laneSelector(ctx, model, rect);
    commandPanel(ctx, model, ui);
  } else if (model.state === MATCH_STATE.BATTLE) lanePressure(ctx, model, ui);
  else if (model.state === MATCH_STATE.VICTORY || model.state === MATCH_STATE.DEFEAT) endState(ctx, model);
  if (model.debugEnabled && model.lastAiDecision) text(ctx, `AI: ${laneName(model.lastAiDecision.defenseLane)} DEFEND · ${laneName(model.lastAiDecision.pushLane)} PUSH`, model.width / 2, ui.debugY, 9, "#d6c8ec", "center");
};
