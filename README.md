# Strategy Galalaxy

**[▶ Strategy Galalaxy spielen](https://emfau88.github.io/strategy-galalaxy/)**

Strategy Galalaxy ist ein eigenständiges Mobile-First-Space-Lane-Wars-Spiel im Portraitformat. Zwei Flotten kämpfen kontinuierlich auf einer hohen, vertikal erkundbaren Karte. Energie entsteht permanent, kostenlose Drone-Waves halten die Front aktiv und bezahlte Einheiten beziehungsweise Squads sollen unmittelbar nach der Entscheidung starten.

```text
Die Front beobachten
  → Einheit oder Squad und gegebenenfalls Lane wählen
  → Verstärkung sofort losschicken
  → sichtbare Wirkung an der Front beobachten
  → auf die gegnerische Reaktion antworten
```

Es gibt keine direkte Schiffssteuerung und keine Kampfunterbrechung zum Planen. Die automatische Wave und das Live-Deployment sind getrennte Systeme. Level 1 besitzt eine Lane, Level 2 zwei Lanes; weitere Maps dürfen andere Lane-Strukturen verwenden.

## Aktueller Spielstand

Die verbindliche Zielrichtung steht in [Core Gameplay Vision](STRATEGY_GALALAXY_CORE_VISION.md). Bulks 1 und 2 sind umgesetzt: Die Runtime nutzt bereits sofortiges Deployment mit Cooldowns und davon unabhängige automatische Drone-Waves. Nodes, Turrets und die bisherige HQ-Darstellung werden im späteren Map-/Carrier-Bulk deaktiviert beziehungsweise ersetzt.

- Kontinuierlicher `LIVE_MATCH` ohne Kauf-Queue, Lock-in, Refund oder bezahlte Wave-Slots.
- Scout, Fighter, Bomber und Frigate starten unmittelbar in der gewählten Lane; eine kurze Hangar-Traversal inszeniert den Launch.
- Eigene datengetriebene Cooldowns pro Einheitentyp laufen ausschließlich in aktiver Simulationszeit.
- Kosten und Cooldown werden atomar erst nach erfolgreichem Spawn gesetzt.
- Kostenlose symmetrische Drone-Waves starten unabhängig davon initial alle 22 Sekunden und besitzen einen eigenen Kapazitäts-Backlog.
- Reactor- und Weapons-Upgrades können jederzeit gekauft werden und wirken unmittelbar. Frühere Logistics-Slots sind entfernt; Turret-Upgrades sind auf Core-Maps nicht verfügbar.
- Die KI verwendet für ihre vorläufigen Wave-Entscheidungen denselben Live-Deployment-Befehl, dieselben Kosten und Cooldowns.
- Zwei wählbare Karten: Level 1 „Orbital Garden“ mit einer Lane und Level 2 „Twin Fronts“ mit zwei Lanes; beide nutzen eine `420 × 1180` Scroll-Welt.
- Eine schmale strategische Kartenleiste zeigt Fronten, Strukturen, Nodes und den aktuellen Kameraausschnitt.
- Gedeckelte Economy mit 270 Startenergie in Level 1 beziehungsweise 300 in Level 2, 16 Basisenergie/s und maximal 780 gespeicherter Energie; Node-Einkommen wird mit Bulk 4 entfernt.
- Scout, Fighter, Bomber und Frigate besitzen eigene Rollen, Formationen und Zielprioritäten.
- Zwei vereinheitlichte hochauflösende Flottenfamilien mit identischer Draufsicht und Beleuchtung: Elfenbein/Messing/Cyan für den Spieler, Anthrazit/Kupfer/Coral für den Rivalen. Drones besitzen nun eigene kleinere Hüllen. Die flammenfreien Schiffe nutzen die originalen animierten Nairan-/Kla'ed-Triebwerksflammen aus Galalaxy, die als enge Asset-Crops an exakt kalibrierten Düsenpunkten sitzen.
- Acht eigenständige Waffen-Sprites trennen Klasse und Fraktion sofort: Spielerfeuer ist cyan/elfenbein/messingfarben, Rivalenfeuer coral/kupfer/anthrazit. Scout-Pulse, Fighter-Laser, Bomber-Homing-Raketen und Frigate-Geschosse besitzen eigene Silhouetten sowie kurze Echos, lange Laserkerne, segmentierte Abgaswege beziehungsweise schwere gestrichelte Wakes. Mehrfachsalven bleiben schadensneutral; Frigate-Breitseiten starten sichtbar nacheinander von drei Hardpoints.
- Deutliches Schadensfeedback durch kurzen Hull-Flash, expandierende Schildkontur, projektilabhängigen Impact-Glow, Funken und situative Healthbars. Jeder Schiffstyp spielt beim Tod seine originale 8–18-phasige Galalaxy-Zerstörungssequenz mit deren 14-FPS-Timing; Turrets und HQs nutzen längere, silhouettenfreie Struktur-Explosionen.
- Noch vorhandene Defense Turrets und Headquarters bleiben bis zum Map-/Carrier-Bulk funktionaler Migrationsbestand.
- Keine großflächigen Team-Neonringe oder dekorativen Orbit-Ellipsen; Nodes zeigen Capture-Fortschritt kompakt unterhalb des Sprites.
- Faire Projektilbudgets pro Team und Lane sowie globale Sicherheitsgrenzen für mobile Geräte; die Kartenleiste pulsiert bei frischen Offscreen-Treffern und Zerstörungen.
- Responsive Canvas-Höhe mit bildschirmfestem HUD und einer davon entkoppelten `420 x 1180` Spielwelt. Die beiden Level-1-Hintergrundsektoren werden proportional beschnitten und weich überblendet, nicht auf Mobile verzerrt.
- Über das Pause-Menü kann jederzeit zum Hauptmenü zurückgekehrt werden; der Ergebnisbildschirm bietet getrennt „Play Again“ und „Main Menu“.
- Größere Mobile-Touchflächen, direkt in den Lane-Tabs sichtbarer Druckvergleich sowie ein kurzer Drei-Schritte-Einstieg auf dem Startbildschirm.
- Integriertes HQ-Kommandomenü: Der Normalzustand zeigt Lane, Live-Deployment und Auto-Wave-Timer; ein Tap auf das eigene HQ oder „Command“ öffnet Fleet- und Upgrade-Tabs.
- Schaltbare, synthetisierte Combat-Sounds und an echte Nutzergesten gebundenes Haptik-Feedback ohne zusätzliche Audio-Lizenzabhängigkeit.
- Vollständige lizenzierte Galalaxy/Foozle-Assetbibliothek im Repository; die Runtime lädt in zwei Stufen nur 36–38 aktive Bilder pro Level. Große Level-1-Quellen besitzen mobile `840 px`-Ableitungen, und GitHub Pages veröffentlicht ausschließlich das kuratierte Spielartefakt statt der 516 Referenzdateien.

## Einheiten

| Schiff | Rolle | Waffenbild | Live-Cooldown |
| --- | --- | --- | ---: |
| Drone | automatische, fragile Grundwelle | kleiner Pulse/Bullet | nicht kaufbar |
| Scout | schneller Screen | leichter Pulse/Bullet | 2,5 s |
| Fighter | Anti-Light- und Anti-Bomber-Escort | schnelle Bolt-/Ray-Salve | 4 s |
| Bomber | verwundbarer Siege- und Anti-Heavy-Angreifer | sichtbare Homing-Rakete/Torpedo | 6 s |
| Frigate | langlebiger Frontline-Anker | langsamer, schwerer Ray/Big Bullet | 8 s |

Die Darstellung bleibt klassenabhängig, nutzt im höheren Schlachtfeld aber größere Silhouetten. Kollisionsradien und Simulationswerte bleiben davon getrennt; spätere Atlas-Zuschnitte können noch mehr sichtbare Details schaffen, ohne das Gameplay heimlich zu verändern.

## Repository-Grenze und Assets

Entwickelt und gepusht wird ausschließlich in:

`https://github.com/emfau88/strategy-galalaxy.git`

Das Originalprojekt bleibt eine strikt schreibgeschützte technische und visuelle Referenz:

`https://github.com/emfau88/galalaxy.git`

Die lizenzierte Bibliothek liegt unter `assets/library/galalaxy/`. Übernommen wurden alle sechs Foozle-Pakete sowie die vorhandenen Galalaxy-UI-Dateien vom geprüften Referenz-Commit `7f90d17a063967f9978e74f6519c450a2b0e4f85`. `assets/music/track1.ogg` wurde wegen fehlender dokumentierter Distributionsrechte bewusst ausgeschlossen. Details stehen in [Source Provenance](docs/SOURCE_PROVENANCE.md) und [Asset Inventory](docs/ASSET_INVENTORY.md).

## Lokal starten

Das Projekt nutzt native Browsermodule und benötigt keinen Build-Schritt.

```powershell
python -m http.server 8765 --directory .
```

Anschließend `http://127.0.0.1:8765/` öffnen. `?debug=1` blendet Diagnosewerte ein; `?test=match` startet direkt einen reproduzierbaren Testmatch. Beides lässt sich kombinieren. Im Spiel zieht man das Schlachtfeld vertikal oder springt über die rechte Kartenleiste. Ein Tap auf das eigene HQ oder den unteren Command-Dock öffnet Fleet und Upgrades; dort werden Lane, Einheiten, Forschung und Undo gewählt. Der kleine Pfeil zwischen den Tabs schließt die Konsole wieder. `P` pausiert; das Pause-Menü kann fortsetzen oder zum Hauptmenü zurückkehren. Das Symbol oben rechts fordert Browser-Fullscreen an.

Für das schlanke GitHub-Pages-Artefakt wird `npm.cmd run build:pages` verwendet. Es kopiert Code und nur die tatsächlich aktiven Level-, Flotten-, Projektil- und VFX-Dateien nach `dist/`.

## Prüfen

```powershell
npm.cmd run check
npm.cmd run test:stress
npm.cmd run test:browser
npm.cmd run test:pages
npm.cmd run balance:sim -- 100
npm.cmd run balance:experiments -- 30
npm.cmd run balance:investments -- 8
```

Die Prüfungen decken Simulation, sofortiges Deployment, Cooldowns, automatische Waves, Economy, Upgrades, Capture-Migrationsbestand, Targeting, Kartengeometrie, dichte Flotten, Projektile, alle Runtime-Manifeste und die 516 Dateien der importierten Bibliothek ab. Der Browserlauf emuliert fünf echte Mobile-Viewports und prüft Start, Schwierigkeitswahl, Live-Touch-Deployment, Pause, Sound, Kamera sowie Console-/Netzwerkfehler.

## Dokumentation

- [Verbindliche Core Gameplay Vision](STRATEGY_GALALAXY_CORE_VISION.md)
- [Aktuelle Core-Rework-Roadmap](IMPLEMENTATION_ROADMAP.md)
- [Aktuelle Product-Polish-Gesamt-To-do-Liste](docs/PRODUCT_POLISH_ROADMAP.md)
- [Level-2-Art-Direction und gewählte Hybridrichtung](docs/LEVEL_2_VISUAL_DIRECTIONS.md)
- [Level-1-Konzept: Orbital Garden](docs/LEVEL_1_ORBITAL_GARDEN_CONCEPT.md)
- [Umsetzungsplan](ROADMAP.md)
- [Game-Design-Vertrag](docs/GAME_DESIGN.md)
- [Architektur-Vertrag](docs/ARCHITECTURE.md)
- [Referenz-Audit](docs/REFERENCE_AUDIT.md)
- [Asset-Inventar](docs/ASSET_INVENTORY.md)
- [Verbindliche Art Direction](docs/ART_DIRECTION.md)
- [Repository-Regeln](docs/REPOSITORY_RULES.md)

## Status

Bulks 1 und 2 des neuen Core-Reworks sind abgeschlossen: Produktvertrag und Map-Flags stehen, bezahlte Deployments starten sofort mit datengetriebenen Cooldowns, automatische Waves sind technisch getrennt und Upgrades wirken live. Bulk 3 erweitert diesen Pfad um echte Mehrschiff-Squads.
