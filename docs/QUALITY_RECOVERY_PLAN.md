# Strategy Galalaxy – Qualitäts- und Wiederaufnahmeplan

Stand: 7. Oktober 2026  
Status: Bulks 0–2 softwareseitig geprüft; Präsentation und Bedienung aus Bulks 3–4 umgesetzt und im Browser geprüft. Geräte-/Spielerabnahme und extreme Flottendichte bleiben offen.
Entscheidung: Vom bestätigten alten GitHub-Stand weiterarbeiten und lokale Ergänzungen einzeln bewerten.

## 1. Ziel und verbindlicher Umfang

Ein hochwertiges, mobil gut lesbares Echtzeit-Flottenschlachtspiel im Portraitformat:

> Front beobachten → Energie investieren → Verstärkung sofort starten → ihre Wirkung erkennen → auf den Gegner reagieren.

Die [Core Gameplay Vision](../STRATEGY_GALALAXY_CORE_VISION.md) bleibt die verbindliche Produktvorgabe. Der [Game Design Contract](GAME_DESIGN.md) beschreibt die Mechanik. Dieser Plan führt die nächsten Arbeiten; die älteren Roadmaps dokumentieren bisherige Umsetzung und offene Ideen. Veraltete Aussagen zu Turrets, Nodes oder Kauf-Queues werden nicht als neue Anforderungen übernommen.

Für den ersten Qualitätsmeilenstein gelten:

- Level 1 mit einer Lane und Level 2 mit zwei Lanes; bestehende vertikal scrollbare Welt und feste Bedienelemente.
- Sofortiges Live-Deployment, permanente Energie und davon unabhängige kostenlose Drone-Waves.
- Individuell sichtbare Squad-Mitglieder und unterschiedliche Klassenrollen.
- Organische Verbände, erkennbare Gefechtszonen und nachvollziehbarer Vorstoß nach gewonnenen Kämpfen.
- Strikte Draufsicht, ruhige Gefechtskorridore, erkennbare Waffen und klares Trefferfeedback.
- Dieselben Ressourcen-, Kauf-, Cooldown- und Kapazitätsregeln für Spieler und KI.

Eine starre gemeinsame Frontlinie ist kein eigenes Abnahmeziel. Neue Levels, Gebäude, Ressourcen, Commander-Fähigkeiten, Spezialisierungen und Meta-Progression bleiben bis zum bestandenen Kern-Meilenstein zurückgestellt.

## 2. Gesicherter Ausgangsbefund

| Punkt | Befund aus der Prüfung |
| --- | --- |
| Gespeicherte Remote-Referenz | `origin/main` = `ed8802b2652d07ae2e7884f1dc2eabd195b34057`, 11. September 2026 |
| Lokaler Stand vor Erstellung dieses Plans | `4768dac02bc7f31df14730682f7fa801cc736361`, 15. September 2026 |
| Lokale Zusatzarbeit | Sieben Commits; 16 betroffene Dateien; 701 hinzugefügte und 36 entfernte Zeilen |
| Arbeitsverzeichnis vor dem Plan | Sauber; keine uncommitteten Änderungen |
| Assets und Karten | In den sieben Zusatzcommits nicht gelöscht oder ersetzt |
| Aktueller Live-Stand auf GitHub | Nicht unabhängig bestätigt; direkte Abfrage scheiterte an der Netzwerkverbindung |
| Aktuelle visuelle Laufzeitabnahme | Nicht durchgeführt; Browserzugriff war nicht möglich |

Die Tabelle beschreibt den historischen Audit vor der Umsetzung. GitHub HEAD und main wurden inzwischen am 7. Oktober live als `ed8802b` bestätigt; Quellstand und gebautes Spiel sind inzwischen im Browser geprüft. Der aktuelle [Qualitätsbericht](QUALITY_RECOVERY_REPORT.md) enthält die Umsetzungsergebnisse.

Die folgenden Ergebnisse stammen aus tatsächlich ausgeführten Simulationen und Prüfungen. Sie ersetzen keine Geräte- oder Spielspaßabnahme.

