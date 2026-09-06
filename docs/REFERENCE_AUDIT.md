# Galalaxy Reference Audit

## Audit scope

This document records the read-only audit of the Galalaxy reference repository before Strategy Galalaxy gameplay development begins.

| Field | Value |
| --- | --- |
| Reference repository | `https://github.com/emfau88/galalaxy.git` |
| Audited branch | `main` |
| Audited commit | `d2c3a7bd1d8b5657b27b39bd7ce9a6414c770739` |
| Commit summary | `Fix upgrade screen shake and ease Sector I opening` |
| Local reference | `.reference/galalaxy/` |
| Audit policy | Read-only; local push URL is disabled |

No source code or asset was copied during this audit.

## Executive decision

Galalaxy provides a strong rendering, asset, projectile, FX, mobile-scaling, and QA foundation. Its gameplay domain is not a suitable base class hierarchy for Strategy Galalaxy.

The new game should retain the proven browser/Canvas approach and selectively adapt small technical units. It should build a new simulation model around teams, lanes, structures, waves, economy, and match phases. Copying `Game`, `Player`, `Enemy`, `SectorSystem`, or the survivor upgrade loop wholesale would create exactly the player/enemy special cases and state coupling the new design must avoid.

The recommended reuse split is:

- **Reuse with small adaptation:** Canvas bootstrap, viewport scaling, safe-area handling, asset loader, asset grouping, sprite-strip metadata, drawing helpers, basic storage and synthesized sound wrapper.
- **Reuse after redesign:** Projectile behavior, particle/FX helpers, team ownership, collision handling, test-mode plumbing, formation shapes, and run telemetry concepts.
- **Use only as reference:** Player weapons, Enemy behavior, sector spawning, combat orchestration, upgrade cards, HUD, menus, abilities, and run progression.
- **Exclude from the new core:** manual movement, XP pickups, survivor level-ups, sector/boss progression, and player-centric collision logic.

## Current technical foundation

### Runtime and build

- Static HTML with native JavaScript modules.
- HTML5 Canvas is the only gameplay surface; there are no per-entity DOM nodes.
- No `package.json`, bundler, compilation step, or runtime dependency is present.
- Local development requires only a static HTTP server.
- `src/main.js` creates one `Game` after `DOMContentLoaded`.
- `requestAnimationFrame` drives update and rendering.
- Frame delta is clamped to `0.033` seconds to avoid large simulation jumps.

This lightweight delivery model is suitable for the first Strategy Galalaxy slice. A small development-only package manifest may still be useful later to pin browser-test dependencies and expose repeatable commands.

### Runtime composition

`src/game.js` owns nearly every mutable run concern:

- canvas, scale, offsets, DPR, and safe-area state
- global UI time and active simulation time
- top-level screen state
- player, enemies, projectiles, pickups, particles, zaps, and destruction effects
- sector progress, score, XP, boss transitions, pause, music, save data, and QA modes

Sector, combat, and rendering modules expose prototype descriptors that are installed directly onto `Game.prototype` with `Object.defineProperties`. This reduced the size of `game.js`, but those modules still act on the complete mutable `Game` object. The separation is organizational rather than architectural.

Strategy Galalaxy should use explicit system objects or pure system functions with narrow inputs. `MatchDirector` should coordinate phase changes without becoming another owner of every simulation detail.

### Existing states and clocks

Current states include `loading`, `title`, `playing`, `paused`, `levelUp`, `bossReward`, `gameOver`, `victory`, and visual/QA states.

Two clocks are already separated:

- `time` advances for UI and ambient animation.
- `simTime` advances only while state is `playing`.

Queued enemy attacks use `simTime`, so pause and modal screens do not consume combat telegraphs. This is directly relevant to Strategy Galalaxy: Command Phase must pause movement, weapons, capture, income, and cooldowns while rendering may continue.

The background renderer currently moves stars and asteroids inside `draw()` with a fixed `0.016` step. That is acceptable for decorative motion but prevents render-independent visual determinism. Strategy Galalaxy should update ambient state in an explicit visual update step.

## Mobile and rendering audit

### Design space and viewport behavior

`src/config.js` defines a `420 × 760` design space. `Game.resize()`:

