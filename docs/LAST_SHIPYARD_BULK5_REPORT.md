# Bulk 5 – Schildrelais und Kampagnenfinale

Stand: 8. Oktober 2026. Version 0.0.6-bulk5. **Umgesetzt und gezielt lokal geprüft.** Separater Commit und Veröffentlichung über den gemeinsamen Pages-Workflow.

## Spielbarer Abschluss

Das Schildnetz ist die sechste gestaltete Mission. Ein Schildrelais pro Lane schützt den gegnerischen Carrier; ein einziges lebendes Relais genügt für vollständigen Schutz. Schiffe wählen nur erreichbare Ziele ihrer Lane. Nach einem zerstörten Relais wartet diese Lane am Sammelpunkt, während der Spieler die andere Front öffnet. Der Carrier wird erst nach beiden Relais regulär angegriffen und beschädigt. Relais bleiben nach Zerstörung ausgeschaltet; nur ein Missionsneustart stellt sie wieder her.

Die Mission bietet höchstens drei angekündigte, regulär bezahlte Angriffe, danach keinen neuen Gegnernachschub. Energie-/Kaufregeln und ein Gesamtlimit von 18 eigenen Schiffen bleiben erhalten. Es gibt keine zusätzlichen Forschungsstufen oder Pflicht zur Ionenvariante beziehungsweise zu einer bestimmten Carrier-Fähigkeit.

Relaiszahl, geschützter Carrier, Übergang zur verwundbaren Phase und Ende des Nachschubs sind sichtbar. Das eigene Carrier-Ende hat bei einem gleichzeitigen Sieg weiterhin Vorrang. Ein Sieg speichert die Kampagne einmalig und zeigt die gesicherte Werft. Wiederholen kann zwei freiwillige Abzeichen ergänzen: mindestens 80% eigene Carrier-Hülle; Finale ohne ausgelöste Carrier-Fähigkeit. Abzeichen öffnen keine Pflichtinhalte.

## Neues Bild

Ein transparentes, orthografisches Relais-Atlasbild mit aktivem und ausgeschaltetem Zustand wurde mit dem integrierten Imagegen erzeugt und unverändert integriert. Die Runtime zeichnet die jeweilige Bildhälfte. [Gespeichertes Asset](../experiments/last-shipyard/assets/campaign/shield-relay-atlas-v1.png) · [Vollständiger Prompt, Quelle und SHA-256](../experiments/last-shipyard/provenance/generated-assets.json). Ein neues Bild in diesem Auftrag; der Rahmen von maximal 15 wird eingehalten. Menü-Key-Art aus Bulk 2 bleibt genutzt; weitere Bilder waren für diese Bulks nicht erforderlich.

## Gezielte technische Abnahme

- Zwei, ein und kein aktives Relais: voller Schutz, keine versehentliche Hüllenschädigung, korrekte Zielwahl und freier Carrier-Angriff nach Schildbruch.
- Bereits freie Lane wartet und greift weiter an, sobald beide Relais aus sind. Keine Zielwahl zum Relais der falschen Lane.
- Begrenzter Nachschub, Verlustpriorität, Missionsneustart und einmaliger Abschluss geprüft.
- Abzeichengrenzen, spätere Ergänzung beim Wiederholen, Reload und eigener Reset geprüft.
- Ein repräsentativer regulärer Kaufablauf mit Standardbombern ohne Fähigkeit: Sieg nach 111 Simulationssekunden / 13 Käufen; Relais bei 44 und 53 Sekunden; Sieg während des zweiten Angriffs. Das ist ein günstiger technischer Durchlauf, kein Nachweis ausgewogener Schwierigkeit.
- Browser unter dem gebauten Pages-Unterpfad: echtes Finalergebnis über legale Käufe, sichtbare Relaiszustände und Schildbruch, Abschluss, Wiederholen, gespeicherter Verlauf und Abzeichen nach Reload. Keine Browserfehler. Frühere fünf Abschlüsse werden dabei als Testvoraussetzung gesetzt; kein vollständiger menschlicher Kampagnendurchlauf wird behauptet.
- PNG-Alpha im Browser geprüft; Screenshots bei 360×800 und 390×844 geprüft. Keine Überlappung in den betrachteten Menü-/Finaleansichten.
- 53 Bildhashes validiert; 51 importierte Bilder bytegleich. Gemeinsamer Build und Unterpfadtest erhalten Classic am geprüften öffentlichen Baseline-Commit ed8802b.

## Offen

Bulk 6, echter Smartphone-Test und Ersttest mit ein bis zwei Personen sind offen. Besonders zu beurteilen: Dauer und Schwierigkeit der neuen Missionen, Verständlichkeit des Wartens in einer freien Lane, sinnvoller Einsatz von Störimpuls und tatsächlicher Wiederspielwert der Abzeichen. Keine Balance-Testserie durchgeführt, keine abschließende Spielqualitäts-Abnahme behauptet.
