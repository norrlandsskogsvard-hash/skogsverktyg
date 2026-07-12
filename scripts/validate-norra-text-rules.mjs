import { readFile } from "node:fs/promises";

const VALID_STATUS = new Set(["reviewed_text_rules", "draft_text_rules"]);
const VALID_ACTIVE_USE = new Set(["control_flags_only", "documentation_only"]);
const BLOCKED_EFFECTS = new Set(["activate_curve"]);
const BLOCKED_ACTIONS = new Set(["legal_decision"]);
const errors = [];

const data = JSON.parse(await readFile("data/norra-thinning-text-rules.json", "utf8"));

if (!data.sourceId) errors.push("sourceId saknas.");
if (!VALID_STATUS.has(data.status)) errors.push("status måste vara reviewed_text_rules eller draft_text_rules.");
if (!VALID_ACTIVE_USE.has(data.activeUse)) errors.push("activeUse måste vara control_flags_only eller documentation_only.");
if (data.canActivateCurves !== false) errors.push("canActivateCurves måste vara false.");
if (!Array.isArray(data.rules) || data.rules.length === 0) errors.push("rules måste vara en icke-tom array.");

(data.rules || []).forEach(validateRule);

if (errors.length) {
  console.error("Norra textregler är inte validerade:");
  errors.forEach((error) => console.error("- " + error));
  process.exit(1);
}

console.log(`Norra textregler OK: ${data.rules.length} regler, activeUse ${data.activeUse}, 0 kurvaktiveringar.`);

function validateRule(rule, index) {
  const label = rule?.id || `rule ${index + 1}`;
  ["id", "type", "severity", "message", "sourcePage", "effect"].forEach((key) => {
    if (!rule?.[key]) errors.push(`${label}: ${key} saknas.`);
  });

  if (BLOCKED_EFFECTS.has(rule.effect)) {
    errors.push(`${label}: effect activate_curve är inte tillåtet.`);
  }

  if (BLOCKED_ACTIONS.has(rule.action)) {
    errors.push(`${label}: action legal_decision är inte tillåtet.`);
  }

  if (rule.t20Values || rule.changesT20Values) {
    errors.push(`${label}: textregler får inte ändra eller innehålla T20-värden.`);
  }

  if (rule.reviewNeeded === true && rule.canBlockAction === true) {
    errors.push(`${label}: reviewNeeded-regler får inte vara blockerande.`);
  }

  if (hasNumericValue(rule)) {
    if (!rule.sourcePage) {
      errors.push(`${label}: numerisk regel måste ha sourcePage.`);
    }
    if (!rule.sourceQuote && !rule.sourceSummary) {
      errors.push(`${label}: numerisk regel måste ha sourceQuote eller sourceSummary.`);
    }
  }

  (rule.numericValues || []).forEach((value, valueIndex) => {
    const valueLabel = `${label}: numericValues[${valueIndex}]`;
    if (!value.sourcePage) errors.push(`${valueLabel} saknar sourcePage.`);
    if (!value.sourceQuote && !value.sourceSummary) errors.push(`${valueLabel} saknar sourceQuote/sourceSummary.`);
  });
}

function hasNumericValue(value) {
  if (typeof value === "number") return true;
  if (Array.isArray(value)) return value.some(hasNumericValue);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, entry]) =>
    key !== "sourcePage" &&
    key !== "sourceSummary" &&
    key !== "sourceQuote" &&
    hasNumericValue(entry)
  );
}
