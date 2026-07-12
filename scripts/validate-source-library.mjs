import { readFile } from "node:fs/promises";

const SOURCE_TYPES = new Set([
  "research",
  "law",
  "regional_curve",
  "practice_guide",
  "decision_support_reference",
  "scenario_reference",
  "skogskunskap_tool",
  "skogskunskap_guidance",
  "legal_or_habitat_guidance",
  "legal_or_agency_guidance",
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
  "juridik",
  "foryngring",
  "tillsyn",
  "avverkning",
  "rennaring",
  "fjallnara_skog"
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
  "legal_text",
  "legal_guidance",
  "numeric_legal_thresholds",
  "no_numeric_values"
]);

const ACCESS_TYPES = new Set(["local_file", "online_source", "online_mirror"]);
const ONLINE_CHECK_FREQUENCIES = new Set(["on_release", "monthly", "before_legal_update", "manual"]);

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

const counts = {
  local: library.filter((source) => accessType(source) === "local_file").length,
  online: library.filter((source) => accessType(source) === "online_source").length,
  mirrors: library.filter((source) => accessType(source) === "online_mirror").length
};
console.log(`Källbibliotek OK: ${library.length} källor, ${counts.local} lokala, ${counts.online} online, ${counts.mirrors} speglar, 0 direkt aktiva.`);

function validateSource(source, index) {
  const label = source?.id || `post ${index + 1}`;
  requireString(source, "id", label);
  requireString(source, "title", label);
  requireString(source, "sourceType", label);
  requireArray(source, "areas", label);

  const kind = accessType(source);
  if (!ACCESS_TYPES.has(kind)) {
    errors.push(`${label}: accessType '${kind}' är inte tillåten.`);
  }

  if (kind === "local_file") {
    requireString(source, "filename", label);
  } else {
    requireString(source, "url", label);
    if (source.filename !== null) {
      errors.push(`${label}: onlinekällor ska ha filename null.`);
    }
    if (!source.lastChecked) {
      errors.push(`${label}: onlinekällor måste ha lastChecked.`);
    }
    if (!source.extractionStatus) {
      errors.push(`${label}: onlinekällor måste ha extractionStatus.`);
    }
    if (!ONLINE_CHECK_FREQUENCIES.has(source.onlineCheckFrequency)) {
      errors.push(`${label}: onlineCheckFrequency saknas eller är otillåten.`);
    }
  }

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

  if (source.sourceType === "law") {
    if (source.primarySource !== true) {
      errors.push(`${label}: lagkälla måste vara primarySource true.`);
    }
    if (source.canActivateDirectly !== false || source.requiresManualReview !== true) {
      errors.push(`${label}: lagkälla får inte aktiveras direkt och måste kräva manuell granskning.`);
    }
    if (source.onlineCheckFrequency !== "before_legal_update") {
      errors.push(`${label}: lagkälla måste kontrolleras före juridisk uppdatering.`);
    }
  }

  if (source.sourceType === "legal_or_agency_guidance" &&
    (source.canActivateDirectly !== false || source.requiresManualReview !== true)) {
    errors.push(`${label}: myndighetsvägledning får inte aktiveras direkt och måste kräva manuell granskning.`);
  }

  if (kind === "online_mirror") {
    if (source.primarySource !== false) {
      errors.push(`${label}: spegelkälla får inte vara primarySource.`);
    }
    if (!source.mirrorForSourceId) {
      errors.push(`${label}: spegelkälla måste ange mirrorForSourceId.`);
    }
    if (source.canActivateDirectly !== false || source.requiresManualReview !== true) {
      errors.push(`${label}: spegelkälla får inte aktivera värden och måste kräva manuell granskning.`);
    }
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

function accessType(source) {
  if (source?.accessType) return source.accessType;
  return source?.url ? "online_source" : "local_file";
}
