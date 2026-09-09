# Strategy Galalaxy – Game Design Contract

This document is the implementation-facing gameplay contract. The product direction is defined in [`STRATEGY_GALALAXY_CORE_VISION.md`](../STRATEGY_GALALAXY_CORE_VISION.md).

## Core loop

Strategy Galalaxy is a portrait, single-player, two-lane auto-battler. Combat, movement, projectiles, capture and Energy income run continuously. The player observes both persistent fronts and prepares the next reinforcement wave while the current fleets keep fighting.

Every 22 seconds both teams deploy simultaneously. The final two seconds are locked. Surviving units, structure damage, Node ownership and capture progress persist across the boundary. A new countdown starts immediately; no planning pause interrupts combat.

The primary match ends only when a Headquarters is destroyed.

## Battlefield

- Exactly two isolated, wide corridors: Left and Right, on a `420 x 1180` world.
- Player Headquarters and turrets are at the bottom; enemy structures mirror them at the top.
- Each lane contains one capturable Energy Node.
- Both lanes remain visible side by side while direct vertical drag moves between sectors.
- A slim strategic navigator shows objectives, structures, fleet pressure and the current view.
- Units retain their lane for life but use local horizontal offsets for formations and separation.
- The vertical geometry is mirrored around the Node axis so neither team receives a distance advantage.

## Deployment and queues

- A match opens with a free symmetric base wave so the battlefield is active immediately.
- Each later boundary adds three free Drones per lane and team. Every 150 active seconds this rises by one, capped at five. Drones keep the front active but are deliberately fragile and weak against structures; Scouts remain purchased capture specialists.
- A team begins with four paid reinforcement slots per deployment across both lanes combined; active logistics research can raise this to six.
- Buying reserves the full Energy cost immediately.
- Removing an entry before lock-in refunds its full cost.
- During the final two seconds additions, removal and upgrades are rejected.
- Deployment is timer-driven only; there is no manual deploy command.
- Existing lane capacity is respected. Entries that cannot spawn remain as deterministic backlog rather than vanishing.
- Delivered ships launch visibly from their lane-facing HQ hangar, remain untargetable during the short launch traversal, then join their role formation. A hangar opens only when that team and lane actually deliver at least one ship.
- The normal HUD reveals only the number of enemy reinforcements, not their types.

## Economy and upgrades

Energy is generated continuously from base income and controlled Nodes and is capped so saving remains a choice rather than an unlimited stockpile. Gentle escalation multipliers and the late Drone ramp discourage stalemates. Every purchase competes in the same Energy budget. Exactly one economy, weapons, turret or logistics project may be pending per team and deployment cycle; its effect becomes active only at the next deployment boundary. Weapons improve fleet damage; logistics adds paid reinforcement capacity. Spending telemetry groups choices into fleet, economy and research so their opportunity cost can be measured.

Current data-driven defaults:

| Rule | Value |
| --- | ---: |
| Starting Energy | 300 |
| Energy cap | 780 |
| Base income | 16/s |
| Controlled Node bonus | 7/s |
| Paid reinforcement slots | 4 |
| Free Drones | 3 per lane/deployment, +1 every 150 s, max. 5 |
| Economy upgrades | +22% base income/level, max. level 2 |
| Weapons research | +12% fleet damage/level, max. level 3 |
| Logistics research | +1 paid slot/level, max. level 2 |
| Turret upgrades | max. level 4 |
| Deployment interval | 22 s |
| Queue lock-in | final 2 s |

## Fleet roles

| Ship | Purpose | Targeting and weapon identity | Capture |
| --- | --- | --- | ---: |
| Drone | Automatic skirmish screen | Tiny pulse; poor against heavy ships and structures | 0.2 |
| Scout | Fast map control | Light pulse; avoids wasting time on heavies when the Node is open | 2.0 |
| Fighter | Anti-light escort | Rapid bolt/ray; prioritizes Bombers and light craft | 1.0 |
| Bomber | Siege and anti-heavy | Visible accelerating homing missile; prefers turrets, HQ and Frigates | 0.5 |
| Frigate | Durable frontline anchor | Slower, weightier cannon shot and high durability | 0.75 |

Deployment cycles create deterministic squads with a shared moving anchor. Role offsets put Scouts into a wide screen, Fighters on separated escort wings, Frigates near the heavy front and Bombers in a broad rear line. Repeated rows are offset by 36 world units. Ships accelerate toward their slot and match formation velocity instead of jumping directly to full speed. Enlarged visual spacing radii prevent large sprites from stacking while gameplay collision radii remain independent. During engagement, ships retain more of their lateral formation offset and stop around 90–94% of weapon range instead of collapsing onto the target. Targets remain sticky while valid and within their leash. Frigates and later capital ships maneuver to a perpendicular firing posture and only fire once their broadside is aligned.

