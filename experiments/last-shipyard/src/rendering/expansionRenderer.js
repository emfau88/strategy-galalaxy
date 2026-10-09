import { EXPANSION_MISSIONS, expansionMissionById, expansionUnlocked, isPilotMission, nextExpansionMission } from "../data/campaignExpansion.js";
import { ACT_ONE_PRESETS } from "../data/expansionScenarios.js";
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
  const progress = model.expansionProgress, pilots = progress.mode === "pilots";
  const access = mission => pilots ? isPilotMission(mission) : expansionUnlocked(mission, progress.completed);
  label(ctx, "DIE LETZTE WERFT · NEUE KAMPAGNE", 28, at(58), 11, color.muted);
  if (model.menuScreen === "expansion") {
    label(ctx, "DEINE HEIMATWERFT", 28, at(106), 23);
    label(ctx, pilots ? "FREIE TESTS · ÖFFNEN KEINE KAMPAGNENMISSIONEN" : progress.harborActive ? `HAFEN IN BETRIEB · ${progress.completed.length}/4 EINSÄTZE` : `HAFEN OHNE VERSORGUNG · ${progress.completed.length}/4 EINSÄTZE`, 28, at(137), 10, progress.harborActive ? color.cyan : color.gold);
    const atlas = model.assets?.get("homeport-stations");
    if (atlas) {
      ctx.save(); ctx.globalAlpha = progress.harborActive ? 1 : .3;
      if (progress.harborActive) { ctx.shadowColor = color.cyan; ctx.shadowBlur = 12; }
      ctx.drawImage(atlas, 0, 0, atlas.naturalWidth / 2, atlas.naturalHeight, 328, at(73), 66, 66); ctx.restore();
    }
    button(ctx, ui.campaign, `${pilots ? "○" : "●"} KAMPAGNE · AKT I`);
    button(ctx, ui.pilots, `${pilots ? "●" : "○"} FREIE TESTEINSÄTZE`);
    for (const [index, rect] of ui.missions.entries()) {
      const mission = EXPANSION_MISSIONS[index];
      panel(ctx, rect, model.expansionProgress.lastPreviewId === mission.id);
      label(ctx, String(mission.number).padStart(2, "0"), rect.x + 12, rect.y + 26, 16, color.gold);
      label(ctx, mission.title, rect.x + 45, rect.y + 17, 13);
      const done = (pilots ? progress.pilotCompleted : progress.completed).includes(mission.id);
      const status = !mission.available ? "Vorschau" : done ? "✓ Abgeschlossen" : access(mission) ? "▶ EINSATZBEREIT" : pilots ? "Nur im Kampagnenweg" : `Nach Einsatz ${mission.number - 1}`;
      label(ctx, `${mission.map.lanes.length} ${mission.map.lanes.length === 1 ? "Lane" : "Lanes"} · ${status}`, rect.x + 45, rect.y + 36, 10, access(mission) ? color.cyan : color.muted);
    }
    button(ctx, ui.back, "ZUR BISHERIGEN KAMPAGNE");
  } else {
    const mission = expansionMissionById(model.selectedExpansionId) ?? EXPANSION_MISSIONS[0], map = mission.map;
    label(ctx, `EINSATZ ${String(mission.number).padStart(2, "0")} · ${mission.available ? pilots ? "FREIER TEST" : "KAMPAGNE · AKT I" : "KARTENVORSCHAU"}`, 28, at(100), 11, color.gold);
    wrap(ctx, mission.title, 28, at(130), 364, 23);
    const preset = ACT_ONE_PRESETS[mission.number];
    const equipment = { 1: "Scout · Fighter", 2: "Scout · Fighter · Bastion", 3: "Scout · Fighter · Bomber · 2 Bauplätze", 4: "Scout · Fighter · Bomber · Bastion · Aegis" }[mission.number];
    label(ctx, mission.available ? `${equipment} · ${preset.energy} E` : "Noch nicht spielbar · Bau- und Zielsysteme folgen", 28, at(186), 11, color.muted);
    drawMap(ctx, map, ui.map);
    label(ctx, "AUFTRAG", 210, at(231), 10, color.gold);
    const goalHeight = wrap(ctx, mission.objective, 210, at(255), 180, 11);
    const decisionY = at(255) + goalHeight + 20;
    label(ctx, "DEINE ENTSCHEIDUNG", 210, decisionY, 10, color.cyan);
    const decisionHeight = wrap(ctx, mission.decision, 210, decisionY + 24, 180, 11, color.muted);
    const infoY = decisionY + decisionHeight + 49;
    label(ctx, `${map.bounds.width} × ${map.bounds.height} · ${map.lanes.length} ${map.lanes.length === 1 ? "Lane" : "Lanes"}`, 210, infoY, 11);
    if (mission.available) {
      wrap(ctx, pilots ? "Vorgegebene Ausrüstung; eigener Testabschluss." : `Freischaltung: ${mission.reward}`, 210, infoY + 24, 180, 10, color.cyan);
      button(ctx, ui.start, !access(mission) ? pilots ? "IM KAMPAGNENWEG" : `ZUERST EINSATZ ${mission.number - 1}` : model.levelLoading ? "WIRD VORBEREITET …" : "EINSATZ STARTEN →", access(mission) && !model.levelLoading);
    }
    else wrap(ctx, `Belohnung: ${mission.reward}`, 210, infoY + 49, 180, 11, color.cyan);
    const notes = {
      1: ["FLOTTE öffnen, Scouts starten, mit Fightern ergänzen.", "ZUR FRONT zeigt den Vorstoß. Dein Carrier muss überleben."],
      2: ["Relais besetzen löst zwei Angriffe aus. Bastion: 140 E, 8s Bau.", "Die Flotte hält automatisch. Drones erobern keine Stationen."],
      3: ["Zwei Bauplätze: vorne abfangen oder hinten das Dock sichern.", "Drei Angriffe: Überfall, schwere Eskorte, Bomber-Belagerung."],
      4: ["Drei Ladungen: je 120 E + 16s mit Besatzung ohne Feinde.", "Aegis: 80 E, 6s Schutz für Carrier + Flotte/Anlage der Lane."],
    }[mission.number];
    label(ctx, notes ? notes[0] : "○ Zielanlage   □ Bauplatz   △ Startpunkt", 28, at(590), 10, color.muted);
    label(ctx, notes ? notes[1] : "Gestrichelt: Halteposition · gleicher Kartenmaßstab", 28, at(609), 10, color.muted);
    button(ctx, ui.previous, "← VORHERIGER EINSATZ", mission.number > 1);
    button(ctx, ui.next, "NÄCHSTER EINSATZ →", mission.number < 8);
    button(ctx, ui.back, "ZUR EINSATZÜBERSICHT");
  }
  label(ctx, model.expansionProgress.persistent ? "Eigener Fortschritt · bisherige Kampagne bleibt erhalten." : "Auswahl und Fortschritt bleiben nur in dieser Sitzung", 28, at(746), 9, color.muted);
};

