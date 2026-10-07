# Die letzte Werft – Testkampagne

Version **0.0.1-bulk0**. Aktuell spielbar: die vorläufige Mission 1 „Erstkontakt“. Missionen 2–3 sind übernommene Vorschauen. Der sechs Missionen umfassende neue Kampagnenbogen wird schrittweise gebaut.

## Lokal spielen

Im Repository des Branches codex/last-shipyard:

```powershell
npm --prefix experiments/last-shipyard run dev
```

Öffne http://127.0.0.1:7101/ → Kampagne starten → Erstkontakt → Mission starten. Keine Installation zusätzlicher Pakete erforderlich. Der Server liefert ausschließlich diesen Experimentordner. Falls Port 7101 belegt ist: PORT=7102 als Umgebungsvariable setzen.

Eigene Speicherstände und Soundeinstellungen; kein Import aus Classic. [Produktvorgabe](EXPERIMENT_VISION.md), [Herkunft](BASELINE.md), [Plan](../../docs/LAST_SHIPYARD_EXPERIMENT_PLAN.md).

## Gezielte Prüfung

```powershell
npm --prefix experiments/last-shipyard run check
npm --prefix experiments/last-shipyard run test:browser
```

Der Browsercheck benötigt lokal Chrome oder Edge, verwendet ein eigenes temporäres Profil und prüft einen kurzen Start-/Kauf-/Pause-/Rückkehrablauf sowie Speicher- und Pfadtrennung unter dem zukünftigen Unterpfad. Screenshots liegen im ignorierten tmp/. Keine Balance-Matrix.

## Veröffentlichung

Der öffentliche Testlink folgt in Bulk 1 zusammen mit dem gemeinsamen Pages-Build und dem GitHub-README-Eintrag. Diese lokale Fassung wurde noch nicht veröffentlicht.
