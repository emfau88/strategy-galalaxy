# Bulk 1 – Gemeinsamer Pages-Build

Stand: 8. Oktober 2026. Status: abgeschlossen, veröffentlicht und öffentlich geprüft.

## Ergebnis und Grenzen

Classic bleibt auf der veröffentlichten Basis ed8802b. Der ursprüngliche Classic-Builder ist unverändert. Der gemeinsame Site-Build ergänzt die Testkampagne nach dem Classic-Build in dist/experiments/last-shipyard/ und prüft danach alle vorherigen Classic-Dateihashes. Der Experiment-Builder schreibt ausschließlich in einen eigenen temporären Ordner. version.json im Artefakt enthält zusätzlich den tatsächlich gebauten Commit.

Eine vorläufige Erstkontakt-Mission ist spielbar; keine neuen Missionsregeln oder Balanceänderungen. Die Testversion trägt 0.0.2-bulk1.

## Deployment

Ein Workflow baut und prüft beide Fassungen. Feature-Branch und Pull Requests erhalten ein Artefakt; nur main darf veröffentlichen. Der zuvor doppelte Classic-Testaufruf entfällt, weil npm run check die Foundation-Prüfung bereits ausführt. checkout lädt die Commit-Historie für die Baseline-Prüfung.

## Speicher und Reset

Der experimentelle Fortschritt und Sound sind getrennt. Ein neuer Fortschritts-Reset darf nur den experimentellen Fortschrittsschlüssel entfernen; Sound bleibt erhalten. Er ist zunächst als Programmier-/QA-API verfügbar, ohne neue Menüoption. Keine Classic-Migration oder globales Löschen.

## Abnahme

Lokal bestanden am 8. Oktober 2026:

- npm run check: Foundation- und Assetprüfung (einmalig).
- npm run check:werft: eigene Imports und Assets, versionskonsistente Metadaten, Fortschritt/Sound/Reset getrennt.
- npm run build:pages und npm run test:site: 85 Classic-Spieldateien gegen Git-Blobs von ed8802b geprüft, unverändert; .nojekyll zusätzlich erhalten. Bei Textdateien werden ausschließlich Betriebssystem-Zeilenenden normalisiert.
- Beide Pfade und automatische Slash-Weiterleitungen liefern die richtigen HTML-/Modul-/Assetdateien, fehlende Experimentdateien fallen nicht auf Classic zurück.
- npm run test:site:browser: gebautes Artefakt, Chrome 360 × 800; Classic startet vor und nach dem Experiment. Kampagne → Erstkontakt → Kauf per Touch → Pause → Hauptmenü. Fortschritt und Sound überleben Reload; der Fortschritts-Reset lässt Classic-Daten und Sound unverändert. Keine Runtime- oder Netzwerkfehler.
- Die Abschlussmarkierung wurde zur Speicherprüfung über die Fortschritts-API gesetzt, kein Missionserfolg simuliert.

Öffentlich bestanden am 8. Oktober 2026:

- Integration auf main: d2ff7583e9cc558027ea5df48c5a0e261c5c0600. [Erfolgreicher Pages-Run](https://github.com/emfau88/strategy-galalaxy/actions/runs/37817746127).
- [Classic](https://emfau88.github.io/strategy-galalaxy/) und [Testkampagne](https://emfau88.github.io/strategy-galalaxy/experiments/last-shipyard/) liefern HTTP 200 und öffnen die jeweilige Fassung.
- Der gesamte kurze Browserablauf wurde gegen die öffentlichen URLs wiederholt: beide Spiele starten, Touch-Kauf funktioniert, Pause/Rückkehr funktionieren, experimenteller Fortschritt und Sound überleben Reload; eigener Reset lässt Classic-Daten und dessen Sound unverändert. Der App-Browser zeigt zusätzlich das richtige Hauptmenü, Briefing und die gestartete Mission.
- Die README auf main enthält beide Play-Links und die tatsächliche Missionszahl. Das öffentliche version.json meldet 0.0.2-bulk1 und den gebauten Integrationscommit.
- Erste externe Browserprüfungen stießen hier auf Navigationstimeouts. Der automatisierte öffentliche Check verwendet deshalb TCP-Transport und einen längeren Netzwerktimeout; echte Spiel-/Modul-/Assetfehler bleiben Fehler. Ausschließlich die automatische Anfrage nach dem fehlenden Favicon der Host-Domain wird ignoriert. Die Spielruntime wird dadurch nicht verändert.
- Lokale Screenshots und Bericht: tmp/last-shipyard-live/ (ignoriert).
- Die danach veröffentlichte Statuskorrektur ändert Dokumentation und Prüfwerkzeug, keine Spielregeln. Der endgültige gebaute Commit ist im öffentlichen version.json nachvollziehbar. Keine Balance-Testserien. Die echte Smartphone-Abnahme bleibt offen.
