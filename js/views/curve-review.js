import {
  buildCsvRowForDraft,
  clearLocalDraft,
  getBlockedReason,
  listCurveDrafts,
  loadCurveReviewWorkspace,
  loadLocalDraft,
  saveLocalDraft,
  summarizeDraft,
  validateDraftPoint
} from "../calculators/curveReview.js";
import { getActiveNorraPackages, getReviewNeededNorraPackages } from "../calculators/norraThinningValues.js";
import { createPageHeader, escapeHtml, showToast } from "../ui.js";

const FIELD_LABELS = {
  topHeight: "Ovre hojd",
  basalAreaBefore: "Grundyta fore",
  basalAreaAfter: "Grundyta efter",
  ageTotal: "Totalalder",
  stemsBefore: "Stamantal fore",
  stemsAfter: "Stamantal efter"
};

export function renderCurveReviewView() {
  const page = document.createElement("div");
  page.className = "curve-review";
  page.append(createPageHeader(
    "Kurvgranskning",
    "Kurvgranskning - for kallarbete, inte faltbeslut."
  ));
  page.insertAdjacentHTML("beforeend", "<section class='curve-review__workspace'><p>Laser granskningsutkast...</p></section>");

  loadCurveReviewWorkspace()
    .then((workspace) => renderWorkspace(page, workspace))
    .catch((error) => {
      page.querySelector(".curve-review__workspace").innerHTML =
        "<div class='result-panel result-panel--strong'><p>Kunde inte lasa kurvgranskningen.</p><small>" +
        escapeHtml(error.message) +
        "</small></div>";
    });

  return page;
}

function renderWorkspace(page, workspace) {
  const drafts = listCurveDrafts(workspace);
  const active = getActiveNorraPackages();
  const blocked = getReviewNeededNorraPackages();
  const tall = drafts.filter((draft) => draft.species === "tall");
  const gran = drafts.filter((draft) => draft.species === "gran");
  const container = page.querySelector(".curve-review__workspace");

  container.innerHTML =
    summaryTemplate(active, drafts, blocked) +
    "<section class='card curve-review__notice'><div class='card__body'>" +
      "<span class='pill'>Granskningslage</span>" +
      "<h3 class='card__title'>Lokal granskning aktiverar inte kurvan.</h3>" +
      "<p class='card__text'>Utkast sparas bara i webblasaren. Aktiv kurva kraver separat import, verifierade kallvarden, validering och aktiveringsprotokoll.</p>" +
    "</div></section>" +
    "<section class='curve-review__groups'>" +
      activeReferenceTemplate(active) +
      draftGroupTemplate("Tall", tall) +
      draftGroupTemplate("Gran", gran) +
    "</section>";

  bindDraftForms(container, drafts);
}

function summaryTemplate(active, drafts, blocked) {
  const activeCodes = active.map((item) => item.speciesCode + item.siteIndex).join(", ") || "Inga";
  return "<section class='curve-review__summary' aria-label='Kurvgranskning sammanfattning'>" +
    summaryCard("Aktiva kurvor", activeCodes) +
    summaryCard("Draftkurvor", drafts.length) +
    summaryCard("Blockerade kandidater", blocked.length) +
    summaryCard("Auto-SI: sparrad", "SITE_INDEX_CURVES = []") +
  "</section>";
}

function summaryCard(label, value) {
  return "<article class='card curve-review__stat'><div class='card__body'>" +
    "<span>" + escapeHtml(label) + "</span>" +
    "<strong>" + escapeHtml(value) + "</strong>" +
  "</div></article>";
}

function activeReferenceTemplate(active) {
  return "<section class='card curve-review__group'><div class='card__body'>" +
    "<span class='pill'>Aktiv referens</span>" +
    "<h3 class='card__title'>T20</h3>" +
    "<p class='card__text'>T20 ar fortsatt aktiv pilot och visas bara som referens i kurvgranskningen. T20 ligger inte som draft.</p>" +
    "<ul class='curve-review__list'>" + active.map((item) =>
      "<li><strong>" + escapeHtml(item.speciesCode + item.siteIndex) + "</strong><span>" +
      escapeHtml(item.status + " / " + item.dataQuality) +
      "</span></li>"
    ).join("") + "</ul>" +
  "</div></section>";
}

function draftGroupTemplate(title, drafts) {
  return "<section class='curve-review__group'>" +
    "<div class='curve-review__group-heading'><h3>" + escapeHtml(title) + "</h3><span class='pill'>" + drafts.length + " draft</span></div>" +
    "<div class='curve-review__draft-grid'>" + drafts.map(draftTemplate).join("") + "</div>" +
  "</section>";
}

