# Strategy Galalaxy – Architecture Contract

Stand: 2026-09-10

Dieses Dokument beschreibt die Zielarchitektur des Core-Gameplay-Reworks. Die Produktspezifikation steht in [STRATEGY_GALALAXY_CORE_VISION.md](../STRATEGY_GALALAXY_CORE_VISION.md), die konkreten Regeln in [GAME_DESIGN.md](GAME_DESIGN.md).

## Migrationsstatus

Bulks 1 bis 3 sind umgesetzt. Die Runtime besitzt keine Kauf-Queue, kein Lock-in, keinen Refund und keine bezahlten Wave-Slots mehr. Der `DeploymentDirector` verwaltet ausschließlich kostenlose Waves; `LiveDeploymentSystem` löst eine Kaufentscheidung datengetrieben in ein oder mehrere Mitglieder auf und verwaltet bezahlte Sofortstarts sowie Cooldowns. Objectives, Turrets und die HQ-Präsentation bleiben bis Bulk 4 Migrationsbestand.

Jeder folgende Bulk muss die Tests gleichzeitig mit dem betroffenen System migrieren. Ein vorübergehend dokumentierter Zielzustand ist zulässig; ein teilweise migriertes öffentliches Kommando ohne Tests ist es nicht.

## Grenzen

Strategy Galalaxy bleibt ein dependency-armes Browsergame mit nativen ES-Modulen und Canvas 2D. Die Simulation läuft deterministisch und unabhängig vom Renderer. Ausschließlich dieses Repository ist beschreibbar; `emfau88/galalaxy` bleibt eine schreibgeschützte Code- und Assetreferenz.

Die Runtime lädt nur die kuratierten Manifeste aus `src/assets.js`, niemals die vollständige Entwicklungsbibliothek.

## Runtime State

```text
LOADING → TITLE → LIVE_MATCH → VICTORY
                   │    ├────→ DEFEAT
                   │    └────→ DRAW
                   ↓
                 PAUSED
                   │
                   └────────→ LIVE_MATCH
```

`LIVE_MATCH` ist der einzige aktive Simulationszustand. Pause friert Fixed-Step-Zeit, Kampf, Economy, Cooldowns, automatische Waves und KI gemeinsam ein.

## Zeitmodell

Authoritative Systeme laufen mit `1/60 s` und begrenztem Catch-up. Rendering folgt dem Animation Frame, löst aber niemals Spawn, Projektil, Treffer oder Schaden aus.

Der automatische Wave-Timer verwendet Simulationszeit:

- erste kostenlose Basis-Wave beim Matchstart;
- anschließend initial 22 Sekunden Intervall;
- kein Lock-in;
- keine Abhängigkeit zu bezahlten Deployments oder Upgrade-Käufen;
- nach Ablauf automatische Wave beider Teams und Neustart des Timers.

Live-Deployments besitzen eigene datengetriebene Cooldowns. Eine optionale Launch-Animation verzögert ausschließlich die Teilnahme der bereits erzeugten Schiffe am Kampf.

## Modulverantwortung im Zielzustand

| Modul | Verantwortung |
| --- | --- |
| `src/game.js` | Browser-Lifecycle, Input-Routing, Fixed-Step-Orchestrierung und Render Model |
| `src/core/battlefieldCamera.js` | Begrenzte vertikale Kamera, Welt-/Screen-Transformation und Drag-Inertia |
| `src/ui/cameraUi.js` | Layout und Hit-Mapping des strategischen Navigators |
| `src/simulation/matchDirector.js` | Matchzustände und Reihenfolge spezialisierter Systeme |
| `src/simulation/deploymentDirector.js` | Ausschließlich Timer, Zyklus, kostenlose Basis-Waves und deren Kapazitäts-Backlog |
| `src/simulation/liveDeploymentSystem.js` | Live-Kauf, Squad-Auflösung, Cooldowns, Kapazitätsprüfung und Spawn-Anforderung |
| `src/simulation/commandSystem.js` | Öffentliche Spieler- und KI-Kommandos mit gemeinsamer Validierung |
| `src/simulation/economySystem.js` | Energie, Basiseinkommen, Ausgaben und aktive Upgrades |
| `src/simulation/battleSimulation.js` | Bewegung, Formation, Targeting, Feuer, Projektile und Schaden |
| `src/simulation/captureSystem.js` | Optionales Capture; läuft nur bei aktivem Map-Feature |
| `src/simulation/opponentAi.js` | Regelgebundene Entscheidungen ausschließlich über öffentliche Kommandos |
| `src/rendering/battlefieldRenderer.js` | Welt, Flotten, Carrier, optionale Strukturen, Projektile und Trails |
| `src/rendering/presentationEffects.js` | Ereignisgetriebene kurzlebige Darstellungseffekte |
| `src/rendering/uiRenderer.js` | Energie, Auto-Wave-Timer, Lane-Wahl, Einheiten, Kosten und Cooldowns |

`liveDeploymentSystem.js` ist seit Bulk 2 der autoritative Pfad für bezahlte Einheiten. Der `DeploymentDirector` darf keine bezahlten Einträge annehmen.

## Map-Vertrag

Mapdefinitionen besitzen:

- `bounds` mit unveränderter Scroll-Welthöhe;
- eine nichtleere Liste beliebiger `lanes`;
- pro Lane ID, Mittelpunkt, Breite sowie Spieler- und Gegner-Spawn;
- eine `features`-Konfiguration.

