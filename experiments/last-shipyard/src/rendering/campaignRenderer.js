import { EXPERIMENT } from "../experiment.js";
import { MISSIONS, missionById, missionUnlocked, nextMission, missionForProgress } from "../data/campaign.js";
import { campaignUiLayout, campaignResultLayout } from "../ui/campaignUi.js";
import { expansionUiLayout } from "../ui/expansionUi.js";
import { renderExpansionMenu, renderExpansionResult } from "./expansionRenderer.js";
import { isExpansionMission } from "../data/expansionScenarios.js";

const C = { ivory: "#f5eddd", muted: "#9faebf", cyan: "#80dedb", brass: "#c7a46b", line: "rgba(188,210,222,.18)" };
const text = (ctx, value, x, y, size = 12, color = C.ivory, align = "left", weight = 500) => {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px Inter, system-ui, sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillText(value, x, y);
};
const panel = (ctx, r, active = false) => {
  ctx.beginPath(); ctx.roundRect(r.x, r.y, r.width, r.height, 10);
  ctx.fillStyle = active ? "rgba(22,46,59,.97)" : "rgba(10,22,36,.94)"; ctx.fill();
  ctx.strokeStyle = active ? "rgba(128,222,219,.55)" : C.line; ctx.lineWidth = 1; ctx.stroke();
};
const button = (ctx, r, label, primary = false, enabled = true) => {
  panel(ctx, r, primary && enabled);
  if (primary && enabled) { ctx.fillStyle = C.cyan; ctx.fillRect(r.x + 1, r.y + 12, 3, r.height - 24); }
  text(ctx, label, r.x + r.width / 2, r.y + r.height / 2, 12, enabled ? C.ivory : C.muted, "center", 700);
};
const wrap = (ctx, value, x, y, maxWidth, size = 12, color = C.muted, lineHeight = 19) => {
  ctx.font = `500 ${size}px Inter, system-ui, sans-serif`;
  let line = "", row = 0;
  for (const word of value.split(" ")) {
    const trial = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(trial).width > maxWidth) { text(ctx, line, x, y + row++ * lineHeight, size, color); line = word; }
    else line = trial;
  }
  text(ctx, line, x, y + row * lineHeight, size, color);
  return (row + 1) * lineHeight;
};

// Vector dock emblem: readable at small sizes, with no additional image request.
const emblem = (ctx, x, y, size = 28) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 28, size / 28);
  ctx.strokeStyle = C.brass; ctx.lineWidth = 1.5; ctx.beginPath();
  ctx.moveTo(-12, -12); ctx.lineTo(-12, 9); ctx.lineTo(-4, 13);
  ctx.moveTo(12, -12); ctx.lineTo(12, 9); ctx.lineTo(4, 13);
  ctx.moveTo(-7, -8); ctx.lineTo(-7, 6); ctx.moveTo(7, -8); ctx.lineTo(7, 6); ctx.stroke();
  ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(4, 4); ctx.lineTo(0, 9); ctx.lineTo(-4, 4); ctx.closePath(); ctx.fill(); ctx.restore();
};
const sectorMap = (ctx, completed, y) => {
  const nodes = MISSIONS.map((m, i) => ({ x: 48 + i * 65, y: y + [12, -12, 8, -14, 6, -4][i] }));
  ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.beginPath();
  nodes.forEach((node, i) => i ? ctx.lineTo(node.x, node.y) : ctx.moveTo(node.x, node.y)); ctx.stroke();
  for (const [i, node] of nodes.entries()) {
    const mission = MISSIONS[i], done = completed.includes(mission.id);
    ctx.fillStyle = done ? C.cyan : mission.available && missionUnlocked(mission, completed) ? C.brass : "#263749";
    ctx.beginPath(); ctx.arc(node.x, node.y, done ? 7 : 5, 0, Math.PI * 2); ctx.fill();
    text(ctx, String(i + 1).padStart(2, "0"), node.x, node.y + 22, 10, done ? C.cyan : C.muted, "center", 700);
  }
};
const className = type => ({ scout: "Scout ×3", fighter: "Fighter ×2", bomber: "Bomber", frigate: "Fregatte" })[type];

