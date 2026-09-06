# Strategy Galalaxy – Architecture Contract

## Purpose

This document defines the implementation boundaries for the first playable Strategy Galalaxy match. It translates `GAME_DESIGN.md` into a small, deterministic, testable Canvas game architecture.

The architecture is intentionally optimized for the Vertical Slice. It supports later maps, factions, Battlecruisers, and Dreadnoughts through data, without implementing broad content systems now.

## Technical baseline

- Static HTML5 Canvas application.
- Native JavaScript ES modules.
- `420 × 760` logical design space as the initial baseline.
- One render loop driven by `requestAnimationFrame`.
- Fixed-step combat simulation at `60 Hz`.
- Variable-rate rendering with interpolation optional, not required for the first slice.
- No runtime framework required.
- Development dependencies may be introduced only for repeatable QA, linting, or browser automation.

The final display name comes from application configuration. Modules and storage keys use the stable repository/product identifier `strategy-galalaxy`.

## Dependency direction

```text
configuration/data
        ↓
domain state and entities
        ↓
simulation systems
        ↓
match orchestration
        ↓
read-only render/UI projection

input → validated commands → simulation state
AI    → validated commands → simulation state
```

Rules:

- Data modules do not import entities, systems, rendering, UI, or browser APIs.
- Domain entities do not import rendering or input.
- Simulation systems do not draw and do not read DOM state.
- Input and AI submit commands through the same command service.
- Rendering may read current state but never mutate it.
- UI rendering does not directly change Energy, waves, upgrades, or entities.
- The game shell owns browser lifecycle, assets, clocks, input, and render scheduling.
- The `MatchDirector` owns legal phase transitions, not every subsystem's data.

## Proposed project structure

Names may be refined during implementation while preserving these boundaries.

```text
src/
  main.js
  game.js
  config.js
  assets.js

  core/
    constants.js
    clock.js
    rng.js
    ids.js

  data/
    units.js
    factions.js
    maps.js
    upgrades.js
    projectiles.js

  state/
    createMatchState.js
    selectors.js

  entities/
    unit.js
    structure.js
    projectile.js
    captureNode.js
    particle.js

  systems/
    matchDirector.js
    commandSystem.js
    waveSystem.js
    economySystem.js
    targetingSystem.js
    movementSystem.js
    combatSystem.js
    projectileSystem.js
    captureSystem.js
    aiSystem.js
    cleanupSystem.js

  rendering/
    renderer.js
    battlefieldRenderer.js
    uiRenderer.js
    assetLoader.js
    spriteRenderer.js
    text.js

  ui/
    inputRouter.js
    commandPhaseUI.js
    battlePhaseUI.js

  audio/
    soundSystem.js

  fx/
    fxSystem.js

  qa/
    matchTestMode.js
    debugOverlay.js

scripts/
tests/
docs/
```

Small systems may begin as pure functions in fewer files. They should split only when responsibilities or tests justify it.

## Stable constants

### Teams

```js
export const TEAM_PLAYER = "player";
export const TEAM_ENEMY = "enemy";
export const TEAMS = Object.freeze([TEAM_PLAYER, TEAM_ENEMY]);
```

Gameplay checks use equality between team constants. They do not use entity class, asset prefix, or screen position to infer allegiance.

### Lanes

```js
export const LANE_LEFT = "left";
export const LANE_RIGHT = "right";
export const LANES = Object.freeze([LANE_LEFT, LANE_RIGHT]);
```

The simulation accepts lane IDs from map data. It must not depend on array index `0` meaning left in public commands or serialized debug output.

### Match states

```js
export const MATCH_STATE = Object.freeze({
  LOADING: "loading",
  TITLE: "title",
  COMMAND: "command",
  BATTLE: "battle",
  VICTORY: "victory",
  DEFEAT: "defeat",
  PAUSED: "paused",
});
```

## State machine

```text
LOADING ──ready──────→ TITLE
TITLE ───start───────→ COMMAND
COMMAND ─deploy/time→ BATTLE
BATTLE ───time───────→ COMMAND
BATTLE ─enemy HQ 0──→ VICTORY
BATTLE ─player HQ 0─→ DEFEAT
COMMAND/BATTLE ─────→ PAUSED
PAUSED ─resume──────→ previous COMMAND/BATTLE state
VICTORY/DEFEAT ─restart→ COMMAND with a new match state
```

