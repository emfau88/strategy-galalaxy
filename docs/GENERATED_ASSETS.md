# Generated Assets

## Unified fleet families

- **Destinations:** `assets/factions/unified/player-scout-v1.png`, `player-fighter-v1.png`, `player-bomber-v1.png`, `player-frigate-v1.png`, plus the corresponding four `enemy-*-v1.png` sprites.
- **Method / mode:** Built-in ImageGen, `stylized-concept`, followed by deterministic alpha-bounds extraction and normalization to transparent `384×384` runtime canvases with `scripts/split-fleet-atlas.py`.
- **Purpose:** Replace the mixed 64-pixel Nairan/Kla'ed hull vocabulary with two factions drawn at the same source resolution, camera angle, light direction, detail density and class scale.
- **Player prompt:** “Create exactly four distinct player fleet hull sprites in a perfectly regular 2-by-2 grid: Scout, Fighter, Bomber and Frigate, all pointing upward. Crisp high-resolution hand-painted 2D game assets, strict 90-degree top-down geometry, warm upper-left key light, cool navy fill, warm ivory ceramic armor, brushed brass trim, small living-green planted details, deep navy recesses and restrained cyan lamps. Transparent background; no text, UI, scenery, projectiles, perspective or overlap.”
- **Rival prompt:** “Create exactly four rival spacecraft matching the player sheet's orthographic camera, scale progression and lighting: Scout, Fighter, Bomber and Frigate. Use charcoal blue-black ceramic armor, copper/brass trim, muted burgundy panels and coral-red engines and team lights. Transparent background; no text, UI, scenery, projectiles, perspective or overlap.”
- **Status:** Active runtime hull and command-card assets. Legacy animation sheets remain source/fallback assets only and are no longer loaded during a match.

## `energy-relay-unified-v1.png`

- **Destination:** `assets/structures/energy-relay-unified-v1.png`
- **Method / mode:** Built-in ImageGen, `background-extraction`, then alpha-preserving downscale to `384×384`.
- **Purpose:** Bring Level 2's capturable relay into the same ivory ceramic, brass, glass and botanical material family as Orbital Garden.
- **Prompt:** “Create one compact neutral orbital energy relay in a strict 90-degree top-down view: a circular floating platform with four short cardinal arms, dark mechanical center, faceted pale aqua crystal, tiny planted moss/flower beds and restrained brass navigation lamps. Warm upper-left key light, cool navy fill, transparent background; no team logo, aura, capture ring, progress bar, ship, scenery, UI or watermark.”
- **Status:** Active runtime asset; ownership color and capture progress remain code-driven.

## Integrated HQ command HUD mockups

- **Destinations:** `docs/mockups/hud-integrated-collapsed-v1.png`, `docs/mockups/hud-integrated-hq-command-v1.png`
- **Method / mode:** Built-in ImageGen, high-fidelity `ui-mockup`, using the current Level-1 browser render as layout target and the approved Orbital Garden concept as art-direction reference.
- **Purpose:** Explore a hybrid HUD in which the normal battle view keeps only a compact command dock, while selecting the player HQ expands a touch-sized fleet/upgrade console without obscuring most of the battle.
- **Prompt direction:** Preserve the current portrait battlefield and right navigator; reduce the permanent lower HUD to HQ Command, queue icons and slots. In the expanded state, connect the selected HQ visually to a warm navy, ivory and brass console with Fleet/Upgrades tabs, four ship choices and a compact queue. Keep cyan/coral team readability, exact mobile-scale labels and at least 58% of the battle visible. Avoid generic neon, tiny controls and a full-screen menu.
- **Status:** Approved direction, now implemented as the runtime command-dock layout.

## `orbital-command-medallion-v1.png`

- **Destination:** `assets/ui/orbital-command-medallion-v1.png`
- **Method / mode:** Built-in ImageGen, modular in-game HUD asset, using the approved expanded HQ-command mockup as the visual reference; alpha-preserving downscale from `1254×1254` to `384×384` for runtime delivery.
- **Purpose:** Shared command identity for the compact dock, Fleet tab and selected player HQ.
- **Prompt:** “Create one square, perfectly front-facing 2D command emblem matching the attached mobile game HUD reference. A circular medallion with a deep midnight-navy enamel center, a crisp double rim of warm ivory ceramic and brushed brass, and a centered symmetrical luminous cyan fleet crest shaped like three elegant upward wings or leaves. Cozy premium space-garden aesthetic, clean painterly game UI, saturated cyan and amber accents, subtle warm edge highlights, high readability at 48–96 px. Transparent outside the medallion; no text, panel, ship, scenery or watermark.”
- **Status:** Active runtime asset.

