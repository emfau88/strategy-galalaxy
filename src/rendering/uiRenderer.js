import { LANE, MATCH_STATE, TEAM } from "../core/constants.js";
import { UNIT_DEFINITIONS } from "../data/definitions.js";
import { COMMAND_UI } from "../ui/commandUi.js";

const C = Object.freeze({ panel: "rgba(5,15,34,.82)", outline: "rgba(143,218,255,.38)", text: "#d9f4ff", muted: "#98b7d6", player: "#76ddff", enemy: "#ff9ca7", gold: "#f9d783", selected: "rgba(55,173,230,.36)", button: "rgba(18,48,82,.92)" });
const text = (ctx, value, x, y, size, color, align = "left") => { ctx.fillStyle = color; ctx.font = `600 ${size}px Inter, system-ui, sans-serif`; ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillText(value, x, y); };
const box = (ctx, rect, fill = C.panel, stroke = C.outline) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 8); else ctx.rect(rect.x, rect.y, rect.width, rect.height); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); } };
const laneName = (laneId) => (laneId === LANE.LEFT ? "LEFT" : "RIGHT");
const prefix = (team) => (team === TEAM.PLAYER ? "player" : "enemy");
const structure = (simulation, team, type, laneId = null) => simulation?.state.structures.get(`${prefix(team)}-${type === "hq" ? "hq" : `${laneId === LANE.LEFT ? "left" : "right"}-turret`}`);
const hp = (value) => value?.alive ? `${Math.max(0, Math.round(value.hp / value.maxHp * 100))}%` : "DOWN";
const queue = (model, laneId) => model.director?.queuedWaves.get(TEAM.PLAYER).get(laneId) ?? [];
const plannedCost = (entries) => entries.reduce((total, entry) => total + entry.paidCost, 0);

const header = (ctx, model) => {
  const { width, state, phaseRemaining, economy, simulation } = model;
  box(ctx, { x: 16, y: 16, width: width - 32, height: 78 });
  const stateLabel = state === MATCH_STATE.COMMAND ? "COMMAND PHASE" : state === MATCH_STATE.BATTLE ? "BATTLE PHASE" : state.replace("_", " ");
  text(ctx, "STRATEGY GALALAXY", 28, 38, 15, C.text);
  text(ctx, stateLabel, width - 28, 38, 12, state === MATCH_STATE.COMMAND ? C.gold : C.player, "right");
  text(ctx, `HQ ${hp(structure(simulation, TEAM.PLAYER, "hq"))}`, 28, 66, 11, C.player);
  text(ctx, `${phaseRemaining.toFixed(1)}s`, width / 2, 66, 16, C.text, "center");
  const playerIncome = economy && simulation ? Math.round(economy.incomePerSecond(simulation.state, TEAM.PLAYER, model.activeBattleSeconds)) : 0;
  const enemyIncome = economy && simulation ? Math.round(economy.incomePerSecond(simulation.state, TEAM.ENEMY, model.activeBattleSeconds)) : 0;
  text(ctx, `E ${economy ? Math.floor(economy.get(TEAM.PLAYER).energy) : 0} · +${playerIncome}/s`, width / 2 - 42, 84, 10, C.player, "center");
  text(ctx, `ENEMY ${economy ? Math.floor(economy.get(TEAM.ENEMY).energy) : 0} · +${enemyIncome}/s`, width - 28, 66, 11, C.enemy, "right");
  text(ctx, `HQ ${hp(structure(simulation, TEAM.ENEMY, "hq"))}`, width - 28, 84, 10, C.enemy, "right");
};

const laneSelectors = (ctx, model) => {
  for (const rect of COMMAND_UI.lanes) {
    const selected = model.selectedLaneId === rect.laneId;
    const node = [...model.simulation.state.nodes.values()].find((value) => value.laneId === rect.laneId);
    const nodeLabel = node.ownerTeam === TEAM.PLAYER ? "NODE: YOU" : node.ownerTeam === TEAM.ENEMY ? "NODE: ENEMY" : node.contested ? "NODE: CONTESTED" : "NODE: NEUTRAL";
    box(ctx, rect, selected ? C.selected : "rgba(6,20,43,.66)", selected ? C.player : C.outline);
    text(ctx, `${laneName(rect.laneId)} LANE`, rect.x + 12, rect.y + 15, 11, selected ? C.text : C.muted);
    const planned = queue(model, rect.laneId);
    text(ctx, `AUTO 2 · PLAN ${planned.length} / ${plannedCost(planned)} E`, rect.x + 12, rect.y + 31, 10, C.text);
    text(ctx, nodeLabel, rect.x + rect.width - 10, rect.y + 15, 9, node.ownerTeam === TEAM.PLAYER ? C.player : node.ownerTeam === TEAM.ENEMY ? C.enemy : C.muted, "right");
  }
};

