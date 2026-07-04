import { estimateSiteIndex } from "./siteIndexCalculator.js";
import { findGallringZone, sourceNotesForInput } from "./skotselKnowledgeBase.js";

const ACTIONS = {
  curve_under: ["Under mall", "Låg"],
  curve_monitor: ["Följ upp", "Låg"],
  curve_thinning_zone: ["Gallringsläge", "Medel"],
  curve_thinning_now: ["Gallra nu", "Hög"],
  curve_late_risk: ["Sen gallring-risk", "Hög"],
  curve_missing: ["Kurvunderlag saknas", "Låg"],
  final_felling_check: ["Slutavverkning kontroll", "Hög"],
  conservation_check: ["Hänsynskontroll", "Hög"],
  insufficient_data: ["Otillräckligt underlag", "Låg"],
  no_action: ["Ingen åtgärd nu", "Låg"],
  monitor: ["Följ upp", "Låg"],
  cleaning_plan: ["Röjning bör planeras", "Medel"],
  cleaning_now: ["Röjning behövs nu", "Hög"],
  delayed_cleaning: ["Försenad röjning / gallringsförberedelse", "Hög"],
  thinning_soon: ["Gallra snart", "Medel"],
  thinning_now: ["Gallra nu", "Hög"],
  late_thinning_risk: ["Sen/riskabel gallring", "Hög"],
  final_felling_possible: ["Slutavverkning kan vara aktuell", "Medel"],
  final_felling_priority: ["Slutavverkning bör prioriteras för kontroll", "Hög"],
  legal_check_required: ["Juridisk kontroll krävs", "Hög"]
};

export function calculateSkotselRecommendation(input = {}) {
  const normalized = normalizeInput(input);
  const siteIndexEstimate = estimateSiteIndex(normalized);
  const legal = buildLegalAssessment(normalized);
  const sourceNotes = unique([
    ...sourceNotesForInput(normalized),
    ...siteIndexEstimate.sourceNotes
  ]);
  const warnings = [...siteIndexEstimate.warnings, ...legal.warnings];
  const missingQuick = missingQuickFields(normalized);

  if (missingQuick.length) {
    return buildResult(normalized, {
      actionCode: "insufficient_data",
      confidence: "low",
      why: "Snabbkollen behöver minst huvudträdslag, höjd och grundyta för att visa beståndets punkt i gallringskurvan.",
      recommendationDirection: "Komplettera " + missingQuick.join(", ") + " och visa punkten i gallringskurvan igen.",
      fieldChecks: ["Mät övre höjd.", "Mät grundyta på flera punkter.", "Bekräfta huvudträdslag."],
      legalAssessment: legal.text,
      warnings,
      sourceNotes,
      siteIndexEstimate
    });
  }

  const quickAssessment = assessQuickCurve(normalized, siteIndexEstimate);

  if (legal.hasConservationFlag) {
    quickAssessment.actionCode = "conservation_check";
    quickAssessment.confidence = lowerConfidence(quickAssessment.confidence);
    quickAssessment.fieldChecks.push("Avgränsa naturvärden och kulturmiljö innan produktionsåtgärd skrivs som huvudförslag.");
    quickAssessment.warnings.push("Naturvärde/kulturmiljö är markerat eller osäkert.");
  }

  return buildResult(normalized, {
    ...quickAssessment,
    legalAssessment: legal.text,
    warnings: [...warnings, ...quickAssessment.warnings],
    fieldChecks: [...quickAssessment.fieldChecks, ...legal.nextChecks],
    sourceNotes,
    siteIndexEstimate
  });
}

function normalizeInput(input) {
  return {
    mainSpecies: clean(input.mainSpecies),
    region: clean(input.region),
    standPhase: clean(input.standPhase),
    heightMeters: toNumber(input.heightMeters),
    stemsPerHa: toNumber(input.stemsPerHa),
    basalArea: toNumber(input.basalArea),
    dgvCm: toNumber(input.dgvCm),
    ageYears: toNumber(input.ageYears),
    ageType: clean(input.ageType) || "totalalder",
    siteIndex: toNumber(input.siteIndex),
    volumeM3: toNumber(input.volumeM3),
    birchShare: toNumber(input.birchShare),
    spruceShare: toNumber(input.spruceShare),
    pineShare: toNumber(input.pineShare),
    damage: clean(input.damage),
    gaps: clean(input.gaps),
    vitality: clean(input.vitality),
    bearing: clean(input.bearing),
    snowWindRisk: clean(input.snowWindRisk),
    conservation: clean(input.conservation),
    reindeerMountain: clean(input.reindeerMountain),
    productiveForest: clean(input.productiveForest),
    soilMoisture: clean(input.soilMoisture),
    movingGroundwater: clean(input.movingGroundwater),
    vegetationType: clean(input.vegetationType),
    soilTexture: clean(input.soilTexture),
    soilDepth: clean(input.soilDepth)
  };
}

