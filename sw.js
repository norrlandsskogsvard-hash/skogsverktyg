# Changelog

## v2.0.0-alpha.1 - 2026-07-01

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
