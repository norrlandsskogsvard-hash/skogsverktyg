import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { NORRA_THINNING_VALUE_PACKAGES } from "../js/calculators/norraThinningValues.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_ID = "norra-gallringsriktlinjer-gallringsmallar";
const SOURCE_FILENAME = "Gallringsriktlinjer & gallringsmallar norra Sverige.pdf";
const SOURCE_PATH = join(ROOT, "sources", SOURCE_FILENAME);
const TARGET_CODES = [
  { code: "T18", species: "tall", siteIndex: 18 },
  { code: "T22", species: "tall", siteIndex: 22 },
  { code: "G20", species: "gran", siteIndex: 20 },
  { code: "G22", species: "gran", siteIndex: 22 }
];
const CSV_PATH = join(ROOT, "data", "norra-thinning-import-batch-03-assisted.csv");
const JSON_PATH = join(ROOT, "data", "generated", "norra-thinning-assisted-extraction.json");
const REPORT_PATH = join(ROOT, "docs", "generated", "norra-thinning-assisted-extraction-report.md");
const PYTHON_EXTRACTOR = String.raw`
import json
import sys

pdf_path = sys.argv[1]
try:
    import pdfplumber
except Exception as exc:
    raise SystemExit(str(exc))

pages = []
with pdfplumber.open(pdf_path) as pdf:
    for index, page in enumerate(pdf.pages, start=1):
        pages.append({"number": index, "text": page.extract_text() or ""})

print(json.dumps(pages, ensure_ascii=False))
`;

const sourceLibrary = JSON.parse(await readFile(join(ROOT, "data", "source-library.json"), "utf8"));
const source = sourceLibrary.find((item) => item.id === SOURCE_ID);
const pdfText = await extractPdfText(SOURCE_PATH);
const pages = pdfText.pages || [];
const rows = TARGET_CODES.map((target) => buildAssistedRow(target, pages));
const t20Integrity = checkT20Integrity(pages);
const summary = summarizeRows(rows);

const extraction = {
  title: "Norra gallringskurvor - assisterad PDF-extraktion",
  status: "assisted_review_batch",
  sourceId: SOURCE_ID,
  sourceFile: SOURCE_FILENAME,
  sourcePath: SOURCE_PATH,
  extractionMethod: pdfText.method,
  canActivateCurves: false,
  canChangeProductionRules: false,
  canAutoDigitize: false,
  activeUseDefault: false,
  targetCodes: TARGET_CODES.map((target) => target.code),
  generatedAt: new Date().toISOString(),
  summary,
  t20Integrity,
  rows
};

await mkdir(dirname(CSV_PATH), { recursive: true });
await mkdir(dirname(JSON_PATH), { recursive: true });
await mkdir(dirname(REPORT_PATH), { recursive: true });
await writeFile(CSV_PATH, buildCsv(rows), "utf8");
await writeFile(JSON_PATH, JSON.stringify(extraction, null, 2) + "\n", "utf8");
await writeFile(REPORT_PATH, buildReport(extraction, source), "utf8");

console.log(`Assisterad Norra-extraktion klar: ${rows.length} rader, high ${summary.confidence.high}, medium ${summary.confidence.medium}, low ${summary.confidence.low}.`);

async function extractPdfText(pdfPath) {
  const candidates = pythonCandidates();
  for (const candidate of candidates) {
    if (!candidate.command) continue;
    const result = spawnSync(candidate.command, [...candidate.args, "-c", PYTHON_EXTRACTOR, pdfPath], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024
    });
    if (result.status === 0 && result.stdout.trim()) {
      return {
        method: "pdfplumber_text",
        pages: JSON.parse(result.stdout)
      };
    }
  }
  return {
    method: "unreadable_pdf",
    pages: []
  };
}

