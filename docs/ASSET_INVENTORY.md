# Galalaxy Asset Inventory

## Baseline

This inventory describes the read-only Galalaxy reference at commit:

`d2c3a7bd1d8b5657b27b39bd7ce9a6414c770739`

The following curated runtime files have now been copied into Strategy Galalaxy: four Nairan and four Kla'ed ship bases, one projectile per team, and four Environment Pack images. They total 310,705 bytes including the three copied CC0 notices. Exact origins are recorded in `docs/SOURCE_PROVENANCE.md`.

An additional 1,445,597-byte portrait placeholder background was generated for Strategy Galalaxy through ImageGen and is stored as `assets/environment/strategy-galaxy-background-v1.png`. It is original project artwork, not a reference-repository asset.

## Complete repository inventory

The reference contains 517 asset files totaling 25.51 MiB.

| Asset group | Files | Main contents | Compressed bytes |
| --- | ---: | --- | ---: |
| Void Main Ship | 66 | modular player base, damage states, engines, engine FX, shields, weapons, projectiles, source files | 136,444 |
| Void Enemy Fleet 1 / Kla'ed | 129 | eight ship classes, engines, weapons, shields, destruction, projectiles, previews, sources | 4,723,286 |
| Void Enemy Fleet 2 / Nairan | 126 | eight ship classes, engines, weapons, shields, destruction, projectiles, previews, sources | 3,813,235 |
| Void Enemy Fleet 3 / Nautolan | 132 | eight ship classes, engines, weapons, shields, destruction, projectiles, previews, sources | 3,489,754 |
| Void Environment Pack | 24 | asteroid, explosion/flame, layered starfield, planet, source files | 1,941,741 |
| Void Pickups Pack | 25 | engine, shield, and weapon pickup icons plus sources | 113,762 |
| Music | 1 | `track1.ogg` | 5,937,850 |
| Galalaxy UI | 14 | title, start, upgrade, boss, and victory frames plus optimized derivatives | 6,589,940 |

### File formats

| Format | Files | Purpose |
| --- | ---: | --- |
| PNG | 213 | Runtime-ready bases, sprite strips, environment art, UI |
| Aseprite | 179 | Editable source artwork |
| GIF | 118 | Animated previews, not used by the runtime manifest |
| TXT | 6 | Foozle pack license/readme files |
| OGG | 1 | Music track |

## Runtime manifest

Galalaxy registers 154 PNG assets totaling 2.80 MiB compressed.

| Runtime group | Images | Loading role |
| --- | ---: | --- |
| `boot` | 8 | title/start essentials, player base/engine, basic environment |
| `shared` | 43 | player damage/module/projectile art, pickups, shared UI/environment |
| `klaed` | 34 | first fleet ships, effects, and projectiles |
| `nairan` | 33 | second fleet ships, effects, and projectiles |
| `nautolan` | 35 | third fleet ships, effects, and projectiles |
| `victory` | 1 | victory frame |

The groups overlap only through manifest classification; the 154 total entries are unique. Staged loading and unloading are worth preserving.

## Fleet class coverage

Every fleet contains base and destruction art for these eight classes:

- Scout
- Fighter
- Bomber
- Frigate
- Battlecruiser
- Dreadnought
- Support Ship
- Torpedo Ship

The first Vertical Slice needs the first four. Battlecruiser and Dreadnought are available for later escalation. Support and Torpedo Ship remain optional future roles.

### Kla'ed / Fleet Pack 1

Root: `assets/Foozle_2DS0012_Void_EnemyFleet_1/Kla'ed/`

| Category | PNG | Aseprite | Coverage |
| --- | ---: | ---: | --- |
| Base | 8 | 8 | all eight classes |
| Destruction | 8 | 8 | all eight classes |
| Engine | 8 | 8 | all eight classes |
| Shield | 7 | 7 | all except Support Ship |
| Weapons | 6 | 6 | Scout, Fighter, Frigate, Battlecruiser, Dreadnought, Torpedo Ship |
| Projectiles | 5 | 5 | Bullet, Big Bullet, Ray, Torpedo, Wave |

Additional pack material includes 34 GIF previews and a composite fleet preview.

