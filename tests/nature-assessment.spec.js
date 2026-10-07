import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { startStaticServer } from "./static-server.mjs";
import { NATURE_FORM } from "../js/calculators/natureReferenceData.js";
import { assessNature, natureQuestions, natureReport } from "../js/calculators/natureCalculator.js";
import { calculateFieldSI, sluHeightAtAge } from "../js/calculators/fieldSiteIndex.js";

let server;
test.beforeAll(async () => { server = await startStaticServer({ port: 4179 }); });
test.afterAll(async () => { await server?.close(); });
test.beforeEach(async ({ page }) => {
  page.errors = [];
  page.on("pageerror", error => page.errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") page.errors.push(message.text()); });
});
test.afterEach(async ({ page }) => { expect(page.errors).toEqual([]); });
const open = (page, route) => page.goto(`${server.url}/?test=1#/${route}`);

test("naturvärden: PDF-matris, 300 ringar, regional giltighet och ofullständigt underlag", () => {
  expect(NATURE_FORM.items.map(q => q.id)).toEqual(Array.from({ length: 80 }, (_,i) => i + 1));
  expect(NATURE_FORM.items.reduce((sum,q) => sum + q.groups.length, 0)).toBe(300);
  for (const group of ["N", "Ot", "Op", "S", "V", "K"]) expect(natureQuestions(group)).toHaveLength(50);
  expect(NATURE_FORM.items[9].text).toBe("Lavar täcker > 50 % av marken");
  for (const [id, groups] of [[1,["N","Ot","Op","S","K"]],[10,["Ot"]],[59,["S"]],[64,["S"]],[73,["N","Ot","Op","S","V","K"]],[80,["Ot","Op","S","V"]]]) expect(NATURE_FORM.items[id-1].groups).toEqual(groups);
  const yes = Object.fromEntries(NATURE_FORM.items.map(q => [q.id,"yes"]));
  const full = assessNature({ answers: yes, scope: "boreal" });
  expect(full.complete).toBe(true);
  for (const score of full.balance) { expect(score.total).toBe(50); expect(score.site + score.stand).toBe(50); }
  expect(assessNature()).toMatchObject({ complete: false, scoreAllowed: false, relevantCount: 80, assessedCount: 0 });
  const partial = assessNature({ group: "Ot", scope: "boreal", answers: { 1: "yes", 2: "uncertain", 3: "no" } });
  expect(partial).toMatchObject({ complete: false, scoreAllowed: true, assessedCount: 2 });
  expect(partial.balance.find(b => b.code === "Ot").total).toBe(1);
  expect(partial.uncertain.map(q => q.id)).toEqual([2]);
  for (const scope of ["unknown", "other"]) expect(assessNature({ answers: yes, scope }).scoreAllowed).toBe(false);
  expect(assessNature({ answers: yes, scope: "north" })).toMatchObject({ scoreAllowed: true, scopeBasis: expect.stringContaining("Rättelsen är inte verifierad hos utgivaren") });
  const no = Object.fromEntries(NATURE_FORM.items.map(q => [q.id,"no"]));
  expect(assessNature({ answers: no, scope: "boreal" })).toMatchObject({ complete: true, assessedCount: 80 });
  expect(assessNature({ answers: no }).balance.every(b => b.total === 0)).toBe(true);
  expect(natureReport({ answers: {}, group: "Ot" })).toBeNull();
});

test("naturvärden: dubbla nivåer, inga tysta motsägelser eller nya klassgränser", () => {
  const input = { scope: "boreal", group: "Ot", answers: { 77: "yes", 73: "no" } };
  const result = assessNature(input);
  expect(result.effectiveYes).toEqual([73,77]);
  expect(result.conflicts.map(q => q.id)).toEqual([73]);
  expect(result.complete).toBe(false);
  expect(result.balance.find(b => b.code === "Ot").stand).toBe(2);
  expect(input.answers[73]).toBe("no");
  const report = natureReport(input);
  expect(report.text).toContain("Ofullständigt underlag");
  expect(report.text).toContain("motsägande svar: 73");
  expect(report.input).toEqual(input);
  expect(natureReport({ ...input, scope: "north" }).text).toContain("Användaren har bekräftat");
});

test("SI: ordinarie värden oförändrade, valfri extrapolation och metodförslag", () => {
  const input = { species: "tall", trees: [{ height: 16, age: 60 }] };
  const ordinary = calculateFieldSI(input);
  expect(ordinary.hasSI).toBe(true);
  expect(ordinary.siLow).toBeCloseTo(sluHeightAtAge("tall",16,73),12);
  expect(ordinary.siHigh).toBeCloseTo(sluHeightAtAge("tall",16,67),12);
  expect(calculateFieldSI({ ...input, allowExtrapolation: true })).toMatchObject({ siLow: ordinary.siLow, siHigh: ordinary.siHigh, suggestion: null });
  const old = { species: "gran", trees: [{ height: 18.9, age: 80 }] };
  expect(calculateFieldSI(old)).toMatchObject({ hasSI: false, suggestion: null });
  const proposal = calculateFieldSI({ ...old, allowExtrapolation: true });
  expect(proposal).toMatchObject({ hasSI: false, siLow: null, siHigh: null, totalAgeLow: 87, totalAgeHigh: 93, suggestion: { confidence: "Låg", extrapolated: true } });
  expect(proposal.suggestion.siLow).toBeCloseTo(sluHeightAtAge("gran",18.9,93),12);
  for (const suitability of ["uncertain", "unsuitable"]) expect(calculateFieldSI({ ...input, suitability }).hasSI).toBe(false);
  expect(calculateFieldSI({ ...input, suitability: "unsuitable", allowExtrapolation: true })).toMatchObject({ hasSI: false, suggestion: null });
  const young = calculateFieldSI({ ...input, trees: [{ height: 5, age: 8 }], allowExtrapolation: true });
  expect(young.suggestion).toBeNull(); expect(young.guidance).toContain("interceptmetod");
  expect(calculateFieldSI({ ...input, species: "bjork", allowExtrapolation: true }).error).toBeTruthy();
});

for (const width of [390,1440]) {
  test(`naturvärden ${width}px: fältflöde, autosparande och avdelningsrapport`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await open(page,"field-notes");
    await page.getByRole("button", { name: "Ny avdelning", exact: true }).click();
    await page.getByLabel("Fastighet", { exact: true }).fill("Testskog 1:1");
    await page.getByLabel("Avdelning", { exact: true }).fill("12");
    await page.getByRole("link", { name: "Naturvärden i avdelningen", exact: true }).click();
    await expect(page.getByLabel("Arbetsavdelning")).toContainText("Testskog 1:1 / 12");
    await page.getByLabel("Regionalt underlag").selectOption("boreal");
    await page.getByLabel("Bedömd areal (ha)").fill("3,5");
    await page.getByLabel("Fältbild / avgränsning").fill("Tallskog med död ved. <img src=x onerror=alert(1)>");
    await page.locator("[data-nature-context] summary").click();
    await page.locator('[data-answer="yes"]').click();
    await expect(page.locator("[data-question-id]")).toHaveAttribute("data-question-id","2");
    await page.locator('[data-answer="uncertain"]').click();
    await page.locator('[data-answer="no"]').click();
    await expect(page.locator("[data-nature-status]")).toContainText("2/50 bedömda");
    await expect(page.locator("[data-nature-status]")).toContainText("Ot 1 p");
    await expect(page.locator("[data-nature-status]")).toContainText("1 osäkra");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    if (width === 390) {
      const answerBottom = await page.locator(".nature-field__answers").evaluate(el => el.getBoundingClientRect().bottom);
      const navTop = await page.locator(".bottom-nav").evaluate(el => el.getBoundingClientRect().top);
      expect(answerBottom).toBeLessThan(navTop);
    }
    await page.screenshot({ path: `test-results/screenshots/nature-${width}.png`, fullPage: true });
    await page.reload();
    await expect(page.locator("[data-nature-status]")).toContainText("2/50 bedömda");
    await expect(page.locator("[data-question-id]")).toHaveAttribute("data-question-id","4");
    await page.locator("[data-nature-section]").selectOption("0");
    await page.locator("[data-unanswered]").click();
    await expect(page.locator("[data-question-id]")).toHaveAttribute("data-question-id","2");
    await page.getByRole("button", { name: "Spara mätning i avdelning", exact: true }).click();
    await open(page,"field-notes");
    await expect(page.getByLabel("Anteckning", { exact: true })).toHaveValue(/Naturvärdesbedömning/);
    await expect(page.getByLabel("Anteckning", { exact: true })).toHaveValue(/Ofullständigt underlag/);
    const event = page.waitForEvent("download");
    await page.getByRole("button", { name: "Säkerhetskopia", exact: true }).click();
    const backup = JSON.parse(readFileSync(await (await event).path(),"utf8"));
    expect(backup.entries[0].measurements[0]).toMatchObject({ kind: "nature-assessment", input: { area: "3,5", answers: { 1: "yes", 2: "uncertain", 3: "no" } } });
    await page.getByRole("button", { name: "Ny avdelning", exact: true }).click();
    await page.getByLabel("Avdelning", { exact: true }).first().fill("13");
    await page.getByRole("link", { name: "Naturvärden i avdelningen", exact: true }).first().click();
    await expect(page.locator("[data-nature-status]")).toContainText("0/50 bedömda");
    await page.getByLabel("Arbetsavdelning").selectOption({ label: "Testskog 1:1 / 12" });
    await expect(page.locator("[data-nature-status]")).toContainText("2/50 bedömda");
    await page.locator("[data-nature-context] summary").click();
    await page.getByLabel("Regionalt underlag").selectOption("north");
    await expect(page.locator("[data-nature-status]")).toContainText("Ot 1 p");
    await expect(page.locator(".nature-field img")).toHaveCount(0);
  });
}

