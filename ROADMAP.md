# Strategy Galalaxy – Verbesserungs- und Umsetzungsplan

## Zielbild

Dieser Plan setzt die [Core Gameplay Vision](STRATEGY_GALALAXY_CORE_VISION.md) in ausführbare Arbeitspakete um.

Strategy Galalaxy wird ein Mobile-First Portrait-Lane-Wars-Spiel mit:

- einem kontinuierlich laufenden Match ohne harte Command-/Battle-Pause,
- zwei persistenten, breiten Kampf-Korridoren,
- simultanen Verstärkungs-Deployments alle 22 Sekunden,
- einer während des Kampfes editierbaren nächsten Welle,
- maximal vier gekauften Verstärkungen pro Deployment über beide Lanes,
- klar unterscheidbaren Rollen, Projektilen und Animationen,
- Nairan als Spielerflotte und Kla'ed als Gegnerflotte,
- dem Original-Repository `emfau88/galalaxy` als strikt schreibgeschützter Referenz.

Die Leitfrage bleibt:

> Ist es interessant, den laufenden Kampf zu lesen, die nächste Welle vorzubereiten und deren Wirkung auf die Front zu beobachten?

Neue Spielmodi und zusätzlicher Content folgen erst, wenn diese Schleife trägt.

## Verbindliche Entscheidungen

1. Das Match läuft in `LIVE_MATCH` kontinuierlich weiter. Bewegung, Kampf, Projektile, Capture und Einkommen pausieren nur bei einer echten Spielpause.
2. Der Deployment-Takt bleibt bei 22 Sekunden. Er wird nicht auf einen hektischen 10–15-Sekunden-Rhythmus verkürzt.
3. Die letzten zwei Sekunden sind zunächst ein Lock-in-Fenster. Die Queue ist davor frei editierbar und vollständig erstattbar.
4. Spieler und KI deployen am selben Zeitpunkt und benutzen dieselben Energie-, Slot-, Upgrade- und Kapazitätsregeln.
5. Überlebende Einheiten und Strukturschaden bleiben über alle Deployment-Zyklen erhalten.
6. Die exakte gegnerische Queue bleibt verborgen; sichtbar ist höchstens die Anzahl gegnerischer Verstärkungen.
7. Simulation und Darstellung bleiben getrennt. Animationen dürfen Trefferzeitpunkt, Schaden oder Matchausgang nicht bestimmen.
8. `strategy-galalaxy` ist das einzige Schreibziel. `galalaxy` bleibt read-only.
9. Der vollständige lizenzierte Foozle-Assetbestand darf in das Arbeits-Repository übernommen werden. Die Runtime lädt dennoch nur explizit registrierte Assets.
10. `assets/music/track1.ogg` wird nicht übernommen, solange Herkunft und Distributionsrecht nicht dokumentiert sind.

## Ausgangslage

Bereits vorhanden und weiterzuverwenden:

- deterministische Zwei-Lane-Simulation,
- persistente Einheiten und Strukturen,
- Energy, Nodes, Upgrades und regelgebundene KI,
- vier gemeinsame Verstärkungsslots,
- Formationen, lokale Separation und rollenbasiertes Targeting,
- Scout-, Fighter-, Bomber- und Frigate-Grundrollen,
- Homing-Raketen, Canvas-Projektile und begrenzte FX,
- mobile Portrait-Skalierung mit vollständiger Viewport-Nutzung,
- Nairan- und Kla'ed-Basissprites,
- automatisierte Kernprüfungen für fünf Portraitgrößen.

Zu ersetzen oder weiterzuentwickeln:

- `COMMAND -> BATTLE -> COMMAND` wird durch `LIVE_MATCH` ersetzt,
- der manuelle `DEPLOY FLEETS`-Start wird zum automatischen 22-Sekunden-Deployment,
- Einkommen und Capture müssen jederzeit im Live-Match laufen,
- das untere Planungs-UI muss während des Kampfes sichtbar und bedienbar bleiben,
- KI-Planung muss innerhalb desselben Countdowns stattfinden,
- statische Schiffszeichnungen werden um Engine-, Weapon-, Shield- und Destruction-Layer ergänzt,
- Canvas-Projektile werden durch datengetriebene Original-Spriteprofile ergänzt.