## `strategy-galaxy-background-v1.png`

- **Destination:** `assets/environment/strategy-galaxy-background-v1.png`
- **Method:** Built-in ImageGen
- **Purpose:** Calm placeholder background for the portrait battle canvas.
- **Prompt:** “Calm, understated deep-space background that can be cropped vertically for a 420×760 portrait canvas; quiet navy-black interstellar void, sparse distant stars, a faint smoky blue nebula only at the edge, broad open central area, no ships, planets, asteroids, stations, UI, logos, text, or watermark.”
- **Status:** Temporary visual foundation; replace or refine after playtesting.

## Structure placeholders, top-down v1

- **Destinations:** `assets/structures/command-hq-topdown-v1.png`, `assets/structures/defense-turret-topdown-v1.png`, and `assets/structures/energy-relay-topdown-v1.png`
- **Method:** Built-in ImageGen, guided by the local Nairan frigate sprite as a style reference.
- **Purpose:** Replace geometric HQ, turret, and node placeholders with readable, top-down 2D game sprites.
- **Prompt direction:** Orthographic top-down view, compact pixel-art-like silhouette, dark outline, restrained navy/teal/lavender mechanical palette, no UI or text.
- **Status:** Retained as first-pass source material. Only the Energy Node remains active; its earlier team ring and orbit ellipse were replaced by a compact linear capture indicator.

## `defense-turret-base-topdown-v2.png`

- **Destination:** `assets/structures/defense-turret-base-topdown-v2.png`
- **Method / mode:** Built-in ImageGen, `stylized-concept`, then alpha-preserving downscaling to 384×384 for mobile delivery.
- **Purpose:** Neutral barrel-free platform for a modular Canvas turret head. Target following, team lamp, recoil, hit flash and damage states remain code-driven.
- **Prompt:** “Create a premium top-down modular defense turret base only, with no gun barrel and no weapon mounted; a circular armored platform with a clearly centered rotation socket. Isolated on transparent background, crisp polished high-resolution pixel-art hybrid, neutral silver and blue-gray armor with restrained teal/lavender details, readable at 55–65 pixels. No projectile, UI, text, shadow, neon aura, team ring, watermark, perspective or isometric angle.”
- **Status:** Active runtime asset.

## `command-hq-topdown-v3.png`

- **Destination:** `assets/structures/command-hq-topdown-v3.png`
- **Method / mode:** Built-in ImageGen, `production 2D game asset`, then alpha-preserving downscaling to 384×384 for mobile delivery.
- **Purpose:** Premium two-lane HQ base. Its two hangar interiors are revealed by Canvas masks at deployment; practical lamps, hit flash, desaturation, cracks and sparks communicate live state.
- **Prompt:** “Create a premium futuristic orbital fleet Headquarters viewed perfectly top-down, with exactly two distinct high-quality launch hangars aligned symmetrically toward the upper-left and upper-right battle-facing sides because ships deploy into two vertical lanes. No central hangar. Give each bay a deep mechanical mouth, segmented frame, runway guide lights and closed sliding armor. Use a broad hexagonal/octagonal silver, blue-gray and pale-lavender station with a central command core; transparent background; polished high-resolution pixel-art hybrid readable at 105–115 pixels. No ships, projectiles, UI, text, shadow, neon aura, team rings, watermark, perspective or excessive bloom.”
- **Status:** Active runtime asset. Both teams share it; the enemy instance is rotated 180°.

The earlier generated single-center-gate HQ concept was rejected during integration and is not kept in the repository.

## Orbital Garden Level 1 art pass

- **Destinations:** `assets/environment/orbital-garden-background-v1.png`, `assets/structures/orbital-sunwell-v2.png`, `assets/structures/orbital-garden-hq-v2.png`
- **Method / mode:** Built-in ImageGen using the approved `level-1-orbital-garden-concept-v1.png` as the exact art-direction reference; `background-extraction` and targeted `precise-object-edit` passes.
- **Purpose:** A cozy inhabited single-lane world matching the approved mockup: garden asteroids, warm navigation lights, blue-violet nebulae, a dominant golden Sunwell and large biosphere headquarters.
- **Prompt direction:** Preserve the mockup's ivory stone, brass, vegetation, warm amber light and restrained cyan team accents. Isolate one structure, keep it centered and fully visible, remove ships, UI, text and unrelated scenery. Checkerboard artifacts from the extraction pass were replaced with uniform black for Canvas `screen` compositing.
- **Runtime:** The `932×1688` background is rendered proportionally as a `420×760` world. Sunwell and HQ remain independent layers so gameplay units and structure state can animate above them.
- **Status:** Active Level-1 runtime assets. Level 2 retains its existing art.

