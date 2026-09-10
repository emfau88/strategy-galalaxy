import { CONFIG } from "../config.js";

/**
 * Adapted from the reference loader. The manifest is now semantic and loading
 * failures remain inspectable so a future asset can always fall back safely.
 */
export class AssetLoader {
  constructor(manifest = {}, options = CONFIG.assets) {
    this.manifest = { ...manifest };
    this.images = new Map();
    this.errors = [];
    this.pending = new Map();
    this.settled = new Set();
    this.timeoutMs = options.timeoutMs;
    this.retryCount = options.retryCount ?? 0;
    this.retryDelayMs = options.retryDelayMs ?? 0;
  }

  async load(manifest = this.manifest, { retryCount = this.retryCount } = {}) {
    Object.assign(this.manifest, manifest);
    const entries = Object.entries(manifest);
    for (let attempt = 0; attempt <= retryCount; attempt += 1) {
      const missing = entries.filter(([key]) => !this.images.has(key));
      if (!missing.length) break;
      await Promise.all(missing.map(([key, path]) => this.loadImage(key, path)));
      if (attempt < retryCount && missing.some(([key]) => !this.images.has(key)) && this.retryDelayMs > 0) {
        await new Promise((resolve) => globalThis.setTimeout(resolve, this.retryDelayMs));
      }
    }
    return this;
  }

  loadImage(key, path) {
    if (this.images.has(key)) return Promise.resolve(this.images.get(key));
    if (this.pending.has(key)) return this.pending.get(key);
    this.settled.delete(key);

    let task;
    task = new Promise((resolve) => {
      if (typeof Image === "undefined") {
        this.recordError(key, path, "Image API unavailable");
        this.settled.add(key);
        resolve(null);
        return;
      }

      const image = new Image();
      let complete = false;
      const finish = (result, reason, allowLate = false) => {
        if (complete && !allowLate) return;
        if (result) globalThis.clearTimeout(timeoutId);
        if (this.pending.get(key) === task) this.pending.delete(key);
        this.settled.add(key);
        if (result) {
          this.images.set(key, result);
          this.clearError(key);
        } else if (reason) this.recordError(key, path, reason);
        if (!complete) {
          complete = true;
          resolve(result ?? null);
        }
      };
      // A timeout releases the loading gate, but deliberately keeps the Image alive.
      // If the network finishes later, onload adopts the real sprite and replaces the
      // fallback without requiring a page refresh.
      const timeoutId = globalThis.setTimeout(() => finish(null, "Timed out"), this.timeoutMs);
      image.onload = async () => {
        try {
          await image.decode?.();
          finish(image, null, complete);
        } catch {
          finish(image, null, complete);
        }
      };
      image.onerror = () => finish(null, "Could not load image");
      image.src = path;
    });

    if (!this.settled.has(key)) this.pending.set(key, task);
    return task;
  }

  recordError(key, path, reason) {
    this.errors = this.errors.filter((error) => error.key !== key);
    this.errors.push({ key, path, reason });
  }

  clearError(key) {
    this.errors = this.errors.filter((error) => error.key !== key);
  }

  get(key) { return this.images.get(key) ?? null; }

  get progress() {
    const total = Object.keys(this.manifest).length;
    return total === 0 ? 1 : Math.min(1, this.settled.size / total);
  }

  get isSettled() { return this.pending.size === 0; }
}
