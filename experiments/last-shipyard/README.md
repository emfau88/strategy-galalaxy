# Die letzte Werft – Testkampagne

Version **0.0.4-bulk3**. Kapitel 1 ist mit drei Missionen spielbar: Erstkontakt, Schwerer Widerstand und Hafen im Feuer. Missionen 4–6 sind klar bezeichnete Vorschauen.

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

Der Browsercheck benötigt lokal Chrome oder Edge, verwendet ein eigenes temporäres Profil und prüft einen kurzen Start-/Kauf-/Pause-/Rückkehrablauf sowie Speicher- und Pfadtrennung unter dem veröffentlichten Unterpfad. Screenshots liegen im ignorierten tmp/. Keine Balance-Matrix.

## Gemeinsame Pages-Fassung

[Die letzte Werft spielen](https://emfau88.github.io/strategy-galalaxy/experiments/last-shipyard/) · [Classic spielen](https://emfau88.github.io/strategy-galalaxy/). Ein zentraler Pages-Workflow veröffentlicht beide Fassungen ausschließlich von main. Die öffentliche Abnahme wird im [Bulk-1-Bericht](../../docs/LAST_SHIPYARD_BULK1_REPORT.md) festgehalten.

Im Repository:

```powershell
npm run build:pages
npm run test:site
npm run test:site:browser
npm run preview
```

Die gemeinsame Vorschau läuft auf http://127.0.0.1:7102/strategy-galalaxy/ und deren Unterpfad experiments/last-shipyard/. Direktaufruf und fehlender abschließender Slash funktionieren. Der Einzelbuild des Experiments schreibt in einen eigenen temporären Ordner; der gemeinsame Build enthält die unveränderte Classic-Ausgabe plus Experiment.

## Bulk 2

Zwei gestaltete Angriffsmissionen: Erstkontakt (Scout/Fighter) und Schwerer Widerstand (Bomber mit Eskorte gegen Fregatten). Ein Sieg öffnet den nächsten Einsatz und sichert den Bauplan. Missionen 3–6 sind klar bezeichnete Vorschauen. FLOTTE öffnet Käufe, ZUR FRONT findet deine vordersten Schiffe. Gegner kaufen nur im angekündigten Angriffsfenster, mit eigenen im Briefing sichtbaren Budgets. [Abnahme](../../docs/LAST_SHIPYARD_BULK2_REPORT.md).

## Bulk 3 – Hafenverteidigung

Drei angekündigte Angriffe vollständig abwehren; eigene Carrier-Zerstörung bedeutet Niederlage. Die Flotte hält automatisch eine sichtbare Abwehrlinie. Aegis wird nach Mission 2 ausgerüstet und kann im Briefing kostenlos ab-/angewählt werden. 80 E, sechs Sekunden Schutz, 60 % Schadensminderung, 28 Sekunden Cooldown; betrifft Carrier und eigene Flotte der gewählten Lane. Kein permanentes Schild-Upgrade. Nach Mission 3 stehen Fregatten in Wiederholungen der Missionen 2–3 bereit. Ausrüstung und Fortschritt bleiben erhalten. [Abnahme und offene menschliche Spielbeobachtung](../../docs/LAST_SHIPYARD_BULK3_REPORT.md).
