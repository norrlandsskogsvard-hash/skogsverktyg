const REVIEW_DATA_URL = "./data/norra-thinning-review-drafts.json";
const ASSISTED_EXTRACTION_URL = "./data/generated/norra-thinning-assisted-extraction.json";
const LOCAL_STORAGE_PREFIX = "skotselkollen.curveReview.";

let cachedWorkspace = null;
let cachedAssistedExtraction = null;

export async function loadCurveReviewWorkspace() {
  if (cachedWorkspace) return cachedWorkspace;
  const response = await fetch(REVIEW_DATA_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Kunde inte lasa granskningsdata.");
  }
  cachedWorkspace = await response.json();
  return cachedWorkspace;
}

export function listCurveDrafts(workspace = {}) {
  return Array.isArray(workspace.drafts) ? workspace.drafts : [];
}

export function getCurveDraft(code, workspace = {}) {
  const normalizedCode = String(code || "").toUpperCase();
  return listCurveDrafts(workspace).find((draft) => draft.code === normalizedCode) || null;
}

export function validateDraftPoint(point = {}) {
  const numericFields = [
    "topHeight",
    "basalAreaBefore",
    "basalAreaAfter",
    "ageTotal",
    "stemsBefore",
    "stemsAfter"
  ];
  const invalidFields = numericFields.filter((field) => {
    const value = point[field];
    return value !== null && value !== "" && !Number.isFinite(Number(value));
  });
  const filledFields = numericFields.filter((field) => {
    const value = point[field];
    return value !== null && value !== "" && Number.isFinite(Number(value));
  });
  const warnings = [];
  const before = Number(point.basalAreaBefore);
  const after = Number(point.basalAreaAfter);

  if (Number.isFinite(before) && Number.isFinite(after) && after > before) {
    warnings.push("Grundyta efter ar hogre an grundyta fore.");
  }

  return {
    valid: invalidFields.length === 0,
    invalidFields,
    filledFields,
    warnings
  };
}

export function summarizeDraft(draft = {}) {
  const points = Array.isArray(draft.points) ? draft.points : [];
  const filledFields = points.reduce((sum, point) => sum + validateDraftPoint(point).filledFields.length, 0);
  return {
    code: draft.code,
    species: draft.species,
    siteIndex: draft.siteIndex,
    status: draft.status,
    reviewStatus: draft.reviewStatus,
    pointCount: points.length,
    filledFields,
    blockedReason: getBlockedReason(draft)
  };
}

export function buildReviewExport(drafts = []) {
  const header = [
    "code",
    "species",
    "siteIndex",
    "stage",
    "topHeight",
    "basalAreaBefore",
    "basalAreaAfter",
    "ageTotal",
    "stemsBefore",
    "stemsAfter",
    "sourcePage",
    "note",
    "reviewStatus"
  ];
  const rows = drafts.flatMap((draft) =>
    (draft.points || []).map((point) => csvRow([
      draft.code,
      draft.species,
      draft.siteIndex,
      point.stage,
      point.topHeight,
      point.basalAreaBefore,
      point.basalAreaAfter,
      point.ageTotal,
      point.stemsBefore,
      point.stemsAfter,
      draft.sourcePage,
      point.note,
      draft.reviewStatus
    ]))
  );
  return [header.join(","), ...rows].join("\n");
}

export function getBlockedReason(draft = {}) {
  if (draft.activeUse !== false) return "Utkastet ar inte sparrat for aktiv anvandning.";
  if (draft.reviewNeeded !== true) return "Utkastet saknar obligatorisk reviewNeeded-sparr.";
  if (!draft.sourcePage) return "Kallsida saknas och vardena ar inte verifierade.";
  if (draft.dataQuality === "manual_draft" || draft.dataQuality === "empty_draft") {
    return "Manuellt utkast: lokal granskning aktiverar inte kurvan.";
  }
  return "Kurvan ar sparrad tills import och aktiveringsprotokoll har passerat.";
}

export function loadLocalDraft(code) {
  try {
    return JSON.parse(localStorage.getItem(localKey(code)) || "null");
  } catch {
    return null;
  }
}

export function saveLocalDraft(code, point, reviewStatus = "local_draft") {
  const payload = {
    code: String(code || "").toUpperCase(),
    reviewStatus,
    point,
    savedAt: new Date().toISOString(),
    activeUse: false
  };
  localStorage.setItem(localKey(code), JSON.stringify(payload));
  return payload;
}

export function clearLocalDraft(code) {
  localStorage.removeItem(localKey(code));
}

export function buildCsvRowForDraft(draft = {}, point = {}) {
  return csvRow([
    draft.code,
    draft.species,
    draft.siteIndex,
    point.stage || "first_thinning",
    point.topHeight,
      point.basalAreaBefore,
      point.basalAreaAfter,
      point.ageTotal,
      point.stemsBefore,
      point.stemsAfter,
      point.sourcePage || draft.sourcePage,
      point.note,
      "local_draft"
  ]);
}

export async function loadAssistedExtraction() {
  if (cachedAssistedExtraction) return cachedAssistedExtraction;
  try {
    const response = await fetch(ASSISTED_EXTRACTION_URL, { cache: "no-store" });
    if (!response.ok) return null;
    cachedAssistedExtraction = await response.json();
    return cachedAssistedExtraction;
  } catch {
    return null;
  }
}

export function summarizeAssistedExtraction(extraction = {}) {
  const rows = Array.isArray(extraction.rows) ? extraction.rows : [];
  const confidence = rows.reduce((acc, row) => {
    acc[row.confidence] = (acc[row.confidence] || 0) + 1;
    return acc;
  }, { high: 0, medium: 0, low: 0 });
  return {
    rowCount: rows.length,
    confidence,
    curvesWithData: [...new Set(rows.map((row) => row.code).filter(Boolean))],
    missingSafeValues: [...new Set(rows.filter((row) => row.reviewNeeded).map((row) => row.code))]
  };
}

export function buildAssistedCsv(rows = []) {
  const header = [
    "code",
    "species",
    "siteIndex",
    "stage",
    "topHeight",
    "basalAreaBefore",
    "basalAreaAfter",
    "ageTotal",
    "stemsBefore",
    "stemsAfter",
    "sourcePage",
    "extractionMethod",
    "confidence",
    "reviewNeeded",
    "activeUse",
    "note"
  ];
  return [header.join(","), ...rows.map((row) => csvRow(header.map((key) => row[key])))].join("\n");
}

function localKey(code) {
  return LOCAL_STORAGE_PREFIX + String(code || "").toUpperCase();
}

function csvRow(values) {
  return values.map((value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
  }).join(",");
}