| Vergleich | Alter gespeicherter Stand | Lokaler Stand |
| --- | ---: | ---: |
| Foundation-Test | bestanden | bestanden |
| Durchschnittliche freundliche Überschneidungen im vorhandenen Dichtetest | 105,6 | 84,0 |
| Maximale seitliche Richtungswechsel pro Schiff in 20 Sekunden im Dichtetest | 9 | 9 |
| Level 2, 30 KI-Partien: Spieler-/Gegnersiege | 14 / 16 | 14 / 16 |
| Level 2, 30 KI-Partien: Draws / Timeouts | 0 / 0 | 0 / 0 |
| Level 2: durchschnittliche Matchdauer | 302,4 s | 150,6 s |
| Level 1, vier KI-Partien: Timeouts nach 480 Sekunden | 4 / 4 | 4 / 4 |

Zusätzlich bestanden Asset-, Stress- und Cluster-Prüfung des lokalen Endstands. Der Zwischencommit `6b1d5b9` verursachte im Cluster-Test bis zu 71 seitliche Richtungswechsel; `8b9ee40` reduzierte sie wieder auf 9.

**Nachgewiesene neue Regression:** Bei einer gemischten Scout-/Fighter-/Frigate-Gruppe gegen dieselbe Frigate liegen die lokalen Sollpositionen des Fighters bei 113,9 Einheiten Entfernung trotz 105 Reichweite und der Frigate bei 176,2 trotz 132 Reichweite. Im alten Stand beträgt der Abstand 95,5 beziehungsweise 118,8. Die neuen Tests prüfen verschiedene Slots, aber nicht deren Waffenreichweite. Siehe `battleSimulation.tacticalPosition` und den Mixed-Role-Test in `tests/foundation.test.mjs`.

**Grenzen der Kennzahlen:** Die vorhandene Überlappungszählung verwendet Abstandsradien; sie belegt nicht unmittelbar das im Battle-Line-Entwurf genannte Ziel für Kollisionsüberschneidungen oder sichtbare Sprite-Stapel. Wiederholungen weniger deterministischer KI-Konstellationen sind keine unabhängigen Balancebeweise. Das 14:16-Ergebnis beschreibt Seitenverteilung, nicht Klassenbalance oder die Qualität der Schwierigkeitsstufen. In beiden Level-2-Läufen gewann Tactician alle Partien gegen Admiral.

## 3. Auswahl der lokalen Ergänzungen

Kein kompletter Cherry-Pick eines Commits, der Werkzeuge, Präsentation und Gameplay gemeinsam verändert. Jede Übernahme bekommt einen begrenzten Diff und eigene Nachweise.

| Commit | Inhalt | Entscheidung für die neue Basis |
| --- | --- | --- |
| `1e8d874` | Schnellere Wellen, Heimat-Drones, Startfeedback | Aufteilen. Startfeedback als Kandidat für Bulk 3; Wellentakt und Heimat-Drones zunächst nicht übernehmen. |
| `36b43be` | Lokaler Vorschau-Server | Nach kurzer Prüfung in Bulk 0 übernehmen; kein Gameplay-Eingriff. |
| `b9d62e2` | Kürzerer Boost-Trail, größere Guard-Distanz | Trail nur zusammen mit abgenommenem Startfeedback betrachten; Guard-Tuning bleibt zurückgestellt. |
| `91300db` | Battle-Line-Konzept | Als historischen Entwurf erhalten; keine verbindliche Implementierungsvorgabe. |
| `6b1d5b9` | Formationsraster und Struktur-Anfahrtsgeometrie | Nicht pauschal übernehmen. Reichweitenproblem mit Tests erfassen; sinnvolle Geometrieideen bei Bedarf neu und begrenzt implementieren. |
| `8b9ee40` | Reparatur des Pendelns nach dem Rasterumbau | Nicht automatisch übernehmen. Erst prüfen, ob die jeweilige Ursache auf der alten Basis vorkommt. |
| `4768dac` | Blob-Messung aus KI-Partien | Nach Prüfung als Diagnosewerkzeug übernehmen; zunächst kein hartes Qualitäts-Gate. |

Der alte Wellentakt bleibt bis zum gezielten Tempoexperiment bestehen. Frühe Leere wird zuerst gemessen; zusätzliche Einheiten oder kürzere Timer sind keine automatische Lösung. Der 15-Sekunden-Start liegt zudem außerhalb der in der Vision genannten ungefähren 18–22 Sekunden.

## 4. Bulks und Abnahme

Die Häkchen dokumentieren ausgeführte Implementierung und Softwareprüfungen. Die gesonderten Abnahmekriterien bleiben maßgeblich: menschliche Balancebewertung, Blind-Lesbarkeit, Handhaltung und reale Geräte sind weiterhin offen.

