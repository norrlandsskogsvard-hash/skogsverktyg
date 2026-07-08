# Skötselkollen: källvärdes-backlog

## Syfte

Detta dokument är arbetslista och datakrav för framtida källvärden i Skötselkollen. Backloggen ska hjälpa appen att växa från pilotstöd till mer komplett beslutsstöd utan att osäkra värden blir aktiva regler.

Aktivering av gallringsmallar ska följa `docs/skotselkollen-aktiveringsprotokoll.md`.
Batchstatus för Norra gallringsmallar redovisas i `docs/skotselkollen-norra-batchimport.md`.
Importmall och granskningsflöde för nya Norra-värden beskrivs i `docs/skotselkollen-norra-importflode.md`.
Batch 01 redovisas i `docs/skotselkollen-norra-batch-01.md`.

Backloggen omfattar:

- röjning
- gallring
- slutavverkning
- björkspår
- tall/gran
- löv/björk/al/asp
- Norrland och regionala skillnader
- bonitering och SI
- juridiska spärrar och hänsyn
- praktiska mallar
- Skogskunskap-verktyg
- regionala gallringsmallar

## Struktur för varje framtida värde

Varje kandidatvärde ska dokumenteras med:

- id
- källa
- organisation
- dokumenttitel
- url eller filreferens
- år/version
- hämtad datum
- sida/tabell/avsnitt
- åtgärdstyp: `rojning`, `gallring`, `slutavverkning`, `bonitering`, `juridik`
- trädslag
- region
- SI/bonitet om relevant
- beståndsfas
- parameter
- värde
- enhet
- före-värde om relevant
- efter-värde om relevant
- om värdet är direkt tabellvärde, exempelvärde, diagramvärde, digitaliserat diagram, textregel eller tolkning
- begränsning
- källklass: `law`, `research`, `regional_curve`, `skogskunskap_tool`, `skogskunskap_guidance`, `practice_guide`, `decision_support_reference`, `scenario_reference`, `field_observation`
- status: `candidate`, `verified_candidate`, `draft_digitized`, `active_pilot`, `verified`, `inactive`, `rejected`
- dataQuality: `candidate_only`, `verified_text`, `verified_table`, `pilot_example`, `chart_digitized_unverified`, `chart_digitized_verified`
- activeUse: `documentation_only`, `field_note`, `chart_reference`, `full_curve`
- values: verifierade värden som får användas enligt aktiv användning
- draftValues: utkastvärden som inte får användas i graf eller säkerhet
- extractionNotes
- reviewNeeded: `true`/`false`
- confidence: `low`, `medium`, `high`
- `canActivateInLogic`: `true`/`false`
- `requiredTests`
- kommentar

## Exempelposter, inte nya aktiva regler

### T20-pilotexempel

- id: `norra-tall-t20-pilot`
- källa: Gallringsriktlinjer & gallringsmallar norra Sverige
- organisation: regionalt gallringsunderlag
- åtgärdstyp: `gallring`
- trädslag: tall
- region: norra Sverige
- SI/bonitet: T20
- källklass: `regional_curve`
- status: `active_pilot`
- dataQuality: `pilot_example`
- activeUse: `chart_reference`
- reviewNeeded: `false`
- confidence: `medium`
- `canActivateInLogic`: `true`, men endast som befintligt pilot-/visningsstöd
- kommentar: T20-värdena är redan inlagda som pilot/exempel. De får inte ändras utan separat källkontroll och test.

### Norra tallmallar, candidate

- id: `norra-tall-t14-candidate`, `norra-tall-t16-candidate`, `norra-tall-t18-candidate`, `norra-tall-t22-candidate`, `norra-tall-t24-candidate`, `norra-tall-t26-candidate`, `norra-tall-t28-candidate`
- källa: Gallringsriktlinjer & gallringsmallar norra Sverige
- åtgärdstyp: `gallring`
- trädslag: tall
- region: norra Sverige
- källklass: `regional_curve`
- status: `candidate`
- precision: `documentation_only`
- dataQuality: `candidate_only`
- activeUse: `documentation_only`
- reviewNeeded: `true`
- confidence: `low`
- `canActivateInLogic`: `false`
- kommentar: Identifierade mallar utan verifierade/digitaliserade värden i appen. De får inte skapa aktiv kurva.
- möjlig nästa verifiering: T22, men inte aktiverad ännu
- batchstatus `.14`: T14/T16/T18/T22/T24/T26/T28 är `candidate`
- batch 01: T22, T18 och T24 försöktes som första batch men saknar verifierade värden och ligger kvar som `candidate`

### Norra granmallar, candidate

