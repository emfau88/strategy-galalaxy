import { EXPANSION_ID, expansionMissionById } from "../data/campaignExpansion.js";
import { STORAGE_KEYS } from "../experiment.js";

const empty = () => ({ version: 2, campaignId: EXPANSION_ID, lastPreviewId: null, completed: [] });
const browserStorage = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };

/** Separate V2 saves. Version 1 can migrate its selection, never invented completions. */
export class ExpansionProgress {
  constructor(storage = browserStorage()) {
    this.storage = storage; this.persistent = Boolean(storage); this.data = empty();
    try {
      const saved = JSON.parse(storage?.getItem(STORAGE_KEYS.expansionProgress) ?? "null");
      if ([1, 2].includes(saved?.version) && saved.campaignId === EXPANSION_ID) {
        if (expansionMissionById(saved.lastPreviewId)) this.data.lastPreviewId = saved.lastPreviewId;
        if (saved.version === 2 && Array.isArray(saved.completed)) this.data.completed = [...new Set(saved.completed.filter(id => expansionMissionById(id)?.available))];
      }
    } catch { this.persistent = false; }
  }
  selectPreview(id) {
    if (!expansionMissionById(id)) return false;
    this.data.lastPreviewId = id;
    this.save();
    return true;
  }
  complete(id) {
    if (!expansionMissionById(id)?.available) return false;
    if (!this.data.completed.includes(id)) this.data.completed.push(id);
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
  snapshot() { return { ...this.data, completed: [...this.data.completed], persistent: this.persistent }; }
}
