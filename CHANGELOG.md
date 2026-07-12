# Changelog

## v2.0.0-alpha.1-legal-flags.1 - 2026-07-12

### Added - Juridiska kontrollflaggor

- Juridiska kontrollflaggor har lagts till i Skötselkollen.
- Skoglig rekommendation och juridisk kontroll visas separat.
- Appen ger kontrollstöd, inte juridiskt besked.
- Juridiska regler kan inte aktivera kurvor eller ändra T20.
- Validering för juridiska kontrollregler har lagts till.
- PWA-cache höjd till legal-flags.1.

## v2.0.0-alpha.1-norra-text-rules.1 - 2026-07-12

### Added - Norra textregler

- Norra gallringsmallarnas textregler och användningsvillkor har extraherats.
- Textregler används endast som kontrollflaggor/underlag.
- Inga nya kurvor eller diagramvärden har aktiverats.
- Validering för Norra textregler har lagts till.
- PWA-cache höjd till norra-text-rules.1.

## v2.0.0-alpha.1-source-library.2 - 2026-07-12

### Added - Onlinekällor och speglar

- Onlinekällor för Skogsvårdslag och Skogsstyrelsens vägledning har indexerats.
- Yumpu har lagts till som spegelkälla för Norra gallringsmallar.
- Källvalideringen tillåter nu onlinekällor med URL utan lokal fil.
- Spegelkällor kan inte vara primärkälla eller aktivera värden.
- Juridiska källor kan inte aktiveras direkt som skoglig regel.
- PWA-cache höjd till source-library.2.

## v2.0.0-alpha.1-source-library.1 - 2026-07-12

### Added - Lokalt källbibliotek

- Lokalt källbibliotek för Skötselkollen har indexerats.
- Source-library.json har skapats.
- Script för källindex och källvalidering har lagts till.
- Extraktionsplan för gallring, röjning, bonitering, björk/löv och hänsyn har skapats.
- PWA-cache höjd till source-library.1.

## v2.0.0-alpha.1-skotselkollen.16 - 2026-07-08

### Added - Norra batch 01

- Första batchfilen för Norra gallringsvärden har skapats.
- Importflödet kan nu användas med verkliga batchfiler.
- Batch 01 aktiverar inga nya kurvor.
- Validering stoppar fortsatt oavsiktlig aktivering.
- PWA-cache höjd till skotselkollen.16.

## v2.0.0-alpha.1-skotselkollen.15 - 2026-07-08

### Added - Importflöde Norra gallringsvärden

- Importmall för Norra gallringsvärden har lagts till.
- Importscript och granskningsrapport har lagts till.
- Norra-data kan nu batchgranskas utan att aktiveras.
- Validering stoppar fortsatt oavsiktlig aktivering av osäkra kurvor.
- PWA-cache höjd till skotselkollen.15.

## v2.0.0-alpha.1-skotselkollen.14 - 2026-07-08

### Changed - Batchimport Norra gallringsvärden

- Batchimportstruktur för Norra gallringsvärden har införts.
- Gallringsdata har separerats tydligare från aktiveringslogik.
- Valideringsscript skyddar mot oavsiktlig aktivering av osäkra kurvor.
- Källbanksvyn visar antal aktiva, verifierade kandidater, utkast och kandidater.
- PWA-cache höjd till skotselkollen.14.

## v2.0.0-alpha.1-skotselkollen.13 - 2026-07-08

### Changed - Aktiveringsprotokoll gallringsmallar

- Aktiveringsprotokoll för gallringsmallar har lagts till.
- Skydd mot oavsiktlig aktivering av candidate/draft har förstärkts.
- Candidate-mallar måste uppfylla dokumenterade krav innan de kan bli aktiva.
- Källbanksvyn visar tydligare status för aktiv pilot, kandidat och utkast.
- PWA-cache höjd till skotselkollen.13.

## v2.0.0-alpha.1-mobile-ux.1 - 2026-07-04

### Changed - Kompakt mobil-UX

- Mobil layout har komprimerats för Röjning, Planpris och Offert.
- Långa formulär har delats upp i tydligare sektioner.
- Bottom-nav har förbättrats så att alla alternativ kan nås på mobil.
- Resultatkort prioriteras högre i mobil vy.
- PWA-cache höjd till mobile-ux.1.

## v2.0.0-alpha.1-skotselkollen.12 - 2026-07-04

### Changed - Norra massimport och granskningsgrund

