import { calculateSkotselRecommendation } from "../calculators/skotselCalculator.js";
import { getStoredValue, setStoredValue, removeStoredValue } from "../storage.js";
import { createPageHeader, escapeHtml, showToast } from "../ui.js";

const STORAGE_KEY = "skotselkollenDraft";

const DEFAULT_DRAFT = {
  mainSpecies: "tall",
  region: "okand",
  heightMeters: "",
  basalArea: "",
  ageYears: "",
  ageType: "totalalder",
  stemsPerHa: "",
  dgvCm: "",
  siteIndex: "",
  standPhase: "okand",
  volumeM3: "",
  birchShare: "",
  spruceShare: "",
  pineShare: "",
  damage: "inga",
  gaps: "jamnt",
  vitality: "normal",
  bearing: "normal",
  snowWindRisk: "nej",
  conservation: "nej",
  reindeerMountain: "nej",
  productiveForestLandAssumption: "assumed_productive",
  soilMoisture: "okand",
  movingGroundwater: "okand",
  vegetationType: "",
  soilTexture: "",
  soilDepth: ""
};

const SELECTS = {
  mainSpecies: [["tall", "Tall"], ["gran", "Gran"], ["bjork", "Björk"], ["blandat", "Blandat"]],
  region: [["norrland_kust", "Norrland kust"], ["norrland_inland", "Norrland inland"], ["hoglage_fjallnara", "Högläge/fjällnära"], ["okand", "Okänd"]],
  ageType: [["totalalder", "Totalålder"], ["brosthojdsalder", "Brösthöjdsålder"], ["osaker", "Osäker"]],
  standPhase: [["ungskog", "Ungskog"], ["gallringsskog", "Gallringsskog"], ["aldre_skog", "Äldre skog"], ["okand", "Okänd"]],
  damage: [["inga", "Inga"], ["latta", "Lätta"], ["tydliga", "Tydliga"], ["svara", "Svåra"]],
  gaps: [["jamnt", "Jämnt"], ["nagot_luckigt", "Något luckigt"], ["luckigt", "Luckigt"]],
  vitality: [["bra", "Bra"], ["normal", "Normal"], ["svag", "Svag"]],
  bearing: [["god", "God"], ["normal", "Normal"], ["svag_blot", "Svag/blöt"]],
  yesNo: [["nej", "Nej"], ["ja", "Ja"]],
  yesNoUnknown: [["nej", "Nej"], ["ja", "Ja"], ["osakert", "Osäkert"]],
  landClass: [["assumed_productive", "Produktiv skogsmark, antas"], ["uncertain", "Osäker markklass"], ["non_productive", "Ej produktiv / impediment / specialfall"]],
  moisture: [["okand", "Okänd"], ["torr", "Torr"], ["frisk", "Frisk"], ["fuktig", "Fuktig"], ["blot", "Blöt"]],
  movingWater: [["okand", "Okänd"], ["nej", "Nej"], ["ja", "Ja"], ["osakert", "Osäkert"]]
};

const SOURCE_GROUPS = [
  ["law", "Lag"],
  ["research", "Forskning/myndighet"],
  ["regional_curve", "Regional gallringsmall"],
  ["skogskunskap", "Skogskunskap"],
  ["decision_support_reference", "Beslutsstöd"],
  ["scenario_reference", "Scenarioverktyg"],
  ["practice_guide", "Praktiska skötselmallar"],
  ["field_observation", "Fältobservationer"],
  ["warning", "Fältvarningar"]
];

