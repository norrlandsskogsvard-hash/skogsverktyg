import { readFile } from "node:fs/promises";

const VALID_ACTIVE_USE = new Set(["legal_control_flags_only", "documentation_only"]);
const BLOCKED_EFFECTS = new Set(["legal_decision", "permit_granted", "permit_denied"]);
const BLOCKED_PHRASES = [
  "du får avverka",
  "du får inte avverka",
  "lagligt",
  "olagligt"
];

const data = JSON.parse(await readFile("data/legal-control-rules.json", "utf8"));
const errors = [];

if (data.canMakeLegalDecision !== false) {
  errors.push("canMakeLegalDecision måste vara false.");
}

if (!VALID_ACTIVE_USE.has(data.activeUse)) {
  errors.push("activeUse måste vara legal_control_flags_only eller documentation_only.");
}

if (!data.primarySourceId) {
  errors.push("primarySourceId saknas.");
}

if (!Array.isArray(data.rules) || data.rules.length === 0) {
  errors.push("rules måste vara en icke-tom array.");
}

(data.rules || []).forEach(validateRule);
await validateNoForbiddenUiPhrases();

if (errors.length) {
  console.error("Juridiska kontrollregler är inte validerade:");
  errors.forEach((error) => console.error("- " + error));
  process.exit(1);
}

console.log(`Juridiska kontrollregler OK: ${data.rules.length} regler, 0 juridiska beslut.`);

function validateRule(rule, index) {
  const label = rule?.id || `rule ${index + 1}`;
  ["id", "effect", "message", "userText"].forEach((key) => {
    if (!rule?.[key]) errors.push(`${label}: ${key} saknas.`);
  });

  if (!Array.isArray(rule.sourceRefs) || rule.sourceRefs.length === 0) {
    errors.push(`${label}: sourceRefs saknas.`);
  }

  if (rule.canMakeLegalDecision !== false) {
    errors.push(`${label}: canMakeLegalDecision måste vara false.`);
  }

  if (BLOCKED_EFFECTS.has(rule.effect)) {
    errors.push(`${label}: effect ${rule.effect} är inte tillåten.`);
  }

  if (rule.reviewNeeded === true && rule.canBlockAction === true) {
    errors.push(`${label}: reviewNeeded-regler får inte ha canBlockAction true.`);
  }

  const searchableText = JSON.stringify(rule).toLowerCase();
  BLOCKED_PHRASES.forEach((phrase) => {
    if (searchableText.includes(phrase)) {
      errors.push(`${label}: innehåller förbjudet absolut uttryck '${phrase}'.`);
    }
  });

  if (searchableText.includes("tillåtet") && !searchableText.includes("kontroll")) {
    errors.push(`${label}: innehåller 'tillåtet' utan kontrollsammanhang.`);
  }

  if (rule.curveCount || rule.changesCurveCount || rule.t20Values || rule.changesT20Values) {
    errors.push(`${label}: juridiska regler får inte påverka curveCount eller T20.`);
  }
}

async function validateNoForbiddenUiPhrases() {
  const files = [
    "js/calculators/skotselCalculator.js",
    "js/calculators/skotselKnowledgeBase.js",
    "js/views/skotselkollen.js",
    "tests/smoke.spec.js"
  ];

  for (const file of files) {
    const text = (await readFile(file, "utf8")).toLowerCase();
    BLOCKED_PHRASES.forEach((phrase) => {
      if (text.includes(phrase)) {
        errors.push(`${file}: innehåller förbjudet absolut uttryck '${phrase}'.`);
      }
    });
    if (text.includes("tillåtet") && !text.includes("kontroll")) {
      errors.push(`${file}: innehåller 'tillåtet' utan kontrollsammanhang.`);
    }
  }
}
