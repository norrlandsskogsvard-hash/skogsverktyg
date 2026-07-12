import {
  getActiveNorraPackages,
  getDraftDigitizedNorraPackages,
  getNorraPackage,
  getReviewNeededNorraPackages,
  getVerifiedCandidateNorraPackages,
  isActiveNorraPackage,
  NORRA_THINNING_VALUE_PACKAGES
} from "./norraThinningValues.js";

export const SKOTSEL_SOURCE_DOCUMENTS = [
  "docs/skotselkollen-kallbibliotek.md",
  "docs/skotselkollen-kallindex.md",
  "docs/skotselkollen-extraktionsplan.md",
  "docs/skotselkollen-kallmatris.md",
  "docs/skotselkollen-beslutsmodell.md",
  "docs/skotselkollen-lagkontroll.md",
  "docs/skotselkollen-input-output.md",
  "docs/skotselkollen-kurvdata.md",
  "docs/skotselkollen-kallviktning.md",
  "docs/skotselkollen-kallbank-skogskunskap.md",
  "docs/skotselkollen-praktiska-mallar.md",
  "docs/skotselkollen-kallvarden-backlog.md",
  "docs/skotselkollen-gallringskurva-ui.md",
  "docs/skotselkollen-norra-gallringsvarden.md",
  "docs/skotselkollen-norra-massimport.md",
  "docs/skotselkollen-norra-batchimport.md",
  "docs/skotselkollen-norra-importflode.md",
  "docs/skotselkollen-norra-textregler.md",
  "docs/skotselkollen-juridiska-kontrollflaggor.md",
  "docs/skotselkollen-gallring-forskningsstod.md",
  "docs/skotselkollen-rojning-forskningsstod.md",
  "docs/skotselkollen-bjork-lov-forskningsstod.md",
  "docs/skotselkollen-bonitering-si-faltstod.md",
  "docs/skotselkollen-aktiveringsprotokoll.md",
  "docs/rojningskalkyl-kallstod.md"
];

export const SOURCE_LIBRARY_SUMMARY = {
  status: "indexed_local_library",
  indexedSources: 22,
  localSources: 19,
  onlineSources: 2,
  onlineMirrors: 1,
  dataFile: "data/source-library.json",
  canActivateDirectly: false,
  note: "Lokalt källbibliotek och onlinekällor finns, värden aktiveras först efter granskning.",
  legalNote: "Riksdagen/SFS är primär lagkälla och Skogsstyrelsen är vägledning. Appens juridiska del är kontrollstöd, inte juridiskt besked."
};

export const NORRA_TEXT_RULES_SUMMARY = {
  sourceId: "norra-gallringsriktlinjer-gallringsmallar",
  dataFile: "data/norra-thinning-text-rules.json",
  ruleCount: 13,
  status: "reviewed_text_rules",
  activeUse: "control_flags_only",
  canActivateCurves: false,
  note: "Norra textregler: användningsvillkor och kontrollflaggor inlästa."
};

export const LEGAL_CONTROL_RULES_SUMMARY = {
  primarySourceId: "law-skogsvardslag-1979-429-riksdagen",
  guidanceSourceIds: ["agency-skogsstyrelsen-skogsvardslagen"],
  dataFile: "data/legal-control-rules.json",
  ruleCount: 10,
  status: "reviewed_control_flags",
  activeUse: "legal_control_flags_only",
  canMakeLegalDecision: false,
  note: "Juridiska kontrollflaggor är inlästa som kontrollstöd, inte juridiskt besked."
};

export const GALLRING_RESEARCH_SUPPORT_SUMMARY = {
  sourceId: "skogsskotselserien-7-gallring",
  dataFile: "data/gallring-research-rules.json",
  ruleCount: 12,
  status: "reviewed_research_support",
  activeUse: "explanation_and_risk_support_only",
  canActivateCurves: false,
  canCreateHardThresholds: false,
  note: "Forskningsstöd: gallring påverkar dimensionsutveckling, risker och beståndets framtida struktur."
};

export const ROJNING_RESEARCH_SUPPORT_SUMMARY = {
  sourceId: "skogsskotselserien-6-rojning",
  dataFile: "data/rojning-research-rules.json",
  ruleCount: 12,
  status: "reviewed_research_support",
  activeUse: "explanation_and_field_support_only",
  canCreateHardThresholds: false,
  canChangePricing: false,
  note: "Forskningsstöd: röjning påverkar diameterutveckling, stamval, trädslagsfördelning och framtida kvalitet."
};