### Bulk 0 – Historie sichern und Ausgangsbasis herstellen

**Ziel:** Ein nachvollziehbarer Ausgangspunkt, ohne lokale Arbeit zu verlieren.

- [x] Repository-Identität nach [Repository Rules](REPOSITORY_RULES.md) bestätigen.
- [x] Den bisherigen lokalen Commit einschließlich seiner sieben Zusatzcommits unter `codex/archive-local-2026-09-15` erhalten.
- [x] Plan-Dokumentation auf `codex/quality-plan` sichern und auf den Arbeitsbranch mitnehmen.
- [x] GitHub HEAD und main rein lesend abfragen: beide entsprechen `ed8802b`.
- [x] Remote-Abweichung prüfen: keine vorhanden.
- [x] `codex/quality-recovery` vom bestätigten alten Commit erstellen; Zusatzarbeit bleibt erhalten.
- [x] Vorschau-Server übernehmen; Diagnose mit vom Sampling unabhängigem KI-Takt ergänzen.
- [x] Foundation, Assets, Stress, Cluster und Browser-Checks auf der Basis ausführen; beide Karten aufnehmen.
- [x] [Baseline-Bericht](QUALITY_RECOVERY_REPORT.md) mit Ergebnissen und bekannten Fehlern erstellen.

**Abnahme:** Baseline und gesicherter Lokalstand sind eindeutig identifizierbar; das Spiel lässt sich reproduzierbar starten; neue Dokumentation geht beim Wechsel nicht verloren. Netzwerk- oder Browserausfälle bleiben als offene Verifikation vermerkt.

### Bulk 1 – Reichweite, Bewegung und Gefechtsauflösung

**Ziel:** Schiffe stehen sinnvoll, kämpfen tatsächlich und setzen nach einem Sieg ihren Weg fort.

- [x] Mixed-Role-Reichweitenfall, Drone-Duell, breite und schmale Lane, dichte Mischflotte, Zielverlust, Randposition und Carrier-Belagerung reproduzierbar abdecken.
- [x] Reichweite als euklidischen Abstand prüfen; seitliche Position und Reihenabstand gemeinsam berücksichtigen.
- [x] Sollpositionen an erreichbare Ziele binden. Tiefere Positionen dürfen nicht zu dauerhaft untätigen Angreifern führen; mögliche Reserveplätze werden ausdrücklich als solche behandelt.
- [x] Lokale, stabile Abstände und Zielbindungen verbessern, soweit die Baseline das erfordert. Keine globale Kampflinie erzwingen.
- [x] Rückwärtsdrift, Endlosorbits, hektische Richtungswechsel und feststeckende Überlebende prüfen und gezielt beheben.
- [x] Frigate-Breitseite einschließlich Ausrichtung, Feuerfreigabe und vollständiger Salve prüfen.
- [x] Level-1-Stalemates untersuchen: Bewegung, erreichbare Feuerpositionen, Treffer, Zielwechsel und tatsächlich verursachten Schaden zeitlich aufzeichnen.
- [x] Geometrische Ursachen beheben; verbleibende Economy- oder Regenerationsursachen für Bulk 2 dokumentieren.

**Abnahme:** Der konkrete Reichweitenfall ist behoben und durch Verhaltenstests abgesichert. Auch im dichten Gefecht bleiben Feuerfreigabe, Lane-Zuordnung und Weiterflug intakt. Die bestehenden Cluster-Grenzen bestehen weiterhin. Es gibt keinen ungeklärten geometrisch verursachten Stillstand in der Prüfsammlung.

### Bulk 2 – Klassenrollen, Economy und Matchtempo

**Ziel:** Jede Kaufoption hat einen verständlichen Zweck, und beide Karten entwickeln einen entscheidbaren Kampf.

