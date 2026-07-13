import { calculateSkotselRecommendation } from "../calculators/skotselCalculator.js";
import { buildSkotselFieldReport } from "../calculators/skotselReport.js";
import { isActiveCurveSourceValue, NORRA_THINNING_SOURCE_VALUES } from "../calculators/skotselKnowledgeBase.js";
import { getStoredValue, setStoredValue, removeStoredValue } from "../storage.js";
import { createPageHeader, escapeHtml, showToast } from "../ui.js";

const STORAGE_KEY = "skotselkollenDraft";
const FIELD_HISTORY_KEY = "skotselkollenFieldAssessments";
const MAX_FIELD_HISTORY = 10;

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
  insectRisk: "nej",
  wildlifePressure: "nej",
  conservation: "nej",
  waterEdge: "nej",
  culturalHeritage: "nej",
  reindeerMountain: "nej",
  productiveForestLandAssumption: "assumed_productive",
  soilMoisture: "okand",
  movingGroundwater: "okand",
  vegetationType: "",
  soilTexture: "",
  soilDepth: "",
  objectName: "",
  placeDescription: "",
  fieldNote: "",
  coordinates: "",
  fieldRecordedAt: "",
  fieldSavedAt: ""
};

const SELECTS = {
  mainSpecies: [["tall", "Tall"], ["gran", "Gran"], ["bjork", "Björk"], ["asp", "Asp"], ["al", "Al"], ["blandat", "Blandat"]],
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
  ["field_method", "Fältmetoder"],
  ["consideration", "Hänsyn/risk"],
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
  const fieldStatus = page.querySelector("[data-field-status]");
  const savedList = page.querySelector("[data-saved-field-assessments]");

  function currentInput() {
    return Object.fromEntries(new FormData(form).entries());
  }

  function renderResult() {
    const input = currentInput();
    if (!input.fieldRecordedAt && form.elements.fieldRecordedAt) {
      form.elements.fieldRecordedAt.value = new Date().toISOString();
      input.fieldRecordedAt = form.elements.fieldRecordedAt.value;
    }
    setStoredValue(STORAGE_KEY, input);
    const recommendation = calculateSkotselRecommendation(input);
    siSummary.innerHTML = siTemplate(recommendation.siteIndexEstimate);
    resultTargets.forEach((target) => {
      target.innerHTML = resultTemplate(recommendation);
    });
    updateFieldStatus("Utkast sparat lokalt");
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
    const showReportButton = event.target.closest("[data-show-field-report]");
    const copyReportButton = event.target.closest("[data-copy-field-report]");
    const printReportButton = event.target.closest("[data-print-field-report]");
    const closeReportButton = event.target.closest("[data-close-field-report]");
    const quickChip = event.target.closest("[data-risk-chip]");
    const saveAssessmentButton = event.target.closest("[data-save-field-assessment]");
    const openAssessmentButton = event.target.closest("[data-open-field-assessment]");
    const deleteAssessmentButton = event.target.closest("[data-delete-field-assessment]");
    const clearAssessmentsButton = event.target.closest("[data-clear-field-assessments]");
    const positionButton = event.target.closest("[data-get-position]");

    if (quickChip) {
      applyRiskChip(quickChip.dataset.riskChip);
      renderResult();
      return;
    }

    if (saveAssessmentButton) {
      saveFieldAssessment();
      return;
    }

    if (openAssessmentButton) {
      openSavedAssessment(openAssessmentButton.dataset.openFieldAssessment);
      return;
    }

    if (deleteAssessmentButton) {
      deleteSavedAssessment(deleteAssessmentButton.dataset.deleteFieldAssessment);
      return;
    }

    if (clearAssessmentsButton) {
      if (!window.confirm("Rensa alla lokalt sparade fältbedömningar?")) return;
      setStoredValue(FIELD_HISTORY_KEY, []);
      renderSavedAssessments();
      updateFieldStatus("Sparade bedömningar rensade");
      return;
    }

    if (positionButton) {
      getPosition();
      return;
    }

    if (copyButton) {
      const recommendation = calculateSkotselRecommendation(currentInput());
      try {
        await navigator.clipboard.writeText(recommendation.planText);
        showToast("Plantext kopierad.");
      } catch (error) {
        showToast("Kunde inte kopiera plantext automatiskt.");
      }
      return;
    }

    if (showReportButton) {
      const card = showReportButton.closest(".skotsel-result-card");
      const panel = card?.querySelector("[data-field-report-panel]");
      if (!panel) return;
      const input = currentInput();
      const result = calculateSkotselRecommendation(input);
      const report = buildSkotselFieldReport({ input, result, generatedAt: new Date() });
      panel.innerHTML = fieldReportTemplate(report);
      panel.classList.remove("hidden");
      panel.querySelector("[data-field-report-plain]")?.focus();
      return;
    }

    if (copyReportButton) {
      const panel = copyReportButton.closest("[data-field-report-panel]");
      const textArea = panel?.querySelector("[data-field-report-plain]");
      if (!textArea) return;
      try {
        await navigator.clipboard.writeText(textArea.value);
        showToast("Fältprotokoll kopierat.");
      } catch (error) {
        textArea.focus();
        textArea.select();
        showToast("Kopiera texten manuellt.");
      }
      return;
    }

    if (printReportButton) {
      window.print();
      return;
    }

    if (closeReportButton) {
      const panel = closeReportButton.closest("[data-field-report-panel]");
      if (panel) {
        panel.classList.add("hidden");
        panel.innerHTML = "";
      }
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

  window.addEventListener("online", () => updateFieldStatus("Online igen"));
  window.addEventListener("offline", () => updateFieldStatus("Offlineklar"));

  renderSavedAssessments();
  renderResult();
  return page;

  function updateFieldStatus(message) {
    if (!fieldStatus) return;
    const savedAt = form.elements.fieldSavedAt?.value;
    const parts = [
      navigator.onLine ? "Online" : "Offlineklar",
      message,
      savedAt ? "Senast sparad: " + shortTime(savedAt) : "Osparade ändringar"
    ];
    fieldStatus.textContent = parts.join(" · ");
  }

  function applyRiskChip(chip) {
    const setValue = (name, value) => {
      if (form.elements[name]) form.elements[name].value = value;
    };
    const setIfSoft = (name, value) => {
      if (!form.elements[name]) return;
      if (!form.elements[name].value || ["nej", "okand"].includes(form.elements[name].value)) {
        form.elements[name].value = value;
      }
    };
    const actions = {
      wet: () => { setValue("bearing", "svag_blot"); setValue("soilMoisture", "blot"); },
      wind: () => setValue("snowWindRisk", "ja"),
      snow: () => setValue("snowWindRisk", "ja"),
      wildlife: () => setValue("wildlifePressure", "ja"),
      nature: () => setValue("conservation", "ja"),
      culture: () => { setValue("culturalHeritage", "ja"); setIfSoft("conservation", "osakert"); },
      water: () => { setValue("waterEdge", "ja"); setIfSoft("conservation", "osakert"); },
      mixed: () => { setValue("mainSpecies", "blandat"); setIfSoft("birchShare", "35"); },
      damage: () => { setValue("damage", "tydliga"); setValue("vitality", "svag"); },
      uncertainSi: () => { setValue("siteIndex", ""); setValue("ageType", "osaker"); manualSi.classList.remove("hidden"); }
    };
    actions[chip]?.();
    updateFieldStatus("Osparade ändringar");
  }

  function saveFieldAssessment() {
    const savedAt = new Date().toISOString();
    if (form.elements.fieldSavedAt) form.elements.fieldSavedAt.value = savedAt;
    const input = currentInput();
    const result = calculateSkotselRecommendation(input);
    const current = getStoredValue(FIELD_HISTORY_KEY, []);
    const item = {
      id: "field-" + savedAt,
      savedAt,
      objectName: input.objectName || "Namnlös yta",
      mainSpecies: input.mainSpecies,
      summary: result.forestryStatus || result.actionLabel,
      confidence: result.confidence,
      riskStatus: result.considerationAssessment?.status || "OK",
      legalStatus: result.legalStatus || "Ingen flagga",
      input,
      result,
      fieldNotes: {
        objectName: input.objectName,
        placeDescription: input.placeDescription,
        fieldNote: input.fieldNote,
        coordinates: input.coordinates
      }
    };
    const next = [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, MAX_FIELD_HISTORY);
    setStoredValue(FIELD_HISTORY_KEY, next);
    setStoredValue(STORAGE_KEY, input);
    renderSavedAssessments();
    updateFieldStatus("Sparad lokalt");
    showToast("Fältbedömning sparad lokalt.");
  }

  function renderSavedAssessments() {
    if (!savedList) return;
    const items = getStoredValue(FIELD_HISTORY_KEY, []);
    savedList.innerHTML = savedAssessmentsTemplate(items);
  }

  function openSavedAssessment(id) {
    const item = getStoredValue(FIELD_HISTORY_KEY, []).find((entry) => entry.id === id);
    if (!item) return;
    setFormValues(item.input || {});
    if (item.input?.siteIndex) manualSi.classList.remove("hidden");
    renderResult();
    updateFieldStatus("Sparad bedömning öppnad");
  }

  function deleteSavedAssessment(id) {
    const next = getStoredValue(FIELD_HISTORY_KEY, []).filter((entry) => entry.id !== id);
    setStoredValue(FIELD_HISTORY_KEY, next);
    renderSavedAssessments();
    updateFieldStatus("Sparad bedömning borttagen");
  }

  function setFormValues(values) {
    Object.entries({ ...DEFAULT_DRAFT, ...values }).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value ?? "";
    });
  }

  function getPosition() {
    if (!navigator.geolocation) {
      showToast("Position saknas i denna webbläsare.");
      return;
    }
    updateFieldStatus("Hämtar position");
    navigator.geolocation.getCurrentPosition((position) => {
      const coords = position.coords.latitude.toFixed(6) + ", " + position.coords.longitude.toFixed(6);
      if (form.elements.coordinates) form.elements.coordinates.value = coords;
      renderResult();
      showToast("Position sparad lokalt i utkastet.");
    }, () => {
      showToast("Kunde inte hämta position. Skriv plats manuellt.");
      updateFieldStatus("Position ej sparad");
    }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
  }
}

function viewTemplate(values) {
  return "<section class='skotsel-layout'>" +
    "<form class='form skotsel-form' data-skotsel-form>" +
      "<div class='skotsel-mobile-title'><strong>Skötselkollen</strong><span>Snabb gallringsmall i fält</span></div>" +
      fieldModeBar(values) +
      card("Snabb gallringskoll", "skotsel-card skotsel-quick-card", quickCardBody(values)) +
      "<div class='field-actions skotsel-actions'>" +
        "<button class='button button--large' type='submit'>Visa i gallringskurva</button>" +
        "<button class='button button--secondary' type='button' data-reset-skotsel>Rensa formulär</button>" +
      "</div>" +
      "<section class='skotsel-mobile-result' aria-live='polite' data-skotsel-result></section>" +
      card("Fältanteckning", "skotsel-card skotsel-field-note-card", fieldNoteBody(values)) +
      savedAssessmentsShell() +
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
    "</div>" +
    riskQuickChips();
}

function fieldModeBar() {
  return "<section class='skotsel-field-mode' aria-label='Fältläge'>" +
    "<div><p class='pill'>Fältläge</p><strong>Snabb mobilvy för skogen</strong></div>" +
    "<p data-field-status>Offlineklar · Osparade ändringar</p>" +
  "</section>";
}

function riskQuickChips() {
  const chips = [
    ["wet", "Blöt mark"],
    ["wind", "Vindutsatt"],
    ["snow", "Snörisk"],
    ["wildlife", "Viltbete"],
    ["nature", "Naturvärde"],
    ["culture", "Kulturmiljö"],
    ["water", "Vatten/kantzon"],
    ["mixed", "Blandbestånd"],
    ["damage", "Skador/röta"],
    ["uncertainSi", "Osäker SI"]
  ];
  return "<section class='skotsel-risk-chips'><h4>Snabbval risk/hänsyn</h4><div>" +
    chips.map(([key, label]) => "<button class='button button--secondary skotsel-risk-chip' type='button' data-risk-chip='" + key + "'>" + escapeHtml(label) + "</button>").join("") +
  "</div></section>";
}

function fieldNoteBody(values) {
  return "<div class='form-grid'>" +
    textField("objectName", "Objektnamn/yta", values.objectName) +
    textField("placeDescription", "Platsbeskrivning", values.placeDescription) +
    textField("coordinates", "Koordinater", values.coordinates) +
    "<input type='hidden' name='fieldRecordedAt' value='" + escapeHtml(values.fieldRecordedAt || new Date().toISOString()) + "'>" +
    "<input type='hidden' name='fieldSavedAt' value='" + escapeHtml(values.fieldSavedAt || "") + "'>" +
    "<div class='field field-position-action'><span>Position</span><button class='button button--secondary' type='button' data-get-position>Hämta position</button><small>Sparas bara lokalt i utkastet.</small></div>" +
    textareaField("fieldNote", "Anteckning", values.fieldNote, "span-12") +
  "</div><div class='field-actions skotsel-save-actions'>" +
    "<button class='button' type='button' data-save-field-assessment>Spara fältbedömning</button>" +
  "</div>";
}

function savedAssessmentsShell() {
  return "<section class='card skotsel-card skotsel-saved-assessments'><div class='card__body'>" +
    "<div class='skotsel-section-head'><h3 class='card__title'>Sparade fältbedömningar</h3><button class='button button--secondary' type='button' data-clear-field-assessments>Rensa alla</button></div>" +
    "<div data-saved-field-assessments></div>" +
  "</div></section>";
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
    selectField("snowWindRisk", "Snörisk/vindutsatt", SELECTS.yesNo, values.snowWindRisk),
    selectField("insectRisk", "Insekter/färska skador", SELECTS.yesNoUnknown, values.insectRisk),
    selectField("wildlifePressure", "Viltbete/älgtryck", SELECTS.yesNoUnknown, values.wildlifePressure)
  ];
}

