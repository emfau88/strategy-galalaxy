import { CONFIG } from "../config.js";
import { PROJECTILE_DEFINITIONS, STRUCTURE_DEFINITIONS, UNIT_DEFINITIONS } from "../data/definitions.js";
import { LANE, TEAM } from "../core/constants.js";
import { addProjectileToState, addUnitToState, createBattleState, emitSimulationEvent, enemyOf, laneFor, removeDeadEntities } from "./battleState.js";
import { createProjectile, createUnit, UNIT_STATE } from "./entities.js";
import { acquireStructureTarget, acquireUnitTarget, getEntity, inRange } from "./targeting.js";

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const forwardDirection = (team) => (team === TEAM.PLAYER ? -1 : 1);
const targetDefinition = (entity) => entity.structureType ? STRUCTURE_DEFINITIONS[entity.structureType] : UNIT_DEFINITIONS[entity.unitType];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const angleDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));
const LAUNCH_DURATION_SECONDS = 0.62;

const FORMATION = Object.freeze({
  scout: Object.freeze({ forward: 46, lateral: [0, -48, 48, -24, 24] }),
  frigate: Object.freeze({ forward: 18, lateral: [0, -32, 32] }),
  fighter: Object.freeze({ forward: 4, lateral: [-38, 38, -13, 13, -55, 55] }),
  bomber: Object.freeze({ forward: -34, lateral: [0, -28, 28] }),
});

export class BattleSimulation {
  constructor({ state = createBattleState(), economy = null } = {}) {
    this.state = state;
    this.economy = economy;
    this.stepNumber = 0;
  }

  spawnUnit(team, laneId, unitType, { x, y, slotOffsetX = 0, slotOffsetY = 0, spawnCycle = 0, launch = null } = {}) {
    const lane = laneFor(this.state, laneId);
    const active = lane.unitIds.get(team);
    if (active.length >= CONFIG.caps.unitsPerLaneTeam) return null;
    const spawn = team === TEAM.PLAYER ? this.state.map.lanes.find((item) => item.id === laneId).playerSpawn : this.state.map.lanes.find((item) => item.id === laneId).enemySpawn;
    const targetX = x ?? spawn.x + slotOffsetX;
    const targetY = y ?? spawn.y + slotOffsetY;
    return addUnitToState(this.state, createUnit({
      id: this.state.ids.next(), team, laneId, unitType,
      x: targetX, y: targetY, slotOffsetX, spawnCycle, launch,
    }));
  }

  spawnFormation(team, laneId, unitTypes, spawnCycle = 0) {
    const direction = forwardDirection(team);
    const typeCounts = new Map();
    const hq = [...this.state.structures.values()].find((structure) => structure.team === team && structure.structureType === "hq");
    const laneSide = laneId === LANE.LEFT ? -1 : 1;
    const launchOrigin = hq ? { x: hq.x + laneSide * 34, y: hq.y + direction * 25 } : null;
    return unitTypes.map((unitType, index) => {
      const pattern = FORMATION[unitType] ?? FORMATION.fighter;
      const typeIndex = typeCounts.get(unitType) ?? 0;
      typeCounts.set(unitType, typeIndex + 1);
      const row = Math.floor(typeIndex / pattern.lateral.length);
      const lateral = pattern.lateral[typeIndex % pattern.lateral.length];
      return this.spawnUnit(team, laneId, unitType, {
        slotOffsetX: lateral,
        slotOffsetY: direction * (pattern.forward - row * 26 + ((index + spawnCycle) % 2 ? 2 : -2)),
        spawnCycle,
        launch: launchOrigin ? { ...launchOrigin, duration: LAUNCH_DURATION_SECONDS, delay: index * 0.055 } : null,
      });
    }).filter(Boolean);
  }

