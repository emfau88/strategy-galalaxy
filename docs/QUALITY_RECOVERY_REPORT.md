# Qualitäts-Wiederaufnahme – Nachweise und offene Abnahme

Stand: 7. Oktober 2026. Dieser Bericht wird mit jedem geprüften Bulk ergänzt.

## Gesicherter Softwarestand

| Commit | Inhalt |
| --- | --- |
| `ed8802b` | live bestätigte GitHub-Basis |
| `1152d6e` | Wiederaufnahme, Sicherung und Baseline-Diagnose |
| `50552b5` | erreichbare Feuerpositionen und stabile Ausweichbewegung |
| `ed4a441` | Bomber-Zielwahl, Abstände, chronologische Bindungen und regelgleiche KI |
| `53fbf0a` | größere Bedienflächen, Startfeedback, reduzierte dichte Effekte und gebaute Vorschau |

Der abschließende Pages-Browserlauf erfasst `ed4a441` plus die damals uncommitteten Präsentationsänderungen in seinen Metadaten. Diese geprüften Runtime-Änderungen sind jetzt unverändert in `53fbf0a` gesichert; der Bytevergleich aller 34 Runtime-/HTML-Dateien mit `dist/` besteht. Spätere Dokumentationsänderungen verändern den Spielcode nicht. Der Vorschau-Server wurde zusätzlich auf erfolgreiche HTML-/Modulantworten, gesperrte versteckte Pfade, fehlende Repository-Dokumente, ungültige URLs und Favicon geprüft.

## Bulk 0: bestätigte Basis und Sicherung

- `git ls-remote origin HEAD refs/heads/main` hat am 7. Oktober den Commit `ed8802b2652d07ae2e7884f1dc2eabd195b34057` für GitHub HEAD und main bestätigt.
- Arbeitsbranch: `codex/quality-recovery`, begonnen bei genau diesem Commit.
- `main` und `codex/archive-local-2026-09-15` erhalten den bisherigen lokalen Stand `4768dac` mit allen sieben Zusatzcommits.
- `codex/quality-plan` enthält außerdem die gesicherte Plan-Dokumentation, Commit `d8cee6d`.
- Kein Hard-Reset, kein Force-Push, keine Änderung im Referenzprojekt und keine Veröffentlichung.
- Vorschau-Server aus `36b43be` in begrenzter Form übernommen, einschließlich robuster Behandlung von Pfaden mit Leerzeichen und HTTP-Fehlern.
- `quality-match-check.mjs` übernimmt die Idee der lokalen Dichtemessung. Der KI-Takt läuft dabei unabhängig vom Sampling. Der Runner erfasst beide Karten, Seitenwechsel, unterschiedliche Profile und optional verschiedene Ausgabenstrategien.

## Messung auf unverändertem Gameplay der Basis

Ausgeführt: Foundation, Assetprüfung, Stress, Cluster und vollständiger Browser-Check. Alle funktionalen Prüfungen bestanden. Der Browser-Check verwendet Chrome und beide Karten auf fünf Viewports. Die Aufnahme-Metadaten halten Commit und uncommittete Werkzeug-/Dokumentationsänderungen fest.

| Messung | Baseline |
| --- | --- |
| Cluster, 56 Schiffe: mittlere / maximale freundliche Überlappungen | 105,6 / 197 |
| Cluster: maximale seitliche Richtungswechsel in 20 s | 9 |
| Stress: Spitzenzahl Schiffe Level 1 / 2 | 56 / 112 |
| Stress: Spitzenzahl Projektile Level 1 / 2 | 42 / 72 |
| Browser: Viewport-/Kartenkombinationen | 10 bestanden |
| Browser: Frameabstand bei 112 Schiffen, Mittel / p95 | 12,9 / 30,6 ms |
| Level-1-Diagnose, Admiral/Tactician, beide Seiten | beide nach 480 s noch LIVE_MATCH |
| Level-1-Diagnose: Anteil beobachteter Kampfzustände außerhalb Reichweite | 53,5 % / 51,4 % |
| Level-1-Diagnose: Carrier-HP nach 480 s | jeweils 1800 / 1800 |

