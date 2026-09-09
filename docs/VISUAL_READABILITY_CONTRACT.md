# Visual Readability Contract

This contract is the acceptance baseline for both tall battlefields. It protects
gameplay information from increasingly detailed environment art.

## Priority order

1. Damage, danger and immediate input feedback.
2. Ship silhouette, facing and faction.
3. Projectile body, direction and weapon family.
4. Active structures, health and capture state.
5. Strategic landmarks and lane identity.
6. Decorative world detail.

Lower-priority layers must be reduced before a higher-priority layer is enlarged or
covered with extra UI.

## Protected combat corridors

### Level 1 – Orbital Garden

- Primary corridor: `x=100…320` around the single center lane.
- Background behind the normal engagement band must remain predominantly deep navy.
- Bright Sunwell and HQ material is allowed only because those structures create fixed,
  predictable local encounters; projectile cores must remain visible across them.

### Level 2 – Twin Foundries

- Left corridor: `x=42…168`, centered on `x=105`.
- Right corridor: `x=252…378`, centered on `x=315`.
- Foundry architecture belongs outside these ranges or behind the lowest-detail parts of
  them.
- The violet Cloud Rift is concentrated around the central divide `x=180…240` and may
  cross a lane only as a dark, soft-edged mist.
- Bright forge windows, rails and debris may frame a corridor but never form a continuous
  high-contrast line behind projectile travel.

## Native mobile minimums

- Smallest active hull body: approximately 20 visible pixels after transparent padding
  is removed.
- Projectile body: at least 3 bright pixels across or a persistent class-shaped trail.
- Structure health bar: at least 3 pixels high; HQ bars at least 5 pixels.
- Persistent text: 9 design pixels minimum; action labels should target 10–11.
- Touch targets: 36 design pixels minimum, preferably 42 or more for primary controls.
- Navigation markers: at least 3 pixels, with clustering rather than sub-pixel overlap.

## Color and contrast rules

- Player: warm-white projectile core with cyan/aqua bloom and dark silhouette keyline.
- Rival: warm-white or pale-coral core with coral/red bloom and dark silhouette keyline.
- Neutral world lights: amber/gold; they must not imitate projectile-shaped streaks.
- The environment may be saturated at the edges, but normal firing corridors must stay
  below the visual intensity of a live engine or projectile body.
- Avoid large cyan nebula patches behind Player units and large coral/orange fires behind
  Rival units.

## Capture matrix

The browser QA run must retain native screenshots for:

- title screen and pause screen;
- Level 1 player and center sectors;
- Level 2 player, center and rival sectors;
- collapsed and expanded command dock;
- pending and active upgrades;
- damaged structures;
- a dense mixed-fleet combat moment.

Target viewports are `360×800`, `390×844`, `393×852`, `412×915` and `420×760`.
The smallest viewport is the readability authority; larger captures verify composition
and scrolling rather than permitting smaller gameplay marks.

## Review questions

- Can both lanes be located within two seconds without reading the HUD?
- Can Drone, Scout, Fighter, Bomber and Frigate be separated by silhouette?
- Can firing faction and weapon family be identified from a single salvo?
- Is the damaged target clearer than the background landmark behind it?
- Are offscreen events understandable from the navigation rail?
- Does opening the command dock hide only space the player intentionally traded for
  controls?

