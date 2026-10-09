# Die letzte Werft – eine Kampagne mit eigenständigen Missionen

Stand: 9. Oktober 2026. **Status: V2-0 abgeschlossen. V2-1 technisch umgesetzt: Außenposten und Fähre sind separat spielbar; sechs weitere Einsätze bleiben Vorschauen. Menschliche Spielbeobachtung zu V2-1 noch offen.** [Bericht und Prüfungen zu V2-1](LAST_SHIPYARD_V2_1_REPORT.md).

Grundlage ist die tatsächlich gelesene Experiment-Fassung auf Commit `0dcb353`, einschließlich Missionsdaten, Simulation, Zielauswahl, Eroberung, Energie, Ausrüstung und Darstellung. Hinzu kommen die [Core Vision](../STRATEGY_GALALAXY_CORE_VISION.md), der [bisherige Experimentplan](LAST_SHIPYARD_EXPERIMENT_PLAN.md) und der [ursprüngliche Verbesserungsplan im erhaltenen Qualitätsbranch](https://github.com/emfau88/strategy-galalaxy/blob/d286e1341362cecb977aec90f78e87bbf93e9d31/docs/GAME_IMPROVEMENT_PLAN.md). Für diese Planung wurden keine weiteren Balance-Testserien durchgeführt.

Dieses Dokument beschreibt die nächste Ausbaureihe **innerhalb von `experiments/last-shipyard/`**. Es ersetzt keine erledigten Checklisten rückwirkend. Die bisherigen sechs Missionen bleiben der dokumentierte Ausgangspunkt; die nächste Fassung erhält acht neu gestaltete Einsätze. Diese Erweiterung des Umfangs ist eine bewusste Empfehlung für die jetzt gewünschte Kampagnenvielfalt. V2-0 und die technische Umsetzung von V2-1 sind geliefert; V2-2 bis V2-6 bleiben offen.

## 1. Meine Empfehlung

**Wir machen aus „Die letzte Werft“ eine Kampagne über den Wiederaufbau eines belagerten Heimathafens.** Du sicherst Infrastruktur, rettest die Besatzung, erprobst Technik und brichst schließlich die Blockade. Nach jedem Einsatz wird in der Werft sichtbar, wofür du gekämpft hast.

Der vertraute Flottenkampf bleibt der Kern. Dazu kommen drei überschaubare Entscheidungen:

- **Wo investiere ich?** Sofort weitere Schiffe schicken oder einen festen Bauplatz ausrüsten?
- **Wann investiere ich?** Jetzt Energie in Rettung oder Forschung geben oder erst einen Angriff abfangen?
- **Was ist für diesen Auftrag wichtig?** Ein Gebiet halten, ein Ziel schnell ausschalten oder zwei Fronten gleichzeitig bedienen?

Das ist die gewünschte Richtung zwischen reinem Flottenkauf und einem großen RTS: wenige bedeutende Anlagen, automatisch kämpfende Schiffe und verständliche Einsatzziele. Auf einem Smartphone müssen diese Entscheidungen mit wenigen Eingaben funktionieren.

**Der erste Schritt ist ein spielbarer Vergleich aus zwei sehr unterschiedlichen Missionen:** Außenpostenbau und Evakuierung. Erst wenn sich diese wirklich unterschiedlich spielen, gestalten wir die gesamte Kampagne aus.

## 2. Was der vorhandene Stand hergibt

| Bereich | Tatsächlich vorhanden | Konsequenz für den Ausbau |
| --- | --- | --- |
| Kampagne | Menü, Briefings, sechs Missionen, Abschlüsse und eigener Speicherstand | Einstieg und Fortschritt können weiterentwickelt werden. |
| Karten | Zwei Layouts; beide `420 × 1180`; eine oder zwei Lanes | Acht Missionen benötigen acht eigene Layoutdefinitionen. Hintergrundwechsel allein genügt nicht. |
| Kampf | Sofortkäufe, kontinuierliche Energie, vier Kaufklassen, kleine Drone-Waves | Der Kampf wird weiterverwendet. Neue Schiffsklassen sind für diese Kampagne zunächst unnötig. |
| Missionsablauf | Angekündigte Angriffe, Pausen, Verteidigung und Schildrelais-Finale | Gute Grundlage für unterschiedliche Abläufe; zusätzliche Ziele und ereignisabhängige Phasen sind echte Entwicklungsarbeit. |
| Eroberung | Capture-System mit Schiffseinfluss und vorhandener Darstellung; in den aktuellen Kampagnenkarten ausgeschaltet | Als Ausgangspunkt nutzbar. Regeln für Besatzung, Unterbrechung und Missionsfortschritt müssen angepasst werden. |
| Stationen | Carrier, Geschützturm und Schildrelais als Strukturen | Stationäre Waffen sind vorhanden. Bauplätze, Bauvorgänge, Reparaturdock und andere angreifbare Missionsanlagen fehlen. |
| Forschung | Ältere unmittelbare Zahlen-Upgrades; in der Kampagne deaktiviert. Zusätzlich garantierte Baupläne und Ausrüstungswahl | Ein interessanter Forschungsauftrag entsteht nicht durch das Einschalten der alten Upgrade-Leiste. |
| Carrier | Aegis, Störimpuls und ein aktiver Fähigkeitsslot | Diese beiden Fähigkeiten reichen vorerst. Ihre Bedeutung entsteht durch passende Einsätze. |
| Bewegung und Gegner | Lane-Bewegung, HALTEN/VORSTOSS und festgelegte Kaufpläne | Keine freie Wegfindung. In Kampagnen steuert derzeit der Missionsablauf die Gegnerkäufe; eine frei planende Gegner-KI ist nicht bereits vorhanden. |

**Bewertung:** Die Grundlage ist brauchbar, aber die bisherige Vielfalt liegt stärker in Gegnerrezepten, Freischaltungen und Briefings als in räumlich und mechanisch unterschiedlichen Aufgaben. Besonders „halte eine Front“ und „nutze das Zeitfenster“ brauchen verbindliche Spielregeln, wenn sie das Spielerlebnis prägen sollen.

## 3. Klare Grenzen für den Umfang

| Entscheidung | Vorgabe für diese Ausbaureihe |
| --- | --- |
| Kampagnenumfang | Acht Einsätze in drei Akten; zunächst zwei Testeinsätze, dann ein zusammenhängender erster Akt |
| Steuerung | Schiffe kämpfen automatisch; Lane wählen und gegebenenfalls HALTEN/VORSTOSS |
| Ressourcen | Energie bleibt die einzige auszugebende Ressource |
| Bauen | Zwei baubare Modultypen; feste Plätze; maximal zwei eigene gebaute Module gleichzeitig |
| Forschungsumfang | Ein gestalteter Forschungsauftrag mit zwei Prototypen zur Wahl; vorhandene Ion-/EMP-Technik weiterverwenden |
| Ausrüstung | Eine Carrier-Fähigkeit und eine Bomber-Ausführung; keine zusätzliche Reihe passiver Ausrüstungsslots |
| Flotte | Scout, Fighter, Bomber, Fregatte; vorhandene Drones als kleine Grundverstärkung |
| Karten | Eine oder zwei Lanes; unterschiedliche Längen, Positionen, Fronten und Anlagen |
| Progression | Garantierte Freischaltungen, kostenlose Ausrüstungswechsel und sichtbarer Werftfortschritt |
| Vorläufig ausgeschlossen | Arbeiter, Rohstoffabbau, freie Bauplatzierung, bewegliche Eskorte, Nebel des Krieges, dritte Lane, dauerhafte Schiffsverluste, große Technologiebäume und neue Großkampfschiffklassen |

Die acht Missionen sind der Zielumfang. Wenn die ersten beiden neuen Spielweisen nicht überzeugen, wird zuerst an ihnen gearbeitet. Zusätzliche Inhalte sollen keine schwache Grundentscheidung verdecken.

## 4. Kampagnenbogen: acht Missionen mit eigener Aufgabe

Die Größen sind **Entwurfswerte**, keine geprüfte Balance. Die Breite bleibt bei 420 Welteinheiten; die Höhe beeinflusst Reisezeit und Kamerabewegung. Die tatsächlichen Wege zwischen Spawn, Front und Ziel werden zusätzlich pro Lane festgelegt.

| Nr. / Einsatz | Karte und räumlicher Unterschied | Verbindliches Hauptziel | Neue Hauptentscheidung | Garantierte Belohnung |
| --- | --- | --- | --- | --- |
| **1 – Ein Licht im Schrott** | Kurzer Schrottkorridor, eine Lane, etwa `420 × 900`; nahe Front und gut sichtbarer Blockadeträger | Blockadeträger zerstören, eigener Carrier überlebt | Kleine schnelle Verbände ergänzen oder auf eine kräftigere Eskorte sparen? | Bauplan der Bastion; Zugang zum Außenposten |
| **2 – Der erste Außenposten** | Längerer Bergungssektor, eine Lane, etwa `420 × 1180`; Relais in der Mitte und ein vorgeschobener Bauplatz auf eigener Seite | Relais erobern und zwei Rückeroberungsangriffe abwehren; am Ende Relais kontrollieren | Energie in eine stationäre Bastion oder in eine bewegliche Flotte investieren? | Bomber-Bauplan; der Hafen ist erreichbar |
| **3 – Hafen im Feuer** | Kompaktes Werftbecken, eine Lane, etwa `420 × 980`; gefährdetes Dock vor dem Carrier und zwei Bauplätze in unterschiedlicher Tiefe | Drei unterschiedliche Angriffe abwehren; Dock und Carrier überleben | Früh vorne abfangen oder weiter hinten eine belastbare Verteidigung aufbauen? | Aegis; sichtbare Wiederinbetriebnahme des ersten Werftbereichs |
| **4 – Die letzte Fähre** | Zwei ungleich lange Anflugkorridore, etwa `420 × 1320`; Sprungstation an einer Front, Carrier unter Druck an der anderen | Drei Evakuierungsladungen abschließen; Sprungstation und Carrier überleben | Energie für die nächste Rettungsladung ausgeben oder die bedrohte Front verstärken? | Fregatten-Bauplan; gerettete Fachleute öffnen den Forschungsauftrag |
| **5 – Wissen unter Beschuss** | Eine Lane, etwa `420 × 1120`; Forschungsstation in der umkämpften Mitte statt sicher hinter dem Carrier | Archiv sichern, einen Prototyp fertig entwickeln und dessen Gegenangriff überstehen | Ionenbomber oder Störimpuls zuerst erforschen – und wann Energie dafür zurückhalten? | Gewählter Prototyp sowie Reparaturdock-Bauplan |
| **6 – Schnitt in die Versorgung** | Zwei getrennte Angriffsrouten, etwa `420 × 1380`; leicht bewachtes Alarmrelais und schwer verteidigtes Produktionsdock | Mindestens eine Anlage zerstören, anschließend Abzug auslösen und abschließen | Einfaches Ziel und sicherer Abzug oder riskanter Angriff auf beide Anlagen? | Zweiter Forschungsprototyp; freiwilliges Abzeichen für beide Anlagen |
| **7 – Der Schlüssel zur Blockade** | Zwei asymmetrische Lanes, etwa `420 × 1260`; kurzes Kontrollgefecht links, langer Belagerungsweg rechts | Relais links besetzen, dadurch den Schild rechts öffnen und den Blockadeträger zerstören | Wie viel Flotte bindet die Relaiskontrolle, während Bomber und Eskorte rechts durchbrechen? | Zugang zum Werftkern; vollständige Vorbereitung für das Finale |
| **8 – Die Werft erwacht** | Eigenes Werftlayout mit zwei Lanes, etwa `420 × 1180`; gemeinsamer Kern und zwei vorgelagerte Bauplätze | Drei Startsegmente des Werftkerns aktivieren und den angekündigten Schlussangriff besiegen | Welche Seite bekommt welches Modul, und wann ist die Verteidigung bereit für den nächsten Startschritt? | Vollständig aktive Heimatwerft, Kampagnenabschluss und Einsatzwiederholung |

### Akt I: Einen Ort zum Bleiben schaffen – Missionen 1 bis 3

**Mission 1 führt konzentriert in den Kampf ein.** Zwei Kaufklassen, ein Ziel und eine kleine gegnerische Flotte. Ein kurzer erster Vorstoß und eine deutlich angekündigte Verstärkung reichen. Der Spieler soll einen Kauf mit seiner Wirkung verbinden können. Bauen und Forschung erscheinen hier noch nicht.

**Mission 2 macht Besitz und Investition greifbar.** Scouts erreichen und besetzen das Relais schnell; Fighter sichern es. Der Bauplatz liegt in Reichweite der späteren Verteidigung, bleibt aber getrennt vom eroberbaren Knoten. Er gehört fest zum Spieler und erzeugt kein zusätzliches Gebäude-Besitzsystem. Die Bastion hilft beim Halten, steht für einen schnellen Vorstoß jedoch am falschen Ort. Wer darauf verzichtet, kann mit mehr Schiffen spielen.

Die beiden Gegenangriffe werden einmalig durch die erste Eroberung ausgelöst. Ein zeitweiliger Verlust des Relais erlaubt eine Rückeroberung; er startet keine endlose zusätzliche Wellenserie. Sieg verlangt beide abgewehrten Angriffe, eigene Kontrolle und einen sicheren Zielbereich. Ein gegnerischer Carrier ist hier kein Siegziel.

**Mission 3 prüft den Aufbau unter wechselnden Bedrohungen.** Erst leichte Angreifer, dann eine schwere Eskorte und schließlich ein Angriff mit Belagerungsschiffen. Gegnerische Bomber bedrohen ausdrücklich das Dock; die sichtbare Ankündigung erklärt dies. Das Dock ist eine angreifbare Missionsanlage, kein zusätzliches Kaufgebäude. Zwei mögliche Bastionen kosten entsprechend Flottenstärke. Nach dem Sieg leuchtet im Menü der erste Werftbereich auf.

### Akt II: Menschen und Möglichkeiten zurückholen – Missionen 4 bis 6

**Mission 4 ist eine Rettungsoperation über eine stationäre Sprungstation.** Es gibt keine zu steuernden Transporter. Eine Ladung wird mit Energie gestartet und läuft nur, solange eine gekaufte eigene Einheit den Stationsbereich sichert und kein Gegner darin steht. Feindkontakt pausiert die Ladung; bereits geleisteter Fortschritt bleibt erhalten. Alle drei Ladungen sind nötig. Angriffe gefährden abwechselnd Station und Carrier.

Damit entsteht ein tatsächlicher Konflikt zwischen Verstärkung und Missionsfortschritt: Wer alles in Schiffe investiert, rettet noch niemanden. Wer sofort jede Ladung bezahlt, kann seine Deckung verlieren. Aegis wird hier erstmals angeboten. Die Rettungsaktion und ihre Kosten stehen direkt an der Station; es entsteht keine zweite umfangreiche Kaufleiste. Zwei Fronten und die Ladungsmechanik werden innerhalb der Eröffnung nacheinander erklärt.

**Mission 5 gibt Forschung einen Ort und eine Gefahr.** Das Archiv wird zuerst erobert. Danach wählt der Spieler eines von zwei Projekten: Ionenbomber oder Störimpuls. Zwei bezahlte Forschungssegmente nutzen dieselben Grundregeln wie die Evakuierungsladungen. Die Station muss besetzt und geschützt werden. Währenddessen bleibt die Flotte kampffähig, aber die investierte Energie fehlt bei Verstärkungen.

Nach Fertigstellung ist der Prototyp noch im laufenden Einsatz nutzbar. Darauf folgt ein angekündigter Gegenangriff, gegen den beide Technologien unterschiedliche Antworten bieten. Ion gilt für anschließend gestartete Bomber; vorhandene Schiffe wechseln ihre Bewaffnung nicht heimlich. Beim EMP-Prototyp wird der eine Fähigkeitsslot sichtbar von Aegis auf Störimpuls umgestellt. Der gewählte Prototyp steht nach dem Sieg auch in Mission 6 bereit. Der andere folgt garantiert nach Mission 6.

**Mission 6 bietet einen Überfall mit einer freiwilligen Risikoentscheidung.** Das Alarmrelais wird durch leichte, schnelle Gegner geschützt; das Produktionsdock durch schwere Verbände und eine feste Verteidigung. Eine erfolgreiche Sabotage beendet eine konkret angekündigte Verstärkungslinie der zugehörigen Lane. Das muss unmittelbar sichtbar werden, etwa durch einen durchgestrichenen Nachschubhinweis.

Nach dem ersten zerstörten Ziel ist der Abzug verfügbar. Gleichzeitig wird ein stärkerer Vergeltungsangriff angekündigt. Der Spieler kann die kurze Abzugsladung am eigenen Carrier beginnen oder vorher das zweite Ziel versuchen. Der gesicherte Carrierbereich muss während des Abzugs feindfrei sein. Ein sofortiger automatischer Sieg nach dem ersten Ziel würde diese Entscheidung verhindern und ist deshalb ausgeschlossen.

Beide Anlagen zu zerstören bringt ein Abzeichen und ein anderes Ergebnisbild, aber keine für den weiteren Weg nötige Stärke. Auch der sichere Ein-Ziel-Sieg liefert den zweiten Prototyp. Die Reparaturdock-Option ermöglicht hier erstmals, einen wertvollen Verband an einer gehaltenen Front wieder einsatzfähig zu machen.

### Akt III: Das Erlernte verbinden – Missionen 7 und 8

**Mission 7 verknüpft die Fronten tatsächlich.** Links steht ein Kontrollrelais, rechts der geschützte Blockadeträger. Das Relais braucht eine eigene Besatzung aus gekauften Schiffen und einen feindfreien Kontrollbereich. Nur dann öffnet es den Schild rechts. Eine klar angezeigte kurze Wiederanlaufzeit verhindert flackerndes An/Aus an der Zonengrenze. Bereits verursachter Trägerschaden bleibt erhalten.

Die linke Flotte hält automatisch am Relais; die rechte stößt vor. Der gegnerische Träger ist nur über die rechte Lane angreifbar. Links folgen angekündigte Rückeroberungsversuche, rechts eine Belagerungsverteidigung. Ein globales Flottenlimit zwingt zur Aufteilung. Ein einziges großes Bomberpaket auf einer Seite erfüllt das Ziel dadurch nicht. Eigene Bauplätze werden in diesem Einsatz bewusst nicht angeboten.

**Mission 8 macht den Werftaufbau zum Finale.** Die zwei Bauplätze liegen an unterschiedlichen Schutzlinien. Der Spieler kann zwei Bastionen, zwei Reparaturdocks oder eine Mischung wählen; jede Investition muss gegen Flotte und Startenergie abgewogen werden. Der Werftkern ist eine eigene angreifbare Anlage. Seine drei Startsegmente werden aktiv mit Energie begonnen. Jeder fertiggestellte Schritt kündigt eine konkrete neue Angriffsstufe an.

Zwischen diesen Schritten sorgen begrenzte Störangriffe für Druck. Es gibt kein gefahrloses Ansparen einer unbegrenzt großen Flotte; Energie- und Flottenlimits bleiben wirksam. Der Schlussangriff kombiniert bekannte Gegnerrollen, ohne plötzlich einen riesigen neuen Boss einzuführen. Sieg verlangt den gestarteten Kern, das Ende des Schlussangriffs und überlebenden Kern sowie Carrier. So endet die Kampagne mit dem Schutz des gemeinsam aufgebauten Ortes.

### Gemeinsame Zielregeln

- Carrier-Verlust ist immer eine Niederlage. Zerstörte verpflichtend zu schützende Anlagen ebenso. Bei gleichzeitigem Abschluss und Zerstörung hat die Niederlage Vorrang.
- Reine Kontrollknoten in M2 und M7 werden erobert und bleiben unzerstörbar. Dock, Sprungstation, Archiv und Werftkern sind dagegen angreifbare Anlagen. Das Archiv ist vor der ersten Eroberung deaktiviert und neutral; danach bleibt es eine eigene schützenswerte Anlage. Feinde können dort Forschung unterbrechen oder die Anlage zerstören. Diese Unterscheidung vermeidet einen unklaren Wechsel zwischen Eroberung und Gebäudebesitz.
- Eine abgeschlossene Verteidigungswelle umfasst ihre noch gefährlichen Geschosse. Ein Sieg darf nicht vor dem tödlichen letzten Treffer erscheinen.
- Kosten werden nur für eine tatsächlich angenommene Aktion abgezogen. Pausen, Neustart und Wiederholung behandeln Bau-, Lade- und Forschungsfortschritt zuverlässig.
- Ein Missionsziel nennt die tatsächliche Siegbedingung. „Evakuiere“ oder „halte das Relais“ darf keine bloße Briefing-Empfehlung vor einem gewöhnlichen Carrier-Duell sein.
- Für jede Station gibt es eine sinnvolle Halteposition. Flotten bleiben bei ihrem Auftrag und laufen nach einem eroberten Ziel nicht am Spielfeldrand ins Leere.

## 5. Bauen: zwei Module mit unterschiedlichen Aufgaben

| Modul | Wirkung | Preis der Entscheidung | Begrenzung |
| --- | --- | --- | --- |
| **Bastion** | Festes Geschütz gegen leichte Angreifer; schützt einen begrenzten Bereich | Weniger sofort verfügbare Energie für bewegliche Verstärkung; kann den Angriff nicht begleiten | Verwendet den vorhandenen Turret-Kampf als Grundlage. Bomber und schwere Gegner bleiben gefährlich. |
| **Reparaturdock** | Repariert wenige eigene Schiffe in der Nähe, nachdem sie eine kurze Zeit nicht getroffen wurden | Verzicht auf die Feuerkraft einer Bastion; sein Standort muss zur Halteposition passen | Repariert weder Carrier noch Gebäude. Begrenzter Durchsatz verhindert eine ganze dauerhaft geheilte Armee. |

**Bedienung:** Bauplatz antippen → eines der dort erlaubten Module wählen → Energiekosten zahlen → kurze sichtbare Bauphase → Modul aktiv. Keine Arbeiter, kein Ziehen auf ein Raster, keine Produktionswarteschlange für Schiffe.

**Bauregeln:**

- Pro Mission null bis zwei klar markierte feste Bauplätze. Nicht jede Mission bietet Bauen an.
- Geplante Verteilung: M1 und M7 ohne Bauplätze; M2, M4, M5 und M6 mit einem; M3 und M8 mit zwei. Bis einschließlich M5 ist nur die Bastion verfügbar, ab M6 zusätzlich das Reparaturdock.
- Ein Bau kostet als erster Entwurfsansatz ungefähr so viel wie ein bis zwei gewöhnliche Verstärkungskäufe. Der endgültige Wert folgt aus dem Missionsspiel.
- Während der kurzen Bauphase ist die Baustelle sichtbar und angreifbar. Sie feuert oder repariert noch nicht.
- Ein zerstörtes Modul gibt seinen Bauplatz wieder frei; Neubau kostet erneut Energie. Keine automatischen Erstattungen und kein Verkaufen zur Geldverschiebung.
- Ein intaktes Modul bleibt für diesen Einsatz gewählt. Wiederholung erlaubt eine andere Wahl, ohne dauerhafte Kampagnenkosten.
- Gebäude belegen keine Schiffsslots, haben aber das eigene harte Limit von zwei gebauten Modulen. Sie zählen nicht als Besatzung eines Missionsknotens.
- Keine Gebäudestufen und keine passiven Einkommensgeneratoren in diesem Ausbau. Letztere würden langes Ansparen und einen dominanten Wirtschaftsauftakt begünstigen.

Relais, Archiv, Sprungstation und Werftkern sind **vorgegebene Missionsanlagen**. Sie nutzen wenige gemeinsame Funktionen: besetzen, schützen, laden oder zerstören. Ihre verschiedenen Aufgaben rechtfertigen keine vier zusätzlichen Baumenüs.

## 6. Forschung, Flottenentwicklung und Carrier

### Fortschritt zwischen den Einsätzen

Die Werft zeigt freigeschaltete Möglichkeiten und die nächste Entscheidung. Es gibt keine Forschungswährung, keine Reparaturrechnung nach einer Niederlage und keine durch Wiederholung erforderlichen Erfahrungspunkte.

| Zeitpunkt | Was neu spielbar wird | Warum es dann passt |
| --- | --- | --- |
| Start | Scout und Fighter | Aufklären, besetzen, eskortieren und den Kauf verstehen |
| Nach M1 | Bastion | Erste Entscheidung zwischen ortsfester und beweglicher Verteidigung |
| Nach M2 | Bomber | Vorbereitung auf schwere Gegner und später auf Anlagenangriffe |
| Nach M3 | Aegis | Ein aktives Schutzwerkzeug für zwei bedrohte Fronten |
| Nach M4 | Fregatte | Ein teurer, robuster Anker für Stationskontrolle und Belagerung |
| Nach M5 | Gewählter Prototyp und Reparaturdock | Im folgenden Überfall Kontrolle oder Unterbrechung erproben; wertvolle Schiffe erhalten |
| Nach M6 | Zweiter Prototyp | Vor den letzten Einsätzen stehen beide Lösungen ohne Nachfarmen bereit |
| Nach M7 | Finale verfügbar | Die Entscheidung liegt jetzt in der Zusammenstellung und Verwendung bekannter Werkzeuge |
| Nach M8 | Abschluss, Werftzustand und Wiederholungen | Andere Vorgehensweisen und freiwillige Ziele ausprobieren |

Die Reihenfolge der Prototypen ist eine zeitweise Spezialisierung. Ein Spieler wird für eine frühe Entscheidung nicht dauerhaft von Inhalten ausgeschlossen. In späteren Wiederholungen kann der Forschungsauftrag mit beiden bereits bekannten Projekten gespielt werden; er erzeugt keine zusätzliche dauerhafte Stärke.

### Forschung verändert den Einsatz, nicht nur Zahlen

**Ionenbomber:** bereits als Ausrüstungsvariante vorhanden. Gegnerische Schiffe kurz unterbrechen, dafür weniger Wirkung gegen Strukturen. Das passt zu defensiver Stationskontrolle; beim Produktionsdock kann der normale Belagerungsbomber die bessere Wahl sein.

**Störimpuls:** bereits als Carrier-Fähigkeit vorhanden. Eine bedrohliche Salve oder einen Angriff auf das Relais unterbrechen. Er ersetzt Aegis im aktiven Slot und ist kein zusätzlicher kostenloser Rettungsknopf.

**Aegis:** bleibt das Schutzwerkzeug. Für diese Kampagne soll seine Wirkung zusätzlich auf eine eigene Missionsanlage in der gewählten Lane erweitert werden. Der Werftkern im Finale gehört als gemeinsames Ziel ausdrücklich dazu. Reparaturdock und Bastion benötigen keine weitere separate aktive Fähigkeit. Schutzumfang, Energiepreis und Dauer müssen zusammen lesbar bleiben; diese Erweiterung ist noch zu implementieren.

Eine Forschungsentscheidung braucht eine erkennbare Verwendung und einen Verzicht. Die alten allgemeinen Schadens-, Feuerraten- und Einkommensstufen werden dafür nicht zusätzlich eingeblendet.

### Sichtbare Entwicklung der Heimatwerft

Nach Akt I ist der Hafen beleuchtet und nutzbar. Nach Akt II kommen besetzte Docks und ein Forschungsbereich hinzu. Nach dem Finale ist der Kern aktiv. Das vorhandene Menü-Key-Art bleibt die Grundlage; sparsame Licht- und Zustandsüberlagerungen machen den Fortschritt sichtbar. Kurze Einsatzmeldungen erklären, wer oder was gerettet wurde. Aufwendige Zwischensequenzen sind nicht nötig.

## 7. Tatsächlich verschiedene Karten und Gegner

Jede Mission erhält eigene Angaben für Kartenausdehnung, Spawnpunkte, Haltepositionen, Zielbereiche und Anlagen. Vier zusammenhängende Schauplätze reichen als gestalterische Familie: Schrottfeld, Werftbecken, zivile/Forschungsanlagen und Blockadering.

**Räumliche Vielfalt muss spielerisch wirken:**

- Kurze Wege erlauben schnelle Reaktionen; lange Belagerungswege verlangen frühere Investitionen.
- Ein vorgeschobener Bauplatz hilft offensiv, liegt aber stärker unter Beschuss.
- Eine Station in der Mitte verlangt Präsenz. Eine Anlage direkt beim Carrier würde das kaum leisten.
- Ungleich lange Lanes benötigen unterschiedliche Verstärkungszeitpunkte.
- In M7 erfüllt jede Lane eine andere Funktion. Im Finale konkurrieren zwei Schutzlinien um dieselbe Energie.

Es werden keine Asteroiden als vermeintliche Deckung dargestellt, wenn sie im Kampf keine Wirkung haben. Neue freie Wegfindung, beliebige Hindernisse und Routenwechsel nach dem Start bleiben außerhalb dieses Plans.

Die Gegner verwenden zunächst dieselben vorhandenen Schiffsklassen mit drei erkennbaren Verhaltensmustern: schnelle Rückeroberung, schwere Belagerung und Schutz eigener Anlagen. Ein Missionsereignis darf ihren nächsten Angriff ändern: Eroberung löst Rückeroberung aus; eine zerstörte Produktionsanlage beendet deren künftige Käufe. Neue Fraktionen mit eigenen vollständigen Flotten wären für diesen Versuch zu teuer.

**Schiffsmengen:** Als erste Gestaltungsspanne etwa 10–14 aktive eigene Schiffe in einer Lane und 16–18 über zwei Lanes zusammen. Squad-Mitglieder und Drones zählen jeweils einzeln. Das sind Ausgangswerte; entscheiden müssen sichtbare Überlagerung, Platz um Stationen und sinnvolle Käufe. Spätere Missionen steigern Zielkonflikte und Gegnerrollen stärker als die Menge.

Kostenlose Drones halten das Gefecht belebt, können aber keine Projektstation betreiben oder allein ein Kontrollziel erfüllen. Ihr Einfluss auf solche Missionsziele muss ausdrücklich ausgeschaltet werden; im vorhandenen Capture-Code besitzen sie noch Eroberungsstärke.

## 8. Bedienung, Lesbarkeit und Wiederspielwert

Oben steht ein Hauptziel mit Fortschritt und der nächste wichtige Angriffshinweis. Unten bleiben Flottenkauf und Carrier-Fähigkeit erreichbar. Ein angetippter Bauplatz oder eine Projektstation öffnet ein kleines Kontextfeld mit höchstens zwei Entscheidungen. Es gibt immer nur ein offenes Zusatzfeld.

Bereiche, die außerhalb des sichtbaren Ausschnitts bedroht werden, brauchen einen eindeutig beschrifteten Kamerasprung. Eine Baukarte darf weder den Zielstatus noch die Angriffswarnung verdecken. Die Zielstation zeigt direkt, ob ihr Energie, Besatzung oder ein sicherer Bereich fehlt.

Wiederholungen bieten kostenlose Ausrüstungswechsel und freiwillige Aufgaben wie „beide Sabotageziele“, „Dock unbeschädigt“ oder „ohne Bastion“. Diese Aufgaben vergeben Abzeichen, keine notwendigen Werteboni. Die ersten Missionswiederholungen behalten ihr Klassenangebot, damit ein später freigeschaltetes Großschiff die Einführung nicht entwertet. Spätere Einsätze bieten die jeweils freigeschaltete Ausrüstung.

Eine zweite Schwierigkeitsstufe, Zufallsmodifikatoren und verzweigte Kampagnenwege folgen erst nach einer überzeugenden Grundkampagne. Acht klare Einsätze sind hier wertvoller als ein großer Baum ähnlich gespielter Aufträge.

## 9. Technische Umsetzung auf der bestehenden Grundlage

Dieser Abschnitt beschreibt den gesamten Ausbauaufwand. Der tatsächlich umgesetzte Umfang ist in der Bulk-Checkliste und im jeweiligen Bericht ausgewiesen.

| Arbeitspaket | Vorhandener Ansatz | Tatsächlich erforderliche Ergänzung |
| --- | --- | --- |
| Eigene Karten | `data/definitions.js`, Kamera und lanegebundene Spawnpunkte | Missionslayouts; feste Koordinaten wie Halteposition `780` und Relais-Sammelpunkt `400` durch Lane-/Missionsdaten ersetzen; Reichweiten, Anzeige und Kamera gemeinsam berücksichtigen |
| Missionsziele | `campaign/missionRuntime.js` | Kleine explizite Abläufe für Kontrolle, Projektfortschritt, Überfall/Abzug und Finale; Sieg und Niederlage pro Auftrag; Ereignisse statt ausschließlich ablaufender Phasentimer |
| Besatzung und Fortschritt | `simulation/captureSystem.js` | Geeignete Einheiten filtern; Präsenz von tatsächlichem Besitz unterscheiden; jeder Feind im Sicherheitsbereich pausiert Projekte. Das bestehende `contested` bedeutet nur annähernd gleiche Eroberungsstärke und reicht dafür nicht aus. |
| Bauplätze | `simulation/commandSystem.js`, Strukturen und Energie | Legalen Baubefehl, Kostenprüfung, Baustellenzustand, Fertigstellung und Zerstörung hinzufügen; keine Kopplung an die Schiffskauf-Queue |
| Neue Anlagen | `battleState.js`, `targeting.js`, Strukturkampf und Renderer | Anlagenrollen und erreichbare Ziele verallgemeinern. Die bisherige Zielauswahl kennt bevorzugt Relais, Turret und HQ; ein neues Bild oder eine neue Strukturdefinition allein macht ein Dock noch nicht zu einem korrekt angreifbaren Ziel. |
| Reparaturdock | Noch kein entsprechendes System | Lokalen, begrenzten Reparatureffekt ergänzen; Station darf weder Hüllenverlust beliebig zurücksetzen noch unangreifbare Dauerverteidigung erzeugen |
| Forschung | Energie, Ausrüstung und Missionsevents | Forschungssegmente, einmalige Projektwahl und klaren Prototyp-Wechsel hinzufügen; allgemeine Zahlen-Upgrades ausgeschaltet lassen |
| Gegneranlagen in M6 | Authored-Mission-Kaufpläne | Künftige Käufe an lebende Produktionsquellen binden; entfallene Aufträge abschließen/streichen, damit eine Welle nicht auf einen unmöglichen Spawn wartet |
| Schildkopplung in M7 | `campaign/relayShield.js` | Schutz an besetztes Relais und Zone koppeln, nicht nur an lebende Relais; rechte Lane als einzigen Angriffsweg zum Träger festlegen |
| Aegis | `campaign/aegisSystem.js` und Fähigkeitsdarstellung | Schutzberechtigte Missionsanlagen und gemeinsamen Werftkern aufnehmen; Anzeige muss exakt dieselben Ziele markieren |
| Oberfläche | Kampagnen-, Kommando- und Fähigkeitsoberfläche | Kontextfelder für Bau/Projekt; klare Kosten, Sperrgründe, Fortschritt und Zielkameras; vorhandene kompakte Flottenbedienung erhalten |
| Fortschritt | `campaign/progress.js`, `experiment.js` | Eigene Kampagnenkennung, neue Missions-IDs und separaten versionierten Speicher für diesen Ausbau; Prototyp-Reihenfolge, Freischaltungen und Abzeichen speichern |

Es braucht keinen universellen Missionseditor und keine frei programmierbare Skriptsprache. Wenige verständliche Zielbausteine reichen. Die schwierigen Stellen sind sinnvolle Stationsverteidigung, Zielauswahl, Bewegung zu Haltepunkten und lesbare Bedienung; dort muss der erste spielbare Abschnitt überzeugen.

### Isolation und bestehende Spielstände

- Entwicklung ausschließlich im Experiment; Classic wird dadurch nicht umgebaut.
- Neue Missions-IDs verhindern, dass ein alter Sieg irrtümlich eine anders gestaltete Mission abschließt.
- Der bisherige Experiment-Spielstand und Classic-Schlüssel bleiben erhalten. Die neue Kampagne startet in einem eigenen Speicherbereich; keine pauschale Speicherlöschung.
- Während des Übergangs können bisherige Kampagne und neuer Testabschnitt über die Kampagnenauswahl unterscheidbar gestartet werden. Dafür Missionspakete und Speicher trennen, keine weitere vollständige Runtime-Kopie anlegen.
- Der bestehende Experiment-Play-Link bleibt der Einstieg. Die README bezeichnet eindeutig, welcher Umfang spielbar ist. Keine Vorschau wird als fertige Mission ausgegeben.
- Größere Umsetzungsbulks beginnen vom geprüften aktuellen `origin/main` auf einem `codex/`-Branch und werden über PR, passende Prüfungen und den vorhandenen Pages-Workflow integriert. Der erhaltene `quality-recovery`-Spielkern wird nicht mit übernommen.

## 10. Wenige gezielte Assets

Die vorhandenen Schiffe, der Turret, der Schildrelais-Atlas und das Menü-Key-Art werden weiterverwendet. Neue Rastermotive sollen mit **Imagegen** entstehen, sobald die Platzhalter-Version der jeweiligen Aufgabe funktioniert. V2-0 benötigt und erzeugt noch keine neuen Raster-Assets.

| Priorität | Asset | Nutzen |
| --- | --- | --- |
| 1 | Modulare Stationsbasis mit klaren Varianten für Archiv, Sprungstation und Werftkern | Missionsziele auf einen Blick unterscheiden, bei verwandter Bauweise |
| 2 | Reparaturdock mit inaktivem/aktivem Zustand | Unterschied zur kämpfenden Bastion sichtbar machen |
| 3 | Gegnerisches Produktionsdock mit zerstörtem Zustand | Sabotage und ausfallenden Nachschub verständlich zeigen |
| 4 | Ein Set aus Werft- und Schrottfeld-Landmarken | Vier Schauplätze wiedererkennbar machen, ohne die Front zu verdecken |
| 5 | Bei Bedarf ein zusätzliches Landmarkenmotiv für zivile Anlagen | Rettung und Forschung räumlich stärker unterscheiden |

Erster Rahmen: drei notwendige und höchstens zwei ergänzende neue Raster-Assets beziehungsweise kleine Atlanten. Zustandsringe, Baufortschritt, Symbole und Menübeleuchtung entstehen möglichst direkt in der vorhandenen Darstellung. Gameplay-Assets bleiben in echter Draufsicht. Kein neues Menübild pro Mission und keine neue komplette Schiffsflotte.

## 11. Umsetzungsbulks in drei spielbaren Ausbaustufen

**V2-0 ist abgeschlossen; V2-1 ist technisch umgesetzt, die menschliche Spielbeobachtung bleibt offen. V2-2 bis V2-6 sind noch nicht umgesetzt.** Jeder Bulk erhält einen kurzen Bericht über tatsächlich Geleistetes und verbleibende Einschränkungen.

### Ausbaustufe A – Beweisen, dass zwei Einsätze anders funktionieren

#### V2-0 – Missionsgrundlage und sicherer Testzugang

- [x] Acht neue Missions-IDs, vorläufige Layoutdaten und eindeutige Zieldefinitionen anlegen.
- [x] Haltepunkte und notwendige feste Kampfkoordinaten in Missions-/Lane-Daten überführen.
- [x] Neuen Testabschnitt mit getrenntem Fortschritt erreichbar machen; bestehende Kampagne weiterhin auswählbar halten.
- [x] Regeln für Zielpriorität, Stationsbesatzung, Pause und gleichzeitigen Sieg/Verlust festlegen.

**Ergebnis:** Ein getrennt anwählbarer Testbereich mit passender Karte, Zielanzeige und sicheren Zuständen. Noch kein behaupteter Kampagnenausbau.

**Umgesetzt in Version `0.0.7-v2-0`:** Kampagne → Neue Kampagne · Kartenvorschau. Acht anklickbare schematische Karten, Aufträge, Entscheidungen und Belohnungen; keine Startschaltfläche für diese noch unfertigen Einsätze. Vorschauauswahl wird getrennt gespeichert und erzeugt keine Siege. Zielregeln liegen als geprüfte gemeinsame Funktionen für V2-1 vor; Bau, Forschung und neue Missionsabläufe sind noch nicht angeschlossen. [Abnahmebericht](LAST_SHIPYARD_V2_0_REPORT.md).

#### V2-1 – Außenposten und Evakuierung als zwei vollständige Testeinsätze

- [x] Mission 2 mit Capture, einem Bauplatz, Bastion und ereignisabhängigen Gegenangriffen umsetzen.
- [x] Mission 4 mit zwei ungleichen Lanes, Sprungstation und drei bezahlten Ladungen umsetzen.
- [x] Kontextbedienung, Stations-Haltepunkte, Warnungen und eindeutige Niederlagen ergänzen.
- [x] Beide Einsätze im Testzugang direkt startbar machen; ihre benötigte Ausrüstung dort vorgeben, ohne alte Missionen nachspielen zu müssen.
- [x] Jeweils Sieg, Niederlage, Neustart und einen unterbrochenen Bau-/Ladeablauf gezielt prüfen.
- [ ] Menschlich beobachten: Verändert der Spieler zwischen den beiden Missionen tatsächlich seine Prioritäten?

**Ergebnis:** Zwei kurze, vollständige Spielerlebnisse. Hier fällt die wichtigste Entscheidung über den weiteren Ausbau.

**Technisch umgesetzt in `0.0.8-v2-1`:** Kampagne → Neue Kampagne · 2 Testeinsätze → Außenposten oder Fähre → Testeinsatz starten. Ein Bauplatz pro Karte, Bastion für 140 E mit 8s verwundbarer Bauzeit; drei einzeln gestartete Rettungsladungen zu je 120 E und 16s gesicherter Besatzung. Besitzverlust startet die zwei Außenpostenangriffe nicht erneut. Pause hält Bau und Ladung an; ein Neubau erhält eine neue Ziel-ID. Eigene Flotte: maximal 12 beim Außenposten, bei der Fähre 10 pro Lane und 16 insgesamt; höchstens zwei lebende kostenlose Drones pro Lane verhindern eine Blockade der Kaufplätze durch Warten. Startausrüstung und Siege bleiben vom bisherigen Kampagnenstand getrennt.

**Bewusste Präzisierungen:** Haltepunkte liegen beim Außenposten bei y=610 und bei der Fähre links/rechts bei y=925/1060; Stationsbereiche haben Radius 90. Damit halten eigene Schiffe tatsächlich im benötigten Bereich beziehungsweise auf der Carrier-Front. Aegis schützt vorerst weiter Carrier und Schiffe; die Erweiterung auf Anlagen und das erste Imagegen-Stationsmotiv bleiben V2-2. V2-1 verwendet funktionale Vektorstationen und den vorhandenen Turret-Fallback. Noch keine Bauplan-Freischaltungen, Forschung oder Verbindung der acht Einsätze. [Umsetzung, Prüfungen und Grenzen](LAST_SHIPYARD_V2_1_REPORT.md).

**Weiter erst, wenn:** Bauentscheidung und Rettungsinvestition verständlich sind, das sture Ausgeben aller Energie für dieselbe Schiffsklasse nicht beide Aufträge beiläufig erfüllt und wenigstens zwei plausible Vorgehensweisen beobachtbar sind. Bei Problemen Kosten, Lage und Angriffe überarbeiten; keine dritte Mechanik als Ablenkung hinzufügen.

### Ausbaustufe B – Eine zusammenhängende Kampagne bis zur Sabotage

#### V2-2 – Ersten Akt und Lernreihenfolge fertigstellen

- [ ] Mission 1 kurz und klar auf Scout/Fighter zuschneiden.
- [ ] Mission 3 mit gefährdetem Dock, zwei Bauplätzen und drei erkennbaren Angriffen gestalten.
- [ ] Missionen 1–4 zu einem durchspielbaren Verlauf mit den vorgesehenen Freischaltungen verbinden.
- [ ] Aegis für relevante Missionsanlagen erweitern und in Mission 4 verständlich einführen.
- [ ] Erstes Stationsmotiv und ersten sichtbaren Werftfortschritt integrieren, soweit die Platzhalter ihre Aufgabe erfüllen.

**Ergebnis:** Ein zusammenhängender Einstieg mit Durchbruch, Aufbau, Verteidigung und Rettung. Neue Spieler brauchen den freien Testzugang nicht mehr.

#### V2-3 – Forschung und Überfall ergänzen

- [ ] Mission 5 mit eroberbarem Archiv, zwei Prototypen und sofortigem Feldversuch umsetzen.
- [ ] Garantiertes Nachholen des zweiten Prototyps nach Mission 6 in Fortschritt und Oberfläche abbilden.
- [ ] Reparaturdock und das kleine dafür notwendige Kontextfeld hinzufügen.
- [ ] Mission 6 mit zwei verschieden verteidigten Anlagen, ausfallendem Nachschub und freiwilligem Abzug umsetzen.
- [ ] Freiwilliges Zwei-Ziele-Abzeichen und verständliches Ergebnis darstellen.

**Ergebnis:** Sechs zusammenhängende Missionen mit Flottenkampf, Bauentscheidung, Verteidigung, Rettung, Forschung und Überfall. Keine dieser Funktionen erfordert eine zusätzliche Währung.

### Ausbaustufe C – Abschluss, Erscheinungsbild und gezielte Abnahme

#### V2-4 – Die beiden abschließenden Missionen

- [ ] Mission 7 mit tatsächlich voneinander abhängigen Fronten und klarer Schildanzeige gestalten.
- [ ] Mission 8 mit zwei Bauplätzen, angreifbarem Kern und drei ereignisabhängigen Startstufen gestalten.
- [ ] Gegnerdruck innerhalb nachvollziehbarer Energie-, Kauf- und Flottenregeln aufbauen.
- [ ] Achtmissionen-Abschluss, vollständigen Werftzustand und Wiederholungen verbinden.

**Ergebnis:** Die vollständige Kampagne besitzt einen eigenständigen Höhepunkt und ein sichtbares Ende.

#### V2-5 – Präsentation und Verständlichkeit fertigstellen

- [ ] Notwendige restliche Stations-/Landmarken-Assets gezielt erzeugen und integrieren.
- [ ] Vier Schauplatzfamilien, acht unterscheidbare Layouts und lesbare Zustandsanzeigen ausarbeiten.
- [ ] Zu lange Briefings kürzen; Hauptziel, Bedrohung und neue Entscheidung jeweils unmittelbar verständlich machen.
- [ ] Kontextfelder, Kamerasprünge, Trefferfeedback und Fortschrittsmeldungen auf kleinen Hochformatbildschirmen abstimmen.
- [ ] Neue Kampagne als aktuellen Einstieg kennzeichnen; Zugriff auf die vorherige Testkampagne dezent einordnen.

**Ergebnis:** Der gestalterische Aufbau unterstützt die Aufgaben und die Kampagne wirkt zusammenhängend.

#### V2-6 – Gezielte Spielbeobachtung und Veröffentlichung abnehmen

- [ ] Die acht gestalteten Missionen einmal zusammenhängend auf Fortschritt, Freischaltungen und Abschluss prüfen.
- [ ] Kritische Sonderfälle gezielt absichern: fehlgeschlagener Kauf, zerstörte Baustelle, umkämpftes Projekt, weggefallener Spawn, gleichzeitiger Zielabschluss/Verlust und alter Speicherstand.
- [ ] Mit mindestens zwei unvoreingenommenen Personen beobachten, was sie als Unterschiede zwischen den Einsätzen benennen.
- [ ] Auf einem kleineren und einem längeren echten Smartphone Bedienung, Zielerkennung und Leistung prüfen; offene Geräteabnahme ehrlich kennzeichnen.
- [ ] Nur beobachtete Balanceprobleme bearbeiten; keine vorsorglichen großen Serien über noch veränderliche Missionswerte.
- [ ] Plan, README, Build-Version und Berichte mit dem tatsächlich veröffentlichten Umfang abgleichen.

**Ergebnis:** Ein belegbar durchspielbarer Kampagnenstand mit klar benannten Restfragen. Erfolgreiche technische Prüfungen allein gelten nicht als Nachweis für Abwechslung oder Spielspaß.

## 12. Woran wir erkennen, dass es besser geworden ist

| Frage | Beobachtbarer Maßstab |
| --- | --- |
| Sind die Missionen unterschiedlich? | Spieler beschreiben mindestens vier Einsätze anhand ihrer Entscheidungen oder Ziele und nicht nur anhand von Farbe oder Schwierigkeit. |
| Ist Bauen eine Entscheidung? | Bastion und zusätzliche Flotte führen in M2 zu nachvollziehbaren unterschiedlichen Vorgehensweisen. Später ist das Reparaturdock situativ sinnvoll. |
| Ist Forschung interessant? | Der Spieler kann begründen, weshalb er einen Prototyp zuerst gewählt hat, und setzt ihn im vorgesehenen Feldversuch ein. |
| Sind die Ziele echt? | Wer Rettung, Forschung oder Kontrolle ignoriert, gewinnt diese Missionen nicht durch einen gewöhnlichen Angriff auf ein HQ. |
| Bleibt es mobil verständlich? | Zielstatus, bedrohte Anlage und nächste mögliche Aktion sind trotz geöffneter Kauf-/Bauansicht verständlich. |
| Gibt es zu viele Schiffe? | Die entscheidenden Fronten und Anlagen bleiben erkennbar; Flottenkäufe werden nicht dauernd durch unverständliche Kapazitätsgrenzen blockiert. |
| Ist die Progression fair? | Jeder Hauptmissionssieg genügt für den nächsten Einsatz; optionale Abzeichen und Wiederholungen werden nicht zum Pflichtprogramm. |

Dauer als Orientierung: M1 ungefähr zwei bis drei Minuten, die meisten Einsätze drei bis sechs, das Finale gegebenenfalls sechs bis acht. Das wird nach Gestaltung beurteilt. Ein kurzweiliger kürzerer Einsatz ist besser als eine durch längere Hüllenbalken oder Wartezeiten gestreckte Mission.

## 13. Offene Annahmen und bewusste Vereinfachungen

1. **Bauplätze erzeugen tatsächlich einen nützlichen Zielkonflikt.** Falls eine Bastion immer die richtige Erstinvestition ist, müssen Lage, Gegenangriff und Preis verbessert werden. Zusätzliche Gebäudetypen lösen das nicht automatisch.
2. **Reparatur ohne Einzelsteuerung ist verständlich.** Das Dock steht deshalb an einer sinnvollen Halteposition. Falls seine Nutzung künstliche Rückzugs-Mikrosteuerung verlangt, bleibt es zunächst außerhalb der Kampagne; die übrigen Aufträge benötigen es nicht zwingend.
3. **Zwei Fronten mit einer zusätzlichen Aufgabe bleiben auf dem Smartphone lesbar.** M4 und M7 sind dafür die entscheidenden Beobachtungen. M4 könnte bei Bedarf zunächst mit einer Lane funktionieren. M7 benötigt beide Fronten; dort werden zuerst gleichzeitiger Gegnerdruck und Entfernung reduziert und die Kamerasprünge verbessert.
4. **Die vorhandene Bewegung lässt sich mit klaren Halteankern erweitern.** Beliebige Wege und echte eskortierte Transporter sind nicht vorausgesetzt. Die Lösung muss im ersten Testabschnitt funktionieren, bevor weitere Layouts produziert werden.
5. **Die vorgeschlagenen Kosten, Größen und Mengen sind Ausgangswerte.** Es gibt bisher keinen menschlichen Nachweis, dass diese acht Entwürfe bereits ausgewogen oder unterhaltsam sind.
6. **Acht Missionen sind eine empfohlene nächste Zielgröße.** Bei begrenztem Aufwand hat die Qualität der ersten vier Vorrang. Forschung, Reparaturdock und Finale werden erst auf deren funktionierender Grundlage ergänzt.

**Reihenfolge bei Kürzungen:** zusätzliche Assets und Abzeichen zuerst, dann Reparaturdock, danach zusätzliche optionale Sabotagebelohnungen. Unterschiedliche Siegbedingungen, eigene Kartenlayouts, verständliche Energieentscheidungen und saubere Freischaltungen bleiben der Kern dieses Plans.