Die Browser-Framewerte sind Desktop-Messungen unter paralleler Diagnoselast, keine Smartphone-FPS-Abnahme. Die Reichweitenquote enthält Anfahrts- und Ausweichphasen; einzelne Schiffe und deren Sollpositionen müssen zur Ursachenklärung betrachtet werden. In der Baseline-Diagnose wurde kein Bombergeschoss abgefeuert, obwohl Bomber vorhanden waren.

Prüfartefakte liegen unter `tmp/quality-recovery/baseline/`; Browserbilder und Metadaten unter `tmp/quality-recovery/baseline/browser/`. Das Verzeichnis ist absichtlich nicht versioniert. Bei der visuellen Prüfung waren Flottenfamilien, Waffen und Hintergründe geladen; die Darstellung zeigt zugleich enge Sprite-Gruppen. Sie ersetzt keinen Blindtest.

## Bulk 1: erreichbare Feuerpositionen

Der alte Stand setzt hintere Reihen teilweise außerhalb ihrer Waffenreichweite ab. Alle aktiven Feuerpositionen berücksichtigen jetzt seitlichen Abstand, Lane-Grenzen und tatsächliche Reichweite gemeinsam. Organische, lokale Gruppen bleiben erhalten. Eine kontinuierliche Ansteuerung mit stabiler Ausweichseite verhindert das dabei zunächst reproduzierte seitliche Pendeln; dafür wurde das Prinzip aus `8b9ee40` gezielt angepasst.

36 gespiegelte Szenarien auf beiden Karten prüfen gemischte Klassen, Randziele, hintere Mitglieder und Carrier: Alle Schiffe feuern und verursachen Schaden. Ein Verhaltenstest prüft Weiterflug nach Zielverlust. Foundation und Stress bestanden. Der Cluster-Test besteht mit maximal neun Richtungswechseln, 107,5 mittleren und 148 maximalen Überschneidungen. Das ist keine generelle Beseitigung sichtbarer Stapel (Baseline-Mittel 105,6).

Die ersten vier Vergleichspartien mit korrigierter Geometrie endeten nach 126,5–320,5 Sekunden; beide früher feststehenden Level-1-Partien endeten. Bomber feuerten weiterhin selten oder gar nicht: Ihre Zielpriorität bevorzugt den entfernten Carrier vor lokalen Fregatten. Dieser separate Rollenfehler wird in Bulk 2 bearbeitet. Eine breitere Balanceprüfung folgt dort.

## Bulk 2: Rollen, Dichte und regelgleiche KI

Bomber bevorzugen jetzt erreichbare lokale Fregatten vor einem fernen Carrier und greifen nach dem Auflösen der Front den Carrier an. Die gezielten Szenarien weisen für jede Waffenfamilie tatsächlichen Trefferschaden nach. Die alte Schadenstabelle, Kosten, Einkommen und der 22-Sekunden-Wellentakt bleiben erhalten. Eine probeweise Bomber-Schadenserhöhung und mehrere schlechtere KI-Varianten wurden verworfen.

Die Rollenreparatur machte zusätzliche Dichtefehler sichtbar: unabhängige Ziele wurden zur Lane-Mitte gezogen, und Ziel-lokale Slotzeichen konnten gegeneinander wirkende Abstandsbewegungen verursachen. Feuerpositionen beziehen sich jetzt auf ihr eigenes Ziel; verbündete Überschneidungen werden anhand tatsächlicher Positionen gelöst. Nur dabei ist ein begrenzter, langsamer Abstandsschritt in der Tiefe möglich. Normales Kampfsteuern bleibt vorwärtsorientiert. Außerdem werden Ziel-/Platzbindungen chronologisch vergeben: `entity-10` darf nicht wegen alphabetischer Sortierung vor `entity-9` stehen. Ein Regressionstest deckt diese Dezimalgrenze ab. Der unveränderte Cluster-Grenztest besteht mit 122,0 mittleren und 194 maximalen Überschneidungen sowie höchstens vier seitlichen Richtungswechseln. Sichtbare Stapel bei künstlich gleichzeitig erzeugten 112 Schiffen bleiben ein eigener Prüfpunkt.

Die KI bewertet noch startende Schiffe nicht als bereits kämpfende Stärke und berücksichtigt Feuerintervall sowie verbleibende Schilde. Sie unterbricht Sparpläne bei unmittelbarer Carrier-Gefahr und stellt Pushes bei Bedarf auf Bomber mit Eskorte um. Admiral gibt Energie während eines Cooldowns nicht mehr für beliebige Ersatzkäufe aus; Cadet verwendet einfachere Käufe mit längeren Reaktionsfenstern. Forschung und Pushes verwenden vergleichbare Zeitabstände unabhängig von der Reaktionsgeschwindigkeit. Alle Befehle, Ressourcen und Kapazitätsgrenzen bleiben dieselben wie beim Spieler.