`PAUSED` stores `resumeState`. Loading and terminal states do not resume into combat. Visibility loss pauses an active Command or Battle state and freezes simulation; an optional finite Command timer is frozen when a test configuration enables one.

State transition methods are centralized in `MatchDirector`. Tests may use explicit QA hooks rather than assigning arbitrary state strings.

## Time model

Four time concepts remain separate.

| Clock | Advances in | Purpose |
| --- | --- | --- |
| `frameTime` | foreground animation frames | presentation animation and FPS measurement |
| `phaseElapsed` | `COMMAND` or `BATTLE` | active Battle duration, or optional Command timer in test configurations |
| `simulationTime` | fixed steps in `BATTLE` only | cooldowns, projectiles, movement, capture, combat |
| `battleElapsed` | fixed steps in `BATTLE` only | economy escalation and match telemetry |

### Fixed-step loop

```text
read wall-clock delta
clamp frame delta
advance presentation clock
process input intents
advance optional Command phase timer when configured, otherwise wait for explicit deploy
accumulate Battle delta when in BATTLE
run zero or more 1/60-second simulation steps
render current state
```

Implementation constraints:

- `SIMULATION_STEP = 1 / 60` lives in configuration.
- Battle phase duration is measured in completed simulation steps.
- Command duration uses foreground phase time because combat is intentionally frozen while the decision timer runs.
- `PAUSED`, hidden, terminal, and loading states advance neither Battle duration nor simulation; optional test timers also freeze.
- The per-frame catch-up count is capped to prevent a spiral of death.
- If the cap is reached, excess accumulated wall time is discarded and recorded in debug metrics.
- The accumulator resets when starting a new match and after a long interruption.
- QA may drive simulation steps directly without `requestAnimationFrame`.

Presentation-only animation may use `frameTime`. Gameplay logic may never use it.

## Determinism and random sources

Every match receives an explicit 32-bit seed. If none is supplied, the game shell creates one once at match start and displays it in debug mode.

### Simulation RNG

A small deterministic generator exposes methods such as:

```js
rng.nextFloat();
rng.nextInt(maxExclusive);
rng.pick(items);
```

Simulation RNG controls:

- AI tie-breaks and bounded variation
- formation selection/slot variation
- any future gameplay-critical random choice

### Visual RNG

Star positions, particle jitter, shake, and other non-gameplay effects use a separate visual RNG or nondeterministic source. Visual calls cannot consume the simulation RNG sequence.

### Deterministic ordering

- Entity IDs are monotonic within one match.
- Lane and team iteration follows fixed constant order.
- Target tie-breaks end with stable entity ID.
- Commands carry an insertion sequence.
- Damage events are resolved in deterministic order.
- Object iteration order is never used as an unstated gameplay tie-break.

QA records seed, configuration version, and relevant command sequence. A failure can be rerun with the same seed and commands.

## Configuration ownership

`src/config.js` contains runtime-level constants and imports immutable definitions from `src/data/`.

Example shape:

```js
export const CONFIG = Object.freeze({
  app: {
    id: "strategy-galalaxy",
    displayName: "Strategy Galalaxy",
  },
  viewport: {
    designWidth: 420,
    designHeight: 760,
    maxDesktopDpr: 2,
    maxMobileDpr: 1.5,
  },
  timing: {
    fixedStep: 1 / 60,
    maxFrameDelta: 0.1,
    maxCatchUpSteps: 6,
    commandDuration: 8,
    battleDuration: 22,
  },
  limits: {
    unitsPerLanePerTeam: 48,
    projectilesPerLanePerTeam: 96,
    particles: 160,
  },
});
```

Exact caps are validated during stress testing. Changing a balance value should not require editing entity or system code.

## Data contracts

All definitions are immutable after startup. Runtime objects copy only mutable values they own.

### Unit definition

```js
export const UNIT_DEFINITIONS = Object.freeze({
  scout: Object.freeze({
    id: "scout",
    cost: 50,
    role: "light",
    maxHp: 40,
    speed: 110,
    collisionRadius: 10,
    attackRange: 96,
    aggroRange: 132,
    targetLeash: 165,
    damage: 6,
    fireInterval: 0.8,
    projectileId: "light_bolt",
    targetPreference: "nearest",
  }),
});
```