export function renderSkotselkollenView() {
  const page = document.createElement("div");
  const draft = { ...DEFAULT_DRAFT, ...getStoredValue(STORAGE_KEY, {}) };

  page.append(createPageHeader("Skötselkollen", "Snabb gallringsmall i fält"));
  page.insertAdjacentHTML("beforeend", viewTemplate(draft));

  const form = page.querySelector("[data-skotsel-form]");
  const resultTargets = page.querySelectorAll("[data-skotsel-result]");
  const siSummary = page.querySelector("[data-si-summary]");
  const manualSi = page.querySelector("[data-manual-si]");
  const toggleSiButton = page.querySelector("[data-toggle-si]");
  const feedback = page.querySelector("[data-skotsel-feedback]");
  const resetButton = page.querySelector("[data-reset-skotsel]");

  function currentInput() {
    return Object.fromEntries(new FormData(form).entries());
  }

  function renderResult() {
    const input = currentInput();
    setStoredValue(STORAGE_KEY, input);
    const recommendation = calculateSkotselRecommendation(input);
    siSummary.innerHTML = siTemplate(recommendation.siteIndexEstimate);
    resultTargets.forEach((target) => {
      target.innerHTML = resultTemplate(recommendation);
    });
    feedback.textContent = "Utkast sparat på enheten.";
  }

  form.addEventListener("input", renderResult);
  form.addEventListener("change", renderResult);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderResult();
  });

  toggleSiButton.addEventListener("click", () => {
    manualSi.classList.toggle("hidden");
  });

  page.addEventListener("click", async (event) => {
    const copyButton = event.target.closest("[data-copy-plantext]");
    if (!copyButton) return;
    const recommendation = calculateSkotselRecommendation(currentInput());
    try {
      await navigator.clipboard.writeText(recommendation.planText);
      showToast("Plantext kopierad.");
    } catch (error) {
      showToast("Kunde inte kopiera plantext automatiskt.");
    }
  });

  resetButton.addEventListener("click", () => {
    if (!window.confirm("Rensa Skötselkollen-utkastet?")) return;
    removeStoredValue(STORAGE_KEY);
    form.reset();
    Object.entries(DEFAULT_DRAFT).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value;
    });
    manualSi.classList.add("hidden");
    renderResult();
  });

  if (draft.siteIndex) manualSi.classList.remove("hidden");

  renderResult();
  return page;
}

function viewTemplate(values) {
  return "<section class='skotsel-layout'>" +
    "<form class='form skotsel-form' data-skotsel-form>" +
      "<div class='skotsel-mobile-title'><strong>Skötselkollen</strong><span>Snabb gallringsmall i fält</span></div>" +
      card("Snabb gallringskoll", "skotsel-card skotsel-quick-card", quickCardBody(values)) +
      "<div class='field-actions skotsel-actions'>" +
        "<button class='button button--large' type='submit'>Visa i gallringskurva</button>" +
        "<button class='button button--secondary' type='button' data-reset-skotsel>Rensa formulär</button>" +
      "</div>" +
      "<section class='skotsel-mobile-result' aria-live='polite' data-skotsel-result></section>" +
      advancedControl(values) +
      "<p class='field-feedback' data-skotsel-feedback></p>" +
    "</form>" +
    "<aside class='skotsel-result' aria-live='polite'>" +
      "<div data-skotsel-result></div>" +
    "</aside>" +
  "</section>";
}

function quickCardBody(values) {
  return "<div class='skotsel-quick-grid'>" + quickFields(values).join("") + "</div>" +
    "<div class='skotsel-si-box'>" +
      "<div data-si-summary></div>" +
      "<button class='button button--secondary button--compact' type='button' data-toggle-si>Ändra SI manuellt</button>" +
    "</div>" +
    "<div class='skotsel-manual-si hidden' data-manual-si>" +
      numberField("siteIndex", "Manuellt SI", values.siteIndex, "0.1") +
    "</div>";
}

function quickFields(values) {
  return [
    selectField("mainSpecies", "Huvudträdslag", SELECTS.mainSpecies, values.mainSpecies),
    selectField("region", "Region", SELECTS.region, values.region),
    numberField("heightMeters", "Höjd, m", values.heightMeters, "0.1"),
    numberField("basalArea", "Grundyta, m²/ha", values.basalArea, "0.1"),
    numberField("ageYears", "Ålder, år", values.ageYears, "1"),
    selectField("ageType", "Ålderstyp", SELECTS.ageType, values.ageType),
    numberField("stemsPerHa", "Stamantal, valfritt", values.stemsPerHa, "1"),
    numberField("dgvCm", "DGV, valfritt", values.dgvCm, "0.1")
  ];
}

