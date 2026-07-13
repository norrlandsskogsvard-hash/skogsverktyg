import { readFile } from "node:fs/promises";
import {
  isActiveNorraPackage,
  NORRA_THINNING_VALUE_PACKAGES
} from "../js/calculators/norraThinningValues.js";
import { SITE_INDEX_CURVES } from "../js/calculators/siteIndexCurves.js";

const VALID_ACTIVE_USE = new Set(["risk_and_consideration_support_only", "documentation_only"]);
const VALID_STATUS = new Set(["reviewed_field_support", "draft_field_support"]);
const VALID_DOMAINS = new Set(["naturhansyn", "skador", "vilt", "kulturmiljo", "mark", "general"]);
const VALID_ACTIONS = new Set(["rojning", "gallring", "slutavverkning", "all"]);
const VALID_TYPES = new Set(["explanation", "risk", "field_check", "limitation", "consideration"]);
const VALID_SEVERITIES = new Set(["info", "warning", "critical"]);
const BLOCKED_EFFECTS = new Set([
  "legal_decision",
  "permit_granted",
  "permit_denied",
  "activate_curve",
  "create_hard_threshold",
  "change_pricing",
  "auto_calculate_si"
]);
const BLOCKED_PHRASES = [
  "du far avverka",
  "du får avverka",
  "du far inte avverka",
  "du får inte avverka",
  "lagligt att",
  "olagligt att",
  "tillstand beviljas",
  "tillstånd beviljas"
];
const CONFIDENCE_EFFECTS = new Set(["raise_confidence", "lower_confidence", "confidence_raise", "confidence_lower"]);
const errors = [];

const data = JSON.parse(await readFile("data/hansyn-risk-rules.json", "utf8"));
const sourceLibrary = JSON.parse(await readFile("data/source-library.json", "utf8"));

if (!Array.isArray(data.sourceIds) || data.sourceIds.length < 4) {
  errors.push("sourceIds maste innehalla naturhansyn, skador och vilt.");
} else {
  data.sourceIds.forEach((sourceId) => {
    if (!sourceLibrary.some((source) => source.id === sourceId)) {
      errors.push(`sourceId ${sourceId} finns inte i source-library.`);
    }
  });
}

if (!VALID_STATUS.has(data.status)) errors.push("status maste vara reviewed_field_support eller draft_field_support.");
if (!VALID_ACTIVE_USE.has(data.activeUse)) errors.push("activeUse maste vara risk_and_consideration_support_only eller documentation_only.");
if (data.canMakeLegalDecision !== false) errors.push("canMakeLegalDecision maste vara false.");
if (data.canActivateCurves !== false) errors.push("canActivateCurves maste vara false.");
if (data.canCreateHardThresholds !== false) errors.push("canCreateHardThresholds maste vara false.");
if (data.canChangePricing !== false) errors.push("canChangePricing maste vara false.");
if (!Array.isArray(data.rules) || data.rules.length === 0) errors.push("rules maste vara en icke-tom array.");

(data.rules || []).forEach(validateRule);
await validateNoForbiddenCodeCoupling();
validateOnlyT20Active();
validateNoAutoSiCurves();

if (errors.length) {
  console.error("Hansyn/risk-regler ar inte validerade:");
  errors.forEach((error) => console.error("- " + error));
  process.exit(1);
}

console.log(`Hansyn/risk-stod OK: ${data.rules.length} regler, 0 juridiska beslut, 0 kurvaktiveringar, 0 prisandringar, 0 harda gransvarden.`);

