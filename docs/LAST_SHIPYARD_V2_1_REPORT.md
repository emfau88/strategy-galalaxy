# V2-1 – Außenposten und Evakuierung

Stand: 9. Oktober 2026. Version **0.0.8-v2-1**. Technische Umsetzung abgeschlossen; menschliche Spielbeobachtung bleibt offen. Ausgangspunkt: aktuelles `origin/main` auf `03d8ae6`, eigener Branch `codex/last-shipyard-v2-pilots`. Änderungen betreffen das Experiment, dessen Dokumentation und gezielte Prüfungen.

## Spielbarer Umfang

Die Auswahl **Kampagne → Neue Kampagne · 2 Testeinsätze** bietet zwei unmittelbar startbare Missionen. Bisherige Missionen und Ausrüstung müssen dafür nicht nachgespielt werden. Die anderen sechs V2-Einsätze bleiben klar bezeichnete Vorschauen.

| Testeinsatz | Tatsächlich umgesetzte Entscheidung und Siegbedingung |
| --- | --- |
| Der erste Außenposten | Eine Lane, Relais erobern, Energie in Flotte oder optionale Bastion investieren. Die erste Eroberung löst einmalig zwei angekündigte, regulär bezahlte Gegenangriffe aus. Besitz kann verloren und zurückgewonnen werden. Sieg erst bei zwei vollständig abgewehrten Angriffen, eigener Relaiskontrolle, sicherer Kauf-Schiff-Besatzung und lebendem Carrier. Auch ausstehende gegnerische Salven müssen abgeklungen sein. |
| Die letzte Fähre | Zwei ungleiche Anflugwege, verwundbare Sprungstation links und Carrier-Front rechts. Drei Ladungen aktiv für jeweils 120 E starten. Jeweils 16 Sekunden Fortschritt mit eigener Kauf-Schiff-Besatzung und ohne Feind in der Zone. Unterbrechung erhält bezahlten Fortschritt, Fortsetzen kostet nichts zusätzlich. Wiederkehrende Angriffe wechseln zwischen beiden Fronten. Station oder Carrier verloren bedeutet Niederlage, auch bei gleichzeitiger Zielerfüllung. |

## Bau, Bedienung und Dosierung

- Pro Karte ein fester eigener Bauplatz; Bastion für 140 E, 8 Sekunden verwundbare Bauphase, danach vorhandene Turret-Waffe. Kein Verkauf und kein Baumodus mit freier Platzierung. Zerstörung ermöglicht einen Neubau zum vollen Preis mit frischer Entity-ID; alte Geschosse können keinen Ersatzbau treffen.
- Station und Bauplatz öffnen eigene Kontextfelder. Kosten, Bauzustand, Hülle, fehlende Besatzung, Gegnerkontakt und Ladefortschritt sind sichtbar. Direkte Kameratasten ergänzen das Antippen in der Welt. Nur ein Kontextfeld beziehungsweise Flottenmenü gleichzeitig.
- Automatische Haltepunkte pro Lane; keine erforderliche Schiffs-Einzelsteuerung. Der Außenposten hält bei y=610, die Fähre bei y=925/1060. Zielzonenradius 90 ermöglicht Stationsbesatzung durch die vorhandenen Formationen.
- Eigene Flottenlimits: Außenposten 12; Fähre 10 pro Lane und 16 insgesamt. Neue Gratis-Drones erscheinen nur bis zu zwei lebenden Drones pro Lane, damit Warten nicht alle Kaufplätze blockiert. Die bisherigen Missionen behalten ihre Regeln.
- Gegner verwenden vorhandene Kauf-, Kosten-, Cooldown- und Kapazitätsregeln. Keine unverwundbaren Gegneranlagen oder heimliche Gratis-Gegner.
- V2-Speicherschema 2 übernimmt die letzte Kartenansicht aus Schema 1, aber keine dort unzulässigen Siege. Es speichert nur abgeschlossene spielbare V2-Einsätze. Classic und V1-Speicher bleiben getrennt; Niederlage und Vorschau vergeben keinen Abschluss.

## Prüfung

- `npm run check:werft`: bestanden. Neue gezielte Prüfungen für atomare Baukosten, gesperrte/ungültige Befehle, unbewaffneten Bauzustand, Bauzerstörung und Neubau, Pause, Neustart, Drone-Begrenzung, Eroberung/Rückeroberung ohne Wellen-Neustart, ausstehende Salven, Besatzung, bezahlte Ladeunterbrechung, tatsächliche Bomber-Zielauswahl und Verlustpriorität.
- Je ein repräsentativer Durchlauf pro Testmission mit regulären Käufen und tatsächlich gebauter Bastion: Außenposten Sieg nach rund 80 simulierten Sekunden, Fähre nach rund 98 Sekunden. Höchste beobachtete gleichzeitige Schiffszahl beider Seiten 16 beziehungsweise 21. Das sind Funktionsnachweise, keine gewünschte Endbalance oder menschlich gemessene Spieldauer.
- Vorhandene sechs Missionsregressionen unverändert erfolgreich. Isolationstest vergleicht Classic gegen den öffentlichen Referenzstand `ed8802b`; keine Änderung an Classic-Code oder Original-Assets.
- Gemeinsames Pages-Artefakt gebaut. Browserprüfung `--site --pilots`: Start beider Piloten mit Touch, Bauplatz in der Welt und über Kamerataste, Bau und Pause, regulärer Außenpostensieg, Rettung starten, Stationsverlust und Neustart, Ergebnisnavigation und Save-Reload. Ansichten bei 360×640, 360×800 und 390×844; keine Browserfehler. Classic startet aus demselben Artefakt und behält seine Speicherwerte.
- Der erste Browserlauf fand eine fehlende `upgrades`-Liste beim Öffnen der neuen Flottenmenüs. Behoben, anschließend kompletter betroffener Browserablauf erfolgreich wiederholt.

## Bewusst noch offen

Die entscheidende menschliche Beobachtung ist **nicht abgehakt**: Ist die Bauinvestition verständlich und interessant? Wechselt der Spieler bei der Fähre tatsächlich zwischen Flottenschutz und Rettung? Lassen sich mindestens zwei plausible Vorgehensweisen erkennen? Die automatisierten Siege beantworten diese Fragen nicht. Erst danach sollte V2-2 inhaltlich ausgebaut werden.

Stationen verwenden funktionale Vektordarstellung und die Bastion den bestehenden Turret-Fallback. Die geplanten Imagegen-Motive beginnen mit V2-2. Aegis schützt aktuell Carrier und Schiffe, nicht Sprungstation/Bastion; die geplante Erweiterung auf Anlagen folgt ebenfalls in V2-2. Noch keine Forschung, Reparaturdocks, Bauplan-Freischaltungen oder Verbindung aller acht neuen Einsätze.

## Integration

Veröffentlichung erfolgt über PR mit Prüfung des Diffs und grüner CI, anschließend Merge nach `main` und den bestehenden Pages-Workflow. Der öffentliche Play-Link bleibt [Die letzte Werft](https://emfau88.github.io/strategy-galalaxy/experiments/last-shipyard/). Der Abschluss dieses Schritts wird zusätzlich im Lieferbericht des Chats mit PR und Deployment belegt.
