import { fleetVisualFor } from "../data/visuals.js";

const MAX_EFFECTS = 120;

export class PresentationEffects {
  constructor() {
    this.effects = [];
    this.lastEventSequence = 0;
  }

  reset() {
    this.effects = [];
    this.lastEventSequence = 0;
  }

  observe(events) {
    const sequenced = events.some((event) => Number.isFinite(event.sequence));
    const freshEvents = sequenced ? events.filter((event) => event.sequence > this.lastEventSequence) : events;
    for (const event of freshEvents) {
      const seed = (event.sequence ?? this.effects.length + 1) + this.effects.length;
      if (event.type === "shot") this.add({ type: "muzzle", x: event.x, y: event.y, team: event.team, projectileType: event.projectileType, seed, life: 0.12, maxLife: 0.12 });
      if (event.type === "hit") this.add({ type: "hit", x: event.x, y: event.y, team: event.team, projectileType: event.projectileType, seed, life: event.projectileType === "siege_missile" ? 0.38 : 0.2, maxLife: event.projectileType === "siege_missile" ? 0.38 : 0.2 });
      if (event.type === "destroyed") {
        const scale = event.entityType === "hq" ? 2.2 : event.entityType === "turret" ? 1.65 : event.entityType === "frigate" ? 1.35 : event.entityType === "drone" ? 0.62 : 0.85;
        const destruction = fleetVisualFor(event.team, event.entityType)?.destruction;
        const duration = destruction ? destruction.frameCount / destruction.fps : 0.66 * scale;
        this.add({ type: "destroyed", x: event.x, y: event.y, heading: event.heading, team: event.team, entityType: event.entityType, seed, scale, life: duration, maxLife: duration });
      }
    }
    if (sequenced && events.length) this.lastEventSequence = Math.max(this.lastEventSequence, events.at(-1).sequence);
  }

  add(effect) {
    if (!Number.isFinite(effect.x) || !Number.isFinite(effect.y)) return;
    if (this.effects.length >= MAX_EFFECTS) this.effects.shift();
    this.effects.push(effect);
  }

  update(delta) {
    for (const effect of this.effects) effect.life -= delta;
    this.effects = this.effects.filter((effect) => effect.life > 0);
  }
}
