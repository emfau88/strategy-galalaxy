# Strategy Galalaxy – Core Gameplay Vision & Implementation Brief

## 1. Project Context

This document defines the intended core design direction for **Strategy Galalaxy**.

Primary working repository:

- `https://github.com/emfau88/strategy-galalaxy.git`

Read-only technical and visual reference:

- `https://github.com/emfau88/galalaxy.git`

Important repository rule:

- `strategy-galalaxy` is the only repository that may be modified.
- `galalaxy` is strictly read-only.
- Do not commit, push, edit, or otherwise alter `galalaxy`.
- It may be inspected and selectively used as a source for reusable code, assets, projectile systems, effects, combat presentation, mobile scaling patterns, etc.

The goal is not to turn Galalaxy itself into a strategy game.  
Strategy Galalaxy is a separate game that reuses useful technical and visual foundations.

---

# 2. High-Level Product Vision

Strategy Galalaxy is a:

> **Mobile-first portrait space lane-wars / tug-of-war auto-battler with two persistent lanes, continuous real-time combat, and fixed deployment cycles.**

The player does **not** manually control ships.

There is:

- no joystick,
- no WASD,
- no unit drag-to-move,
- no RTS selection box,
- no per-unit manual movement,
- no combat micro,
- no constant spell-spam,
- no Clash-Royale-style immediate unit deployment every few seconds.

The player’s role is **strategic planning while the battle continues**.

The desired loop is:

> Observe the battlefield  
> → understand which lane is winning or losing  
> → prepare the next reinforcement wave  
> → wait for the next deployment timer  
> → both sides deploy simultaneously  
> → surviving units remain  
> → front lines continue moving  
> → immediately begin planning the next wave

This is the central design.

---

# 3. Core Design Decision: Continuous Battle, No Hard Command Phase

Earlier versions used a hard split:

`COMMAND -> BATTLE -> COMMAND`

That is no longer the desired design.

The game should instead run as one **continuous live match**.

Combat, movement, capture, economy, projectiles and structures are always active while the match is running.

There is no pause for planning.

The player plans the next wave **while watching the current battle**.

This is a crucial product decision.

---

# 4. Deployment Cycle

Reinforcements do not spawn immediately when purchased.

Instead, the game has a fixed deployment interval.

Initial target:

`deploymentInterval = 22 seconds`

The player always sees a timer such as:

`NEXT DEPLOYMENT 17s`

During that countdown, the player prepares the next wave.

At `0`:

- player queues are locked,
- enemy AI queues are locked,
- both sides deploy simultaneously,
- all existing surviving units stay on the battlefield,
- the next 22-second cycle begins immediately.

Combat never pauses.

This creates a calmer strategic rhythm than Clash Royale while preserving continuous play.

---

# 5. Why 22 Seconds

The battle should feel deliberate, readable and observable.

Do not shorten the deployment rhythm into a frantic 10–15 second loop unless later playtests strongly justify it.

The 22-second cycle should allow the player to:

- watch both lanes,
- identify which formation is working,
- see node control change,
- recognize an incoming push,
- evaluate turret pressure,
- decide whether to reinforce or counterpush,
- save for a more expensive ship,
- revise the next wave before it deploys.

The target experience is not frantic reaction speed.

The target experience is:

> **observe -> interpret -> prepare -> commit -> watch the consequence**

---

# 6. Optional Short Lock-In Window

Consider a very short lock-in period at the end of the deployment countdown.

Example:

- 22s to 2s: queue editable
- final 2s: queue locked
- 0s: deploy

UI can briefly show:

`DEPLOYMENT LOCKED`

Purpose:

- makes the final wave composition clear,
- avoids last-frame ambiguity,
- gives the deployment moment some rhythm,
- does not pause combat.

This is optional but recommended.

---

# 7. Two-Lane Portrait Battlefield

The game is designed **mobile-first in portrait orientation**.

Initial battlefield:

- exactly 2 lanes,
- player HQ at the bottom,
- enemy HQ at the top,
- one player turret per lane,
- one enemy turret per lane,
- one capturable Energy Node per lane.

The battlefield is intentionally taller than one portrait viewport so fleets can
use readable spacing, larger silhouettes and longer engagement distances.

Core navigation is deliberately constrained:

- the camera pans vertically only,
- direct touch drag moves the battlefield,
- a slim strategic navigator jumps between sectors and preserves global awareness,
- horizontal panning, free rotation and pinch-zoom are not required,
- HUD and command controls stay fixed in screen space.

