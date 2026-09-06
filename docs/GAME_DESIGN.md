# Strategy Galalaxy – Game Design Contract

## Document purpose

This document defines the product rules for the first playable version of Strategy Galalaxy. The rules marked as binding describe the game being built. Numerical values marked as starting values are expected to change through playtesting.

The working title is **Strategy Galalaxy**. The commercial display name is not final and must remain configurable.

## Product statement

Strategy Galalaxy is a mobile-first, portrait-oriented, singleplayer Space Lane Wars game. The player commands a fleet through macro decisions made before each combat interval. Ships move, target, fire, and die automatically.

The central question of every deployment cycle is:

> What should I send, when should I send it, and which lane needs it most?

The game succeeds when lane choice, timing, fleet composition, saving, economy investment, and defense investment create meaningful tradeoffs. It fails if the dominant decision is consistently “buy the most expensive available unit.”

## Binding product rules

- Strategy Galalaxy is a separate game, not a modification of Galalaxy.
- Galalaxy is a read-only source of technical patterns and reusable assets.
- The first release target is smartphone portrait; desktop mouse input remains supported.
- The first map has exactly two lanes.
- The game is singleplayer and the opposing side is controlled by AI.
- Combat is fully automatic.
- There is no joystick, WASD movement, unit selection, drag movement, waypoint placement, formation micro, or manual combat ability.
- The battlefield remains persistent between deployment cycles.
- Surviving units, live projectiles, weapon cooldowns, structures, node progress, and damage remain in their current state between Battle Phases.
- Command and Battle Phases alternate until a Headquarters is destroyed.
- Each lane receives a free automatic base wave every cycle.
- Energy is the only match resource in the first slice.
- Energy Nodes create lane objectives and additional income.
- Player and AI obey the same purchase, income, upgrade, phase, and deployment rules.
- The first playable scope contains Scout, Fighter, Bomber, and Frigate.
- Economy Upgrade and Turret Upgrade are the only upgrades in V1.
- Battlecruiser and Dreadnought are supported by the data model but are not required for the earliest balance pass.
- No gameplay rule may depend on a temporary visual placeholder.

## Player promise

The player should be able to read the paused battlefield and make a plan from visible facts:

- one lane is being pushed toward a damaged turret
- the other lane has surviving friendly Fighters near a captured node
- immediate defense competes with an Economy Upgrade
- adding a Frigate may stabilize a lane, while saving may enable a larger later wave
- reinforcing a winning lane may create a decisive persistent push but leave the other lane exposed

During Battle Phase the player observes the consequences. The game should not imply that rapid tapping or hidden combat interaction is expected.

## Match layout

The first map is `classic_lanes`.

```text
                     ENEMY HQ

          Enemy Left       Enemy Right
             Turret            Turret
               |                 |
            LEFT LANE        RIGHT LANE
               |                 |
          Left Energy       Right Energy
              Node              Node
               |                 |
            LEFT LANE        RIGHT LANE
               |                 |
          Player Left      Player Right
             Turret            Turret

                     PLAYER HQ
```

The player side is at the bottom and advances upward. The enemy side is at the top and advances downward.

The lanes remain visually separate. Units never change lanes in the first slice. The shared HQ is the final target reached from either lane after that lane's Defense Station has fallen.

## Match flow

### 1. Loading

Required boot assets and configuration load. Missing optional art uses a safe fallback. A blocking configuration error is visible in debug mode.

### 2. Title

The player can start a new match. The title presents the game as a fleet strategy experience and does not advertise manual ship control.

### 3. First Command Phase

The battlefield begins with both HQs, four Defense Stations, and two neutral Energy Nodes. No purchased combat unit is present. Both lanes already show their upcoming free base wave.

### 4. Repeating deployment cycle

Each cycle contains one Command Phase and one Battle Phase.

```text
COMMAND → simultaneous deployment → BATTLE → freeze current battlefield → COMMAND
```

The cycle repeats until an HQ reaches zero HP.

### 5. Victory or Defeat

- Enemy HQ destroyed: Victory.
- Player HQ destroyed: Defeat.
- Combat stops immediately after the terminal result is resolved.
- The final battlefield remains visible beneath the result UI.
- Restart creates a completely new match from initial state.