Unit definitions contain gameplay values only. They do not contain a team, screen position, mutable HP, or direct asset path.

### Faction definition

```js
export const FACTIONS = Object.freeze({
  nairan: Object.freeze({
    id: "nairan",
    palette: Object.freeze({ primary: "#70c8bd", accent: "#b8a4ef" }),
    units: Object.freeze({
      scout: Object.freeze({ base: "nairanScout", engine: "nairanScoutEngine" }),
      fighter: Object.freeze({ base: "nairanFighter", engine: "nairanFighterEngine" }),
    }),
  }),
});
```

Faction definitions map semantic asset keys and animation metadata. They do not change V1 combat stats.

### Projectile definition

```js
export const PROJECTILE_DEFINITIONS = Object.freeze({
  light_bolt: Object.freeze({
    id: "light_bolt",
    speed: 300,
    lifetime: 1.2,
    hitRadius: 4,
    behavior: "straight",
    turnRate: 0,
    piercing: false,
  }),
});
```

Visual projectile profiles are resolved from faction/team plus projectile ID. Damage belongs to the firing Unit/Structure definition unless a weapon definition later warrants separation.

### Map definition

```js
export const MAPS = Object.freeze({
  classic_lanes: Object.freeze({
    id: "classic_lanes",
    bounds: Object.freeze({ x: 0, y: 0, width: 420, height: 760 }),
    lanes: Object.freeze([
      Object.freeze({
        id: "left",
        centerX: 132,
        width: 118,
        node: Object.freeze({ x: 132, y: 380, radius: 44 }),
        playerSpawn: Object.freeze({ x: 132, y: 650 }),
        enemySpawn: Object.freeze({ x: 132, y: 110 }),
      }),
      Object.freeze({
        id: "right",
        centerX: 288,
        width: 118,
        node: Object.freeze({ x: 288, y: 380, radius: 44 }),
        playerSpawn: Object.freeze({ x: 288, y: 650 }),
        enemySpawn: Object.freeze({ x: 288, y: 110 }),
      }),
    ]),
    structures: Object.freeze([]),
  }),
});
```

Coordinates above are illustrative until Foundation layout validation. Structure definitions specify HQ and Defense Station positions, ranges, stats, and lane association.

### Upgrade definition

```js
export const UPGRADE_DEFINITIONS = Object.freeze({
  economy: Object.freeze({
    id: "economy",
    baseCost: 240,
    costGrowth: 1.75,
    baseIncomeMultiplierPerLevel: 0.2,
  }),
  turret: Object.freeze({
    id: "turret",
    baseCost: 180,
    costGrowth: 1.65,
    damageMultiplierPerLevel: 0.2,
  }),
});
```

Cost calculation is owned by `EconomySystem`; effects are read by Economy and Combat selectors.

### Balance definition

```js
export const MATCH_BALANCE = Object.freeze({
  startingEnergy: 300,
  baseIncomePerSecond: 20,
  nodeIncomePerSecond: 10,
  baseWave: Object.freeze({ scout: 2 }),
  escalation: Object.freeze([
    Object.freeze({ fromBattleSeconds: 0, multiplier: 1 }),
    Object.freeze({ fromBattleSeconds: 120, multiplier: 1.5 }),
    Object.freeze({ fromBattleSeconds: 240, multiplier: 2 }),
    Object.freeze({ fromBattleSeconds: 360, multiplier: 3 }),
  ]),
});
```

## Runtime match state

One match state contains mutable gameplay data. A representative shape is:

```js
{
  id,
  seed,
  state,
  resumeState,
  phaseElapsed,
  simulationTime,
  battleElapsed,
  cycle,
  winner,
  mapId,
  teams: {
    player: {
      factionId,
      energy,
      incomePerSecond,
      upgrades: { economy: 0, turret: 0 },
      queues: { left: [], right: [] },
      lastDecision: null,
    },
    enemy: { /* same shape */ },
  },
  lanes: {
    left: {
      unitsByTeam: { player: [], enemy: [] },
      projectilesByTeam: { player: [], enemy: [] },
      structureIdsByTeam: { player: null, enemy: null },
      nodeId: null,
    },
    right: { /* same shape */ },
  },
  units: Map,
  structures: Map,
  projectiles: Map,
  nodes: Map,
  effects: [],
  events: [],
}
```

