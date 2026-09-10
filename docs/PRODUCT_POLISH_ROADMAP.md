# Product-Polish-Roadmap – aktuelle Gesamt-To-do-Liste

Stand: 10. September 2026

Diese Datei ist ab jetzt die kanonische Liste aller noch offenen Produktarbeiten. Die
ältere `IMPLEMENTATION_ROADMAP.md` dokumentiert die bereits abgeschlossenen großen
Umbauten; hier stehen nur der aktuelle Befund, die sinnvollste Reihenfolge und die
Abnahmekriterien für den nächsten Ausbau.

## Aktueller Befund

- [x] Level 1 ist eine große, scrollbar bleibende Ein-Lane-Map mit eigenständigen HQs,
  Top-down-Turrets und größeren Flotten.
- [x] Level 2 besitzt nun die ausgewählte Hybridrichtung **Twin Foundries / Cloud Rift**:
  warme Foundry-Ränder, dunkle Gefechtskorridore und eine zurückhaltende violette
  Wolkenkluft statt einer orangefarbenen Vollfläche.
- [x] Für beide Maps existieren feste Mobile-Viewports und deterministische
  Gefechtsszenen; der Lesbarkeitsvertrag liegt in `VISUAL_READABILITY_CONTRACT.md`.
- [x] Reisegeschwindigkeit, Projektilflugzeit, Formationsabstand und seitliches
  Randrutschen wurden bereits deutlich beruhigt.
- [x] Die neuen Hüllen sind mit eigenen Drones, eng normalisierten Geschossen,
  Galalaxy-Triebwerksflammen, Treffern und echten Galalaxy-Todessequenzen verbunden.
- [ ] Das reale Smartphone-Spielspaß- und Balance-Gate bleibt offen.

## Technischer Audit der neu gemeldeten Punkte

### Triebwerksflammen

Der Befund war korrekt und ist im Produktionspfad behoben. Jede finale Hülle besitzt
nun Pixel-Hardpoints pro Fraktion und Klasse. Die sichtbare Flamme stammt direkt aus
den animierten CC0-Nairan-/Kla'ed-Engine-Frames des Galalaxy-Repositories; nur ein
enger transparenter Quellbereich wird auf die jeweilige Düse gesetzt. Stärke, Phase,
Rotation und Tiefenreihenfolge bleiben schub- und schiffsabhängig.

### Rückwärtsflug und „Push“-Situationen

Der Befund war korrekt. Die taktische Standoff-Korrektur konnte hinter ein Schiff
wandern und es bei weiter auf den Gegner gerichteter Nase rückwärts drücken. Im aktiven
Fix wird die Geschwindigkeit im Zustand `ENGAGING` auf Vorwärts- und Seitenanteil
projiziert: negativer Vorwärtsschub wird entfernt, Übernähe zuerst gebremst und dann
seitlich aufgelöst. Separation verschiebt Verbände nur noch quer zur Lane. Gemessene
Drone- und Nahkampfregressionen bleiben damit ohne rückwärts gerichtete Kampfsgeschwindigkeit.

### Projektile und Galalaxy-Vergleich

Die alte Galalaxy-Bibliothek ist technisch niedriger aufgelöst, aber als Spielgrafik
oft sauberer vorbereitet: enge transparente Bounds, animierte Strips, klare
Bewegungsachse und wenig leere Fläche. Beispiele sind der `45×9` Nairan-Bolt und die
`72×38` Ray-Strips. Die neuen vereinheitlichten Geschosse lagen zunächst als
`192×192` große RGB-Konzeptkacheln auf Schwarz vor. Der aktive V2-Pass wandelt den
Hintergrund in Alpha, normalisiert die sichtbaren Bounds und rendert deutlich kleinere
Körper mit kurzen, waffenspezifischen Trails. Lange Canvas-Linien, Vollkreise und
doppelte Glows wurden zurückgenommen; Fraktionspalette und Hüllenqualität bleiben.

### Todesanimationen

Die zuvor unterdrückten Galalaxy-Destruction-Strips sind jetzt ausdrücklich der aktive
Produktionspfad. Drone/Scout, Fighter, Bomber und Frigate verwenden ihre originalen
Nairan-/Kla'ed-Sequenzen mit 8–18 Frames und 14 FPS. Damit folgt die Umsetzung der
Entscheidung, die bewährte Galalaxy-Todesanimation tatsächlich zu übernehmen; der sehr
kurze Wechsel zur alten Silhouette wird zugunsten des deutlich besseren mehrphasigen
Zerfalls akzeptiert. Strukturen bleiben silhouettenfrei und erhalten eigene längere
Blitz-, Ring- und Trümmerfolgen.

