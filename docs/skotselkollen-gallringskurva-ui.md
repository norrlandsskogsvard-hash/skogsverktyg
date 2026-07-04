# Skötselkollen: gallringskurva och graf

## Syfte

Grafen ska hjälpa användaren att se beståndets punkt i fält och förstå vilket underlag som finns. Den ska inte låtsas visa en komplett gallringsmall när appen bara har pilotdata eller saknar kurvunderlag.

## Lägen i grafen

### Pilot/exempel

När T20-pilotunderlag finns visas:

- beståndspunkt
- T20-pilotpunkter
- svag exempellinje mellan pilotpunkterna
- statuschip: `Pilot: T20-exempel, ej full kurva`

Detta är visningsstöd och jämförelse, inte en komplett digitaliserad gallringskurva.

### Full kurva

Full kurva får bara visas när komplett och källkontrollerad kurvdata finns för trädslag, region, SI/bonitet och beståndsfas. Innan dess ska inga låg/normal/hög-zoner visas som om de vore källstödda.

### Saknat underlag

Om kurvunderlag saknas visas användarens punkt, axlar och en tydlig saknas-status. Grafen ska säga att full digitaliserad gallringskurva saknas eller att SI finns men kurva saknas för vald kombination.

### Björkspår

För björk visas beståndspunkten utan tall- eller granlinje. Texten ska göra klart att tall-/granmall inte används som facit för björk.

## Varför vi inte visar falska zoner

Zoner för låg, normal eller hög grundyta kan uppfattas som skarpa beslut. Därför får sådana zoner bara visas när:

- källa är tydlig
- kurvan är komplett nog för vald kombination
- värden är verifierade
- digitalisering eller tabellvärden är dokumenterade
- begränsningar är synliga
- testfall finns

## Framtida kurvor

När riktiga kurvor läggs in ska varje kurva dokumentera:

- källa och organisation
- år/version
- sida/tabell/diagram
- trädslag
- region
- SI/bonitet
- höjdintervall
- grundytevärden eller zoner
- om värdet är tabell, text, diagram eller digitaliserat diagram
- status: candidate, verified, pilot eller inactive
- testfall för punktvisning och mobilvy

Endast verifierade eller uttryckligt pilotmärkta kurvor får påverka visningen.
