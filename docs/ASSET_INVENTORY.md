# Galalaxy Asset Inventory

## Audited import

The complete licensed asset import comes from read-only Galalaxy commit `7f90d17a063967f9978e74f6519c450a2b0e4f85`.

| Tier | Files | Compressed bytes | Runtime behavior |
| --- | ---: | ---: | --- |
| `assets/library/galalaxy/` | 516 | 20,808,162 | Development/source library; never bulk-loaded |
| Foozle packs inside library | 502 | 14,218,222 | CC0 source art, previews and editable files |
| Optional Galalaxy UI inside library | 14 | 6,589,940 | Preserved for reference; not in current manifest |
| Registered Strategy Galalaxy asset manifest | 86 | verified by script | 49 current boot assets are loaded; legacy animation groups remain registered for source validation only |

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

Player and rival each use one unified `384×384` transparent `v2` hull for Scout, Fighter, Bomber and Frigate. Drones reuse the Scout silhouette at a smaller gameplay scale. All eight hulls share the same strict top-down camera, upper-left warm key light, cool lower-right fill, material hierarchy and class scale. The player uses ivory/brass/cyan with planted accents; the rival uses charcoal/copper/burgundy/coral. Static emitted flames were removed and the exposed nozzle mouths were reconstructed before normalization.

Engine thrust now comes from two project-native eight-frame `1024×256` raster strips. Runtime hardpoints place the animated plume behind each unified hull without procedurally drawing its shape. Shields, damage and destruction remain lightweight presentation effects. The licensed Nairan/Kla'ed strips and metadata remain registered and verified as fallback/source material but are not loaded into an active match.

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
- `assets/factions/unified/`: eight normalized high-resolution hulls used by both maps and the command UI.
- `assets/effects/*-engine-strip-v1.png`: two eight-phase raster engine atlases, authored separately for player and rival exhaust identity.
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

The verifier reads PNG headers without browser dependencies, checks every manifest path, validates sprite-strip dimensions against frame metadata and asserts the exact 516-file library boundary. This catches missing copies, accidental music inclusion and metadata drift before deployment.

Exact origins and adaptation notes are recorded in [`SOURCE_PROVENANCE.md`](SOURCE_PROVENANCE.md). The binding palette, lighting and compositing rules live in [`ART_DIRECTION.md`](ART_DIRECTION.md).