export const BJORK_LOV_RESEARCH_SUPPORT_SUMMARY = {
  sourceId: "skogsskotselserien-9-bjork-al-asp",
  dataFile: "data/bjork-lov-research-rules.json",
  ruleCount: 12,
  status: "reviewed_research_support",
  activeUse: "explanation_and_field_support_only",
  canActivateCurves: false,
  canCreateHardThresholds: false,
  canUseConiferTemplatesAsTruth: false,
  note: "Forskningsstöd: björk, al och asp hanteras som eget lövspår med målbild, ljuskonkurrens, stamval, risker och hänsyn."
};

export const SITE_INDEX_FIELD_SUPPORT_SUMMARY = {
  sourceIds: ["bonitering-ac", "bonitering-bd", "b69-si-internlankar-tabeller"],
  dataFile: "data/site-index-field-rules.json",
  ruleCount: 12,
  status: "reviewed_field_method_support",
  activeUse: "field_method_and_limitations_only",
  canAutoCalculateSI: false,
  canDigitizeCurves: false,
  canCreateHardThresholds: false,
  note: "Bonitering/SI-stöd från AC, BD och B69 används som fältmetod, metodbegränsning och kontrollfrågor. Auto-SI och kurvdigitalisering är spärrade."
};

export const EVIDENCE_TYPE_WEIGHTS = {
  law: 100,
  research: 80,
  regional_curve: 70,
  skogskunskap_tool: 55,
  skogskunskap_guidance: 50,
  decision_support_reference: 50,
  scenario_reference: 45,
  practice_guide: 35,
  field_method: 65,
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
    species: ["bjork", "asp", "al"],
    region: "all",
    variable: "speciesTrack",
    valueRange: null,
    unit: "",
    source: "Användarkrav för Skötselkollen v1",
    page: "",
    confidence: "medium",
    note: "Björk, asp och al hanteras som eget lövspår. Tall- eller granmall används inte som ersättning."
  }
];

export const NORRA_THINNING_SOURCE_VALUES = NORRA_THINNING_VALUE_PACKAGES;

export const THINNING_CURVES = NORRA_THINNING_SOURCE_VALUES
  .filter(isActiveCurveSourceValue)
  .map((sourceValue) => ({
    id: sourceValue.id,
    species: sourceValue.species,
    speciesCode: sourceValue.speciesCode,
    siteIndex: sourceValue.siteIndex,
    region: sourceValue.region,
    source: sourceValue.sourceName,
    sourcePage: sourceValue.sourcePage,
    status: sourceValue.status,
    precision: sourceValue.precision,
    dataQuality: sourceValue.dataQuality,
    confidence: sourceValue.confidence,
    activeUse: sourceValue.activeUse,
    canCreateFullCurve: sourceValue.canCreateFullCurve,
    canAloneGiveHighConfidence: sourceValue.canAloneGiveHighConfidence,
    reviewNeeded: sourceValue.reviewNeeded,
    limitations: sourceValue.limitations,
    points: sourceValue.values
  }));

export function isActiveCurveSourceValue(sourceValue = {}) {
  return isActiveNorraPackage(sourceValue);
}

export const isActiveCurveSource = isActiveCurveSourceValue;

export {
  getActiveNorraPackages,
  getDraftDigitizedNorraPackages,
  getNorraPackage,
  getReviewNeededNorraPackages,
  getVerifiedCandidateNorraPackages
};

export const PRACTICE_GUIDE_SUPPORT = [
  {
    id: "norra-skog-skotselmallar-2024",
    sourceName: "Norra Skog skötselmallar 2024",
    sourceType: "practice_guide",
    sourceYear: 2024,
    sourceRef: "Norra Skog 2024",
    area: "skotsel",
    species: "all",
    claim: "Norra Skog 2024 används som praktisk skötselmall och skogsägarstöd.",
    value: null,
    unit: "",
    role: "praktisk skötselmall / skogsägarstöd",
    limitation: "Förenklad praktisk mall, inte ensam facit, ska vägas mot forskning, regionala mallar, lag och fältbild.",
    confidence: "low",
    status: "documentation_only",
    canRaiseConfidence: false,
    canAloneGiveHighConfidence: false
  }
];

