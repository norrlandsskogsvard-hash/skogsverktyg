import { readFile } from "node:fs/promises";

const VALID_ACTIVE_USE = new Set(["explanation_and_risk_support_only", "documentation_only"]);
const VALID_STATUS = new Set(["reviewed_research_support", "draft_research_support"]);
const VALID_TYPES = new Set(["explanation", "risk", "field_check", "concept", "limitation"]);
const VALID_SEVERITIES = new Set(["info", "warning"]);
const BLOCKED_EFFECTS = new Set(["activate_curve", "create_hard_threshold", "legal_decision"]);
const CONFIDENCE_EFFECTS = new Set(["raise_confidence", "lower_confidence", "confidence_raise", "confidence_lower"]);
const errors = [];

const data = JSON.parse(await readFile("data/gallring-research-rules.json", "utf8"));

if (!data.sourceId) errors.push("sourceId saknas.");
if (!VALID_STATUS.has(data.status)) errors.push("status maste vara reviewed_research_support eller draft_research_support.");
if (!VALID_ACTIVE_USE.has(data.activeUse)) errors.push("activeUse maste vara explanation_and_risk_support_only eller documentation_only.");
if (data.canActivateCurves !== false) errors.push("canActivateCurves maste vara false.");
if (data.canCreateHardThresholds !== false) errors.push("canCreateHardThresholds maste vara false.");
if (!Array.isArray(data.rules) || data.rules.length === 0) errors.push("rules maste vara en icke-tom array.");

(data.rules || []).forEach(validateRule);

if (errors.length) {
  console.error("Gallringsforskning ar inte validerad:");
  errors.forEach((error) => console.error("- " + error));
  process.exit(1);
}

console.log(`Gallringsforskning OK: ${data.rules.length} regler, 0 kurvaktiveringar, 0 harda gransvarden.`);

function validateRule(rule, index) {
  const label = rule?.id || `rule ${index + 1}`;
  ["id", "topic", "type", "severity", "message", "sourceSummary", "effect"].forEach((key) => {
    if (!rule?.[key]) errors.push(`${label}: ${key} saknas.`);
  });

  if (!rule?.sourcePage && !rule?.sourceSection) {
    errors.push(`${label}: sourcePage eller sourceSection saknas.`);
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

  if (BLOCKED_EFFECTS.has(rule.effect)) {
    errors.push(`${label}: effect ${rule.effect} ar inte tillaten.`);
  }

  if (rule.action && BLOCKED_EFFECTS.has(rule.action)) {
    errors.push(`${label}: action ${rule.action} ar inte tillaten.`);
  }

  if (rule.t20Values || rule.changesT20Values || rule.curveValues || rule.diagramValues) {
    errors.push(`${label}: forskningsregler far inte innehalla T20-, kurv- eller diagramvarden.`);
  }

  if (rule.legalDecision || rule.canMakeLegalDecision) {
    errors.push(`${label}: forskningsregler far inte gora juridiska beslut.`);
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
