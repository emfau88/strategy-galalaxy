# Die letzte Werft – Testkampagne

Version **0.0.7-v2-0**. Alle sechs gestalteten Missionen einschließlich des Schildnetz-Finales sind spielbar.

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

## Bulk 4 – Zwei Fronten und Ausrüstung

Geteilte Front begrenzt beide Lanes zusammen auf 18 eigene Schiffe. HALTEN/VORSTOSS lässt sich pro Lane wählen. Das Zeitfenster bietet eine 48-Sekunden-Aufbaupause für den Gegenstoß. Nach Mission 4 ist der Ionenbomber kostenlos auswählbar (2s Waffenunterbrechung, weniger Strukturschaden); nach Mission 5 Störimpuls (100 E, 3,5s, 32s Cooldown, nur gegnerische Schiffe der gewählten Lane). Werft speichert genau eine Fähigkeit und eine Bomber-Ausführung. [Abnahme](../../docs/LAST_SHIPYARD_BULK4_REPORT.md). Der gezielte Browserlauf für diese Inhalte lautet `node experiments/last-shipyard/scripts/browser-smoke.mjs --site --latest`.

## Bulk 5 – Schildnetz-Finale

Zwei lanegebundene Schildrelais schützen den gegnerischen Carrier. Nach dem ersten zerstörten Relais wartet die freie Lane auf die zweite Front. Nach dem zweiten fällt der Schutz und beide Flotten greifen den Carrier an. Bis zu drei regulär bezahlte Gegnerangriffe; danach kein Nachschub. Zerstörte Relais bleiben aus. Standardbomber und eine freie Fähigkeitswahl reichen aus. Kampagnenabschluss, gesicherte Werft und zwei freiwillige Finale-Abzeichen werden gespeichert. [Abnahme](../../docs/LAST_SHIPYARD_BULK5_REPORT.md). Gezielter Browserlauf: `node experiments/last-shipyard/scripts/browser-smoke.mjs --site --final`.

Die zwei Abzeichen verlangen mindestens 80% Carrier-Hülle beziehungsweise keine ausgelöste Carrier-Fähigkeit im Finale. Sie sperren keine Inhalte und können in Wiederholungen nachgeholt werden.

## V2-0 – Neue Kampagne als Kartenvorschau

Kampagne → Neue Kampagne · Kartenvorschau öffnet acht Kartenentwürfe mit eigenen Höhen, Lanes, Startpunkten, Haltepositionen, geplanten Bauplätzen und Zielen. Alle acht sind ausdrücklich Vorschauen ohne Missionsstart. Die bisherige Kampagne bleibt spielbar. Die zuletzt betrachtete Karte wird unter einem eigenen V2-Schlüssel gespeichert; Anschauen erzeugt keine Siege.

[Ausbauplan](../../docs/LAST_SHIPYARD_CAMPAIGN_EXPANSION_PLAN.md) · [Umfang und Prüfung](../../docs/LAST_SHIPYARD_V2_0_REPORT.md). Bau, Forschung und neue Missionsabläufe folgen ab V2-1. Noch keine neuen Imagegen-Assets.

Gezielter Browserablauf ohne weitere Kampagnen-Durchläufe: `npm --prefix experiments/last-shipyard run test:foundation:browser`. Für das gemeinsame Artefakt: `node experiments/last-shipyard/scripts/browser-smoke.mjs --site --foundation`.
