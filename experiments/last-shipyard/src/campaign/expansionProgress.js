import { EXPANSION_ID, EXPANSION_MISSIONS, expansionMissionById, expansionUnlocked, expansionUnlocks, isPilotMission } from "../data/campaignExpansion.js";
import { STORAGE_KEYS } from "../experiment.js";

const empty = () => ({ version: 3, campaignId: EXPANSION_ID, lastPreviewId: null, mode: "campaign", completed: [], pilotCompleted: [] });
const browserStorage = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };

/** The Act I sequence and freely accessible pilots have separate completion records. */
export class ExpansionProgress {
  constructor(storage = browserStorage()) {
    this.storage = storage; this.persistent = Boolean(storage); this.data = empty();
    try {
      const saved = JSON.parse(storage?.getItem(STORAGE_KEYS.expansionProgress) ?? "null");
      if ([1, 2, 3].includes(saved?.version) && saved.campaignId === EXPANSION_ID) {
        if (expansionMissionById(saved.lastPreviewId)) this.data.lastPreviewId = saved.lastPreviewId;
        const pilots = saved.version === 2 ? saved.completed : saved.version === 3 ? saved.pilotCompleted : [];
        if (Array.isArray(pilots)) this.data.pilotCompleted = [...new Set(pilots.filter(id => isPilotMission(expansionMissionById(id))))];
        if (saved.version === 3) {
          this.data.mode = saved.mode === "pilots" ? "pilots" : "campaign";
          // Restore only a contiguous playable prefix. Pilot wins cannot skip the learning order.
          for (const mission of EXPANSION_MISSIONS) {
            if (!mission.available || !Array.isArray(saved.completed) || !saved.completed.includes(mission.id)) break;
            this.data.completed.push(mission.id);
          }
        }
      }
    } catch { this.persistent = false; }
  }
  selectPreview(id) {
    if (!expansionMissionById(id)) return false;
    this.data.lastPreviewId = id;
    this.save();
    return true;
  }
  setMode(mode) {
    if (!["campaign", "pilots"].includes(mode)) return false;
    this.data.mode = mode; this.save(); return true;
  }
  canStart(id, mode = this.data.mode) {
    const mission = expansionMissionById(id);
    return mode === "pilots" ? isPilotMission(mission) : mode === "campaign" && expansionUnlocked(mission, this.data.completed);
  }
  complete(id, mode = this.data.mode) {
    if (!this.canStart(id, mode)) return false;
    const list = mode === "pilots" ? this.data.pilotCompleted : this.data.completed;
    if (!list.includes(id)) list.push(id);
    this.save();
    return true;
  }
  save() {
    try {
      if (this.storage) { this.storage.setItem(STORAGE_KEYS.expansionProgress, JSON.stringify(this.data)); this.persistent = true; }
    } catch { this.persistent = false; }
  }
  reset() {
    this.data = empty();
    try { this.storage?.removeItem(STORAGE_KEYS.expansionProgress); this.persistent = Boolean(this.storage); } catch { this.persistent = false; }
    return true;
  }
  snapshot() { return { ...this.data, completed: [...this.data.completed], pilotCompleted: [...this.data.pilotCompleted],
    unlocks: expansionUnlocks(this.data.completed), harborActive: this.data.completed.includes(EXPANSION_MISSIONS[2].id), persistent: this.persistent }; }
}
