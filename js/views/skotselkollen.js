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

  page.append(createPageHeader("Skötselkollen", "Bedöm nästa möjliga åtgärd i beståndet med skoglig rekommendation och separat juridisk kontroll."));
  page.insertAdjacentHTML("beforeend", viewTemplate(draft));

  const form = page.querySelector("[data-skotsel-form]");
  const result = page.querySelector("[data-skotsel-result]");
  const feedback = page.querySelector("[data-skotsel-feedback]");
  const copyButton = page.querySelector("[data-copy-plantext]");
  const resetButton = page.querySelector("[data-reset-skotsel]");

  function currentInput() {
    return Object.fromEntries(new FormData(form).entries());
  }

  function renderResult() {
    const input = currentInput();
    setStoredValue(STORAGE_KEY, input);
    const recommendation = calculateSkotselRecommendation(input);
    result.innerHTML = resultTemplate(recommendation);
    feedback.textContent = "Utkast sparat på enheten.";
    copyButton.disabled = !recommendation.planText;
  }

  form.addEventListener("input", renderResult);
  form.addEventListener("change", renderResult);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderResult();
  });

  copyButton.addEventListener("click", async () => {
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
      card("Bestånd", fields([
        selectField("mainSpecies", "Huvudträdslag", SELECTS.mainSpecies, values.mainSpecies),
        selectField("region", "Region", SELECTS.region, values.region),
        selectField("standPhase", "Beståndsfas", SELECTS.standPhase, values.standPhase)
      ])) +
      card("Mätvärden", fields([
        numberField("heightMeters", "Övre höjd eller medelhöjd, meter", values.heightMeters, "0.1"),
        numberField("stemsPerHa", "Stamantal per ha", values.stemsPerHa, "1"),
        numberField("basalArea", "Grundyta, m²/ha", values.basalArea, "0.1"),
        numberField("dgvCm", "DGV, cm", values.dgvCm, "0.1"),
        numberField("ageYears", "Ålder, år", values.ageYears, "1"),
        numberField("siteIndex", "Ståndortsindex, om känt", values.siteIndex, "0.1"),
        numberField("volumeM3", "Virkesförråd, om känt", values.volumeM3, "1")
      ])) +
      card("Trädslagsandelar och risk", fields([
        numberField("birchShare", "Björkandel %", values.birchShare, "1"),
        numberField("spruceShare", "Granandel %", values.spruceShare, "1"),
        numberField("pineShare", "Tallandel %", values.pineShare, "1"),
        selectField("damage", "Skador", SELECTS.damage, values.damage),
        selectField("gaps", "Luckighet", SELECTS.gaps, values.gaps),
        selectField("vitality", "Kronor/vitalitet", SELECTS.vitality, values.vitality),
        selectField("bearing", "Bärighet", SELECTS.bearing, values.bearing),
        selectField("snowWindRisk", "Snörisk/vindutsatt", SELECTS.yesNo, values.snowWindRisk)
      ])) +
      card("Juridisk kontroll", fields([
        selectField("conservation", "Naturvärden/kulturmiljö", SELECTS.yesNoUnknown, values.conservation),
        selectField("reindeerMountain", "Rennäring/fjällnära", SELECTS.yesNoUnknown, values.reindeerMountain),
        selectField("productiveForest", "Produktiv skogsmark", SELECTS.productive, values.productiveForest)
      ])) +
      "<div class='field-actions skotsel-actions'>" +
        "<button class='button button--large' type='submit'>Uppdatera bedömning</button>" +
        "<button class='button button--secondary' type='button' data-reset-skotsel>Rensa formulär</button>" +
      "</div>" +
      "<p class='field-feedback' data-skotsel-feedback></p>" +
    "</form>" +
    "<aside class='skotsel-result' aria-live='polite'>" +
      "<div data-skotsel-result></div>" +
      "<button class='button button--secondary' type='button' data-copy-plantext>Kopiera plantext</button>" +
    "</aside>" +
  "</section>";
}

function resultTemplate(result) {
  return "<section class='result-panel result-panel--strong skotsel-result-card'>" +
    "<div class='skotsel-result-top'>" +
      resultMetric("Nästa åtgärd", result.actionLabel) +
      resultMetric("Confidence", confidenceLabel(result.confidence)) +
      resultMetric("Prioritet", result.actionPriority) +
    "</div>" +
    chartTemplate(result.chartData) +
    resultBlock("Skoglig bedömning", result.forestryAssessment) +
    resultBlock("Juridisk kontroll", result.legalAssessment) +
    listBlock("Varningar", result.warnings) +
    listBlock("Nästa fältkontroller", result.nextChecks) +
    resultBlock("Plantext", result.planText) +
    "<details class='skotsel-sources'><summary>Källor och antaganden</summary>" +
      listTemplate(result.sourceNotes) +
    "</details>" +
  "</section>";
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
  return "<div class='skotsel-metric'><span>" + escapeHtml(label) + "</span><strong>" + escapeHtml(value) + "</strong></div>";
}

function resultBlock(title, text) {
  return "<section class='skotsel-result-section'><h3>" + escapeHtml(title) + "</h3><p>" + escapeHtml(text) + "</p></section>";
}

function listBlock(title, values) {
  return "<section class='skotsel-result-section'><h3>" + escapeHtml(title) + "</h3>" + listTemplate(values) + "</section>";
}

function listTemplate(values) {
  if (!values.length) {
    return "<p class='card__text'>Inga särskilda punkter.</p>";
  }
  return "<ul class='skotsel-list'>" + values.map((value) => "<li>" + escapeHtml(value) + "</li>").join("") + "</ul>";
}

function card(title, body) {
  return "<article class='card'><div class='card__body'><h3 class='card__title'>" + escapeHtml(title) + "</h3>" + body + "</div></article>";
}

function fields(items) {
  return "<div class='form-grid'>" + items.join("") + "</div>";
}

function selectField(name, label, options, value) {
  return "<label class='field'><span>" + escapeHtml(label) + "</span><select class='select' name='" + name + "'>" +
    options.map(([optionValue, optionLabel]) => "<option value='" + optionValue + "'" + (optionValue === value ? " selected" : "") + ">" + escapeHtml(optionLabel) + "</option>").join("") +
  "</select></label>";
}

function numberField(name, label, value, step) {
  return "<label class='field'><span>" + escapeHtml(label) + "</span><input class='input' type='number' inputmode='decimal' min='0' step='" + step + "' name='" + name + "' value='" + escapeHtml(value ?? "") + "'></label>";
}

function confidenceLabel(value) {
  if (value === "high") return "Hög";
  if (value === "medium") return "Medel";
  return "Låg";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
