import {
  CUSTOMER_STORAGE_KEY,
  JOB_STORAGE_KEY,
  JOB_STATUSES,
  JOB_TYPES,
  createArchiveFromQuote,
  createCustomer,
  createJob,
  deleteCustomer,
  deleteJob,
  filterCustomers,
  filterJobs,
  findCustomerByNameAndProperty,
  getCustomerJobStats,
  normalizeCustomer,
  normalizeJob,
  sortCustomers,
  sortJobs,
  summarizeArchive,
  updateCustomer,
  updateJob
} from "../calculators/customerArchive.js";
import { calculateQuoteEstimate } from "../calculators/quoteCalculator.js";
import { getStoredValue, setStoredValue } from "../storage.js";
import { createPageHeader, escapeHtml, formatCurrency, showToast } from "../ui.js";

const QUOTE_DRAFT_KEY = "quoteDraft";

export function renderCustomersView() {
  const page = document.createElement("div");
  page.append(createPageHeader(
    "Kundregister",
    "Spara kunder, fastigheter och uppdrag lokalt på enheten."
  ));

  let customers = sortCustomers(getStoredValue(CUSTOMER_STORAGE_KEY, []));
  let jobs = sortJobs(getStoredValue(JOB_STORAGE_KEY, []));
  let editingCustomerId = null;
  let editingJobId = null;

  page.insertAdjacentHTML("beforeend", viewTemplate());

  const customerForm = page.querySelector("[data-customer-form]");
  const jobForm = page.querySelector("[data-job-form]");
  const customerFeedback = page.querySelector("[data-customer-feedback]");
  const jobFeedback = page.querySelector("[data-job-feedback]");
  const importFeedback = page.querySelector("[data-import-feedback]");
  const customerSearch = page.querySelector("[data-customer-search]");
  const jobSearch = page.querySelector("[data-job-search]");
  const jobStatusFilter = page.querySelector("[data-job-status-filter]");
  const jobTypeFilter = page.querySelector("[data-job-type-filter]");

  function persist() {
    setStoredValue(CUSTOMER_STORAGE_KEY, customers);
    setStoredValue(JOB_STORAGE_KEY, jobs);
  }

  function renderAll() {
    renderOverview(page, customers, jobs);
    renderCustomerSelect(jobForm, customers);
    renderCustomerList(page, customers, jobs, customerSearch.value);
    renderJobArchive(page, jobs, {
      searchTerm: jobSearch.value,
      status: jobStatusFilter.value,
      type: jobTypeFilter.value
    });
  }

  customerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = readCustomerForm(customerForm);
    if (!input.name) {
      setFeedback(customerFeedback, "Fyll i kundnamn.", true);
      return;
    }

    if (editingCustomerId) {
      customers = updateCustomer(customers, editingCustomerId, input);
      jobs = jobs.map((job) => job.customerId === editingCustomerId
        ? normalizeJob({
            ...job,
            customerName: input.name,
            propertyName: input.propertyName || job.propertyName,
            municipality: input.municipality || job.municipality
          })
        : job
      );
      showToast("Kunden uppdaterades.");
    } else {
      customers = sortCustomers([...customers, createCustomer(input)]);
      showToast("Kunden sparades.");
    }

    editingCustomerId = null;
    persist();
    resetCustomerForm(customerForm);
    setFeedback(customerFeedback, "Kund sparad.");
    renderAll();
  });

  page.querySelector("[data-reset-customer]").addEventListener("click", () => {
    editingCustomerId = null;
    resetCustomerForm(customerForm);
    setFeedback(customerFeedback, "");
  });

  jobForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = readJobForm(jobForm, customers);
    if (!input.title) {
      setFeedback(jobFeedback, "Fyll i rubrik för jobbet.", true);
      return;
    }

    if (editingJobId) {
      jobs = updateJob(jobs, editingJobId, input);
      showToast("Jobbet uppdaterades.");
    } else {
      jobs = sortJobs([...jobs, createJob(input)]);
      showToast("Jobbet sparades.");
    }

    editingJobId = null;
    persist();
    resetJobForm(jobForm);
    setFeedback(jobFeedback, "Jobb sparat.");
    renderAll();
  });

  page.querySelector("[data-reset-job]").addEventListener("click", () => {
    editingJobId = null;
    resetJobForm(jobForm);
    setFeedback(jobFeedback, "");
  });

  jobForm.elements.customerId.addEventListener("change", () => {
    const customer = customers.find((item) => item.id === jobForm.elements.customerId.value);
    if (!customer) {
      return;
    }
    if (!jobForm.elements.propertyName.value) {
      jobForm.elements.propertyName.value = customer.propertyName;
    }
    if (!jobForm.elements.municipality.value) {
      jobForm.elements.municipality.value = customer.municipality;
    }
  });

  page.querySelector("[data-customer-list]").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }
    const customerId = button.dataset.customerId;
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) {
      return;
    }

    if (button.dataset.action === "edit-customer") {
      editingCustomerId = customerId;
      fillCustomerForm(customerForm, customer);
      setFeedback(customerFeedback, "Redigerar kund.");
      customerForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (button.dataset.action === "new-job") {
      editingJobId = null;
      resetJobForm(jobForm);
      jobForm.elements.customerId.value = customerId;
      jobForm.elements.customerName.value = customer.name;
      jobForm.elements.propertyName.value = customer.propertyName;
      jobForm.elements.municipality.value = customer.municipality;
      setFeedback(jobFeedback, "Nytt jobb kopplat till vald kund.");
      jobForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (button.dataset.action === "delete-customer") {
      if (window.confirm("Ta bort kunden? Jobb i arkivet behålls men kopplingen till kunden tas bort.")) {
        customers = deleteCustomer(customers, customerId);
        jobs = jobs.map((job) => job.customerId === customerId ? normalizeJob({ ...job, customerId: "" }) : job);
        persist();
        showToast("Kunden togs bort.");
        renderAll();
      }
    }
  });

  page.querySelector("[data-job-list]").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }
    const jobId = button.dataset.jobId;
    const job = jobs.find((item) => item.id === jobId);
    if (!job) {
      return;
    }

    if (button.dataset.action === "edit-job") {
      editingJobId = jobId;
      fillJobForm(jobForm, job);
      setFeedback(jobFeedback, "Redigerar jobb.");
      jobForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (button.dataset.action === "complete-job") {
      jobs = updateJob(jobs, jobId, {
        status: "Klar",
        completedDate: job.completedDate || todayInput()
      });
      persist();
      showToast("Jobbet markerades som klart.");
      renderAll();
    }

    if (button.dataset.action === "delete-job") {
      if (window.confirm("Ta bort jobbet från arkivet?")) {
        jobs = deleteJob(jobs, jobId);
        persist();
        showToast("Jobbet togs bort.");
        renderAll();
      }
    }
  });

  [customerSearch, jobSearch, jobStatusFilter, jobTypeFilter].forEach((control) => {
    control.addEventListener("input", renderAll);
    control.addEventListener("change", renderAll);
  });

  page.querySelector("[data-import-quote]").addEventListener("click", () => {
    const draft = getStoredValue(QUOTE_DRAFT_KEY, null);
    const estimate = calculateQuoteEstimate(draft || {});
    const customerName = estimate.customer?.customerName?.trim();

    if (!draft || !customerName) {
      setFeedback(importFeedback, "Fyll i kundnamn i offerten först.", true);
      return;
    }
    if (!estimate.activeRows.length) {
      setFeedback(importFeedback, "Offerten saknar prissatta rader.", true);
      return;
    }

    const archive = createArchiveFromQuote(estimate);
    const existingCustomer = findCustomerByNameAndProperty(customers, archive.customer.name, archive.customer.propertyName);
    const customer = existingCustomer || archive.customer;
    const job = normalizeJob({
      ...archive.job,
      customerId: customer.id,
      customerName: customer.name,
      propertyName: archive.job.propertyName || customer.propertyName,
      municipality: archive.job.municipality || customer.municipality
    });

    if (!existingCustomer) {
      customers = sortCustomers([...customers, customer]);
    }
    jobs = sortJobs([...jobs, createJob(job)]);
    persist();
    setFeedback(importFeedback, "Kund och jobb skapades från offert.");
    showToast("Kund och jobb skapades från offert.");
    renderAll();
  });

  renderAll();
  return page;
}