export const renderExpansionResult = (ctx, model) => {
  const win = model.state === "VICTORY", y = model.height / 2;
  const state = model.simulation.state, ferry = model.mission.goal.kind === "evacuate", number = model.mission.number;
  const campaign = model.expansionRunMode === "campaign";
  const run = model.director.missionRuntime.snapshot(state);
  ctx.fillStyle = "rgba(3,10,20,.8)"; ctx.fillRect(0, 0, model.width, model.height);
  panel(ctx, { x: 28, y: y - 192, width: 364, height: 370 });
  label(ctx, campaign ? "DIE LETZTE WERFT · KAMPAGNE" : "DIE LETZTE WERFT · FREIER TEST", 52, y - 153, 11, color.gold);
  const headline = { 1: "KORRIDOR GEÖFFNET", 2: "AUSSENPOSTEN GESICHERT", 3: "HAFEN IN BETRIEB", 4: "EVAKUIERUNG GELUNGEN" }[number];
  label(ctx, win ? headline : state.structures.get("player-hq")?.alive ? ferry ? "SPRUNGSTATION VERLOREN" : "HAFENDOCK VERLOREN" : "CARRIER VERLOREN", 52, y - 113, 19, win ? color.cyan : color.red);
  label(ctx, model.mission.title, 52, y - 79, 14);
  const summary = { 1: "Der Versorgungsweg ist frei. Jetzt kann der Außenposten aufgebaut werden.", 2: "Relais gehalten, beide Gegenangriffe abgewehrt. Der Weg zum Hafen ist offen.", 3: "Dock und Carrier gerettet. Die Heimatwerft hat wieder Energie und Licht.", 4: "Drei Ladungen gerettet. Fachleute bereiten die nächste Forschungsmission vor." }[number];
  wrap(ctx, win ? summary : model.mission.objective, 52, y - 41, 316, 11);
  const ui = campaignResultLayout(model.height);
  const next = nextExpansionMission(model.mission);
  if (campaign && win) {
    label(ctx, `GESICHERT: ${model.mission.reward.split(" · ")[0]}`, 52, y + 6, 11, color.cyan);
    if (next?.available) button(ctx, ui.next, `WEITER: ${next.title.toUpperCase()} →`);
    else wrap(ctx, "AKT I ABGESCHLOSSEN · Vier Einsätze frei wiederholbar. Forschung und Akt II folgen im nächsten Ausbau.", 52, y + 38, 316, 10, color.gold);
  } else wrap(ctx, campaign ? "Deine Freischaltungen bleiben erhalten. Wiederholen kostet keine dauerhafte Ressource." : "Freie Tests speichern ihren eigenen Abschluss. Der Kampagnenweg beginnt mit Einsatz 1.", 52, y + 23, 316, 10, color.muted);
  button(ctx, ui.retry, "ERNEUT SPIELEN"); button(ctx, ui.menu, campaign ? "ZUR WERFT" : "TESTEINSÄTZE");
  label(ctx, model.expansionProgress.persistent ? "Fortschritt gespeichert" : "Fortschritt nur in dieser Sitzung", 52, y + 159, 10, color.muted);
};
