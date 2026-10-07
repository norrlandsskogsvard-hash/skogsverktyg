# Naturvärden och SI i fält

## Naturvärdesunderlaget

Källor från användaren: `5214_borealexcel_-_2_sidig.pdf` (Skogsbiologerna AB, Borealexcel2004) och `5213_Norrborealman2015 (1).doc` (Drakenberg/Lindhe 2015). Originalfilerna distribueras inte med appen. Kontrollera licens och rätt till offentlig spridning av den digitaliserade blanketten med rättighetshavaren före publicering.

PDF sida 2 har digitaliserats genom att läsa frågeradernas text och ringarnas vektorkoordinater, inte genom att gissa poäng. Totalt 80 frågor, 300 ringar och 50 poängmöjligheter per kolumn. Källfilens SHA-256 sparas i `natureReferenceData.js`. Den renderade sidan har kontrollerats visuellt. Frågor 1–40 är ståndort, 41–80 bestånd. Varje tillämpligt Ja ger en poäng. Högre nivåer för samma företeelse inkluderar tidigare nivåer; beroendena finns uttryckligen i `NATURE_PARENTS`. Ett motsägande Nej skrivs aldrig över tyst utan flaggas.

### Viktig regional skillnad

PDF-rubriken anger **ej AC/BD-län**. Användaren har 2026-10-07 uttryckligen bekräftat att detta är rätt blankett även för AC/BD och att rubriken är felskriven. Appen tillåter därför poäng i Västerbotten/Norrbotten med användarens rättelse som redovisad grund, inte som oberoende verifierad utgivaruppgift. Manualen anger nordligt boreal skog nedanför fjällnära skog. Skillnader i frågor finns fortfarande: PDF punkt 41 nämner hassel, manualen hägg. PDF:s frågor och ringmatris har inte ändrats eller blandats med manualens version. För okända eller andra områden finns observationsläge.

### Arbetsflöde och säkerhet

Välj arbetsavdelning och biotopgrupp. Då behövs normalt 50 relevanta frågor; jämförelse mellan alla grupper omfattar 80. En fråga åt gången, valfri automatisk nästa fråga, kategorival, tillbaka, återställ svar och nästa obesvarade. Alla svar finns i en utfällbar översikt. Nej, osäkert och ej bedömt är olika tillstånd. Observerade poäng visas med färdigställandestatus, inte som slutlig naturvärdesklass. Resultatet är inte en juridisk kontroll eller ett åtgärdstillstånd.

Arbetsunderlag autosparas i `natureAssessmentsV1`, separat per avdelnings-id; ett fristående underlag finns också. Spara till avdelning skapar en tidsstämplad rapport i anteckningen och ett strukturerat `nature-assessment`-objekt i `measurements` med råsvar, metadata och källversion. Anteckningssäkerhetskopian bevarar det sparade objektet. Arbetsutkast som ännu inte förts till anteckningar ingår inte i anteckningssäkerhetskopian: spara rapporten eller exportera underlaget innan enheten byts eller lagringen rensas.

Inga nya poängklassgränser, automatiska artskyddsbeslut eller skötselåtgärder införs. Areal påverkar inte poäng med någon påhittad multiplikator. Lokalt sammanhang, region, biotop, areal, artfynd och landskap måste bedömas professionellt.

## SI och metodval

Källor kontrollerade 2026-10-07:

- [Skogskunskap: Om Ståndortsindex](https://www.skogskunskap.se/rakna-med-verktyg/mata-skogen/standortsindex/om-standortsindex/): pekar på SLU:s funktioner i Fakta Skog 14/2013.
- [SLU: nya höjdutvecklingskurvor](https://pub.epsilon.slu.se/37808/1/johansson-u-et-al-20250717.pdf): faktaruta 3 för tall/gran, tabell 1 om ålder, faktaruta 1 om lämplighet/metodval. H100 i nuvarande funktioner avser totalålder; gran använder ålder minus tre i båda funktionsleden.
- [Skogsskötselserien 1](https://www.skogsstyrelsen.se/globalassets/mer-om-skog/skogsskotselserien/skogsskotsel-serien-1-skogsskotselns-grunder-och-samband.pdf), sidorna 37–43: metodval, övre höjd och krav på provträd. Äldre boniteringskurvors BH-åldersbasis får inte blandas med de nyare totalåldersfunktionerna.

BH-ålder är fortsatt indata. Nya utkast föreslår SI-anpassat tabelltillägg; redan sparade utkast behåller sitt tidigare åldersval. Känd totalålder per träd, eget gemensamt tillägg och grov schablon 7–13 år finns också. Det nya tabelltillägget beskrivs utförligt i [SI och ålderstillägg](si-aldersunderlag.md). Befintliga SLU-koefficienter, tillämpningsålder och beräkningar med samma gamla åldersval ändras inte. Nytt åldersunderlag kan däremot ge ett annat SI. Spann beskriver antaganden, inte statistisk felmarginal.

Valfritt preliminärt modellförslag använder **samma funktion med faktisk ålder**, utan klippning till 10 eller 80. Appen gör alltså en tydligt redovisad extrapolation, inte en källstödd utvidgning av giltighetsområdet. Låg säkerhet visas och följer med till avdelningsanteckningen. Vid osäker provträdslämplighet är förslaget också preliminärt även inom åldersområdet. För höjd högst 5 m eller tydligt olämpliga träd ges inget numeriskt förslag: använd intercept/ståndortsegenskaper eller andra representativa provträd. Björk och andra lövträd beräknas inte med barrfunktioner.

## Kontroll

`npm test` innehåller blankettmatris, nivåberoenden, motsägelser, regionkontroll, avdelningsisolering, anteckningsöverföring, JSON-säkerhetskopia, SI-förslag och befintliga beräkningar. SI-tabeller och självkonsekvent åldersmatchning kontrolleras över båda trädslagen. Browserkontroller körs i 390 och 1440 pixels bredd. PWA-cache: `skogskalkyl-2.0.0-alpha.1-si-falt.1`.
