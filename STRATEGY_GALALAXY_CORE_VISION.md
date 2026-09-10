# Strategy Galalaxy – Core Gameplay Vision

Stand: 2026-09-10

Dieses Dokument ist die verbindliche Produktvorgabe für den laufenden Core-Gameplay-Umbau. Es ersetzt den früheren Vertrag mit festen 22-Sekunden-Kauf-Queues, Lock-in und grundsätzlich zwei Lanes.

Der aktuell spielbare Ausgangscode enthält Teile dieses alten Modells noch. Die Migration erfolgt in getrennten, testbaren Bulks. Bei Widersprüchen zwischen älteren Roadmaps, Konzepten oder Mockups und diesem Dokument gilt dieses Dokument.

## Produktkern

Strategy Galalaxy ist ein Mobile-First-Echtzeit-Lane-Wars-Spiel im Portraitformat. Schiffe werden nicht direkt gesteuert. Der Spieler beobachtet die Front, investiert permanent erzeugte Energie und schickt Verstärkung unmittelbar in eine gewählte Lane.

Der verbindliche Kernloop lautet:

```text
Schlacht beobachten
  → Entscheidung treffen
  → Einheit oder Squad sofort losschicken
  → sichtbare Konsequenz an der Front
  → Gegner reagiert
  → nächste Entscheidung
```

Eine kurze visuelle Startsequenz von ungefähr 0,5 bis 1,5 Sekunden ist erlaubt. Eine Kaufentscheidung darf nicht bis zur nächsten automatischen Wave warten.

## Zwei getrennte Verstärkungssysteme

### Live-Deployment

- Energie wird kontinuierlich erzeugt.
- Bei ausreichender Energie und abgelaufenem Cooldown kann eine Einheit oder ein Squad sofort gekauft werden.
- Die gewählte Lane ist Teil des Befehls.
- Kosten werden bei erfolgreichem Deployment einmalig bezahlt.
- Es gibt keine Kauf-Queue, kein Undo/Refund-System und kein Lock-in-Fenster.
- Upgrades können während des laufenden Kampfes gekauft werden.

### Automatische Basis-Waves

- Beide Teams erhalten ungefähr alle 18 bis 22 Sekunden eine kleine kostenlose Drone-Wave.
- Der Wave-Timer läuft unabhängig von Spieler- und KI-Käufen.
- Die Wave hält beide Fronten aktiv und verhindert Stillstand.
- Der HUD-Text beschreibt ausschließlich die nächste automatische Verstärkungswelle.

## Karten und Lanes

Lane-Anzahlen sind Leveldaten und kein globaler Spielmodus.

- Level 1 „Orbital Garden“ besitzt eine Lane.
- Level 2 „Twin Fronts“ besitzt zwei Lanes.
- Spätere Levels dürfen andere Lane-Anzahlen und Geometrien besitzen.
- Einheiten bleiben nach dem Start ihrer Lane zugeordnet.
- Level 2 muss vor einem Kauf eine klare Lane-Wahl anbieten; Level 1 wählt seine einzige Lane automatisch.

Beide vorhandenen Levels behalten zunächst ihre `420 × 1180` große Scroll-Welt. Das direkte vertikale Wischen und die unabhängige Battlefield-Kamera bleiben Teil des Produkts. Die Flotte muss nicht gleichzeitig vollständig auf einen Bildschirm passen.

## Squads, Formationen und Größenhierarchie

Eine Spielerentscheidung darf mehrere kleine, individuell sichtbare Schiffe erzeugen.

- Drone Wings und Fighter Squadrons bestehen typischerweise aus zwei bis drei Mitgliedern.
- Bomber und Frigates sind zunächst Einzelschiffe.
- Spätere Capital Ships sind einzelne sehr große Einheiten.
- Ein Squad besitzt gemeinsame Kosten, einen gemeinsamen Kaufbefehl und einen gemeinsamen Cooldown.
- Mitglieder dürfen individuell Schaden nehmen und zerstört werden.
- Eine einfache Formation hält die Gruppe lesbar, ohne ein starres Raster zu erzwingen.

Die visuelle Hierarchie lautet:

```text
Drone < Fighter < Bomber < Frigate < Capital Ship
```

Kleine Schiffe bleiben klein genug für sichtbare Masse. Stärke und Wert größerer Klassen sollen bereits an ihrer Silhouette erkennbar sein.

## Kampfverhalten

Treffen gegnerische Verbände aufeinander, entsteht eine erkennbare Battle Zone:

