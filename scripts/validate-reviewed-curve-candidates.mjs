import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getActiveNorraPackages,
  NORRA_THINNING_VALUE_PACKAGES
} from "../js/calculators/norraThinningValues.js";
import { SITE_INDEX_CURVES } from "../js/calculators/siteIndexCurves.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CANDIDATE_PATH = join(ROOT, "data", "norra-thinning-reviewed-candidates.json");
const EXPECTED_T20_EVENTS = [
  { label: "1:a gallring", topHeight: 14.5, basalAreaBefore: 24.5, basalAreaAfter: 18.5, ageTotal: 59, stemsBefore: 1650, stemsAfter: 1100 },
  { label: "2:a gallring", topHeight: 18.0, basalAreaBefore: 28.0, basalAreaAfter: 20.5, ageTotal: 82, stemsBefore: 1100, stemsAfter: 700 },
  { label: "Slutavverkning enligt exempel", topHeight: 22.0, basalAreaBefore: 31.5, basalAreaAfter: 0, ageTotal: 125, stemsBefore: 700, stemsAfter: 0 }
];

const errors = [];

if (!existsSync(CANDIDATE_PATH)) {
  errors.push("data/norra-thinning-reviewed-candidates.json saknas.");
}

const workspace = existsSync(CANDIDATE_PATH)
  ? JSON.parse(await readFile(CANDIDATE_PATH, "utf8"))
  : { candidates: [] };
const candidates = Array.isArray(workspace.candidates) ? workspace.candidates : [];
const active = getActiveNorraPackages();
const activeCodes = active.map((item) => `${item.speciesCode}${item.siteIndex}`).sort();
const t20 = NORRA_THINNING_VALUE_PACKAGES.find((item) => item.id === "norra-tall-t20-pilot");

if (workspace.activeUse !== false) errors.push("Root activeUse maste vara false.");
if (workspace.canActivateCurves !== false) errors.push("Root canActivateCurves maste vara false.");
if (workspace.canChangeProductionRules !== false) errors.push("Root canChangeProductionRules maste vara false.");
if (!Array.isArray(workspace.candidates)) errors.push("Root candidates maste vara en array.");

candidates.forEach(validateCandidate);

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
  console.error("Reviewed curve candidates ar inte validerade:");
  errors.forEach((error) => console.error("- " + error));
  process.exit(1);
}

console.log(`Reviewed curve candidates OK: ${candidates.length} kandidater, aktiva kurvor T18/T20, T20 oforandrad, auto-SI sparrad.`);

function validateCandidate(candidate, index) {
  const label = candidate.code || `candidate ${index + 1}`;
  ["code", "species", "siteIndex", "sourcePage", "dataQuality", "points"].forEach((field) => {
    if (candidate[field] === undefined || candidate[field] === "" || candidate[field] === null) {
      errors.push(`${label}: ${field} saknas.`);
    }
  });

  if (candidate.status === "active_verified") {
    errors.push(`${label}: candidate far inte ha status active_verified.`);
  }

  if (candidate.status !== "reviewed_candidate") {
    errors.push(`${label}: status maste vara reviewed_candidate.`);
  }

  if (candidate.activeUse !== false) {
    errors.push(`${label}: activeUse maste vara false.`);
  }

  if (candidate.dataQuality !== "manually_reviewed_from_source") {
    errors.push(`${label}: dataQuality maste vara manually_reviewed_from_source.`);
  }

  if (!Array.isArray(candidate.points) || candidate.points.length < 1) {
    errors.push(`${label}: points maste innehalla minst en punkt.`);
    return;
  }

  candidate.points.forEach((point, pointIndex) => validatePoint(label, point, pointIndex));

  ["price", "pricing", "legalDecision", "legalConclusion", "lawDecision"].forEach((field) => {
    if (Object.hasOwn(candidate, field)) {
      errors.push(`${label}: forbjudet falt ${field}.`);
    }
  });
}

function validatePoint(label, point, index) {
  const prefix = `${label}/point ${index + 1}`;
  if (!point.sourcePage) errors.push(`${prefix}: sourcePage saknas.`);
  if (!Number.isFinite(Number(point.topHeight)) || Number(point.topHeight) <= 0) {
    errors.push(`${prefix}: topHeight maste vara > 0.`);
  }

  const before = Number(point.basalAreaBefore);
  const after = Number(point.basalAreaAfter);
  if (!Number.isFinite(before) || !Number.isFinite(after) || before <= after) {
    errors.push(`${prefix}: basalAreaBefore maste vara storre an basalAreaAfter.`);
  }

  const stemsBefore = nullableNumber(point.stemsBefore);
  const stemsAfter = nullableNumber(point.stemsAfter);
  if (stemsBefore !== null && stemsAfter !== null && stemsBefore < stemsAfter) {
    errors.push(`${prefix}: stemsBefore maste vara >= stemsAfter.`);
  }
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
