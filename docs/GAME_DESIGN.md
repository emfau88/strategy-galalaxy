# Strategy Galalaxy – Game Design Contract

Stand: 2026-09-10

Dies ist der implementierungsnahe Zielvertrag für den Core-Gameplay-Umbau. Die Produktentscheidung steht in [STRATEGY_GALALAXY_CORE_VISION.md](../STRATEGY_GALALAXY_CORE_VISION.md). Ältere Queue-, Lock-in-, Capture- und Zwei-Lane-Vorgaben sind nicht mehr verbindlich.

## Core Loop

Strategy Galalaxy ist ein portraitorientiertes Echtzeit-Lane-Wars-Spiel ohne direkte Schiffssteuerung.

```text
Front lesen → Verstärkung wählen → Lane bestimmen → sofort starten
           → Wirkung beobachten → auf Gegner reagieren
```

Kampf, Bewegung, Energie, automatische Waves, Cooldowns und KI laufen ausschließlich im Zustand `LIVE_MATCH`. Pause friert sie gemeinsam ein.

## Levelvertrag

| Level | Lanes | Weltgröße | Lane-Wahl |
| --- | ---: | ---: | --- |
| Orbital Garden | 1 | 420 × 1180 | automatisch |
| Twin Fronts | 2 | 420 × 1180 | vor Deployment durch Spieler oder KI |

Lane-Anzahl, Lane-IDs, Spawnpunkte und Breiten kommen immer aus der Mapdefinition. Die Simulation darf keine feste Zwei-Lane-Annahme besitzen. Einheiten wechseln ihre Lane während ihres Lebens nicht.

Die vertikal scrollbare Welt bleibt unabhängig vom festen HUD. Direktes Touch-/Pointer-Panning und der strategische Navigator bleiben erhalten.

## Deployment

Live-Deployment und automatische Basis-Waves sind getrennte Systeme.

### Live-Deployment

- Ein erfolgreicher Kauf zieht Energie sofort ab.
- Der Befehl enthält Team, Einheit beziehungsweise Squad und eine gültige Lane.
- Die Mitglieder starten innerhalb von höchstens 1,5 Sekunden am eigenen Command Carrier.
- Nach einem erfolgreichen Kauf beginnt der definierte Cooldown.
- Ein fehlgeschlagener Kauf verändert weder Energie noch Cooldown.
- Es gibt keine Kauf-Queue, keine bezahlten Wave-Slots, kein Lock-in und kein Undo.
- Kapazitätsgrenzen werden anhand der tatsächlich erzeugten Squad-Mitglieder geprüft.

### Automatische Wave

- Der erste kostenlose Druck entsteht unmittelbar beim Matchstart.
- Danach startet initial alle 22 Sekunden je Team und Lane eine kleine kostenlose Drone-Wave.
- Der Timer beeinflusst keine bezahlten Deployments.
- Ein Kapazitäts-Backlog darf ausschließlich automatische Einheiten betreffen.
- Der HUD-Timer heißt „Next reinforcement wave“ und verspricht keinen Kaufzeitpunkt.

## Economy und Upgrades

- Energie regeneriert permanent aus einem Basiseinkommen und bleibt gedeckelt.
- Capture- oder Gebäude-Einkommen ist im Core-Slice deaktiviert.
- Einheit, Squad und Upgrade konkurrieren um dasselbe Energiebudget.
- Upgrades können jederzeit im laufenden Match gekauft werden.
- Ein Upgrade wird unmittelbar nach erfolgreichem Kauf aktiv; ein kurzer Präsentationseffekt darf die Aktivierung sichtbar machen.
- Shield Array schützt alle vorhandenen und zukünftigen Schiffe mit 15/25/35 % ihrer
  Hüllenstärke. Es regeneriert erst nach 8/7/6 Sekunden ohne weiteren Treffer und lädt
  anschließend in 12/10/8 Sekunden vollständig; Dauerfeuer unterdrückt die Ladung.
- Logistics als zusätzlicher Wave-Slot ist im Live-System kein gültiger Upgrade-Pfad.
- Turret-Upgrades sind ausgeblendet, solange das Level keine Turrets aktiviert.

Startwerte bleiben bis zum Balance-Pass datengetrieben. Bulk 1 ändert noch keine vorhandenen Kosten, Einkommen oder Kampfwerte.

## Squads und Flottenbild

Ein Kauf ist eine taktische Entscheidung, nicht zwingend ein einzelnes Sprite.

| Klasse | Zielmodell |
| --- | --- |
| Drone | kleines Wing, vor allem automatische Basis-Wave |
| Scout | Wing mit drei kleinen beweglichen Screens |
| Fighter | Wing mit zwei Anti-Light-Escorts |
| Bomber | einzelnes mittelgroßes Schiff |
| Frigate | einzelner großer Front- oder Distanzanker |
| Capital Ship | späteres einzelnes sehr großes Schiff |

Squad-Mitglieder sind eigenständige Simulationseinheiten. Sie können einzeln getroffen und zerstört werden, teilen aber Kauf, Cooldown, Lane, Launch und einen Formation Anchor.