function draftTemplate(draft) {
  const local = loadLocalDraft(draft.code);
  const point = { ...(draft.points?.[0] || {}), ...(local?.point || {}) };
  const summary = summarizeDraft(draft);
  const validation = validateDraftPoint(point);
  const savedText = local?.savedAt ? "Lokalt sparad " + new Date(local.savedAt).toLocaleString("sv-SE") : "Ej lokalt sparad";

  return "<article class='card curve-review-card' data-draft-card='" + escapeHtml(draft.code) + "'>" +
    "<form class='card__body curve-review-form' data-draft-code='" + escapeHtml(draft.code) + "'>" +
      "<div class='curve-review-card__top'>" +
        "<div><span class='pill'>Draft/spärrad</span><h4>" + escapeHtml(draft.code) + "</h4></div>" +
        "<strong>SI " + escapeHtml(draft.siteIndex) + "</strong>" +
      "</div>" +
      "<p class='card__text'>" + escapeHtml(speciesLabel(draft.species)) + " · " + escapeHtml(draft.status) + " · " + escapeHtml(draft.reviewStatus) + "</p>" +
      "<p class='card__text'><strong>Varför spärrad:</strong> " + escapeHtml(getBlockedReason(draft)) + "</p>" +
      "<p class='card__text'><strong>Källa/sida:</strong> " + escapeHtml(draft.sourceId || "Norra gallringsmallar") + " " + escapeHtml(draft.sourcePage || "sida saknas") + "</p>" +
      "<div class='form-grid curve-review-form__grid'>" +
        fieldTemplate("sourcePage", "Källsida", point.sourcePage || draft.sourcePage || "", "text") +
        stageTemplate(point.stage || "first_thinning") +
        numberFieldTemplate("topHeight", point.topHeight) +
        numberFieldTemplate("basalAreaBefore", point.basalAreaBefore) +
        numberFieldTemplate("basalAreaAfter", point.basalAreaAfter) +
        numberFieldTemplate("ageTotal", point.ageTotal) +
        numberFieldTemplate("stemsBefore", point.stemsBefore) +
        numberFieldTemplate("stemsAfter", point.stemsAfter) +
        noteTemplate(point.note || "") +
      "</div>" +
      "<div class='curve-review-card__meta'>" +
        "<span data-local-status>" + escapeHtml(savedText) + "</span>" +
        "<span>" + escapeHtml(summary.blockedReason) + "</span>" +
        "<span>" + escapeHtml(validation.warnings.join(" ") || "Punktfälten är lokala utkast.") + "</span>" +
      "</div>" +
      "<textarea class='textarea curve-review-csv' data-csv-output readonly aria-label='CSV-rad for " + escapeHtml(draft.code) + "'></textarea>" +
      "<div class='button-row'>" +
        "<button class='button' type='submit'>Spara lokalt utkast</button>" +
        "<button class='button button--secondary' type='button' data-clear-local>Rensa lokalt</button>" +
        "<button class='button button--secondary' type='button' data-copy-csv>Kopiera som CSV-rad</button>" +
      "</div>" +
    "</form>" +
  "</article>";
}

function fieldTemplate(name, label, value, type) {
  return "<label class='field'><span>" + escapeHtml(label) + "</span>" +
    "<input class='input' name='" + escapeHtml(name) + "' type='" + escapeHtml(type) + "' value='" + escapeHtml(value ?? "") + "'>" +
  "</label>";
}

function numberFieldTemplate(name, value) {
  return "<label class='field'><span>" + escapeHtml(FIELD_LABELS[name]) + "</span>" +
    "<input class='input' name='" + escapeHtml(name) + "' type='number' step='0.1' inputmode='decimal' value='" + escapeHtml(value ?? "") + "'>" +
  "</label>";
}

function stageTemplate(value) {
  const stages = [
    ["first_thinning", "Första gallring"],
    ["second_thinning", "Andra gallring"],
    ["final_felling", "Slutavverkning"]
  ];
  return "<label class='field'><span>Gallringspunkt</span><select class='select' name='stage'>" +
    stages.map(([id, label]) => "<option value='" + id + "'" + (id === value ? " selected" : "") + ">" + escapeHtml(label) + "</option>").join("") +
  "</select></label>";
}

function noteTemplate(value) {
  return "<label class='field field--full'><span>Anteckning</span>" +
    "<textarea class='textarea' name='note'>" + escapeHtml(value) + "</textarea>" +
  "</label>";
}

function bindDraftForms(container, drafts) {
  container.querySelectorAll(".curve-review-form").forEach((form) => {
    const code = form.dataset.draftCode;
    const draft = drafts.find((item) => item.code === code);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const point = pointFromForm(form);
      saveLocalDraft(code, point);
      form.querySelector("[data-local-status]").textContent = "Lokalt sparat " + new Date().toLocaleString("sv-SE");
      showToast("Lokalt utkast sparat. Lokal granskning aktiverar inte kurvan.");
    });

    form.querySelector("[data-clear-local]").addEventListener("click", () => {
      clearLocalDraft(code);
      form.reset();
      form.querySelector("[data-local-status]").textContent = "Lokalt utkast rensat";
      form.querySelector("[data-csv-output]").value = "";
      showToast("Lokalt utkast rensat.");
    });

    form.querySelector("[data-copy-csv]").addEventListener("click", async () => {
      const row = buildCsvRowForDraft(draft, pointFromForm(form));
      form.querySelector("[data-csv-output]").value = row;
      await copyText(row);
      showToast("CSV-rad kopierad.");
    });
  });
}

function pointFromForm(form) {
  return {
    stage: form.elements.stage.value,
    sourcePage: form.elements.sourcePage.value.trim(),
    topHeight: valueOrNull(form.elements.topHeight.value),
    basalAreaBefore: valueOrNull(form.elements.basalAreaBefore.value),
    basalAreaAfter: valueOrNull(form.elements.basalAreaAfter.value),
    ageTotal: valueOrNull(form.elements.ageTotal.value),
    stemsBefore: valueOrNull(form.elements.stemsBefore.value),
    stemsAfter: valueOrNull(form.elements.stemsAfter.value),
    note: form.elements.note.value.trim()
  };
}

function valueOrNull(value) {
  if (value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // CSV-raden visas i textfältet även om webbläsaren blockerar urklipp.
    }
  }
}

function speciesLabel(species) {
  return species === "gran" ? "Gran" : "Tall";
}
