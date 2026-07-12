# Skötselkollen källindex

Detta index sammanfattar lokala filer i `sources/` samt onlinekällor som ska versionskontrolleras vid behov. Alla poster är dokumentation eller kandidater för framtida extraktion. Ingen post får aktiveras direkt som appregel.

## Lokala källor

| Källa | Område | sourceType | Prioritet | Extraktionsstatus | Risk/begränsning |
| --- | --- | --- | --- | --- | --- |
| Gallringsriktlinjer och gallringsmallar norra Sverige | gallring | regional_curve | high | indexed_not_extracted | Diagram/kurvor kräver verifiering. T20 är enda aktiva pilot sedan tidigare. |
| Manual Gallringsprogram | gallring | decision_support_reference | medium | indexed_not_extracted | INGVAR är beslutsstöd/referens, inte facit. |
| Skogsskötselserien 7 - Gallring | gallring | research | high | indexed_not_extracted | Forskningsprinciper behöver översättas försiktigt. |
| Skogsskötselserien 6 - Röjning | rojning | research | high | indexed_not_extracted | Får inte ändra röjningskalkylens prislogik i detta steg. |
| Skogsskötselserien 9 - Skötsel av björk, al och asp | bjork_lov, rojning, gallring | research | high | indexed_not_extracted | Lövspår får inte blandas med tall-/granmall. |
| Bonitering AC | bonitering | field_method | high | indexed_not_extracted | SI och höjdutveckling kräver manuell kontroll. |
| Bonitering BD | bonitering | field_method | high | indexed_not_extracted | SI och höjdutveckling kräver manuell kontroll. |
| B69 SI internlänkar alla tabeller | bonitering | field_method | medium_high | indexed_not_extracted | Tabeller/diagram måste knytas till rätt metod. |
| Skogsskötselserien 12 - Skador på skog del 1 | skador | research | medium_high | indexed_not_extracted | Riskunderlag, inte produktionskurva. |
| Skogsskötselserien 12 - Skador på skog del 2 | skador | research | medium_high | indexed_not_extracted | Riskunderlag, inte produktionskurva. |
| Skogsskötselserien 14 - Naturhänsyn | naturhansyn | research | high | indexed_not_extracted | Hänsyns- och kontrollflaggor, inte produktionskurva. |
| Riktlinjer för hänsyn till forn- och kulturmiljöer 2016 | kulturmiljo, naturhansyn | legal_or_habitat_guidance | high | indexed_not_extracted | Juridiskt/hänsynsmässigt stöd, inte produktionsregel. |
| Instruktion - Så här ska du röja | rojning, naturhansyn | practice_guide | medium | indexed_not_extracted | Praktisk instruktion, inte facit. |
| Viltanpassad skogsskötsel version 2 | vilt, rojning, gallring | practice_guide | medium | indexed_not_extracted | Vilt- och skötselstöd, inte produktionskurva. |
| Terrängtypschema | terrang, ekonomi, rojning | terrain_cost_support | medium | indexed_not_extracted | Kostnads-/svårighetsstöd, inte skoglig åtgärdsregel. |
| Skogsägare skötselmallar 2024 | rojning, gallring, bonitering | practice_guide | medium | indexed_not_extracted | Praktisk skogsägarmall, inte facit. |
| Silvassist databas | gallring | decision_support_reference | low_technical | technical_index_only | Databasfil kräver separat teknisk extraktion. |
| Basdata template | - | source_index_only | low | technical_index_only | Teknisk mall, används inte utan granskning. |
| Document icon | - | source_index_only | low | technical_index_only | Ikonfil, inte skoglig källa. |

## Online juridik

| Källa | Område | sourceType | Prioritet | Extraktionsstatus | Risk/begränsning |
| --- | --- | --- | --- | --- | --- |
| Skogsvårdslag (1979:429), Riksdagen/SFS | juridik, föryngring, gallring, röjning, slutavverkning, hänsyn | law | high | online_indexed | Primär lagkälla. Ska kontrolleras online före juridisk uppdatering. Appen får inte ge juridiskt bindande besked. |
| Skogsvårdslagen i kortversion, Skogsstyrelsen | juridik, tillsyn, föryngring, avverkning, hänsyn | legal_or_agency_guidance | high | online_indexed | Myndighetsvägledning. Ersätter inte aktuell lagtext från Riksdagen/SFS. |

## Online speglar

| Källa | Speglar | sourceType | Prioritet | Extraktionsstatus | Risk/begränsning |
| --- | --- | --- | --- | --- | --- |
| Yumpu - Gallringsmallar Norra Skogsägarna | norra-gallringsriktlinjer-gallringsmallar | regional_curve | medium | mirror_indexed | Endast spegel/textstöd. Lokal PDF är primär och spegeln får inte ensam aktivera eller verifiera värden. |

Detaljerad maskinläsbar klassning finns i `data/source-library.json`. Genererad rapport skapas med `npm run index:sources` i `docs/generated/source-library-report.md`.