## Command Phase

### Starting duration

There is no mandatory countdown. The Command Phase remains open until the player presses `DEPLOY WAVE`. Test and automation modes may opt into a finite timer without changing normal mobile play.

### Time behavior

The Command Phase holds for player confirmation. The combat simulation is completely frozen:

- units do not move
- structures and units do not fire
- existing projectiles do not move
- weapon and projectile lifetimes do not advance
- damage and death processing do not advance
- capture progress does not advance
- Energy income does not advance
- combat and upgrade cooldowns do not advance

Presentation-only animation such as a soft button pulse may continue. It cannot change gameplay state.

### Available actions

The player may:

- inspect the paused battlefield
- add units to the next Left Lane wave
- add units to the next Right Lane wave
- remove paid units from either planned wave
- buy an Economy Upgrade
- buy a Turret Upgrade
- save Energy
- confirm deployment early

The player cannot interact with existing battlefield units.

### Purchase behavior

- Adding a paid unit immediately reserves and deducts its Energy cost.
- Removing that unit during the same Command Phase refunds its full recorded purchase cost.
- A unit queue entry stores the price paid; later balance or upgrade changes cannot alter its refund.
- Free automatic units cannot be removed or refunded.
- Upgrade purchases take effect immediately and are not refundable.
- Confirming deployment converts all queued entries into units without another charge.
- An empty paid plan still deploys the free base wave.
- Each side may queue at most four paid reinforcements per deployment across both lanes; free automatic Scouts do not consume these shared slots.

### Early confirmation

Pressing `DEPLOY WAVE` ends the Command Phase immediately. The AI plan is already valid by this point, and both sides deploy simultaneously.

## Battle Phase

### Starting duration

`22 seconds` of active simulation time, centrally configurable.

### Rules

- Player and AI waves spawn at the same simulation boundary.
- Units act automatically according to their lane, state, and target rules.
- No units or upgrades can be purchased.
- No existing or newly spawned unit can be manually controlled.
- Energy and capture progress advance.
- Units and structures may be destroyed.
- An HQ death ends the match immediately.
- If both HQs survive until the timer expires, the complete battlefield freezes and the next Command Phase begins.

The Battle Phase UI is informational. Purchase controls are hidden or visibly unavailable.

## Persistent battlefield

Persistence is a core mechanic, not an optimization detail.

At the end of Battle Phase:

- surviving units keep position, HP, target-independent state, and cooldown state
- surviving structures keep HP and upgrade effects
- destroyed Defense Stations remain destroyed
- Node owner and capture progress remain unchanged
- live projectiles remain frozen in place and resume with their remaining lifetime
- simulation-owned hit/death effects freeze and resume or expire through normal Battle time
- no arena cleanup removes valid combatants

At the next deployment, reinforcements spawn behind existing friendly forces and join the persistent lane battle.

Only dead/expired objects are cleaned up. Restart is the only normal action that clears the whole match.

## Teams and factions

### Gameplay teams

- `TEAM_PLAYER`
- `TEAM_ENEMY`

Team determines ownership, valid targets, forward direction, spawn side, UI affiliation, and victory relationship.

### Initial visual factions

- Player: Nairan
- Enemy: Kla'ed
- Reserved for later: Nautolan

Faction is a visual/data presentation choice in V1. Both teams use the same unit costs and base combat definitions. Faction-specific balance is outside the first slice.

## Unit roster

All numerical values are provisional and live in central data definitions.

| Unit | Role | Intended strength | Intended weakness | Initial cost |
| --- | --- | --- | --- | ---: |
| Scout | cheap screen/capture mass | fast, cheap, helps contest Nodes | low HP and damage | 50 |
| Fighter | standard light combat | reliable damage against light ships | lacks burst and durability | 90 |
| Bomber | glass cannon/siege | high damage against structures and heavy targets | slow, fragile, needs protection | 140 |
| Frigate | frontline/tank | high HP, protects a push, steady fire | slow and relatively expensive | 180 |
| Battlecruiser | later heavy pressure | durable damage platform | high opportunity cost | 320 provisional |
| Dreadnought | later capital finisher | major late-game fleet anchor | very expensive and slow | 520 provisional |

