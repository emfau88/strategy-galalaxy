import { TEAM } from "../core/constants.js";

const PHASE_LABELS = { intro: "VERBAND AUFBAUEN", warning: "ANGRIFF ANGEKÜNDIGT", assault: "GEGNER IM VORSTOSS", recovery: "AUFBAUPAUSE", complete: "EINSATZ BEENDET" };

/** Authored purchase phases and goals. Combat reports destruction; only this mission chooses the result. */
export class MissionRuntime {
  constructor(mission) {
    this.mission = mission; this.phase = "intro"; this.remaining = mission.introSeconds;
    this.attackNumber = 0; this.defeatedAttacks = 0; this.orders = []; this.orderIndex = 0;
    this.attackElapsed = 0; this.retryIn = 0; this.attackerIds = new Set();
    this.purchases = new Set(); this.frontVisited = false; this.aegisUsed = false;
    this.lastEventSequence = 0; this.destroyedCarriers = new Set(); this.result = null;
  }
  enter(phase) {
    this.phase = phase; this.remaining = this.mission[`${phase}Seconds`] ?? 0;
    if (phase === "assault") {
      this.orders = this.mission.attacks[this.attackNumber % this.mission.attacks.length];
      this.attackNumber++; this.orderIndex = 0; this.attackElapsed = 0; this.retryIn = 0; this.attackerIds.clear();
    }
  }
  advance(director, dt) {
    if (this.result || this.phase === "complete") return;
    this.remaining = Math.max(0, this.remaining - dt);
    if (this.phase === "assault") {
      this.attackElapsed += dt; this.retryIn -= dt;
      const order = this.orders[this.orderIndex];
      if (order && this.attackElapsed >= order.at && this.retryIn <= 0) {
        const result = director.executeCommand({ type: "DEPLOY_UNIT", team: TEAM.ENEMY,
          laneId: director.mapDefinition.lanes[order.lane ?? 0].id, unitType: order.unitType });
        this.retryIn = 1;
        if (result.ok) { this.orderIndex++; result.spawnedIds.forEach(id => this.attackerIds.add(id)); }
      }
    }
    if (this.remaining > 0) return;
    if (this.phase === "intro" || this.phase === "recovery") this.enter("warning");
    else if (this.phase === "warning") this.enter("assault");
    else if (this.mission.kind !== "defense" && this.orderIndex === this.orders.length) this.enter("recovery");
  }
  evaluateGoal(director) {
    if (this.result) return this.result;
    const state = director.simulation.state;
    for (const event of state.events) {
      if (event.sequence <= this.lastEventSequence) continue;
      if (event.type === "destroyed" && event.entityType === "hq") this.destroyedCarriers.add(event.team);
      this.lastEventSequence = event.sequence;
    }
    // Losing our own carrier takes priority, including a simultaneous final attacker kill.
    if (this.destroyedCarriers.has(TEAM.PLAYER) || !state.structures.get("player-hq")?.alive) {
      this.result = { team: TEAM.ENEMY, reason: "PLAYER_CARRIER_DESTROYED" };
    } else if (this.mission.kind !== "defense" && this.destroyedCarriers.has(TEAM.ENEMY)) {
      this.result = { team: TEAM.PLAYER, reason: "BLOCKADE_BROKEN" };
    } else if (this.mission.kind === "defense" && this.phase === "assault" && this.orderIndex === this.orders.length) {
      const attackersAlive = [...this.attackerIds].some(id => state.units.get(id)?.alive);
      const hostileUnits = [...state.units.values()].some(unit => unit.alive && unit.team === TEAM.ENEMY);
      const hostileProjectiles = [...state.projectiles.values()].some(projectile => projectile.alive && projectile.ownerTeam === TEAM.ENEMY);
      // A launched volley still threatens the carrier. Clear it before counting an attack.
      if (!attackersAlive && !hostileUnits && !hostileProjectiles) {
        this.defeatedAttacks++;
        if (this.defeatedAttacks === this.mission.attacks.length) this.result = { team: TEAM.PLAYER, reason: "ALL_ATTACKS_DEFEATED" };
        else this.enter("recovery");
      }
    }
    return this.result;
  }
  notePurchase(unitType) { this.purchases.add(unitType); }
  finish() { this.phase = "complete"; this.remaining = 0; }
  hint() {
    if (this.mission.kind === "defense") {
      if (!this.purchases.has("fighter")) return "Baue eine Eskorte auf. Drei Angriffe müssen vollständig fallen.";
      if (!this.aegisUsed) return "AEGIS schützt Carrier + Flotte. Nutze es, wenn Treffer drohen.";
      return this.phase === "recovery" ? "Angriff abgewehrt. Verstärke vor der nächsten Ankündigung." : "Alle Angreifer und ihre Salven beseitigen. Dein Carrier muss leben.";
    }
    if (this.mission.id === "split-front") return "Lane wählen. Fregatte hält; Bomber + Eskorte stoßen vor.";
    if (this.mission.id === "the-window") return this.phase === "recovery" ? "48s Gegenstoß: Im Flottenmenü auf VORSTOSS schalten." : "Belagerungsangriff: Fregatte halten lassen. Eskorte gegen Bomber.";
    if (this.mission.id === "first-contact") {
      if (!this.purchases.has("scout")) return "FLOTTE öffnen: Schicke zuerst einen Scout-Verband.";
      if (!this.purchases.has("fighter")) return "Scouts unterwegs. Ergänze jetzt eine Fighter-Eskorte.";
      if (!this.frontVisited) return "ZUR FRONT bringt dich direkt zu deinen vordersten Schiffen.";
      return this.phase === "recovery" ? "Jetzt vorstoßen: Der Gegner kauft in dieser Pause keine Schiffe." : "Kaufe gezielt nach. Wischen verschiebt deinen Blick auf die Karte.";
    }
    if (!this.purchases.has("fighter")) return "Fighter zuerst: Sie halten leichte Gegner vom Bomber fern.";
    if (!this.purchases.has("bomber")) return "Eskorte unterwegs. Starte einen Bomber gegen die Fregatte.";
    return this.phase === "recovery" ? "Dein Zeitfenster: Ergänze Bomber für den Carrier-Angriff." : "Bomber gegen schwere Ziele. Fighter gegen ihre Eskorte.";
  }
  snapshot(state = null, laneId = null) {
    const defense = this.mission.kind === "defense";
    const attack = Math.min(this.phase === "assault" ? this.attackNumber : this.attackNumber + 1, this.mission.attacks.length);
    const laneIndex = this.mission.map.lanes.findIndex(lane => lane.id === laneId);
    const threat = this.mission.laneThreats?.[laneIndex] ?? this.mission.threats?.[Math.max(0, attack - 1)] ?? this.mission.threat;
    const count = state ? [...state.units.values()].filter(unit => unit.alive && unit.team === TEAM.ENEMY).length : 0;
    return { phase: this.phase, label: defense ? `${PHASE_LABELS[this.phase]} · ${attack}/3` : PHASE_LABELS[this.phase],
      remaining: this.remaining, counter: defense && this.phase === "assault" ? `${count} Angreifer` : `${Math.ceil(this.remaining)}s`,
      attackNumber: this.attackNumber, defeatedAttacks: this.defeatedAttacks, threat, hint: this.hint() };
  }
}
