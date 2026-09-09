# Runtime Art Direction

This is the shared visual contract for ships, structures, effects and interface art.

## Camera and source quality

- Gameplay objects use a strict 90-degree top-down silhouette, even when larger scenic HQ art has slight illustrative depth.
- New standalone sprites are authored at high resolution and normalized to transparent `384×384` runtime files.
- The upper-left is always the warm key-light direction; the lower-right receives a cool navy fill.
- Texture is allowed inside the silhouette, but outlines and team lights must survive a 30–80 pixel display size.

## Materials and factions

| Layer | Player | Rival | Shared |
| --- | --- | --- | --- |
| Primary armor | warm ivory ceramic | charcoal/navy ceramic | dark mechanical recesses |
| Trim | aged brass | copper/brass | warm upper-left edge light |
| Emissive | cyan/aqua | coral/red | ivory-hot muzzle core |
| Character | small planted garden beds | burgundy armored panels | restrained bloom, crisp outline |

Team identity comes from emissive cores, engines, projectiles and structure beacons—not a full-screen tint or oversized neon ring.

## Effects

- Scout: compact round plasma pulse.
- Fighter: long, narrow white-hot laser with team-colored bloom.
- Bomber: readable ceramic/metal missile body, fins, team stripe and persistent exhaust trail.
- Frigate: slower heavy bolt with a broad luminous core and sequential hardpoint release.
- Shield and hit feedback are procedural Canvas effects so both fleets share timing, line weight and color logic.
- Legacy 64-pixel animated faction strips remain in the licensed source library, but are no longer loaded into the active match.

## Composition and grading

- Orbital Garden receives a restrained `saturate(1.12) contrast(1.05) brightness(1.03)` background grade.
- HUD surfaces use opaque navy enamel, warm ivory text, brass selection edges and limited cyan/coral status accents.
- UI icons use the same normalized hull files as the battlefield; separate lower-quality thumbnails are forbidden.