export const renderCampaignMenu = (ctx, model) => {
  if (model.menuScreen === "expansion" || model.menuScreen === "expansion-map") return renderExpansionMenu(ctx, model);
  const ui = campaignUiLayout(model.height), offset = model.height / 2 - 380;
  const progress = model.campaignProgress ?? { completed: [] };
  const at = y => y + offset;
  if (model.menuScreen === "main") {
    emblem(ctx, 52, at(64));
    text(ctx, "STRATEGY GALALAXY", 80, at(64), 10, C.muted, "left", 700);
    text(ctx, "DIE LETZTE", 36, at(116), 34, C.ivory, "left", 700);
    text(ctx, "WERFT", 36, at(154), 42, C.ivory, "left", 700);
    text(ctx, "Ein Hafen. Eine Flotte. Eine neue Hoffnung.", 38, at(194), 12, C.muted);
    const openingCompleted = model.expansionProgress.completed.filter(id => ["v2-light-in-the-wreckage","v2-first-outpost","v2-harbor-under-fire"].includes(id));
    const stage = openingCompleted.length >= 3 ? 2 : openingCompleted.length >= 2 ? 1 : 0;
    panel(ctx, { x: 44, y: at(458), width: 332, height: 52 });
    text(ctx, ["HEIMATWERFT · NOTBETRIEB", "DOCK 01 · WIEDER IN BETRIEB", "HAFEN WIEDERBELEBT · KAPITEL 1 BEENDET", "HEIMATWERFT GESICHERT · KAMPAGNE BEENDET"][stage], 60, at(476), 10, stage ? C.cyan : C.brass, "left", 700);
    text(ctx, `${openingCompleted.length} / 3 Einsätze · Der Weg zum Hafen`, 60, at(496), 11, C.muted);
    for (let dock = 1; dock <= 2; dock++) {
      const active = stage >= dock, x = 280 + (dock - 1) * 44;
      ctx.fillStyle = active ? C.cyan : "#314457"; ctx.fillRect(x, at(490), 4, 12);
      text(ctx, `0${dock}`, x + 12, at(496), 10, active ? C.cyan : C.muted);
    }
    button(ctx, ui.campaign, openingCompleted.length ? "ZUM KAMPAGNENANFANG  →" : "DEN HAFEN ZURÜCKEROBERN  →", true);
    button(ctx, ui.shipyard, "FRÜHERE KAMPAGNE & TESTSTÄNDE");
    button(ctx, ui.settings, "EINSTELLUNGEN");
    text(ctx, progress.persistent ? "Fortschritt wird auf diesem Gerät gespeichert." : "Fortschritt bleibt in dieser Sitzung erhalten.", 210, at(712), 10, C.muted, "center");
    text(ctx, `TESTKAMPAGNE · ${EXPERIMENT.version}`, 210, at(737), 9, C.muted, "center");
    return;
  }
  // Subpages use the same material/typography, with calm opaque panels over the art.
  emblem(ctx, 50, at(56), 22);
  text(ctx, "DIE LETZTE WERFT", 73, at(57), 11, C.muted, "left", 700);
  if (model.menuScreen === "missions") {
    button(ctx, ui.legacyEquipment, "AUSRÜSTUNG");
    text(ctx, "DER WEG ZUR WERFT", 28, at(112), 25, C.ivory, "left", 700);
    text(ctx, "SECHS EINSÄTZE · DIE HEIMATWERFT BEFREIEN", 28, at(147), 10, C.brass, "left", 700);
    button(ctx, expansionUiLayout(model.height).entry, "ZUM NEUEN KAMPAGNENANFANG  →");
    sectorMap(ctx, progress.completed, at(239));
    for (const rect of ui.missions) {
      const m = missionById(rect.missionId), unlocked = missionUnlocked(m, progress.completed), done = progress.completed.includes(m.id);
      panel(ctx, rect, m.available && unlocked);
      text(ctx, String(m.number).padStart(2, "0"), rect.x + 23, rect.y + 26, 16, done ? C.cyan : C.brass, "center", 700);
      text(ctx, m.title, rect.x + 48, rect.y + 17, 14, m.available && unlocked ? C.ivory : C.muted, "left", 700);
      const status = !m.available ? "IN ARBEIT · VORSCHAU" : done ? "ABGESCHLOSSEN · ERNEUT SPIELEN" : unlocked ? "EINSATZBEREIT" : `NACH MISSION ${m.number - 1} VERFÜGBAR`;
      text(ctx, status, rect.x + 48, rect.y + 36, 9, done ? C.cyan : unlocked && m.available ? C.brass : C.muted);
      text(ctx, m.available && unlocked ? "›" : "·", rect.x + rect.width - 20, rect.y + 26, 23, C.muted, "center");
    }
    button(ctx, ui.back, "ZURÜCK ZUM HAFEN");
  } else if (model.menuScreen === "briefing") {
    const m = missionForProgress(missionById(model.selectedMissionId), progress.completed);
    if (!m?.available) return;
    text(ctx, `EINSATZ ${String(m.number).padStart(2, "0")}`, 28, at(109), 11, C.brass, "left", 700);
    text(ctx, m.title, 28, at(143), 25, C.ivory, "left", 700);
    panel(ctx, { x: 28, y: at(177), width: 364, height: 426 });
    text(ctx, "AUFTRAG", 48, at(203), 10, C.brass, "left", 700);
    wrap(ctx, m.objective, 48, at(227), 324, 14, C.ivory);
    text(ctx, "DEINE FLOTTE", 48, at(276), 10, C.cyan, "left", 700);
    text(ctx, m.units.map(type => type === "bomber" && progress.equipment?.bomberVariant === "ion" ? "Ionenbomber" : className(type)).join(" · "), 48, at(300), 12);
    text(ctx, `${m.startingEnergy} E · +${m.income}/s · ${m.fleetLimit}/Lane${m.fleetTotal ? ` · ${m.fleetTotal} gesamt` : ""}`, 48, at(322), 11, C.muted);
    text(ctx, `${m.map.lanes.length} kostenlose Drone${m.map.lanes.length > 1 ? "s" : ""} alle ${m.waveSeconds}s · Käufe starten sofort`, 48, at(342), 10, C.muted);
    text(ctx, "GEGNERISCHER PLAN", 48, at(376), 10, C.brass, "left", 700);
    text(ctx, m.threat, 48, at(400), 12);
    text(ctx, `${m.enemyEnergy} E · +${m.enemyIncome}/s · ${m.enemyFleetLimit}/Lane${m.enemyFleetTotal ? ` · ${m.enemyFleetTotal} gesamt` : ""}`, 48, at(422), 11, C.muted);
    text(ctx, `Ankündigung: ${m.warningSeconds}s · Aufbaupause: ${m.recoverySeconds}s`, 48, at(442), 11, C.muted);
    text(ctx, m.kind === "defense" ? "Angriffe aus dem Korridor. Kein Gegner-Carrier als Ziel." : "Keine kostenlosen Gegner-Waves.", 48, at(462), 10, C.muted);
    wrap(ctx, m.briefing.join(" "), 48, at(486), 324, 12, C.ivory);
    if (progress.completed.includes("heavy-resistance")) {
      const equipped = Boolean(progress.equipment?.ability), disrupted = progress.equipment?.ability === "disrupt";
      panel(ctx, ui.equipment, equipped);
      text(ctx, equipped ? disrupted ? "STÖRIMPULS AUSGERÜSTET · 100 E" : "AEGIS AUSGERÜSTET · 80 E" : "KEINE FÄHIGKEIT · AEGIS AUSRÜSTEN", 210, ui.equipment.y + 15, 11, C.ivory, "center", 700);
      text(ctx, disrupted ? "Schiffswaffen 3,5s aus · 32s Cooldown · Strukturen immun" : "Carrier + Flotte · 60% Schutz · 6s · 28s Cooldown", 210, ui.equipment.y + 33, 9, C.muted, "center");
    }
    text(ctx, `${m.relayShield ? "ZIEL: " : "GARANTIERTER BAUPLAN: "}${m.reward.replace("-BAUPLAN", "")}`, 48, at(progress.completed.includes("heavy-resistance") ? 591 : 566), 10, C.cyan, "left", 700);
    button(ctx, ui.start, model.levelLoading ? "EINSATZ WIRD VORBEREITET …" : "MISSION STARTEN  →", true, !model.levelLoading);
    button(ctx, ui.back, "ZURÜCK ZU DEN EINSÄTZEN");
  } else if (model.menuScreen === "shipyard") {
    text(ctx, "WERFT · AUSRÜSTUNG", 28, at(130), 25, C.ivory, "left", 700);
    panel(ctx, {x:28,y:at(183),width:364,height:128});
    text(ctx, "BOMBER-AUSFÜHRUNG", 48, at(210), 11, C.brass, "left", 700);
    text(ctx, progress.equipment?.bomberVariant === "ion" ? "Schiffswaffen 2s aus · weniger Belagerungsschaden" : "Volle Wirkung gegen schwere Ziele und Strukturen", 48, at(235), 10, C.muted);
    button(ctx, ui.bomber, progress.completed.includes("split-front") ? progress.equipment?.bomberVariant === "ion" ? "IONENBOMBER · ZU STANDARD WECHSELN" : "STANDARDBOMBER · ZU ION WECHSELN" : "IONENBOMBER NACH MISSION 4", true, progress.completed.includes("split-front"));
    panel(ctx, {x:28,y:at(328),width:364,height:145});
    const ability = progress.equipment?.ability;
    text(ctx, "CARRIER-FÄHIGKEIT · GENAU EINE WAHL", 48, at(354), 10, C.brass, "left", 700);
    text(ctx, ability === "disrupt" ? "100 E · 3,5s Waffenpause · 32s Cooldown" : ability === "aegis" ? "80 E · 6s Schutz · 60% · 28s Cooldown" : "Ohne Fähigkeit. Energie bleibt für Verstärkung.", 48, at(377), 11, C.muted);
    button(ctx, ui.ability, ability === "disrupt" ? "STÖRIMPULS · NÄCHSTE AUSWAHL" : ability === "aegis" ? "AEGIS · NÄCHSTE AUSWAHL" : "KEINE FÄHIGKEIT · NÄCHSTE AUSWAHL", true, progress.completed.includes("heavy-resistance"));
    text(ctx, ability === "disrupt" ? "Nur Schiffe der Lane · Carrier und Relais sind immun" : "Aegis schützt Carrier und eigene Schiffe der Lane", 48, at(454), 10, C.muted);
    text(ctx, "FREISCHALTUNGEN", 48, at(508), 11, C.brass, "left", 700);
    text(ctx, progress.completed.includes("harbor-fire") ? "Scout · Fighter · Bomber · Fregatte verfügbar" : "Schiffsbaupläne entstehen durch Missionssiege.", 48, at(532), 11, C.ivory);
    text(ctx, progress.completed.includes("the-window") ? "Aegis und Störimpuls verfügbar" : "Störimpuls nach Mission 5", 48, at(558), 11, C.muted);
    if(progress.completed.includes("shield-network")) {
      text(ctx, "FREIWILLIGE FINALE-ABZEICHEN", 48, at(598), 10, C.brass, "left", 700);
      text(ctx, (progress.badges?.includes("harbor-preserved") ? "✓" : "○") + " Hafen bewahrt · Carrier mit mindestens 80% Hülle", 48, at(622), 10, C.ivory);
      text(ctx, (progress.badges?.includes("without-ability") ? "✓" : "○") + " Ohne Carrier-Fähigkeit · Finale ohne Auslösung", 48, at(647), 10, C.ivory);
    } else text(ctx, "Wechsel sind kostenlos. Kein Grind, keine Reparaturkosten.", 210, at(610), 10, C.muted, "center");
    button(ctx, ui.back, "ZURÜCK ZUM HAFEN");
  } else if (model.menuScreen === "settings") {
    text(ctx, "EINSTELLUNGEN", 28, at(136), 25, C.ivory, "left", 700);
    panel(ctx, ui.panel);
    text(ctx, "KAMPFSOUND", 210, at(318), 11, C.brass, "center", 700);
    button(ctx, ui.sound, model.soundEnabled ? "SOUND: AN" : "SOUND: AUS", true);
    text(ctx, "Sound und Fortschritt werden automatisch gespeichert.", 210, at(447), 10, C.muted, "center");
    text(ctx, "Karte wischen · Verstärkung kaufen · Fähigkeit einsetzen", 210, at(488), 11, C.ivory, "center");
    button(ctx, ui.back, "ZURÜCK ZUM HAFEN");
  }
};

