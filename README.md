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

Der lokale Stand startet jetzt im eigenen Hauptmenü. **Kampagne → Erstkontakt → Mission starten** führt zur ersten spielbaren Mission: eine Lane, Scout und Fighter, vorläufig zwölf Schiffe je Seite und zunächst keine Forschung. Briefing, Pause, Ergebnis, Wiederholen und lokal gespeicherter Abschluss sind integriert. Missionen 2 und 3 sind klar markierte Vorschauen. Das freie Gefecht bietet weiterhin die bisherigen Klassen, Forschung und beide Karten. Die Missionswerte werden im nächsten Gestaltungsschritt angepasst; Details stehen im [Kampagnenbericht](docs/CAMPAIGN_FIRST_SLICE.md).

Die verbindliche Zielrichtung steht in [Core Gameplay Vision](STRATEGY_GALALAXY_CORE_VISION.md). Der Qualitätsbranch `codex/quality-recovery` baut auf dem am 7. Oktober 2026 bestätigten GitHub-Stand `ed8802b` auf und übernimmt lokale Verbesserungen selektiv. Kampf-, KI- und Bedienungsfehler sind korrigiert und automatisiert geprüft. Die reale Smartphone-Abnahme und die Lesbarkeit extremer Flottendichte bleiben offen; Nachweise stehen im [Qualitätsbericht](docs/QUALITY_RECOVERY_REPORT.md). Die Runtime nutzt sofortiges Squad-Deployment, davon unabhängige automatische Drone-Waves und eine kontinuierlich reagierende Live-KI. Core-Maps enthalten keine Nodes oder Turrets und werden von randständigen Command Carriern gerahmt.

