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

test("mobil UX är kompakt för röjning, planpris, offert och bottom-nav", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await gotoRoute(page, "/rojning");
  await expect(page.locator("[data-clearing-result]")).toBeVisible();
  await expect(page.locator('input[name="areaHa"]')).toBeVisible();
  await expect(page.locator('input[name="stemsBeforePerHa"]')).toBeVisible();
  await expect(page.locator('input[name="stemsAfterPerHa"]')).toBeVisible();
  await expect(page.locator('input[name="meanHeightM"]')).toBeVisible();
  await expect(page.locator('select[name="treeSpecies"]')).toBeVisible();
  await expect(page.locator('select[name="clearingType"]')).toBeVisible();
  await expect(page.locator("details.clearing-source-support")).not.toHaveAttribute("open", "");
  await expect(page.locator("details.mobile-compact-details").first()).not.toHaveAttribute("open", "");
  await expectNoHorizontalScroll(page);

  await gotoRoute(page, "/forest-plan-pricing");
  await expect(page.locator("[data-plan-result]")).toBeVisible();
  await expect(page.locator('input[name="areaHa"]')).toBeVisible();
  await expect(page.locator('input[name="parcelCount"]')).toBeVisible();
  await expect(page.locator('select[name="planType"]')).toBeVisible();
  const closedPlanDetails = await page.locator("details.mobile-compact-details:not([open])").count();
  expect(closedPlanDetails).toBeGreaterThanOrEqual(3);
  await expectNoHorizontalScroll(page);

  await gotoRoute(page, "/quote");
  await expect(page.locator("[data-quote-summary]")).toBeVisible();
  await expect(page.locator("body")).toContainText("1. Kund");
  await expect(page.locator("body")).toContainText("2. Uppdrag");
  await expect(page.locator("body")).toContainText("3. Pris / sammanställning");
  await expect(page.locator("body")).toContainText("4. Text / villkor");
  await expect(page.locator("details.mobile-compact-details").first()).toHaveAttribute("open", "");
  await expectNoHorizontalScroll(page);

  const navInfo = await page.locator(".bottom-nav").evaluate((nav) => ({
    links: nav.querySelectorAll("a").length,
    text: nav.textContent.trim(),
    scrollable: nav.scrollWidth > nav.clientWidth,
    visibleWidth: nav.clientWidth,
    fullWidth: nav.scrollWidth
  }));
  expect(navInfo.links).toBeGreaterThanOrEqual(9);
  expect(navInfo.text.length).toBeGreaterThan(0);
  expect(navInfo.scrollable || navInfo.fullWidth <= navInfo.visibleWidth + 1).toBeTruthy();
});

