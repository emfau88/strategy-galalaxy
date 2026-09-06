# Strategy Galalaxy – Entwicklungsroadmap

## Ziel

Strategy Galalaxy wird ein eigenständiges, Mobile-First Singleplayer-Spiel im Smartphone-Portraitformat. Zwei persistente Lanes, automatisch kämpfende Flotten und wiederkehrende Command-/Battle-Phasen bilden den spielbaren Kern.

Die zentrale Spielerentscheidung lautet:

> Welche Einheiten schicke ich wann auf welche Lane, und investiere ich jetzt in Druck, Verteidigung oder Economy?

Das erste Produktziel ist ein vollständiges, gut lesbares und neu startbares Match. Zusätzlicher Content folgt erst, wenn dieser Kern trägt.

## Verbindliche Leitplanken

- Arbeits-Repository: `emfau88/strategy-galalaxy`
- Referenz-Repository: `emfau88/galalaxy`
- Das Referenz-Repository wird ausschließlich gelesen oder separat lokal geklont. Dort werden keine Dateien geändert, Commits erzeugt oder Branches gepusht.
- Alle Änderungen, Dokumentation, Commits und Pushes erfolgen ausschließlich im Arbeits-Repository.
- Smartphone Portrait ist die primäre Plattform; Desktop mit Maus bleibt funktionsfähig.
- Das Spiel besitzt genau zwei Lanes im ersten Vertical Slice.
- Es gibt keine manuelle Steuerung, Einheitenauswahl oder Kampf-Micro.
- Einheiten bleiben nach einem Deployment Cycle bestehen, sofern sie überleben.
- Command Phase und Battle Phase wechseln sich ab; während der Command Phase steht die gesamte Simulation.
- Beide Teams verwenden dieselben Economy-, Kauf-, Upgrade- und Deployment-Regeln.
- Ein Match endet erst mit der Zerstörung eines Headquarters.
- Bestehende Galalaxy-Technik und Assets werden gezielt wiederverwendet, ohne das alte Domänenmodell zu übernehmen.
- Spielwerte und Inhalte werden datengetrieben und zentral konfigurierbar angelegt.
- Qualität und Spielbarkeit des Kernmatches haben Vorrang vor Feature-Menge.

## Prioritäten

| Priorität | Bedeutung | Regel |
| --- | --- | --- |
| P0 | Für den Vertical Slice zwingend | Muss vor der ersten Spielbewertung fertig und stabil sein |
| P1 | Für Lesbarkeit, Atmosphäre oder belastbare Entwicklung wichtig | Nach funktionierendem Kern umsetzen |
| P2 | Spätere Erweiterung | Nur vorbereiten, nicht im ersten Vertical Slice ausbauen |

## Definition des ersten Vertical Slice

Der Vertical Slice ist erreicht, wenn ein Match vom Start bis Victory oder Defeat ohne manuelle Schiffssteuerung gespielt und anschließend neu gestartet werden kann.

Enthalten sind:

- Portrait-Mobile-Layout mit zwei Lanes
- Player HQ und Enemy HQ
- je eine Defense Station pro Team und Lane
- je ein Energy Node pro Lane
- Command Phase und Battle Phase
- persistierende Einheiten und Frontlinien
- kostenlose Basis-Waves auf beiden Lanes
- Scout, Fighter, Bomber und Frigate
- Energy, Basiseinkommen und Node-Bonus
- Economy Upgrade und Turret Upgrade
- regelkonforme heuristische AI
- Victory, Defeat und Restart
- geeignete Galalaxy-Schiffsassets, Projektile und Effekte
- Debug-/Testmodus und Kern-QA

## Arbeitsreihenfolge

Die Bulks werden in der folgenden Reihenfolge bearbeitet. Jeder Bulk endet mit einem überprüfbaren Zwischenstand und soll in einem eigenen kleinen Commit oder einer kleinen zusammenhängenden Commit-Serie landen.