- [x] Bomber-Zielwahl zuerst bearbeiten: erreichbare schwere Ziele berücksichtigen, bevor ein weit entfernter Carrier den lokalen Kampf überstimmt. Nicht zuerst HP oder Schaden erhöhen.
- [x] Rollen anhand echter Begegnungen prüfen: Scouts als schnelle Screens, Fighter als Eskorte/Anti-Light/Anti-Bomber, Bomber gegen Heavy und Strukturen, Frigate als schwerer Anker.
- [x] Rush, gemischte Flotte, frühe Economy und frühe Forschung mit vertauschten Seiten und Lane-Präferenzen vergleichen.
- [x] Unter anderem Startenergie, Einkommen, Kosten, Cooldowns, Schildregeneration und kostenlose Verstärkung untersuchen. Pro Experiment nur eine zusammenhängende Parametergruppe verändern.
- [x] Verbleibende Level-1-Stalemates beheben und vor der Änderung nachgewiesene Fälle erneut ausführen.
- [x] Tactician-/Admiral-Ergebnisse untersuchen; Schwierigkeit nach tatsächlicher Herausforderung bewerten, nicht nach Entscheidungsfrequenz allein.
- [x] Matchdauer, Zeit bis zum Erstkontakt, Kaufmix, Schaden nach Klasse, Einkommensinvestitionen, Timeouts und Ausgaben gegen die Baseline vergleichen.
- [x] Wellentakt und Heimat-Drones nur als gesonderte, begründete Experimente bewerten. Eine halbierte Matchdauer gilt nicht automatisch als Verbesserung.

**Abnahme:** Die bisherigen Level-1-Timeoutfälle enden regulär oder ihr legitimer Pattfall ist nachvollziehbar belegt. Jede bezahlte Klasse hat mindestens ein nachgewiesenes Einsatzgebiet. Mehrere Ausgabenstrategien sind situativ brauchbar. Spieler und KI bleiben regelgleich. Gespiegelte Ergebnisse allein reichen nicht zur Abnahme.

### Bulk 3 – Lesbare und hochwertige Kampfpräsentation

**Ziel:** Die vorhandenen Assets wirken als zusammenhängende Flotte mit materiellen Waffen und Treffern.

- [x] Start → Flug → Bremsen → Angriff → Treffer → Verlust → Weiterflug als vollständige Ereigniskette auf beiden Karten prüfen.
- [x] Düsen, Mündungen und Schilde an die tatsächlichen Hüllen und deren Drehung binden; vorhandene korrekte Hardpoints erhalten.
- [x] Kleine Drones, Scouts, Fighter, Bomber und Frigates nach Silhouette, Größe und Feuerprofil unterscheiden.
- [x] Waffenursprung, Geschosskörper und Einschlag sichtbar halten; Trails, Glow und Explosionen bei Bedarf reduzieren.
- [x] Dezentes Startfeedback aus dem Lokalstand isoliert erproben. Keine zusätzliche Grafik darf den korrigierten Düsenursprung verdecken.
- [x] Ruhige Hintergrundkorridore und strikte Draufsicht erhalten. Neue Assets erst erzeugen, wenn eine konkrete Lücke nachgewiesen ist.
- [x] Den [Visual Readability Contract](VISUAL_READABILITY_CONTRACT.md) am kleinsten unterstützten Viewport anwenden; veraltete Node-/Turret-Passagen für den aktiven Core-Slice bereinigen.

**Abnahme:** Bei nativer Breite von 360 Pixeln sind Klasse, Fraktion, Schütze, Ziel und Waffenrolle erkennbar. Schäden und Kills lassen sich ohne dauerhaft eingeblendete Healthbars verstehen. Frühe, gemischte und dichte Szenen belegen das; sichtbare Sprite-Stapel werden separat von Simulationsüberschneidungen bewertet.

### Bulk 4 – Mobile Bedienung, Orientierung und Einstieg

**Ziel:** Beobachtung und Entscheidung funktionieren auch mit Handhaltung und verdeckenden Fingern.

- [x] Lane-Wahl, Kauf, Cooldown und Sperrgründe auf `360×800`, `390×844`, `393×852`, `412×915` und `420×760` prüfen.
- [x] Fleet-/Upgrade-Wechsel, Carrier-Tap, Command-Dock, Pause, Restart und Main Menu erneut testen.
- [x] Gekaufte Verstärkung innerhalb der in der Vision erlaubten maximalen 1,5 Sekunden sichtbar starten lassen.
- [x] Scrollen und Navigator so prüfen, dass Käufe keine ungewollten Kamerabewegungen auslösen.
- [x] Relevante Ereignisse außerhalb des Bildschirms verständlich anzeigen und zur betroffenen Front führen.
- [x] Einen knappen Einstieg und verständliche Rollenbeschreibungen bereitstellen; Beschreibungen müssen zur tatsächlichen Mechanik passen.