test("Norra massimport har bara T20 som aktiv pilot", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoRoute(page, "/skotselkollen");
  const summary = await page.evaluate(async () => {
    const knowledge = await import("/js/calculators/skotselKnowledgeBase.js");
    const siteIndex = await import("/js/calculators/siteIndexCurves.js");
    const active = knowledge.NORRA_THINNING_SOURCE_VALUES.filter(knowledge.isActiveCurveSourceValue);
    const t20 = knowledge.NORRA_THINNING_SOURCE_VALUES.find((item) => item.id === "norra-tall-t20-pilot");
    const t22 = knowledge.NORRA_THINNING_SOURCE_VALUES.find((item) => item.id === "norra-tall-t22-candidate");
    const g20 = knowledge.NORRA_THINNING_SOURCE_VALUES.find((item) => item.id === "norra-gran-g20-candidate");
    return {
      total: knowledge.NORRA_THINNING_SOURCE_VALUES.length,
      activeCount: active.length,
      activeCodes: active.map((item) => item.speciesCode + item.siteIndex),
      curveCount: knowledge.THINNING_CURVES.length,
      researchRuleCount: knowledge.GALLRING_RESEARCH_SUPPORT_SUMMARY.ruleCount,
      researchCanActivateCurves: knowledge.GALLRING_RESEARCH_SUPPORT_SUMMARY.canActivateCurves,
      clearingResearchRuleCount: knowledge.ROJNING_RESEARCH_SUPPORT_SUMMARY.ruleCount,
      clearingResearchCanChangePricing: knowledge.ROJNING_RESEARCH_SUPPORT_SUMMARY.canChangePricing,
      bjorkLovRuleCount: knowledge.BJORK_LOV_RESEARCH_SUPPORT_SUMMARY.ruleCount,
      bjorkLovCanActivateCurves: knowledge.BJORK_LOV_RESEARCH_SUPPORT_SUMMARY.canActivateCurves,
      bjorkLovCanUseConiferTemplatesAsTruth: knowledge.BJORK_LOV_RESEARCH_SUPPORT_SUMMARY.canUseConiferTemplatesAsTruth,
      siteIndexRuleCount: knowledge.SITE_INDEX_FIELD_SUPPORT_SUMMARY.ruleCount,
      siteIndexCanAutoCalculateSI: knowledge.SITE_INDEX_FIELD_SUPPORT_SUMMARY.canAutoCalculateSI,
      siteIndexCanDigitizeCurves: knowledge.SITE_INDEX_FIELD_SUPPORT_SUMMARY.canDigitizeCurves,
      siteIndexCanCreateHardThresholds: knowledge.SITE_INDEX_FIELD_SUPPORT_SUMMARY.canCreateHardThresholds,
      siteIndexCurveCount: siteIndex.SITE_INDEX_CURVES.length,
      hansynRiskRuleCount: knowledge.HANSYN_RISK_SUPPORT_SUMMARY.ruleCount,
      hansynRiskCanMakeLegalDecision: knowledge.HANSYN_RISK_SUPPORT_SUMMARY.canMakeLegalDecision,
      hansynRiskCanActivateCurves: knowledge.HANSYN_RISK_SUPPORT_SUMMARY.canActivateCurves,
      hansynRiskCanChangePricing: knowledge.HANSYN_RISK_SUPPORT_SUMMARY.canChangePricing,
      hansynRiskCanCreateHardThresholds: knowledge.HANSYN_RISK_SUPPORT_SUMMARY.canCreateHardThresholds,
      t20Status: t20?.status,
      t20DataQuality: t20?.dataQuality,
      t20ReviewNeeded: t20?.reviewNeeded,
      t20FirstBasalBefore: t20?.values?.thinningEvents?.[0]?.basalAreaBefore,
      t22Status: t22?.status,
      t22ActiveUse: t22?.activeUse,
      t22ReviewNeeded: t22?.reviewNeeded,
      t22Values: t22?.values?.length,
      g20Status: g20?.status,
      g20ActiveUse: g20?.activeUse,
      g20ReviewNeeded: g20?.reviewNeeded,
      g20Values: g20?.values?.length,
      verifiedCandidateCount: knowledge.getVerifiedCandidateNorraPackages().length,
      draftCount: knowledge.getDraftDigitizedNorraPackages().length,
      reviewNeededCount: knowledge.getReviewNeededNorraPackages().length,
      almostActiveBlocked: knowledge.isActiveCurveSourceValue({
        status: "verified",
        dataQuality: "verified_table",
        activeUse: "full_curve",
        reviewNeeded: true
      }) === false
    };
  });
  expect(summary.total).toBe(17);
  expect(summary.activeCount).toBe(1);
  expect(summary.activeCodes).toEqual(["T20"]);
  expect(summary.curveCount).toBe(1);
  expect(summary.researchRuleCount).toBe(12);
  expect(summary.researchCanActivateCurves).toBe(false);
  expect(summary.clearingResearchRuleCount).toBe(12);
  expect(summary.clearingResearchCanChangePricing).toBe(false);
  expect(summary.bjorkLovRuleCount).toBe(12);
  expect(summary.bjorkLovCanActivateCurves).toBe(false);
  expect(summary.bjorkLovCanUseConiferTemplatesAsTruth).toBe(false);
  expect(summary.siteIndexRuleCount).toBe(12);
  expect(summary.siteIndexCanAutoCalculateSI).toBe(false);
  expect(summary.siteIndexCanDigitizeCurves).toBe(false);
  expect(summary.siteIndexCanCreateHardThresholds).toBe(false);
  expect(summary.siteIndexCurveCount).toBe(0);
  expect(summary.hansynRiskRuleCount).toBe(12);
  expect(summary.hansynRiskCanMakeLegalDecision).toBe(false);
  expect(summary.hansynRiskCanActivateCurves).toBe(false);
  expect(summary.hansynRiskCanChangePricing).toBe(false);
  expect(summary.hansynRiskCanCreateHardThresholds).toBe(false);
  expect(summary.t20Status).toBe("active_pilot");
  expect(summary.t20DataQuality).toBe("pilot_example");
  expect(summary.t20ReviewNeeded).toBe(false);
  expect(summary.t20FirstBasalBefore).toBe(24.5);
  expect(summary.t22Status).toBe("candidate");
  expect(summary.t22ActiveUse).toBe("documentation_only");
  expect(summary.t22ReviewNeeded).toBe(true);
  expect(summary.t22Values).toBe(0);
  expect(summary.g20Status).toBe("candidate");
  expect(summary.g20ActiveUse).toBe("documentation_only");
  expect(summary.g20ReviewNeeded).toBe(true);
  expect(summary.g20Values).toBe(0);
  expect(summary.verifiedCandidateCount).toBe(0);
  expect(summary.draftCount).toBe(0);
  expect(summary.reviewNeededCount).toBe(16);
  expect(summary.almostActiveBlocked).toBe(true);
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
  await expect(page.locator(".skotsel-result-summary").first()).toContainText("OK");
  await expect(page.locator(".skotsel-result-summary").first()).toContainText("Manuellt");
  await expect(page.locator(".skotsel-result-summary").first()).toContainText("Hänsyn/risk");
  await expect(page.locator("body")).toContainText(/SI.*manuellt underlag/i);
  await expect(page.locator("body")).toContainText("Naturhänsyn, skador och vilt");
  await expect(page.locator("body")).toContainText("risk- och fältstöd");
  await expect(page.locator("body")).toContainText("Juridiska kontrollflaggor");
  await openSources(page);
  await expect(page.locator("body")).toContainText("Skogskunskap");
  await expect(page.locator("body")).toContainText("Forskningsstöd");
  await expect(page.locator("body")).toContainText("Fältmetoder");
  await expect(page.locator("body")).toContainText("Bonitering AC/BD och B69 SI");
  await expect(page.locator("body")).toContainText("metodstöd, inte auto-SI");
  await expect(page.locator("body")).toContainText("Hänsyn/risk");
  await expect(page.locator("body")).toContainText("Naturhansyn, skador och vilt");
  await expect(page.locator("body")).toContainText("Skogsskötselserien 7 Gallring");
  await expect(page.locator("body")).toContainText("Norra textregler");
  await expect(page.locator("body")).toContainText("Praktiska skötselmallar");
  await expect(page.locator("body")).toContainText("Norra Skog 2024");
  await expect(page.locator(".skotsel-source-balance-details").first()).not.toHaveAttribute("open", "");
  await openCurveBank(page);
  const curveBank = page.locator(".skotsel-curve-bank").first();
  await expect(curveBank).toContainText("T20");
  await expect(curveBank).toContainText(/Aktiv pilot/i);
  await expect(curveBank).toContainText("T22");
  await expect(curveBank).toContainText("G20");
  await expect(curveBank).toContainText("Ej aktiv kandidat");
  await expect(curveBank).toContainText("kräver granskning");
  await expect(curveBank).toContainText("Aktiv pilot");
  await expect(curveBank).toContainText("Verifierade kandidater");
  await expect(curveBank).toContainText("Utkast/digitalisering");
  await expect(curveBank).toContainText("Kandidater utan värden");
  await expect(curveBank).toContainText("Importflöde");
  await expect(curveBank).toContainText("CSV/granskning");
  await page.screenshot({ path: `${SCREENSHOT_DIR}/skotselkollen-desktop.png`, fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await gotoRoute(page, "/skotselkollen");
  await fillSkotselkollenPilot(page);
  await expect(page.locator("body")).toContainText("Pilotunderlag");
  await expect(page.locator("body")).toContainText("Samlad bedömning");
  await expect(page.locator("body")).toContainText("T20");
  await expect(page.locator("body")).toContainText("T20-exempel, ej full kurva");
  await expect(page.locator("body")).toContainText("Full digitaliserad gallringskurva saknas");
  await expect(page.locator(".skotsel-result-summary").first()).toContainText("OK");
  await expect(page.locator(".skotsel-result-summary").first()).toContainText("Manuellt");
  await expect(page.locator(".skotsel-result-summary").first()).toContainText("Hänsyn/risk");
  await expect(page.locator("body")).toContainText("Juridiska kontrollflaggor");
  await openSources(page);
  await expect(page.locator("body")).toContainText("Skogskunskap");
  await expect(page.locator("body")).toContainText("Forskningsstöd");
  await expect(page.locator("body")).toContainText("Fältmetoder");
  await expect(page.locator("body")).toContainText("Bonitering AC/BD och B69 SI");
  await expect(page.locator("body")).toContainText("Skogsskötselserien 7 Gallring");
  await expect(page.locator("body")).toContainText("Norra textregler");
  await expect(page.locator("body")).toContainText("Praktiska skötselmallar");
  await expect(page.locator("body")).toContainText("Norra Skog 2024");
  await expectNoHorizontalScroll(page);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/skotselkollen-mobile.png`, fullPage: true });
});

test("Skötselkollen visar forskningsrisker utan att skapa ny kurva", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoRoute(page, "/skotselkollen");
  await fillSkotselkollenPilot(page);
  await openSkotselAdvanced(page);
  await page.evaluate(() => {
    document.querySelectorAll(".skotsel-advanced-root details").forEach((details) => {
      details.open = true;
    });
  });

  await page.locator('select[name="snowWindRisk"]').selectOption("ja");
  await page.locator('select[name="damage"]').selectOption("tydliga");
  await page.locator('select[name="bearing"]').selectOption("svag_blot");
  await page.locator('select[name="insectRisk"]').selectOption("ja");
  await page.locator('select[name="waterEdge"]').selectOption("ja");
  await page.locator('select[name="wildlifePressure"]').selectOption("ja");
  await page.getByRole("button", { name: "Visa i gallringskurva" }).click();

  await expect(page.locator("body")).toContainText("Forskningsstöd: markerad snö-/vindrisk");
  await expect(page.locator(".skotsel-result-summary").first()).toContainText("Hög risk");
  await expect(page.locator("body")).toContainText("Hansyn/risk");
  await expect(page.locator("body")).toContainText("Storm/vind");
  await expect(page.locator("body")).toContainText("Kantzon/vatten");
  await expect(page.locator("body")).toContainText("Viltbete/alg");
  await expect(page.locator("body")).toContainText("Kontrollera vindutsatt lage");
  await expect(page.locator("body")).toContainText("rotröta, svamp, insekter");
  const curveCount = await page.evaluate(async () => {
    const knowledge = await import("/js/calculators/skotselKnowledgeBase.js");
    return knowledge.THINNING_CURVES.length;
  });
  expect(curveCount).toBe(1);
  await expect(page.locator(".skotsel-result-summary").first()).toContainText("Låg");
});

test("Skötselkollen visar röjningsforskning för ungskog utan pris- eller kurvaktivering", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoRoute(page, "/skotselkollen");
  await page.locator('select[name="mainSpecies"]').selectOption("tall");
  await page.locator('select[name="region"]').selectOption("norrland_inland");
  await fillNumber(page, 'input[name="heightMeters"]', "3");
  await fillNumber(page, 'input[name="basalArea"]', "5");
  await openSkotselAdvanced(page);
  await page.evaluate(() => {
    document.querySelectorAll(".skotsel-advanced-root details").forEach((details) => {
      details.open = true;
    });
  });
  await page.locator('select[name="standPhase"]').selectOption("ungskog");
  await fillNumber(page, 'input[name="birchShare"]', "45");
  await page.locator('select[name="damage"]').selectOption("tydliga");
  await page.locator('select[name="snowWindRisk"]').selectOption("ja");
  await page.getByRole("button", { name: "Visa i gallringskurva" }).click();

  await expect(page.locator(".skotsel-result-summary").first()).toContainText("Röjning bör planeras");
  await expect(page.locator("body")).toContainText("Forskningsstöd: röjning påverkar diameterutveckling");
  await expect(page.locator("body")).toContainText("Röjningsstöd: blandbestånd eller högt lövinslag");
  await expect(page.locator("body")).toContainText("markerad snö-/vindrisk");
  await expect(page.locator("body")).toContainText("ändrar inte prisberäkning");
  await openSources(page);
  await expect(page.locator("body")).toContainText("Skogsskötselserien 6 Röjning");

  const summary = await page.evaluate(async () => {
    const knowledge = await import("/js/calculators/skotselKnowledgeBase.js");
    return {
      curveCount: knowledge.THINNING_CURVES.length,
      canChangePricing: knowledge.ROJNING_RESEARCH_SUPPORT_SUMMARY.canChangePricing
    };
  });
  expect(summary.curveCount).toBe(1);
  expect(summary.canChangePricing).toBe(false);
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
  await expect(page.locator("body")).toContainText("Kontrollera markklass");

  await page.locator('select[name="productiveForestLandAssumption"]').selectOption("non_productive");
  await page.getByRole("button", { name: "Visa i gallringskurva" }).click();
  await expect(page.locator(".skotsel-result-summary").first()).toContainText("Pilotunderlag");
  await expect(page.locator(".skotsel-result-summary").first()).toContainText("Kontroll krävs");
  await expect(page.locator("body")).toContainText("Detta är kontrollstöd, inte juridiskt besked");
});

test("Skötselkollen håller björk som eget spår", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoRoute(page, "/skotselkollen");
  await fillSkotselkollenPilot(page);
  await page.locator('select[name="mainSpecies"]').selectOption("bjork");
  await expect(page.locator("body")).toContainText(/LÃ¶vspÃ¥r|Lövspår/i);
  await expect(page.locator("body")).toContainText(/eget kunskapsstÃ¶d|eget kunskapsstöd/i);
  await expect(page.locator("body")).toContainText(/Tall- eller granmall används inte som facit/i);
  await expect(page.locator("body")).toContainText(/Punkten visas utan tall-\/granmall som facit/i);
  await expect(page.locator(".skotsel-chart__pilot-line")).toHaveCount(0);
  await openSources(page);
  await expect(page.locator("body")).toContainText(/SkogsskÃ¶tselserien 9|Skogsskötselserien 9/i);
  await expect(page.locator("body")).not.toContainText(/Tall- eller granmall används som facit för björk/i);
});

test("Skötselkollen visar saknad kurva för tall T22 utan att skapa falsk kurva", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoRoute(page, "/skotselkollen");
  await fillSkotselkollenPilot(page);
  await fillNumber(page, 'input[name="siteIndex"]', "22");
  await page.getByRole("button", { name: "Visa i gallringskurva" }).click();
  await expect(page.locator("body")).toContainText(/Kurvunderlag saknas|kurva saknas/i);
  await expect(page.locator("body")).toContainText("Källa är identifierad");
  await expect(page.locator("body")).toContainText("Kurva identifierad i källbank men saknar verifierade värden i appen");
  await expect(page.locator("body")).toContainText("Verifierade kurvdata för T22");
  await expect(page.locator("body")).toContainText("Full digitaliserad gallringskurva saknas");
  await expect(page.locator("body")).toContainText("Verifiera och digitalisera rätt kurvdata innan åtgärd");
  await expect(page.locator(".skotsel-chart__pilot-line")).toHaveCount(0);
  await expectNoHorizontalScroll(page);
});

test("Skötselkollen visar gran G20 som candidate utan aktiv kurva", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoRoute(page, "/skotselkollen");
  await page.locator('select[name="mainSpecies"]').selectOption("gran");
  await page.locator('select[name="region"]').selectOption("norrland_inland");
  await fillNumber(page, 'input[name="heightMeters"]', "14.5");
  await fillNumber(page, 'input[name="basalArea"]', "24.5");
  const manualSi = page.locator("[data-manual-si]");
  if (await manualSi.evaluate((node) => node.classList.contains("hidden"))) {
    await page.getByRole("button", { name: "Ändra SI manuellt" }).click();
  }
  await fillNumber(page, 'input[name="siteIndex"]', "20");
  await page.getByRole("button", { name: "Visa i gallringskurva" }).click();
  await expect(page.locator(".skotsel-result-summary").first()).toContainText("Kurvunderlag saknas");
  await expect(page.locator("body")).toContainText("Källa är identifierad");
  await expect(page.locator("body")).toContainText("Verifierade kurvdata för G20");
  await expect(page.locator(".skotsel-chart__pilot-line")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Pilotunderlag");
  await expect(page.locator(".skotsel-result-summary").first()).not.toContainText("Hög");
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

async function openCurveBank(page) {
  await page.evaluate(() => {
    document.querySelectorAll("details").forEach((details) => {
      const summary = details.querySelector(":scope > summary");
      if (summary?.textContent?.includes("Identifierade kurvor i källbank")) {
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
