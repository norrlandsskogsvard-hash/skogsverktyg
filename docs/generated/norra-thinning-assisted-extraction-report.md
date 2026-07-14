# Norra gallringskurvor - assisterad PDF-extraktion

Kalla: `Gallringsriktlinjer & gallringsmallar norra Sverige.pdf`  
Kall-ID: `norra-gallringsriktlinjer-gallringsmallar`  
Metod: `pdfplumber_text`

## Sammanfattning

- Extraherade rader: 4
- Confidence high: 0
- Confidence medium: 0
- Confidence low: 4
- Kurvor med sidunderlag: T18, T22, G20, G22
- Kurvor som fortfarande saknar sakra varden: T18, T22, G20, G22
- ActiveUse true: 0
- T20-integritet: ok

## Rader

| Kod | Sida | Metod | Confidence | Review needed | Active use | Notering |
| --- | --- | --- | --- | --- | --- | --- |
| T18 | s. 12 | diagram_manual_assisted | low | true | false | PDF-text identifierar kurvsida. Slutavverkningsalder kunde inte lasas sakert. Stamintervall i text: efter gallring 1000. Diagrammets grundyte-/hojdkoordinater ar inte sakra text-/tabellvarden och maste granskas manuellt. |
| T22 | s. 14 | diagram_manual_assisted | low | true | false | PDF-text identifierar kurvsida. Slutavverkningsalder kunde inte lasas sakert. Stamintervall i text: efter gallring 1300. Diagrammets grundyte-/hojdkoordinater ar inte sakra text-/tabellvarden och maste granskas manuellt. |
| G20 | s. 21 | diagram_manual_assisted | low | true | false | PDF-text identifierar kurvsida. Slutavverkningsalder kunde inte lasas sakert. Stamintervall i text: efter gallring 1200. Diagrammets grundyte-/hojdkoordinater ar inte sakra text-/tabellvarden och maste granskas manuellt. |
| G22 | s. 22 | diagram_manual_assisted | low | true | false | PDF-text identifierar kurvsida. Slutavverkningsalder kunde inte lasas sakert. Stamintervall i text: efter gallring 1300. Diagrammets grundyte-/hojdkoordinater ar inte sakra text-/tabellvarden och maste granskas manuellt. |

## Slutsats

PDF-texten identifierar kurvsidor for forsta assisted batchen, men diagrammens kurvkoordinater ar inte sakra text-/tabellvarden. Alla rader ligger darfor kvar som granskningsunderlag med `activeUse: false` och `reviewNeeded: true`.

Assisterad extraktion aktiverar inte kurvor. Eventuell aktivering maste ske i separat batch efter manuell granskning, import och validering.
