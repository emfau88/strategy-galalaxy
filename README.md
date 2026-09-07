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
- Zwei nebeneinander sichtbare Lanes auf einem höheren Schlachtfeld mit direktem vertikalem Touch-Panning.
- Eine schmale strategische Kartenleiste zeigt Fronten, Strukturen, Nodes und den aktuellen Kameraausschnitt.
- Zwei kostenlose Scouts pro Lane und Deployment sowie vier gemeinsame, gekaufte Verstärkungsslots.
- Sofortige Energiereservierung, vollständige Rückerstattung vor Lock-in und Upgrade-Aktivierung am nächsten Deployment.
- Gedeckelte, entschärfte Economy mit 300 Startenergie, 16 Basisenergie/s, 7 Energie/s pro Node, maximal 1.200 gespeicherter Energie und begrenzten Upgrade-Stufen.
- Regelgebundene KI mit denselben Kosten, Slots, Timern, Kapazitäten und Upgrade-Regeln wie der Spieler, drei wählbaren Profilen und genau einer Neubewertung kurz vor dem Lock-in.
- Scout, Fighter, Bomber und Frigate mit eigenen Rollen, Formationen, Zielprioritäten und Capture-Stärken.
- Nairan- und Kla'ed-Flotten mit animierten Engines, Weapon-, Shield- und Destruction-Layern.
- Rollen- und fraktionsabhängige animierte Projektile, bounded Homing, begrenzte Trails, Muzzle Flashes, Treffer- und Explosionseffekte.
- Modulare Defense Turrets mit eigenem weich nachgeführtem Geschütz, Laufmündungs-Projektilen und Schussrückstoß sowie hochwertige Headquarters mit zwei lane-seitigen Hangars: Schiffe starten sichtbar aus dem passenden Tor, das sich nur bei tatsächlicher Auslieferung öffnet und wieder schließt.
- Keine großflächigen Team-Neonringe oder dekorativen Orbit-Ellipsen; Nodes zeigen Capture-Fortschritt kompakt unterhalb des Sprites.
- Faire Projektilbudgets pro Team und Lane sowie globale Sicherheitsgrenzen für mobile Geräte.
- Responsive Canvas-Höhe mit bildschirmfestem HUD, größer dargestellten Schiffen und einer davon entkoppelten `420 x 1180` Spielwelt.
- Größere Mobile-Touchflächen, direkt in den Lane-Tabs sichtbarer Druckvergleich sowie ein kurzer Drei-Schritte-Einstieg auf dem Startbildschirm.
- Schaltbare, synthetisierte Combat-Sounds und an echte Nutzergesten gebundenes Haptik-Feedback ohne zusätzliche Audio-Lizenzabhängigkeit.
- Vollständige lizenzierte Galalaxy/Foozle-Assetbibliothek im Repository; die Runtime lädt nur den kuratierten aktuellen Ausschnitt.

## Einheiten

| Schiff | Rolle | Waffenbild | Capture |
| --- | --- | --- | ---: |
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

Anschließend `http://127.0.0.1:8765/` öffnen. `?debug=1` blendet Diagnosewerte ein; `?test=match` startet direkt einen reproduzierbaren Testmatch. Beides lässt sich kombinieren. Im Spiel zieht man das Schlachtfeld vertikal oder springt über die rechte Kartenleiste, wählt Left oder Right, reiht Einheiten ein, entfernt den letzten Queue-Eintrag mit Undo oder wechselt zu Upgrades. `P` pausiert, das Symbol oben rechts fordert Browser-Fullscreen an.

## Prüfen

```powershell
npm.cmd run check
npm.cmd run test:stress
npm.cmd run test:browser
npm.cmd run balance:sim -- 100
npm.cmd run balance:experiments -- 30
```

Die Prüfungen decken Simulation, Deployment, Lock-in, Economy, Capture, Targeting, gespiegelte Kartengeometrie, dichte Flotten, Projektile, alle Runtime-Manifeste und die 516 Dateien der importierten Bibliothek ab. Der Browserlauf emuliert fünf echte Mobile-Viewports und prüft Start, Schwierigkeitswahl, Touch, Pause, Sound, vollständige Canvas-Nutzung sowie Console-/Netzwerkfehler. Die Balance-Simulation spiegelt Teamseite und bevorzugte Lane, meldet zusätzlich Siege pro KI-Profil, Matchdauer, Deployment-Zyklen, Käufe, Nodekontrolle, ersten Turretverlust und Spitzenlast; der Experimentlauf vergleicht drei Economy-Konfigurationen reproduzierbar.

## Dokumentation

- [Core Gameplay Vision](STRATEGY_GALALAXY_CORE_VISION.md)
- [Aktuelle Umbau-Roadmap](IMPLEMENTATION_ROADMAP.md)
- [Umsetzungsplan](ROADMAP.md)
- [Game-Design-Vertrag](docs/GAME_DESIGN.md)
- [Architektur-Vertrag](docs/ARCHITECTURE.md)
- [Referenz-Audit](docs/REFERENCE_AUDIT.md)
- [Asset-Inventar](docs/ASSET_INVENTORY.md)
- [Repository-Regeln](docs/REPOSITORY_RULES.md)

## Status

Der kontinuierliche Kern-Loop, die vier Kernrollen, Original-Animationen und Projektile, animierte modulare Strukturen, drei KI-Stufen, Sound/Haptik und die automatisierten technischen Gates sind umgesetzt. Der erste Tall-world-Meilenstein ergänzt eine vertikal verschiebbare Welt, eine strategische Kartenleiste und größere Darstellungen. Seine erste vollständig gespiegelte 100-Match-Diagnose endete ohne Draws oder Timeouts bei 50:50 Siegen und durchschnittlich 202,8 Sekunden Laufzeit. Diese Messung ist ein technisches Symmetriesignal; die neue Balance-Referenz wird erst nach Bewegungs- und Formationsumbau festgeschrieben. Der aktuelle Fortschritt steht in der [Umbau-Roadmap](IMPLEMENTATION_ROADMAP.md).
