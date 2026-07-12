import { estimateSiteIndex } from "./siteIndexCalculator.js";
import {
  buildEvidenceAssessment,
  BJORK_LOV_RESEARCH_SUPPORT_SUMMARY,
  findGallringZone,
  findThinningSourceCandidate,
  GALLRING_RESEARCH_SUPPORT_SUMMARY,
  LEGAL_CONTROL_RULES_SUMMARY,
  NORRA_TEXT_RULES_SUMMARY,
  ROJNING_RESEARCH_SUPPORT_SUMMARY,
  sourceNotesForInput
} from "./skotselKnowledgeBase.js";

const ACTIONS = {
  curve_under: ["Under mall", "Låg"],
  curve_monitor: ["Följ upp", "Låg"],
  curve_thinning_zone: ["Gallringsläge", "Medel"],
  curve_thinning_now: ["Gallra nu", "Hög"],
  curve_late_risk: ["Sen gallring-risk", "Hög"],
  curve_reference_pilot: ["Pilotunderlag", "Medel"],
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
  mergeLegalChecks(legal, buildActionLegalChecks(quickAssessment));
  const norraTextRules = buildNorraTextRuleAssessment(normalized, quickAssessment);
  quickAssessment.fieldChecks.push(...norraTextRules.fieldChecks);
  quickAssessment.warnings.push(...norraTextRules.warnings);
  quickAssessment.sourceNotes = unique([
    ...(quickAssessment.sourceNotes || []),
    ...norraTextRules.sourceNotes
  ]);

  if (norraTextRules.lowersConfidence) {
    quickAssessment.confidence = lowerConfidence(quickAssessment.confidence);
  }

  const gallringResearch = buildGallringResearchAssessment(normalized, quickAssessment);
  quickAssessment.fieldChecks = unique([
    ...gallringResearch.fieldChecks,
    ...quickAssessment.fieldChecks
  ]);
  quickAssessment.warnings.push(...gallringResearch.warnings);
  quickAssessment.sourceNotes = unique([
    ...(quickAssessment.sourceNotes || []),
    ...gallringResearch.sourceNotes
  ]);

  if (gallringResearch.explanation) {
    quickAssessment.why = quickAssessment.why + " " + gallringResearch.explanation;
  }

  if (gallringResearch.lowersConfidence) {
    quickAssessment.confidence = lowerConfidence(quickAssessment.confidence);
  }

  const rojningResearch = buildRojningResearchAssessment(normalized, quickAssessment);
  quickAssessment.fieldChecks = unique([
    ...rojningResearch.fieldChecks,
    ...quickAssessment.fieldChecks
  ]);
  quickAssessment.warnings.push(...rojningResearch.warnings);
  quickAssessment.sourceNotes = unique([
    ...(quickAssessment.sourceNotes || []),
    ...rojningResearch.sourceNotes
  ]);

  if (rojningResearch.explanation) {
    quickAssessment.why = quickAssessment.why + " " + rojningResearch.explanation;
  }

  if (rojningResearch.lowersConfidence) {
    quickAssessment.confidence = lowerConfidence(quickAssessment.confidence);
  }

  const bjorkLovResearch = buildBjorkLovResearchAssessment(normalized, quickAssessment);
  quickAssessment.fieldChecks = unique([
    ...bjorkLovResearch.fieldChecks,
    ...quickAssessment.fieldChecks
  ]);
  quickAssessment.warnings.push(...bjorkLovResearch.warnings);
  quickAssessment.sourceNotes = unique([
    ...(quickAssessment.sourceNotes || []),
    ...bjorkLovResearch.sourceNotes
  ]);

  if (bjorkLovResearch.explanation) {
    quickAssessment.why = quickAssessment.why + " " + bjorkLovResearch.explanation;
  }

  if (bjorkLovResearch.lowersConfidence) {
    quickAssessment.confidence = lowerConfidence(quickAssessment.confidence);
  }

  if (legal.hasConservationFlag) {
    quickAssessment.confidence = lowerConfidence(quickAssessment.confidence);
    quickAssessment.fieldChecks.push("Kontrollera juridiska krav och hänsyn innan produktionsåtgärd skrivs som huvudförslag.");
    quickAssessment.warnings.push("Juridisk kontroll krävs eller rekommenderas innan åtgärdsförslag används.");
  }

  return buildResult(normalized, {
    ...quickAssessment,
    legalAssessment: legal.text,
    warnings: [...warnings, ...quickAssessment.warnings],
    fieldChecks: [...quickAssessment.fieldChecks, ...legal.nextChecks],
    sourceNotes: unique([...sourceNotes, ...(quickAssessment.sourceNotes || [])]),
    legalChecks: legal.checks,
    legalStatus: legal.statusLabel,
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
    productiveForestLandAssumption: normalizeProductiveForestLandAssumption(input),
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
  const curveReference = findGallringZone(input, siteIndexEstimate);
  const sourceCandidate = findThinningSourceCandidate(input, siteIndexEstimate);
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

  if (input.standPhase === "ungskog") {
    return {
      actionCode: "cleaning_plan",
      confidence: "medium",
      why: "Beståndet är markerat som ungskog. Appen visar därför röjning som skötselspår, inte som pris- eller stamantalsfacit.",
      recommendationDirection: "Kontrollera stamval, trädslag, skador, lövkonkurrens och målbild innan röjning förs in i plan.",
      fieldChecks: [
        "Välj utvecklingsbara huvudstammar och kontrollera trädslag mot målbild.",
        "Kontrollera om löv ska gynnas, hållas tillbaka eller sparas för hänsyn/vilt.",
        "Kontrollera skador, vitalitet, snö-/viltbetesrisk och hänsyn innan åtgärd."
      ],
      warnings: ["Röjningsspåret är fältstöd och ändrar inte röjningskalkylens priser."],
      sourceCandidate
    };
  }

  if (isLovSpecies(input.mainSpecies)) {
    return {
      actionCode: "curve_missing",
      confidence: "low",
      why: "Lövspår: punkten kan visas, men kurvunderlag saknas eller är ofullständigt i appens kunskapsbas.",
      recommendationDirection: "Kontrollera kvalitet, vitala huvudstammar, ljuskonkurrens och mål med beståndet innan gallring föreslås.",
      fieldChecks: [
        "Bedöm om målet är lövproduktion, barrföryngring under löv, blandning eller naturhänsyn.",
        "Kontrollera antal raka, vitala huvudstammar.",
        "Kontrollera kronutrymme, ljuskonkurrens, röta, krokighet, vilt och snö-/stormskador."
      ],
      warnings: ["Tall- eller granmall används inte som facit för lövspåret."]
    };
  }

  if (isPilotCurveStatus(curveReference?.status)) {
    return {
      actionCode: curveReference.actionCode,
      confidence: curveReference.confidence,
      why: curveReference.explanation,
      recommendationDirection: curveReference.recommendation,
      fieldChecks: [
        "Jämför beståndspunkten mot T20-exemplets höjd och grundyta.",
        "Kontrollera full regional gallringsmall innan åtgärdsförslag.",
        ...fieldChecks
      ],
      warnings: [
        "Pilotunderlaget är ett textbaserat exempel, inte en komplett digitaliserad kurva.",
        ...curveReference.curve.limitations
      ],
      curveReference
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
      warnings: ["Kurvunderlag saknas för automatisk SI eller gallringszon."],
      sourceCandidate
    };
  }

  if (!curveReference) {
    return {
      actionCode: "curve_missing",
      confidence: "low",
      why: sourceCandidate
        ? "Källa är identifierad, men kurvan är inte digitaliserad/verifierad i appen."
        : "SI finns, men granskad gallringskurva saknas för vald kombination i appens kunskapsbas.",
      recommendationDirection: "Använd punkten som fältstöd och jämför mot pappersmall eller annat källstött regionalt underlag.",
      fieldChecks,
      warnings: [sourceCandidate
        ? "Kurva identifierad i källbank men saknar verifierade värden i appen."
        : "Gallringskurva saknas i appen för vald kombination."],
      sourceCandidate
    };
  }

  return {
    actionCode: curveReference.actionCode || "curve_monitor",
    confidence: curveReference.confidence || "medium",
    why: curveReference.explanation || "Beståndets punkt har jämförts mot inlagd gallringskurva.",
    recommendationDirection: curveReference.recommendation || "Kontrollera stabilitet, kronlängd, bärighet och hänsyn innan förslag skrivs.",
    fieldChecks,
    warnings,
    curveReference
  };
}

function buildLegalAssessment(input) {
  const checks = [];

  if (input.productiveForestLandAssumption === "uncertain") {
    checks.push(legalCheck({
      id: "legal-land-class-check",
      severity: "warning",
      effect: "land_class_check_required",
      userText: "Kontrollera markklass: produktiv skogsmark, impediment eller specialfall påverkar vilka regler och kontrollpunkter som behöver användas.",
      canBlockAction: false
    }));
  }

  if (input.productiveForestLandAssumption === "non_productive") {
    checks.push(legalCheck({
      id: "legal-land-class-check",
      severity: "critical",
      effect: "land_class_check_required",
      userText: "Markklass/specialfall är markerat. Kontrollera markklass och aktuella krav innan åtgärdsförslag används.",
      canBlockAction: true
    }));
  }

  if (input.reindeerMountain === "ja" || input.reindeerMountain === "osakert") {
    checks.push(legalCheck({
      id: "legal-reindeer-consultation-check",
      severity: "warning",
      effect: "legal_check_required",
      userText: "Juridisk kontroll rekommenderas: rennäring eller renbetesområde är markerat/osäkert. Kontrollera samråd, hänsyn och aktuella myndighetskrav.",
      canBlockAction: false
    }));
  }

  if (input.conservation === "ja" || input.conservation === "osakert") {
    checks.push(legalCheck({
      id: "legal-nature-values-check",
      severity: "warning",
      effect: "nature_check_required",
      userText: "Kontrollera naturhänsyn: naturvärden, kantzoner, vattennära miljöer, död ved eller skyddsvärda miljöer behöver bedömas innan åtgärd.",
      canBlockAction: false
    }));
    checks.push(legalCheck({
      id: "legal-cultural-heritage-check",
      severity: "warning",
      effect: "cultural_heritage_check_required",
      userText: "Kontrollera kulturmiljö: fornlämningar och andra kulturmiljövärden behöver bedömas mot aktuell lagtext, kartunderlag och myndighetskrav.",
      canBlockAction: false
    }));
  }

  if (input.region === "hoglage_fjallnara") {
    checks.push(legalCheck({
      id: "legal-mountain-forest-permit-check",
      severity: "critical",
      effect: "permit_check_required",
      userText: "Kontroll krävs före åtgärd: fjällnära läge är markerat. Kontrollera tillståndskrav, aktuell lagtext och Skogsstyrelsens krav innan åtgärd.",
      canBlockAction: true
    }));
  }

  if (input.conservation === "osakert" || input.productiveForestLandAssumption === "uncertain") {
    checks.push(legalCheck({
      id: "legal-protected-area-unknown-restriction-check",
      severity: "warning",
      effect: "legal_check_required",
      userText: "Kontrollera områdesskydd och restriktioner: okända eller markerade specialfall behöver kontrolleras mot aktuell lagtext, kartunderlag och myndighetskrav.",
      canBlockAction: false,
      reviewNeeded: true
    }));
  }

  const warnings = checks
    .filter((check) => check.severity !== "info")
    .map((check) => check.userText);
  const nextChecks = checks.map((check) => check.userText);
  const hasBlockingCheck = checks.some((check) => check.canBlockAction);
  const hasWarning = checks.some((check) => check.severity === "warning" || check.severity === "critical");
  const statusLabel = hasBlockingCheck ? "Kontroll krävs" : hasWarning ? "Kontroll rekommenderas" : "OK";

  return {
    hasConservationFlag: hasWarning,
    text: legalText(warnings),
    warnings,
    nextChecks,
    checks,
    statusLabel
  };
}

function buildActionLegalChecks(assessment) {
  if (!assessment?.actionCode) return [];

  if (assessment.actionCode === "final_felling_check") {
    return [
      legalCheck({
        id: "legal-final-felling-notification-check",
        severity: "critical",
        effect: "legal_check_required",
        userText: "Kontroll krävs före åtgärd: anmälan till Skogsstyrelsen och aktuell lagtext/myndighetskrav behöver kontrolleras för föryngringsavverkning.",
        canBlockAction: true
      }),
      legalCheck({
        id: "legal-regeneration-check",
        severity: "warning",
        effect: "regeneration_check_required",
        userText: "Kontrollera återväxtplan: föryngringsåtgärder och platsanpassad metod behöver bedömas mot aktuell lagtext och vägledning.",
        canBlockAction: false
      })
    ];
  }

  if (["curve_reference_pilot", "curve_missing", "curve_monitor", "thinning_soon", "thinning_now", "late_thinning_risk"].includes(assessment.actionCode)) {
    return [legalCheck({
      id: "legal-thinning-context-notice",
      severity: "info",
      effect: "legal_context_notice",
      userText: "Juridisk kontext: gallringsförslag är skogligt underlag. Kontrollera hänsyn, rennäring, naturvärden, skador och eventuella områdesskydd innan åtgärd.",
      canBlockAction: false
    })];
  }

  if (["cleaning_plan", "cleaning_now", "delayed_cleaning"].includes(assessment.actionCode)) {
    return [legalCheck({
      id: "legal-clearing-context-notice",
      severity: "info",
      effect: "legal_context_notice",
      userText: "Juridisk kontext: röjning är skogsvårdande underlag. Kontrollera hänsyn till natur, kulturmiljö och rennäring vid fältplanering.",
      canBlockAction: false
    })];
  }

  return [];
}

function mergeLegalChecks(legal, extraChecks) {
  if (!extraChecks.length) return legal;
  const byId = new Map(legal.checks.map((check) => [check.id, check]));
  extraChecks.forEach((check) => byId.set(check.id, check));
  legal.checks = [...byId.values()];
  legal.warnings = legal.checks
    .filter((check) => check.severity !== "info")
    .map((check) => check.userText);
  legal.nextChecks = legal.checks.map((check) => check.userText);
  const hasBlockingCheck = legal.checks.some((check) => check.canBlockAction);
  const hasWarning = legal.checks.some((check) => check.severity === "warning" || check.severity === "critical");
  legal.statusLabel = hasBlockingCheck ? "Kontroll krävs" : hasWarning ? "Kontroll rekommenderas" : "OK";
  legal.hasConservationFlag = hasWarning;
  legal.text = legalText(legal.warnings);
  return legal;
}

function legalText(warnings) {
  return warnings.length
    ? "Juridiskt kontrollstöd, inte besked: " + warnings.join(" ")
    : "Juridik: OK i snabbkontrollen. Detta är kontrollstöd, inte juridiskt besked.";
}

function buildResult(input, parts) {
  const [actionLabel, actionPriority] = ACTIONS[parts.actionCode] ?? ACTIONS.insufficient_data;
  const curveReference = isClearingAction(parts.actionCode) ? null : (parts.curveReference ?? findGallringZone(input, parts.siteIndexEstimate));
  const sourceCandidate = isClearingAction(parts.actionCode) ? null : (parts.sourceCandidate ?? findThinningSourceCandidate(input, parts.siteIndexEstimate));
  const regionalReferenceWithUnknownRegion = input.region === "okand" && curveReference?.status;
  const warnings = unique(parts.warnings);
  const fieldChecks = unique(parts.fieldChecks).slice(0, 7);
  const quickChecks = fieldChecks.slice(0, 3);
  const sourceNotes = unique([
    ...parts.sourceNotes,
    ...curveSourceNotes(curveReference),
    ...sourceCandidateNotes(sourceCandidate)
  ]);
  const planText = buildPlanText(parts.actionCode, parts.recommendationDirection);
  const baseResult = {
    actionCode: parts.actionCode,
    actionLabel,
    actionPriority,
    confidence: parts.confidence,
    forestryStatus: actionLabel,
    legalStatus: parts.legalStatus || legalStatusLabel(input),
    why: parts.why,
    fieldChecks,
    quickChecks,
    recommendationDirection: parts.recommendationDirection,
    forestryAssessment: parts.why,
    legalAssessment: parts.legalAssessment,
    legalChecks: parts.legalChecks || [],
    warnings,
    nextChecks: fieldChecks,
    planText,
    sourceNotes,
    siteIndexEstimate: parts.siteIndexEstimate,
    chartData: {
      heightMeters: input.heightMeters,
      basalArea: input.basalArea,
      curveReference,
      sourceCandidate,
      status: actionLabel,
      note: chartNote(parts.actionCode, input, parts.siteIndexEstimate, curveReference, sourceCandidate),
      regionWarning: regionWarningText(input, curveReference, parts.actionCode)
    },
    debug: {
      normalizedInput: input,
      sourceStatus: "Inga ogranskade numeriska gallringsgränser används.",
      legalStatus: "Juridiska kontrollflaggor kan inte aktivera kurvor eller ändra T20."
    },
    sourceCandidate
  };
  const evidenceAssessment = buildEvidenceAssessment(input, baseResult);
  const combinedConfidence = regionalReferenceWithUnknownRegion
    ? lowerConfidence(evidenceAssessment.combinedConfidence)
    : evidenceAssessment.combinedConfidence;

  return {
    ...baseResult,
    confidence: combinedConfidence,
    regionWarning: regionWarningText(input, curveReference, parts.actionCode),
    evidenceAssessment,
    groupedSourceNotes: groupSourcesByEvidence(evidenceAssessment)
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

function buildNorraTextRuleAssessment(input, assessment) {
  const warnings = [];
  const fieldChecks = [
    "Norra textregler: kontrollera att mallen passar beståndets region, trädslagsfördelning, skiktning och gallringsform."
  ];
  const sourceNotes = [
    NORRA_TEXT_RULES_SUMMARY.note,
    "Norra textregler är användningsvillkor och kontrollflaggor, inte aktiva kurvor eller juridiska beslut."
  ];
  let lowersConfidence = false;

  if (input.region === "okand") {
    warnings.push("Norra gallringsmallar har regional begränsning. Välj eller kontrollera region innan mallen används som stöd.");
    lowersConfidence = true;
  }

  if (isLovSpecies(input.mainSpecies) || input.mainSpecies === "blandat") {
    warnings.push("Norra tall-/granmall ska inte användas som facit för lövspår eller blandbestånd.");
    lowersConfidence = true;
  }

  if (input.birchShare !== null && input.birchShare > 30) {
    warnings.push("Högt lövinslag: kontrollera att minst cirka 70 procent av grundytan är tall eller gran innan Norra-mall används.");
    lowersConfidence = true;
  }

  if (input.mainSpecies === "tall" || input.mainSpecies === "gran") {
    const matchingShare = input.mainSpecies === "tall" ? input.pineShare : input.spruceShare;
    if (matchingShare !== null && matchingShare < 70) {
      warnings.push("Trädslagsfördelningen kan ligga utanför Norra-mallens användningsvillkor. Kontrollera grundyteandel för tall/gran.");
      lowersConfidence = true;
    }
    if (input.pineShare === null && input.spruceShare === null && input.birchShare === null) {
      fieldChecks.push("Kontrollera i fält att tall/gran dominerar grundytan innan mallen används.");
    }
  }

  if (input.gaps === "nagot_luckigt" || input.gaps === "luckigt" || input.damage === "tydliga" || input.damage === "svara" || input.vitality === "svag") {
    warnings.push("Ojämnhet, luckor, skador eller svag vitalitet gör att Norra-mallen ska användas med försiktighet och fältanpassning.");
    lowersConfidence = true;
  }

  if (isLikelyFirstThinning(input, assessment)) {
    fieldChecks.push("Första gallring: kontrollera stickvägsuttag och total uttagsstyrka mot Norra-mallens användningsvillkor.");
  }

  if (input.mainSpecies === "gran" && input.heightMeters !== null && input.heightMeters > 25) {
    warnings.push("Gran med övre höjd över cirka 25-26 m: gallring ska hanteras med tydlig försiktighet och stormriskkontroll.");
    lowersConfidence = true;
  }

  if (assessment.actionCode === "curve_reference_pilot") {
    fieldChecks.push("När T20-pilot visas: lägg störst vikt vid kontroll av grundyta efter gallring och fältbild.");
  }

  fieldChecks.push("Vid noggrann bedömning: använd systematiska provytor, mät grundyta på varje yta och kontrollera SI/övre höjd där det går.");

  return {
    warnings,
    fieldChecks,
    sourceNotes,
    lowersConfidence
  };
}

function buildGallringResearchAssessment(input, assessment) {
  if (!isGallringResearchRelevant(input, assessment)) {
    return emptyResearchAssessment();
  }

  const warnings = [];
  const priorityFieldChecks = [];
  const fieldChecks = [
    "Forskningsstöd: kontrollera gallringsform, gallringsstyrka, skador och beståndets framtida struktur."
  ];
  const sourceNotes = [
    GALLRING_RESEARCH_SUPPORT_SUMMARY.note,
    "Forskningsstödet används för förklaring, risk och fältkontroll. Det aktiverar inga kurvor, diagramvärden, juridiska beslut eller hårda gränser."
  ];
  let lowersConfidence = false;

  if (isLikelyFirstThinning(input, assessment)) {
    fieldChecks.push("Första gallring: kontrollera urval, stickvägar, stabilitet och framtida huvudstammar i fält.");
  }

  if (assessment.actionCode === "curve_reference_pilot") {
    fieldChecks.push("Väg T20-jämförelsen mot fältbilden: gallring kan gynna dimensionsutveckling utan att vara ett exakt facit.");
  }

  if (input.snowWindRisk === "ja") {
    warnings.push("Forskningsstöd: markerad snö-/vindrisk kräver kontroll av stabilitet, gallringsstyrka och exponering.");
    priorityFieldChecks.push("Kontrollera storm- och snörisk innan gallringsstyrka föreslås.");
    lowersConfidence = true;
  }

  if (input.damage === "tydliga" || input.damage === "svara") {
    warnings.push("Forskningsstöd: tydliga skador kan öka risken för rotröta, svamp, insekter och tillväxtnedsättning.");
    priorityFieldChecks.push("Kontrollera mekaniska skador, röta, svamp och insektsrisk i skadade partier.");
    lowersConfidence = true;
  }

  if (input.bearing === "svag_blot") {
    warnings.push("Forskningsstöd: svag eller blöt bärighet ökar behovet av kontroll av stickvägar och körskador.");
    priorityFieldChecks.push("Planera stickvägar och körning så att skador på stammar och rötter begränsas.");
    lowersConfidence = true;
  }

  if (input.vitality === "svag") {
    warnings.push("Forskningsstöd: svag vitalitet gör att skade- och svamprisk behöver bedömas innan gallringsförslag används.");
    fieldChecks.push("Kontrollera kronstatus, vitalitet och synliga svampangrepp.");
    lowersConfidence = true;
  }

  if (input.mainSpecies === "blandat" || (input.birchShare !== null && input.birchShare > 30)) {
    warnings.push("Forskningsstöd: blandbestånd och högt lövinslag kräver särskild fältbedömning av trädslag, kvalitet och målbild.");
    fieldChecks.push("Blandbestånd: bedöm trädslag var för sig och använd inte tall-/granmall som facit.");
    lowersConfidence = true;
  }

  if (isLovSpecies(input.mainSpecies)) {
    fieldChecks.push("Björk/löv: använd inte tall- eller granmall som facit; välj separat lövspår när källstöd finns.");
  }

  if (input.mainSpecies === "gran") {
    fieldChecks.push("Gran: kontrollera rotröta, körskador och stormkänslighet särskilt noga.");
  }

  if (input.mainSpecies === "tall") {
    fieldChecks.push("Tall: kontrollera framtidsträd, kronutveckling, snöskador och insektstecken i fält.");
  }

  return {
    explanation: "Forskningsstödet används som förklarings- och riskstöd, inte som ny kurva.",
    warnings,
    fieldChecks: unique([...priorityFieldChecks, ...fieldChecks]),
    sourceNotes,
    lowersConfidence
  };
}

function buildRojningResearchAssessment(input, assessment) {
  if (!isRojningResearchRelevant(input, assessment)) {
    return emptyResearchAssessment();
  }

  const warnings = [];
  const priorityFieldChecks = [];
  const fieldChecks = [
    "Röjningsstöd: kontrollera stamval, trädslagsfördelning, skador och målbild i ungskogen.",
    "Röjning är fältstöd för framtida kvalitet och stabilitet, inte en prisregel eller hård stamantalsgräns."
  ];
  const sourceNotes = [
    ROJNING_RESEARCH_SUPPORT_SUMMARY.note,
    "Röjningsstödet används för förklaring och fältkontroll. Det ändrar inte priser, aktiverar inga kurvor och skapar inga hårda gränser."
  ];
  let lowersConfidence = false;

  if (assessment.actionCode === "cleaning_plan" || assessment.actionCode === "cleaning_now") {
    priorityFieldChecks.push("Välj huvudstammar efter kvalitet, vitalitet, skador, trädslag och beståndets mål.");
  }

  if (input.mainSpecies === "tall") {
    fieldChecks.push("Tallungskog: kontrollera lövkonkurrens, överskärmning, framtidsträd och viltbetesrisk.");
  }

  if (input.mainSpecies === "gran") {
    fieldChecks.push("Granungskog: bedöm lövuppslag och självföryngrade barrplantor separat från tallspåret.");
    fieldChecks.push("Granungskog: kontrollera röta, rotrisk och skador innan åtgärd planeras.");
  }

  if (isLovSpecies(input.mainSpecies)) {
    warnings.push("Röjningsstöd: björk/löv kräver egen målbild och ska inte styras av tall- eller granmall som facit.");
    priorityFieldChecks.push("Björk/löv: bestäm om målet är lövproduktion, barrföryngring, naturhänsyn eller blandning.");
    lowersConfidence = true;
  }

  if (input.mainSpecies === "blandat" || (input.birchShare !== null && input.birchShare > 30)) {
    warnings.push("Röjningsstöd: blandbestånd eller högt lövinslag kräver tydlig målbild innan röjning föreslås.");
    priorityFieldChecks.push("Blandbestånd: väg trädslag, kvalitet, produktion, naturhänsyn och viltfoder innan uttag.");
    lowersConfidence = true;
  }

  if (input.snowWindRisk === "ja") {
    warnings.push("Röjningsstöd: markerad snö-/vindrisk kräver kontroll av stabilitet, täthet och stamform.");
    priorityFieldChecks.push("Kontrollera snö-/vindrisk och lämna inte ett onödigt vekt bestånd efter åtgärden.");
    lowersConfidence = true;
  }

  if (input.damage === "tydliga" || input.damage === "svara") {
    warnings.push("Röjningsstöd: tydliga skador gör att stamval, vitalitet, svamp/insekter och ersättningsstammar måste kontrolleras.");
    priorityFieldChecks.push("Kontrollera skador, vitalitet, svamp, insekter och ersättningsstammar innan röjning.");
    lowersConfidence = true;
  }

  if (input.vitality === "svag") {
    warnings.push("Röjningsstöd: svag vitalitet kräver försiktig stamvalskontroll och tydlig målbild.");
    fieldChecks.push("Kontrollera kronstatus och vitalitet innan huvudstammar väljs.");
    lowersConfidence = true;
  }

  if (input.conservation === "ja" || input.conservation === "osakert") {
    fieldChecks.push("Hänsyn: kontrollera kantzoner, lövträd, naturvärdesträd och kulturmiljö separat från produktionsmålet.");
  }

  if (input.reindeerMountain === "ja" || input.reindeerMountain === "osakert") {
    fieldChecks.push("Rennäring: kontrollera lavbärande marker, hänglav och flyttleder som separat hänsynsfråga.");
  }

  return {
    explanation: "Röjningsforskningen används som förklarings- och fältstöd, inte som prisregel eller hård gräns.",
    warnings,
    fieldChecks: unique([...priorityFieldChecks, ...fieldChecks]),
    sourceNotes,
    lowersConfidence
  };
}

function buildBjorkLovResearchAssessment(input, assessment) {
  if (!isBjorkLovResearchRelevant(input, assessment)) {
    return emptyResearchAssessment();
  }

  const warnings = [
    "Lövspår: eget kunskapsstöd används. Tall/gran-mallar används inte som facit."
  ];
  const fieldChecks = [
    "Lövspår: kontrollera målbild innan åtgärd - lövproduktion, barr, bibehållen blandning, natur eller vilt.",
    "Kontrollera stamval: vitalitet, kvalitet, skador, rakhet, krona och utvecklingsbarhet.",
    "Kontrollera ljuskonkurrens och grönkrona; björk, asp och al är pionjärträdslag med eget skötselbehov.",
    "Kontrollera skador/risk: vilt, röta, svamp, insekter, snö-/vindrisk och konkurrensskador.",
    "Kontrollera naturvärden och hänsyn separat från produktionsmålet."
  ];
  const sourceNotes = [
    BJORK_LOV_RESEARCH_SUPPORT_SUMMARY.note,
    "Skogsskötselserien 9 används för förklaring och fältkontroll. Den aktiverar inga lövkurvor, barrmallar, diagramvärden, juridiska beslut eller hårda produktionsgränser."
  ];
  let lowersConfidence = false;

  if (input.mainSpecies === "asp") {
    fieldChecks.push("Asp: kontrollera rotskott, vilt/skador, grönkrona, kvalitet, naturvärden och om beståndet är vanlig asp eller hybridasp.");
  }

  if (input.mainSpecies === "al") {
    fieldChecks.push("Al: kontrollera ståndort, fukt, kvävefixering, skottskjutning, skador och om beståndet är klibbal eller gråal.");
  }

  if (input.mainSpecies === "blandat" || (input.birchShare !== null && input.birchShare > 30)) {
    warnings.push("Lövinslag/blandbestånd: kontrollera om målet är barr, bibehållen blandning, lövproduktion, natur eller vilt innan mall används.");
    fieldChecks.push("Blandbestånd: bedöm trädslag var för sig och använd inte tall-/granmall som facit för lövdelen.");
    lowersConfidence = true;
  }

  if (input.damage === "tydliga" || input.damage === "svara" || input.vitality === "svag" || input.snowWindRisk === "ja") {
    lowersConfidence = true;
  }

  return {
    explanation: "Lövstödet från Skogsskötselserien 9 används som förklarings- och fältstöd, inte som ny kurva eller barrfacit.",
    warnings,
    fieldChecks,
    sourceNotes,
    lowersConfidence
  };
}

function isGallringResearchRelevant(input, assessment) {
  if (isLovSpecies(input.mainSpecies)) return false;
  return ["curve_reference_pilot", "curve_missing", "final_felling_check", "curve_monitor", "thinning_soon", "thinning_now", "late_thinning_risk"].includes(assessment.actionCode);
}

function isRojningResearchRelevant(input, assessment) {
  return input.standPhase === "ungskog" || ["cleaning_plan", "cleaning_now", "delayed_cleaning"].includes(assessment.actionCode);
}

function isBjorkLovResearchRelevant(input, assessment) {
  return isLovSpecies(input.mainSpecies) ||
    input.mainSpecies === "blandat" ||
    (input.birchShare !== null && input.birchShare > 30) ||
    (assessment.actionCode === "curve_missing" && isLovSpecies(input.mainSpecies));
}

function emptyResearchAssessment() {
  return {
    explanation: "",
    warnings: [],
    fieldChecks: [],
    sourceNotes: [],
    lowersConfidence: false
  };
}

function isLikelyFirstThinning(input, assessment) {
  if (input.standPhase === "ungskog") return true;
  if (assessment.actionCode === "curve_reference_pilot" && input.heightMeters !== null && input.heightMeters <= 15.5) return true;
  return false;
}

function curveSourceNotes(curveReference) {
  if (!curveReference?.curve) return [];
  return [
    `${curveReference.curve.source}, ${curveReference.curve.sourcePage}.`,
    `Kurvstatus: ${curveReference.curve.status}; datakvalitet: ${curveReference.curve.dataQuality || "saknas"}; aktiv användning: ${curveReference.curve.activeUse || "saknas"}; reviewNeeded: ${curveReference.curve.reviewNeeded === false ? "false" : "true"}.`,
    ...curveReference.curve.limitations
  ];
}

function sourceCandidateNotes(sourceCandidate) {
  if (!sourceCandidate) return [];
  return [
    `${sourceCandidate.title}: identifierad källa, men inga verifierade kurvdata är aktiverade i appen.`,
    ...sourceCandidate.limitations
  ];
}

function legalCheck({ id, severity, effect, userText, canBlockAction, reviewNeeded = false }) {
  return {
    id,
    severity,
    effect,
    userText,
    canBlockAction,
    canMakeLegalDecision: false,
    reviewNeeded,
    source: LEGAL_CONTROL_RULES_SUMMARY.primarySourceId
  };
}

function groupSourcesByEvidence(evidenceAssessment) {
  const groups = {
    law: [],
    research: [],
    regional_curve: [],
    skogskunskap_tool: [],
    skogskunskap_guidance: [],
    skogskunskap: [],
    decision_support_reference: [],
    scenario_reference: [],
    practice_guide: [],
    field_observation: [],
    warning: []
  };

  evidenceAssessment.evidenceItems.forEach((item) => {
    if (!groups[item.type]) groups[item.type] = [];
    groups[item.type].push(item);
    if (item.type === "skogskunskap_tool" || item.type === "skogskunskap_guidance") {
      groups.skogskunskap.push(item);
    }
  });

  return groups;
}

function chartNote(actionCode, input, siteIndexEstimate, curveReference, sourceCandidate) {
  if (isClearingAction(actionCode)) {
    return "Röjningsspår: forskningsstödet visas som fältkontroll. Ingen gallringskurva används som röjningsfacit.";
  }
  if (isLovSpecies(input.mainSpecies)) {
    return "Lövspår: kurvunderlag saknas eller är ofullständigt. Punkten visas utan tall-/granmall som facit.";
  }
  if (actionCode === "curve_reference_pilot") {
    return "Källstött T20-exempel finns. Jämför mot full gallringsmall innan åtgärd.";
  }
  if (actionCode === "insufficient_data") {
    return "Ange huvudträdslag, höjd och grundyta för att visa punkten.";
  }
  if (!siteIndexEstimate.numericSiteIndex) {
    return "Kurvunderlag saknas eller SI saknas. Jämför manuellt mot regional mall.";
  }
  if (!curveReference && sourceCandidate) {
    return "Kurva identifierad i källbank men saknar verifierade värden i appen.";
  }
  if (!curveReference) {
    return "SI finns, men gallringskurva saknas i appens kunskapsbas för vald kombination.";
  }
  return "Kurvstatus visas från källstött underlag.";
}

function legalStatusLabel(input) {
  if (input.region === "hoglage_fjallnara") {
    return "Kontroll krävs";
  }

  if (input.productiveForestLandAssumption === "uncertain") {
    return "Kontroll rekommenderas";
  }

  if (input.conservation === "ja" ||
    input.conservation === "osakert" ||
    input.reindeerMountain === "ja" ||
    input.reindeerMountain === "osakert" ||
    input.productiveForestLandAssumption === "non_productive") {
    return "Kontroll krävs";
  }
  return "Ingen flagga";
}

function regionWarningText(input, curveReference, actionCode) {
  if (input.region !== "okand") return "";
  if (curveReference?.status) return "Region är okänd. Regionalt underlag används bara som jämförelse.";
  if (actionCode === "curve_missing") return "Välj region för att kunna jämföra mot regionala mallar.";
  return "";
}

function buildPlanText(actionCode, recommendationDirection) {
  if (isClearingAction(actionCode)) {
    return "Beståndet är markerat som ungskog/röjningsspår. Använd underlaget för fältkontroll av stamval, trädslag, skador, hänsyn och målbild. Röjningsforskningen ändrar inte prisberäkning eller skapar hårda stamantalsgränser.";
  }

  if (actionCode === "curve_reference_pilot") {
    return "Beståndet har jämförts mot källstött T20-exempel för norra Sverige. Underlaget är ett pilotstöd och bör kontrolleras mot full gallringsmall innan åtgärd skrivs in i planen.";
  }

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

function isPilotCurveStatus(status) {
  return status === "active_pilot" || status === "pilot";
}

function isClearingAction(actionCode) {
  return ["cleaning_plan", "cleaning_now", "delayed_cleaning"].includes(actionCode);
}

function isLovSpecies(species) {
  return ["bjork", "asp", "al"].includes(species);
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeProductiveForestLandAssumption(input) {
  const current = clean(input.productiveForestLandAssumption);
  if (current) return current;

  const legacy = clean(input.productiveForest);
  if (legacy === "nej") return "non_productive";
  return "assumed_productive";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