## Prioritäten und Gates

| Priorität | Bedeutung | Gate |
| --- | --- | --- |
| P0 | Kernidentität und spielbarer Live-Loop | Muss vor visueller Vertiefung stabil sein |
| P1 | Combat-Lesbarkeit, Original-Animationen und Mobile-Polish | Nach funktionierendem Live-Loop |
| P2 | Balancewerkzeuge und spätere Erweiterbarkeit | Nach dem ersten Spielspaß-Gate |

Jedes Paket endet mit Tests, einer mobilen Sichtprüfung und einem eigenen Commit. Nach jedem Paket muss `main` spielbar bleiben.

---

## Paket 0 – Verträge und Dokumentation synchronisieren

**Priorität:** P0

### Aufgaben

- `docs/GAME_DESIGN.md` und `docs/ARCHITECTURE.md` auf die Core Vision umstellen.
- Alte Aussagen über eingefrorene Command-Phasen entfernen.
- Zielzustände verbindlich festlegen: `LOADING`, `TITLE`, `LIVE_MATCH`, `PAUSED`, `VICTORY`, `DEFEAT`.
- 22 Sekunden Deployment-Intervall und zwei Sekunden Lock-in zentral dokumentieren.
- Upgrade-Aktivierung an der nächsten Deployment-Grenze als Standard festlegen.
- Den neuen Galalaxy-Audit-Baseline-Commit `7f90d17a063967f9978e74f6519c450a2b0e4f85` in Provenance und Asset-Inventar vormerken.

### Abnahme

- Kein Kerndokument beschreibt die alte Command-Pause als Zielverhalten.
- Zustände, Timer, Queue-Regeln und Verantwortlichkeiten widersprechen einander nicht.

---

## Paket 1 – Kontinuierlichen Live-Match-Kern einführen

**Priorität:** P0

### Aufgaben

- `COMMAND` und `BATTLE` aus dem normalen Matchablauf entfernen.
- `MatchDirector` auf Matchstart, Pause, Ende und Restart begrenzen.
- Einen `DeploymentDirector` einführen mit:
  - `deploymentInterval = 22`,
  - `timeUntilDeployment`,
  - `cycleNumber`,
  - `lockWindow = 2`,
  - Spieler- und KI-Queues,
  - gemeinsamer Slotkapazität,
  - atomarem simultanem `deploy()`.
- Beim Matchstart sofort die erste kostenlose Basiswelle beider Teams ausliefern, damit der Bildschirm nicht 22 Sekunden leer bleibt.
- Danach ohne Unterbrechung den nächsten 22-Sekunden-Zyklus starten.
- Fixed-Step-Simulation, Capture und Economy während des gesamten `LIVE_MATCH` fortschreiben.
- Pause/Resume so umbauen, dass Timer und Simulation gemeinsam einfrieren und exakt fortgesetzt werden.

### Abnahme

- Das Match wechselt während des Spielens nie in einen Planungs-Stopp.
- Deployment erfolgt wiederholbar exakt an derselben Simulationsgrenze.
- Kampf, Einkommen und Capture laufen zwischen Deployments kontinuierlich.
- Einheiten und Strukturschaden werden an keiner Deployment-Grenze zurückgesetzt.

---

## Paket 2 – Live-Queues, Lock-in, Economy und Upgrades

**Priorität:** P0

### Aufgaben

- Linke und rechte Spielerqueue während des laufenden Kampfes editierbar machen.
- Maximal vier gekaufte Verstärkungsslots über beide Lanes beibehalten.
- Kosten beim Einreihen sofort reservieren/abbuchen.
- Entfernen vor Lock-in vollständig erstatten.
- Im Zwei-Sekunden-Lock-in Queueänderungen und Erstattungen sperren.
- Nach Deployment nur tatsächlich ausgelieferte Einträge entfernen; Kapazitäts-Backlog deterministisch behandeln.
- Economy- und Turret-Upgrades zunächst an der nächsten Deployment-Grenze aktivieren.
- Kosten, Erstattung, Locking und Upgrade-Aktivierung durch Tests absichern.