### Lesbarkeit der Spielerflotte auf Level 1

Der gezielte Pass ist integriert: helle Player-Hüllen erhalten auf Level 1 einen
knappen dunklen Kontaktschatten sowie leicht angehobenen Kontrast, ohne Teamring oder
zusätzliche Code-Kontur. Die neue Drone besitzt eine eigene kleine Silhouette; Cyan
bleibt Teamlicht, während Elfenbein und Messing die Kontur gegen den blauen Nebel tragen.

## Bulk 1 – P0: Bewegungsintegrität und echte Hardpoints

**Ziel:** Jede Bewegung sieht beabsichtigt aus; Flammen entstehen sichtbar an den
Düsen.

- [ ] Debug-Overlay für sichtbare Hull-Bounds, Pivot, Düsen, Waffenmündungen,
  Vorwärtsachse, Standoff-Ziel und Separation-Vektor ergänzen.
- [x] Engine-Hardpoints je Fraktion **und** Klasse direkt an den finalen V2-Pixeln
  kalibrieren; Mehrfachdüsen einzeln erfassen.
- [x] Größe, Rotation, Ursprung und Tiefenreihenfolge der animierten Galalaxy-Flammen je
  Hardpoint speichern.
- [x] Flammenintensität an Vorwärtsschub koppeln: Reise stark, Bremsen kurz, Halten
  niedrig; niemals volle Vorwärtsflamme während sichtbarer Rückwärtsbewegung.
- [x] `ENGAGING`-Bewegung auf Vorwärts-/Seitwärtskomponenten aufteilen und dauerhafte
  negative Vorwärtsgeschwindigkeit verhindern.
- [x] Bei zu geringem Abstand: erst bremsen, dann seitlich entflechten, danach wieder
  auf die Feuerlinie einschwenken; kein rückwärts gleitender Standoff-Ausgleich.
- [x] Separation so projizieren, dass Nachbarn ein Schiff nicht entlang der Lane
  rückwärts durch den Verband drücken.
- [x] Broadside-Schiffe lateral ausrichten und halten; Siege-Schiffe bremsen früh;
  leichte Schiffe dürfen kurze, begrenzte Ausweichbögen fliegen, aber nicht endlos
  orbiten.
- [x] Stillstandswächter für lebende Einheiten ergänzen: legitimes Halten von echtem
  Feststecken unterscheiden und nur blockierte Einheiten neu positionieren.
- [x] Regressionen mit Drone-Duell, gemischter Flotte, Basisverteidigung und engem
  Turret-Kampf prüfen; gemessen wird Rückwärtszeit statt nur ein Screenshot.

**Abnahme:** In einem 90-Sekunden-Gefecht gibt es keinen sichtbaren Rückwärtsflug im
normalen Kampfzustand, keine Endlosorbits und keine Flamme neben einer Düse.

## Bulk 2 – P0: Professionelle Projektilfamilien

**Ziel:** Fraktion und Waffenklasse sind am Schussbild erkennbar, ohne dass Canvas-Glow
die eigentliche Form ersetzen muss.

- [x] Alle acht Unified-Projektile auf enge transparente Bounds normalisieren; schwarze
  192er-Quadrate dürfen keine Runtime-Silhouette bestimmen.
- [x] Pro Klasse 4–8 kleine Animationsphasen oder eine klar definierte Body-/Trail-
  Kombination anlegen, orientiert an den Galalaxy-Strips.
- [x] Scout: kleiner, schneller Puls mit kurzer rhythmischer Nachspur.
- [x] Fighter: schmale, helle Impulslanze oder klar getrennte kurze Salve.
- [x] Bomber: sichtbar mechanischer Flugkörper mit eigener Flamme, Rauchimpulsen und
  deutlichem Aufschlag; keine bloße leuchtende Kugel.
- [x] Frigate: schwerer Körper mit langsamem, gewichtigen Rhythmus und klarer
  Breitseitenfolge.
- [x] Player über warmweißen Kern + Cyan/Gold-Bloom, Rival über hellen Kern +
  Coral/Kupfer-Bloom codieren; Form bleibt zusätzlich unterschiedlich.
- [x] Überlange Linien, weiche Vollkreise und doppelte Glows im Canvas-Renderer abbauen.
- [x] Geschwindigkeiten erst nach der neuen visuellen Größe feinjustieren; die bereits
  langsamere Grundkadenz bleibt bestehen.