| Finale deterministische Vergleichsmatrix | Ergebnis |
| --- | --- |
| Beide Karten, vier Strategiepaarungen, jeweils beide Seiten | 16 reguläre Matchenden; 0 Timeouts / Draws |
| Matchdauer | 158,7–598,1 s |
| Erster Treffer, Level 1 / Level 2 | etwa 6,6 / 5,5–5,7 s |
| Admiral gegen Tactician | 3 von 4 Siege |
| Tactician gegen Cadet | 4 von 4 Siege |
| Economy gegen reine Flotte | beide Siege auf Level 1; beide Niederlagen auf Level 2 |
| Gemischte Investitionen gegen Waffenfokus | 4 von 4 Siege |
| Bomber-Trefferschaden in den 16 Partien | in jeder Partie vorhanden |

Nachweis: `tmp/quality-recovery/final-quality-matrix.jsonl`. Der alte Acht-Minuten-Grenzfall Admiral/Tactician besteht weiterhin strikt: alle vier Partien enden nach 165,1–314,9 s. Eine breitere Economy-/Flottenpartie benötigt 598,1 s; deshalb hat die neue Diagnosematrix einen ausdrücklich ausgewiesenen Zwölf-Minuten-Horizont, ohne einen Spieltimer einzubauen. Der neue Test verschweigt dieses längere Match nicht. Eine zusätzliche Level-2-Prüfung mit vier Lane-/Seitenkombinationen endet jeweils innerhalb von acht Minuten: Seiten 2:2, Admiral 4:0 gegen Tactician (`final-lane-balance.json`).

Das sind begrenzte, reproduzierbare Szenarien, keine statistisch unabhängige Balance- oder Spielspaßabnahme. Reine Waffeninvestitionen sind in dieser Matrix schwach; menschliche Rush-/Tech-Gegenspiele und die Akzeptanz längerer Economy-Partien bleiben für die Abnahme wichtig.

## Bulks 3 und 4: Präsentation und mobile Bedienung

- Aus `1e8d874` wurde ausschließlich das Ereignis erfolgreicher bezahlter Starts übernommen. Der Navigator zeigt eine kurze, auf den tatsächlichen Startpunkt begrenzte Bewegung. Die zusätzliche zentrale Boost-Ellipse wurde verworfen, da sie die vorhandenen Düsen-Hardpoints überlagern würde. Wellen und zusätzliche Guards wurden nicht übernommen.
- Bomber-Karten erklären die Rolle als `HEAVY / SIEGE`; der Einstieg erklärt sofortige Käufe und unabhängige kostenlose Drone-Waves. Die veraltete Sunwell-Spielanweisung wurde entfernt.
- Schließen, Lane-Wahl, Menüwahl und primäre Titel-/Utility-Tasten haben jetzt mindestens 42 Designpixel große Touch-Ziele. Die Titel- und Utility-Darstellung verwendet dieselben Rechtecke wie die Eingabe. Persistente UI-Schrift hat mindestens neun Designpixel.
- Bei hoher Dichte werden flächige Schildtexturen, helle Hüllenfilter und zusätzliche Mündungsringe reduziert; gerichtete Schildtreffer, Projektilkörper und Verluste bleiben sichtbar. Vorhandene Hüllen und Hardpoints bleiben erhalten.
- Der Browser-Check prüft zusätzlich unveränderte Kamera bei Käufen, die tatsächlich gewählte Lane und Start aller Wing-Mitglieder innerhalb von 1,5 Sekunden. Eine zusätzliche gemischte Kampfszene wird in nativen `360×800` aufgenommen.

Der erste vollständige Chrome-Lauf nach Kampf-/Dockkorrekturen bestand auf beiden Karten und fünf Viewports ohne Laufzeit- oder Assetfehler. Dichte Desktop-Szene: 112 Schiffe, mittlerer Abstand zwischen Browserframes 15,5 ms, p95 33,3 ms. Das misst Browser-Frameabstände, nicht isolierte Renderer-Arbeit und nicht das Smartphone-Leistungsziel. Die Baseline-Bezeichnung ist entsprechend auf Frameabstände korrigiert.

