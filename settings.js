import {
  FOREST_PLAN_DEFAULTS,
  buildForestPlanOfferText,
  calculateForestPlanEstimate,
  normalizeForestPlanInput
} from "../calculators/pricingEngine.js";
import { createPageHeader, escapeHtml, formatCurrency, formatNumber, showToast } from "../ui.js";
import { getStoredValue, setStoredValue } from "../storage.js";

const STORAGE_KEY = "forestPlanPricingDraft";

const TEXT_FIELDS = [
  ["propertyName", "Fastighetsbeteckning", "Ex. Skogen 1:4"],
  ["customerName", "Kundnamn", "Kundens namn"],
  ["municipality", "Kommun", "Kommun"]
];

const NUMBER_FIELDS = {
  assignment: [
    ["areaHa", "Areal, ha", "0.1"],
    ["parcelCount", "Antal skiften", "1"],
    ["standCount", "Antal bestånd/avdelningar", "1"]
  ],
  scope: [
    ["baseFee", "Grundavgift, kr", "100"],
    ["hectareRate", "Hektarpris, kr/ha", "5"],
    ["standRate", "Beståndstillägg, kr/bestånd", "10"],
    ["parcelRate", "Skiftestillägg, kr/skifte", "50"],
    ["mapCost", "Digitalt underlag/karta, kr", "50"],
    ["adminFixedCost", "Administrationskostnad, kr", "50"]
  ],
  field: [
    ["fieldDays", "Fältdagar", "0.5"],
    ["fieldDayRate", "Dagpris fältarbete, kr/dag", "100"]
  ],
  office: [
    ["officeHours", "Kontorstimmar", "0.5"],
    ["officeHourlyRate", "Timpris kontor, kr/h", "10"],
    ["qualityCost", "Kvalitetskontroll/granskning, kr", "50"],
    ["meetingCost", "Kundmöte/genomgång, kr", "50"]
  ],
  travel: [
    ["travelKmRoundtrip", "Körsträcka tur/retur, km", "1"],
    ["kmRate", "Pris per km, kr/km", "0.5"],
    ["tripCount", "Antal resor", "1"],
    ["establishmentCost", "Etablering, kr", "50"],
    ["adminMarkupPercent", "Administration/påslag, %", "1"],
    ["profitMarkupPercent", "Vinstpåslag, %", "1"],
    ["vatPercent", "Moms, %", "1"]
  ]
};

const SELECTS = {
  planType: [
    ["simple", "Enkel plan"],
    ["normal", "Normal skogsbruksplan"],
    ["advanced", "Fördjupad plan"],
    ["revision", "Uppdatering/revidering av befintlig plan"]
  ],
  fieldDifficulty: [
    ["easy", "Lätt"],
    ["normal", "Normal"],
    ["hard", "Svår"],
    ["veryHard", "Mycket svår"]
  ],
  accessibility: [
    ["good", "God"],
    ["normal", "Normal"],
    ["hard", "Svår"]
  ],
  terrain: [
    ["easy", "Lätt"],
    ["normal", "Normal"],
    ["hard", "Svår"]
  ]
};

export function renderForestPlanPricingView() {
  const draft = normalizeForestPlanInput(getStoredValue(STORAGE_KEY, FOREST_PLAN_DEFAULTS));
  const page = document.createElement("div");

  page.append(
    createPageHeader(
      "Prissättning skogsbruksplan",
      "Ta fram ett professionellt pris- och offertunderlag för inventering, underlag och planarbete."
    )
  );
  page.insertAdjacentHTML("beforeend", viewTemplate(draft));

  const form = page.querySelector("[data-plan-form]");
  const resultNode = page.querySelector("[data-plan-result]");
  const offerNode = page.querySelector("[data-plan-offer]");
  const feedbackNode = page.querySelector("[data-plan-feedback]");
  let latestEstimate = calculateForestPlanEstimate(readForm(form));

  function saveDraft(silent = true) {
    setStoredValue(STORAGE_KEY, readForm(form));
    if (!silent) {
      showToast("Planprisutkast sparat på enheten.");
    }
  }

  function renderResult() {
    latestEstimate = calculateForestPlanEstimate(readForm(form));
    resultNode.innerHTML = resultTemplate(latestEstimate);
    offerNode.value = buildForestPlanOfferText(latestEstimate);
    feedbackNode.innerHTML = feedbackTemplate(latestEstimate);
    saveDraft(true);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderResult();
  });

  form.addEventListener("input", () => {
    saveDraft(true);
  });

  form.addEventListener("change", () => {
    renderResult();
  });

  page.querySelector("[data-save-plan]").addEventListener("click", () => saveDraft(false));

  page.querySelector("[data-reset-plan]").addEventListener("click", () => {
    if (window.confirm("Rensa planprisutkastet och återställ standardvärden?")) {
      fillForm(form, FOREST_PLAN_DEFAULTS);
      renderResult();
      showToast("Planprisutkastet är återställt.");
    }
  });

  page.querySelector("[data-copy-plan-offer]").addEventListener("click", async () => {
    renderResult();
    const text = buildForestPlanOfferText(latestEstimate);
    if (!text) {
      showToast("Fyll i en giltig areal innan offerttext kopieras.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast("Offerttext kopierad.");
    } catch (error) {
      offerNode.focus();
      offerNode.select();
      if (document.execCommand("copy")) {
        showToast("Offerttext kopierad.");
      } else {
        showToast("Offerttexten är markerad och kan kopieras manuellt.");
      }
    }
  });

  renderResult();
  return page;
}

