# Strategy Galalaxy

**[▶ Strategy Galalaxy spielen](https://emfau88.github.io/strategy-galalaxy/)**

Strategy Galalaxy ist ein eigenständiges, Mobile-First Space-Lane-Wars-Spiel im Portraitformat. Zwei Flotten kämpfen kontinuierlich auf einer hohen, vertikal erkundbaren Karte, während der Spieler die nächste Verstärkungswelle vorbereitet. Beide Seiten deployen automatisch und gleichzeitig alle 22 Sekunden; die letzten zwei Sekunden sind gesperrt.

```text
Die Front beobachten
  → je nach Karte 3–4 Verstärkungen planen
  → Queue bis zum Lock-in anpassen
  → simultanes Deployment nach 22 Sekunden
  → Überlebende kämpfen weiter
  → sofort die nächste Welle planen
```

Es gibt keine direkte Schiffssteuerung und keine Kampfunterbrechung zum Planen. Bewegung, Schüsse, Capture und Einkommen laufen bis zur Zerstörung eines Headquarters weiter.

## Aktueller Spielstand

- Kontinuierlicher `LIVE_MATCH` mit 22-Sekunden-Deployment und Zwei-Sekunden-Lock-in.
- Zwei wählbare Karten: Level 1 „Orbital Garden“ als großzügige Ein-Lane-Front und Level 2 „Twin Fronts“ mit zwei parallelen Lanes; beide nutzen eine `420 x 1180` Scroll-Welt.
- Eine schmale strategische Kartenleiste zeigt Fronten, Strukturen, Nodes und den aktuellen Kameraausschnitt.
- Schwache automatische Drones pro Lane und Deployment sowie kartenabhängig drei oder vier gekaufte Verstärkungsslots; Scouts bleiben wertvolle Capture-Spezialisten.
- Sofortige Energiereservierung, vollständige Rückerstattung vor Lock-in und Upgrade-Aktivierung am nächsten Deployment.
- Gedeckelte Economy mit 270 Startenergie in Level 1 beziehungsweise 300 in Level 2, 16 Basisenergie/s, 7 Energie/s pro Node und maximal 780 gespeicherter Energie.
- Vier konkurrierende, konkret beschriftete Investitionen: Reactor-Einkommen, Arsenal-Flottenschaden, Bastion-Turret-Feuerkraft und zusätzliche Hangar-Slots. Pro Welle kann ein Projekt vorbereitet werden; es wird an der nächsten Deployment-Grenze hörbar und sichtbar aktiv.
- Regelgebundene KI mit denselben Kosten, Slots, Timern, Kapazitäten und Upgrade-Regeln wie der Spieler, drei wählbaren Profilen und genau einer Neubewertung kurz vor dem Lock-in.
- Scout, Fighter, Bomber und Frigate mit eigenen Rollen, Formationen, Zielprioritäten und Capture-Stärken.
- Zwei vereinheitlichte hochauflösende Flottenfamilien mit identischer Draufsicht und Beleuchtung: Elfenbein/Messing/Cyan für den Spieler, Anthrazit/Kupfer/Coral für den Rivalen. Die flammenfreien `v2`-Hüllen besitzen rekonstruierte mechanische Düsen; echte achtphasige Raster-Atlanten animieren je nach Klasse ein bis drei korrekt platzierte Triebwerke ohne Doppelbild.
- Acht eigenständige Waffen-Sprites trennen Klasse und Fraktion sofort: Spielerfeuer ist cyan/elfenbein/messingfarben, Rivalenfeuer coral/kupfer/anthrazit. Scout-Pulse, Fighter-Laser, Bomber-Homing-Raketen und Frigate-Geschosse besitzen eigene Silhouetten sowie kurze Echos, lange Laserkerne, segmentierte Abgaswege beziehungsweise schwere gestrichelte Wakes. Mehrfachsalven bleiben schadensneutral; Frigate-Breitseiten starten sichtbar nacheinander von drei Hardpoints.
- Deutliches Schadensfeedback durch Hull-Flash, expandierende Schildkontur, projektilabhängigen Impact-Glow, Funken und situative Healthbars.
- Modulare Defense Turrets mit eigenem weich nachgeführtem Geschütz, sichtbarem Doppelmündungsfeuer und Schussrückstoß. Cyan- und Coral-Lampen sind direkt in getrennte Team-Basen gemalt; Level 1 nutzt strikt top-down gezeichnete Garten-Turrets und zwei eigenständig ausgerichtete Headquarters statt einer kopfstehenden Spiegelung.
- Keine großflächigen Team-Neonringe oder dekorativen Orbit-Ellipsen; Nodes zeigen Capture-Fortschritt kompakt unterhalb des Sprites.
- Faire Projektilbudgets pro Team und Lane sowie globale Sicherheitsgrenzen für mobile Geräte; die Kartenleiste pulsiert bei frischen Offscreen-Treffern und Zerstörungen.
- Responsive Canvas-Höhe mit bildschirmfestem HUD und einer davon entkoppelten `420 x 1180` Spielwelt. Die beiden Level-1-Hintergrundsektoren werden proportional beschnitten und weich überblendet, nicht auf Mobile verzerrt.
- Über das Pause-Menü kann jederzeit zum Hauptmenü zurückgekehrt werden; der Ergebnisbildschirm bietet getrennt „Play Again“ und „Main Menu“.
- Größere Mobile-Touchflächen, direkt in den Lane-Tabs sichtbarer Druckvergleich sowie ein kurzer Drei-Schritte-Einstieg auf dem Startbildschirm.
- Integriertes HQ-Kommandomenü: Der Normalzustand zeigt nur einen kompakten Command-/Queue-/Status-Dock; ein Tap auf das eigene HQ oder „Command“ öffnet Fleet- und Upgrade-Tabs. Die Kamera gibt geschlossen 120 zusätzliche Design-Pixel für die Schlacht frei.
- Schaltbare, synthetisierte Combat-Sounds und an echte Nutzergesten gebundenes Haptik-Feedback ohne zusätzliche Audio-Lizenzabhängigkeit.
- Vollständige lizenzierte Galalaxy/Foozle-Assetbibliothek im Repository; die Runtime lädt nur den kuratierten aktuellen Ausschnitt.

## Einheiten

| Schiff | Rolle | Waffenbild | Capture |
| --- | --- | --- | ---: |
| Drone | automatische, fragile Grundwelle | kleiner Pulse/Bullet | 0,2 |
| Scout | schneller Node- und Map-Control-Spezialist | leichter Pulse/Bullet | 2,0 |
| Fighter | Anti-Light- und Anti-Bomber-Escort | schnelle Bolt-/Ray-Salve | 1,0 |
| Bomber | verwundbarer Siege- und Anti-Heavy-Angreifer | sichtbare Homing-Rakete/Torpedo | 0,5 |
| Frigate | langlebiger Frontline-Anker | langsamer, schwerer Ray/Big Bullet | 0,75 |

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

## Prüfen

```powershell
npm.cmd run check
npm.cmd run test:stress
npm.cmd run test:browser
npm.cmd run balance:sim -- 100
npm.cmd run balance:experiments -- 30
npm.cmd run balance:investments -- 8
```

Die Prüfungen decken Simulation, Deployment, Lock-in, Economy, Forschung, Capture, Targeting, gespiegelte Kartengeometrie, dichte Flotten, Projektile, alle Runtime-Manifeste und die 516 Dateien der importierten Bibliothek ab. Der Browserlauf emuliert fünf echte Mobile-Viewports und prüft Start, Schwierigkeitswahl, Touch, Pause, Sound, Kamera sowie Console-/Netzwerkfehler. Die Balance-Simulation meldet zusätzlich Käufe, getrennte Ausgabenkategorien, Upgrades, Nodekontrolle und Spitzenlast; die Experimentläufe vergleichen Economy-Konfigurationen sowie Rush-, Greed-, Weapons-, Logistics- und Mischstrategien reproduzierbar.

## Dokumentation

- [Core Gameplay Vision](STRATEGY_GALALAXY_CORE_VISION.md)
- [Aktuelle Umbau-Roadmap](IMPLEMENTATION_ROADMAP.md)
- [Level-1-Konzept: Orbital Garden](docs/LEVEL_1_ORBITAL_GARDEN_CONCEPT.md)
- [Umsetzungsplan](ROADMAP.md)
- [Game-Design-Vertrag](docs/GAME_DESIGN.md)
- [Architektur-Vertrag](docs/ARCHITECTURE.md)
- [Referenz-Audit](docs/REFERENCE_AUDIT.md)
- [Asset-Inventar](docs/ASSET_INVENTORY.md)
- [Verbindliche Art Direction](docs/ART_DIRECTION.md)
- [Repository-Regeln](docs/REPOSITORY_RULES.md)

## Status

Die verbindlichen Umbau-Meilensteine 1 bis 6 und der Orbital-Garden-Polish sind umgesetzt: Tall-world-Kamera, langsamere entkoppelte Squad-Formationen, automatische Drones, konkurrierende Economy-/Forschungswege, mockup-nahe Level-1-Sektoren, lesbare klassenspezifische Waffen und das integrierte HQ-Kommandomenü. Foundation-, Asset- und Mobile-Browserprüfungen laufen grün. Die frühere 100-Match-Referenz endete 50:50; nach dem Umbau wird die neue große Balance-Referenz erst nach manuellem Spielgefühl-Test festgeschrieben.
