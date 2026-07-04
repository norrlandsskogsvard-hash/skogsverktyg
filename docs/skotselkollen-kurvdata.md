# Skötselkollen kurvdata

Det här dokumentet beskriver vilken kurvdata som är inlagd i Skötselkollen och hur ny data ska läggas till.

## Källor

- Gallringsriktlinjer & gallringsmallar norra Sverige
- Manual Gallringsprogram / INGVAR, som arbetsflödes- och variabelreferens
- Bonitering BD, för kommande SI-underlag

Skogsskötselserien och Skogsvårdslagen används i senare steg för fördjupad skötsel- och juridiktext, inte som kurvdata i detta steg.

## Inlagda värden

Pilotfallet `norra-tall-t20-pilot` bygger på textbaserat exempel:

- Källa: Gallringsriktlinjer & gallringsmallar norra Sverige
- Hänvisning: s. 36, exempel normalfall T20
- Trädslag: tall
- SI: T20
- Region: norra Sverige
- Status: pilot
- Precision: text-example

Inlagda exempelvärden:

| Händelse | Övre höjd, m | Grundyta före, m²/ha | Grundyta efter, m²/ha | Totalålder, år | Stammar före | Stammar efter |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1:a gallring | 14,5 | 24,5 | 18,5 | 59 | 1650 | 1100 |
| 2:a gallring | 18,0 | 28,0 | 20,5 | 82 | 1100 | 700 |
| Slutavverkning enligt exempel | 22,0 | 31,5 | 0 | 125 | 700 | 0 |

## Varför T20 är pilot

T20-data är ett källstött exempelprogram, inte en full digitaliserad gallringskurva eller komplett zonpolygon. Appen får därför visa punkten och exempellinjen, men får inte säga att full gallringskurva finns.

Texten i appen ska vara försiktig: källstött T20-exempel finns, men full regional gallringsmall ska kontrolleras innan åtgärd skrivs in i plan.

## Saknade kurvor

Följande underlag saknas i appens kunskapsbas:

- Kompletta tallkurvor för övriga SI-klasser
- Kompletta grankurvor
- Kompletta björkkurvor
- Källstödda SI-höjdutvecklingskurvor för automatisk SI
- Digitaliserade gallringszoner med kontrollerad precision

## Regler för fler kurvor

Ny kurvdata ska bara läggas in när värden kan knytas till källa.

Använd `status: "complete"` endast när full kurva eller tabell är granskad och kan användas som kurvstatus. Använd `status: "pilot"` för textbaserade exempelprogram. Använd `status: "needsDigitizing"` när källan är ett diagram som behöver digitaliseras. Använd `status: "documentationOnly"` när källan beskriver principer men inte ger säkra värden.

Osäkert avlästa diagram får inte användas som skarpa gränser.