function advancedControl(values) {
  return "<details class='skotsel-advanced-root'>" +
    "<summary>Fördjupad kontroll</summary>" +
    "<div class='skotsel-advanced'>" +
      "<p class='skotsel-assumption-note'>Produktiv skogsmark antas vid fältmätning. Ändra i avancerat vid specialfall.</p>" +
      advancedDetails("Trädslagsandelar och risk", fields(riskFields(values))) +
      advancedDetails("Juridisk kontroll", fields(legalFields(values))) +
      advancedDetails("Naturvärden/kulturmiljö", fields(natureFields(values))) +
      advancedDetails("Rennäring/fjällnära", fields(reindeerFields(values))) +
      advancedDetails("Bonitering/fördjupning", fields(siteFields(values))) +
    "</div>" +
  "</details>";
}

function riskFields(values) {
  return [
    selectField("standPhase", "Beståndsfas", SELECTS.standPhase, values.standPhase),
    numberField("birchShare", "Björkandel %", values.birchShare, "1"),
    numberField("spruceShare", "Granandel %", values.spruceShare, "1"),
    numberField("pineShare", "Tallandel %", values.pineShare, "1"),
    numberField("volumeM3", "Virkesförråd, om känt", values.volumeM3, "1"),
    selectField("damage", "Skador", SELECTS.damage, values.damage),
    selectField("gaps", "Luckighet", SELECTS.gaps, values.gaps),
    selectField("vitality", "Kronor/vitalitet", SELECTS.vitality, values.vitality),
    selectField("bearing", "Bärighet", SELECTS.bearing, values.bearing),
    selectField("snowWindRisk", "Snörisk/vindutsatt", SELECTS.yesNo, values.snowWindRisk)
  ];
}

function legalFields(values) {
  return [selectField("productiveForestLandAssumption", "Markförutsättning", SELECTS.landClass, values.productiveForestLandAssumption)];
}

function natureFields(values) {
  return [selectField("conservation", "Naturvärden/kulturmiljö", SELECTS.yesNoUnknown, values.conservation)];
}

function reindeerFields(values) {
  return [selectField("reindeerMountain", "Rennäring/fjällnära", SELECTS.yesNoUnknown, values.reindeerMountain)];
}

function siteFields(values) {
  return [
    selectField("soilMoisture", "Markfuktighet", SELECTS.moisture, values.soilMoisture),
    selectField("movingGroundwater", "Rörligt markvatten", SELECTS.movingWater, values.movingGroundwater),
    textField("vegetationType", "Vegetationstyp", values.vegetationType),
    textField("soilTexture", "Jordart/textur", values.soilTexture),
    textField("soilDepth", "Jorddjup", values.soilDepth)
  ];
}

function resultTemplate(result) {
  const hasWarnings = result.warnings.length > 0;
  return "<section class='result-panel result-panel--strong skotsel-result-card'>" +
    "<div class='skotsel-result-summary'>" +
      resultMetric("Skogligt", result.forestryStatus || result.actionLabel) +
      resultMetric("Juridik", result.legalStatus || "Ingen flagga") +
      resultMetric("Säkerhet", confidenceLabel(result.confidence)) +
    "</div>" +
    chartTemplate(result.chartData) +
    regionWarningTemplate(result.regionWarning) +
    quickProposalTemplate(result) +
    evidenceSummaryTemplate(result.evidenceAssessment) +
    "<div class='skotsel-result-core'>" +
      resultBlock("Varför?", result.why) +
      directionBlock(result.recommendationDirection) +
    "</div>" +
    "<div class='skotsel-advanced skotsel-advanced--result'>" +
      advancedDetails("Juridisk kontroll", resultBlock("Juridisk kontroll", result.legalAssessment)) +
      advancedDetails("Varningar", listTemplate(result.warnings), hasWarnings) +
      advancedDetails("Plantext", "<div class='skotsel-plantext'><p>" + escapeHtml(result.planText) + "</p><button class='button button--secondary' type='button' data-copy-plantext>Kopiera plantext</button></div>") +
      advancedDetails("Källor och antaganden", groupedSourcesTemplate(result.groupedSourceNotes || {}, result.sourceNotes, result.evidenceAssessment), false, "skotsel-sources") +
    "</div>" +
  "</section>";
}