- id: `norra-gran-g16-candidate`, `norra-gran-g18-candidate`, `norra-gran-g20-candidate`, `norra-gran-g22-candidate`, `norra-gran-g24-candidate`, `norra-gran-g26-candidate`, `norra-gran-g28-candidate`, `norra-gran-g30-candidate`, `norra-gran-g32-candidate`
- källa: Gallringsriktlinjer & gallringsmallar norra Sverige
- åtgärdstyp: `gallring`
- trädslag: gran
- region: norra Sverige
- källklass: `regional_curve`
- status: `candidate`
- precision: `documentation_only`
- dataQuality: `candidate_only`
- activeUse: `documentation_only`
- reviewNeeded: `true`
- confidence: `low`
- `canActivateInLogic`: `false`
- kommentar: Identifierade mallar utan verifierade/digitaliserade värden i appen. De får inte räknas som aktivt kurvunderlag.
- möjlig nästa verifiering: G20, men inte aktiverad ännu
- batchstatus `.14`: G16/G18/G20/G22/G24/G26/G28/G30/G32 är `candidate`
- batch 01: G20 och G22 försöktes som första batch men saknar verifierade värden och ligger kvar som `candidate`

Diagramdigitalisering av tall- eller granmallar kräver separat källkontroll, dokumenterad metod, enhet, region, SI och testfall.

### Skogskunskap Gallringsmall barr/löv

- id: `skogskunskap-gallringsmall-barr-lov`
- källa: Skogskunskap
- åtgärdstyp: `gallring`
- trädslag: barr/löv
- källklass: `skogskunskap_tool`
- status: `candidate`
- confidence: `low`
- `canActivateInLogic`: `false`
- kommentar: Framtida verktygsstöd. Inga värden är aktiverade.

### Skogskunskap Röjningsanalys

- id: `skogskunskap-rojningsanalys`
- källa: Skogskunskap
- åtgärdstyp: `rojning`
- källklass: `skogskunskap_tool`
- status: `candidate`
- confidence: `low`
- `canActivateInLogic`: `false`
- kommentar: Framtida lönsamhets-/röjningsstöd. Inga priser eller gränser är aktiverade.

### Skogskunskap Röjningsklockan

- id: `skogskunskap-rojningsklockan`
- källa: Skogskunskap
- åtgärdstyp: `rojning`
- källklass: `skogskunskap_tool`
- status: `candidate`
- confidence: `low`
- `canActivateInLogic`: `false`
- kommentar: Säsongs-/riskstöd. Inte kostnadsmodell eller beståndsmodell.

### Skogskunskap Röjningsmall Björk/Klibbal/Asp

- id: `skogskunskap-rojningsmall-bjork-klibbal-asp`
- källa: Skogskunskap
- åtgärdstyp: `rojning`
- trädslag: björk/klibbal/asp
- källklass: `skogskunskap_tool`
- status: `candidate`
- confidence: `low`
- `canActivateInLogic`: `false`
- kommentar: Lövröjningsstöd. Inga stamantal eller höjdgränser aktiveras.

### Norra Skog 2024

- id: `norra-skog-skotselmallar-2024`
- källa: Norra Skog 2024
- åtgärdstyp: skötsel
- källklass: `practice_guide`
- status: `candidate`
- confidence: `low`
- `canActivateInLogic`: `false`
- kommentar: Praktisk skötselmall och rådgivande stöd. Inga hårda regler.

### INGVAR

- id: `ingvar-reference`
- källa: INGVAR
- åtgärdstyp: gallring/skötsel
- källklass: `decision_support_reference`
- status: `inactive`
- confidence: `medium`
- `canActivateInLogic`: `false`
- kommentar: Beslutsstödsreferens, inte facit.

### Heureka

- id: `heureka-reference`
- källa: Heureka
- åtgärdstyp: scenario/skötsel
- källklass: `scenario_reference`
- status: `inactive`
- confidence: `medium`
- `canActivateInLogic`: `false`
- kommentar: Scenarioverktyg, inte fältgräns.

## Vad får aktiveras i logik?

Ett värde får bara aktiveras som kurva om:

- källan är tydlig
- värdet är verifierat
- enheten är tydlig
- trädslag, region och fas är tydliga
- begränsning är dokumenterad
- testfall finns
- `status` är `active_pilot` eller `verified`
- `dataQuality` är `verified_text`, `verified_table`, `pilot_example` eller `chart_digitized_verified`
- `activeUse` är `chart_reference` eller `full_curve`
- `reviewNeeded` är `false`
- värdet inte används som facit om källtypen bara är praktisk mall eller verktygsstöd

Praktiska mallar, Skogskunskap-verktyg och beslutsstödsreferenser kan stödja bedömningar, men de får inte ensamma skapa hög säkerhet eller ersätta lagkrav, forskning, regionala mallar och fältbild.
