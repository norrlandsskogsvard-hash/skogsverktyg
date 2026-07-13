# Skotselkollen: aktiverade gallringskurvor

Senast uppdaterad: 2026-07-13

## Nulage efter batch 02

Endast T20 ar aktiv i Skotselkollen.

| Kod | Tradslag | SI | Status | Datakvalitet | Aktiv anvandning | Kommentar |
| --- | --- | ---: | --- | --- | --- | --- |
| T20 | tall | 20 | active_pilot | pilot_example | chart_reference | Befintligt kallstott exempel. Inte full kurva. |

Active curve count: 1  
Active codes: T20

## Forsokta men sparrade i batch 02

| Kod | Tradslag | SI | Status | Orsak |
| --- | --- | ---: | --- | --- |
| T18 | tall | 18 | candidate | Verifierade punktvarden saknas. |
| T22 | tall | 22 | candidate | Verifierade punktvarden saknas. |
| G20 | gran | 20 | candidate | Verifierade punktvarden saknas. |
| G22 | gran | 22 | candidate | Verifierade punktvarden saknas. |

Dessa kurvor far inte visas som aktiv kurva eller graf. De far bara visas som kandiderande kallunderlag tills sida/tabell/diagram, enheter och punktvarden har verifierats.

## Sparrar som fortsatt galler

- T20-vardena far inte andras av import eller kandidater.
- Candidate, verified_candidate och draft_digitized far inte anvandas som aktiv kurva.
- Auto-SI ar inte aktivt.
- `SITE_INDEX_CURVES` ska vara `[]`.
- Bjork/lov far inte anvanda tall-/granmall som facit.
- Gallringsmall ar stod, inte facit.
- Gallringskurvor far inte skapa juridiska beslut, prisandringar eller offert-/kundarkivkoppling.