  step(dt) {
    if (this.state.terminalTeam) return;
    this.stepNumber += 1;
    this.state.time += dt;
    for (const unit of this.state.units.values()) this.advanceLaunch(unit, dt);
    this.resolveLaneSpacing();
    const positions = new Map([
      ...[...this.state.units.values()].map((entity) => [entity.id, { x: entity.x, y: entity.y }]),
      ...[...this.state.structures.values()].map((entity) => [entity.id, { x: entity.x, y: entity.y }]),
    ]);
    const direction = this.stepNumber % 2 === 0 ? -1 : 1;
    const stableOrder = (items) => [...items.values()].sort((a, b) => a.id.localeCompare(b.id) * direction);
    for (const unit of stableOrder(this.state.units)) this.updateUnit(unit, dt, positions);
    for (const structure of stableOrder(this.state.structures)) this.updateStructure(structure, dt, positions);
    const damageEvents = this.updateProjectiles(dt);
    this.applyDamage(damageEvents);
    removeDeadEntities(this.state);
  }

  advanceLaunch(unit, dt) {
    if (!unit.alive || !unit.launching) return;
    unit.launchElapsed += dt;
    if (unit.launchElapsed < 0) return;
    const progress = Math.min(1, unit.launchElapsed / unit.launchDuration);
    const eased = 1 - (1 - progress) ** 3;
    unit.x = unit.launchOriginX + (unit.launchTargetX - unit.launchOriginX) * eased;
    unit.y = unit.launchOriginY + (unit.launchTargetY - unit.launchOriginY) * eased;
    if (progress < 1) return;
    unit.launching = false;
    unit.x = unit.launchTargetX;
    unit.y = unit.launchTargetY;
  }

  resolveLaneSpacing() {
    for (const lane of this.state.lanes.values()) {
      const laneDefinition = this.state.map.lanes.find((item) => item.id === lane.id);
      for (const team of [TEAM.PLAYER, TEAM.ENEMY]) {
        const units = lane.unitIds.get(team).map((id) => this.state.units.get(id)).filter((unit) => unit?.alive && !unit.launching).sort((left, right) => left.id.localeCompare(right.id));
        for (let first = 0; first < units.length; first += 1) {
          for (let second = first + 1; second < units.length; second += 1) {
            const left = units[first];
            const right = units[second];
            const minimum = UNIT_DEFINITIONS[left.unitType].collisionRadius + UNIT_DEFINITIONS[right.unitType].collisionRadius + 9;
            const dx = right.x - left.x || (second % 2 ? 0.5 : -0.5);
            const dy = right.y - left.y || (second % 2 ? 0.25 : -0.25);
            const current = Math.hypot(dx, dy);
            if (current >= minimum) continue;
            const push = (minimum - current) * 0.5;
            const horizontal = dx / current * push;
            const vertical = dy / current * push * 0.42;
            const minX = laneDefinition.centerX - laneDefinition.width / 2 + 9;
            const maxX = laneDefinition.centerX + laneDefinition.width / 2 - 9;
            left.x = Math.max(minX, Math.min(maxX, left.x - horizontal));
            right.x = Math.max(minX, Math.min(maxX, right.x + horizontal));
            left.y -= vertical;
            right.y += vertical;
          }
        }
      }
    }
  }