- uses `visualViewport` when available
- sizes the CSS canvas to the visible viewport
- letterboxes the design space with a uniform scale
- maps touch/mouse positions back into design coordinates
- reads `env(safe-area-inset-top)` through a CSS variable
- caps device pixel ratio at `2`
- reduces DPR to `1.5` and particle/zap caps on coarse-pointer devices

The foundation is a good fit for the required portrait targets. Strategy Galalaxy must extend safe-area handling to the bottom command controls and explicitly test all requested portrait sizes.

### Input

The existing `Input` class provides useful low-level behavior:

- Pointer Events for touch, pen, and mouse
- pointer capture and pointer-id ownership
- design-space coordinate conversion
- exclusion zones for UI controls
- audio unlock on user gesture
- cancellation on pause, blur, and visibility loss

Movement targeting, touch offsets, and state-specific player steering are not reusable. A smaller command-input router should keep coordinate mapping, pointer lifecycle, and tap hit-testing while removing all ship-control fields.

### Renderer

The renderer already separates world, HUD, menu, and text helpers into files. However, these are installed as `Game` methods and read broad global state.

Useful pieces:

- centered asset drawing
- automatic cropping of the first frame from sprite strips
- explicit sprite-strip animation metadata
- pixel-art rendering with image smoothing disabled
- Canvas fallback graphics when images are missing
- compositing reductions on mobile

The Strategy Galalaxy renderer should preserve these techniques behind explicit renderer classes. Battlefield rendering and UI rendering should read simulation snapshots rather than own gameplay changes.

## Asset pipeline audit

`src/assets.js` contains one central asset manifest and derives staged groups:

- `boot`: 8 images
- `shared`: 43 images
- `klaed`: 34 images
- `nairan`: 33 images
- `nautolan`: 35 images
- `victory`: 1 image

There are 154 registered runtime images totaling 2.80 MiB compressed. Assets load in stages, and completed fleet groups can be released when no longer needed.

`AssetLoader` supports:

- Promise-based image loading
- duplicate request suppression
- per-asset timeout through central config
- error collection without blocking all startup
- progress reporting
- manifest settlement checks
- unloading settled groups

This class is reusable with minor adaptation. Improvements for the new project should include immutable manifest entries, typed group ownership, clearer error reporting in debug mode, and tests for missing/timeout behavior. Audio is currently loaded separately and is not part of the manifest.

The complete source inventory and license findings are in `docs/ASSET_INVENTORY.md`.

## Entity and combat audit

### `Player`

`Player` combines manual movement, hull/shield state, automatic weapons, ability cooldowns, survivor upgrades, weapon animation timing, damage feedback, and layered rendering. It directly reads input and searches `game.enemies`.

**Decision: do not reuse as a Strategy Galalaxy entity.**

Useful concepts to extract later:

- queued weapon release aligned with authored animation frames
- layered base/engine/weapon/shield rendering
- shield absorption and feedback
- muzzle metadata

The new `Unit` must receive a team, lane, unit definition, and system services. It must never depend on direct player input.

### `Enemy`

`Enemy` has useful authored fleet metadata, weapon scheduling, boss telegraphs, layered animation, shield feedback, and destruction handling. Movement and targeting always converge on the single `game.player`, while type stats live in a static `Enemy.defs` table.

**Decision: use as a data and animation reference only.**

The new common `Unit` model should replace it for both teams. Fleet prefix parsing, player-only targets, collision ramming, score/XP rewards, and boss branches must not survive in the base combat entity.

### `Projectile`

The projectile supports:

- velocity and lifetime
- homing with bounded angular turn rate
- optional acceleration and homing duration
- circular or oriented rectangular hit shapes
- piercing and hit-target tracking
- on-hit callbacks
- animated sprite strips and Canvas fallback drawing

**Decision: adapt strongly.**

Required changes:

- replace binary string owner (`player`/`enemy`) with `ownerTeam` and optional `ownerId`
- acquire targets only through the unit's lane or an injected targeting service
- remove direct access to `game.player` and `game.closestEnemy`
- move collision responsibility into the lane-aware combat system
- use pooled or recyclable instances if stress tests show allocation pressure
- define projectile caps or budgets so one team/weapon cannot starve all other fire