- [x] Muzzle, Flugkörper und Impact als eine zusammenhängende Ereigniskette prüfen.

**Abnahme:** Auf Level 1 und 2 kann man bei nativer 360-Pixel-Breite Schütze und
Waffenrolle aus drei aufeinanderfolgenden Schüssen erkennen.

## Bulk 3 – P0: Treffer-, Schaden- und Todesfeedback

**Ziel:** Treffer fühlen sich materiell an und jede zerstörte Einheit endet sichtbar.

- [x] Hull-lokalen Hit-Flash kürzer und härter zeichnen; Schildtreffer als separate
  Ripple-Schicht erhalten.
- [x] Impact-Typen für Energie, Projektil, Rakete und schwere Kanone unterscheiden.
- [x] Originale fraktions- und klassenspezifische Galalaxy-Destruction-Strips direkt
  verwenden.
- [x] Todesablauf staffeln: Drone/Scout kurz, Fighter mittel, Bomber mehrstufig,
  Frigate mit Sekundärexplosionen und Trümmern.
- [x] Auf Nutzerwunsch während der Todessequenz bewusst auf die animierte
  Nairan-/Kla'ed-Zerfallsform wechseln.
- [x] Strukturen erhalten längere, aber räumlich begrenzte Zerstörung mit Funken,
  Rauch und ausfallenden Lampen.
- [x] Effekte pro Lane und Team budgetieren; dichte Schlachten dürfen Rückmeldung nicht
  nach „first come“ verlieren.

**Abnahme:** Jeder Kill ist ohne Healthbar wahrnehmbar, verdeckt aber weder das nächste
Ziel noch die Navigation.

## Bulk 4 – P0/P1: Level-1-Kontrast und Einheitenhierarchie

**Ziel:** Player-Schiffe bleiben vor allen Nebel-, Garten- und HQ-Zonen lesbar; Drone,
Scout, Fighter, Bomber und Frigate sind sofort unterscheidbar.

- [x] Dunkle, sehr dünne Silhouetten-Keyline oder gerichteten Kontaktschatten für helle
  Player-Hüllen testen, ohne einen codehaften Teamring einzuführen.
- [x] Cyan nur als Teamlicht/Bloom verwenden; wichtige Konturflächen warmweiß oder
  messingfarben gegen die blaue Nebelzone führen.
- [x] Einen dedizierten, kleineren Drone-Hull statt der Scout-Ableitung produzieren.
- [x] Klassenkonturen, optische Masse und Healthbar-Abstand über beiden Maps prüfen.
- [x] Rivalen-Coral gleichwertig lesbar halten, ohne den Hintergrund rot zu überstrahlen.
- [x] Captures oben, Mitte, unten sowie in früher und dichter Schlacht gegeneinander
  vergleichen.

**Abnahme:** Alle fünf Rollen werden ohne Namen erkannt und keine Fraktion besitzt
einen systematischen Kontrastvorteil.

## Bulk 5 – P1: Strukturen, Turrets und sichtbare Upgrades

**Ziel:** Gebäude sind top-down, bewaffnet, teamzugehörig und ihr Ausbau ist im
Schlachtfeld sichtbar.

- [ ] Turret-Kopf und Rohrformen beider Mapfamilien bei 40–60 Pixeln vereinfachen und
  den Lauf klarer absetzen.
- [x] Rückstoß, Muzzle und Projektilursprung auf echte Waffen-Hardpoints kalibrieren.
- [x] Teamzugehörigkeit über physische Cyan-/Coral-Lampen und Materialeinsätze erhöhen,
  nicht über schwebende Codekreise.
- [x] Bastion-Stufen durch zusätzliche Panzerung, Kondensatoren und Rohrgehäuse zeigen.
- [x] Reactor-, Arsenal- und Hangar-Stufen am HQ als echte Bauteil-/Lichtzustände
  deutlich machen.
- [x] Pending-Ausbau unvollständig anzeigen und an der Wave-Grenze sichtbar aktivieren.

**Abnahme:** Eigentümer, Schussrichtung und mindestens ein aktiver Upgrade-Pfad sind
ohne geöffnetes Menü erkennbar.

## Bulk 6 – P1: Level-2-Abschluss und Umweltbewegung

**Ziel:** Die neue Twin-Foundries-/Cloud-Rift-Map wird vom integrierten Zielbild zum
fertigen, ruhigen Spielraum.

