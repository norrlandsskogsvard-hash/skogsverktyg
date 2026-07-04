import {
  buildClearingOfferText,
  buildForestPlanOfferText,
  calculateClearingEstimate,
  calculateForestPlanEstimate
} from "../calculators/pricingEngine.js";
import {
  createEmptyQuote,
  createQuoteRow,
  calculateQuoteEstimate,
  buildQuoteText,
  UNIT_OPTIONS,
  ROUNDING_OPTIONS
} from "../calculators/quoteCalculator.js";
import { DEFAULT_SETTINGS } from "../config.js";
import { getStoredValue, setStoredValue } from "../storage.js";
import { createPageHeader, escapeHtml, formatCurrency, formatNumber, showToast } from "../ui.js";

const STORAGE_KEY = "quoteDraft";
const CLEARING_DRAFT_KEY = "rojningDraft";
const PLAN_DRAFT_KEY = "forestPlanPricingDraft";

export function renderQuoteView() {
  const settings = getStoredValue("settings", DEFAULT_SETTINGS);
  let quote = getStoredValue(STORAGE_KEY, createEmptyQuote(settings));
  quote = mergeSettingsIntoQuote(quote, settings);

  const page = document.createElement("div");
  page.append(
    createPageHeader(
      "Offertgenerator",
      "Skapa kundklara offerter med poster, moms, villkor, import från kalkyler och utskrift till PDF."
    )
  );
  page.insertAdjacentHTML("beforeend", viewTemplate(quote));
  applyMobileCollapses(page);

  const form = page.querySelector("[data-quote-form]");
  const rowsNode = page.querySelector("[data-quote-rows]");
  const summaryNode = page.querySelector("[data-quote-summary]");
  const previewNode = page.querySelector("[data-quote-preview]");
  const feedbackNode = page.querySelector("[data-quote-feedback]");

  function currentQuote() {
    return readQuoteFromForm(form);
  }

  function saveDraft(silent = true) {
    quote = currentQuote();
    setStoredValue(STORAGE_KEY, quote);
    if (!silent) {
      showToast("Offertutkast sparat på enheten.");
    }
  }

  function renderRows() {
    rowsNode.innerHTML = quote.rows.map(rowTemplate).join("");
    rowsNode.querySelectorAll("[data-remove-row]").forEach((button) => {
      button.addEventListener("click", () => removeRow(button.getAttribute("data-remove-row")));
    });
  }

  function renderCalculated() {
    quote = currentQuote();
    const estimate = calculateQuoteEstimate(quote);
    summaryNode.innerHTML = summaryTemplate(estimate);
    previewNode.innerHTML = previewTemplate(estimate);
    feedbackNode.innerHTML = feedbackTemplate(estimate);
    setStoredValue(STORAGE_KEY, quote);
    return estimate;
  }

  function renderAll() {
    renderRows();
    renderCalculated();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderCalculated();
    showToast("Offerten är uppdaterad.");
  });

  form.addEventListener("input", () => {
    saveDraft(true);
    renderCalculated();
  });

  form.addEventListener("change", () => {
    saveDraft(true);
    renderCalculated();
  });

  function removeRow(rowId) {
    quote = currentQuote();
    quote.rows = quote.rows.filter((row) => row.id !== rowId);
    if (!quote.rows.length) {
      quote.rows = [createQuoteRow({ vatRate: settings.vatRate })];
    }
    setStoredValue(STORAGE_KEY, quote);
    renderAll();
  }

  form.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-row]");
    if (!removeButton) {
      return;
    }
    removeRow(removeButton.getAttribute("data-remove-row"));
  });

  page.querySelector("[data-add-row]").addEventListener("click", () => {
    quote = currentQuote();
    quote.rows.push(createQuoteRow({ vatRate: quote.rows[0]?.vatRate ?? settings.vatRate }));
    setStoredValue(STORAGE_KEY, quote);
    renderAll();
  });

  page.querySelector("[data-add-clearing-row]").addEventListener("click", () => {
    addRow(createQuoteRow({
      description: "Röjningsarbete enligt offert",
      quantity: 1,
      unit: "fast pris",
      unitPrice: 0,
      vatRate: settings.vatRate
    }));
  });

  page.querySelector("[data-add-plan-row]").addEventListener("click", () => {
    addRow(createQuoteRow({
      description: "Skogsbruksplan enligt offert",
      quantity: 1,
      unit: "fast pris",
      unitPrice: 0,
      vatRate: settings.vatRate
    }));
  });

  page.querySelector("[data-import-clearing]").addEventListener("click", () => {
    const draft = getStoredValue(CLEARING_DRAFT_KEY, null);
    const estimate = calculateClearingEstimate(draft || {});
    if (!draft || !estimate.valid) {
      showToast("Ingen giltig röjningskalkyl hittades.");
      return;
    }
    addRow(createQuoteRow({
      description: "Röjningsarbete enligt kalkyl",
      quantity: estimate.areaHa,
      unit: "ha",
      unitPrice: roundMoney(estimate.pricePerHaExVat),
      vatRate: estimate.vatPercent
    }));
    appendNote(buildClearingOfferText(estimate));
    showToast("Senaste röjningskalkyl lades till.");
  });

  page.querySelector("[data-import-plan]").addEventListener("click", () => {
    const draft = getStoredValue(PLAN_DRAFT_KEY, null);
    const estimate = calculateForestPlanEstimate(draft || {});
    if (!draft || !estimate.valid) {
      showToast("Ingen giltig planpriskalkyl hittades.");
      return;
    }
    addRow(createQuoteRow({
      description: "Skogsbruksplan enligt prisunderlag",
      quantity: estimate.areaHa,
      unit: "ha",
      unitPrice: roundMoney(estimate.pricePerHaExVat),
      vatRate: estimate.vatPercent
    }));
    appendNote(buildForestPlanOfferText(estimate));
    showToast("Senaste planpriskalkyl lades till.");
  });

  page.querySelector("[data-save-quote]").addEventListener("click", () => saveDraft(false));

  page.querySelector("[data-clear-quote]").addEventListener("click", () => {
    if (window.confirm("Rensa offerten och återställ standardvärden?")) {
      quote = createEmptyQuote(settings);
      setStoredValue(STORAGE_KEY, quote);
      form.replaceWith(htmlToElement(formTemplate(quote)));
      showToast("Offerten är återställd. Öppna offertvyn igen om formuläret inte uppdaterades.");
      window.location.reload();
    }
  });

  page.querySelector("[data-copy-quote]").addEventListener("click", async () => {
    const estimate = renderCalculated();
    const text = buildQuoteText(estimate);
    try {
      await navigator.clipboard.writeText(text);
      showToast("Offerttext kopierad.");
    } catch (error) {
      showToast("Kunde inte kopiera automatiskt. Markera texten i förhandsvisningen och kopiera manuellt.");
    }
  });

  page.querySelector("[data-print-quote]").addEventListener("click", () => {
    renderCalculated();
    window.print();
  });

  function addRow(row) {
    quote = currentQuote();
    if (quote.rows.length === 1 && isEmptyQuoteRow(quote.rows[0])) {
      quote.rows = [row];
    } else {
      quote.rows.push(row);
    }
    setStoredValue(STORAGE_KEY, quote);
    renderAll();
  }

  function appendNote(text) {
    if (!text) {
      return;
    }
    const notes = form.elements.notes;
    notes.value = [notes.value.trim(), text].filter(Boolean).join("\n\n");
    saveDraft(true);
    renderCalculated();
  }

  renderAll();
  return page;
}