### `Particle`

The particle object is small, bounded by caps, and independent of survivor progression.

**Decision: reuse with minor naming and lifecycle adaptation.**

### `XpPickup`

This entity follows a manually controlled player, awards survivor XP, and expires after a timed pickup window.

**Decision: do not reuse.**

Energy Nodes are persistent map objectives and need a separate capture model, not a modified pickup.

### Collision and target search

The current combat system loops all projectiles against all enemies for player shots and checks enemy shots against the single player. `closestEnemy` scans the global enemy list. Cleanup allocates new arrays through `filter()` and `slice()` each update.

This is adequate for the original capped survivor arena but wrong for two symmetric teams and persistent fleets.

Strategy Galalaxy should:

- keep separate collections per lane and team
- query only valid opposing units and structures on the same lane
- use stable target references until invalid or outside leash rules
- use squared distances and predictable tie-breaking
- compact collections in place or on controlled intervals if profiling justifies it
- perform projectile collision within the owning lane
- include structures in an explicit target priority chain

No spatial tree is needed for the first slice if lane-local arrays and sensible caps remain fast.

## System-by-system reuse matrix

| Reference area | Decision | Reason and Strategy Galalaxy action |
| --- | --- | --- |
| `index.html` | Adapt | Keep viewport lock, safe-area variable, Canvas surface, and ES-module bootstrap; use the new title and lighter palette. |
| `src/main.js` | Direct pattern | A minimal entry point remains appropriate. |
| `src/config.js` | Concept only | Keep central configuration and `420 × 760` baseline; replace survivor and sector values with match, map, economy, unit, cap, and phase config. |
| `src/assetLoader.js` | Adapt | Preserve staged Promise loading, timeout, progress, and unload behavior. Add clearer ownership/error reporting. |
| `src/assets.js` | Adapt | Preserve manifest/groups; create a curated Strategy Galalaxy manifest containing only selected runtime files and their license notice. |
| `src/utils.js` | Direct | `clamp`, `lerp`, squared distance, DOM lookup, and time formatting are generic; copy only helpers actually used. |
| `src/input.js` | Adapt | Keep coordinate mapping, pointer capture, tap lifecycle, and gesture audio unlock. Remove all movement targeting. |
| `src/entities/player.js` | Concept only | Mine layered visuals and animation-timed weapons; replace the entity completely with team-neutral units/structures. |
| `src/entities/enemy.js` | Concept only | Mine fleet stats, visual metadata, and weapon timing; replace chase/boss/player coupling. |
| `src/entities/projectile.js` | Strongly adapt | Homing, acceleration, hit shapes, piercing, visuals, and lifetime are valuable; generalize ownership and targeting. |
| `src/entities/particle.js` | Direct/adapt | Small reusable FX primitive; keep caps and mobile glow reduction. |
| `src/entities/pickup.js` | Exclude | XP magnet/pickup progression conflicts with the new resource and node model. |
| `src/systems/combatSystem.js` | Redesign | Binary collision flow, XP rewards, and global scans must become symmetric and lane-local. Reuse small FX calls and distance patterns only. |
| `src/systems/abilities.js` | Defer | Beam/pulse code may inspire future unit weapons; manual/signature abilities are out of V1 scope. |
| `src/systems/fx.js` | Adapt | Trails, hit sparks, death bursts, rings, and mobile caps are useful; parameterize by team/faction and reduce per-frame allocation. |
| `src/systems/sectorSystem.js` | Exclude | Time-based survivor sectors and boss rewards conflict with the persistent match. Preserve only small spawn-formation shape ideas. |
| `src/systems/upgrades.js` | Exclude from core | Random cards, affinity, keystones, and player-build mutation conflict with direct unit access and two simple upgrades. Some Canvas card layout techniques may be reused later. |
| `src/systems/soundSystem.js` | Adapt | User-gesture unlock, mute state, cue throttling, and oscillator cleanup are useful. Replace cue set and verify any copied music separately. |
| `src/data/fleets.js` | Concept only | Class coverage and escalation weights are informative; new costs/stats and faction identity must be designed for symmetric lane combat. |
| `src/data/enemyVisuals.js` | Strongly adapt | Explicit frame sizes, counts, FPS, release frames, shields, and destruction mappings are highly reusable. Normalize fleet/class keys. |
| `src/data/playerVisuals.js` | Selective | Muzzle and layered module metadata may help HQ/structure prototypes; the single modular player ship is not a unit faction. |
| `src/data/projectiles.js` | Strongly adapt | Visual profiles and weapon behaviors are valuable starting data; gameplay values require lane-war balancing. |
| `src/rendering/worldRenderer.js` | Adapt patterns | Reuse asset/frame helpers and low-effect treatment. Rebuild world order, background movement, lane/structure/node drawing, and team orientation. |
| `src/rendering/hudRenderer.js` | Replace | Current HUD describes score, XP, sectors, one player, and abilities. Strategy Galalaxy needs phase, two HQs, lane pressure, nodes, energy, and income. |
| `src/rendering/menuRenderer.js` | Replace | Title/end-screen drawing patterns are useful, but all content and layout need the new match domain and visual direction. |
| `src/rendering/text.js` | Direct/adapt | Fitting and wrapping helpers are reusable with typography tests. |
| `src/saveSystem.js` | Direct/adapt | Defensive local-storage wrapper is reusable after changing keys and data shape. |
| `src/runStats.js` | Concept only | Local, bounded, QA-excluding telemetry is a useful model; all tracked survivor fields must be replaced. |
| `src/qa/fullRunTest.js` | Pattern only | URL-driven in-browser automation and a published pass/fail state are valuable; scenarios must cover the Strategy Galalaxy match loop. |
| `scripts/reliability-check.mjs` | Pattern only | Dependency-free model checks are valuable. New tests should construct headless match fixtures without browser globals. |
| `scripts/verify-assets.mjs` | Adapt | Retain manifest existence and decoded-size checks for the curated asset set. |
| `scripts/browser-reliability-check.mjs` | Adapt | Retain Playwright viewport, touch, console, screenshot, and report checks; pin the dependency and write only inside the new repository. |
| `scripts/optimize-ui-assets.py` | Defer/adapt | Useful only when Strategy Galalaxy has final large UI sources requiring runtime derivatives. |

