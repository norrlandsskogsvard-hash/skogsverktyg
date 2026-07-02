const DEFAULT_VAT_RATE = 25;

export const UNIT_OPTIONS = ["st", "ha", "h", "dag", "km", "fast pris"];
export const ROUNDING_OPTIONS = ["none", "100", "500", "1000"];

export function createEmptyQuote(settings = {}) {
  const today = new Date();
  const validUntil = addDays(today, 30);
  const quoteNumber = `OFF-${dateStamp(today)}`;

  return {
    company: {
      companyName: settings.companyName || "",
      email: "",
      phone: "",
      address: "",
      orgNumber: "",
      vatRegistered: true
    },
    customer: {
      customerName: "",
      propertyName: "",
      address: "",
      email: "",
      phone: "",
      municipality: ""
    },
    meta: {
      quoteNumber,
      quoteDate: toDateInput(today),
      validUntil: toDateInput(validUntil),
      title: "Offert skogliga tjänster",
      description: "Arbetet utförs enligt angivet underlag och överenskommen omfattning.",
      worksite: "",
      estimatedStart: "",
      estimatedDuration: ""
    },
    rows: [createQuoteRow()],
    adjustments: {
      discountPercent: 0,
      markupPercent: 0,
      rounding: "none"
    },
    terms: {
      paymentTerms: "10 dagar",
      validUntil: toDateInput(validUntil),
      rutRot: false,
      priceBasedOnInput: true,
      extraWorkSeparately: true,
      fieldConditionReservation: true,
      customTerms: ""
    },
    notes: ""
  };
}

export function createQuoteRow(overrides = {}) {
  return {
    id: overrides.id || createRowId(),
    description: overrides.description || "",
    quantity: overrides.quantity ?? 1,
    unit: UNIT_OPTIONS.includes(overrides.unit) ? overrides.unit : "st",
    unitPrice: overrides.unitPrice ?? 0,
    vatRate: overrides.vatRate ?? DEFAULT_VAT_RATE
  };
}

export function normalizeQuoteInput(input = {}) {
  const fallback = createEmptyQuote();
  const quote = {
    company: { ...fallback.company, ...(input.company || {}) },
    customer: { ...fallback.customer, ...(input.customer || {}) },
    meta: { ...fallback.meta, ...(input.meta || {}) },
    rows: Array.isArray(input.rows) ? input.rows : fallback.rows,
    adjustments: { ...fallback.adjustments, ...(input.adjustments || {}) },
    terms: { ...fallback.terms, ...(input.terms || {}) },
    notes: String(input.notes || "")
  };

  quote.company.companyName = cleanText(quote.company.companyName);
  quote.company.email = cleanText(quote.company.email);
  quote.company.phone = cleanText(quote.company.phone);
  quote.company.address = cleanText(quote.company.address);
  quote.company.orgNumber = cleanText(quote.company.orgNumber);
  quote.company.vatRegistered = Boolean(quote.company.vatRegistered);

  Object.keys(quote.customer).forEach((key) => {
    quote.customer[key] = cleanText(quote.customer[key]);
  });
  Object.keys(quote.meta).forEach((key) => {
    quote.meta[key] = cleanText(quote.meta[key]);
  });

  quote.rows = quote.rows.map(normalizeQuoteRow);
  if (!quote.rows.length) {
    quote.rows = [createQuoteRow()];
  }

  quote.adjustments.discountPercent = clamp(parseNumber(quote.adjustments.discountPercent), 0, 100);
  quote.adjustments.markupPercent = Math.max(0, parseNumber(quote.adjustments.markupPercent));
  quote.adjustments.rounding = ROUNDING_OPTIONS.includes(String(quote.adjustments.rounding))
    ? String(quote.adjustments.rounding)
    : "none";

  quote.terms.paymentTerms = cleanText(quote.terms.paymentTerms) || "10 dagar";
  quote.terms.validUntil = cleanText(quote.terms.validUntil || quote.meta.validUntil);
  quote.terms.rutRot = Boolean(quote.terms.rutRot);
  quote.terms.priceBasedOnInput = Boolean(quote.terms.priceBasedOnInput);
  quote.terms.extraWorkSeparately = Boolean(quote.terms.extraWorkSeparately);
  quote.terms.fieldConditionReservation = Boolean(quote.terms.fieldConditionReservation);
  quote.terms.customTerms = cleanText(quote.terms.customTerms);

  return quote;
}

