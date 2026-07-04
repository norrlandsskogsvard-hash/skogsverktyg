export const SKOTSEL_SOURCE_DOCUMENTS = [
  "docs/skotselkollen-kallmatris.md",
  "docs/skotselkollen-beslutsmodell.md",
  "docs/skotselkollen-lagkontroll.md",
  "docs/skotselkollen-input-output.md",
  "docs/skotselkollen-kurvdata.md",
  "docs/skotselkollen-kallviktning.md"
];

export const EVIDENCE_TYPE_WEIGHTS = {
  law: 100,
  research: 80,
  regional_curve: 70,
  decision_support_reference: 50,
  scenario_reference: 45,
  practice_guide: 35,
  field_observation: 60,
  warning: 75
};

export const SKOTSEL_SOURCE_RULES = [
  {
    id: "missing-source-matrix",
    type: "documentationOnly",
    area: "source",
    species: "all",
    region: "all",
    variable: "sourceMatrix",
    valueRange: null,
    unit: "",
    source: "Skötselkollen källdokument saknas i denna checkout",
    page: "",
    confidence: "low",
    note: "Inga numeriska röjnings-, gallrings- eller slutavverkningsgränser används som skarpa beslut utan komplett källmatris."
  },
  {
    id: "legal-control-separate",
    type: "documentationOnly",
    area: "legal",
    species: "all",
    region: "all",
    variable: "legalFlags",
    valueRange: null,
    unit: "",
    source: "Användarkrav för Skötselkollen v1",
    page: "",
    confidence: "medium",
    note: "Juridisk kontroll redovisas separat från skoglig bedömning och är inte ett avverkningsbeslut."
  },
  {
    id: "birch-separate-track",
    type: "documentationOnly",
    area: "species",
    species: "bjork",
    region: "all",
    variable: "speciesTrack",
    valueRange: null,
    unit: "",
    source: "Användarkrav för Skötselkollen v1",
    page: "",
    confidence: "medium",
    note: "Björk hanteras som eget spår. Tall- eller granmall används inte som ersättning."
  }
];