Die Kaufzusammensetzung liegt datengetrieben als `squadSize` in der Unit-Definition. Kosten und Cooldown gelten genau einmal pro Kaufentscheidung; das Lane-Limit zählt jedes erzeugte Mitglied. Passt eine Formation nicht vollständig in die Lane-Kapazität, wird sie ohne Teilspawn, Kosten oder Cooldown abgelehnt.

Formationen müssen kleine Abstände halten, den Lane-Korridor respektieren und während einer Begegnung organisch aufbrechen dürfen. Kollisions- und Simulationsradien bleiben von der sichtbaren Sprite-Größe getrennt.

## Kampf

- Einheiten suchen eine rollenabhängige Reichweite und reduzieren dort ihre Vorwärtsbewegung.
- Zielbindung bleibt stabil, solange das Ziel gültig und im Leash-Bereich ist.
- Verbände halten seitlichen Abstand und sollen nicht auf demselben Punkt kollabieren.
- Begegnungen müssen lange genug dauern, um Salven, Verluste und den Gewinner erkennen zu können.
- Nach Ende der Battle Zone bewegt sich der überlebende Verband weiter zum gegnerischen Carrier.

Drone und Fighter nutzen schnelle leichte Salven. Bomber tragen deutlich lesbare Raketen oder andere schwere Angriffe. Frigates kämpfen aus größerer Distanz und dürfen Breitseiten halten.

Projektile und Treffer priorisieren Mobile-Lesbarkeit. Laser besitzen einen sichtbaren Kern, Raketen einen Körper und Trail, schwere Geschosse einen klaren Mündungsblitz und Impact. Zusätzliche Salvo-Projektile dürfen den Gesamtschaden nicht unbemerkt vervielfachen.

## Strukturen und Objectives

Level 1 und 2 verwenden für den Core-Test folgende Feature-Konfiguration:

| Feature | Wert |
| --- | --- |
| `captureNodes` | `false` |
| `economyBuildings` | `false` |
| `defensiveTurrets` | `false` |
| `neutralStructures` | `false` |
| `commandCarriers` | `true` |
| `centerDecorations` | `false` |
| `edgeDecorations` | `true` |

Die Flags gehören zur jeweiligen Mapdefinition. Spätere Maps dürfen Features einzeln aktivieren.

Command Carrier sind Spawnursprung und primäres Matchziel. Sie liegen teilweise außerhalb des oberen oder unteren Kartenrands, damit sie groß wirken, ohne Kampffläche zu belegen. Die bestehende HQ-Entität darf während der Migration intern weiterleben; UI und Darstellung behandeln sie als Carrier.

## Hintergrund

Die Spielfeldmitte bleibt dunkel, ruhig und kontrastarm. Subtile Sterne, Nebel und wenige kleine Asteroiden unterstützen Tiefe, ohne mit Schiffen oder Waffen zu konkurrieren. Auffälligere Wracks, planetare Fragmente und Lichtquellen liegen an den Kartenrändern. Gameplay-Objekte verwenden eine echte orthografische Draufsicht ohne sichtbare Seitenfassaden.

## Mobile HUD

Das HUD zeigt jederzeit:

- aktuelle Energie und Produktion pro Sekunde;
- Zeit bis zur nächsten automatischen Wave;
- verfügbare Einheiten oder Squads;
- Kosten und Cooldown;
- klaren Sperrgrund „zu wenig Energie“ oder „Cooldown aktiv“;
- ausgewählte Lane, wenn mehr als eine Lane existiert;
- relevante aktive Upgrade-Level.

Queue-Symbole, Slot-Zähler, Undo und Lock-in-Anzeigen sind nicht Teil des Zielsystems. Touch-Ziele bleiben für kleine Portrait-Displays dimensioniert.

## KI-Fairness

Die KI benutzt denselben öffentlichen Deployment-Befehl, dieselben Kosten, Cooldowns, Lane-Kapazitäten und Energiegrenzen wie der Spieler. Ihr eigener, schwierigkeitsabhängiger Live-Takt ist vom automatischen Wave-Timer unabhängig. Sie bevorzugt grobe Composition-Counter, spart zeitweise sichtbar auf ein Energielimit und löst anschließend einen kleinen Zwei-Kauf-Push in einer Lane aus. Sie erhält keine permanenten Ressourcenboni und umgeht keine Cooldowns.

## Scope-Grenze und Qualitätsziel

Nicht Teil dieses Core-Slice sind neue Capture-Systeme, Tech Trees, Commander-Skills, Meta-Progression, zusätzliche Gebäude, weitere Levels oder direkte Schiffssteuerung.

Der Slice ist bereit für Erweiterungen, wenn reale Mobile-Tests zeigen, dass:

- ein Tap innerhalb von 1,5 Sekunden sichtbare Verstärkung erzeugt;
- die automatische Wave unabhängig weiterläuft;
- Level 1 mit einer und Level 2 mit zwei Lanes verständlich bleiben;
- zehn bis zwanzig sichtbare Schiffe als Flotte statt als Sprite-Klumpen lesbar sind;
- Kämpfe mehrere Sekunden sichtbar eskalieren und die Front nachvollziehbar verschieben;
- Spielerentscheidungen und KI-Reaktionen denselben Regeln folgen.
