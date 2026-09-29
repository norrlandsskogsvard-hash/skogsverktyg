# Faltverktyg: SI, ungskogsvolym och anteckningar

Leverans 2026-09-29 i `D:\GitHub\skogsverktyg`.

## Appflode

- `#/skotselkollen` ar nu en ingang till tre faltverktyg.
- `#/si`: källstödd SI från höjd och **BH-ålder** på 1-4 träd. Totalålder beräknas separat.
- `#/young-volume`: ungefarlig ungskogsvolym fran grundyta eller stamantal.
- `#/circle-plot`: stamantal från cirkelprovyta, med standardytor eller egen radie.
- `#/field-notes`: autosparade anteckningar per fastighet och avdelning.
- Startsida och navigering ger direktatkomst till verktygen. DGV och Hojd ar kvar pa sina tidigare platser.

Skotselbedomningen och kurvgranskningen har tagits bort fran ordinarie navigering. Den tidigare skotselvyn finns kvar i kallkoden for bevarande av arbete och regressionstester, men routern oppnar den inte. Befintliga lokala skotselutkast ar inte raderade. Den tidigare direkta granskningsadressen fungerar fortfarande for kallarbete.

## Underlag och noggrannhet

De tre originalbilder som anvandaren bifogade finns i `assets/field/` och cachas offline. Utgivare, upplaga och fullstandig proveniens framgar inte av utdragen. Bilderna ar anvandarens berakningsunderlag, inte instruktioner till appen.

`fieldReferenceData.js` innehaller avlasta bildpunkter, version `diagram-2026-09-29.1`. Resultaten ar uttryckligen **ungefarliga diagramavlasningar**, inte verifierade originalfunktioner eller beslut om skotsel. Ingen statistisk felmarginal ar faststalld. Dessa punkter ar separata fran befintlig forskningsmatris, SI-motor och gallringspiloter. T18/T20-data och aktiveringsregler har inte andrats.

### SI

- SI använder SLU:s Fakta Skog, faktaruta 3, med publicerade parametrar för tall och gran och H100 som referensålder.
- Fältet tar emot BH-ålder. Med standardval visas ett totalåldersspann som BH-ålder + 7–13 år, i linje med Skogskunskaps praktiska ålderstillägg. Ett eget heltal kan anges när det är känt.
- För gran följer appen källans justering av båda funktionsåldrarna med tre år. Björk och andra lövträd beräknas inte med barrfunktionerna.
- SI visas bara när höjden är över 5 m och samtliga beräknade totalåldrar ligger inom 10–80 år. Totalåldern visas även när SI inte kan beräknas.
- Varje träd beräknas separat. Flera träd sammanfattas som medel av individuella SI; åldersspannet är ett antagande, inte en statistisk felmarginal.
- Underlag: [SLU, Fakta Skog 14/2013](https://pub.epsilon.slu.se/37808/1/johansson-u-et-al-20250717.pdf), [Skogskunskap Ståndortsindex](https://www.skogskunskap.se/rakna-med-verktyg/mata-skogen/standortsindex/) och [Skogskunskap om åldersmätning](https://www.skogskunskap.se/aga-skog/matt-och-matning/redskap-for-matning-av-skogen/).

### Volym

- Grundytebild: grundyta 5-30 m2/ha och grundytevagd medelhojd 3-15 m. Hojdkurvor vid 3, 5, 7, 9, 11, 13 och 15 m; avlasningar vid grundyta 5, 10, 20 och 30.
- Stamantalsbild: 500-10 000 stammar/ha och grundytevagd medelhojd 3-9 m. Kurvor vid 3, 5, 7 och 9 m. Barr anvander ovre kanten och lov nedre kanten; blandat/osakert visas som spann, utan antagen blandningsandel.
- Linjar interpolation mellan avlasningar och hojdserier. Inga berakningar utanfor dessa avlasningsomraden.
- Visning i m3sk/ha, avrundat till 5 m3sk for att undvika falsk decimalprecision. Avrundningen anger inte noggrannheten. Valfri areal ger total m3sk, beraknad innan avrundning.
- Kontrollpunkter: grundyta 20 och hojd 7 ger cirka 75 m3sk/ha. Vid 4 000 stammar/ha och hojd 9 ger bilden cirka 78 for lov och 104 for barr (visas 80 respektive 105).
- Stamantal räknas som antal × 10 000 / provytans area. Standardytor är 10, 20, 25, 50 och 100 m² med avrundade radier; egen radie kan användas. Flera provytor viktas efter sammanlagd area. Det är en geometrisk omräkning, inte en ny röjningsregel.

### Stamantal

- `#/circle-plot` sparar varje provyta lokalt och visar både aktuell provyta och sammanställning.
- 100 m² motsvarar ungefär 5,64 m radie och 25 m² ungefär 2,82 m radie. Appen använder provytans nominella area för standardytor.
- Källstöd: [Skogskunskap, Cirkelprovyta](https://www.skogskunskap.se/rakna-med-verktyg/mata-skogen/cirkelprovyta/) och [ordlistan om cirkelprovyta](https://www.skogskunskap.se/ordlista/c/cirkelprovyta/).

## Anteckningar och sakerhetskopiering

Anteckningar sparas med separata id:n i `skogskalkyl2:fieldNotesV1` i localStorage. SI- och volymutkast har egna nycklar. DGV-/hojdlagring berors inte. Resultat kopplas bara till en avdelning efter aktivt val av anvandaren. Uppdaterade indata tar bort tidigare resultatknapp, sa att inaktuella resultat inte sparas av misstag.

Text kan exporteras och en JSON-sakerhetskopia kan exporteras/aterlasas. Import validerar format och lagger till kopior utan att skriva over befintliga avdelningar. Borttagning kan angras i samma vy. Lagringsfel visas tydligt; osparade anteckningar gar fortfarande att exportera medan sidan ar oppen. Lokal lagring ar inte molnbackup.

## Tester och uppladdning

Kor `npm test` i projektmappen. Nya tester finns i `tests/field-tools.spec.js`; gamla skotseltester monterar den pensionerade vyn direkt, utan produktionsroute. Befintliga modellvalideringar ar kvar.

Tester omfattar 390/1440 px, 1-4 träd, BH-/totalålder, källformel, cirkelprovyta, sparade utkast, volymmetoder, anteckningar, export/import, lagringsfel, offline med bildkällor samt DGV/Höjd med tangentbord, ångra och rensa. Bilder sparas i `test-results/screenshots/`.

Verifierat 2026-09-29: `npm test` passerade samtliga modellvalideringar och 26 Playwright-tester. Mobil- och desktopbilder granskade. Inga console errors i de testade vanliga appflodena. DGV/Hojd-filer och befintliga gallringsvarden har tom git-diff.

PWA-cache: `skogskalkyl-2.0.0-alpha.1-field-tools.2`.

Appen ar fortsatt statisk utan byggsteg. Ladda upp projektets appfiler och den nya mappen `assets/field/` tillsammans med ovriga befintliga mappar till samma GitHub Pages-plats. Inga filer i de gamla projektmapparna har andrats. `node_modules`, `test-results` och lokala loggar ska inte publiceras.
