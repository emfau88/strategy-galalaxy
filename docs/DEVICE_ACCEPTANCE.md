# Reale Geräte- und Spielerabnahme

Stand: 7. Oktober 2026. Arbeitsbranch: `codex/quality-recovery`. Diese Abnahme steht aus; Desktop-Chrome mit emulierten Viewports ersetzt sie nicht.

## Geprüftes Spiel bereitstellen

Im Projektverzeichnis:

```powershell
npm.cmd run build:pages
npm.cmd run preview
```

Auf dem PC öffnet `http://127.0.0.1:7100/` das gebaute Spiel. Für ein Smartphone im gleichen WLAN den Server beenden und ausdrücklich im lokalen Netz starten:

```powershell
npm.cmd run preview -- --host 0.0.0.0
```

Auf dem Smartphone `http://<WLAN-IP-des-PCs>:7100/` öffnen. Die IPv4-Adresse steht in den Windows-Einstellungen der WLAN-Verbindung. Falls Windows nach Netzwerkzugriff fragt, das verwendete private WLAN wählen. Die Vorschau liefert ausschließlich `dist/`, keine Git-Historie oder Referenzdateien. Nach der Prüfung den Server mit `Ctrl+C` beenden. Fullscreen und Haptik hängen zusätzlich vom jeweiligen Browser ab.

## Umfang und Protokoll

Ein schwächeres und ein leistungsfähigeres reales Smartphone verwenden. Je Gerät beide Karten und mindestens eine 20-minütige Session prüfen. Einen kalten Start mit leerem Browsercache separat messen. Gerät, Betriebssystem, Browser, Bildschirmgröße und WLAN festhalten. Ladezeit, beobachtete Stocker, Speichertrend und Erwärmung jeweils zu Beginn und nach längerem Spiel dokumentieren; nicht gemessene Werte ausdrücklich als offen markieren.

| Gerät / OS / Browser | Viewport | Kalter Start | Frame-Messmethode / Mittel / p95 | Speicher Anfang / Ende | Beobachtung nach 20 Minuten |
| --- | --- | --- | --- | --- | --- |
| Schwächeres Gerät: offen | offen | offen | offen | offen | offen |
| Referenzgerät: offen | offen | offen | offen | offen | offen |

Das Ziel auf dem festgelegten Referenzgerät ist 60 FPS mit p95 der gesamten Frame-Arbeitszeit möglichst unter 16,7 ms. Browser-Frameabstände und isolierte Renderzeit sind getrennte Messgrößen. Eine 30-FPS-Untergrenze auf dem schwächeren Gerät erfordert eine dokumentierte Entscheidung. Die bisherigen Desktop-Messungen bestätigen dieses Geräte-Ziel noch nicht.

## Spielszenen

1. Ohne Diagnoseparameter starten. Level und Schwierigkeit wählen; erklären können, dass bezahlte Verstärkung sofort startet und kostenlose Wellen unabhängig laufen.
2. Auf beiden Karten zuerst gemischte Wings kaufen. Lane wechseln, Energiefehlbetrag und Cooldown unterscheiden, Konsole öffnen/schließen, Upgrades kaufen und sichtbare Wirkung beobachten. Alle Wing-Mitglieder müssen spätestens nach 1,5 Sekunden starten.
3. Mit Handhaltung und Daumen spielen: Carrier-/Dock-Tap, Fleet/Upgrade-Tabs, Lane-Wahl, Pause, Fortsetzen, Restart, Main Menu und Kamera prüfen. Käufe dürfen die Kamera nicht versetzen. Offscreen-Ereignisse über den Navigator wiederfinden.
4. Frühen Flottendruck, frühe Economy und Forschung vergleichen. Spielende auf beiden Karten erreichen; Dauer und gewählte Käufe festhalten. Die getestete Economy-Partie von knapp zehn Minuten ist ausdrücklich auf Spielbarkeit zu bewerten.
5. Bei frühen, gemischten und dichten Kämpfen Fraktion, Schiffsklasse, Schütze, Ziel, Treffer und Verlust benennen. Die automatische 112-Schiff-Extremszene zeigt weiterhin starke Hüllenstapel; flüssige Darstellung allein ist dafür kein Bestehen der Lesbarkeitsprüfung.
6. Mindestens zwei Personen ohne Projekterfahrung beobachten: eine begründete Verstärkung wählen und danach deren Wirkung erklären lassen. Verständnisprobleme und verdeckte Schaltflächen protokollieren, anschließend nur die betroffenen Szenen erneut prüfen.

## Abschlusskriterium

Meilenstein A bleibt offen, bis beide realen Geräte und die Spielerbeobachtung dokumentiert sind und verbleibende Kampf-/Bedienungsprobleme bewertet und behoben wurden. Fehler bei Kaufen, Laden, Kampf oder Matchende verhindern die Abnahme. Neue Gameplay-Systeme aus Bulk 6 beginnen erst danach. Einzelne grüne Browser- oder Simulationstests schließen diesen Meilenstein nicht ab.