function legalFields(values) {
  return [selectField("productiveForestLandAssumption", "Markförutsättning", SELECTS.landClass, values.productiveForestLandAssumption)];
}

function natureFields(values) {
  return [
    selectField("conservation", "Naturvärden", SELECTS.yesNoUnknown, values.conservation),
    selectField("waterEdge", "Kantzon/vatten", SELECTS.yesNoUnknown, values.waterEdge),
    selectField("culturalHeritage", "Kulturmiljö/fornlämning", SELECTS.yesNoUnknown, values.culturalHeritage)
  ];
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
      resultMetric("Juridik", result.legalStatus || "OK") +
      resultMetric("Hänsyn/risk", result.considerationAssessment?.status || "OK") +
      resultMetric("Säkerhet", confidenceLabel(result.confidence)) +
      resultMetric("SI", siStatusLabel(result.siteIndexEstimate)) +
    "</div>" +
    chartTemplate(result.chartData) +
    regionWarningTemplate(result.regionWarning) +
    quickProposalTemplate(result) +
    evidenceSummaryTemplate(result.evidenceAssessment) +
    "<div class='skotsel-result-core'>" +
      resultBlock("Varför?", result.why) +
      directionBlock(result.recommendationDirection) +
    "</div>" +
    "<div class='field-report-entry'>" +
      "<button class='button button--secondary' type='button' data-show-field-report>Visa fältprotokoll</button>" +
      "<section class='field-report-shell hidden' data-field-report-panel></section>" +
    "</div>" +
    "<div class='skotsel-advanced skotsel-advanced--result'>" +
      advancedDetails("Forskningsstöd", researchSupportTemplate(result)) +
      advancedDetails("Naturhänsyn, skador och vilt", considerationTemplate(result.considerationAssessment), Boolean(result.considerationAssessment?.flags?.length), "skotsel-hansyn-risk") +
      advancedDetails("Juridisk kontroll", resultBlock("Juridisk kontroll", result.legalAssessment)) +
      advancedDetails("Juridiska kontrollflaggor", legalChecksTemplate(result.legalChecks || []), Boolean(result.legalChecks?.length), "skotsel-legal-flags") +
      advancedDetails("Varningar", listTemplate(result.warnings), hasWarnings) +
      advancedDetails("Plantext", "<div class='skotsel-plantext'><p>" + escapeHtml(result.planText) + "</p><button class='button button--secondary' type='button' data-copy-plantext>Kopiera plantext</button></div>") +
      advancedDetails("Källor och antaganden", groupedSourcesTemplate(result.groupedSourceNotes || {}, result.sourceNotes, result.evidenceAssessment), false, "skotsel-sources") +
      advancedDetails("Identifierade kurvor i källbank", curveBankTemplate(), false, "skotsel-curve-bank") +
    "</div>" +
  "</section>";
}