---

## Bulk 0 – Repository-Schutz und Arbeitsgrundlage

**Priorität:** P0  
**Ziel:** Verwechslungen zwischen Arbeits- und Referenz-Repository technisch und dokumentarisch vermeiden.

### Aufgaben

- [x] Git-Remote, Branch und Arbeitsverzeichnis des neuen Repositories prüfen.
- [x] Referenz-Repository in ein klar getrenntes, nur für die Analyse verwendetes Verzeichnis klonen oder vorhandenen Clone verifizieren.
- [x] Vor jedem späteren Commit und Push prüfen, dass das Ziel `strategy-galalaxy` ist.
- [x] Basisdateien für Projekt- und Entwicklungsdokumentation anlegen.
- [x] Festhalten, wie übernommener Code und Assets auf ihre Herkunft zurückgeführt werden.

### Ergebnis / Abnahme

- Das neue Repository ist eindeutig das einzige Schreibziel.
- Das Referenz-Repository ist getrennt und bleibt sauber/unverändert.
- Repository-Regeln sind im neuen Projekt auffindbar dokumentiert.

---

## Bulk 1 – Vollständiger Galalaxy-Audit

**Priorität:** P0  
**Ziel:** Wiederverwendbare Technik und Assets erkennen, bevor neue Grundlagen gebaut werden.

### Aufgaben

- [x] Projektaufbau, Build-/Startprozess, Runtime und Abhängigkeiten erfassen.
- [x] Game Loop, Canvas-Rendering, Mobile Scaling und Safe-Area-Verhalten analysieren.
- [x] Asset Loader und Asset-Registrierung analysieren.
- [x] Entity- und Datenmodelle untersuchen, besonders Player, Enemies, Projectiles, Pickups und Particles.
- [x] Combat-, Ability-, FX-, Sector-, Upgrade- und Sound-Systeme untersuchen.
- [x] Flotten-, Schiffs-, Waffen-, Projektil- und Visual-Definitionen erfassen.
- [x] Formation-/Flyby-Logik und Spawn-Verhalten prüfen.
- [x] Save-, Run-Stats-, Input- und QA-/Reliability-Mechanismen prüfen.
- [x] Performance-Caps und bekannte Schutzmechanismen für Units, Projectiles und Particles dokumentieren.
- [x] Sämtliche relevanten Assets inventarisieren und nach Schiffsklasse, Fraktion, Projektil, FX, UI, Hintergrund und Sound gruppieren.
- [x] Zwei visuell konsistente Fraktionen für den Vertical Slice vorschlagen.
- [x] Lizenz-/Attributionslage der übernommenen Bestandteile prüfen und dokumentieren.

### Zu analysierende Kernbereiche

```text
src/game.js
src/config.js
src/entities/
src/systems/
src/data/
src/assetLoader.js
src/assets.js
src/input.js
src/saveSystem.js
src/runStats.js
```

### Entscheidungsmatrix

Jedes relevante System wird einer Kategorie zugeordnet:

1. **Direkt übernehmen:** technisch passend und ausreichend entkoppelt.
2. **Adaptieren:** wertvolle Grundlage, benötigt aber Team-/Lane-/Match-Anpassungen.
3. **Nur als Konzept übernehmen:** Implementierung ist zu stark an das alte Spiel gebunden.
4. **Nicht übernehmen:** für Strategy Galalaxy ungeeignet oder unnötig.

### Ergebnis / Abnahme

- `docs/REFERENCE_AUDIT.md` beschreibt Architektur, Assets, Wiederverwendung und Risiken.
- `docs/ASSET_INVENTORY.md` listet geeignete Assets samt geplanter Rolle.
- Für jedes Kernsystem besteht eine begründete Übernahmeentscheidung.
- Noch wurde keine neue Gameplay-Architektur auf Vermutungen aufgebaut.

---