The player must never be forced to hunt blindly for the battle. Across the
camera window and strategic navigator, the player should always be able to read:

- both lanes,
- both HQs,
- both node states,
- all major pushes,
- both turret lines.

---

# 8. Lanes Are Corridors, Not Thin Lines

A lane must not look like a single vertical line.

Each lane should be a **wide combat corridor**.

Example approximate layout in a 420 px design width:

- Left lane corridor: `x ≈ 45–185`
- Right lane corridor: `x ≈ 235–375`

Units stay permanently assigned to their lane.

However, they may use small horizontal offsets inside that corridor for:

- formation spacing,
- local separation,
- readable combat,
- avoiding sprite overlap.

A ship must never switch to the other lane unless a future special mechanic explicitly says so.

---

# 9. Persistent Battlefield

This is a core mechanic.

Units do not disappear when a deployment cycle ends.

Survivors remain in combat.

Example:

Cycle 1:

- player sends 2 Fighters left

One Fighter survives.

Cycle 2:

- player sends Frigate + Bomber left

The surviving Fighter remains and joins the new reinforcement.

Over multiple cycles, successful waves can build into a large push.

This is what creates a real tug-of-war front.

Do not reset lanes every cycle.

Do not clear units between deployments.

---

# 10. Win Condition

The primary mode is simple:

> Destroy the enemy Headquarters.

Player HQ destroyed:

`DEFEAT`

Enemy HQ destroyed:

`VICTORY`

There is no artificial “survive 10 waves” victory condition in the main mode.

The match continues through deployment cycles until an HQ falls.

---

# 11. Economy

Initial economy uses one resource:

`Energy`

Energy is generated continuously during the live match.

No artificial pause in income.

Energy comes from:

- base income,
- controlled Energy Nodes,
- possible later economy upgrades.

Example starting values can remain data-driven.

Important behavior:

When the player queues a ship:

- Energy is deducted or reserved immediately.

If the player removes that queued ship before lock-in:

- Energy is fully refunded.

This avoids last-second spending exploits and makes the queue state authoritative.

---

# 12. Reinforcement Slots

Energy alone should not be the only constraint.

Recommended initial rule:

> **Maximum 4 purchased reinforcement slots per deployment across both lanes combined.**

The free automatic base-wave units do not count against this limit.

Examples:

- 2 left + 2 right
- 4 left + 0 right
- Frigate + Bomber left, Fighter + Fighter right
- 1 heavy expensive unit + 3 lighter units

Why this matters:

Without a slot constraint, the dominant strategy can become:

> “Spend as much Energy as possible.”

With a shared slot limit, the player must choose:

> “Where do my limited reinforcements matter most?”

This creates real opportunity cost between lanes.

UI should show something like:

`REINFORCEMENTS 3 / 4`

---

# 13. Free Base Waves

Each deployment cycle should automatically produce a small baseline wave for both teams.

Example:

- 1–2 Scouts per lane

These units are free.

Purpose:

- keeps both lanes active,
- prevents fully passive saving,
- preserves forward pressure,
- ensures the battlefield evolves even if the player buys nothing.

The player’s purchases are **reinforcements**, not the entire army.

---

# 14. Queue UX

The queue must be highly visual.

Do not represent a lane only as:

`3 SHIPS / 270 E`

Instead show actual ship icons.

Example:

`LEFT`  
`[FRIGATE] [BOMBER]`

`RIGHT`  
`[FIGHTER] [FIGHTER]`

The player should understand wave composition at a glance.

The queue should be editable until lock-in.

Required interactions:

- select Left or Right lane,
- add unit,
- remove queued unit,
- refund on removal,
- show total slot usage,
- show remaining Energy,
- show next deployment time.

The UI should feel like planning a formation, not operating a spreadsheet.

---

# 15. Mobile UI Principles

The battlefield is the main visual focus.

During the live match, the UI should remain compact.

Recommended top HUD:

- player HQ HP,
- deployment countdown,
- enemy HQ HP.

Optional secondary info:

- Energy,
- Income,
- node ownership,
- compact Left/Right pressure indicators.

Recommended bottom planning UI:

- Left / Right lane selector,
- next-wave icons,
- 4 unit buttons,
- reinforcement slot counter.

Avoid large opaque panels covering the battlefield.

Prefer translucent panels where appropriate.

The player should still clearly see the current battle while planning.

---

# 16. Unit Roles Must Be Mechanically Distinct