**Abnahme:** Käufe landen zuverlässig in der gewählten Lane. Energie-/Cooldown-Gründe sind unterscheidbar. Primäre Touch-Ziele liegen vorzugsweise bei mindestens 42 Designpixeln. Öffnen und Schließen des Docks bleibt auf allen Zielgrößen sicher; die Front lässt sich nach einer Entscheidung wiederfinden.

### Bulk 5 – Geräteabnahme und erster Qualitätsmeilenstein

**Ziel:** Der geprüfte Kern überzeugt als tatsächlich gespieltes Mobile-Spiel.

- [ ] Beide Karten auf einem realen schwächeren und einem leistungsfähigeren Smartphone prüfen; mindestens eine längere Session pro Gerät.
- [ ] Frühe, gemischte und dichte Kämpfe, Rush, Economy und Forschung spielen; mindestens einige Beobachtungen durch Spieler ohne Projekterfahrung erfassen.
- [ ] Ladezeit, kalten Start, Assetfehler, Framezeiten, Speichertrend, längeres Spielen und thermische Verlangsamung prüfen.
- [ ] Als anfängliches Leistungsziel 60 FPS auf dem festgelegten Referenzgerät ansetzen: p95 der gesamten Frame-Arbeitszeit möglichst unter 16,7 ms. Eine begründete 30-FPS-Untergrenze für schwächere Geräte wird explizit dokumentiert, nicht stillschweigend akzeptiert.
- [x] Simulation und Cooldowns müssen unabhängig von Kamera und Renderfrequenz korrekt bleiben. Kapazitätsbudgets bleiben eingehalten.
- [ ] Blind prüfen, ob Spieler Klassen unterscheiden, Lane-Druck erkennen, eine Verstärkung begründet wählen und deren Wirkung erklären können.
- [ ] Nur beobachtete Restprobleme nacharbeiten; anschließend die betroffenen Szenen erneut abnehmen.

**Abnahme / Meilenstein A:** Beide vorhandenen Karten lassen sich zuverlässig bedienen und abschließen. Gefechte bleiben lesbar und Spielerentscheidungen wirken sichtbar. Es gibt keine offenen Fehler, die Käufe, Kampf, Matchende oder Laden verhindern. Die reale Geräteabnahme und noch vorhandene Grenzen sind dokumentiert. Bis dahin werden keine neuen Gameplay-Systeme gestartet.

### Bulk 6 – Optionale Tiefe und Release-Präsentation

**Ziel:** Einen bereits überzeugenden Kern sinnvoll erweitern und präsentationsreif machen.

Dieser Bulk beginnt erst nach Meilenstein A. Neue Inhalte werden als eigene Produktentscheidung festgelegt, nicht allein wegen dieses Plans eingebaut.

- [ ] Anhand der Spieltests entscheiden, ob eine taktische Operation oder eine exklusive Schiffsspezialisierung die größte belegte Entscheidungslücke schließt.
- [ ] Zunächst einen begrenzten Prototyp prüfen. Eine Fähigkeit muss telegraphiert, konterbar und für die KI regelgleich sein; keine zusätzliche Währung voraussetzen.
- [ ] Eine Erweiterung erst behalten, wenn sie Entscheidungen verbessert und nicht nur zusätzliche Bedienung oder Effekte erzeugt.
- [ ] Hauptmenü, Logo, Levelkarten, Optionen, Einführungs- und Ergebnisfluss auf den finalen Spielstand abstimmen.
- [ ] Finale Screenshots, Assetinventar, Provenance und aktuelle Dokumentation vervollständigen.
- [ ] Den gebauten Pages-Stand nach dem finalen Codeabschluss erneut gegen den getesteten Quellstand prüfen. Eine Veröffentlichung ist ein eigener Arbeitsschritt, nicht Teil der Planerstellung.

**Abnahme / Meilenstein B:** Die finale Version erfüllt Meilenstein A auch mit eventuellen Erweiterungen; Hauptmenü und Screenshots entsprechen dem tatsächlichen Spiel. Build, Tests, bekannte Einschränkungen und Release-Stand sind nachvollziehbar.

## 5. Arbeitsweise und Nachweise

