import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  NORRA_THINNING_VALUE_PACKAGES,
  isActiveNorraPackage
} from "../js/calculators/norraThinningValues.js";

const REQUIRED_COLUMNS = [
  "id",
  "species",
  "speciesCode",
  "siteIndex",
  "region",
  "sourceName",
  "sourceRef",
  "sourcePage",
  "actionLabel",
  "actionType",
  "topHeight",
  "basalAreaBefore",
  "basalAreaAfter",
  "ageTotal",
  "stemsBefore",
  "stemsAfter",
  "unitHeight",
  "unitBasalArea",
  "unitAge",
  "unitStems",
  "valueType",
  "dataQuality",
  "status",
  "activeUse",
  "reviewNeeded",
  "confidence",
  "extractionMethod",
  "limitation",
  "note"
];

const ALLOWED = {
  speciesCode: new Set(["T", "G"]),
  status: new Set(["candidate", "verified_candidate", "draft_digitized", "active_pilot", "verified", "inactive", "rejected"]),
  dataQuality: new Set(["pilot_example", "verified_text", "verified_table", "chart_digitized_verified", "chart_digitized_unverified", "candidate_only", "documentation_only"]),
  activeUse: new Set(["chart_reference", "full_curve", "advisory_only", "documentation_only", "none"]),
  valueType: new Set(["direct_text_example", "direct_table_value", "chart_digitized_unverified", "chart_digitized_verified", "text_interpretation", "documentation_only"])
};

const NON_ACTIVE_STATUSES = new Set(["candidate", "verified_candidate", "draft_digitized"]);

const EXPECTED_T20_EVENTS = [
  { label: "1:a gallring", topHeight: 14.5, basalAreaBefore: 24.5, basalAreaAfter: 18.5, ageTotal: 59, stemsBefore: 1650, stemsAfter: 1100 },
  { label: "2:a gallring", topHeight: 18.0, basalAreaBefore: 28.0, basalAreaAfter: 20.5, ageTotal: 82, stemsBefore: 1100, stemsAfter: 700 },
  { label: "Slutavverkning enligt exempel", topHeight: 22.0, basalAreaBefore: 31.5, basalAreaAfter: 0, ageTotal: 125, stemsBefore: 700, stemsAfter: 0 }
];

const inputPath = await resolveInputPath();
const csvText = await readFile(inputPath, "utf8");
const { rows, warnings } = parseCsv(csvText);
const packages = buildPackages(rows, warnings);
const errors = validatePackages(packages);

if (errors.length) {
  console.error("Norra import stoppad:");
  errors.forEach((error) => console.error("- " + error));
  process.exit(1);
}

await mkdir("docs/generated", { recursive: true });
await mkdir("data/generated", { recursive: true });
await writeFile("data/generated/norra-thinning-import-preview.json", JSON.stringify(packages, null, 2) + "\n");
await writeFile("docs/generated/norra-thinning-import-report.md", reportTemplate(inputPath, rows, packages, warnings));

const counts = countByStatus(packages);
console.log(`Norra import OK: ${rows.length} rader, ${packages.length} mallar.`);
console.log(`Status: active_pilot=${counts.active_pilot || 0}, verified_candidate=${counts.verified_candidate || 0}, draft_digitized=${counts.draft_digitized || 0}, candidate=${counts.candidate || 0}, rejected=${counts.rejected || 0}.`);
console.log("Preview: data/generated/norra-thinning-import-preview.json");
console.log("Rapport: docs/generated/norra-thinning-import-report.md");