- Massimportstruktur för Norra gallringsmallar skapad.
- Datakvalitet och aktiveringsnivå har införts för gallringskurvor.
- Appen skiljer nu på aktiv pilot, candidate, draft och verifierad kurva.
- Identifierade kurvor visas i stängd källbankssektion.
- Osäkra/draftkurvor aktiveras inte i graf eller säkerhet.
- PWA-cache höjd till skotselkollen.12.

## v2.0.0-alpha.1-skotselkollen.11 - 2026-07-04

### Changed - Norra gallringsvärden

- Första källvärdespaketet för Norra gallringsmallar har strukturerats.
- T20-exemplet ligger kvar som aktiv pilot.
- Tall- och granmallar har lagts in som candidate-poster utan aktiva kurvor.
- Appen skiljer nu tydligare på aktiv pilot, identifierad källa och saknade verifierade kurvdata.
- PWA-cache höjd till skotselkollen.11.

## v2.0.0-alpha.1-skotselkollen.10 - 2026-07-04

### Changed - Källvärden och gallringsgraf

- Källvärdes-backlog skapad för framtida skogliga värden.
- Gallringsgrafen i Skötselkollen har gjorts tydligare.
- T20-pilot visas tydligare som exempel/pilot, inte full kurva.
- Björkspår visar tydligare att tall-/granmall inte används som facit.
- Snabbförslag har fått tydligare fältstruktur.
- PWA-cache höjd till skotselkollen.10.

## v2.0.0-alpha.1-skotselkollen.9 - 2026-07-04

### Changed - Praktiska mallar och markförutsättning

- Produktiv skogsmark antas nu som standard vid fältmätning.
- Markklass/specialfall har flyttats till avancerade kontroller.
- Praktiska skötselmallar har lagts till som egen källkategori.
- Norra Skog 2024 har lagts in som praktiskt stöd, inte facit.
- PWA-cache höjd till skotselkollen.9.

### Added - Röjningskalkyl källstöd

- Röjningskalkylen har fått dokumenterat källstöd från Skogskunskap.
- Röjningsanalys, Röjningsklockan och lövröjningsmall är tillagda som rådgivande källor.
- Inga nya röjningspriser eller hårda röjningsgränsvärden har aktiverats.
- PWA-cache höjd till rojningsstod.1.

## v2.0.0-alpha.1-skotselkollen.8 - 2026-07-04

### Added - Skogskunskap som källbank

- Skogskunskap tillagd som källbank i Skötselkollen.
- Skogskunskap-verktyg klassas som praktiskt forskningsnära verktygsstöd, inte facit.
- Skogskunskap visas separat i Källor och antaganden.
- PWA-cache höjd till skotselkollen.8.

## v2.0.0-alpha.1-smoketest.1 - 2026-07-04

### Added - Automatiska app-smoketester

- Playwright-smoketester tillagda för desktop och mobil.
- GitHub Actions-workflow tillagt för automatisk appkontroll.
- Testläget `?test=1` hoppar över service worker-registrering.
- Screenshots sparas automatiskt i testresultaten.
- PWA-cache höjd till smoketest.1.

## v2.0.0-alpha.1-skotselkollen.7 - 2026-07-04

### Changed - Fältvänligare källviktning

- Skötselkollen visar nu separat skoglig och juridisk status.
- Samlad bedömning har förenklats för fältbruk.
- Detaljerad källbalans flyttad till utfällbar sektion.
- Region okänd ger tydligare varning.
- PWA-cache höjd till skotselkollen.7.

## v2.0.0-alpha.1-skotselkollen.6 - 2026-07-04

### Changed - Källviktning och samlad bedömning

- Skötselkollen har fått källviktning och samlad bedömning.
- Källor delas upp i lag, forskning, regional gallringsmall, beslutsstöd, praktisk mall och fältvarningar.
- Praktiska skötselmallar används som stöd, inte facit.
- PWA-cache höjd till skotselkollen.6.

## v2.0.0-alpha.1-skotselkollen.5 - 2026-07-04

### Changed - Första källstyrda kurvdata-steget

- Skötselkollen har fått första källstyrda kurvdata-strukturen.
- T20 Norra Sverige inlagt som pilot-/exempelunderlag.
- Grafen kan visa pilotunderlag utan att låtsas vara full gallringskurva.
- Manuell SI normaliseras till T/G/B-format.
- Auto-SI visar tydligt när källstödd kurvtabell saknas.
- PWA-cache höjd till skotselkollen.5.

## v2.0.0-alpha.1-skotselkollen.4 - 2026-07-04

