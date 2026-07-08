const NORRA_SOURCE_NAME = "Gallringsriktlinjer & gallringsmallar, norra Sverige";
const NORRA_SOURCE_REF = "Gallringsriktlinjer & gallringsmallar norra Sverige";
const NORRA_REGION = "norra-sverige";

const NORRA_CANDIDATE_SITE_INDICES = {
  tall: [14, 16, 18, 22, 24, 26, 28],
  gran: [16, 18, 20, 22, 24, 26, 28, 30, 32]
};

const ACTIVE_CURVE_STATUSES = new Set(["active_pilot", "verified"]);
const ACTIVE_CURVE_QUALITIES = new Set(["verified_text", "verified_table", "pilot_example", "chart_digitized_verified"]);
const ACTIVE_CURVE_USES = new Set(["chart_reference", "full_curve"]);

export const NORRA_THINNING_VALUE_PACKAGES = [
  {
    id: "norra-tall-t20-pilot",
    sourceName: NORRA_SOURCE_NAME,
    sourceType: "regional_curve",
    sourceYear: null,
    sourceRef: NORRA_SOURCE_REF,
    sourcePage: "s. 36, exempel normalfall T20",
    species: "tall",
    speciesCode: "T",
    siteIndex: 20,
    region: NORRA_REGION,
    area: "thinning",
    actionType: "gallring",
    title: "T20-exempel normalfall",
    description: "Direkta exempelvärden för tall T20 i norra Sverige.",
    status: "active_pilot",
    precision: "direct_text_example",
    dataQuality: "pilot_example",
    confidence: "medium",
    activeUse: "chart_reference",
    canCreateFullCurve: false,
    canAloneGiveHighConfidence: false,
    reviewNeeded: false,
    extractionNotes: ["Direkt text-/exempelvärde från angiven källa. Används som pilot, inte full kurva."],
    draftValues: [],
    limitations: [
      "Exempelvärden, inte komplett digitaliserad kurva.",
      "Gäller T20-exempel för norra Sverige.",
      "Ska jämföras mot komplett mall innan åtgärdsbeslut."
    ],
    validation: {
      hasExactSource: true,
      hasUnits: true,
      valueSchema: [
        { parameter: "topHeight", unit: "m" },
        { parameter: "basalAreaBefore", unit: "m2/ha" },
        { parameter: "basalAreaAfter", unit: "m2/ha" },
        { parameter: "ageTotal", unit: "år" },
        { parameter: "stemsBefore", unit: "st/ha" },
        { parameter: "stemsAfter", unit: "st/ha" }
      ],
      notes: ["Aktiv pilot enligt tidigare version. Inte full kurva."]
    },
    values: {
      thinningEvents: [
        {
          label: "1:a gallring",
          topHeight: 14.5,
          basalAreaBefore: 24.5,
          basalAreaAfter: 18.5,
          ageTotal: 59,
          stemsBefore: 1650,
          stemsAfter: 1100
        },
        {
          label: "2:a gallring",
          topHeight: 18.0,
          basalAreaBefore: 28.0,
          basalAreaAfter: 20.5,
          ageTotal: 82,
          stemsBefore: 1100,
          stemsAfter: 700
        },
        {
          label: "Slutavverkning enligt exempel",
          topHeight: 22.0,
          basalAreaBefore: 31.5,
          basalAreaAfter: 0,
          ageTotal: 125,
          stemsBefore: 700,
          stemsAfter: 0
        }
      ]
    }
  },
  ...candidatePackages("tall", "T", NORRA_CANDIDATE_SITE_INDICES.tall),
  ...candidatePackages("gran", "G", NORRA_CANDIDATE_SITE_INDICES.gran)
];

export function isActiveNorraPackage(source = {}) {
  return ACTIVE_CURVE_STATUSES.has(source.status) &&
    ACTIVE_CURVE_QUALITIES.has(source.dataQuality) &&
    ACTIVE_CURVE_USES.has(source.activeUse) &&
    source.reviewNeeded === false;
}

export function getNorraPackage(speciesCode, siteIndex, region = NORRA_REGION) {
  const normalizedCode = String(speciesCode || "").toUpperCase();
  const numericSiteIndex = Number(siteIndex);
  return NORRA_THINNING_VALUE_PACKAGES.find((item) =>
    item.speciesCode === normalizedCode &&
    item.siteIndex === numericSiteIndex &&
    (item.region === region || region === "okand")
  ) || null;
}

export function getActiveNorraPackages() {
  return NORRA_THINNING_VALUE_PACKAGES.filter(isActiveNorraPackage);
}

export function getReviewNeededNorraPackages() {
  return NORRA_THINNING_VALUE_PACKAGES.filter((item) => item.reviewNeeded === true);
}

export function getVerifiedCandidateNorraPackages() {
  return NORRA_THINNING_VALUE_PACKAGES.filter((item) => item.status === "verified_candidate");
}

export function getDraftDigitizedNorraPackages() {
  return NORRA_THINNING_VALUE_PACKAGES.filter((item) => item.status === "draft_digitized");
}

function candidatePackages(species, speciesCode, siteIndices) {
  return siteIndices.map((siteIndex) => ({
    id: "norra-" + species + "-" + speciesCode.toLowerCase() + siteIndex + "-candidate",
    sourceName: NORRA_SOURCE_NAME,
    sourceType: "regional_curve",
    sourceYear: null,
    sourceRef: NORRA_SOURCE_REF,
    sourcePage: "",
    status: "candidate",
    precision: "documentation_only",
    dataQuality: "candidate_only",
    confidence: "low",
    area: "thinning",
    actionType: "gallring",
    species,
    speciesCode,
    siteIndex,
    region: NORRA_REGION,
    title: speciesCode + siteIndex + " identifierad gallringsmall",
    description: "Gallringsmall identifierad i källmaterial men inte digitaliserad/verifierad i appen.",
    values: [],
    draftValues: [],
    extractionNotes: ["Identifierad mall. Inga verifierade punktvärden är inlagda."],
    limitations: ["Kurvan finns i källmaterial men är inte digitaliserad/verifierad i appen."],
    validation: {
      hasExactSource: false,
      hasUnits: false,
      valueSchema: [],
      notes: ["Kandidat från batchimport. Kräver källa, sida/tabell/diagram, enheter och testfall innan aktivering."]
    },
    activeUse: "documentation_only",
    canCreateFullCurve: false,
    canAloneGiveHighConfidence: false,
    reviewNeeded: true
  }));
}
