import { findSiteIndexCurves, hasSiteIndexCurveData } from "./siteIndexCurves.js";

const SPECIES_CODES = {
  tall: "T",
  gran: "G",
  bjork: "B",
  blandat: "M"
};

export function estimateSiteIndex(input = {}) {
  const speciesCode = SPECIES_CODES[input.mainSpecies] || "";
  const manualSiteIndex = toNumber(input.siteIndex);
  const heightMeters = toNumber(input.heightMeters);
  const ageYears = toNumber(input.ageYears);
  const ageType = clean(input.ageType) || "osaker";
  const warnings = [];
  const missing = [];
  const sourceNotes = [
    "Auto-SI bygger bara på källstödda höjdutvecklingskurvor när sådana finns inlagda i appen.",
    "Interceptmetod och ståndortsegenskaper är förberedda som struktur men används inte i snabbvyn utan källunderlag."
  ];

  if (manualSiteIndex !== null && speciesCode) {
    return {
      siteIndex: speciesCode + formatSiteIndex(manualSiteIndex),
      numericSiteIndex: manualSiteIndex,
      speciesCode,
      method: "Manuellt angivet",
      confidence: "medium",
      sourceNotes,
      warnings,
      missing
    };
  }

  if (!speciesCode || speciesCode === "M") missing.push("huvudträdslag för SI");
  if (heightMeters === null) missing.push("höjd");
  if (ageYears === null) missing.push("ålder");

  if (input.mainSpecies === "bjork") {
    warnings.push("Björk har svagare/ofullständigt SI-underlag i denna version.");
  }

  if (missing.length) {
    return missingResult(speciesCode, sourceNotes, warnings, missing);
  }

  if (!hasSiteIndexCurveData(speciesCode)) {
    missing.push("källstödd höjdutvecklingskurva");
    warnings.push("SI saknas - välj manuellt eller gör fördjupad bonitering.");
    return missingResult(speciesCode, sourceNotes, warnings, missing);
  }

  const curves = findSiteIndexCurves(speciesCode);
  const nearest = curves
    .map((curve) => ({
      curve,
      distance: Math.abs(interpolateHeight(curve.points, ageYears) - heightMeters)
    }))
    .filter((candidate) => Number.isFinite(candidate.distance))
    .sort((a, b) => a.distance - b.distance)[0];

  if (!nearest) {
    missing.push("kurvpunkt för ålder");
    return missingResult(speciesCode, sourceNotes, warnings, missing);
  }

  if (ageType !== "brosthojdsalder") {
    warnings.push("SI är osäkrare eftersom brösthöjdsålder inte är bekräftad.");
  }

  return {
    siteIndex: speciesCode + formatSiteIndex(nearest.curve.siteIndex),
    numericSiteIndex: nearest.curve.siteIndex,
    speciesCode,
    method: "Höjd + ålder",
    confidence: ageType === "brosthojdsalder" ? "medium" : "low",
    sourceNotes,
    warnings,
    missing
  };
}

function missingResult(speciesCode, sourceNotes, warnings, missing) {
  return {
    siteIndex: null,
    numericSiteIndex: null,
    speciesCode,
    method: "Saknas",
    confidence: "low",
    sourceNotes,
    warnings,
    missing
  };
}

function interpolateHeight(points, ageYears) {
  if (!Array.isArray(points) || points.length === 0) return Number.NaN;
  const sorted = [...points].sort((a, b) => a.age - b.age);
  const exact = sorted.find((point) => point.age === ageYears);
  if (exact) return exact.height;
  const lower = [...sorted].reverse().find((point) => point.age < ageYears);
  const upper = sorted.find((point) => point.age > ageYears);
  if (!lower || !upper) return Number.NaN;
  const share = (ageYears - lower.age) / (upper.age - lower.age);
  return lower.height + (upper.height - lower.height) * share;
}

function formatSiteIndex(value) {
  return String(Math.round(value)).padStart(2, "0");
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function clean(value) {
  return String(value ?? "").trim();
}
