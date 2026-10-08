import { MISSIONS, missionById, missionUnlocked } from "../data/campaign.js";

import { STORAGE_KEYS } from "../experiment.js";
export const CAMPAIGN_STORAGE_KEY = STORAGE_KEYS.progress;
const emptyProgress = () => ({ version: 1, completed: [], lastMissionId: null, equipment: { version: 1, ability: null } });
const browserStorage = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };

export class CampaignProgress {
  constructor(storage = browserStorage()) {
    this.storage = storage;
    this.persistent = Boolean(storage);
    this.data = emptyProgress();
    try {
      const saved = JSON.parse(storage?.getItem(CAMPAIGN_STORAGE_KEY) ?? "null");
      if (saved?.version === 1) {
        // Only implemented missions can have been completed in this version.
        this.data.completed = MISSIONS.filter((mission) => mission.available && Array.isArray(saved.completed)
          && saved.completed.includes(mission.id)).map((mission) => mission.id);
        if (saved.equipment?.version === 1 && saved.equipment.ability === "aegis" && this.data.completed.includes("heavy-resistance")) this.data.equipment.ability = "aegis";
        const last = missionById(saved.lastMissionId);
        if (last?.available && missionUnlocked(last, this.data.completed)) this.data.lastMissionId = last.id;
      }
    } catch { this.persistent = false; /* A damaged or unavailable save never prevents playing. */ }
  }

  save() {
    try {
      if (!this.storage) return false;
      this.storage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(this.data));
      this.persistent = true;
      return true;
    } catch { this.persistent = false; return false; }
  }

  begin(id) {
    const mission = missionById(id);
    if (!mission?.available || !missionUnlocked(mission, this.data.completed)) return false;
    this.data.lastMissionId = id;
    this.save();
    return true;
  }

  complete(id) {
    const mission = missionById(id);
    if (!mission?.available || !missionUnlocked(mission, this.data.completed)) return false;
    if (!this.data.completed.includes(id)) {
      this.data.completed.push(id);
      if (id === "heavy-resistance") this.data.equipment.ability = "aegis";
    }
    this.data.lastMissionId = id;
    this.save();
    return true;
  }

  reset() {
    this.data = emptyProgress();
    try {
      if (!this.storage) { this.persistent = false; return true; }
      this.storage.removeItem(CAMPAIGN_STORAGE_KEY);
      this.persistent = true;
    } catch { this.persistent = false; }
    return true;
  }

  toggleAegis() {
    if (!this.data.completed.includes("heavy-resistance")) return false;
    this.data.equipment.ability = this.data.equipment.ability === "aegis" ? null : "aegis";
    this.save(); return true;
  }

  snapshot() { return { ...this.data, completed: [...this.data.completed], equipment: { ...this.data.equipment }, persistent: this.persistent }; }
}
