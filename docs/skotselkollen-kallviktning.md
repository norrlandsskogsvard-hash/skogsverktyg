# Skötselkollen källviktning

Skötselkollen använder flera kunskapslager och redovisar dem som evidensposter. Syftet är att ge en samlad, försiktig och spårbar bedömning, inte att låta en enskild mall bli facit.

## Källhierarki

Källtyper viktas så här i appens evidensmodell:

| Typ | Vikt | Roll |
| --- | ---: | --- |
| law | 100 | Lagkrav och hänsyn kan kräva kontroll eller stoppa förslag. |
| research | 80 | Forskning, Skogsskötselserien och myndighetsprinciper väger tungt. |
| regional_curve | 70 | Regionala gallringsmallar och kurvor när källstödet är spårbart. |
| field_observation | 60 | Inmatade fältvärden och markerade fältförhållanden. |
| warning | 75 | Varningsflaggor som sänker säkerhet och kräver kontroll. |
| decision_support_reference | 50 | Beslutsstöd som INGVAR, som referensram. |
| scenario_reference | 45 | Scenario- och planeringsstöd som Heureka. |
| practice_guide | 35 | Praktiska skötselmallar, arbetsflöden och råd. |

Vikterna är inte skogliga gränsvärden. De används bara för att beskriva källbalans och säkerhetsnivå.

## Source types

`law` används för lagkrav, hänsyn, anmälan, tillstånd och samråd. Lag kan göra att resultatet kräver juridisk kontroll även när skogliga data pekar mot åtgärd.

`research` används för Skogsskötselserien, forskning och myndighetsunderlag. Denna typ väger tyngre än praktiska mallar men ger inte ensam exakt kurvstatus.

`regional_curve` används för regionala gallringsmallar. T20 Norra Sverige är inlagt som pilot/exempel, inte full kurva.

`decision_support_reference` används för INGVAR. INGVAR är en referens för arbetsgång och variabler, inte facit.

`scenario_reference` används för Heureka. Heureka är en referensram för långsiktiga scenarier, inte en fältgräns.

`practice_guide` används för praktiska skötselmallar som Norra Skog 2024. De kan stödja kontrollpunkter men får aldrig ensamma skapa hög säkerhet.

`field_observation` används för fältdata som användaren anger.

`warning` används för fält- och källvarningar som sänker säkerheten eller kräver kontroll.

## Norra Skog 2024

Norra Skog 2024 klassas som `practice_guide`. Det betyder att materialet kan stödja fältkontroll och arbetsflöde, men det är inte facit och ersätter inte lagkrav, forskning, källstödd kurva eller fältbedömning.

## INGVAR och Heureka

INGVAR klassas som `decision_support_reference`. Det används som referens för arbetsgång och variabler.

Heureka klassas som `scenario_reference`. Det används som referens för scenario- och planeringsperspektiv.

Inget av dessa verktyg används som direkt fältgräns i Skötselkollen.

## Konflikter mellan källor

När källor pekar åt olika håll ska appen vara försiktig:

- Lag- och hänsynsflaggor prioriteras och kan kräva juridisk kontroll.
- Fältvarningar sänker säkerheten och visas som kontrollbehov.
- Practice guide ensam får inte ge hög säkerhet.
- Pilotunderlag visas som pilot, inte som komplett kurva.
- Om forskning, regional kurva och praktisk mall pekar åt samma håll kan säkerheten höjas, men bara när begränsningarna tillåter det.

Om viktig källtyp saknas ska det visas i “Samlad bedömning” och “Källor och antaganden”.