Die abschließende Prüfung des gebauten Pages-Artefakts einschließlich der letzten Dichte-/Touch-Anpassungen besteht auf beiden Karten und allen fünf Viewports: zehn Kombinationen, keine Laufzeit- oder Assetfehler. Im 112-Schiff-Test beträgt der mittlere Desktop-Frameabstand 13,8 ms, p95 30,6 ms. Nachweise: `tmp/quality-recovery/final/pages-check.json`, Bilder und Commit-/Änderungsmetadaten unter `tmp/quality-recovery/final/pages/`. Alle 34 Runtime-Code-/HTML-Dateien im Build sind bytegleich zum geprüften Quellstand.

Die finalen Bilder wurden visuell geprüft, insbesondere die gemischte Kampfszene bei nativen `360×800`, das Command-Menü mit Cooldowns und der 112-Schiff-Extremfall. Klassen, Fraktionen, Waffen und Bedienelemente sind in den normalen Prüfszenen unterscheidbar. Im Extremfall bleiben trotz reduzierter Effekte starke sichtbare Hüllenstapel. Das ist ein offener Qualitätsmangel und kein bestandenes Lesbarkeitsziel; ein menschlicher Blindtest steht zusätzlich aus.

Die abschließende Foundation-/Kampf-/Assetprüfung besteht, einschließlich 36 gespiegelter Feuer-/Trefferszenarien und der Dezimal-ID-Regression. Stress: 56 / 112 Schiffe und 50 / 102 Projektile in Level 1 / 2, alle Kapazitäts- und Event-/Trail-Grenzen eingehalten. Cluster: 122,0 / 194 Überlappungen, höchstens vier Richtungswechsel. Artefakte: `tmp/quality-recovery/final/stress.json` und `cluster.json`. Gegenüber der Baseline sinkt das Pendeln; die mittlere Überschneidungszahl steigt. Eine vollständige Entzerrung wird ausdrücklich nicht behauptet.

Der Vorschau-Server kann mit `npm run preview` ausschließlich das geprüfte `dist/` ausliefern. Er bindet standardmäßig an localhost und sperrt versteckte Pfadsegmente. Die [Geräteabnahme](DEVICE_ACCEPTANCE.md) enthält den ausdrücklichen LAN-Aufruf und ein ausfüllbares Prüfprotokoll.

## Noch offene externe Abnahme

Reale Smartphones, Handhaltung, thermische Drosselung, längere Sessions und Beobachtungen neuer Spieler stehen aus. Extreme Hüllenstapel, Akzeptanz längerer Economy-Partien und menschliche Rush-/Tech-Gegenspiele sind zusätzlich zu bewerten. Meilenstein A und die gesamte Qualitätsabnahme sind noch nicht erreicht. Bulk 6 mit neuen Gameplay-Systemen bleibt gemäß Plan bis dahin zurückgestellt. Der geprüfte Stand wird lokal gesichert; GitHub und der öffentliche Spiellink wurden nicht aktualisiert.

## Ergänzung: erstes Kampagnenpaket

Nach der Qualitäts-Wiederaufnahme hat der Nutzer die Reihenfolge ausdrücklich auf Kampagne zuerst geändert. Hauptmenü, Missionsauswahl, Briefing, eine vorläufige Erstkontakt-Mission und lokal gespeicherte Abschlüsse sind jetzt integriert. Die Menüszene verwendet keine Levelkarte. Missionen 2 und 3 bleiben gekennzeichnete Vorschauen; die endgültige Missionsgestaltung und Balance folgen später.

Der [Kampagnenbericht](CAMPAIGN_FIRST_SLICE.md) enthält die ausgeführten Funktionsprüfungen und offenen Punkte. Diese Ergänzung ersetzt weder die bisher offene Geräte-/Spielerabnahme noch die Bewertung dichter Gefechte. Auf Wunsch des Nutzers werden vor dem nächsten Missionsumbau keine weiteren Balance-Matrizen durchgeführt. Der [Verbesserungsplan](GAME_IMPROVEMENT_PLAN.md) beschreibt die neue Reihenfolge und die [Menü-Asset-Empfehlung](MENU_ART_DIRECTION.md) die gewünschte Gestaltung.