function viewTemplate(quote) {
  return formTemplate(quote);
}

function formTemplate(quote) {
  return `
    <form class="quote-layout" data-quote-form novalidate>
      <div class="quote-editor">
        ${detailsCardTemplate("1. Kund", customerTemplate(quote.customer), true, false)}
        ${detailsCardTemplate("2. Uppdrag", metaTemplate(quote.meta) + rowsSectionTemplate(), true, false)}
        ${detailsCardTemplate("Företag", companyTemplate(quote.company), true, true)}
        ${detailsCardTemplate("4. Text / villkor", termsTemplate(quote.terms, quote.adjustments, quote.notes), true, true)}
      </div>
      <aside class="quote-side">
        <section class="quote-step-heading">
          <strong>3. Pris / sammanställning</strong>
          <span>Summering och åtgärder</span>
        </section>
        <section class="result-panel result-panel--strong" data-quote-summary></section>
        <div class="clearing-actions">
          <button class="button button--large" type="submit">Summera offert</button>
          <button class="button button--secondary" type="button" data-save-quote>Spara utkast</button>
          <button class="button button--secondary" type="button" data-clear-quote>Rensa offert</button>
          <button class="button button--secondary" type="button" data-copy-quote>Kopiera offerttext</button>
          <button class="button button--secondary" type="button" data-print-quote>Skriv ut / Spara som PDF</button>
        </div>
        <div class="field-feedback" data-quote-feedback></div>
      </aside>
      <section class="quote-preview-shell">
        <div data-quote-preview></div>
      </section>
    </form>
  `;
}