## Bulk 2 – Produkt- und Architekturvertrag

**Priorität:** P0  
**Abhängigkeit:** Bulk 1  
**Ziel:** Die unverhandelbaren Spielregeln und die technische Trennung verbindlich festhalten.

### Aufgaben

- [x] `README.md` mit Projektziel, geplantem lokalen Start, aktuellem Status und Dokumentationslinks erstellen.
- [x] `docs/GAME_DESIGN.md` mit Kernloop, Siegbedingung, Economy, Units, Nodes, Upgrades, AI-Regeln und Scope-Grenzen erstellen.
- [x] `docs/ARCHITECTURE.md` mit Systemgrenzen, Datenfluss und Herkunft übernommener Technik erstellen.
- [x] Zentrale Match-States definieren: `LOADING`, `TITLE`, `COMMAND`, `BATTLE`, `VICTORY`, `DEFEAT`, `PAUSED`.
- [x] Domänenmodell festlegen: `Team`, `Unit`, `Lane`, `Structure`, `Wave`, `Economy`, `CaptureNode`, `Match`, `AI`.
- [x] Teammodell generalisieren: `TEAM_PLAYER`, `TEAM_ENEMY`, `ownerTeam` und teamneutrales Targeting.
- [x] Datenformate für Units, Fraktionen, Maps, Upgrades und Balancing festlegen.
- [x] Schnittstellen zwischen Simulation, Rendering, UI und Input festlegen.
- [x] Deterministische Zeitführung sowie Seed-/Teststrategie beschreiben.

### Architekturprinzipien

- Der `MatchDirector` besitzt Phase, Timer, Cycle, Matchzeit, Deployment, Eskalation und Endzustand.
- Gameplay-Systeme arbeiten auf Simulationsdaten; Rendering liest diesen Zustand.
- UI plant Waves und Upgrades, verändert aber Einheiten im laufenden Kampf nicht direkt.
- Targeting sucht lane-lokal und vorhersehbar.
- Assets sind austauschbar; keine Mechanik hängt von einem Placeholder ab.
- Unit- und Balancingwerte stehen zentral in Daten, nicht verteilt in Entity-Code.

### Ergebnis / Abnahme

- Die drei Kerndokumente sind konsistent und bilden die Grundlage für spätere Agent-Sessions.
- Verantwortlichkeiten und erlaubte Abhängigkeiten der Systeme sind eindeutig.
- Technische Entscheidungen aus dem Referenz-Audit sind nachvollziehbar dokumentiert.

---

## Bulk 3 – Technische Foundation

**Priorität:** P0  
**Abhängigkeit:** Bulk 2  
**Ziel:** Ein stabiler, mobiler Canvas-Rahmen ohne fertiges Gameplay.

### Aufgaben

- [x] Minimale Projekt-, Build- und Verzeichnisstruktur aufsetzen.
- [x] `index.html`, Einstiegspunkt, Canvas und Game Loop integrieren.
- [x] Design Space auf Portrait ausrichten; Galalaxys circa `420 × 760` als Ausgangspunkt prüfen.
- [x] Viewport Scaling, Safe Areas, Touch-Koordinaten und Desktop-Mausabbildung umsetzen.
- [x] Asset Loader gezielt übernehmen oder adaptieren.
- [x] Rendering-Schichten für Hintergrund, Battlefield, Entities, FX und UI vorbereiten.
- [x] Zeitmodell mit pausierbarer Simulation und getrennten Render-/Simulationszeiten anlegen.
- [x] Zentrale Konfiguration für Phasenlängen, Caps und Balancing-Ausgangswerte anlegen.
- [x] Einfachen `?debug=1`- und `?test=match`-Einstieg vorbereiten.

### Ergebnis / Abnahme

