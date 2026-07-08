# Skötselkollen: importflöde för Norra gallringsvärden

## Syfte

CSV-import används för att flera Norra gallringsvärden ska kunna läggas in, granskas och rapporteras i batch utan att appens aktiva kurvor ändras. Import är ett granskningssteg, inte ett aktiveringsbeslut.

## Filer

- `data/norra-thinning-import-template.csv`: tom importmall med rätt kolumner.
- `data/norra-thinning-import-example.csv`: exempel med T20-referensrader samt T22/G20 som tomma kandidater.
- `scripts/import-norra-thinning-values.mjs`: läser CSV och skriver preview/rapport.
- `data/generated/norra-thinning-import-preview.json`: maskinläsbar preview.
- `docs/generated/norra-thinning-import-report.md`: granskningsrapport.

## Så fylls importmallen i

Varje rad beskriver ett värde eller en händelse för en mall. Flera rader med samma `id` grupperas till samma mallpaket.

Viktiga fält:

- `speciesCode`: `T` eller `G`.
- `siteIndex`: SI/bonitet.
- `sourceName`, `sourceRef`, `sourcePage`: källa, dokument och sida/tabell/diagram.
- `topHeight`, `basalAreaBefore`, `basalAreaAfter`, `ageTotal`, `stemsBefore`, `stemsAfter`: värden när de är tydliga.
- `unitHeight`, `unitBasalArea`, `unitAge`, `unitStems`: enheter för värden.
- `status`, `dataQuality`, `activeUse`, `reviewNeeded`: gransknings- och aktiveringsspärr.

## Statusar

- `candidate`: källa eller mall identifierad, men värden saknas eller är inte inlagda.
- `verified_candidate`: text- eller tabellvärden finns, men är inte aktiverade.
- `draft_digitized`: digitaliserat eller osäkert diagramunderlag finns som utkast.
- `active_pilot`: begränsad aktiv pilot, som T20.
- `verified`: verifierat underlag som kan aktiveras efter protokoll.

## Körning

Kör standardexemplet:

```bash
npm run import:norra-thinning
```

Kör egen fil:

```bash
npm run import:norra-thinning -- data/min-fil.csv
```

Scriptet skriver bara preview och rapport. Det skriver inte över `js/calculators/norraThinningValues.js`.

## Granskning

Använd rapporten i `docs/generated/norra-thinning-import-report.md` för att se antal rader, antal mallar, statusfördelning, saknade värden och varningar.

Import betyder inte aktivering. Aktivering kräver separat beslut enligt `docs/skotselkollen-aktiveringsprotokoll.md`, testfall och `reviewNeeded: false`.