function companyTemplate(company) {
  return `
    <div class="form-grid">
      ${textField("company.companyName", "Företagsnamn", company.companyName)}
      ${textField("company.email", "E-post", company.email)}
      ${textField("company.phone", "Telefon", company.phone)}
      ${textField("company.address", "Adress", company.address)}
      ${textField("company.orgNumber", "Organisationsnummer", company.orgNumber)}
      <label class="toggle">
        <span>Momsregistrerad</span>
        <input name="company.vatRegistered" type="checkbox" ${company.vatRegistered ? "checked" : ""}>
      </label>
    </div>
  `;
}

function customerTemplate(customer) {
  return `
    <div class="form-grid">
      ${textField("customer.customerName", "Kundnamn", customer.customerName)}
      ${textField("customer.propertyName", "Fastighet", customer.propertyName)}
      ${textField("customer.address", "Adress", customer.address)}
      ${textField("customer.email", "E-post", customer.email)}
      ${textField("customer.phone", "Telefon", customer.phone)}
      ${textField("customer.municipality", "Kommun", customer.municipality)}
    </div>
  `;
}

function metaTemplate(meta) {
  return `
    <div class="form-grid">
      ${textField("meta.quoteNumber", "Offertnummer", meta.quoteNumber)}
      ${dateField("meta.quoteDate", "Datum", meta.quoteDate)}
      ${dateField("meta.validUntil", "Giltig till", meta.validUntil)}
      ${textField("meta.title", "Rubrik", meta.title)}
      ${textField("meta.worksite", "Arbetsplats/fastighet", meta.worksite)}
      ${textField("meta.estimatedStart", "Beräknad start", meta.estimatedStart)}
      ${textField("meta.estimatedDuration", "Beräknad varaktighet", meta.estimatedDuration)}
    </div>
    <label class="field">
      <span>Kort beskrivning</span>
      <textarea class="textarea" name="meta.description">${escapeHtml(meta.description)}</textarea>
    </label>
  `;
}

function rowsSectionTemplate() {
  return `
    <div class="button-row">
      <button class="button button--secondary" type="button" data-add-row>Lägg till rad</button>
      <button class="button button--secondary" type="button" data-add-clearing-row>Standardrad: Röjning</button>
      <button class="button button--secondary" type="button" data-add-plan-row>Standardrad: Skogsbruksplan</button>
      <button class="button" type="button" data-import-clearing>Hämta senaste röjning</button>
      <button class="button" type="button" data-import-plan>Hämta senaste planpris</button>
    </div>
    <div class="quote-rows" data-quote-rows></div>
  `;
}