- Das Projekt startet lokal ohne JavaScript-Fehler.
- Ein skalierter Portrait-Canvas wird auf Zielgrößen korrekt dargestellt.
- Maus und Touch werden konsistent auf den Design Space abgebildet.
- Pausierte Simulationszeit ist technisch von weiterlaufendem Rendering getrennt.

### Zielgrößen

- `360 × 800`
- `390 × 844`
- `393 × 852`
- `412 × 915`
- `420 × 760`

---

## Bulk 4 – Headless Lane-Kampfsimulation

**Priorität:** P0  
**Abhängigkeit:** Bulk 3  
**Ziel:** Der Kampf funktioniert zunächst mit einfachen Visuals und ohne Command-UI.

### Aufgaben

- [x] Mapdaten für zwei parallele Lanes definieren.
- [x] Allgemeine `Unit`-, `Structure`- und `Projectile`-Modelle implementieren.
- [x] HQs, vier Defense Stations und feste Lane-Zuordnung implementieren.
- [x] Scout, Fighter, Bomber und Frigate datengetrieben anlegen.
- [x] Battlecruiser und Dreadnought im Datenmodell ermöglichen, ohne sie schon fertig auszubalancieren.
- [x] Lane-gebundene Bewegung und sinnvolle Spawn-Formationen implementieren.
- [x] Vorhersehbare Zielauswahl implementieren: Lane-Unit, Lane-Struktur, HQ.
- [x] Zustände umsetzen: `ADVANCING`, `ENGAGING`, `HOLDING`, `ATTACKING_STRUCTURE`, `DEAD`.
- [x] Projectile-, Treffer-, Schaden-, Tod- und Strukturkampf integrieren.
- [x] Turret- und HQ-Auto-Angriffe implementieren.
- [x] Lane-spezifische Collections und begrenzte Suchen verwenden.
- [x] Caps und Object-Pooling dort übernehmen, wo Messung oder Audit es rechtfertigen.

### Ergebnis / Abnahme

- Zwei Teams können ohne Benutzereingriff auf beiden Lanes kämpfen.
- Units wechseln nicht unmotiviert zwischen Lanes und verfolgen keine Ziele quer über die Karte.
- Türme und HQs können Schaden erhalten und zerstört werden.
- Vier kaufbare Unit-Rollen sind im Kampf erkennbar verschieden.
- Mehrere Testkämpfe laufen stabil und nachvollziehbar ab.

---

## Bulk 5 – Deployment Cycle und persistierendes Match

**Priorität:** P0  
**Abhängigkeit:** Bulk 4  
**Ziel:** Den vollständigen Command-/Battle-Rhythmus herstellen.

### Aufgaben

- [ ] `MatchDirector` als alleinige Instanz für Match-State und Phasenwechsel implementieren.
- [ ] Command Phase mit zentral konfigurierbarer Ausgangsdauer von circa 8 Sekunden umsetzen.
- [ ] Battle Phase mit zentral konfigurierbarer Ausgangsdauer von circa 22 Sekunden umsetzen.
- [ ] Während der Command Phase Movement, Combat, Capture, Income und Cooldowns vollständig einfrieren.
- [ ] Pro Team und Lane eine geplante Wave verwalten.
- [ ] Automatische kostenlose Basis-Wave von zunächst zwei Scouts pro Lane integrieren.
- [ ] Player- und AI-Waves gleichzeitig zu Beginn der Battle Phase deployen.
- [ ] Überlebende Einheiten ohne Reset in den nächsten Cycle übernehmen.
- [ ] Victory und Defeat ausschließlich über HQ-Zerstörung auslösen.
- [ ] Restart in einen sauberen initialen Matchzustand umsetzen.

### Ergebnis / Abnahme

- Mehrere Deployment Cycles laufen ohne Reset des Schlachtfelds.
- Überlebende alter Waves vereinigen sich sichtbar mit Verstärkungen.
- Command Phase friert die gesamte Simulation exakt ein.
- Beide Seiten starten ihre neue Wave gleichzeitig.
- Matchende und Restart funktionieren zuverlässig.

