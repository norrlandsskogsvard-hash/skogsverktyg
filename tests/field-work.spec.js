import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { startStaticServer } from "./static-server.mjs";
import { calculateDgv, parsePositiveDiameter } from "../js/calculators/dgvCalculator.js";
import { calculateMeanHeight, parsePositiveHeight } from "../js/calculators/heightCalculator.js";
import { presentMeasurementNote } from "../js/calculators/measurementNote.js";

let server;
test.beforeAll(async () => { server = await startStaticServer({ port: 4177 }); });
test.afterAll(async () => { await server?.close(); });
test.beforeEach(async ({ page }) => {
  page.errors = [];
  page.on("pageerror", error => page.errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") page.errors.push(message.text()); });
});
test.afterEach(async ({ page }) => { expect(page.errors).toEqual([]); });
const open = (page, route) => page.goto(`${server.url}/?test=1#/${route}`);
const type = async (page, value) => {
  for (const digit of value) await page.locator(`[data-keypad-value="${digit}"]`).click();
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
};

test("DGV och medelhöjd följer formlerna och bevarar decimaler", () => {
  const formatted = presentMeasurementNote("Stamantal: 1000 stammar/ha · 2 provytor.");
  expect(presentMeasurementNote(formatted)).toBe(formatted);
  expect(presentMeasurementNote("DGV: 20,034920634920635 cm · 4 provträd.\nMetod: summa diameter³ / summa diameter² (grundytevägd diameter).\nKommentar: Metod: egen text")).toBe("DGV: 20,0 cm · 4 provträd.\nKommentar: Metod: egen text");
  // Independent hand calculation: (10³ + 20³ + 30³)/(10² + 20² + 30²).
  expect(calculateDgv([10, 20, 30]).dgv).toBeCloseTo(36000 / 1400, 12);
  expect(calculateDgv([18.5]).dgv).toBeCloseTo(18.5, 12);
  expect(calculateDgv([10, 20, 30]).dgv).not.toBeCloseTo(Math.sqrt(1400 / 3), 3);
  expect(calculateMeanHeight([2.4, 3.6, 6]).meanHeight).toBeCloseTo(4, 12);
  expect(calculateMeanHeight([2.45, 2.55]).meanHeight).toBeCloseTo(2.5, 12);
  for (const parse of [parsePositiveDiameter, parsePositiveHeight]) {
    expect(parse("18,555")).toBe(18.555);
    for (const invalid of ["18x", "2.4.5", "NaN", "Infinity", -1, 0, ""]) expect(parse(invalid)).toBeNull();
  }
  expect(calculateDgv(null).count).toBe(0);
  expect(calculateMeanHeight({}).count).toBe(0);
  for (const measurements of [[12, 23, 34, 45], [10.25, 18.555, 22.75], [1, 1, 1]]) {
    const independent = measurements.reduce((sum, d) => sum + d ** 3, 0) / measurements.reduce((sum, d) => sum + d ** 2, 0);
    expect(calculateDgv(measurements).dgv).toBeCloseTo(independent, 12);
  }
});

for (const width of [390, 1440]) {
  test(`fältarbete ${width}: logisk knappsats och råvärden till avdelning`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await open(page, "dgv");
    await page.getByRole("button", { name: "Vänster", exact: true }).click();
    const rects = await page.locator(".field-keypad__grid button").evaluateAll(buttons => buttons.map(button => { const r = button.getBoundingClientRect(); return { x: r.x, y: r.y, h: r.height }; }));
    expect(rects[0].y).toBe(rects[1].y); expect(rects[1].y).toBe(rects[2].y);
    expect(rects[3].x).toBe(rects[0].x); expect(rects[3].y).toBeGreaterThan(rects[0].y);
    expect(rects[9].x).toBe(rects[0].x); expect(rects[11].x).toBe(rects[2].x);
    if (width === 390) {
      expect(rects.every(rect => rect.h >= 48)).toBe(true);
      const bottom = await page.getByRole("button", { name: "Lägg till", exact: true }).evaluate(button => button.getBoundingClientRect().bottom);
      const navTop = await page.locator(".bottom-nav").evaluate(nav => nav.getBoundingClientRect().top);
      expect(bottom).toBeLessThan(navTop);
    }
    await type(page, "18,555");
    await type(page, "22,75");
    const raw = await page.evaluate(() => JSON.parse(localStorage.getItem("skogskalkyl2:dgvDraftDiameters")));
    expect(raw).toEqual([18.555, 22.75]);
    await page.screenshot({ path: `test-results/screenshots/keypad-${width}.png`, fullPage: true });
    await page.locator(".measurement-transfer summary").click();
    await page.locator("[data-new-property]").fill("Skogen 1:1");
    await page.locator("[data-new-department]").fill("12");
    await page.getByRole("button", { name: "Skapa avdelning", exact: true }).click();
    await page.locator("[data-measurement-comment]").fill("Provträd vid norra kanten.");
    await page.getByRole("button", { name: "Spara mätning i avdelning", exact: true }).click();
    await expect(page.locator("[data-transfer-status]")).toContainText("sparad");
    await open(page, "height");
    await expect(page.locator('[data-hand="left"]')).toHaveCount(2);
    await expect(page.locator("[data-measurement-target]")).toHaveValue(/.+/);
    await type(page, "2,45"); await type(page, "2,55");
    await page.getByRole("button", { name: "Spara mätning i avdelning", exact: true }).click();
    await open(page, "field-notes");
    const note = page.getByLabel("Anteckning", { exact: true });
    await expect(note).toHaveValue(/Diametrar \(cm\): 18,6; 22,8/);
    await expect(note).toHaveValue(/Medelhöjd: 2,5 m/);
    await expect(note).toHaveValue(/Höjder \(m\): 2,5; 2,6/);
    await expect(note).not.toHaveValue(/Metod:/);
    const records = await page.evaluate(() => JSON.parse(localStorage.getItem("skogskalkyl2:fieldNotesV1"))[0].measurements);
    expect(records[0].values).toEqual([18.555, 22.75]);
    expect(records[1].values).toEqual([2.45, 2.55]);
   await expect(note).toHaveValue(/Provträd vid norra kanten/);
    await page.getByRole("searchbox", { name: "Sök avdelningar" }).fill("saknas");
    await expect(page.locator("[data-note]")).toBeHidden();
    await page.getByRole("searchbox", { name: "Sök avdelningar" }).fill("Skogen");
    await expect(page.locator("[data-note]")).toBeVisible();
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportera CSV", exact: true }).click();
    const download = await downloadEvent;
    expect(readFileSync(await download.path(), "utf8")).toContain("18,6; 22,8");
    await page.screenshot({ path: `test-results/screenshots/field-work-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

test("överföring skyddar mot lagringsfel och rensar inte mätvärden", async ({ page }) => {
  await open(page, "dgv");
  await page.getByRole("button", { name: "Spara mätning i avdelning", exact: true }).click();
  await expect(page.locator("[data-transfer-status]")).toContainText("mätvärden först");
  await type(page, "18,5");
  await page.locator(".measurement-transfer summary").click();
  await page.locator("[data-new-department]").fill("4");
  await page.getByRole("button", { name: "Skapa avdelning", exact: true }).click();
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error("QuotaExceededError"); }; });
  await page.getByRole("button", { name: "Spara mätning i avdelning", exact: true }).click();
  await expect(page.locator("[data-transfer-status]")).toContainText("Kunde inte spara");
  await expect(page.locator("[data-diameter-list]")).toContainText("18,5");
});
