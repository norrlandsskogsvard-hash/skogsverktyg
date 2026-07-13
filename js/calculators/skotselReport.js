const REPORT_TITLE = "Skötselkollen – fältprotokoll";
const REPORT_CACHE_NAME = "skogskalkyl-2.0.0-alpha.1-field-report.1";

const SPECIES_LABELS = {
  tall: "Tall",
  gran: "Gran",
  bjork: "Björk",
  asp: "Asp",
  al: "Al",
  blandat: "Blandat"
};

const REGION_LABELS = {
  norrland_kust: "Norrland kust",
  norrland_inland: "Norrland inland",
  hoglage_fjallnara: "Högläge/fjällnära",
  okand: "Okänd"
};

const PHASE_LABELS = {
  ungskog: "Ungskog",
  gallringsskog: "Gallringsskog",
  aldre_skog: "Äldre skog",
  okand: "Okänd"
};

export function buildSkotselFieldReport({ input = {}, result = {}, generatedAt = new Date() } = {}) {
  const date = normalizeDate(generatedAt);
  const generatedAtText = formatDateTime(date);
  const sections = [
    section("Rubrik", [
      REPORT_TITLE,
      "Skapad: " + generatedAtText,
      "App/cache: " + REPORT_CACHE_NAME
    ]),
    section("Bestånd/inmatning", buildInputLines(input, result)),
    section("Samlad bedömning", [
      "Skogligt: " + textOr(result.forestryStatus || result.actionLabel),
      "Säkerhet: " + textOr(result.confidence),
      "Kort motivering: " + textOr(result.why)
    ]),
    section("Skoglig motivering", buildSilvicultureLines(result)),
    section("SI/bonitering", buildSiteIndexLines(result)),
    section("Hänsyn/risk", buildConsiderationLines(result)),
    section("Juridisk kontroll", buildLegalLines(result)),
    section("Källor", buildSourceLines(result)),
    section("Ansvarsnotis", [
      "Protokollet är ett fält- och beslutsstöd baserat på inmatade värden och tillgängliga källregler. Det ersätter inte fackmässig kontroll i fält eller juridisk/myndighetsbedömning."
    ])
  ];
  const summaryText = [
    result.forestryStatus || result.actionLabel || "Skoglig bedömning saknas",
    "Säkerhet: " + textOr(result.confidence),
    "Hänsyn/risk: " + textOr(result.considerationAssessment?.status, "OK"),
    "Juridisk kontroll: " + textOr(result.legalStatus, "Ingen flagga")
  ].join(" | ");
  const plainText = sections.map((item) =>
    item.title + "\n" + item.lines.map((line) => "- " + line).join("\n")
  ).join("\n\n");

  return {
    title: REPORT_TITLE,
    generatedAt: date.toISOString(),
    summaryText,
    sections,
    plainText
  };
}

function buildInputLines(input, result) {
  const lines = [
    "Trädslag: " + label(SPECIES_LABELS, input.mainSpecies),
    "Region: " + label(REGION_LABELS, input.region),
    "SI/bonitet: " + siteIndexValue(result.siteIndexEstimate, input.siteIndex),
    "Höjd/övre höjd: " + valueWithUnit(input.heightMeters, "m"),
    "Grundyta: " + valueWithUnit(input.basalArea, "m2/ha"),
    "Stamantal: " + valueWithUnit(input.stemsPerHa, "st/ha"),
    "DGV/diameter: " + valueWithUnit(input.dgvCm, "cm"),
    "Ålder: " + valueWithUnit(input.ageYears, "år"),
    "Fas/åtgärd: " + label(PHASE_LABELS, input.standPhase) + " / " + textOr(result.forestryStatus || result.actionLabel)
  ];
  const riskMarks = [
    selected(input.damage && input.damage !== "inga", "Skador: " + input.damage),
    selected(input.snowWindRisk === "ja", "Snö-/vindrisk"),
    selected(input.bearing === "svag_blot", "Svag/blöt bärighet"),
    selected(input.conservation === "ja" || input.conservation === "osakert", "Naturvärden"),
    selected(input.waterEdge === "ja" || input.waterEdge === "osakert", "Kantzon/vatten"),
    selected(input.culturalHeritage === "ja" || input.culturalHeritage === "osakert", "Kulturmiljö/fornlämning"),
    selected(input.wildlifePressure === "ja" || input.wildlifePressure === "osakert", "Viltbete/älgtryck"),
    selected(input.insectRisk === "ja" || input.insectRisk === "osakert", "Insekter/färska skador")
  ].filter(Boolean);
  lines.push("Risk-/hänsynsmarkeringar: " + (riskMarks.length ? riskMarks.join(", ") : "Inga särskilda markerade"));
  return lines;
}

