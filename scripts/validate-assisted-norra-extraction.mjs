import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getActiveNorraPackages,
  NORRA_THINNING_VALUE_PACKAGES
} from "../js/calculators/norraThinningValues.js";
import { SITE_INDEX_CURVES } from "../js/calculators/siteIndexCurves.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CSV_PATH = join(ROOT, "data", "norra-thinning-import-batch-03-assisted.csv");
const JSON_PATH = join(ROOT, "data", "generated", "norra-thinning-assisted-extraction.json");
const REPORT_PATH = join(ROOT, "docs", "generated", "norra-thinning-assisted-extraction-report.md");
const CONFIDENCE = new Set(["high", "medium", "low"]);
const REQUIRED = ["code", "species", "siteIndex", "stage", "sourcePage", "confidence", "reviewNeeded", "activeUse"];
const EXPECTED_T20_EVENTS = [
  { label: "1:a gallring", topHeight: 14.5, basalAreaBefore: 24.5, basalAreaAfter: 18.5, ageTotal: 59, stemsBefore: 1650, stemsAfter: 1100 },
  { label: "2:a gallring", topHeight: 18.0, basalAreaBefore: 28.0, basalAreaAfter: 20.5, ageTotal: 82, stemsBefore: 1100, stemsAfter: 700 },
  { label: "Slutavverkning enligt exempel", topHeight: 22.0, basalAreaBefore: 31.5, basalAreaAfter: 0, ageTotal: 125, stemsBefore: 700, stemsAfter: 0 }
];

const errors = [];

if (!existsSync(CSV_PATH)) errors.push("CSV saknas.");
if (!existsSync(JSON_PATH)) errors.push("JSON saknas.");
if (!existsSync(REPORT_PATH)) errors.push("Rapport saknas.");

const rows = existsSync(CSV_PATH) ? parseCsv(await readFile(CSV_PATH, "utf8")) : [];
const extraction = existsSync(JSON_PATH) ? JSON.parse(await readFile(JSON_PATH, "utf8")) : {};
const report = existsSync(REPORT_PATH) ? await readFile(REPORT_PATH, "utf8") : "";
const active = getActiveNorraPackages();
const activeCodes = active.map((item) => `${item.speciesCode}${item.siteIndex}`).sort();
const t20 = NORRA_THINNING_VALUE_PACKAGES.find((item) => item.id === "norra-tall-t20-pilot");

if (rows.length < 1) errors.push("CSV maste innehalla minst en assisted rad.");

rows.forEach((row, index) => validateRow(row, index));

if (extraction.canActivateCurves !== false) errors.push("JSON canActivateCurves maste vara false.");
if (extraction.canAutoDigitize !== false) errors.push("JSON canAutoDigitize maste vara false.");
if (extraction.canChangeProductionRules !== false) errors.push("JSON canChangeProductionRules maste vara false.");
if (extraction.summary?.activeUseTrueCount !== 0) errors.push("JSON summary activeUseTrueCount maste vara 0.");
if (/active_verified/i.test(JSON.stringify(extraction))) errors.push("Assisted JSON far inte innehalla active_verified.");
if (/juridiskt beslut|legalDecision|price|pricing|prisandring/i.test(JSON.stringify(extraction) + report)) {
  errors.push("Assisted extraction far inte innehalla juridiskt beslut eller prisandring.");
}

if (JSON.stringify(activeCodes) !== JSON.stringify(["T18", "T20"])) {
  errors.push(`Endast T18 och T20 far vara aktiva kurvor, hittade ${activeCodes.join(", ") || "inga"}.`);
}

if (!t20) {
  errors.push("T20-piloten saknas.");
} else if (JSON.stringify(t20.values?.thinningEvents) !== JSON.stringify(EXPECTED_T20_EVENTS)) {
  errors.push("T20-vardena har andrats.");
}

if (SITE_INDEX_CURVES.length !== 0) {
  errors.push(`SITE_INDEX_CURVES maste vara [], hittade ${SITE_INDEX_CURVES.length}.`);
}

if (errors.length) {
  console.error("Assisterad Norra-extraktion ar inte validerad:");
  errors.forEach((error) => console.error("- " + error));
  process.exit(1);
}

const confidenceCounts = rows.reduce((acc, row) => {
  acc[row.confidence] += 1;
  return acc;
}, { high: 0, medium: 0, low: 0 });

console.log(`Assisterad Norra-extraktion OK: ${rows.length} rader, high ${confidenceCounts.high}, medium ${confidenceCounts.medium}, low ${confidenceCounts.low}, 0 aktiveringar.`);

function validateRow(row, index) {
  REQUIRED.forEach((field) => {
    if (row[field] === undefined || row[field] === "") {
      errors.push(`Rad ${index + 1}: ${field} saknas.`);
    }
  });

  if (!["T18", "T22", "G20", "G22"].includes(row.code)) {
    errors.push(`Rad ${index + 1}: ovantad kod ${row.code}.`);
  }

  if (!["tall", "gran"].includes(row.species)) {
    errors.push(`Rad ${index + 1}: species maste vara tall eller gran.`);
  }

  if (!CONFIDENCE.has(row.confidence)) {
    errors.push(`Rad ${index + 1}: confidence ${row.confidence} ar ogiltig.`);
  }

  if (row.activeUse !== "false") {
    errors.push(`Rad ${index + 1}: activeUse maste vara false.`);
  }

  if ((row.confidence === "medium" || row.confidence === "low") && row.reviewNeeded !== "true") {
    errors.push(`Rad ${index + 1}: medium/low maste ha reviewNeeded true.`);
  }

  if (/active_verified/i.test(Object.values(row).join(" "))) {
    errors.push(`Rad ${index + 1}: assisted rad far inte ha active_verified.`);
  }
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines.shift() || "");
  return lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value);
  return values;
}