test("SI-vy: förslag märks och sparas med begränsning", async ({ page }) => {
  await page.setViewportSize({ width: 390,height:844 });
  await open(page,"field-notes");
  await page.getByRole("button", { name: "Ny avdelning", exact: true }).click();
  await page.getByLabel("Avdelning", { exact: true }).fill("99");
  await open(page,"si");
  await page.locator('[name="ageAdditionMode"]').selectOption("range");
  await page.getByLabel("Höjd träd 1", { exact: true }).fill("18,9");
  await page.getByLabel("BH-ålder träd 1", { exact: true }).fill("80");
  await page.locator('[name="species"]').selectOption("gran");
  await page.getByRole("button", { name: "Beräkna SI och totalålder", exact: true }).click();
  await expect(page.locator(".si-model-proposal")).toHaveCount(0);
  await page.getByText("Provträdens kvalitet och modellförslag", { exact: true }).click();
  await page.locator('[name="allowExtrapolation"]').check();
  await page.getByRole("button", { name: "Beräkna SI och totalålder", exact: true }).click();
  await expect(page.locator(".si-model-proposal")).toContainText("Låg säkerhet");
  await expect(page.locator(".si-model-proposal")).toContainText("extrapolation");
  await page.getByRole("button", { name: "Spara resultat", exact: true }).click();
  await open(page,"field-notes");
  await expect(page.getByLabel("Anteckning", { exact: true })).toHaveValue(/Preliminärt modellförslag/);
  await expect(page.getByLabel("Anteckning", { exact: true })).toHaveValue(/Låg säkerhet/);
});

