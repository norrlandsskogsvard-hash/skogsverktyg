const REVIEW_DATA_URL = "./data/norra-thinning-review-drafts.json";
const ASSISTED_EXTRACTION_URL = "./data/generated/norra-thinning-assisted-extraction.json";
const LOCAL_STORAGE_PREFIX = "skotselkollen.curveReview.";
const LOCAL_CANDIDATE_PREFIX = "skotselkollen.reviewedCandidate.";
const CORE_FIELDS = ["topHeight", "basalAreaBefore", "basalAreaAfter"];

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

export function validateCurvePointSet(draft = {}) {
  const missing = detectMissingValues(draft);
  const warnings = detectSuspiciousValues(draft);
  return {
    valid: missing.length === 0 && warnings.length === 0,
    missing,
    warnings,
    assisted: compareWithAssistedExtraction(draft, draft.assistedRows || [])
  };
}

export function calculateReviewReadiness(draft = {}) {
  const check = validateCurvePointSet(draft);
  const manualChecked = draft.manualSourceCheck === true;
  const hasReviewer = Boolean(String(draft.reviewedBy || "").trim());
  const hasReviewNote = Boolean(String(draft.reviewNote || "").trim());
  const assisted = check.assisted;

  if (check.missing.length) {
    return {
      status: "incomplete",
      label: "Ej komplett",
      reasons: check.missing,
      canExport: false
    };
  }

  if (check.warnings.length || (assisted.confidence === "low" && !hasReviewNote)) {
    return {
      status: "needs_review",
      label: "Behover granskning",
      reasons: [
        ...check.warnings,
        ...(assisted.confidence === "low" && !hasReviewNote ? ["Low confidence fran assisted extraction kraver granskningsanteckning."] : [])
      ],
      canExport: false
    };
  }

  if (!manualChecked || !hasReviewer) {
    return {
      status: "review_ready",
      label: "Klar for manuell kontroll",
      reasons: [
        ...(!manualChecked ? ["Bekrafta att vardena ar kontrollerade mot originaldiagrammet."] : []),
        ...(!hasReviewer ? ["Ange granskare/initialer."] : [])
      ],
      canExport: false
    };
  }

  return {
    status: "export_ready",
    label: "Klar for export",
    reasons: ["Detta skapar bara en aktiveringskandidat. Kurvan aktiveras forst i separat import- och valideringsbatch."],
    canExport: true
  };
}

export function buildReviewedCandidateExport(draft = {}) {
  const readiness = calculateReviewReadiness(draft);
  const candidate = {
    code: draft.code,
    species: draft.species,
    siteIndex: Number(draft.siteIndex),
    sourceId: draft.sourceId || "norra-gallringsriktlinjer-gallringsmallar",
    sourcePage: firstSourcePage(draft),
    status: "reviewed_candidate",
    activeUse: false,
    reviewNeeded: false,
    dataQuality: "manually_reviewed_from_source",
    reviewedBy: String(draft.reviewedBy || "manual_review").trim(),
    reviewedAt: new Date().toISOString().slice(0, 10),
    reviewNote: String(draft.reviewNote || "").trim(),
    readiness: readiness.status,
    points: normalizeCandidatePoints(draft),
    reviewLog: [
      {
        at: new Date().toISOString(),
        type: "local_review_export",
        note: "Lokal aktiveringskandidat. activeUse false. Inte aktiv kurva."
      }
    ]
  };
  return {
    candidate,
    json: JSON.stringify(candidate, null, 2),
    csv: reviewedCandidateCsv(candidate),
    readiness
  };
}

export function compareWithAssistedExtraction(draft = {}, assistedRows = []) {
  const match = assistedRows.find((row) => row.code === draft.code) || null;
  return {
    hasAssistedSource: Boolean(match),
    sourcePage: match?.sourcePage || "",
    confidence: match?.confidence || "unknown",
    reviewNeeded: match?.reviewNeeded ?? null,
    note: match?.note || ""
  };
}

