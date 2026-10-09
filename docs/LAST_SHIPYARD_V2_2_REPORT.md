# V2-2 – Ein zusammenhängender erster Akt

Stand: 9. Oktober 2026. Version **0.0.9-v2-2**. Technische Umsetzung und lokale Prüfung abgeschlossen; menschliche Spielbeobachtung und echte Smartphone-Abnahme bleiben offen.

Ausgangspunkt: geprüftes `origin/main` auf `485f6f2302647f1091ca5d25eb2f6855f9e92225` (V2-1 über PR #3). Arbeitsbranch: `codex/last-shipyard-v2-act-one`. Entwicklung ausschließlich im Experiment, mit anschließender Integration über PR, CI und den bestehenden Pages-Workflow. Der erhaltene Qualitätsbranch bleibt separat.

[Spielen](https://emfau88.github.io/strategy-galalaxy/experiments/last-shipyard/) → **Kampagne → Neue Kampagne · Akt I spielen → Kampagne**. [Verbindliche Checkliste](LAST_SHIPYARD_CAMPAIGN_EXPANSION_PLAN.md).

## Gelieferter Spielablauf

| Mission | Eigene Aufgabe | Neue Entscheidung | Gesicherte Belohnung |
| --- | --- | --- | --- |
| 1 – Ein Licht im Schrott | Kleiner Durchbruch auf einer kurzen Karte; gegnerischen Carrier zerstören | Scouts vorschicken und Fighter ergänzen | Bastion für M2 |
| 2 – Der erste Außenposten | Relais besetzen und zwei Rückeroberungsangriffe abwehren | Ein Bauplatz: Bastion oder zusätzliche Flotte | Bomber für M3 |
| 3 – Hafen im Feuer | Angreifbares Dock und Carrier gegen drei Angriffe halten | Vorne abfangen oder am hinteren Bauplatz absichern | Aegis für M4; sichtbarer Hafenbetrieb |
| 4 – Die letzte Fähre | Zwei ungleiche Fronten sichern und drei Rettungsladungen abschließen | Energie zwischen Flotte, Ladungen und Aegis verteilen | Fregatten-Bauplan für kommende Einsätze |

M3 bringt nacheinander Scouts/Fighter, eine Fregatte mit Eskorte und zwei eskortierte Bomber. Ein Angriff gilt erst als abgewehrt, wenn alle Gegner und gefährlichen gegnerischen Geschosse verschwunden sind. Warnungen und Verstärkungspausen trennen die Angriffe. Das Dock ist ein echtes angreifbares Ziel; sein Verlust beendet die Mission. Zwei feste Bauplätze verwenden die vorhandene Bastion (140 E, 8s verwundbare Bauzeit).

M1 bleibt bei zwei kaufbaren Klassen, ohne Baukarte oder Carrier-Fähigkeit. Es gibt nur zwei angekündigte gegnerische Verstärkungen; danach bleibt das Carrier-Ziel. M2/M4 behalten ihren bereits geprüften Ablauf. Kartenhöhen: 900/1180/980/1320; eigene Flottenobergrenzen: 10/12/14/16, bei M4 zusätzlich zehn je Lane. Kostenlose Drones sind weiterhin auf zwei lebende Schiffe je Lane begrenzt.

Missionen werden in Reihenfolge geöffnet. Wiederholungen bleiben kostenlos und behalten die Lern-Ausrüstung ihrer Mission. Der Fregatten-Bauplan wird gespeichert, ist aber im ersten Akt noch nicht einsetzbar; M5–8 bleiben klar bezeichnete Vorschauen. Forschung und Reparaturdock gehören weiterhin zu V2-3.

## Speicher und Bedienung

- Ergebnisbildschirme verbinden M1–4 direkt mit dem nächsten Briefing und zeigen die jeweilige Belohnung. Nach M4 erscheint der Abschluss von Akt I.
- Die Übersicht zeigt nach M3 den aktiven Hafen. Ein eigener Reiter hält Außenposten und Fähre als frei startbare Tests erreichbar.
- Speicherschema 3 trennt `completed` und `pilotCompleted`. Vorhandene V2-1-Siege werden in Testsiege übernommen, ohne die neue Lernreihenfolge zu überspringen. Gespeicherte Kampagnensiege werden als zusammenhängende Folge validiert.
- Testspiele öffnen keine Kampagnenmissionen. Classic und der bisherige Sechs-Missionen-Spielstand werden weder überschrieben noch zurückgesetzt.
- Zwei getrennte Bauplatz-Tasten und direkte Welt-Taps öffnen dasselbe Kontextfeld. Das Fokussieren einer Station wählt deren Lane, damit Käufe und Aegis zum betrachteten Ziel passen.

## Aegis und Bilder

Aegis kostet weiterhin 80 E, schützt sechs Sekunden vor 60 % Schaden und hat 28s Cooldown. Es schützt den eigenen Carrier sowie die Flotte und ausdrücklich notwendige Missionsanlagen der aktivierten Lane. Die Sprungstation erhält damit erstmals denselben Schutz. Bastionen sind ausgeschlossen. Der aktive Schutz bleibt an seine ausgelöste Lane gebunden, auch wenn die Auswahl wechselt. Darstellung und Schadensregeln verwenden dieselbe Schutzprüfung. Der gemeinsame spätere Werftkern ist technisch berücksichtigt; seine Mission ist noch nicht spielbar.

Ein neuer, mit dem integrierten **Imagegen** erzeugter Atlas enthält Hafendock und Sprungstation: [`homeport-stations-v1.png`](../experiments/last-shipyard/assets/campaign/homeport-stations-v1.png), 1774 × 887 Pixel, echte RGBA-Transparenz, 1.568.223 Bytes. Die Datei wird unverändert übernommen; die Darstellung wählt die linke/rechte Hälfte. Verwendung: M3, M4 und der Hafenstatus der Übersicht. Keine weitere neue Flotte oder Menügrafik. [Methode und Herkunft](../experiments/last-shipyard/provenance/GENERATED_ASSETS.md) · [Exakter finaler Prompt und SHA-256](../experiments/last-shipyard/provenance/generated-assets.json).

## Gezielte Prüfung

Bestanden:

- `npm run check:werft`: vorhandene Prüfungen einschließlich aller sechs bisherigen Missionen; 54 Asset-Prüfsummen und Classic-Isolation. Neue Prüfungen für Freischaltreihenfolge, Speichermigration, Neustart/Verlust, zwei Bauplätze, Dock-Zielauswahl und Aegis-Schadensminderung inklusive falscher Lane, Pause und Ablauf.
- Je ein legaler Beispielablauf der neuen Missionen: M1 gewann nach etwa 43 Simulationssekunden mit sechs Käufen; M3 nach etwa 126s mit neun Käufen und einer vorderen Bastion. Das Dock blieb in diesem Beispiel unbeschädigt. Diese Werte belegen Abschließbarkeit, keine endgültige Balance.
- `npm run check`, `npm run build:pages`, `npm run test:site`: reguläre Repository-Prüfungen, gemeinsamer Build, Classic-Dateivergleich und getrennte Pfade/Speicher. Classic bleibt auf seiner bisherigen Referenz `ed8802b`.
- `node experiments/last-shipyard/scripts/browser-smoke.mjs --site --act-one`: einmaliger durchgehender Akt-I-Ablauf mit Käufen, Ergebnisnavigation, Belohnungen und Reload. Gesperrte Missionen, beide M3-Bauplätze, Aegis an der Sprungstation, aktiver Hafen und alter Spielstand geprüft. Menüdarstellung bei 360×640, 360×800 und 390×844. Echte transparente Atlasränder und Öffnung der Sprungstation geprüft. Keine Browserfehler.
- `node experiments/last-shipyard/scripts/browser-smoke.mjs --site --pilots`: separat startbare Tests, Bau/Ladung/Pause, tatsächlicher M2-Sieg, gezielter M4-Stationsverlust mit Wiederholung und Speicherung als Testsieg.

Die Browserprüfungen bedienen die Menüs per Touch und beschleunigen die Simulation im legalen Kaufablauf. Sie ersetzen keine unvoreingenommene menschliche Spielbeobachtung. Screenshots und Browserbericht liegen lokal unter `tmp/last-shipyard-bulk1/`; öffentliche Prüfungen unter `tmp/last-shipyard-live/`.

## Offene Entscheidungen

V2-2 wurde auf ausdrücklichen Nutzerauftrag nach V2-1 fortgesetzt. Dessen menschliches Qualitätsgate ist weiterhin offen. Zu beobachten sind insbesondere: Werden die zwei Bauplätze tatsächlich unterschiedlich genutzt? Braucht M3 mehr Druck auf das Dock? Erkennt ein neuer Spieler rechtzeitig den Energiebedarf der Evakuierung und den lanegebundenen Aegis-Schutz? Dafür wurden keine vorsorglichen Balance-Matrizen gefahren.

Vier Schauplatzfamilien, zusätzliche Stationsvarianten, Forschung, Reparaturdock und die zweite Kampagnenhälfte sind noch nicht geliefert. Echte Smartphone-Lesbarkeit, Geräteleistung und Spaß über mehrere Wiederholungen sind noch nicht abgenommen.
