# Strategy Galalaxy – Core Gameplay Rework Roadmap

Stand: 2026-09-10

## Aktiver Rework

Die verbindliche Zielrichtung steht in [STRATEGY_GALALAXY_CORE_VISION.md](STRATEGY_GALALAXY_CORE_VISION.md). Die darunter dokumentierten früheren Meilensteine bleiben als Historie des stabilen Ausgangsstands erhalten, sind aber keine Produktvorgabe für das neue Live-Deployment.

### Bulk 1 – Vertrag und Map-Konfiguration

- [x] Das Queue-/Lock-in-Modell durch Live-Deployment plus unabhängige Auto-Waves als verbindliche Core-Vision ersetzen.
- [x] Level 1 mit einer und Level 2 mit zwei Lanes festschreiben.
- [x] Die vorhandene Weltlänge und vertikale Mobile-Kamera als Invariante erhalten.
- [x] Map-Feature-Flags für Capture Nodes, Gebäude, Turrets, Carrier und Dekorationszonen einführen.
- [x] Game-Design- und Architekturvertrag auf den Zielzustand umstellen und den Migrationsstatus ausweisen.
- [x] Foundation-Regressionen für Lane-Zahlen, Weltlänge und Feature-Deklaration ergänzen.

### Bulk 2 – Auto-Wave und Live-Deployment trennen

- [x] Den DeploymentDirector auf kostenlose automatische Waves und deren Backlog reduzieren.
- [x] Bezahlte Einheiten unmittelbar über einen atomaren Live-Deployment-Pfad starten.
- [x] Queue, Refund, Lock-in und bezahlte Wave-Slots aus Simulation und Tests entfernen.
- [x] Datengetriebene Cooldowns und jederzeit kaufbare Upgrades einführen.

### Bulk 3 – Squad-Käufe und Formationen

- [ ] Eine Kaufentscheidung auf ein oder mehrere sichtbare Squad-Mitglieder abbilden.
- [ ] Gemeinsame Kosten, Lane, Launch und Cooldown mit individuellen HP und Verlusten verbinden.
- [ ] Formationen und Kapazitätsprüfungen für zehn bis zwanzig sichtbare Schiffe absichern.

### Bulk 4 – Core-Maps und Carrier

- [ ] Deaktivierte Map-Features vollständig aus Erzeugung, Simulation, KI, HUD und Rendering isolieren.
- [ ] Headquarters als teilweise außerhalb der Karte liegende Command Carrier präsentieren.
- [ ] Ruhige Spielfeldmitte und randgebundene Dekoration herstellen.

### Bulk 5 – HUD und Live-KI

- [ ] Kosten, Cooldowns, Sperrgründe, Energie, Einkommen und Auto-Wave-Timer mobile-lesbar darstellen.
- [ ] Lane-Wahl für variable Lane-Anzahlen beibehalten.
- [ ] KI über denselben Live-Deployment-Pfad reagieren, sparen und Pushes vorbereiten lassen.

### Bulk 6 – Combat-Tuning und Core-Slice-Abnahme

- [ ] Battle Zones, Rollen, Time-to-kill, Abstände, Größenhierarchie und Waffenlesbarkeit abstimmen.
- [ ] Foundation-, Stress- und Browserprüfungen auf das neue System migrieren.
- [ ] Level 1 und 2 auf realen Mobile-Viewports entlang des neuen Kernloops abnehmen.

## Historischer Ausgangsstand

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
- [x] Meilenstein committen und pushen (`ed4989f`).

## Meilenstein 3 – automatische Skirmisher-Grundwelle

- [x] Neue schwache automatische Einheit als `Skirmisher`/`Drone` definieren.
- [x] Zwei kostenlose Standard-Scouts pro Lane durch eine kleine Drone-Grundwelle ersetzen.
- [x] Scout als kaufbare Capture- und Aufklärungseinheit profilieren.
- [x] Drone mit niedriger Haltbarkeit, niedriger Strukturwirkung und einfacher Waffe ausstatten.
- [x] Spawnzahl und spätes Wachstum so begrenzen, dass Projektil- und Unit-Budgets halten.
- [x] Vorhandene kleine Scout-Layer in eigener Drone-Größe wiederverwenden.
- [x] KI, Tests und Lane-Telemetrie um die neue Rolle erweitern.
- [x] Meilenstein committen und pushen (`45b244d`).

## Meilenstein 4 – echte Flotte/Economy/Forschung-Abwägung