function viewTemplate(draft) {
  return `
    <form class="clearing-layout" data-plan-form novalidate>
      <div class="clearing-main">
        ${cardTemplate("Uppdrag", assignmentTemplate(draft))}
        ${cardTemplate("Omfattning", numberGroupTemplate(NUMBER_FIELDS.scope, draft))}
        ${cardTemplate("Fältarbete", fieldTemplate(draft))}
        ${cardTemplate("Kontorsarbete", numberGroupTemplate(NUMBER_FIELDS.office, draft))}
        ${cardTemplate("Resa", numberGroupTemplate(NUMBER_FIELDS.travel, draft))}
      </div>
      <aside class="clearing-side">
        <div class="clearing-actions">
          <button class="button button--large" type="submit">Beräkna</button>
          <button class="button button--secondary" type="button" data-save-plan>Spara utkast</button>
          <button class="button button--secondary" type="button" data-reset-plan>Rensa</button>
          <button class="button button--secondary" type="button" data-copy-plan-offer>Kopiera offerttext</button>
        </div>
        <section class="result-panel result-panel--strong" data-plan-result></section>
        ${cardTemplate(
          "Offertunderlag",
          `<textarea class="textarea quote-textarea" data-plan-offer readonly aria-label="Offerttext för skogsbruksplan"></textarea>`
        )}
        <div class="field-feedback" data-plan-feedback></div>
      </aside>
    </form>
  `;
}

function assignmentTemplate(draft) {
  return `
    <div class="form-grid">
      ${TEXT_FIELDS.map(([name, label, placeholder]) => textField(name, label, draft[name], placeholder)).join("")}
      ${numberGroupTemplate(NUMBER_FIELDS.assignment, draft)}
      ${selectField("planType", "Plantyp", draft.planType, SELECTS.planType)}
    </div>
  `;
}

function fieldTemplate(draft) {
  return `
    <div class="form-grid">
      ${numberGroupTemplate(NUMBER_FIELDS.field, draft)}
      ${selectField("fieldDifficulty", "Svårighetsgrad fält", draft.fieldDifficulty, SELECTS.fieldDifficulty)}
      ${selectField("accessibility", "Tillgänglighet", draft.accessibility, SELECTS.accessibility)}
      ${selectField("terrain", "Terräng", draft.terrain, SELECTS.terrain)}
    </div>
    <label class="field">
      <span>Kommentar/anteckning</span>
      <textarea class="textarea" name="fieldNote" placeholder="Kort notering om fältförutsättningar">${escapeHtml(draft.fieldNote)}</textarea>
    </label>
  `;
}

function numberGroupTemplate(fields, draft) {
  return fields.map(([name, label, step]) => numberField(name, label, draft[name], step)).join("");
}

function cardTemplate(title, content) {
  return `
    <section class="card">
      <div class="card__body">
        <h3 class="card__title">${title}</h3>
        ${content}
      </div>
    </section>
  `;
}

function textField(name, label, value, placeholder) {
  return `
    <label class="field">
      <span>${label}</span>
      <input class="input" name="${name}" type="text" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}">
    </label>
  `;
}