  updateUnit(unit, dt, positions = null) {
    if (!unit.alive) return;
    if (unit.launching) return;
    const definition = UNIT_DEFINITIONS[unit.unitType];
    const target = acquireUnitTarget(this.state, unit, positions);
    const targetPosition = positions?.get(target?.id) ?? target;
    unit.targetId = target?.id ?? null;
    unit.state = target ? (target.structureType ? UNIT_STATE.ATTACKING_STRUCTURE : UNIT_STATE.ENGAGING) : UNIT_STATE.ADVANCING;
    unit.fireCooldown = Math.max(0, unit.fireCooldown - dt);
    if (!target) {
      const node = unit.unitType === "scout" ? [...this.state.nodes.values()].find((item) => item.laneId === unit.laneId) : null;
      const nodeAhead = node && (node.y - unit.y) * forwardDirection(unit.team) >= -node.radius;
      if (nodeAhead && node.ownerTeam !== unit.team) {
        const dx = node.x - unit.x;
        const dy = node.y - unit.y;
        const magnitude = Math.hypot(dx, dy) || 1;
        if (magnitude > node.radius * 0.42) {
          const step = Math.min(definition.speed * dt, magnitude - node.radius * 0.38);
          unit.x += dx / magnitude * step;
          unit.y += dy / magnitude * step;
        } else unit.state = UNIT_STATE.HOLDING;
      } else unit.y += forwardDirection(unit.team) * definition.speed * dt;
      this.constrainToLane(unit);
      return;
    }
    const unitPosition = positions?.get(unit.id) ?? unit;
    if (!inRange(unitPosition, targetPosition, definition.attackRange)) {
      const dx = targetPosition.x - unitPosition.x;
      const dy = targetPosition.y - unitPosition.y;
      const magnitude = Math.hypot(dx, dy) || 1;
      const step = Math.min(definition.speed * dt, Math.max(0, magnitude - definition.attackRange));
      unit.x += (dx / magnitude) * step;
      unit.y += (dy / magnitude) * step;
      this.constrainToLane(unit);
      return;
    }
    if (unit.fireCooldown === 0) this.fire(unit, target, definition, positions);
  }

  constrainToLane(unit) {
    const lane = this.state.map.lanes.find((item) => item.id === unit.laneId);
    const inset = UNIT_DEFINITIONS[unit.unitType].collisionRadius + 5;
    unit.x = clamp(unit.x, lane.centerX - lane.width / 2 + inset, lane.centerX + lane.width / 2 - inset);
  }

  updateStructure(structure, dt, positions = null) {
    if (!structure.alive) return;
    const definition = STRUCTURE_DEFINITIONS[structure.structureType];
    const target = acquireStructureTarget(this.state, structure, positions);
    structure.targetId = target?.id ?? null;
    structure.fireCooldown = Math.max(0, structure.fireCooldown - dt);
    if (target && structure.fireCooldown === 0) this.fire(structure, target, definition, positions);
  }

  fire(owner, target, definition, positions = null) {
    const laneId = owner.laneId ?? target.laneId;
    const laneTeamProjectiles = [...this.state.projectiles.values()].reduce((count, projectile) => (
      projectile.alive && projectile.ownerTeam === owner.team && projectile.laneId === laneId ? count + 1 : count
    ), 0);
    if (laneTeamProjectiles >= CONFIG.caps.projectilesPerLaneTeam || this.state.projectiles.size >= CONFIG.caps.projectiles) {
      emitSimulationEvent(this.state, {
        type: "projectile_rejected",
        ownerId: owner.id,
        team: owner.team,
        laneId,
        reason: laneTeamProjectiles >= CONFIG.caps.projectilesPerLaneTeam ? "lane_team_budget" : "global_safety_budget",
      });
      return;
    }
    const projectileDefinition = PROJECTILE_DEFINITIONS[definition.projectileId];
    const ownerPosition = positions?.get(owner.id) ?? owner;
    const targetPosition = positions?.get(target.id) ?? target;
    const dx = targetPosition.x - ownerPosition.x;
    const dy = targetPosition.y - ownerPosition.y;
    const magnitude = Math.hypot(dx, dy) || 1;
    const muzzleOffset = owner.structureType === "turret" ? 25 : 0;
    const muzzleX = ownerPosition.x + dx / magnitude * muzzleOffset;
    const muzzleY = ownerPosition.y + dy / magnitude * muzzleOffset;
    const projectile = createProjectile({
      id: this.state.ids.next(), ownerId: owner.id, ownerTeam: owner.team, laneId,
      projectileType: projectileDefinition.id, x: muzzleX, y: muzzleY,
      vx: (dx / magnitude) * projectileDefinition.speed, vy: (dy / magnitude) * projectileDefinition.speed,
      damage: this.damageFor(owner, definition) * this.damageMultiplier(owner, target), targetId: target.id,
    });
    projectile.remainingLife = projectileDefinition.lifetime;
    addProjectileToState(this.state, projectile);
    owner.fireCooldown = definition.fireInterval;
    owner.lastShotAt = this.state.time;
    emitSimulationEvent(this.state, { type: "shot", ownerId: owner.id, targetId: target.id, projectileType: projectile.projectileType, x: muzzleX, y: muzzleY, team: owner.team });
  }