function quickProposalTemplate(result) {
  const proposal = quickProposal(result);
  return "<section class='skotsel-fast-proposal'>" +
    "<h3>Snabbt förslag</h3>" +
    "<div class='skotsel-proposal-grid'>" +
      proposalBlock("Förslag", proposal.proposal) +
      proposalBlock("Varför", proposal.why) +
      "<section><h4>Kontrollera i fält</h4>" + listTemplate(proposal.checks) + "</section>" +
      proposalBlock("Nästa steg", proposal.nextStep) +
    "</div>" +
  "</section>";
}

function quickProposal(result) {
  if (result.actionCode === "curve_reference_pilot") {
    return {
      proposal: "Använd T20-exemplet som jämförelse, inte som färdigt åtgärdsbeslut.",
      why: "Beståndspunkten kan jämföras mot källstött pilotunderlag, men full kurva saknas.",
      checks: ["Stabilitet och kronslängd.", "Full regional gallringsmall.", "Naturvärden och hänsyn."],
      nextStep: "Jämför mot komplett mall innan åtgärd."
    };
  }

  if (result.actionCode === "curve_missing" && /björk/i.test(result.why || "")) {
    return {
      proposal: "Gör manuell björkbedömning utifrån kvalitet, mål och vitala huvudstammar.",
      why: "Björkkurva saknas i appens kunskapsbas.",
      checks: ["Raka och vitala huvudstammar.", "Mål med beståndet.", "Röta, krokighet och storm-/snörisk."],
      nextStep: "Använd inte tall-/granmall som facit för björk."
    };
  }

  if (result.actionCode === "curve_missing") {
    if (result.sourceCandidate) {
      return {
        proposal: "Använd punkten som fältstöd, inte som gallringsbeslut.",
        why: "Källa är identifierad, men verifierade kurvdata saknas i appen.",
        checks: ["Stabilitet och kronslängd.", "Trädslagsblandning.", "Verifierad regional mall."],
        nextStep: "Verifiera och digitalisera rätt kurvdata innan åtgärd."
      };
    }

    return {
      proposal: "Använd punkten som fältstöd, inte som gallringsbeslut.",
      why: "Kurvunderlag saknas för vald kombination.",
      checks: ["Stabilitet och kronslängd.", "Trädslagsblandning.", "Regional mall eller annan källa."],
      nextStep: "Hämta rätt kurvunderlag innan åtgärd."
    };
  }

  return {
    proposal: result.recommendationDirection || "Använd resultatet som fältstöd innan åtgärd.",
    why: result.why || "Bedömningen bygger på inmatade fältvärden och källstöd.",
    checks: (result.quickChecks || []).slice(0, 3),
    nextStep: "Kontrollera fältbilden innan förslaget används."
  };
}

function proposalBlock(title, text) {
  return "<section><h4>" + escapeHtml(title) + "</h4><p>" + escapeHtml(text || "") + "</p></section>";
}

function evidenceSummaryTemplate(evidenceAssessment) {
  if (!evidenceAssessment) return "";
  const summary = evidenceAssessment.fieldSummary || {};
  return "<section class='skotsel-evidence-summary'>" +
    "<h3>Samlad bedömning</h3>" +
    "<p><strong>Bedömning:</strong> " + escapeHtml(summary.assessment || evidenceAssessment.evidenceSummary) + "</p>" +
    compactList("Underlag", summary.evidence || []) +
    compactList("Saknas", summary.missing || []) +
  "</section>";
}

function compactList(title, values) {
  if (!values.length) return "";
  return "<div class='skotsel-compact-list'><strong>" + escapeHtml(title) + ":</strong><ul>" +
    values.slice(0, 4).map((value) => "<li>" + escapeHtml(value) + "</li>").join("") +
  "</ul></div>";
}

function groupedSourcesTemplate(groupedSources, fallbackNotes = [], evidenceAssessment) {
  const groups = SOURCE_GROUPS.map(([type, label]) => {
    const items = groupedSources[type] || [];
    if (!items.length) return "";
    return "<section class='skotsel-source-group'><h4>" + escapeHtml(label) + "</h4><ul>" + items.map(sourceItemTemplate).join("") + "</ul></section>";
  }).filter(Boolean);

  const balance = evidenceAssessment ? sourceBalanceTemplate(evidenceAssessment.sourceBalance) : "";
  if (groups.length) return groups.join("") + balance;
  return listTemplate(fallbackNotes);
}