### Changed - Snabb digital gallringsmall

- Skötselkollen byggd om till snabb digital gallringsmall.
- Graf och kurvstatus visas tidigare.
- Fördjupad juridik/riskkontroll flyttad till utfällbara sektioner.
- Automatisk SI-skattning förberedd och manuellt SI kan anges.
- Plantext kortad och gjord mer saklig.
- PWA-cache höjd till skotselkollen.4.

## v2.0.0-alpha.1-skotselkollen.3 - 2026-07-04

### Changed - Tydligare fältbeslutsstöd

- Skötselkollen ger nu tydligare fältkontroller.
- Resultatet visar varför bedömningen görs.
- Rekommenderad riktning och plantext har förbättrats.
- Björk, röjning, gallring och slutavverkning har egna checklistor.
- INGVAR och Heureka nämns som referensramar, inte facit.
- PWA-cache höjd till skotselkollen.3.

## v2.0.0-alpha.1-skotselkollen.2 - 2026-07-04

### Changed - Kompakt mobilvy för Skötselkollen

- Skötselkollen mobilvy komprimerad för snabb fältbedömning.
- Fördjupade uppgifter flyttade till utfällbara sektioner.
- Resultat visas tidigare i mobilflödet.
- Confidence bytt till Säkerhet.
- PWA-cache höjd till skotselkollen.2.

## v2.0.0-alpha.1-skotselkollen.1 - 2026-07-04

### Added - Skötselkollen v1

- Ny modul Skötselkollen v1.
- Bedömer röjning, gallring och möjlig slutavverkning som beslutsstöd.
- Separat juridisk kontroll.
- Stöd för björk som eget spår.
- Källor och antaganden visas i resultatet.
- PWA-cache höjd till skotselkollen.1.

## v2.0.0-alpha.1-fieldmode.3 - 2026-07-04

### Fixed - Tajtare mobilfältläge

- Fältläge på mobil tajtat ytterligare.
- Sidhuvud döljs i DGV/Höjd mobilvy.
- Bottennavigering täcker inte längre knappsats eller Lägg till.
- PWA-cache höjd till fieldmode.3.

## v2.0.0-alpha.1-fieldmode.2 - 2026-07-04

### Changed - Finputsat mobilfältläge

- Finputsat mobilfältläge för DGV och Höjd.
- Topbar/inställningsknapp täcker inte längre resultat.
- Mindre scroll i fältvy.
- Resultat och detaljer flyttade efter inmatningsläget på mobil.
- PWA-cache höjd till fieldmode.2.

## v2.0.0-alpha.1-fieldmode.1 - 2026-07-03

### Changed - Mobilanpassat fältläge

- DGV och Höjd har fått riktigt mobilanpassat fältläge.
- Snabbval borttagna för att minska scroll och göra inmatning tydligare.
- Knappsats, aktuell inmatning och Lägg till är nu samlade.
- PWA-cache höjd till fieldmode.1.

## v2.0.0-alpha.1 - 2026-07-01

### Changed - Kompakt fältläge på mobil

- Förbättrad kompakt mobilvy för DGV och Höjd.
- Mindre scroll i fältläge med kompaktare knappsats, snabbval och resultat.
- Uppdaterat service worker-cache-namn till skogskalkyl-2.0.0-alpha.1-keypad.4.

### Fixed - Mobil-UX för fältknappsats

- Förbättrad mobil-UX för DGV och Höjd så Lägg till-knappen är nåbar tillsammans med knappsatsen.
- Actions-raden ligger efter knappsatsen och är sticky ovanför bottenmenyn på mobil.
- Uppdaterat service worker-cache-namn till skogskalkyl-2.0.0-alpha.1-keypad.3.

### Fixed - Scrollhopp i fältknappsats

- Fixat scrollhopp vid knappsatsinmatning på mobil i DGV och Medelhöjd.
- Uppdaterat service worker-cache-namn till skogskalkyl-2.0.0-alpha.1-keypad.2.

### Added - Fältknappsats för DGV och Medelhöjd

- Inbyggd fältknappsats för DGV med stor display, decimalstöd, backspace och rensa inmatning.
- Inbyggd fältknappsats för Medelhöjd med samma fältanpassade inmatningsflöde.
- Snabbval för vanliga diametrar och höjder som lägger till värden direkt.
- Mindre dashboard-layoutfix så statusetiketter inte bryts mitt i ord.
- Uppdaterat service worker-cache-namn till skogskalkyl-2.0.0-alpha.1-keypad.1.