## Orbital Garden expanded world and rival structure pass

- **Destinations:** `assets/environment/orbital-garden-rival-sector-v1.png`, `assets/environment/orbital-garden-player-sector-v1.png`, `assets/structures/orbital-garden-hq-rival-v1.png`, `assets/structures/orbital-garden-turret-base-v2.png`, `assets/structures/orbital-garden-turret-head-v1.png`
- **Method / mode:** Built-in ImageGen, production 2D game asset mode, using the approved `level-1-orbital-garden-concept-v1.png` as the visual reference.
- **Purpose:** Restore the tall scrollable Level-1 battlefield without stretching, give the rival HQ a correct downward-facing authored view, and resolve the map/ship perspective mismatch with a strictly orthographic modular turret.
- **Prompt direction:** Two complementary portrait sectors with an open central flight corridor, edge-hugging garden asteroids, mist and warm navigation lights; lower sector with the mockup's planet limb. Rival garden HQ facing down toward the battlefield with coral identity. Turret base and twin-barrel head viewed at a strict 90-degree top-down angle, in ivory stone, brass and living garden materials, isolated on black for Canvas screen compositing. No ships, UI, text or logos.
- **Runtime:** Each `932×1688` sector is aspect-cropped into one `420×640` world section. The sections overlap by 100 world pixels and are blended once into a cached `420×1180` canvas, preserving geometry without a hard seam or per-frame multi-pass cost. HQs, Sunwell, turret bases and rotating heads remain independent runtime layers.
- **Status:** Active Level-1 runtime assets.

## `orbital-garden-turret-v1.png` (superseded)

- **Destination:** `assets/structures/orbital-garden-turret-v1.png`
- **Method / mode:** Built-in ImageGen, `stylized-concept`, using the approved Orbital Garden mockup as material and perspective reference.
- **Purpose:** Replace Level 1's cold blue mechanical turret base with a readable garden defense platform that belongs to the Sunwell/HQ family.
- **Prompt direction:** Compact ivory-stone and brass emplacement, dark rotating socket, planted garden beds, warm lamps and neutral cyan conduits on a uniform black compositing background; no mounted weapon, ships, UI or scenery.
- **Runtime:** The existing rotating turret head remains code-driven. The former Cyan/Coral ring and central glow were removed; only four compact diamond beacons remain as ownership cues.
- **Status:** Retained as source history. Level 1 now uses the strict top-down v2 base and matching independent head; Level 2 keeps its original modular turret set.

## `defense-turret-head-topdown-v3.png`

- **Destination:** `assets/structures/defense-turret-head-topdown-v3.png`
- **Method / mode:** Built-in ImageGen, `stylized-concept`, then alpha-preserving downscaling to 384×384 for mobile delivery.
- **Purpose:** Independent rotating twin-barrel layer. Canvas controls pivot alignment, smooth target tracking, recoil, team indicator and damage response; simulation projectiles originate at the muzzle.
- **Prompt:** “Create one premium compact twin-barrel orbital defense cannon head only, perfectly top-down and forward-facing toward the top edge, centered for a code-driven rotation pivot. Crisp polished high-resolution pixel-art hybrid, neutral silver/blue-gray/pale-lavender armor with restrained practical lighting, readable at 38–44 pixels, transparent background. No platform, projectile, muzzle flash, UI, text, shadow, aura, team ring, watermark, perspective or excessive bloom.”
- **Status:** Active runtime asset.

## Unified fleet engine animation strips