The four first units must not merely be different bundles of HP and DPS.

They must have clear strategic roles.

## Scout

Role:

- map control,
- node capture,
- speed.

Characteristics:

- very fast,
- low HP,
- low direct combat DPS,
- high capture strength,
- good at slipping into open node areas,
- poor against heavy frontline ships.

Suggested capture strength:

`2.0`

## Fighter

Role:

- anti-light,
- escort,
- anti-bomber.

Characteristics:

- fast,
- high fire rate,
- good versus Scouts, Fighters and Bombers,
- weaker against Frigates and structures,
- should visually read as rapid-interceptor DPS.

## Bomber

Role:

- siege,
- anti-structure,
- anti-heavy.

Characteristics:

- slow,
- vulnerable,
- prefers Turrets, Frigates and HQ,
- uses visible missiles,
- high damage versus structures/heavy targets,
- poor against fast Fighters.

## Frigate

Role:

- frontline,
- tank,
- escort anchor.

Characteristics:

- high HP,
- slow,
- moderate damage,
- sits near the front,
- should absorb or attract a meaningful share of incoming fire,
- protects more fragile Bombers/Fighters behind it.

---

# 17. Formation Logic

A deployment should not spawn as a pile of sprites.

Create simple role-based formations.

Example:

```text
        Scout

 Fighter       Fighter

       Frigate

        Bomber
```

General intent:

- Scouts forward / slightly outside,
- Frigates frontline,
- Fighters middle / side escort,
- Bombers rear.

Formation does not mean rigid military marching.

Once combat begins, ships may move locally as necessary.

Formation is primarily for:

- spawn organization,
- readable entry onto the battlefield,
- natural role placement,
- avoiding overlap,
- better visual presentation.

---

# 18. Local Separation

Ships on the same team should not occupy nearly identical coordinates.

Implement a simple local separation / repulsion behavior.

Requirements:

- no heavy steering framework necessary,
- keep ships inside lane corridor,
- avoid sprite stacking,
- keep fleet visually compact,
- do not create chaotic drifting.

The goal is:

> small fleet

not:

> overlapping icons

and not:

> random swarm.

---

# 19. Target Stickiness

Target selection should be stable.

Once a unit commits to a valid target, it should generally keep that target until:

- target dies,
- target leaves a reasonable leash/range,
- target becomes invalid.

Do not constantly retarget because another enemy is a few pixels closer.

This principle is important for auto-combat readability.

The player should be able to understand:

> “These two Fighters are fighting that Bomber.”

instead of watching constant target jitter.

---

# 20. Target Priorities by Role

Targeting should not be purely “nearest enemy”.

Suggested priorities:

## Scout

- light nearby enemies when necessary,
- otherwise continue toward control objective / node / forward pressure.

## Fighter

Prefer:

1. Bomber
2. Scout
3. Fighter
4. other targets

Avoid wasting time on high-HP Frigates when better light targets exist.

## Bomber

Prefer:

1. Turret
2. HQ when accessible
3. Frigate / heavy unit
4. lighter units only if necessary

## Frigate

Prefer:

- nearest frontline threat,
- units threatening nearby allies,
- normal forward pressure.

No complex behavior tree is required.

Simple weighted priorities are enough.

---

# 21. Energy Nodes

Each lane contains one capturable Energy Node.

Control should generate a meaningful income bonus.

Capture must not be binary.

Use data-driven capture power.

Suggested values:

- Scout: `2.0`
- Fighter: `1.0`
- Bomber: `0.5`
- Frigate: `0.75`

Total capture strength is additive.

Example:

3 Scouts:

`6.0 capture power`

1 Frigate:

`0.75 capture power`

If both teams are inside the capture radius:

- compare net capture power,
- near-equal force = contested,
- stronger force pushes control toward its team.

This gives Scouts a genuine strategic reason to exist.

---

# 22. Structures and Visual Hierarchy

The game should read as a fleet war.

Suggested visual size hierarchy:

- Scout: ~20–24 px
- Fighter: ~24–29 px
- Bomber: ~30–35 px
- Frigate: ~38–45 px
- Battlecruiser later: ~50–60 px
- Dreadnought later: ~65–75 px
- Turret: ~55–65 px
- Energy Node: ~48–58 px
- HQ: ~100–120 px

Important relationship:

`HQ >>> Turret > Frigate > Fighter > Scout`

The HQ should look like a major base, not another small icon.

Turrets should look clearly military.

