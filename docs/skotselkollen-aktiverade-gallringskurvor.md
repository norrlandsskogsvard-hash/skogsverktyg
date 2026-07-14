# Skotselkollen: aktiverade gallringskurvor

Senast uppdaterad: 2026-07-14

## Nulage efter batch 05

T20 och T18 ar aktiva i Skotselkollen, men med olika status.

| Kod | Tradslag | SI | Status | Datakvalitet | Aktiv anvandning | Kommentar |
| --- | --- | ---: | --- | --- | --- | --- |
| T20 | tall | 20 | active_pilot | pilot_example | chart_reference | Befintligt kallstott exempel. Inte full kurva. |
| T18 | tall | 18 | active_field_pilot | visual_estimate_from_source | true | Falttest/visuell avlasning fran Norra gallringsmall s. 12. Behover praktisk kontroll. Inte fullstandigt verifierad. |

Active curve count: 2  
Active codes: T18, T20  
Field pilot codes: T18

## Fortsatt sparrade kandidater

| Kod | Tradslag | SI | Status | Orsak |
| --- | --- | ---: | --- | --- |
| T22 | tall | 22 | candidate | Verifierade punktvarden saknas. |
| G20 | gran | 20 | candidate | Verifierade punktvarden saknas. |
| G22 | gran | 22 | candidate | Verifierade punktvarden saknas. |

T22, G20, G22 och ovriga kandidater far inte visas som aktiv kurva eller graf. De far bara visas som kandiderande kallunderlag tills sida/tabell/diagram, enheter och punktvarden har verifierats.

## Sparrar som fortsatt galler

- T20-vardena far inte andras av import eller kandidater.
- T18 ar endast falttest/visuell avlasning och far inte markeras som fullstandigt verifierad.
- Candidate, verified_candidate och draft_digitized far inte anvandas som aktiv kurva.
- Auto-SI ar inte aktivt.
- `SITE_INDEX_CURVES` ska vara `[]`.
- Bjork/lov far inte anvanda tall-/granmall som facit.
- Gallringsmall ar stod, inte facit.
- Gallringskurvor far inte skapa juridiska beslut, prisandringar eller offert-/kundarkivkoppling.
