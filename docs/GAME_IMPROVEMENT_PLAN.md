# Plan: Aus Strategy Galalaxy ein besseres Spiel machen

Stand: 7. Oktober 2026. Der Nutzer hat die Reihenfolge ausdrücklich auf **Kampagne zuerst** geändert. Das erste Paket ist lokal umgesetzt; Missionen 2–6, neue Fähigkeiten und die endgültige Balance folgen später.

Das Ziel: Eine Flottenschlacht auf dem Smartphone verstehen, gezielt Verstärkung schicken und die Wirkung erkennen. Die Kampagne führt neue Entscheidungen schrittweise ein. Schiffsmengen, verfügbare Klassen, Upgrades und Gegnerverhalten werden pro Mission dosiert.

Ausgangspunkt ist der geprüfte Stand `e4761e2` auf `codex/quality-recovery`, der selektiv auf der alten GitHub-Basis aufbaut. Frühere lokale Arbeit bleibt gesichert. Der [Qualitätsbericht](QUALITY_RECOVERY_REPORT.md) dokumentiert diese Wiederaufnahme.

## 1. Ein spielbares Kampagnengerüst

**Bereits umgesetzt:**

- [x] Hauptmenü mit Kampagne, freiem Gefecht und Sound-Einstellung.
- [x] Eigene ruhige Menüszene ohne Levelhintergrund oder Schlachtobjekte.
- [x] Missionsauswahl mit drei Einträgen. Nur „Erstkontakt“ ist spielbar; die weiteren Einträge sind ausdrücklich Vorschauen.
- [x] Kurzes Briefing mit Ziel, verfügbaren Klassen und Regeln.
- [x] Mission 1 mit einer Lane, Scout und Fighter, zunächst ohne Forschung.
- [x] Eigene Missionsdaten für Flottenlimit, Einkommen, Waves, Carrier und Gegner-Taktung.
- [x] Sieg, Niederlage, Wiederholen, Pause und Rückkehr zur Missionswahl.
- [x] Lokal gespeicherter Abschluss. Ein Abbruch oder eine Niederlage schaltet nichts frei.

**Was du merkst:** Du startest einen konkreten Einsatz statt direkt in einer unübersichtlichen Vollversion zu landen. Erstkontakt verwendet vorläufig zwölf Schiffe je Seite und höchstens eine ausstehende kostenlose Wave. Das freie Gefecht behält seine bisherigen Werte.

Der [Paketbericht](CAMPAIGN_FIRST_SLICE.md) beschreibt Funktionen und Grenzen. Die Zahlen sind ein Ausgangspunkt für die spätere Missionsgestaltung, keine endgültige Balance. Keine weiteren groß angelegten Balanceversuche vor dem nächsten inhaltlichen Umbau.

## 2. Hauptmenü gestalterisch fertigstellen

**Maßnahmen:**

- [ ] Ein eigenes Hintergrundmotiv als ruhige Weltraum-Key-Art gestalten: Raumstation und angedockter Carrier, freie Flächen für Titel und Navigation.
- [ ] Ein klares Flottenemblem und einen scharfen Vektor-Schriftzug entwickeln.
- [ ] Typografie, Abstände, Buttonzustände und Bildausschnitt auf kleinen und langen Bildschirmen abstimmen.

**Fertig, wenn:** Das Menü wirkt wie der Einstieg eines eigenständigen Spiels, ist gut lesbar und unterscheidet sich deutlich von den Levels. Kein Text und keine Buttons werden in das Hintergrundbild eingebrannt. Die [Asset-Empfehlung](MENU_ART_DIRECTION.md) legt die Richtung fest; neue Rasterbilder sind noch nicht generiert.

## 3. Erstkontakt als gute Einstiegsmission gestalten

**Maßnahmen:**

- [ ] Eine klare Eröffnung festlegen: Front beobachten, Scout schicken, Fighter ergänzen und die Wirkung sehen.
- [ ] Hinweise an die passende Situation binden. Bereits verstandene Schritte müssen nicht ständig erklärt werden.
- [ ] Während des Spielens entscheiden, ob zwölf Schiffe je Seite zu viel oder zu wenig sind. Sichtbare Überlappung und blockierte Käufe sind dabei aussagekräftiger als die Gesamtzahl allein.
- [ ] Gegnerschwerpunkte und Kaufzeitpunkte so gestalten, dass Spieler reagieren können. Kosten und Deployment-Regeln gelten weiterhin für beide Seiten.
- [ ] Matchdauer, Schwierigkeit und Carrier-Lebenspunkte erst nach dieser Gestaltung abstimmen. Drei bis fünf Minuten dienen als erste Orientierung, ohne erzwungenes Matchende.