function legalChecksTemplate(checks) {
  const disclaimer = "<p class='card__text'><strong>Detta är kontrollstöd, inte juridiskt besked.</strong></p>";
  if (!checks.length) {
    return disclaimer + "<p class='card__text'>Inga särskilda juridiska kontrollflaggor är markerade i snabbkontrollen.</p>";
  }
  return disclaimer + "<ul class='skotsel-list'>" + checks.map((check) =>
    "<li><strong>" + escapeHtml(legalSeverityLabel(check.severity)) + "</strong> - " + escapeHtml(check.userText) + "</li>"
  ).join("") + "</ul>";
}

function legalSeverityLabel(severity) {
  if (severity === "critical") return "Kontroll krävs";
  if (severity === "warning") return "Kontroll rekommenderas";
  return "Info";
}

function considerationTemplate(assessment = {}) {
  const flags = assessment.flags || [];
  const header = "<p class='card__text'><strong>Hänsyn/risk: " + escapeHtml(assessment.status || "OK") + "</strong></p>";
  const disclaimer = "<p class='card__text'>Detta är risk- och fältstöd, inte juridiskt besked, prisregel eller kurvunderlag.</p>";
  if (!flags.length) {
    return header + disclaimer + "<p class='card__text'>Inga särskilda hänsyns-/riskflaggor är markerade i snabbkontrollen.</p>";
  }
  return header + disclaimer + "<ul class='skotsel-list'>" + flags.map((flag) =>
    "<li><strong>" + escapeHtml(flag.label) + "</strong> - " + escapeHtml(flag.detail) + "</li>"
  ).join("") + "</ul>";
}