Maps provide authoritative lookup by ID. Lane arrays provide fast, bounded iteration. Creation and cleanup update both views through one state-owned registry API so they cannot drift.

Runtime state is not serialized for product saves in V1. QA may export a diagnostic snapshot containing plain objects and arrays.

## Entity contracts

### Unit

```js
{
  id,
  team,
  laneId,
  unitType,
  x, y,
  slotOffsetX,
  hp, maxHp,
  fireCooldown,
  targetId,
  state,
  alive,
  spawnCycle,
}
```

A Unit references immutable values through `unitType`. Temporary calculated values may be cached only if invalidation is explicit.

### Structure

```js
{
  id,
  team,
  laneId,       // null for shared HQ
  structureType, // hq | turret
  x, y,
  hp, maxHp,
  fireCooldown,
  targetId,
  alive,
}
```

Destroyed structures remain registered for match history/rendering state but are removed from targetable collections.

### Projectile

```js
{
  id,
  ownerId,
  ownerTeam,
  laneId,
  projectileType,
  x, y,
  vx, vy,
  damage,
  remainingLife,
  targetId,
  hitTargetIds,
  alive,
}
```

`ownerTeam` is authoritative for friendly-fire checks. Projectiles never infer ownership from direction or color.

### Capture Node

```js
{
  id,
  laneId,
  x, y,
  radius,
  progress, // -100..100
  ownerTeam, // player | enemy | null
  contested,
}
```

### Wave queue entry

```js
{
  id,
  unitType,
  paidCost,
  source, // purchased | base
  sequence,
}
```

The queue stores no live Unit instance. Deployment creates Units at the next Battle boundary.

## Command API

All player and AI planning uses validated commands.

```js
{ type: "QUEUE_UNIT", team, laneId, unitType }
{ type: "REMOVE_QUEUED_UNIT", team, laneId, queueEntryId }
{ type: "BUY_UPGRADE", team, upgradeId }
{ type: "CONFIRM_DEPLOY", team }
{ type: "PAUSE" }
{ type: "RESUME" }
{ type: "RESTART", seed? }
```

`CommandSystem` validates:

- legal match phase
- valid team/lane/unit/upgrade ID
- sufficient exact Energy
- projected lane capacity after mandatory base-wave entries
- ownership of the queue entry
- upgrade-specific conditions

Valid `QUEUE_UNIT` commands deduct Energy and store `paidCost`. Valid removal commands refund exactly `paidCost`. Invalid commands return a structured reason and leave state unchanged.

UI-only lane selection does not enter simulation state unless needed for QA. It is a presentation concern.

The AI does not receive privileged mutation access. It creates the same command objects and receives the same validation results.

## System responsibilities

### Game shell

Owns:

- browser startup and shutdown lifecycle
- Canvas/context and viewport scaling
- `requestAnimationFrame`
- fixed-step accumulator
- Asset Loader
- input router and audio unlock
- current Match instance
- Renderer
- debug/test-mode activation

It does not implement combat, capture, purchases, or AI policy.

### MatchDirector

Owns:

- current match state and legal transitions
- Command/Battle timers
- deployment cycle number
- total active Battle time
- simultaneous wave deployment boundary
- escalation stage selection
- victory/defeat transition
- pause/resume destination
- new-match/restart orchestration

It calls systems in a documented order and emits phase/result events. It does not render UI or calculate target choice itself.

### CommandSystem

Owns:

- validation and execution of command objects
- purchase reservation/refund
- upgrade purchases
- player/AI confirmation flags
- structured rejection reasons

### WaveSystem

Owns:

- free base queue construction
- paid queue entries
- deterministic formation slot assignment
- simultaneous creation of Player and Enemy units
- per-lane/team capacity handling

Mandatory free base-wave entries receive capacity before paid queue entries. If a lane has no projected paid slot, `QUEUE_UNIT` is rejected before Energy is deducted. A free entry that cannot fit under the hard safety cap remains in an explicit base-wave backlog and is retried at the next deployment boundary. The initial cap and anti-stall balance must make backlog exceptional in normal play.

### EconomySystem

Owns:

- Energy balance changes
- exact income formula
- upgrade cost calculation
- controlled Node count
- income multiplier from Battle elapsed time
- purchase affordability queries

