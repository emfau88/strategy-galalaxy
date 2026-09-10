# Galalaxy Asset Inventory

## Audited import

The complete licensed asset import comes from read-only Galalaxy commit `7f90d17a063967f9978e74f6519c450a2b0e4f85`.

| Tier | Files | Compressed bytes | Runtime behavior |
| --- | ---: | ---: | --- |
| `assets/library/galalaxy/` | 516 | 20,808,162 | Development/source library; never bulk-loaded |
| Foozle packs inside library | 502 | 14,218,222 | CC0 source art, previews and editable files |
| Optional Galalaxy UI inside library | 14 | 6,589,940 | Preserved for reference; not in current manifest |
| Registered Strategy Galalaxy asset manifest | 73 | verified by script | Active runtime plus retained source-strip aliases |
| Curated GitHub Pages image artifact | 44 | verified by script | Union of both levels; no bulk reference library |

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

Player and rival each use one unified `384×384` transparent hull for Drone, Scout, Fighter, Bomber and Frigate. All ten hulls share the same strict top-down camera, upper-left warm key light, cool lower-right fill, material hierarchy and class scale. The player uses ivory/brass/cyan with planted accents; the rival uses charcoal/copper/burgundy/coral. Static emitted flames were removed and the exposed nozzle mouths were reconstructed before normalization.

Engine thrust now reuses the original CC0 Galalaxy/Foozle Nairan and Kla'ed engine animation frames at 10 FPS. The renderer takes a tight transparent crop from the real source frame and places it at explicit per-faction/per-class nozzle hardpoints; the flame shape itself is never drawn procedurally. Ship kills likewise play the original class-specific 8–18-frame Galalaxy destruction sequences at 14 FPS. The player-requested source animation is allowed to replace the unified hull for the short death sequence; structures keep a separate bounded blast because the fleet strips contain ship silhouettes.

Cold start is intentionally bounded: Level 1 requests 38 images / about 7.4 MiB and Level 2 requests 36 images / about 7.1 MiB. Shared hulls, projectiles and command art load first; the selected background, structures and Galalaxy VFX follow in a second stage. The loader retries once, keeps late image responses alive after its 30-second gate and swaps them in without a refresh. Mobile `840 px` derivatives preserve the authored source files while avoiding their former 112 MiB decoded startup set.

## Active projectile runtime

| Role | Shared rendering language | Behavior |
| --- | --- | --- |
| Scout | cyan orbital plasma pulse / angular coral energy shard | small, light control shot |
| Fighter | cyan-white lance / forked coral beam | fast anti-light salvo |
| Bomber | ivory-brass cyan missile / charcoal-copper coral torpedo | visible accelerating bounded-homing missile with position trail |
| Frigate | broad cyan crystal shell / chunky copper-crimson heavy shell | slower sequential broadside shot |

Mechanics remain faction-symmetric even when art differs. Each team/lane has an independent projectile budget; a higher global limit is a safety guard. Class-specific trails retain 8–18 positions: short pulse echoes, long laser streaks, segmented missile exhaust and dashed heavy-cannon wakes.

## Project-native presentation assets

- `assets/environment/strategy-galaxy-background-v1.png`: portrait background created for this project.
- `assets/structures/command-hq-topdown-v3.png`: production HQ base with two lane-facing hangars; doors, practical lights and damage presentation are composed in Canvas.
- `assets/structures/defense-turret-base-topdown-v2.png`: barrel-free modular turret platform; the aiming weapon head and recoil are composed in Canvas.
- `assets/structures/defense-turret-head-topdown-v3.png`: independent top-down twin-barrel head rotated and recoiled around the turret socket in Canvas.
- `assets/factions/unified/`: ten normalized high-resolution hulls used by both maps and the command UI, including dedicated Drones.
- `assets/factions/{nairan,klaed}/*-engine.png`: active original Galalaxy/Foozle engine frames; Scout flames are cropped and positioned on every unified nozzle.
- `assets/factions/{nairan,klaed}/*-destruction.png`: active original class-specific Galalaxy/Foozle death sequences.
- `assets/projectiles/unified/`: eight class- and faction-specific raster projectile bodies; procedural trails only supplement their readability.
- `assets/structures/energy-relay-unified-v1.png`: shared capturable relay in the same ivory/brass/garden material family.
- `assets/structures/orbital-garden-turret-{player,rival}-v3.png`: team-authored bases whose cyan/coral practical lamps replace all persistent code-drawn ownership markers.
- `assets/ui/orbital-command-medallion-v1.png`: command identity shared by the HQ and contextual dock.
- `assets/structures/command-hq-topdown-v1.png`, `defense-turret-topdown-v1.png` and `energy-relay-topdown-v1.png`: retained project-native first-pass sources; only the relay remains active.
- normalized environment aliases and earlier curated fleet bases remain available to the runtime.

## Verification

Run:

```powershell
npm.cmd run verify:assets
```

The verifier reads PNG headers without browser dependencies, checks every manifest path, enforces the per-level request and byte budgets, validates sprite-strip dimensions against frame metadata and asserts the exact 516-file library boundary. `npm.cmd run test:pages` additionally builds the deployment artifact and opens it in a clean mobile browser profile, requiring every active HQ, turret, HUD, engine and destruction key to have real decoded pixels.

Exact origins and adaptation notes are recorded in [`SOURCE_PROVENANCE.md`](SOURCE_PROVENANCE.md). The binding palette, lighting and compositing rules live in [`ART_DIRECTION.md`](ART_DIRECTION.md).
