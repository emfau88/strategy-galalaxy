# Generated Assets

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
- **Runtime:** The existing rotating turret head remains code-driven. Team ownership is added as a strong Cyan/Coral ring, central glow and four perimeter beacons.
- **Status:** Retained as source history. Level 1 now uses the strict top-down v2 base and matching independent head; Level 2 keeps its original modular turret set.

## `defense-turret-head-topdown-v3.png`

- **Destination:** `assets/structures/defense-turret-head-topdown-v3.png`
- **Method / mode:** Built-in ImageGen, `stylized-concept`, then alpha-preserving downscaling to 384×384 for mobile delivery.
- **Purpose:** Independent rotating twin-barrel layer. Canvas controls pivot alignment, smooth target tracking, recoil, team indicator and damage response; simulation projectiles originate at the muzzle.
- **Prompt:** “Create one premium compact twin-barrel orbital defense cannon head only, perfectly top-down and forward-facing toward the top edge, centered for a code-driven rotation pivot. Crisp polished high-resolution pixel-art hybrid, neutral silver/blue-gray/pale-lavender armor with restrained practical lighting, readable at 38–44 pixels, transparent background. No platform, projectile, muzzle flash, UI, text, shadow, aura, team ring, watermark, perspective or excessive bloom.”
- **Status:** Active runtime asset.
