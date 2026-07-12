# Skötselkollen källbibliotek

## Syfte

Det lokala källbiblioteket samlar projektets källfiler för Skötselkollen, Röjningskalkylen och kommande skötselmallar. Det gör källorna spårbara utan att blanda ihop dokument, extraherade källvärden och aktiva regler i appen.

## Sources-mappen

`sources/` innehåller lokala PDF:er och tekniska filer som används som underlag. Filnamnet i `data/source-library.json` ska matcha filen exakt. Nya filer ska indexeras innan de används i dokumentation, extraktion eller appstöd.

## Källa, källvärde och aktiv regel

En källa är ett dokument, en lokal teknisk fil eller en onlinekälla i biblioteket. Ett källvärde är ett granskat utdrag ur en källa, till exempel en tabellrad, textuppgift eller digitaliserad diagramdel. En aktiv regel är app-logik som påverkar beräkning, status eller rekommendation.

Detta steg skapar källindex och struktur. Det aktiverar inga nya gallringskurvor, inga nya hårda skogliga gränsvärden och ingen ny prislogik.

## Varför källor inte aktiveras direkt

Flera källor innehåller diagram, tabeller, lagtext, sammanvägda råd eller metodbeskrivningar. De måste kontrolleras mot art, region, SI, enheter, juridisk giltighet, begränsningar och syfte innan de får påverka appens beslut. Därför har alla källor `canActivateDirectly: false` och källor med möjliga numeriska värden kräver manuell granskning.

## Lägga till nya källor

1. Lägg lokala filer i `sources/`, eller ange `url` för onlinekällor.
2. Lägg till en post i `data/source-library.json`.
3. Sätt `accessType` till `local_file`, `online_source` eller `online_mirror`.
4. Sätt `canActivateDirectly` till `false`.
5. Sätt `requiresManualReview` till `true` om källan kan innehålla numeriska värden.
6. Kör `npm run index:sources` och `npm run validate:sources`.
7. Beskriv eventuell extraktion i extraktionsplan eller källvärdes-backlog.

## Onlinekällor

Lokala PDF:er används fortsatt för forskning, mallar, metod och praktiska underlag. Lagar och myndighetsvägledning ska däremot hämtas eller versionskontrolleras online inför juridiska uppdateringar.

Riksdagen/SFS är primär källa för Skogsvårdslag (1979:429). Skogsstyrelsen är myndighetsvägledning och kortversion som kan hjälpa tolkning och arbetsflöde, men den ersätter inte aktuell lagtext. Onlinekällor indexeras i `data/source-library.json` med URL, åtkomstdatum och kontrollfrekvens, men blir inte automatiskt aktiva regler.

Appen får ge kontrollflaggor och hänvisningar. Den får inte ge juridiskt bindande besked.

Online-speglar, till exempel Yumpu för Norra gallringsmallar, är endast text- och OCR-stöd. De får inte ersätta lokal PDF som primär källa och får inte ensamma skapa verifierade kandidater eller aktiva värden.