export const THINNING_CURVES = [
  {
    id: "norra-tall-t20-pilot",
    species: "tall",
    speciesCode: "T",
    siteIndex: 20,
    region: "norra-sverige",
    source: "Gallringsriktlinjer & gallringsmallar norra Sverige",
    sourcePage: "s. 36, exempel normalfall T20",
    status: "pilot",
    precision: "text-example",
    confidence: "medium",
    limitations: [
      "Bygger på exempelvärden, inte full digitaliserad kurva.",
      "Ska inte användas som komplett gallringsmall.",
      "Används för att testa kurvfunktion och visning."
    ],
    points: {
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
  }
];

export const SKOTSEL_EVIDENCE_ITEMS = [
  {
    id: "skogsvardslagen-legal-control",
    type: "law",
    source: "skogsvardslagen",
    sourceLabel: "Skogsvårdslagen och lagkrav",
    area: "legal",
    species: "all",
    region: "all",
    appliesTo: ["all"],
    claim: "Lagkrav och hänsyn kan kräva kontroll innan åtgärd används i planering.",
    strength: "blockingWhenFlagged",
    weight: EVIDENCE_TYPE_WEIGHTS.law,
    confidence: "high",
    limitations: ["Appen ersätter inte juridisk kontroll, anmälan, tillstånd eller samråd."],
    notes: ["Lagkrav ska kunna stoppa eller kräva kontroll även när skogliga data pekar mot åtgärd."]
  },
  {
    id: "research-thinning-principles",
    type: "research",
    source: "skogsskotselserien-forskning",
    sourceLabel: "Skogsskötselserien/forskning",
    area: "silviculture",
    species: "all",
    region: "all",
    appliesTo: ["curve_reference_pilot", "curve_missing", "final_felling_check", "conservation_check"],
    claim: "Skogliga åtgärder ska vägas mot beståndets stabilitet, vitalitet, hänsyn och mätosäkerhet.",
    strength: "generalPrinciple",
    weight: EVIDENCE_TYPE_WEIGHTS.research,
    confidence: "medium",
    limitations: ["Ingen komplett art- och SI-specifik forskningsmatris är inlagd i appen ännu."],
    notes: ["Väger tyngre än praktiska mallar men ger inte ensam en exakt kurvstatus."]
  },
  {
    id: "regional-t20-pilot",
    type: "regional_curve",
    source: "gallringsmallar-norra-sverige",
    sourceLabel: "Gallringsriktlinjer & gallringsmallar norra Sverige",
    area: "thinning",
    species: "tall",
    region: "norra-sverige",
    appliesTo: ["curve_reference_pilot"],
    claim: "T20-exempel för tall i norra Sverige kan användas som källstött pilotunderlag.",
    strength: "pilot",
    weight: EVIDENCE_TYPE_WEIGHTS.regional_curve,
    confidence: "medium",
    limitations: ["Pilot/exempel, inte full digitaliserad gallringskurva."],
    notes: ["Ska användas som jämförelse och inte som facit."]
  },
  {
    id: "ingvar-reference",
    type: "decision_support_reference",
    source: "ingvar",
    sourceLabel: "INGVAR",
    area: "decisionSupport",
    species: "all",
    region: "all",
    appliesTo: ["curve_reference_pilot", "curve_missing", "final_felling_check", "conservation_check"],
    claim: "INGVAR används som referens för arbetsgång och variabler i gallringsbeslut.",
    strength: "reference",
    weight: EVIDENCE_TYPE_WEIGHTS.decision_support_reference,
    confidence: "medium",
    limitations: ["INGVAR är inte facit och ersätter inte källstödd kurva eller fältkontroll."],
    notes: ["Stödjer spårbar struktur men skapar inte ensam hög säkerhet."]
  },
  {
    id: "heureka-reference",
    type: "scenario_reference",
    source: "heureka",
    sourceLabel: "Heureka",
    area: "scenario",
    species: "all",
    region: "all",
    appliesTo: ["curve_reference_pilot", "curve_missing", "final_felling_check"],
    claim: "Heureka används som referensram för långsiktiga scenarier och beslut, inte som fältgräns.",
    strength: "reference",
    weight: EVIDENCE_TYPE_WEIGHTS.scenario_reference,
    confidence: "medium",
    limitations: ["Ger inte skarp gallringsgräns i denna appversion."],
    notes: ["Används för att sätta fältbedömningen i planeringssammanhang."]
  },
  {
    id: "norra-skog-2024-practice",
    type: "practice_guide",
    source: "norra-skog-2024",
    sourceLabel: "Norra Skog 2024",
    area: "practice",
    species: "all",
    region: "norra-sverige",
    appliesTo: ["curve_reference_pilot", "curve_missing", "final_felling_check"],
    claim: "Praktiska skötselmallar kan stödja fältkontroll och arbetsflöde.",
    strength: "support",
    weight: EVIDENCE_TYPE_WEIGHTS.practice_guide,
    confidence: "low",
    limitations: ["Practice guide är stöd, inte facit, och får aldrig ensam ge hög säkerhet."],
    notes: ["Ska visas som praktiskt stöd under källor och antaganden."]
  },
  {
    id: "field-observation-core-values",
    type: "field_observation",
    source: "field-input",
    sourceLabel: "Fältobservationer",
    area: "field",
    species: "all",
    region: "all",
    appliesTo: ["all"],
    claim: "Inmatad höjd, grundyta, trädslag och SI/DGV/stamantal är fältdata som driver snabbbedömningen.",
    strength: "input",
    weight: EVIDENCE_TYPE_WEIGHTS.field_observation,
    confidence: "medium",
    limitations: ["Fältdata behöver kontrolleras mot flera provpunkter och beståndets jämnhet."],
    notes: ["Fältobservationer kan stödja men också sänka säkerhet när varningsflaggor finns."]
  }
];

export function findGallringZone(input = {}, siteIndexEstimate = {}) {
  const numericSiteIndex = siteIndexEstimate.numericSiteIndex ?? input.siteIndex;
  const curve = THINNING_CURVES.find((candidate) =>
    candidate.species === input.mainSpecies &&
    candidate.siteIndex === numericSiteIndex &&
    regionMatches(candidate.region, input.region)
  );

  if (!curve) return null;

  if (curve.status === "pilot") {
    return {
      type: "thinningCurve",
      actionCode: "curve_reference_pilot",
      actionLabel: "Pilotunderlag",
      confidence: curve.confidence,
      status: curve.status,
      precision: curve.precision,
      curve,
      explanation: "Källstött T20-exempel finns för tall i norra Sverige. Det är ett pilot-/exempelprogram, inte en full gallringskurva.",
      recommendation: "Använd som jämförelse mot T20-exemplet. Kontrollera full regional gallringsmall innan åtgärdsförslag."
    };
  }

  return {
    type: "thinningCurve",
    actionCode: "curve_monitor",
    actionLabel: "Kurvunderlag",
    confidence: curve.confidence,
    status: curve.status,
    precision: curve.precision,
    curve,
    explanation: "Beståndets punkt har jämförts mot inlagd gallringskurva.",
    recommendation: "Kontrollera stabilitet, kronlängd, bärighet och hänsyn innan förslag skrivs."
  };
}

export function buildEvidenceAssessment(input = {}, baseRecommendation = {}) {
  const evidenceItems = buildEvidenceItems(input, baseRecommendation);
  const legalBlocks = evidenceItems.filter((item) => item.type === "law" && item.strength === "blockingWhenFlagged" && isLegalFlagged(input));
  const fieldWarnings = [
    ...buildFieldWarnings(input, baseRecommendation),
    ...buildRegionWarnings(input, baseRecommendation)
  ];
  const supportingEvidence = evidenceItems.filter((item) => supportsRecommendation(item, input, baseRecommendation));
  const conflictingEvidence = [
    ...missingEvidence(input, baseRecommendation),
    ...fieldWarnings
  ];
  const sourceBalance = balanceByType(evidenceItems);
  const combinedConfidence = combineConfidence(baseRecommendation.confidence, supportingEvidence, conflictingEvidence, legalBlocks);

  return {
    evidenceItems,
    supportingEvidence,
    conflictingEvidence,
    legalBlocks,
    fieldWarnings,
    combinedConfidence,
    evidenceSummary: buildEvidenceSummary(baseRecommendation, supportingEvidence, conflictingEvidence, legalBlocks, combinedConfidence),
    fieldSummary: buildFieldSummary(input, baseRecommendation, supportingEvidence, conflictingEvidence, legalBlocks),
    sourceBalance
  };
}

export function sourceNotesForInput(input = {}) {
  const notes = SKOTSEL_SOURCE_RULES.map((rule) => rule.note);

  if (input.mainSpecies === "bjork") {
    notes.push("Björkspåret saknar granskade numeriska källvärden i denna checkout.");
  }

  if (input.mainSpecies === "blandat") {
    notes.push("Blandbestånd kräver manuell kontroll av trädslagsblandning, skiktning och målbild innan mall används.");
  }

  notes.push("Gallringszon visas bara när kunskapsbasen innehåller granskad komplett zondata. T20-underlaget är pilot/exempel, inte full kurva.");
  notes.push("INGVAR används endast som referens för arbetsgång och variabler, inte som direkt facit.");
  notes.push("Heureka används som referens för långsiktigt scenario- och beslutsstöd, inte som direkt fältgräns.");
  notes.push("Gallringsmallar norra Sverige används som kommande källa för tall/gran när källmatris är inlagd.");
  notes.push("Björk saknar ännu fullständig granskad kurva i appens kunskapsbas.");
  return [...new Set(notes)];
}

function buildEvidenceItems(input, baseRecommendation) {
  const baseItems = SKOTSEL_EVIDENCE_ITEMS.filter((item) => evidenceApplies(item, input, baseRecommendation));
  const warningItems = [
    ...buildFieldWarnings(input, baseRecommendation),
    ...buildRegionWarnings(input, baseRecommendation)
  ];
  return [...baseItems, ...warningItems];
}

function evidenceApplies(item, input, baseRecommendation) {
  const actionCode = baseRecommendation.actionCode || "";
  const speciesOk = item.species === "all" || item.species === input.mainSpecies;
  const regionOk = item.region === "all" || regionMatches(item.region, input.region);
  const actionOk = item.appliesTo.includes("all") || item.appliesTo.includes(actionCode);
  return speciesOk && regionOk && actionOk;
}

function supportsRecommendation(item, input, baseRecommendation) {
  if (item.type === "warning") return false;
  if (item.type === "law") return !isLegalFlagged(input);
  if (item.type === "regional_curve") return baseRecommendation.actionCode === "curve_reference_pilot";
  return evidenceApplies(item, input, baseRecommendation);
}

function buildFieldWarnings(input, baseRecommendation) {
  const warnings = [];

  if (input.conservation === "ja" || input.conservation === "osakert") {
    warnings.push(warningItem("field-conservation", "Naturvärden/kulturmiljö är markerade eller osäkra.", "legal"));
  }

  if (input.reindeerMountain === "ja" || input.reindeerMountain === "osakert") {
    warnings.push(warningItem("field-reindeer", "Rennäring/fjällnära läge kräver juridisk kontroll.", "legal"));
  }

  if (input.productiveForest && input.productiveForest !== "ja") {
    warnings.push(warningItem("field-productive-forest", "Produktiv skogsmark är inte bekräftad.", "legal"));
  }

  if (input.damage === "tydliga" || input.damage === "svara") {
    warnings.push(warningItem("field-damage", "Skador är markerade och kan sänka säkerheten.", "field"));
  }

  if (input.bearing === "svag_blot") {
    warnings.push(warningItem("field-bearing", "Svag eller blöt bärighet är markerad.", "field"));
  }

  if (input.snowWindRisk === "ja") {
    warnings.push(warningItem("field-snow-wind", "Snö- eller vindrisk är markerad.", "field"));
  }

  if (baseRecommendation.actionCode === "curve_missing") {
    warnings.push(warningItem("missing-curve", "Regional gallringskurva saknas för vald kombination.", "source"));
  }

  if (input.mainSpecies === "bjork") {
    warnings.push(warningItem("missing-birch-curve", "Björkkurva och granskad forskningsregel saknas i appen.", "source"));
  }

  return warnings;
}

function buildRegionWarnings(input, baseRecommendation) {
  if (input.region !== "okand") return [];

  if (baseRecommendation.actionCode === "curve_reference_pilot") {
    return [warningItem("unknown-region-regional-reference", "Region är okänd. Regionalt underlag används bara som jämförelse.", "source")];
  }

  if (baseRecommendation.actionCode === "curve_missing") {
    return [warningItem("unknown-region-no-curve", "Välj region för att kunna jämföra mot regionala mallar.", "source")];
  }

  return [];
}

function missingEvidence(input, baseRecommendation) {
  const missing = [];

  if (baseRecommendation.actionCode === "curve_missing" && input.mainSpecies !== "bjork") {
    missing.push(warningItem("missing-regional-curve", "Regional gallringsmall saknas eller är inte inlagd för vald SI/trädslag.", "source"));
  }

  if (!["curve_reference_pilot"].includes(baseRecommendation.actionCode)) {
    missing.push(warningItem("missing-complete-curve", "Full digitaliserad gallringskurva saknas ännu.", "source"));
  }

  if (input.mainSpecies === "bjork") {
    missing.push(warningItem("missing-birch-research", "Björk saknar komplett källstödd kurva/forskningsregel i appen.", "source"));
  }

  return missing;
}

function combineConfidence(baseConfidence, supportingEvidence, conflictingEvidence, legalBlocks) {
  if (legalBlocks.length) return "low";

  const supportingTypes = new Set(supportingEvidence.map((item) => item.type));
  const onlyPracticeGuide = supportingTypes.size === 1 && supportingTypes.has("practice_guide");
  if (onlyPracticeGuide) return capConfidence(baseConfidence, "medium");

  let confidence = baseConfidence || "low";
  if (supportingTypes.has("research") && supportingTypes.has("regional_curve") && supportingTypes.has("practice_guide")) {
    confidence = "medium";
  }

  if (conflictingEvidence.length) {
    confidence = lowerConfidence(confidence);
  }

  return confidence;
}

function buildEvidenceSummary(baseRecommendation, supportingEvidence, conflictingEvidence, legalBlocks, combinedConfidence) {
  if (legalBlocks.length) {
    return "Lag- eller hänsynsflaggor kräver kontroll innan skogligt förslag används. Säkerheten hålls därför på " + confidenceLabel(combinedConfidence) + ".";
  }

  const supportTypes = [...new Set(supportingEvidence.map((item) => typeLabel(item.type)))];
  const missingTypes = [...new Set(conflictingEvidence.map((item) => item.area === "source" ? item.claim : ""))].filter(Boolean);

  if (baseRecommendation.actionCode === "curve_reference_pilot") {
    return "Bedömningen bygger på pilotunderlag från T20-exempel och principer från gallringsbeslutsstöd. Full digitaliserad gallringskurva och forskningsmatris saknas ännu, därför hålls säkerheten på " + confidenceLabel(combinedConfidence) + ".";
  }

  return "Bedömningen stöds av " + (supportTypes.join(", ") || "fältdata") + ". " +
    (missingTypes.length ? "Saknas: " + missingTypes.join(" ") + " " : "") +
    "Samlad säkerhet: " + confidenceLabel(combinedConfidence) + ".";
}

function buildFieldSummary(input, baseRecommendation, supportingEvidence, conflictingEvidence, legalBlocks) {
  const actionCode = baseRecommendation.actionCode;
  const evidence = shortEvidence(input, actionCode, supportingEvidence);
  const missing = shortMissing(input, actionCode, conflictingEvidence);
  const legalPrefix = legalBlocks.length ? "Juridisk kontroll krävs. " : "";
  const regionSuffix = input.region === "okand" ? " Välj region för säkrare regional jämförelse." : "";

  if (actionCode === "curve_reference_pilot") {
    return {
      assessment: legalPrefix + "Beståndet kan jämföras mot T20-pilotunderlag, men full gallringskurva saknas." + regionSuffix,
      evidence,
      missing
    };
  }

  if (input.mainSpecies === "bjork") {
    return {
      assessment: legalPrefix + "Björkspåret kräver manuell fältbedömning eftersom björkkurva saknas." + regionSuffix,
      evidence,
      missing
    };
  }

  if (actionCode === "curve_missing") {
    return {
      assessment: legalPrefix + "Punkten kan visas, men regional kurva saknas för vald kombination." + regionSuffix,
      evidence,
      missing
    };
  }

  return {
    assessment: legalPrefix + "Bedömningen kräver fortsatt fältkontroll innan åtgärd används." + regionSuffix,
    evidence,
    missing
  };
}

function shortEvidence(input, actionCode, supportingEvidence) {
  if (actionCode === "curve_reference_pilot") {
    return ["T20-exempel", "gallringsbeslutsstöd", "praktiskt fältstöd"];
  }

  if (input.mainSpecies === "bjork") {
    return ["fältvärden", "björkspecifika kontrollpunkter"];
  }

  const hasResearch = supportingEvidence.some((item) => item.type === "research");
  const values = ["inmatade fältvärden"];
  if (hasResearch) values.push("generella gallringsprinciper");
  return values.slice(0, 3);
}

function shortMissing(input, actionCode, conflictingEvidence) {
  if (input.mainSpecies === "bjork") {
    return ["granskad björkkurva", "komplett björkregel"];
  }

  if (actionCode === "curve_reference_pilot") {
    return ["full digitaliserad kurva", "komplett regional mall"];
  }

  const missing = [];
  if (actionCode === "curve_missing") {
    missing.push(input.siteIndex ? sourceMissingLabel(input) : "SI eller kurva");
  }
  if (conflictingEvidence.some((item) => item.id === "missing-complete-curve")) {
    missing.push("full regional mall");
  }
  return [...new Set(missing)].slice(0, 3);
}

function sourceMissingLabel(input) {
  if (input.mainSpecies === "tall" && input.siteIndex) return "T" + Math.round(input.siteIndex) + "-kurva";
  if (input.mainSpecies === "gran" && input.siteIndex) return "G" + Math.round(input.siteIndex) + "-kurva";
  return "regional kurva";
}

function balanceByType(items) {
  return Object.keys(EVIDENCE_TYPE_WEIGHTS).reduce((balance, type) => {
    balance[type] = items.filter((item) => item.type === type).length;
    return balance;
  }, {});
}

function warningItem(id, claim, area) {
  return {
    id,
    type: "warning",
    source: "field-or-source-check",
    sourceLabel: area === "legal" ? "Lag/fältvarning" : "Fältvarningar",
    area,
    species: "all",
    region: "all",
    appliesTo: ["all"],
    claim,
    strength: "controlRequired",
    weight: EVIDENCE_TYPE_WEIGHTS.warning,
    confidence: "medium",
    limitations: ["Varningen kräver kontroll innan åtgärdsförslag används."],
    notes: []
  };
}

function isLegalFlagged(input) {
  return input.conservation === "ja" ||
    input.conservation === "osakert" ||
    input.reindeerMountain === "ja" ||
    input.reindeerMountain === "osakert" ||
    input.productiveForest === "nej" ||
    input.productiveForest === "osakert";
}

function regionMatches(curveRegion, inputRegion) {
  if (curveRegion === "norra-sverige") {
    return ["norrland_kust", "norrland_inland", "hoglage_fjallnara", "okand"].includes(inputRegion);
  }
  return curveRegion === inputRegion;
}

function lowerConfidence(confidence) {
  if (confidence === "high") return "medium";
  if (confidence === "medium") return "low";
  return "low";
}

function capConfidence(confidence, maxConfidence) {
  const rank = { low: 1, medium: 2, high: 3 };
  return rank[confidence] > rank[maxConfidence] ? maxConfidence : confidence;
}

function confidenceLabel(confidence) {
  if (confidence === "high") return "Hög";
  if (confidence === "medium") return "Medel";
  return "Låg";
}

function typeLabel(type) {
  return {
    law: "lag",
    research: "forskning/myndighet",
    regional_curve: "regional gallringsmall",
    decision_support_reference: "beslutsstöd",
    scenario_reference: "scenarioverktyg",
    practice_guide: "praktisk mall",
    field_observation: "fältobservationer",
    warning: "fältvarningar"
  }[type] || type;
}