### Abnahme

- Kein Last-Frame-Kauf kann die gesperrte Wave verändern.
- Es gibt keine Energieverdopplung oder verlorene Erstattung.
- Player und KI können niemals mehr als vier gekaufte Einheiten ausliefern.

---

## Paket 3 – KI auf denselben 22-Sekunden-Planungsraum umstellen

**Priorität:** P0

### Aufgaben

- KI zu Beginn jedes Deployment-Zyklus einen Plan anlegen lassen.
- Eine begrenzte Neubewertung während des editierbaren Fensters erlauben, ohne pro Frame neu zu planen.
- Vor Lock-in dieselben Queue-Kommandos wie beim Spieler verwenden.
- Lane Pressure, Nodebesitz, Turret-HP, Einheitenwert, Komposition, Energie und Restzeit berücksichtigen.
- Exakte gegnerische Einheitentypen nicht an die normale UI geben.
- Debug-Ausgabe für Entscheidung, Kosten, Slots und Lock-Zeitpunkt ergänzen.

### Abnahme

- KI kauft, entfernt, spart und deployt ausschließlich über die öffentlichen Matchregeln.
- Automatisierte Matches zeigen keine negative Energie, Slotüberschreitung oder verspätete Queueänderung.

---

## Paket 4 – Permanentes Mobile-Planungs-UI

**Priorität:** P0

### Aufgaben

- Obere HUD-Zeile auf Spieler-HQ, Countdown und Gegner-HQ konzentrieren.
- Energy, Income und Slots kompakt, aber dauerhaft lesbar darstellen.
- Unteres Planungs-Panel während des Live-Kampfs sichtbar halten.
- Linke/rechte Lane-Auswahl, Wave-Icons, vier Unit-Buttons, Undo und Upgrade-Wechsel integrieren.
- `DEPLOY FLEETS` aus dem normalen Ablauf entfernen; Deployment geschieht ausschließlich durch den Countdown.
- Lock-in klar mit `DEPLOYMENT LOCKED` und visuellem Countdown kommunizieren.
- Gegnerseite nur als Verstärkungsanzahl oder unspezifische Aktivität anzeigen.
- Battlefield trotz Panel auf 360×800 bis 412×915 vollständig lesbar halten.

### Abnahme

- Der Spieler kann beide Lanes beobachten und gleichzeitig die nächste Welle bearbeiten.
- Kein relevantes Element liegt außerhalb Safe Areas oder Touch-Hitboxen.
- Kein großes opakes Panel verdeckt den aktuellen Frontverlauf.

---

## Paket 5 – Vollständige Galalaxy-Assetbibliothek übernehmen

**Priorität:** P1, Import kann parallel zu Paket 1–4 vorbereitet werden

### Importumfang

Aus dem read-only Referenzstand `7f90d17a063967f9978e74f6519c450a2b0e4f85` werden in `strategy-galalaxy` übernommen:

- vollständiges Void Main Ship Pack,
- vollständige Kla'ed-, Nairan- und Nautolan-Flottenpacks,
- vollständiges Void Environment Pack,
- vollständiges Void Pickups Pack,
- alle zugehörigen PNGs, Aseprite-Quellen, Vorschau-GIFs und Pack-Readmes,
- Projektile, Engines, Weapon-Layer, Shields und Destruction-Strips aller vorhandenen Klassen,
- bestehende Galalaxy-UI-Grafiken nur als optionale Bibliothek, nicht automatisch als neue Strategy-Galalaxy-Oberfläche.

### Speicher- und Runtime-Regel

- Die komplette Bibliothek darf im Repository liegen.
- `src/assets.js` registriert nur tatsächlich verwendete Runtime-Dateien.
- Browser laden niemals pauschal die komplette Bibliothek.
- Normalisierte Runtime-Aliasnamen verweisen auf die Originaldateien oder auf bewusst erzeugte Derivate.
- Große Vorschauen und Aseprite-Dateien sind Entwicklungsquellen, keine Boot-Assets.
- Keine Datei aus `galalaxy` wird verschoben, gelöscht oder dort bearbeitet.

