import { readFile } from "node:fs/promises";
import {
  isActiveNorraPackage,
  NORRA_THINNING_VALUE_PACKAGES
} from "../js/calculators/norraThinningValues.js";

const VALID_ACTIVE_USE = new Set(["explanation_and_field_support_only", "documentation_only"]);
const VALID_STATUS = new Set(["reviewed_research_support", "draft_research_support"]);
const VALID_SPECIES = new Set(["bjork", "asp", "al", "lov", "blandbestand"]);
const VALID_TYPES = new Set(["explanation", "risk", "field_check", "concept", "limitation"]);
const VALID_SEVERITIES = new Set(["info", "warning"]);
const BLOCKED_EFFECTS = new Set([
  "activate_curve",
  "create_hard_threshold",
  "legal_decision",
  "use_conifer_template_as_truth"
]);
const CONFIDENCE_EFFECTS = new Set(["raise_confidence", "lower_confidence", "confidence_raise", "confidence_lower"]);
const BROADLEAF_SPECIES = new Set(["bjork", "asp", "al", "lov", "blandbestand"]);
const errors = [];

const data = JSON.parse(await readFile("data/bjork-lov-research-rules.json", "utf8"));
const sourceLibrary = JSON.parse(await readFile("data/source-library.json", "utf8"));

if (!data.sourceId) errors.push("sourceId saknas.");
if (!sourceLibrary.some((source) => source.id === data.sourceId)) {
  errors.push(`sourceId ${data.sourceId || "(saknas)"} finns inte i source-library.`);
}
if (!VALID_STATUS.has(data.status)) errors.push("status maste vara reviewed_research_support eller draft_research_support.");
if (!VALID_ACTIVE_USE.has(data.activeUse)) errors.push("activeUse maste vara explanation_and_field_support_only eller documentation_only.");
if (data.canActivateCurves !== false) errors.push("canActivateCurves maste vara false.");
if (data.canCreateHardThresholds !== false) errors.push("canCreateHardThresholds maste vara false.");
if (data.canUseConiferTemplatesAsTruth !== false) errors.push("canUseConiferTemplatesAsTruth maste vara false.");
if (!Array.isArray(data.rules) || data.rules.length === 0) errors.push("rules maste vara en icke-tom array.");

(data.rules || []).forEach(validateRule);
validateT20IsNotApplicableToBroadleaf();

if (errors.length) {
  console.error("Bjork/lov-forskning ar inte validerad:");
  errors.forEach((error) => console.error("- " + error));
  process.exit(1);
}

console.log(`Bjork/lov-forskning OK: ${data.rules.length} regler, 0 kurvaktiveringar, 0 harda gransvarden, 0 barrfacit.`);

function validateRule(rule, index) {
  const label = rule?.id || `rule ${index + 1}`;
  ["id", "topic", "species", "type", "severity", "message", "sourceSummary", "effect"].forEach((key) => {
    if (!rule?.[key]) errors.push(`${label}: ${key} saknas.`);
  });

  if (!rule?.sourcePage && !rule?.sourceSection) {
    errors.push(`${label}: sourcePage eller sourceSection saknas.`);
  }

  if (!VALID_SPECIES.has(rule?.species)) {
    errors.push(`${label}: species ${rule?.species} ar inte tillaten.`);
  }

  if (!VALID_TYPES.has(rule?.type)) {
    errors.push(`${label}: type ${rule?.type} ar inte tillaten.`);
  }

  if (!VALID_SEVERITIES.has(rule?.severity)) {
    errors.push(`${label}: severity ${rule?.severity} ar inte tillaten.`);
  }

  if (rule.canActivateCurve !== false) {
    errors.push(`${label}: canActivateCurve maste vara false.`);
  }

  if (rule.canCreateHardThreshold !== false) {
    errors.push(`${label}: canCreateHardThreshold maste vara false.`);
  }

  if (rule.canUseConiferTemplatesAsTruth !== false) {
    errors.push(`${label}: canUseConiferTemplatesAsTruth maste vara false.`);
  }

  if (BLOCKED_EFFECTS.has(rule.effect)) {
    errors.push(`${label}: effect ${rule.effect} ar inte tillaten.`);
  }

  if (rule.action && BLOCKED_EFFECTS.has(rule.action)) {
    errors.push(`${label}: action ${rule.action} ar inte tillaten.`);
  }

  if (rule.t20Values || rule.changesT20Values || rule.curveValues || rule.diagramValues || rule.priceValues) {
    errors.push(`${label}: bjork/lov-stod far inte innehalla T20-, kurv-, diagram- eller prisvarden.`);
  }

  if (rule.legalDecision || rule.canMakeLegalDecision) {
    errors.push(`${label}: bjork/lov-stod far inte gora juridiska beslut.`);
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

function validateT20IsNotApplicableToBroadleaf() {
  const activePackages = NORRA_THINNING_VALUE_PACKAGES.filter(isActiveNorraPackage);
  const activeBroadleaf = activePackages.filter((item) => BROADLEAF_SPECIES.has(item.species));
  const activeCodes = activePackages.map((item) => `${item.speciesCode}${item.siteIndex}`);
  const t20 = activePackages.find((item) => item.id === "norra-tall-t20-pilot");

  if (activePackages.length !== 1 || !t20) {
    errors.push(`forvantade endast T20 som aktiv Norra-kurva, hittade: ${activeCodes.join(", ") || "inga"}.`);
  }

  if (t20 && t20.species !== "tall") {
    errors.push("T20-piloten far inte byta tradslag fran tall.");
  }

  if (activeBroadleaf.length) {
    errors.push(`aktiva lovkurvor ar inte tillatna i detta steg: ${activeBroadleaf.map((item) => item.id).join(", ")}.`);
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
