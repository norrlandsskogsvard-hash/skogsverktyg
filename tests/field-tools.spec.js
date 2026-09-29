import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { startStaticServer } from "./static-server.mjs";
import { calculateYoungVolume, calculatePlotStems, fieldNumber } from "../js/calculators/fieldCalculator.js";
import { calculateFieldSI } from "../js/calculators/fieldSiteIndex.js";
import { calculateCirclePlot, summarizeCirclePlots } from "../js/calculators/circlePlotCalculator.js";
import { SI_DIAGRAMS, VOLUME_BASAL_CURVES, VOLUME_STEM_CURVES } from "../js/calculators/fieldReferenceData.js";

let server;
test.beforeAll(async () => { server = await startStaticServer({ port: 4175 }); });
test.afterAll(async () => { await server?.close(); });
test.beforeEach(async ({ page }) => {
  page.errors = [];
  page.on("pageerror", error => page.errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") page.errors.push(message.text()); });
});
test.afterEach(async ({ page }) => { expect(page.errors).toEqual([]); });
const open = (page, path) => page.goto(`${server.url}/?test=1#/${path}`);
const noOverflow = async page => expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);

test("källstödd SI: BH-ålder, totalålder och validering", () => {
  const si = trees => calculateFieldSI({ species: "tall", trees });
  expect(si([{ height: "16,0", age: "60" }])).toMatchObject({ hasSI: true, totalAgeLow: 67, totalAgeHigh: 73 });
  expect(si([{ height: 16, age: 60 }, { height: "19,9", age: 60 }]).trees).toHaveLength(2);
  expect(calculateFieldSI({ species: "gran", trees: [{ height: 18.9, age: 80 }] })).toMatchObject({ hasSI: false, totalAgeLow: 87, totalAgeHigh: 93 });
  for (const trees of [[], Array(5).fill({ height: 16, age: 60 }), [{ height: "16x", age: 60 }], [{ height: 16, age: 0 }], [{ height: "", age: 60 }]]) expect(si(trees).error).toBeTruthy();
  expect(si([{ height: 16, age: 141 }])).toMatchObject({ hasSI: false, totalAgeLow: 148, totalAgeHigh: 154 });
  expect(si([{ height: 4, age: 60 }])).toMatchObject({ hasSI: false, totalAgeLow: 67, totalAgeHigh: 73 });
  for (const override of [{ species: "bjork" }, { ageType: "total" }, { ageAdditionMode: "own", yearsToBH: "" }]) expect(calculateFieldSI({ species: "tall", trees: [{ height: 16, age: 60 }], ...override }).error).toBeTruthy();
  expect(calculateFieldSI({ species: "tall", ageAdditionMode: "own", yearsToBH: 10, trees: [{ height: 16, age: 60 }] })).toMatchObject({ totalAgeLow: 70, totalAgeHigh: 70 });
  expect(calculateYoungVolume({ method: "basal", basalArea: 20, height: 7, area: "2,5" })).toMatchObject({ volume: 75, total: 187.5 });
  expect(calculateYoungVolume({ method: "stems", stems: 4000, height: 9, species: "mixed" })).toMatchObject({ volume: null, lower: 78, upper: 104 });
  expect(calculateYoungVolume({ method: "stems", stems: 4000, height: 9, species: "broadleaf" }).volume).toBe(78);
  expect(calculateYoungVolume({ method: "stems", stems: 4000, height: 9, species: "conifer" }).volume).toBe(104);
  for (const input of [{ method: "basal", basalArea: 31, height: 7 }, { method: "basal", basalArea: 20, height: 16 }, { method: "stems", stems: 499, height: 7, species: "conifer" }, { method: "stems", stems: 4000, height: 10, species: "conifer" }, { method: "basal", basalArea: 20, height: 7, area: "fel" }]) expect(calculateYoungVolume(input).error).toBeTruthy();
  expect(calculatePlotStems(10, 5)).toBeCloseTo(1273.2395);
  expect(calculatePlotStems(10, 0)).toBeNull();
  expect(calculatePlotStems(2.5, 5)).toBeNull();
  expect(calculateCirclePlot({ count: 10, size: "100" })).toMatchObject({ area: 100, stemsPerHa: 1000 });
  expect(summarizeCirclePlots([{ count: 10, size: "100" }, { count: 5, size: "50" }])).toMatchObject({ plotCount: 2, count: 15 });
  for (const value of ["-2", "Infinity", "12x", "", "1.2.3"]) expect(fieldNumber(value)).toBeNull();
});

test("bildpunkter är monotona och ändrar inte befintliga SI-/gallringsdata", () => {
  for (const diagram of Object.values(SI_DIAGRAMS)) for (const [, heights] of diagram.curves) {
    const numbers = heights.filter(Number.isFinite);
    expect(numbers.every((n, i) => !i || n > numbers[i - 1])).toBe(true);
  }
  for (const [, volumes] of VOLUME_BASAL_CURVES) expect(volumes.every((n, i) => !i || n > volumes[i - 1])).toBe(true);
  for (const [, lower, upper] of VOLUME_STEM_CURVES) expect(lower.every((n, i) => n <= upper[i])).toBe(true);
  expect(readFileSync("js/calculators/siteIndexCurves.js", "utf8")).toContain("SITE_INDEX_CURVES = []");
});

