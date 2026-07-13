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

## Identifierade men ej digitaliserade mallar

Tall: T14, T16, T18, T22, T24, T26, T28  
Gran: G16, G18, G20, G22, G24, G26, G28, G30, G32

Dessa poster har status `candidate`, precision `documentation_only`, `dataQuality: candidate_only`, `activeUse: documentation_only`, tomma `values`, tomma `draftValues` och `reviewNeeded: true`. De ska bara visas som identifierad kalla eller saknat verifierat underlag.

## Batch 02: kontrollerad aktiveringsgranskning

Batch 02 i `.28` gick igenom T18, T22, G20 och G22 som en liten aktiveringsbatch. Utfallet blev att inga nya kurvor aktiverades.

Orsak: befintlig kallbank, batch-01 och batch-02 saknar verifierade punktvarden for gallringspunkter. Det finns darfor inget sakert underlag for `topHeight`, `basalAreaBefore`, `basalAreaAfter`, alder eller stamantal for dessa kurvor.

Efter batch 02 galler:

- Active curve count: 1
- Active codes: T20
- Nyaktiverade kurvor: inga
- Sparrade kandidater i batchen: T18, T22, G20, G22
- T20 ar oforandrad
- Auto-SI ar fortsatt sparrad och `SITE_INDEX_CURVES` ar `[]`
- Bjork/lov anvander inte tall-/granmall

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

Aktivering ska folja `docs/skotselkollen-aktiveringsprotokoll.md`.