1. Vor jedem Bulk den tatsächlichen Ausgangscommit und vorhandene Nutzeränderungen feststellen.
2. Ein konkretes Problem reproduzieren; erwartetes Verhalten und Prüfbedingungen festhalten.
3. Eine begrenzte Änderung umsetzen. Bewegungsregeln und Balancewerte möglichst in getrennten Schritten bearbeiten.
4. Passende Tests ausführen. Kritische Regressionen mit Verhaltenstests prüfen, nicht nur interne Rasterwerte nachbauen.
5. Bei Präsentations- oder Bedienungsänderungen dieselben Szenen vor und nach der Änderung visuell prüfen. Screenshots mit dem geprüften Commit und Szenario verknüpfen.
6. Ergebnis, Restpunkte und tatsächliche Abnahme dokumentieren. Ein grüner Test ersetzt weder eine fehlende Browser- noch eine Geräteprüfung.
7. Einen funktionierenden Bulk separat committen; als abgeschlossen markieren erst nach den erforderlichen Nachweisen. Änderungen nicht nur deshalb behalten, weil ihre Implementierung aufwendig war.

Bestehende Prüfwerkzeuge werden weiterverwendet: `npm test`, `npm run check`, `npm run test:stress`, `npm run test:cluster`, Browser-/Pages-Checks sowie Balance- und Investment-Simulationen. Neue Werkzeuge werden nur übernommen, wenn sie auf der gewählten Basis verfügbar und überprüft sind.

Für die Gameplay-Prüfung werden verschiedene Klassenkombinationen, Kaufstrategien, Seiten/Lanes und Schwierigkeitsprofile erfasst. Mehr Wiederholungen identischer deterministischer Abläufe gelten nicht als zusätzliche Szenarioabdeckung. Vorhandene Caps sind Sicherheitsbudgets, keine Zielgröße für jede Schlacht.

## 6. Fortschritt und nächster Schritt

| Arbeit | Status |
| --- | --- |
| Vergleich von Remote-Stand und lokalem Stand | durchgeführt; GitHub HEAD/main am 7. Oktober live bestätigt |
| Lokale Reichweitenregression und Zwischenstand-Pendeln | reproduziert |
| Level-1-Timeouts auf beiden Ständen | reproduziert |
| Dieser Wiederaufnahmeplan | erstellt |
| Ausgangsbasis sichern und Arbeitsbranch herstellen | abgeschlossen, siehe Qualitätsbericht |
| Bulk 1 | Reichweite, Bewegung und Salven softwareseitig geprüft; Cluster-Grenzen bestanden |
| Bulk 2 | Rollen-/KI-Korrekturen geprüft; 16 reguläre Matchenden; menschliche Balancebewertung offen |
| Bulks 3–4 | umgesetzt; zehn Browser-/Build-Kombinationen bestanden; extreme Hüllenstapel und Handhaltungs-/Blindtest offen |
| Bulk 5 / Meilenstein A | reale Geräte, lange Sessions und neue Spieler noch offen; Software-/Kapazitätsprüfungen bestanden |
| Bulk 6 | gemäß Plan zurückgestellt bis Meilenstein A; keine neue Gameplay-Erweiterung |

**Nächster Abnahmeschritt ist die reale Geräte-/Spielerprüfung.** Die [Geräteabnahme](DEVICE_ACCEPTANCE.md) beschreibt den gebauten Vorschau-Stand und konkrete Prüfszenen. Die Lesbarkeit extremer Flottenstapel ist dabei ausdrücklich zu bewerten und gegebenenfalls weiter zu korrigieren. Der [Qualitätsbericht](QUALITY_RECOVERY_REPORT.md) enthält die ausgeführten Nachweise. Meilenstein A und die gesamte Qualitätsabnahme sind noch nicht abgeschlossen.

**Geänderte Reihenfolge vom 7. Oktober 2026:** Der Nutzer hat nach dem Produktaudit ausdrücklich eine Kampagne als Rahmen für dosierte Schiffsmengen und schrittweise eingeführte Upgrades vorgezogen. Das kleine Hauptmenü und das erste Kampagnenpaket sind daher vor Meilenstein A umgesetzt. Diese Entscheidung ersetzt die frühere Zurückstellung des Kampagnengerüsts; Geräte-/Spielerabnahme und neue Carrier-Fähigkeiten bleiben offen. Der aktualisierte [Verbesserungsplan](GAME_IMPROVEMENT_PLAN.md) beschreibt die nächsten Maßnahmen, der [Paketbericht](CAMPAIGN_FIRST_SLICE.md) die Umsetzung. Die endgültige Missionsbalance folgt der weiteren Missionsgestaltung; zusätzliche Balanceversuche sind vorerst beendet.