- [x] Hybridrichtung aus warmen Foundries und zurückhaltender Wolkenkluft festlegen.
- [x] Getrennte Rivalen- und Player-Sektoren für die `420×1180`-Welt integrieren.
- [x] Zwei dunkle Gefechtskorridore und eine violette zentrale Trennung erhalten.
- [x] Top-, Center-, Bottom- sowie Drone-/Mixed-Combat-Captures erzeugen.
- [ ] Naht, Hintergrundhelligkeit und Landmark-Dichte nach echtem Smartphone-Test
  einmalig feinjustieren.
- [x] Sehr langsame, separate Nebel-/Staubparallaxe und einzelne warme Fensterimpulse
  ergänzen; keine Bewegung direkt hinter kleinen Einheiten.
- [x] Level-2-Turrets/HQs mit Bulk 5 endgültig in die Foundry-Materialsprache überführen.

**Abnahme:** Level 2 ist sofort wiedererkennbar, wirkt weniger fantasyhaft als das
Cloudsea-Mockup und bleibt in beiden Lanes ruhiger als Level 1.

## Bulk 7 – P1: Navigator, HUD und Mobile-Bedienung

**Ziel:** Die große Welt lässt sich überblicken, ohne wieder eine permanente große
HUD-Leiste einzuführen.

- [x] Navigator-Hitbox auf schmalen Screens etwas verbreitern und Lane-Symbole
  vereinheitlichen.
- [x] Flotten clustern; Turret, HQ, Kampf, Offscreen-Schaden und Kameraausschnitt mit
  einer kleinen festen Formensprache anzeigen.
- [x] Unklare Kürzel und AI-Statusmeldungen aus dem normalen Kampfzentrum entfernen.
- [x] Meldungspriorität für Fehler, Wave-Lock, Upgrade-Aktivierung und gegnerische
  Aktivität festlegen.
- [ ] Kleine Economy-/Upgrade-Texte auf die vereinbarte Mobile-Mindestgröße bringen.
- [ ] Optionalen Drag-and-drop-Versuch vom HQ auf die Lane erst nach stabiler
  Tap-Steuerung als A/B-Prototyp bauen; Tap bleibt vollständig spielbar.

**Abnahme:** Ein neuer Spieler findet einen Offscreen-Kampf und kehrt zum HQ zurück,
ohne dass zentrale Gefechte von Text oder Panels verdeckt werden.

## Bulk 8 – P1: Economy, Upgrade-Wirkung und Balance-Gate

**Ziel:** Ausbau, Forschung und sofortige Flottenstärke sind drei fühlbar konkurrierende
Entscheidungen.

- [ ] Echte Smartphone-Sessions für Rush, Economy, Arsenal/Bastion und Logistics
  beobachten; nicht nur AI-Mittelwerte verwenden.
- [ ] Amortisationszeit, Wave-Slots, Energie-Cap und Upgrade-Aktivierungszeit so
  abstimmen, dass kein Pfad offensichtlich immer korrekt ist.
- [ ] Jede aktive Stufe mit Bulk 5 und den Projektilen aus Bulk 2 sichtbar verknüpfen.
- [ ] Upgrade-Vergleiche in gleichen Seeds und gespiegelten Teamseiten auswerten.
- [ ] Stagnation, Snowballing, ungenutzte Energie und Kompositionsvielfalt dokumentieren.

**Abnahme:** Mindestens zwei plausible Ausgabenpläne pro typischer Spielsituation und
keine unsichtbare „+Prozent“-Forschung ohne wahrnehmbaren Effekt.

## Bulk 9 – P2: Flotten-Spezialisierungen und Carrier-Konzept

**Ziel:** Flottenverbände später individualisieren, ohne den aktuellen Kern mit einer
neuen Einheitenschicht zu überladen. Dieser Bulk ist **Planung, noch keine sofortige
Implementierung**.

### Empfohlene Grundidee

Nicht das geschützte Design oder den Namen eines StarCraft-II-Protoss-Carriers kopieren,
sondern die lesbare Rollenidee übernehmen: ein großes rückwärtiges Trägerschiff setzt
eine begrenzte Gruppe autonomer Abfangdrohnen aus.

- [ ] Datengetriebene `HullSpecialization` entwerfen, die Grundhülle, Kosten,
  Direktwaffe, Verhalten, sichtbare Module und Drone-Kapazität verändert.