function validateRule(rule, index) {
  const label = rule?.id || `rule ${index + 1}`;
  ["id", "topic", "domain", "type", "severity", "message", "sourceId", "sourceSummary", "effect"].forEach((key) => {
    if (!rule?.[key]) errors.push(`${label}: ${key} saknas.`);
  });

  if (!rule?.sourcePage && !rule?.sourceSection) {
    errors.push(`${label}: sourcePage eller sourceSection saknas.`);
  }

  if (!sourceLibrary.some((source) => source.id === rule?.sourceId)) {
    errors.push(`${label}: sourceId ${rule?.sourceId || "(saknas)"} finns inte i source-library.`);
  }

  if (!VALID_DOMAINS.has(rule?.domain)) {
    errors.push(`${label}: domain ${rule?.domain} ar inte tillaten.`);
  }

  if (!Array.isArray(rule?.appliesToActions) || rule.appliesToActions.length === 0) {
    errors.push(`${label}: appliesToActions maste vara en icke-tom array.`);
  } else {
    rule.appliesToActions.forEach((action) => {
      if (!VALID_ACTIONS.has(action)) errors.push(`${label}: appliesToActions ${action} ar inte tillaten.`);
    });
  }

  if (!VALID_TYPES.has(rule?.type)) {
    errors.push(`${label}: type ${rule?.type} ar inte tillaten.`);
  }

  if (!VALID_SEVERITIES.has(rule?.severity)) {
    errors.push(`${label}: severity ${rule?.severity} ar inte tillaten.`);
  }

  if (rule.canMakeLegalDecision !== false) {
    errors.push(`${label}: canMakeLegalDecision maste vara false.`);
  }

  if (rule.canActivateCurve !== false) {
    errors.push(`${label}: canActivateCurve maste vara false.`);
  }

  if (rule.canCreateHardThreshold !== false) {
    errors.push(`${label}: canCreateHardThreshold maste vara false.`);
  }

  if (rule.canChangePricing !== false) {
    errors.push(`${label}: canChangePricing maste vara false.`);
  }

  if (BLOCKED_EFFECTS.has(rule.effect)) {
    errors.push(`${label}: effect ${rule.effect} ar inte tillaten.`);
  }

  if (rule.action && BLOCKED_EFFECTS.has(rule.action)) {
    errors.push(`${label}: action ${rule.action} ar inte tillaten.`);
  }

  if (rule.legalDecision || rule.permitDecision || rule.canBlockAction === true) {
    errors.push(`${label}: hansyn/risk far inte skapa juridiskt beslut eller blockera atgard.`);
  }

  if (rule.curveValues || rule.diagramValues || rule.siteIndexValues || rule.siValues || rule.priceValues ||
    rule.t20Values || rule.changesT20Values || rule.changesPricing) {
    errors.push(`${label}: hansyn/risk far inte innehalla kurv-, diagram-, SI-, T20- eller prisvarden.`);
  }

  const searchableText = JSON.stringify(rule).toLowerCase();
  BLOCKED_PHRASES.forEach((phrase) => {
    if (searchableText.includes(phrase)) {
      errors.push(`${label}: innehaller forbjudet absolut uttryck '${phrase}'.`);
    }
  });

  if (hasNumericValue(rule) || hasNumericText(rule)) {
    if (!rule.sourcePage && !rule.sourceSection) {
      errors.push(`${label}: numeriskt innehall maste ha sourcePage/sourceSection.`);
    }
    if (!rule.sourceSummary) {
      errors.push(`${label}: numeriskt innehall maste ha sourceSummary.`);
    }
    if (rule.reviewNeeded !== false) {
      errors.push(`${label}: numeriskt innehall far bara vara aktivt granskat med reviewNeeded false.`);
    }
  }

  if (rule.reviewNeeded === true && CONFIDENCE_EFFECTS.has(rule.effect)) {
    errors.push(`${label}: reviewNeeded-regler far inte sanka/hoja sakerhet automatiskt.`);
  }
}

async function validateNoForbiddenCodeCoupling() {
  const files = [
    "data/hansyn-risk-rules.json",
    "js/calculators/skotselCalculator.js",
    "js/calculators/skotselKnowledgeBase.js",
    "js/views/skotselkollen.js",
    "tests/smoke.spec.js"
  ];

  for (const file of files) {
    const text = (await readFile(file, "utf8")).toLowerCase();
    BLOCKED_PHRASES.forEach((phrase) => {
      if (text.includes(phrase)) {
        errors.push(`${file}: innehaller forbjudet absolut uttryck '${phrase}'.`);
      }
    });
    if (text.includes("pricingengine")) {
      errors.push(`${file}: far inte koppla hansyn/risk till pricingEngine.js.`);
    }
  }
}

function validateOnlyT20Active() {
  const active = NORRA_THINNING_VALUE_PACKAGES.filter(isActiveNorraPackage);
  const activeCodes = active.map((item) => `${item.speciesCode}${item.siteIndex}`);
  const t20 = active.find((item) => item.id === "norra-tall-t20-pilot");

  if (active.length !== 1 || !t20) {
    errors.push(`forvantade endast T20 som aktiv gallringskurva, hittade: ${activeCodes.join(", ") || "inga"}.`);
  }

  if (t20 && t20.values?.thinningEvents?.[0]?.basalAreaBefore !== 24.5) {
    errors.push("T20-pilotens forsta grundyta fore gallring har andrats.");
  }
}

function validateNoAutoSiCurves() {
  if (Array.isArray(SITE_INDEX_CURVES) && SITE_INDEX_CURVES.length > 0) {
    errors.push(`SITE_INDEX_CURVES innehaller ${SITE_INDEX_CURVES.length} kurvor; auto-SI ska fortsatt vara sparrat.`);
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
