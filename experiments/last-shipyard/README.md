# Die letzte Werft – Testkampagne

Version **0.0.10-opening-quality**. Fokus: drei überarbeitete Missionen mit direkter Kampfbedienung, ruhiger Darstellung und aktiver Unterstützung. Weitere Entwicklung von M4–M8 ist ausgesetzt; bisherige Inhalte und Siege bleiben erhalten. [Qualitätsauftrag](../../docs/FIRST_THREE_QUALITY_CONTRACT.md) · [Umsetzungsbericht mit Bildern](../../docs/FIRST_THREE_QUALITY_REPORT.md).

## Lokal spielen

Im aktuellen Repository-Stand:

```powershell
npm --prefix experiments/last-shipyard run dev
```

Öffne http://127.0.0.1:7101/ → Den Hafen zurückerobern → Ein Licht im Schrott → Einsatz starten. Keine Installation zusätzlicher Pakete erforderlich. Der Server liefert ausschließlich diesen Experimentordner. Falls Port 7101 belegt ist: PORT=7102 als Umgebungsvariable setzen.

Eigene Speicherstände und Soundeinstellungen; kein Import aus Classic. [Produktvorgabe](EXPERIMENT_VISION.md), [Herkunft](BASELINE.md), [Plan](../../docs/LAST_SHIPYARD_EXPERIMENT_PLAN.md).

## Gezielte Prüfung

```powershell
npm --prefix experiments/last-shipyard run check
npm --prefix experiments/last-shipyard run test:quality:browser
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

## Historische Ausbaustände

Die folgenden Abschnitte beschreiben die jeweils damalige Lieferung. Für den heutigen Einstieg gelten der oben verlinkte Qualitätsauftrag und Bericht.

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

Historischer Umfang von V2-0; inzwischen sind vier Einsätze verbunden spielbar (V2-2, siehe unten).

Kampagne → Neue Kampagne · Kartenvorschau öffnet acht Kartenentwürfe mit eigenen Höhen, Lanes, Startpunkten, Haltepositionen, geplanten Bauplätzen und Zielen. Alle acht sind ausdrücklich Vorschauen ohne Missionsstart. Die bisherige Kampagne bleibt spielbar. Die zuletzt betrachtete Karte wird unter einem eigenen V2-Schlüssel gespeichert; Anschauen erzeugt keine Siege.

[Ausbauplan](../../docs/LAST_SHIPYARD_CAMPAIGN_EXPANSION_PLAN.md) · [Umfang und Prüfung](../../docs/LAST_SHIPYARD_V2_0_REPORT.md). Bau, Forschung und neue Missionsabläufe folgen ab V2-1. Noch keine neuen Imagegen-Assets.

Gezielter Browserablauf ohne weitere Kampagnen-Durchläufe: `npm --prefix experiments/last-shipyard run test:foundation:browser`. Für das gemeinsame Artefakt: `node experiments/last-shipyard/scripts/browser-smoke.mjs --site --foundation`.

## V2-1 – Außenposten und Fähre spielen

Historischer Umfang von V2-1. Seit V2-2 unter „Freie Tests“ erreichbar; der Aegis-Schutz umfasst inzwischen auch relevante Missionsanlagen.

**Kampagne → Neue Kampagne · 2 Testeinsätze → Der erste Außenposten / Die letzte Fähre → Testeinsatz starten.** Keine Freischaltung der alten Missionen nötig.

- **Außenposten:** Scout/Fighter kaufen, Relais besetzen, zwei angekündigte Rückeroberungsangriffe abwehren. Ein eigener Bauplatz bietet eine optionale Bastion (140 E, 8s Bauzeit). Am Ende eigene Besatzung und sichere Relaiskontrolle nötig.
- **Fähre:** Links Sprungstation, rechts Carrier-Front. Drei Ladungen direkt an der Station einzeln starten (je 120 E, 16s). Mindestens ein gekaufter eigener Scout/Fighter/Bomber im Stationsbereich, kein Gegner. Feindkontakt oder fehlende Besatzung pausiert den bezahlten Fortschritt. Station oder Carrier verloren bedeutet Niederlage.
- **Bedienung:** Station/Bauplatz antippen oder die beschrifteten Kameratasten verwenden. Es ist jeweils ein Kontextfeld oder das Flottenmenü offen. Flotten halten automatisch an den jeweiligen Linien. Bau und Ladung pausieren mit dem Spiel.
- **Vorgaben:** Außenposten 300 E, +10 E/s, 12 Flottenplätze; Fähre 340 E, +12 E/s, 10 pro Lane/16 gesamt, Aegis als Startausrüstung. Höchstens zwei lebende kostenlose Drones pro Lane. Aegis schützt in diesem Bulk Carrier und Schiffe, noch keine Anlagen.
- **Umfang:** Zwei separat gespeicherte Abschlüsse, sechs weitere Vorschauen. Forschung, neue Bauplan-Freischaltungen, endgültige Stationsbilder und der zusammenhängende Verlauf folgen. Menschliche Spielbeobachtung bleibt der nächste Entscheidungspunkt.

[Aktuelle Checkliste](../../docs/LAST_SHIPYARD_CAMPAIGN_EXPANSION_PLAN.md) · [V2-1-Bericht](../../docs/LAST_SHIPYARD_V2_1_REPORT.md). Gezielter Browserablauf: `node experiments/last-shipyard/scripts/browser-smoke.mjs --site --pilots` nach `npm run build:pages`; mit `--live --pilots` gegen die öffentliche Fassung.

## V2-2 – Der erste Akt

**Kampagne → Neue Kampagne · Akt I spielen → Kampagne.** Vier Siege öffnen den Lernpfad in Reihenfolge:

1. **Ein Licht im Schrott:** Kurzer Durchbruch mit Scout/Fighter. Belohnung: Bastion.
2. **Der erste Außenposten:** Relais erobern, optional eine Bastion bauen, zwei Gegenangriffe abwehren. Belohnung: Bomber.
3. **Hafen im Feuer:** Dock und Carrier gegen drei Angriffe halten (leichte Schiffe, schwere Eskorte, Bomber). Zwei Bauplätze erlauben eine vordere oder hintere Investition. Belohnung: Aegis und sichtbarer Hafenbetrieb.
4. **Die letzte Fähre:** Zwei Fronten und drei bezahlte Rettungsladungen. Aegis schützt Carrier sowie Schiffe und Missionsanlage der gewählten Lane. Belohnung: Fregatten-Bauplan für kommende Einsätze.

Wiederholungen behalten die Ausrüstung ihrer Lernstufe. M5–8 und Forschung sind Vorschauen. Die freien Tests M2/M4 bleiben ohne Kampagnenfreischaltung startbar. Testsiege und Kampagnensiege werden getrennt gespeichert; vorhandene V2-1-Siege wandern in die Testliste. Classic und die bisherige Kampagne behalten ihre Speicherstände. Ein neuer Imagegen-Atlas zeigt Hafendock und Sprungstation.

[Umsetzungsbericht](../../docs/LAST_SHIPYARD_V2_2_REPORT.md) · [Aktuelle Checkliste](../../docs/LAST_SHIPYARD_CAMPAIGN_EXPANSION_PLAN.md) · [Asset-Herkunft und Prompt](provenance/GENERATED_ASSETS.md). Gezielter Browserablauf nach dem Build: `node experiments/last-shipyard/scripts/browser-smoke.mjs --site --act-one`; öffentliche Fassung: `--live --act-one`. Menschliche Spielbeobachtung und echte Smartphone-Abnahme bleiben offen.