### Lizenz und Provenance

- Die sechs Foozle-Pack-Readmes werden mitkopiert; die dokumentierte CC0-Lizenz bleibt unmittelbar auffindbar.
- Jede kopierte Gruppe erhält einen Eintrag in `docs/SOURCE_PROVENANCE.md` mit Quellpfad, Commit und Zielpfad.
- `docs/ASSET_INVENTORY.md` unterscheidet künftig `library`, `runtime` und `deferred`.
- Die vorhandene Musikdatei bleibt bis zu einer dokumentierten Lizenz außerhalb des Imports.

### Abnahme

- Ein Asset-Verifikationsskript prüft Existenz, Dateigröße, Bilddekodierung und Sprite-Strip-Dimensionen.
- Der initiale Netzwerkdownload wächst nur um die Assets, die der aktuelle Match tatsächlich benutzt.
- Repository und GitHub Pages enthalten alle erlaubten Quellen, ohne das Original-Repository zu verändern.

---

## Paket 6 – Datengetriebenes Animations- und Layer-System

**Priorität:** P1

### Aufgaben

- Ein gemeinsames `FleetVisualProfile` pro Fraktion und Schiffsklasse einführen.
- Metadaten explizit speichern: Framegröße, Frameanzahl, FPS, Release-Frame, Rotation und Layeroffsets.
- Layerreihenfolge implementieren:

```text
Engine-Effekt
→ Hull/Base
→ Weapon-Layer
→ optional Shield-Hit
→ Damage-/Death-Effekt
```

- Animierte Engine-Strips für Scout, Fighter, Bomber und Frigate beider Hauptfraktionen integrieren.
- Waffenanimationen an Simulations-`shot`-Events koppeln; Schaden bleibt unabhängig von Animationsframes.
- Destruction-Strips als kurzlebige Präsentationsobjekte abspielen, nachdem die Simulation die Einheit entfernt hat.
- Nairan/Kla'ed zuerst vollständig integrieren; Nautolan und Capital Ships nur registrieren und für später bereithalten.
- Sichtbare Pixelbounds statt kompletter transparenter Spritezellen für mobile Größen verwenden.

### Bereits bekannte Original-Metadaten

- Nairan Engines: meist 8 Frames bei 10 FPS.
- Kla'ed Engines: 10–12 Frames bei 10 FPS.
- Destruction: je nach Klasse 8–18 Frames bei ungefähr 14 FPS.
- Weapon-Release-Frames unterscheiden sich stark je Schiff und müssen aus Metadaten stammen.
- Scout/Fighter/Bomber/Frigate verwenden überwiegend 64-Pixel-Quellframes; Capital Ships 128 Pixel.

### Abnahme

- Alle vier Kernklassen beider Teams besitzen laufende Triebwerke.
- Schuss- und Todesanimationen starten deterministisch auf passende Simulationsevents.
- Fehlende Layer fallen sauber auf Basissprite/Canvas-FX zurück.

---

## Paket 7 – Original-Projektile und Combat-FX integrieren

**Priorität:** P1

### Architektur

Mechanik und Darstellung werden getrennt:

```text
ProjectileBehavior
- speed
- lifetime
- hit shape
- homing / turn rate / acceleration
- piercing

ProjectileVisualProfile
- asset key
- frame size / count / FPS
- rendered width / height
- rotation offset
- glow / trail / muzzle / impact profile
```

### Erste Rollenbelegung

| Einheit | Mechanische Aussage | Nairan/Kla'ed Visual-Familie |
| --- | --- | --- |
| Scout | kleiner, leichter Kontrollschuss | Bolt/Bullet |
| Fighter | schnelle Anti-Light-Salve | animierter Bolt oder Ray/Tracer |
| Bomber | klar sichtbare, beschleunigende Homing-Rakete | Rocket/Torpedo |
| Frigate | langsamerer, gewichtiger Kanonenschuss | Ray/Big Bullet |

