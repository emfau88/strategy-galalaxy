# Product Polish Roadmap

This roadmap turns the current visual review into implementation-sized work packages.
The order is deliberate: readability rules and reusable systems come first; expensive
map and asset production follows only after those rules are measurable.

## Bulk 1 – Readability baseline and visual budgets

**Goal:** Establish objective limits before producing more artwork, so richer scenes do
not make combat harder to read.

- [ ] Define protected combat corridors for both levels: maximum background brightness,
  saturation and local detail behind normal engagement bands.
- [ ] Record reference captures at 360×800, 390×844, 412×915 and 420×760 for top,
  center and bottom camera positions.
- [ ] Add deterministic QA scenes for early Drones, mixed fleets, bomber attacks,
  Frigate broadsides, damaged structures and active upgrades.
- [ ] Measure minimum on-screen sizes for ship silhouettes, projectile bodies, health
  bars and navigation-rail markers.
- [ ] Establish a visual-priority order: critical combat feedback, units, structures,
  world landmarks, environmental decoration.

**Deliverable:** A small capture matrix and a written contrast/density contract used by
all later bulks.

**Done when:** Every later asset can be checked against the same scenes without relying
only on taste or a single screenshot.

## Bulk 2 – Level 2 environment rebuild

**Goal:** Raise Twin Fronts from functional prototype quality to the visual standard of
Orbital Garden while preserving its clearer two-lane tactics.

- [ ] Select one direction from
  [Level 2 Visual Directions](LEVEL_2_VISUAL_DIRECTIONS.md); recommended base is Lantern
  Trade Routes.
- [ ] Design separate rival, neutral and player regions across the full `420 × 1180`
  scroll world.
- [ ] Generate or paint background-only sectors with edge-weighted scenery and open
  firing corridors.
- [ ] Create an independent low-contrast mist/parallax layer and sparse beacon overlay.
- [ ] Introduce one landmark per lane in the contested middle instead of one object
  spanning both fronts.
- [ ] Add restrained faction progression: coral/copper in the upper region, neutral gold
  in the center, cyan/ivory in the lower region.
- [ ] Tune cropping, overlap and blending so no mobile viewport stretches the artwork.
- [ ] Validate top, center, bottom and dense-combat captures on all target viewports.

**Deliverable:** A complete Level-2 background family plus optional mist/beacon overlays,
integrated without changing simulation geometry.

**Done when:** Level 2 is visually recognizable in isolation, both lanes remain readable
at 360 pixels wide and no combat class loses silhouette contrast.

## Bulk 3 – Unit hierarchy and Drone identity

**Goal:** Make fleet composition understandable before the user reads labels.

- [ ] Author a dedicated Drone hull smaller and simpler than the Scout, with one clear
  engine and reduced ornament.
- [ ] Preserve faction material rules while giving each class a unique outer contour.
- [ ] Recheck battlefield scale, selection cards, queue icons and damage silhouettes for
  all eight active faction/class combinations plus Drones.
- [ ] Keep formation spacing large enough that adjacent silhouettes do not merge into
  one thorn-like mass.
- [ ] Ensure Player cyan accents remain visible over Level 1's blue nebula and ivory
  structures; use a thin dark keyline or warmer white core where required.
- [ ] Keep Rival coral equally readable without letting it dominate the entire scene.

**Deliverable:** Dedicated player/rival Drone assets and a revised class-size/contrast
table shared by battlefield and command UI.

**Done when:** A tester can distinguish Drone, Scout, Fighter, Bomber and Frigate from a
native-resolution combat capture without seeing their names.

## Bulk 4 – Turrets and structure ownership

**Goal:** Make every defensive structure read as an armed, team-owned gameplay object
rather than a decorative shrine.

- [ ] Redesign Level-1 and Level-2 turret heads with an unmistakable barrel axis and
  readable muzzle at 40–60 display pixels.
- [ ] Preserve physical recoil and make it originate from the authored barrel assembly.
- [ ] Increase integrated cyan/coral ownership lights without returning to floating code
  rings or diamonds.
- [ ] Give Level 2 a structure material variant appropriate to the selected environment,
  while retaining the same collision and weapon logic.
- [ ] Create visually escalating turret states for Bastion levels: additional armor,
  brighter capacitors or reinforced barrel housing.
- [ ] Verify intact, firing, recoiling, damaged and destroyed states over both maps.

**Deliverable:** Clearly armed modular turrets, team variants and Bastion progression
states for both map families.

**Done when:** Ownership and facing direction are readable without a health bar or HUD
marker.

## Bulk 5 – Projectile, damage and combat-feedback hierarchy

**Goal:** Preserve the improved pacing while making every weapon family and hit result
instantly understandable.

- [ ] Tune Player projectile cores against bright cyan/blue backgrounds; retain faction
  color in the bloom, but use a warm-white central body for contrast.
- [ ] Shorten only the visually excessive full-screen streaks while preserving slower
  projectile travel and class identity.
- [ ] Keep Scout pulses compact, Fighter lances narrow, missiles segmented and heavy
  shells broad and sequential.
- [ ] Strengthen hull-local hit flashes, shield ripples, sparks and short damage trails so
  feedback stays attached to the damaged ship.
- [ ] Add escalating persistent damage states for large ships and structures without
  covering their silhouette.
- [ ] Verify projectile caps and trail budgets in dense 90-second stress scenes.