function sourceItemTemplate(item) {
  return "<li><strong>" + escapeHtml(item.sourceLabel || item.source || item.type) + "</strong> &mdash; " +
    escapeHtml(sourceRoleLabel(item.type)) + " &mdash; " +
    escapeHtml(sourceLimitation(item)) +
    (item.claim ? "<small>" + escapeHtml(item.claim) + "</small>" : "") +
  "</li>";
}

function sourceBalanceTemplate(sourceBalance = {}) {
  return "<details class='skotsel-source-balance-details'>" +
    "<summary>Källbalans och teknisk viktning</summary>" +
    "<div class='skotsel-source-balance'>" + SOURCE_GROUPS.map(([type, label]) =>
      "<span><strong>" + escapeHtml(String(sourceBalanceCount(sourceBalance, type))) + "</strong>" + escapeHtml(label) + "</span>"
    ).join("") + "</div>" +
  "</details>";
}

function sourceBalanceCount(sourceBalance, type) {
  if (type === "skogskunskap") {
    return (sourceBalance.skogskunskap_tool || 0) + (sourceBalance.skogskunskap_guidance || 0);
  }
  return sourceBalance[type] || 0;
}

function sourceRoleLabel(type) {
  return {
    law: "lag",
    research: "forskning/myndighet",
    regional_curve: "regional mall",
    skogskunskap_tool: "verktygsstöd",
    skogskunskap_guidance: "vägledning",
    decision_support_reference: "beslutsstöd",
    scenario_reference: "scenarioverktyg",
    practice_guide: "praktisk mall",
    field_observation: "fältvärden",
    warning: "varning"
  }[type] || type;
}

function sourceLimitation(item) {
  if (item.type === "decision_support_reference") return "referensram, inte facit";
  if (item.type === "scenario_reference") return "långsiktig analys, inte fältgräns";
  if (item.type === "practice_guide") return "förenklad, ej facit";
  if (item.type === "skogskunskap_tool") return skogskunskapToolLimitation(item);
  if (item.type === "skogskunskap_guidance") return "ska vägas mot lag/forskning/fält";
  if (item.type === "regional_curve" && item.strength === "pilot") return "pilot, inte full kurva";
  if (item.type === "law") return "kan kräva kontroll";
  if (item.type === "warning") return "kräver fältkontroll";
  return item.limitations?.[0] || "stödjande underlag";
}

function skogskunskapToolLimitation(item) {
  if (item.role === "boniteringsstod") return "kräver rätt indata";
  if (item.role === "lovrojningsstod") return "ej gallringsfacit";
  if (item.role === "sasongsstod") return "ej beståndsmodell";
  return "modell/förenkling";
}

function regionWarningTemplate(text) {
  if (!text) return "";
  return "<p class='skotsel-region-warning'>" + escapeHtml(text) + "</p>";
}

function siTemplate(siteIndexEstimate) {
  const value = siteIndexEstimate.siteIndex || "saknas";
  const method = methodLabel(siteIndexEstimate.method);
  const warning = siteIndexEstimate.missing?.length
    ? "<small>SI saknas - välj manuellt eller gör fördjupad bonitering.</small>"
    : "<small>Säkerhet: " + escapeHtml(confidenceLabel(siteIndexEstimate.confidence)) + (method ? " · " + escapeHtml(method) : "") + "</small>";
  return "<div class='skotsel-si-summary'><span>Beräknat SI</span><strong>" + escapeHtml(value) + "</strong>" + warning + "</div>";
}

