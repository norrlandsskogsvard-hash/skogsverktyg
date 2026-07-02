export const CUSTOMER_STORAGE_KEY = "customers";
export const JOB_STORAGE_KEY = "jobs";

export const JOB_TYPES = ["Röjning", "Skogsbruksplan", "Trädfällning", "Vägröjning", "Rågång", "Annat"];
export const JOB_STATUSES = ["Förfrågan", "Offert skickad", "Accepterad", "Planerad", "Pågår", "Klar", "Fakturerad", "Avböjd"];
export const OPEN_JOB_STATUSES = ["Förfrågan", "Offert skickad", "Accepterad", "Planerad", "Pågår"];

export function createCustomer(input = {}) {
  return normalizeCustomer({
    ...input,
    id: input.id || createId("customer"),
    createdAt: input.createdAt || nowIso(),
    updatedAt: nowIso()
  });
}

export function updateCustomer(customers = [], customerId, patch = {}) {
  return customers.map((customer) =>
    customer.id === customerId
      ? normalizeCustomer({ ...customer, ...patch, id: customer.id, createdAt: customer.createdAt, updatedAt: nowIso() })
      : normalizeCustomer(customer)
  );
}

export function deleteCustomer(customers = [], customerId) {
  return customers.filter((customer) => customer.id !== customerId).map(normalizeCustomer);
}

export function createJob(input = {}) {
  return normalizeJob({
    ...input,
    id: input.id || createId("job"),
    createdAt: input.createdAt || nowIso(),
    updatedAt: nowIso()
  });
}

export function updateJob(jobs = [], jobId, patch = {}) {
  return jobs.map((job) =>
    job.id === jobId
      ? normalizeJob({ ...job, ...patch, id: job.id, createdAt: job.createdAt, updatedAt: nowIso() })
      : normalizeJob(job)
  );
}

export function deleteJob(jobs = [], jobId) {
  return jobs.filter((job) => job.id !== jobId).map(normalizeJob);
}

export function normalizeCustomer(input = {}) {
  const createdAt = cleanText(input.createdAt) || nowIso();
  return {
    id: cleanText(input.id) || createId("customer"),
    createdAt,
    updatedAt: cleanText(input.updatedAt) || createdAt,
    name: cleanText(input.name),
    email: cleanText(input.email),
    phone: cleanText(input.phone),
    address: cleanText(input.address),
    municipality: cleanText(input.municipality),
    propertyName: cleanText(input.propertyName),
    notes: cleanText(input.notes)
  };
}

export function normalizeJob(input = {}) {
  const createdAt = cleanText(input.createdAt) || nowIso();
  return {
    id: cleanText(input.id) || createId("job"),
    createdAt,
    updatedAt: cleanText(input.updatedAt) || createdAt,
    customerId: cleanText(input.customerId),
    customerName: cleanText(input.customerName),
    propertyName: cleanText(input.propertyName),
    municipality: cleanText(input.municipality),
    type: JOB_TYPES.includes(input.type) ? input.type : "Annat",
    status: JOB_STATUSES.includes(input.status) ? input.status : "Förfrågan",
    title: cleanText(input.title),
    description: cleanText(input.description),
    areaHa: Math.max(0, parseNumber(input.areaHa)),
    estimatedValueExVat: Math.max(0, parseNumber(input.estimatedValueExVat)),
    estimatedValueIncVat: Math.max(0, parseNumber(input.estimatedValueIncVat)),
    quoteNumber: cleanText(input.quoteNumber),
    quoteDate: cleanText(input.quoteDate),
    plannedStart: cleanText(input.plannedStart),
    completedDate: cleanText(input.completedDate),
    notes: cleanText(input.notes),
    source: cleanText(input.source)
  };
}

export function findCustomerByNameAndProperty(customers = [], name = "", propertyName = "") {
  const normalizedName = normalizeSearch(name);
  const normalizedProperty = normalizeSearch(propertyName);
  return customers.find((customer) =>
    normalizeSearch(customer.name) === normalizedName
    && normalizeSearch(customer.propertyName) === normalizedProperty
  ) || null;
}

