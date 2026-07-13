# Skötselkollen extraktionsplan

Extraktion ska ske stegvis. Varje värde ska ha källa, sida/tabell/diagram, enhet, begränsning, granskningsstatus och testfall innan det får påverka appen.

## Prioriterad ordning

0. Juridik online
   - Skogsvårdslag (1979:429) från Riksdagen/SFS är primär juridisk källa.
   - Skogsstyrelsens vägledning används som myndighetsstöd och kortversion.
   - Juridiska källor används först som kontrollflaggor, spärrar och hänvisningar.
   - Ingen juridisk regel aktiveras utan separat granskningssteg.

1. Norra gallringsmallar
   - Tydliga text- och tabellvärden först.
   - .19 extraherar textregler och användningsvillkor som kontrollflaggor.
   - Diagramdigitalisering hanteras separat.
   - T20 är aktiv pilot.
   - Övriga mallar är candidates tills de är verifierade.
   - Yumpu-spegeln kan användas för text/OCR-stöd.
   - Lokal Norra-PDF är primär källa.
   - Spegel får inte ensam skapa verified_candidate.

Kommande steg:
- .20 lägger in juridiska kontrollflaggor och separerar juridik från skoglig rekommendation.
- Lagkällor måste kontrolleras online innan juridiska regler uppdateras.
- Juridiska kontrollflaggor får sänka säkerhet och visa kontrollkrav, men inte aktivera juridiska beslut.
- .21 lägger in gallringsforskning från Skogsskötselserien 7 som förklarings- och riskstöd.
- .21 aktiverar inga nya kurvor, digitaliserar inga diagram och skapar inga hårda produktionsgränser.
- .22 lägger in röjningsforskning från Skogsskötselserien 6 som förklarings- och fältstöd.
- .22 lägger inte till nya prisregler och skapar inga hårda stamantal-/höjdgränser.
- .23 lÃ¤gger in bjÃ¶rk/lÃ¶v som eget spÃ¥r frÃ¥n SkogsskÃ¶tselserien 9.
- .23 aktiverar inga lÃ¶vkurvor, anvÃ¤nder inga barrmallar som facit fÃ¶r bjÃ¶rk/lÃ¶v och skapar inga hÃ¥rda produktionsgrÃ¤nser.
- NÃ¤sta steg kan vara bonitering/SI frÃ¥n AC/BD eller fÃ¶rdjupade skador/naturhÃ¤nsyn.
- .24 lagger in bonitering/SI fran AC/BD och B69 som faltmetod, metodbegransning och osakerhetsstod.
- .24 aktiverar inte auto-SI, digitaliserar inga hojdutvecklingskurvor, lagger inte in diagramvarden och skapar inga harda produktionsgranser.
- .25 lagger in naturhansyn, skador, markrisk, kulturmiljo och vilt som risk- och hansynsstod.
- .25 skapar inga juridiska beslut, harda gransvarden, prisandringar, diagramvarden eller nya kurvor.
- .26 lagger in faltprotokoll/rapportlage som aterger befintlig bedomning.
- .26 skapar inga nya kallregler, kurvor, diagramvarden eller harda gransvarden.
- .27 lagger in faltlage/mobiloptimering for praktisk anvandning fore offertkoppling.
- .27 sparar endast lokalt pa enheten och kopplar inte till offert eller kundarkiv.
- Nasta steg kan vara ytterligare falttest/UX eller manuell faltguide, inte automatiskt offert.
- .28 forsoker kontrollerad aktivering av T18, T22, G20 och G22.
- .28 aktiverar inga nya kurvor eftersom verifierade punktvarden saknas i kallbank och batchdata.
- Efter .28 ar endast T20 aktiv; T18, T22, G20 och G22 ar fortsatt sparrade kandidater.
- Nasta gallringskurvsteg ska vara kallutdrag eller kontrollerad digitalisering med sida/tabell/diagram, enheter och testfall, inte offertkoppling.
- Senare steg kan hantera diagramdigitalisering under separat granskning, testfall och aktiveringsprotokoll.

2. Bonitering AC/BD
   - SI-regler och begränsningar extraheras först.
   - Höjdutvecklingskurvor kräver försiktig hantering.
   - Auto-SI får aktiveras först efter verifierade tabeller och testfall.
   - .24 anvander AC, BD och B69 som faltstod och kontrollfragor, inte som inlagda SI-/kurvvarden.
   - B69 behandlas som diagram-/tabellkalla utan digitaliserade varden i detta steg.

3. Skogsskötselserien 7 Gallring
   - Forskningsstöd, principer och risktexter.
   - Ska inte behandlas som en enkel kurvtabell.

4. Skogsskötselserien 6 Röjning
   - Röjningsprinciper och fältkontroller.
   - Kan stärka röjningskalkylens beslutsstöd utan att ändra prislogik.

5. Skogsskötselserien 9 Björk/al/asp
   - Björkspår, lövröjning och lövgallring.
   - Får inte blandas med tall-/granmall.
   - .23 används endast som förklaring, fältkontroll och riskstöd.
   - Inga lövkurvor eller diagramvärden aktiveras i detta steg.

6. Naturhänsyn, skador, vilt och kulturmiljö
   - Risk- och kontrollflaggor.
   - Inte produktionskurvor.
   - .25 anvands som separat hansyn/risk-lager, inte som juridiskt beslut eller prislogik.

7. Terrängtypschema
   - Kan stödja svårighet och kostnad i kalkyler.
   - Inte skoglig skötselregel.

## Aktiveringsgrind

Ett extraherat värde får inte bli aktiv regel förrän det har granskats manuellt, lagts i rätt datamodell, fått testtäckning och passerat aktiveringsprotokollet. Källindexet är bara inventering och planering.
