import { findGallringZone, sourceNotesForInput } from "./skotselKnowledgeBase.js";

const ACTIONS = {
  no_action: ["Ingen åtgärd nu", "Låg"],
  monitor: ["Följ upp i fält", "Låg"],
  cleaning_plan: ["Röjning bör planeras", "Medel"],
  cleaning_now: ["Röjning behövs nu", "Hög"],
  delayed_cleaning: ["Försenad röjning / gallringsförberedelse", "Hög"],
  thinning_soon: ["Gallra snart", "Medel"],
  thinning_now: ["Gallra nu", "Hög"],
  late_thinning_risk: ["Sen/riskabel gallring", "Hög"],
  final_felling_possible: ["Slutavverkning kan vara aktuell", "Medel"],
  final_felling_priority: ["Slutavverkning bör prioriteras för kontroll", "Hög"],
  conservation_check: ["Naturvård/hänsyn kräver särskild bedömning", "Hög"],
  legal_check_required: ["Juridisk kontroll krävs", "Hög"],
  insufficient_data: ["Otillräckligt underlag", "Låg"]
};

const REQUIRED_MEASURES = ["heightMeters", "stemsPerHa", "basalArea", "dgvCm"];

export function calculateSkotselRecommendation(input = {}) {
  const normalized = normalizeInput(input);
  const warnings = [];
  const nextChecks = [];
  const sourceNotes = sourceNotesForInput(normalized);
  const legal = buildLegalAssessment(normalized);
  const missingCore = missingCoreFields(normalized);

  if (missingCore.length >= 4) {
    return buildResult(normalized, {
      actionCode: "insufficient_data",
      confidence: "low",
      forestryAssessment: "Underlaget saknar de bärande fältvärdena. Ange minst trädslag, fas och centrala mätvärden innan Skötselkollen ger ett skogligt förslag.",
      legalAssessment: legal.text,
      warnings: [...warnings, ...legal.warnings, "Otillräckligt underlag för skoglig rekommendation."],
      nextChecks: ["Komplettera höjd, stamantal, grundyta, DGV, beståndsfas och huvudträdslag."],
      sourceNotes
    });
  }

  if (legal.hasConservationFlag) {
    warnings.push("Naturvärden eller kulturmiljö har markerats. Skoglig åtgärd kräver särskild hänsynsbedömning.");
  }

  const speciesTrack = resolveSpeciesTrack(normalized, warnings, nextChecks);
  let assessment = assessForestry(normalized, speciesTrack, warnings, nextChecks);

  if (legal.hasConservationFlag && assessment.actionCode !== "insufficient_data") {
    assessment = {
      ...assessment,
      actionCode: "conservation_check",
      confidence: lowerConfidence(assessment.confidence),
      forestryAssessment: assessment.forestryAssessment + " Naturvärde/kulturmiljö gör att förslaget ska behandlas som hänsynsbedömning."
    };
  }

  return buildResult(normalized, {
    ...assessment,
    legalAssessment: legal.text,
    warnings: [...warnings, ...legal.warnings, ...assessment.warnings],
    nextChecks: [...nextChecks, ...legal.nextChecks, ...assessment.nextChecks],
    sourceNotes
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
    productiveForest: clean(input.productiveForest)
  };
}

function missingCoreFields(input) {
  const missing = [];
  if (!input.mainSpecies || input.mainSpecies === "okand") missing.push("huvudträdslag");
  if (!input.standPhase || input.standPhase === "okand") missing.push("beståndsfas");
  REQUIRED_MEASURES.forEach((key) => {
    if (input[key] === null) missing.push(key);
  });
  return missing;
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

function resolveSpeciesTrack(input, warnings, nextChecks) {
  if (input.mainSpecies === "bjork") {
    warnings.push("Björk bedöms som eget spår. Granskade björkgränser saknas i kunskapsbasen.");
    nextChecks.push("Jämför björkbeståndet mot lokalt skötselprogram eller planinstruktion.");
    return { species: "bjork", confidencePenalty: true };
  }

  if (input.mainSpecies === "blandat") {
    const shares = [
      ["tall", input.pineShare],
      ["gran", input.spruceShare],
      ["bjork", input.birchShare]
    ].filter(([, share]) => share !== null);
    const dominant = shares.find(([, share]) => share >= 70);
    if (dominant) {
      warnings.push("Blandbestånd bedöms mot dominerande trädslag enligt angiven andel, men kontrollera skiktning och trädslagsblandning i fält.");
      return { species: dominant[0], confidencePenalty: true };
    }
    warnings.push("Blandbestånd saknar dominerande trädslag över 70 %. Manuell bedömning krävs.");
    nextChecks.push("Bedöm blandning, skiktning och målbild innan huvudåtgärd väljs.");
    return { species: "blandat", manualMixed: true };
  }

  return { species: input.mainSpecies || "okand", confidencePenalty: false };
}

function assessForestry(input, speciesTrack, warnings, nextChecks) {
  const defaults = { warnings: [], nextChecks: [] };

  if (speciesTrack.manualMixed) {
    return {
      ...defaults,
      actionCode: "monitor",
      confidence: "low",
      forestryAssessment: "Blandbeståndet saknar tydligt dominerande trädslag enligt inmatade andelar. Skötselkollen föreslår manuell fältbedömning i stället för att använda tall- eller granmall."
    };
  }

  if (input.standPhase === "ungskog") {
    const hasDensity = input.stemsPerHa !== null;
    return {
      ...defaults,
      actionCode: hasDensity ? "cleaning_plan" : "monitor",
      confidence: "low",
      forestryAssessment: hasDensity
        ? "Beståndsfasen är ungskog och stamantal finns angivet. Röjning bör bedömas i fält, men granskade röjningsgränser saknas i kunskapsbasen."
        : "Beståndet är angivet som ungskog, men stamantal saknas. Röjningsbedömning kräver komplettering.",
      warnings: ["Röjningsbedömningen är osäker eftersom källmatrisens numeriska röjningsvärden saknas."],
      nextChecks: ["Kontrollera huvudstammar, lövandel, luckighet, skador och målbild för röjning."]
    };
  }

  if (input.standPhase === "gallringsskog") {
    const zone = findGallringZone(input);
    if (!zone) {
      return {
        ...defaults,
        actionCode: input.basalArea !== null && input.heightMeters !== null ? "monitor" : "insufficient_data",
        confidence: "low",
        forestryAssessment: "Gallringsskog är angiven, men granskad gallringszon saknas för vald kombination. Skötselkollen visar därför ingen gallringsorder utan föreslår fältkontroll.",
        warnings: ["Gallringskurva eller gränsvärde saknas i kunskapsbasen."],
        nextChecks: ["Kontrollera övre höjd, grundyta, trädslag, SI och regional gallringsmall innan gallring föreslås."]
      };
    }
  }

  if (input.standPhase === "aldre_skog") {
    const hasMaturityData = input.ageYears !== null || input.volumeM3 !== null || input.dgvCm !== null;
    return {
      ...defaults,
      actionCode: hasMaturityData ? "final_felling_possible" : "monitor",
      confidence: "low",
      forestryAssessment: hasMaturityData
        ? "Beståndet är angivet som äldre skog och inmatade värden kan indikera att slutavverkning är aktuell för kontroll inom planeringen."
        : "Äldre skog är angiven, men ålder, virkesförråd och DGV är för svaga för att bedöma slutavverkningsfas.",
      warnings: ["Slutavverkning visas endast som möjlig kontrollpunkt. Lägsta ålder och övriga krav är inte verifierade."],
      nextChecks: ["Kontrollera lägsta ålder, anmälan/tillstånd, naturvärden, rennäring, återväxtkrav och planmål."]
    };
  }

  return {
    ...defaults,
    actionCode: "insufficient_data",
    confidence: "low",
    forestryAssessment: "Beståndsfasen är okänd eller otillräckligt beskriven. Ange fas och centrala mätvärden för att få ett planeringsförslag.",
    nextChecks: ["Bestäm om beståndet är ungskog, gallringsskog eller äldre skog."]
  };
}

function buildResult(input, parts) {
  const [actionLabel, actionPriority] = ACTIONS[parts.actionCode] ?? ACTIONS.insufficient_data;
  const zone = findGallringZone(input);
  const legalAssessment = addFinalFellingLegalText(parts.actionCode, input, parts.legalAssessment, parts.warnings, parts.nextChecks);
  const planText = buildPlanText(parts.actionCode, parts.forestryAssessment, legalAssessment);

  return {
    actionCode: parts.actionCode,
    actionLabel,
    actionPriority,
    confidence: parts.confidence,
    forestryAssessment: parts.forestryAssessment,
    legalAssessment,
    warnings: unique(parts.warnings),
    nextChecks: unique(parts.nextChecks),
    planText,
    sourceNotes: unique(parts.sourceNotes),
    chartData: {
      heightMeters: input.heightMeters,
      basalArea: input.basalArea,
      zone,
      note: zone ? "" : "Kurvunderlag saknas för vald kombination"
    },
    debug: {
      normalizedInput: input,
      missingCore: missingCoreFields(input),
      sourceStatus: "Källdokument saknas i repo; inga ogranskade numeriska regler används."
    }
  };
}

function addFinalFellingLegalText(actionCode, input, legalText, warnings, nextChecks) {
  if (!actionCode.startsWith("final_felling")) {
    return legalText;
  }

  if (input.ageYears === null || input.siteIndex === null) {
    warnings.push("Slutavverkningskontroll saknar ålder eller ståndortsindex.");
  }
  nextChecks.push("Kontrollera lägsta ålder, anmälningsplikt/tillstånd, naturvärden, rennäring och återväxt innan förslag används.");
  return legalText + " Slutavverkningsfas kräver alltid kontroll av lägsta ålder, anmälan/tillstånd, hänsyn och återväxtkrav.";
}

function buildPlanText(actionCode, forestryAssessment, legalAssessment) {
  if (actionCode.startsWith("final_felling")) {
    return "Beståndet bedöms kunna vara i slutavverkningsfas enligt inmatade värden. Före förslag om föryngringsavverkning ska lägsta ålder, anmälningsplikt/tillstånd, naturvärden, rennäring, återväxt och övriga krav enligt Skogsvårdslagen kontrolleras.";
  }

  return "Beståndet är bedömt i fält med Skötselkollen. " + forestryAssessment + " Bedömningen ska vägas mot faktisk beståndsbild, skador, bärighet, naturvärden och juridiska krav innan åtgärd föreslås. " + legalAssessment;
}

function lowerConfidence(confidence) {
  if (confidence === "high") return "medium";
  if (confidence === "medium") return "low";
  return "low";
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const normalized = String(value).replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function clean(value) {
  return String(value ?? "").trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
