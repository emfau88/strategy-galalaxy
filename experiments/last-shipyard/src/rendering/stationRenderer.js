import { TEAM } from "../core/constants.js";
import { BASTION, EVACUATION } from "../data/expansionScenarios.js";
import { stationUiLayout } from "../ui/stationUi.js";

const cyan = "#80dedb", gold = "#e3be81", red = "#f29587", muted = "#a7b5c5";
const text = (ctx, value, x, y, size = 11, color = "#f5eddd", align = "left") => {
  ctx.fillStyle = color; ctx.font = `600 ${size}px Inter, system-ui, sans-serif`; ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillText(value, x, y);
};
const panel = (ctx, rect, color = "#3f6474") => {
  ctx.fillStyle = "rgba(6,20,32,.97)"; ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 8); ctx.fill(); ctx.stroke();
};
const button = (ctx, rect, label, enabled = true) => { panel(ctx, rect, enabled ? "#568c91" : "#344955"); text(ctx, label, rect.x + rect.width / 2, rect.y + rect.height / 2, 11, enabled ? cyan : muted, "center"); };
const bar = (ctx, x, y, width, ratio, tint) => { ctx.fillStyle = "#132b3c"; ctx.fillRect(x, y, width, 4); ctx.fillStyle = tint; ctx.fillRect(x, y, width * Math.max(0, Math.min(1, ratio)), 4); };