- **Destinations:** `assets/effects/player-engine-strip-v1.png`, `assets/effects/enemy-engine-strip-v1.png`
- **Method / mode:** Built-in ImageGen, new raster VFX generation, followed by deterministic grid extraction and normalization with `scripts/process-vfx-atlas.py`.
- **Purpose:** Replace the temporary procedural exhaust ellipses with authored, time-varying engine art that remains crisp behind the new high-resolution hulls.
- **Player prompt direction:** “Professional 2D game VFX sprite sheet on pure black, strict 4×2 grid with eight chronological phases of one top-down spaceship engine plume pointing downward. Cyan-white plasma core, restrained electric-blue bloom and tiny warm-gold sparks, polished premium mobile strategy-game art, isolated effect only, consistent nozzle origin, no ship, UI, text, border or checkerboard.”
- **Rival prompt direction:** “Professional 2D game VFX sprite sheet on pure black, strict 4×2 grid with eight chronological phases of one top-down spaceship engine plume pointing downward. White-hot core, orange-red and coral flame, sparse copper sparks, aggressive but clean premium mobile strategy-game art, isolated effect only, consistent nozzle origin, no ship, UI, text, border or checkerboard.”
- **Runtime:** Each normalized `1024×256` strip contains eight `128×256` frames. The renderer cycles at 12 FPS with a stable per-unit phase offset and class-specific hardpoints.
- **Status:** Active runtime assets.

## Unified no-exhaust fleet hulls, v2

- **Destinations:** `assets/factions/unified/player-{scout,fighter,bomber,frigate}-v2.png` and `assets/factions/unified/enemy-{scout,fighter,bomber,frigate}-v2.png`
- **Method / mode:** Eight separate Built-in ImageGen `precise-object-edit` passes, followed by deterministic checkerboard extraction and class-aligned transparent normalization with `scripts/normalize-generated-cutout.py`.
- **Purpose:** Remove the baked static flame from every hull, reconstruct credible dark nozzle mouths and let the existing eight-frame engine atlases own all emitted thrust.
- **Player prompt set:** For each player Scout, Fighter, Bomber and Frigate: “Remove only every bright cyan engine exhaust flame extending outside the ship below its rear nozzle or nozzles. Reconstruct clean closed rear nozzle mouths and transparent space immediately behind them. Preserve exactly the strict top-down silhouette, class identity, ivory ceramic, brass trim, cyan hull lamps, planted flowers, lighting and framing. No redesign, new parts, crop, shadow, external glow, exhaust, smoke, UI, text or watermark.”
- **Rival prompt set:** The equivalent four per-class edits, preserving charcoal/navy ceramic, copper/brass, burgundy panels and coral hull lamps while removing only emitted red/coral plumes and reconstructing the nozzle mouths.
- **Runtime:** All sprites share a `384×384` transparent canvas and class-specific bottom alignment, so the animated plume begins exactly at the rear hardware. Earlier `v1` hulls remain retained source history.
- **Status:** Active runtime hull and command-card assets.

## Team-integrated Orbital Garden turret bases, v3

- **Destinations:** `assets/structures/orbital-garden-turret-player-v3.png`, `assets/structures/orbital-garden-turret-rival-v3.png`
- **Method / mode:** Two separate Built-in ImageGen `precise-object-edit` passes from `orbital-garden-turret-base-v2.png`.
- **Purpose:** Replace the last persistent code-drawn ownership diamonds with physical practical lights mounted inside the authored structure.
- **Player prompt:** “Change only the existing rectangular amber practical lamps around the platform and its four cardinal modules to restrained cyan/aqua emission. Keep the warm amber sun medallions and architectural light unchanged. Preserve exact geometry, empty central rotation socket, strict top-down camera, ivory stone, brass, garden beds, lighting and black compositing background. No external marker, ring, floating beacon, weapon, UI or text.”
- **Rival prompt:** The same constrained edit with coral-red practical lamps instead of cyan/aqua.
- **Status:** Active runtime turret bases for both maps; the independent rotating head, recoil and muzzle flash remain shared.

## Unified faction projectile families

- **Destinations:** `assets/projectiles/unified/player-{scout-pulse,fighter-laser,siege-missile,heavy-cannon}-v1.png`, `assets/projectiles/unified/enemy-{scout-pulse,fighter-laser,siege-missile,heavy-cannon}-v1.png`
- **Method / mode:** Built-in ImageGen, new raster game-asset generation, then deterministic 2×2 atlas extraction to individual `192×192` black-backed sprites with `scripts/process-vfx-atlas.py`.
- **Purpose:** Make weapon class and firing faction readable from silhouette and palette, not only from a thin code-drawn streak.
- **Player prompt direction:** “Professional top-down 2D projectile asset sheet on pure black, strict 2×2 grid: compact cyan orbital scout plasma pulse; long narrow cyan-white fighter laser lance; ivory-and-brass guided missile with cyan stripe and exhaust; broad cyan crystal heavy cannon shell with brass casing. Cohesive premium mobile strategy-game style, isolated centered projectiles pointing upward, restrained bloom, no ships, UI, text, border or checkerboard.”
- **Rival prompt direction:** “Professional top-down 2D projectile asset sheet on pure black, strict 2×2 grid: angular coral scout energy shard; forked coral-red fighter beam; charcoal-and-copper torpedo with coral stripe and exhaust; chunky copper/crimson heavy cannon shell. Cohesive premium mobile strategy-game style, isolated centered projectiles pointing upward, restrained bloom, no ships, UI, text, border or checkerboard.”
- **Runtime:** Projectile bodies rotate along their velocity vector. Existing bounded trails and hit glows remain supplemental effects; they no longer define the projectile silhouette.
- **Status:** Active runtime assets.

