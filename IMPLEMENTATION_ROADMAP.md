# Strategy Galalaxy – aktuelle Umbau-Roadmap

Stand: 2026-09-07

Diese Datei ist der lebende Arbeitsplan für den Umbau zu größeren, langsameren und
lesbareren Weltraumschlachten. Abgeschlossene Punkte werden erst nach automatischer
Prüfung und mobiler Sichtkontrolle abgehakt. Jeder stabile Meilenstein wird separat
committet und gepusht, damit er direkt getestet werden kann.

## Zielbild

- Ein höheres Schlachtfeld schafft Raum für größere Schiffe, Projektile und Effekte.
- Beide Lanes bleiben gleichzeitig horizontal sichtbar; vertikal wird direkt gewischt.
- Flotten bilden lesbare Verbände statt eng gestapelter Punkte.
- Große Schiffe drehen in Breitseitenpositionen und kämpfen anders als Kleinschiffe.
- Langsamere Bewegung macht Anflug, Feuerwechsel und Verstärkungsentscheidungen sichtbar.
- Automatisches Kleinvieh hält die Front aktiv, ohne die bezahlten Kernrollen zu entwerten.
- Energie muss glaubwürdig zwischen Flotte, Economy und Forschung aufgeteilt werden.
- Das bestehende Asset- und Projektilsystem wird intensiver genutzt, bleibt aber mobil begrenzt.

## Meilenstein 1 – Tall-world und Kamera

- [x] Spielwelt auf `420 x 1180` Weltkoordinaten vergrößern.
- [x] Weltkoordinaten von der responsiven Bildschirmhöhe entkoppeln.
- [x] Nur die Battlefield-Ebene clippen und vertikal verschieben.
- [x] HUD, Planungspanel und Overlays im Bildschirmraum fixieren.
- [x] Direktes Touch-/Pointer-Panning mit Schwelle und begrenzter Trägheit einführen.
- [x] Strategische Kartenleiste mit Nodes, Strukturen, Flottenclustern und Viewport bauen.
- [x] Spieleransicht beim eigenen HQ starten lassen.
- [x] Schiff-, HQ-, Turret- und Node-Darstellung für den neuen Raum vergrößern.
- [x] Pure Kamera- und Koordinatentests ergänzen.
- [x] Touch-Drag und Kartensprünge auf fünf Mobile-Viewports im Browser prüfen.
- [x] Gesamte technische Prüfkette und neue Balance-Diagnose ausführen.
- [x] Meilenstein committen und auf `main` pushen (`22d6ddd`).

## Meilenstein 2 – ruhige Squad-Bewegung und Formationen

- [x] Globale Reisegeschwindigkeiten senken und Beschleunigung statt sofortiger Richtungswechsel nutzen.
- [x] Deterministische Squad-Anker je Team und Lane einführen.
- [x] Rollenplätze relativ zum Squad-Anker definieren: Screen, Front, Escort, Siege, Heavy.
- [x] Weiche Ankunft am Formationsplatz statt dauernder Vollgeschwindigkeit umsetzen.
- [x] Mindestabstände und seitliche Ausweichslots gegen Stapelbildung verstärken.
- [x] Zielbindung stabilisieren, damit Verbände nicht hektisch pendeln.
- [x] Frigate und spätere Großschiffe seitlich zum Ziel ausrichten und Breitseite halten lassen.
- [x] Reichweite und Feuermomente an die langsamere Bewegung anpassen.
- [x] Determinismus-, Symmetrie-, Lane- und Stresstests erweitern.
- [x] Auf fünf Mobile-Screens Sichtkontrolle für dichte Begegnungen durchführen.
- [ ] Meilenstein committen und pushen.

## Meilenstein 3 – automatische Skirmisher-Grundwelle

- [ ] Neue schwache automatische Einheit als `Skirmisher`/`Drone` definieren.
- [ ] Zwei kostenlose Standard-Scouts pro Lane durch eine kleine Drone-Grundwelle ersetzen.
- [ ] Scout als kaufbare Capture- und Aufklärungseinheit profilieren.
- [ ] Drone mit niedriger Haltbarkeit, niedriger Strukturwirkung und einfacher Waffe ausstatten.
- [ ] Spawnzahl und spätes Wachstum so begrenzen, dass Projektil- und Unit-Budgets halten.
- [ ] Passendes vorhandenes Factionsprite und kleine Projektilvariante auswählen.
- [ ] KI, Queue-Anzeige, Tests und Balance-Telemetrie um die neue Rolle erweitern.
- [ ] Meilenstein committen und pushen.

## Meilenstein 4 – echte Flotte/Economy/Forschung-Abwägung

