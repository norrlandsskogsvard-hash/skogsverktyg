# Changelog

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
