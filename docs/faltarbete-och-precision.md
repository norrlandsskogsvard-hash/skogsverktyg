# Fältarbete och precision

DGV och Medelhöjd har en trespaltig knappsats med decimaltecken, backsteg och Lägg till. Vänster/höger hand sparas mellan verktygen. Mobilens vanliga tangentbord öppnas inte för dessa mätningar. Enter fungerar på datorn.

## Beräkningar

DGV beräknas som summa diameter³ / summa diameter². Det är grundytevägd diameter och skiljer sig från både aritmetiskt medel och kvadratmedeldiameter. Medelhöjd är aritmetiskt medel: summa höjder / antal. Den är inte grundytevägd medelhöjd eller övre höjd och ska inte automatiskt användas som sådan i volym- eller SI-verktyget.

Appen lagrar numeriska råvärden utan avrundning. Resultatraden och anteckningstexten visar en decimal. Nya överföringar från DGV, Höjd och Stamantal sparar också separata mätposter med oavrundade värden i avdelningen och JSON-säkerhetskopian. Vanliga flyttalsberäkningar används; avrundade visningsvärden används inte som ny indata.

Kontroll: diametrar 10, 20, 30 cm ger DGV 36000/1400 = 25,714285714285715 cm. Höjder 2,4, 3,6, 6 m ger medelhöjd 4 m.

## Avdelningar och sammanställning

Välj eller skapa avdelning under mätverktyget, skriv en valfri kommentar och spara mätningen. Datum, mätresultat och kommentar visas; metodtext tas inte med i anteckningen. Varje sparning lägger till ett nytt mättillfälle. Utkastet i mätverktyget behålls tills du rensar det. Rensa utkastet innan nästa avdelning mäts.

Vald avdelning kommer ihåg mellan DGV, Höjd, SI, volym och stamantal. Cirkelprovytor sparar sammanställning och varje provytas antal/area. SI och volym har sina tidigare resultatknappar.

Exportera text eller CSV för sammanställning på kontoret. CSV har en rad per avdelning med alla mättillfällen och kommentarer. JSON-säkerhetskopian kan återläsas i appen. Uppgifterna lagras på aktuell enhet; säkerhetskopiera innan webbläsardata rensas.

Tester finns i `tests/field-work.spec.js` och övriga browser-/mobiltester. De kontrollerar formler, decimaler, knappsatsens geometri, avdelningsöverföring, CSV och lagringsfel. Cacheversion: `skogskalkyl-2.0.0-alpha.1-field-work.2`.