  damageFor(owner, definition) {
    if (owner.structureType !== "turret" || !this.economy) return definition.damage;
    const level = this.economy.get(owner.team).turretLevel;
    return definition.damage * (1 + level * this.economy.balance.turretUpgradeDamageBonus);
  }

  damageMultiplier(owner, target) {
    if (owner.unitType === "fighter") return target.structureType || target.unitType === "frigate" ? 0.55 : 1.3;
    if (owner.unitType === "bomber") return target.structureType || target.unitType === "frigate" ? 1.55 : 0.4;
    if (owner.unitType === "scout" && (target.structureType || target.unitType === "frigate")) return 0.55;
    return 1;
  }

  updateProjectiles(dt) {
    const damageEvents = [];
    for (const projectile of [...this.state.projectiles.values()].sort((a, b) => a.id.localeCompare(b.id))) {
      if (!projectile.alive) continue;
      projectile.previousX = projectile.x;
      projectile.previousY = projectile.y;
      projectile.trail.push({ x: projectile.x, y: projectile.y });
      if (projectile.trail.length > 10) projectile.trail.shift();
      projectile.age += dt;
      const definition = PROJECTILE_DEFINITIONS[projectile.projectileType];
      const target = getEntity(this.state, projectile.targetId);
      if (definition.homing && target?.alive) {
        const current = Math.atan2(projectile.vy, projectile.vx);
        const desired = Math.atan2(target.y - projectile.y, target.x - projectile.x);
        const next = current + clamp(angleDelta(current, desired), -definition.turnRate * dt, definition.turnRate * dt);
        const speed = Math.hypot(projectile.vx, projectile.vy) + (definition.acceleration ?? 0) * dt;
        projectile.vx = Math.cos(next) * speed;
        projectile.vy = Math.sin(next) * speed;
      }
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.remainingLife -= dt;
      if (target?.alive && target.team !== projectile.ownerTeam && (target.laneId === null || target.laneId === projectile.laneId) && distance(projectile, target) <= definition.hitRadius + targetDefinition(target).collisionRadius + 1e-6) {
        projectile.alive = false;
        damageEvents.push({ projectileId: projectile.id, projectileType: projectile.projectileType, targetId: target.id, damage: projectile.damage, ownerTeam: projectile.ownerTeam });
      } else if (projectile.remainingLife <= 0) {
        projectile.alive = false;
      }
    }
    return damageEvents.sort((a, b) => a.targetId.localeCompare(b.targetId) || a.projectileId.localeCompare(b.projectileId));
  }

  applyDamage(events) {
    let headquartersDestroyed = false;
    for (const event of events) {
      const target = getEntity(this.state, event.targetId);
      if (!target?.alive || target.team === event.ownerTeam) continue;
      target.hp = Math.max(0, target.hp - event.damage);
      target.lastDamagedAt = this.state.time;
      emitSimulationEvent(this.state, { type: "hit", ...event, x: target.x, y: target.y, team: target.team, entityType: target.structureType ?? target.unitType });
      if (target.hp !== 0) continue;
      target.alive = false;
      if (!target.structureType) target.state = UNIT_STATE.DEAD;
      emitSimulationEvent(this.state, { type: "destroyed", entityId: target.id, x: target.x, y: target.y, team: target.team, entityType: target.structureType ?? target.unitType });
      if (target.structureType === "hq") headquartersDestroyed = true;
    }
    if (headquartersDestroyed) {
      const playerHq = this.state.structures.get("player-hq");
      const enemyHq = this.state.structures.get("enemy-hq");
      if (!playerHq?.alive && !enemyHq?.alive) this.state.terminalTeam = TEAM.DRAW;
      else if (!playerHq?.alive) this.state.terminalTeam = TEAM.ENEMY;
      else if (!enemyHq?.alive) this.state.terminalTeam = TEAM.PLAYER;
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
