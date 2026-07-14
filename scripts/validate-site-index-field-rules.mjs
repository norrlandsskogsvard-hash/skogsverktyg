import { readFile } from "node:fs/promises";
import {
  isActiveNorraPackage,
  NORRA_THINNING_VALUE_PACKAGES
} from "../js/calculators/norraThinningValues.js";
import { SITE_INDEX_CURVES } from "../js/calculators/siteIndexCurves.js";

const VALID_ACTIVE_USE = new Set(["field_method_and_limitations_only", "documentation_only"]);
const VALID_STATUS = new Set(["reviewed_field_method_support", "draft_field_method_support"]);
const VALID_SPECIES = new Set(["tall", "gran", "bjork", "contorta", "general"]);
const VALID_REGIONS = new Set(["AC", "BD", "north_sweden", "general"]);
const VALID_TYPES = new Set(["explanation", "field_check", "limitation", "method", "source_scope"]);
const VALID_SEVERITIES = new Set(["info", "warning"]);
const BLOCKED_EFFECTS = new Set([
  "auto_calculate_si",
  "digitize_curve",
  "activate_curve",
  "create_hard_threshold",
  "legal_decision"
]);
const CONFIDENCE_EFFECTS = new Set(["raise_confidence", "lower_confidence", "confidence_raise", "confidence_lower"]);
const errors = [];

const data = JSON.parse(await readFile("data/site-index-field-rules.json", "utf8"));
const sourceLibrary = JSON.parse(await readFile("data/source-library.json", "utf8"));

if (!Array.isArray(data.sourceIds) || data.sourceIds.length !== 3) {
  errors.push("sourceIds maste innehalla AC, BD och B69.");
} else {
  data.sourceIds.forEach((sourceId) => {
    if (!sourceLibrary.some((source) => source.id === sourceId)) {
      errors.push(`sourceId ${sourceId} finns inte i source-library.`);
    }
  });
}

if (!VALID_STATUS.has(data.status)) errors.push("status maste vara reviewed_field_method_support eller draft_field_method_support.");
if (!VALID_ACTIVE_USE.has(data.activeUse)) errors.push("activeUse maste vara field_method_and_limitations_only eller documentation_only.");
if (data.canAutoCalculateSI !== false) errors.push("canAutoCalculateSI maste vara false.");
if (data.canDigitizeCurves !== false) errors.push("canDigitizeCurves maste vara false.");
if (data.canCreateHardThresholds !== false) errors.push("canCreateHardThresholds maste vara false.");
if (!Array.isArray(data.rules) || data.rules.length === 0) errors.push("rules maste vara en icke-tom array.");

(data.rules || []).forEach(validateRule);
validateNoAutoSiCurves();
validateOnlyT20Active();

if (errors.length) {
  console.error("SI-/boniteringsstod ar inte validerat:");
  errors.forEach((error) => console.error("- " + error));
  process.exit(1);
}

console.log(`SI-/boniteringsstod OK: ${data.rules.length} regler, 0 auto-SI, 0 kurvdigitalisering, 0 harda gransvarden.`);

function validateRule(rule, index) {
  const label = rule?.id || `rule ${index + 1}`;
  ["id", "topic", "species", "region", "type", "severity", "message", "sourceSummary", "effect"].forEach((key) => {
    if (!rule?.[key]) errors.push(`${label}: ${key} saknas.`);
  });

  if (!rule?.sourcePage && !rule?.sourceSection) {
    errors.push(`${label}: sourcePage eller sourceSection saknas.`);
  }

  if (!VALID_SPECIES.has(rule?.species)) {
    errors.push(`${label}: species ${rule?.species} ar inte tillaten.`);
  }

  if (!VALID_REGIONS.has(rule?.region)) {
    errors.push(`${label}: region ${rule?.region} ar inte tillaten.`);
  }

  if (!VALID_TYPES.has(rule?.type)) {
    errors.push(`${label}: type ${rule?.type} ar inte tillaten.`);
  }

  if (!VALID_SEVERITIES.has(rule?.severity)) {
    errors.push(`${label}: severity ${rule?.severity} ar inte tillaten.`);
  }

  if (rule.canAutoCalculateSI !== false) {
    errors.push(`${label}: canAutoCalculateSI maste vara false.`);
  }

  if (rule.canDigitizeCurves !== false) {
    errors.push(`${label}: canDigitizeCurves maste vara false.`);
  }

  if (rule.canCreateHardThreshold !== false) {
    errors.push(`${label}: canCreateHardThreshold maste vara false.`);
  }

  if (BLOCKED_EFFECTS.has(rule.effect)) {
    errors.push(`${label}: effect ${rule.effect} ar inte tillaten.`);
  }

  if (rule.action && BLOCKED_EFFECTS.has(rule.action)) {
    errors.push(`${label}: action ${rule.action} ar inte tillaten.`);
  }

  if (rule.siteIndexValues || rule.siValues || rule.curveValues || rule.diagramValues || rule.thinningCurveValues) {
    errors.push(`${label}: SI-stod far inte innehalla SI-, kurv- eller diagramvarden.`);
  }

  if (rule.legalDecision || rule.canMakeLegalDecision) {
    errors.push(`${label}: SI-stod far inte gora juridiska beslut.`);
  }

  if (hasNumericValue(rule) || hasNumericText(rule)) {
    if (!rule.sourcePage && !rule.sourceSection) {
      errors.push(`${label}: numeriskt innehall maste ha sourcePage/sourceSection.`);
    }
    if (!rule.sourceSummary) {
      errors.push(`${label}: numeriskt innehall maste ha sourceSummary.`);
    }
  }

  if (rule.reviewNeeded === true && CONFIDENCE_EFFECTS.has(rule.effect)) {
    errors.push(`${label}: reviewNeeded-regler far inte sanka/hoja sakerhet automatiskt.`);
  }
}

function validateNoAutoSiCurves() {
  if (Array.isArray(SITE_INDEX_CURVES) && SITE_INDEX_CURVES.length > 0) {
    errors.push(`SITE_INDEX_CURVES innehaller ${SITE_INDEX_CURVES.length} kurvor; auto-SI ska inte vara aktivt i detta steg.`);
  }
}

function validateOnlyT20Active() {
  const active = NORRA_THINNING_VALUE_PACKAGES.filter(isActiveNorraPackage);
  const activeCodes = active.map((item) => `${item.speciesCode}${item.siteIndex}`).sort();
  const t20 = active.find((item) => item.id === "norra-tall-t20-pilot");

  if (JSON.stringify(activeCodes) !== JSON.stringify(["T18", "T20"]) || !t20) {
    errors.push(`forvantade endast T18 och T20 som aktiva gallringskurvor, hittade: ${activeCodes.join(", ") || "inga"}.`);
  }
}

function hasNumericValue(value) {
  if (typeof value === "number") return true;
  if (Array.isArray(value)) return value.some(hasNumericValue);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, entry]) =>
    !["sourcePage", "sourceSection", "sourceSummary", "sourceQuote"].includes(key) &&
    hasNumericValue(entry)
  );
}

function hasNumericText(rule) {
  const searchable = [
    rule.message,
    rule.sourceSummary,
    rule.topic
  ].filter(Boolean).join(" ");
  return /\d/.test(searchable);
}