function fieldReportTemplate(report) {
  return "<article class='field-report' data-field-report>" +
    "<div class='field-report__header'>" +
      "<div><p class='pill'>Fältprotokoll</p><h3>" + escapeHtml(report.title) + "</h3><p>" + escapeHtml(report.summaryText) + "</p></div>" +
      "<div class='field-report__actions'>" +
        "<button class='button button--secondary' type='button' data-copy-field-report>Kopiera protokoll</button>" +
        "<button class='button button--secondary' type='button' data-print-field-report>Skriv ut</button>" +
        "<button class='button button--secondary' type='button' data-close-field-report>Stäng</button>" +
      "</div>" +
    "</div>" +
    report.sections.map(fieldReportSectionTemplate).join("") +
    "<label class='field-report__plain-text'><span>Kopierbar text</span><textarea readonly data-field-report-plain>" + escapeHtml(report.plainText) + "</textarea></label>" +
  "</article>";
}

function fieldReportSectionTemplate(section) {
  return "<section class='field-report__section'><h4>" + escapeHtml(section.title) + "</h4><ul>" +
    section.lines.map((line) => "<li>" + escapeHtml(line) + "</li>").join("") +
  "</ul></section>";
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
      checks: (result.quickChecks || []).slice(0, 3),
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
        why: sourceCandidateStatusText(result.sourceCandidate),
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

function researchSupportTemplate(result) {
  if (isLovResult(result) && isClearingAction(result.actionCode)) {
    return "<p class='card__text'>Forskningsstöd: röjning påverkar diameterutveckling, stamval, trädslagsfördelning och framtida kvalitet.</p>" +
      "<p class='card__text'>Lövspår: eget kunskapsstöd används. Tall/gran-mallar används inte som facit.</p>" +
      "<p class='card__text'>Skogsskötselserien 9 används för målbild, stamval, ljuskonkurrens, blandning, skador/risk och naturvärden. Det ändrar inte priser, aktiverar inga lövkurvor och skapar inga hårda gränser.</p>";
  }

  if (isLovResult(result)) {
    return "<p class='card__text'>Lövspår: eget kunskapsstöd används. Tall/gran-mallar används inte som facit.</p>" +
      "<p class='card__text'>Skogsskötselserien 9 används för målbild, stamval, ljuskonkurrens, blandning, skador/risk och naturvärden. Det aktiverar inga lövkurvor, diagramvärden, juridiska beslut eller hårda produktionsgränser.</p>";
  }

  if (isClearingAction(result.actionCode)) {
    return "<p class='card__text'>Forskningsstöd: röjning påverkar diameterutveckling, stamval, trädslagsfördelning och framtida kvalitet.</p>" +
      "<p class='card__text'>Används för förklaringar och fältkontroller. Det ändrar inte priser, aktiverar inga kurvor och skapar inga hårda stamantal-/höjdgränser.</p>";
  }

  return "<p class='card__text'>Forskningsstöd: gallring påverkar dimensionsutveckling, risker och beståndets framtida struktur.</p>" +
    "<p class='card__text'>Används för förklaringar, risker och fältkontroller. Det aktiverar inga kurvor, diagramvärden, juridiska beslut eller hårda produktionsgränser.</p>";
}

function isLovResult(result) {
  const text = [
    result?.why,
    result?.recommendationDirection,
    result?.chartData?.note,
    ...(result?.warnings || []),
    ...(result?.fieldChecks || [])
  ].filter(Boolean).join(" ");
  return /Lövspår|LÃ¶vspÃ¥r|Björk|bjÃ¶rk|löv|lÃ¶v|\basp\b|\bal\b/i.test(text);
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
    field_method: "fältmetod",
    consideration: "hänsyn/risk",
    field_observation: "fältvärden",
    warning: "varning"
  }[type] || type;
}