const commandPanel = (ctx, model) => {
  const queued = queue(model, model.selectedLaneId);
  box(ctx, { x: 10, y: 502, width: 282, height: 236 }, "rgba(4,13,30,.87)");
  text(ctx, `${laneName(model.selectedLaneId)} · ${queued.length} PLANNED · ${plannedCost(queued)} E`, 20, 534, 12, C.text);
  box(ctx, COMMAND_UI.undo, queued.length ? "rgba(84,52,82,.9)" : "rgba(28,40,58,.8)");
  text(ctx, "UNDO LAST", 227, 534, 10, queued.length ? "#ffd1e4" : C.muted, "center");
  for (const rect of COMMAND_UI.units) {
    const def = UNIT_DEFINITIONS[rect.unitType]; const affordable = model.economy.get(TEAM.PLAYER).energy >= def.cost;
    box(ctx, rect, affordable ? C.button : "rgba(25,36,54,.9)", affordable ? C.outline : null);
    text(ctx, def.id.toUpperCase(), rect.x + 10, rect.y + 17, 11, affordable ? C.text : C.muted); text(ctx, `${def.cost} E`, rect.x + 10, rect.y + 34, 10, affordable ? C.gold : C.muted);
  }
  for (const rect of COMMAND_UI.upgrades) {
    const cost = model.economy.upgradeCost(TEAM.PLAYER, rect.upgradeId); const affordable = model.economy.get(TEAM.PLAYER).energy >= cost;
    box(ctx, rect, affordable ? "rgba(28,63,77,.93)" : "rgba(25,36,54,.9)", affordable ? C.outline : null);
    text(ctx, rect.upgradeId === "economy" ? "ECONOMY" : "TURRETS", rect.x + 10, rect.y + 18, 10, affordable ? C.text : C.muted); text(ctx, `${cost} E`, rect.x + 10, rect.y + 35, 10, affordable ? C.gold : C.muted);
  }
  box(ctx, COMMAND_UI.deploy, "rgba(19,107,126,.94)", "#7fe5ff");
  text(ctx, "DEPLOY", 349, 638, 15, "#e7fbff", "center"); text(ctx, "WAVE", 349, 659, 15, "#e7fbff", "center"); text(ctx, "START BATTLE", 349, 686, 9, "#a9ebf8", "center");
  if (model.commandFeedback) text(ctx, model.commandFeedback, 210, 490, 10, C.gold, "center");
};

const battleReadout = (ctx, model) => {
  for (const laneId of [LANE.LEFT, LANE.RIGHT]) {
    const x = laneId === LANE.LEFT ? 20 : 230; const lane = model.simulation.state.lanes.get(laneId);
    box(ctx, { x, y: 106, width: 170, height: 44 }, "rgba(5,15,34,.65)");
    text(ctx, `${laneName(laneId)} · ${lane.unitIds.get(TEAM.PLAYER).length} vs ${lane.unitIds.get(TEAM.ENEMY).length}`, x + 10, 121, 10, C.text);
    text(ctx, `T ${hp(structure(model.simulation, TEAM.PLAYER, "turret", laneId))} / ${hp(structure(model.simulation, TEAM.ENEMY, "turret", laneId))}`, x + 10, 138, 9, C.muted);
  }
  text(ctx, "AUTOMATIC COMBAT · PLAN NEXT WAVE AFTER THE TIMER", model.width / 2, 488, 10, C.muted, "center");
};

const title = (ctx, model) => { box(ctx, { x: 44, y: 286, width: model.width - 88, height: 170 }, "rgba(4,13,30,.86)", "#7fd2ff"); text(ctx, "STRATEGY GALALAXY", model.width / 2, 338, 20, C.text, "center"); text(ctx, "PLAN TWO LANES. DEPLOY. HOLD THE LINE.", model.width / 2, 370, 10, C.muted, "center"); box(ctx, { x: 96, y: 397, width: model.width - 192, height: 40 }, "rgba(19,107,126,.94)", "#7fe5ff"); text(ctx, "TAP TO START", model.width / 2, 417, 12, C.text, "center"); };
const endState = (ctx, model) => { const victory = model.state === MATCH_STATE.VICTORY; box(ctx, { x: 64, y: 304, width: model.width - 128, height: 142 }, "rgba(4,13,30,.9)", victory ? C.player : C.enemy); text(ctx, victory ? "VICTORY" : "DEFEAT", model.width / 2, 350, 24, victory ? C.player : C.enemy, "center"); text(ctx, "TAP TO START A NEW MATCH", model.width / 2, 404, 11, C.text, "center"); };

export const renderUiLayer = (ctx, model) => {
  if (model.state === MATCH_STATE.TITLE) return title(ctx, model);
  header(ctx, model);
  if (model.state === MATCH_STATE.COMMAND && model.simulation) { laneSelectors(ctx, model); commandPanel(ctx, model); }
  else if (model.state === MATCH_STATE.BATTLE) battleReadout(ctx, model);
  else if (model.state === MATCH_STATE.VICTORY || model.state === MATCH_STATE.DEFEAT) endState(ctx, model);
  if (model.debugEnabled || model.testMode) {
    text(ctx, model.testMode ? "TEST MODE" : "DEBUG MODE", 18, model.height - 16, 10, C.gold);
    const decision = model.lastAiDecision;
    if (model.debugEnabled && decision) text(ctx, `AI D ${laneName(decision.defenseLane)} · P ${laneName(decision.pushLane)} · ${decision.spent} E`, model.width - 18, model.height - 16, 10, "#d0bbff", "right");
  }
};