- [x] Ausgaben nach Flotte, Economy und Forschung getrennt telemetrieren.
- [x] Economy-Upgrades mit steigenden Kosten und verzögerter Amortisation neu abstimmen.
- [x] Forschung als eigener Investitionspfad statt sofortiger Gratiswirkung modellieren.
- [x] Forschungseffekte an Deployment-Grenzen aktivieren und klar ankündigen.
- [x] Vier konkurrierende Pfade anbieten: Einkommen, Waffen, Turrets und Logistics.
- [x] Sparen durch einen niedrigeren Energie-Cap und zunehmende Opportunitätskosten begrenzen.
- [x] KI-Profile und Messläufe um nachvollziehbare Investitionsstrategien erweitern.
- [x] Reproduzierbare Experimentmatrix für Rush, Greed, Tech und Mischstrategien ergänzen.
- [x] Meilenstein committen und pushen (`efb5f1d`).

## Meilenstein 5 – Schlachtinszenierung und Asset-Tiefe

- [x] Projektilbudgets pro Lane und Team prüfen und gezielt erhöhen.
- [x] Salven, Tracer, Raketen, Mündungsblitze und Trefferfeedback rollenabhängig verdichten.
- [x] Breitseitenwaffen an mehrere sichtbare Hardpoints koppeln.
- [x] Schild-, Schadens- und Zerstörungslayer bei größeren Schiffen besser lesbar machen.
- [x] Offscreen-Kampf durch Kartenleisten-Signale und dezentes Audio verständlich halten.
- [x] Atlas-/Transparenzränder untersuchen und vorhandene Laufzeit-Crops weiterverwenden.
- [x] Mobile Framezeit, Projectile Caps, Trails und Event-Historie stressprüfen.
- [x] Meilenstein committen und pushen.

## Zwischenmeilenstein – sichtbare Upgrades und Cozy-Pass

- [x] Upgrade-Karten um konkrete Werte statt abstrakter Kategorien ergänzen.
- [x] Pro Welle genau ein konkurrierendes Forschungsprojekt zulassen.
- [x] Economy auf zwei amortisierbare Stufen frontladen und den Energie-Cap auf 780 senken.
- [x] Aktivierung an der Wave-Grenze mit Banner, warmem Klang und HQ-Impuls inszenieren.
- [x] Reactor, Arsenal, Bastion und Hangar dauerhaft an HQ, Schiffen, Projektilen und Turrets ablesbar machen.
- [x] HUD-Palette von kaltem Navy/Neon zu wärmerem Slate, Elfenbein und Messing verschieben.
- [x] Schiffshüllen materieller rendern und Nodes sowie Lane-Routen mit warmen Diorama-Lichtern beleben.
- [x] Pending- und Active-Zustand im echten 420×760-Browserrender erfassen.
- [x] Foundation-, Asset- und Fünf-Viewport-Browserprüfung ausführen.
- [x] Kurze gespiegelte Investment-Matrix nach dem Economy-Umbau ausführen.
- [x] Zwischenmeilenstein committen und pushen.

## Meilenstein 5.5 – Level 1 „Orbital Garden“

- [x] Neue breite Ein-Lane-Karte als reguläres Level 1 definieren.
- [x] Bisherige Zwei-Lane-Karte unverändert als Level 2 erhalten.
- [x] Cozy-Orbital-Garden-Hintergrund, Sunwell und Garten-HQ als Runtime-Layer erzeugen und registrieren.
- [x] Spieler- und KI-Queues, Deployment, Targeting und Navigator auf dynamische Lane-Anzahlen umstellen.
- [x] Level 1 mit zwei Auto-Drones und drei gekauften Wave-Slots abstimmen.
- [x] Startscreen um Levelwahl und levelabhängige Kurzanleitung erweitern.
- [x] Ein-Lane-HUD und beide HQ-Hangars für die Hauptlane anpassen.
- [x] Headless-Kernprüfung und Asset-Verifikation bestehen.
- [x] Level 1 im echten 420×760-Browser starten, spielen und visuell mit dem Mockup abgleichen.
- [x] Mockup-Hintergrund ohne Seitenverhältnis-Verzerrung als `420×760`-Welt rendern.
- [x] Sunwell und Garten-HQ als detailreiche Mockup-nahe V2-Runtime-Objekte ersetzen.
- [x] Level-1-Schiffe größer, langsamer und mit weiterem Verbandsabstand darstellen.
- [x] Stabile Feuerpositionen statt radial wandernder Orbit-Zielpunkte verwenden.
- [x] Basis-Eindringlinge für frisch gespawnte Verteidiger unabhängig von der Flugrichtung priorisieren.
- [x] Garten-Turret-Basis und klare Cyan-/Coral-Gebäudekennzeichnung integrieren.
- [x] Alle fünf Mobile-Viewports inklusive Touch, Kamera und Assetrequests im Browser bestehen.
- [x] Stabilen Meilenstein committen und pushen.