Die Fraktionen dürfen unterschiedliche Farben und Animationen verwenden, müssen bei denselben Rollen aber mechanisch fair und sofort lesbar bleiben.

### Aufgaben

- Animierte horizontale Sprite-Strips mit Rotationsoffset unterstützen.
- Bounded-turn Homing, optionale Beschleunigung und Homing-Dauer aus dem Original adaptieren.
- Kreis- und orientierte Rechteck-Hitboxen vorbereiten.
- Piercing nur aktivieren, wenn eine konkrete Rolle und Balanceprüfung es rechtfertigt.
- Raketen mit echter Positionshistorie oder begrenzten Exhaust-Partikeln statt einer rein statischen Linie darstellen.
- Muzzle Flash, kurze Hit Sparks, Missile Impact, schwere Treffer und strukturabhängige Explosionen definieren.
- Todesexplosionen nach Zielgröße staffeln; Scout/Fighter klein, Bomber mittel, Frigate groß, Struktur deutlich größer.
- Sehr subtilen Screen Shake nur bei Frigate-/Strukturereignissen und abschaltbar einsetzen.
- Shield-Animationen zunächst als Trefferfeedback vorbereiten; eine neue Shield-Mechanik gehört nicht automatisch zu diesem Paket.

### Performance-Grenzen

- Projektil- und Partikelbudgets pro Team/Lane statt eines unfairen globalen First-Come-Caps prüfen.
- Keine unbegrenzten Trails oder pro Frame wachsenden Arrays.
- Mobile Low-FX-Modus, DPR-Cap und kurze Lebenszeiten beibehalten.

### Abnahme

- Eine Schiffsklasse ist am Schussbild erkennbar, auch wenn der Hull kurz verdeckt ist.
- Raketen, leichte Salven und schwere Schüsse sind in Bewegung klar unterscheidbar.
- Effekte verdecken auf 360-Pixel-Breite weder Units noch Nodes.

---

## Paket 8 – Kampflesbarkeit und Rollen vertiefen

**Priorität:** P1

### Aufgaben

- Target Stickiness mit klarer Leash-Regel prüfen und Retarget-Jitter messen.
- Frigate als echte Frontline-Schutzrolle stärken, ohne versteckte Aggro-Magie unverständlich zu machen.
- Fighter-Anti-Bomber-Verhalten und Bomber-Siege-Verhalten sichtbar testen.
- Scout-Capture-Vorteil durch Bewegung und Zielwahl nutzbar halten.
- Formation beim Spawn beibehalten, danach kontrolliert aufbrechen lassen.
- Separation auf dichte, persistente Flotten testen.
- Aktuelle Schiffsgrößen zunächst beibehalten; nur bei realen Mobile-Tests klassenweise korrigieren.
- Healthbars weiterhin nur für Strukturen und beschädigte Units zeigen.

### Abnahme

- Die vier Kernklassen erzeugen erkennbare Kompositionsentscheidungen.
- Mehrere Zyklen führen zu einer lesbaren Flotte und nicht zu gestapelten Sprite-Clustern.

---

## Paket 9 – Automatisierung, Performance und Mobile-QA

**Priorität:** P0/P1

### Aufgaben

- Headless-Tests für Live-Match, Deployment-Grenzen, Lock-in, Refunds und Upgrade-Aktivierung ergänzen.
- Asset-Manifest und Animationsmetadaten automatisch validieren.
- Browser-Testmatrix für 360×800, 390×844, 393×852, 412×915 und 420×760 einrichten.
- Touch, Safe Areas, Fullscreen, Resize, Pause und Restart prüfen.
- JavaScript-Fehler, fehlgeschlagene Asset-Requests und unhandled rejections als Testfehler behandeln.
- Stressfixture mit dichten Flotten, Projektilen, Engines und Explosionen ausführen.
- Ziele messen: Framezeit, Projektilanzahl, Partikelanzahl, aktive Animationslayer und dekodierter Bildspeicher.

### Abnahme

