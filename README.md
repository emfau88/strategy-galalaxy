# Strategy Galalaxy

**[▶ Play Strategy Galalaxy](https://emfau88.github.io/strategy-galalaxy/)**

Strategy Galalaxy is a standalone, mobile-first singleplayer Space Lane Wars game. The playable prototype currently uses a manual Command Phase followed by automatic combat in two persistent fleet corridors.

> **Design direction:** the hard Command/Battle split is the prototype baseline, not the intended final loop. The game is evolving toward a continuous live match: combat, capture and income keep running while the player prepares the next reinforcement wave for a fixed 22-second simultaneous deployment. See the [Core Gameplay Vision](STRATEGY_GALALAXY_CORE_VISION.md).

The current vertical slice includes deterministic two-lane combat, persistent Command/Battle cycles, Energy and income, capturable Nodes, upgrades, a rule-bound opponent AI, shared reinforcement slots, role-based targeting, fleet formations, and a touch-first portrait UI. Nairan and Kla'ed fleet art is presented in a brighter blue, teal, lavender, and warm-coral battlefield with differentiated weapon profiles and restrained combat effects.

## Current prototype loop

```text
Read the persistent battlefield
  → plan Left and Right Lane reinforcements
  → distribute up to 4 paid reinforcement slots across both lanes
  → invest or save Energy
  → deploy both teams simultaneously
  → watch 22 seconds of automatic combat
  → repeat until one Headquarters is destroyed
```

There is no manual ship or unit control.

## Target live-match loop

```text
Observe the persistent live battlefield while combat, capture, and income continue
  → prepare Left and Right reinforcement queues (up to 4 paid slots total)
  → revise them until the short lock-in window
  → both teams deploy simultaneously every 22 seconds
  → survivors remain and the next countdown begins immediately
```

This target direction deliberately keeps the 22-second strategic rhythm while removing the gameplay pause between waves.

## Current playable slice

- Two wide, isolated fleet corridors; ships may spread laterally but never switch lanes.
- Persistent survivors, structure damage, destroyed Turrets, Node ownership, and capture progress between Battle Phases.
- Two free Scouts per lane and deployment, plus up to four paid reinforcements shared across both lanes.
- Manual Command Phase with no forced countdown, full-price undo for queued ships, and a visual next-wave preview.
- A 22-second Battle Phase with a compact spectator HUD; purchase controls are hidden while combat runs.
- Permanent health bars for Headquarters and Turrets; ship health appears only after damage or below 75% HP.
- Mobile portrait scaling for the target viewport range, with mouse, touch, fullscreen, pause, deterministic debug, and automated match modes.

## Fleet roles

| Ship | Battlefield role | Weapon profile | Capture strength |
| --- | --- | --- | ---: |
| Scout | Fast objective runner with low durability and low combat damage | Small pulse | 2.0 |
| Fighter | Rapid anti-light escort that prioritizes Bombers and light ships | Fast laser | 1.0 |
| Bomber | Slow, vulnerable siege craft that prioritizes Turrets, Headquarters, and heavy targets | Homing missile with trail and impact burst | 0.5 |
| Frigate | Durable frontline anchor that draws pressure and delivers steady damage | Heavy cannon | 0.75 |

Weapon feedback currently includes role-specific projectile speed and cadence, bounded missile homing and acceleration, missile trails, muzzle flashes, hit sparks, damage flashes, and explosion sizes scaled to the destroyed target.

## Repository boundary

All development happens in this repository:

`https://github.com/emfau88/strategy-galalaxy.git`

The original Galalaxy project is a read-only technical and visual reference:

`https://github.com/emfau88/galalaxy.git`

It may be inspected and selected code or assets may later be copied into Strategy Galalaxy. It must not receive changes, commits, or pushes from this project.

See [Repository rules](docs/REPOSITORY_RULES.md) for the enforced workflow and [Source provenance](docs/SOURCE_PROVENANCE.md) for how reused material is recorded.

## Planning

- [Core Gameplay Vision](STRATEGY_GALALAXY_CORE_VISION.md)
- [Development roadmap](ROADMAP.md)
- [Game design contract](docs/GAME_DESIGN.md)
- [Architecture contract](docs/ARCHITECTURE.md)
- [Galalaxy reference audit](docs/REFERENCE_AUDIT.md)
- [Galalaxy asset inventory](docs/ASSET_INVENTORY.md)

## Local development

The project uses native browser modules and needs no build step.

```powershell
python -m http.server 8765 --directory .
```

Open `http://127.0.0.1:8765/`. The two prepared QA entry points are `?debug=1` and `?test=match`; they can be combined as `?debug=1&test=match`.

In the normal build, tap to start, choose the `LEFT` or `RIGHT` wave card below the header, plan ships, and use `DEPLOY FLEETS` when ready; the Command Phase has no forced countdown. The lower panel can switch between ships and upgrades; `UNDO` refunds the most recently planned ship on the selected lane and reopens its reinforcement slot. The top-right icon requests browser fullscreen where supported. `P` pauses or resumes an active phase. `?test=match` enters the automatic repeatable test match immediately.

```powershell
npm.cmd run check
```

The check validates the five target portrait viewports, design-space input mapping, manual Command timing, formations, lane bounds, role targeting, shared reinforcement slots and undo, combat, match cycles, Energy accounting, capture strength, Nodes, upgrades, persistence, AI purchasing, and escalation.

## Current status

- [x] Working repository connected
- [x] Read-only reference boundary established
- [x] Development roadmap created
- [x] Galalaxy reference audit
- [x] Product and architecture contracts
- [x] Technical Canvas foundation
- [x] Headless lane combat
- [x] Deployment cycles and persistent match
- [x] Economy and Energy Nodes
- [x] Readable fleet hierarchy, formations, and reduced health-bar clutter
- [x] Role-specific targeting, capture strength, and weapon profiles
- [x] Homing missiles, trails, hit sparks, damage flashes, and scaled explosions
- [x] Shared four-slot reinforcement planning and next-wave preview
- [x] Brighter battlefield art direction and compact spectator HUD (without audio)
- [x] Singleplayer AI
- [x] Mobile Command and Battle UI
- [ ] Continuous live-match deployment loop (the next core rework; see the Core Gameplay Vision)
