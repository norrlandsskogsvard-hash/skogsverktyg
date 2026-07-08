import { readFile } from "node:fs/promises";
import {
  getActiveNorraPackages,
  isActiveNorraPackage,
  NORRA_THINNING_VALUE_PACKAGES
} from "../js/calculators/norraThinningValues.js";

const EXPECTED_T20_EVENTS = [
  { label: "1:a gallring", topHeight: 14.5, basalAreaBefore: 24.5, basalAreaAfter: 18.5, ageTotal: 59, stemsBefore: 1650, stemsAfter: 1100 },
  { label: "2:a gallring", topHeight: 18.0, basalAreaBefore: 28.0, basalAreaAfter: 20.5, ageTotal: 82, stemsBefore: 1100, stemsAfter: 700 },
  { label: "Slutavverkning enligt exempel", topHeight: 22.0, basalAreaBefore: 31.5, basalAreaAfter: 0, ageTotal: 125, stemsBefore: 700, stemsAfter: 0 }
];

const ACTIVE_USES = new Set(["chart_reference", "full_curve"]);
const NON_ACTIVE_STATUSES = new Set(["candidate", "draft_digitized", "verified_candidate"]);

const errors = [];
const active = getActiveNorraPackages();
const t20 = NORRA_THINNING_VALUE_PACKAGES.find((item) => item.id === "norra-tall-t20-pilot");

if (active.length !== 1) {
  errors.push(`Exakt en aktiv Norra-post krävs, hittade ${active.length}.`);
}

if (active[0]?.id !== "norra-tall-t20-pilot") {
  errors.push("T20 måste vara enda aktiva Norra-post.");
}

if (!t20) {
  errors.push("T20-piloten saknas.");
} else {
  assertDeepEqual(t20.values?.thinningEvents, EXPECTED_T20_EVENTS, "T20-värdena har ändrats.");
}

NORRA_THINNING_VALUE_PACKAGES.forEach((item) => {
  validatePackage(item, active.includes(item), "koddata");
});

await validatePreviewIfExists();

if (errors.length) {
  console.error("Norra gallringsdata är inte validerad:");
  errors.forEach((error) => console.error("- " + error));
  process.exit(1);
}

console.log(`Norra gallringsdata OK: ${NORRA_THINNING_VALUE_PACKAGES.length} paket, ${active.length} aktivt.`);

function validatePackage(item, isActive, scope) {
  if (!item.species || !item.speciesCode || !item.siteIndex || !item.region || !item.sourceName) {
    errors.push(`${scope}/${item.id}: trädslag, SI, region eller sourceName saknas.`);
  }

  if (item.species === "bjork" || item.speciesCode === "B") {
    errors.push(`${scope}/${item.id}: björk får inte kopplas till Norra tall-/gran-data.`);
  }

  if (isActive && item.reviewNeeded !== false) {
    errors.push(`${scope}/${item.id}: aktiva poster måste ha reviewNeeded false.`);
  }

  if (NON_ACTIVE_STATUSES.has(item.status) && ACTIVE_USES.has(item.activeUse)) {
    errors.push(`${scope}/${item.id}: ${item.status} får inte ha activeUse ${item.activeUse}.`);
  }

  validateValueContainer(item, "values", scope);
  validateValueContainer(item, "draftValues", scope);
}

function validateValueContainer(item, key, scope) {
  const container = item[key];
  if (!hasValues(container)) return;

  if (Array.isArray(container)) {
    container.forEach((entry, index) => {
      if (!entry.parameter || !entry.unit) {
        errors.push(`${scope}/${item.id}: ${key}[${index}] saknar parameter eller unit.`);
      }
    });
    return;
  }

  const schema = item.validation?.valueSchema || [];
  if (!schema.length) {
    errors.push(`${scope}/${item.id}: ${key} har värden men saknar validation.valueSchema.`);
    return;
  }

  schema.forEach((entry, index) => {
    if (!entry.parameter || !entry.unit) {
      errors.push(`${scope}/${item.id}: validation.valueSchema[${index}] saknar parameter eller unit.`);
    }
  });
}

async function validatePreviewIfExists() {
  try {
    const previewText = await readFile("data/generated/norra-thinning-import-preview.json", "utf8");
    const preview = JSON.parse(previewText);
    const previewActive = preview.filter(isActiveNorraPackage);
    const activeNonT20 = previewActive.filter((item) => item.id !== "norra-tall-t20-pilot");

    if (previewActive.length > 1) {
      errors.push(`preview: högst en aktiv preview-post tillåts, hittade ${previewActive.length}.`);
    }
    if (activeNonT20.length) {
      errors.push("preview: import-preview försöker aktivera annan mall än T20.");
    }

    const previewT20 = preview.find((item) => item.id === "norra-tall-t20-pilot");
    if (previewT20) {
      assertDeepEqual(previewT20.values?.thinningEvents, EXPECTED_T20_EVENTS, "preview: T20-värdena har ändrats.");
    }

    preview.forEach((item) => validatePackage(item, previewActive.includes(item), "preview"));
  } catch (error) {
    if (error.code !== "ENOENT") {
      errors.push("preview: kunde inte läsa import-preview: " + error.message);
    }
  }
}

function hasValues(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some((entry) => Array.isArray(entry) ? entry.length > 0 : Boolean(entry));
}

function assertDeepEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(message);
  }
}
