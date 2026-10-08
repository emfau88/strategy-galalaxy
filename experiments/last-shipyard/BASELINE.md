# Bulk 0 – Herkunft und Grenzen

Stand: 7. Oktober 2026. Branch: `codex/last-shipyard`.

## Verifizierte Ausgangsstände

- Repository: https://github.com/emfau88/strategy-galalaxy.git
- Classic-Basis: `ed8802b2652d07ae2e7884f1dc2eabd195b34057` (Remote main und HEAD, mit git ls-remote überprüft).
- GitHub-Pages-Deployment 6398403032: erfolgreich, 11. September 2026, 17:31:55 UTC; identischer Commit. Nachweis: [Deployment-Status](https://api.github.com/repos/emfau88/strategy-galalaxy/deployments/6398403032/statuses).
- Öffentliche Classic-Adresse: https://emfau88.github.io/strategy-galalaxy/
- Experiment-Kern: `311af9efca548bbd11b2951cb3e67e86effb453b` aus dem erhaltenen Qualitätsbranch.

## Selektive Übernahme

36 Runtime-Dateien und index.html bilden den zusammenhängenden Kampagnenkern. Nur 51 aktive Bilder aus boot, level1, level2 und combatVfx werden kopiert. Die Bibliotheksgruppen ships, effects und ui sind aus dem experimentellen Manifest entfernt. Keine komplette Referenzbibliothek wurde übernommen.

[Importmanifest](provenance/import-manifest.json) nennt für jede Kopie ursprünglichen Pfad, Zielpfad und SHA-256 des Herkunftsblobs. Die Hashes dokumentieren die Quelle, nicht einen unveränderlichen zukünftigen Runtime-Stand. Assets bleiben bytegleich. Herkunfts- und Generierungsberichte sowie drei Foozle-Lizenztexte liegen in provenance/. Historische Pfade in diesen kopierten Berichten beziehen sich auf das ursprüngliche Repository.

Anpassungen: Titel/Testkennzeichnung, eigene Versionsmetadaten, eigene Speicher- und Debugnamen, begrenztes Assetmanifest, Kampagnenmenü ohne freies Gefecht. Vorhandene Simulations-, Kauf- und Missionsregeln sind unverändert. Interne QA-/Skirmish-Kompatibilität bleibt im Kern, besitzt keinen Hauptmenü-Einstieg.

## Dateigrenzen

Bulk 0 ändert ausschließlich experiments/last-shipyard/, diese Plandokumentation, README und SOURCE_PROVENANCE. Classic index.html, src/, assets/, package.json, Scripts und Deployment-Workflow bleiben auf der Classic-Basis. .reference/ ist schreibgeschützt und wird nicht verwendet.

Bulk 1 darf den gemeinsamen Site-Build und den bestehenden zentralen Pages-Workflow erweitern; Classic-Ausgabe darf dabei weder ersetzt noch überschrieben werden. Der zusätzliche öffentliche Play-Link ist seit Bulk 1 live. [Abnahme](../../docs/LAST_SHIPYARD_BULK1_REPORT.md).

## Speicher

- Fortschritt: strategy-galalaxy:last-shipyard:v1:progress (Schema version: 1, completed, lastMissionId).
- Sound: strategy-galalaxy:last-shipyard:v1:sound-muted (Boolean als String).
- Ausrüstung seit Bulk 3: equipment mit eigener version: 1 innerhalb des progress-Schemas. ability ist null, aegis oder disrupt; bomberVariant ist standard oder ion; Freischaltung wird aus dem Missionsfortschritt validiert. Alte version-1-Spielstände bleiben lesbar.
- Kein Service Worker, kein globaler Reset und keine Classic-Migration.

## Abnahme

Erfüllt am 7. Oktober 2026:

- Node-Isolationsprüfung bestanden: relative interne Imports, alle 51 Bildhashes, unveränderte übernommene Kernmodule, Classic-Code/Build/Workflow auf ed8802b, eigene Speicherzugriffe und Versionskonsistenz.
- Unterpfadprüfung bestanden: HTML, Module und Assets funktionieren unter /strategy-galalaxy/experiments/last-shipyard/; keine Root-Fallbacks oder Zugriffe außerhalb des Experimentordners.
- Chrome, 360 × 800: Hauptmenü → Einstellungen/Sound → Kampagne → Briefing → Mission → Scout-Kauf per Touch → Pause → Hauptmenü. Ohne Runtime-, Asset- oder Netzwerkfehler.
- Eigener Fortschritt und Sound bleiben nach Reload erhalten; zuvor angelegte Classic-Speicherdaten bleiben identisch. Der Abschluss wurde dafür über die Fortschritts-API gesetzt; kein Missionssieg oder Balancing wurde dadurch getestet.
- Hauptmenü und Briefing anhand von Screenshots geprüft; Testkennzeichnung und Build-Version sind sichtbar. Lokaler Bericht und Bilder liegen im ignorierten tmp/last-shipyard-bulk0/.

Keine Balance-Testserien, keine echte Smartphone-Abnahme und keine Veröffentlichung. Missionsgestaltung und neue Assets folgen in späteren Bulks.

## Weiterentwicklung ab Bulk 2

Die importierten 51 Bilder bleiben unverändert. Die Runtime-Kopie darf jetzt gezielt Missionsregeln und Darstellung entwickeln; nur Classic bleibt an die ursprüngliche Runtime-Baseline gebunden. Neue Key-Art ist in [generated-assets.json](provenance/generated-assets.json) mit Quelle, Auftrag und SHA-256 dokumentiert.

Bulk 3 erweitert nur die isolierte Runtime: Missionsentscheidung aus Kampfereignissen, defensive Haltepositionen, temporäre Aegis-Schadensminderung und gespeicherte Ausrüstung. Die Classic-Dateien und importierten Bilder bleiben unverändert.

Bulk 4 ergänzt nur die isolierte Runtime: gemeinsame Team-Kapazität, Lane-Haltemodus, kostenlose gespeicherte Ausrüstungswahl und gemeinsame Waffenunterbrechung für Ionenbomber/Störimpuls. Kein neues Bitmap; die 51 importierten Bilder und Classic bleiben unverändert.

Bulk 5 ergänzt nur die isolierte Runtime: lanegebundene Schildrelais, zeitlich begrenzten Gegnernachschub, Carrier-Schutz und gespeicherten Kampagnenabschluss mit zwei freiwilligen Abzeichen. 53 aktive Bilder: 51 unveränderte Importe, Menü-Key-Art und ein neues transparentes Relais-Atlasbild mit zwei Zuständen. Keine Bearbeitung der generierten PNG; Runtime zeichnet jeweils eine Hälfte. Vollständiger Auftrag, Quelle und SHA-256 stehen in generated-assets.json. Alte version-1-Spielstände behalten ihre Ausrüstung; badges ergänzt das bestehende Schema.
