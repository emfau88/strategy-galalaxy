import { TEAM } from "../core/constants.js";

const PHASE_LABELS = { intro: "VERBAND AUFBAUEN", warning: "ANGRIFF ANGEKÜNDIGT", assault: "GEGNER IM VORSTOSS", recovery: "GEGNER ORDNET SICH NEU", complete: "EINSATZ BEENDET" };

/** Small authored sequence, not a general event language. Time only advances in live matches. */
export class MissionRuntime {
  constructor(mission) {
    this.mission = mission;
    this.phase = "intro";
    this.remaining = mission.introSeconds;
    this.attackNumber = 0;
    this.orders = [];
    this.orderIndex = 0;
    this.attackElapsed = 0;
    this.retryIn = 0;
    this.purchases = new Set();
    this.frontVisited = false;
  }

  enter(phase) {
    this.phase = phase;
    this.remaining = this.mission[`${phase}Seconds`] ?? 0;
    if (phase === "assault") {
      this.orders = this.mission.attacks[this.attackNumber % this.mission.attacks.length];
      this.attackNumber += 1;
      this.orderIndex = 0;
      this.attackElapsed = 0;
      this.retryIn = 0;
    }
  }

  advance(director, dt) {
    if (this.phase === "complete") return;
    this.remaining = Math.max(0, this.remaining - dt);
    if (this.phase === "assault") {
      this.attackElapsed += dt;
      this.retryIn -= dt;
      const order = this.orders[this.orderIndex];
      if (order && this.attackElapsed >= order.at && this.retryIn <= 0) {
        const result = director.executeCommand({ type: "DEPLOY_UNIT", team: TEAM.ENEMY,
          laneId: director.mapDefinition.lanes[0].id, unitType: order.unitType });
        this.retryIn = 1;
        if (result.ok) this.orderIndex += 1;
      }
    }
    if (this.remaining > 0) return;
    if (this.phase === "intro" || this.phase === "recovery") this.enter("warning");
    else if (this.phase === "warning") this.enter("assault");
    // A pending purchase waits for real energy/capacity; it is never force-spawned.
    else if (this.orderIndex === this.orders.length) this.enter("recovery");
  }

  notePurchase(unitType) { this.purchases.add(unitType); }
  finish() { this.phase = "complete"; this.remaining = 0; }

  hint() {
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

  snapshot() { return { phase: this.phase, label: PHASE_LABELS[this.phase], remaining: this.remaining,
    attackNumber: this.attackNumber, threat: this.mission.threat, hint: this.hint() }; }
}
