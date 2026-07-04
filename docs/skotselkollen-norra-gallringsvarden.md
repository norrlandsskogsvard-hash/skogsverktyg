# Skötselkollen: Norra gallringsvärden

## Syfte

Detta dokument beskriver första källvärdespaketet för Norra gallringsriktlinjer/gallringsmallar i Skötselkollen. Syftet är att skilja på aktiv pilot, identifierad källa och saknade verifierade kurvdata.

## Roll i appen

Norra gallringsmallar används som regionalt kurv- och jämförelseunderlag när värden är tydligt källstödda. I detta steg aktiveras inga nya fulla gallringskurvor.

## Begrepp

- Pilot/exempelvärde: direkt källstött exempel som får visas som pilot, men inte som full kurva.
- Full digitaliserad kurva: komplett och verifierad kurvdata som kan visa zoner eller kurvlinjer för vald kombination.
- Candidate-post: identifierad källa eller mall som ännu saknar verifierade värden i appen.
- Inaktiv källa: dokumenterad referens som inte används i aktiv logik.

Candidate-poster får inte skapa aktiv kurva eller höja säkerhet som om kurvan vore verifierad.

## Aktiv pilot: T20

Källa: Gallringsriktlinjer & gallringsmallar, norra Sverige  
Sida: s. 36, exempel normalfall T20  
Status: pilot  
Precision: direct_text_example  
Aktiv användning: chart_reference  
Begränsning: exempelvärden, inte komplett digitaliserad kurva.

| Händelse | Övre höjd, m | Grundyta före, m²/ha | Grundyta efter, m²/ha | Totalålder | Stammar före | Stammar efter |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1:a gallring | 14,5 | 24,5 | 18,5 | 59 | 1650 | 1100 |
| 2:a gallring | 18,0 | 28,0 | 20,5 | 82 | 1100 | 700 |
| Slutavverkning enligt exempel | 22,0 | 31,5 | 0 | 125 | 700 | 0 |

T20-piloten ska visas som exempel/pilot och inte som full kurva.

## Identifierade men ej digitaliserade mallar

Tall:

- T14
- T16
- T18
- T22
- T24
- T26
- T28

Gran:

- G16
- G18
- G20
- G22
- G24
- G26
- G28
- G30
- G32

Dessa poster har status `candidate`, precision `documentation_only` och aktiv användning `documentation_only`. De ska bara visas som identifierad källa eller saknat verifierat underlag.

## Krav innan ny mall får aktiveras

En ny mall eller kurva får bara aktiveras när följande är klart:

- exakt källa
- sida
- direkt tabell/textvärde eller kontrollerad digitalisering
- enhet
- region
- trädslag
- SI
- testfall
- begränsning

Diagramdigitalisering kräver separat kontroll och dokumentation. Inga värden får gissas från bilder eller grafer.
