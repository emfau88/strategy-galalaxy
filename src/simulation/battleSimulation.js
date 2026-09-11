import { CONFIG } from "../config.js";
import { PROJECTILE_DEFINITIONS, STRUCTURE_DEFINITIONS, UNIT_DEFINITIONS } from "../data/definitions.js";
import { LANE, TEAM } from "../core/constants.js";
import { addProjectileToState, addUnitToState, createBattleState, emitSimulationEvent, enemyOf, laneFor, removeDeadEntities } from "./battleState.js";
import { createProjectile, createUnit, UNIT_STATE } from "./entities.js";
import { acquireStructureTarget, acquireUnitTarget, getEntity, inRange, planUnitTargets } from "./targeting.js";

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const forwardDirection = (team) => (team === TEAM.PLAYER ? -1 : 1);
const targetDefinition = (entity) => entity.structureType ? STRUCTURE_DEFINITIONS[entity.structureType] : UNIT_DEFINITIONS[entity.unitType];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const angleDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));
const LAUNCH_DURATION_SECONDS = 0.62;
const PROJECTILE_TRAIL_LIMIT = Object.freeze({
  scout_pulse: 8,
  light_bolt: 8,
  fighter_laser: 12,
  siege_missile: 14,
  heavy_cannon: 12,
  heavy_bolt: 12,
});
const COMBAT_SPEED_SCALE = Object.freeze({
  drone: 0.48,
  scout: 0.5,
  fighter: 0.52,
  bomber: 0.6,
  frigate: 0.55,
  battlecruiser: 0.52,
  dreadnought: 0.48,
});

const FORMATION = Object.freeze({
  drone: Object.freeze({ forward: 92, lateral: [-34, 34, 0, -68, 68, -96, 96] }),
  scout: Object.freeze({ forward: 74, lateral: [0, -64, 64, -32, 32] }),
  frigate: Object.freeze({ forward: 34, lateral: [0, -48, 48] }),
  fighter: Object.freeze({ forward: 2, lateral: [-62, 62, -25, 25] }),
  bomber: Object.freeze({ forward: -58, lateral: [44, -44, 0] }),
});
const WING_FORMATION = Object.freeze({
  drone: Object.freeze({ forward: 92, lateral: [0, -18, 18, -36, 36, -54, 54] }),
  scout: Object.freeze({ forward: 74, lateral: [0, -24, 24, -48, 48] }),
  fighter: Object.freeze({ forward: 2, lateral: [-24, 24, 0, -48, 48] }),
});
const COMBAT_COLUMNS = Object.freeze([0, -1, 1]);
const TARGET_PLAN_INTERVAL_STEPS = 12;
const SEPARATION_RESPONSE = 9;
const SEPARATION_SPEED_RATIO = 0.42;

const squadIdFor = (team, laneId, spawnCycle) => `${team}:${laneId}:${spawnCycle}`;
const vectorLimit = (x, y, maximum) => {
  const magnitude = Math.hypot(x, y);
  if (magnitude <= maximum || magnitude === 0) return { x, y };
  return { x: x / magnitude * maximum, y: y / magnitude * maximum };
};
const interceptPoint = (origin, target, projectileSpeed, maximumTime) => {
  const relativeX = target.x - origin.x;
  const relativeY = target.y - origin.y;
  const targetVx = target.vx ?? 0;
  const targetVy = target.vy ?? 0;
  const a = targetVx ** 2 + targetVy ** 2 - projectileSpeed ** 2;
  const b = 2 * (relativeX * targetVx + relativeY * targetVy);
  const c = relativeX ** 2 + relativeY ** 2;
  let interceptTime = null;
  if (Math.abs(a) < 1e-6) {
    if (Math.abs(b) > 1e-6) interceptTime = -c / b;
  } else {
    const discriminant = b ** 2 - 4 * a * c;
    if (discriminant >= 0) {
      const root = Math.sqrt(discriminant);
      const candidates = [(-b - root) / (2 * a), (-b + root) / (2 * a)].filter((time) => time > 0);
      if (candidates.length) interceptTime = Math.min(...candidates);
    }
  }
  if (!Number.isFinite(interceptTime) || interceptTime <= 0 || interceptTime > maximumTime) return target;
  return {
    ...target,
    x: target.x + targetVx * interceptTime,
    y: target.y + targetVy * interceptTime,
  };
};

