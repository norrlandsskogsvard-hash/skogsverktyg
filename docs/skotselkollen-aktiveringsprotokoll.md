# Skotselkollen: aktiveringsprotokoll for gallringsmallar

## Syfte

Detta protokoll styr hur en identifierad eller digitaliserad gallringsmall far ga fran dokumenterad kandidat till aktivt kurvunderlag i Skotselkollen. Protokollet ska forhindra att osakra varden av misstag visas som kurva, pilotlinje eller hogre sakerhet.

## Statusnivaer

- `candidate`: kallan eller mallen ar identifierad men saknar verifierade varden i appen.
- `verified_candidate`: text- eller tabellvarden finns i kallbanken, men separat aktiveringsbeslut saknas.
- `draft_digitized`: varden finns som digitaliseringsutkast men ar inte fardiggranskade.
- `active_pilot`: begransat, kallstott exempel som far visas som pilot men inte som full kurva.
- `verified`: kallvarden ar kontrollerade och far anvandas enligt `activeUse`.
- `rejected`: posten ar granskad och ska inte aktiveras.

Candidate, verified_candidate och draft far aldrig anvandas som aktiv kurva, pilotlinje, full kurva eller sakerhetshojande underlag.

## Kodgrind

En post raknas bara som aktivt kurvunderlag nar allt detta stammer:

- `status` ar `active_pilot` eller `verified`
- `dataQuality` ar `pilot_example`, `verified_text`, `verified_table` eller `chart_digitized_verified`
- `activeUse` ar `chart_reference` eller `full_curve`
- `reviewNeeded` ar `false`

Om nagon del saknas ska posten bara raknas som identifierad kalla, candidate, draft eller dokumentation.

## Obligatoriska krav fore aktivering

En gallringsmall far bara aktiveras om alla krav ar uppfyllda:

1. Exakt kalla ar angiven.
2. Organisation/kalla ar angiven.
3. Dokumenttitel ar angiven.
4. Sida, tabell eller diagram ar angiven.
5. Tradslag ar angivet.
6. SI/bonitet ar angivet.
7. Region ar angiven.
8. Bestandsfas/atgardstyp ar angiven.
9. Alla varden har tydlig enhet.
10. Varden ar direkt textvarde, direkt tabellvarde eller manuellt kontrollerad diagramdigitalisering.
11. Minst en verifierad gallringspunkt finns i `values`.
12. Begransningar ar dokumenterade.
13. Confidence ar satt.
14. Testfall finns.
15. `reviewNeeded` ar `false`.
16. `activeUse` andras forst nar alla krav ovan ar uppfyllda.

## Batch 02-beslut

T18, T22, G20 och G22 granskades for kontrollerad aktivering i `.28`. Ingen av dem aktiverades eftersom verifierade punktvarden saknas.

Efter batch 02:

- Endast T20 ar aktiv.
- Active codes: T20.
- T20-vardena ar oforandrade.
- T18, T22, G20 och G22 ar fortsatt `candidate`, `activeUse: documentation_only` och `reviewNeeded: true`.
- Auto-SI ar fortsatt sparrad och `SITE_INDEX_CURVES` ar `[]`.

## Batch 03 assisted extraction

`.30` skapade assisted extraction-underlag fran Norra-PDF:en for T18, T22, G20 och G22. Underlaget identifierar kurvsidor men ger inte sakra diagramkoordinater for fulla gallringspunkter.

Batch 03 far darfor inte ga direkt till aktiv kurva:

- Alla assisted rader har `activeUse: false`.
- Alla assisted rader har `reviewNeeded: true`.
- Alla assisted rader med `confidence: low` maste granskas manuellt.
- T20 anvands endast som integritetskontroll och andras inte.
- Aktiv kurva kraver separat batch efter verifierade punktvarden.

## Aktiveringsflode

1. Lagg in posten som `candidate` med `activeUse: documentation_only`, `dataQuality: candidate_only`, tomma `values` och `reviewNeeded: true`.
2. Om tydliga text- eller tabellvarden laggs in utan aktiveringsbeslut, anvand `verified_candidate`, `activeUse: documentation_only` och `reviewNeeded: true`.
3. Om diagram digitaliseras, flytta endast till `draft_digitized`, anvand `dataQuality: chart_digitized_unverified` och lagg varden i `draftValues`.
4. Granska kalla, enheter, metod, begransningar och testfall.
5. Flytta verifierade varden fran `draftValues` till `values` forst efter granskning.
6. Satt `reviewNeeded: false`.
7. Satt `status` till `verified` eller `active_pilot`.
8. Satt `activeUse` till `chart_reference` eller `full_curve`.
9. Kor automatiska tester och lagg till testfall for den nya mallen.

Gallringsmall ar stod, inte facit.
