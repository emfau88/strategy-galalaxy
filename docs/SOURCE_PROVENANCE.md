# Source Provenance

This log records every source file or asset later reused from the read-only Galalaxy reference repository.

## Reference baseline

| Field | Value |
| --- | --- |
| Repository | `https://github.com/emfau88/galalaxy.git` |
| Branch at initial clone | `main` |
| Initial audited commit | `d2c3a7bd1d8b5657b27b39bd7ce9a6414c770739` |
| Commit date | `2026-09-06T10:52:24+02:00` |
| Local location | `.reference/galalaxy/` (Git-ignored) |
| Policy | Read-only; fetch permitted, commits and pushes forbidden |

If the reference is updated before or during an audit, record the exact newer commit in the relevant entry rather than silently replacing this baseline.

## Reuse log

The following concrete technical adaptation has been copied from the reference:

Add one row per logical file or tightly related asset group:

| Reference path | Reference commit | Destination path | Reuse type | Adaptation | Reason |
| --- | --- | --- | --- | --- | --- |
| `src/assetLoader.js` | `d2c3a7bd1d8b5657b27b39bd7ce9a6414c770739` | `src/rendering/assetLoader.js` | Adapted | Replaced mutable object registries with maps, added semantic manifests and retained timeout/error visibility; no reference assets are loaded yet. | It is a small, isolated browser image-loading primitive compatible with the new asset boundary. |
| `assets/Foozle_2DS0013_Void_EnemyFleet_2/Nairan/Designs - Base/PNGs/{Scout,Fighter,Bomber,Frigate}` | `d2c3a7bd1d8b5657b27b39bd7ce9a6414c770739` | `assets/factions/nairan/` | Direct | Renamed to role-based lowercase filenames; selected runtime base PNGs only. CC0 notice copied to `assets/licenses/FOOZLE_NAIRAN_CC0.txt`. | Player fleet silhouettes for the four V1 unit roles. |
| `assets/Foozle_2DS0012_Void_EnemyFleet_1/Kla'ed/{Base,Projectiles}/PNGs/{Scout,Fighter,Bomber,Frigate,Bullet}` | `d2c3a7bd1d8b5657b27b39bd7ce9a6414c770739` | `assets/factions/klaed/`, `assets/projectiles/klaed-bullet.png` | Direct | Renamed runtime PNGs only. CC0 notice copied to `assets/licenses/FOOZLE_KLAED_CC0.txt`. | Enemy fleet silhouettes and its projectile vocabulary. |
| `assets/Foozle_2DS0013_Void_EnemyFleet_2/Nairan/Weapon Effects - Projectiles/PNGs/Nairan - Bolt.png`; `assets/Foozle_2DS0015_Void_EnvironmentPack/{Backgrounds,Planets,Asteroids}/PNGs` | `d2c3a7bd1d8b5657b27b39bd7ce9a6414c770739` | `assets/projectiles/nairan-bolt.png`, `assets/environment/` | Direct | Curated and renamed Nairan bolt plus void, stars, planet, and asteroid runtime PNGs. CC0 notice copied to `assets/licenses/FOOZLE_ENVIRONMENT_CC0.txt`. | Team-readable projectiles and a subdued space backdrop. |
| _Example: `src/example.js`_ | _full commit SHA_ | _`src/example.js`_ | _Direct / Adapted / Concept only_ | _Summary of changes_ | _Why reuse is appropriate_ |

## Reuse rules

- Record the source commit that was actually inspected or copied.
- Prefer explicit file paths over broad directory claims.
- Describe meaningful modifications rather than using a generic “adapted” label alone.
- Record derived assets as well as byte-for-byte copies.
- Keep conceptual inspiration in the audit document; use this file for concrete code and asset lineage.
- Verify licensing and attribution requirements during the reference audit before distributing reused material.