export const CLEARING_SOURCE_SUPPORT = [
  {
    id: "skogskunskap-clearing-analysis",
    sourceName: "Skogskunskap Röjningsanalys",
    sourceType: "skogskunskap_tool",
    area: "rojning",
    usedBy: ["rojningCalculator", "skotselkollen"],
    role: "lonsamhetsstod",
    claim: "Skogskunskap listar Röjningsanalys som verktyg inom skogsvård för röjning.",
    limitation: "Modell/förenkling, inte facit för enskilt bestånd. Inga värden aktiverade i kalkyl utan exakt källa.",
    status: "documentation_only"
  },
  {
    id: "skogskunskap-clearing-clock",
    sourceName: "Skogskunskap Röjningsklockan",
    sourceType: "skogskunskap_tool",
    area: "rojning",
    usedBy: ["rojningCalculator", "skotselkollen"],
    role: "sasongsrisk",
    claim: "Röjningsklockan stödjer bedömning av när på året röjning bör göras med hänsyn till insektsskador.",
    limitation: "Säsongs-/riskstöd, inte kostnadsmodell eller beståndsmodell.",
    status: "advisory"
  },
  {
    id: "skogskunskap-broadleaf-clearing-template",
    sourceName: "Skogskunskap Lövröjningsmall",
    sourceType: "skogskunskap_tool",
    area: "rojning",
    species: ["bjork", "klibbal", "asp"],
    usedBy: ["rojningCalculator", "skotselkollen"],
    role: "lovrojningsstod",
    claim: "Skogskunskap har ett särskilt verktyg för röjning i björk, al och asp.",
    limitation: "Förenklad modell. Inga stamantal eller höjdgränser aktiveras utan exakt källutdrag.",
    status: "documentation_only"
  },
  {
    id: "skogskunskap-silviculture-tools-clearing",
    sourceName: "Skogskunskap Skogsvård verktyg",
    sourceType: "skogskunskap_guidance",
    area: "rojning",
    usedBy: ["rojningCalculator", "skotselkollen"],
    role: "praktiskt verktygsstod",
    claim: "Skogskunskap samlar verktyg för tillväxt och lönsamhet vid röjning, gallring och gödsling.",
    limitation: "Rådgivande stöd. Ska vägas mot fältdata och egna kostnadsschabloner.",
    status: "documentation_only"
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
    id: "research-skotselserien-7-gallring",
    type: "research",
    source: "skogsskotselserien-7-gallring",
    sourceLabel: "Skogsskötselserien 7 Gallring",
    area: "thinning",
    species: "all",
    region: "all",
    appliesTo: ["curve_reference_pilot", "curve_missing", "final_felling_check"],
    claim: "Forskningsstödet används för gallringens syfte, styrka, gallringsform, dimensionsutveckling och riskkontroller.",
    strength: "researchSupport",
    weight: EVIDENCE_TYPE_WEIGHTS.research,
    confidence: "medium",
    limitations: ["Aktiverar inga kurvor, diagramvärden, juridiska beslut eller hårda produktionsgränser."],
    notes: ["Används som förklaring och risk-/fältstöd, inte som facit."]
  },
  {
    id: "research-skotselserien-6-rojning",
    type: "research",
    source: "skogsskotselserien-6-rojning",
    sourceLabel: "Skogsskötselserien 6 Röjning",
    area: "clearing",
    species: "all",
    region: "all",
    appliesTo: ["cleaning_plan", "cleaning_now", "delayed_cleaning"],
    claim: "Forskningsstödet används för röjningens syfte, stamval, trädslagsfördelning, risker och långsiktig kvalitet.",
    strength: "researchSupport",
    weight: EVIDENCE_TYPE_WEIGHTS.research,
    confidence: "medium",
    limitations: ["Ändrar inte röjningskalkylens priser och skapar inga hårda stamantal- eller höjdgränser."],
    notes: ["Används som förklaring och fältstöd, inte som prisfacit."]
  },
  {
    id: "research-skotselserien-9-bjork-lov",
    type: "research",
    source: "skogsskotselserien-9-bjork-al-asp",
    sourceLabel: "Skogsskötselserien 9 Skötsel av björk, al och asp",
    area: "broadleaf",
    species: ["bjork", "asp", "al"],
    region: "all",
    appliesTo: ["curve_missing", "cleaning_plan", "cleaning_now", "delayed_cleaning"],
    claim: "Björk, al och asp hanteras som eget lövspår med målbild, ljuskonkurrens, stamval, risker, naturhänsyn och fältkontroller.",
    strength: "researchSupport",
    weight: EVIDENCE_TYPE_WEIGHTS.research,
    confidence: "medium",
    limitations: ["Aktiverar inga lövkurvor, barrmallar, diagramvärden, juridiska beslut eller hårda produktionsgränser."],
    notes: ["Tall- och granmallar används inte som facit för lövspåret."]
  },
  {
    id: "research-skotselserien-9-blandbestand-lov",
    type: "research",
    source: "skogsskotselserien-9-bjork-al-asp",
    sourceLabel: "Skogsskötselserien 9 Skötsel av björk, al och asp",
    area: "broadleaf",
    species: "blandat",
    region: "all",
    appliesTo: ["curve_missing", "cleaning_plan", "cleaning_now", "delayed_cleaning"],
    claim: "Blandbestånd med löv kräver målbild och separat fältbedömning av konkurrens, skiktning, stamval, risker och hänsyn.",
    strength: "researchSupport",
    weight: EVIDENCE_TYPE_WEIGHTS.research,
    confidence: "medium",
    limitations: ["Ger kontrollflagga och förklaring, men ingen ny kurva eller barrmall som facit."],
    notes: ["Avgör om målet är barr, bibehållen blandning, lövproduktion, natur eller vilt innan mall används."]
  },
  {
    id: "field-method-bonitering-ac-bd-b69",
    type: "field_method",
    source: "bonitering-ac-bd-b69",
    sourceLabel: "Bonitering AC/BD och B69 SI",
    area: "siteIndex",
    species: "all",
    region: "all",
    appliesTo: ["all"],
    claim: "Bonitering/SI används som fältmetod och metodkontroll för höjdutvecklingskurvor, övre höjd, interceptmetod, regionalt underlag och osäkra bestånd.",
    strength: "fieldMethod",
    weight: 65,
    confidence: "medium",
    limitations: ["Auto-SI, diagramdigitalisering, nya kurvor och hårda produktionsgränser är spärrade."],
    notes: ["SI är underlag och osäkerhetsmarkör, inte ensam facitkälla."]
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
    id: "norra-text-rules-control-flags",
    type: "regional_curve",
    source: "norra-thinning-text-rules",
    sourceLabel: "Norra textregler",
    area: "thinning",
    species: "all",
    region: "norra-sverige",
    appliesTo: ["curve_reference_pilot", "curve_missing"],
    claim: "Norra gallringsmallarnas användningsvillkor är inlästa som kontrollflaggor och fältstöd.",
    strength: "controlFlags",
    weight: EVIDENCE_TYPE_WEIGHTS.regional_curve,
    confidence: "medium",
    limitations: ["Textregler aktiverar inga kurvor och innehåller inga digitaliserade diagramvärden."],
    notes: ["Används för kontroll av region, trädslagsandel, beståndstyp, stickvägar, uttagsstyrka och fältmetod."]
  },
  {
    id: "skogskunskap-general-guidance",
    type: "skogskunskap_guidance",
    source: "https://www.skogskunskap.se/",
    sourceLabel: "Skogskunskap",
    area: "skotsel",
    species: "all",
    region: "all",
    appliesTo: ["all"],
    claim: "Skogskunskap är en digital kunskapsbank och rådgivningskälla för praktisk skogsskötsel.",
    role: "kunskapsbank",
    strength: "guidance",
    weight: EVIDENCE_TYPE_WEIGHTS.skogskunskap_guidance,
    confidence: "medium",
    limitations: ["Ska vägas mot lag, forskning, regionala mallar och fältbedömning."],
    notes: ["Källbank utan inlagda numeriska gränsvärden i detta steg."]
  },
  {
    id: "skogskunskap-tools-bank",
    type: "skogskunskap_tool",
    source: "https://www.skogskunskap.se/rakna-med-verktyg/",
    sourceLabel: "Räkna med verktyg",
    area: "beslutsstod",
    species: "all",
    region: "all",
    appliesTo: ["all"],
    claim: "Skogskunskap samlar digitala verktyg för skogliga beräkningar och skogsvård.",
    role: "verktygsbank",
    strength: "toolSupport",
    weight: EVIDENCE_TYPE_WEIGHTS.skogskunskap_tool,
    confidence: "medium",
    limitations: ["Verktyg bygger på modeller/förenklingar och är inte facit för enskilt bestånd."],
    notes: ["Får inte ensam ge hög säkerhet."]
  },
  {
    id: "skogskunskap-thinning-template",
    type: "skogskunskap_tool",
    source: "https://www.skogskunskap.se/rakna-med-verktyg/skogsvard/gallringsmall/",
    sourceLabel: "Gallringsmall barr/löv",
    area: "gallring",
    species: "all",
    region: "all",
    appliesTo: ["curve_reference_pilot", "curve_missing"],
    claim: "Skogskunskap har verktyg för gallringsmallar för barr och löv.",
    role: "gallringsstod",
    strength: "toolSupport",
    weight: EVIDENCE_TYPE_WEIGHTS.skogskunskap_tool,
    confidence: "medium",
    limitations: ["Inga kurvor eller gränsvärden läggs in förrän de är källgranskade."],
    notes: ["Modell/förenkling, inte komplett facit för enskilt bestånd."]
  },
  {
    id: "skogskunskap-site-index",
    type: "skogskunskap_tool",
    source: "https://www.skogskunskap.se/rakna-med-verktyg/mata-skogen/standortsindex/",
    sourceLabel: "Ståndortsindex",
    area: "bonitering",
    species: "all",
    region: "all",
    appliesTo: ["all"],
    claim: "Skogskunskap har verktyg och bakgrund för ståndortsindex och höjdutvecklingskurvor.",
    role: "boniteringsstod",
    strength: "toolSupport",
    weight: EVIDENCE_TYPE_WEIGHTS.skogskunskap_tool,
    confidence: "medium",
    limitations: ["SI kräver rätt indata och rimliga beståndsförutsättningar. Ingen auto-SI aktiveras utan källstödda tabeller."],
    notes: ["Boniteringsstöd utan inlagda SI-tabeller i detta steg."]
  },
  {
    id: "skogskunskap-clearing-tools",
    type: "skogskunskap_tool",
    source: "https://www.skogskunskap.se/rakna-med-verktyg/skogsvard/",
    sourceLabel: "Röjningsanalys/röjningsmall",
    area: "rojning",
    species: "all",
    region: "all",
    appliesTo: ["cleaning_plan", "cleaning_now", "curve_missing"],
    claim: "Skogskunskap har verktyg för röjningsanalys och röjningsbedömning.",
    role: "rojningsstod",
    strength: "toolSupport",
    weight: EVIDENCE_TYPE_WEIGHTS.skogskunskap_tool,
    confidence: "medium",
    limitations: ["Ska inte ersätta fältbedömning av huvudstammar, skador, trädslagsval och mål."],
    notes: ["Röjningsstöd, inte gallringsfacit."]
  },
  {
    id: "skogskunskap-broadleaf-clearing",
    type: "skogskunskap_tool",
    source: "https://www.skogskunskap.se/rakna-med-verktyg/skogsvard/",
    sourceLabel: "Röjningsmall björk/al/asp",
    area: "rojning",
    species: "bjork",
    region: "all",
    appliesTo: ["curve_missing", "cleaning_plan", "cleaning_now"],
    claim: "Skogskunskap har särskilt verktyg/stöd för röjning i björk, klibbal och asp.",
    role: "lovrojningsstod",
    strength: "toolSupport",
    weight: EVIDENCE_TYPE_WEIGHTS.skogskunskap_tool,
    confidence: "medium",
    limitations: ["Förenklad modell/stöd. Ska inte användas som komplett gallringsmall."],
    notes: ["Stödjer björkspecifika kontrollpunkter men ersätter inte källgranskad björkkurva."]
  },
  {
    id: "skogskunskap-clearing-clock",
    type: "skogskunskap_tool",
    source: "https://www.skogskunskap.se/rakna-med-verktyg/skogsvard/",
    sourceLabel: "Röjningsklockan",
    area: "rojning",
    species: "all",
    region: "all",
    appliesTo: ["cleaning_plan", "cleaning_now"],
    claim: "Skogskunskap har säsongs-/riskstöd för röjningstidpunkt.",
    role: "sasongsstod",
    strength: "toolSupport",
    weight: EVIDENCE_TYPE_WEIGHTS.skogskunskap_tool,
    confidence: "low",
    limitations: ["Kalender-/riskstöd, inte komplett beståndsmodell."],
    notes: ["Ska inte användas som full beståndsbedömning."]
  },
  {
    id: "skogskunskap-silviculture-guidance",
    type: "skogskunskap_guidance",
    source: "https://www.skogskunskap.se/",
    sourceLabel: "Röja/gallra/slutavverka",
    area: "skotsel",
    species: "all",
    region: "all",
    appliesTo: ["curve_reference_pilot", "curve_missing", "final_felling_check", "legal_check_required"],
    claim: "Skogskunskap har rådgivningsmaterial om röjning, gallring och slutavverkning.",
    role: "praktisk skotselvagledning",
    strength: "guidance",
    weight: EVIDENCE_TYPE_WEIGHTS.skogskunskap_guidance,
    confidence: "medium",
    limitations: ["Rådgivning ska vägas mot lag, fältdata, forskning och regionala mallar."],
    notes: ["Vägledning, inte ensam facitkälla."]
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
    source: "norra-skog-skotselmallar-2024",
    sourceLabel: "Norra Skog 2024",
    area: "practice",
    species: "all",
    region: "norra-sverige",
    appliesTo: ["curve_reference_pilot", "curve_missing", "final_felling_check"],
    claim: "Norra Skog 2024 kan stödja fältkontroll och arbetsflöde som praktisk skötselmall.",
    role: "praktisk skötselmall / skogsägarstöd",
    strength: "support",
    weight: EVIDENCE_TYPE_WEIGHTS.practice_guide,
    confidence: "low",
    limitations: ["Förenklad praktisk mall, inte ensam facit, ska vägas mot forskning, regionala mallar, lag och fältbild."],
    notes: ["Dokumentationsläge i detta steg. Inga värden från praktiska mallar används som hårda regler."]
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

  if (isPilotCurveStatus(curve.status)) {
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

export function findThinningSourceCandidate(input = {}, siteIndexEstimate = {}) {
  if (!["tall", "gran"].includes(input.mainSpecies)) return null;

  const numericSiteIndex = siteIndexEstimate.numericSiteIndex ?? input.siteIndex;
  if (!numericSiteIndex) return null;

  return NORRA_THINNING_SOURCE_VALUES.find((sourceValue) =>
    !isActiveCurveSourceValue(sourceValue) &&
    ["candidate", "draft_digitized", "verified_candidate"].includes(sourceValue.status) &&
    sourceValue.species === input.mainSpecies &&
    sourceValue.siteIndex === numericSiteIndex &&
    regionMatches(sourceValue.region, input.region)
  ) || null;
}

function isPilotCurveStatus(status) {
  return status === "active_pilot" || status === "pilot";
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

  if (isBroadleafMainSpecies(input.mainSpecies)) {
    notes.push("Lövspåret saknar granskade numeriska kurvvärden i denna checkout.");
  }

  if (isBroadleafMainSpecies(input.mainSpecies)) {
    notes.push(BJORK_LOV_RESEARCH_SUPPORT_SUMMARY.note);
    notes.push("Skogsskötselserien 9 används som förklarings- och fältstöd för björk, al och asp; inte som ny lövkurva.");
  }

  if (input.mainSpecies === "blandat") {
    notes.push("Blandbestånd kräver manuell kontroll av trädslagsblandning, skiktning och målbild innan mall används.");
  }

  notes.push("Gallringszon visas bara när kunskapsbasen innehåller granskad komplett zondata. T20-underlaget är pilot/exempel, inte full kurva.");
  notes.push("INGVAR används endast som referens för arbetsgång och variabler, inte som direkt facit.");
  notes.push("Heureka används som referens för långsiktigt scenario- och beslutsstöd, inte som direkt fältgräns.");
  notes.push("Skogskunskap används som forskningsnära verktygs- och vägledningsstöd, inte som ensam facitkälla.");
  notes.push("Norra Skog 2024 används som praktisk skötselmall och skogsägarstöd, inte som facit eller regional kurva.");
  notes.push(SOURCE_LIBRARY_SUMMARY.note);
  notes.push(SOURCE_LIBRARY_SUMMARY.legalNote);
  notes.push(NORRA_TEXT_RULES_SUMMARY.note);
  notes.push("Norra textregler används endast som kontrollflaggor och fältstöd, inte som nya kurvor.");
  notes.push(LEGAL_CONTROL_RULES_SUMMARY.note);
  notes.push(GALLRING_RESEARCH_SUPPORT_SUMMARY.note);
  notes.push("Skogsskötselserien 7 Gallring används som förklarings- och riskstöd, inte som ny gallringskurva.");
  notes.push(ROJNING_RESEARCH_SUPPORT_SUMMARY.note);
  notes.push(BJORK_LOV_RESEARCH_SUPPORT_SUMMARY.note);
  notes.push("Björk/löv använder inte tall- eller granmall som facit.");
  notes.push(SITE_INDEX_FIELD_SUPPORT_SUMMARY.note);
  notes.push("SI-stödet är fältmetod och osäkerhetsstöd; det aktiverar inte auto-SI, höjdutvecklingskurvor eller nya gallringskurvor.");
  notes.push("Skogsskötselserien 6 Röjning används som förklarings- och fältstöd, inte som prisregel eller hård stamantalsgräns.");
  notes.push("Gallringsmallar norra Sverige används som kommande källa för tall/gran när källmatris är inlagd.");
  notes.push("Björk/löv saknar ännu fullständig granskad kurva i appens kunskapsbas.");
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
  const speciesOk = item.species === "all" ||
    item.species === input.mainSpecies ||
    (Array.isArray(item.species) && item.species.includes(input.mainSpecies));
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

  if (input.productiveForestLandAssumption === "uncertain") {
    warnings.push(warningItem("field-land-class-uncertain", "Markklass är osäker. Kontrollera innan åtgärdsbeslut.", "legal"));
  }

  if (input.productiveForestLandAssumption === "non_productive") {
    warnings.push(warningItem("field-land-class-special", "Ej produktiv/impediment/specialfall är markerat. Kontroll krävs innan åtgärdsbeslut.", "legal"));
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

  if (isBroadleafMainSpecies(input.mainSpecies)) {
    warnings.push(warningItem("missing-broadleaf-curve", "Lövkurva saknas i appen. Tall- eller granmall används inte som facit.", "source"));
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

  if (baseRecommendation.actionCode === "curve_missing" && !isBroadleafMainSpecies(input.mainSpecies)) {
    const candidateClaim = baseRecommendation.sourceCandidate
      ? "Identifierad gallringsmall saknar verifierade kurvdata i appen."
      : "Regional gallringsmall saknas eller är inte inlagd för vald SI/trädslag.";
    missing.push(warningItem("missing-regional-curve", candidateClaim, "source"));
  }

  if (!["curve_reference_pilot"].includes(baseRecommendation.actionCode)) {
    missing.push(warningItem("missing-complete-curve", "Full digitaliserad gallringskurva saknas ännu.", "source"));
  }

  if (isBroadleafMainSpecies(input.mainSpecies)) {
    missing.push(warningItem("missing-broadleaf-curve-support", "Lövspåret saknar komplett källstödd kurva i appen.", "source"));
  }

  return missing;
}

function combineConfidence(baseConfidence, supportingEvidence, conflictingEvidence, legalBlocks) {
  if (legalBlocks.length) return "low";

  const supportingTypes = new Set(supportingEvidence.map((item) => item.type));
  const onlyPracticeGuide = supportingTypes.size === 1 && supportingTypes.has("practice_guide");
  if (onlyPracticeGuide) return capConfidence(baseConfidence, "medium");
  if (onlyModelSupport(supportingTypes)) return capConfidence(baseConfidence, "medium");

  let confidence = baseConfidence || "low";
  if (supportingTypes.has("research") &&
    supportingTypes.has("regional_curve") &&
    (supportingTypes.has("practice_guide") || supportingTypes.has("skogskunskap_tool") || supportingTypes.has("skogskunskap_guidance"))) {
    confidence = "medium";
  }

  if (conflictingEvidence.length) {
    confidence = lowerConfidence(confidence);
  }

  return confidence;
}

function onlyModelSupport(supportingTypes) {
  const ignoredTypes = new Set(["field_observation", "law", "warning"]);
  const modelTypes = new Set(["practice_guide", "skogskunskap_tool", "skogskunskap_guidance"]);
  const activeTypes = [...supportingTypes].filter((type) => !ignoredTypes.has(type));
  return activeTypes.length > 0 && activeTypes.every((type) => modelTypes.has(type));
}

function buildEvidenceSummary(baseRecommendation, supportingEvidence, conflictingEvidence, legalBlocks, combinedConfidence) {
  if (legalBlocks.length) {
    return "Lag- eller hänsynsflaggor kräver kontroll innan skogligt förslag används. Säkerheten hålls därför på " + confidenceLabel(combinedConfidence) + ".";
  }

  const supportTypes = [...new Set(supportingEvidence.map((item) => typeLabel(item.type)))];
  const missingTypes = [...new Set(conflictingEvidence.map((item) => item.area === "source" ? item.claim : ""))].filter(Boolean);
  const onlyPracticeGuide = supportingEvidence.length > 0 && supportingEvidence.every((item) =>
    item.type === "practice_guide" || item.type === "field_observation"
  );

  if (onlyPracticeGuide) {
    return "Förenklat praktiskt stöd. Kontrollera mot regional mall, forskning och fältbild. Samlad säkerhet: " + confidenceLabel(combinedConfidence) + ".";
  }

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
  const missing = shortMissing(input, actionCode, conflictingEvidence, baseRecommendation);
  const legalPrefix = fieldLegalPrefix(input, legalBlocks);
  const regionSuffix = input.region === "okand" ? " Välj region för säkrare regional jämförelse." : "";

  if (actionCode === "curve_reference_pilot") {
    return {
      assessment: legalPrefix + "Beståndet kan jämföras mot T20-pilotunderlag, men full gallringskurva saknas." + regionSuffix,
      evidence,
      missing
    };
  }

  if (isBroadleafMainSpecies(input.mainSpecies)) {
    return {
      assessment: legalPrefix + "Lövspåret kräver manuell fältbedömning eftersom granskad lövkurva saknas. Tall/gran används inte som facit." + regionSuffix,
      evidence,
      missing
    };
  }

  if (actionCode === "curve_missing") {
    if (baseRecommendation.sourceCandidate) {
      return {
        assessment: legalPrefix + "Källa är identifierad, men kurvan är inte digitaliserad i appen." + regionSuffix,
        evidence,
        missing
      };
    }

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
  const hasSkogskunskapTool = supportingEvidence.some((item) => item.type === "skogskunskap_tool");
  const hasSkogskunskapGuidance = supportingEvidence.some((item) => item.type === "skogskunskap_guidance");
  const hasPracticeGuide = supportingEvidence.some((item) => item.type === "practice_guide");

  if (actionCode === "curve_reference_pilot") {
    return withPracticeGuide(withSkogskunskap(["T20-exempel", "gallringsbeslutsstöd", "praktiskt fältstöd"], hasSkogskunskapTool, hasSkogskunskapGuidance), hasPracticeGuide);
  }

  if (isBroadleafMainSpecies(input.mainSpecies)) {
    return withPracticeGuide(withSkogskunskap(["fältvärden", "lövspecifika kontrollpunkter", "Skogsskötselserien 9"], hasSkogskunskapTool, hasSkogskunskapGuidance), hasPracticeGuide);
  }

  const hasResearch = supportingEvidence.some((item) => item.type === "research");
  const values = ["inmatade fältvärden"];
  if (hasResearch) values.push("generella gallringsprinciper");
  return withPracticeGuide(withSkogskunskap(values, hasSkogskunskapTool, hasSkogskunskapGuidance), hasPracticeGuide).slice(0, 4);
}

function withSkogskunskap(values, hasTool, hasGuidance) {
  const nextValues = [...values];
  if (hasTool) nextValues.push("Skogskunskap verktygsstöd");
  if (!hasTool && hasGuidance) nextValues.push("Skogskunskap vägledning");
  return [...new Set(nextValues)];
}

function withPracticeGuide(values, hasPracticeGuide) {
  const nextValues = [...values];
  if (hasPracticeGuide) nextValues.push("Praktisk skötselmall");
  return [...new Set(nextValues)];
}

function fieldLegalPrefix(input, legalBlocks) {
  if (input.productiveForestLandAssumption === "uncertain") {
    return "Markklass är osäker. Kontrollera innan åtgärdsbeslut. ";
  }

  if (input.productiveForestLandAssumption === "non_productive") {
    return "Markklass/specialfall kräver kontroll innan åtgärdsbeslut. ";
  }

  return legalBlocks.length ? "Juridisk kontroll krävs. " : "";
}

function shortMissing(input, actionCode, conflictingEvidence, baseRecommendation = {}) {
  if (isBroadleafMainSpecies(input.mainSpecies)) {
    return ["granskad lövkurva", "komplett lövregel"];
  }

  if (actionCode === "curve_reference_pilot") {
    return ["full digitaliserad kurva", "komplett regional mall"];
  }

  const missing = [];
  if (actionCode === "curve_missing") {
    missing.push(input.siteIndex ? sourceMissingLabel(input, baseRecommendation.sourceCandidate) : "SI eller kurva");
  }
  if (conflictingEvidence.some((item) => item.id === "missing-complete-curve")) {
    missing.push("full regional mall");
  }
  return [...new Set(missing)].slice(0, 3);
}

function sourceMissingLabel(input, sourceCandidate) {
  if (sourceCandidate) return "Verifierade kurvdata för " + sourceCandidate.speciesCode + sourceCandidate.siteIndex;
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

function isBroadleafMainSpecies(species) {
  return ["bjork", "asp", "al"].includes(species);
}

function isLegalFlagged(input) {
  return input.conservation === "ja" ||
    input.conservation === "osakert" ||
    input.reindeerMountain === "ja" ||
    input.reindeerMountain === "osakert" ||
    input.productiveForestLandAssumption === "non_productive";
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
    skogskunskap_tool: "Skogskunskap verktygsstöd",
    skogskunskap_guidance: "Skogskunskap vägledning",
    decision_support_reference: "beslutsstöd",
    scenario_reference: "scenarioverktyg",
    practice_guide: "praktisk skötselmall",
    field_method: "fältmetod",
    field_observation: "fältobservationer",
    warning: "fältvarningar"
  }[type] || type;
}
