# Skötselkollen: aktiveringsprotokoll för gallringsmallar

## Syfte

Detta protokoll styr hur en identifierad eller digitaliserad gallringsmall får gå från dokumenterad kandidat till aktivt kurvunderlag i Skötselkollen. Protokollet ska förhindra att osäkra värden av misstag visas som kurva, pilotlinje eller högre säkerhet.

## Statusnivåer

- `candidate`: källan eller mallen är identifierad men saknar verifierade värden i appen.
- `draft_digitized`: värden finns som digitaliseringsutkast men är inte färdiggranskade.
- `active_pilot`: begränsat, källstött exempel som får visas som pilot men inte som full kurva.
- `verified`: källvärden är kontrollerade och får användas enligt `activeUse`.
- `full_curve`: aktiv användningsnivå för komplett verifierad kurva.
- `rejected`: posten är granskad och ska inte aktiveras.

Candidate och draft får aldrig användas som aktiv kurva, pilotlinje, full kurva eller säkerhetshöjande underlag.

## Obligatoriska krav före aktivering

En gallringsmall får bara aktiveras om alla krav är uppfyllda:

1. Exakt källa är angiven.
2. Organisation/källa är angiven.
3. Dokumenttitel är angiven.
4. Sida, tabell eller diagram är angiven.
5. Trädslag är angivet.
6. SI/bonitet är angivet.
7. Region är angiven.
8. Beståndsfas/åtgärdstyp är angiven.
9. Alla värden har tydlig enhet.
10. Värden är direkt textvärde, direkt tabellvärde eller manuellt kontrollerad diagramdigitalisering.
11. Begränsningar är dokumenterade.
12. Confidence är satt.
13. Testfall finns.
14. `reviewNeeded` är `false`.
15. `activeUse` ändras först när alla krav ovan är uppfyllda.

## Kodgrind

En post räknas bara som aktivt kurvunderlag när allt detta stämmer:

- `status` är `active_pilot` eller `verified`
- `dataQuality` är `pilot_example`, `verified_text`, `verified_table` eller `chart_digitized_verified`
- `activeUse` är `chart_reference` eller `full_curve`
- `reviewNeeded` är `false`

Om någon del saknas ska posten bara räknas som identifierad källa, candidate, draft eller dokumentation.

## Aktiveringsflöde

1. Lägg in posten som `candidate` med `activeUse: documentation_only`, `dataQuality: candidate_only`, tomma `values` och `reviewNeeded: true`.
2. Om diagram digitaliseras, flytta endast till `draft_digitized` och lägg värden i `draftValues`.
3. Granska källa, enheter, metod, begränsningar och testfall.
4. Flytta verifierade värden från `draftValues` till `values` först efter granskning.
5. Sätt `reviewNeeded: false`.
6. Sätt `status` till `verified` eller `active_pilot`.
7. Sätt `activeUse` till `chart_reference` eller `full_curve`.
8. Kör automatiska tester och lägg till testfall för den nya mallen.

Nästa möjliga verifieringsmål kan vara T22 eller G20, men de är inte aktiva i detta steg.
