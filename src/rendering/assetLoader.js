import { CONFIG } from "../config.js";

/**
 * Adapted from the reference loader. The manifest is now semantic and loading
 * failures remain inspectable so a future asset can always fall back safely.
 */
export class AssetLoader {
  constructor(manifest = {}) {
    this.manifest = { ...manifest };
    this.images = new Map();
    this.errors = [];
    this.pending = new Map();
    this.settled = new Set();
  }

  async load(manifest = this.manifest) {
    Object.assign(this.manifest, manifest);
    const entries = Object.entries(manifest);
    await Promise.all(entries.map(([key, path]) => this.loadImage(key, path)));
    return this;
  }

  loadImage(key, path) {
    if (this.settled.has(key)) return Promise.resolve(this.images.get(key) ?? null);
    if (this.pending.has(key)) return this.pending.get(key);

    const task = new Promise((resolve) => {
      if (typeof Image === "undefined") {
        this.errors.push({ key, path, reason: "Image API unavailable" });
        this.settled.add(key);
        resolve(null);
        return;
      }

      const image = new Image();
      let complete = false;
      const finish = (result, reason) => {
        if (complete) return;
        complete = true;
        window.clearTimeout(timeoutId);
        this.pending.delete(key);
        this.settled.add(key);
        if (result) this.images.set(key, result);
        if (reason) this.errors.push({ key, path, reason });
        resolve(result ?? null);
      };
      const timeoutId = window.setTimeout(() => finish(null, "Timed out"), CONFIG.assets.timeoutMs);
      image.onload = async () => {
        try {
          await image.decode?.();
          finish(image);
        } catch {
          finish(image);
        }
      };
      image.onerror = () => finish(null, "Could not load image");
      image.src = path;
    });

    this.pending.set(key, task);
    return task;
  }

  get(key) { return this.images.get(key) ?? null; }

  get progress() {
    const total = Object.keys(this.manifest).length;
    return total === 0 ? 1 : this.settled.size / total;
  }

  get isSettled() { return this.pending.size === 0; }
}