function termsTemplate(terms, adjustments, notes) {
  return `
    <div class="form-grid">
      ${textField("terms.paymentTerms", "Betalningsvillkor", terms.paymentTerms)}
      ${dateField("terms.validUntil", "Offert giltig till", terms.validUntil)}
      ${numberField("adjustments.discountPercent", "Rabatt, %", adjustments.discountPercent, "1")}
      ${numberField("adjustments.markupPercent", "Extra påslag, %", adjustments.markupPercent, "1")}
      <label class="field">
        <span>Avrunda total till närmaste</span>
        <select class="select" name="adjustments.rounding">
          ${ROUNDING_OPTIONS.map((option) => `<option value="${option}" ${option === adjustments.rounding ? "selected" : ""}>${roundingLabel(option)}</option>`).join("")}
        </select>
      </label>
      ${checkboxField("terms.rutRot", "RUT/ROT aktuellt", terms.rutRot)}
      ${checkboxField("terms.priceBasedOnInput", "Pris gäller enligt angivet underlag", terms.priceBasedOnInput)}
      ${checkboxField("terms.extraWorkSeparately", "Tillkommande arbete debiteras separat", terms.extraWorkSeparately)}
      ${checkboxField("terms.fieldConditionReservation", "Reservation för ändrade förutsättningar i fält", terms.fieldConditionReservation)}
    </div>
    <label class="field">
      <span>Egna villkor</span>
      <textarea class="textarea" name="terms.customTerms">${escapeHtml(terms.customTerms)}</textarea>
    </label>
    <label class="field">
      <span>Intern notering / hämtade kalkyltexter</span>
      <textarea class="textarea" name="notes">${escapeHtml(notes)}</textarea>
    </label>
  `;
}

function rowTemplate(row) {
  const quantity = Number.parseFloat(String(row.quantity ?? 0).replace(",", ".")) || 0;
  const unitPrice = Number.parseFloat(String(row.unitPrice ?? 0).replace(",", ".")) || 0;
  const vatRate = Number.parseFloat(String(row.vatRate ?? 0).replace(",", ".")) || 0;
  const lineExVat = quantity * unitPrice;
  const lineIncVat = lineExVat * (1 + vatRate / 100);
  return `
    <article class="quote-row-card" data-row-id="${escapeHtml(row.id)}">
      <div class="quote-row-grid">
        <label class="field quote-description">
          <span>Beskrivning</span>
          <input class="input" name="row.description" type="text" value="${escapeHtml(row.description)}">
        </label>
        ${rowNumberField("row.quantity", "Antal", row.quantity, "0.01")}
        <label class="field">
          <span>Enhet</span>
          <select class="select" name="row.unit">
            ${UNIT_OPTIONS.map((unit) => `<option value="${unit}" ${unit === row.unit ? "selected" : ""}>${unit}</option>`).join("")}
          </select>
        </label>
        ${rowNumberField("row.unitPrice", "À-pris", row.unitPrice, "1")}
        ${rowNumberField("row.vatRate", "Moms %", row.vatRate, "1")}
        <button class="button button--secondary" type="button" data-remove-row="${escapeHtml(row.id)}">Ta bort</button>
      </div>
      <div class="quote-row-totals">
        <span>Radtotal exkl. moms: <strong>${formatCurrency(lineExVat)}</strong></span>
        <span>Radtotal inkl. moms: <strong>${formatCurrency(lineIncVat)}</strong></span>
      </div>
    </article>
  `;
}

function readQuoteFromForm(form) {
  const data = {
    company: {},
    customer: {},
    meta: {},
    rows: [],
    adjustments: {},
    terms: {},
    notes: form.elements.notes?.value || ""
  };

  readGroup(form, data.company, "company", ["companyName", "email", "phone", "address", "orgNumber"]);
  data.company.vatRegistered = Boolean(form.elements["company.vatRegistered"]?.checked);
  readGroup(form, data.customer, "customer", ["customerName", "propertyName", "address", "email", "phone", "municipality"]);
  readGroup(form, data.meta, "meta", ["quoteNumber", "quoteDate", "validUntil", "title", "description", "worksite", "estimatedStart", "estimatedDuration"]);
  readGroup(form, data.adjustments, "adjustments", ["discountPercent", "markupPercent", "rounding"]);
  readGroup(form, data.terms, "terms", ["paymentTerms", "validUntil", "customTerms"]);
  data.terms.rutRot = Boolean(form.elements["terms.rutRot"]?.checked);
  data.terms.priceBasedOnInput = Boolean(form.elements["terms.priceBasedOnInput"]?.checked);
  data.terms.extraWorkSeparately = Boolean(form.elements["terms.extraWorkSeparately"]?.checked);
  data.terms.fieldConditionReservation = Boolean(form.elements["terms.fieldConditionReservation"]?.checked);

  form.querySelectorAll("[data-row-id]").forEach((rowNode) => {
    data.rows.push({
      id: rowNode.dataset.rowId,
      description: rowNode.querySelector('[name="row.description"]').value,
      quantity: rowNode.querySelector('[name="row.quantity"]').value,
      unit: rowNode.querySelector('[name="row.unit"]').value,
      unitPrice: rowNode.querySelector('[name="row.unitPrice"]').value,
      vatRate: rowNode.querySelector('[name="row.vatRate"]').value
    });
  });

  return data;
}