function sourceLimitation(item) {
  if (item.type === "decision_support_reference") return "referensram, inte facit";
  if (item.type === "scenario_reference") return "långsiktig analys, inte fältgräns";
  if (item.type === "practice_guide") return "förenklad, ej facit";
  if (item.type === "field_method") return "metodstöd, inte auto-SI";
  if (item.type === "consideration") return "riskstöd, inte juridiskt beslut";
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

function curveBankTemplate() {
  const active = NORRA_THINNING_SOURCE_VALUES.filter(isActiveCurveSourceValue);
  const inactive = NORRA_THINNING_SOURCE_VALUES.filter((sourceValue) => !isActiveCurveSourceValue(sourceValue));
  const verifiedCandidates = inactive.filter((sourceValue) => sourceValue.status === "verified_candidate");
  const drafts = inactive.filter((sourceValue) => sourceValue.status === "draft_digitized");
  const candidatesWithoutValues = inactive.filter((sourceValue) =>
    sourceValue.status === "candidate" && !hasNorraValues(sourceValue.values) && !hasNorraValues(sourceValue.draftValues)
  );
  const tall = inactive.filter((sourceValue) => sourceValue.species === "tall");
  const gran = inactive.filter((sourceValue) => sourceValue.species === "gran");

  return "<div class='skotsel-curve-bank__intro'>" +
      "<p>Granskningsläge för Norra gallringsmallar. Candidate och draft är inte beslutsunderlag och får inte visas som aktiv kurva.</p>" +
      "<div class='skotsel-curve-bank__summary'>" +
        curveBankStat("Aktiv pilot", active.length) +
        curveBankStat("Verifierade kandidater", verifiedCandidates.length) +
        curveBankStat("Utkast/digitalisering", drafts.length) +
        curveBankStat("Kandidater utan värden", candidatesWithoutValues.length) +
        curveBankStat("Importflöde", "CSV/granskning") +
      "</div>" +
    "</div>" +
    "<div class='skotsel-curve-bank__grid'>" +
      curveBankGroup("Aktiv pilot/verifierad", active, true) +
      curveBankGroup("Tall - identifierad men ej aktiv", tall, false) +
      curveBankGroup("Gran - identifierad men ej aktiv", gran, false) +
    "</div>";
}

function curveBankGroup(title, items, activeGroup) {
  if (!items.length) return "";
  return "<section class='skotsel-curve-bank__group'>" +
    "<h4>" + escapeHtml(title) + "</h4>" +
    "<ul>" + items.map((item) => curveBankItem(item, activeGroup)).join("") + "</ul>" +
  "</section>";
}

function curveBankItem(item, activeGroup) {
  const code = item.speciesCode + item.siteIndex;
  const status = activeGroup
    ? activeCurveStatusLabel(item)
    : inactiveCurveStatusLabel(item);
  return "<li><strong>" + escapeHtml(code) + "</strong><span>" + escapeHtml(status) + "</span></li>";
}

function activeCurveStatusLabel(item) {
  if (item.status === "active_pilot") return "Aktiv pilot - T20-exempel, ej full kurva";
  if (item.activeUse === "full_curve") return "Verifierad full kurva";
  return "Verifierad kurvreferens";
}

function inactiveCurveStatusLabel(item) {
  if (item.status === "verified_candidate") return "Värden finns, kräver aktivering enligt protokoll";
  if (item.status === "draft_digitized") return "Utkast, ej aktiv";
  if (item.status === "rejected") return "Avvisad, ej aktiv";
  return "Ej aktiv kandidat, kräver granskning";
}

function curveBankStat(label, value) {
  return "<span><strong>" + escapeHtml(String(value)) + "</strong>" + escapeHtml(label) + "</span>";
}

function hasNorraValues(values) {
  if (Array.isArray(values)) return values.length > 0;
  if (!values || typeof values !== "object") return false;
  return Object.values(values).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value));
}

