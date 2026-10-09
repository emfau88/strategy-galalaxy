# Die letzte Werft – Plan für eine isolierte Testkampagne

Stand: 8. Oktober 2026. **Status: Bulk 0–2 und 4–5 abgeschlossen; Bulk 3 technisch umgesetzt. Alle sechs Missionen, Werftausrüstung, Schildrelais-Finale und Kampagnenabschluss sind spielbar. Der menschliche Ersttest und Bulk 6 bleiben offen.**

**Nächster Ausbau (9. Oktober):** Der [Kampagnen-Ausbauplan](LAST_SHIPYARD_CAMPAIGN_EXPANSION_PLAN.md) beschreibt acht eigenständig gestaltete Einsätze mit festen Bauplätzen, Stationszielen, Rettung und Forschung. V2-0 ist abgeschlossen; **V2-1 und V2-2 sind technisch umgesetzt:** Vier verbundene Missionen bilden den ersten Akt mit Durchbruch, Außenposten, Hafenverteidigung und Evakuierung. Außenposten und Fähre bleiben freie Tests; Missionen 5–8 bleiben Vorschauen. Freischaltungen, erweiterter Aegis-Schutz und erste Imagegen-Stationsbilder sind integriert. Menschliche Spielbeobachtung bleibt offen. [V2-2-Bericht](LAST_SHIPYARD_V2_2_REPORT.md). Die Statusangaben und Abnahmen dieses bisherigen Sechs-Missionen-Versuchs bleiben davon unberührt.

Arbeitsbranch: `codex/last-shipyard`. [Lokaler Einstieg und Befehle](../experiments/last-shipyard/README.md) · [Herkunft und Abnahme](../experiments/last-shipyard/BASELINE.md). Umgesetzte Maßnahmen und offene Abnahmen sind unten einzeln gekennzeichnet.

## 1. Entscheidung und Ziel

Wir bauen **„Die letzte Werft“ als eigenständige experimentelle Fassung im selben Repository**. Sie bekommt einen eigenen Einstieg, eigene Dateien, eigene Speicherstände und einen dauerhaft auffindbaren Play-Link. Das bisher veröffentlichte Spiel bleibt unter seiner bisherigen Adresse erreichbar.

Das Experiment umfasst **sechs gestaltete Missionen**. Die ersten drei ergeben bereits ein abgeschlossenes, spielbares Kapitel. Erst wenn dieses Kapitel die Grundidee trägt, folgen die restlichen drei. Der zuvor vorgeschlagene Acht-Missionen-Bogen wird dafür verdichtet; Evakuierung mit Energieabgabe und ein größerer Bosskampf bleiben mögliche spätere Erweiterungen.

**Das Spielversprechen:** Du führst eine kleine Flotte, befreist den Sektor um deine Heimatwerft und entwickelst deinen Carrier zu einem eigenen taktischen Werkzeug. Einsätze bringen neue Entscheidungen, sichtbare Freischaltungen und eine Werft, die wieder zum Leben erwacht.

**Die entscheidenden Fragen des Experiments:**

1. Erzeugen gestaltete Angriffe, Ruhephasen und unterschiedliche Ziele tatsächlich abwechslungsreiche Einsätze?
2. Werden Flottenkonfiguration und Carrier-Fähigkeit als eigene, wirksame Entscheidungen erlebt?
3. Macht der nächste Bauplan beziehungsweise Werftausbau neugierig auf die nächste Mission?
4. Bleiben Flotte, Front und Bedienung auf dem Smartphone verständlich?

Der Erfolg wird an diesen Beobachtungen gemessen. Eine hohe Featurezahl oder viele automatische Siege allein beantworten sie nicht.

## 2. Umfang und Grenzen

| Bereich | Umfang des Experiments |
| --- | --- |
| Kampagne | Sechs kurze Missionen, drei davon als erstes spielbares Kapitel |
| Flotte | Die vorhandenen vier Kaufklassen: Scout, Fighter, Bomber und Fregatte; kleine kostenlose Drone-Waves |
| Neue Schiffsklasse | Zunächst keine |
| Spezialisierung | Eine alternative Bomber-Ausführung: Ionentorpedos statt voller Belagerungswirkung |
| Carrier | Aegis und Störimpuls; vor dem Einsatz genau eine Fähigkeit ausrüsten |
| Neues Gebäude | Ein Schildrelais-Typ, im Finale zweimal platziert |
| Missionsziele | Carrier zerstören; drei Angriffe abwehren; Relais ausschalten und anschließend Carrier besiegen |
| Gegner | Drei Pläne mit vorhandenen Schiffen: leichte Angriffe, Belagerungsverband, defensive Formation mit Gegenstoß |
| Forschung | Garantierte Baupläne und Ausrüstungswahl in der Werft; vorerst keine zusätzlichen Forschungsstufen während des Gefechts |
| Schauplätze | Vorhandene Karten, eigenständige Menü-/Werftdarstellung und wenige ergänzende Assets |
| Dauer | Zielvorstellung: überwiegend drei bis sechs Minuten pro Mission; keine künstliche Zeitgrenze für normale Angriffsmissionen |

