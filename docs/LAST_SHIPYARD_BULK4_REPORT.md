# Bulk 4 – Flottenwahl, zwei Fronten und Gegenstoß

Stand: 8. Oktober 2026. Version 0.0.5-bulk4. **Umgesetzt und gezielt lokal geprüft.** Veröffentlichung mit diesem separaten Bulk-Commit über den zentralen Pages-Workflow.

## Spielbarer Umfang

Fünf Missionen. Geteilte Front stellt schwere Gegner links und schnelle Angriffe rechts gegenüber. Links beginnt im Haltemodus; jede Lane kann kostenlos auf HALTEN/VORSTOSS geschaltet werden. Frontsprung, Warnung und Kapazität beziehen sich auf die gewählte Lane. Beide Lanes teilen 18 eigene bzw. 14 gegnerische Plätze, zusätzlich gelten 12 bzw. 9 pro Lane. Bezahlte Käufe, direkte Formationen und kostenlose Waves beachten beide Grenzen.

Das Zeitfenster beginnt mit einer Halteposition gegen Fregatte, Bomber und Fighter. Die 48-Sekunden-Aufbaupause eröffnet den angekündigten Gegenstoß; HALTEN/VORSTOSS bleibt eine Spielerentscheidung.

Werftwechsel kosten nichts. Der Ionenbomber wird nach Mission 4 verfügbar: zwei Sekunden Waffenunterbrechung gegen Schiffe, geringere Wirkung gegen Strukturen. Standardbomber behalten die Belagerungsrolle. Störimpuls wird nach Mission 5 verfügbar: 100 E, 3,5 Sekunden Waffenpause für aktuelle gegnerische Schiffe der gewählten Lane, 32 Sekunden Cooldown. Carrier und Relais sind immun. Ohne Ziele wird keine Energie abgezogen. Genau eine Fähigkeit und eine Bomber-Ausführung werden gespeichert und aus Freischaltungen validiert.

## Gezielte Abnahme

- Globale und Lane-Kapazität, fehlgeschlagene Abbuchung und kostenlose Zwei-Lane-Waves geprüft.
- Lane-Haltemodus, Ionenschaden/Unterbrechung, Strukturimmunität und reguläres Feuern nach Ablauf geprüft.
- Störimpuls: Kosten, fehlende Ziele, Dauer, Pause, Missionsende und Wiederholung geprüft.
- Freischaltung, kostenlose Auswahl, Reload und eigene Speichertrennung geprüft.
- Je ein normaler Kaufablauf: Mission 4 Sieg nach 110 Simulationssekunden / 14 Käufen; Mission 5 mit Standardbomber und Aegis nach 104 Sekunden / 12 Käufen. Das belegt Abschließbarkeit, keine ausgewogene Schwierigkeit.
- Gebauter Unterpfad im Browser 360×800: Werft, echtes Mission-4-Ergebnis, Ionenauswahl, echtes Mission-5-Ergebnis mit Ion, Störimpulsauswahl, Reload und Touch-Auslösung. Status GESTÖRT sichtbar. Screenshots ohne Überlappung; keine Browserfehler.
- Bestehende Hafenverteidigung gezielt als Mechanikregression bestanden. Gemeinsamer Build erhält die 86 Classic-Ausgabedateien; importierte Bilder bleiben unverändert.

Kein neues Bitmap für Bulk 4 erforderlich. Die vorhandene Menü-Key-Art und klare Codegrafik genügen für Varianten-/Fähigkeitsanzeigen. Menschlicher Ersttest, echte Smartphone-Abnahme und breitere Kampagnenbalance bleiben offen. Bulk 5–6 sind hier noch nicht umgesetzt.

## Veröffentlichung bestätigt

Commit 6a00f87 wurde separat auf main und codex/last-shipyard gepusht. [Pages-Run 37826860682](https://github.com/emfau88/strategy-galalaxy/actions/runs/37826860682) erfolgreich. Öffentlicher Browsercheck bestätigt Version 0.0.5-bulk4, fünf spielbare Missionen, beide Play-Links, Hafenstart/Aegis und gespeicherte Ausrüstung. Keine Browserfehler.
