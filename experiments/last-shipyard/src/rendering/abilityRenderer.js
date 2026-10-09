import { DISRUPTION } from "../campaign/disruptionSystem.js";
import { AEGIS } from "../campaign/aegisSystem.js";
import { abilityUiLayout } from "../ui/abilityUi.js";
import { playerHoldLine } from "../simulation/tacticalAnchors.js";

export const renderDefenseLine = (ctx, model) => {
  const state = model.simulation?.state;
  const line = playerHoldLine(state, model.selectedLaneId, model.director?.config.rules?.allowLaneStance);
  if (!Number.isFinite(line)) return;
  const y = model.camera.viewport.y + line - model.camera.y;
  ctx.save(); ctx.strokeStyle = "rgba(128,222,219,.3)"; ctx.lineWidth = 1; ctx.setLineDash([6, 8]);
  const lane = state.map.lanes.find(item => item.id === model.selectedLaneId);
  const left = lane.centerX - lane.width / 2, right = lane.centerX + lane.width / 2;
  ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = "rgba(185,230,230,.6)"; ctx.font = "600 9px Inter, system-ui, sans-serif"; ctx.textAlign = "left"; ctx.fillText("HALTEPOSITION", left, y - 9); ctx.restore();
};

export const renderAegisField = (ctx, model) => {
  const ability = model.director?.aegis;
  if (!ability?.activeRemaining || !model.simulation) return;
  ctx.save();
  for (const entity of [...model.simulation.state.units.values(), ...model.simulation.state.structures.values()]) {
    if (!entity.alive || !ability.protects(entity)) continue;
    const y = model.camera.viewport.y + entity.y - model.camera.y;
    const carrier = entity.structureType === "hq", radius = carrier ? 77 : entity.unitType === "bomber" ? 22 : 18;
    const glow = ctx.createRadialGradient(entity.x, y, radius * .35, entity.x, y, radius);
    glow.addColorStop(0, "rgba(90,230,230,0)"); glow.addColorStop(.8, "rgba(90,230,230,.08)"); glow.addColorStop(1, "rgba(90,230,230,.22)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(entity.x, y, radius, radius * 1.14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(140,244,239,.7)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(entity.x, y, radius, radius * 1.14, 0, Math.PI * .12, Math.PI * .88); ctx.stroke();
  }
  ctx.restore();
};

export const renderAbilityHud = (ctx, model) => {
  const ability = model.director?.carrierAbility;
  if (!ability?.equipped) return;
  const ui = abilityUiLayout();
  const draw = (rect, title, detail, active = false) => {
    ctx.beginPath(); ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 8);
    ctx.fillStyle = active ? "rgba(24,74,83,.97)" : "rgba(11,28,43,.96)"; ctx.fill();
    ctx.strokeStyle = active ? "#80dedb" : "rgba(188,210,222,.25)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#f5eddd";
    ctx.font = "700 11px Inter, system-ui, sans-serif"; ctx.fillText(title, rect.x + rect.width / 2, rect.y + 16);
    ctx.font = "500 9px Inter, system-ui, sans-serif"; ctx.fillStyle = "#9faebf"; ctx.fillText(detail, rect.x + rect.width / 2, rect.y + 33);
  };
  draw(ui.home, "ZUM CARRIER  ↓", "Deine Heimatbasis im Blick");
  const disrupt = model.director.equippedAbility === "disrupt", name = disrupt ? "STÖRIMPULS" : "AEGIS", spec = disrupt ? DISRUPTION : AEGIS;
  const allowed = ability.availability(model.director, model.selectedLaneId).ok;
  const title = ability.activeRemaining > 0 ? `${name} AKTIV · ${ability.activeRemaining.toFixed(1)}s`
    : ability.cooldownRemaining > 0 ? `${name} LÄDT · ${Math.ceil(ability.cooldownRemaining)}s` : `${name} · ${spec.cost} E`;
  const detail = disrupt ? "Schiffswaffen aus · Carrier/Relais immun" : ability.activeRemaining > 0 ? "Carrier + Flotte: 60% Schaden abgefangen"
    : `6s Schutz · 28s Cooldown${allowed ? " · BEREIT" : ""}`;
  draw(ui.aegis, title, detail, allowed || ability.activeRemaining > 0);
};

export const renderCombatStatus = (ctx, model) => {
  if (!model.simulation) return;
  const state = model.simulation.state;
  ctx.save(); ctx.textAlign = "center";
  for (const unit of state.units.values()) {
    if (!unit.alive) continue;
    const y = model.camera.viewport.y + unit.y - model.camera.y;
    if (unit.bomberVariant === "ion") { ctx.fillStyle = "#bba0ff"; ctx.fillRect(unit.x - 10, y - 10, 20, 3); }
    if ((unit.weaponsDisabledUntil ?? 0) > state.time) {
      ctx.fillStyle = "rgba(24,16,43,.86)"; ctx.fillRect(unit.x - 28, y + 19, 56, 13);
      ctx.fillStyle = "#c8acff"; ctx.font = "600 8px Inter, system-ui, sans-serif"; ctx.fillText("GESTÖRT", unit.x, y + 28);
    }
  }
  for (const projectile of state.projectiles.values()) if (projectile.ionSeconds) {
    ctx.fillStyle = "#c4a8ff"; ctx.beginPath(); ctx.arc(projectile.x, model.camera.viewport.y + projectile.y - model.camera.y, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
};