export class BattleSimulation {
  constructor({ state = createBattleState(), economy = null, config = CONFIG } = {}) {
    this.state = state;
    this.economy = economy;
    this.config = config;
    this.stepNumber = 0;
    this.squads = new Map();
    this.targetAssignments = new Map();
    this.combatSlots = new Map();
    this.combatSlotClaims = new Map();
    this.nextTargetPlanStep = 0;
  }

  spawnUnit(team, laneId, unitType, { x, y, slotOffsetX = 0, slotOffsetY = 0, spawnCycle = 0, launch = null } = {}) {
    const lane = laneFor(this.state, laneId);
    const laneDefinition = this.state.map.lanes.find((item) => item.id === laneId);
    const active = lane.unitIds.get(team);
    if (active.length >= this.config.caps.unitsPerLaneTeam) return null;
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
    this.syncUnitShield(unit, { refill: true });
    const squad = this.squads.get(formationId);
    const unitSpeed = UNIT_DEFINITIONS[unitType].speed * (this.state.map.movementScale ?? 1);
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
    const lane = this.state.lanes.get(laneId);
    const active = lane?.unitIds.get(team);
    const validFormation = Array.isArray(unitTypes)
      && unitTypes.every((unitType) => UNIT_DEFINITIONS[unitType] && UNIT_DEFINITIONS[unitType].enabled !== false)
      && active
      && active.length + unitTypes.length <= this.config.caps.unitsPerLaneTeam;
    if (!validFormation) return [];
    const direction = forwardDirection(team);
    const typeCounts = new Map();
    const isSingleTypeWing = unitTypes.length > 1 && unitTypes.every((unitType) => unitType === unitTypes[0]);
    const hq = [...this.state.structures.values()].find((structure) => structure.team === team && structure.structureType === "hq");
    const laneSide = laneId === LANE.LEFT ? -1 : laneId === LANE.RIGHT ? 1 : spawnCycle % 2 ? -1 : 1;
    const launchOrigin = hq ? { x: hq.x + laneSide * 34, y: hq.y + direction * 25 } : null;
    return unitTypes.map((unitType, index) => {
      const pattern = (isSingleTypeWing ? WING_FORMATION[unitType] : null) ?? FORMATION[unitType] ?? FORMATION.fighter;
      const typeIndex = typeCounts.get(unitType) ?? 0;
      typeCounts.set(unitType, typeIndex + 1);
      const row = Math.floor(typeIndex / pattern.lateral.length);
      const lateral = pattern.lateral[typeIndex % pattern.lateral.length];
      const longitudinal = direction * (pattern.forward - row * 36 + ((index + spawnCycle) % 2 ? 4 : -4));
      return this.spawnUnit(team, laneId, unitType, {
        slotOffsetX: lateral,
        slotOffsetY: longitudinal,
        spawnCycle,
        launch: launchOrigin ? { ...launchOrigin, duration: LAUNCH_DURATION_SECONDS, delay: index * 0.055 } : null,
      });
    }).filter(Boolean);
  }

  syncUnitShield(unit, { refill = false, announce = false } = {}) {
    if (!unit || !this.economy) return unit;
    const previousMaximum = unit.maxShield ?? 0;
    const maximum = this.economy.shieldCapacity(unit.team, unit.maxHp);
    unit.maxShield = maximum;
    if (refill) unit.shield = maximum;
    else unit.shield = clamp((unit.shield ?? 0) + Math.max(0, maximum - previousMaximum), 0, maximum);
    if (announce && maximum > 0) unit.lastShieldActivatedAt = this.state.time;
    return unit;
  }

  activateShieldUpgrade(team) {
    for (const unit of this.state.units.values()) {
      if (unit.alive && unit.team === team) this.syncUnitShield(unit, { refill: true, announce: true });
    }
  }

  advanceUnitShield(unit, dt) {
    if (!unit.alive || !this.economy || unit.maxShield <= 0 || unit.shield >= unit.maxShield) return;
    const lastDefenseHitAt = Math.max(unit.lastShieldHitAt, unit.lastDamagedAt);
    if (this.state.time - lastDefenseHitAt < this.economy.shieldRechargeDelay(unit.team)) return;
    const previous = unit.shield;
    unit.shield = Math.min(unit.maxShield, unit.shield + this.economy.shieldRechargeRate(unit.team, unit.maxHp) * dt);
    if (previous < unit.maxShield && unit.shield === unit.maxShield) unit.lastShieldActivatedAt = this.state.time;
  }