async function resolveInputPath() {
  const requested = process.argv[2];
  if (requested) return requested;

  const templatePath = "data/norra-thinning-import-template.csv";
  const templateText = await readFile(templatePath, "utf8");
  const parsed = parseCsv(templateText);
  return parsed.rows.length ? templatePath : "data/norra-thinning-import-example.csv";
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length);
  if (!lines.length) return { rows: [], warnings: ["CSV saknar innehåll."] };
  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missing.length) {
    throw new Error("CSV saknar kolumner: " + missing.join(", "));
  }

  const warnings = [];
  const rows = lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      warnings.push(`Rad ${index + 2}: antal kolumner (${values.length}) matchar inte header (${headers.length}).`);
    }
    return Object.fromEntries(headers.map((header, columnIndex) => [header, clean(values[columnIndex])]));
  });
  return { rows, warnings };
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function buildPackages(rows, warnings) {
  const grouped = new Map();
  rows.forEach((row) => {
    if (!grouped.has(row.id)) grouped.set(row.id, []);
    grouped.get(row.id).push(row);
  });

  return [...grouped.entries()].map(([id, groupRows]) => {
    const first = groupRows[0];
    const rowValues = groupRows.map(rowToEvent).filter(Boolean);
    const valueType = first.valueType || "documentation_only";
    const isDraft = first.status === "draft_digitized" || first.dataQuality === "chart_digitized_unverified" || valueType === "chart_digitized_unverified";
    const validationSchema = rowValues.length ? [
      { parameter: "topHeight", unit: first.unitHeight },
      { parameter: "basalAreaBefore", unit: first.unitBasalArea },
      { parameter: "basalAreaAfter", unit: first.unitBasalArea },
      { parameter: "ageTotal", unit: first.unitAge },
      { parameter: "stemsBefore", unit: first.unitStems },
      { parameter: "stemsAfter", unit: first.unitStems }
    ] : [];

    const packageItem = {
      id,
      sourceName: first.sourceName,
      sourceType: "regional_curve",
      sourceRef: first.sourceRef,
      sourcePage: first.sourcePage,
      species: first.species,
      speciesCode: first.speciesCode,
      siteIndex: toNumber(first.siteIndex),
      region: first.region,
      area: "thinning",
      actionType: first.actionType || "gallring",
      title: first.speciesCode + first.siteIndex + " importgranskning",
      description: "Importerat granskningspaket från CSV. Inte aktivt utan separat beslut.",
      status: first.status || "candidate",
      precision: valueType,
      dataQuality: first.dataQuality || "candidate_only",
      confidence: first.confidence || "low",
      activeUse: first.activeUse || "documentation_only",
      canCreateFullCurve: false,
      canAloneGiveHighConfidence: false,
      reviewNeeded: parseBoolean(first.reviewNeeded, true),
      extractionNotes: unique(groupRows.flatMap((row) => [row.extractionMethod, row.note]).filter(Boolean)),
      limitations: unique(groupRows.map((row) => row.limitation).filter(Boolean)),
      validation: {
        hasExactSource: Boolean(first.sourceName && first.sourceRef && first.sourcePage),
        hasUnits: rowValues.length ? validationSchema.every((entry) => Boolean(entry.unit)) : false,
        valueSchema: validationSchema,
        notes: warnings.filter((warning) => warning.includes(id))
      },
      values: isDraft ? [] : valuesFromEvents(rowValues),
      draftValues: isDraft ? valuesFromEvents(rowValues) : []
    };

    return packageItem;
  });
}

function rowToEvent(row) {
  const valueKeys = ["topHeight", "basalAreaBefore", "basalAreaAfter", "ageTotal", "stemsBefore", "stemsAfter"];
  const hasAnyValue = valueKeys.some((key) => row[key] !== "");
  if (!hasAnyValue) return null;
  return {
    label: row.actionLabel || "Importerat värde",
    topHeight: toNumber(row.topHeight),
    basalAreaBefore: toNumber(row.basalAreaBefore),
    basalAreaAfter: toNumber(row.basalAreaAfter),
    ageTotal: toNumber(row.ageTotal),
    stemsBefore: toNumber(row.stemsBefore),
    stemsAfter: toNumber(row.stemsAfter)
  };
}

function valuesFromEvents(events) {
  return events.length ? { thinningEvents: events } : [];
}