## Structures, capture and health

Headquarters and turrets fire automatically and retain damage. Capture strength from all ships inside a Node is additive; opposing power is subtracted and near-equal power contests the Node.

Turret platforms and weapon heads are separate presentation layers. The head tracks its authoritative target smoothly, recoils, and places turret projectiles at the muzzle. HQ hangars, practical lamps and damage layers remain renderer-owned and never decide whether a deployment or hit occurred.

Permanent health bars are reserved for Headquarters and turrets. Unit bars appear only after damage. Visual hierarchy must read as `HQ >>> Turret > Frigate > Bomber/Fighter > Scout` without enlarging ships until real-device tests show a readability failure.

## Combat presentation

Nairan represents the player and Kla'ed the opponent. Runtime visuals layer engine animation behind the hull, weapon animation over it, shield feedback on damage and a class-specific destruction strip on death. Animation frames never decide damage or hit timing.

Projectile behavior and projectile art are separate data. Scouts use paired small shots, Fighters fast three-projectile salvos, Bombers missiles/torpedoes with bounded homing and real position trails, and Frigates fire three heavy rounds from hull-spaced broadside hardpoints. Salvo damage is divided between projectiles, so spectacle does not secretly multiply DPS. Muzzle flashes, hit sparks and explosions remain short and size-aware. Shield feedback lasts longer on heavy ships, and destruction strips preserve the ship's final heading.

Budgets are bounded. In particular, each team and lane has its own projectile allowance, with a higher global cap retained only as a safety net. Partial salvos degrade safely at the cap. This prevents one busy lane from suppressing the other team’s fire. Recent offscreen hits and destructions pulse at their world position on the strategic navigator while the existing throttled combat audio remains audible.

## Mobile interface

The top HUD prioritizes both HQ health values and the deployment countdown. Energy and income remain compact. The normal battle view keeps only a slim Command, queue and slot dock; tapping the player HQ or Command expands the contextual planning console and provides:

- Left/Right selection and visible friendly queue icons;
- Scout, Fighter, Bomber and Frigate purchase buttons;
- Undo for the most recent selected-lane entry;
- unit/upgrade menu switching;
- explicit editable or locked deployment state.

Upgrade cards state their concrete per-level effect instead of only a category name and cost. A prepared project shows its pending level. Activation at the next wave is announced through a short banner, warm audio cue, HQ pulse and persistent visual level markers: Reactor light on the HQ, Hangar lamps, Arsenal marks and stronger projectile presentation on ships, and external modules on upgraded turrets.

The canvas uses the full portrait viewport from 360×800 through 412×915 and the 420×760 design baseline. HUD controls remain in screen space while the battlefield keeps its own taller world coordinates. Pointer Events support direct vertical map dragging; the strategic navigator provides fast sector jumps.

## AI fairness

The opponent uses the public command system, the same Energy, costs, research-adjusted slots, lock window, capacity and upgrade timing. It evaluates pressure, composition, Node control and turret health at the start of a cycle and exactly once more with seven seconds remaining. That revision removes and refunds its old entries through the same public commands before rebuilding the queue. It receives no permanent resource cheat and may not mutate queues after lock-in.

Three title-screen profiles expose understandable difficulty rather than hidden resource bonuses: Cadet buys at most two ships and skips upgrades, Tactician uses all systems conservatively, and Admiral invests and counters more aggressively.

If both Headquarters are destroyed within the same fixed simulation step, the match is a draw. Snapshot-based targeting and stable alternating update order prevent a team or lane from winning merely because it was iterated first.

## Feedback and onboarding

The title screen teaches the loop in three actions and lets the player choose the AI profile before starting. Lane tabs contain a compact friendly-versus-enemy pressure bar, while unit cards state their role as well as their cost. Short synthesized cues distinguish selection, purchase, fire, missile, hit, destruction, Node capture and deployment. Sound can be muted persistently; vibration occurs only after a real user gesture.

## Quality gate

The core slice is ready for expansion only when repeated real-device and headless matches show that:

- the 22-second rhythm leaves time to read both lanes and make a meaningful plan;
- deployments visibly alter fronts while survivors remain understandable;
- all four units support distinct composition choices;
- Nodes matter without deciding matches alone;
- matches reliably end through Headquarters destruction;
- dense fleets, animations and projectiles remain readable and responsive on a phone.

Capital ships, a third lane, direct control, abilities, deck systems, multiplayer and new faction mechanics remain outside this contract until that gate is passed.
