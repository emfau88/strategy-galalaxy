import { EXPANSION_MISSIONS, expansionMissionById } from "../data/campaignExpansion.js";
import { expansionUiLayout } from "../ui/expansionUi.js";
import { TEAM } from "../core/constants.js";
import { campaignResultLayout } from "../ui/campaignUi.js";

const color = { text: "#f5eddd", muted: "#a7b5c5", cyan: "#80dedb", gold: "#d3b079", red: "#e99186" };
const label = (ctx, value, x, y, size = 12, fill = color.text) => {
  ctx.font = `600 ${size}px Inter, system-ui, sans-serif`; ctx.fillStyle = fill; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(value, x, y);
};
const wrap = (ctx, value, x, y, width, size = 12, fill = color.text) => {
  let line = "", row = 0;
  ctx.font = `600 ${size}px Inter, system-ui, sans-serif`;
  for (const word of value.split(" ")) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > width) { label(ctx, line, x, y + row++ * 18, size, fill); line = word; }
    else line = candidate;
  }
  label(ctx, line, x, y + row * 18, size, fill);
  return (row + 1) * 18;
};
const panel = (ctx, rect, active = false) => {
  ctx.beginPath(); ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 9);
  ctx.fillStyle = "rgba(9,22,36,.96)"; ctx.fill(); ctx.strokeStyle = active ? color.cyan : "#334558"; ctx.lineWidth = 1; ctx.stroke();
};
const button = (ctx, rect, text, enabled = true) => { panel(ctx, rect); label(ctx, text, rect.x + 15, rect.y + rect.height / 2, 11, enabled ? color.text : color.muted); };

const drawMap = (ctx, map, rect) => {
  panel(ctx, rect);
  // All eight views use one scale: a shorter map really looks shorter here.
  const scale = (rect.height - 30) / 1380;
  const x = rect.x + (rect.width - map.bounds.width * scale) / 2, y = rect.y + rect.height - 15 - map.bounds.height * scale;
  const px = worldX => x + worldX * scale, py = worldY => y + worldY * scale;
  ctx.fillStyle = "#132b3b"; ctx.fillRect(x, y, map.bounds.width * scale, map.bounds.height * scale);
  for (const lane of map.lanes) {
    ctx.fillStyle = "rgba(128,222,219,.06)"; ctx.fillRect(px(lane.centerX - lane.width / 2), y, lane.width * scale, map.bounds.height * scale);
    ctx.strokeStyle = "#38556a"; ctx.beginPath(); ctx.moveTo(px(lane.centerX), py(lane.enemySpawn.y)); ctx.lineTo(px(lane.centerX), py(lane.playerSpawn.y)); ctx.stroke();
    for (const [spawn, tint, direction] of [[lane.playerSpawn, color.cyan, -1], [lane.enemySpawn, color.red, 1]]) {
      ctx.fillStyle = tint; ctx.beginPath(); ctx.moveTo(px(spawn.x), py(spawn.y) + direction * 5); ctx.lineTo(px(spawn.x) - 4, py(spawn.y) - direction * 4); ctx.lineTo(px(spawn.x) + 4, py(spawn.y) - direction * 4); ctx.fill();
    }
    ctx.strokeStyle = color.cyan; ctx.setLineDash([3, 3]); ctx.beginPath();
    ctx.moveTo(px(lane.centerX - lane.width / 2), py(lane.anchors.holdY)); ctx.lineTo(px(lane.centerX + lane.width / 2), py(lane.anchors.holdY)); ctx.stroke(); ctx.setLineDash([]);
  }
  for (const structure of map.structures) { ctx.fillStyle = structure.team === TEAM.PLAYER ? color.cyan : color.red; ctx.fillRect(px(structure.x) - 8, py(structure.y) - 3, 16, 6); }
  for (const site of map.buildPads) { ctx.strokeStyle = color.cyan; ctx.strokeRect(px(site.x) - 5, py(site.y) - 5, 10, 10); }
  for (const site of map.markers) { ctx.strokeStyle = site.kind === "sabotage" ? color.red : color.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px(site.x), py(site.y), 6, 0, Math.PI * 2); ctx.stroke(); }
};

