# Skötselkollen källbibliotek

## Syfte

Det lokala källbiblioteket samlar projektets källfiler för Skötselkollen, Röjningskalkylen och kommande skötselmallar. Det gör källorna spårbara utan att blanda ihop dokument, extraherade källvärden och aktiva regler i appen.

## Sources-mappen

`sources/` innehåller lokala PDF:er och tekniska filer som används som underlag. Filnamnet i `data/source-library.json` ska matcha filen exakt. Nya filer ska indexeras innan de används i dokumentation, extraktion eller appstöd.

## Källa, källvärde och aktiv regel

En källa är ett dokument eller en teknisk fil i biblioteket. Ett källvärde är ett granskat utdrag ur en källa, till exempel en tabellrad, textuppgift eller digitaliserad diagramdel. En aktiv regel är app-logik som påverkar beräkning, status eller rekommendation.

Detta steg skapar källindex och struktur. Det aktiverar inga nya gallringskurvor, inga nya hårda skogliga gränsvärden och ingen ny prislogik.

## Varför källor inte aktiveras direkt

Flera källor innehåller diagram, tabeller, sammanvägda råd eller metodbeskrivningar. De måste kontrolleras mot art, region, SI, enheter, begränsningar och syfte innan de får påverka appens beslut. Därför har alla källor `canActivateDirectly: false` och källor med möjliga numeriska värden kräver manuell granskning.

## Lägga till nya källor

1. Lägg filen i `sources/`.
2. Lägg till en post i `data/source-library.json`.
3. Sätt `canActivateDirectly` till `false`.
4. Sätt `requiresManualReview` till `true` om källan kan innehålla numeriska värden.
5. Kör `npm run index:sources` och `npm run validate:sources`.
6. Beskriv eventuell extraktion i extraktionsplan eller källvärdes-backlog.

## Onlinekällor senare

Onlinekällor ska hanteras separat med åtkomstdatum, länk, organisation, hämtad text eller lokal kopia och tydlig licens-/spårbarhetsnotis. De ska inte ersätta lokala källfiler i indexet utan en egen granskningsrutin.
