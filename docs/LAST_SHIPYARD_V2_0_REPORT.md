# Die letzte Werft – V2-0: Missionsgrundlage und Testzugang

Stand: 9. Oktober 2026. **Technisch abgeschlossen**, Version `0.0.7-v2-0`. Ausgangspunkt `0dcb353`; Umsetzung auf `codex/last-shipyard-v2-foundation`. [Ausbauplan](LAST_SHIPYARD_CAMPAIGN_EXPANSION_PLAN.md).

## Erreichbarer Umfang

Im [Experiment](https://emfau88.github.io/strategy-galalaxy/experiments/last-shipyard/) führt **Kampagne → Neue Kampagne · Kartenvorschau** zur neuen Übersicht. Acht Missionen lassen sich ansehen. Jede zeigt ein schematisches Layout im gemeinsamen Maßstab, Auftrag, Hauptentscheidung, Kartenhöhe, Lane-Anzahl, Bauplätze und geplante Belohnung. Vorheriger/nächster Einsatz sowie Rückkehr zur bisherigen Kampagne sind verfügbar.

Alle acht neuen Missionen sind **Vorschauen, noch keine spielbaren Einsätze**. Sie haben keine Startschaltfläche; auch der MatchDirector lehnt das Starten einer als nicht verfügbar markierten Mission ab. Die vorhandenen sechs Missionen sind weiterhin spielbar.

## Grundlage für V2-1

- Acht eindeutige `v2-…`-Missions-IDs und eigenständige, unveränderliche Layout-/Zieldaten; Höhen von 900 bis 1380, eine oder zwei Lanes, asymmetrische Startpunkte, Stationsmarker und maximal zwei Bauplätze.
- Alte Halte-, Verteidigungs-Spawn- und Relaiskoordinaten sind Kartendaten. Neue Karten können Haltepunkte pro Lane festlegen. Bewegung und eingezeichnete Halteposition verwenden dieselbe Funktion.
- Gemeinsame Regeln für künftige Stationsaufträge: gekaufte Schiffe als Besatzung, jede feindliche Schiffspräsenz als Unterbrechung, verpflichtend lebende Anlagen, Niederlage vor gleichzeitigem Zielabschluss, gefährliche Restgeschosse und Fortschritt ausschließlich in aktiver Spielzeit.
- Diese Zielregeln sind vorbereitete und geprüfte Funktionen. Es gibt in V2-0 noch keine Bauvorgänge, Stationskämpfe, Forschungssegmente, Evakuierung oder vollständig ausgeführte neue Siegbedingungen.
- Separater Speicher `strategy-galalaxy:last-shipyard:v2:progress` mit Kampagnenkennung. Er merkt aktuell die zuletzt betrachtete Vorschau. Anschauen erzeugt weder Siege noch Freischaltungen. Der ursprüngliche Experiment-Speicher und Classic bleiben getrennt.
- Keine neue Runtime-Kopie, keine neuen Assets und keine Balanceänderungen an den sechs bisherigen Missionen.

## Durchgeführte Prüfungen

| Prüfung | Ergebnis |
| --- | --- |
| Bestehender Repository-Check | Bestanden: Foundation und Assetregistrierung |
| Experiment-Prüfungen einschließlich neuer V2-0-Fälle | Bestanden: Classic-Isolation, vorhandene Missionsregeln, acht Layouts, Startschutz, Haltepunkte, Speicher und Zielregel-Grenzfälle |
| Gemeinsamer Pages-Build und Artefaktprüfung | Bestanden: beide Einstiegspfade; Classic-Dateien entsprechen weiterhin dem veröffentlichten Ausgangsstand |
| Kurzer Browserlauf `--site --foundation` | Bestanden: alle acht Vorschauen per Touch, Vor/Zurück, Neuladen, bestehender Missionsstart/Kauf/Pause, getrennter Speicher und Reset |
| Sichtprüfung der Browserbilder | Übersicht, Einstieg, Evakuierungsentwurf und Finale geprüft; zusätzlich 360×640 und 390×844. Kein abgeschnittener Zieltext oder überlagerter Button in den angesehenen Bildern. |

Es wurden die bestehenden Regressionen einmal nach der Koordinatenumstellung sowie der gezielte neue Browserablauf ausgeführt. Keine neuen Balance-Matrizen und keine wiederholten Kampagnen-Durchläufe zur Optimierung unfertiger Missionen.

Screenshots und Browserprotokoll liegen lokal im ignorierten `tmp/last-shipyard-bulk1/`; der Verzeichnisname stammt vom wiederverwendeten Browserprüfskript. Automatische Browsergrößen sind keine reale Smartphone-Abnahme.

## Integration und offene Arbeit

Die Integration erfolgt über einen Pull Request auf `main`; der bestehende zentrale Pages-Workflow veröffentlicht beide Fassungen. Die README und `version.json` unterscheiden die sechs spielbaren bisherigen Missionen von den acht neuen Vorschauen.

**Nächster Bulk: V2-1.** Außenposten und Evakuierung als vollständige Testeinsätze mit Baubefehl, Stationsregeln, Kontextbedienung und eigenen Sieg-/Niederlagenabläufen implementieren. Menschlicher Spieltest und echte Geräteabnahme bleiben offen. Neue Imagegen-Assets folgen erst, wenn ihre jeweilige Aufgabe mit Platzhaltern funktioniert.