for (const width of [390, 1440]) {
  test(`fältverktyg ${width}px: SI, fyra träd och volym`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await open(page, "skotselkollen");
    await expect(page.getByRole("link", { name: /Ståndortsindex/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Visa i gallringskurva" })).toHaveCount(0);
    await page.getByRole("link", { name: /Ståndortsindex/ }).click();
    await page.getByLabel("Höjd träd 1", { exact: true }).fill("16,0");
    await page.getByLabel("BH-ålder träd 1", { exact: true }).fill("60");
    await page.getByRole("button", { name: "Beräkna SI och totalålder", exact: true }).click();
    await expect(page.locator("[data-si-result]")).toContainText("T19,7–20,7");
    await expect(page.locator("[data-si-result]")).toContainText("67–73 år");
    for (let i = 2; i <= 4; i++) {
      await page.getByRole("button", { name: "Lägg till provträd" }).click();
      await page.getByLabel(`Höjd träd ${i}`, { exact: true }).fill("16");
      await page.getByLabel(`BH-ålder träd ${i}`, { exact: true }).fill("60");
    }
    await expect(page.getByRole("button", { name: "Lägg till provträd" })).toBeDisabled();
    await page.getByRole("button", { name: "Beräkna SI och totalålder", exact: true }).click();
    await expect(page.locator("[data-si-result]")).toContainText("4 provträd");
    await noOverflow(page);
    await page.screenshot({ path: `test-results/screenshots/si-${width}.png`, fullPage: true });
    await page.reload();
    await expect(page.getByLabel("Höjd träd 4", { exact: true })).toHaveValue("16");
    await page.locator('[name="species"]').selectOption("gran");
    await page.getByRole("button", { name: "Beräkna SI och totalålder", exact: true }).click();
    await page.getByRole("link", { name: "Ungskogsvolym", exact: true }).click();
    await page.locator('[name="height"]').fill("7");
    await page.locator('[name="basalArea"]').fill("20");
    await page.locator('[name="area"]').fill("2");
    await page.getByRole("button", { name: "Beräkna volym", exact: true }).click();
    await expect(page.locator("[data-volume-result]")).toContainText("≈ 75");
    await expect(page.locator("[data-volume-result]")).toContainText("≈ 150 m³sk");
    await page.locator('[name="height"]').fill("8");
    await expect(page.locator("[data-save-result]")).toHaveCount(0);
    await page.locator('[name="method"]').selectOption("stems");
    await page.locator('[name="height"]').fill("9");
    await page.locator('[name="stems"]').fill("4000");
    await page.locator('[name="species"]').selectOption("mixed");
    await page.getByRole("button", { name: "Beräkna volym", exact: true }).click();
    await expect(page.locator("[data-volume-result]")).toContainText("80–105");
    await noOverflow(page);
    await page.screenshot({ path: `test-results/screenshots/volume-${width}.png`, fullPage: true });
    await page.locator("[data-plot] summary").click();
    await page.getByLabel("Räknade stammar", { exact: true }).fill("10");
    await page.getByLabel("Provyteradie (m)", { exact: true }).fill("5");
    await page.getByRole("button", { name: "Använd stamantal", exact: true }).click();
    await expect(page.locator('[name="stems"]')).toHaveValue("1273");
    await page.reload();
    await expect(page.locator('[name="plotRadius"]')).toHaveValue("5");
  });
}

test("stamantal: cirkelprovyta, flera provytor och mobil layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "circle-plot");
  await page.getByLabel("Antal stammar på provytan", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Lägg till provyta", exact: true }).click();
  await expect(page.locator("[data-circle-result]")).toContainText(/1[\s\u00a0]?000 stammar\/ha/);
  await expect(page.locator("[data-circle-list]")).toContainText("10 stammar");
  await page.locator('[name="size"]').selectOption("50");
  await page.getByLabel("Antal stammar på provytan", { exact: true }).fill("5");
  await page.getByRole("button", { name: "Lägg till provyta", exact: true }).click();
  await expect(page.locator("[data-circle-list]")).toContainText("2 provytor");
  await expect(page.locator("[data-circle-list]")).toContainText(/1[\s\u00a0]?000 stammar\/ha/);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test("avdelningsanteckningar: autospara, resultat, export, import och ångra", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "field-notes");
  await page.getByRole("button", { name: "Ny avdelning", exact: true }).click();
  await page.getByLabel("Fastighet", { exact: true }).fill("Skogen 1:1");
  await page.getByLabel("Avdelning", { exact: true }).fill("12");
  await page.getByLabel("Anteckning", { exact: true }).fill("Kontrollera vindfällen. <img src=x onerror=alert(1)>");
  await page.reload();
  await expect(page.getByLabel("Anteckning", { exact: true })).toHaveValue(/Kontrollera vindfällen/);
  await page.getByRole("link", { name: "SI", exact: true }).first().click();
  await page.getByLabel("Höjd träd 1", { exact: true }).fill("16");
  await page.getByLabel("BH-ålder träd 1", { exact: true }).fill("60");
  await page.getByRole("button", { name: "Beräkna SI och totalålder", exact: true }).click();
  await page.getByLabel("Spara resultat i avdelning").selectOption({ label: "Skogen 1:1 / 12" });
  await page.getByRole("button", { name: "Spara resultat", exact: true }).click();
  await open(page, "field-notes");
  await expect(page.getByLabel("Anteckning", { exact: true })).toHaveValue(/SI cirka T19,7/);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Säkerhetskopia", exact: true }).click();
  const download = await downloadEvent;
  const file = await download.path();
  const backup = JSON.parse(readFileSync(file, "utf8"));
  expect(backup.entries[0].text).toContain("SI cirka T19,7");
  await page.getByRole("button", { name: "Ta bort avdelning 12" }).click();
  await page.getByRole("button", { name: "Ångra borttagning" }).click();
  await expect(page.getByLabel("Anteckning", { exact: true })).toHaveValue(/SI cirka T19,7/);
  await page.locator("[data-import-notes]").setInputFiles(file);
  await expect(page.locator("[data-note]")).toHaveCount(2);
  await expect(page.locator("[data-notes] img")).toHaveCount(0);
  await page.getByLabel("Anteckning", { exact: true }).first().fill("En annan anteckning");
  await expect(page.getByLabel("Anteckning", { exact: true }).last()).toHaveValue(/SI cirka T19,7/);
  await noOverflow(page);
  await page.screenshot({ path: "test-results/screenshots/notes-mobile.png", fullPage: true });
});

test("lagringsfel rapporteras och anteckningen går att exportera", async ({ page }) => {
  await open(page, "field-notes");
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error("QuotaExceededError"); }; });
  await page.getByRole("button", { name: "Ny avdelning", exact: true }).click();
  await page.getByLabel("Anteckning", { exact: true }).fill("Får inte tappas");
  await expect(page.locator("[data-save-status]")).toContainText("Kunde inte spara");
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportera text", exact: true }).click();
  const downloaded = await event;
  expect(readFileSync(await downloaded.path(), "utf8")).toContain("Får inte tappas");
});

