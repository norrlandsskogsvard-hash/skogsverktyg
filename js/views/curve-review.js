import {
  buildAssistedCsv,
  buildCsvRowForDraft,
  buildReviewedCandidateExport,
  calculateReviewReadiness,
  clearLocalDraft,
  compareWithAssistedExtraction,
  getBlockedReason,
  loadAssistedExtraction,
  loadLocalReviewedCandidate,
  listCurveDrafts,
  loadCurveReviewWorkspace,
  loadLocalDraft,
  saveLocalDraft,
  saveLocalReviewedCandidate,
  summarizeAssistedExtraction,
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

  Promise.all([loadCurveReviewWorkspace(), loadAssistedExtraction()])
    .then(([workspace, assisted]) => renderWorkspace(page, workspace, assisted))
    .catch((error) => {
      page.querySelector(".curve-review__workspace").innerHTML =
        "<div class='result-panel result-panel--strong'><p>Kunde inte lasa kurvgranskningen.</p><small>" +
        escapeHtml(error.message) +
        "</small></div>";
    });

  return page;
}

function renderWorkspace(page, workspace, assisted) {
  const drafts = listCurveDrafts(workspace);
  const assistedRows = Array.isArray(assisted?.rows) ? assisted.rows : [];
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
      "<p class='card__text'>Utkast och aktiveringskandidater sparas bara i webblasaren. Aktiv kurva kraver separat import, verifierade kallvarden, validering och aktiveringsprotokoll.</p>" +
    "</div></section>" +
    "<section class='card curve-review-assisted' data-assisted-extraction><div class='card__body'><h3 class='card__title'>Assisterad PDF-extraktion</h3><p>Laser assisted extraction...</p></div></section>" +
    "<section class='curve-review__groups'>" +
      activeReferenceTemplate(active) +
      draftGroupTemplate("Tall", tall, assistedRows) +
      draftGroupTemplate("Gran", gran, assistedRows) +
    "</section>";

  bindDraftForms(container, drafts, assistedRows);
  renderAssistedExtraction(container, assisted);
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

function draftGroupTemplate(title, drafts, assistedRows) {
  return "<section class='curve-review__group'>" +
    "<div class='curve-review__group-heading'><h3>" + escapeHtml(title) + "</h3><span class='pill'>" + drafts.length + " draft</span></div>" +
    "<div class='curve-review__draft-grid'>" + drafts.map((draft) => draftTemplate(draft, assistedRows)).join("") + "</div>" +
  "</section>";
}

function draftTemplate(draft, assistedRows = []) {
  const local = loadLocalDraft(draft.code);
  const localCandidate = loadLocalReviewedCandidate(draft.code);
  const point = { ...(draft.points?.[0] || {}), ...(local?.point || {}) };
  const assisted = compareWithAssistedExtraction(draft, assistedRows);
  const readinessDraft = {
    ...draft,
    points: [point],
    assistedRows,
    manualSourceCheck: false,
    reviewedBy: "",
    reviewNote: ""
  };
  const summary = summarizeDraft(draft);
  const validation = validateDraftPoint(point);
  const readiness = calculateReviewReadiness(readinessDraft);
  const savedText = local?.savedAt ? "Lokalt sparad " + new Date(local.savedAt).toLocaleString("sv-SE") : "Ej lokalt sparad";
  const candidateText = localCandidate?.savedAt ? "Sparad som lokal kandidat " + new Date(localCandidate.savedAt).toLocaleString("sv-SE") : "Ingen lokal aktiveringskandidat";

  return "<article class='card curve-review-card' data-draft-card='" + escapeHtml(draft.code) + "'>" +
    "<form class='card__body curve-review-form' data-draft-code='" + escapeHtml(draft.code) + "'>" +
      "<div class='curve-review-card__top'>" +
        "<div><span class='pill'>Draft/sparrad</span><h4>" + escapeHtml(draft.code) + "</h4></div>" +
        "<strong>SI " + escapeHtml(draft.siteIndex) + "</strong>" +
      "</div>" +
      "<p class='card__text'>" + escapeHtml(speciesLabel(draft.species)) + " / " + escapeHtml(draft.status) + " / " + escapeHtml(draft.reviewStatus) + "</p>" +
      "<p class='card__text'><strong>Varfor sparrad:</strong> " + escapeHtml(getBlockedReason(draft)) + "</p>" +
      "<p class='card__text'><strong>Kalla/sida:</strong> " + escapeHtml(draft.sourceId || "Norra gallringsmallar") + " " + escapeHtml(draft.sourcePage || "sida saknas") + "</p>" +
      "<p class='card__text'><strong>Assisterad PDF-extraktion:</strong> " + escapeHtml(assisted.hasAssistedSource ? `${assisted.sourcePage}, confidence ${assisted.confidence}` : "inget sidunderlag") + "</p>" +
      "<div class='form-grid curve-review-form__grid'>" +
        fieldTemplate("sourcePage", "Kallsida", point.sourcePage || draft.sourcePage || assisted.sourcePage || "", "text") +
        stageTemplate(point.stage || "first_thinning") +
        numberFieldTemplate("topHeight", point.topHeight) +
        numberFieldTemplate("basalAreaBefore", point.basalAreaBefore) +
        numberFieldTemplate("basalAreaAfter", point.basalAreaAfter) +
        numberFieldTemplate("ageTotal", point.ageTotal) +
        numberFieldTemplate("stemsBefore", point.stemsBefore) +
        numberFieldTemplate("stemsAfter", point.stemsAfter) +
        noteTemplate(point.note || "") +
        fieldTemplate("reviewedBy", "Granskare/initialer", "", "text") +
        reviewNoteTemplate("") +
      "</div>" +
      "<label class='toggle curve-review-check'><span>Jag har kontrollerat vardena mot originaldiagrammet</span><input type='checkbox' name='manualSourceCheck'></label>" +
      readinessTemplate(readiness) +
      "<div class='curve-review-card__meta'>" +
        "<span data-local-status>" + escapeHtml(savedText) + "</span>" +
        "<span data-candidate-status>" + escapeHtml(candidateText) + "</span>" +
        "<span>" + escapeHtml(summary.blockedReason) + "</span>" +
        "<span>" + escapeHtml(validation.warnings.join(" ") || "Punktfalten ar lokala utkast.") + "</span>" +
      "</div>" +
      "<textarea class='textarea curve-review-csv' data-csv-output readonly aria-label='CSV-rad for " + escapeHtml(draft.code) + "'></textarea>" +
      "<textarea class='textarea curve-review-csv' data-candidate-json readonly aria-label='Aktiveringskandidat JSON for " + escapeHtml(draft.code) + "'></textarea>" +
      "<textarea class='textarea curve-review-csv' data-candidate-csv readonly aria-label='Aktiveringskandidat CSV for " + escapeHtml(draft.code) + "'></textarea>" +
      "<p class='card__text'>Detta skapar bara en aktiveringskandidat. Kurvan aktiveras forst i separat import- och valideringsbatch.</p>" +
      "<div class='button-row'>" +
        "<button class='button' type='submit'>Spara lokalt utkast</button>" +
        "<button class='button button--secondary' type='button' data-clear-local>Rensa lokalt</button>" +
        "<button class='button button--secondary' type='button' data-copy-csv>Kopiera som CSV-rad</button>" +
        "<button class='button button--secondary' type='button' data-create-candidate>Skapa aktiveringskandidat</button>" +
      "</div>" +
    "</form>" +
  "</article>";
}

function readinessTemplate(readiness) {
  return "<div class='curve-review-readiness' data-readiness-status='" + escapeHtml(readiness.status) + "'>" +
    "<strong data-readiness-label>" + escapeHtml(readiness.label) + "</strong>" +
    "<ul data-readiness-reasons>" + readiness.reasons.map((reason) => "<li>" + escapeHtml(reason) + "</li>").join("") + "</ul>" +
  "</div>";
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
    ["first_thinning", "Forsta gallring"],
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

function reviewNoteTemplate(value) {
  return "<label class='field field--full'><span>Granskningsanteckning</span>" +
    "<textarea class='textarea' name='reviewNote'>" + escapeHtml(value) + "</textarea>" +
  "</label>";
}

function bindDraftForms(container, drafts, assistedRows) {
  container.querySelectorAll(".curve-review-form").forEach((form) => {
    const code = form.dataset.draftCode;
    const draft = drafts.find((item) => item.code === code);
    updateReadiness(form, draft, assistedRows);

    form.addEventListener("input", () => updateReadiness(form, draft, assistedRows));
    form.addEventListener("change", () => updateReadiness(form, draft, assistedRows));

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
      updateReadiness(form, draft, assistedRows);
      form.querySelector("[data-local-status]").textContent = "Lokalt utkast rensat";
      form.querySelector("[data-csv-output]").value = "";
      form.querySelector("[data-candidate-json]").value = "";
      form.querySelector("[data-candidate-csv]").value = "";
      showToast("Lokalt utkast rensat.");
    });

    form.querySelector("[data-copy-csv]").addEventListener("click", async () => {
      const row = buildCsvRowForDraft(draft, pointFromForm(form));
      form.querySelector("[data-csv-output]").value = row;
      await copyText(row);
      showToast("CSV-rad kopierad.");
    });

    form.querySelector("[data-create-candidate]").addEventListener("click", async () => {
      const reviewDraft = reviewDraftFromForm(draft, form, assistedRows);
      const exportData = buildReviewedCandidateExport(reviewDraft);
      updateReadiness(form, draft, assistedRows, exportData.readiness);
      if (!exportData.readiness.canExport) {
        showToast("Aktiveringskandidat kraver komplett punkt och manuell dubbelkontroll.");
        return;
      }
      const saved = saveLocalReviewedCandidate(code, exportData.candidate);
      form.querySelector("[data-candidate-json]").value = exportData.json;
      form.querySelector("[data-candidate-csv]").value = exportData.csv;
      form.querySelector("[data-candidate-status]").textContent = "Sparad som lokal kandidat " + new Date(saved.savedAt).toLocaleString("sv-SE");
      await copyText(exportData.json);
      showToast("Lokal aktiveringskandidat skapad. activeUse false.");
    });
  });
}

