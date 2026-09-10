import { fleetVisualFor } from "../data/visuals.js";

const MAX_EFFECTS = 120;
const MAX_LANE_TEAM_EFFECTS = 24;
const DESTRUCTION_DURATION = Object.freeze({ drone: 0.46, scout: 0.56, fighter: 0.68, bomber: 0.86, frigate: 1.08, turret: 1.2, hq: 1.55 });

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
      if (event.type === "shot") {
        const duration = event.projectileType === "siege_missile" ? 0.24 : 0.12;
        this.add({ type: "muzzle", x: event.x, y: event.y, team: event.team, laneId: event.laneId, projectileType: event.projectileType, seed, life: duration, maxLife: duration });
      }
      if (event.type === "hit") {
        const heavyImpact = event.projectileType === "siege_missile" || event.projectileType === "heavy_cannon" || event.projectileType === "heavy_bolt";
        const duration = event.projectileType === "siege_missile" ? 0.46 : heavyImpact ? 0.32 : 0.24;
        this.add({
          type: "hit", x: event.x, y: event.y, team: event.team, laneId: event.laneId, projectileType: event.projectileType,
          entityType: event.entityType, damage: event.damage, hpRatio: event.hpRatio, seed, life: duration, maxLife: duration,
        });
      }
      if (event.type === "upgrade_activated") this.add({ type: "upgrade", x: event.x, y: event.y, team: event.team, laneId: event.laneId, upgradeId: event.upgradeId, level: event.level, seed, life: 1.25, maxLife: 1.25 });
      if (event.type === "destroyed") {
        const scale = event.entityType === "hq" ? 2.2 : event.entityType === "turret" ? 1.65 : event.entityType === "frigate" ? 1.35 : event.entityType === "drone" ? 0.62 : 0.85;
        const destruction = fleetVisualFor(event.team, event.entityType)?.destruction;
        const duration = destruction ? destruction.frameCount / destruction.fps : DESTRUCTION_DURATION[event.entityType] ?? 0.72;
        this.add({ type: "destroyed", x: event.x, y: event.y, heading: event.heading, team: event.team, laneId: event.laneId, entityType: event.entityType, seed, scale, life: duration, maxLife: duration });
      }
    }
    if (sequenced && events.length) this.lastEventSequence = Math.max(this.lastEventSequence, events.at(-1).sequence);
  }

  add(effect) {
    if (!Number.isFinite(effect.x) || !Number.isFinite(effect.y)) return;
    if (effect.laneId && effect.team) {
      const matching = this.effects.filter((current) => current.laneId === effect.laneId && current.team === effect.team);
      if (matching.length >= MAX_LANE_TEAM_EFFECTS) {
        const oldest = this.effects.findIndex((current) => current.laneId === effect.laneId && current.team === effect.team);
        if (oldest >= 0) this.effects.splice(oldest, 1);
      }
    }
    if (this.effects.length >= MAX_EFFECTS) this.effects.shift();
    this.effects.push(effect);
  }

  update(delta) {
    for (const effect of this.effects) effect.life -= delta;
    this.effects = this.effects.filter((effect) => effect.life > 0);
  }
}