- [ ] Ausgaben nach Flotte, Economy und Forschung getrennt telemetrieren.
- [ ] Economy-Upgrades mit steigenden Kosten und verzögerter Amortisation neu abstimmen.
- [ ] Forschung als eigener Investitionspfad statt sofortiger Gratiswirkung modellieren.
- [ ] Forschungseffekte an Deployment-Grenzen aktivieren und klar ankündigen.
- [ ] Mindestens drei konkurrierende Pfade anbieten: Einkommen, Waffen, Defensive/Logistik.
- [ ] Sparen durch Energie-Cap und zunehmende Opportunitätskosten begrenzen.
- [ ] KI-Profile zu nachvollziehbaren Investitionsstrategien erweitern.
- [ ] Reproduzierbare Experimentmatrix für Rush, Greed, Tech und Mischstrategien ergänzen.
- [ ] Meilenstein committen und pushen.

## Meilenstein 5 – Schlachtinszenierung und Asset-Tiefe

- [ ] Projektilbudgets pro Sichtfenster, Lane und Team prüfen und gezielt erhöhen.
- [ ] Salven, Tracer, Raketen, Mündungsblitze und Trefferfeedback rollenabhängig verdichten.
- [ ] Breitseitenwaffen an mehrere sichtbare Hardpoints koppeln.
- [ ] Schild-, Schadens- und Zerstörungslayer bei größeren Schiffen besser lesbar machen.
- [ ] Offscreen-Kampf durch Kartenleisten-Signale und dezentes Audio verständlich halten.
- [ ] Atlas-/Transparenzränder untersuchen und nur bei messbarem Nutzen zuschneiden.
- [ ] Mobile Framezeit, Projectile Caps, Trails und Event-Historie stressprüfen.
- [ ] Meilenstein committen und pushen.

## Meilenstein 6 – alternatives HQ-Kommandomenü (Experiment)

Dieser Schritt folgt erst, wenn der neue Kampfmaßstab spielerisch trägt.

- [ ] HQ antippbar machen und ein kontextuelles Kommandomenü als Prototyp öffnen.
- [ ] Schiffstypen als Drag-and-drop-Chips vom HQ auf Left/Right anbieten.
- [ ] Tap-Fallback für Drag-and-drop und klare Abbruch-/Refund-Regeln vorsehen.
- [ ] Upgrades in ein eigenes HQ-Untermenü verschieben.
- [ ] Permanente untere HUD-Leiste gegen das HQ-Menü auf 360–420 px Breite vergleichen.
- [ ] Erreichbarkeit, Einhandbedienung, Kampfbeobachtung und Queue-Klarheit testen.
- [ ] Nur bei besserem Playtest-Ergebnis als Standard übernehmen.
- [ ] Meilenstein committen und pushen.

## Durchgehende Qualitäts-Gates

- [ ] Keine Simulation hängt von Kamera, Animation oder Framerate ab.
- [ ] Beide Teams bleiben geometrisch und regeltechnisch gespiegelt.
- [ ] Keine negativen Ressourcen, Slotüberschreitungen oder verlorenen Refunds.
- [ ] Alle Matches enden reproduzierbar oder melden diagnostizierbare Timeouts.
- [ ] Fünf Ziel-Viewports bleiben ohne Konsolen-, Netzwerk- oder Touchfehler.
- [ ] Jede neue Balance-Referenz dokumentiert Seed, Matchzahl, Dauer und Timeoutquote.

## Aktueller nächster Schritt

Meilenstein 2 committen und pushen. Danach beginnt Meilenstein 3 mit der schwachen
automatischen Drone-Grundwelle und der klareren kaufbaren Scout-Rolle.

## Letzte verifizierte Messung

Tall-world Meilenstein 1, Seed `1337`, 100 gespiegelte Matches:

- Siege: 50 Spieler / 50 Gegner
- Draws und Timeouts: 0
- mittlere Matchdauer: 202,8 Sekunden
- mittlere Deployment-Zyklen: 10
- erster Turretverlust im Mittel: 49,8 Sekunden
- Spitzenlast: 38 Units / 11 Projektile
- Browser-Touchprüfung: 360×800, 390×844, 393×852, 412×915 und 420×760 bestanden

Movement-Meilenstein 2, kurzer gespiegelter Smoke-Test mit acht Matches:

- Siege: 4 Spieler / 4 Gegner
- Draws und Timeouts: 0
- mittlere Matchdauer: 273,2 Sekunden
- erster Turretverlust im Mittel: 159,2 Sekunden
- Spitzenlast: 55 Units / 13 Projektile
- dichter 90-Sekunden-Stresstest: maximal 36 Projektile, keine Budgetverletzung