export function createArchiveFromQuote(quoteEstimate) {
  const estimate = quoteEstimate || {};
  const customerInput = estimate.customer || {};
  const meta = estimate.meta || {};
  const customerName = cleanText(customerInput.customerName);
  const propertyName = cleanText(customerInput.propertyName || meta.worksite);
  const activeRows = estimate.activeRows || estimate.rows?.filter((row) => row.lineExVat > 0) || [];

  const customer = createCustomer({
    name: customerName,
    email: customerInput.email,
    phone: customerInput.phone,
    address: customerInput.address,
    municipality: customerInput.municipality,
    propertyName,
    notes: ""
  });

  const job = createJob({
    customerId: customer.id,
    customerName,
    propertyName,
    municipality: customer.municipality,
    type: inferJobType(meta.title, activeRows),
    status: "Offert skickad",
    title: cleanText(meta.title) || "Offert skoglig tjänst",
    description: cleanText(meta.description),
    areaHa: inferAreaHa(activeRows),
    estimatedValueExVat: estimate.subtotalExVat,
    estimatedValueIncVat: estimate.totalIncVat,
    quoteNumber: estimate.quoteNumber || meta.quoteNumber,
    quoteDate: meta.quoteDate,
    plannedStart: meta.estimatedStart,
    completedDate: "",
    notes: cleanText(estimate.notes),
    source: "quote"
  });

  return { customer, job };
}

export function sortCustomers(customers = []) {
  return [...customers].map(normalizeCustomer).sort((a, b) =>
    a.name.localeCompare(b.name, "sv") || a.propertyName.localeCompare(b.propertyName, "sv")
  );
}

export function sortJobs(jobs = []) {
  return [...jobs].map(normalizeJob).sort((a, b) =>
    (b.quoteDate || b.plannedStart || b.updatedAt).localeCompare(a.quoteDate || a.plannedStart || a.updatedAt)
  );
}

export function filterCustomers(customers = [], searchTerm = "") {
  const needle = normalizeSearch(searchTerm);
  if (!needle) {
    return sortCustomers(customers);
  }
  return sortCustomers(customers).filter((customer) =>
    [customer.name, customer.propertyName, customer.municipality, customer.email, customer.phone]
      .some((value) => normalizeSearch(value).includes(needle))
  );
}

export function filterJobs(jobs = [], filters = {}) {
  const search = normalizeSearch(filters.searchTerm);
  return sortJobs(jobs).filter((job) => {
    const matchesSearch = !search || [job.title, job.customerName, job.propertyName, job.municipality, job.quoteNumber]
      .some((value) => normalizeSearch(value).includes(search));
    const matchesStatus = !filters.status || job.status === filters.status;
    const matchesType = !filters.type || job.type === filters.type;
    const matchesCustomer = !filters.customerId || job.customerId === filters.customerId;
    return matchesSearch && matchesStatus && matchesType && matchesCustomer;
  });
}

export function summarizeArchive(customers = [], jobs = []) {
  const normalizedJobs = jobs.map(normalizeJob);
  const latest = [...customers, ...normalizedJobs]
    .map((item) => item.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  return {
    customerCount: customers.length,
    jobCount: normalizedJobs.length,
    openJobCount: normalizedJobs.filter((job) => OPEN_JOB_STATUSES.includes(job.status)).length,
    offeredValueExVat: normalizedJobs.reduce((sum, job) => sum + job.estimatedValueExVat, 0),
    latestUpdatedAt: latest || ""
  };
}

export function getCustomerJobStats(customerId, jobs = []) {
  const customerJobs = jobs.map(normalizeJob).filter((job) => job.customerId === customerId);
  return {
    jobCount: customerJobs.length,
    offeredValueExVat: customerJobs.reduce((sum, job) => sum + job.estimatedValueExVat, 0)
  };
}

function inferJobType(title = "", rows = []) {
  const text = normalizeSearch([title, ...rows.map((row) => row.description)].join(" "));
  if (text.includes("röj")) return "Röjning";
  if (text.includes("plan")) return "Skogsbruksplan";
  if (text.includes("fäll")) return "Trädfällning";
  if (text.includes("väg")) return "Vägröjning";
  if (text.includes("rågång")) return "Rågång";
  return "Annat";
}

function inferAreaHa(rows = []) {
  return rows
    .filter((row) => row.unit === "ha")
    .reduce((sum, row) => sum + parseNumber(row.quantity), 0);
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function parseNumber(value, fallback = 0) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  const parsed = Number.parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSearch(value) {
  return cleanText(value).toLocaleLowerCase("sv-SE");
}