Only Battle fixed steps generate income.

### TargetingSystem

Owns:

- validation/retention of current targets
- lane-local unit queries
- next structure target
- role preference and stable tie-breaks
- target leash rules

It does not move or damage entities.

### MovementSystem

Owns:

- forward lane movement
- stop distance and attack-range positioning
- bounded lateral formation/avoidance offsets
- lane clamping and rear chase leash
- state changes caused by movement context

No general navigation graph is required for `classic_lanes`.

### CombatSystem

Owns:

- weapon cooldown updates
- firing eligibility and intent
- structure auto-fire
- staged damage events
- HP/shield application when present
- death marking and match-critical damage events

It requests Projectile creation through `ProjectileSystem` and visual/audio feedback through events.

### ProjectileSystem

Owns:

- creation subject to lane/team budgets
- straight/homing/accelerating movement
- remaining lifetime
- lane-local collision checks
- piercing and previously-hit tracking
- impact events and cleanup marking

### CaptureSystem

Owns:

- counting living team presence in each Node radius
- contested state
- capture progress and neutralization
- ownership transitions
- Node capture/loss events

### AISystem

Owns:

- read-only assessment of both lanes
- deterministic planning during Command Phase
- budget/saving targets
- command generation through `CommandSystem`
- a concise last-decision explanation for debug UI

It never mutates Units, Energy, queues, or upgrades directly.

### CleanupSystem

Owns:

- removal of dead/expired IDs from active lane collections
- release/recycling of expired projectiles/effects
- preservation of living units and valid projectiles across phase boundaries
- invariant checks in debug/test builds

It is not called as an arena reset between cycles.

### FX and Sound systems

Consume semantic events such as:

```text
PROJECTILE_FIRED
UNIT_HIT
UNIT_DESTROYED
STRUCTURE_HIT
STRUCTURE_DESTROYED
NODE_NEUTRALIZED
NODE_CAPTURED
WAVE_DEPLOYED
MATCH_ENDED
```

They cannot feed results back into combat. Missing/disabled effects never change gameplay.

## Fixed-step update order

Each Battle step uses this order:

1. Advance `simulationTime`, `battleElapsed`, and Battle phase time.
2. Apply Economy income for both teams.
3. Validate or acquire targets.
4. Update Unit movement and combat state.
5. Advance weapon cooldowns and emit firing intents.
6. Create and update Projectiles.
7. Detect impacts and stage damage events.
8. Apply damage in deterministic event order; mark deaths.
9. Update Node presence, contesting, and capture.
10. Resolve HQ victory/defeat.
11. Clean active collections and emit semantic events.
12. If the Battle duration ended and no terminal state exists, enter Command Phase.

This order is a contract for reproducible QA. Changes require corresponding test and documentation updates.

## Simultaneous deployment

At the Command → Battle transition:

1. CommandSystem stops accepting purchases.
2. Both team queues are finalized.
3. Free base entries are added through the same WaveSystem.
4. Capacity and any free base-wave backlog are resolved before any unit is created; all previously accepted paid entries are guaranteed a slot.
5. Formation slots are generated deterministically for both teams.
6. Both team/lane waves are instantiated within the same transition.
7. Deployed entries and confirmation flags reset; only deferred free entries may remain in the base-wave backlog.
8. Cycle count advances and Battle time begins at zero.

No team receives a simulation step before the other has deployed.

## Targeting and structure access

Each lane maintains active units split by team. Target lookup never scans the other lane.

An attacking Unit follows this structure chain:

```text
hostile lane units in valid aggro/leash range
    ↓ none
hostile Defense Station for this lane, if alive
    ↓ destroyed
hostile HQ
```

The HQ belongs to the team rather than one lane but may be referenced from both lane target chains. A living turret on the opposite lane does not protect the HQ from a lane whose own turret has fallen.

## Event model

Systems append small semantic event records to a per-step event buffer. Events contain IDs and values, not entity methods.

```js
{
  type: "UNIT_DESTROYED",
  entityId,
  team,
  laneId,
  x,
  y,
  sourceId,
  step,
}
```

Gameplay systems may consume match-critical events during the same fixed step. Rendering, audio, telemetry, and debug consumers read events after simulation and cannot mutate the source state.

