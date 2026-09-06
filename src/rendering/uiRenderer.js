import { LANE, MATCH_STATE, TEAM } from "../core/constants.js";
import { UNIT_DEFINITIONS } from "../data/definitions.js";
import { COMMAND_UI } from "../ui/commandUi.js";

const C = Object.freeze({ panel: "rgba(5, 13, 29, 0.94)", outline: "rgba(134, 221, 255, 0.55)", text: "#edf8ff", muted: "#a8bed3", player: "#70dcff", enemy: "#ff9d98", gold: "#ffd77f", select: "rgba(36, 130, 165, 0.95)", card: "rgba(16, 42, 70, 0.97)" });
const text = (ctx, value, x, y, size, color, align = "left") => { ctx.fillStyle = color; ctx.font = `700 ${size}px Inter, system-ui, sans-serif`; ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillText(value, x, y); };
const box = (ctx, rect, fill = C.panel, stroke = C.outline, radius = 7) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(rect.x, rect.y, rect.width, rect.height, radius); else ctx.rect(rect.x, rect.y, rect.width, rect.height); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); } };
const laneName = (laneId) => (laneId === LANE.LEFT ? "LEFT" : "RIGHT");
const queue = (model, laneId) => model.director?.queuedWaves.get(TEAM.PLAYER).get(laneId) ?? [];
const plannedCost = (entries) => entries.reduce((total, entry) => total + entry.paidCost, 0);
const structure = (simulation, id) => simulation?.state.structures.get(id);
const ratio = (target) => target?.alive ? Math.max(0, Math.round(target.hp / target.maxHp * 100)) : 0;

const header = (ctx, model) => {
  const economy = model.economy;
  const playerHq = structure(model.simulation, "player-hq");
  const enemyHq = structure(model.simulation, "enemy-hq");
  const income = economy && model.simulation ? Math.round(economy.incomePerSecond(model.simulation.state, TEAM.PLAYER, model.activeBattleSeconds)) : 0;
  box(ctx, { x: 8, y: 8, width: model.width - 16, height: 48 }, C.panel, "rgba(161, 220, 255, 0.34)");
  text(ctx, `YOU  ${ratio(playerHq)}%`, 18, 24, 13, C.player);
  text(ctx, `${economy ? Math.floor(economy.get(TEAM.PLAYER).energy) : 0} E  +${income}/s`, 18, 42, 12, C.text);
  const phase = model.state === MATCH_STATE.COMMAND ? "COMMAND" : model.state === MATCH_STATE.BATTLE ? "BATTLE" : model.state;
  text(ctx, phase, model.width / 2, 23, 13, model.state === MATCH_STATE.COMMAND ? C.gold : C.text, "center");
  text(ctx, `${Math.ceil(model.phaseRemaining)} SEC`, model.width / 2, 42, 15, C.text, "center");
  text(ctx, `ENEMY  ${ratio(enemyHq)}%`, model.width - 18, 24, 13, C.enemy, "right");
  text(ctx, "HEADQUARTERS", model.width - 18, 42, 10, C.muted, "right");
};

const laneSelector = (ctx, model, rect) => {
  const selected = model.selectedLaneId === rect.laneId;
  const entries = queue(model, rect.laneId);
  box(ctx, rect, selected ? C.select : "rgba(5, 18, 38, 0.9)", selected ? C.player : "rgba(112, 220, 255, 0.32)");
  text(ctx, laneName(rect.laneId), rect.x + rect.width / 2, rect.y + 17, 12, C.text, "center");
  text(ctx, `${entries.length} SHIPS`, rect.x + rect.width / 2, rect.y + 34, 11, C.gold, "center");
  text(ctx, `${plannedCost(entries)} E`, rect.x + rect.width / 2, rect.y + 48, 10, C.muted, "center");
};

const unitCard = (ctx, model, rect) => {
  const def = UNIT_DEFINITIONS[rect.unitType];
  const affordable = model.economy.get(TEAM.PLAYER).energy >= def.cost;
  box(ctx, rect, affordable ? C.card : "rgba(28, 37, 50, 0.97)", affordable ? C.outline : null);
  const sprite = model.assets?.get(`nairan-${rect.unitType}`);
  if (sprite) ctx.drawImage(sprite, rect.x + 8, rect.y + 7, 28, 28);
  text(ctx, def.id.toUpperCase(), rect.x + 42, rect.y + 15, 12, affordable ? C.text : C.muted);
  text(ctx, `${def.cost} E`, rect.x + 42, rect.y + 30, 11, affordable ? C.gold : C.muted);
};

const upgradeCard = (ctx, model, rect) => {
  const cost = model.economy.upgradeCost(TEAM.PLAYER, rect.upgradeId);
  const affordable = model.economy.get(TEAM.PLAYER).energy >= cost;
  const level = model.economy.get(TEAM.PLAYER)[rect.upgradeId === "economy" ? "economyLevel" : "turretLevel"];
  box(ctx, rect, affordable ? "rgba(23, 67, 77, 0.98)" : "rgba(28, 37, 50, 0.97)", affordable ? C.outline : null);
  text(ctx, rect.upgradeId === "economy" ? "ECONOMY" : "TURRETS", rect.x + 11, rect.y + 15, 12, affordable ? C.text : C.muted);
  text(ctx, `LV ${level} · ${cost} E`, rect.x + 11, rect.y + 30, 11, affordable ? C.gold : C.muted);
};