The initial balance must give all four V1 units a situational reason to buy. Unit count should remain low enough for silhouettes and projectiles to be readable on a 360-pixel-wide screen.

### Required runtime unit state

Every unit has at least:

```text
id, team, laneId, unitType
x, y, hp, maxHp
speed, attackRange, aggroRange
damage, fireInterval, fireCooldown
targetId, state, alive
```

### Unit states

- `ADVANCING`: moving forward toward the next lane objective
- `ENGAGING`: fighting an opposing unit
- `HOLDING`: stopped by combat conditions or occupying a Node area
- `ATTACKING_STRUCTURE`: attacking the lane's Defense Station or enemy HQ
- `DEAD`: removed from targeting and awaiting cleanup/effects

`CAPTURING` is presented through Node presence and may be added as a display substate. Capture must not cause a unit to ignore an immediate hostile threat.

## Movement and formations

- Units move only along their assigned lane, with a small lateral slot offset for readability.
- No general-purpose pathfinding is required for the first map.
- Units normally face their team's forward direction and rotate toward an active target only as needed for visual clarity.
- Reinforcements spawn in small deterministic formations rather than on the same pixel.
- Frigates and other frontline roles take leading formation slots; lighter and fragile roles begin slightly behind or to the side.
- Formation is a spawn arrangement, not a formation-control simulation.
- Units may separate while engaging and return toward the lane centerline when advancing.
- A bounded rear leash prevents units from chasing an enemy deep toward their own spawn side.

## Targeting contract

Targeting must be stable, lane-local, and visually predictable.

### Default priority

1. Keep the current target while it is alive, hostile, on the same lane, and within the target leash.
2. Acquire a hostile unit on the same lane inside aggro range.
3. Advance toward and attack the next living enemy structure for that lane.
4. After the lane Defense Station is destroyed, advance toward and attack the enemy HQ.

### Selection rules

- Never target an object on the other lane.
- Prefer the nearest valid threat along the direction of travel.
- Use distance, role preference, and stable entity ID as deterministic tie-breakers.
- Do not retarget every frame when the current target remains valid.
- Do not cross the whole map backward for a theoretically nearer target.
- Units cannot damage their own team.

### Initial role preferences

- Scout: no special preference.
- Fighter: lightly prefers light units.
- Bomber: prefers structures or heavy units when valid targets are comparably reachable.
- Frigate: prefers the closest frontline threat.

These preferences are small tie-breakers. V1 does not require a large rock-paper-scissors counter table.

## Structures

### Headquarters

Each team owns one HQ.

- It has high HP and a prominent health display.
- It is visually larger than units and Defense Stations.
- It is the final attack target for both lanes.
- It may use a simple automatic defensive attack.
- It has no complex active ability in V1.
- Its asset key is replaceable and does not affect collision, HP, or targeting rules.

### Defense Station

Each team owns one Defense Station per lane.

- It has HP and an automatic lane-local attack.
- It targets hostile units in range.
- It can be destroyed and remains destroyed.
- It blocks normal access to the HQ from its lane while alive.
- Turret Upgrade increases the damage of all surviving stations owned by that team.
- Upgrading does not revive a destroyed station.

## Energy Nodes

Each lane contains one neutral, non-destructible Energy Node near its center.

### Capture presence

- Only living units within the Node radius count.
- If only Player units are present, progress moves toward Player control.
- If only Enemy units are present, progress moves toward Enemy control.
- If both teams are present, the Node is contested and progress stops.
- If no units are present, progress remains where it is.

### Ownership model

Capture progress ranges from `-100` to `+100`:

- `+100`: Player-owned
- `-100`: Enemy-owned
- between the thresholds: current owner remains until opposing pressure crosses `0`
- crossing `0` while reversing control neutralizes the Node
- reaching the opposite threshold establishes the new owner

This creates a readable neutralize-then-capture sequence and prevents a single brief presence from immediately removing established income.

The exact capture rate and radius are starting values in map/balance data.

## Economy

### Resource

Energy is the only match resource.