---

## Bulk 6 – Economy, Energy Nodes und Eskalation

**Priorität:** P0  
**Abhängigkeit:** Bulk 5  
**Ziel:** Lane-Kontrolle und Ressourceneinsatz zu echten strategischen Entscheidungen machen.

### Aufgaben

- [ ] Eine einzige Hauptressource `Energy` implementieren.
- [ ] Konfigurierbare Startenergie und Basiseinkommen anlegen.
- [ ] Einkommen ausschließlich während aktiver Battle-Zeit erzeugen.
- [ ] Pro Lane einen Capture Node mit Fortschritt und Besitzstatus implementieren.
- [ ] Capture-Regeln umsetzen: ein Team im Bereich bewegt Fortschritt, beide Teams pausieren ihn.
- [ ] Kontrollierte Nodes gewähren konfigurierbaren Einkommensbonus.
- [ ] Kaufkosten reservieren/abbuchen und Entfernen geplanter Units korrekt erstatten.
- [ ] Economy Upgrade mit steigenden Kosten und prozentualem Basisbonus implementieren.
- [ ] Turret Upgrade mit steigenden Kosten und Damage-Bonus implementieren.
- [ ] Einkommensskalierung nach Matchzeit zentral konfigurieren.
- [ ] Stagnationsschutz für das Late Game vorsehen; zunächst über Income-Multiplikator und optional stärkere Auto-Waves.

### Ausgangswerte zum Testen

```text
Start Energy: 300
Base Income: +20/s
Node Bonus: +10/s
0–2 min: 1.0× Income
2–4 min: 1.5× Income
4–6 min: 2.0× Income
ab 6 min: 3.0× Income / Sudden Death
```

### Ergebnis / Abnahme

- Energy-Bilanz ist für Player und AI korrekt und nachvollziehbar.
- Nodes wechseln den Besitzer, können contested sein und verändern das Einkommen.
- In der Command Phase wächst weder Energy noch Capture-Fortschritt.
- Upgrades können gekauft werden, wirken korrekt und werden mit jedem Level teurer.
- Ein Match eskaliert messbar und bleibt nicht unbegrenzt in Kleingefechten stecken.

---

## Bulk 7 – Regelkonforme Singleplayer-AI

**Priorität:** P0  
**Abhängigkeit:** Bulk 6  
**Ziel:** Eine faire, verständliche Gegnerseite für vollständige Matches.

### Aufgaben

- [ ] AI ausschließlich während der Command Phase planen lassen.
- [ ] Dieselben Energy-, Kosten-, Income-, Node-, Wave- und Upgrade-Regeln wie beim Player verwenden.
- [ ] Lane Pressure aus Units, Positionen, Rollen, Turretstatus und Nodebesitz ableiten.
- [ ] Defensive Verstärkung einer bedrohten Lane ermöglichen.
- [ ] Push gegen eine erkennbare schwache Lane ermöglichen.
- [ ] Einfaches Budget für unmittelbare Units, Economy, Verteidigung und Sparen festlegen.
- [ ] Unit-Mix statt reinem Kauf der teuersten verfügbaren Unit fördern.
- [ ] Späte schwere Units über Sparziele technisch ermöglichen.
- [ ] Letzte AI-Entscheidung im Debug Overlay ausgeben.
- [ ] Garantieren, dass die AI nie mehr Energy ausgibt als vorhanden.

### Ergebnis / Abnahme

- Die AI spielt ein Match selbstständig bis zu einem Endzustand.
- Entscheidungen reagieren sichtbar auf Lane Pressure und Economy.
- Die AI erhält keine versteckten Dauereinnahmen oder kostenlosen Kauf-Waves.
- Mehrere automatisierte Matchläufe enden ohne Regelverletzung oder Deadlock.

---

## Bulk 8 – Mobile Command- und Battle-UI