function missingQuickFields(input) {
  const missing = [];
  if (!input.mainSpecies || input.mainSpecies === "okand") missing.push("huvudträdslag");
  if (input.heightMeters === null) missing.push("höjd");
  if (input.basalArea === null) missing.push("grundyta");
  return missing;
}

function assessQuickCurve(input, siteIndexEstimate) {
  const zone = findGallringZone(input, siteIndexEstimate);
  const fieldChecks = baseFieldChecks(input);
  const warnings = [];

  if (input.standPhase === "aldre_skog") {
    return {
      actionCode: "final_felling_check",
      confidence: "low",
      why: "Beståndet är markerat som äldre skog. Appen visar därför slutavverkning som kontrollspår, inte som beslut.",
      recommendationDirection: "Kontrollera lägsta ålder, anmälan/tillstånd, hänsyn, rennäring och föryngringsförutsättningar innan åtgärdsförslag.",
      fieldChecks: [
        "Kontrollera lägsta slutavverkningsålder.",
        "Kontrollera naturvärden, kulturmiljö och rennäring.",
        "Kontrollera bärighet, väg, hänsynsytor och föryngringsförutsättningar."
      ],
      warnings: ["Slutavverkning är endast en juridisk och skoglig kontrollpunkt i appen."]
    };
  }

  if (input.mainSpecies === "bjork") {
    return {
      actionCode: "curve_missing",
      confidence: "low",
      why: "Björkspår: punkten kan visas, men kurvunderlag saknas eller är ofullständigt i appens kunskapsbas.",
      recommendationDirection: "Kontrollera kvalitet, vitala huvudstammar och mål med beståndet innan gallring föreslås.",
      fieldChecks: [
        "Bedöm om målet är björkproduktion, barrföryngring under björk eller naturhänsyn.",
        "Kontrollera antal raka, vitala huvudstammar.",
        "Kontrollera kronutrymme, röta, krokighet och snö-/stormskador."
      ],
      warnings: ["Tall- eller granmall används inte som facit för björk."]
    };
  }

  if (!siteIndexEstimate.numericSiteIndex) {
    return {
      actionCode: "curve_missing",
      confidence: "low",
      why: "Beståndets punkt kan visas, men SI saknas eller kan inte skattas säkert från källstödda kurvor i denna version.",
      recommendationDirection: "Välj SI manuellt eller gör fördjupad bonitering och jämför därefter mot regional gallringsmall.",
      fieldChecks: [
        "Kontrollera ålderstyp och om brösthöjdsålder finns.",
        "Kontrollera om beståndet är ojämnt, skadat eller påverkat.",
        "Jämför manuellt mot regional gallringsmall innan åtgärd föreslås."
      ],
      warnings: ["Kurvunderlag saknas för automatisk SI eller gallringszon."]
    };
  }

  if (!zone) {
    return {
      actionCode: "curve_missing",
      confidence: "low",
      why: "SI finns, men granskad gallringskurva saknas för vald kombination i appens kunskapsbas.",
      recommendationDirection: "Använd punkten som fältstöd och jämför mot pappersmall eller annat källstött regionalt underlag.",
      fieldChecks,
      warnings: ["Gallringskurva saknas i appen för vald kombination."]
    };
  }

  return {
    actionCode: zone.actionCode || "curve_monitor",
    confidence: zone.confidence || "medium",
    why: zone.explanation || "Beståndets punkt har jämförts mot inlagd gallringskurva.",
    recommendationDirection: zone.recommendation || "Kontrollera stabilitet, kronlängd, bärighet och hänsyn innan förslag skrivs.",
    fieldChecks,
    warnings
  };
}