function viewTemplate() {
  return `
    <section class="archive-layout">
      <section class="archive-main">
        <section class="archive-overview" data-archive-overview></section>

        ${cardTemplate("Lägg till/redigera kund", customerFormTemplate())}
        ${cardTemplate("Kundlista", customerListTemplate())}
        ${cardTemplate("Jobbarkiv", jobArchiveTemplate())}
        ${cardTemplate("Lägg till/redigera jobb", jobFormTemplate())}
      </section>

      <aside class="archive-side">
        ${cardTemplate("Import från offert", importTemplate())}
      </aside>
    </section>
  `;
}

function customerFormTemplate() {
  return `
    <form class="form" data-customer-form novalidate>
      <div class="form-grid">
        ${textField("name", "Namn")}
        ${textField("propertyName", "Fastighet")}
        ${textField("municipality", "Kommun")}
        ${textField("email", "E-post")}
        ${textField("phone", "Telefon")}
        ${textField("address", "Adress")}
      </div>
      ${textareaField("notes", "Anteckning")}
      <div class="button-row">
        <button class="button button--large" type="submit">Spara kund</button>
        <button class="button button--secondary" type="button" data-reset-customer>Rensa formulär</button>
      </div>
      <p class="field-feedback" data-customer-feedback></p>
    </form>
  `;
}

