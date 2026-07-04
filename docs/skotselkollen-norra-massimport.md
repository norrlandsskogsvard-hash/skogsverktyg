# Skötselkollen: Norra massimport och granskningsgrund

## Syfte

Detta dokument beskriver massimportstrukturen för Norra gallringsmallar i Skötselkollen. Målet är att kunna registrera identifierade tall- och granmallar utan att osäkra eller odigitaliserade kurvor blir aktiva beslutsunderlag.

## Datamodell

Varje källvärdespost kan innehålla:

- `status`: `candidate`, `draft_digitized`, `active_pilot`, `verified`, `inactive`, `rejected`
- `dataQuality`: `candidate_only`, `draft_digitized`, `verified_text`, `verified_table`, `pilot_example`, `chart_digitized_verified`
- `activeUse`: `documentation_only`, `field_note`, `chart_reference`, `full_curve`
- `values`: verifierade och aktiva värden
- `draftValues`: utkastvärden som inte får användas i graf eller säkerhet
- `extractionNotes`: hur värden eller kandidater har identifierats
- `reviewNeeded`: om posten kräver fortsatt granskning

## Aktiveringsregel

En post får bara bli aktiv gallringskurva i appen när alla tre villkor är uppfyllda:

- `status` är `active_pilot` eller `verified`
- `dataQuality` är `verified_text`, `verified_table`, `pilot_example` eller `chart_digitized_verified`
- `activeUse` är `chart_reference` eller `full_curve`

Allt annat ska visas som dokumentation, kandidat eller utkast. Kandidater och utkast får inte skapa kurvlinje, inte höja säkerhet och inte användas som facit.

## Aktiv pilot

Endast T20-exemplet är aktivt i detta steg. Det är `active_pilot`, `dataQuality: pilot_example` och `activeUse: chart_reference`.

T20 är fortfarande ett exempel, inte en full gallringskurva. Värdena ska inte ändras utan separat källkontroll och test.

## Identifierade kandidater

Följande mallar finns som identifierade kandidater:

- Tall: T14, T16, T18, T22, T24, T26, T28
- Gran: G16, G18, G20, G22, G24, G26, G28, G30, G32

Alla dessa har `status: candidate`, `dataQuality: candidate_only`, `activeUse: documentation_only`, tomma `values`, tomma `draftValues` och `reviewNeeded: true`.

## Draft/digitalisering

Om en kurva senare digitaliseras från diagram ska den först ligga som `draft_digitized` med `draftValues`. Den får då visas som utkast i källbanken, men inte i grafen och inte i säkerhetsbedömningen.

För aktivering krävs kontrollerad källa, sida, metod, enhet, region, trädslag, SI, testfall och dokumenterad begränsning.