// Functional vector sites for the pilot. Final station artwork belongs to V2-2.
export const renderStationWorld = (ctx, model) => {
  if (!model.mapDefinition.objectiveMission || !model.simulation) return;
  const state = model.simulation.state, run = model.director.missionRuntime.snapshot(state);
  const sy = worldY => model.camera.viewport.y + worldY - model.camera.y;
  for (const site of state.map.markers) {
    const x = site.x, y = sy(site.y), structure = state.structures.get(site.id), node = state.nodes.get(site.id);
    const protect = site.kind === "protect";
    const tint = structure && !structure.alive ? red : protect ? cyan : run.occupation.blocked ? red : run.occupation.secure ? cyan : gold;
    ctx.save(); ctx.fillStyle = "rgba(7,31,40,.2)"; ctx.strokeStyle = tint; ctx.lineWidth = 1;
    if (!protect) { ctx.setLineDash([5, 7]); ctx.beginPath(); ctx.arc(x, y, site.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.setLineDash([]); }
    const atlas = structure && model.assets?.get("homeport-stations");
    if (atlas) {
      const cell = atlas.naturalWidth / 2;
      ctx.globalAlpha = structure.alive ? 1 : .22;
      ctx.drawImage(atlas, protect ? 0 : cell, 0, cell, atlas.naturalHeight, x - 55, y - 55, 110, 110);
      ctx.globalAlpha = 1;
    } else {
    ctx.fillStyle = "#11283b"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, site.kind === "control" ? 22 : 34, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#e3d4ad"; ctx.lineWidth = 2; ctx.beginPath();
    if (site.kind === "control") { ctx.moveTo(x - 11, y); ctx.lineTo(x + 11, y); ctx.moveTo(x, y - 11); ctx.lineTo(x, y + 11); }
    else { ctx.arc(x, y, 21, -.8, Math.PI + .8); ctx.moveTo(x - 29, y + 20); ctx.lineTo(x - 29, y + 43); ctx.moveTo(x + 29, y + 20); ctx.lineTo(x + 29, y + 43); }
    ctx.stroke();
    }
    text(ctx, site.kind === "control" ? "RELAIS" : protect ? "HAFENDOCK" : `RETTUNG ${run.project.completed}/3`, x, y - 67, 10, tint, "center");
    const ratio = node ? Math.abs(node.progress) / 100 : structure.hp / structure.maxHp;
    bar(ctx, x - 37, y + 57, 74, ratio, node?.ownerTeam === TEAM.ENEMY ? red : tint);
    if (run.project.active) { bar(ctx, x - 37, y + 65, 74, run.project.elapsed / EVACUATION.seconds, run.project.paused ? gold : cyan); }
    ctx.restore();
  }
  for (const pad of state.map.buildPads) {
    const building = [...state.structures.values()].find(s => s.padId === pad.id), y = sy(pad.y);
    ctx.save(); ctx.strokeStyle = cyan; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.strokeRect(pad.x - 31, y - 31, 62, 62); ctx.setLineDash([]);
    if (!building?.alive) { text(ctx, "+", pad.x, y - 2, 28, cyan, "center"); text(ctx, "BAUPLATZ", pad.x, y + 44, 9, cyan, "center"); }
    else if (building.constructionRemaining > 0) {
      text(ctx, `BAU ${Math.ceil(building.constructionRemaining)}s`, pad.x, y + 44, 10, gold, "center");
      bar(ctx, pad.x - 30, y + 52, 60, 1 - building.constructionRemaining / BASTION.buildSeconds, gold);
    } else text(ctx, "BASTION", pad.x, y + 44, 9, cyan, "center");
    ctx.restore();
  }
};

export const renderStationUi = (ctx, model) => {
  if (!model.mapDefinition.objectiveMission || model.commandDockOpen || !model.mapDefinition.markers.length) return;
  const ui = stationUiLayout(model.height, model.mapDefinition.buildPads.length), state = model.simulation.state;
  const run = model.director.missionRuntime.snapshot(state), site = state.map.markers[0];
  const structure = state.structures.get(site.id), ferry = site.kind === "project", protect = site.kind === "protect";
  button(ctx, ui.objective, structure ? `${protect ? "HAFENDOCK" : "SPRUNGSTATION"} · ${Math.ceil(structure.hp / structure.maxHp * 100)}%` : `RELAIS · ${run.control.ownerTeam === TEAM.PLAYER ? "EIGEN" : run.control.ownerTeam === TEAM.ENEMY ? "FEIND" : "NEUTRAL"}`);
  ui.pads.forEach((rect, index) => button(ctx, rect, ui.pads.length === 1 ? "BAUPLATZ / BASTION" : index === 0 ? "BAU VORNE" : "BAU HINTEN"));
  if (!model.selectedSiteId) return;
  panel(ctx, ui.panel);
  button(ctx, ui.close, "×");
  const pad = state.map.buildPads.find(p => p.id === model.selectedSiteId), energy = model.director.economy.get(TEAM.PLAYER).energy;
  let title, status, help, action, enabled = false;
  if (pad) {
    const building = [...state.structures.values()].find(s => s.padId === pad.id);
    title = building?.alive ? "BASTION" : "BAUPLATZ · BASTION";
    status = building?.alive ? building.constructionRemaining > 0 ? `Im Bau · noch ${Math.ceil(building.constructionRemaining)}s · verwundbar` : `Geschütz aktiv · Hülle ${Math.ceil(building.hp)}/${building.maxHp}` : "Fester Geschützturm · schützt diese Front";
    help = building?.alive ? "Kein Verkauf. Nach Zerstörung neu aufbaubar." : `${BASTION.buildSeconds}s Bauzeit · Energie fehlt dann für die Flotte.`;
    enabled = !building?.alive && energy >= BASTION.cost;
    action = building?.alive ? building.constructionRemaining > 0 ? "BAU LÄUFT · NOCH KEINE WAFFEN" : "BASTION EINSATZBEREIT" : energy < BASTION.cost ? `BAUEN · ${BASTION.cost} E · ENERGIE FEHLT` : `BASTION BAUEN · ${BASTION.cost} E`;
  } else if (protect) {
    title = "HAFENDOCK · MUSS ÜBERLEBEN";
    status = `Hülle ${Math.ceil(structure.hp)}/${structure.maxHp} · ${run.defeatedAttacks}/3 Angriffe abgewehrt`;
    help = "Bastion vorne fängt ab; hinten schützt sie den Rückraum.";
    action = "DOCK MIT FLOTTE UND BASTIONEN VERTEIDIGEN";
  } else {
    title = ferry ? `SPRUNGSTATION · ${run.project.completed}/3 GERETTET` : "KONTROLLRELAIS";
    status = run.occupation.blocked ? "Feind im Stationsbereich · zuerst zurückdrängen" : !run.occupation.occupied ? "Besatzung fehlt · Kauf-Schiffe zur Station schicken" : "Besatzung vor Ort · Bereich gesichert";
    help = ferry ? run.project.active ? `${run.project.paused ? "Pausiert" : "Ladung läuft"} · ${Math.floor(run.project.elapsed)}/${EVACUATION.seconds}s · bereits bezahlt` : "Jede Ladung: 120 E · 16s sichere Besatzung nötig." : `Kontrolle ${Math.round(Math.abs(run.control.progress))}% · ${run.defeatedAttacks}/2 Angriffe abgewehrt`;
    enabled = ferry && !run.project.active && run.project.completed < 3 && run.occupation.secure && energy >= EVACUATION.cost;
    action = !ferry ? "SCOUTS EROBERN · DROHNEN ZÄHLEN NICHT" : run.project.active ? run.project.paused ? "UNTERBROCHEN · FORTSCHRITT BLEIBT" : "RETTUNGSLADUNG LÄUFT" : !run.occupation.secure ? "STATION ZUERST SICHERN" : energy < EVACUATION.cost ? "NÄCHSTE LADUNG · 120 E · ENERGIE FEHLT" : "NÄCHSTE RETTUNGSLADUNG · 120 E";
  }
  text(ctx, title, 26, ui.panel.y + 22, 12, cyan);
  text(ctx, status, 26, ui.panel.y + 55, 10);
  text(ctx, help, 26, ui.panel.y + 77, 10, muted);
  button(ctx, ui.action, action, enabled);
};
