import { readFile } from "node:fs/promises";
import {
  getActiveNorraPackages,
  NORRA_THINNING_VALUE_PACKAGES
} from "../js/calculators/norraThinningValues.js";
import { SITE_INDEX_CURVES } from "../js/calculators/siteIndexCurves.js";

const EXPECTED_CODES = [
  "T14",
  "T16",
  "T18",
  "T22",
  "T24",
  "T26",
  "T28",
  "G16",
  "G18",
  "G20",
  "G22",
  "G24",
  "G26",
  "G28",
  "G30",
  "G32"
];

const EXPECTED_T20_EVENTS = [
  { label: "1:a gallring", topHeight: 14.5, basalAreaBefore: 24.5, basalAreaAfter: 18.5, ageTotal: 59, stemsBefore: 1650, stemsAfter: 1100 },
  { label: "2:a gallring", topHeight: 18.0, basalAreaBefore: 28.0, basalAreaAfter: 20.5, ageTotal: 82, stemsBefore: 1100, stemsAfter: 700 },
  { label: "Slutavverkning enligt exempel", topHeight: 22.0, basalAreaBefore: 31.5, basalAreaAfter: 0, ageTotal: 125, stemsBefore: 700, stemsAfter: 0 }
];

const errors = [];
const text = await readFile("data/norra-thinning-review-drafts.json", "utf8");
const workspace = JSON.parse(text);
const drafts = Array.isArray(workspace.drafts) ? workspace.drafts : [];
const active = getActiveNorraPackages();
const activeCodes = active.map((item) => `${item.speciesCode}${item.siteIndex}`).sort();
const t20 = NORRA_THINNING_VALUE_PACKAGES.find((item) => item.id === "norra-tall-t20-pilot");
const draftCodes = drafts.map((draft) => draft.code);

if (workspace.activeUse !== false) errors.push("Root activeUse maste vara false.");
if (workspace.canActivateCurves !== false) errors.push("Root canActivateCurves maste vara false.");
if (workspace.canAutoDigitize !== false) errors.push("Root canAutoDigitize maste vara false.");
if (workspace.canChangeProductionRules !== false) errors.push("Root canChangeProductionRules maste vara false.");
if (drafts.length !== EXPECTED_CODES.length) errors.push(`Forvantade ${EXPECTED_CODES.length} draftkurvor, hittade ${drafts.length}.`);

EXPECTED_CODES.forEach((code) => {
  if (!draftCodes.includes(code)) errors.push(`Draft saknas for ${code}.`);
});

if (draftCodes.includes("T20")) {
  errors.push("T20 far inte ligga som draft nar den redan ar aktiv pilot.");
}

drafts.forEach(validateDraft);

if (JSON.stringify(activeCodes) !== JSON.stringify(["T18", "T20"])) {
  errors.push(`Endast T18 och T20 far vara aktiva Norra-kurvor, hittade ${activeCodes.join(", ") || "inga"}.`);
}

if (!t20) {
  errors.push("T20-piloten saknas i Norra-data.");
} else if (JSON.stringify(t20.values?.thinningEvents) !== JSON.stringify(EXPECTED_T20_EVENTS)) {
  errors.push("T20-vardena har andrats.");
}

if (SITE_INDEX_CURVES.length !== 0) {
  errors.push(`Auto-SI ska vara sparrad: SITE_INDEX_CURVES maste vara [], hittade ${SITE_INDEX_CURVES.length}.`);
}

if (errors.length) {
  console.error("Kurvgranskningsutkast ar inte validerade:");
  errors.forEach((error) => console.error("- " + error));
  process.exit(1);
}

console.log(`Kurvgranskningsutkast OK: ${drafts.length} draftkurvor, aktiva kurvor T18/T20, T20 oforandrad, auto-SI sparrad.`);

function validateDraft(draft) {
  if (!draft.code || !draft.species || !draft.siteIndex || !draft.status || !draft.reviewStatus) {
    errors.push(`${draft.code || "okand"}: code, species, siteIndex, status eller reviewStatus saknas.`);
  }

  if (!["tall", "gran"].includes(draft.species)) {
    errors.push(`${draft.code}: species maste vara tall eller gran.`);
  }

  if (draft.status === "active_verified") {
    errors.push(`${draft.code}: draft far inte ha status active_verified.`);
  }

  if (draft.activeUse !== false) {
    errors.push(`${draft.code}: activeUse maste vara false.`);
  }

  if (draft.canActivateCurves !== false) {
    errors.push(`${draft.code}: canActivateCurves maste vara false.`);
  }

  if (draft.reviewNeeded !== true) {
    errors.push(`${draft.code}: reviewNeeded maste vara true for inaktiva draftposter.`);
  }

  if (!["manual_draft", "empty_draft"].includes(draft.dataQuality)) {
    errors.push(`${draft.code}: dataQuality maste vara manual_draft eller empty_draft.`);
  }

  if (!Array.isArray(draft.points) || draft.points.length < 1) {
    errors.push(`${draft.code}: minst en punktmall kravs.`);
  }

  (draft.points || []).forEach((point, index) => validatePoint(draft, point, index));

  ["price", "pricing", "legalDecision", "legalConclusion", "lawDecision"].forEach((field) => {
    if (Object.hasOwn(draft, field)) {
      errors.push(`${draft.code}: forbjudet falt ${field}.`);
    }
  });
}

function validatePoint(draft, point, index) {
  if (!point.stage) {
    errors.push(`${draft.code}: point ${index} saknar stage.`);
  }

  ["topHeight", "basalAreaBefore", "basalAreaAfter", "ageTotal", "stemsBefore", "stemsAfter"].forEach((field) => {
    const value = point[field];
    if (value !== null && value !== "" && !Number.isFinite(Number(value))) {
      errors.push(`${draft.code}: point ${index} har ogiltigt numeriskt falt ${field}.`);
    }
  });
}