function validatePackages(packages) {
  const errors = [];
  const active = packages.filter(isActiveNorraPackage);
  const activeNonT20 = active.filter((item) => item.id !== "norra-tall-t20-pilot");
  if (activeNonT20.length) {
    errors.push("Import försöker aktivera annan mall än T20: " + activeNonT20.map((item) => item.id).join(", "));
  }

  packages.forEach((item) => {
    if (!item.id || !item.speciesCode || !item.siteIndex || !item.region || !item.sourceName) {
      errors.push(`${item.id || "okänd"}: id, speciesCode, SI, region eller sourceName saknas.`);
    }
    if (!ALLOWED.speciesCode.has(item.speciesCode)) errors.push(`${item.id}: speciesCode måste vara T eller G.`);
    if (!ALLOWED.status.has(item.status)) errors.push(`${item.id}: ogiltig status ${item.status}.`);
    if (!ALLOWED.dataQuality.has(item.dataQuality)) errors.push(`${item.id}: ogiltig dataQuality ${item.dataQuality}.`);
    if (!ALLOWED.activeUse.has(item.activeUse)) errors.push(`${item.id}: ogiltig activeUse ${item.activeUse}.`);
    if (item.species === "bjork" || item.speciesCode === "B") errors.push(`${item.id}: björk/löv får inte kopplas till Norra tall/gran.`);
    if (NON_ACTIVE_STATUSES.has(item.status) && ["chart_reference", "full_curve"].includes(item.activeUse)) {
      errors.push(`${item.id}: ${item.status} får inte använda ${item.activeUse}.`);
    }
    if (isActiveNorraPackage(item) && item.reviewNeeded !== false) {
      errors.push(`${item.id}: aktiv post måste ha reviewNeeded false.`);
    }
    validateUnits(item, errors);
  });

  const t20 = packages.find((item) => item.id === "norra-tall-t20-pilot");
  if (t20) {
    assertT20Unchanged(t20, errors);
  }

  return errors;
}

function validateUnits(item, errors) {
  if (!hasValues(item.values) && !hasValues(item.draftValues)) return;
  const schema = item.validation?.valueSchema || [];
  if (!schema.length || schema.some((entry) => !entry.parameter || !entry.unit)) {
    errors.push(`${item.id}: värden finns men parameter/enhet saknas.`);
  }
}

function assertT20Unchanged(item, errors) {
  const events = item.values?.thinningEvents || [];
  if (JSON.stringify(events) !== JSON.stringify(EXPECTED_T20_EVENTS)) {
    errors.push("Importfilen ändrar T20-värdena.");
  }
}

function reportTemplate(filePath, rows, packages, warnings) {
  const counts = countByStatus(packages);
  const missingValues = packages.filter((item) => !hasValues(item.values) && !hasValues(item.draftValues));
  const active = packages.filter(isActiveNorraPackage);
  const table = packages.map((item) =>
    `| ${item.speciesCode}${item.siteIndex} | ${item.species} | ${item.status} | ${item.dataQuality} | ${hasValues(item.values) || hasValues(item.draftValues) ? "Ja" : "Nej"} | ${isActiveNorraPackage(item) ? "Ja" : "Nej"} | ${nextCheck(item)} |`
  ).join("\n");

  return `# Norra gallringsimport - granskningsrapport

Importfil: \`${filePath}\`

Batchimport betyder inte att kurvorna är aktiva.

## Sammanfattning

- Rader: ${rows.length}
- Mallar: ${packages.length}
- Active pilot: ${counts.active_pilot || 0}
- Verified candidate: ${counts.verified_candidate || 0}
- Draft digitized: ${counts.draft_digitized || 0}
- Candidate: ${counts.candidate || 0}
- Rejected: ${counts.rejected || 0}
- Aktiva paket i preview: ${active.length}
- Saknar värden: ${missingValues.length}

## Mallar

| SI | Trädslag | Status | Datakvalitet | Värden finns | Aktiv | Nästa kontroll |
| --- | --- | --- | --- | --- | --- | --- |
${table}

## Varningar

${warnings.length ? warnings.map((warning) => "- " + warning).join("\n") : "- Inga CSV-varningar."}
`;
}

function nextCheck(item) {
  if (item.status === "active_pilot") return "Jämför mot full mall före beslut";
  if (item.status === "verified_candidate") return "Aktiveringsbeslut enligt protokoll";
  if (item.status === "draft_digitized") return "Verifiera digitalisering";
  if (!hasValues(item.values) && !hasValues(item.draftValues)) return "Lägg in källa, värden och enheter";
  return "Granska begränsningar och testfall";
}

function countByStatus(packages) {
  return packages.reduce((counts, item) => {
    counts[item.status] = (counts[item.status] || 0) + 1;
    return counts;
  }, {});
}

function hasValues(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some((entry) => Array.isArray(entry) ? entry.length > 0 : Boolean(entry));
}

function toNumber(value) {
  if (value === "" || value === undefined || value === null) return null;
  const parsed = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value, fallback) {
  if (value === "" || value === undefined || value === null) return fallback;
  return String(value).trim().toLowerCase() === "true";
}

function clean(value) {
  return String(value ?? "").trim();
}

function unique(values) {
  return [...new Set(values)];
}