## Level 2 visual-direction mockups

- **Destinations:** `docs/mockups/level-2-lantern-trade-routes-v1.png`,
  `docs/mockups/level-2-twin-foundries-v1.png`, and
  `docs/mockups/level-2-cloudsea-sanctuaries-v1.png`
- **Method / mode:** Three separate Built-in ImageGen `precise-object-edit` passes using
  the current `420×760` Level-2 browser capture as the authoritative composition and UI
  reference.
- **Purpose:** Compare three production directions for the Twin Fronts environment while
  holding the two-lane layout, mobile HUD, ships, structures and navigation rail as
  constant as possible.
- **Shared prompt contract:** “Redesign only the playable world behind and around the
  existing gameplay objects. Preserve the portrait mobile composition, top and bottom
  HUD, right navigation rail, two-lane geometry, HQs, turrets, ships, projectiles and
  health bars. Keep open contrast pockets around combat. No new UI, text, labels,
  watermark, landscape framing, distorted HUD or generic empty starfield.”
- **Lantern Trade Routes prompt direction:** Two inhabited orbital-garden trade routes
  guided by cultivated islands, warm lantern chains, sparse bridges and botanical
  stations, divided by a dark blue-violet rift. Premium painterly ivory, brass,
  vegetation and restrained cyan/coral faction accents; cozy but less dense than Level
  1.
- **Twin Foundries prompt direction:** Two fortified industrial routes surrounding a
  fractured ancient solar forge, with aged brass rails, foundry platforms, furnace
  windows and cargo lights. Warm handcrafted machinery rather than sterile gray science
  fiction; the brightest forge material remains in the central divide.
- **Cloudsea Sanctuaries prompt direction:** Two sanctuary routes above a luminous
  violet-blue cloud ocean, with pale terraces, copper observatories, gardens, pennants
  and ancient constellation gates. Dreamlike science fantasy with protected dark combat
  pockets and restrained faction-colored foliage.
- **Status:** Visual targets only, not runtime assets. Direction comparison and production
  recommendation are documented in `docs/LEVEL_2_VISUAL_DIRECTIONS.md`.

## Twin Foundries / Cloud Rift final target and runtime sectors

- **Destinations:** `docs/mockups/level-2-twin-foundries-cloud-rift-final-v1.png`,
  `assets/environment/twin-foundries-rival-sector-v1.png`, and
  `assets/environment/twin-foundries-player-sector-v1.png`.
- **Method / mode:** Built-in ImageGen. The final target used the earlier Twin Foundries
  and Cloudsea concepts as references. The two runtime images were separate
  background-only extraction/generation passes from that approved target.
- **Final target prompt direction:** Combine the foundry identity with only restrained
  cloud depth: 55–60% open dark navy/black combat space, 25–30% edge-weighted foundry
  architecture and 10–15% low-contrast violet-blue cloud rift. Keep small gardens and
  warm lamps; avoid a bright cloud ocean, full orange coverage or dense machinery in
  either firing corridor.
- **Rival-sector prompt direction:** Remove all ships, HQs, turrets, UI and text. Keep
  charcoal/copper rival foundry architecture at the edges, sparse coral practical
  lamps, protected dark corridors at 25% and 75% width and a calm lower overlap zone.
- **Player-sector prompt direction:** Produce the complementary ivory/brass lower
  foundry with restrained cyan lamps and conduits, the same protected corridors and a
  calm upper overlap zone. No gameplay objects or baked ownership markers.
- **Runtime:** Both portrait sectors are aspect-cropped and blended into the existing
  `420×1180` world. Simulation geometry is unchanged. Subtle code-driven lane beacons
  remain separate from the art.
- **Status:** Active Level-2 runtime background family. Final real-device seam/contrast
  tuning remains in the Product Polish Roadmap.