function sourceCandidateStatusText(sourceCandidate) {
  if (sourceCandidate?.status === "verified_candidate") {
    return "Värden finns i källbank men är inte aktiverade.";
  }
  if (sourceCandidate?.status === "draft_digitized") {
    return "Utkast finns men är inte verifierat.";
  }
  return "Källa identifierad men värden saknas i appen.";
}

function isPilotCurveStatus(status) {
  return status === "active_pilot" || status === "pilot";
}

function isClearingAction(actionCode) {
  return ["cleaning_plan", "cleaning_now", "delayed_cleaning"].includes(actionCode);
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
  const hasPilot = isPilotCurveStatus(curveReference?.status);
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

function siStatusLabel(siteIndexEstimate = {}) {
  if (siteIndexEstimate.method === "manual") return "Manuellt";
  if (siteIndexEstimate.numericSiteIndex) return "Beräknat";
  return "Saknas";
}

function resultBlock(title, text) {
  return "<section class='skotsel-result-section'><h3>" + escapeHtml(title) + "</h3><p>" + escapeHtml(text || "") + "</p></section>";
}

function listTemplate(values) {
  if (!values.length) return "<p class='card__text'>Inga särskilda punkter.</p>";
  return "<ul class='skotsel-list'>" + values.map((value) => "<li>" + escapeHtml(value) + "</li>").join("") + "</ul>";
}

function savedAssessmentsTemplate(items) {
  if (!items.length) {
    return "<p class='card__text'>Inga sparade fältbedömningar på denna enhet ännu.</p>";
  }
  return "<ul class='skotsel-saved-list'>" + items.map((item) =>
    "<li>" +
      "<div><strong>" + escapeHtml(item.objectName || "Namnlös yta") + "</strong><span>" + escapeHtml(shortTime(item.savedAt)) + " · " + escapeHtml(item.summary || "Bedömning") + " · " + escapeHtml(item.riskStatus || "OK") + "</span></div>" +
      "<div class='skotsel-saved-actions'>" +
        "<button class='button button--secondary' type='button' data-open-field-assessment='" + escapeHtml(item.id) + "'>Öppna</button>" +
        "<button class='button button--secondary' type='button' data-delete-field-assessment='" + escapeHtml(item.id) + "'>Ta bort</button>" +
      "</div>" +
    "</li>"
  ).join("") + "</ul>";
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

function textareaField(name, label, value, extraClass = "") {
  return "<label class='field " + extraClass + "'><span>" + escapeHtml(label) + "</span><textarea class='textarea' name='" + name + "'>" + escapeHtml(value ?? "") + "</textarea></label>";
}

function shortTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "short" }).format(date);
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
