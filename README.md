# Strategy Galalaxy

Strategy Galalaxy is a standalone, mobile-first singleplayer Space Lane Wars game. Players plan reinforcements, economy, and defense during a paused Command Phase, then watch two persistent lanes resolve automatically during the Battle Phase.

The Canvas foundation is complete. It establishes mobile portrait scaling, Safe-Area-aware coordinates, layered rendering, deterministic utility primitives, and a simulation clock without implementing gameplay yet.

## Core loop

```text
Read the persistent battlefield
  → plan Left and Right Lane reinforcements
  → invest or save Energy
  → deploy both teams simultaneously
  → watch 22 seconds of automatic combat
  → repeat until one Headquarters is destroyed
```

There is no manual ship or unit control.

## Repository boundary

All development happens in this repository:

`https://github.com/emfau88/strategy-galalaxy.git`

The original Galalaxy project is a read-only technical and visual reference:

`https://github.com/emfau88/galalaxy.git`

It may be inspected and selected code or assets may later be copied into Strategy Galalaxy. It must not receive changes, commits, or pushes from this project.

See [Repository rules](docs/REPOSITORY_RULES.md) for the enforced workflow and [Source provenance](docs/SOURCE_PROVENANCE.md) for how reused material is recorded.

## Planning

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

```powershell
npm.cmd run check
```

The check validates the five target portrait viewports, design-space input mapping, paused simulation time, deterministic RNG, and the empty boot asset group.

## Current status

- [x] Working repository connected
- [x] Read-only reference boundary established
- [x] Development roadmap created
- [x] Galalaxy reference audit
- [x] Product and architecture contracts
- [x] Technical Canvas foundation
- [ ] Headless lane combat