### Starting values

```text
Starting Energy: 300
Base Income: 20 Energy/second
Node Income: 10 Energy/second per controlled Node
Economy Upgrade: +20% base income per level
```

Energy is represented internally as a number and may accumulate fractional values. The HUD may display whole Energy while purchase validation uses the exact balance.

### Income formula

```text
incomePerSecond =
  (baseIncome × economyUpgradeMultiplier + controlledNodes × nodeIncome)
  × matchEscalationMultiplier
```

Economy Upgrade affects base income. Node income is not multiplied by Economy Upgrade. Match escalation multiplies the complete income stream for both teams.

Income advances only during active Battle simulation.

### Match escalation starting values

| Active Battle time | Income multiplier |
| --- | ---: |
| 0–2 minutes | 1.0× |
| 2–4 minutes | 1.5× |
| 4–6 minutes | 2.0× |
| after 6 minutes | 3.0× |

Active Battle time excludes Command and Pause time.

The post-six-minute stage is the initial Sudden Death pressure. If income alone does not prevent stalled matches, free base waves may also scale through centralized configuration after playtesting.

## Automatic base waves

Every Deployment Cycle grants both teams:

```text
2 free Scouts per lane
```

Starting values are configurable.

The base wave:

- costs no Energy
- is shown separately from paid queue entries
- cannot be removed
- deploys even when no purchase is made
- uses the same unit definitions as paid Scouts
- ensures both lanes remain active and limits indefinite passive saving

## Upgrades

### Economy Upgrade

- Adds `+20%` base income per level as a starting value.
- Cost increases by level through a data-defined curve.
- Applies to future Battle income immediately.

### Turret Upgrade

- Adds `+20%` Defense Station damage per level as a starting value.
- Cost increases by level through a data-defined curve.
- Applies to all currently living and future-relevant stations owned by the buyer.
- Does not heal, revive, or add HP in V1.

Starting cost proposals:

```text
Economy Upgrade: 240 × 1.75^currentLevel
Turret Upgrade: 180 × 1.65^currentLevel
```

Costs are rounded to configured whole-Energy increments. These are test values, not product commitments.

## AI contract

The AI is a participant, not a separate spawn director.

It owns:

- Energy balance
- base and Node income
- planned waves for both lanes
- Economy and Turret Upgrade levels
- the same unit catalog and costs
- the same free base waves

It acts only through the same validated command API used by the player.

### Initial heuristic inputs

- friendly and hostile effective unit strength per lane
- distance of each frontline from friendly structures
- turret HP and destroyed state
- Node owner and capture progress
- current Energy and income
- available upgrades and unit costs
- match escalation stage

### Initial heuristic behavior

- reinforce a lane under immediate structure pressure
- exploit a visibly weaker enemy lane
- reserve a bounded share for Economy in safe situations
- buy Turret Upgrade when defense is threatened and the upgrade remains efficient
- sometimes save toward a configured heavy-unit goal
- build a useful mixture instead of spending only on the highest-cost option

All decisions must be reproducible from the match seed and state. Difficulty tuning should change heuristic weights or planning quality, not grant permanent hidden resources.

## Command Phase UI contract

The battlefield remains the main visual context.

The player must see at a glance:

- selected lane
- free base wave for each lane
- paid queued units for each lane
- cost of each available unit
- total committed cost and remaining Energy
- current income and Node bonuses
- Economy and Turret Upgrade availability/cost
- explicit waiting-for-player state
- clear `DEPLOY WAVE` action

Adding and removing a planned unit should require few taps and give immediate visual and numeric feedback. Touch targets must be comfortably usable with one thumb.

If space requires a lane selector, switching lanes changes only which queue is edited; it does not select battlefield units.

## Battle Phase UI contract

The Battle UI emphasizes observation:

- phase label and Battle time remaining
- Player and Enemy HQ health
- Defense Station health/state
- Energy and current income
- Node ownership/contested state
- lane pressure summary

Purchase controls are absent or clearly disabled. The HUD must not cover the center engagements or create the impression of required combat tapping.

## Visual direction

The game uses space and galaxy imagery with a brighter, cleaner, friendly arcade tone.