function buildSilvicultureLines(result) {
  return [
    textOr(result.why),
    "Rekommenderad riktning: " + textOr(result.recommendationDirection),
    result.chartData?.curveReference ? "Norra/T20: T20-pilot eller källstött jämförelse visas när aktiv." : "Norra/T20: ingen aktiv full kurva för vald kombination.",
    "Forsknings-/textstöd: se fältkontroller och källor nedan."
  ];
}

function buildSiteIndexLines(result) {
  const estimate = result.siteIndexEstimate || {};
  const method = estimate.method === "manual" ? "manuellt" : (estimate.numericSiteIndex ? "beräknat" : "saknas");
  return [
    "SI-status: " + method,
    "SI-värde: " + textOr(estimate.siteIndex || estimate.numericSiteIndex),
    "Kontrollera bonitetsvisande trädslag.",
    "Kontrollera likåldrigt bestånd och ostörd höjdutveckling.",
    "Kontrollera övrehöjdsträd och regionalt underlag."
  ];
}

function buildConsiderationLines(result) {
  const flags = result.considerationAssessment?.flags || [];
  if (!flags.length) return ["Hänsyn/risk: OK i snabbkontrollen.", "Kontrollera ändå fältbild, skador, mark och naturhänsyn innan åtgärd."];
  return flags.map((flag) => flag.label + ": " + flag.detail);
}

function buildLegalLines(result) {
  const checks = result.legalChecks || [];
  const base = ["Detta är kontrollstöd, inte juridiskt besked."];
  if (!checks.length) return [...base, textOr(result.legalAssessment, "Inga särskilda juridiska kontrollflaggor markerade.")];
  return [
    ...base,
    ...checks.map((check) => (check.severity || "info") + ": " + check.userText)
  ];
}

function buildSourceLines(result) {
  const items = [];
  const grouped = result.groupedSourceNotes || {};
  Object.entries(grouped).forEach(([type, values]) => {
    (values || []).slice(0, 4).forEach((item) => {
      items.push(sourceTypeLabel(type) + ": " + (item.sourceLabel || item.source || item.type));
    });
  });
  if (!items.length && Array.isArray(result.sourceNotes)) {
    result.sourceNotes.slice(0, 8).forEach((note) => items.push(note));
  }
  return [...new Set(items)].slice(0, 16);
}

function section(title, lines) {
  return { title, lines: lines.filter(Boolean).map(String) };
}

function normalizeDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

function label(labels, value) {
  return labels[value] || textOr(value);
}

function valueWithUnit(value, unit) {
  if (value === null || value === undefined || value === "") return "saknas";
  return value + " " + unit;
}

function siteIndexValue(estimate = {}, manualValue) {
  const value = estimate.siteIndex || estimate.numericSiteIndex || manualValue;
  if (!value) return "saknas";
  return String(value);
}

function selected(condition, text) {
  return condition ? text : "";
}

function textOr(value, fallback = "saknas") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function sourceTypeLabel(type) {
  return {
    law: "Juridik",
    research: "Forskning",
    regional_curve: "Norra gallringsmallar",
    field_method: "Bonitering AC/BD/B69",
    consideration: "Naturhänsyn/skador/vilt",
    practice_guide: "Praktisk mall",
    skogskunskap: "Skogskunskap",
    field_observation: "Fältdata",
    warning: "Fältvarning"
  }[type] || type;
}