**Deliverable:** A balanced combat-feedback pass with team-readable projectiles and
damage states that remain clear over both environments.

**Done when:** Testers can identify firing faction, weapon class and damaged target from
the animation alone.

## Bulk 6 – Navigation rail and battlefield awareness

**Goal:** Make the tall map understandable without turning the rail into a traditional
mini-map full of noise.

- [ ] Widen the interactive rail slightly on narrow screens while keeping the visible
  footprint restrained.
- [ ] Replace ambiguous dots with a small, consistent legend of fleet, turret, HQ,
  impact and camera-window shapes.
- [ ] Cluster large fleets rather than drawing every unit individually.
- [ ] Emphasize offscreen damage, structure danger and active major battles through short
  pulses, not permanent brightness.
- [ ] Make lane separation explicit on Level 2 and keep the single route unmistakable on
  Level 1.
- [ ] Add a first-match contextual hint that disappears permanently after successful use.

**Deliverable:** A more readable navigation rail with touch-safe scrolling and event
signals.

**Done when:** A new user can find an offscreen battle and return to their HQ without
trial-and-error dragging.

## Bulk 7 – Integrated HUD and message cleanup

**Goal:** Reduce debug-like text and make resource, AI and wave information readable at
a glance.

- [ ] Replace abbreviations such as `N7` and unexplained `RIVAL +1` with icons, concise
  labels or contextual tooltips/tutorial moments.
- [ ] Move AI status messages out of the center firing area into a compact tactical-status
  slot near the command console or navigation rail.
- [ ] Resolve message priority so errors, upgrade activation, wave lock and AI intent do
  not overlap one another.
- [ ] Increase the smallest upgrade and economy text to the agreed mobile minimum.
- [ ] Keep the collapsed HQ console compact; preserve the larger panel only while the
  user is actively choosing fleets or upgrades.
- [ ] Add selected, pending, unaffordable and activating states with consistent brass,
  cyan and muted treatments.

**Deliverable:** A single HUD hierarchy for resources, wave timing, tactical information
and actionable feedback.

**Done when:** No important message overlaps ships or structures and first-time players
can explain every persistent HUD value.

## Bulk 8 – Visible upgrade progression

**Goal:** Make investment choices feel tangible in the world, not merely numerical.

- [ ] Reactor: brighten and expand authored energy conduits on the HQ and reflect the
  increased income through a restrained activation pulse.
- [ ] Arsenal: enhance muzzle hardware, projectile core and impact signature per level.
- [ ] Bastion: use the turret armor/capacitor states produced in Bulk 4.
- [ ] Hangar: visibly open or illuminate additional HQ bays as wave slots increase.
- [ ] Show pending upgrades physically but incompletely before the next wave, then play a
  clear activation transition.
- [ ] Keep each upgrade readable at normal camera distance and color-safe for both teams.

**Deliverable:** Level-based HQ, turret and weapon presentation tied directly to existing
economy state.

**Done when:** A screenshot comparison can reveal which upgrade path a player chose
without opening the upgrade panel.

## Bulk 9 – Main menu and level selection polish

**Goal:** Turn the good atmospheric title screen into a distinctive, honest storefront
for both maps.

- [ ] Create a bespoke `Strategy Galalaxy` wordmark or title lockup that remains readable
  at 360 pixels wide.
- [ ] Replace the plain level field with two compact preview cards using actual Level-1
  and final Level-2 artwork.
- [ ] Show lane count and one-line tactical identity without tiny descriptive copy.
- [ ] Integrate music/fullscreen controls into the same brass/navy panel language as the
  central menu.
- [ ] Improve difficulty selection with a short behavioral description and clear selected
  state.
- [ ] Keep the menu background performant and avoid promising scenery that a selected
  level does not deliver.

**Deliverable:** Branded title lockup, honest level-preview selection and unified utility
controls.

**Done when:** The first screen communicates brand, selected map, difficulty and primary
action in under five seconds on the smallest viewport.

## Bulk 10 – Final cohesion, performance and release gate

**Goal:** Validate the product as one coherent mobile experience after all visual work.

- [ ] Run full match captures on both levels at every target viewport and camera region.
- [ ] Test early, mid and late battle density with all upgrade paths represented.
- [ ] Compare Player/Rival readability under equivalent situations and correct any color
  or contrast advantage.
- [ ] Verify background cache size, memory use, draw-call count, projectile caps and long
  session stability on mobile-class hardware.
- [ ] Run short blind tests for class recognition, structure ownership, navigation and
  upgrade recognition.
- [ ] Update README screenshots, art-direction rules, asset inventory, generated-asset
  provenance and roadmap completion state.

**Deliverable:** Final comparison gallery and a signed-off release checklist.

**Done when:** Both maps, the title screen and all major gameplay states meet the same
readability and art-direction standard without performance regression.

## Recommended delivery sequence

1. **Foundation:** Bulk 1.
2. **Largest visual gap:** Bulk 2.
3. **Core combat readability:** Bulks 3–5.
4. **User orientation and controls:** Bulks 6–7.
5. **Progression payoff:** Bulk 8.
6. **Front door and final cohesion:** Bulks 9–10.

Bulks 3 and 4 can be produced in parallel after Bulk 1, but integration should still be
validated against the final Level-2 contrast zones from Bulk 2. Bulk 8 intentionally
depends on the final HQ and turret structure language rather than creating temporary
upgrade overlays.

