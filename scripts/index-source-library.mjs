import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const sourcesDir = path.join(projectRoot, "sources");
const libraryPath = path.join(projectRoot, "data", "source-library.json");
const reportPath = path.join(projectRoot, "docs", "generated", "source-library-report.md");

const files = await readSourceFiles();
const library = JSON.parse(await readFile(libraryPath, "utf8"));
const indexedFilenames = new Set(library.map((source) => source.filename));
const sourceFilenames = new Set(files.map((file) => file.name));

const missingInIndex = files.filter((file) => !indexedFilenames.has(file.name));
const missingFiles = library.filter((source) => !sourceFilenames.has(source.filename));

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, buildReport(files, library, missingInIndex, missingFiles), "utf8");

console.log(`Källindex klart: ${library.length} indexposter, ${files.length} filer i sources/.`);
console.log(`Rapport skapad: ${path.relative(projectRoot, reportPath)}`);
if (missingInIndex.length) {
  console.warn(`Filer saknas i index: ${missingInIndex.map((file) => file.name).join(", ")}`);
}
if (missingFiles.length) {
  console.warn(`Indexposter saknar fil: ${missingFiles.map((source) => source.filename).join(", ")}`);
}

async function readSourceFiles() {
  const entries = await readdir(sourcesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      name: entry.name,
      extension: path.extname(entry.name).toLowerCase() || "(ingen)"
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
}

function buildReport(files, library, missingInIndex, missingFiles) {
  const now = new Date().toISOString().slice(0, 10);
  const byType = countBy(library, (source) => source.sourceType);
  const byStatus = countBy(library, (source) => source.extractionStatus);
  const rows = library
    .slice()
    .sort((a, b) => a.filename.localeCompare(b.filename, "sv"))
    .map((source) => [
      source.id,
      source.filename,
      source.sourceType,
      source.areas.join(", ") || "-",
      source.extractionPriority,
      source.extractionStatus,
      source.canContainNumericValues ? "ja" : "nej",
      source.canActivateDirectly ? "ja" : "nej"
    ]);

  return [
    "# Source library report",
    "",
    `Genererad: ${now}`,
    "",
    "## Sammanfattning",
    "",
    `- Filer i sources/: ${files.length}`,
    `- Indexposter: ${library.length}`,
    `- Filer som saknas i index: ${missingInIndex.length}`,
    `- Indexposter vars fil saknas: ${missingFiles.length}`,
    "",
    "## Per sourceType",
    "",
    ...mapCounts(byType),
    "",
    "## Per extraktionsstatus",
    "",
    ...mapCounts(byStatus),
    "",
    "## Saknade filer i index",
    "",
    ...(missingInIndex.length ? missingInIndex.map((file) => `- ${file.name}`) : ["- Inga."]),
    "",
    "## Indexposter vars fil saknas",
    "",
    ...(missingFiles.length ? missingFiles.map((source) => `- ${source.id}: ${source.filename}`) : ["- Inga."]),
    "",
    "## Index",
    "",
    "| id | fil | sourceType | områden | prioritet | status | numeriska värden | direkt aktiv |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map((row) => `| ${row.map(escapeMd).join(" | ")} |`),
    ""
  ].join("\n");
}

function countBy(items, getter) {
  return items.reduce((counts, item) => {
    const key = getter(item) || "(saknas)";
    counts.set(key, (counts.get(key) || 0) + 1);
    return counts;
  }, new Map());
}

function mapCounts(counts) {
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "sv"))
    .map(([key, value]) => `- ${key}: ${value}`);
}

function escapeMd(value) {
  return String(value ?? "").replaceAll("|", "\\|");
}