**Vertical Slice use:** recommended enemy faction. Use class bases and engines first; add authored weapon and destruction strips as combat timing stabilizes.

### Nairan / Fleet Pack 2

Root: `assets/Foozle_2DS0013_Void_EnemyFleet_2/Nairan/`

| Category | PNG | Aseprite | Coverage |
| --- | ---: | ---: | --- |
| Base | 8 | 8 | all eight classes |
| Destruction | 8 | 8 | all eight classes |
| Engine Effects | 8 | 8 | all eight classes |
| Shields | 7 | 7 | all except Support Ship |
| Weapons | 6 | 6 | Scout, Fighter, Frigate, Battlecruiser, Dreadnought, Torpedo Ship |
| Projectiles | 4 | 4 | Bolt, Ray, Rocket, Torpedo |

Additional pack material includes 41 GIF previews and a composite fleet preview.

**Vertical Slice use:** recommended player faction. The muted green/blue hulls and lavender details contrast clearly with Kla'ed red/coral ships.

### Nautolan / Fleet Pack 3

Root: `assets/Foozle_2DS0014_Void_EnemyFleet_3/Nautolan/`

| Category | PNG | Aseprite | Coverage |
| --- | ---: | ---: | --- |
| Base | 8 | 8 | all eight classes |
| Destruction | 8 | 8 | all eight classes |
| Engine Effects | 8 | 8 | all eight classes |
| Shields | 7 | 7 | all except Support Ship |
| Weapons | 6 | 6 | Scout, Fighter, Frigate, Battlecruiser, Dreadnought, Torpedo Ship |
| Projectiles | 6 | 6 | Bomb, Bullet, Ray, Rocket, Spinning Bullet, Wave |

Additional pack material includes 43 GIF previews and a composite fleet preview.

**Vertical Slice use:** defer. Preserve as a coherent third faction for later development.

## Animation metadata already established in Galalaxy

The current code provides tested sprite-strip metadata for the six core ship classes in every fleet.

| Class | Source frame | Available layers |
| --- | ---: | --- |
| Scout | 64 px | base, engine, weapon, shield, destruction |
| Fighter | 64 px | base, engine, weapon, shield, destruction |
| Bomber | 64 px | base, engine, shield, destruction; projectile firing has no weapon overlay |
| Frigate | 64 px | base, engine, weapon, shield, destruction |
| Battlecruiser | 128 px | base, engine, weapon, shield, destruction |
| Dreadnought | 128 px | base, engine, weapon, shield, destruction |

Frame counts, FPS, release frames, and occasional corrected frame sizes differ by fleet/class. These values should be migrated as asset metadata, not recalculated from filename conventions.

## Projectile inventory

### Player/Main Ship projectiles

- Auto Cannon Bullet
- Rocket
- Zapper
- Big Space Gun

These provide useful neutral weapon visuals. The modular player ship itself is not the recommended unit faction, but its projectiles may suit structures or future technology if the visual language remains coherent.

### Kla'ed projectiles

- Bullet
- Big Bullet
- Ray
- Torpedo
- Wave

Existing runtime profiles cover straight fire, homing, acceleration, rectangular wave hitboxes, and boss telegraphs.

### Nairan projectiles

- Bolt
- Ray
- Rocket
- Torpedo

Existing runtime profiles emphasize faster precision fire and gentle homing.

### Nautolan projectiles

- Bomb
- Bullet
- Ray
- Rocket
- Spinning Bullet
- Wave

Existing runtime profiles emphasize slower, heavier shots.

### Reuse decision

Visual metadata and movement behaviors are suitable starting points. Damage, speed, lifetime, range, cadence, and hit size must be rebalanced for lane combat. Team colors must remain readable after an enemy fleet is rotated to face downward.

## Main Ship pack

Root: `assets/Foozle_2DS0011_Void_MainShip/`

Contents:

- four hull damage states
- four engine modules
- idle and powered engine strips
- four shield types
- four weapon modules
- four projectile types
- matching editable Aseprite sources

Potential Strategy Galalaxy uses:

