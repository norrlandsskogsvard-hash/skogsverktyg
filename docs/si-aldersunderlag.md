# SI och ålderstillägg

Kontrollerat 2026-10-07. Detta steg förbättrar åldersunderlaget, inte den biologiska precisionen hos själva höjdmodellen. Inga gallringskurvor aktiveras.

## Källor och olika åldersreferenser

- [Skogskunskap: Om Ståndortsindex](https://www.skogskunskap.se/rakna-med-verktyg/mata-skogen/standortsindex/om-standortsindex/) hänvisar till de nya höjdutvecklingsfunktionerna i Fakta Skog 14/2013. Verktyg är modeller och förenklingar.
- [SLU: Fakta Skog 14/2013](https://pub.epsilon.slu.se/37808/1/johansson-u-et-al-20250717.pdf), faktaruta 3, ger befintlig tall-/granformel. Den använder totalålder. För gran dras tre år från båda funktionsåldrarna. Källans ordinarie observationsområde 10–80 år och kravet på etablerad skog över 5 m behålls.
- [Skogsstyrelsen: Fälthäfte i bonitering, BD](https://shop.skogsstyrelsen.se/shop/9098/art15/37524915-57cb4c-bonitering_BD.pdf), sidorna 4–5, innehåller tabeller för tid till brösthöjd. Tabellerna har kontrollerats visuellt i användarens originalfil, inte enbart genom textutvinning.
- Användarens `Gallringsriktlinjer & gallringsmallar norra Sverige.pdf`, Norra 2007, sidorna 9 och 18, ger samma ålderstabeller. Originalfilen distribueras inte med appen.
- [Skogsskötselserien 1](https://www.skogsstyrelsen.se/globalassets/mer-om-skog/skogsskotselserien/skogsskotsel-serien-1-skogsskotselns-grunder-och-samband.pdf) beskriver boniteringsmetoder och representativa provträd.

De äldre BD-/Norra-diagrammen använder BH-ålder direkt och andra höjdutvecklingskurvor. Appen digitaliserar inte dessa kurvor i detta steg. Bara ålderstabellen används som separat schablon tillsammans med den befintliga SLU-funktionen. Detta kombinerade modellstöd är appens konstruktion; källorna verifierar inte uttryckligen denna kombination.

## Kontrollerade tabeller

| Tall SI (H100) | År till BH |
| --- | --- |
| T14 | 14 |
| T16 | 12 |
| T18 | 10 |
| T20 | 9 |
| T22 | 9 |
| T24 | 8 |
| T26 | 8 |
| T28 | 8 |

| Gran SI (H100) | År till BH |
| --- | --- |
| G16 | 13 |
| G18 | 12 |
| G20 | 11 |
| G22 | 10 |
| G24 | 10 |
| G26 | 9 |
| G28 | 9 |
| G30 | 8 |
| G32 | 8 |

Talltabellen gäller hela Sverige, granens tabell norra Sverige: Norrland och Kopparbergs län enligt källrubriken. Appen kräver rätt område för regionalt grantillägg. De nya SLU-funktionerna gäller tall/gran i hela Sverige; områdesbegränsningen avser ålderstabellen.

## Matchning utan cirkelantagande

För varje träd löses `SI = SLU(höjd, BH-ålder + tillägg(SI), 100)`. Appen interpolerar åren linjärt mellan tabellrader och söker lösningen i varje segment. Dubbelräknade segmentgränser tas bort; endast en entydig lösning accepteras. Ingen avrundning görs innan SI och totalålder räknats fram. Det är inte ett engångsuppslag där ett preliminärt SI låser ett godtyckligt tillägg.

Interpolation är appens uttryckliga antagande, inte en publicerad ny åldersfunktion. Utanför tabellens SI-intervall ges ingen klippt eller extrapolerad tabellmatchning. Välj då känd totalålder, ett styrkt eget tillägg eller grov schablon. Det senare är inte samma precision som uppmätt ålder.

Exempel: tall, 16,0 m och BH-ålder 60 år ger i detta kombinerade modellstöd SI cirka T20,4 och ett tillägg på 9,0 år, alltså totalålder 69,0 år. Närmaste tabellklass T20 är en presentation av detta SI, inte en oberoende andra bonitering.

## Inmatning och begränsningar

Ange höjd och BH-ålder för 1–4 representativa övrehöjdsträd. Vid känd totalålder anges den separat för varje träd, större än BH-åldern. Då används inget schablontillägg. Eget gemensamt tillägg och tidigare 7–13-årsalternativ finns kvar. Sparade utkast byter inte åldersval automatiskt.

Resultatet sammanfattar medel av individuella SI. Spridningen mellan provträd kan visas, men är inte ett konfidensintervall. Blanda inte skilda bestånd i samma grupp. Övre höjd är inte appens vanliga medelhöjd: provträden måste väljas enligt boniteringsmetoden.

Olämpliga/skadade/undertryckta träd får inget numeriskt SI-förslag. Osäkra provträd eller ålder utanför ordinarie modellområde kan efter aktivt val få ett preliminärt förslag med låg säkerhet. Ingen ålder klipps till modellgränserna. Ung skog med höjd högst 5 m hänvisas till annan metod. Intercept- och ståndortstabeller är inte digitaliserade i detta steg; appen låtsas inte kunna ge SI från ännu overifierade indata. Björk använder inte barrfunktioner.

Ålderstabellen är inte en regel för juridisk avverkningsålder. Modellen kontrollerar inte lägsta slutavverkningsålder.

## Sparande och tester

SI visas med en decimal, ålderstillägg med en decimal. Exaktheten i visningen är inte ett mått på biologisk säkerhet. Avdelningsanteckningen får en läsbar sammanfattning; säkerhetskopian innehåller indata, oavrundade resultat, ålderskälla och källversion.

Tester jämför samtliga tabellrader, mellanliggande SI, båda trädslagen, flera åldrar och fram-/bakåträkning. Ogiltig totalålder, saknat tabellstöd, fel region och olämpliga provträd kontrolleras. Äldre SI-alternativ och övriga fältkalkyler regressionstestas. Mobil 390 px och dator 1440 px testas med anteckningsöverföring och återläsning.
