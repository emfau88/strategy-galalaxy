# Qualitäts-Wiederaufnahme – Nachweise und offene Abnahme

Stand: 7. Oktober 2026. Dieser Bericht wird mit jedem geprüften Bulk ergänzt.

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
| Browser: Renderer-Arbeit bei 112 Schiffen, Mittel / p95 | 12,9 / 30,6 ms |
| Level-1-Diagnose, Admiral/Tactician, beide Seiten | beide nach 480 s noch LIVE_MATCH |
| Level-1-Diagnose: Anteil beobachteter Kampfzustände außerhalb Reichweite | 53,5 % / 51,4 % |
| Level-1-Diagnose: Carrier-HP nach 480 s | jeweils 1800 / 1800 |

Die Browser-Framewerte sind Desktop-Messungen unter paralleler Diagnoselast, keine Smartphone-FPS-Abnahme. Die Reichweitenquote enthält Anfahrts- und Ausweichphasen; einzelne Schiffe und deren Sollpositionen müssen zur Ursachenklärung betrachtet werden. In der Baseline-Diagnose wurde kein Bombergeschoss abgefeuert, obwohl Bomber vorhanden waren.

Prüfartefakte liegen unter `tmp/quality-recovery/baseline/`; Browserbilder und Metadaten unter `tmp/quality-recovery/baseline/browser/`. Das Verzeichnis ist absichtlich nicht versioniert. Bei der visuellen Prüfung waren Flottenfamilien, Waffen und Hintergründe geladen; die Darstellung zeigt zugleich enge Sprite-Gruppen. Sie ersetzt keinen Blindtest.

## Noch offene externe Abnahme

Reale Smartphones, Handhaltung, thermische Drosselung, längere Sessions und Beobachtungen neuer Spieler stehen aus. Meilenstein A ist erst nach diesen Nachweisen erreicht. Bulk 6 mit neuen Gameplay-Systemen bleibt bis dahin zurückgestellt.
