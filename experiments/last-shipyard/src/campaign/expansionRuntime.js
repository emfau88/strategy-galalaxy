import { MATCH_STATE, TEAM } from "../core/constants.js";
import { BASTION, EVACUATION } from "../data/expansionScenarios.js";
import { createStructure } from "../simulation/entities.js";
import { emitSimulationEvent } from "../simulation/battleState.js";
import { objectiveOutcome, stationOccupation } from "./objectiveRules.js";

const OUTPOST_ATTACKS = [
  [{ unitType: "fighter", at: 0 }, { unitType: "scout", at: 5 }],
  [{ unitType: "fighter", at: 0 }, { unitType: "bomber", at: 4 }, { unitType: "fighter", at: 8 }],
];
const FERRY_ATTACKS = [
  [{ unitType: "fighter", lane: 0, at: 0 }, { unitType: "bomber", lane: 0, at: 5 }],
  [{ unitType: "scout", lane: 1, at: 0 }, { unitType: "fighter", lane: 1, at: 5 }],
];
const battleClear = state => ![...state.units.values()].some(u => u.alive && u.team === TEAM.ENEMY)
  && ![...state.projectiles.values()].some(p => p.alive && p.ownerTeam === TEAM.ENEMY);

export class ExpansionRuntime {
  constructor(mission) {
    this.mission = mission;
    this.ferry = mission.goal.kind === "evacuate";
    this.site = mission.map.markers[0];
    this.phase = this.ferry ? "intro" : "capture";
    this.remaining = this.ferry ? 14 : 0;
    this.attackNumber = 0; this.defeatedAttacks = 0;
    this.orders = []; this.orderIndex = 0; this.attackElapsed = 0; this.retryIn = 0;
    this.triggered = false; this.result = null; this.abilityUses = 0;
    this.project = { completed: 0, active: false, elapsed: 0 };
  }

  notePurchase() {}
  finish() { this.phase = "complete"; this.remaining = 0; }
  enter(phase) {
    this.phase = phase;
    this.remaining = ({ warning: 8, recovery: 12, assault: 14 })[phase] ?? 0;
    if (phase !== "assault") return;
    const attacks = this.ferry ? FERRY_ATTACKS : OUTPOST_ATTACKS;
    this.orders = attacks[this.attackNumber % attacks.length];
    this.attackNumber++; this.orderIndex = 0; this.attackElapsed = 0; this.retryIn = 0;
  }

  executeCommand(director, command) {
    if (director.state !== MATCH_STATE.LIVE_MATCH) return { ok: false, reason: "WRONG_PHASE" };
    if (command.team !== TEAM.PLAYER) return { ok: false, reason: "INVALID_TEAM_OR_LANE" };
    const state = director.simulation.state, account = director.economy.get(TEAM.PLAYER);
    if (objectiveOutcome(state, this.mission.goal, false)) return { ok: false, reason: "OBJECTIVE_LOST" };
    if (command.type === "BUILD_STATION") {
      const pad = this.mission.map.buildPads.find(p => p.id === command.padId);
      if (!pad || command.module !== "bastion" || !pad.modules.includes(command.module)) return { ok: false, reason: "INVALID_SITE" };
      const previous = [...state.structures.values()].find(s => s.padId === pad.id);
      if (previous?.alive) return { ok: false, reason: "SITE_OCCUPIED" };
      if (account.energy < BASTION.cost) return { ok: false, reason: "INSUFFICIENT_ENERGY" };
      // A rebuild receives a fresh identity: old salvos cannot hit the new structure.
      const structure = createStructure({ id: state.ids.next(), structureType: "turret", team: TEAM.PLAYER,
        laneId: pad.laneId, x: pad.x, y: pad.y, maxHp: BASTION.maxHp });
      Object.assign(structure, { padId: pad.id, constructionRemaining: BASTION.buildSeconds, constructionDuration: BASTION.buildSeconds });
      account.energy -= BASTION.cost;
      account.spending.construction = (account.spending.construction ?? 0) + BASTION.cost;
      if (previous) state.structures.delete(previous.id);
      state.structures.set(structure.id, structure);
      emitSimulationEvent(state, { type: "BUILD_STARTED", entityId: structure.id, padId: pad.id });
      return { ok: true, entityId: structure.id, cost: BASTION.cost };
    }
    if (command.type === "START_PROJECT") {
      if (!this.ferry || command.stationId !== this.site.id) return { ok: false, reason: "INVALID_SITE" };
      if (this.project.active || this.project.completed >= this.mission.goal.segments) return { ok: false, reason: "PROJECT_ALREADY_STARTED" };
      if (!stationOccupation(state, this.site).secure) return { ok: false, reason: "STATION_UNSECURED" };
      if (account.energy < EVACUATION.cost) return { ok: false, reason: "INSUFFICIENT_ENERGY" };
      account.energy -= EVACUATION.cost;
      account.spending.project = (account.spending.project ?? 0) + EVACUATION.cost;
      this.project.active = true; this.project.elapsed = 0;
      emitSimulationEvent(state, { type: "PROJECT_STARTED", stationId: this.site.id, segment: this.project.completed + 1 });
      return { ok: true, cost: EVACUATION.cost };
    }
    return { ok: false, reason: "UNKNOWN_COMMAND" };
  }

