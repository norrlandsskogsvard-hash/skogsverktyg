# Skotselkollen: Norra reviewed candidates

## Syfte

En `reviewed_candidate` ar en lokalt skapad aktiveringskandidat fran Kurvgranskning. Den betyder att en punktserie har dubbelkontrollerats manuellt mot originaldiagrammet och kan exporteras till en senare importbatch.

Den ar inte en aktiv kurva.

## Nivaer

- `draft`: tomt eller delvis ifyllt lokalt granskningsutkast.
- `assisted extraction`: PDF-underlag som kan visa sida och osaker information, men inte sakra diagramvarden.
- `reviewed_candidate`: manuellt granskad exportkandidat med `activeUse: false`.
- `active_verified`: separat aktiverad kurva efter import, validering och aktiveringsprotokoll.

## Varfor reviewed_candidate inte ar aktiv

Reviewed candidate ar ett transport- och granskningsformat. Det ska kunna kopieras som JSON/CSV och granskas i nasta batch. Det far inte direkt kopplas till `THINNING_CURVES` eller `norraThinningValues.js`.

Alla reviewed candidates ska ha:

- `status: reviewed_candidate`
- `dataQuality: manually_reviewed_from_source`
- `activeUse: false`
- `reviewNeeded: false`

`reviewNeeded: false` betyder att den lokala dubbelkontrollen ar klar. Det betyder inte att kurvan ar aktiv.

## Obligatoriska kontroller

- minst en gallringspunkt med ovre hojd, grundyta fore och grundyta efter
- grundyta fore storre an grundyta efter
- grundyta efter storre an 0 vid gallring
- stamantal fore minst stamantal efter om bada finns
- sourcePage for varje punkt
- granskare/initialer
- bekraftelse: varden kontrollerade mot originaldiagrammet
- granskningsanteckning nar assisted extraction hade low confidence

## Nasta aktiveringsbatch

En reviewed candidate kan anvandas som underlag i en separat aktiveringsbatch. Den batchen maste importera kandidatens varden, validera T20-integritet, kontrollera enheter och forst da besluta om eventuell aktiv kurva.

## Sakerhetssparrar

- T20 ar fortsatt enda aktiva kurva.
- T20-vardena far inte andras.
- Auto-SI ar fortsatt sparrad och `SITE_INDEX_CURVES` ar `[]`.
- Bjork/lov far inte anvanda tall-/granmall som facit.
- Inga juridiska beslut skapas.
- Inga prisandringar skapas.
- Ingen offert- eller kundarkivkoppling skapas.