- Kontinuierlicher `LIVE_MATCH` ohne Kauf-Queue, Lock-in, Refund oder bezahlte Wave-Slots.
- Scout Wings mit drei und Fighter Wings mit zwei individuell verwundbaren Schiffen starten unmittelbar in der gewählten Lane. Bomber und Frigate bleiben Einzelschiffe; eine kurze gemeinsame Hangar-Traversal inszeniert den Launch.
- Eigene datengetriebene Cooldowns pro Einheitentyp laufen ausschließlich in aktiver Simulationszeit.
- Kosten und Cooldown werden atomar erst nach erfolgreichem Spawn gesetzt.
- Kostenlose symmetrische Drone-Waves starten unabhängig davon initial alle 22 Sekunden und besitzen einen eigenen Kapazitäts-Backlog.
- Fünf sofort aktive Upgrade-Wege konkurrieren mit neuen Schiffen: Reactor erhöht Einkommen, Arsenal den Schaden, Autoloader verkürzt die Feuerpause, Multi Cannon ergänzt bei bezahlten Schiffen ein sichtbares Geschoss und Shield Array gibt allen Schiffen einen regenerierenden Schutzpuffer. Galalaxy-Pickup-Icons, Vorher→Nachher-Werte und Levelpunkte machen die Wahl lesbar. Frühere Logistics-Slots sind entfernt; Turret-Upgrades sind auf Core-Maps nicht verfügbar.
- Die KI entscheidet je nach Schwierigkeit ungefähr alle 1,2 bis 2,2 Sekunden, reagiert auf grobe gegnerische Zusammensetzungen und spart regelmäßig auf einen Zwei-Kauf-Push oder einen sichtbaren Forschungsplan. Alle Aktionen verwenden dieselben Kaufbefehle, Kosten, Cooldowns und Lane-Grenzen wie der Spieler.
- Zwei wählbare Karten: Level 1 „Orbital Garden“ mit einer Lane und Level 2 „Twin Fronts“ mit zwei Lanes; beide nutzen eine `420 × 1180` Scroll-Welt.
- Eine schmale strategische Kartenleiste zeigt Flottenfronten, Command Carrier und den aktuellen Kameraausschnitt; optionale Strukturen erscheinen nur auf dafür aktivierten Maps.
- Gedeckelte Economy mit 270 Startenergie in Level 1 beziehungsweise 300 in Level 2, 16 Basisenergie/s und maximal 780 gespeicherter Energie; Node-Einkommen ist auf den Core-Maps deaktiviert.
- Scout, Fighter, Bomber und Frigate besitzen eigene Rollen, Formationen und Zielprioritäten.
- Zwei vereinheitlichte hochauflösende Flottenfamilien mit identischer Draufsicht und Beleuchtung: Elfenbein/Messing/Cyan für den Spieler, Anthrazit/Kupfer/Coral für den Rivalen. Drones besitzen nun eigene kleinere Hüllen. Die flammenfreien Schiffe nutzen farblich passend zugeordnete animierte Kla'ed-/Nairan-Triebwerksflammen aus Galalaxy, die als enge Asset-Crops exakt an den sichtbaren Düsenmündungen sitzen.
- Acht eigenständige Waffen-Sprites trennen Klasse und Fraktion sofort: Spielerfeuer ist cyan/elfenbein/messingfarben, Rivalenfeuer coral/kupfer/anthrazit. Scout-Pulse, Fighter-Laser, Bomber-Homing-Raketen und Frigate-Geschosse besitzen eigene Silhouetten sowie kurze Echos, lange Laserkerne, segmentierte Abgaswege beziehungsweise schwere gestrichelte Wakes. Reguläre Mehrfachsalven teilen ihren Grundschaden; Multi Cannon verteilt zusätzlich 6 % Salvenschaden auf ein weiteres sichtbares Geschoss. Frigate-Breitseiten starten nacheinander von ihren Hardpoints.
- Deutliches Schadensfeedback durch kurzen Hull-Flash, expandierende Schildkontur, projektilabhängigen Impact-Glow, Funken und situative Healthbars. Jeder Schiffstyp spielt beim Tod seine originale 8–18-phasige Galalaxy-Zerstörungssequenz mit deren 14-FPS-Timing; Turrets und HQs nutzen längere, silhouettenfreie Struktur-Explosionen.
- Vier neue, wirklich orthografische Command-Carrier-Sprites geben beiden Fraktionen in Orbital Garden und Twin Foundries eine eigene HQ-Silhouette mit zwei sichtbaren Launch-Buchten. Alte perspektivische HQs, Defense Turrets und Capture Nodes bleiben aus den Core-Maps und deren Ladepfad entfernt; die optionalen Systeme und Fallback-Assets bleiben für spätere Feature-Maps erhalten.
- Keine großflächigen Team-Neonringe oder dekorativen Orbit-Ellipsen; optionale Feature-Maps dürfen Node-Fortschritt weiterhin kompakt darstellen.
- Mobile Sicherheitsbudgets begrenzen jede Team/Lane-Kombination auf 28 Schiffe, jede Projektil-Lane auf 40 Geschosse und das Match global auf 128 Geschosse. Bei hoher Dichte reduziert der Renderer teure Drop-Shadows und Projektil-Echos; die Kartenleiste pulsiert weiterhin bei frischen Offscreen-Treffern und Zerstörungen.
- Responsive Canvas-Höhe mit bildschirmfestem HUD und einer davon entkoppelten `420 x 1180` Spielwelt. Die beiden Level-1-Hintergrundsektoren werden proportional beschnitten und weich überblendet, nicht auf Mobile verzerrt.
- Über das Pause-Menü kann jederzeit zum Hauptmenü zurückgekehrt werden; der Ergebnisbildschirm bietet getrennt „Play Again“ und „Main Menu“.
- Größere Mobile-Touchflächen, direkt in den Lane-Tabs sichtbarer Druckvergleich sowie ein kurzer Drei-Schritte-Einstieg auf dem Startbildschirm.
- Integriertes Carrier-Kommandomenü: Der Normalzustand zeigt Lane, Live-Deployment und Auto-Wave-Timer; ein Tap auf den eigenen Command Carrier oder „Command“ öffnet Fleet- und Upgrade-Tabs.
- Schaltbare, synthetisierte Combat-Sounds und an echte Nutzergesten gebundenes Haptik-Feedback ohne zusätzliche Audio-Lizenzabhängigkeit.
- Vollständige lizenzierte Galalaxy/Foozle-Assetbibliothek im Repository; die Runtime lädt in zwei Stufen nur 47 aktive Bilder pro Core-Level. Große Level-1-Quellen besitzen mobile `840 px`-Ableitungen, und GitHub Pages veröffentlicht ausschließlich die 51 kuratierten Spielbilder statt der 516 Referenzdateien.

## Einheiten

