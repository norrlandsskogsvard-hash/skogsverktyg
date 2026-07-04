# Skötselkollen: praktiska skötselmallar

## Syfte

Praktiska skötselmallar ska ge Skötselkollen ett fältorienterat källstöd för kontrollfrågor, arbetsgång och rådgivande jämförelser. De får inte ersätta lagkrav, forskning, regionala gallringsmallar eller fältbedömning.

## Vad är en praktisk mall?

En praktisk mall är ett förenklat stöd för skogsägare eller rådgivare. Den kan sammanfatta skötselråd, vanliga arbetsflöden och tumregelsnära kontroller. I appen klassas sådana underlag som `practice_guide`.

Exempel i detta steg:

- Norra Skog skötselmallar 2024

## Varför är den inte facit?

En praktisk mall är ofta gjord för överblick och rådgivning. Den kan sakna den fulla detaljeringsgrad som krävs för ett enskilt bestånd med särskilt trädslag, region, markklass, skador, naturvärden eller juridiska begränsningar. Därför får den inte ensam skapa hög säkerhet eller ersätta en regional gallringskurva.

## Viktning

`practice_guide` har vikt 35 i källviktningen. Den kan visas som stödjande underlag, men:

- kan inte ensam ge hög säkerhet
- kan inte ersätta forskning eller myndighetsunderlag
- kan inte ersätta regional gallringsmall
- kan inte ersätta lagkontroll
- kan inte användas som björkspecifik gallringskurva

Om bara praktiska mallar och fältvärden stödjer bedömningen ska appen hålla säkerheten låg/medel och visa att bedömningen är förenklad.

## Skillnad mot andra källtyper

- `law`: lagkrav eller juridiska flaggor som kan stoppa eller kräva kontroll.
- `research`: forskning, myndighetsmaterial eller skogsskötselprinciper med högre källvärde.
- `regional_curve`: regional gallringsmall eller källstödd kurvdata.
- `skogskunskap_tool`: forskningsnära verktygsstöd från Skogskunskap.
- `skogskunskap_guidance`: rådgivande artiklar och kunskapsbank från Skogskunskap.
- `practice_guide`: praktisk skötselmall eller skogsägarstöd.
- `field_observation`: användarens fältmätningar och observationer.

## Krav för att aktivera praktiska värden i logik

Inga nya praktiska mallvärden är aktiverade som beräkningsregler i detta steg. För att ett värde senare ska få påverka aktiv logik krävs:

- källa
- år/version
- exakt sida, tabell eller avsnitt
- trädslag
- region
- beståndsfas
- variabel
- värde eller intervall
- enhet
- begränsning
- om värdet är direkt tabellvärde, textregel eller tolkning
- testfall

Värden som inte är tydligt verifierade ska ligga kvar i backlogg och märkas som ej aktiverade i logik.

## Backlogg

- Kontrollera om Norra Skog 2024 innehåller tydliga tabellvärden som kan dokumenteras med sida/avsnitt.
- Dokumentera eventuella värden endast som `documentation_only` tills källa, begränsning och testfall är klara.
- Jämför mot regional gallringsmall och forskning innan något praktiskt värde får påverka rekommendationen.