export const renderCampaignResult = (ctx, model) => {
  if (isExpansionMission(model.mission)) return renderExpansionResult(ctx, model);
  const win = model.state === "VICTORY", finale = model.mission.relayShield, center = model.height / 2;
  ctx.fillStyle = "rgba(3,10,20,.7)"; ctx.fillRect(0, 0, model.width, model.height);
  panel(ctx, { x: 28, y: center - 192, width: 364, height: 370 });
  emblem(ctx, 210, center - 154, 30);
  text(ctx, win ? finale ? "KAMPAGNE BEENDET" : "SEKTOR GESICHERT" : "CARRIER VERLOREN", 210, center - 113, 23, win ? C.cyan : "#ec9c8a", "center", 700);
  text(ctx, model.mission.title, 210, center - 80, 15, C.ivory, "center");
  if (win) {
    text(ctx, finale ? "DIE LETZTE WERFT IST FREI" : model.rewardFirstTime ? "NEU FREIGESCHALTET" : "BAUPLAN BEREITS GESICHERT", 210, center - 42, 10, C.brass, "center", 700);
    text(ctx, model.mission.reward, 210, center - 17, 18, C.ivory, "center", 700);
    wrap(ctx, model.mission.rewardDetail, 52, center + 7, 316, 11);
  } else wrap(ctx, model.mission.briefing.join(" "), 52, center - 38, 316, 12);
  const ui = campaignResultLayout(model.height), next = nextMission(model.mission);
  const canContinue = win && next?.available;
  if (canContinue) button(ctx, ui.next, `WEITER: ${next.title.toUpperCase()}  →`, true);
  else text(ctx, win ? "Freie Ausrüstung und zwei optionale Abzeichen in der Werft." : "Fortschritt und Baupläne bleiben erhalten.", 210, center + 60, 10, C.muted, "center");
  button(ctx, ui.retry, "ERNEUT SPIELEN"); button(ctx, ui.menu, "MISSIONEN");
  text(ctx, model.campaignProgress?.persistent ? "Fortschritt gespeichert" : "Fortschritt nur in dieser Sitzung", 210, center + 159, 10, C.muted, "center");
};

export const renderMissionHud = (ctx, model) => {
  const run = model.director.missionRuntime?.snapshot(model.simulation.state, model.selectedLaneId);
  if (!run) return;
  panel(ctx, { x: 8, y: 62, width: 404, height: 59 });
  text(ctx, run.label, 20, 78, 10, run.phase === "warning" ? C.brass : C.cyan, "left", 700);
  text(ctx, run.counter, 397, 78, 11, C.ivory, "right", 700);
  wrap(ctx, run.phase === "warning" && !model.mission.relayShield && !isExpansionMission(model.mission) ? run.threat : run.hint, 20, 98, 374, 10, C.ivory, 13);
};