function readGroup(form, target, prefix, fields) {
  fields.forEach((field) => {
    target[field] = form.elements[`${prefix}.${field}`]?.value ?? "";
  });
}

function summaryTemplate(estimate) {
  return `
    <div class="result-main">
      <span>Total att offerera</span>
      <strong>${formatCurrency(estimate.totalToOffer)}</strong>
    </div>
    ${statRow("Summa exkl. moms", formatCurrency(estimate.subtotalExVat))}
    ${statRow("Moms", formatCurrency(estimate.vatTotal))}
    ${statRow("Rabatt", `-${formatCurrency(estimate.discountAmount)}`)}
    ${statRow("Extra påslag", formatCurrency(estimate.markupAmount))}
    ${statRow("Avrundning", formatCurrency(estimate.roundingAdjustment))}
    ${statRow("Total inkl. moms", formatCurrency(estimate.totalIncVat))}
  `;
}

function previewTemplate(estimate) {
  const company = estimate.company;
  const customer = estimate.customer;
  const meta = estimate.meta;
  const rows = estimate.activeRows.length ? estimate.activeRows : estimate.rows;
  return `
    <article class="quote-preview">
      <header class="quote-preview__header">
        <div>
          <h2>${escapeHtml(meta.title || "Offert")}</h2>
          <p>${escapeHtml(company.companyName || "Företag")}</p>
          <p>${escapeHtml(company.address || "")}</p>
          <p>${escapeHtml([company.email, company.phone].filter(Boolean).join(" · "))}</p>
        </div>
        <div>
          <strong>Offert ${escapeHtml(meta.quoteNumber)}</strong>
          <p>Datum: ${escapeHtml(meta.quoteDate)}</p>
          <p>Giltig till: ${escapeHtml(meta.validUntil || estimate.terms.validUntil)}</p>
        </div>
      </header>
      <section>
        <h3>Kund</h3>
        <p>${escapeHtml(customer.customerName || "Kund")}</p>
        <p>${escapeHtml(customer.propertyName || meta.worksite || "")}</p>
        <p>${escapeHtml(customer.address || "")}</p>
        <p>${escapeHtml([customer.email, customer.phone, customer.municipality].filter(Boolean).join(" · "))}</p>
      </section>
      <section>
        <h3>Beskrivning</h3>
        <p>${escapeHtml(meta.description)}</p>
        <p>${escapeHtml([meta.estimatedStart && `Start: ${meta.estimatedStart}`, meta.estimatedDuration && `Varaktighet: ${meta.estimatedDuration}`].filter(Boolean).join(" · "))}</p>
      </section>
      <table class="quote-preview-table">
        <thead>
          <tr><th>Beskrivning</th><th>Antal</th><th>Enhet</th><th>À-pris</th><th>Moms</th><th>Summa</th></tr>
        </thead>
        <tbody>
          ${rows.map(previewRowTemplate).join("")}
        </tbody>
      </table>
      <section class="quote-preview__totals">
        ${statRow("Summa exkl. moms", formatCurrency(estimate.subtotalExVat))}
        ${statRow("Moms", formatCurrency(estimate.vatTotal))}
        ${statRow("Total inkl. moms", formatCurrency(estimate.totalIncVat))}
      </section>
      <section>
        <h3>Villkor</h3>
        <ul>
          <li>Betalningsvillkor: ${escapeHtml(estimate.terms.paymentTerms)}</li>
          ${estimate.terms.priceBasedOnInput ? "<li>Pris gäller enligt angivet underlag.</li>" : ""}
          ${estimate.terms.extraWorkSeparately ? "<li>Tillkommande arbete debiteras separat.</li>" : ""}
          ${estimate.terms.fieldConditionReservation ? "<li>Reservation för ändrade förutsättningar i fält.</li>" : ""}
          ${estimate.terms.rutRot ? "<li>RUT/ROT hanteras enligt separat överenskommelse.</li>" : "<li>RUT/ROT ej aktuellt om inget annat anges.</li>"}
        </ul>
        <p>${escapeHtml(estimate.terms.customTerms)}</p>
      </section>
    </article>
  `;
}

