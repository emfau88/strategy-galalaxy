# Strategy Galalaxy

**[▶ Strategy Galalaxy spielen](https://emfau88.github.io/strategy-galalaxy/)**

Strategy Galalaxy ist ein eigenständiges, Mobile-First Space-Lane-Wars-Spiel im Portraitformat. Zwei Flotten kämpfen kontinuierlich in persistenten Korridoren, während der Spieler die nächste Verstärkungswelle vorbereitet. Beide Seiten deployen automatisch und gleichzeitig alle 22 Sekunden; die letzten zwei Sekunden sind gesperrt.

```text
Beide Lanes beobachten
  → bis zu 4 gekaufte Verstärkungen planen
  → Queue bis zum Lock-in anpassen
  → simultanes Deployment nach 22 Sekunden
  → Überlebende kämpfen weiter
  → sofort die nächste Welle planen
```

Es gibt keine direkte Schiffssteuerung und keine Kampfunterbrechung zum Planen. Bewegung, Schüsse, Capture und Einkommen laufen bis zur Zerstörung eines Headquarters weiter.

## Aktueller Spielstand

- Kontinuierlicher `LIVE_MATCH` mit 22-Sekunden-Deployment und Zwei-Sekunden-Lock-in.
- Zwei vollständig sichtbare, nur noch dezent markierte Lanes mit persistenten Schiffen, Turrets, HQ-Schaden und Energy Nodes.
- Zwei kostenlose Scouts pro Lane und Deployment sowie vier gemeinsame, gekaufte Verstärkungsslots.
- Sofortige Energiereservierung, vollständige Rückerstattung vor Lock-in und Upgrade-Aktivierung am nächsten Deployment.
- Regelgebundene KI mit denselben Kosten, Slots, Timern, Kapazitäten und Upgrade-Regeln wie der Spieler.
- Scout, Fighter, Bomber und Frigate mit eigenen Rollen, Formationen, Zielprioritäten und Capture-Stärken.
- Nairan- und Kla'ed-Flotten mit animierten Engines, Weapon-, Shield- und Destruction-Layern.
- Rollen- und fraktionsabhängige animierte Projektile, bounded Homing, begrenzte Trails, Muzzle Flashes, Treffer- und Explosionseffekte.
- Modulare Defense Turrets mit eigenem weich nachgeführtem Geschütz, Laufmündungs-Projektilen und Schussrückstoß sowie hochwertige Headquarters mit zwei lane-seitigen Hangars: Schiffe starten sichtbar aus dem passenden Tor, das sich nur bei tatsächlicher Auslieferung öffnet und wieder schließt.
- Keine großflächigen Team-Neonringe oder dekorativen Orbit-Ellipsen; Nodes zeigen Capture-Fortschritt kompakt unterhalb des Sprites.
- Faire Projektilbudgets pro Team und Lane sowie globale Sicherheitsgrenzen für mobile Geräte.
- Responsive Canvas-Höhe, die Tall-Screen-Smartphones im Fullscreen ohne große ungenutzte Flächen ausfüllt.
- Vollständige lizenzierte Galalaxy/Foozle-Assetbibliothek im Repository; die Runtime lädt nur den kuratierten aktuellen Ausschnitt.

## Einheiten

| Schiff | Rolle | Waffenbild | Capture |
| --- | --- | --- | ---: |
| Scout | schneller Node- und Map-Control-Spezialist | leichter Pulse/Bullet | 2,0 |
| Fighter | Anti-Light- und Anti-Bomber-Escort | schnelle Bolt-/Ray-Salve | 1,0 |
| Bomber | verwundbarer Siege- und Anti-Heavy-Angreifer | sichtbare Homing-Rakete/Torpedo | 0,5 |
| Frigate | langlebiger Frontline-Anker | langsamer, schwerer Ray/Big Bullet | 0,75 |

Die aktuellen Schiffsgrößen bleiben bewusst klassenabhängig. Eine pauschale Vergrößerung würde die dichten, persistenten Flotten und Nodes schneller verdecken; weitere Größenänderungen sollen auf echten Smartphone-Tests beruhen.

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

Anschließend `http://127.0.0.1:8765/` öffnen. `?debug=1` blendet Diagnosewerte ein; `?test=match` startet direkt einen reproduzierbaren Testmatch. Beides lässt sich kombinieren. Im Spiel wählt man Left oder Right, reiht Einheiten ein, entfernt den letzten Queue-Eintrag mit Undo oder wechselt zu Upgrades. `P` pausiert, das Symbol oben rechts fordert Browser-Fullscreen an.

## Prüfen

```powershell
npm.cmd run check
npm.cmd run test:stress
npm.cmd run test:browser
npm.cmd run balance:sim -- 100
```

Die Prüfungen decken Simulation, Deployment, Lock-in, Economy, Capture, Targeting, gespiegelte Kartengeometrie, dichte Flotten, Projektile, alle Runtime-Manifeste und die 516 Dateien der importierten Bibliothek ab. Der Browserlauf emuliert fünf echte Mobile-Viewports, testet Touch, vollständige Canvas-Nutzung sowie Console-/Netzwerkfehler und legt Screenshots im ignorierten `tmp`-Ordner ab. Die Balance-Simulation meldet Siege, Matchdauer, Deployment-Zyklen, Käufe, Nodekontrolle, ersten Turretverlust und Spitzenlast.

## Dokumentation

- [Core Gameplay Vision](STRATEGY_GALALAXY_CORE_VISION.md)
- [Umsetzungsplan](ROADMAP.md)
- [Game-Design-Vertrag](docs/GAME_DESIGN.md)
- [Architektur-Vertrag](docs/ARCHITECTURE.md)
- [Referenz-Audit](docs/REFERENCE_AUDIT.md)
- [Asset-Inventar](docs/ASSET_INVENTORY.md)
- [Repository-Regeln](docs/REPOSITORY_RULES.md)

## Status

Der kontinuierliche Kern-Loop, die mobile Vollbildskalierung, die vier Kernrollen, die Original-Animations-/Projektilintegration, animierte modulare Strukturen und die automatisierten technischen Gates sind umgesetzt. Als nächster Schwerpunkt folgt echtes Smartphone-Playtesting: Lesbarkeit dichter Pushes, Touchkomfort, 22-Sekunden-Entscheidungsrhythmus und datengetriebene Balance. Battlecruiser und Dreadnought bleiben bis zum bestandenen Spielspaß-Gate deaktiviert.
