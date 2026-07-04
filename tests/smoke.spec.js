import { expect, test } from "@playwright/test";
import { startStaticServer } from "./static-server.mjs";

const SCREENSHOT_DIR = "test-results/screenshots";
let staticServer;

const routes = [
  { hash: "/", text: /Skogskalkyl 2\.0|Fältkalkyler/i },
  { hash: "/dgv", text: /DGV|diameter/i },
  { hash: "/height", text: /Medelhöjd|Höjd/i },
  { hash: "/rojning", text: /Röjning/i },
  { hash: "/forest-plan-pricing", text: /Planpris|skogsbruksplan/i },
  { hash: "/quote", text: /Offert/i },
  { hash: "/customers", text: /Kundregister|Kunder/i },
  { hash: "/skotselkollen", text: /Skötselkollen|Snabb gallringsmall/i },
  { hash: "/settings", text: /Inställningar/i }
];

test.beforeAll(async () => {
  staticServer = await startStaticServer({ port: 4173 });
});

test.afterAll(async () => {
  await staticServer?.close();
});

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });
  page.consoleErrors = consoleErrors;
});

test.afterEach(async ({ page }) => {
  expect(page.consoleErrors, "Inga console errors ska uppstå").toEqual([]);
});

test("desktop routes render utan console errors", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of routes) {
    await gotoRoute(page, route.hash);
    await expect(page.locator("body")).toContainText(route.text);
  }
});

test("mobil routes render utan console errors", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of routes) {
    await gotoRoute(page, route.hash);
    await expect(page.locator("body")).toContainText(route.text);
  }
  await page.screenshot({ path: `${SCREENSHOT_DIR}/dashboard-mobile.png`, fullPage: true });
});

test("Skötselkollen visar T20-pilot på desktop och mobil", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoRoute(page, "/skotselkollen");
  await fillSkotselkollenPilot(page);
  await expect(page.locator("body")).toContainText("Pilotunderlag");
  await expect(page.locator("body")).toContainText("Samlad bedömning");
  await expect(page.locator("body")).toContainText("T20");
  await expect(page.locator("body")).toContainText("T20-exempel, ej full kurva");
  await expect(page.locator("body")).toContainText("Full digitaliserad gallringskurva saknas");
  await expect(page.locator("body")).toContainText("Jämför mot komplett mall innan åtgärd");
  await expect(page.locator(".skotsel-result-summary").first()).toContainText("Ingen flagga");
  await openSources(page);
  await expect(page.locator("body")).toContainText("Skogskunskap");
  await expect(page.locator("body")).toContainText("Praktiska skötselmallar");
  await expect(page.locator("body")).toContainText("Norra Skog 2024");
  await expect(page.locator(".skotsel-source-balance-details").first()).not.toHaveAttribute("open", "");
  await page.screenshot({ path: `${SCREENSHOT_DIR}/skotselkollen-desktop.png`, fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await gotoRoute(page, "/skotselkollen");
  await fillSkotselkollenPilot(page);
  await expect(page.locator("body")).toContainText("Pilotunderlag");
  await expect(page.locator("body")).toContainText("Samlad bedömning");
  await expect(page.locator("body")).toContainText("T20");
  await expect(page.locator("body")).toContainText("T20-exempel, ej full kurva");
  await expect(page.locator("body")).toContainText("Full digitaliserad gallringskurva saknas");
  await expect(page.locator(".skotsel-result-summary").first()).toContainText("Ingen flagga");
  await openSources(page);
  await expect(page.locator("body")).toContainText("Skogskunskap");
  await expect(page.locator("body")).toContainText("Praktiska skötselmallar");
  await expect(page.locator("body")).toContainText("Norra Skog 2024");
  await expectNoHorizontalScroll(page);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/skotselkollen-mobile.png`, fullPage: true });
});

test("Skötselkollen markförutsättning styr juridisk status utan att dölja skoglig status", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoRoute(page, "/skotselkollen");
  await fillSkotselkollenPilot(page);
  await openSkotselAdvanced(page);

  await page.locator('select[name="productiveForestLandAssumption"]').selectOption("uncertain");
  await page.getByRole("button", { name: "Visa i gallringskurva" }).click();
  await expect(page.locator(".skotsel-result-summary").first()).toContainText("Pilotunderlag");
  await expect(page.locator(".skotsel-result-summary").first()).toContainText("Kontroll rekommenderas");
  await expect(page.locator("body")).toContainText("Markklass är osäker");

  await page.locator('select[name="productiveForestLandAssumption"]').selectOption("non_productive");
  await page.getByRole("button", { name: "Visa i gallringskurva" }).click();
  await expect(page.locator(".skotsel-result-summary").first()).toContainText("Pilotunderlag");
  await expect(page.locator(".skotsel-result-summary").first()).toContainText("Kontroll krävs");
});

test("Skötselkollen håller björk som eget spår", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoRoute(page, "/skotselkollen");
  await fillSkotselkollenPilot(page);
  await page.locator('select[name="mainSpecies"]').selectOption("bjork");
  await expect(page.locator("body")).toContainText(/Björkspår|Björkspåret/i);
  await expect(page.locator("body")).toContainText(/Tall- eller granmall används inte som facit/i);
  await expect(page.locator("body")).toContainText(/Punkten visas utan tall-\/granmall som facit/i);
  await expect(page.locator("body")).not.toContainText(/Tall- eller granmall används som facit för björk/i);
});

test("Skötselkollen visar saknad kurva för tall T22 utan att skapa falsk kurva", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoRoute(page, "/skotselkollen");
  await fillSkotselkollenPilot(page);
  await fillNumber(page, 'input[name="siteIndex"]', "22");
  await page.getByRole("button", { name: "Visa i gallringskurva" }).click();
  await expect(page.locator("body")).toContainText(/Kurvunderlag saknas|kurva saknas/i);
  await expect(page.locator("body")).toContainText("Full digitaliserad gallringskurva saknas");
  await expect(page.locator("body")).toContainText("Hämta rätt kurvunderlag innan åtgärd");
  await expectNoHorizontalScroll(page);
});

test("Röjningskalkyl visar källstöd utan att ändra kalkylresultat", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoRoute(page, "/rojning");
  const resultPanel = page.locator("[data-clearing-result]");
  const totalBefore = await resultPanel.locator(".result-main strong").innerText();

  await expect(page.locator("details.clearing-source-support")).toContainText("Källstöd och antaganden");
  await page.locator("details.clearing-source-support").evaluate((details) => {
    details.open = true;
  });
  await expect(page.locator("details.clearing-source-support")).toContainText("Skogskunskap Röjningsanalys");
  await expect(page.locator("details.clearing-source-support")).toContainText("Skogskunskap Röjningsklockan");
  await expect(page.locator("details.clearing-source-support")).toContainText("Skogskunskap Lövröjningsmall");
  await expect(page.locator("details.clearing-source-support")).toContainText("inte som prisfacit");
  await expect(resultPanel.locator(".result-main strong")).toHaveText(totalBefore);
  await expectNoHorizontalScroll(page);
});

test("DGV mobil: knappsats lägger till 18,5 utan horisontell scroll", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoRoute(page, "/dgv");
  await pressKeypadValue(page, "[data-diameter-keypad]", ["1", "8", ",", "5"]);
  await page.getByRole("button", { name: "Lägg till" }).click();
  await expect(page.locator("[data-diameter-list]")).toContainText("18,5");
  await expectNoHorizontalScroll(page);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/dgv-mobile.png`, fullPage: true });
});