Preferred palette:

- navy/deep blue foundation
- brighter space blue
- cyan and soft teal
- lavender
- warm coral/orange for the enemy
- white and cool gray for structures

Avoid grimdark presentation, heavy cyberpunk neon, near-black battlefields, constant bloom, and effects that obscure ships.

Readability rules:

- every class has a distinct size and silhouette
- team identity remains visible without relying only on tiny projectiles
- effects are short and bounded
- explosions do not hide the surrounding formation
- lanes and Nodes remain visible beneath background art
- capital ships are immediately recognizable when introduced

## Audio direction

V1 needs functional feedback for deployment, purchase rejection, weapon impact, destruction, Node capture, structure damage, and match result. Cues remain throttled so fleet battles do not become noise.

The Galalaxy music file is excluded until its provenance is documented. The game must remain fully playable with synthesized cues or without music.

## Mobile and desktop requirements

Primary design space starts from `420 × 760`.

Required portrait checks:

- `360 × 800`
- `390 × 844`
- `393 × 852`
- `412 × 915`
- `420 × 760`

Requirements:

- no horizontal scrolling
- safe-area-aware top and bottom UI
- sufficiently large touch targets
- no essential information behind browser chrome
- stable coordinate mapping during visual viewport changes
- mouse acts as touch for all primary actions
- desktop window sizes remain functional, with letterboxing permitted

## Performance contract

- Canvas renders units; no DOM element is created per combat entity.
- Units, projectiles, particles, zaps, and destruction effects have central caps or budgets.
- Target acquisition and projectile collision are lane-local.
- Rendering never mutates gameplay state.
- Effects reduce cost on coarse-pointer/mobile profiles.
- New allocations inside per-frame inner loops are avoided when they become measurable.
- A stress scenario must cover multiple accumulated waves on both lanes.

The first slice does not require a spatial tree if lane-local arrays meet performance targets.

## Debug and QA requirements

`?debug=1` should expose:

- FPS
- match state and phase time
- cycle number and active Battle time
- Player and Enemy Energy/income
- unit count per team/lane
- Node owner/progress
- current escalation multiplier
- last AI decision
- deterministic match seed

`?test=match` should run an accelerated, reproducible match scenario.

Core automated acceptance follows the list in `ROADMAP.md`, including phase freeze, purchase accounting, simultaneous deployment, lane binding, survivor persistence, Node income, structures, match result, restart, AI budget, and mobile viewport containment.

## Desired match dramaturgy

### Early game

Small Scout/Fighter groups contest Nodes and establish initial lane advantages.

### Mid game

Bombers and Frigates create clearer pushes. Turrets come under pressure and Economy differences become visible.

### Late game

Higher income enables heavy fleets. Multiple surviving waves combine into large but readable pushes.

### Finale

One lane defense breaks, the push reaches the HQ, and the match ends in a satisfying automatic fleet battle.

The game must avoid endless equilibrium. Match duration is a balancing output, not a fixed wave-count victory condition.

## Vertical Slice acceptance

The slice is ready for a game-fun evaluation when:

- a player can start, complete, win or lose, and restart a match
- both lanes and all structures are functional
- Command and Battle timing obeys the freeze contract
- surviving units visibly accumulate across cycles
- all four V1 unit types have readable roles
- Energy, Nodes, both upgrades, and escalation work
- AI completes matches without cheats or overspending
- the full loop is usable at all required portrait sizes
- no manual unit control exists
- the match can be reproduced in accelerated QA mode

Only after this gate should content breadth expand.

## Explicitly out of scope

- multiplayer, PvP, backend, accounts, or matchmaking
- shop, real money, advertising, battle pass, or gacha
- deckbuilding, random card hands, booster packs, or inventory
- campaign map or story production
- meta-progression or large technology trees
- third lane or multiple V1 maps
- hero unit or manual abilities
- direct unit selection or movement
- many factions or broad unit catalogs
- complex HQ abilities

## Change control

The binding rules at the top of this document require an explicit product decision to change. Starting values, costs, timings, rates, ranges, and role weights are balance data and may change through measured playtesting without rewriting the core contract.