## Level-1-Polish – Maßstab, Perspektive und Feuerlesbarkeit

- [x] Level 1 wieder auf eine echte `420 x 1180` Scroll-Welt erweitern.
- [x] Zwei eigene, proportional beschnittene Kartensektoren statt eines gestreckten Vollbilds einsetzen.
- [x] Schiffsmaßstab auf Level 1 zurücknehmen und Reisetempo zur größeren Welt passend abstimmen.
- [x] Ein eigenständiges, nach unten ausgerichtetes Rivalen-HQ statt einer kopfstehenden Spiegelung integrieren.
- [x] Garten-Turret als strikt top-down gezeichnete Basis mit separat rotierendem Top-down-Kopf erneuern.
- [x] Teamfarben an HQs und Turrets weiterhin klar durch Ring, Kernlicht und Beacons zeigen.
- [x] Bomberstart, Rakete, Rauchspur und Einschlag als klar lesbare Sequenz verstärken.
- [x] Projektilgeschwindigkeit global senken und Lebensdauer für die bisherige Reichweite kompensieren.
- [x] Drei Frigate-Breitseitenschüsse über `0,30 s` als echte Salve nacheinander starten.
- [x] Foundation-, Asset- und Mobile-Browserprüfung bestehen.
- [x] Ergebnis als testbaren Zwischenstand committen und pushen (`aab30af`).

## UX- und Kampflesbarkeits-Polish

- [x] Hauptmenü visuell näher an die warme Orbital-Garden-Art-Direction bringen.
- [x] Proportionales Title-Art-Cropping statt verzerrtem Hintergrund einsetzen.
- [x] Pause-Menü um klare Aktionen für Fortsetzen und Hauptmenü ergänzen.
- [x] Ergebnisbildschirm in getrennte Aktionen für neues Match und Hauptmenü aufteilen.
- [x] Direkte Treffer mit längerem Hull-Flash, Schildimpuls und Projektil-starkem Impact sichtbar machen.
- [x] Scout-Pulse, Fighter-Laser, Bomber-Rakete und Frigate-Geschütz visuell klar trennen.
- [x] Garten-Turret-Rückstoß verstärken und beide Rohrmündungen aufblitzen lassen.
- [x] Squad-Anker entkoppeln, damit ein haltendes/erfassendes Schiff nicht alle Kameraden stoppt.
- [x] Foundation-, Asset- und Mobile-Browserprüfung nach dem UX-Pass bestehen.
- [x] Abschluss committen und auf `main` pushen.

## Meilenstein 6 – integriertes HQ-Kommandomenü

Der vom Nutzer freigegebene Mockup-Aufbau ist als neuer Standard umgesetzt. Drag-and-drop bleibt eine optionale spätere Interaktionsvariante; die robuste Tap-Steuerung ist vollständig spielbar.

- [x] HQ antippbar machen und ein kontextuelles Kommandomenü öffnen.
- [ ] Schiffstypen als Drag-and-drop-Chips vom HQ auf Left/Right anbieten.
- [x] Vollständige Tap-Steuerung und bestehende Undo-/Refund-Regeln erhalten.
- [x] Upgrades in einen eigenen HQ-Tab verschieben.
- [x] Permanente untere HUD-Leiste durch einen kompakten Command-/Queue-/Status-Dock ersetzen.
- [x] Kamera dynamisch von 622 Pixel Kampfviewport auf 462 Pixel bei geöffneter Konsole umstellen.
- [x] Erreichbarkeit, Kampfbeobachtung und Queue-Klarheit auf fünf Mobile-Viewports prüfen.
- [x] Mockup-nahe Auswahlverbindung, warme Konsole und eigenes Command-Medaillon integrieren.
- [x] Als neuen Standard übernehmen, committen und pushen.

## Art-Unification-Pass – gemeinsame visuelle Sprache