Nodes should look economic / neutral / energy-focused.

---

# 23. Health Bar Rules

Avoid debug-like health bar clutter.

Permanent health bars:

- HQ
- Turrets

Normal units:

- no health bar while full HP,
- show only after taking damage,
- optionally hide again after a short delay if readability benefits,
- heavy ships may show more persistent damage state.

This is a proven way to reduce battlefield noise.

---

# 24. Combat Presentation Must Reuse Galalaxy Strengths

Strategy Galalaxy should not degrade Galalaxy’s combat into generic bullets.

The original Galalaxy reference contains useful ideas and systems for:

- homing projectiles,
- missiles,
- projectile profiles,
- piercing,
- beams,
- zaps,
- explosions,
- hit feedback,
- shields,
- particle effects,
- weapon-specific visuals.

Use these ideas selectively.

Minimum desired distinction:

- Scout: light small projectile
- Fighter: rapid laser/bolt weapon
- Bomber: visible missile with trail and explosion
- Frigate: heavier, slower, visually weightier weapon

The unit should be recognizable partly through how it fights.

---

# 25. Combat FX

Desired combat feedback:

- brief hit sparks,
- muzzle flashes,
- missile trails,
- small explosion on light unit death,
- larger explosion on Frigate death,
- larger structure explosions,
- short damage flash,
- optional very subtle screen shake for major structure/capital-ship events.

Avoid:

- permanent neon bloom,
- excessive particle spam,
- unreadable explosions,
- effects hiding ships.

The battle should be satisfying to watch but still readable on a phone.

---

# 26. Art Direction

Target tone:

> friendly, clean, slightly cozy premium space arcade

Not:

- grimdark,
- cyberpunk,
- black screen + neon,
- heavy red/blue competitive esports HUD,
- industrial military realism.

Preferred atmosphere:

- soft blue,
- sky blue,
- cyan,
- teal,
- lavender,
- subtle nebulae,
- warm planet light,
- soft coral/orange enemy accents,
- white/silver structures,
- restrained glow.

Player color:

- soft cyan / sky blue / white.

Enemy color:

- warm coral / salmon / soft orange.

Neutral node:

- soft white / lavender.

Contested:

- warm gold.

The visual tone should be bright enough to feel inviting while still clearly taking place in space.

---

# 27. Background

The background should add atmosphere without competing with gameplay.

Possible elements:

- soft nebula,
- planet horizon,
- subtle starfield,
- a few small asteroids,
- slight parallax.

Do not place large high-contrast objects behind active combat areas.

Gameplay readability comes first.

---

# 28. Continuous Economy and Upgrade Timing

Energy income remains live at all times.

If economy upgrades or turret upgrades are available, strongly consider making their effects activate on the **next deployment boundary** rather than instantly.

Example:

`TURRET MK2 – activates next deployment`

Reason:

A turret changing DPS instantly in the middle of a firefight can feel arbitrary.

Deployment boundaries are natural synchronization points.

This is a recommended design direction, not an immutable rule.

---

# 29. AI Design

The AI should use the same fundamental rules as the player.

The AI has:

- Energy,
- same unit costs,
- same reinforcement slot limit,
- same deployment timer,
- same unit roles,
- same node economy,
- same upgrade rules.

Avoid hidden permanent resource cheating as the default difficulty model.

The AI should periodically evaluate both lanes.

Useful internal metrics:

- lane pressure,
- node ownership,
- friendly turret HP,
- enemy turret HP,
- friendly unit value,
- enemy unit value,
- unit composition,
- Energy available,
- time until next deployment.

Then it prepares its own next wave.

Example decision logic:

- right lane critical -> Frigate/Fighter reinforcement right
- enemy turret low left -> Bomber push left
- node uncontested -> Scout investment
- stable map + enough Energy -> economy upgrade
- already strong push one side -> reinforce that push or pressure opposite side

The AI should not need a behavior-tree framework for the first version.

Simple heuristics are preferred.

---

# 30. Lane Pressure

Internally calculate a simple pressure metric per lane.

Possible ingredients:

- total surviving combat value,
- unit position,
- remaining HP,
- turret status,
- node ownership,
- proximity to enemy structures.

Example conceptual form:

`pressure = unitPower * positionWeight + nodeBonus + structureState`

This metric can serve:

- AI decisions,
- debugging,
- optional compact HUD visualization.

Do not expose raw debug numbers to the normal player unless useful.

A visual bar can be enough.

---