export function detectMissingValues(draft = {}) {
  const points = Array.isArray(draft.points) ? draft.points : [];
  const missing = [];
  if (!points.length) return ["Minst en gallringspunkt kravs."];

  const hasCorePoint = points.some((point) => CORE_FIELDS.every((field) => isPositiveNumber(point[field])));
  if (!hasCorePoint) missing.push("Minst ett gallringssteg maste ha ovre hojd, grundyta fore och grundyta efter.");

  points.forEach((point, index) => {
    const label = point.stage || `punkt ${index + 1}`;
    CORE_FIELDS.forEach((field) => {
      if (!isPositiveNumber(point[field])) {
        missing.push(`${label}: ${field} saknas eller ar inte > 0.`);
      }
    });
    if (!point.sourcePage) {
      missing.push(`${label}: sourcePage saknas.`);
    }
  });

  return missing;
}

export function detectSuspiciousValues(draft = {}) {
  const points = Array.isArray(draft.points) ? draft.points : [];
  const warnings = [];

  points.forEach((point) => {
    const label = point.stage || "punkt";
    const before = nullableNumber(point.basalAreaBefore);
    const after = nullableNumber(point.basalAreaAfter);
    const stemsBefore = nullableNumber(point.stemsBefore);
    const stemsAfter = nullableNumber(point.stemsAfter);
    const age = nullableNumber(point.ageTotal);

    if (before !== null && after !== null && before <= after) {
      warnings.push(`${label}: grundyta fore ska vara storre an grundyta efter.`);
    }
    if (after !== null && after <= 0 && point.stage !== "final_felling") {
      warnings.push(`${label}: grundyta efter ska vara > 0 vid gallring.`);
    }
    if (stemsBefore !== null && stemsAfter !== null && stemsBefore < stemsAfter) {
      warnings.push(`${label}: stamantal fore ska vara >= stamantal efter.`);
    }
    if (age !== null && age <= 0) {
      warnings.push(`${label}: totalalder ska vara > 0.`);
    }
  });

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (isNumber(previous.topHeight) && isNumber(current.topHeight) && Number(current.topHeight) <= Number(previous.topHeight)) {
      warnings.push("Ovre hojd ska normalt oka mellan gallringssteg.");
    }
    if (isNumber(previous.ageTotal) && isNumber(current.ageTotal) && Number(current.ageTotal) <= Number(previous.ageTotal)) {
      warnings.push("Alder ska normalt oka mellan gallringssteg.");
    }
  }

  return warnings;
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

export function saveLocalReviewedCandidate(code, candidate) {
  const payload = {
    ...candidate,
    activeUse: false,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(candidateKey(code), JSON.stringify(payload));
  return payload;
}

export function loadLocalReviewedCandidate(code) {
  try {
    return JSON.parse(localStorage.getItem(candidateKey(code)) || "null");
  } catch {
    return null;
  }
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

function candidateKey(code) {
  return LOCAL_CANDIDATE_PREFIX + String(code || "").toUpperCase();
}

function normalizeCandidatePoints(draft) {
  return (draft.points || []).map((point) => ({
    stage: point.stage || "first_thinning",
    topHeight: Number(point.topHeight),
    basalAreaBefore: Number(point.basalAreaBefore),
    basalAreaAfter: Number(point.basalAreaAfter),
    ageTotal: nullableNumber(point.ageTotal),
    stemsBefore: nullableNumber(point.stemsBefore),
    stemsAfter: nullableNumber(point.stemsAfter),
    sourcePage: point.sourcePage || draft.sourcePage || "",
    note: point.note || ""
  }));
}

function reviewedCandidateCsv(candidate) {
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
    "dataQuality",
    "reviewedBy",
    "reviewedAt",
    "reviewNote",
    "activeUse"
  ];
  const rows = candidate.points.map((point) => csvRow([
    candidate.code,
    candidate.species,
    candidate.siteIndex,
    point.stage,
    point.topHeight,
    point.basalAreaBefore,
    point.basalAreaAfter,
    point.ageTotal,
    point.stemsBefore,
    point.stemsAfter,
    point.sourcePage,
    candidate.dataQuality,
    candidate.reviewedBy,
    candidate.reviewedAt,
    candidate.reviewNote,
    false
  ]));
  return [header.join(","), ...rows].join("\n");
}

function firstSourcePage(draft = {}) {
  return (draft.points || []).find((point) => point.sourcePage)?.sourcePage || draft.sourcePage || "";
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isNumber(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

function isPositiveNumber(value) {
  return isNumber(value) && Number(value) > 0;
}

function csvRow(values) {
  return values.map((value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
  }).join(",");
}