- [x] Verbindliche Regeln für Draufsicht, Lichtquelle, Materialien, Teamfarben und Effekte dokumentieren.
- [x] Vier hochauflösende Player-Hüllen in Elfenbein, Messing, Cyan und Gartenmaterial erzeugen.
- [x] Vier geometrisch gleichwertige Rivalen-Hüllen in Anthrazit, Kupfer, Burgund und Coral erzeugen.
- [x] Alle acht Hüllen verlustarm als transparente `384×384` Runtime-Sprites normalisieren.
- [x] Fleet-Karten und Schlachtfeld auf exakt dieselben Hüllen umstellen.
- [x] Alte 64-Pixel-Engine-, Weapon-, Shield- und Destruction-Strips aus dem aktiven Ladepfad entfernen.
- [x] Schilde, Treffer und Zerstörung in einer gemeinsamen Präsentationssprache rendern.
- [x] Eigenes Garten-/Messing-Energy-Relay für Level 2 integrieren.
- [x] HQs und Turrets in beiden Levels auf dieselbe Struktur-Materialfamilie umstellen.
- [x] Orbital-Garden-Hintergrund mit zurückhaltendem gemeinsamen Color-Grading versehen.
- [x] Foundation-, Asset- und Fünf-Viewport-Browserprüfung bestehen.
- [x] Art-Unification-Pass committen und pushen.

## Raster-VFX-Polish – Flottenidentität und Gebäudelesbarkeit

- [x] Neue Schiffe in echten Mobile-Browser-Captures auf Skalierung, Rotation und Lesbarkeit prüfen.
- [x] Player- und Rivalen-Triebwerke als professionelle achtphasige Raster-Atlanten erzeugen.
- [x] Klassenspezifische Triebwerk-Hardpoints für Scout/Drone, Fighter, Bomber und Frigate integrieren.
- [x] Acht unterschiedliche Projektil-Sprites für beide Flotten und alle vier Waffenfamilien erzeugen.
- [x] Cyan/Elfenbein/Messing gegen Coral/Kupfer/Anthrazit auch im laufenden Feuerbild durchsetzen.
- [x] Dekorative Code-Ringe an HQ, Turrets und HQ-Auswahl entfernen; Teamidentität über Lampen und Eckmarken erhalten.
- [x] Fehlerhafte Projektilspur-Abhängigkeit reparieren und alle neuen Runtime-Assets validieren.
- [x] Fünf Mobile-Viewports ohne Asset-, Konsolen-, Kamera- oder Touchfehler prüfen.
- [x] Raster-VFX-Polish committen und pushen.

## Combat-Presentation-Pass – Raum, Maßstab und integrierte Signale

- [x] Alle acht Hüllen einzeln flammenfrei editieren und mechanische Düsen rekonstruieren.
- [x] Editierte Hüllen als transparente, symmetrisch skalierte `384×384`-Sprites normalisieren.
- [x] Drone, Scout, Fighter und Bomber visuell um rund 10–15 Prozent vergrößern.
- [x] Formationsoffsets, Reihenabstand, Mindestabstand und taktische Querpositionen entzerren.
- [x] Schussabstand für Frontwaffen, Siege-Schiffe und Breitseiten etwas großzügiger halten.
- [x] Projektilspuren nach Klasse staffeln und als eigene Bewegungsformen rendern; nach dem Geschwindigkeits-Pass 9–18 Punkte verwenden.
- [x] Player- und Rivalen-Turret als getrennte Assets mit physisch integrierten Teamlampen erzeugen.
- [x] Letzte persistente Code-Teammarker von HQ und Turret entfernen.
- [x] Foundation-, Asset-, Stress- und Fünf-Viewport-Browserprüfung bestehen.
- [x] Combat-Presentation-Pass committen und pushen.

## Combat-Motion-Follow-up – stabile Feuerlinien und lesbare Geschosse

- [x] Seitliches Randrutschen früher Drone-Duelle reproduzieren und numerisch belegen.
- [x] Taktische Kampfpositionen an der Lane statt an der beweglichen Gegnerposition verankern.
- [x] Erste automatische Drone-Welle symmetrisch links und rechts staffeln.
- [x] Kampfgeschwindigkeit je Schiffsklasse dämpfen, ohne die Reisegeschwindigkeit weiter zu reduzieren.
- [x] Leichte Projektile nochmals verlangsamen und ihre Reichweite über die Lebensdauer erhalten.
- [x] Zielvorhalt für nicht-lenkende Projektile ergänzen.
- [x] Regressionstest gegen erneutes Randrutschen und zu kurze Projektilsichtbarkeit ergänzen.
- [x] Foundation-, Stress- und Fünf-Viewport-Browserprüfung bestehen.

## Runtime-Delivery-Follow-up – sichtbare Pages-Assets

- [x] Cachelosen öffentlichen Asset-Ausfall bis auf parallele 24,4 MiB Boot-Last und
  den zu kurzen 9-Sekunden-Gate zurückverfolgen.
