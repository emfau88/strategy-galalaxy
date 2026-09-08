const STORAGE_KEY = "strategy-galalaxy-sound-muted";

const storedMuted = () => {
  try { return globalThis.localStorage?.getItem(STORAGE_KEY) === "true"; }
  catch { return false; }
};

/** Small synthesized cue layer; no external or unlicensed audio is required. */
export class SoundSystem {
  constructor() {
    this.context = null;
    this.muted = storedMuted();
    this.userInteracted = false;
    this.lastEventSequence = 0;
    this.lastCueAt = new Map();
  }

  get enabled() { return !this.muted; }

  async unlock() {
    this.userInteracted = true;
    if (this.muted) return false;
    const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!AudioContextClass) return false;
    this.context ??= new AudioContextClass();
    if (this.context.state === "suspended") await this.context.resume();
    return this.context.state === "running";
  }

  toggleMuted() {
    this.muted = !this.muted;
    try { globalThis.localStorage?.setItem(STORAGE_KEY, String(this.muted)); } catch {}
    if (!this.muted) this.unlock().then(() => this.play("select")).catch(() => {});
    return this.muted;
  }

  reset() {
    this.lastEventSequence = 0;
    this.lastCueAt.clear();
  }

  vibrate(pattern) {
    if (!this.userInteracted) return false;
    if (globalThis.navigator?.userActivation && !globalThis.navigator.userActivation.hasBeenActive) return false;
    try { globalThis.navigator?.vibrate?.(pattern); } catch {}
    return true;
  }

  tone(frequency, duration, { volume = 0.025, type = "sine", endFrequency = frequency, delay = 0 } = {}) {
    if (this.muted || this.context?.state !== "running") return;
    const now = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + Math.min(0.018, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  play(cue) {
    if (this.muted || this.context?.state !== "running") return false;
    const now = this.context.currentTime;
    const throttle = cue === "shot" ? 0.055 : cue === "hit" ? 0.045 : 0;
    if (now - (this.lastCueAt.get(cue) ?? -Infinity) < throttle) return false;
    this.lastCueAt.set(cue, now);
    if (cue === "select") this.tone(520, 0.055, { volume: 0.018, endFrequency: 650 });
    else if (cue === "purchase") this.tone(430, 0.08, { volume: 0.024, endFrequency: 720 });
    else if (cue === "error") this.tone(170, 0.11, { volume: 0.025, type: "square", endFrequency: 115 });
    else if (cue === "shot") this.tone(620, 0.045, { volume: 0.011, type: "square", endFrequency: 390 });
    else if (cue === "missile") this.tone(145, 0.13, { volume: 0.022, type: "sawtooth", endFrequency: 260 });
    else if (cue === "hit") this.tone(230, 0.05, { volume: 0.014, type: "triangle", endFrequency: 110 });
    else if (cue === "destroyed") {
      this.tone(150, 0.24, { volume: 0.042, type: "sawtooth", endFrequency: 55 });
      this.tone(380, 0.12, { volume: 0.022, type: "square", endFrequency: 90, delay: 0.02 });
    } else if (cue === "node") {
      this.tone(440, 0.1, { volume: 0.025, endFrequency: 660 });
      this.tone(660, 0.12, { volume: 0.02, endFrequency: 880, delay: 0.08 });
    } else if (cue === "deploy") {
      this.tone(180, 0.22, { volume: 0.035, type: "triangle", endFrequency: 360 });
      this.tone(360, 0.18, { volume: 0.026, type: "triangle", endFrequency: 720, delay: 0.1 });
    } else if (cue === "upgrade") {
      this.tone(330, 0.2, { volume: 0.024, type: "sine", endFrequency: 440 });
      this.tone(494, 0.24, { volume: 0.022, type: "sine", endFrequency: 659, delay: 0.09 });
      this.tone(659, 0.28, { volume: 0.019, type: "sine", endFrequency: 880, delay: 0.18 });
    }
    return true;
  }

  observe(events) {
    const fresh = events.filter((event) => Number.isFinite(event.sequence) && event.sequence > this.lastEventSequence);
    for (const event of fresh) {
      if (event.type === "shot") this.play(event.projectileType === "siege_missile" ? "missile" : "shot");
      else if (event.type === "hit") this.play("hit");
      else if (event.type === "destroyed") this.play("destroyed");
      else if (event.type === "NODE_CAPTURED") this.play("node");
      else if (event.type === "upgrade_activated" && event.team === "TEAM_PLAYER") this.play("upgrade");
    }
    if (fresh.length) this.lastEventSequence = fresh.at(-1).sequence;
  }
}
