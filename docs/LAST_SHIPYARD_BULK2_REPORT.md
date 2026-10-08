# Bulk 2 – Werft und erste zwei Missionen

Stand: 8. Oktober 2026. Version: 0.0.3-bulk2. Umsetzung abgeschlossen; Veröffentlichung erfolgt mit diesem Commit über den zentralen Pages-Workflow.

- Eigenes hochwertiges Werftmotiv mit Oblique-Perspektive, Vektoremblem und sechs Positionen auf der Sektorkarte. Unfertige Einsätze sind als Vorschau bezeichnet.
- Erstkontakt: kleine Scout-/Fighter-Blockade, Hinweise nach tatsächlich getätigten Käufen, Einführung und angekündigte Angriffe mit Aufbaupausen.
- Schwerer Widerstand: Bomber mit Eskorte gegen einen Verband aus einer Fregatte und zwei Fightern. Beide Seiten haben getrennte und im Briefing sichtbare Arsenale, Kapazitäten und Ressourcen.
- Gegner verwenden normale Kaufbefehle. Kapazitäts-, Energie- oder Cooldown-Ablehnung erzeugt keine Abbuchung oder erzwungenen Spawn.
- FLOTTE öffnet zulässige Käufe. ZUR FRONT findet aktive eigene Schiffe. Unbenutzbare Forschung wird nicht angeboten.
- Der tatsächliche Sieg zeigt den gesicherten Bauplan und führt zum nächsten Briefing. Bomber werden nach Mission 1 verfügbar. Aegis ist nach Mission 2 angekündigt, in dieser Version noch nicht ausrüstbar.

## Gezielte Abnahme

Isolation, alle 52 aktiven Bildhashes (51 importiert + eine generierte Key-Art), Versions- und Speichertrennung bestanden. Der gemeinsame Build erhält sämtliche Classic-Dateien; 85 Runtime-/Asset-Dateien entsprechen der veröffentlichten Baseline ed8802b. Browsercheck: Touch-Menü, Kauf, Pause, Rückkehr, Reload, eigener Reset und Classic danach; keine Browserfehler. Sichtprüfung 360×800 und 390×844, Menü und Briefing lesbar.

Genau ein repräsentativer regulärer Kaufablauf pro Mission erreicht den Sieg: Mission 1 in 69, Mission 2 in 82 Simulationssekunden. Das belegt Abschließbarkeit, keine ausgewogene Spielzeit oder menschliche Verständlichkeit. Keine Balance-Matrix. Der Browser überprüft zusätzlich den Ergebnis-/Weiter-Ablauf und den gespeicherten Bauplan.

## Grenzen

Die Zahlen sind Startwerte; die beiden optimal eingekauften technischen Durchläufe sind kürzer als das langfristige Ziel von drei bis sechs Minuten. Menschliche Spielbeobachtung soll über Druck und Länge entscheiden. Die Werft hat zunächst Statusanzeigen über einem gemeinsamen Motiv; ein eigenes Ausrüstungsmenü folgt später. Missionen 3–6 sind noch Vorschauen. Die eigenständige Verteidigungsbedingung und Aegis folgen in Bulk 3.

## Veröffentlichung bestätigt

Commit 3510995 wurde am 8. Oktober 2026 separat auf main und codex/last-shipyard gepusht. [Pages-Run 37821796443](https://github.com/emfau88/strategy-galalaxy/actions/runs/37821796443) erfolgreich. Beide öffentlichen Fassungen haben den Browser-Smoke bestanden; Menü, Kauf, Pause, Rückkehr, Reload und Speichertrennung funktionieren am tatsächlichen Play-Link.
