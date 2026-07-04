import {
  CLEARING_DEFAULTS,
  buildClearingOfferText,
  calculateClearingEstimate,
  normalizeClearingInput
} from "../calculators/pricingEngine.js";
import { CLEARING_SOURCE_SUPPORT } from "../calculators/skotselKnowledgeBase.js";
import { createPageHeader, escapeHtml, formatCurrency, formatNumber, showToast } from "../ui.js";
import { getStoredValue, setStoredValue } from "../storage.js";

const STORAGE_KEY = "rojningDraft";

const FIELD_GROUPS = {
  stand: [
    ["areaHa", "Areal, ha", "0.1"],
    ["stemsBeforePerHa", "Stamantal före röjning, st/ha", "100"],
    ["stemsAfterPerHa", "Stamantal efter röjning, st/ha", "100"],
    ["meanHeightM", "Medelhöjd, m", "0.1"],
    ["dgvCm", "DGV, cm", "0.1"],
    ["deciduousSharePercent", "Lövandel, %", "1"]
  ],
  price: [
    ["hourlyRate", "Timpris, kr/h", "10"],
    ["equipmentRate", "Maskin-/utrustningskostnad, kr/h", "10"],
    ["travelCost", "Resa/etablering, kr", "50"],
    ["adminMarkupPercent", "Administration/påslag, %", "1"],
    ["profitMarkupPercent", "Vinstpåslag, %", "1"],
    ["vatPercent", "Moms, %", "1"]
  ]
};

const SELECTS = {
  treeSpecies: [
    ["pine", "Tall"],
    ["spruce", "Gran"],
    ["deciduous", "Björk/löv"],
    ["mixed", "Blandskog"]
  ],
  clearingType: [
    ["young", "Ungskogsröjning"],
    ["understory", "Underväxtröjning"],
    ["reclearing", "Omröjning"],
    ["roadside", "Siktröjning/vägröjning nära väg"]
  ],
  terrain: [
    ["easy", "Lätt"],
    ["normal", "Normal"],
    ["hard", "Svår"],
    ["veryHard", "Mycket svår"]
  ],
  vegetation: [
    ["low", "Låg"],
    ["normal", "Normal"],
    ["dense", "Tät"],
    ["veryDense", "Mycket tät"]
  ],
  stoniness: [
    ["low", "Låg"],
    ["normal", "Normal"],
    ["high", "Hög"]
  ],
  slope: [
    ["flat", "Plan"],
    ["moderate", "Måttlig"],
    ["steep", "Brant"]
  ],
  ground: [
    ["normal", "Normal"],
    ["wet", "Blöt"],
    ["sensitive", "Känslig"]
  ],
  access: [
    ["good", "God"],
    ["normal", "Normal"],
    ["poor", "Dålig"]
  ]
};

