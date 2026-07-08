# Skötselkollen: Norra batch 01

Batch 01 importerar och granskar värden. Den aktiverar inte nya kurvor.

## Syfte

Batch 01 testar importflödet med de första prioriterade Norra-mallarna:

1. T22
2. G20
3. T18
4. G22
5. T24

Ingen säker källsida, tabellrad eller verifierbart värde fanns tillgängligt i arbetsunderlaget för denna körning. Därför har inga nya numeriska gallringsvärden lagts in.

## Resultat

| Mall | Status | Datakvalitet | Värden verifierade | Aktiv | Källa/sida | Nästa steg |
| --- | --- | --- | --- | --- | --- | --- |
| T22 | candidate | candidate_only | Nej | Nej | Källa identifierad, sida saknas | Hämta exakt sida/tabell/diagram och värden |
| G20 | candidate | candidate_only | Nej | Nej | Källa identifierad, sida saknas | Hämta exakt sida/tabell/diagram och värden |
| T18 | candidate | candidate_only | Nej | Nej | Källa identifierad, sida saknas | Hämta exakt sida/tabell/diagram och värden |
| G22 | candidate | candidate_only | Nej | Nej | Källa identifierad, sida saknas | Hämta exakt sida/tabell/diagram och värden |
| T24 | candidate | candidate_only | Nej | Nej | Källa identifierad, sida saknas | Hämta exakt sida/tabell/diagram och värden |

## Statusfördelning

- `verified_candidate`: 0
- `draft_digitized`: 0
- `candidate`: 5
- TODO/saknar värden: 5

## Granskningsanteckningar

- Inga värden har gissats från diagram.
- Inga digitaliserade diagramvärden har lagts in.
- Inga candidate-poster har `activeUse: chart_reference` eller `full_curve`.
- Alla fem mallar har `activeUse: documentation_only` och `reviewNeeded: true`.

## Krav innan aktivering

För att någon av mallarna ska kunna gå vidare krävs:

- exakt källa och sida/tabell/diagram
- tydliga värden och enheter
- dokumenterad extraktionsmetod
- begränsningar
- testfall
- separat aktiveringsbeslut enligt `docs/skotselkollen-aktiveringsprotokoll.md`

T20 är fortsatt enda aktiva kurvunderlaget.
