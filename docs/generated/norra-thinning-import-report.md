# Norra gallringsimport - batch 02 kontrollerad aktivering

Importfil: `data/norra-thinning-import-batch-02.csv`

Batch 02 forsokte aktivera ett litet urval av Norra gallringsmallar: T18, T22, G20 och G22. Inga av dessa aktiverades eftersom verifierade punktvarden saknas i befintlig kallbank, batchdata och dokumentation.

## Sammanfattning

- Rader i batch 02: 4
- Aktiva kurvor efter batch: 1
- Active codes: T20
- Nyaktiverade kurvor: inga
- Sparrade kandidater i batchen: T18, T22, G20, G22
- T20-integritet: oforandrad, inklusive basalAreaBefore 24.5 for forsta gallringen
- Auto-SI: fortsatt sparrad
- SITE_INDEX_CURVES: []

## Aktiverade kurvor

| Kod | Tradslag | Status | Anvandning | Kommentar |
| --- | --- | --- | --- | --- |
| T20 | tall | active_pilot | chart_reference | Befintlig pilot, oforandrad. |

## Sparrade kurvor

| Kod | Tradslag | Status | Datakvalitet | Aktiv | Orsak |
| --- | --- | --- | --- | --- | --- |
| T18 | tall | candidate | candidate_only | Nej | Verifierade punktvarden saknas. |
| T22 | tall | candidate | candidate_only | Nej | Verifierade punktvarden saknas. |
| G20 | gran | candidate | candidate_only | Nej | Verifierade punktvarden saknas. |
| G22 | gran | candidate | candidate_only | Nej | Verifierade punktvarden saknas. |

## Kontrollpunkter

- Kandidater har `activeUse: documentation_only`.
- Kandidater har `reviewNeeded: true`.
- Kandidater har tomma `values` och `draftValues`.
- Inga vardemangder har gissats fran diagram eller bild.
- Bjork/lov kopplas inte till tall-/granmall.
- Gallringsmall ar stod, inte facit.
- Ingen prislogik, juridisk beslutslogik eller offert-/kundarkivkoppling har andrats.