- [ ] Frigate als erste Verzweigung vorschlagen:
  **Broadside Cruiser** (direkte schwere Salven) oder **Fleet Tender/Carrier**
  (geringe Direktwaffe, 3–5 gebundene Interceptors).
- [ ] Interceptors klar von den kostenlosen Lane-Drones unterscheiden: kleiner
  Staffelverband, zum Carrier geleast, eigenes Schussbild, zerstörbar und nur mit
  Cooldown/Energie ersetzbar.
- [ ] Carrier weit hinter der Front halten, aber durch Bomber und Durchbrüche
  angreifbar machen; kein endloses kostenloses Drone-Spawning.
- [ ] Upgrade als teure Hangar-/Logistics-Entscheidung anbieten, die mit Broadside,
  Bastion oder sofortiger Flottenmasse konkurriert.
- [ ] Weitere spätere Verzweigungen skizzieren: Scout→Relay Wing,
  Fighter→Interceptor/Ace, Bomber→Torpedo Tender; zunächst nur eine Verzweigung
  prototypisieren.
- [ ] UI nur mit einer Wahl pro Klasse belasten und die Spezialisierung direkt am
  Schiff zeigen (Hangarbuchten, Eskorte, Waffenmodule), nicht als abstraktes Icon allein.
- [ ] Simulation für Drone-Leash, Zielpriorität, Ersatzcooldown, Performancebudget und
  Kill-Credit spezifizieren, bevor Assets erzeugt werden.

**Abnahme vor Implementierungsfreigabe:** Bulks 1–4 sind abgeschlossen, der Kampf ist
auf echter Hardware gut lesbar und das Economy-Gate aus Bulk 8 zeigt genügend Raum für
eine teure Spezialisierungsentscheidung.

## Bulk 10 – P2: Hauptmenü, Marke und Levelauswahl

**Ziel:** Das Frontend verspricht exakt die Qualität und Stimmung, die beide Maps
anschließend liefern.

- [ ] Eigenständigen `Strategy Galalaxy`-Schriftzug/Lockup erstellen.
- [ ] Levelwahl als zwei kompakte Karten mit echten finalen Screenshots umsetzen.
- [ ] Lane-Zahl und taktische Identität in einem Satz lesbar machen.
- [ ] Schwierigkeit, Musik und Vollbild in dieselbe warme Navy-/Elfenbein-/Messing-
  Formensprache integrieren.
- [ ] Pause-, Ergebnis- und Zurück-zum-Hauptmenü-Flows erneut auf fünf Viewports prüfen.

## Bulk 11 – Release-Gate

- [ ] Beide Levels oben, mittig und unten in frühen, gemischten und dichten Gefechten
  auf den fünf Ziel-Viewports erfassen.
- [ ] Keine Simulation von Kamera, Animation oder Framerate abhängig machen.
- [ ] Symmetrie, Ressourcen, Slots, Refunds und Matchende reproduzierbar halten.
- [ ] Framezeit, Bildspeicher, Projektile, Trails, Engine- und Explosionslayer auf
  mobilem Gerät prüfen.
- [ ] Kurze Blindtests für Klasse, Fraktion, Waffe, Schaden, Struktur und Upgrade
  durchführen.
- [ ] README-Screenshots, Assetinventar, Provenance und diese Roadmap aktualisieren.

## Verbindliche Reihenfolge

1. **Bulk 1:** Bewegungsintegrität und Triebwerks-/Waffen-Hardpoints.
2. **Bulks 2–3:** Projektile sowie Treffer-/Todesfeedback als gemeinsamer Combat-VFX-
   Pass.
3. **Bulk 4:** Level-1-Kontrast und echte Drone-/Klassenhierarchie.
4. **Bulks 5–6:** Strukturen/Upgrade-Sichtbarkeit und Level-2-Abschluss.
5. **Bulks 7–8:** Orientierung, HUD, Economy und Spielspaß.
6. **Bulk 9:** Carrier-/Spezialisierungs-Prototyp erst nach bestandenem Kern-Gate.
7. **Bulks 10–11:** Hauptmenü und Release-Polish.

Die ersten drei Schritte sind absichtlich vor neuem Content eingeordnet: Ein Carrier
würde zusätzliche Kleinschiffe, Projektile und Zielwechsel erzeugen und damit genau die
noch offenen Schwächen bei Bewegung und Gefechtsfeedback verstärken. Sobald der
vorhandene Kampf zuverlässig gut aussieht, ist diese Spezialisierung dagegen ein sehr
starker nächster Ausbau.
