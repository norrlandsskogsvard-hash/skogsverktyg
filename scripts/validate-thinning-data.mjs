import { readFile } from "node:fs/promises";
import {
  getActiveNorraPackages,
  isActiveNorraPackage,
  NORRA_THINNING_VALUE_PACKAGES
} from "../js/calculators/norraThinningValues.js";
import { SITE_INDEX_CURVES } from "../js/calculators/siteIndexCurves.js";

const EXPECTED_T20_EVENTS = [
  { label: "1:a gallring", topHeight: 14.5, basalAreaBefore: 24.5, basalAreaAfter: 18.5, ageTotal: 59, stemsBefore: 1650, stemsAfter: 1100 },
  { label: "2:a gallring", topHeight: 18.0, basalAreaBefore: 28.0, basalAreaAfter: 20.5, ageTotal: 82, stemsBefore: 1100, stemsAfter: 700 },
  { label: "Slutavverkning enligt exempel", topHeight: 22.0, basalAreaBefore: 31.5, basalAreaAfter: 0, ageTotal: 125, stemsBefore: 700, stemsAfter: 0 }
];

const ACTIVE_USES = new Set(["chart_reference", "full_curve"]);
const ACTIVE_STATUSES = new Set(["active_pilot", "verified"]);
const ACTIVE_QUALITIES = new Set(["pilot_example", "verified_text", "verified_table", "chart_digitized_verified"]);
const NON_ACTIVE_STATUSES = new Set(["candidate", "draft_digitized", "verified_candidate"]);
const FORBIDDEN_FIELDS = new Set([
  "price",
  "pricing",
  "pricePerHa",
  "cost",
  "legalDecision",
  "legalConclusion",
  "lawDecision"
]);

const errors = [];
const active = getActiveNorraPackages();
const activeCodes = active.map(curveCode);
const blockedCandidates = NORRA_THINNING_VALUE_PACKAGES.filter((item) => item.reviewNeeded === true);
const t20 = NORRA_THINNING_VALUE_PACKAGES.find((item) => item.id === "norra-tall-t20-pilot");
const codeCounts = new Map();

if (active.length !== 1) {
  errors.push(`Exakt en aktiv Norra-post kravs i denna batch, hittade ${active.length}.`);
}

if (active[0]?.id !== "norra-tall-t20-pilot") {
  errors.push("T20 maste vara enda aktiva Norra-post tills fler kallvarden ar verifierade.");
}

if (!t20) {
  errors.push("T20-piloten saknas.");
} else {
  assertDeepEqual(t20.values?.thinningEvents, EXPECTED_T20_EVENTS, "T20-vardena har andrats.");
}

if (SITE_INDEX_CURVES.length !== 0) {
  errors.push(`Auto-SI ska vara sparrad: SITE_INDEX_CURVES maste vara [], hittade ${SITE_INDEX_CURVES.length}.`);
}

NORRA_THINNING_VALUE_PACKAGES.forEach((item) => {
  const code = curveCode(item);
  codeCounts.set(code, (codeCounts.get(code) || 0) + 1);
  validatePackage(item, active.includes(item), "koddata");
});

for (const [code, count] of codeCounts) {
  if (count > 1) {
    errors.push(`koddata: kurvkod ${code} finns ${count} ganger.`);
  }
}

await validatePreviewIfExists();

if (errors.length) {
  console.error("Norra gallringsdata ar inte validerad:");
  errors.forEach((error) => console.error("- " + error));
  process.exit(1);
}

console.log([
  "Norra gallringsdata OK:",
  `${NORRA_THINNING_VALUE_PACKAGES.length} paket`,
  `active curve count ${active.length}`,
  `activeCodes ${activeCodes.join(", ") || "inga"}`,
  `blocked candidates ${blockedCandidates.length}`,
  "T20 integrity OK",
  "auto-SI sparrad"
].join(" "));

function validatePackage(item, isActive, scope) {
  if (!item.species || !item.speciesCode || !item.siteIndex || !item.region || !item.sourceName) {
    errors.push(`${scope}/${item.id}: tradslag, SI, region eller sourceName saknas.`);
  }

  if (!["tall", "gran"].includes(item.species)) {
    errors.push(`${scope}/${item.id}: Norra gallringsdata far bara avse tall eller gran.`);
  }

  if (item.species === "bjork" || item.speciesCode === "B") {
    errors.push(`${scope}/${item.id}: bjork far inte kopplas till Norra tall-/gran-data.`);
  }

  validateForbiddenFields(item, scope);

  if (isActive && !ACTIVE_STATUSES.has(item.status)) {
    errors.push(`${scope}/${item.id}: aktiv post har otillaten status ${item.status}.`);
  }

  if (isActive && !ACTIVE_QUALITIES.has(item.dataQuality)) {
    errors.push(`${scope}/${item.id}: aktiv post har otillaten dataQuality ${item.dataQuality}.`);
  }

  if (isActive && !ACTIVE_USES.has(item.activeUse)) {
    errors.push(`${scope}/${item.id}: aktiv post har otillaten activeUse ${item.activeUse}.`);
  }

  if (isActive && item.reviewNeeded !== false) {
    errors.push(`${scope}/${item.id}: aktiva poster maste ha reviewNeeded false.`);
  }

  if (isActive && !item.sourcePage && !item.sourceSection) {
    errors.push(`${scope}/${item.id}: aktiv post saknar sourcePage/sourceSection.`);
  }

  if (isActive && !hasVerifiedThinningEvents(item.values)) {
    errors.push(`${scope}/${item.id}: aktiv post saknar verifierad gallringspunkt i values.`);
  }

  if (NON_ACTIVE_STATUSES.has(item.status) && ACTIVE_USES.has(item.activeUse)) {
    errors.push(`${scope}/${item.id}: ${item.status} far inte ha activeUse ${item.activeUse}.`);
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
    errors.push(`${scope}/${item.id}: ${key} har varden men saknar validation.valueSchema.`);
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
    const previewRows = Array.isArray(preview) ? preview : (preview.packages || []);
    const previewActive = previewRows.filter(isActiveNorraPackage);
    const activeNonT20 = previewActive.filter((item) => item.id !== "norra-tall-t20-pilot");

    if (previewActive.length > 1) {
      errors.push(`preview: hogst en aktiv preview-post tillats i denna batch, hittade ${previewActive.length}.`);
    }
    if (activeNonT20.length) {
      errors.push("preview: import-preview forsoker aktivera annan mall an T20.");
    }

    const previewT20 = previewRows.find((item) => item.id === "norra-tall-t20-pilot");
    if (previewT20) {
      assertDeepEqual(previewT20.values?.thinningEvents, EXPECTED_T20_EVENTS, "preview: T20-vardena har andrats.");
    }

    previewRows.forEach((item) => validatePackage(item, previewActive.includes(item), "preview"));
  } catch (error) {
    if (error.code !== "ENOENT") {
      errors.push("preview: kunde inte lasa import-preview: " + error.message);
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

function curveCode(item) {
  return `${item.speciesCode}${item.siteIndex}`;
}

function hasVerifiedThinningEvents(values) {
  return Array.isArray(values?.thinningEvents) &&
    values.thinningEvents.some((event) =>
      Number.isFinite(event.topHeight) &&
      Number.isFinite(event.basalAreaBefore) &&
      Number.isFinite(event.basalAreaAfter)
    );
}

function validateForbiddenFields(item, scope) {
  Object.keys(item).forEach((key) => {
    if (FORBIDDEN_FIELDS.has(key)) {
      errors.push(`${scope}/${item.id}: forbjudet falt ${key} hor inte hemma i gallringsdata.`);
    }
  });
}