function chartTemplate(chartData) {
  const height = chartData.heightMeters;
  const basal = chartData.basalArea;
  const hasPoint = height !== null && basal !== null;
  const x = hasPoint ? chartX(height) : 44;
  const y = hasPoint ? chartY(basal) : 188;
  const point = hasPoint ? pointTemplate(x, y, height, basal) : "";
  const label = hasPoint ? escapeHtml("Bestånd: " + formatNumber(height) + " m / " + formatNumber(basal) + " m²/ha") : "Ange höjd och grundyta";
  const curveReference = chartData.curveReference;
  const hasPilot = curveReference?.status === "pilot";
  const hasComplete = curveReference?.status === "complete";
  const zones = hasComplete ? completeZonesTemplate() : "";
  const pilot = hasPilot ? pilotCurveTemplate(curveReference.curve) : "";
  const badge = hasPilot ? "<span>Pilot: T20-exempel, ej full kurva</span>" : "<span>" + escapeHtml(chartData.status || "") + "</span>";

  return "<article class='skotsel-chart' role='img' aria-label='Gallringskurva med beståndets punkt'>" +
    "<div class='skotsel-chart__head'><h3>Gallringskurva</h3>" + badge + "</div>" +
    "<svg viewBox='0 0 340 230' focusable='false'>" +
      gridTemplate() +
      zones +
      pilot +
      "<line x1='38' y1='192' x2='305' y2='192'></line>" +
      "<line x1='38' y1='18' x2='38' y2='192'></line>" +
      "<text x='160' y='224' class='skotsel-chart__axis-title'>Höjd, m</text>" +
      "<text x='8' y='116' class='skotsel-chart__axis-title' transform='rotate(-90 8 116)'>Grundyta, m²/ha</text>" +
      point +
    "</svg>" +
    chartLegendTemplate(hasPoint, hasPilot, hasComplete) +
    "<p class='card__text skotsel-chart__note'><strong>" + label + "</strong><br>" + escapeHtml(chartStatusText(chartData, hasPilot, hasComplete)) + "</p>" +
  "</article>";
}

function gridTemplate() {
  const yTicks = [10, 20, 30, 40].map((value) =>
    "<g class='skotsel-chart__tick'><line class='skotsel-chart__grid' x1='38' y1='" + chartY(value) + "' x2='305' y2='" + chartY(value) + "'></line><text x='18' y='" + (chartY(value) + 4) + "'>" + value + "</text></g>"
  ).join("");
  const xTicks = [10, 20, 30].map((value) =>
    "<g class='skotsel-chart__tick'><line class='skotsel-chart__grid' x1='" + chartX(value) + "' y1='18' x2='" + chartX(value) + "' y2='192'></line><text x='" + (chartX(value) - 6) + "' y='207'>" + value + "</text></g>"
  ).join("");
  return yTicks + xTicks;
}

function pointTemplate(x, y, height, basal) {
  const labelX = clamp(x + 10, 64, 222);
  const labelY = clamp(y - 12, 30, 178);
  return "<g class='skotsel-chart__stand-point'>" +
    "<circle cx='" + x + "' cy='" + y + "' r='8' class='skotsel-chart__point'></circle>" +
    "<text x='" + labelX + "' y='" + labelY + "'>Bestånd: " + escapeHtml(formatNumber(height)) + " m / " + escapeHtml(formatNumber(basal)) + " m²/ha</text>" +
  "</g>";
}

function chartLegendTemplate(hasPoint, hasPilot, hasComplete) {
  const items = [];
  if (hasPoint) items.push("<span><i class='skotsel-chart__legend-dot skotsel-chart__legend-dot--stand'></i>Beståndspunkt</span>");
  if (hasPilot) {
    items.push("<span><i class='skotsel-chart__legend-dot skotsel-chart__legend-dot--pilot'></i>T20-pilotpunkter</span>");
    items.push("<span><i class='skotsel-chart__legend-line'></i>Exempellinje</span>");
  }
  if (hasComplete) items.push("<span><i class='skotsel-chart__legend-zone'></i>Källstödd zon</span>");
  if (!items.length) return "";
  return "<div class='skotsel-chart__legend'>" + items.join("") + "</div>";
}

function chartStatusText(chartData, hasPilot, hasComplete) {
  const parts = [];
  if (hasPilot) {
    parts.push("T20-exempel, ej full kurva. Full digitaliserad gallringskurva saknas.");
  } else if (!hasComplete) {
    parts.push("Full digitaliserad gallringskurva saknas.");
  }
  if (chartData.note) parts.push(chartData.note);
  if (chartData.regionWarning) parts.push(chartData.regionWarning);
  return [...new Set(parts)].join(" ");
}