**Priorität:** P0  
**Abhängigkeit:** Bulks 5–7  
**Ziel:** Den fertigen Kern mit einem klaren, einhändig bedienbaren Interface spielbar machen.

### Command Phase

- [ ] Pausiertes Schlachtfeld vollständig sichtbar halten.
- [ ] Linke und rechte Lane eindeutig auswählbar und unterscheidbar darstellen.
- [ ] Auto-Wave und zusätzlich geplante Units je Lane anzeigen.
- [ ] Scout-, Fighter-, Bomber- und Frigate-Buttons mit Kosten und Verfügbarkeit anzeigen.
- [ ] Hinzufügen und Entfernen geplanter Units ermöglichen.
- [ ] Restenergie und Gesamtkosten sofort aktualisieren.
- [ ] Economy- und Turret-Upgrades klar anbieten.
- [ ] Einen eindeutigen `DEPLOY WAVE`-Button bereitstellen.
- [ ] Bei Timerablauf eine konsistente Standardaktion ausführen.

### Battle Phase

- [ ] Kauf- und Upgrade-Steuerung ausblenden oder eindeutig deaktivieren.
- [ ] Phasentimer und Zeit bis zur nächsten Command Phase anzeigen.
- [ ] Player-/Enemy-HQ-HP, Turretstatus, Energy und Income anzeigen.
- [ ] Nodebesitz und Lane Pressure lesbar darstellen.
- [ ] UI-Fläche so begrenzen, dass das Beobachten der Schlacht im Mittelpunkt bleibt.

### Ergebnis / Abnahme

- Der Spieler versteht ohne Anleitung, was links und rechts deployt wird.
- Sämtliche P0-Interaktionen funktionieren mit Touch und Maus.
- Touch Targets sind ausreichend groß; kein Zielviewport erzeugt horizontales Scrollen.
- Die Battle Phase vermittelt klar, dass keine Eingabe erforderlich ist.

---

## Bulk 9 – Assets, Lesbarkeit und Audio

**Priorität:** P1  
**Abhängigkeit:** Funktionierender P0-Matchloop  
**Ziel:** Den Vertical Slice mit vorhandenen Galalaxy-Ressourcen visuell klar und atmosphärisch machen.

### Aufgaben

- [ ] Zwei visuell konsistente Referenzflotten integrieren.
- [ ] Scout, Fighter, Bomber und Frigate über Größe und Silhouette klar unterscheiden.
- [ ] Geeignete Assets oder robuste Placeholder für HQ, Turrets und Nodes verwenden.
- [ ] Projektile, Homing, Trails, Hit Sparks, Explosionen, Zaps und Shield Feedback gezielt adaptieren.
- [ ] Partikel und Effekte für kleine Displays begrenzen.
- [ ] Helle, freundliche Space-Palette mit Navy, Space Blue, Cyan, Teal, Lavender und Coral umsetzen.
- [ ] Hintergrundelemente wie Sterne, Nebel, Planeten und Asteroiden hinter die Lesbarkeit der Lanes stellen.
- [ ] Team- und Waffenfarben klar unterscheiden.
- [ ] Sound-System und geeignete bestehende Sounds integrieren.
- [ ] Kleine UI-Transitions und Trefferfeedback ergänzen.

### Ergebnis / Abnahme

- Unit-Typen und Teams sind auf kleinen Displays in Bewegung erkennbar.
- Effekte verdecken weder Frontverlauf noch wichtige Einheiten.
- Capital Ships können später sichtbar größer ergänzt werden.
- Das Spiel wirkt hell, hochwertig und arcadeartig, ohne Neon-/Bloom-Überladung.

---

## Bulk 10 – Debugging, Automatisierung und Performance-Gates

**Priorität:** P0 für Kernprüfungen, P1 für Optimierung  
**Abhängigkeit:** parallel zu Bulks 4–9 fortführen  
**Ziel:** Fehler schnell reproduzieren und den Matchloop dauerhaft absichern.