export const renderExpansionMenu = (ctx, model) => {
  const ui = expansionUiLayout(model.height), at = y => y + model.height / 2 - 380;
  label(ctx, "DIE LETZTE WERFT · NEUE KAMPAGNE", 28, at(58), 11, color.muted);
  if (model.menuScreen === "expansion") {
    label(ctx, "EIN SEKTOR ERWACHT", 28, at(110), 25);
    label(ctx, "2 TESTEINSÄTZE SPIELBAR · 6 KARTENVORSCHAUEN", 28, at(149), 10, color.gold);
    label(ctx, "Außenposten und Fähre direkt mit Startausrüstung spielen", 28, at(170), 10, color.muted);
    for (const [index, rect] of ui.missions.entries()) {
      const mission = EXPANSION_MISSIONS[index];
      panel(ctx, rect, model.expansionProgress.lastPreviewId === mission.id);
      label(ctx, String(mission.number).padStart(2, "0"), rect.x + 12, rect.y + 26, 16, color.gold);
      label(ctx, mission.title, rect.x + 45, rect.y + 17, 13);
      const status = model.expansionProgress.completed.includes(mission.id) ? "✓ Abgeschlossen" : mission.available ? "▶ SPIELBAR" : "Vorschau";
      label(ctx, `${mission.map.lanes.length} ${mission.map.lanes.length === 1 ? "Lane" : "Lanes"} · ${mission.map.sectorTheme} · ${status}`, rect.x + 45, rect.y + 36, 9, mission.available ? color.cyan : color.muted);
    }
    button(ctx, ui.back, "ZUR BISHERIGEN KAMPAGNE");
  } else {
    const mission = expansionMissionById(model.selectedExpansionId) ?? EXPANSION_MISSIONS[0], map = mission.map;
    label(ctx, `EINSATZ ${String(mission.number).padStart(2, "0")} · ${mission.available ? "SPIELBARER TEST" : "KARTENVORSCHAU"}`, 28, at(100), 11, color.gold);
    wrap(ctx, mission.title, 28, at(130), 364, 23);
    label(ctx, mission.available ? mission.number === 2 ? "Scout · Fighter · Bastion · 300 E Startenergie" : "Scout · Fighter · Bomber · Bastion · Aegis · 340 E" : "Noch nicht spielbar · Bau- und Zielsysteme folgen", 28, at(186), 11, color.muted);
    drawMap(ctx, map, ui.map);
    label(ctx, "AUFTRAG", 210, at(231), 10, color.gold);
    const goalHeight = wrap(ctx, mission.objective, 210, at(255), 180, 11);
    const decisionY = at(255) + goalHeight + 20;
    label(ctx, "DEINE ENTSCHEIDUNG", 210, decisionY, 10, color.cyan);
    const decisionHeight = wrap(ctx, mission.decision, 210, decisionY + 24, 180, 11, color.muted);
    const infoY = decisionY + decisionHeight + 49;
    label(ctx, `${map.bounds.width} × ${map.bounds.height} · ${map.lanes.length} ${map.lanes.length === 1 ? "Lane" : "Lanes"}`, 210, infoY, 11);
    label(ctx, `${map.buildPads.length} ${mission.available ? "fester Bauplatz · 140 E" : "feste Bauplätze geplant"}`, 210, infoY + 23, 11, color.muted);
    if (mission.available) button(ctx, ui.start, model.levelLoading ? "WIRD VORBEREITET …" : "TESTEINSATZ STARTEN →", !model.levelLoading);
    else wrap(ctx, `Belohnung: ${mission.reward}`, 210, infoY + 49, 180, 11, color.cyan);
    label(ctx, mission.available ? mission.number === 2 ? "Relais besetzen löst zwei Angriffe aus. Flotte hält automatisch." : "Drei Ladungen: je 120 E + 16s mit Besatzung ohne Feinde." : "○ Zielanlage   □ Bauplatz   △ Startpunkt", 28, at(590), 10, color.muted);
    label(ctx, mission.available ? mission.number === 2 ? "Max. 12 Schiffe · +10 E/s · Bauplan-Freischaltungen folgen." : "Max. 16 Schiffe · +12 E/s · Aegis schützt Carrier + Schiffe." : "Gestrichelt: Halteposition · gleicher Kartenmaßstab", 28, at(609), 10, color.muted);
    button(ctx, ui.previous, "← VORHERIGER EINSATZ", mission.number > 1);
    button(ctx, ui.next, "NÄCHSTER EINSATZ →", mission.number < 8);
    button(ctx, ui.back, "ZUR EINSATZÜBERSICHT");
  }
  label(ctx, model.expansionProgress.persistent ? "Eigener Fortschritt · bisherige Kampagne bleibt erhalten." : "Auswahl und Fortschritt bleiben nur in dieser Sitzung", 28, at(746), 9, color.muted);
};

export const renderExpansionResult = (ctx, model) => {
  const win = model.state === "VICTORY", y = model.height / 2;
  const state = model.simulation.state, ferry = model.mission.goal.kind === "evacuate";
  const run = model.director.missionRuntime.snapshot(state);
  ctx.fillStyle = "rgba(3,10,20,.8)"; ctx.fillRect(0, 0, model.width, model.height);
  panel(ctx, { x: 28, y: y - 192, width: 364, height: 370 });
  label(ctx, "DIE LETZTE WERFT · TESTEINSATZ", 52, y - 153, 11, color.gold);
  label(ctx, win ? ferry ? "EVAKUIERUNG GELUNGEN" : "AUSSENPOSTEN GESICHERT" : state.structures.get("player-hq")?.alive ? "SPRUNGSTATION VERLOREN" : "CARRIER VERLOREN", 52, y - 113, 19, win ? color.cyan : color.red);
  label(ctx, model.mission.title, 52, y - 79, 14);
  wrap(ctx, win ? ferry ? "Alle drei Rettungsladungen sind durch. Station und Carrier haben überlebt." : "Relais gehalten und beide Gegenangriffe abgewehrt." : ferry ? `${run.project.completed}/3 Ladungen gerettet. Verteidige Station links und Carrier rechts.` : `${run.defeatedAttacks}/2 Angriffe abgewehrt. Sichere das Relais mit Kauf-Schiffen und nutze bei Bedarf die Bastion.`, 52, y - 41, 316, 12);
  wrap(ctx, "Dieser Test speichert seinen Abschluss separat. Baupläne und die zusammenhängende Kampagne folgen im Ausbau.", 52, y + 23, 316, 10, color.muted);
  const ui = campaignResultLayout(model.height);
  button(ctx, ui.retry, "ERNEUT SPIELEN"); button(ctx, ui.menu, "TESTEINSÄTZE");
  label(ctx, model.expansionProgress.persistent ? "Fortschritt gespeichert" : "Fortschritt nur in dieser Sitzung", 52, y + 159, 10, color.muted);
};
