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
  drone: Object.freeze({ forward: 86, lateral: [0, -42, 42, -21, 21, -60, 60] }),
  scout: Object.freeze({ forward: 70, lateral: [0, -56, 56, -28, 28] }),
  frigate: Object.freeze({ forward: 30, lateral: [0, -40, 40] }),
  fighter: Object.freeze({ forward: 4, lateral: [-52, 52, -20, 20] }),
  bomber: Object.freeze({ forward: -50, lateral: [36, -36, 0] }),
});

const squadIdFor = (team, laneId, spawnCycle) => `${team}:${laneId}:${spawnCycle}`;
const vectorLimit = (x, y, maximum) => {
  const magnitude = Math.hypot(x, y);
  if (magnitude <= maximum || magnitude === 0) return { x, y };
  return { x: x / magnitude * maximum, y: y / magnitude * maximum };
};

export class BattleSimulation {
  constructor({ state = createBattleState(), economy = null } = {}) {
    this.state = state;
    this.economy = economy;
    this.stepNumber = 0;
    this.squads = new Map();
  }

  spawnUnit(team, laneId, unitType, { x, y, slotOffsetX = 0, slotOffsetY = 0, spawnCycle = 0, launch = null } = {}) {
    const lane = laneFor(this.state, laneId);
    const laneDefinition = this.state.map.lanes.find((item) => item.id === laneId);
    const active = lane.unitIds.get(team);
    if (active.length >= CONFIG.caps.unitsPerLaneTeam) return null;
    const spawn = team === TEAM.PLAYER ? laneDefinition.playerSpawn : laneDefinition.enemySpawn;
    const targetX = x ?? spawn.x + slotOffsetX;
    const targetY = y ?? spawn.y + slotOffsetY;
    const formationId = squadIdFor(team, laneId, spawnCycle);
    const unit = addUnitToState(this.state, createUnit({
      id: this.state.ids.next(), team, laneId, unitType,
      x: targetX, y: targetY, slotOffsetX, slotOffsetY, spawnCycle, formationId,
      heading: team === TEAM.PLAYER ? -Math.PI / 2 : Math.PI / 2,
      launch,
    }));
    const squad = this.squads.get(formationId);
    const unitSpeed = UNIT_DEFINITIONS[unitType].speed;
    if (squad) {
      squad.minimumSpeed = Math.min(squad.minimumSpeed, unitSpeed);
      squad.speedTotal += unitSpeed;
      squad.unitCount += 1;
      squad.cruiseSpeed = Math.max(squad.minimumSpeed, squad.speedTotal / squad.unitCount * 0.82);
    } else this.squads.set(formationId, {
      id: formationId, team, laneId, spawnCycle,
      x: laneDefinition.centerX, y: targetY - slotOffsetY,
      cruiseSpeed: unitSpeed,
      minimumSpeed: unitSpeed,
      speedTotal: unitSpeed,
      unitCount: 1,
    });
    return unit;
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
      const longitudinal = direction * (pattern.forward - row * 30 + ((index + spawnCycle) % 2 ? 3 : -3));
      return this.spawnUnit(team, laneId, unitType, {
        slotOffsetX: lateral,
        slotOffsetY: longitudinal,
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
    this.advanceSquadAnchors(dt);
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
    this.removeEmptySquads();
  }

  advanceSquadAnchors(dt) {
    for (const squad of this.squads.values()) {
      const units = [...this.state.units.values()].filter((unit) => unit.alive && unit.formationId === squad.id);
      const active = units.filter((unit) => !unit.launching);
      if (!active.length) continue;
      const engaged = active.some((unit) => unit.state !== UNIT_STATE.ADVANCING);
      if (!engaged) squad.y += forwardDirection(squad.team) * squad.cruiseSpeed * dt;
      squad.y = clamp(squad.y, 70, this.state.map.bounds.height - 70);
    }
  }

  removeEmptySquads() {
    const activeIds = new Set([...this.state.units.values()].map((unit) => unit.formationId));
    for (const id of this.squads.keys()) if (!activeIds.has(id)) this.squads.delete(id);
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
    unit.vx = 0;
    unit.vy = 0;
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
            const leftSpacing = UNIT_DEFINITIONS[left.unitType].spacingRadius ?? UNIT_DEFINITIONS[left.unitType].collisionRadius;
            const rightSpacing = UNIT_DEFINITIONS[right.unitType].spacingRadius ?? UNIT_DEFINITIONS[right.unitType].collisionRadius;
            const minimum = leftSpacing + rightSpacing + 4;
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
    const previousTargetId = unit.targetId;
    const target = acquireUnitTarget(this.state, unit, positions);
    const targetPosition = positions?.get(target?.id) ?? target;
    unit.targetId = target?.id ?? null;
    const unitPosition = positions?.get(unit.id) ?? unit;
    const continuingEngagement = previousTargetId === target?.id && unit.state !== UNIT_STATE.ADVANCING;
    const engagementRange = continuingEngagement ? definition.targetLeash : definition.aggroRange;
    const engaged = target && inRange(unitPosition, targetPosition, engagementRange);
    unit.state = engaged ? (target.structureType ? UNIT_STATE.ATTACKING_STRUCTURE : UNIT_STATE.ENGAGING) : UNIT_STATE.ADVANCING;
    unit.fireCooldown = Math.max(0, unit.fireCooldown - dt);
    if (!engaged) {
      const node = unit.unitType === "scout" ? [...this.state.nodes.values()].find((item) => item.laneId === unit.laneId) : null;
      const nodeAhead = node && (node.y - unit.y) * forwardDirection(unit.team) >= -node.radius;
      if (nodeAhead && node.ownerTeam !== unit.team) {
        const dx = node.x - unit.x;
        const dy = node.y - unit.y;
        const magnitude = Math.hypot(dx, dy) || 1;
        if (magnitude > node.radius * 0.42) {
          this.steerUnit(unit, {
            x: node.x - dx / magnitude * node.radius * 0.38,
            y: node.y - dy / magnitude * node.radius * 0.38,
          }, definition, dt);
        } else {
          unit.state = UNIT_STATE.HOLDING;
          this.steerUnit(unit, { x: unit.x, y: unit.y }, definition, dt);
        }
      } else {
        const squad = this.squads.get(unit.formationId);
        const lane = this.state.map.lanes.find((item) => item.id === unit.laneId);
        const cruiseSpeed = squad?.cruiseSpeed ?? definition.speed;
        this.steerUnit(unit, {
          x: lane.centerX + unit.slotOffsetX,
          y: (squad?.y ?? unit.y) + unit.slotOffsetY,
          baseVx: 0,
          baseVy: forwardDirection(unit.team) * cruiseSpeed,
          speedLimit: Math.max(definition.speed, cruiseSpeed),
        }, definition, dt);
      }
      this.constrainToLane(unit);
      return;
    }
    const tactical = this.tacticalPosition(unit, targetPosition, definition);
    this.steerUnit(unit, tactical, definition, dt, tactical.heading);
    this.constrainToLane(unit);
    const aligned = !definition.broadside || Math.abs(angleDelta(unit.heading, tactical.heading)) <= 0.32;
    if (inRange(unitPosition, targetPosition, definition.attackRange) && aligned && unit.fireCooldown === 0) {
      this.fire(unit, target, definition, positions);
    }
  }

  tacticalPosition(unit, target, definition) {
    let dx = unit.x - target.x;
    let dy = unit.y - target.y;
    let magnitude = Math.hypot(dx, dy);
    if (magnitude < 0.001) {
      dx = unit.broadsideSide;
      dy = -forwardDirection(unit.team);
      magnitude = Math.hypot(dx, dy);
    }
    const awayX = dx / magnitude;
    const awayY = dy / magnitude;
    const standoff = definition.attackRange * (definition.broadside ? 0.82 : 0.76);
    const lateral = clamp(unit.slotOffsetX * 0.42, -30, 30) * forwardDirection(unit.team);
    const targetBearing = Math.atan2(target.y - unit.y, target.x - unit.x);
    return {
      x: target.x + awayX * standoff - awayY * lateral,
      y: target.y + awayY * standoff + awayX * lateral,
      heading: definition.broadside
        ? targetBearing + unit.broadsideSide * forwardDirection(unit.team) * Math.PI / 2
        : targetBearing,
    };
  }

  steerUnit(unit, destination, definition, dt, desiredHeading = null) {
    const dx = destination.x - unit.x;
    const dy = destination.y - unit.y;
    const magnitude = Math.hypot(dx, dy);
    const speedLimit = destination.speedLimit ?? definition.speed;
    const correctionSpeed = Math.min(speedLimit, magnitude * 2.2);
    let desiredVx = destination.baseVx ?? 0;
    let desiredVy = destination.baseVy ?? 0;
    if (magnitude > 0.001) {
      desiredVx += dx / magnitude * correctionSpeed;
      desiredVy += dy / magnitude * correctionSpeed;
    }
    const desired = vectorLimit(desiredVx, desiredVy, speedLimit);
    const velocityChange = vectorLimit(desired.x - unit.vx, desired.y - unit.vy, definition.acceleration * dt);
    unit.vx += velocityChange.x;
    unit.vy += velocityChange.y;
    unit.x += unit.vx * dt;
    unit.y += unit.vy * dt;
    const movementHeading = Math.hypot(unit.vx, unit.vy) > 1 ? Math.atan2(unit.vy, unit.vx) : unit.heading;
    const nextHeading = desiredHeading ?? movementHeading;
    unit.heading += clamp(angleDelta(unit.heading, nextHeading), -definition.turnRate * dt, definition.turnRate * dt);
  }

  constrainToLane(unit) {
    const lane = this.state.map.lanes.find((item) => item.id === unit.laneId);
    const inset = UNIT_DEFINITIONS[unit.unitType].collisionRadius + 5;
    unit.x = clamp(unit.x, lane.centerX - lane.width / 2 + inset, lane.centerX + lane.width / 2 - inset);
    unit.y = clamp(unit.y, inset, this.state.map.bounds.height - inset);
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
    const requestedShots = definition.salvoCount ?? 1;
    const availableShots = Math.min(
      requestedShots,
      CONFIG.caps.projectilesPerLaneTeam - laneTeamProjectiles,
      CONFIG.caps.projectiles - this.state.projectiles.size,
    );
    if (availableShots <= 0) {
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
    const firingAngle = Math.atan2(dy, dx);
    const hardpointAxis = definition.broadside && Number.isFinite(owner.heading) ? owner.heading : firingAngle + Math.PI / 2;
    const muzzleOffset = definition.muzzleOffset ?? (owner.structureType === "turret" ? 25 : 0);
    const totalDamage = this.damageFor(owner, definition) * this.damageMultiplier(owner, target);
    for (let index = 0; index < availableShots; index += 1) {
      const mirroredIndex = owner.team === TEAM.ENEMY ? requestedShots - 1 - index : index;
      const salvoOffset = mirroredIndex - (requestedShots - 1) / 2;
      const hardpointOffset = salvoOffset * (definition.hardpointSpacing ?? 0);
      const muzzleX = ownerPosition.x + Math.cos(firingAngle) * muzzleOffset + Math.cos(hardpointAxis) * hardpointOffset;
      const muzzleY = ownerPosition.y + Math.sin(firingAngle) * muzzleOffset + Math.sin(hardpointAxis) * hardpointOffset;
      const projectileAngle = firingAngle + salvoOffset * (definition.salvoSpread ?? 0);
      const projectile = createProjectile({
        id: this.state.ids.next(), ownerId: owner.id, ownerTeam: owner.team, laneId,
        projectileType: projectileDefinition.id, x: muzzleX, y: muzzleY,
        vx: Math.cos(projectileAngle) * projectileDefinition.speed, vy: Math.sin(projectileAngle) * projectileDefinition.speed,
        damage: totalDamage / requestedShots, targetId: target.id,
      });
      projectile.remainingLife = projectileDefinition.lifetime;
      addProjectileToState(this.state, projectile);
      emitSimulationEvent(this.state, {
        type: "shot", ownerId: owner.id, targetId: target.id, projectileType: projectile.projectileType,
        x: muzzleX, y: muzzleY, team: owner.team, laneId, hardpointIndex: mirroredIndex, salvoCount: requestedShots,
      });
    }
    if (availableShots < requestedShots) {
      emitSimulationEvent(this.state, {
        type: "projectile_rejected", ownerId: owner.id, team: owner.team, laneId,
        reason: "partial_salvo_budget", rejectedCount: requestedShots - availableShots,
      });
    }
    owner.fireCooldown = definition.fireInterval;
    owner.lastShotAt = this.state.time;
  }

  damageFor(owner, definition) {
    if (!this.economy) return definition.damage;
    if (!owner.structureType) return definition.damage * this.economy.weaponDamageMultiplier(owner.team);
    if (owner.structureType !== "turret") return definition.damage;
    const level = this.economy.get(owner.team).turretLevel;
    return definition.damage * (1 + level * this.economy.balance.turretUpgradeDamageBonus);
  }

  damageMultiplier(owner, target) {
    if (owner.unitType === "drone" && (target.structureType || target.unitType === "frigate")) return 0.25;
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
        damageEvents.push({ projectileId: projectile.id, projectileType: projectile.projectileType, targetId: target.id, damage: projectile.damage, ownerTeam: projectile.ownerTeam, laneId: projectile.laneId });
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
      emitSimulationEvent(this.state, { type: "destroyed", entityId: target.id, x: target.x, y: target.y, heading: target.heading, team: target.team, laneId: target.laneId, entityType: target.structureType ?? target.unitType });
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