function previewRowTemplate(row) {
  return `
    <tr>
      <td>${escapeHtml(row.description)}</td>
      <td>${formatNumber(row.quantity, 2)}</td>
      <td>${escapeHtml(row.unit)}</td>
      <td>${formatCurrency(row.unitPrice)}</td>
      <td>${formatNumber(row.vatRate, 0)} %</td>
      <td>${formatCurrency(row.lineExVat)}</td>
    </tr>
  `;
}

function feedbackTemplate(estimate) {
  if (estimate.errors.length) {
    return `<strong>Fel:</strong> ${estimate.errors.map(escapeHtml).join(" ")}`;
  }
  if (estimate.notes.length) {
    return `<strong>Obs:</strong> ${estimate.notes.map(escapeHtml).join(" ")}`;
  }
  return "Offerten är uppdaterad och utkastet är sparat.";
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

function detailsCardTemplate(title, content, openOnDesktop = false, collapseOnMobile = true) {
  return `
    <details class="card mobile-compact-details" ${openOnDesktop ? "open" : ""} ${collapseOnMobile ? "data-mobile-collapsed" : ""}>
      <summary>${title}</summary>
      <div class="card__body">
        ${content}
      </div>
    </details>
  `;
}

function applyMobileCollapses(root) {
  if (!window.matchMedia("(max-width: 560px)").matches) return;
  root.querySelectorAll("[data-mobile-collapsed]").forEach((details) => {
    details.open = false;
  });
}

function textField(name, label, value) {
  return `
    <label class="field">
      <span>${label}</span>
      <input class="input" name="${name}" type="text" value="${escapeHtml(value)}">
    </label>
  `;
}

function dateField(name, label, value) {
  return `
    <label class="field">
      <span>${label}</span>
      <input class="input" name="${name}" type="date" value="${escapeHtml(value)}">
    </label>
  `;
}

function numberField(name, label, value, step) {
  return `
    <label class="field">
      <span>${label}</span>
      <input class="input" name="${name}" type="number" inputmode="decimal" min="0" step="${step}" value="${escapeHtml(value)}">
    </label>
  `;
}

function rowNumberField(name, label, value, step) {
  return `
    <label class="field">
      <span>${label}</span>
      <input class="input" name="${name}" type="number" inputmode="decimal" min="0" step="${step}" value="${escapeHtml(value)}">
    </label>
  `;
}

function checkboxField(name, label, checked) {
  return `
    <label class="toggle">
      <span>${label}</span>
      <input name="${name}" type="checkbox" ${checked ? "checked" : ""}>
    </label>
  `;
}

function statRow(label, value) {
  return `<div class="result-row"><span>${label}</span><strong>${value}</strong></div>`;
}

function roundingLabel(option) {
  return {
    none: "Ingen",
    "100": "100 kr",
    "500": "500 kr",
    "1000": "1 000 kr"
  }[option];
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function isEmptyQuoteRow(row) {
  return !String(row?.description || "").trim()
    && Number(row?.quantity || 0) === 1
    && Number(row?.unitPrice || 0) === 0;
}

function mergeSettingsIntoQuote(quote, settings) {
  if (!quote.company?.companyName && settings.companyName) {
    quote.company = { ...quote.company, companyName: settings.companyName };
  }
  if (quote.rows?.length) {
    quote.rows = quote.rows.map((row) => ({ ...row, vatRate: row.vatRate ?? settings.vatRate }));
  }
  return quote;
}

function htmlToElement(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}