function customerListTemplate() {
  return `
    <div class="archive-toolbar">
      <label class="field">
        <span>Sök kund</span>
        <input class="input" type="search" data-customer-search placeholder="Namn, fastighet eller kommun">
      </label>
    </div>
    <div class="archive-list" data-customer-list></div>
  `;
}

function jobArchiveTemplate() {
  return `
    <div class="archive-toolbar archive-toolbar--three">
      <label class="field">
        <span>Sök jobb</span>
        <input class="input" type="search" data-job-search placeholder="Titel, kund, fastighet">
      </label>
      <label class="field">
        <span>Status</span>
        <select class="select" data-job-status-filter>
          <option value="">Alla statusar</option>
          ${JOB_STATUSES.map((status) => `<option value="${escapeHtml(status)}">${escapeHtml(status)}</option>`).join("")}
        </select>
      </label>
      <label class="field">
        <span>Typ</span>
        <select class="select" data-job-type-filter>
          <option value="">Alla typer</option>
          ${JOB_TYPES.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("")}
        </select>
      </label>
    </div>
    <div class="archive-list" data-job-list></div>
  `;
}

function jobFormTemplate() {
  return `
    <form class="form" data-job-form novalidate>
      <div class="form-grid">
        <label class="field">
          <span>Kund</span>
          <select class="select" name="customerId"></select>
        </label>
        ${textField("customerName", "Kundnamn")}
        ${selectField("type", "Jobbtyp", JOB_TYPES)}
        ${selectField("status", "Status", JOB_STATUSES)}
        ${textField("title", "Rubrik")}
        ${textField("propertyName", "Fastighet")}
        ${textField("municipality", "Kommun")}
        ${numberField("areaHa", "Areal, ha", "0.1")}
        ${numberField("estimatedValueExVat", "Värde exkl. moms", "1")}
        ${numberField("estimatedValueIncVat", "Värde inkl. moms", "1")}
        ${textField("quoteNumber", "Offertnummer")}
        ${dateField("quoteDate", "Offertdatum")}
        ${dateField("plannedStart", "Planerad start")}
        ${dateField("completedDate", "Slutdatum")}
      </div>
      ${textareaField("description", "Beskrivning")}
      ${textareaField("notes", "Anteckning")}
      <div class="button-row">
        <button class="button button--large" type="submit">Spara jobb</button>
        <button class="button button--secondary" type="button" data-reset-job>Rensa formulär</button>
      </div>
      <p class="field-feedback" data-job-feedback></p>
    </form>
  `;
}