- temporary HQ visual assembled from existing layers
- structure weapon or shield effects
- neutral projectile vocabulary
- future upgrade icons or technology illustrations

The main ship should not become a special player combat unit. HQ/structure placeholders must remain replaceable through asset keys.

## Environment pack

Root: `assets/Foozle_2DS0015_Void_EnvironmentPack/`

Contents:

- asteroid base and explosion
- asteroid flame effect
- layered and condensed starfield images
- earth-like planet with and without glow
- editable Aseprite sources

These assets suit the intended galaxy atmosphere. Use low contrast and low alpha so lanes, capture zones, structures, projectiles, and unit silhouettes remain dominant.

## Pickup pack

Root: `assets/Foozle_2DS0016_Void_PickupsPack/`

Contents:

- four engine icons
- four shield generator icons
- four weapon icons
- matching Aseprite sources

The pickup mechanic is excluded. Individual icons may later be adapted for upgrade buttons if they remain legible and semantically accurate. Economy and Turret Upgrade will probably need simpler purpose-built symbols.

## Galalaxy-specific UI assets

Root: `assets/ui/`

Registered families include:

- title command panel
- start-run button frame
- upgrade card frames
- boss alert frame
- victory command frame
- optimized runtime derivatives

The runtime derivatives reduce decoded RGBA size substantially, and the optimization workflow is useful. The actual frames are dark, neon, and tailored to survivor screens. They should not define the Strategy Galalaxy Command UI. Reuse only after a screen-level visual review.

## Audio

`assets/music/track1.ogg` is the only audio file. Combat cues are synthesized at runtime with Web Audio oscillators.

The repository does not contain a license or source record for `track1.ogg`. Do not copy or distribute this file in Strategy Galalaxy until provenance is documented. The synthesized cue implementation can be adapted, but the cue design should be updated for the new game.

## License and attribution

Each Foozle pack contains its own `Readme.txt`. All six packs state:

- Creative Commons Zero (CC0 1.0)
- commercial use and modification permitted
- attribution not required
- commissioned from Baldur and distributed by Foozle

When selected Foozle files are copied, also copy or consolidate the relevant CC0 notice and record the exact source path/commit in `docs/SOURCE_PROVENANCE.md`. Voluntary credit to Foozle/Baldur is recommended even though it is not required.

The Galalaxy repository itself has no root `LICENSE` file. The music and custom UI directories have no adjacent license record. Since both repositories share the same owner, code reuse is within the stated project authorization, but third-party distribution terms cannot be inferred from the public repository alone. Concrete copied code and non-Foozle assets must remain traceable.

## Curated first-slice asset plan

Copying occurs only when the relevant implementation bulk begins.

| Purpose | Initial source choice |
| --- | --- |
| Player Scout/Fighter/Bomber/Frigate | Nairan base + engine strips |
| Enemy Scout/Fighter/Bomber/Frigate | Kla'ed base + engine strips |
| Future capital classes | matching Nairan/Kla'ed Battlecruiser and Dreadnought |
| Unit death | matching destruction strips |
| Unit firing | matching weapon strips where available |
| Player projectiles | Nairan projectiles, recolored only if team readability requires it |
| Enemy projectiles | Kla'ed projectile family |
| HQ placeholder | Main Ship or capital-ship base behind an abstract structure frame |
| Defense Station placeholder | simple Canvas structure using selected weapon/module art |
| Energy Node placeholder | simple Canvas geometry; no gameplay dependency on a borrowed sprite |
| Background | subdued starfield/planet/asteroid selections |
| Audio | synthesized cues only until music provenance is resolved |

## Import rules for later bulks

1. Copy runtime files only; do not import preview GIFs or editable Aseprite sources unless they are needed for modification.
2. Keep asset names mapped through a manifest; gameplay code never embeds source paths.
3. Record every imported logical group in `docs/SOURCE_PROVENANCE.md`.
4. Include the applicable CC0 notice with distributed assets.
5. Validate every manifest path and sprite-strip dimension automatically.
6. Measure compressed and decoded size after each imported group.
7. Verify silhouettes at the smallest target viewport before importing polish layers.
8. Preserve replaceability for HQ, turret, and node placeholders.