Der Core-Slice deklariert:

```js
{
  captureNodes: false,
  economyBuildings: false,
  defensiveTurrets: false,
  neutralStructures: false,
  commandCarriers: true,
  centerDecorations: false,
  edgeDecorations: true,
}
```

Feature-Verbraucher müssen fehlende Flags für Legacy- oder Testmaps bewusst behandeln. Eine neue Map darf optionale Nodes oder Strukturen nur erzeugen, simulieren, rendern und in der KI bewerten, wenn das zugehörige Feature aktiv ist.

Keine Schleife darf `LEFT` und `RIGHT` als vollständige Lane-Menge annehmen. Die autoritative Menge stammt aus `map.lanes`. Level 1 besitzt eine Center-Lane, Level 2 Left und Right.

## Live-Deployment-Invarianten

Beide Teams benutzen denselben Pfad:

```text
Spieler- oder KI-Intent
  → CommandSystem
  → Team-, Lane-, Energie-, Cooldown- und Kapazitätsprüfung
  → einmalige Energieabbuchung
  → Squad-Mitglieder bestimmen
  → BattleSimulation.spawnFormation
  → Cooldown starten
```

Bei einem Fehler darf kein Teilschritt dauerhaft mutiert bleiben. Kosten gelten pro Kaufentscheidung, Kapazitäten pro sichtbarem Mitglied. Eine gültige Lane ist zwingend; bei Ein-Lane-Maps darf die UI sie automatisch einsetzen.

Die automatische Wave benutzt denselben Formation-Spawn, aber weder Energie noch Live-Cooldowns.

## Simulation

- Units, Structures, Projectiles und optionale Nodes besitzen stabile IDs.
- Ein Squad besteht aus individuellen Units mit gemeinsamer Lane, gemeinsamem Kaufkontext und Formation Anchor.
- `squadSize` bestimmt die sichtbare Mitgliederzahl eines Kaufs; `spawnFormation` prüft die gesamte Gruppe vorab und erzeugt niemals eine Teilformation.
- Launching Units sind bis zum Abschluss ihrer kurzen Traversal von Targeting, Capture und Separation ausgeschlossen.
- Geschwindigkeit, Heading, Formation und Waffenreichweite sind autoritative Simulationswerte.
- Units wechseln niemals ihre Lane.
- Snapshot-basiertes Targeting, wechselnde stabile Update-Reihenfolge und gebündelte Schadensauflösung verhindern Team-Bias.
- Projektilbudgets gelten pro Team und Lane; ein globales Limit bleibt Sicherheitsnetz.
- Salven teilen ihren Gesamtschaden auf sichtbare Projektile auf.
- Präsentationseffekte verändern keine Simulation.
- Gleichzeitige Zerstörung beider Carrier im selben Fixed Step ergibt `DRAW`.

Die bestehende Strukturart `hq` darf während der Migration das Matchziel und den Launchursprung repräsentieren. Darstellung und UI behandeln sie als Command Carrier. Eine spätere interne Umbenennung darf nur erfolgen, wenn sie das Modell vereinfacht.

## Feature-Isolation

Optionale Systeme werden deaktiviert statt gelöscht:

- `captureNodes: false` verhindert Erzeugung, Simulation, Targeting, Einkommen, Navigator- und World-Darstellung der Nodes.
- `defensiveTurrets: false` verhindert Erzeugung, Targeting, Upgrades, KI-Bewertung und Darstellung der Turrets.
- Gebäude- und Neutral-Flags verhindern zugehörige Entities und Economy-Effekte.
- Dekorationsflags steuern ausschließlich Rendering und Assets, nie Kampfregeln.

Diese vollständige Isolation wird in Bulk 4 umgesetzt. Bulk 1 stellt dafür den verbindlichen Mapvertrag bereit.

## Mobile Rendering und Input

Die logische Breite bleibt 420. Die Portrait-Designhöhe wächst passend zum Gerät, während die Simulationswelt 1180 Einheiten hoch bleibt. Nur der Battlefield-Layer wird durch die Kamera geclippt und verschoben; HUD und Eingaben bleiben im Screen Space.

Das Ziel-HUD enthält keine Queue-, Slot-, Undo- oder Lock-in-Zustände. Unit Cards benötigen einen großen Touchbereich sowie getrennte Zustände für verfügbar, zu teuer und Cooldown. Bei mehreren Lanes ist die aktuelle Auswahl dauerhaft sichtbar.

## Verifikation

Die Foundation-Suite sichert bereits Determinismus, Combat, Economy, Kamera und fünf Portrait-Viewports. Während der Migration werden zusätzlich verbindlich:

- sofortiges Deployment und atomare Fehlerfälle;
- Cooldown-Ablauf ausschließlich in Live-Simulationszeit;
- getrennte automatische Waves;
- Squad-Kosten und Kapazität;
- eine und zwei Lanes ohne feste Lane-Annahme;
- vollständige Isolation deaktivierter Features;
- identische öffentliche Regeln für Spieler und KI;
- Carrier-basierte Sieg-, Launch- und HUD-Pfade.

Stress- und Browserprüfungen bleiben Pflicht, sobald ein Bulk Runtime- oder Renderingverhalten verändert.