function numberField(name, label, value, step) {
  return `
    <label class="field">
      <span>${label}</span>
      <input class="input" name="${name}" type="number" inputmode="decimal" step="${step}" min="0" value="${escapeHtml(value)}">
    </label>
  `;
}

function selectField(name, label, selected, options) {
  return `
    <label class="field">
      <span>${label}</span>
      <select class="select" name="${name}">
        ${options.map(([value, optionLabel]) => `<option value="${value}" ${value === selected ? "selected" : ""}>${optionLabel}</option>`).join("")}
      </select>
    </label>
  `;
}

function readForm(form) {
  const data = {};
  TEXT_FIELDS.forEach(([name]) => {
    data[name] = form.elements[name].value;
  });
  Object.values(NUMBER_FIELDS).flat().forEach(([name]) => {
    data[name] = form.elements[name].value;
  });
  Object.keys(SELECTS).forEach((name) => {
    data[name] = form.elements[name].value;
  });
  data.fieldNote = form.elements.fieldNote.value;
  return data;
}

function fillForm(form, values) {
  TEXT_FIELDS.forEach(([name]) => {
    form.elements[name].value = values[name] ?? "";
  });
  Object.values(NUMBER_FIELDS).flat().forEach(([name]) => {
    form.elements[name].value = values[name];
  });
  Object.keys(SELECTS).forEach((name) => {
    form.elements[name].value = values[name];
  });
  form.elements.fieldNote.value = values.fieldNote ?? "";
}

function resultTemplate(result) {
  if (!result.valid) {
    return `
      <div class="result-main">
        <span>Resultat</span>
        <strong>-</strong>
      </div>
      <div class="notice notice--danger">
        <strong>Kontrollera underlaget</strong>
        ${result.errors.map((error) => `<p>${escapeHtml(error)}</p>`).join("")}
      </div>
    `;
  }

  return `
    <div class="result-main">
      <span>Totalpris inkl. moms</span>
      <strong>${formatCurrency(result.totalIncVat)}</strong>
    </div>
    <div class="difficulty-meter" aria-label="Komplexitet ${result.complexityLabel}">
      <span>Komplexitet: <strong>${result.complexityLabel}</strong></span>
      <span aria-hidden="true">${complexityBars(result.complexityIndex)}</span>
    </div>
    ${statRow("Grundavgift", formatCurrency(result.baseFee))}
    ${statRow("Arealpris", formatCurrency(result.areaPrice))}
    ${statRow("Bestånd/skiften", formatCurrency(result.standPrice + result.parcelPrice))}
    ${statRow("Fältarbete", formatCurrency(result.fieldWorkCost))}
    ${statRow("Kontorsarbete", formatCurrency(result.officeWorkCost + result.qualityCost + result.meetingCost))}
    ${statRow("Resa/etablering", formatCurrency(result.travelCost + result.establishmentCost))}
    ${statRow("Påslag", formatCurrency(result.adminMarkup + result.profitMarkup))}
    ${statRow("Pris exkl. moms", formatCurrency(result.subtotalExVat))}
    ${statRow("Pris/ha exkl. moms", formatCurrency(result.pricePerHaExVat))}
    ${statRow("Moms", formatCurrency(result.vat))}
    <details class="factor-list">
      <summary>Visa komplexitetsfaktorer</summary>
      ${result.factors.map(factorRow).join("")}
    </details>
  `;
}

function feedbackTemplate(result) {
  if (result.errors.length) {
    return `<strong>Fel:</strong> ${result.errors.map(escapeHtml).join(" ")}`;
  }

  if (result.notes.length) {
    return `<strong>Obs:</strong> ${result.notes.map(escapeHtml).join(" ")}`;
  }

  return "Kalkylen är uppdaterad och utkastet är sparat.";
}

function statRow(label, value) {
  return `<div class="result-row"><span>${label}</span><strong>${value}</strong></div>`;
}

function factorRow(factor) {
  const change = factor.changePercent >= 0 ? `+${formatNumber(factor.changePercent, 0)} %` : `${formatNumber(factor.changePercent, 0)} %`;
  return `
    <div class="factor-row">
      <span>${escapeHtml(factor.name)} <small>${escapeHtml(factor.note)}</small></span>
      <strong>${change}</strong>
    </div>
  `;
}

function complexityBars(index) {
  const filled = index < 0.95 ? 1 : index < 1.2 ? 3 : index < 1.55 ? 4 : 5;
  return "█".repeat(filled) + "░".repeat(5 - filled);
}
