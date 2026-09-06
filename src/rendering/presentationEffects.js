const MAX_EFFECTS = 80;

export class PresentationEffects {
  constructor() {
    this.effects = [];
    this.eventCount = 0;
  }

  reset() {
    this.effects = [];
    this.eventCount = 0;
  }

  observe(events) {
    if (events.length < this.eventCount) this.eventCount = 0;
    for (const event of events.slice(this.eventCount)) {
      if (event.type === "hit") this.add({ type: "hit", x: event.x, y: event.y, team: event.team, life: 0.22, maxLife: 0.22 });
      if (event.type === "destroyed") this.add({ type: "destroyed", x: event.x, y: event.y, team: event.team, life: 0.56, maxLife: 0.56 });
    }
    this.eventCount = events.length;
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