const commandPanel = (ctx, model) => {
  const entries = queue(model, model.selectedLaneId);
  box(ctx, { x: 8, y: 602, width: model.width - 16, height: 150 }, "rgba(4, 12, 27, 0.96)", "rgba(142, 220, 255, 0.45)");
  text(ctx, `${laneName(model.selectedLaneId)} LANE`, 18, 624, 14, C.text);
  text(ctx, `${entries.length} PLANNED · ${plannedCost(entries)} E`, 18, 642, 11, C.muted);
  box(ctx, COMMAND_UI.undo, entries.length ? "rgba(75, 45, 72, 0.98)" : "rgba(28, 37, 50, 0.95)");
  text(ctx, "UNDO", COMMAND_UI.undo.x + 56, COMMAND_UI.undo.y + 17, 12, entries.length ? "#ffd5e5" : C.muted, "center");
  box(ctx, COMMAND_UI.menu, "rgba(16, 54, 75, 0.98)");
  text(ctx, model.commandMenu === "units" ? "UPGRADES" : "SHIPS", COMMAND_UI.menu.x + 56, COMMAND_UI.menu.y + 17, 11, C.text, "center");
  const cards = model.commandMenu === "units" ? COMMAND_UI.units : COMMAND_UI.upgrades;
  for (const rect of cards) {
    if (model.commandMenu === "units") unitCard(ctx, model, rect);
    else upgradeCard(ctx, model, rect);
  }
  box(ctx, COMMAND_UI.deploy, "rgba(17, 120, 133, 0.98)", "#a5efff");
  text(ctx, "DEPLOY", COMMAND_UI.deploy.x + 55, COMMAND_UI.deploy.y + 34, 16, C.text, "center");
  text(ctx, "WAVE", COMMAND_UI.deploy.x + 55, COMMAND_UI.deploy.y + 54, 16, C.text, "center");
  text(ctx, "START", COMMAND_UI.deploy.x + 55, COMMAND_UI.deploy.y + 73, 10, "#bff4ff", "center");
  if (model.commandFeedback) text(ctx, model.commandFeedback, model.width / 2, 588, 12, C.gold, "center");
};

const laneStatus = (ctx, model, laneId, rect) => {
  const lane = model.simulation.state.lanes.get(laneId);
  const node = [...model.simulation.state.nodes.values()].find((item) => item.laneId === laneId);
  const selectedColor = node.ownerTeam === TEAM.PLAYER ? C.player : node.ownerTeam === TEAM.ENEMY ? C.enemy : C.muted;
  box(ctx, rect, "rgba(5, 18, 38, 0.88)", "rgba(112, 220, 255, 0.27)");
  text(ctx, laneId === LANE.LEFT ? "L" : "R", rect.x + rect.width / 2, rect.y + 15, 15, C.text, "center");
  text(ctx, `${lane.unitIds.get(TEAM.PLAYER).length}/${lane.unitIds.get(TEAM.ENEMY).length}`, rect.x + rect.width / 2, rect.y + 33, 12, C.text, "center");
  text(ctx, node.ownerTeam === TEAM.PLAYER ? "YOU" : node.ownerTeam === TEAM.ENEMY ? "EN" : "—", rect.x + rect.width / 2, rect.y + 48, 10, selectedColor, "center");
};

const title = (ctx, model) => { box(ctx, { x: 52, y: 318, width: model.width - 104, height: 128 }, "rgba(4, 13, 30, 0.94)", C.player); text(ctx, "STRATEGY GALALAXY", model.width / 2, 352, 19, C.text, "center"); text(ctx, "PLAN · DEPLOY · HOLD THE LINE", model.width / 2, 379, 12, C.muted, "center"); box(ctx, { x: 104, y: 398, width: model.width - 208, height: 34 }, "rgba(17, 120, 133, 0.98)", "#a5efff"); text(ctx, "TAP TO START", model.width / 2, 415, 12, C.text, "center"); };
const endState = (ctx, model) => { const win = model.state === MATCH_STATE.VICTORY; box(ctx, { x: 72, y: 324, width: model.width - 144, height: 118 }, "rgba(4, 13, 30, 0.95)", win ? C.player : C.enemy); text(ctx, win ? "VICTORY" : "DEFEAT", model.width / 2, 360, 24, win ? C.player : C.enemy, "center"); text(ctx, "TAP FOR A NEW MATCH", model.width / 2, 408, 12, C.text, "center"); };

export const renderUiLayer = (ctx, model) => {
  if (model.state === MATCH_STATE.TITLE) return title(ctx, model);
  header(ctx, model);
  if (model.state === MATCH_STATE.COMMAND && model.simulation) {
    for (const rect of COMMAND_UI.lanes) laneSelector(ctx, model, rect);
    commandPanel(ctx, model);
  } else if (model.state === MATCH_STATE.BATTLE) {
    laneStatus(ctx, model, LANE.LEFT, { x: 8, y: 218, width: 76, height: 58 });
    laneStatus(ctx, model, LANE.RIGHT, { x: 336, y: 218, width: 76, height: 58 });
    text(ctx, "AUTOMATIC COMBAT", model.width / 2, 588, 12, C.muted, "center");
  } else if (model.state === MATCH_STATE.VICTORY || model.state === MATCH_STATE.DEFEAT) endState(ctx, model);
  if (model.debugEnabled && model.lastAiDecision) text(ctx, `AI: ${laneName(model.lastAiDecision.defenseLane)} DEFEND · ${laneName(model.lastAiDecision.pushLane)} PUSH`, model.width / 2, 576, 10, "#d6bdff", "center");
};
