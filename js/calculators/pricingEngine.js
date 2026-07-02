const HOURS_PER_DAY = 8;
const BASE_PRODUCTIVITY_HA_PER_DAY = 0.85;

const TREE_SPECIES_FACTORS = {
  pine: { label: "Tall", factor: 1 },
  spruce: { label: "Gran", factor: 1.05 },
  deciduous: { label: "Bjork/lov", factor: 1.12 },
  mixed: { label: "Blandskog", factor: 1.08 }
};

const CLEARING_TYPE_FACTORS = {
  young: { label: "Ungskogsröjning", factor: 1 },
  understory: { label: "Underväxtröjning", factor: 1.18 },
  reclearing: { label: "Omröjning", factor: 1.28 },
  roadside: { label: "Siktröjning/vägröjning nära väg", factor: 1.14 }
};

const SELECT_FACTORS = {
  terrain: {
    easy: { label: "Lätt", factor: 0.9 },
    normal: { label: "Normal", factor: 1 },
    hard: { label: "Svår", factor: 1.28 },
    veryHard: { label: "Mycket svår", factor: 1.48 }
  },
  vegetation: {
    low: { label: "Låg", factor: 0.9 },
    normal: { label: "Normal", factor: 1 },
    dense: { label: "Tät", factor: 1.25 },
    veryDense: { label: "Mycket tät", factor: 1.5 }
  },
  stoniness: {
    low: { label: "Låg", factor: 0.95 },
    normal: { label: "Normal", factor: 1 },
    high: { label: "Hög", factor: 1.18 }
  },
  slope: {
    flat: { label: "Plan", factor: 0.95 },
    moderate: { label: "Måttlig", factor: 1.08 },
    steep: { label: "Brant", factor: 1.24 }
  },
  ground: {
    normal: { label: "Normal", factor: 1 },
    wet: { label: "Blöt", factor: 1.16 },
    sensitive: { label: "Känslig", factor: 1.12 }
  },
  access: {
    good: { label: "God", factor: 0.95 },
    normal: { label: "Normal", factor: 1 },
    poor: { label: "Dålig", factor: 1.18 }
  }
};

export const CLEARING_DEFAULTS = {
  areaHa: 3.4,
  stemsBeforePerHa: 4200,
  stemsAfterPerHa: 2000,
  meanHeightM: 2.2,
  dgvCm: 3.8,
  treeSpecies: "pine",
  deciduousSharePercent: 15,
  clearingType: "young",
  terrain: "normal",
  vegetation: "normal",
  stoniness: "normal",
  slope: "moderate",
  ground: "normal",
  access: "normal",
  hourlyRate: 620,
  equipmentRate: 145,
  travelCost: 950,
  adminMarkupPercent: 8,
  profitMarkupPercent: 12,
  vatPercent: 25
};

const PLAN_TYPE_FACTORS = {
  simple: { label: "Enkel plan", factor: 0.85 },
  normal: { label: "Normal skogsbruksplan", factor: 1 },
  advanced: { label: "Fördjupad plan", factor: 1.25 },
  revision: { label: "Uppdatering/revidering av befintlig plan", factor: 0.75 }
};

const PLAN_FIELD_DIFFICULTY_FACTORS = {
  easy: { label: "Lätt", factor: 0.9 },
  normal: { label: "Normal", factor: 1 },
  hard: { label: "Svår", factor: 1.2 },
  veryHard: { label: "Mycket svår", factor: 1.4 }
};

const PLAN_ACCESS_FACTORS = {
  good: { label: "God", factor: 0.95 },
  normal: { label: "Normal", factor: 1 },
  hard: { label: "Svår", factor: 1.18 }
};

const PLAN_TERRAIN_FACTORS = {
  easy: { label: "Lätt", factor: 0.95 },
  normal: { label: "Normal", factor: 1 },
  hard: { label: "Svår", factor: 1.18 }
};