## Formation findings

Galalaxy defines five simple spawn shapes: line, diagonal, shallow V, diamond, and wedge. Ships in a formation share one velocity, and formations are limited to light classes.

The shapes are useful as deployment-slot concepts. The flyby implementation is not reusable because lane units need to advance, engage, hold, and resume movement rather than cross the arena at fixed velocity.

Recommended first implementation:

- derive formation slots from the purchased unit list
- place heavy/frontline ships nearer the enemy direction
- offset light ships laterally within the lane
- keep the formation only during spawn/initial advance
- allow combat states to break it without a separate formation simulation

## QA and reliability findings

### Checks executed during this audit

- All JavaScript source and script files passed `node --check`.
- `node scripts/reliability-check.mjs` passed.
- `node scripts/verify-assets.mjs` passed.
- The manifest contains 154 valid image paths totaling 2.80 MiB compressed.
- Runtime UI derivatives reduce theoretical decoded RGBA memory from 41.99 MiB to 13.31 MiB, a 68.3% reduction.
- The existing checked-in browser report records a passing full run, pause behavior, pointer lifecycle, four audio cues, replay/hangar, and six viewport/safe-area combinations.

The browser suite itself was not rerun because it writes screenshots and a report into the read-only reference repository. Its checked-in evidence was reviewed instead.

### Practices to carry forward

- URL test modes and a globally accessible test handle in QA only
- separate simulation time from UI/visual time
- dependency-free headless checks for core state transitions
- browser error and failed-response capture
- viewport matrices with touch enabled and safe-area overrides
- generated JSON reports and screenshots
- asset existence and decoded-memory checks
- capped local match summaries excluded from QA runs

### Improvements needed

- Pin Playwright and commands in the new project's development setup.
- Separate deterministic simulation randomness from visual randomness.
- Provide a seeded RNG per match.
- Test both teams through the same purchase and deployment API.
- Accelerate match time without changing the logical order of updates.
- Test persistent survivors across multiple cycles.
- Test node capture, contested state, income changes, structure targeting, victory/defeat, and restart.
- Add a stress fixture for large lane-local fleets and projectile budgets.