### Debug-Funktionen

- [ ] `?debug=1` zeigt FPS, Phase, Cycle, Matchzeit und beide Energy-Werte.
- [ ] Unit Counts pro Lane und Team anzeigen.
- [ ] Nodebesitz, Income-Multiplikator und letzte AI-Entscheidung anzeigen.
- [ ] `?test=match` startet einen schnellen, reproduzierbaren Matchmodus.
- [ ] Seed und Simulationsgeschwindigkeit für reproduzierbare Tests steuerbar machen.

### Automatische Kernprüfungen

- [ ] Spiel lädt ohne JavaScript-Fehler.
- [ ] Title → Match funktioniert.
- [ ] Command Phase friert die Simulation vollständig ein.
- [ ] Player kann Units einer Lane hinzufügen und wieder entfernen.
- [ ] Kosten, Erstattung und verfügbare Energy stimmen.
- [ ] Deploy startet Player- und AI-Wave gleichzeitig.
- [ ] Battle Phase läuft und Units bleiben lane-gebunden.
- [ ] Units bekämpfen gegnerische Units und Strukturen.
- [ ] Überlebende bleiben nach dem Cycle bestehen.
- [ ] Nodes wechseln Besitzer und verändern Income.
- [ ] Turrets und HQs können zerstört werden.
- [ ] Victory, Defeat und Restart funktionieren.
- [ ] AI überzieht ihr Budget nicht.
- [ ] Ziel-Viewports bleiben ohne Überlauf bedienbar.

### Performance-Gates

- [ ] Keine DOM-Elemente pro Unit verwenden.
- [ ] Keine unbegrenzten Partikel oder Projektile zulassen.
- [ ] Keine globale O(n²)-Zielsuche über beide Lanes verwenden.
- [ ] Objektallokationen in Hot Paths messen und begrenzen.
- [ ] Stressszenario mit großen persistierenden Waves definieren.
- [ ] Performance auf einem realistischen mobilen Leistungsprofil prüfen.

### Ergebnis / Abnahme

- Kernregressionen werden automatisiert erkannt.
- Fehlerhafte Matches sind über Seed/Testmodus reproduzierbar.
- Der Vertical Slice hält definierte Caps ein und bleibt bei großen Pushes bedienbar.

---

## Bulk 11 – Vertical-Slice-Balancing und Spielspaß-Gate

**Priorität:** P0  
**Abhängigkeit:** Bulks 0–10  
**Ziel:** Prüfen, ob die Kernentscheidung über Lane, Timing, Composition und Economy trägt.

### Aufgaben

- [ ] Telemetrie im Debugmodus für Matchdauer, Ausgaben, Nodebesitz, Turret-Fall und Unit-Mix erfassen.
- [ ] Early-, Mid- und Late-Game-Verlauf gegen das gewünschte Dramaturgiemodell prüfen.
- [ ] Scout, Fighter, Bomber und Frigate auf unterschiedliche, verständliche Rollen abstimmen.
- [ ] Prüfen, ob „immer teuerste Unit kaufen“ dominant ist, und Kosten/Rollen korrigieren.
- [ ] Defense, Counterpush, Sparen und Economy-Investment als mindestens situativ sinnvolle Entscheidungen herstellen.
- [ ] Node-Snowball stark genug für Relevanz, aber umkehrbar abstimmen.
- [ ] Matchdauer und Sudden-Death-Skalierung gegen Stagnation testen.
- [ ] Lesbarkeit großer Pushes auf kleinsten Ziel-Viewports prüfen.
- [ ] Restart und mehrere Matches hintereinander auf Zustandslecks testen.

### Spielspaß-Gate

Vor P2-Content müssen folgende Fragen überwiegend mit „ja“ beantwortet werden:

- Erzeugt fast jeder Command Cycle eine echte Abwägung?
- Ist der Frontverlauf auf beiden Lanes sofort verständlich?
- Fühlen sich erfolgreiche persistierende Pushes befriedigend an?
- Sind Nodes kurzfristig relevant, ohne das Match früh unumkehrbar zu machen?
- Haben alle vier Unit-Typen einen erkennbaren Einsatzgrund?
- Eskaliert das Match von kleinen Gefechten zu großen Flottenkämpfen?
- Ist Zuschauen während der Battle Phase unterhaltsam?

### Ergebnis / Abnahme

- Ein vollständiges Match ist stabil, verständlich und spielerisch bewertbar.
- Bekannte Balanceprobleme sind dokumentiert und zentral über Daten korrigierbar.
- Erst nach bestandenem Gate wird der Scope erweitert.

---

## P2 – Bewusst zurückgestellter Ausbau

Diese Punkte werden architektonisch ermöglicht, aber erst nach dem Spielspaß-Gate umgesetzt:

- Battlecruiser und Dreadnought vollständig balancieren
- weitere Fraktionen, einschließlich Nautolan
- alternative Maps wie Asteroid Choke, Node Relay und Central Station
- stärkere Auto-Waves und zusätzliche Late-Game-Eskalation
- zusätzliche Unit-Prioritäten und vorsichtiges Counter-System
- echte HQ-Abilities
- weitere Upgrades
- Meta-Progression oder Kampagnenstruktur

## Nicht Bestandteil des ersten Vorhabens

- Multiplayer, PvP, Backend, Accounts oder Matchmaking
- Shop, Echtgeld, Werbung oder Battle Pass
- Deckbuilding, Kartenhand, Booster, Gacha oder Random Loot
- Inventar oder große Tech Trees
- Campaign Map oder Story-Produktion
- sechs Maps oder zehn Fraktionen
- dritte Lane
- Hero Unit oder manuelle Abilities
- Joystick, WASD, Drag-to-move, Waypoints oder andere manuelle Unit-Steuerung

## Vorgeschlagene Commit-Grenzen

Commits sollen klein und prüfbar bleiben. Sinnvolle Grenzen sind:

1. Repository-Regeln und Audit-Dokumente
2. Game-Design- und Architekturvertrag
3. Canvas-, Scaling- und Asset-Foundation
4. Lane-, Unit- und Structure-Simulation
5. Projectile- und Combat-Integration
6. MatchDirector und Deployment Cycles
7. Economy, Nodes und Upgrades
8. AI
9. Command-/Battle-UI
10. Assets, FX und Sound
11. QA-, Debug- und Performance-Gates
12. Balancing-Anpassungen jeweils thematisch getrennt

## Reihenfolge der ersten ausführbaren Arbeitspakete

Für die konkrete Abarbeitung beginnt die Entwicklung mit diesen fünf überschaubaren Paketen:

1. **Referenz sichern und auditieren**  
   Read-only Clone prüfen, Quellstruktur und Runtime erfassen, keine Dateien übernehmen.

2. **Asset- und Systeminventar erstellen**  
   Wiederverwendbarkeit bewerten, zwei Fraktionen auswählen, Risiken dokumentieren.

3. **Architektur und Datenverträge festziehen**  
   Match-, Team-, Lane-, Unit-, Structure- und Wave-Modell sowie Systemgrenzen dokumentieren.

4. **Technische Foundation aufsetzen**  
   Projektstart, Canvas, Game Loop, Scaling, Asset Loader und pausierbare Simulationszeit.

5. **Ersten autonomen Zwei-Lane-Kampf herstellen**  
   Units, Strukturen, Bewegung, Targeting, Projectiles und Tod zunächst ohne fertige UI.

Danach folgen Deployment Cycle, Economy/Nodes, AI, Mobile UI, visuelle Integration und das Spielspaß-Gate in genau dieser Abhängigkeitsfolge.