- [x] Levelmanifeste, mobile Runtime-Ableitungen, Retry und Late-Adoption integrieren.
- [x] Fehlende VFX-Verknüpfung schließen und Gebäude-/HUD-Fallbacks professionalisieren.
- [x] Deployment-Artefakt auf die aktive 44-Bilder-Union reduzieren.
- [x] Foundation-, Assetbudget- und Browser-Pixeltests ergänzen.
- [x] Öffentliche GitHub-Pages-Version nach dem Deployment cachelos bestätigen.

## Durchgehende Qualitäts-Gates

- [ ] Keine Simulation hängt von Kamera, Animation oder Framerate ab.
- [ ] Beide Teams bleiben geometrisch und regeltechnisch gespiegelt.
- [ ] Keine negativen Ressourcen, Slotüberschreitungen oder verlorenen Refunds.
- [ ] Alle Matches enden reproduzierbar oder melden diagnostizierbare Timeouts.
- [ ] Fünf Ziel-Viewports bleiben ohne Konsolen-, Netzwerk- oder Touchfehler.
- [ ] Jede neue Balance-Referenz dokumentiert Seed, Matchzahl, Dauer und Timeoutquote.

## Aktueller nächster Schritt

Die verbindlichen Meilensteine 1 bis 6, der sichtbare Upgrade-/Cozy-Zwischenpass, der
Orbital-Garden-Polish und der erste Combat-Motion-Follow-up sind umgesetzt. Der nächste
Produktionsabschnitt ist vollständig in der
[aktuellen Product-Polish-Roadmap](docs/PRODUCT_POLISH_ROADMAP.md) gebündelt. Level 2
nutzt inzwischen die ausgewählte Hybridrichtung aus Twin Foundries und einer
zurückhaltenden Cloud Rift. Vorrang haben nun echte Hull-Hardpoints, Bewegungsintegrität,
professionelle Projectile-/Death-VFX und Level-1-Kontrast. Carrier-ähnliche
Flottenspezialisierungen bleiben ein späterer datengetriebener Ausbau nach diesem
Combat-Polish. Drag-and-drop bleibt optional, solange die direkte Tap-Steuerung auf
kleinen Geräten schneller und eindeutiger ist.

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

Drone-Meilenstein 3, vier gespiegelte Matches:

- Siege: 2 Spieler / 2 Gegner
- Draws und Timeouts: 0
- mittlere Matchdauer: 254,6 Sekunden
- Spitzenlast: 40 Units / 12 Projektile

Investment-Meilenstein 4, je zwei Matches für fünf Strategiepaarungen:

- Rush, Greed, Weapons, Logistics und Balanced erzeugen messbar verschiedene Ausgabenprofile
- jede Paarung beendete beide Matches ohne technischen Timeout
- symmetrisches Balanced-Paar endete 1:1 mit exakt gleichen Ausgaben

Inszenierungs-Meilenstein 5:

- dichter 90-Sekunden-Stresstest: maximal 92 Projektile bei 64 pro Lane/Team und 220 global
- Trails blieben auf 10 Punkte und die Event-Historie auf 1024 Einträge begrenzt
- Browserprüfung auf allen fünf Ziel-Viewports ohne Konsolen-, Netzwerk-, Kamera- oder Touchfehler
- vier gespiegelte Tactician-Matches endeten 2:2 ohne Draw oder Timeout
- der kurze Admiral-Smoke endete 4:0 für die Spielerseite; deshalb bleibt der globale Balance-/Symmetrie-Gate bis zur größeren Matrix offen

Upgrade-/Cozy-Zwischenpass, je zwei Matches für fünf Investitionspaarungen:

- Rush gegen Balanced und gespiegeltes Greed gegen Fleet endeten exakt 2:0 beziehungsweise 0:2
- Weapons gegen Economy, Logistics gegen Weapons und Balanced gegen Balanced endeten jeweils 1:1
- alle zehn Matches endeten ohne Draw oder Timeout
- durchschnittliche Matchdauer je Paarung lag zwischen 210,9 und 335,4 Sekunden
- Foundation-/Assetprüfung und alle fünf Mobile-Browser-Viewports bestanden

Combat-Motion-Follow-up:

- kontrolliertes Level-1-Drone-Duell stabilisiert sich bei `x=191,3` und `x=228,7` statt bis zur Lane-Grenze `x=55` zu driften
- maximale seitliche Abweichung vom Lane-Zentrum sank im Test von 155 auf 34 Welt-Einheiten
- typische sichtbare Flugzeit: Drone 0,33 s, Scout/Fighter 0,37–0,38 s, Frigate 0,68 s, Bomber 1,32 s
- dichter 90-Sekunden-Stresstest: maximal 134 Projektile, keine Budgetverletzung
- Foundation- und Browserprüfung auf allen fünf Mobile-Viewports bestanden
