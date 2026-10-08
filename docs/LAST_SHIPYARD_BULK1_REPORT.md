# Bulk 1 – Gemeinsamer Pages-Build

Stand: 8. Oktober 2026. Status: lokal geprüft, Veröffentlichung und öffentliche Abnahme noch offen.

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

Öffentliche Abnahme noch offen. Keine Balance-Testserien. Die echte Smartphone-Abnahme bleibt offen.