test("DGV och Höjd: Enter, backsteg, ångra och rensa fungerar", async ({ page }) => {
  for (const [path, prefix, value] of [["dgv", "diameter", "18,5"], ["height", "height", "2,4"]]) {
    await open(page, path);
    const input = page.locator(`[data-${prefix}-input]`);
    await expect(input).toHaveAttribute("readonly", "");
    await expect(input).toHaveAttribute("inputmode", "none");
    await input.focus();
    await page.keyboard.type(value + "9");
    await page.keyboard.press("Backspace");
    await expect(input).toHaveValue(value);
    await page.keyboard.press("Enter");
    await expect(page.locator(`[data-${prefix}-list]`)).toContainText(value);
    await page.locator("[data-undo]").click();
    await expect(page.locator(`[data-${prefix}-list]`)).not.toContainText(value);
    await input.focus(); await page.keyboard.type(value); await page.keyboard.press("Enter");
    page.once("dialog", dialog => dialog.accept());
    await page.locator("[data-clear]").click();
    await expect(page.locator(`[data-${prefix}-list]`)).not.toContainText(value);
    await input.focus(); await page.keyboard.type(value);
    await page.locator("[data-clear-entry]").click();
    await expect(input).toHaveValue("");
  }
});

test("PWA cachar verktyg och bildkällor och fungerar offline", async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const page = await context.newPage();
  try {
    await page.goto(`${server.url}/#/si`);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    const cached = await page.evaluate(async () => {
      const cache = await caches.open("skogskalkyl-2.0.0-alpha.1-field-tools.2");
      return (await cache.keys()).map(r => new URL(r.url).pathname);
    });
    for (const path of ["/assets/field/si-tall.png", "/assets/field/si-gran.png", "/assets/field/young-volume.png", "/js/views/field-tools.js", "/js/calculators/fieldSiteIndex.js", "/js/calculators/circlePlotCalculator.js", "/js/views/dgv.js", "/js/views/height.js"]) expect(cached).toContain(path);
    await context.setOffline(true);
    await page.reload();
    await page.getByLabel("Höjd träd 1", { exact: true }).fill("16");
      await page.getByLabel("BH-ålder träd 1", { exact: true }).fill("60");
    await page.getByRole("button", { name: "Beräkna SI och totalålder", exact: true }).click();
    await expect(page.locator("[data-si-result]")).toContainText("T19,7–20,7");
    await page.locator("[data-si-source] summary").click();
    await expect(page.locator("[data-si-source] a").first()).toHaveAttribute("href", /37808/);
  } finally { await context.close(); }
});