### Changed - Dashboardstatusar

- Uppdaterade modulstatusar och dashboardtexter för DGV, Medelhöjd, Röjning, Planpris, Offert och Kunder.
- Startsidan visar nu fältverktyg och affärsstöd i statusrutan.
- Uppdaterat service worker-cache-namn till skogskalkyl-2.0.0-alpha.1-dashboard.1.

### Fixed - Global layout och textbrytning

- Global layoutfix med stabilare box sizing, min-width-skydd och textbrytning i kort, statistik och resultatpaneler.
- Statistikgridar och formulärfält bryts mer robust på mindre skärmar.
- Förbättrad mobilanpassning för kundregister, dashboard, offert och resultatvyer utan horisontell scroll.
- Uppdaterat service worker-cache-namn till skogskalkyl-2.0.0-alpha.1-layout.1.

### Checked - Stabilitet efter filstruktur

- Kontrollerad GitHub Pages-struktur med root-filer, css/, js/, js/views/ och js/calculators/.
- README uppdaterad med aktuell projektstruktur.

### Added - Kundregister och jobbarkiv

- Nytt lokalt kundregister med kunder, fastigheter och kontaktuppgifter.
- Nytt jobbarkiv med jobbtyper, status, offertvärde, datum och kundkoppling.
- Sök och filter för kunder och jobb.
- Import från senaste giltiga offertutkast till kund och jobb.
- LocalStorage-lagring med nycklarna customers och jobs utan att andra utkast ändras.
- Uppdaterat service worker-cache-namn till skogskalkyl-2.0.0-alpha.1-customers.1 och cachar customers.js samt customerArchive.js.

### Added - Professionell offertgenerator

- Ny offertgenerator med företag, kund, offertuppgifter, offertposter, summering, villkor och förhandsvisning.
- Ny fristående quoteCalculator med normalisering, radmoms, rabatt, påslag, avrundning och offerttext.
- Import av senaste röjningskalkyl och senaste planpriskalkyl till offertposter.
- Autosparade offertutkast som laddas tillbaka efter omladdning.
- Kopiera offerttext och utskrift/PDF via webbläsarens utskriftsfunktion.
- Uppdaterat service worker-cache-namn till skogskalkyl-2.0.0-alpha.1-offert.6 och cachar quoteCalculator.js.


### Added - Professionell prissättning av skogsbruksplan

- Ny planprismodul med uppdrag, omfattning, fältarbete, kontorsarbete, resa, resultat och offertunderlag.
- Komplexitetsindex baserat på plantyp, fältsvårighet, tillgänglighet och terräng.
- Separat beräkning av fältarbete, kontorsarbete, resa, etablering, påslag, moms och pris per hektar.
- Autosparade planprisutkast som laddas tillbaka efter omladdning.
- Kopierbar offerttext för skogsbruksplansuppdrag.
- Uppdaterat service worker-cache-namn så nya planprisfiler ersätter äldre PWA-cache.


### Added - Professionell röjningskalkyl

- Ny röjningskalkyl med svårighetsindex, produktivitet, tidsåtgång och pris per hektar.
- Kalkylmotor för röjning som väger in stamantal, medelhöjd, DGV, lövandel, röjningstyp, terräng, vegetation, blockighet, lutning, mark och framkomlighet.
- Prisdata med timpris, utrustningskostnad, resa, administration, vinstpåslag och moms.
- Autosparade röjningsutkast som laddas tillbaka efter omladdning.
- Kopiera offerttext för professionellt offertunderlag.


### Added - Färdiga fältmoduler

- Färdig DGV-modul med diameterinmatning, auto-sparat utkast, ångra, rensa, borttagning och statistik.
- Färdig medelhöjdsmodul med höjdinmatning, auto-sparat utkast, ångra, rensa, borttagning och statistik.
- Fältanpassad mobil-UX med stora inmatningsfält, stora knappar och tydliga resultatpaneler.


### Added

- Första fungerande appskalet för Skogskalkyl 2.0.
- PWA-manifest och service worker med offline-cache.
- Responsiv layout, mobilnavigation och desktop-sidebar.
- Router för dashboard, DGV, medelhöjd, röjning, skogsbruksplan, offert och inställningar.
- Lokal lagring för inställningar och beräkningsutkast.
- Förberedda kalkylmoduler för DGV och medelhöjd.
- Grundläggande prissättningsmotor för röjning, skogsbruksplan och offert.