The buffer is cleared after consumers finish. Long-term telemetry stores aggregates, not the unbounded event stream.

## Rendering contract

The Renderer receives:

- Canvas context and viewport transform
- read-only match state/selectors
- asset resolver
- presentation time
- recent semantic events/FX state
- debug flags

Layer order:

1. space background
2. lane guides and battlefield zones
3. Energy Nodes and capture visualization
4. structures
5. units and engine layers
6. projectiles
7. impacts, destruction, shields, and short FX
8. health bars and battlefield indicators
9. phase-specific UI
10. pause/result/debug overlays

Rendering may cache layout or sprite information. It must not move stars, alter cooldowns, remove dead entities, or perform purchases.

To avoid deep-clone allocations each frame, “read-only” is enforced by module ownership and tests rather than cloning the entire state. Debug builds may freeze configuration and selected snapshots.

## UI and input boundary

`InputRouter` converts Pointer Events and keys into design-space input events. Phase-specific UI controllers interpret those events against layout hit zones and create commands.

```text
PointerEvent
  → design-space point
  → CommandPhaseUI hit-test
  → QUEUE_UNIT command
  → CommandSystem validation
  → result message
  → next render
```

The Battle UI exposes no unit-control command. Pause, mute, fullscreen, and debug controls are shell commands, not combat commands.

All hit zones are defined in design space, respect top/bottom safe areas, and are testable without reading rendered pixels.

## Asset boundary and provenance

Assets are addressed through semantic keys:

```js
assetLoader.get("nairan.scout.base")
```

Entities and gameplay definitions never contain file-system paths. Faction/visual definitions resolve unit type to semantic keys and animation metadata.

Based on the reference audit:

- adapt the staged Asset Loader and manifest grouping
- curate Nairan and Kla'ed runtime files only
- preserve explicit sprite frame/FPS/release metadata
- copy applicable Foozle CC0 notice with selected assets
- record each copied group in `SOURCE_PROVENANCE.md`
- exclude `track1.ogg` until its source/license is documented
- keep HQ, turret, and Node placeholders replaceable by asset key

## Reference reuse map

| Strategy Galalaxy area | Galalaxy source | Treatment |
| --- | --- | --- |
| browser/Canvas bootstrap | `index.html`, `src/main.js` | adapt viewport and module bootstrap |
| viewport scaling | `src/game.js#resize` | adapt `visualViewport`, DPR cap, letterboxing, safe areas |
| assets | `src/assetLoader.js`, `src/assets.js` | adapt loader and build a curated manifest |
| helpers | `src/utils.js`, `src/rendering/text.js` | selectively reuse generic functions |
| input | `src/input.js` | retain pointer lifecycle/coordinate mapping; remove steering |
| projectiles | `src/entities/projectile.js`, `src/data/projectiles.js` | generalize team/lane ownership and targeting |
| visual metadata | `src/data/enemyVisuals.js` | normalize faction/class mappings |
| particles and FX | `src/entities/particle.js`, `src/systems/fx.js` | adapt team colors and allocation/cap behavior |
| sound | `src/systems/soundSystem.js` | adapt unlock, mute, throttling, cleanup |
| QA | `src/qa/fullRunTest.js`, `scripts/*.mjs` | reproduce approach for match phases and viewports |
| local storage | `src/saveSystem.js`, `src/runStats.js` | reuse defensive wrapper and bounded-telemetry concept |

The old `Player`, `Enemy`, Sector, XP pickup, survivor upgrades, HUD, and menus do not become the new domain architecture.

Every concrete copied file or asset must be added to `SOURCE_PROVENANCE.md` with the audited source commit.

## Error and invariant handling

Production behavior should fail safely; debug/test behavior should fail loudly.

Core invariants:

- every live Unit belongs to one valid team and one valid lane
- every Projectile has a valid owner team and lane
- active lane IDs resolve to registered live entities
- a queue entry belongs to exactly one team/lane queue
- Energy never becomes negative through a validated command
- capture progress remains within `[-100, 100]`
- a destroyed structure is never targetable or firing
- only Battle steps change gameplay entities, capture, income, or cooldowns
- rendering leaves a gameplay-state checksum unchanged in deterministic tests
- AI uses only public validated commands