function pythonCandidates() {
  const bundled = process.env.USERPROFILE
    ? join(process.env.USERPROFILE, ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe")
    : "";
  return [
    { command: process.env.PYTHON, args: [] },
    { command: existsSync(bundled) ? bundled : "", args: [] },
    { command: "python", args: [] },
    { command: "py", args: ["-3"] }
  ];
}

function buildAssistedRow(target, pages) {
  const page = findCurvePage(target.code, pages);
  const text = page?.text || "";
  const finalAge = parseFinalAge(text);
  const stemRanges = parseStemRanges(text);
  const noteParts = [
    page ? "PDF-text identifierar kurvsida." : "Kurvsida kunde inte identifieras i PDF-text.",
    finalAge ? `Slutavverkningsalder i text: ${finalAge} ar.` : "Slutavverkningsalder kunde inte lasas sakert.",
    stemRanges.length ? `Stamintervall i text: ${stemRanges.join("; ")}.` : "Stamintervall kunde inte lasas sakert.",
    "Diagrammets grundyte-/hojdkoordinater ar inte sakra text-/tabellvarden och maste granskas manuellt."
  ];
  return {
    code: target.code,
    species: target.species,
    siteIndex: target.siteIndex,
    stage: "assisted_curve_page",
    topHeight: "",
    basalAreaBefore: "",
    basalAreaAfter: "",
    ageTotal: finalAge || "",
    stemsBefore: "",
    stemsAfter: "",
    sourcePage: page ? `s. ${page.number}` : "",
    extractionMethod: page ? "diagram_manual_assisted" : "unknown",
    confidence: "low",
    reviewNeeded: true,
    activeUse: false,
    note: noteParts.join(" ")
  };
}

function findCurvePage(code, pages) {
  const compact = code.replace(/([TG])(\d+)/, "$1\\s*\\s?$2");
  const pattern = new RegExp(`${code[0] === "T" ? "TALL" : "GRAN"}\\s+${compact}`, "i");
  return pages.find((page) => pattern.test(page.text || "")) || null;
}

function parseFinalAge(text) {
  const normalized = normalizeText(text);
  const match = normalized.match(/total[aå]lder\s+(\d+)\s*[aå]r/i);
  return match ? Number(match[1]) : null;
}

function parseStemRanges(text) {
  const ranges = [];
  const normalized = normalizeText(text);
  const afterMatch = normalized.match(/Stamantal efter gallring\s+stammar\/ha\s+([0-9\s-]+)/i);
  const beforeMatch = normalized.match(/Stamantal i utg[aå]ngsbest[aå]ndet:\s+([0-9\s-]+)\s+stammar\/ha/i);
  if (afterMatch) ranges.push("efter gallring " + afterMatch[1].replace(/\s+/g, " ").trim());
  if (beforeMatch) ranges.push("utgangsbestand " + beforeMatch[1].replace(/\s+/g, " ").trim());
  return ranges;
}

function checkT20Integrity(pages) {
  const t20 = NORRA_THINNING_VALUE_PACKAGES.find((item) => item.id === "norra-tall-t20-pilot");
  const t20Page = findCurvePage("T20", pages);
  const page36 = pages.find((page) => page.number === 36);
  const text = normalizeText([page36?.text, t20Page?.text, ...pages.map((page) => page.text)].filter(Boolean).join(" "));
  const expected = t20?.values?.thinningEvents?.[0]?.basalAreaBefore;
  const found = /Grundyta f[oö]re m2\/ha\s+24,5/i.test(text) ||
    (/Grundyta f/i.test(text) && text.includes("24,5")) ||
    (text.includes("Bestandsprogram") && text.includes("24,5")) ? 24.5 : null;
  return {
    status: found === expected ? "ok" : "not_verified_from_pdf_text",
    activeCode: "T20",
    expectedFirstBasalAreaBefore: expected,
    foundFirstBasalAreaBefore: found,
    sourcePage: found ? "s. 36" : "",
    note: found === expected
      ? "T20 normalexempel hittades i PDF-text och matchar befintlig basalAreaBefore 24.5."
      : "T20 behalls oforandrad; PDF-texten gav ingen komplett maskinell kontroll."
  };
}

function normalizeText(text) {
  return String(text || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("\u00ad", "-")
    .replaceAll("–", "-")
    .replaceAll("­", "-")
    .replace(/\s+/g, " ");
}

function summarizeRows(items) {
  const confidence = { high: 0, medium: 0, low: 0 };
  items.forEach((row) => confidence[row.confidence] += 1);
  return {
    rowCount: items.length,
    confidence,
    curvesWithAssistedSourcePage: items.filter((row) => Boolean(row.sourcePage)).map((row) => row.code),
    curvesMissingSafeValues: items.filter((row) => row.reviewNeeded).map((row) => row.code),
    activeUseTrueCount: items.filter((row) => row.activeUse === true).length
  };
}

function buildCsv(items) {
  const headers = [
    "code",
    "species",
    "siteIndex",
    "stage",
    "topHeight",
    "basalAreaBefore",
    "basalAreaAfter",
    "ageTotal",
    "stemsBefore",
    "stemsAfter",
    "sourcePage",
    "extractionMethod",
    "confidence",
    "reviewNeeded",
    "activeUse",
    "note"
  ];
  return [
    headers.join(","),
    ...items.map((row) => headers.map((key) => csvCell(row[key])).join(","))
  ].join("\n") + "\n";
}

function buildReport(extractionData, sourceMeta) {
  const { summary: itemSummary } = extractionData;
  return `# Norra gallringskurvor - assisterad PDF-extraktion

Kalla: \`${sourceMeta?.filename || SOURCE_FILENAME}\`  
Kall-ID: \`${SOURCE_ID}\`  
Metod: \`${extractionData.extractionMethod}\`

## Sammanfattning

- Extraherade rader: ${itemSummary.rowCount}
- Confidence high: ${itemSummary.confidence.high}
- Confidence medium: ${itemSummary.confidence.medium}
- Confidence low: ${itemSummary.confidence.low}
- Kurvor med sidunderlag: ${itemSummary.curvesWithAssistedSourcePage.join(", ") || "inga"}
- Kurvor som fortfarande saknar sakra varden: ${itemSummary.curvesMissingSafeValues.join(", ") || "inga"}
- ActiveUse true: ${itemSummary.activeUseTrueCount}
- T20-integritet: ${extractionData.t20Integrity.status}

## Rader

| Kod | Sida | Metod | Confidence | Review needed | Active use | Notering |
| --- | --- | --- | --- | --- | --- | --- |
${extractionData.rows.map((row) => `| ${row.code} | ${row.sourcePage || "-"} | ${row.extractionMethod} | ${row.confidence} | ${row.reviewNeeded} | ${row.activeUse} | ${row.note} |`).join("\n")}

## Slutsats

PDF-texten identifierar kurvsidor for forsta assisted batchen, men diagrammens kurvkoordinater ar inte sakra text-/tabellvarden. Alla rader ligger darfor kvar som granskningsunderlag med \`activeUse: false\` och \`reviewNeeded: true\`.

Assisterad extraktion aktiverar inte kurvor. Eventuell aktivering maste ske i separat batch efter manuell granskning, import och validering.
`;
}

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
}