# 31. Enemy Queue Visibility

Do not show the exact enemy next-wave composition by default.

Otherwise the player can simply hard-counter every deployment.

Possible initial UI:

`ENEMY REINFORCEMENTS: 3`

without revealing types.

Later, a scouting/intel mechanic could reveal details.

Do not build that intel system now.

---

# 32. Match Escalation

The match should naturally escalate over time.

Possible mechanisms:

- increasing income multipliers,
- stronger free base waves,
- unlocking heavier ships,
- more expensive but stronger choices later.

Desired progression:

Early:

- Scouts,
- Fighters,
- node skirmishes.

Mid:

- Bombers,
- Frigates,
- turret pressure.

Late:

- Battlecruisers,
- Dreadnoughts,
- combined persistent waves,
- HQ assault.

The match should not stagnate forever.

---

# 33. Future Heavy Units

Architecture should allow:

- Battlecruiser
- Dreadnought

but do not prioritize them before the core four units are strategically distinct and fun.

The initial quality bar is:

> Scout/Fighter/Bomber/Frigate must already create meaningful composition decisions.

---

# 34. Possible Future Fleet Doctrines

Do not implement this in the immediate core pass.

However, the architecture may later support a macro-order for the next wave.

Possible doctrines:

- Assault
- Hold
- Capture
- Siege

These are preferable to manual spell spam because they preserve the game’s macro-strategy identity.

This idea is inspired by real-time auto-battler/tug-of-war systems where global engagement behavior changes unit priorities.

Again:

**future feature, not current scope.**

---

# 35. What to Learn from External Reference Games

The agent does not need to analyze all external repositories itself.

The relevant distilled lessons are already captured here.

## Age-of-War-style lane battlers

Useful lessons:

- continuous real-time battle,
- authoritative unit production queue,
- purchases enter queue instead of spawning immediately,
- compact queue visualization,
- mobile touch support,
- unit caps,
- headless balance testing.

Do not copy:

- one-lane layout,
- unrestricted desktop-style free camera,
- minimap complexity that demands precision interaction,
- constant immediate production timing as the only model.

## TinyWar-style tug-of-war

Useful lessons:

- continuous auto-combat,
- lane assignment,
- queued reinforcement units,
- target stickiness,
- macro strategy instead of micro,
- persistent forward pressure.

Do not copy:

- 3-lane requirement,
- desktop camera controls,
- permanent manual strategy switching as an immediate priority.

## Clash-Royale / UnityRoyale-style mobile arena

Useful lessons:

- portrait readability,
- touch-first UI,
- clear ownership,
- battlefield-first information hierarchy,
- strong unit/structure silhouette,
- critical controls near the thumb zone.

Do not copy:

- cards/decks,
- instant deployment anywhere,
- frantic Elixir spam,
- constant micro-reaction pacing.

## Auto-battlers

Useful lessons:

- planning matters only if unit roles and composition are distinct,
- automatic combat must be readable,
- post-decision observation is part of the game.

Do not copy:

- hard strategy/battle phase separation,
- overengineered behavior trees,
- pathfinding systems that the two-lane design does not need.

---

# 36. Technical Architecture Direction

The existing project should not be restarted from zero.

However, the old state flow should evolve away from:

`COMMAND`  
`BATTLE`

toward something closer to:

- `TITLE`
- `LIVE_MATCH`
- `PAUSED`
- `VICTORY`
- `DEFEAT`

Add or evolve a dedicated deployment-cycle controller.

Conceptual responsibilities:

```text
DeploymentDirector
- deploymentInterval
- timeUntilDeployment
- cycleNumber
- lockWindow
- playerQueues
- enemyQueues
- queueCapacity
- deploy()
```

Meanwhile these systems continue every simulation tick:

```text
BattleSimulation
EconomySystem
CaptureSystem
ProjectileSystem
TargetingSystem
FX
```

The deployment system should not own or pause combat.

---

# 37. Simulation / Rendering Separation

Maintain strict separation:

Simulation decides:

- movement,
- target selection,
- damage,
- capture,
- deployment,
- economy,
- win/loss.

Renderer decides:

- sprites,
- effects,
- bars,
- glows,
- UI.

Do not make simulation depend on visual frame rate.

Use fixed-step simulation where possible.

This also allows future headless testing.

---

# 38. Headless Balance Simulation

This project is especially well suited for automated balance testing.

Recommended future tooling:

