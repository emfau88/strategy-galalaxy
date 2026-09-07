# Strategy Galalaxy – Game Design Contract

This document is the implementation-facing gameplay contract. The product direction is defined in [`STRATEGY_GALALAXY_CORE_VISION.md`](../STRATEGY_GALALAXY_CORE_VISION.md).

## Core loop

Strategy Galalaxy is a portrait, single-player, two-lane auto-battler. Combat, movement, projectiles, capture and Energy income run continuously. The player observes both persistent fronts and prepares the next reinforcement wave while the current fleets keep fighting.

Every 22 seconds both teams deploy simultaneously. The final two seconds are locked. Surviving units, structure damage, Node ownership and capture progress persist across the boundary. A new countdown starts immediately; no planning pause interrupts combat.

The primary match ends only when a Headquarters is destroyed.

## Battlefield

- Exactly two isolated, wide corridors: Left and Right.
- Player Headquarters and turrets are at the bottom; enemy structures mirror them at the top.
- Each lane contains one capturable Energy Node.
- The full relevant battlefield remains visible without camera movement, zoom or minimap.
- Units retain their lane for life but use local horizontal offsets for formations and separation.
- The vertical geometry is mirrored around the Node axis so neither team receives a distance advantage.

## Deployment and queues

- A match opens with a free symmetric base wave so the battlefield is active immediately.
- Each later boundary adds two free Scouts per lane and team.
- A team may buy at most four reinforcements per deployment across both lanes combined.
- Buying reserves the full Energy cost immediately.
- Removing an entry before lock-in refunds its full cost.
- During the final two seconds additions, removal and upgrades are rejected.
- Deployment is timer-driven only; there is no manual deploy command.
- Existing lane capacity is respected. Entries that cannot spawn remain as deterministic backlog rather than vanishing.
- Delivered ships launch visibly from their lane-facing HQ hangar, remain untargetable during the short launch traversal, then join their role formation. A hangar opens only when that team and lane actually deliver at least one ship.
- The normal HUD reveals only the number of enemy reinforcements, not their types.

## Economy and upgrades

Energy is generated continuously from base income and controlled Nodes. Escalation multipliers increase income after long matches to discourage stalemates. Economy and turret upgrades are purchased during the editable window, but their effects become active only at the next deployment boundary.

Current data-driven defaults:

| Rule | Value |
| --- | ---: |
| Starting Energy | 300 |
| Base income | 20/s |
| Controlled Node bonus | 10/s |
| Paid reinforcement slots | 4 |
| Free Scouts | 2 per lane/deployment |
| Deployment interval | 22 s |
| Queue lock-in | final 2 s |

## Fleet roles

| Ship | Purpose | Targeting and weapon identity | Capture |
| --- | --- | --- | ---: |
| Scout | Fast map control | Light pulse; avoids wasting time on heavies when the Node is open | 2.0 |
| Fighter | Anti-light escort | Rapid bolt/ray; prioritizes Bombers and light craft | 1.0 |
| Bomber | Siege and anti-heavy | Visible accelerating homing missile; prefers turrets, HQ and Frigates | 0.5 |
| Frigate | Durable frontline anchor | Slower, weightier cannon shot and high durability | 0.75 |

Formation offsets put Scouts forward, Frigates near the front, Fighters in escort positions and Bombers behind. Local separation prevents stacking while preserving a compact fleet. Targets remain sticky while valid and within their leash.

## Structures, capture and health

Headquarters and turrets fire automatically and retain damage. Capture strength from all ships inside a Node is additive; opposing power is subtracted and near-equal power contests the Node.

Turret platforms and weapon heads are separate presentation layers. The head tracks its authoritative target smoothly, recoils, and places turret projectiles at the muzzle. HQ hangars, practical lamps and damage layers remain renderer-owned and never decide whether a deployment or hit occurred.

Permanent health bars are reserved for Headquarters and turrets. Unit bars appear only after damage. Visual hierarchy must read as `HQ >>> Turret > Frigate > Bomber/Fighter > Scout` without enlarging ships until real-device tests show a readability failure.

## Combat presentation

Nairan represents the player and Kla'ed the opponent. Runtime visuals layer engine animation behind the hull, weapon animation over it, shield feedback on damage and a class-specific destruction strip on death. Animation frames never decide damage or hit timing.

Projectile behavior and projectile art are separate data. Scouts use small shots, Fighters fast salvos, Bombers missiles/torpedoes with bounded homing and real position trails, and Frigates heavier rays or bullets. Muzzle flashes, hit sparks and explosions remain short and size-aware.

Budgets are bounded. In particular, each team and lane has its own projectile allowance, with a higher global cap retained only as a safety net. This prevents one busy lane from suppressing the other team’s fire.

## Mobile interface

The top HUD prioritizes both HQ health values and the deployment countdown. Energy, income and shared slots remain compact. The bottom planning panel is always available during the live match and provides:

- Left/Right selection and visible friendly queue icons;
- Scout, Fighter, Bomber and Frigate purchase buttons;
- Undo for the most recent selected-lane entry;
- unit/upgrade menu switching;
- explicit editable or locked deployment state.

The canvas uses the full portrait viewport from 360×800 through 412×915 and the 420×760 design baseline. Controls remain in design space while the battlefield grows vertically, avoiding unused letterbox regions on tall phones.

## AI fairness

The opponent uses the public command system, the same Energy, costs, four slots, lock window, capacity and upgrade timing. It evaluates pressure, units, Node control and turret health once per deployment cycle. It receives no permanent resource cheat and may not mutate queues after lock-in.

## Quality gate

The core slice is ready for expansion only when repeated real-device and headless matches show that:

- the 22-second rhythm leaves time to read both lanes and make a meaningful plan;
- deployments visibly alter fronts while survivors remain understandable;
- all four units support distinct composition choices;
- Nodes matter without deciding matches alone;
- matches reliably end through Headquarters destruction;
- dense fleets, animations and projectiles remain readable and responsive on a phone.

Capital ships, a third lane, direct control, abilities, deck systems, multiplayer and new faction mechanics remain outside this contract until that gate is passed.
