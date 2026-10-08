# Bulk 3 – Aegis und Hafenverteidigung

Stand: 8. Oktober 2026. Version: 0.0.4-bulk3. **Technisch umgesetzt. Ersttest mit ein bis zwei echten Personen bleibt offen.** Veröffentlichung erfolgt mit diesem Commit über den zentralen Pages-Workflow.

## Spielbarer Umfang

Kapitel 1 besteht aus drei Missionen. Hafen im Feuer fordert drei angekündigte, vollständig abgewehrte Angriffe. Nach einem besiegten Verband und dem Auslaufen seiner gefährlichen Salven folgt eine kurze Aufbaupause. Der eigene Carrier muss überleben. Angriffe werden regulär gekauft; fehlende Energie oder Flottenplätze verschieben den Kauf. Es gibt weder versteckte kostenlose Gegner noch ein unverwundbares Gegner-HQ. Die Schiffe springen aus einem sichtbaren Korridor ein.

Die Spielerflotte hält automatisch eine markierte Abwehrlinie und kehrt nach Kämpfen dorthin zurück. Diese Regel entstand aus einem konkreten fehlgeschlagenen Durchlauf: Vorstoßlogik führte überlebende Verteidiger vom Hafen weg. Die Halteregel gilt nur für die Verteidigungsmission.

Aegis wird nach Mission 2 freigeschaltet und beim ersten Sieg automatisch ausgerüstet. Im Briefing kann es kostenlos ab-/angewählt werden. Kosten: 80 E; Dauer: sechs Sekunden; Schutz: 60 % Schaden für Carrier und eigene Schiffe der gewählten Lane; Cooldown: 28 Sekunden ab Aktivierung. Anzeige und kurze Schildkonturen machen den aktiven Zustand sichtbar. Pause hält Dauer und Cooldown an. Wiederholung setzt Kampfzustand und Cooldown zurück; Missionsende entfernt den Effekt. Es gibt weder Hüllenreparatur noch permanentes Forschungsupgrade.

Mission 3 schaltet die Fregatte garantiert frei. Sie kann direkt in Wiederholungen der Missionen 2–3 regulär gekauft werden, obwohl Mission 4 noch eine Vorschau ist. Dockanzeigen und Hafenstatus zeigen den Kapitelabschluss im Menü. Ausrüstung hat eine eigene Schema-Version innerhalb des isolierten Fortschritts-Speichers; alte Spielstände bleiben lesbar.

## Gezielte technische Abnahme

- Missionsentscheidungen verwenden Zerstörungsereignisse. Kampf friert bei einem beliebigen zerstörten HQ nicht vorzeitig ein. Genau ein Ergebnis; Verlust des eigenen Carriers hat Vorrang vor dem letzten gleichzeitig besiegten Angreifer.
- Verteidigung zählt nur vollständig gestartete und beseitigte Angriffe. Noch fliegende gegnerische Geschosse verhindern einen vorzeitigen Sieg. Eine Gegner-HQ-Zerstörung beendet die Verteidigung nicht.
- Erfolgreicher und abgelehnter Fähigkeitseinsatz, Kosten, eigene/feindliche Schadenswirkung, Ablauf, Pause, Wiederholung und Rückkehr geprüft. Kein dauerhafter Schildlevel.
- Freischaltung, Ausrüstungswahl, Reload, Reset und tatsächlicher Fregattenkauf geprüft.
- Ein repräsentativer Verteidigungsablauf mit normalen Käufen beendet alle drei Angriffe nach 147 Simulationssekunden: zwölf Käufe, vier legale Aegis-Auslösungen. Das belegt Abschließbarkeit, keine optimale Balance.
- Browser: echtes Ergebnis und nächste Briefings über alle drei Missionen; Ausrüstung umschalten und reloaden; Aegis per Touch auslösen und pausieren; Kapitelabschluss und gespeicherter Fortschritt. Kein Browserfehler. Sichtprüfung 360×800 und 390×844.
- 52 aktive Bilder mit Herkunftshashes; alle Classic-Runtime-/Asset-Dateien weiterhin am überprüften öffentlichen Stand ed8802b. Keine Balance-Matrix.

## Menschliche Abnahme noch offen

Kein echter Spieler-/Smartphone-Test wurde behauptet. Der offene Planpunkt bleibt offen. Besonders beobachten: Erkennt man Bomber und Eskorte? Ist die automatische Abwehrlinie verständlich? Hat Aegis einen passenden Einsatzmoment? Sind die kurzen ersten zwei Missionen ausreichend fordernd? Wünscht man sich nach Mission 3 den nächsten Einsatz?

Bulk 4–6 sind nicht umgesetzt. Das Experiment ersetzt Classic nicht. Die neue Key-Art wurde mit dem integrierten Imagegen erstellt; vollständiger Auftrag, Quelldatei und SHA-256 stehen in [generated-assets.json](../experiments/last-shipyard/provenance/generated-assets.json). Emblem, Sektorkarte, Dockanzeige und Fähigkeitseffekte sind Code-/Vektorgrafik; nur ein neues Bitmap wurde benötigt.
