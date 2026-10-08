import { MISSIONS, missionById, missionUnlocked } from "../data/campaign.js";
import { STORAGE_KEYS } from "../experiment.js";
export const CAMPAIGN_STORAGE_KEY = STORAGE_KEYS.progress;
const emptyProgress = () => ({ version: 1, completed: [], lastMissionId: null, badges: [], equipment: { version: 1, ability: null, bomberVariant: "standard" } });
const browserStorage = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };
export class CampaignProgress {
  constructor(storage = browserStorage()) {
    this.storage = storage; this.persistent = Boolean(storage); this.data = emptyProgress();
    try {
      const saved = JSON.parse(storage?.getItem(CAMPAIGN_STORAGE_KEY) ?? "null");
      if (saved?.version === 1) {
        this.data.completed = MISSIONS.filter(m => m.available && Array.isArray(saved.completed) && saved.completed.includes(m.id)).map(m => m.id);
        if (saved.equipment?.version === 1) {
          if (this.abilities().includes(saved.equipment.ability)) this.data.equipment.ability = saved.equipment.ability;
          if (this.data.completed.includes("split-front") && saved.equipment.bomberVariant === "ion") this.data.equipment.bomberVariant = "ion";
        }
        if (this.data.completed.includes("shield-network")) this.data.badges = ["harbor-preserved", "without-ability"].filter(id => saved.badges?.includes(id));
        const last = missionById(saved.lastMissionId);
        if (last?.available && missionUnlocked(last, this.data.completed)) this.data.lastMissionId = last.id;
      }
    } catch { this.persistent = false; }
  }
  abilities() { return [null, ...(this.data.completed.includes("heavy-resistance") ? ["aegis"] : []), ...(this.data.completed.includes("the-window") ? ["disrupt"] : [])]; }
  save() { try { if (!this.storage) return false; this.storage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(this.data)); this.persistent = true; return true; } catch { this.persistent = false; return false; } }
  begin(id) { const m = missionById(id); if (!m?.available || !missionUnlocked(m, this.data.completed)) return false; this.data.lastMissionId = id; this.save(); return true; }
  complete(id, result = {}) {
    const m = missionById(id); if (!m?.available || !missionUnlocked(m, this.data.completed)) return false;
    if (!this.data.completed.includes(id)) { this.data.completed.push(id); if (id === "heavy-resistance") this.data.equipment.ability = "aegis"; }
    if (id === "shield-network") {
      if (Number.isFinite(result.carrierHpRatio) && result.carrierHpRatio >= .8 && !this.data.badges.includes("harbor-preserved")) this.data.badges.push("harbor-preserved");
      if (result.abilityUses === 0 && !this.data.badges.includes("without-ability")) this.data.badges.push("without-ability");
    }
    this.data.lastMissionId = id; this.save(); return true;
  }
  toggleAegis() { const choices = this.abilities(); if (choices.length < 2) return false; this.data.equipment.ability = choices[(choices.indexOf(this.data.equipment.ability) + 1) % choices.length]; this.save(); return true; }
  toggleBomber() { if (!this.data.completed.includes("split-front")) return false; this.data.equipment.bomberVariant = this.data.equipment.bomberVariant === "ion" ? "standard" : "ion"; this.save(); return true; }
  reset() { this.data = emptyProgress(); try { this.storage?.removeItem(CAMPAIGN_STORAGE_KEY); this.persistent = Boolean(this.storage); } catch { this.persistent = false; } return true; }
  snapshot() { return { ...this.data, completed: [...this.data.completed], badges: [...this.data.badges], equipment: { ...this.data.equipment }, persistent: this.persistent }; }
}
