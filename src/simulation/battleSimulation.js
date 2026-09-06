import { CONFIG } from "../config.js";
import { PROJECTILE_DEFINITIONS, STRUCTURE_DEFINITIONS, UNIT_DEFINITIONS } from "../data/definitions.js";
import { LANE, TEAM } from "../core/constants.js";
import { addProjectileToState, addUnitToState, createBattleState, enemyOf, laneFor, removeDeadEntities } from "./battleState.js";
import { createProjectile, createUnit, UNIT_STATE } from "./entities.js";
import { acquireStructureTarget, acquireUnitTarget, getEntity, inRange } from "./targeting.js";

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const forwardDirection = (team) => (team === TEAM.PLAYER ? -1 : 1);
const targetDefinition = (entity) => entity.structureType ? STRUCTURE_DEFINITIONS[entity.structureType] : UNIT_DEFINITIONS[entity.unitType];

export class BattleSimulation {
  constructor({ state = createBattleState(), economy = null } = {}) {
    this.state = state;
    this.economy = economy;
  }

  spawnUnit(team, laneId, unitType, { x, y, slotOffsetX = 0, spawnCycle = 0 } = {}) {
    const lane = laneFor(this.state, laneId);
    const active = lane.unitIds.get(team);
    if (active.length >= CONFIG.caps.unitsPerLaneTeam) return null;
    const spawn = team === TEAM.PLAYER ? this.state.map.lanes.find((item) => item.id === laneId).playerSpawn : this.state.map.lanes.find((item) => item.id === laneId).enemySpawn;
    return addUnitToState(this.state, createUnit({
      id: this.state.ids.next(), team, laneId, unitType,
      x: x ?? spawn.x + slotOffsetX, y: y ?? spawn.y, slotOffsetX, spawnCycle,
    }));
  }

  spawnFormation(team, laneId, unitTypes, spawnCycle = 0) {
    const offsets = [-18, 18, -8, 8, -28, 28];
    return unitTypes.map((unitType, index) => this.spawnUnit(team, laneId, unitType, { slotOffsetX: offsets[index % offsets.length], spawnCycle })).filter(Boolean);
  }

  step(dt) {
    if (this.state.terminalTeam) return;
    this.state.time += dt;
    for (const unit of [...this.state.units.values()].sort((a, b) => a.id.localeCompare(b.id))) this.updateUnit(unit, dt);
    for (const structure of [...this.state.structures.values()].sort((a, b) => a.id.localeCompare(b.id))) this.updateStructure(structure, dt);
    const damageEvents = this.updateProjectiles(dt);
    this.applyDamage(damageEvents);
    removeDeadEntities(this.state);
  }

  updateUnit(unit, dt) {
    if (!unit.alive) return;
    const definition = UNIT_DEFINITIONS[unit.unitType];
    const target = acquireUnitTarget(this.state, unit);
    unit.targetId = target?.id ?? null;
    unit.state = target ? (target.structureType ? UNIT_STATE.ATTACKING_STRUCTURE : UNIT_STATE.ENGAGING) : UNIT_STATE.ADVANCING;
    unit.fireCooldown = Math.max(0, unit.fireCooldown - dt);
    if (!target) {
      unit.y += forwardDirection(unit.team) * definition.speed * dt;
      return;
    }
    if (!inRange(unit, target, definition.attackRange)) {
      const dx = target.x - unit.x;
      const dy = target.y - unit.y;
      const magnitude = Math.hypot(dx, dy) || 1;
      const step = Math.min(definition.speed * dt, Math.max(0, magnitude - definition.attackRange));
      unit.x += (dx / magnitude) * step;
      unit.y += (dy / magnitude) * step;
      return;
    }
    if (unit.fireCooldown === 0) this.fire(unit, target, definition);
  }

  updateStructure(structure, dt) {
    if (!structure.alive) return;
    const definition = STRUCTURE_DEFINITIONS[structure.structureType];
    const target = acquireStructureTarget(this.state, structure);
    structure.targetId = target?.id ?? null;
    structure.fireCooldown = Math.max(0, structure.fireCooldown - dt);
    if (target && structure.fireCooldown === 0) this.fire(structure, target, definition);
  }

