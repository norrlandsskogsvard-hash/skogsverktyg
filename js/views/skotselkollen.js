import { calculateSkotselRecommendation } from "../calculators/skotselCalculator.js";
import { getStoredValue, setStoredValue, removeStoredValue } from "../storage.js";
import { createPageHeader, escapeHtml, showToast } from "../ui.js";

const STORAGE_KEY = "skotselkollenDraft";

const DEFAULT_DRAFT = {
  mainSpecies: "tall",
  region: "okand",
  standPhase: "okand",
  heightMeters: "",
  stemsPerHa: "",
  basalArea: "",
  dgvCm: "",
  ageYears: "",
  siteIndex: "",
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
  productiveForest: "osakert"
};

const SELECTS = {
  mainSpecies: [["tall", "Tall"], ["gran", "Gran"], ["bjork", "Björk"], ["blandat", "Blandat"]],
  region: [["norrland_kust", "Norrland kust"], ["norrland_inland", "Norrland inland"], ["hoglage_fjallnara", "Högläge/fjällnära"], ["okand", "Okänd"]],
  standPhase: [["ungskog", "Ungskog"], ["gallringsskog", "Gallringsskog"], ["aldre_skog", "Äldre skog"], ["okand", "Okänd"]],
  damage: [["inga", "Inga"], ["latta", "Lätta"], ["tydliga", "Tydliga"], ["svara", "Svåra"]],
  gaps: [["jamnt", "Jämnt"], ["nagot_luckigt", "Något luckigt"], ["luckigt", "Luckigt"]],
  vitality: [["bra", "Bra"], ["normal", "Normal"], ["svag", "Svag"]],
  bearing: [["god", "God"], ["normal", "Normal"], ["svag_blot", "Svag/blöt"]],
  yesNo: [["nej", "Nej"], ["ja", "Ja"]],
  yesNoUnknown: [["nej", "Nej"], ["ja", "Ja"], ["osakert", "Osäkert"]],
  productive: [["ja", "Ja"], ["nej", "Nej"], ["osakert", "Osäkert"]]
};

