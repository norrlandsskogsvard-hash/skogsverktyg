# Skotselkollen: Norra gallringsvarden

## Syfte

Detta dokument beskriver kallvardespaketet for Norra gallringsriktlinjer/gallringsmallar i Skotselkollen. Syftet ar att skilja pa aktiv pilot, identifierad kalla och saknade verifierade kurvdata.

Norra gallringsmallar anvands som regionalt kurv- och jamforelseunderlag nar vardena ar tydligt kallstodda. Candidate-poster far inte skapa aktiv kurva eller hoja sakerhet som om kurvan vore verifierad.

## Aktiv pilot: T20

Kalla: Gallringsriktlinjer & gallringsmallar, norra Sverige  
Sida: s. 36, exempel normalfall T20  
Status: active_pilot  
Precision: direct_text_example  
Data quality: pilot_example  
Aktiv anvandning: chart_reference  
Review needed: false  
Begransning: exempelvarden, inte komplett digitaliserad kurva.

| Handelse | Ovre hojd, m | Grundyta fore, m2/ha | Grundyta efter, m2/ha | Totalalder | Stammar fore | Stammar efter |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1:a gallring | 14,5 | 24,5 | 18,5 | 59 | 1650 | 1100 |
| 2:a gallring | 18,0 | 28,0 | 20,5 | 82 | 1100 | 700 |
| Slutavverkning enligt exempel | 22,0 | 31,5 | 0 | 125 | 700 | 0 |

T20-piloten ska visas som exempel/pilot och inte som full kurva.

## Aktiv fälttest/pilot: T18

Källa: Gallringsriktlinjer & gallringsmallar, norra Sverige  
Sida: s. 12, TALL T18  
Status: active_field_pilot  
Precision: field_test_visual_reading  
Data quality: visual_estimate_from_source  
Aktiv användning: true  
Review needed: true  
Field test: true  
Can be used for final decision: false  
Begränsning: fälttest/visuell avläsning, behöver praktisk kontroll och är inte fullständigt verifierad tabellkurva.

| Händelse | Övre höjd, m | Grundyta före, m2/ha | Grundyta efter, m2/ha | Totalålder | Stammar före | Stammar efter | Notering |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1:a gallring | 15,0 | 25,8 | 16,0 | saknas | 1450 | 900 | Osäker visuell avläsning. Källan anger efter gallring 1000-800 stammar/ha. |
| 2:a gallring | 18,0 | 27,0 | 17,6 | saknas | 900 | 625 | Osäker visuell avläsning. Källan anger efter gallring 750-500 stammar/ha. |
| Slutavverkning enligt diagram | 21,0 | 30,8 | 0 | 135 | 625 | 0 | Slutålder är textuppgift. Höjd och grundyta är visuellt avlästa ur diagrammet. |

T18 får användas i Skötselkollen när trädslag är tall och SI väljs manuellt som T18. Den får inte användas som fullständigt verifierad kurva och auto-SI får inte välja T18 automatiskt.

## Identifierade men ej digitaliserade mallar

Tall: T14, T16, T22, T24, T26, T28  
Gran: G16, G18, G20, G22, G24, G26, G28, G30, G32

Dessa poster har status `candidate`, precision `documentation_only`, `dataQuality: candidate_only`, `activeUse: documentation_only`, tomma `values`, tomma `draftValues` och `reviewNeeded: true`. De ska bara visas som identifierad kalla eller saknat verifierat underlag.

## Batch 02: kontrollerad aktiveringsgranskning

Batch 02 i `.28` gick igenom T18, T22, G20 och G22 som en liten aktiveringsbatch. Utfallet blev att inga nya kurvor aktiverades.

Orsak: befintlig kallbank, batch-01 och batch-02 saknar verifierade punktvarden for gallringspunkter. Det finns darfor inget sakert underlag for `topHeight`, `basalAreaBefore`, `basalAreaAfter`, alder eller stamantal for dessa kurvor.

Efter batch 02 galler:

- Active curve count efter .32: 2
- Active codes efter .32: T18, T20
- Field pilot codes efter .32: T18
- Sparrade kandidater i batchen: T22, G20, G22
- T20 ar oforandrad
- Auto-SI ar fortsatt sparrad och `SITE_INDEX_CURVES` ar `[]`
- Bjork/lov anvander inte tall-/granmall

Efter `.32` ar T18 inte langre en candidate-post utan aktiv fälttest/pilot med `reviewNeeded: true`, `fieldTest: true`, `dataQuality: visual_estimate_from_source` och `canBeUsedForFinalDecision: false`. T22, G20, G22 och ovriga kandidater ar fortsatt sparrade.

Se aven `docs/skotselkollen-aktiverade-gallringskurvor.md` och `docs/generated/norra-thinning-import-report.md`.

## Krav innan ny mall far aktiveras

En ny mall eller kurva far bara aktiveras nar foljande ar klart:

- exakt kalla
- sida, tabell eller diagram
- direkt tabell/textvarde eller kontrollerad digitalisering
- enhet
- region
- tradslag
- SI
- testfall
- begransning
- `reviewNeeded: false`

Diagramdigitalisering kraver separat kontroll och dokumentation. Inga varden far gissas fran bilder eller grafer.

T18 i `.32` ar ett separat faltpilot-undantag: den ar aktiv for test i appen, men ska visas som visuell avlasning, `reviewNeeded: true` och inte slutligt verifierad.

Aktivering ska folja `docs/skotselkollen-aktiveringsprotokoll.md`.