function buildLegalAssessment(input) {
  const warnings = [];
  const nextChecks = [];

  if (input.productiveForest !== "ja") {
    warnings.push("Produktiv skogsmark är inte bekräftad.");
    nextChecks.push("Kontrollera markslag och om Skogsvårdslagens krav är tillämpliga.");
  }

  if (input.reindeerMountain === "ja" || input.reindeerMountain === "osakert") {
    warnings.push("Rennäring/fjällnära läge kräver juridisk kontroll.");
    nextChecks.push("Kontrollera tillstånd, samråd och lokala restriktioner för rennäring/fjällnära skog.");
  }

  if (input.conservation === "ja" || input.conservation === "osakert") {
    warnings.push("Naturvärden/kulturmiljö är markerade eller osäkra.");
    nextChecks.push("Kontrollera naturvärden, kulturmiljö, hänsynsytor och dokumentationskrav.");
  }

  return {
    hasConservationFlag: input.conservation === "ja" || input.conservation === "osakert",
    text: warnings.length
      ? "Juridisk kontroll krävs eller bör göras innan åtgärdsförslag används i planering."
      : "Inga särskilda juridiska varningsflaggor är markerade, men lagkrav ska alltid kontrolleras före åtgärd.",
    warnings,
    nextChecks
  };
}

function buildResult(input, parts) {
  const [actionLabel, actionPriority] = ACTIONS[parts.actionCode] ?? ACTIONS.insufficient_data;
  const zone = findGallringZone(input, parts.siteIndexEstimate);
  const warnings = unique(parts.warnings);
  const fieldChecks = unique(parts.fieldChecks).slice(0, 7);
  const quickChecks = fieldChecks.slice(0, 3);
  const planText = buildPlanText(parts.actionCode, parts.recommendationDirection);

  return {
    actionCode: parts.actionCode,
    actionLabel,
    actionPriority,
    confidence: parts.confidence,
    why: parts.why,
    fieldChecks,
    quickChecks,
    recommendationDirection: parts.recommendationDirection,
    forestryAssessment: parts.why,
    legalAssessment: parts.legalAssessment,
    warnings,
    nextChecks: fieldChecks,
    planText,
    sourceNotes: unique(parts.sourceNotes),
    siteIndexEstimate: parts.siteIndexEstimate,
    chartData: {
      heightMeters: input.heightMeters,
      basalArea: input.basalArea,
      zone,
      status: parts.actionLabel,
      note: chartNote(parts.actionCode, input, parts.siteIndexEstimate)
    },
    debug: {
      normalizedInput: input,
      sourceStatus: "Inga ogranskade numeriska gallringsgränser används."
    }
  };
}

function baseFieldChecks(input) {
  const checks = [
    "Kontrollera stabilitet och kronlängd.",
    "Kontrollera bärighet och stickvägar.",
    "Kontrollera naturvärden och kulturmiljö före åtgärdsförslag."
  ];

  if (input.stemsPerHa !== null) checks.push("Jämför stamantalet mot målbild och beståndets jämnhet.");
  if (input.dgvCm !== null) checks.push("Kontrollera att DGV stämmer mot provytor och diameterfördelning.");
  if (input.damage === "tydliga" || input.damage === "svara") checks.push("Bedöm skador innan gallringsstyrka föreslås.");
  if (input.snowWindRisk === "ja") checks.push("Var försiktig med gallringsstyrka vid snö- eller vindrisk.");
  return checks;
}

function chartNote(actionCode, input, siteIndexEstimate) {
  if (input.mainSpecies === "bjork") {
    return "Björkspår: kurvunderlag saknas eller är ofullständigt. Punkten visas utan tall-/granmall som facit.";
  }
  if (actionCode === "insufficient_data") {
    return "Ange huvudträdslag, höjd och grundyta för att visa punkten.";
  }
  if (!siteIndexEstimate.numericSiteIndex) {
    return "Kurvunderlag saknas eller SI saknas. Jämför manuellt mot regional mall.";
  }
  return "SI finns, men gallringskurva saknas i appens kunskapsbas för vald kombination.";
}

function buildPlanText(actionCode, recommendationDirection) {
  if (actionCode === "final_felling_check") {
    return "Beståndet kan vara aktuellt för föryngringsavverkning enligt inmatade värden. Kontroll av lägsta ålder, anmälan/tillstånd, naturvärden, rennäring och föryngringsförutsättningar krävs före åtgärdsförslag.";
  }

  if (["curve_thinning_zone", "curve_thinning_now", "curve_late_risk", "curve_monitor"].includes(actionCode)) {
    return "Beståndet bedöms ligga i eller nära gallringsfas enligt uppmätta fältvärden. " + recommendationDirection;
  }

  return "Beståndets punkt är visad utifrån inmatade fältvärden. " + recommendationDirection;
}

function lowerConfidence(confidence) {
  if (confidence === "high") return "medium";
  if (confidence === "medium") return "low";
  return "low";
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function clean(value) {
  return String(value ?? "").trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