export function renderRojningView() {
  const draft = normalizeClearingInput(getStoredValue(STORAGE_KEY, CLEARING_DEFAULTS));
  const page = document.createElement("div");

  page.append(
    createPageHeader(
      "Röjningskalkyl",
      "Bedöm tidsåtgång, svårighet, produktivitet och pris för röjningsarbete i fält."
    )
  );
  page.insertAdjacentHTML("beforeend", viewTemplate(draft));

  const form = page.querySelector("[data-clearing-form]");
  const resultNode = page.querySelector("[data-clearing-result]");
  const offerNode = page.querySelector("[data-offer-text]");
  const feedbackNode = page.querySelector("[data-clearing-feedback]");
  let latestEstimate = calculateClearingEstimate(readForm(form));

  function saveDraft(silent = true) {
    setStoredValue(STORAGE_KEY, readForm(form));
    if (!silent) {
      showToast("Röjningsutkast sparat på enheten.");
    }
  }

  function renderResult() {
    latestEstimate = calculateClearingEstimate(readForm(form));
    resultNode.innerHTML = resultTemplate(latestEstimate);
    offerNode.value = buildClearingOfferText(latestEstimate);
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

  page.querySelector("[data-save-clearing]").addEventListener("click", () => saveDraft(false));

  page.querySelector("[data-reset-clearing]").addEventListener("click", () => {
    if (window.confirm("Rensa röjningsutkastet och återställ standardvärden?")) {
      fillForm(form, CLEARING_DEFAULTS);
      renderResult();
      showToast("Röjningsutkastet är återställt.");
    }
  });

  page.querySelector("[data-copy-offer]").addEventListener("click", async () => {
    renderResult();
    const text = buildClearingOfferText(latestEstimate);
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
    <form class="clearing-layout" data-clearing-form novalidate>
      <div class="clearing-main">
        ${cardTemplate("Bestånd", standTemplate(draft))}
        ${cardTemplate("Svårighet", difficultyTemplate(draft))}
        ${cardTemplate("Prisdata", priceTemplate(draft))}
      </div>
      <aside class="clearing-side">
        <section class="result-panel result-panel--strong" data-clearing-result></section>
        ${cardTemplate(
          "Offertunderlag",
          `<textarea class="textarea quote-textarea" data-offer-text readonly aria-label="Offerttext"></textarea>
           <div class="button-row">
             <button class="button" type="button" data-copy-offer>Kopiera offerttext</button>
           </div>`
        )}
        <div class="clearing-actions">
          <button class="button button--large" type="submit">Beräkna</button>
          <button class="button button--secondary" type="button" data-save-clearing>Spara utkast</button>
          <button class="button button--secondary" type="button" data-reset-clearing>Rensa</button>
        </div>
        <div class="field-feedback" data-clearing-feedback></div>
        ${sourceSupportTemplate()}
      </aside>
    </form>
  `;
}

function standTemplate(draft) {
  return `
    <div class="form-grid">
      ${FIELD_GROUPS.stand.map(([name, label, step]) => numberField(name, label, draft[name], step)).join("")}
      ${selectField("treeSpecies", "Huvudträdslag", draft.treeSpecies, SELECTS.treeSpecies)}
      ${selectField("clearingType", "Röjningstyp", draft.clearingType, SELECTS.clearingType)}
    </div>
  `;
}

function difficultyTemplate(draft) {
  return `
    <div class="form-grid">
      ${selectField("terrain", "Terräng", draft.terrain, SELECTS.terrain)}
      ${selectField("vegetation", "Vegetation", draft.vegetation, SELECTS.vegetation)}
      ${selectField("stoniness", "Blockighet", draft.stoniness, SELECTS.stoniness)}
      ${selectField("slope", "Lutning", draft.slope, SELECTS.slope)}
      ${selectField("ground", "Bärighet/mark", draft.ground, SELECTS.ground)}
      ${selectField("access", "Framkomlighet", draft.access, SELECTS.access)}
    </div>
  `;
}

function priceTemplate(draft) {
  return `
    <div class="form-grid">
      ${FIELD_GROUPS.price.map(([name, label, step]) => numberField(name, label, draft[name], step)).join("")}
    </div>
  `;
}

function sourceSupportTemplate() {
  const visibleSources = CLEARING_SOURCE_SUPPORT.filter((item) =>
    ["skogskunskap-clearing-analysis", "skogskunskap-clearing-clock", "skogskunskap-broadleaf-clearing-template"].includes(item.id)
  );

  return `
    <details class="clearing-source-support">
      <summary>Källstöd och antaganden</summary>
      <div class="clearing-source-support__body">
        <p>Röjningskalkylen räknar på dina kostnader och schabloner. Källstödet används som rådgivande kontroll, inte som prisfacit.</p>
        <ul>
          ${visibleSources.map(sourceSupportItemTemplate).join("")}
        </ul>
      </div>
    </details>
  `;
}

function sourceSupportItemTemplate(item) {
  return `
    <li>
      <strong>${escapeHtml(item.sourceName)}</strong>
      <span>${escapeHtml(sourceSupportRole(item))} — ${escapeHtml(sourceSupportLimitation(item))}</span>
    </li>
  `;
}

function sourceSupportRole(item) {
  if (item.role === "lonsamhetsstod") return "lönsamhetsstöd";
  if (item.role === "sasongsrisk") return "säsongsrisk";
  if (item.role === "lovrojningsstod") return "björk/al/asp";
  return "rådgivande stöd";
}

function sourceSupportLimitation(item) {
  if (item.role === "sasongsrisk") return "ej kostnadsregel";
  if (item.role === "lovrojningsstod") return "ej aktiv regel ännu";
  return "ej facit";
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
  [...FIELD_GROUPS.stand, ...FIELD_GROUPS.price].forEach(([name]) => {
    data[name] = form.elements[name].value;
  });
  Object.keys(SELECTS).forEach((name) => {
    data[name] = form.elements[name].value;
  });
  return data;
}

function fillForm(form, values) {
  [...FIELD_GROUPS.stand, ...FIELD_GROUPS.price].forEach(([name]) => {
    form.elements[name].value = values[name];
  });
  Object.keys(SELECTS).forEach((name) => {
    form.elements[name].value = values[name];
  });
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
    <div class="difficulty-meter" aria-label="Svårighet ${result.difficultyLabel}">
      <span>Svårighet: <strong>${result.difficultyLabel}</strong></span>
      <span aria-hidden="true">${difficultyBars(result.difficultyIndex)}</span>
    </div>
    ${statRow("Produktivitet", `${formatNumber(result.productivityHaPerDay, 2)} ha/dag`)}
    ${statRow("Timmar/ha", `${formatNumber(result.hoursPerHa, 1)} h/ha`)}
    ${statRow("Total tid", `${formatNumber(result.totalHours, 1)} h`)}
    ${statRow("Pris exkl. moms", formatCurrency(result.subtotalExVat))}
    ${statRow("Pris/ha exkl. moms", formatCurrency(result.pricePerHaExVat))}
    ${statRow("Moms", formatCurrency(result.vat))}
    <details class="factor-list">
      <summary>Visa beräkningsfaktorer</summary>
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

function difficultyBars(index) {
  const filled = index < 1.05 ? 1 : index < 1.45 ? 2 : index < 2.05 ? 4 : 5;
  return "█".repeat(filled) + "░".repeat(5 - filled);
}