**Fertig, wenn:** Neue Spieler verstehen Ziel, Kaufen und Verstärkungswirkung. Sieg und Niederlage sind nachvollziehbar. Zuerst prüfen wir den tatsächlichen Ablauf; flächendeckende Balance-Matrizen kommen erst bei stabilen Missionsregeln.

## 4. Zwei unterschiedliche Folgemissionen bauen

**Mission 2 – Schwerer Widerstand:** Bomber und schwere Gegner einführen. Der Bomber braucht eine Eskorte; einfach mehr Fighter zu kaufen soll nicht jede Situation lösen.

**Mission 3 – Geteilte Front:** Zwei Lanes mit verschiedenen Schwerpunkten. Der Spieler entscheidet, wo Verstärkung wichtiger ist. Das Menü zeigt die Lane-Wahl eindeutig.

**Maßnahmen:**

- [ ] Jede Mission erhält eigene Schiffsmengen, Klassen, Economy, Waves und einen verständlichen Gegnerplan.
- [ ] Forschung schrittweise einführen, sobald daraus eine sinnvolle Entscheidung entsteht. Keine zusätzlichen Währungen und keine dauerhaften Schadensboni durch wiederholtes Spielen.
- [ ] Freischaltungen, Briefings und Ergebnisse mit den tatsächlichen Regeln verbinden.

**Fertig, wenn:** Drei Einsätze unterschiedliche Entscheidungen lehren. Ein Sieg schaltet den nächsten tatsächlich spielbaren Einsatz frei. Vorschauen werden erst ersetzt, wenn ihr Inhalt fertig ist.

## 5. Lesbarkeit und Bedienung anhand dieser Missionen verbessern

**Maßnahmen:**

- [ ] Hüllenüberlappung dort beheben, wo sie im normalen Missionsverlauf stört.
- [ ] Bei offener Kaufkonsole genug Front sichtbar lassen; eine kompakte Kaufleiste nur einführen, wenn sie hilft.
- [ ] Einen verständlichen Frontsprung und Warnungen bei Carrier-Gefahr erproben.
- [ ] Treffer, Verluste, Klassenrollen und Sperrgründe lesbar halten. Kosten werden bei einem abgelehnten Kauf weiterhin nicht abgezogen.

**Fertig, wenn:** Man erkennt die entscheidende Szene und kann handeln, ohne sie zu verlieren. Sicherheitsbudgets bleiben Grenzen für Ausnahmefälle, keine gewünschte Flottenmenge.

## 6. Mit Menschen und echten Smartphones abnehmen

- [ ] Zwei Personen ohne Projekterfahrung spielen lassen: Verstehen sie Kaufgrund, Klassenrolle und Ergebnis?
- [ ] Ein schwächeres und ein leistungsfähigeres Smartphone prüfen, einschließlich längerer Sessions.
- [ ] Laden, Bedienung, Stocker und Erwärmung dokumentieren und beobachtete Probleme gezielt beheben.

Desktop-Browser mit emulierten Bildschirmgrößen ersetzen diese Abnahme nicht. Der Kern-Meilenstein A bleibt bis dahin offen; siehe [Geräteabnahme](DEVICE_ACCEPTANCE.md).

## 7. Danach Carrier-Fähigkeit und weitere Missionen

Erst wenn die Grundlagen überzeugen, erproben wir **eine** Carrier-Fähigkeit mit Energieverbrauch, langem Cooldown, sichtbarer Ankündigung und einer echten Gegenmöglichkeit. Sie darf die Flotte nicht ersetzen.

Danach folgen gezielt weitere Einsätze: einen frühen Angriff abwehren, Forschung gegen sofortige Verstärkung abwägen und schließlich das Carrier-Duell. Auf sechs Missionen erweitern wir erst, wenn die ersten drei tragen.

Multiplayer, neue Ressourcen, große Forschungsbäume, zusätzliche Gebäude, viele neue Schiffsklassen und umfangreiche Storysequenzen bleiben zurückgestellt. Veröffentlichung ist ein eigener Schritt.

## Der nächste konkrete Schritt

Das Menü-Artwork auswählen und anschließend Erstkontakt inhaltlich gestalten. Die aktuelle Mission liefert das funktionierende Gerüst. Ihre Schiffszahl und Balance werden dabei angepasst; wir optimieren sie nicht vorab mit immer neuen Simulationen.
