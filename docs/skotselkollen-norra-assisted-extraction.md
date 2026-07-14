# Skotselkollen: Norra assisted extraction

## Syfte

Assisterad PDF-extraktion anvands for att hitta sidunderlag och mojliga granskningsrader fran Norra gallringsmallar. Den ar ett forarbete till manuell granskning, inte en aktivering av kurvor.

I `.30` lases den lokala Norra-PDF:en med textutdrag. Forsta batchen omfattar T18, T22, G20 och G22.

## Resultat i batch 03

- Extraherade rader: 4
- Confidence high: 0
- Confidence medium: 0
- Confidence low: 4
- Kurvor med sidunderlag: T18, T22, G20, G22
- Kurvor som fortfarande saknar sakra kurvpunktvarden: T18, T22, G20, G22
- Active use: false for alla rader
- T20-integritet: kontrollerad mot PDF-text och befintligt varde 24.5

## Risker med diagramavlasning

Norra-mallarna innehaller diagram dar grundyta och hojd maste lasas visuellt. Textutdraget kan identifiera sida och vissa omgivande texter, men diagrammets koordinater blir inte sakra tabellvarden. Darfor markeras dessa rader med `confidence: low`, `reviewNeeded: true` och `activeUse: false`.

## Confidence-nivaer

- `high`: direkt text- eller tabellvarde med tydlig sida, enhet och full punkt.
- `medium`: troligt varde men kraver separat kontroll.
- `low`: sidunderlag eller osaker diagramlasning. Far inte aktiveras.

Regel: medium och low maste alltid ha `reviewNeeded: true` och `activeUse: false`.

## Fran assisted draft till active_verified

En assisted rad kan bara ga vidare i separat batch om:

- punktvarden for topHeight, basalAreaBefore och basalAreaAfter ar verifierade
- sourcePage eller sourceSection ar angiven
- enheter ar kontrollerade
- reviewNeeded kan sattas till false efter granskning
- dataQuality kan sattas till verifierad kvalitet
- T20-integritet passerar
- validate:norra-assisted och validate:thinning-data passerar

Aktivering sker aldrig direkt fran assisted extraction.

## Sakerhetssparrar

- T20 ar fortsatt enda aktiva kurva.
- T20-varden andras inte.
- Auto-SI ar fortsatt sparrad och `SITE_INDEX_CURVES` ar `[]`.
- Inga nya kurvor aktiveras.
- Inga juridiska beslut skapas.
- Inga prisandringar skapas.
- Ingen offert- eller kundarkivkoppling skapas.