- AI vs AI matches without rendering,
- hundreds of simulated matches,
- win-rate output,
- average match duration,
- unit purchase frequency,
- lane pressure statistics,
- node-control statistics,
- turret survival time.

Example:

```text
Balanced AI vs Aggressive AI
500 matches

Balanced: 247 wins
Aggressive: 253 wins
Average duration: 5m 18s
```

This helps detect broken unit costs much faster than manual testing alone.

---

# 39. Performance

The game may eventually display many ships and projectiles.

Avoid:

- DOM element per unit,
- unlimited projectiles,
- unlimited particles,
- full-map O(n²) targeting every frame,
- constant object allocation in hot loops.

Prefer:

- lane-specific unit collections,
- target locality,
- projectile caps,
- particle caps,
- fixed-step updates,
- data-driven definitions.

---

# 40. Scope Guardrails

Do not expand the project before the core loop is fun.

Do not add yet:

- third lane,
- multiplayer,
- PvP,
- campaign,
- story,
- shop,
- monetization,
- cards,
- deckbuilding,
- loot,
- gacha,
- hero unit,
- large skill tree,
- many maps,
- many factions,
- active combat spell system,
- manual unit control.

The current test is much simpler:

> Is it interesting to watch the current battlefield and prepare the next wave?

And:

> Is it satisfying to see that wave enter the battle and change the front?

If not, more content will not solve the problem.

---

# 41. Immediate Implementation Priorities

Recommended order:

1. Replace hard Command/Battle phase flow with continuous live match.
2. Add fixed ~22-second deployment timer.
3. Keep combat/economy/capture permanently active.
4. Add editable Left/Right reinforcement queues.
5. Add shared max-4 purchased reinforcement slots.
6. Add simultaneous player/AI deployment.
7. Preserve all surviving units.
8. Add role-based formations.
9. Add local unit separation.
10. Add stable target stickiness.
11. Implement distinct Scout/Fighter/Bomber/Frigate targeting roles.
12. Improve capture power system.
13. Reuse stronger Galalaxy projectile/weapon/FX behavior.
14. Improve mobile HUD and queue visualization.
15. Improve structure/unit size hierarchy.
16. Reduce HP-bar clutter.
17. Make art direction brighter, cleaner and friendlier.
18. Playtest on real portrait-mobile sizes.
19. Balance only after the loop feels correct.

---

# 42. Acceptance Criteria

The reworked core should satisfy all of the following:

- Battle never pauses during normal play.
- Deployment countdown runs continuously.
- Player may edit next-wave queues while battle continues.
- Player and AI deploy at the same interval.
- Surviving units persist across cycles.
- Left and Right lanes remain independent.
- Units do not stack excessively.
- Units stay inside their assigned lane corridor.
- Scout, Fighter, Bomber and Frigate feel mechanically distinct.
- Scout has visibly stronger capture utility.
- Fighter meaningfully counters light units/Bombers.
- Bomber meaningfully threatens structures/heavy units.
- Frigate functions as frontline protection.
- Targeting is stable and readable.
- Queue UI uses ship icons, not only abstract counts.
- Max reinforcement slot rule works.
- Refunds work before lock-in.
- Economy continues during the entire match.
- Node control affects income.
- Turrets/HQs remain meaningful structural objectives.
- Battle HUD is compact.
- Tall battlefield supports larger ships and separated formations.
- Direct vertical touch panning and strategic jumps remain comfortable.
- Both lanes stay horizontally readable at every camera position.
- Combat is visually more satisfying than generic bullet exchange.
- No JS errors.
- No broken mobile layout.
- The game feels calmer than Clash Royale, but not passive.

---

# 43. Final Design Summary

The intended identity is:

> **Continuous tug-of-war combat + fixed 22-second reinforcement deployments + mobile portrait readability + Galalaxy-style space combat.**

The player is always doing one of two things at the same time:

1. watching the current battle,
2. planning the next reinforcement.

There is no hard boundary between “playing” and “watching”.

That is the core innovation of the current design direction.

A concise comparison:

- **TinyWar / Age of War:** continuous tug-of-war structure
- **Clash Royale / Unity Royale:** mobile arena readability
- **Auto-battlers:** meaningful composition and automatic combat
- **Galalaxy:** ships, weapons, projectiles, effects, visual identity
- **Strategy Galalaxy:** combines those ideas with fixed simultaneous deployment cycles instead of instant live unit spam

The design should remain calm, readable, strategic and highly suitable for mobile portrait play.

Do not add scope until this loop is genuinely fun.