Zurückgestellt bleiben Roguelite-Modus, Multiplayer, neue Ressourcen, dauerhafte Schiffsverluste, große Forschungsbäume, frei baubare Gebäude, bewegliche Transporter als Missionsziel und acht oder mehr Missionen. Das Zielmenü umfasst Kampagne, Werft und Einstellungen. Kampagne, Werft und Einstellungen sind vorhanden. Das freie Gefecht bleibt über den bisherigen Play-Link zugänglich.

Die Core Vision wird **nur innerhalb dieses Experiments** um neue Missionsziele, Spezialisierung und Carrier-Fähigkeiten erweitert. Die Regeln der bestehenden Fassung werden dadurch nicht geändert. Das Experiment erhält eine kurze eigene Produktvorgabe mit Verweis auf diesen Plan.

## 3. Isolation im Repository und im Browser

### 3.1 Empfohlene Struktur

Ein eigener Ordner mit einer begrenzten Kopie des benötigten Spielkerns ist für diesen Versuch die verlässlichste Lösung. Damit können Missionsziele, KI, Fähigkeiten und Oberfläche verändert werden, ohne das bisherige Spiel durch gemeinsame Runtime-Imports mitzuziehen.

```text
strategy-galalaxy/
  index.html                         # bestehende Fassung
  src/                               # bestehender Spielkern
  assets/                            # bestehende Assets
  experiments/
    last-shipyard/
      README.md                      # Einstieg, lokale Befehle, Grenzen
      EXPERIMENT_VISION.md            # Regeln nur für das Experiment
      BASELINE.md                    # Herkunft und Versionsstände
      index.html                     # eigener Einstieg
      src/                           # isolierte Runtime
        campaign/                    # Missionen, Verlauf, Fortschritt
        ...                          # übernommene und angepasste Systeme
      assets/                        # nur tatsächlich benötigte Dateien
      tests/                         # gezielte Prüfungen des Experiments
      scripts/                       # eigener Build und gezielter Smoke-Test
  scripts/
    build-pages.mjs                  # bestehender Classic-Build
    build-site.mjs                   # setzt beide Fassungen zusammen
  docs/
    LAST_SHIPYARD_EXPERIMENT_PLAN.md
```

**Arbeitsbranch:** `codex/last-shipyard`. Dafür ist ein eigenes Worktree sinnvoll. Der aktuelle Qualitätsbranch bleibt erhalten.

Der Integrationsbranch beginnt beim geprüften Remote-Stand `origin/main`, ausdrücklich nicht beim möglicherweise abweichenden lokalen `main`. Die brauchbare Basis für das Experiment wird selektiv aus `311af9e` übernommen. Der Qualitätsbranch wird nicht pauschal in den Integrationsbranch gemergt.

Der bisher bekannte öffentliche Stand ist `ed8802b2652d07ae2e7884f1dc2eabd195b34057`. Vor Umsetzung wird die tatsächlich zuletzt erfolgreich veröffentlichte Pages-Version geprüft. Die Classic-Runtime auf dem Integrationsbranch muss diesem festgehaltenen Stand entsprechen; unpublizierte Classic-Änderungen werden nicht beiläufig mit veröffentlicht.

**Konkrete Isolationsregeln:**

- Das Experiment importiert keinen veränderlichen Code aus dem oberen `src/`.
- Nur die benötigten aktiven Assets werden übernommen, nicht die gesamte Referenzbibliothek. Vorhandene Dateien bleiben unverändert; Anpassungen und neue Bilder liegen im Experimentordner.
- Herkunftscommit und übernommene Dateien werden in `BASELINE.md` festgehalten. Die schreibgeschützte `.reference/` bleibt unberührt.
- HTML, Module und Assets verwenden Pfade, die unter dem eigenen Unterverzeichnis funktionieren. Keine hartcodierten Pfade wie `/src/` oder `/assets/`.
- Speicher erhält einen eigenen Namensraum, etwa `strategy-galalaxy:last-shipyard:v1:progress` und entsprechend eigene Einstellungen. Keine Übernahme oder Löschung bestehender Spielstände, kein `localStorage.clear()`.
- Fortschritt und Ausrüstung bekommen eine Versionsnummer. Ein experimenteller Reset löscht nur die eigenen Schlüssel.
- Zunächst kein Service Worker. Spätere Caches müssten einen eigenen Namen und einen auf das Experiment begrenzten Geltungsbereich erhalten.
- Die Oberfläche trägt eine kleine Kennzeichnung „Testkampagne“ und eine Build-Version. Die Kennzeichnung steht außerhalb der eigentlichen Kauf- und Kampfanweisungen.