Invalid data definitions block startup with a useful error. Runtime commands return structured errors such as `WRONG_PHASE`, `INSUFFICIENT_ENERGY`, `INVALID_LANE`, or `QUEUE_FULL`.

## Capacity policy

Caps protect mobile performance but must not create hidden unfairness.

- Unit caps are defined per lane and team.
- Projectile budgets are defined per lane and team or admitted through a deterministic fair-share policy.
- FX caps are global presentation limits and may drop the least important/newest effect without gameplay impact.
- Mandatory base-wave capacity is reserved before new paid queue entries are accepted.
- A paid unit that cannot fit is rejected before purchase and is never silently discarded.
- Free base-wave overflow enters a visible/debuggable deterministic backlog and retains its original cycle/sequence.
- Debug overlay reports cap pressure and dropped presentation effects.

Exact values are tuned after a stress fixture exists.

## QA architecture

### Headless checks

Pure simulation tests construct definitions and Match state without Canvas, DOM, audio, or loaded images. They drive exact fixed steps and commands.

Primary checks:

- state-machine transitions
- Command freeze
- Battle clock and phase duration
- purchase/refund accounting
- simultaneous wave creation
- lane-local targeting
- deterministic result from seed + command sequence
- survivor/projectile persistence between cycles
- Node capture and income
- upgrades
- AI affordability
- structure death and match result
- restart isolation

### Browser checks

Browser automation covers:

- load without JS/page/resource errors
- title → match → result → restart
- touch and mouse command controls
- viewport and safe-area matrix
- Canvas containment and no scrolling
- asset loading/fallback behavior
- phase UI visibility
- screenshots of Command, Battle, Victory, and Defeat

### Test modes

- `?debug=1`: human-readable overlay and invariant counters.
- `?test=match`: accelerated deterministic full-match scenario.
- Optional parameters: `seed`, `speed`, and focused scenario IDs.

Acceleration changes how many fixed steps are processed per frame. It does not enlarge `dt` or alter system order.

## Performance strategy

- Lane-local arrays bound target and collision work.
- Squared distances avoid unnecessary square roots in comparisons.
- Targets remain stable instead of being reacquired every frame.
- Dead collections compact at controlled points.
- Object pooling begins with Projectiles/Particles only if profiling shows allocation pressure.
- Mobile DPR and expensive compositing are capped as in Galalaxy.
- Effects have short lifetimes and bounded counts.
- Rendering uses preloaded sprite strips and explicit frame metadata.
- Debug builds track update duration, render duration, entity counts, and cap pressure.

Optimization decisions follow measurements from the stress scenario. The architecture avoids known global quadratic work without introducing a complex spatial index prematurely.

## Planned implementation sequence

1. Application shell, Canvas, viewport transform, clocks, and empty state machine.
2. Immutable configuration/data validation and deterministic RNG/IDs.
3. Asset Loader plus fallback renderer.
4. Match state factory, map, teams, structures, and lane registries.
5. Unit, targeting, movement, projectile, combat, and cleanup systems.
6. MatchDirector cycles and simultaneous Wave deployment.
7. Economy, Nodes, upgrades, and escalation.
8. AI through the public command API.
9. Command/Battle UI and input routing.
10. Curated assets, FX, audio, QA, performance, and balancing.

This sequence follows `ROADMAP.md`. Architecture work should not pull later content into an earlier bulk.

## Deferred extension points

The first implementation leaves room for:

- additional map definitions
- Battlecruiser and Dreadnought enablement through data
- new visual factions
- additional unit target preferences
- richer structure types
- stronger base-wave escalation
- bounded AI difficulty profiles

It does not create empty frameworks for multiplayer, accounts, deckbuilding, meta-progression, shops, or campaign systems.

## Architecture acceptance

Before Foundation coding begins, this contract is complete when:

- Match states and legal transitions are explicit.
- Team, lane, entity, queue, map, unit, faction, projectile, upgrade, and balance data shapes are defined.
- Time and deterministic RNG rules are explicit.
- Input/AI command validation shares one boundary.
- Simulation system ownership and fixed-step order are explicit.
- Rendering is read-only and browser concerns remain in the shell.
- Galalaxy reuse and exclusions match the reference audit.
- QA can drive the simulation without Canvas.
- No binding product rule from `GAME_DESIGN.md` requires an architectural exception.