test("naturvärden: offline, långa frågor och lagringsfel", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "allow" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  try {
    await page.goto(`${server.url}/#/nature-assessment`);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await expect.poll(() => page.evaluate(async () => { const cache = await caches.open("skogskalkyl-2.0.0-alpha.1-si-falt.1"); return Boolean(await cache.match("./js/calculators/natureReferenceData.js")); })).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await page.getByLabel("Regionalt underlag").selectOption("boreal");
    await page.locator("[data-nature-context] summary").click();
    await page.locator('[data-answer="yes"]').click();
    await page.reload();
    await expect(page.locator("[data-nature-status]")).toContainText("1/50 bedömda");
    for (const section of ["4","5"]) {
      await page.locator("[data-nature-section]").selectOption(section);
      await page.evaluate(() => scrollTo(0,0));
      const bottom = await page.locator(".nature-field__answers").evaluate(e => e.getBoundingClientRect().bottom);
      const navTop = await page.locator(".bottom-nav").evaluate(e => e.getBoundingClientRect().top);
      expect(bottom).toBeLessThan(navTop);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error("QuotaExceededError"); }; });
    await page.locator('[data-answer="uncertain"]').click();
    await expect(page.locator("[data-nature-save]")).toContainText("Kunde inte spara");
    const event = page.waitForEvent("download");
    await page.locator("[data-export-nature]").click();
    const text = readFileSync(await (await event).path(),"utf8");
    expect(text).toContain("Osäkra frågor: 66");
    expect(text).toContain("Ja 1");
    expect(errors).toEqual([]);
  } finally { await context.close(); }
});

test("motsägande svar går att kontrollera även utanför vald biotopkolumn", async ({ page }) => {
  await open(page,"nature-assessment");
  await page.evaluate(() => localStorage.setItem("skogskalkyl2:natureAssessmentsV1", JSON.stringify({ standalone: { group: "Ot", scope: "boreal", answers: { 48: "yes", 49: "no" } } })));
  await page.reload();
  await expect(page.locator("[data-nature-status]")).toContainText("Motsägande svar: 49");
  await page.getByRole("button", { name: "Kontrollera fråga 49", exact: true }).click();
  await expect(page.getByLabel("Biotopgrupp")).toHaveValue("all");
  await expect(page.locator("[data-question-id]")).toHaveAttribute("data-question-id","49");
  await page.getByRole("button", { name: "Återställ svar", exact: true }).click();
  await expect(page.locator("[data-nature-status]")).not.toContainText("Motsägande svar");
});
