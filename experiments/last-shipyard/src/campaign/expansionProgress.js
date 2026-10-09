import { EXPANSION_ID, expansionMissionById } from "../data/campaignExpansion.js";
import { STORAGE_KEYS } from "../experiment.js";

const empty = () => ({ version: 1, campaignId: EXPANSION_ID, lastPreviewId: null, completed: [] });
const browserStorage = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };

/** Preview selection is durable; viewing a layout never grants a mission completion. */
export class ExpansionProgress {
  constructor(storage = browserStorage()) {
    this.storage = storage; this.persistent = Boolean(storage); this.data = empty();
    try {
      const saved = JSON.parse(storage?.getItem(STORAGE_KEYS.expansionProgress) ?? "null");
      if (saved?.version === 1 && saved.campaignId === EXPANSION_ID && expansionMissionById(saved.lastPreviewId)) this.data.lastPreviewId = saved.lastPreviewId;
    } catch { this.persistent = false; }
  }
  selectPreview(id) {
    if (!expansionMissionById(id)) return false;
    this.data.lastPreviewId = id;
    try {
      if (this.storage) { this.storage.setItem(STORAGE_KEYS.expansionProgress, JSON.stringify(this.data)); this.persistent = true; }
    } catch { this.persistent = false; }
    return true;
  }
  reset() {
    this.data = empty();
    try { this.storage?.removeItem(STORAGE_KEYS.expansionProgress); this.persistent = Boolean(this.storage); } catch { this.persistent = false; }
    return true;
  }
  snapshot() { return { ...this.data, completed: [], persistent: this.persistent }; }
}
