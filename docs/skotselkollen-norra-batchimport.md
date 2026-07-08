# Skötselkollen: Norra batchimport

## Sammanfattning

Batchimporten samlar Norra gallringsmallar i en separat datamodul: `js/calculators/norraThinningValues.js`.

Batchimport betyder inte att kurvorna är aktiva. Endast T20 är aktiv pilot. Alla andra mallar är spärrade från aktiv kurvvisning tills de uppfyller aktiveringsprotokollet och godkänns separat.

## Importerade mallar

| SI | Trädslag | Status | Datakvalitet | Värden finns | Aktiv | Nästa kontroll |
| --- | --- | --- | --- | --- | --- | --- |
| T14 | Tall | candidate | candidate_only | Nej | Nej | Exakt sida/tabell/diagram och enheter |
| T16 | Tall | candidate | candidate_only | Nej | Nej | Exakt sida/tabell/diagram och enheter |
| T18 | Tall | candidate | candidate_only | Nej | Nej | Exakt sida/tabell/diagram och enheter |
| T20 | Tall | active_pilot | pilot_example | Ja | Ja | Jämför mot full mall före beslut |
| T22 | Tall | candidate | candidate_only | Nej | Nej | Möjligt nästa verifieringsmål |
| T24 | Tall | candidate | candidate_only | Nej | Nej | Exakt sida/tabell/diagram och enheter |
| T26 | Tall | candidate | candidate_only | Nej | Nej | Exakt sida/tabell/diagram och enheter |
| T28 | Tall | candidate | candidate_only | Nej | Nej | Exakt sida/tabell/diagram och enheter |
| G16 | Gran | candidate | candidate_only | Nej | Nej | Exakt sida/tabell/diagram och enheter |
| G18 | Gran | candidate | candidate_only | Nej | Nej | Exakt sida/tabell/diagram och enheter |
| G20 | Gran | candidate | candidate_only | Nej | Nej | Möjligt nästa verifieringsmål |
| G22 | Gran | candidate | candidate_only | Nej | Nej | Exakt sida/tabell/diagram och enheter |
| G24 | Gran | candidate | candidate_only | Nej | Nej | Exakt sida/tabell/diagram och enheter |
| G26 | Gran | candidate | candidate_only | Nej | Nej | Exakt sida/tabell/diagram och enheter |
| G28 | Gran | candidate | candidate_only | Nej | Nej | Exakt sida/tabell/diagram och enheter |
| G30 | Gran | candidate | candidate_only | Nej | Nej | Exakt sida/tabell/diagram och enheter |
| G32 | Gran | candidate | candidate_only | Nej | Nej | Exakt sida/tabell/diagram och enheter |

## Kvalitetsgrupper

- Active pilot: T20.
- Verified candidate: inga i detta steg.
- Draft/digitalisering: inga i detta steg.
- Candidate utan värden: T14, T16, T18, T22, T24, T26, T28, G16, G18, G20, G22, G24, G26, G28, G30, G32.

## Krav före aktivering

En candidate får inte aktiveras förrän kraven i `docs/skotselkollen-aktiveringsprotokoll.md` är uppfyllda. Det innebär bland annat exakt källa, sida/tabell/diagram, tydliga enheter, dokumenterade begränsningar, testfall och `reviewNeeded: false`.

Om diagramvärden digitaliseras senare ska de först ligga i `draftValues` med `status: draft_digitized`, `dataQuality: chart_digitized_unverified`, `activeUse: documentation_only` och `reviewNeeded: true`.

## Validering

Scriptet `scripts/validate-thinning-data.mjs` kontrollerar att T20 är enda aktiva post, att T20-värdena är oförändrade och att candidate/draft/verified_candidate inte kan ha aktiv användning.