  advance(director, dt) {
    if (director.state !== MATCH_STATE.LIVE_MATCH || this.phase === "complete") return;
    const state = director.simulation.state;
    // Damage has already been resolved this step. A lost objective never finishes a charge.
    if (objectiveOutcome(state, this.mission.goal, false)) return;
    const secure = stationOccupation(state, this.site).secure;
    if (this.project.active && secure) {
      this.project.elapsed = Math.min(EVACUATION.seconds, this.project.elapsed + dt);
      if (this.project.elapsed >= EVACUATION.seconds - 1e-8) {
        this.project.completed++; this.project.active = false;
        emitSimulationEvent(state, { type: "EVACUATION_COMPLETED", stationId: this.site.id, segment: this.project.completed });
      }
    }
    if (!this.ferry && !this.triggered && state.nodes.get(this.site.id)?.ownerTeam === TEAM.PLAYER) {
      this.triggered = true; this.enter("warning"); return;
    }
    if (this.phase === "capture" || this.phase === "secure") return;
    this.remaining = Math.max(0, this.remaining - dt);
    if (this.phase === "assault") {
      this.attackElapsed += dt; this.retryIn -= dt;
      const order = this.orders[this.orderIndex];
      if (order && this.attackElapsed >= order.at && this.retryIn <= 0) {
        const result = director.executeCommand({ type: "DEPLOY_UNIT", team: TEAM.ENEMY,
          laneId: director.mapDefinition.lanes[order.lane ?? 0].id, unitType: order.unitType });
        this.retryIn = 1;
        if (result.ok) this.orderIndex++;
      }
      if (this.orderIndex !== this.orders.length) return;
      if (!this.ferry && battleClear(state)) {
        this.defeatedAttacks++;
        this.enter(this.defeatedAttacks >= this.mission.goal.attacks ? "secure" : "recovery");
      } else if (this.ferry && this.remaining === 0) this.enter("recovery");
    } else if (this.remaining === 0) this.enter(this.phase === "warning" ? "assault" : "warning");
  }

  evaluateGoal(director) {
    const state = director.simulation.state;
    const complete = this.ferry ? this.project.completed >= this.mission.goal.segments
      : this.defeatedAttacks >= this.mission.goal.attacks && state.nodes.get(this.site.id)?.ownerTeam === TEAM.PLAYER && stationOccupation(state, this.site).secure;
    this.result = objectiveOutcome(state, this.mission.goal, complete);
    return this.result;
  }

  snapshot(state) {
    const occupation = stationOccupation(state, this.site), node = state.nodes.get(this.site.id);
    const attack = this.phase === "assault" ? this.attackNumber : this.attackNumber + 1;
    const threat = this.ferry ? attack % 2 ? "LINKS: Fighter + Bomber bedrohen die Sprungstation." : "RECHTS: Scouts + Fighter auf Kurs zum Carrier."
      : attack === 1 ? "Fighter + Scouts wollen das Relais zurückerobern." : "Bomber mit Fighter-Eskorte: Bastion und Carrier schützen.";
    const phaseLabel = { capture: "RELAIS BESETZEN", warning: "GEGENANGRIFF", assault: "ANGRIFF LÄUFT", recovery: "VERSTÄRKUNGSPAUSE", secure: "RELAIS SICHERN", intro: "BEIDE FRONTEN BESETZEN", complete: "EINSATZ BEENDET" }[this.phase];
    const hint = this.ferry ? this.project.active
      ? occupation.secure ? "Rettung läuft. Sichere auch die rechte Carrier-Front." : "Ladung pausiert: eigene Kauf-Schiffe am Gate, Gegner entfernen."
      : "Sprungstation öffnen: Besatzung sichern, dann Ladung bezahlen."
      : !this.triggered ? "Scouts erobern. Fighter sichern. Bastion ist optional."
        : this.phase === "secure" ? "Relais zurückholen und mit eigenen Kauf-Schiffen besetzt halten." : "Halte das Relais. Die Flotte kehrt automatisch zur Station zurück.";
    return { phase: this.phase, label: phaseLabel, remaining: this.remaining,
      counter: this.ferry ? `RETTUNG ${this.project.completed}/3` : `ABGEWEHRT ${this.defeatedAttacks}/2`, threat,
      hint: this.phase === "warning" ? `${Math.ceil(this.remaining)}s · ${threat}` : hint,
      attackNumber: this.attackNumber, defeatedAttacks: this.defeatedAttacks, occupation,
      control: node ? { ownerTeam: node.ownerTeam, progress: node.progress, contested: node.contested } : null,
      project: { ...this.project, duration: EVACUATION.seconds, cost: EVACUATION.cost,
        paused: this.project.active && !occupation.secure },
    };
  }
}