function updateReadiness(form, draft, assistedRows, providedReadiness = null) {
  const readiness = providedReadiness || calculateReviewReadiness(reviewDraftFromForm(draft, form, assistedRows));
  const status = form.querySelector("[data-readiness-status]");
  const label = form.querySelector("[data-readiness-label]");
  const reasons = form.querySelector("[data-readiness-reasons]");
  status.dataset.readinessStatus = readiness.status;
  label.textContent = readiness.label;
  reasons.innerHTML = readiness.reasons.map((reason) => "<li>" + escapeHtml(reason) + "</li>").join("");
}

function renderAssistedExtraction(container, extraction) {
  const host = container.querySelector("[data-assisted-extraction]");
  if (!host) return;
  if (!extraction) {
    host.innerHTML = "<div class='card__body'><span class='pill'>Assisterad PDF-extraktion</span><p>Inget assisted extraction-underlag finns annu.</p></div>";
    return;
  }

  const summary = summarizeAssistedExtraction(extraction);
  const rows = Array.isArray(extraction.rows) ? extraction.rows : [];
  host.innerHTML = "<div class='card__body'>" +
    "<span class='pill'>Assisterad PDF-extraktion</span>" +
    "<h3 class='card__title'>Assisterad PDF-extraktion</h3>" +
    "<p class='card__text'>Assisterad extraktion aktiverar inte kurvor.</p>" +
    "<div class='curve-review-assisted__stats'>" +
      assistedStat("Extraherade rader", summary.rowCount) +
      assistedStat("High", summary.confidence.high) +
      assistedStat("Medium", summary.confidence.medium) +
      assistedStat("Low", summary.confidence.low) +
      assistedStat("Kurvor med underlag", summary.curvesWithData.join(", ") || "Inga") +
      assistedStat("Saknar sakra varden", summary.missingSafeValues.join(", ") || "Inga") +
    "</div>" +
    "<ul class='curve-review-assisted__rows'>" + rows.map(assistedRowTemplate).join("") + "</ul>" +
    "<textarea class='textarea curve-review-csv' data-assisted-csv readonly aria-label='Assisted CSV-rader'></textarea>" +
    "<div class='button-row'><button class='button button--secondary' type='button' data-copy-assisted-csv>Kopiera assisted CSV-rader</button></div>" +
  "</div>";

  host.querySelector("[data-copy-assisted-csv]").addEventListener("click", async () => {
    const csv = buildAssistedCsv(rows);
    host.querySelector("[data-assisted-csv]").value = csv;
    await copyText(csv);
    showToast("Assisted CSV-rader kopierade.");
  });
}

function assistedStat(label, value) {
  return "<div><span>" + escapeHtml(label) + "</span><strong>" + escapeHtml(value) + "</strong></div>";
}

function assistedRowTemplate(row) {
  return "<li>" +
    "<strong>" + escapeHtml(row.code) + "</strong>" +
    "<span>" + escapeHtml(row.sourcePage || "sida saknas") + "</span>" +
    "<span>" + escapeHtml(row.confidence) + "</span>" +
    "<span>" + escapeHtml(row.reviewNeeded ? "reviewNeeded" : "granskad") + "</span>" +
  "</li>";
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

function reviewDraftFromForm(draft, form, assistedRows) {
  const point = pointFromForm(form);
  return {
    ...draft,
    sourcePage: point.sourcePage || draft.sourcePage,
    points: [point],
    assistedRows,
    manualSourceCheck: Boolean(form.elements.manualSourceCheck.checked),
    reviewedBy: form.elements.reviewedBy.value.trim(),
    reviewNote: form.elements.reviewNote.value.trim(),
    activeUse: false
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
      // Texten visas i textfaltet aven om webblasaren blockerar urklipp.
    }
  }
}

function speciesLabel(species) {
  return species === "gran" ? "Gran" : "Tall";
}
