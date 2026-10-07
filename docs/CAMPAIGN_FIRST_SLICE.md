# Erstes Kampagnenpaket

Stand: 7. Oktober 2026. Lokal umgesetzt auf dem Qualitätsbranch, Ausgangspunkt `e4761e2`. Keine Veröffentlichung erfolgt.

## Was spielbar ist

Der normale Einstieg führt ins Hauptmenü mit Kampagne, freiem Gefecht und Sound-Einstellung. Menü und Missionsauswahl verwenden eine eigene ruhige Szene, keine Levelkarte. Schrift und Bedienelemente werden unabhängig vom Hintergrund gezeichnet. Finale Key-Art und Emblem sind noch nicht generiert; die [Asset-Empfehlung](MENU_ART_DIRECTION.md) beschreibt sie.

Die Kampagne besitzt drei Einträge. **Erstkontakt** ist spielbar; **Schwerer Widerstand** und **Geteilte Front** sind ausdrücklich nicht startbare Vorschauen. Vor Erstkontakt werden Auftrag, Klassen und Besonderheiten angezeigt. Ein Sieg wird lokal gespeichert. Nach dem Sieg zeigt die zweite Mission ihren freigeschalteten Vorschauzustand; spielbarer Inhalt folgt später.

Pause, Rückkehr zum Hauptmenü, Sieg, Niederlage, Wiederholen und Rückkehr zur Missionswahl sind integriert. Wiederholen behält die Missionsregeln. Das freie Gefecht bleibt separat erreichbar.

## Vorläufige Regeln für Erstkontakt

| Regel | Wert |
| --- | --- |
| Karte | Orbital Garden, eine Lane |
| Kaufklassen | Scout Wing und Fighter Wing |
| Forschung | zunächst keine |
| Flottenlimit | zwölf Schiffe je Seite, einschließlich Drones |
| Energie | 160 Start, zehn pro Sekunde, maximal 250 |
| Kostenlose Wave | eine Drone je Seite alle 22 Sekunden, zusätzlich eine Start-Drone |
| Wave-Rückstau | maximal eine ausstehende Wave, ohne spätere Mengenskalierung |
| Carrier | 900 Lebenspunkte auf beiden Seiten |
| Gegner | Kadett, langsames Verstärkungstempo im Briefing angekündigt |
| Matchziel | gegnerischen Carrier zerstören |

Missionsdaten kopieren die bestehende Karte und Konfiguration für das jeweilige Match. Klassen-/Forschungssperren gelten auch im tatsächlichen Kaufbefehl und für die KI. Abgelehnte Käufe kosten keine Energie und starten keinen Cooldown. Es gibt kein erzwungenes Matchende und keine automatische Rettung.

Der Kadett benutzt in dieser Mission eine Entscheidungsbasis von zwei Sekunden statt 1,5 Sekunden im freien Gefecht. Sein bestehendes Kadett-Profil multipliziert diese mit 1,45 und lässt zwischen Käufen mehrere Entscheidungen verstreichen. Kosten, Einkommen, Lebenspunkte und Kapazität sind für beide Seiten gleich; leichter ist die angekündigte Gegner-Taktung.

Das sind Ausgangswerte für die kommende Missionsgestaltung, keine finale Balance. Auf Wunsch des Nutzers sind zusätzliche Balanceversuche vorerst beendet.

## Fortschritt und Speicherung

Gespeichert werden absolvierte Missionen und die zuletzt gestartete Mission unter `strategy-galalaxy-campaign-v1`. Ein laufender Kampf wird nicht fortgesetzt: „Kampagne fortsetzen“ öffnet die Missionsauswahl. Niederlage und Abbruch markieren keinen Abschluss. Fortschritt gilt für den jeweiligen Browser und dessen Adresse; localhost und die öffentliche Pages-Adresse teilen ihn nicht.

Unbekannte oder ungültige Einträge werden verworfen. Bei beschädigtem oder blockiertem Speicher kann weitergespielt werden; ohne erfolgreiche Speicherung bleibt Fortschritt nur für die Sitzung und die Oberfläche weist darauf hin.

## Ausgeführte Funktionsprüfungen

- `npm run check`: bestehende Foundations, 36 gespiegelte Feuer-/Geometrieszenarien, Missionssperren, Kapazität, Wave-Rückstau, Pause, Wiederholen und Speicherfehler bestanden. Assets: 82 registrierte Einträge, 51 veröffentlichte Bilder und 516 Bibliotheksdateien geprüft.
- Quellstand: Menü, Mission, Speicherung und beide bisherigen Karten auf fünf emulierten Mobile-Größen bestanden. Nachweis: `tmp/campaign-diagnostic-check.json`; Screenshots unter `tmp/campaign-first/diagnostic/`.
- Finale gebaute Version: gezielter Kampagnenlauf auf `360×800`, `390×844`, `393×852`, `412×915` und `420×760` bestanden. Geprüft wurden Navigation, Sound, Vorschauensperre, Briefing, echter bezahlter Kauf, Pause/Abbruch, tatsächlich erspielter Sieg/Niederlage, Wiederholen und gespeicherter Sieg nach vollständigem Reload. Keine Browser-/Netzwerkfehler. Nachweis: `tmp/campaign-final-pages-check.json`; Bilder unter `tmp/campaign-first/final-pages/`.
- Im finalen Browserlauf endete der automatisierte Sieg nach 196 Sekunden und die Partie ohne Spielerkäufe als Niederlage nach 72,2 Sekunden. Beides durch regulären Kampf. Der beschleunigte Test übernimmt die Simulationszeit, damit Bildschirmwechsel keine ungeplanten zusätzlichen KI-Schritte einfügen; normale Uhr und Touch werden vorher separat benutzt.
- Der bereits ausgeführte Vergleich des freien Gefechts enthält dieselben 16 Ergebnisse wie vor dem Kampagnenpaket: `tmp/campaign-free-battle-matrix.jsonl` ist bytegleich zu `tmp/quality-recovery/final-quality-matrix.jsonl`. Die zusätzliche Gegner-Taktung greift ausschließlich in der Mission.

Ein früherer Browserlauf überschritt wegen unterschiedlicher Kaufzeitpunkte acht Minuten. Die Diagnose zeigte fortgesetzten Kampf, keinen Stillstand; ein reproduzierter Verlauf endete nach 591,6 Sekunden. Eine langsamere missionseigene Kadett-Taktung beseitigte diesen Grenzfall in den geprüften Eröffnungen. Anschließend wurden Balanceversuche beendet. Diese Beobachtungen sind kein Urteil über die spätere endgültige Mission.

## Noch offen

Missionen 2 und 3, situationsbezogene Einführung, finale Schwierigkeit und Schiffsmengen, Carrier-Fähigkeiten, hochwertiges Menü-Artwork und reale Spieler-/Smartphone-Abnahme. Insbesondere Spaß, Verständlichkeit und reale Geräteperformance sind mit diesen automatisierten Prüfungen nicht abgenommen.

Der [aktualisierte Plan](GAME_IMPROVEMENT_PLAN.md) beginnt mit Menügestaltung und inhaltlicher Ausarbeitung von Erstkontakt. Die Kampagne dosiert neue Inhalte Schritt für Schritt.
