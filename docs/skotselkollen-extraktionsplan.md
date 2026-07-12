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
   - Diagramdigitalisering hanteras separat.
   - T20 är aktiv pilot.
   - Övriga mallar är candidates tills de är verifierade.
   - Yumpu-spegeln kan användas för text/OCR-stöd.
   - Lokal Norra-PDF är primär källa.
   - Spegel får inte ensam skapa verified_candidate.

2. Bonitering AC/BD
   - SI-regler och begränsningar extraheras först.
   - Höjdutvecklingskurvor kräver försiktig hantering.
   - Auto-SI får aktiveras först efter verifierade tabeller och testfall.

3. Skogsskötselserien 7 Gallring
   - Forskningsstöd, principer och risktexter.
   - Ska inte behandlas som en enkel kurvtabell.

4. Skogsskötselserien 6 Röjning
   - Röjningsprinciper och fältkontroller.
   - Kan stärka röjningskalkylens beslutsstöd utan att ändra prislogik.

5. Skogsskötselserien 9 Björk/al/asp
   - Björkspår, lövröjning och lövgallring.
   - Får inte blandas med tall-/granmall.

6. Naturhänsyn, skador, vilt och kulturmiljö
   - Risk- och kontrollflaggor.
   - Inte produktionskurvor.

7. Terrängtypschema
   - Kan stödja svårighet och kostnad i kalkyler.
   - Inte skoglig skötselregel.

## Aktiveringsgrind

Ett extraherat värde får inte bli aktiv regel förrän det har granskats manuellt, lagts i rätt datamodell, fått testtäckning och passerat aktiveringsprotokollet. Källindexet är bara inventering och planering.
