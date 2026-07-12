import { readFile } from "node:fs/promises";

const SOURCE_TYPES = new Set([
  "research",
  "regional_curve",
  "practice_guide",
  "decision_support_reference",
  "scenario_reference",
  "skogskunskap_tool",
  "skogskunskap_guidance",
  "legal_or_habitat_guidance",
  "field_method",
  "terrain_cost_support",
  "source_index_only"
]);

const AREAS = new Set([
  "gallring",
  "rojning",
  "bonitering",
  "slutavverkning",
  "bjork_lov",
  "naturhansyn",
  "skador",
  "vilt",
  "kulturmiljo",
  "terrang",
  "ekonomi",
  "juridik"
]);

const VALUE_TYPES = new Set([
  "direct_text",
  "direct_table",
  "chart",
  "diagram",
  "field_method",
  "advisory_text",
  "checklist",
  "cost_support",
  "no_numeric_values"
]);

const library = JSON.parse(await readFile("data/source-library.json", "utf8"));
const errors = [];
const ids = new Set();
const filenames = new Set();

if (!Array.isArray(library)) {
  errors.push("source-library.json måste vara en array.");
} else {
  library.forEach(validateSource);
}

if (errors.length) {
  console.error("Källbiblioteket är inte validerat:");
  errors.forEach((error) => console.error("- " + error));
  process.exit(1);
}

console.log(`Källbibliotek OK: ${library.length} källor, 0 direkt aktiva.`);

function validateSource(source, index) {
  const label = source?.id || `post ${index + 1}`;
  requireString(source, "id", label);
  requireString(source, "filename", label);
  requireString(source, "title", label);
  requireString(source, "sourceType", label);
  requireArray(source, "areas", label);

  if (source.id) {
    if (ids.has(source.id)) errors.push(`${label}: id är duplicerat.`);
    ids.add(source.id);
  }

  if (source.filename) {
    if (filenames.has(source.filename)) errors.push(`${label}: filename är duplicerat.`);
    filenames.add(source.filename);
  }

  if (source.sourceType && !SOURCE_TYPES.has(source.sourceType)) {
    errors.push(`${label}: sourceType '${source.sourceType}' är inte tillåten.`);
  }

  validateArrayValues(source, "areas", AREAS, label);
  validateArrayValues(source, "valueTypes", VALUE_TYPES, label);

  if (source.sourceType !== "source_index_only" && Array.isArray(source.areas) && source.areas.length === 0) {
    errors.push(`${label}: areas får bara vara tom för source_index_only.`);
  }

  if (source.canActivateDirectly !== false) {
    errors.push(`${label}: canActivateDirectly måste vara false.`);
  }

  if (source.canContainNumericValues === true && source.requiresManualReview !== true) {
    errors.push(`${label}: numeriska källor måste ha requiresManualReview true.`);
  }

  if (source.canActivateDirectly === true || source.extractionStatus === "active_rule") {
    errors.push(`${label}: källbiblioteket får inte aktivera regler direkt.`);
  }
}

function requireString(source, key, label) {
  if (typeof source?.[key] !== "string" || source[key].trim() === "") {
    errors.push(`${label}: ${key} saknas.`);
  }
}

function requireArray(source, key, label) {
  if (!Array.isArray(source?.[key])) {
    errors.push(`${label}: ${key} måste vara en array.`);
  }
}

function validateArrayValues(source, key, allowed, label) {
  if (!Array.isArray(source?.[key])) return;
  source[key].forEach((value) => {
    if (!allowed.has(value)) {
      errors.push(`${label}: ${key} innehåller otillåtet värde '${value}'.`);
    }
  });
}
