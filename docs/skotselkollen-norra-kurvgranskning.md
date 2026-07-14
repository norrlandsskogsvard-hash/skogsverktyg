# Skotselkollen: Norra kurvgranskning

## Syfte

Kurvgranskning ar en manuell arbetsyta for Norra gallringsmallar. Den ska gora det enklare att mata in punktvarden fran kallan, spara lokala utkast och kopiera en CSV-rad till importflodet.

Vyn ar ett granskningsverktyg. Den aktiverar inte kurvor, tolkar inte diagram automatiskt och gor ingen OCR.

## Assisterad PDF-extraktion

Fran `.30` visar Kurvgranskning aven assisted extraction-underlag fran `data/generated/norra-thinning-assisted-extraction.json`.

Sektionen visar:

- antal extraherade rader
- antal high, medium och low confidence
- vilka kurvor som har sidunderlag
- vilka kurvor som fortfarande saknar sakra varden
- kopiering av assisted CSV-rader

Assisterad extraktion aktiverar inte kurvor. Alla assisted rader i batch 03 har `activeUse: false`.

## Manuell avlasning

1. Oppna Norra gallringsmall i primar kallfil.
2. Valj ratt tradslag och SI-kod.
3. Las av en gallringspunkt i taget.
4. Skriv in ovre hojd, grundyta fore, grundyta efter och de extra varden som kallan visar.
5. Ange kallsida eller kallavsnitt och lagg en kort anteckning om hur vardet lastes av.

Om ett varde ar osakert ska faltet lamnas tomt eller beskrivas i anteckningen. Osakra varden far inte flyttas till aktiv kurva.

## Lokala utkast

Knappen `Spara lokalt utkast` sparar endast i webblasaren via localStorage. Det andrar inte `data/norra-thinning-review-drafts.json`, `js/calculators/norraThinningValues.js` eller aktiv kurvdata.

Lokal granskning betyder att en anvandare har arbetat med ett utkast pa sin enhet. Det ar inte samma sak som verifierad kallimport.

## Lokala aktiveringskandidater

Fran `.31` kan Kurvgranskning skapa en lokal aktiveringskandidat. Det kraver:

- komplett punkt med ovre hojd, grundyta fore och grundyta efter
- kallsida
- rimlighetskontroller utan varningar
- checkboxen `Jag har kontrollerat vardena mot originaldiagrammet`
- granskare/initialer
- granskningsanteckning nar assisted extraction hade low confidence

Aktiveringskandidaten sparas bara i localStorage och kan kopieras som JSON/CSV. Den har alltid `activeUse: false`.

## CSV-rad

Knappen `Kopiera som CSV-rad` skapar raden:

`code,species,siteIndex,stage,topHeight,basalAreaBefore,basalAreaAfter,ageTotal,stemsBefore,stemsAfter,sourcePage,note,reviewStatus`

Raden ar avsedd som mellanformat for senare import och granskning. Den far inte aktivera kurvan direkt.

## Krav for aktivering

En kurva far bara aktiveras i en separat batch nar allt detta finns:

- verifierade punktvarden
- `sourcePage` eller `sourceSection`
- tydliga enheter
- `reviewNeeded: false`
- verifierad datakvalitet
- import/validering
- T20-integritet kontrollerad
- auto-SI fortsatt hanterad separat

## Sakerhetssparrar

- T20 ar fortsatt enda aktiva kurva.
- T20-vardena far inte andras.
- Draftkurvor har `activeUse: false`.
- Draftkurvor har `canActivateCurves: false`.
- Auto-SI ar fortsatt sparrad och `SITE_INDEX_CURVES` ar `[]`.
- Bjork/lov far inte anvanda tall-/granmall som facit.
- Inga juridiska beslut skapas.
- Inga prisandringar skapas.
- Ingen offert- eller kundarkivkoppling skapas.

## Nasta steg

Nasta steg kan vara en aktiveringsbatch dar manuellt granskade varden importeras, valideras och jamfors mot aktiveringsprotokollet. Forst efter det kan en ny Norra-kurva bli aktiv.

Se aven `docs/skotselkollen-norra-assisted-extraction.md`.
Se aven `docs/skotselkollen-norra-reviewed-candidates.md`.
