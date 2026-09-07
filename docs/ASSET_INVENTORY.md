# Galalaxy Asset Inventory

## Audited import

The complete licensed asset import comes from read-only Galalaxy commit `7f90d17a063967f9978e74f6519c450a2b0e4f85`.

| Tier | Files | Compressed bytes | Runtime behavior |
| --- | ---: | ---: | --- |
| `assets/library/galalaxy/` | 516 | 20,808,162 | Development/source library; never bulk-loaded |
| Foozle packs inside library | 502 | 14,218,222 | CC0 source art, previews and editable files |
| Optional Galalaxy UI inside library | 14 | 6,589,940 | Preserved for reference; not in current manifest |
| Registered Strategy Galalaxy runtime manifest | 56 | verified by script | Only current background, modular structures, core fleet layers and projectiles |

The reference contains one additional file, `assets/music/track1.ogg` (5,937,850 bytes). It is deliberately excluded because its distribution license is undocumented. Therefore 516 files is the expected and enforced library count.

## Library groups

| Group | Files | Contents | Current use |
| --- | ---: | --- | --- |
| Void Main Ship | 66 | modular hull, damage, engines, shields, weapons, projectiles, sources | Deferred structure/technology reference |
| Kla'ed Fleet | 129 | eight classes, engines, weapons, shields, destruction, projectiles, previews, sources | Enemy core four active |
| Nairan Fleet | 126 | eight classes, engines, weapons, shields, destruction, projectiles, previews, sources | Player core four active |
| Nautolan Fleet | 132 | eight classes and full effects/projectile vocabulary | Deferred third faction |
| Environment | 24 | stars, planet, asteroid, flames/explosion and sources | Curated environment aliases active |
| Pickups | 25 | engine, shield and weapon pickups plus sources | Deferred |
| Galalaxy UI | 14 | title, start, upgrade, boss and victory art | Preserved, not loaded |

Formats across the imported reference library include runtime PNGs, editable Aseprite sources, animated GIF previews and the six pack TXT readmes.

## Active fleet runtime

Nairan and Kla'ed each register the following layers for Scout, Fighter, Bomber and Frigate:

- base/hull;
- animated engine;
- shield hit;
- destruction strip;
- weapon strip where supplied by the pack (Scout, Fighter and Frigate).

The current renderer uses explicit metadata from `src/data/visuals.js`. Core ships use 64-pixel source cells; frame counts, FPS and weapon release frames are stored per faction/class rather than inferred from filenames. Capital ships remain in the source library but are not registered or enabled.

## Active projectile runtime

| Role | Nairan visual | Kla'ed visual | Behavior |
| --- | --- | --- | --- |
| Scout | Bolt | Bullet | small, light control shot |
| Fighter | Ray/Bolt family | Ray/Bullet family | fast anti-light salvo |
| Bomber | Rocket/Torpedo | Torpedo | visible accelerating bounded-homing missile with position trail |
| Frigate | Ray/Torpedo family | Big Bullet/Wave family | slower, visually heavier shot |

Mechanics remain faction-symmetric even when art differs. Each team/lane has an independent projectile budget; a higher global limit is a safety guard. Trails retain at most ten positions.

## Project-native presentation assets

- `assets/environment/strategy-galaxy-background-v1.png`: portrait background created for this project.
- `assets/structures/command-hq-topdown-v3.png`: production HQ base with two lane-facing hangars; doors, practical lights and damage presentation are composed in Canvas.
- `assets/structures/defense-turret-base-topdown-v2.png`: barrel-free modular turret platform; the aiming weapon head and recoil are composed in Canvas.
- `assets/structures/defense-turret-head-topdown-v3.png`: independent top-down twin-barrel head rotated and recoiled around the turret socket in Canvas.
- `assets/structures/command-hq-topdown-v1.png`, `defense-turret-topdown-v1.png` and `energy-relay-topdown-v1.png`: retained project-native first-pass sources; only the relay remains active.
- normalized environment aliases and earlier curated fleet bases remain available to the runtime.

## Verification

Run:

```powershell
npm.cmd run verify:assets
```

The verifier reads PNG headers without browser dependencies, checks every manifest path, validates sprite-strip dimensions against frame metadata and asserts the exact 516-file library boundary. This catches missing copies, accidental music inclusion and metadata drift before deployment.

Exact origins and adaptation notes are recorded in [`SOURCE_PROVENANCE.md`](SOURCE_PROVENANCE.md).