| Schiff | Rolle | Waffenbild | Live-Cooldown |
| --- | --- | --- | ---: |
| Drone | automatische, fragile Grundwelle | kleiner Pulse/Bullet | nicht kaufbar |
| Scout Wing ×3 | schneller Screen | leichter Pulse/Bullet | 2,5 s |
| Fighter Wing ×2 | Anti-Light- und Anti-Bomber-Escort | schnelle Bolt-/Ray-Salve | 4 s |
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
npm.cmd run dev
```

Anschließend `http://127.0.0.1:7100/` öffnen. Das Hauptmenü bietet Kampagne, freies Gefecht und Sound-Einstellungen. `?debug=1` blendet Diagnosewerte ein; `?test=match` startet direkt einen reproduzierbaren freien Testmatch. Beides lässt sich kombinieren. Im Spiel zieht man das Schlachtfeld vertikal oder springt über die rechte Kartenleiste. Ein Tap auf den eigenen Command Carrier oder den unteren Command-Dock öffnet die Kaufkonsole; ihre Auswahl folgt den Missionsregeln. Der Pfeil zwischen den Tabs schließt die Konsole wieder. `P` pausiert; das Pause-Menü kann fortsetzen oder zum Hauptmenü zurückkehren. Das Symbol oben rechts fordert Browser-Fullscreen an.

Für das schlanke GitHub-Pages-Artefakt wird `npm.cmd run build:pages` verwendet. Es kopiert Code und nur die tatsächlich aktiven Level-, Flotten-, Projektil- und VFX-Dateien nach `dist/`.

`npm.cmd run preview` zeigt anschließend ausschließlich dieses gebaute Artefakt. Für reale Smartphones enthält die [Geräteabnahme](docs/DEVICE_ACCEPTANCE.md) die Startschritte und Prüfkriterien.

## Prüfen

```powershell
npm.cmd run check
npm.cmd run test:quality
npm.cmd run test:stress
npm.cmd run test:cluster
npm.cmd run test:browser
npm.cmd run test:pages
npm.cmd run balance:sim -- 100
npm.cmd run balance:experiments -- 30
npm.cmd run balance:investments -- 8
```

Die Prüfungen decken Simulation, sofortiges Deployment, Cooldowns, automatische Waves, Economy, Upgrades, Capture-Migrationsbestand, Targeting, Kartengeometrie, dichte Flotten, Projektile, alle Runtime-Manifeste und die 516 Dateien der importierten Bibliothek ab. Die Qualitätsmatrix vergleicht 16 deterministische Partien auf beiden Karten und Seiten. Der Browserlauf emuliert beide Levels auf fünf Mobile-Viewports und prüft Start, Schwierigkeitswahl, Live-Touch-Deployment, Pause, Sound, Kamera, Console-/Netzwerkfehler sowie einen maximal gefüllten Render-Stressfall. Das ersetzt keine Prüfung auf echten Smartphones.

## Dokumentation

- [Verständlicher Verbesserungsplan: Dichte, Carrier und Kampagne](docs/GAME_IMPROVEMENT_PLAN.md)
- [Erstes Kampagnenpaket: Funktionen, Prüfung und offene Punkte](docs/CAMPAIGN_FIRST_SLICE.md)
- [Eigene Menügestaltung und empfohlene Assets](docs/MENU_ART_DIRECTION.md)
- [Qualitäts- und Wiederaufnahmeplan](docs/QUALITY_RECOVERY_PLAN.md)
- [Geprüfte Änderungen und offene Qualitätsgrenzen](docs/QUALITY_RECOVERY_REPORT.md)
- [Reale Geräteabnahme](docs/DEVICE_ACCEPTANCE.md)
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

Software-Korrekturen und Browser-/Build-Prüfung der Qualitäts-Wiederaufnahme sind durchgeführt. Alle 16 Vergleichspartien enden regulär, beide Karten bestehen die Bedienungsprüfungen auf fünf Viewports. Das anschließend ausdrücklich beauftragte erste Kampagnenpaket ist lokal spielbar und seine Menü-/Ergebnisabläufe sind geprüft. Die bisherigen lokalen Commits bleiben unverändert gesichert. Meilenstein A bleibt wegen ausstehender Geräte-/Spielerabnahme und dichter Hüllenstapel offen. Neue Carrier-Fähigkeiten, weitere Missionen und das endgültige Menü-Artwork folgen später. Dieser Branch ist lokal und noch nicht veröffentlicht; der öffentliche Spiellink zeigt weiterhin den bisherigen GitHub-Stand.