  fire(owner, target, definition) {
    if (this.state.projectiles.size >= CONFIG.caps.projectiles) {
      this.state.events.push({ type: "projectile_rejected", ownerId: owner.id });
      return;
    }
    const projectileDefinition = PROJECTILE_DEFINITIONS[definition.projectileId];
    const dx = target.x - owner.x;
    const dy = target.y - owner.y;
    const magnitude = Math.hypot(dx, dy) || 1;
    const projectile = createProjectile({
      id: this.state.ids.next(), ownerId: owner.id, ownerTeam: owner.team, laneId: owner.laneId ?? target.laneId,
      projectileType: projectileDefinition.id, x: owner.x, y: owner.y,
      vx: (dx / magnitude) * projectileDefinition.speed, vy: (dy / magnitude) * projectileDefinition.speed,
      damage: this.damageFor(owner, definition), targetId: target.id,
    });
    projectile.remainingLife = projectileDefinition.lifetime;
    addProjectileToState(this.state, projectile);
    owner.fireCooldown = definition.fireInterval;
    this.state.events.push({ type: "shot", ownerId: owner.id, targetId: target.id });
  }

  damageFor(owner, definition) {
    if (owner.structureType !== "turret" || !this.economy) return definition.damage;
    const level = this.economy.get(owner.team).turretLevel;
    return definition.damage * (1 + level * this.economy.balance.turretUpgradeDamageBonus);
  }

  updateProjectiles(dt) {
    const damageEvents = [];
    for (const projectile of [...this.state.projectiles.values()].sort((a, b) => a.id.localeCompare(b.id))) {
      if (!projectile.alive) continue;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.remainingLife -= dt;
      const target = getEntity(this.state, projectile.targetId);
      const definition = PROJECTILE_DEFINITIONS[projectile.projectileType];
      if (target?.alive && target.team !== projectile.ownerTeam && (target.laneId === null || target.laneId === projectile.laneId) && distance(projectile, target) <= definition.hitRadius + targetDefinition(target).collisionRadius) {
        projectile.alive = false;
        damageEvents.push({ projectileId: projectile.id, targetId: target.id, damage: projectile.damage, ownerTeam: projectile.ownerTeam });
      } else if (projectile.remainingLife <= 0) {
        projectile.alive = false;
      }
    }
    return damageEvents.sort((a, b) => a.targetId.localeCompare(b.targetId) || a.projectileId.localeCompare(b.projectileId));
  }

  applyDamage(events) {
    for (const event of events) {
      const target = getEntity(this.state, event.targetId);
      if (!target?.alive || target.team === event.ownerTeam) continue;
      target.hp = Math.max(0, target.hp - event.damage);
      this.state.events.push({ type: "hit", ...event });
      if (target.hp !== 0) continue;
      target.alive = false;
      if (!target.structureType) target.state = UNIT_STATE.DEAD;
      this.state.events.push({ type: "destroyed", entityId: target.id });
      if (target.structureType === "hq") this.state.terminalTeam = enemyOf(target.team);
    }
  }

  snapshot() {
    const entities = (items) => [...items.values()].sort((a, b) => a.id.localeCompare(b.id)).map((item) => ({
      id: item.id, team: item.team, laneId: item.laneId, hp: item.hp, alive: item.alive,
      x: Math.round(item.x * 1000) / 1000, y: Math.round(item.y * 1000) / 1000,
    }));
    return { time: Math.round(this.state.time * 1000) / 1000, terminalTeam: this.state.terminalTeam, units: entities(this.state.units), structures: entities(this.state.structures), projectiles: entities(this.state.projectiles) };
  }
}

export const createDemoBattle = () => {
  const simulation = new BattleSimulation();
  const squads = {
    [LANE.LEFT]: ["frigate", "fighter", "scout", "bomber"],
    [LANE.RIGHT]: ["fighter", "fighter", "scout", "bomber"],
  };
  for (const laneId of [LANE.LEFT, LANE.RIGHT]) {
    simulation.spawnFormation(TEAM.PLAYER, laneId, squads[laneId]);
    simulation.spawnFormation(TEAM.ENEMY, laneId, squads[laneId]);
  }
  return simulation;
};
