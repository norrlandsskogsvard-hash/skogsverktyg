# Skogskunskap som källbank

Skogskunskap läggs in i Skötselkollen som källbank och forskningsnära praktiskt verktygsstöd. I detta steg läggs inga numeriska gränsvärden, kurvor eller SI-tabeller in från Skogskunskap.

## Syfte

Syftet är att Skötselkollen ska känna till Skogskunskap som relevant stöd för gallring, röjning, ståndortsindex, bonitering och skogsskötsel. Källorna ska hjälpa appen att redovisa bättre källbalans, men de ska inte ensamma bli facit för ett enskilt bestånd.

## Identifierade källor

- `https://www.skogskunskap.se/`
- `https://www.skogskunskap.se/rakna-med-verktyg/`
- `https://www.skogskunskap.se/rakna-med-verktyg/skogsvard/`
- `https://www.skogskunskap.se/rakna-med-verktyg/skogsvard/gallringsmall/`
- `https://www.skogskunskap.se/rakna-med-verktyg/mata-skogen/standortsindex/`
- `https://www.skogskunskap.se/rakna-med-verktyg/mata-skogen/standortsindex/om-standortsindex/`
- Skogskunskap-material om röjning, gallring och slutavverkning när det kan kopplas säkert till rätt sida och begränsning.

## Source types

`skogskunskap_tool` används för digitala verktyg och mallar. Vikt i modellen: 55.

`skogskunskap_guidance` används för rådgivande artiklar och skötselvägledning. Vikt i modellen: 50.

Båda typerna är stödjande källor. De är inte lag, inte full forskningsmatris och inte facit för enskilt bestånd.

## Inlagda källposter

- Skogskunskap generellt: digital kunskapsbank och rådgivningskälla.
- Räkna med verktyg: verktygsbank för skogliga beräkningar.
- Gallringsmall barr/löv: gallringsstöd, utan inlagda kurvor eller gränsvärden.
- Ståndortsindex: boniteringsstöd och bakgrund till höjdutvecklingskurvor.
- Röjningsanalys/röjningsmall: röjningsstöd som kräver fältbedömning.
- Röjningsmall björk/al/asp: lövröjningsstöd, inte komplett gallringsmall.
- Röjningsklockan: säsongs-/riskstöd, inte beståndsmodell.
- Röja/gallra/slutavverka: praktisk vägledning som ska vägas mot lag, forskning, fältdata och regionala mallar.

## Begränsningar

Skogskunskap-verktyg bygger på modeller och förenklingar. De får inte ensamma ge hög säkerhet i Skötselkollen.

Om bara Skogskunskap och praktiska mallar stödjer en bedömning ska resultatet hållas lågt eller låg/medel och beskrivas som förenklat modellstöd.

Om Skogskunskap, regional gallringsmall och forsknings-/myndighetsgrund senare pekar åt samma håll kan säkerheten höjas, men bara när begränsningarna är tydliga.

## Framtida numeriska regler

Numeriska värden från Skogskunskap får bara läggas in när de är tydligt källhänvisade och kontrollerade. Varje framtida regel ska dokumentera:

- källa
- url
- hämtat datum
- område
- trädslag
- region
- variabel
- värde eller intervall
- enhet
- confidence
- begränsning
- om värdet är direkt tabellvärde, digitaliserat diagram eller texttolkning

Osäkert avlästa diagram får inte användas som skarpa gränser.