function importTemplate() {
  return `
    <p class="card__text">Skapa kund och jobb från det senaste sparade offertutkastet.</p>
    <button class="button button--large" type="button" data-import-quote>Skapa kund/jobb från senaste offert</button>
    <p class="field-feedback" data-import-feedback></p>
  `;
}

function renderOverview(page, customers, jobs) {
  const summary = summarizeArchive(customers, jobs);
  page.querySelector("[data-archive-overview]").innerHTML = `
    <div class="archive-stat">
      ${statCard("Kunder", summary.customerCount)}
      ${statCard("Jobb", summary.jobCount)}
      ${statCard("Öppna jobb", summary.openJobCount)}
      ${statCard("Offererat exkl. moms", formatCurrency(summary.offeredValueExVat))}
      ${statCard("Senast uppdaterad", formatDateTime(summary.latestUpdatedAt) || "Ingen data")}
    </div>
  `;
}

function renderCustomerSelect(form, customers) {
  const currentValue = form.elements.customerId.value;
  form.elements.customerId.innerHTML = `
    <option value="">Ingen kund vald</option>
    ${sortCustomers(customers).map((customer) =>
      `<option value="${escapeHtml(customer.id)}">${escapeHtml(customer.name)}${customer.propertyName ? `, ${escapeHtml(customer.propertyName)}` : ""}</option>`
    ).join("")}
  `;
  form.elements.customerId.value = customers.some((customer) => customer.id === currentValue) ? currentValue : "";
}