## Recommended initial factions

### Player: Nairan

- Complete Scout through Dreadnought family plus Support and Torpedo variants.
- Muted green/blue hulls and lavender accents fit the intended friendly, lighter space palette.
- Class silhouettes scale clearly from small pointed craft to large broad capital ships.
- Existing engines, shields, weapons, destruction strips, and projectile profiles are already mapped in code.

### Enemy: Kla'ed

- Complete class family and rich animation coverage.
- Coral/red hulls provide immediate team contrast against Nairan.
- Existing weapon effects are visually readable and establish a warm enemy color language.
- Kla'ed has the broadest current runtime weapon vocabulary, including bullet, ray, torpedo, and wave profiles.

### Reserved: Nautolan

Nautolan also has complete, coherent assets and strong teal/lavender identity. It should remain out of the first slice to preserve scope and later provide a clearly recognizable third faction.

This choice concerns visuals only. Both teams must use the same gameplay unit definitions and economy rules in V1 unless later faction asymmetry is deliberately designed.

## Main risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Copying the current `Game` object | Match, UI, rendering, spawning, and progression become tightly coupled again | Define system boundaries and data contracts before Foundation work |
| Reusing `Player`/`Enemy` inheritance | Permanent team special cases and accidental manual-control assumptions | One team-neutral `Unit` and one `Structure` model |
| Global target/collision scans | Persistent fleets can cause quadratic work and erratic cross-lane targets | Lane-local collections, stable targets, explicit priority rules |
| One shared projectile cap | One side or rapid weapon can suppress unrelated shots | Per-team/per-lane budgets or deterministic admission policy |
| Unseeded `Math.random()` everywhere | AI and battles are difficult to reproduce | Match RNG separate from visual RNG |
| Rendering mutates world visuals | Results depend on render rate and complicate debug playback | Move all updates out of draw paths |
| Sprite-strip metadata is manual | Wrong frame sizes/counts create subtle visual defects | Validate dimensions against declared metadata in asset QA |
| Full asset-pack copies | Repository and download size grow without benefit | Copy only runtime PNG/OGG files actually selected plus license text |
| Small ships in two narrow lanes | Class silhouettes may become unreadable on 360 px screens | Early mobile render test before polish; use fewer, larger units |
| Heavy glow and alpha compositing | Mobile GPU cost grows during persistent pushes | Preserve low-effects mode, DPR cap, FX caps, and short effects |
| Music provenance is undocumented | Distribution rights cannot be established from the repository | Do not copy `track1.ogg` until its source/license is documented |
| Galalaxy UI art is context-specific | Dark neon survivor UI conflicts with the new brighter strategy direction | Build the command interface from new Canvas/CSS primitives first |
| Static no-build setup lacks pinned QA tooling | Browser tests depend on external environment configuration | Add explicit development tooling in Foundation only when needed |

## Foundation constraints derived from the audit

Bulk 2 and Bulk 3 should follow these decisions:

1. Keep Canvas, native modules, the `420 × 760` baseline, DPR cap, and `visualViewport` scaling.
2. Establish a seeded simulation clock/RNG before AI or combat behavior.
3. Make `Team`, `Lane`, `Unit`, `Structure`, `Projectile`, and `CaptureNode` first-class data concepts.
4. Let `MatchDirector` control state and time, while specialized systems own their data transformations.
5. Build a fresh lane-local combat system; port projectile behaviors afterward.
6. Curate Nairan and Kla'ed runtime assets instead of copying every pack.
7. Preserve source paths, audited commit, and CC0 license notice in the provenance log when files are copied.
8. Rebuild HUD/menus around Command and Battle phases.
9. Adapt QA at the same time as each new system, with no browser writes to the reference clone.

## Audit completion criteria

- Architecture and build process documented: complete.
- Relevant source modules classified: complete.
- Asset packs and runtime manifest inventoried: complete.
- Direct, adapted, conceptual, and excluded reuse identified: complete.
- Initial two-faction recommendation made: complete.
- License and provenance gaps identified: complete.
- Performance, determinism, UI, and architecture risks recorded: complete.
