# Skogskalkyl 2.0

Version: v2.0.0-alpha.1

Skogskalkyl 2.0 är en modern PWA för svenska skogsvårdsentreprenörer och små skogsföretagare. Den här första alpha-versionen innehåller appskal, navigering, responsiv layout, offline-stöd och förberedda moduler för kommande skogliga beräkningar.

## Funktioner i alpha.1

- Fungerande appskal utan backend eller byggprocess
- Hash-baserad navigering som fungerar på GitHub Pages
- Responsiv layout för mobil, surfplatta och desktop
- PWA-manifest och service worker med defensiv cachelogik
- Lokalt sparade inställningar med localStorage
- Förberedda moduler för DGV, medelhöjd, röjning, skogsbruksplan och offert
- Grundläggande kalkylmotor för röjning, planprissättning och offertsummering

## Kör lokalt

Appen kan köras med Live Server eller valfri statisk server.

Exempel med Python:

python -m http.server 5173

Öppna sedan http://localhost:5173/

## GitHub Pages

Lägg filerna i ett GitHub-repo och aktivera GitHub Pages för vald branch. Alla sökvägar är relativa och appen använder #/vy för intern navigering, så inga extra serverregler behövs.

## Nästa steg

- Koppla offertgeneratorn till sparade kalkyler.
- Utöka utskrift och offertmallar.
- Förbereda export av beräkningsunderlag.

## Fältmoduler i aktuell version

### DGV

DGV-modulen låter användaren mata in diametrar i cm med ett stort mobilanpassat inmatningsfält. Värden kan läggas till med Enter eller knapp, tas bort enskilt, ångras och rensas efter bekräftelse. Utkast sparas automatiskt i webbläsarens localStorage.

DGV beräknas med formeln sum(d^3) / sum(d^2). Resultatet visas tillsammans med antal provträd, aritmetiskt medel, median, min, max och standardavvikelse.

### Medelhöjd

Medelhöjdsmodulen låter användaren mata in höjder i meter med samma fältanpassade flöde. Medelhöjd beräknas som aritmetiskt medel och visas tillsammans med antal provträd, median, min, max och standardavvikelse. Utkast sparas automatiskt i localStorage.


### Röjningskalkyl

Röjningskalkylen är utbyggd till en professionell fältmodul. Den bedömer svårighet, produktivitet, tidsåtgång, arbetskostnad, utrustningskostnad, påslag, moms och pris per hektar.

Faktorer som påverkar priset:

- areal
- stamantal före och efter röjning
- medelhöjd
- DGV
- huvudträdslag och lövandel
- röjningstyp
- terräng, vegetation, blockighet, lutning, mark och framkomlighet
- timpris, utrustningskostnad, resa, administration, vinstpåslag och moms

Röjningsutkast sparas automatiskt i localStorage och laddas tillbaka efter omladdning. Modulen kan också skapa en kort offerttext som går att kopiera.

Testa modulen:

1. Öppna appen lokalt eller via GitHub Pages.
2. Gå till #/rojning.
3. Fyll i bestånd, svårighet och prisdata.
4. Klicka på Beräkna.
5. Kontrollera produktivitet, timmar per hektar, total tid, pris per hektar och totalpris.
6. Klicka på Kopiera offerttext och klistra in texten där den ska användas.


### Prissättning skogsbruksplan

Skogsbruksplanmodulen är utbyggd för professionell prissättning av uppdraget att inventera, samla in underlag och ta fram/skapa en skogsbruksplan i ett annat system. Modulen skapar inte själva planen.

Faktorer som påverkar priset:

- areal, antal skiften och antal bestånd
- plantyp: enkel, normal, fördjupad eller revidering
- grundavgift, hektarpris, beståndstillägg, skiftestillägg, karta och administration
- fältdagar, dagpris, fältsvårighet, tillgänglighet och terräng
- kontorstimmar, timpris, kvalitetskontroll och kundgenomgång
- körsträcka, kilometerpris, antal resor och etablering
- administration/påslag, vinstpåslag och moms

Modulen visar komplexitetsindex, pris exkl. moms, pris per hektar, moms och totalpris inkl. moms. Utkast sparas automatiskt i localStorage och en kort offerttext kan kopieras.

Testa modulen:

1. Öppna appen lokalt eller via GitHub Pages.
2. Gå till #/forest-plan-pricing.
3. Fyll i uppdrag, omfattning, fältarbete, kontorsarbete och resa.
4. Klicka på Beräkna.
5. Kontrollera komplexitet, delkostnader, pris/ha och totalpris.
6. Klicka på Kopiera offerttext och klistra in texten där den ska användas.