function renderCustomerList(page, customers, jobs, searchTerm) {
  const filtered = filterCustomers(customers, searchTerm);
  const node = page.querySelector("[data-customer-list]");
  if (!filtered.length) {
    node.innerHTML = `<p class="archive-empty">Inga kunder sparade ännu.</p>`;
    return;
  }

  node.innerHTML = filtered.map((customer) => {
    const stats = getCustomerJobStats(customer.id, jobs);
    return `
      <article class="archive-card">
        <div>
          <span class="pill">${stats.jobCount} jobb</span>
          <h3>${escapeHtml(customer.name)}</h3>
          <p>${escapeHtml(customer.propertyName || "Ingen fastighet angiven")}</p>
          <p>${escapeHtml(customer.municipality || "Ingen kommun angiven")}</p>
          <p>${escapeHtml([customer.phone, customer.email].filter(Boolean).join(" / ") || "Ingen kontakt angiven")}</p>
          <strong>${formatCurrency(stats.offeredValueExVat)} offererat exkl. moms</strong>
        </div>
        <div class="archive-card__actions">
          <button class="button button--secondary" type="button" data-action="edit-customer" data-customer-id="${escapeHtml(customer.id)}">Redigera</button>
          <button class="button button--secondary" type="button" data-action="new-job" data-customer-id="${escapeHtml(customer.id)}">Nytt jobb</button>
          <button class="button button--secondary" type="button" data-action="delete-customer" data-customer-id="${escapeHtml(customer.id)}">Ta bort</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderJobArchive(page, jobs, filters) {
  const filtered = filterJobs(jobs, filters);
  const node = page.querySelector("[data-job-list]");
  if (!filtered.length) {
    node.innerHTML = `<p class="archive-empty">Inga jobb sparade ännu.</p>`;
    return;
  }

  node.innerHTML = filtered.map((job) => `
    <article class="archive-card">
      <div>
        <span class="pill">${escapeHtml(job.status)}</span>
        <h3>${escapeHtml(job.title || "Namnlöst jobb")}</h3>
        <p>${escapeHtml(job.customerName || "Ingen kund")} · ${escapeHtml(job.propertyName || "Ingen fastighet")}</p>
        <p>${escapeHtml(job.type)} · ${escapeHtml(job.quoteDate || job.plannedStart || "Inget datum")}</p>
        <strong>${formatCurrency(job.estimatedValueExVat)} exkl. moms</strong>
      </div>
      <div class="archive-card__actions">
        <button class="button button--secondary" type="button" data-action="edit-job" data-job-id="${escapeHtml(job.id)}">Redigera</button>
        <button class="button button--secondary" type="button" data-action="complete-job" data-job-id="${escapeHtml(job.id)}">Markera som klar</button>
        <button class="button button--secondary" type="button" data-action="delete-job" data-job-id="${escapeHtml(job.id)}">Ta bort</button>
      </div>
    </article>
  `).join("");
}

function readCustomerForm(form) {
  return normalizeCustomer({
    name: form.elements.name.value,
    email: form.elements.email.value,
    phone: form.elements.phone.value,
    address: form.elements.address.value,
    municipality: form.elements.municipality.value,
    propertyName: form.elements.propertyName.value,
    notes: form.elements.notes.value
  });
}

function readJobForm(form, customers) {
  const customer = customers.find((item) => item.id === form.elements.customerId.value);
  return normalizeJob({
    customerId: customer?.id || "",
    customerName: form.elements.customerName.value || customer?.name || "",
    propertyName: form.elements.propertyName.value || customer?.propertyName || "",
    municipality: form.elements.municipality.value || customer?.municipality || "",
    type: form.elements.type.value,
    status: form.elements.status.value,
    title: form.elements.title.value,
    description: form.elements.description.value,
    areaHa: form.elements.areaHa.value,
    estimatedValueExVat: form.elements.estimatedValueExVat.value,
    estimatedValueIncVat: form.elements.estimatedValueIncVat.value,
    quoteNumber: form.elements.quoteNumber.value,
    quoteDate: form.elements.quoteDate.value,
    plannedStart: form.elements.plannedStart.value,
    completedDate: form.elements.completedDate.value,
    notes: form.elements.notes.value,
    source: "manual"
  });
}

function fillCustomerForm(form, customer) {
  form.elements.name.value = customer.name;
  form.elements.propertyName.value = customer.propertyName;
  form.elements.municipality.value = customer.municipality;
  form.elements.email.value = customer.email;
  form.elements.phone.value = customer.phone;
  form.elements.address.value = customer.address;
  form.elements.notes.value = customer.notes;
}

function fillJobForm(form, job) {
  form.elements.customerId.value = job.customerId;
  form.elements.customerName.value = job.customerName;
  form.elements.type.value = job.type;
  form.elements.status.value = job.status;
  form.elements.title.value = job.title;
  form.elements.propertyName.value = job.propertyName;
  form.elements.municipality.value = job.municipality;
  form.elements.areaHa.value = job.areaHa || "";
  form.elements.estimatedValueExVat.value = job.estimatedValueExVat || "";
  form.elements.estimatedValueIncVat.value = job.estimatedValueIncVat || "";
  form.elements.quoteNumber.value = job.quoteNumber;
  form.elements.quoteDate.value = job.quoteDate;
  form.elements.plannedStart.value = job.plannedStart;
  form.elements.completedDate.value = job.completedDate;
  form.elements.description.value = job.description;
  form.elements.notes.value = job.notes;
}

function resetCustomerForm(form) {
  form.reset();
}

function resetJobForm(form) {
  form.reset();
  form.elements.type.value = JOB_TYPES[0];
  form.elements.status.value = JOB_STATUSES[0];
}

function setFeedback(node, message, isError = false) {
  node.textContent = message;
  node.classList.toggle("is-error", isError);
}

function cardTemplate(title, content) {
  return `<section class="card"><div class="card__body"><h3 class="card__title">${escapeHtml(title)}</h3>${content}</div></section>`;
}

function statCard(label, value) {
  return `<article class="card archive-stat-card"><div class="card__body"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div></article>`;
}

function textField(name, label) {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <input class="input" name="${escapeHtml(name)}" type="text">
    </label>
  `;
}

function numberField(name, label, step) {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <input class="input" name="${escapeHtml(name)}" type="number" inputmode="decimal" min="0" step="${escapeHtml(step)}">
    </label>
  `;
}

function dateField(name, label) {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <input class="input" name="${escapeHtml(name)}" type="date">
    </label>
  `;
}

function textareaField(name, label) {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <textarea class="textarea" name="${escapeHtml(name)}"></textarea>
    </label>
  `;
}

function selectField(name, label, options) {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <select class="select" name="${escapeHtml(name)}">
        ${options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}