export function renderSkotselkollenView() {
  const page = document.createElement("div");
  const draft = { ...DEFAULT_DRAFT, ...getStoredValue(STORAGE_KEY, {}) };

  page.append(createPageHeader("Skötselkollen", "Röjning, gallring eller slutavverkning baserat på beståndsvärden, källmatris och lagkontroll."));
  page.insertAdjacentHTML("beforeend", viewTemplate(draft));

  const form = page.querySelector("[data-skotsel-form]");
  const resultTargets = page.querySelectorAll("[data-skotsel-result]");
  const feedback = page.querySelector("[data-skotsel-feedback]");
  const resetButton = page.querySelector("[data-reset-skotsel]");

  function currentInput() {
    return Object.fromEntries(new FormData(form).entries());
  }

  function renderResult() {
    const input = currentInput();
    setStoredValue(STORAGE_KEY, input);
    const recommendation = calculateSkotselRecommendation(input);
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

  page.addEventListener("click", async (event) => {
    const copyButton = event.target.closest("[data-copy-plantext]");
    if (!copyButton) {
      return;
    }
    const recommendation = calculateSkotselRecommendation(currentInput());
    try {
      await navigator.clipboard.writeText(recommendation.planText);
      showToast("Plantext kopierad.");
    } catch (error) {
      showToast("Kunde inte kopiera plantext automatiskt.");
    }
  });

  resetButton.addEventListener("click", () => {
    if (!window.confirm("Rensa Skötselkollen-utkastet?")) {
      return;
    }
    removeStoredValue(STORAGE_KEY);
    form.reset();
    Object.entries(DEFAULT_DRAFT).forEach(([key, value]) => {
      if (form.elements[key]) {
        form.elements[key].value = value;
      }
    });
    renderResult();
  });

  renderResult();
  return page;
}

function viewTemplate(values) {
  return "<section class='skotsel-layout'>" +
    "<form class='form skotsel-form' data-skotsel-form>" +
      "<div class='skotsel-mobile-title'><strong>Skötselkollen</strong><span>Röjning, gallring eller slutavverkning</span></div>" +
      card("Snabb bedömning", "skotsel-card skotsel-quick-card", "<div class='skotsel-quick-grid'>" + quickFields(values).join("") + "</div>") +
      "<div class='field-actions skotsel-actions'>" +
        "<button class='button button--large' type='submit'>Uppdatera bedömning</button>" +
        "<button class='button button--secondary' type='button' data-reset-skotsel>Rensa formulär</button>" +
      "</div>" +
      "<section class='skotsel-mobile-result' aria-live='polite' data-skotsel-result></section>" +
      "<div class='skotsel-advanced'>" +
        advancedDetails("Trädslagsandelar och risk", fields(riskFields(values))) +
        advancedDetails("Juridisk kontroll", fields(legalFields(values)), shouldOpenLegal(values)) +
      "</div>" +
      "<p class='field-feedback' data-skotsel-feedback></p>" +
    "</form>" +
    "<aside class='skotsel-result' aria-live='polite'>" +
      "<div data-skotsel-result></div>" +
    "</aside>" +
  "</section>";
}

function quickFields(values) {
  return [
    selectField("mainSpecies", "Huvudträdslag", SELECTS.mainSpecies, values.mainSpecies),
    selectField("region", "Region", SELECTS.region, values.region),
    selectField("standPhase", "Beståndsfas", SELECTS.standPhase, values.standPhase, "field--full"),
    numberField("heightMeters", "Höjd, m", values.heightMeters, "0.1"),
    numberField("basalArea", "Grundyta", values.basalArea, "0.1"),
    numberField("ageYears", "Ålder", values.ageYears, "1"),
    numberField("dgvCm", "DGV", values.dgvCm, "0.1"),
    numberField("stemsPerHa", "Stamantal", values.stemsPerHa, "1", "field--full")
  ];
}

function riskFields(values) {
  return [
    numberField("birchShare", "Björkandel %", values.birchShare, "1"),
    numberField("spruceShare", "Granandel %", values.spruceShare, "1"),
    numberField("pineShare", "Tallandel %", values.pineShare, "1"),
    numberField("siteIndex", "Ståndortsindex, om känt", values.siteIndex, "0.1"),
    numberField("volumeM3", "Virkesförråd, om känt", values.volumeM3, "1"),
    selectField("damage", "Skador", SELECTS.damage, values.damage),
    selectField("gaps", "Luckighet", SELECTS.gaps, values.gaps),
    selectField("vitality", "Kronor/vitalitet", SELECTS.vitality, values.vitality),
    selectField("bearing", "Bärighet", SELECTS.bearing, values.bearing),
    selectField("snowWindRisk", "Snörisk/vindutsatt", SELECTS.yesNo, values.snowWindRisk)
  ];
}

function legalFields(values) {
  return [
    selectField("conservation", "Naturvärden/kulturmiljö", SELECTS.yesNoUnknown, values.conservation),
    selectField("reindeerMountain", "Rennäring/fjällnära", SELECTS.yesNoUnknown, values.reindeerMountain),
    selectField("productiveForest", "Produktiv skogsmark", SELECTS.productive, values.productiveForest)
  ];
}

function resultTemplate(result) {
  const hasWarnings = result.warnings.length > 0;
  return "<section class='result-panel result-panel--strong skotsel-result-card'>" +
    "<div class='skotsel-result-summary'>" +
      resultMetric("Nästa åtgärd", result.actionLabel) +
      resultMetric("Säkerhet", confidenceLabel(result.confidence)) +
      resultMetric("Prioritet", result.actionPriority) +
    "</div>" +
    "<div class='skotsel-result-core'>" +
      resultBlock("Varför?", result.why || result.forestryAssessment) +
      listBlock("Kontrollera i fält", result.fieldChecks || result.nextChecks || []) +
      directionBlock(result.recommendationDirection) +
      resultBlock("Juridisk kontroll", result.legalAssessment) +
    "</div>" +
    "<div class='skotsel-advanced skotsel-advanced--result'>" +
      advancedDetails("Graf", chartTemplate(result.chartData)) +
      advancedDetails("Varningar", listTemplate(result.warnings), hasWarnings) +
      advancedDetails("Plantext", "<div class='skotsel-plantext'><p>" + escapeHtml(result.planText) + "</p><button class='button button--secondary' type='button' data-copy-plantext>Kopiera plantext</button></div>") +
      advancedDetails("Källor och antaganden", listTemplate(result.sourceNotes), false, "skotsel-sources") +
    "</div>" +
  "</section>";
}

function listBlock(title, values) {
  return "<section class='skotsel-result-section'><h3>" + escapeHtml(title) + "</h3>" + listTemplate(values) + "</section>";
}

function directionBlock(text) {
  return "<section class='skotsel-direction'><h3>Rekommenderad riktning</h3><p>" + escapeHtml(text || "Följ upp när fler fältvärden finns.") + "</p></section>";
}

function chartTemplate(chartData) {
  const height = chartData.heightMeters;
  const basal = chartData.basalArea;
  const hasPoint = height !== null && basal !== null;
  const x = hasPoint ? clamp(44 + height * 7, 44, 288) : 44;
  const y = hasPoint ? clamp(188 - basal * 4, 24, 188) : 188;
  const point = hasPoint ? "<circle cx='" + x + "' cy='" + y + "' r='6' class='skotsel-chart__point'></circle>" : "";
  const label = hasPoint ? escapeHtml(height.toFixed(1).replace(".", ",") + " m / " + basal.toFixed(1).replace(".", ",") + " m²") : "Ange höjd och grundyta";

  return "<div class='skotsel-chart' role='img' aria-label='Punktdiagram för höjd och grundyta'>" +
    "<svg viewBox='0 0 330 220' focusable='false'>" +
      "<line x1='38' y1='192' x2='305' y2='192'></line>" +
      "<line x1='38' y1='18' x2='38' y2='192'></line>" +
      "<text x='160' y='214'>Höjd</text>" +
      "<text x='4' y='110' transform='rotate(-90 12 110)'>Grundyta</text>" +
      point +
    "</svg>" +
    "<p class='card__text'><strong>" + escapeHtml(label) + "</strong><br>" + escapeHtml(chartData.note) + "</p>" +
  "</div>";
}

function resultMetric(label, value) {
  return "<div class='result-chip skotsel-metric'><span>" + escapeHtml(label) + "</span><strong>" + escapeHtml(value) + "</strong></div>";
}

function resultBlock(title, text) {
  return "<section class='skotsel-result-section'><h3>" + escapeHtml(title) + "</h3><p>" + escapeHtml(text) + "</p></section>";
}

function listTemplate(values) {
  if (!values.length) {
    return "<p class='card__text'>Inga särskilda punkter.</p>";
  }
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

function shouldOpenLegal(values) {
  return [values.conservation, values.reindeerMountain, values.productiveForest].some((value) => value === "ja" || value === "osakert" || value === "nej");
}

function confidenceLabel(value) {
  if (value === "high") return "Hög";
  if (value === "medium") return "Medel";
  return "Låg";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
