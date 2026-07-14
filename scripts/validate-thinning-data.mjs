import { readFile } from "node:fs/promises";
import {
  getActiveNorraPackages,
  isFieldPilotNorraPackage,
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
const FIELD_PILOT_USES = new Set([true]);
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
const activeCodes = active.map(curveCode).sort();
const fieldPilotCodes = active.filter(isFieldPilotNorraPackage).map(curveCode).sort();
const ordinaryActiveCodes = active.filter((item) => !isFieldPilotNorraPackage(item)).map(curveCode).sort();
const blockedCandidates = NORRA_THINNING_VALUE_PACKAGES.filter((item) => item.reviewNeeded === true);
const t20 = NORRA_THINNING_VALUE_PACKAGES.find((item) => item.id === "norra-tall-t20-pilot");
const t18 = NORRA_THINNING_VALUE_PACKAGES.find((item) => item.id === "norra-tall-t18-field-pilot");
const codeCounts = new Map();

if (active.length !== 2) {
  errors.push(`Exakt tva aktiva Norra-poster kravs i denna batch, hittade ${active.length}.`);
}

if (JSON.stringify(activeCodes) !== JSON.stringify(["T18", "T20"])) {
  errors.push(`Endast T18 och T20 far vara aktiva i denna batch, hittade ${activeCodes.join(", ") || "inga"}.`);
}

if (JSON.stringify(fieldPilotCodes) !== JSON.stringify(["T18"])) {
  errors.push(`fieldPilotCodes ska vara T18, hittade ${fieldPilotCodes.join(", ") || "inga"}.`);
}

if (JSON.stringify(ordinaryActiveCodes) !== JSON.stringify(["T20"])) {
  errors.push(`Ordinarie aktiv pilot ska vara T20, hittade ${ordinaryActiveCodes.join(", ") || "inga"}.`);
}

if (!t20) {
  errors.push("T20-piloten saknas.");
} else {
  assertDeepEqual(t20.values?.thinningEvents, EXPECTED_T20_EVENTS, "T20-vardena har andrats.");
}

if (!t18) {
  errors.push("T18-faltpiloten saknas.");
} else {
  validateFieldPilot(t18, "koddata");
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
  `fieldPilotCodes ${fieldPilotCodes.join(", ") || "inga"}`,
  `ordinaryActiveCodes ${ordinaryActiveCodes.join(", ") || "inga"}`,
  `blocked candidates ${blockedCandidates.length}`,
  "T20 integrity OK",
  "auto-SI sparrad"
].join(" "));

function validatePackage(item, isActive, scope) {
  const isFieldPilot = isFieldPilotNorraPackage(item);

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

  if (isActive && isFieldPilot) {
    validateFieldPilot(item, scope);
  } else if (isActive && !ACTIVE_STATUSES.has(item.status)) {
    errors.push(`${scope}/${item.id}: aktiv post har otillaten status ${item.status}.`);
  }

  if (isActive && !isFieldPilot && !ACTIVE_QUALITIES.has(item.dataQuality)) {
    errors.push(`${scope}/${item.id}: aktiv post har otillaten dataQuality ${item.dataQuality}.`);
  }

  if (isActive && !isFieldPilot && !ACTIVE_USES.has(item.activeUse)) {
    errors.push(`${scope}/${item.id}: aktiv post har otillaten activeUse ${item.activeUse}.`);
  }

  if (isActive && !isFieldPilot && item.reviewNeeded !== false) {
    errors.push(`${scope}/${item.id}: aktiva poster maste ha reviewNeeded false.`);
  }

  if (isActive && !item.sourcePage && !item.sourceSection) {
    errors.push(`${scope}/${item.id}: aktiv post saknar sourcePage/sourceSection.`);
  }

  if (isActive && !hasVerifiedThinningEvents(item.values)) {
    errors.push(`${scope}/${item.id}: aktiv post saknar verifierad gallringspunkt i values.`);
  }

  if (NON_ACTIVE_STATUSES.has(item.status) && (ACTIVE_USES.has(item.activeUse) || FIELD_PILOT_USES.has(item.activeUse))) {
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
    const invalidPreviewActive = previewActive.filter((item) => !["norra-tall-t20-pilot", "norra-tall-t18-field-pilot"].includes(item.id));

    if (previewActive.length > 2) {
      errors.push(`preview: hogst tva aktiva preview-poster tillats i denna batch, hittade ${previewActive.length}.`);
    }
    if (invalidPreviewActive.length) {
      errors.push("preview: import-preview forsoker aktivera annan mall an T18/T20.");
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

function validateFieldPilot(item, scope) {
  if (!isFieldPilotNorraPackage(item)) {
    errors.push(`${scope}/${item.id}: faltpilot maste vara exakt T18 med aktiv faltpilotmetadata.`);
    return;
  }

  if (!item.sourcePage && !item.sourceSection) {
    errors.push(`${scope}/${item.id}: T18-faltpilot saknar sourcePage/sourceSection.`);
  }

  if (!hasVerifiedThinningEvents(item.values)) {
    errors.push(`${scope}/${item.id}: T18-faltpilot saknar visuellt avlast gallringspunkt i values.`);
  }

  const limitationText = [...(item.limitations || []), ...(item.extractionNotes || [])].join(" ").toLowerCase();
  if (!limitationText.includes("visuell") && !limitationText.includes("visuellt")) {
    errors.push(`${scope}/${item.id}: T18-faltpilot maste markeras som visuell avlasning.`);
  }
  if (!limitationText.includes("fält") && !limitationText.includes("falt")) {
    errors.push(`${scope}/${item.id}: T18-faltpilot maste markeras som faltkontroll/falttest.`);
  }
  if (!limitationText.includes("inte full")) {
    errors.push(`${scope}/${item.id}: T18-faltpilot maste markeras som inte fullstandigt verifierad.`);
  }
}

function validateForbiddenFields(item, scope) {
  Object.keys(item).forEach((key) => {
    if (FORBIDDEN_FIELDS.has(key)) {
      errors.push(`${scope}/${item.id}: forbjudet falt ${key} hor inte hemma i gallringsdata.`);
    }
  });
}
