# Skogskalkyl 2.0

Version: v2.0.0-alpha.1

Skogskalkyl 2.0 är en modern PWA för svenska skogsvårdsentreprenörer och små skogsföretagare. Den här första alpha-versionen innehåller appskal, navigering, responsiv layout, offline-stöd och förberedda moduler för kommande skogliga beräkningar.

## Funktioner i alpha.1

- Fungerande appskal utan backend eller byggprocess
- Hash-baserad navigering som fungerar på GitHub Pages
- Responsiv layout för mobil, surfplatta och desktop
- PWA-manifest och service worker med defensiv cachelogik
- Lokalt sparade inställningar med localStorage
- Förberedda moduler för DGV, medelhöjd, röjning, skogsbruksplan och offert
- Grundläggande kalkylmotor för röjning, planprissättning och offertsummering

## Kör lokalt

Appen kan köras med Live Server eller valfri statisk server.

Exempel med Python:

python -m http.server 5173

Öppna sedan http://localhost:5173/

## GitHub Pages

Lägg filerna i ett GitHub-repo och aktivera GitHub Pages för vald branch. Alla sökvägar är relativa och appen använder #/vy för intern navigering, så inga extra serverregler behövs.

## Nästa steg

- Bygga färdig DGV-modul med tabeller och validerad beräkningslogik
- Bygga färdig medelhöjd-modul med provträd, summering och export
- Utöka offertgeneratorn med kunduppgifter, PDF/utskrift och malltexter
