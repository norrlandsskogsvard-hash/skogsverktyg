# Skogskalkyl 2.0

## Projektstruktur

Appen ar byggd for GitHub Pages med statiska filer och relativa sokvagar:

- `index.html`, `manifest.json` och `sw.js` ligger i root.
- CSS ligger i `css/`.
- Appens huvudfiler ligger i `js/`.
- Vyer ligger i `js/views/`.
- Fristaende kalkyl- och datamoduler ligger i `js/calculators/`.

Version: v2.0.0-alpha.1

## Kundregister och jobbarkiv

Kundregister och jobbarkiv är tillagt. Modulen gör appen till ett lokalt arbetsarkiv där kunder, fastigheter och uppdrag sparas på enheten i localStorage. Det finns ingen backend, molnlagring eller inloggning.

Funktioner:

- skapa, redigera och ta bort kunder
- skapa, redigera, filtrera och ta bort jobb
- markera jobb som klara
- se antal jobb och offererat värde per kund
- söka på kundnamn, fastighet och kommun
- filtrera jobb på status och jobbtyp
- skapa kund och jobb från senaste sparade offertutkast

Skapa kund manuellt:

1. Gå till #/customers.
2. Fyll i namn, fastighet, kommun och kontaktuppgifter.
3. Klicka på Spara kund.
4. Använd Nytt jobb på kundkortet för att skapa ett uppdrag kopplat till kunden.

Skapa kund och jobb från senaste offert:

1. Gå till #/quote.
2. Fyll i kundnamn och minst en prissatt offertpost.
3. Kontrollera att offerten är giltig och sparad som utkast.
4. Gå till #/customers.
5. Klicka på Skapa kund/jobb från senaste offert.
6. Kontrollera att kunden finns i kundlistan och att jobbet finns i jobbarkivet.

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


### Offertgenerator

Offertgeneratorn kan skapa professionella kundunderlag direkt i appen. Den har fält för företag, kund, offertuppgifter, offertposter, villkor, summering och förhandsvisning.

Funktioner:

- skapa och ändra offertposter manuellt
- räkna summa exkl. moms, moms och total inkl. moms
- rabatt, extra påslag och avrundning
- hämta senaste röjningskalkyl som offertpost
- hämta senaste planpriskalkyl som offertpost
- autospara utkast i localStorage
- kopiera offerttext
- skriva ut eller spara som PDF via webbläsarens utskriftsfunktion

Testa modulen:

1. Öppna appen lokalt eller via GitHub Pages.
2. Gå till #/quote.
3. Fyll i företag, kund och offertuppgifter.
4. Lägg till rader manuellt eller hämta senaste röjning/planpris.
5. Kontrollera summering och förhandsvisning.
6. Klicka på Kopiera offerttext eller Skriv ut / Spara som PDF.
