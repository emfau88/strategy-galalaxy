# Source Provenance

This log records concrete reuse from the read-only Galalaxy reference.

## Reference

| Field | Value |
| --- | --- |
| Repository | `https://github.com/emfau88/galalaxy.git` |
| Initial audit | `d2c3a7bd1d8b5657b27b39bd7ce9a6414c770739` |
| Asset import and animation audit | `7f90d17a063967f9978e74f6519c450a2b0e4f85` |
| Policy | Read-only; no edits, commits or pushes |

The imported Foozle pack readmes identify the artwork as CC0. They remain next to the source material inside the library. Galalaxy's `assets/music/track1.ogg` is not included because its distribution license is not documented.

## Reuse log

| Reference path | Commit | Destination | Type and adaptation |
| --- | --- | --- | --- |
| `src/assetLoader.js` | `d2c3a7b…` | `src/rendering/assetLoader.js` | Adapted into semantic manifests with maps, timeout handling and visible failures. |
| `assets/Foozle_2DS0011_Void_MainShip/` | `7f90d17…` | `assets/library/galalaxy/Foozle_2DS0011_Void_MainShip/` | Complete direct copy including PNG, Aseprite, GIF and readme sources. |
| `assets/Foozle_2DS0012_Void_EnemyFleet_1/` | `7f90d17…` | `assets/library/galalaxy/Foozle_2DS0012_Void_EnemyFleet_1/` | Complete direct Kla'ed fleet copy. |
| `assets/Foozle_2DS0013_Void_EnemyFleet_2/` | `7f90d17…` | `assets/library/galalaxy/Foozle_2DS0013_Void_EnemyFleet_2/` | Complete direct Nairan fleet copy. |
| `assets/Foozle_2DS0014_Void_EnemyFleet_3/` | `7f90d17…` | `assets/library/galalaxy/Foozle_2DS0014_Void_EnemyFleet_3/` | Complete direct Nautolan fleet copy, reserved for later use. |
| `assets/Foozle_2DS0015_Void_EnvironmentPack/` | `7f90d17…` | `assets/library/galalaxy/Foozle_2DS0015_Void_EnvironmentPack/` | Complete direct environment source copy. |
| `assets/Foozle_2DS0016_Void_PickupsPack/` | `7f90d17…` | `assets/library/galalaxy/Foozle_2DS0016_Void_PickupsPack/` | Complete direct pickup source copy. |
| `assets/ui/` | `7f90d17…` | `assets/library/galalaxy/ui/` | Complete direct optional UI library copy; not loaded by the current match. |
| Kla'ed and Nairan core-four base, engine, weapon, shield and destruction PNGs | `7f90d17…` | `assets/factions/klaed/`, `assets/factions/nairan/` | Direct files normalized to stable lowercase runtime aliases. Engine, shield and class-specific destruction strips are active. Shield pixels are clipped into project-owned class contours so the source fleet silhouette never replaces the unified hull; Bomber has no weapon strip and falls back to projectile/muzzle presentation. |
| Kla'ed `Bullet`, `Big Bullet`, `Ray`, `Torpedo`, `Wave`; Nairan `Bolt`, `Ray`, `Rocket`, `Torpedo` | `7f90d17…` | `assets/projectiles/` | Direct files normalized as runtime aliases and mapped through visual profiles. |
| Fleet and projectile metadata in reference data modules | `7f90d17…` | `src/data/visuals.js` | Adapted frame size/count, FPS, release-frame and orientation metadata to renderer-only profiles. |
| `src/entities/projectile.js`, projectile data and FX systems | `7f90d17…` | `src/simulation/battleSimulation.js`, `src/data/definitions.js`, `src/rendering/` | Adapted bounded homing, acceleration and presentation vocabulary to deterministic lane combat; damage remains simulation-owned. |
| Five engine/weapon/shield pickup icons from `Foozle_2DS0016_Void_PickupsPack` | `7f90d17…` | Runtime upgrade-card manifest | Direct CC0 reuse for Reactor, Arsenal, Autoloader, Multi Cannon and Shield Array; labels, levels, costs and effects are project-owned. |
| `src/systems/upgrades.js` card hierarchy and concrete stat-preview approach | `d2c3a7b…` | `src/rendering/uiRenderer.js` | Conceptually adapted as compact mobile cards with icon, level pips and current→next values; the reference survivor-choice system and keystones were not copied. |

The portrait backgrounds, all structures outside `assets/library/galalaxy/`, the unified fleet hulls including the two dedicated Drones under `assets/factions/unified/`, the eight projectile bodies under `assets/projectiles/unified/` and the command medallion were generated specifically for Strategy Galalaxy and are not Galalaxy reference assets. The former generated engine strips were removed from the active tree after direct comparison; runtime exhaust and ship destruction now come from the CC0 Galalaxy/Foozle aliases above. Active generated structures include four strict top-down, map- and faction-specific Command Carriers under `assets/runtime/structures/`, team-integrated modular Garden turrets and the unified energy relay. Their prompts and runtime adaptations are recorded in `docs/GENERATED_ASSETS.md`; common rendering rules are recorded in `docs/ART_DIRECTION.md`.

## Rules for future reuse

- Record the exact inspected commit and explicit source/destination paths.
- Keep copied licenses/readmes with their source groups.
- Separate byte-for-byte copies, normalized aliases, adapted code and conceptual inspiration.
- Keep active assets in the boot manifest and retained fallback/source assets in named validation groups; library presence never implies automatic loading.
- Verify licensing before distribution and continue excluding material with unclear rights.
