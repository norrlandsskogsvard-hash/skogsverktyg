# Testning

Skogskalkyl 2.0 har Playwright-smoketester för desktop och mobilvy. Testerna startar appen som en statisk lokal server, går igenom huvudrutter och kontrollerar att viktiga fältflöden fungerar.

## Installera

Kör en gång i projektmappen:

```bash
npm install
npx playwright install chromium
```

## Kör tester

```bash
npm test
```

För att se webbläsaren under körning:

```bash
npm run test:headed
```

## Screenshots

Tester sparar screenshots här:

```text
test-results/screenshots/
```

Filer som skapas:

- `dashboard-mobile.png`
- `skotselkollen-mobile.png`
- `skotselkollen-desktop.png`
- `dgv-mobile.png`
- `height-mobile.png`

Playwrights HTML-rapport hamnar i:

```text
test-results/playwright-report/
```

## Service worker i testläge

Appen registrerar inte service worker när URL:en innehåller `?test=1`. Smoke-testerna kör därför mot exempelvis:

```text
http://127.0.0.1:4173/?test=1#/skotselkollen
```

Testerna rensar också `localStorage`, `sessionStorage` och eventuella service worker-registreringar före varje routeflöde.

## Felsök console errors

Testerna lyssnar på `console.error` och JavaScript-fel i sidan. Om ett test faller:

1. Kör `npm run test:headed`.
2. Öppna HTML-rapporten i `test-results/playwright-report/`.
3. Kontrollera aktuell route och screenshot i `test-results/screenshots/`.
4. Leta efter feltexten under testets console-/trace-information.

Console warnings stoppar inte testet, men console errors gör det.