  step(dt) {
    if (this.state.terminalTeam) return;
    this.stepNumber += 1;
    this.state.time += dt;
    for (const unit of this.state.units.values()) {
      this.advanceLaunch(unit, dt);
      this.advanceUnitShield(unit, dt);
    }
    this.advanceSquadAnchors(dt);
    const separationVelocities = this.resolveLaneSpacing(dt);
    const positions = new Map([
      ...[...this.state.units.values()].map((entity) => [entity.id, { x: entity.x, y: entity.y, vx: entity.vx, vy: entity.vy }]),
      ...[...this.state.structures.values()].map((entity) => [entity.id, { x: entity.x, y: entity.y }]),
    ]);
    const activeUnits = [...this.state.units.values()].filter((unit) => unit.alive && !unit.launching);
    const targetPlanInvalid = activeUnits.some((unit) => {
      if (!this.targetAssignments.has(unit.id)) return true;
      const targetId = this.targetAssignments.get(unit.id);
      return targetId !== null && !getEntity(this.state, targetId)?.alive;
    });
    if (this.stepNumber >= this.nextTargetPlanStep || targetPlanInvalid) {
      this.targetAssignments = planUnitTargets(this.state, positions);
      this.combatSlots = this.combatSlotsFor(this.targetAssignments);
      this.nextTargetPlanStep = this.stepNumber + TARGET_PLAN_INTERVAL_STEPS;
    }
    const direction = this.stepNumber % 2 === 0 ? -1 : 1;
    const stableOrder = (items) => [...items.values()].sort((a, b) => a.id.localeCompare(b.id) * direction);
    for (const unit of stableOrder(this.state.units)) this.updateUnit(unit, dt, positions, this.targetAssignments, this.combatSlots, separationVelocities);
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
      const hasAdvancingShips = active.some((unit) => unit.state === UNIT_STATE.ADVANCING);
      if (hasAdvancingShips) squad.y += forwardDirection(squad.team) * squad.cruiseSpeed * dt;
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

  resolveLaneSpacing(dt = this.config.timing.fixedStepSeconds) {
    const requested = new Map();
    for (const lane of this.state.lanes.values()) {
      const laneDefinition = this.state.map.lanes.find((item) => item.id === lane.id);
      for (const team of [TEAM.PLAYER, TEAM.ENEMY]) {
        const units = lane.unitIds.get(team).map((id) => this.state.units.get(id)).filter((unit) => unit?.alive && !unit.launching).sort((left, right) => left.y - right.y || left.id.localeCompare(right.id));
        for (let first = 0; first < units.length; first += 1) {
          for (let second = first + 1; second < units.length; second += 1) {
            const left = units[first];
            const right = units[second];
            const leftSpacing = UNIT_DEFINITIONS[left.unitType].spacingRadius ?? UNIT_DEFINITIONS[left.unitType].collisionRadius;
            const rightSpacing = UNIT_DEFINITIONS[right.unitType].spacingRadius ?? UNIT_DEFINITIONS[right.unitType].collisionRadius;
            const minimum = (leftSpacing + rightSpacing) * (this.state.map.spacingScale ?? 1) + 6;
            const dx = right.x - left.x;
            const dy = right.y - left.y;
            const current = Math.hypot(dx, dy);
            if (current >= minimum) continue;
            const leftSlot = this.combatSlots.get(left.id)?.lateral ?? left.slotOffsetX;
            const rightSlot = this.combatSlots.get(right.id)?.lateral ?? right.slotOffsetX;
            const direction = Math.abs(rightSlot - leftSlot) > 0.5
              ? Math.sign(rightSlot - leftSlot)
              : Math.abs(dx) > 0.5
                ? Math.sign(dx)
                : left.id.localeCompare(right.id) < 0 ? 1 : -1;
            const overlap = 1 - current / Math.max(1, minimum);
            const leftMass = leftSpacing ** 2;
            const rightMass = rightSpacing ** 2;
            const totalMass = leftMass + rightMass;
            const speed = minimum * overlap * 2.4;
            requested.set(left.id, (requested.get(left.id) ?? 0) - direction * speed * rightMass / totalMass);
            requested.set(right.id, (requested.get(right.id) ?? 0) + direction * speed * leftMass / totalMass);
          }
        }
        const minX = laneDefinition.centerX - laneDefinition.width / 2;
        const maxX = laneDefinition.centerX + laneDefinition.width / 2;
        for (const unit of units) {
          const definition = UNIT_DEFINITIONS[unit.unitType];
          const inset = definition.collisionRadius + 5;
          let target = clamp(requested.get(unit.id) ?? 0, -definition.speed * SEPARATION_SPEED_RATIO, definition.speed * SEPARATION_SPEED_RATIO);
          const boundaryFade = definition.spacingRadius + 8;
          if (target < 0) target *= clamp((unit.x - (minX + inset)) / boundaryFade, 0, 1);
          else if (target > 0) target *= clamp(((maxX - inset) - unit.x) / boundaryFade, 0, 1);
          const response = 1 - Math.exp(-SEPARATION_RESPONSE * dt);
          unit.separationVx += (target - (unit.separationVx ?? 0)) * response;
          if (Math.abs(unit.separationVx) < 0.01 && target === 0) unit.separationVx = 0;
        }
      }
    }
    return new Map([...this.state.units.values()].map((unit) => [unit.id, unit.separationVx ?? 0]));
  }

  combatSlotsFor(targetAssignments) {
    const groups = new Map();
    for (const unit of this.state.units.values()) {
      const targetId = targetAssignments.get(unit.id);
      if (!unit.alive || unit.launching || !targetId) continue;
      const key = `${unit.team}:${targetId}:${unit.unitType}`;
      const members = groups.get(key) ?? [];
      members.push(unit);
      groups.set(key, members);
    }
    const slots = new Map();
    const activeClaims = new Map();
    for (const [groupKey, members] of groups) {
      members.sort((left, right) => left.id.localeCompare(right.id));
      const occupied = new Set();
      const slotIndexFor = new Map();
      for (const unit of members) {
        const previous = this.combatSlotClaims.get(unit.id);
        if (previous?.groupKey !== groupKey || occupied.has(previous.index)) continue;
        occupied.add(previous.index);
        slotIndexFor.set(unit.id, previous.index);
      }
      for (const unit of members) {
        if (slotIndexFor.has(unit.id)) continue;
        let index = 0;
        while (occupied.has(index)) index += 1;
        occupied.add(index);
        slotIndexFor.set(unit.id, index);
      }
      for (const unit of members) {
        const index = slotIndexFor.get(unit.id);
        activeClaims.set(unit.id, { groupKey, index });
        const spacing = UNIT_DEFINITIONS[unit.unitType].spacingRadius ?? UNIT_DEFINITIONS[unit.unitType].collisionRadius;
        const gap = spacing * 2 + 8;
        const row = Math.floor(index / 3);
        const column = COMBAT_COLUMNS[index % 3];
        slots.set(unit.id, {
          lateral: column * gap,
          depth: row * gap,
          broadsideSide: index % 2 === 0 ? -1 : 1,
          broadsideDepth: Math.floor(index / 2) * gap,
        });
      }
    }
    this.combatSlotClaims = activeClaims;
    return slots;
  }

  updateUnit(unit, dt, positions = null, targetAssignments = null, combatSlots = null, separationVelocities = null) {
    if (!unit.alive) return;
    if (unit.launching) return;
    const startX = unit.x;
    const startY = unit.y;
    const definition = UNIT_DEFINITIONS[unit.unitType];
    const movementScale = this.state.map.movementScale ?? 1;
    const motionDefinition = movementScale === 1 ? definition : {
      ...definition,
      speed: definition.speed * movementScale,
      acceleration: definition.acceleration * movementScale,
    };
    const separationVx = separationVelocities?.get(unit.id) ?? unit.separationVx ?? 0;
    const previousTargetId = unit.targetId;
    const plannedTargetId = targetAssignments?.get(unit.id);
    const target = targetAssignments?.has(unit.id)
      ? getEntity(this.state, plannedTargetId)
      : acquireUnitTarget(this.state, unit, positions);
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
            separationVx,
          }, motionDefinition, dt);
        } else {
          unit.state = UNIT_STATE.HOLDING;
          this.steerUnit(unit, { x: unit.x, y: unit.y, separationVx }, motionDefinition, dt);
        }
      } else {
        const squad = this.squads.get(unit.formationId);
        const lane = this.state.map.lanes.find((item) => item.id === unit.laneId);
        const cruiseSpeed = squad?.cruiseSpeed ?? motionDefinition.speed;
        this.steerUnit(unit, {
          x: lane.centerX + unit.slotOffsetX,
          y: (squad?.y ?? unit.y) + unit.slotOffsetY,
          baseVx: 0,
          baseVy: forwardDirection(unit.team) * cruiseSpeed,
          speedLimit: Math.max(motionDefinition.speed, cruiseSpeed),
          separationVx,
        }, motionDefinition, dt);
      }
      this.constrainToLane(unit);
      this.observeUnitMobility(unit, startX, startY, dt);
      return;
    }
    const tactical = this.tacticalPosition(unit, targetPosition, definition, combatSlots?.get(unit.id));
    tactical.speedLimit = motionDefinition.speed * (COMBAT_SPEED_SCALE[unit.unitType] ?? 0.55);
    tactical.separationVx = separationVx;
    this.steerUnit(unit, tactical, motionDefinition, dt, tactical.heading);
    this.constrainToLane(unit);
    this.observeUnitMobility(unit, startX, startY, dt);
    const aligned = !definition.broadside || Math.abs(angleDelta(unit.heading, tactical.heading)) <= 0.32;
    if (inRange(unitPosition, targetPosition, definition.attackRange) && aligned && unit.fireCooldown === 0) {
      this.fire(unit, target, definition, positions);
    }
  }

  observeUnitMobility(unit, startX, startY, dt) {
    const moved = Math.hypot(unit.x - startX, unit.y - startY);
    if (unit.state !== UNIT_STATE.ADVANCING || moved > 0.025) {
      unit.mobilityStallTime = 0;
      return;
    }
    unit.mobilityStallTime = (unit.mobilityStallTime ?? 0) + dt;
    if (unit.mobilityStallTime < 1.15) return;
    const lane = this.state.map.lanes.find((item) => item.id === unit.laneId);
    const laneCenter = lane?.centerX ?? unit.x;
    const awayFromBoundary = Math.abs(unit.x - laneCenter) > (lane?.width ?? 160) * 0.32
      ? Math.sign(laneCenter - unit.x)
      : unit.broadsideSide || 1;
    const definition = UNIT_DEFINITIONS[unit.unitType];
    unit.vx = awayFromBoundary * Math.min(9, definition.speed * 0.2);
    unit.vy = forwardDirection(unit.team) * Math.min(7, definition.speed * 0.16);
    unit.x += unit.vx * Math.max(dt, 1 / 60);
    this.constrainToLane(unit);
    unit.mobilityStallTime = 0;
    emitSimulationEvent(this.state, {
      type: "unit_unstuck", entityId: unit.id, team: unit.team, laneId: unit.laneId, x: unit.x, y: unit.y,
    });
  }

  tacticalPosition(unit, target, definition, combatSlot = null) {
    const direction = forwardDirection(unit.team);
    const standoff = definition.attackRange * (definition.broadside ? 0.9 : definition.role === "siege" ? 0.94 : 0.91);
    const formationLateral = clamp(unit.slotOffsetX * 0.55, -44, 44);
    const combatLateral = combatSlot?.lateral ?? formationLateral;
    const combatDepth = combatSlot?.depth ?? 0;
    const lane = this.state.map.lanes.find((item) => item.id === unit.laneId);
    const laneCenter = lane?.centerX ?? unit.x - unit.slotOffsetX;
    const targetBearing = Math.atan2(target.y - unit.y, target.x - unit.x);
    if (definition.broadside) {
      const broadsideOffset = Math.min(standoff * 0.88, (lane?.width ?? standoff * 2) * 0.32);
      const forwardOffset = Math.sqrt(Math.max(0, standoff ** 2 - broadsideOffset ** 2));
      const broadsideSide = combatSlot?.broadsideSide ?? unit.broadsideSide;
      return {
        x: laneCenter + broadsideSide * broadsideOffset,
        y: target.y - direction * (forwardOffset + (combatSlot?.broadsideDepth ?? combatDepth)),
        heading: targetBearing + broadsideSide * direction * Math.PI / 2,
      };
    }
    const distance = Math.hypot(target.x - unit.x, target.y - unit.y);
    if (distance < standoff * 0.72) {
      const breakDistance = Math.min(36, Math.max(14, (standoff - distance) * 0.58));
      return {
        x: clamp(laneCenter + combatLateral + (combatSlot?.broadsideSide ?? unit.broadsideSide) * breakDistance, laneCenter - (lane?.width ?? 160) * 0.38, laneCenter + (lane?.width ?? 160) * 0.38),
        y: unit.y,
        heading: targetBearing,
        preventReverseHeading: targetBearing,
      };
    }
    return {
      x: laneCenter + combatLateral,
      y: target.y - direction * (standoff + combatDepth),
      heading: targetBearing,
      preventReverseHeading: targetBearing,
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
    desiredVx += destination.separationVx ?? 0;
    if (Number.isFinite(destination.preventReverseHeading)) {
      const forwardX = Math.cos(destination.preventReverseHeading);
      const forwardY = Math.sin(destination.preventReverseHeading);
      const reverseComponent = desiredVx * forwardX + desiredVy * forwardY;
      if (reverseComponent < 0) {
        desiredVx -= forwardX * reverseComponent;
        desiredVy -= forwardY * reverseComponent;
      }
    }
    const desired = vectorLimit(desiredVx, desiredVy, speedLimit);
    const velocityChange = vectorLimit(desired.x - unit.vx, desired.y - unit.vy, definition.acceleration * dt);
    unit.vx += velocityChange.x;
    unit.vy += velocityChange.y;
    if (Number.isFinite(destination.preventReverseHeading)) {
      const forwardX = Math.cos(destination.preventReverseHeading);
      const forwardY = Math.sin(destination.preventReverseHeading);
      const reverseComponent = unit.vx * forwardX + unit.vy * forwardY;
      if (reverseComponent < 0) {
        unit.vx -= forwardX * reverseComponent;
        unit.vy -= forwardY * reverseComponent;
      }
    }
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
    const requestedShots = (definition.salvoCount ?? 1) + (this.economy?.salvoBonus(owner.team, owner.unitType) ?? 0);
    const availableShots = Math.min(
      requestedShots,
      this.config.caps.projectilesPerLaneTeam - laneTeamProjectiles,
      this.config.caps.projectiles - this.state.projectiles.size,
    );
    if (availableShots <= 0) {
      emitSimulationEvent(this.state, {
        type: "projectile_rejected",
        ownerId: owner.id,
        team: owner.team,
        laneId,
        reason: laneTeamProjectiles >= this.config.caps.projectilesPerLaneTeam ? "lane_team_budget" : "global_safety_budget",
      });
      return;
    }
    const projectileDefinition = PROJECTILE_DEFINITIONS[definition.projectileId];
    const ownerPosition = positions?.get(owner.id) ?? owner;
    const targetPosition = positions?.get(target.id) ?? target;
    const aimPosition = projectileDefinition.homing
      ? targetPosition
      : interceptPoint(ownerPosition, targetPosition, projectileDefinition.speed, projectileDefinition.lifetime);
    const dx = aimPosition.x - ownerPosition.x;
    const dy = aimPosition.y - ownerPosition.y;
    const magnitude = Math.hypot(dx, dy) || 1;
    const firingAngle = Math.atan2(dy, dx);
    const hardpointAxis = definition.broadside && Number.isFinite(owner.heading) ? owner.heading : firingAngle + Math.PI / 2;
    const muzzleOffset = definition.muzzleOffset ?? (owner.structureType === "turret" ? 25 : 0);
    const totalDamage = this.damageFor(owner, definition) * this.damageMultiplier(owner, target)
      * (this.economy?.salvoDamageMultiplier(owner.team, owner.unitType) ?? 1);
    for (let index = 0; index < availableShots; index += 1) {
      const mirroredIndex = owner.team === TEAM.ENEMY ? requestedShots - 1 - index : index;
      const salvoOffset = mirroredIndex - (requestedShots - 1) / 2;
      const hardpointOffset = salvoOffset * (definition.hardpointSpacing ?? 0);
      const muzzleX = ownerPosition.x + Math.cos(firingAngle) * muzzleOffset + Math.cos(hardpointAxis) * hardpointOffset;
      const muzzleY = ownerPosition.y + Math.sin(firingAngle) * muzzleOffset + Math.sin(hardpointAxis) * hardpointOffset;
      const projectileAngle = firingAngle + salvoOffset * (definition.salvoSpread ?? 0);
      const launchDelay = index * (definition.salvoInterval ?? 0);
      const projectile = createProjectile({
        id: this.state.ids.next(), ownerId: owner.id, ownerTeam: owner.team, laneId,
        projectileType: projectileDefinition.id, x: muzzleX, y: muzzleY,
        vx: Math.cos(projectileAngle) * projectileDefinition.speed, vy: Math.sin(projectileAngle) * projectileDefinition.speed,
        damage: totalDamage / requestedShots, targetId: target.id, launchDelay, hardpointIndex: mirroredIndex, salvoCount: requestedShots,
      });
      projectile.remainingLife = projectileDefinition.lifetime;
      addProjectileToState(this.state, projectile);
      if (launchDelay === 0) this.emitShot(projectile);
    }
    if (availableShots < requestedShots) {
      emitSimulationEvent(this.state, {
        type: "projectile_rejected", ownerId: owner.id, team: owner.team, laneId,
        reason: "partial_salvo_budget", rejectedCount: requestedShots - availableShots,
      });
    }
    owner.fireCooldown = definition.fireInterval * (owner.unitType && this.economy ? this.economy.fireIntervalMultiplier(owner.team) : 1);
    owner.lastShotAt = this.state.time;
  }

  emitShot(projectile) {
    emitSimulationEvent(this.state, {
      type: "shot", ownerId: projectile.ownerId, targetId: projectile.targetId, projectileType: projectile.projectileType,
      x: projectile.x, y: projectile.y, team: projectile.ownerTeam, laneId: projectile.laneId,
      hardpointIndex: projectile.hardpointIndex, salvoCount: projectile.salvoCount,
    });
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
      const waitingToLaunch = projectile.age < 0;
      projectile.age += dt;
      if (projectile.age < 0) continue;
      if (waitingToLaunch) this.emitShot(projectile);
      projectile.previousX = projectile.x;
      projectile.previousY = projectile.y;
      projectile.trail.push({ x: projectile.x, y: projectile.y });
      const trailLimit = PROJECTILE_TRAIL_LIMIT[projectile.projectileType] ?? 10;
      if (projectile.trail.length > trailLimit) projectile.trail.shift();
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
        damageEvents.push({
          projectileId: projectile.id, projectileType: projectile.projectileType, targetId: target.id,
          damage: projectile.damage, ownerTeam: projectile.ownerTeam, laneId: projectile.laneId,
          impactX: projectile.x, impactY: projectile.y, incomingVx: projectile.vx, incomingVy: projectile.vy,
        });
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
      const availableShield = target.structureType ? 0 : target.shield ?? 0;
      const absorbedDamage = Math.min(availableShield, event.damage);
      const hullDamage = event.damage - absorbedDamage;
      if (absorbedDamage > 0) {
        target.shield = Math.max(0, target.shield - absorbedDamage);
        target.lastShieldHitAt = this.state.time;
        const fallbackImpactAngle = Math.atan2(-(event.incomingVy ?? 0), -(event.incomingVx ?? 1));
        target.lastShieldImpactAngle = Number.isFinite(event.impactX) && Number.isFinite(event.impactY)
          ? Math.atan2(event.impactY - target.y, event.impactX - target.x)
          : fallbackImpactAngle;
      }
      if (hullDamage > 0) {
        target.hp = Math.max(0, target.hp - hullDamage);
        target.lastDamagedAt = this.state.time;
      }
      emitSimulationEvent(this.state, {
        type: "hit", ...event, x: target.x, y: target.y, team: target.team,
        entityType: target.structureType ?? target.unitType, hpRatio: target.hp / target.maxHp,
        shieldRatio: target.maxShield > 0 ? target.shield / target.maxShield : 0,
        absorbedDamage, hullDamage, shielded: absorbedDamage > 0,
      });
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
      shield: Math.round((item.shield ?? 0) * 1000) / 1000,
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