- Keine JS-Fehler und keine fehlenden Manifestdateien.
- Der komplette Mobile-Viewport wird ohne Letterbox oder abgeschnittene Controls genutzt.
- Der Live-Match bleibt bei realistischen dichten Wellen bedienbar und visuell lesbar.

---

## Paket 10 – Balance- und Spielspaß-Gate

**Priorität:** P1/P2

### Aufgaben

- Headless AI-vs-AI-Simulation für Hunderte Matches ergänzen.
- Winrate, Matchdauer, Unit-Kaufhäufigkeit, Nodekontrolle, Turret-Lebensdauer und Lane Pressure erfassen.
- 22-Sekunden-Rhythmus auf Beobachtungs- und Entscheidungszeit testen, nicht vorschnell verkürzen.
- Unitkosten, Einkommen, Basisscouts, Capturestärke und Eskalation datengetrieben iterieren.
- Stagnation und Snowballing getrennt messen.
- Erst nach erfolgreichem Kern-Gate Battlecruiser und Dreadnought aktivieren.

### Spielspaß-Gate

Der Kern ist erst bestanden, wenn:

- während des laufenden Kampfes sinnvolle nächste Wellen geplant werden können,
- die simultane Auslieferung eine sichtbare taktische Konsequenz hat,
- beide Lanes regelmäßig unterschiedliche Entscheidungen verlangen,
- mindestens zwei sinnvolle Kompositionen pro typischer Lage existieren,
- Nodes relevant sind, aber nicht allein das Match entscheiden,
- Matches ohne künstliche Wave-Grenze zuverlässig durch HQ-Zerstörung enden,
- der Kampf auf einem echten Smartphone ruhig, verständlich und befriedigend wirkt.

---

## Empfohlene Commit-Grenzen

1. `Align contracts with continuous live match`
2. `Introduce live deployment director`
3. `Add lockable reinforcement queues`
4. `Move opponent AI into deployment cycles`
5. `Keep planning UI active during combat`
6. `Import licensed Galalaxy asset library`
7. `Add layered fleet animation profiles`
8. `Integrate animated projectile profiles`
9. `Add bounded combat FX and mobile stress checks`
10. `Add headless balance simulation`

## Bewusst nicht im aktuellen Ausbau

- dritte Lane,
- Multiplayer oder PvP,
- Kampagne und Story,
- Karten-/Decksystem,
- Gacha, Shop oder Monetarisierung,
- aktive Kampfzauber,
- direkte Schiffssteuerung,
- freie Kamera, Zoom oder Minimap,
- Fleet Doctrines vor bestandenem Kern-Gate,
- Shield-Gameplay nur weil Shield-Assets vorhanden sind,
- neue Fraktionsmechaniken nur weil Nautolan-Assets importiert wurden.

## Umsetzungsstand 7. September 2026

Die technische Grundlage der Pakete 0 bis 9 ist umgesetzt: kontinuierlicher `LIVE_MATCH`, automatische 22-Sekunden-Deployments, Lock-in, persistente Queues und Upgrades, regelgleiche KI, permanentes Mobile-Planungs-UI, vollständige lizenzierte Assetbibliothek, Nairan/Kla'ed-Layeranimationen, Originalprojektilprofile, begrenzte FX sowie Headless-, Stress-, Asset- und echte emulierte Browserprüfungen.

Für Paket 10 steht nun eine reproduzierbare AI-vs-AI-Auswertung zur Verfügung. Ihre erste Stichprobe hat eine unsymmetrische Kartenachse aufgedeckt; HQ, Turrets, Spawns und Nodes sind inzwischen exakt gespiegelt. Das eigentliche Spielspaß-Gate bleibt bewusst offen, bis reale Smartphone-Sessions Lesbarkeit, Touchkomfort, Kompositionsvielfalt und den 22-Sekunden-Rhythmus bestätigen. Capital Ships bleiben bis dahin deaktiviert.

## Nächster ausführbarer Schritt

Als nächstes folgen echte Smartphone-Playtests und datengetriebene Balanceiterationen. Neue Einheiten oder Modi werden erst begonnen, wenn der kontinuierliche Kern auf Hardware lesbar und taktisch interessant ist.
