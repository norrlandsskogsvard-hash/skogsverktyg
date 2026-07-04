# Skötselkollen: källvärdes-backlog

## Syfte

Detta dokument är arbetslista och datakrav för framtida källvärden i Skötselkollen. Backloggen ska hjälpa appen att växa från pilotstöd till mer komplett beslutsstöd utan att osäkra värden blir aktiva regler.

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
- status: `candidate`, `verified`, `pilot`, `inactive`, `rejected`
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
- status: `pilot`
- confidence: `medium`
- `canActivateInLogic`: `true`, men endast som befintligt pilot-/visningsstöd
- kommentar: T20-värdena är redan inlagda som pilot/exempel. De får inte ändras utan separat källkontroll och test.

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

Ett värde får bara aktiveras om:

- källan är tydlig
- värdet är verifierat
- enheten är tydlig
- trädslag, region och fas är tydliga
- begränsning är dokumenterad
- testfall finns
- värdet inte används som facit om källtypen bara är praktisk mall eller verktygsstöd

Praktiska mallar, Skogskunskap-verktyg och beslutsstödsreferenser kan stödja bedömningar, men de får inte ensamma skapa hög säkerhet eller ersätta lagkrav, forskning, regionala mallar och fältbild.
