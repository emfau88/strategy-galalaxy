# Strategy Galalaxy – Architecture Contract

## Scope and boundaries

Strategy Galalaxy is a dependency-light browser game using native ES modules and Canvas 2D. Simulation is deterministic and independent of rendering. Only this repository is writable; `emfau88/galalaxy` is a read-only code and asset reference.

The runtime never loads the complete development asset library. `src/assets.js` explicitly registers the curated boot, ship-layer and projectile manifests.

## Runtime state machine

```text
LOADING → TITLE → LIVE_MATCH → VICTORY
                   │    └────→ DEFEAT
                   ↓
                 PAUSED
                   │
                   └────────→ LIVE_MATCH
```

`LIVE_MATCH` is the only active simulation state. Pause freezes the fixed-step clock, combat, capture, economy and deployment timer together. Restart creates fresh systems and immediately deploys the first free base wave.

## Fixed-step timing

Rendering follows animation frames, but authoritative systems advance at `1/60 s` with bounded catch-up. The deployment timer is simulation time, not wall time.

- interval: 22 seconds;
- lock window: final 2 seconds;
- match start: immediate free deployment, then cycle countdown;
- boundary order: activate pending upgrades → deploy both teams atomically → begin the next timer → plan AI.

No visual animation frame triggers a projectile, hit or damage event.

## Ownership

| Module | Responsibility |
| --- | --- |
| `src/game.js` | Browser lifecycle, input routing, fixed-step orchestration, render model |
| `src/simulation/matchDirector.js` | State transitions and ordering between specialized systems |
| `src/simulation/deploymentDirector.js` | Timer, lock state, cycle, queues, free-wave backlog, simultaneous spawn and last-deployment timestamp for presentation |
| `src/simulation/commandSystem.js` | Public queue, removal and upgrade commands with validation |
| `src/simulation/economySystem.js` | Energy, income, escalation and pending upgrades |
| `src/simulation/battleSimulation.js` | Movement, formation separation, targeting, firing, projectile motion and damage |
| `src/simulation/captureSystem.js` | Additive Node strength, contesting and ownership |
| `src/simulation/opponentAi.js` | Deterministic, rule-bound planning through public commands |
| `src/rendering/battlefieldRenderer.js` | World, fleet layers, modular animated structures, projectile sprites and bounded trails |
| `src/rendering/presentationEffects.js` | Event-driven short-lived presentation effects |
| `src/rendering/uiRenderer.js` | HUD, queue and planning controls |
| `src/core/viewport.js` | Responsive portrait design height and input transforms |

## Deployment invariants

`DeploymentDirector` owns one queue per team and lane. Queue entries include a stable sequence, unit type, paid cost and source. The shared purchased count across both lanes may never exceed four.

Commands are accepted only in `LIVE_MATCH` and outside lock-in. Queue purchase deducts immediately; removal refunds exactly once. At a boundary, free and paid entries are evaluated in stable order against the per-lane/team unit cap. Spawned entries leave the queue; rejected capacity entries remain backlog. Existing units are untouched.

Both teams use the same path:

```text
input or AI intent
  → CommandSystem validation
  → authoritative queue/economy mutation
  → DeploymentDirector boundary
  → BattleSimulation spawnFormation
```

## Simulation invariants

- Units, structures, projectiles and Nodes live in `BattleState` maps with stable IDs.
- Units never change lanes.
- Updates and damage events use deterministic ordering.
- Projectile behavior is defined in `src/data/definitions.js`; art metadata is defined separately in `src/data/visuals.js`.
- Per-team/per-lane projectile budgets protect fairness; a global cap is a final memory guard.
- Trails keep only a bounded position history.
- Capture power is derived from living ships currently inside a Node.
- Destruction removes an entity from simulation independently of presentation lifetime.

## Asset architecture

The repository separates three asset tiers:

1. `assets/library/galalaxy/` – complete licensed Foozle source library and optional Galalaxy UI copied from audited reference commit `7f90d17a063967f9978e74f6519c450a2b0e4f85`;
2. normalized runtime aliases under `assets/factions/` and `assets/projectiles/`;
3. project-native environment and structure artwork.

The unlicensed/undocumented `assets/music/track1.ogg` reference file is excluded. Source lineage is recorded in `docs/SOURCE_PROVENANCE.md`.

`FleetVisualProfile` metadata declares frame size, frame count, FPS and weapon release frame. The renderer composes:

```text
engine → hull → weapon → shield hit → destruction/effects
```

Missing optional layers fall back safely to hull and Canvas effects. The asset verifier checks existence, PNG headers, strip dimensions and the expected library count.

## Responsive rendering and input

The logical width remains 420. Portrait design height expands to the viewport aspect ratio with a minimum of 760, so tall phones use their complete screen instead of centering a short fixed canvas. Rendering and pointer conversion share the same transform. The lower planning panel is anchored to the responsive bottom edge; world landmarks remain readable above it.

Device pixel ratio is capped, with a lower coarse-pointer target, to control decoded surface and fill cost. Fullscreen and resize rebuild the transform without mutating simulation state.

## Verification

`npm.cmd test` covers deterministic combat, mirrored geometry, lane isolation, role targeting, homing combat, projectile fairness, deployment timing, lock-in, refunds, pending upgrades, persistence, AI legality, capture and five portrait viewports.

`npm.cmd run check` adds source syntax checks and validates 55 registered runtime assets plus the 516-file licensed library.

`npm.cmd run test:stress` runs a dense four-lane-side combat fixture and enforces unit, projectile, trail and event-history bounds.

`npm.cmd run test:browser` drives a local Chromium browser through the DevTools protocol. It emulates all five target portrait viewports, asserts zero letterbox offsets, full Canvas dimensions, successful asset loading, touch access to the planning controls and no runtime/network errors. It also captures the 420×760 structures once during deployment and once with closed hangars plus severe damage. Screenshots are written only to ignored `tmp/browser-qa/` output.

`npm.cmd run balance:sim -- 100` runs rule-bound AI-vs-AI matches and reports wins, duration, deployment cycles, purchase mix, Node control, first turret loss and peak entity counts. A complete timeout set fails the command. Results are diagnostic balance evidence, not a substitute for real-phone playtests.