function pilotCurveTemplate(curve) {
  const events = curve?.points?.thinningEvents || [];
  if (!events.length) return "";
  const beforePoints = events.map((event) => chartX(event.topHeight) + "," + chartY(event.basalAreaBefore)).join(" ");
  const dots = events.map((event) =>
    "<g class='skotsel-chart__pilot-point'>" +
      "<circle cx='" + chartX(event.topHeight) + "' cy='" + chartY(event.basalAreaBefore) + "' r='5'></circle>" +
      "<text x='" + (chartX(event.topHeight) + 7) + "' y='" + (chartY(event.basalAreaBefore) - 7) + "'>" + escapeHtml(event.label) + "</text>" +
    "</g>"
  ).join("");
  return "<polyline class='skotsel-chart__pilot-line' points='" + beforePoints + "'></polyline>" + dots;
}

function completeZonesTemplate() {
  return "<rect x='38' y='126' width='267' height='34' class='skotsel-chart__zone skotsel-chart__zone--low'></rect>" +
    "<rect x='38' y='82' width='267' height='44' class='skotsel-chart__zone skotsel-chart__zone--mid'></rect>" +
    "<rect x='38' y='38' width='267' height='44' class='skotsel-chart__zone skotsel-chart__zone--high'></rect>";
}

function chartX(height) {
  return clamp(44 + height * 7, 44, 288);
}

function chartY(basalArea) {
  return clamp(188 - basalArea * 4, 24, 188);
}

function methodLabel(method) {
  if (method === "manual") return "Manuellt angivet";
  if (method === "height-age") return "Höjd + ålder";
  return "";
}

function listBlock(title, values) {
  return "<section class='skotsel-result-section'><h3>" + escapeHtml(title) + "</h3>" + listTemplate(values) + "</section>";
}

function directionBlock(text) {
  return "<section class='skotsel-direction'><h3>Rekommenderad riktning</h3><p>" + escapeHtml(text || "Följ upp när fler fältvärden finns.") + "</p></section>";
}

function resultMetric(label, value) {
  return "<div class='result-chip skotsel-metric'><span>" + escapeHtml(label) + "</span><strong>" + escapeHtml(value) + "</strong></div>";
}

function resultBlock(title, text) {
  return "<section class='skotsel-result-section'><h3>" + escapeHtml(title) + "</h3><p>" + escapeHtml(text || "") + "</p></section>";
}

function listTemplate(values) {
  if (!values.length) return "<p class='card__text'>Inga särskilda punkter.</p>";
  return "<ul class='skotsel-list'>" + values.map((value) => "<li>" + escapeHtml(value) + "</li>").join("") + "</ul>";
}

function card(title, className, body) {
  return "<article class='card " + className + "'><div class='card__body'><h3 class='card__title'>" + escapeHtml(title) + "</h3>" + body + "</div></article>";
}

function advancedDetails(title, body, open = false, className = "") {
  return "<details class='" + className + "'" + (open ? " open" : "") + "><summary>" + escapeHtml(title) + "</summary><div class='skotsel-details-body'>" + body + "</div></details>";
}

function fields(items) {
  return "<div class='form-grid'>" + items.join("") + "</div>";
}

function selectField(name, label, options, value, extraClass = "") {
  return "<label class='field " + extraClass + "'><span>" + escapeHtml(label) + "</span><select class='select' name='" + name + "'>" +
    options.map(([optionValue, optionLabel]) => "<option value='" + optionValue + "'" + (optionValue === value ? " selected" : "") + ">" + escapeHtml(optionLabel) + "</option>").join("") +
  "</select></label>";
}

function numberField(name, label, value, step, extraClass = "") {
  return "<label class='field " + extraClass + "'><span>" + escapeHtml(label) + "</span><input class='input' type='number' inputmode='decimal' min='0' step='" + step + "' name='" + name + "' value='" + escapeHtml(value ?? "") + "'></label>";
}

function textField(name, label, value, extraClass = "") {
  return "<label class='field " + extraClass + "'><span>" + escapeHtml(label) + "</span><input class='input' type='text' name='" + name + "' value='" + escapeHtml(value ?? "") + "'></label>";
}

function confidenceLabel(value) {
  if (value === "high") return "Hög";
  if (value === "medium") return "Medel";
  return "Låg";
}

function formatNumber(value) {
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