- Einheiten bremsen auf sinnvolle Waffenreichweite ab.
- Sie halten Abstand und vermeiden Sprite-Stapel.
- Eine Begegnung dauert sichtbar mehrere Sekunden.
- Rollen behalten unterschiedliche Bewegungs- und Feuerprofile.
- Nach dem Sieg rückt der überlebende Verband weiter vor.

Drone und Fighter kämpfen beweglich mit schnellen Salven. Bomber verwenden langsame, schwere Angriffe. Frigates bleiben weiter zurück und nutzen deutlichere schwere Salven oder Breitseiten.

Waffen priorisieren Lesbarkeit auf kleinen Displays:

- Laser besitzen einen erkennbaren Ursprung, Kern und Treffer.
- Raketen sind als Körper mit Engine-Trail und längerer Flugzeit sichtbar.
- Schwere Salven zeigen Mündungsblitz, Flug und klaren Impact.
- FX unterstützen die Entscheidung, ohne Einheiten und Frontverlauf zu verdecken.

## Core-Slice-Level

Die ersten beiden Levels dienen vorerst ausschließlich der Bewertung des Flottenkampfs.

Deaktiviert werden:

- Capture Points und Capture-Fortschritt;
- Economy Buildings und Node-Einkommen;
- Turrets;
- neutrale Stationen;
- zusätzliche Objective-Systeme;
- dominante Dekoration in der Spielfeldmitte.

Diese Systeme sollen konfigurationsgesteuert deaktiviert und nicht unnötig gelöscht werden. Spätere Levels dürfen sie gezielt wieder aktivieren.

Die bisherigen großen Headquarters werden visuell durch Command Carrier ersetzt. Ein Carrier darf größtenteils außerhalb des oberen beziehungsweise unteren Kartenrands liegen. Ein sichtbarer Launch-Bereich zeigt, wo Schiffe starten. Der Carrier darf intern weiterhin als zerstörbares Matchziel dienen, solange seine Präsentation nicht die Schlacht dominiert.

## Hintergrund und orthografische Lesbarkeit

Die Kartenmitte bleibt ruhig: dunkler Weltraum, subtile Sterne und Nebel, wenige kleine Asteroiden. Auffälligere Wracks, Fragmente, Lichtquellen oder Strukturen gehören an die Kartenränder.

Gameplay-Objekte verwenden echte 90-Grad-Draufsicht. Pseudo-isometrische Gebäude und sichtbare Seitenfassaden sind für das aktive Spielfeld nicht zulässig. Eine Karte darf ohne Einheiten bewusst leer wirken; die Flotte und ihre Waffen sind die visuelle Hauptebene.

## Mobile HUD

Der Spieler erkennt jederzeit:

- aktuelle Energie und Einkommen;
- Zeit bis zur nächsten kostenlosen Wave;
- verfügbare Einheiten beziehungsweise Squads;
- Kosten;
- laufende Cooldowns;
- gewählte Lane;
- relevante Upgrade-Level.

Nicht verfügbare Käufe unterscheiden mindestens zwischen „zu wenig Energie“ und „Cooldown aktiv“. Touch-Ziele müssen auf den unterstützten Mobile-Viewports zuverlässig erreichbar bleiben.

## Gegner

Die KI verwendet dieselben Energie-, Kosten-, Cooldown-, Lane- und Deployment-Regeln wie der Spieler. Sie darf Energie sparen, einfache Gegenentscheidungen treffen und gelegentlich einen stärkeren Push vorbereiten. Eine einfache, nachvollziehbare Regel-KI ist für den Core-Slice ausreichend.

## Bewusste Scope-Grenze

Bis der Core-Slice überzeugt, entstehen keine neuen:

- Capture- oder Objective-Systeme;
- Tech Trees;
- Ressourcenarten;
- Commander-Fähigkeiten;
- RPG- oder Meta-Progressionen;
- Gebäudearten;
- Levels oder umfangreichen Menüs.

## Erfolgskriterien

Level 1 ist erfolgreich, wenn eine Lane, automatische Drone-Waves, permanente Energie, sofortige Verstärkung, sichtbare Squads, ein regelgleicher Gegner, mehrere Sekunden dauernde Kämpfe, flüssiges Scrollen, ruhiger Hintergrund und zwei randständige Command Carrier gemeinsam funktionieren.

Level 2 erfüllt denselben Vertrag mit zwei klar lesbaren Lanes und einer eindeutigen Lane-Zuweisung für jeden Live-Deployment-Befehl.

Der Core-Slice wird nicht an seiner Featurezahl gemessen. Die entscheidende Frage lautet:

> Macht es Spaß, die Flottenschlacht zu beobachten, im richtigen Moment Verstärkung zu schicken und dadurch sichtbar den Verlauf der Front zu beeinflussen?