test("Höjd mobil: knappsats lägger till 2,4", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoRoute(page, "/height");
  await pressKeypadValue(page, "[data-height-keypad]", ["2", ",", "4"]);
  await page.getByRole("button", { name: "Lägg till" }).click();
  await expect(page.locator("[data-height-list]")).toContainText("2,4");
  await expectNoHorizontalScroll(page);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/height-mobile.png`, fullPage: true });
});

async function gotoRoute(page, hash) {
  await page.goto(`/?test=1#${hash}`);
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  });
  await page.goto(`/?test=1#${hash}`);
  await page.waitForSelector("#view");
  await page.waitForFunction(() => document.querySelector("#view")?.children.length > 0);
}

async function fillSkotselkollenPilot(page) {
  await page.locator('select[name="mainSpecies"]').selectOption("tall");
  await page.locator('select[name="region"]').selectOption("norrland_inland");
  await fillNumber(page, 'input[name="heightMeters"]', "14.5");
  await fillNumber(page, 'input[name="basalArea"]', "24.5");
  await fillNumber(page, 'input[name="ageYears"]', "59");
  const manualSi = page.locator("[data-manual-si]");
  if (await manualSi.evaluate((node) => node.classList.contains("hidden"))) {
    await page.getByRole("button", { name: "Ändra SI manuellt" }).click();
  }
  await fillNumber(page, 'input[name="siteIndex"]', "20");
  await page.getByRole("button", { name: "Visa i gallringskurva" }).click();
}

async function fillNumber(page, selector, value) {
  await page.locator(selector).fill(value);
  await page.locator(selector).dispatchEvent("input");
}

async function pressKeypadValue(page, keypadSelector, values) {
  for (const value of values) {
    await page.locator(`${keypadSelector} [data-keypad-value="${value}"]`).click();
  }
}

async function openSources(page) {
  await page.evaluate(() => {
    document.querySelectorAll("details").forEach((details) => {
      const summary = details.querySelector(":scope > summary");
      if (summary?.textContent?.includes("Källor och antaganden")) {
        details.open = true;
      }
    });
  });
}

async function openSkotselAdvanced(page) {
  await page.evaluate(() => {
    const advanced = document.querySelector(".skotsel-advanced-root");
    if (advanced) advanced.open = true;
    document.querySelectorAll(".skotsel-advanced details").forEach((details) => {
      const summary = details.querySelector(":scope > summary");
      if (summary?.textContent?.includes("Juridisk kontroll")) {
        details.open = true;
      }
    });
  });
}

async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth
  }));
  expect(overflow.document, "document ska inte ha horisontell scroll").toBeLessThanOrEqual(1);
  expect(overflow.body, "body ska inte ha horisontell scroll").toBeLessThanOrEqual(1);
}