export const FOREST_PLAN_DEFAULTS = {
  propertyName: "Skogen 1:4",
  customerName: "",
  municipality: "",
  areaHa: 58,
  parcelCount: 2,
  standCount: 24,
  planType: "normal",
  baseFee: 4500,
  hectareRate: 145,
  standRate: 120,
  parcelRate: 600,
  mapCost: 900,
  adminFixedCost: 750,
  fieldDays: 1.5,
  fieldDayRate: 6800,
  fieldDifficulty: "normal",
  accessibility: "normal",
  terrain: "normal",
  fieldNote: "",
  officeHours: 6,
  officeHourlyRate: 620,
  qualityCost: 1200,
  meetingCost: 900,
  travelKmRoundtrip: 80,
  kmRate: 8,
  tripCount: 1,
  establishmentCost: 950,
  adminMarkupPercent: 8,
  profitMarkupPercent: 12,
  vatPercent: 25
};

export function parseNumber(value, fallback = 0) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  const normalized = String(value ?? "").trim().replace(",", ".");
  if (!normalized) {
    return fallback;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function normalizeClearingInput(input = {}) {
  const merged = { ...CLEARING_DEFAULTS, ...input };
  return {
    areaHa: Math.max(0, parseNumber(merged.areaHa)),
    stemsBeforePerHa: Math.max(0, parseNumber(merged.stemsBeforePerHa)),
    stemsAfterPerHa: Math.max(0, parseNumber(merged.stemsAfterPerHa)),
    meanHeightM: Math.max(0, parseNumber(merged.meanHeightM)),
    dgvCm: Math.max(0, parseNumber(merged.dgvCm)),
    treeSpecies: TREE_SPECIES_FACTORS[merged.treeSpecies] ? merged.treeSpecies : CLEARING_DEFAULTS.treeSpecies,
    deciduousSharePercent: clamp(parseNumber(merged.deciduousSharePercent), 0, 100),
    clearingType: CLEARING_TYPE_FACTORS[merged.clearingType] ? merged.clearingType : CLEARING_DEFAULTS.clearingType,
    terrain: factorKey("terrain", merged.terrain),
    vegetation: factorKey("vegetation", merged.vegetation),
    stoniness: factorKey("stoniness", merged.stoniness),
    slope: factorKey("slope", merged.slope),
    ground: factorKey("ground", merged.ground),
    access: factorKey("access", merged.access),
    hourlyRate: Math.max(0, parseNumber(merged.hourlyRate)),
    equipmentRate: Math.max(0, parseNumber(merged.equipmentRate)),
    travelCost: Math.max(0, parseNumber(merged.travelCost)),
    adminMarkupPercent: Math.max(0, parseNumber(merged.adminMarkupPercent)),
    profitMarkupPercent: Math.max(0, parseNumber(merged.profitMarkupPercent)),
    vatPercent: Math.max(0, parseNumber(merged.vatPercent))
  };
}

export function calculateClearingEstimate(input = {}) {
  const normalized = normalizeClearingInput(input);
  const errors = [];
  const notes = [];

  if (normalized.areaHa <= 0) {
    errors.push("Ange areal större än 0 ha.");
  }

  if (normalized.meanHeightM <= 0) {
    notes.push("Medelhöjd saknas. Kalkylen använder neutral höjdfaktor och bör ses som preliminär.");
  }

  if (normalized.stemsBeforePerHa <= 0) {
    notes.push("Stamantal före röjning saknas. Täthetsbedömningen blir svagare.");
  }

  if (normalized.stemsAfterPerHa > normalized.stemsBeforePerHa && normalized.stemsBeforePerHa > 0) {
    notes.push("Stamantal efter röjning är högre än före. Kontrollera underlaget.");
  }

  const factors = buildClearingFactors(normalized);
  const difficultyIndex = factors.reduce((product, factor) => product * factor.factor, 1);
  const productivityHaPerDay = BASE_PRODUCTIVITY_HA_PER_DAY / difficultyIndex;
  const hoursPerHa = HOURS_PER_DAY / productivityHaPerDay;
  const totalHours = hoursPerHa * normalized.areaHa;
  const labourCost = totalHours * normalized.hourlyRate;
  const equipmentCost = totalHours * normalized.equipmentRate;
  const directCost = labourCost + equipmentCost + normalized.travelCost;
  const adminMarkup = directCost * (normalized.adminMarkupPercent / 100);
  const profitBase = directCost + adminMarkup;
  const profitMarkup = profitBase * (normalized.profitMarkupPercent / 100);
  const subtotalExVat = profitBase + profitMarkup;
  const vat = subtotalExVat * (normalized.vatPercent / 100);
  const totalIncVat = subtotalExVat + vat;

  return {
    ...normalized,
    valid: errors.length === 0,
    errors,
    difficultyIndex,
    difficultyLabel: getDifficultyLabel(difficultyIndex),
    productivityHaPerDay,
    hoursPerHa,
    totalHours,
    labourCost,
    equipmentCost,
    travelCost: normalized.travelCost,
    adminMarkup,
    profitMarkup,
    subtotalExVat,
    vat,
    totalIncVat,
    pricePerHaExVat: normalized.areaHa > 0 ? subtotalExVat / normalized.areaHa : 0,
    notes,
    factors
  };
}

export function buildClearingOfferText(estimate) {
  if (!estimate?.valid) {
    return "";
  }

  return [
    "Röjningsarbete på fastigheten enligt angivet underlag.",
    `Areal: ${formatSvNumber(estimate.areaHa, 1)} ha.`,
    `Bedömd svårighetsgrad: ${estimate.difficultyLabel}.`,
    `Beräknad tidsåtgång: ${formatSvNumber(estimate.totalHours, 1)} timmar.`,
    `Pris exkl. moms: ${formatSvCurrency(estimate.subtotalExVat)}.`,
    `Pris inkl. moms: ${formatSvCurrency(estimate.totalIncVat)}.`
  ].join("\n");
}

export function calculateClearingPrice({ areaHa, density, difficulty, baseRate = 3600, travelCost = 0 }) {
  const vegetation = density === "high" ? "dense" : density === "low" ? "low" : "normal";
  const terrain = difficulty === "hard" ? "hard" : difficulty === "easy" ? "easy" : "normal";
  const hourlyRate = baseRate / 8;
  const estimate = calculateClearingEstimate({
    areaHa,
    vegetation,
    terrain,
    hourlyRate,
    equipmentRate: 0,
    travelCost,
    adminMarkupPercent: 0,
    profitMarkupPercent: 0,
    vatPercent: 0
  });

  return {
    subtotal: estimate.labourCost,
    travelCost: estimate.travelCost,
    total: estimate.subtotalExVat,
    densityFactor: factorFor("vegetation", vegetation).factor,
    difficultyFactor: factorFor("terrain", terrain).factor
  };
}

export function normalizeForestPlanInput(input = {}) {
  const merged = { ...FOREST_PLAN_DEFAULTS, ...input };
  return {
    propertyName: String(merged.propertyName ?? "").trim(),
    customerName: String(merged.customerName ?? "").trim(),
    municipality: String(merged.municipality ?? "").trim(),
    areaHa: Math.max(0, parseNumber(merged.areaHa)),
    parcelCount: Math.max(0, Math.round(parseNumber(merged.parcelCount))),
    standCount: Math.max(0, Math.round(parseNumber(merged.standCount))),
    planType: PLAN_TYPE_FACTORS[merged.planType] ? merged.planType : FOREST_PLAN_DEFAULTS.planType,
    baseFee: Math.max(0, parseNumber(merged.baseFee)),
    hectareRate: Math.max(0, parseNumber(merged.hectareRate)),
    standRate: Math.max(0, parseNumber(merged.standRate)),
    parcelRate: Math.max(0, parseNumber(merged.parcelRate)),
    mapCost: Math.max(0, parseNumber(merged.mapCost)),
    adminFixedCost: Math.max(0, parseNumber(merged.adminFixedCost)),
    fieldDays: Math.max(0, parseNumber(merged.fieldDays, FOREST_PLAN_DEFAULTS.fieldDays)),
    fieldDayRate: Math.max(0, parseNumber(merged.fieldDayRate)),
    fieldDifficulty: PLAN_FIELD_DIFFICULTY_FACTORS[merged.fieldDifficulty] ? merged.fieldDifficulty : FOREST_PLAN_DEFAULTS.fieldDifficulty,
    accessibility: PLAN_ACCESS_FACTORS[merged.accessibility] ? merged.accessibility : FOREST_PLAN_DEFAULTS.accessibility,
    terrain: PLAN_TERRAIN_FACTORS[merged.terrain] ? merged.terrain : FOREST_PLAN_DEFAULTS.terrain,
    fieldNote: String(merged.fieldNote ?? "").trim(),
    officeHours: Math.max(0, parseNumber(merged.officeHours, FOREST_PLAN_DEFAULTS.officeHours)),
    officeHourlyRate: Math.max(0, parseNumber(merged.officeHourlyRate)),
    qualityCost: Math.max(0, parseNumber(merged.qualityCost)),
    meetingCost: Math.max(0, parseNumber(merged.meetingCost)),
    travelKmRoundtrip: Math.max(0, parseNumber(merged.travelKmRoundtrip)),
    kmRate: Math.max(0, parseNumber(merged.kmRate)),
    tripCount: Math.max(0, Math.round(parseNumber(merged.tripCount))),
    establishmentCost: Math.max(0, parseNumber(merged.establishmentCost)),
    adminMarkupPercent: Math.max(0, parseNumber(merged.adminMarkupPercent)),
    profitMarkupPercent: Math.max(0, parseNumber(merged.profitMarkupPercent)),
    vatPercent: Math.max(0, parseNumber(merged.vatPercent))
  };
}

export function calculateForestPlanEstimate(input = {}) {
  const normalized = normalizeForestPlanInput(input);
  const errors = [];
  const notes = [];

  if (normalized.areaHa <= 0) {
    errors.push("Ange areal större än 0 ha.");
  }

  if (normalized.standCount <= 0) {
    notes.push("Antal bestånd saknas. Beståndstillägget blir 0 kr och kalkylen bör ses som preliminär.");
  }

  if (normalized.fieldDays <= 0) {
    normalized.fieldDays = FOREST_PLAN_DEFAULTS.fieldDays;
    notes.push("Fältdagar saknades. Standardvärde används.");
  }

  if (normalized.officeHours <= 0) {
    normalized.officeHours = FOREST_PLAN_DEFAULTS.officeHours;
    notes.push("Kontorstimmar saknades. Standardvärde används.");
  }

  const planType = PLAN_TYPE_FACTORS[normalized.planType];
  const fieldDifficulty = PLAN_FIELD_DIFFICULTY_FACTORS[normalized.fieldDifficulty];
  const accessibility = PLAN_ACCESS_FACTORS[normalized.accessibility];
  const terrain = PLAN_TERRAIN_FACTORS[normalized.terrain];
  const factors = [
    namedFactor("Plantyp", planType.factor, planType.label),
    namedFactor("Fältsvårighet", fieldDifficulty.factor, fieldDifficulty.label),
    namedFactor("Tillgänglighet", accessibility.factor, accessibility.label),
    namedFactor("Terräng", terrain.factor, terrain.label)
  ];
  const complexityIndex = factors.reduce((product, factor) => product * factor.factor, 1);
  const planScopeFactor = planType.factor;
  const fieldFactor = fieldDifficulty.factor * accessibility.factor * terrain.factor;

  const baseFee = normalized.baseFee * planScopeFactor;
  const areaPrice = normalized.areaHa * normalized.hectareRate * planScopeFactor;
  const standPrice = normalized.standCount * normalized.standRate * planScopeFactor;
  const parcelPrice = normalized.parcelCount * normalized.parcelRate;
  const mapCost = normalized.mapCost;
  const adminFixedCost = normalized.adminFixedCost;
  const fieldWorkCost = normalized.fieldDays * normalized.fieldDayRate * fieldFactor;
  const officeWorkCost = normalized.officeHours * normalized.officeHourlyRate * planScopeFactor;
  const qualityCost = normalized.qualityCost * planScopeFactor;
  const meetingCost = normalized.meetingCost;
  const travelCost = normalized.travelKmRoundtrip * normalized.kmRate * normalized.tripCount;
  const establishmentCost = normalized.establishmentCost;
  const directCost =
    baseFee +
    areaPrice +
    standPrice +
    parcelPrice +
    mapCost +
    adminFixedCost +
    fieldWorkCost +
    officeWorkCost +
    qualityCost +
    meetingCost +
    travelCost +
    establishmentCost;
  const adminMarkup = directCost * (normalized.adminMarkupPercent / 100);
  const profitBase = directCost + adminMarkup;
  const profitMarkup = profitBase * (normalized.profitMarkupPercent / 100);
  const subtotalExVat = profitBase + profitMarkup;
  const vat = subtotalExVat * (normalized.vatPercent / 100);
  const totalIncVat = subtotalExVat + vat;

  const estimate = {
    ...normalized,
    valid: errors.length === 0,
    errors,
    notes,
    propertyName: normalized.propertyName,
    customerName: normalized.customerName,
    municipality: normalized.municipality,
    areaHa: normalized.areaHa,
    planType: normalized.planType,
    planTypeLabel: planType.label,
    complexityIndex,
    complexityLabel: getComplexityLabel(complexityIndex),
    baseFee,
    areaPrice,
    standPrice,
    parcelPrice,
    mapCost,
    adminFixedCost,
    fieldWorkCost,
    officeWorkCost,
    qualityCost,
    meetingCost,
    travelCost,
    establishmentCost,
    directCost,
    adminMarkup,
    profitMarkup,
    subtotalExVat,
    vat,
    totalIncVat,
    pricePerHaExVat: normalized.areaHa > 0 ? subtotalExVat / normalized.areaHa : 0,
    factors,
    offerText: ""
  };
  estimate.offerText = buildForestPlanOfferText(estimate);
  return estimate;
}

export function buildForestPlanOfferText(estimate) {
  if (!estimate?.valid) {
    return "";
  }

  const propertyLine = estimate.propertyName ? `Fastighet: ${estimate.propertyName}.` : "Fastighet: enligt kundens underlag.";
  return [
    "Prisunderlag för skogsbruksplan.",
    propertyLine,
    `Areal: ${formatSvNumber(estimate.areaHa, 1)} ha.`,
    `Plantyp: ${estimate.planTypeLabel}.`,
    `Bedömd komplexitet: ${estimate.complexityLabel}.`,
    `Beräknat fältarbete: ${formatSvNumber(estimate.fieldDays, 1)} dagar.`,
    `Beräknat kontorsarbete: ${formatSvNumber(estimate.officeHours, 1)} timmar.`,
    `Pris exkl. moms: ${formatSvCurrency(estimate.subtotalExVat)}.`,
    `Pris inkl. moms: ${formatSvCurrency(estimate.totalIncVat)}.`
  ].join("\n");
}

export function calculateForestPlanPrice({ areaHa, baseFee = 4500, hectareRate = 145, fieldDays = 1, dayRate = 6800 }) {
  const areaPrice = areaHa * hectareRate;
  const fieldPrice = fieldDays * dayRate;
  return {
    baseFee,
    areaPrice,
    fieldPrice,
    total: baseFee + areaPrice + fieldPrice
  };
}

export function calculateQuoteTotal(items = [], vatRate = 25) {
  const subtotal = items.reduce((sum, item) => {
    const quantity = Number.parseFloat(item.quantity) || 0;
    const unitPrice = Number.parseFloat(item.unitPrice) || 0;
    return sum + quantity * unitPrice;
  }, 0);
  const vat = subtotal * (vatRate / 100);
  return {
    subtotal,
    vat,
    total: subtotal + vat
  };
}

function factorKey(group, value) {
  return SELECT_FACTORS[group][value] ? value : Object.keys(SELECT_FACTORS[group])[0];
}

function factorFor(group, key) {
  return SELECT_FACTORS[group][key];
}

function buildClearingFactors(input) {
  const densityFactor = calculateStemDensityFactor(input.stemsBeforePerHa, input.stemsAfterPerHa);
  const heightFactor = input.meanHeightM > 0 ? calculateHeightFactor(input.meanHeightM) : 1;
  const dgvFactor = input.dgvCm > 0 ? calculateDgvFactor(input.dgvCm) : 1;
  const deciduousFactor = calculateDeciduousFactor(input.deciduousSharePercent);

  return [
    namedFactor("Stamantal", densityFactor, stemDensityNote(input.stemsBeforePerHa, input.stemsAfterPerHa)),
    namedFactor("Medelhöjd", heightFactor, input.meanHeightM > 0 ? `${formatSvNumber(input.meanHeightM, 1)} m` : "Saknas"),
    namedFactor("DGV", dgvFactor, input.dgvCm > 0 ? `${formatSvNumber(input.dgvCm, 1)} cm` : "Saknas"),
    namedFactor("Huvudträdslag", TREE_SPECIES_FACTORS[input.treeSpecies].factor, TREE_SPECIES_FACTORS[input.treeSpecies].label),
    namedFactor("Lövandel", deciduousFactor, `${formatSvNumber(input.deciduousSharePercent, 0)} %`),
    namedFactor("Röjningstyp", CLEARING_TYPE_FACTORS[input.clearingType].factor, CLEARING_TYPE_FACTORS[input.clearingType].label),
    ...Object.entries(SELECT_FACTORS).map(([group, options]) =>
      namedFactor(labelForGroup(group), options[input[group]].factor, options[input[group]].label)
    )
  ];
}

function calculateStemDensityFactor(stemsBefore, stemsAfter) {
  if (stemsBefore <= 0) {
    return 1;
  }

  const removed = Math.max(0, stemsBefore - stemsAfter);
  const removalShare = stemsBefore > 0 ? removed / stemsBefore : 0;
  const densityPressure = stemsBefore > 6500 ? 1.28 : stemsBefore > 4500 ? 1.16 : stemsBefore > 2500 ? 1.05 : 0.94;
  const removalPressure = removalShare > 0.7 ? 1.15 : removalShare > 0.5 ? 1.08 : removalShare < 0.25 ? 0.95 : 1;
  return densityPressure * removalPressure;
}

function calculateHeightFactor(height) {
  if (height < 1.5) return 0.9;
  if (height < 2.5) return 1;
  if (height < 4) return 1.12;
  if (height < 6) return 1.24;
  return 1.35;
}

function calculateDgvFactor(dgv) {
  if (dgv < 3) return 0.96;
  if (dgv < 6) return 1;
  if (dgv < 9) return 1.08;
  return 1.16;
}

function calculateDeciduousFactor(share) {
  if (share < 20) return 1;
  if (share < 50) return 1.08;
  if (share < 75) return 1.16;
  return 1.24;
}

function stemDensityNote(stemsBefore, stemsAfter) {
  if (stemsBefore <= 0) {
    return "Saknas";
  }
  if (stemsAfter > 0) {
    return `${formatSvNumber(stemsBefore, 0)} till ${formatSvNumber(stemsAfter, 0)} st/ha`;
  }
  return `${formatSvNumber(stemsBefore, 0)} st/ha`;
}

function namedFactor(name, factor, note) {
  return {
    name,
    factor,
    note,
    changePercent: (factor - 1) * 100
  };
}

function labelForGroup(group) {
  return {
    terrain: "Terräng",
    vegetation: "Vegetation",
    stoniness: "Blockighet",
    slope: "Lutning",
    ground: "Bärighet/mark",
    access: "Framkomlighet"
  }[group];
}

function getDifficultyLabel(index) {
  if (index < 1.05) return "Lätt";
  if (index < 1.45) return "Normal";
  if (index < 2.05) return "Svår";
  return "Mycket svår";
}

function getComplexityLabel(index) {
  if (index < 0.95) return "Lätt";
  if (index < 1.2) return "Normal";
  if (index < 1.55) return "Omfattande";
  return "Avancerad";
}

function formatSvNumber(value, digits) {
  return new Intl.NumberFormat("sv-SE", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(Number.isFinite(value) ? value : 0);
}

function formatSvCurrency(value) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);
}