Die beiden Pfade liegen auf derselben Browser-Origin. Die Trennung ist eine funktionale Trennung von Spielcode und Speicher, keine Sicherheitsgrenze zwischen Domains.

Die bewusste Codekopie ist für dieses begrenzte Experiment akzeptabel. Erfolgreiche Mechaniken werden später gezielt zurückgeführt; eine gemeinsame Engine-Abstraktion wird erst nach der Konzeptentscheidung geprüft.

### 3.2 Zwei Play-Links, eine Pages-Veröffentlichung

| Fassung | Adresse (live) |
| --- | --- |
| Bisheriges Spiel | `https://emfau88.github.io/strategy-galalaxy/` |
| Die letzte Werft | `https://emfau88.github.io/strategy-galalaxy/experiments/last-shipyard/` |

Beide Links sind **seit Bulk 1 live**. Aktuell enthält die Testkampagne alle sechs gestalteten Missionen. [Abnahme und Deployment](LAST_SHIPYARD_BULK1_REPORT.md).

GitHub Pages bietet eine Projektwebsite pro Repository. Deshalb werden die beiden Fassungen als Unterverzeichnisse **eines gemeinsamen Artefakts** veröffentlicht. Ein Branch allein erzeugt keine zweite Pages-Website. Grundlage: [GitHub Pages – Website-Typen](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

```text
dist/
  index.html                         # bisheriges Spiel
  src/
  assets/
  experiments/
    last-shipyard/
      index.html
      src/
      assets/
      version.json
```

Der bestehende Classic-Build erzeugt zuerst seine Ausgabe. Danach ergänzt `build-site.mjs` das isoliert gebaute Experiment. Der Experiment-Build schreibt in ein eigenes temporäres Ziel und löscht niemals das gemeinsame `dist/`. Die Classic-Dateien werden beim Zusammenführen nicht überschrieben.

Es gibt genau **einen produktiven Pages-Workflow**, der beide Fassungen gemeinsam hochlädt. Der vorhandene Workflow in `.github/workflows/deploy-pages.yml` wird dafür erweitert. Kein zweiter Deployment-Workflow veröffentlicht nur den Experimentordner: Sonst würde beim nächsten Deployment eine der Fassungen fehlen. GitHub unterstützt den vorgesehenen Build-/Upload-/Deploy-Ablauf über [eigene Pages-Workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Feature-Branches bauen und prüfen Artefakte. Die Veröffentlichung erfolgt nach Integration über den zentralen Workflow auf `main`. Auch manuelle Workflowstarts dürfen nur vom Standardbranch deployen; der Deploy-Job besitzt dafür die entsprechende Branch-Bedingung. Damit steht auch der README-Eintrag auf der normalen GitHub-Projektseite. Bulk 1 hat die erste gemeinsame Veröffentlichung umgesetzt. Weitere Veröffentlichungen bleiben Bestandteile der entsprechenden Umsetzungsbulks.

**Play-Links und derzeit spielbarer Umfang in der README:**

```markdown
## Spielen

- [▶ Bisheriges Spiel](https://emfau88.github.io/strategy-galalaxy/)
- [🧪 Die letzte Werft – Testkampagne](https://emfau88.github.io/strategy-galalaxy/experiments/last-shipyard/)

Die Testkampagne besitzt einen eigenen Spielstand. Aktuell spielbar: alle sechs Missionen einschließlich des Schildnetz-Finales.
```

Die README auf main enthält beide Play-Links und nennt sechs spielbare Missionen. Die Missionszahl wird bei weiteren Veröffentlichungen an die tatsächlich spielbaren Inhalte angepasst.

Für lokale Arbeit startet `npm run dev:werft` das Experiment auf `127.0.0.1:7101`. Nach `npm run build:pages` startet `npm run preview` die gemeinsame Vorschau auf Port 7102 unter `/strategy-galalaxy/` und dessen Experiment-Unterpfad. Der neue Vorschau-Server löst Verzeichnisse auf ihre index.html auf und ergänzt fehlende abschließende Slashes. Der gezielte Browsercheck wurde lokal und öffentlich ausgeführt.

**Abbruch und Rückkehr:** Bei einem Experimentfehler wird das letzte funktionierende gemeinsame Artefakt erneut veröffentlicht. Der nächste reguläre Build enthält weiterhin beide Fassungen. Eine Entfernung des Experiments wäre eine eigene Entscheidung; Classic-Dateien und Classic-Speicher bleiben dabei erhalten.

## 4. Kampagne und Progression

Die Heimatwerft ist der Ausgangspunkt. Nach jedem Einsatz wird ein Teil ihres Umfelds sicherer oder wieder nutzbar. Drei visuelle Zustände genügen: Notbetrieb, wiederbelebter Hafen, gesicherte Werft. Wenige kurze Funksprüche verbinden Auftrag und Ergebnis.

| Mission | Ziel und taktische Idee | Neue Möglichkeit / Belohnung |
| --- | --- | --- |
| 1 – Erstkontakt | Kleine Blockade auf einer Lane durchbrechen. Scout und Fighter kennenlernen; Kaufwirkung und Angriffspausen sichtbar machen. | Bomber und erstes aktives Dock |
| 2 – Schwerer Widerstand | Einen von schweren Schiffen geschützten Carrier besiegen. Eigene Bomber zur richtigen Zeit hinter Eskorte einsetzen. | Aegis-System für den Carrier |
| 3 – Hafen im Feuer | Drei angekündigte Angriffe abwehren. Nach dem letzten abgewehrten Angriff endet die Mission erfolgreich. Schutzimpuls und Verstärkung konkurrieren um Energie. | Fregatte; zweiter Werftzustand; Abschluss von Kapitel 1 |
| 4 – Geteilte Front | Zwei unterschiedlich besetzte Lanes. Eine Front halten, während die andere vorstößt. | Ionenbomber-Bauplan und Ausrüstungswahl |
| 5 – Das Zeitfenster | Einen Belagerungsangriff überstehen und die angekündigte Aufbaupause des Gegners für den Gegenstoß nutzen. | Störimpuls als zweite wählbare Carrier-Fähigkeit |
| 6 – Das Schildnetz | Zwei Relais ausschalten, danach den Blockade-Carrier besiegen. Vorhandene Fähigkeiten und Schiffswahl kombinieren. | Gesicherter Hafen, Kampagnenabschluss und wenige freiwillige Zusatzaufgaben |

**Regeln für Fortschritt:**

- Baupläne und Fähigkeiten werden beim ersten Sieg garantiert freigeschaltet. Keine Zufallsbelohnung, neue Währung oder Wartezeit.
- Vier Grundklassen bleiben verständlich. Die Bomber-Variante wird vor dem Einsatz gewählt und kostenlos gewechselt.
- Standardbomber haben volle Belagerungswirkung; Ionenbomber tauschen einen Teil davon gegen eine kurze Waffenunterbrechung bei gegnerischen Schiffen. Fähigkeiten und Statusanzeigen sollen dafür dieselben klaren Regeln nutzen.
- Pro Mission wird genau eine Carrier-Fähigkeit ausgerüstet. Anfangs gibt es nur Aegis, später eine echte Wahl.
- Aegis schützt den eigenen Carrier und eigene Schiffe in der gewählten Lane sechs Sekunden lang vor 60 % des Schadens. Es kostet 80 E und hat 28 Sekunden Cooldown. Es repariert keine Hülle und erzeugt keine permanente Aufrüstung.
- Störimpuls unterbricht gegnerische Schiffswaffen kurz. Relais und Carrier sind zunächst immun; so bleibt der Bomber als Belagerungswerkzeug relevant.
- Beide Fähigkeiten kosten Energie und besitzen einen sichtbaren Cooldown. Fehlgeschlagene Auslösung kostet nichts. Ihre Bedienung benötigt kein pixelgenaues Zielen.
- Ein Neustart verliert keine Freischaltungen. Es gibt keine Reparaturkosten oder dauerhaften Verluste zwischen Missionen.
- Abzeichen belohnen freiwillige Herausforderungen. Die nächste Mission benötigt einen normalen Sieg, keine Sternewertung.

**Regeln für Gegner und Dichte:**

- Gegnerische Startaufstellung und verfügbare Klassen dürfen sich vom Spieler unterscheiden und werden im Briefing erklärt. Ein schwerer Gegner in Mission 2 setzt keine frühe Spielerfreischaltung der Fregatte voraus.
- Ein Missionsplan steuert Absicht und Kaufzeitfenster. Käufe verwenden reguläre Kosten, Cooldowns und Kapazitäten. Ein Plan wartet auf bezahlbare und erlaubte Käufe; er erzeugt keine versteckten kostenlosen Massen.
- Deutlich angekündigte Angriffe wechseln mit kurzen Erholungsfenstern. Erfolg und Ende einer Verteidigungsphase hängen an klar erfassten Angreifern, nicht an beliebigen versteckten Timern.
- Kostenlose Drones bleiben klein dosiert; ausgefallene Waves sammeln sich nicht unbegrenzt an.
- Flottenkapazität wird auf Missionsebene begrenzt, bei zwei Lanes zusätzlich über ein Gesamtbudget je Seite. Zwei Lanes verdoppeln nicht automatisch die gesamte Schiffsmenge.
- Zahlen sind vorläufig. Es werden zuerst wenige konkrete Gefechtssituationen gespielt; keine Serien von Balance-Experimenten vor stabiler Missionsgestaltung.

## 5. Assets mit festem Budget

| Asset | Geplanter Umfang | Zweck |
| --- | --- | --- |
| Heimatwerft-Key-Art | Ein hochwertiges Portraitmotiv | Eigenständiges Menü mit klarer Identität und freien Text-/Buttonflächen |
| Ausbauzustände | Zwei kleine Overlay-Gruppen oder Varianten desselben Motivs | Fortschritt sichtbar machen; keine drei völlig neuen Illustrationen |
| Flottenemblem und Schriftzug | Ein kleines Vektorset | Wiedererkennung und scharfe Skalierung |
| Schildrelais | Ein Gebäudetyp, intakt und ausgeschaltet | Das neue Missionsziel sofort verständlich machen |
| Fähigkeits-/Bauplanzeichen | Höchstens drei neue Icons | Aegis, Störimpuls und Ionenbomber unterscheiden |
| Effekte und Audio | Bestehende Effekte erweitern; wenige kurze Signale | Fähigkeit, Warnung und Freischaltung deutlich rückmelden |

Neue Schiffsrümpfe, acht Missionsgemälde, Sprecheraufnahmen und aufwendige Zwischensequenzen sind für den Test nicht vorgesehen. Der Ionenbomber verwendet die vorhandene Silhouette mit begrenzten, konsistenten Erkennungsmerkmalen. Die Menü-Key-Art darf räumlich sein; alle interaktiven Spielobjekte bleiben in orthografischer Draufsicht.

Bildgenerierung erfolgt nach festgelegtem Motiv und anhand der vorhandenen Flottenreferenzen. Text, Buttons und Navigation bleiben separate Ebenen. Quelldateien, Herkunft, Generierungsauftrag und mobile Ableitungen werden im Experiment dokumentiert. Erst die tatsächlich genutzten Dateien gelangen in das Pages-Artefakt.

## 6. Umsetzungsbulks

Jeder Bulk endet mit einem überschaubaren Commit beziehungsweise PR, einem spielbaren Ergebnis und einem kurzen Bericht über sichtbare Änderungen und offene Punkte. Die Kennzeichnung wird erst nach Erfüllung der genannten Abnahme auf erledigt gesetzt.

### Bulk 0 – Ausgangsstände und Trennung festhalten

**Ziel:** Die Testversion kann sicher weiterentwickelt werden.

- [x] Repository und tatsächlichen aktuellen Pages-Stand prüfen; Classic-Baseline festhalten.
- [x] Eigenen Branch `codex/last-shipyard` aus dem geprüften Remote-Stand anlegen, bevorzugt in einem eigenen Worktree.
- [x] Benötigte Runtime und aktive Assets aus `311af9e` selektiv in den Experimentordner übernehmen.
- [x] Herkunft, Dateigrenzen und erlaubte Änderungen an gemeinsamen Build-/README-Dateien dokumentieren.
- [x] Eigene Produktvorgabe, Speicherschlüssel, Einstieg und Versionierung einrichten.

**Abnahme:** Das Experiment startet lokal aus seinem Ordner. Keine Runtime-Imports oder Speicherzugriffe koppeln es an Classic. Der bisherige Spielcode wurde nicht verändert.

**Ergebnis:** Ein isolierter Ausgangsstand mit der bereits vorhandenen Erstkontakt-Mission.

### Bulk 1 – Separater Play-Link und gemeinsamer Pages-Build

**Ziel:** Die Testversion ist früh über GitHub erreichbar.

- [x] Eigenen Experiment-Build und gemeinsamen Site-Build einführen.
- [x] Den zentralen Pages-Workflow auf das vollständige Artefakt umstellen; doppelte Testaufrufe entfernen.
- [x] Gemeinsame lokale Vorschau mit korrektem Unterpfad und separaten Modul-/Assetpfaden ermöglichen.
- [x] Einen Start-/Kauf-/Rückkehrablauf im gebauten Experiment prüfen; Classic startet weiterhin.
- [x] Speichertrennung prüfen: Experiment abschließen/zurücksetzen darf Classic-Daten nicht verändern.
- [x] Classic-Ausgabe mit der festgehaltenen Baseline vergleichen; experimentelle Dateien dürfen ihre Pfade nicht überschreiben.
- [x] Änderungen integriert veröffentlichen, beide echten Play-Links prüfen und den README-Eintrag mit der tatsächlichen Missionszahl ergänzen.

**Abnahme:** Beide Links öffnen die richtige Fassung. Reload und Direktaufruf des Experimentpfads funktionieren. Der README-Link ist auf dem Standardbranch sichtbar. Die Testversion meldet ihre aktuelle Build-Version.

**Ergebnis:** Die erste isoliert veröffentlichte Testfassung; Spielumfang zunächst eine vorläufige Mission.

### Bulk 2 – Eigenständiger Einstieg und zwei gestaltete Angriffsmissionen

**Ziel:** Aus dem Gerüst wird ein zusammenhängender Kampagnenbeginn.

- [x] Heimatwerft-Key-Art, Emblem und kleine Sektorkarte mit sechs Positionen gestalten. Noch nicht gebaute Einsätze werden als solche gekennzeichnet.
- [x] Menü, Briefing, Ergebnis und garantierte Freischaltung als einheitlichen Ablauf verbinden.
- [x] Ein kleines Missionssystem für Einstieg, Warnung, Angriff, Erholung und Abschluss einführen. Keine universelle Skriptsprache bauen.
- [x] Spieler- und Gegnerarsenal getrennt definieren; Aufstellungen und Ressourcenbesonderheiten im Briefing sichtbar machen.
- [x] KI-Kaufabsichten missionsbezogen steuern, weiterhin über reguläre Spielbefehle.
- [x] Mission 1 mit verständlichen Hinweisen nach Spieleraktionen gestalten; Mission 2 auf geschützte Bomber und wenige schwere Gegner ausrichten.
- [x] Kaufoptionen kompakt halten, wichtige Front wiederfinden und einen echten Freischaltungsmoment nach dem Sieg zeigen.

**Abnahme:** Beide Missionen unterscheiden sich erkennbar. Der Spieler kann erklären, warum und wann ein Bomber hilft. Der Abschluss schaltet den erwarteten Inhalt frei und bleibt nach Reload gespeichert.

**Ergebnis:** Zwei gestaltete Missionen unter demselben Experiment-Link. Aegis darf bis Bulk 3 nur klar als nächster Inhalt angekündigt werden.

### Bulk 3 – Aegis, Verteidigungsziel und erstes vollständiges Kapitel

**Ziel:** Der Carrier wird zu einer aktiven Entscheidung; die Kampagne bekommt ihr erstes anderes Missionsziel.

- [x] Missionsziele von der bisherigen ausschließlichen HQ-Siegbedingung lösen. Kampfereignisse melden Zerstörungen; der Missionsablauf entscheidet genau einmal über Erfolg oder Scheitern. Der bisherige Terminalzustand der Simulation darf neue Ziele nicht vorzeitig beenden oder einfrieren.
- [x] Für Verteidigung festlegen: eigene Carrier-Zerstörung bedeutet Niederlage; drei vollständig abgewehrte angekündigte Angriffe bedeuten Sieg. Angriffszähler und Abschluss sind sichtbar.
- [x] Aegis mit Kosten, Cooldown, begrenzter Schutzwirkung und klarer Aktivierungsanzeige umsetzen.
- [x] Aegis ab Abschluss von Mission 2 tatsächlich ausrüstbar machen; Mission 3 führt seine Anwendung verständlich ein.
- [x] Pause, Wiederholen und Missionsende beenden beziehungsweise halten Fähigkeitseffekte korrekt an. Temporärer Schutz erzeugt keine dauerhafte Aufrüstung.
- [x] Mission 3 „Hafen im Feuer“ inklusive Ergebnis, Fregattenfreischaltung und zweitem Werftzustand fertigstellen.
- [ ] Den Anfang mit ein bis zwei Personen spielen lassen und beobachtete Verständlichkeitsprobleme gezielt beheben.

**Umsetzungsstand:** Technik und Browserablauf geprüft. Die sechs technischen Punkte sind erledigt; menschliche Verständlichkeit und tatsächliches Smartphone-Erlebnis sind noch nicht abgenommen. [Bericht Bulk 3](LAST_SHIPYARD_BULK3_REPORT.md).

**Abnahme:** Angriff und Verteidigung enden zuverlässig nach ihrer jeweiligen Regel. Aegis verändert eine beobachtbare Kampfsituation. Nach drei Missionen besteht ein verständlicher kleiner Spannungsbogen.

**Ergebnis / Entscheidungspunkt A:** Ein eigenständig spielbares Kapitel mit drei Missionen. Hier entscheiden wir anhand des Spielerlebnisses über den Ausbau. Falls Käufe, Rollen oder Fähigkeit unverständlich bleiben, wird dieser Abschnitt zuerst verbessert.

### Bulk 4 – Flottenwahl, zwei Fronten und Gegenstoß

**Ziel:** Vorbereitung und zwei Lanes erzeugen unterschiedliche Spielweisen.

- [x] Mission 4 mit zwei verschieden besetzten Lanes und einem begrenzten Gesamtbudget umsetzen.
- [x] Fregatte als haltenden Verband verständlich einsetzen; Warnungen und Frontsprung beziehen sich auf die gewählte Lane.
- [x] Einen einfachen Werftbildschirm für kostenlose Ausrüstungswechsel einführen.
- [x] Den Ionenbomber nach Mission 4 freischalten. Waffenunterbrechung und Immunität erhalten sichtbare Anzeigen; Standardbomber behalten ihre volle Belagerungsrolle.
- [x] Mission 5 um einen angekündigten Belagerungsangriff und eine echte Gelegenheit zum Gegenstoß gestalten.
- [x] Störimpuls auf Basis derselben Unterbrechungsregeln fertigstellen und nach Mission 5 freischalten.
- [x] Auswahl von genau einer Carrier-Fähigkeit speichern. Kosten, Cooldown und Grenzen vor dem Start verständlich zeigen.

**Abnahme:** Standard- und Ionenbomber haben einen verständlichen Einsatzgrund. Beide Varianten können regulär eingesetzt werden. Die zweite Lane erzeugt eine Verteilungsentscheidung, ohne die Flottenmenge unkontrolliert zu erhöhen.

**Ergebnis / Entscheidungspunkt B:** Fünf Missionen, eine echte Flottenvariante und eine Carrier-Auswahl. Noch kein zusätzlicher Forschungsbaum.

### Bulk 5 – Schildrelais und ein kleines Kampagnenfinale

**Ziel:** Die sechs Missionen erhalten einen befriedigenden Abschluss.

- [x] Einen klar erkennbaren Schildrelais-Typ mit intaktem und ausgeschaltetem Zustand integrieren.
- [x] Beide Relais an ihre Lanes binden. Zielwahl und Vorstoß priorisieren erreichbare Relais; Schiffe bleiben nicht am geschützten Carrier hängen.
- [x] Carrier-Schutz gilt nur so lange, wie mindestens ein Relais aktiv ist. Schutzstatus, verbleibende Relais und der Übergang zur verwundbaren Phase werden angezeigt.
- [x] Mission 6 verbindet begrenzte Angriffswellen, Relaisziele und anschließenden Carrier-Angriff. Bereits zerstörte Relais erscheinen nicht erneut.
- [x] Finale mit normaler zulässiger Ausrüstung abschließbar halten; keine heimliche Pflicht zur Ionenvariante oder zu einer bestimmten Fähigkeit.
- [x] Kampagnenabschluss, dritten Werftzustand und höchstens zwei freiwillige Zusatzaufgaben integrieren.

**Abnahme:** Schutz, Zielreihenfolge und Fortschritt sind ohne Zusatzwissen verständlich. Das Finale endet regulär, der Kampagnenabschluss wird einmalig gespeichert, und Wiederholen funktioniert.

**Ergebnis:** Die vollständige sechsteilige Testkampagne mit erkennbarem Anfang und Ende.

### Bulk 6 – Kompakte Abnahme und Entscheidung über die Zukunft

**Ziel:** Ein ehrliches Urteil über das Experiment und ein verlässlicher öffentlicher Teststand.

- [ ] Alle sechs Missionen einmal als zusammenhängende Kampagne spielen; Verlust, Wiederholen, Fortschritt und Ausrüstungswechsel gezielt prüfen.
- [ ] Mindestens eine Prüfung auf einem echten Smartphone durchführen; bei fehlendem Gerät die Grenze ausdrücklich offen lassen.
- [ ] Lesbarkeit bei wenigen und bei regulär maximalen Verbänden sowie bei zwei Lanes beurteilen.
- [ ] Nur beobachtete Probleme mit Missionsdauer, blockierten Käufen oder dominanten Strategien nacharbeiten.
- [ ] Hinweise bei Browser-/Appwechsel prüfen. Für diesen Test genügt Pause und ein verlässlicher Missionsneustart mit erhaltenem Kampagnenfortschritt; ein vollständiger Kampf-Speicherstand ist kein Pflichtumfang.
- [ ] Beide öffentlichen Play-Links, README-Missionszahl, Build-Version und finalen gebauten Stand prüfen.
- [ ] Einen kurzen Ergebnisbericht schreiben: Was trägt? Was ist verwirrend? Welche Neuerung lohnt eine Übernahme? Welche sollte entfallen?

**Abnahme / Entscheidungspunkt C:** Das Experiment ist funktional nachvollziehbar, seine offenen Grenzen sind bekannt, und es gibt eine begründete Entscheidung: weiter ausbauen, einzelne Ideen übernehmen oder als Versuch archivieren.

**Ergebnis:** Ein öffentlich spielbarer, klar als Experiment markierter Vergleichsstand. Kein automatischer Austausch der bisherigen Fassung.

## 7. Prüfungen passend zum Versuch

Pro Bulk werden nur die geänderten Abläufe geprüft. Ein reiner Asset- oder Menüschritt löst keine vollständige Balance-Matrix aus. Bestehende erfolgreiche Prüfungen werden ohne neue Ursache nicht wiederholt.

**Unverzichtbar sind:**

- Isolation von Code, URLs und Speicher; Classic-Ausgabe bleibt erhalten.
- Ein erfolgreicher und ein abgelehnter Kauf beziehungsweise Fähigkeitseinsatz ohne fehlerhafte Abbuchung.
- Eigene Erfolgs-/Niederlagenbedingungen, Pause und Wiederholen.
- Freischaltung, Ausrüstungswahl und Reload des gespeicherten Fortschritts.
- Sichtprüfung auf einer schmalen und einer längeren Mobile-Größe; ein weiterer gezielter Blick beim Zwei-Lane-Schritt.
- Nach Veröffentlichungen: beide tatsächlichen URLs starten, und das Experiment lädt seine eigenen Dateien.

Eine aufwendigere Balanceprüfung kommt erst bei stabilen Inhalten und einem konkreten Verdacht zum Einsatz. Die ersten Spielbeobachtungen sollen einfache Fragen beantworten: Welche Entscheidung hast du getroffen? Woran hast du ihre Wirkung erkannt? Welche neue Möglichkeit möchtest du ausprobieren?

## 8. Lieferreihenfolge und aktueller Status

| Lieferung | Enthaltene Bulks | Spielbarer Umfang |
| --- | --- | --- |
| Früher isolierter Play-Link | 0–1 | Vorläufige Mission 1, eigene Speicherung und klare Trennung |
| Erstes Kapitel | 2–3 | Drei gestaltete Missionen, Aegis, Werftfortschritt |
| Flottenentwicklung | 4 | Fünf Missionen, zwei Lanes, Ionenbomber und Carrier-Auswahl |
| Vollständiges Experiment | 5–6 | Sechs Missionen, Schildnetz-Finale, kompakte Abnahme und Ergebnisbericht |

**Abgeschlossen:** Bulk 0–1: Isolation, gemeinsamer Build und öffentlicher Play-Link. Bulk 2: eigenständiges Werftmotiv, Missionsrhythmus, zwei gestaltete Angriffe und Bomber-Bauplan. [Abnahme Bulk 2](LAST_SHIPYARD_BULK2_REPORT.md); erfolgreicher Pages-Run [37821796443](https://github.com/emfau88/strategy-galalaxy/actions/runs/37821796443), Commit 3510995, beide öffentlichen Fassungen im Browser geprüft.

**Bulk 3 technisch umgesetzt:** Hafenverteidigung mit drei vollständig abgewehrten Angriffen; eine eigene, verlustpriorisierende Missionsentscheidung; temporäres Aegis; gespeicherte Ausrüstung; Fregatte nach dem dritten Sieg auch in Wiederholungen der Missionen 2–3 verfügbar; sichtbare Dock-/Hafenprogression. [Abnahme und Grenzen](LAST_SHIPYARD_BULK3_REPORT.md). Veröffentlicht mit Commit 1c5b67d, [Pages-Run 37823771205](https://github.com/emfau88/strategy-galalaxy/actions/runs/37823771205) erfolgreich. Öffentliche Version 0.0.4-bulk3 einschließlich Hafenstart, Aegis-Touch und Ausrüstungs-Reload geprüft. Classic bleibt auf ed8802b.

**Noch offen in Bulk 3:** Ersttest mit ein bis zwei echten Personen. Browser- und Mechanikprüfungen ersetzen ihn nicht. Es wird kein erfundener Spieltest abgehakt.

**Bulk 4 abgeschlossen:** Missionen 4–5, gemeinsames Flottenbudget, Lane-Haltemodus, kostenlose Werftwahl, Ionenbomber und Störimpuls. [Abnahme Bulk 4](LAST_SHIPYARD_BULK4_REPORT.md). Beide Missionen über normale Käufe abgeschlossen; Classic-Dateien unverändert. Separater Commit 6a00f87; [Pages-Run 37826860682](https://github.com/emfau88/strategy-galalaxy/actions/runs/37826860682) und öffentlicher Kurzcheck bestanden.

**Bulk 5 abgeschlossen:** Das Schildnetz mit zwei Relais, sichtbarem Carrier-Schutz, begrenztem Nachschub und regulärem Finale. Gesicherte Werft, gespeicherter Abschluss und zwei freiwillige Abzeichen. [Abnahme Bulk 5](LAST_SHIPYARD_BULK5_REPORT.md). Ein repräsentativer Durchlauf mit Standardbombern ohne Fähigkeit sowie Browserablauf einschließlich Wiederholung/Reload bestanden.

**Veröffentlichung Bulk 5 bestätigt:** Separater Commit 00079b6; [Pages-Run 37828386954](https://github.com/emfau88/strategy-galalaxy/actions/runs/37828386954) erfolgreich. Version 0.0.6-bulk5, sechs Missionen und öffentlicher Finalstart mit beiden Relais geprüft.

**Nächster Entscheidungspunkt:** Bulk 6: kompakte Gesamtbewertung und echte Smartphone-/Spielbeobachtung. Diese Abnahme ist ausdrücklich noch offen. Die kurzen technisch erfolgreichen Abläufe belegen Abschließbarkeit, keine finale Schwierigkeit oder optimale Spieldauer.