export function calculateQuoteEstimate(input = {}) {
  const quote = normalizeQuoteInput(input);
  const errors = [];
  const notes = [];
  const calculatedRows = quote.rows.map(calculateRow);
  const activeRows = calculatedRows.filter((row) => row.isActive);
  const subtotalBeforeAdjustments = activeRows.reduce((sum, row) => sum + row.lineExVat, 0);
  const discountAmount = subtotalBeforeAdjustments * (quote.adjustments.discountPercent / 100);
  const subtotalAfterDiscount = Math.max(0, subtotalBeforeAdjustments - discountAmount);
  const markupAmount = subtotalAfterDiscount * (quote.adjustments.markupPercent / 100);
  const subtotalExVat = subtotalAfterDiscount + markupAmount;
  const vatTotal = activeRows.reduce((sum, row) => {
    const share = subtotalBeforeAdjustments > 0 ? row.lineExVat / subtotalBeforeAdjustments : 0;
    const adjustedLineExVat = (subtotalExVat * share);
    return sum + adjustedLineExVat * (row.vatRate / 100);
  }, 0);
  const totalBeforeRounding = subtotalExVat + vatTotal;
  const roundedTotal = applyRounding(totalBeforeRounding, quote.adjustments.rounding);
  const roundingAdjustment = roundedTotal - totalBeforeRounding;
  const totalIncVat = roundedTotal;

  if (!quote.customer.customerName) {
    notes.push("Kundnamn saknas.");
  }
  if (!activeRows.length) {
    errors.push("Lägg till minst en offertpost med antal och à-pris större än 0.");
  }

  const estimate = {
    ...quote,
    valid: errors.length === 0,
    errors,
    notes,
    quoteNumber: quote.meta.quoteNumber,
    subtotalBeforeAdjustments,
    subtotalExVat,
    vatTotal,
    discountAmount,
    markupAmount,
    roundingAdjustment,
    totalIncVat,
    totalToOffer: totalIncVat,
    rows: calculatedRows,
    activeRows,
    previewText: ""
  };
  estimate.previewText = buildQuoteText(estimate);
  return estimate;
}

export function buildQuoteText(quoteEstimate) {
  const estimate = quoteEstimate?.valid === undefined ? calculateQuoteEstimate(quoteEstimate) : quoteEstimate;
  const activeRows = estimate.activeRows || estimate.rows?.filter((row) => row.isActive) || [];
  const customer = estimate.customer?.customerName || "Kund";
  const title = estimate.meta?.title || "Offert";

  return [
    `${title}`,
    `Offertnummer: ${estimate.quoteNumber || estimate.meta?.quoteNumber || ""}`,
    `Kund: ${customer}`,
    estimate.customer?.propertyName ? `Fastighet: ${estimate.customer.propertyName}` : "",
    "",
    "Offertposter:",
    ...activeRows.map((row) => `- ${row.description}: ${formatSvNumber(row.quantity, 2)} ${row.unit} x ${formatSvCurrency(row.unitPrice)} = ${formatSvCurrency(row.lineExVat)} exkl. moms`),
    "",
    `Summa exkl. moms: ${formatSvCurrency(estimate.subtotalExVat || 0)}`,
    `Moms: ${formatSvCurrency(estimate.vatTotal || 0)}`,
    `Total inkl. moms: ${formatSvCurrency(estimate.totalIncVat || 0)}`,
    "",
    `Betalningsvillkor: ${estimate.terms?.paymentTerms || "10 dagar"}`,
    estimate.terms?.validUntil ? `Offerten gäller till: ${estimate.terms.validUntil}` : ""
  ].filter(Boolean).join("\n");
}

function normalizeQuoteRow(row = {}) {
  return {
    id: row.id || createRowId(),
    description: cleanText(row.description),
    quantity: Math.max(0, parseNumber(row.quantity)),
    unit: UNIT_OPTIONS.includes(row.unit) ? row.unit : "st",
    unitPrice: Math.max(0, parseNumber(row.unitPrice)),
    vatRate: Math.max(0, parseNumber(row.vatRate, DEFAULT_VAT_RATE))
  };
}

function calculateRow(row) {
  const lineExVat = row.quantity * row.unitPrice;
  const vatAmount = lineExVat * (row.vatRate / 100);
  return {
    ...row,
    isActive: lineExVat > 0,
    lineExVat,
    vatAmount,
    lineIncVat: lineExVat + vatAmount
  };
}

function applyRounding(value, rounding) {
  const step = Number.parseInt(rounding, 10);
  if (!Number.isFinite(step) || step <= 0) {
    return value;
  }
  return Math.round(value / step) * step;
}

function parseNumber(value, fallback = 0) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  const parsed = Number.parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function createRowId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateStamp(date) {
  return toDateInput(date).replaceAll("-", "");
}

function toDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function formatSvNumber(value, digits) {
  return new Intl.NumberFormat("sv-SE", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);
}

function formatSvCurrency(value) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);
}
