export function parsePositiveDiameter(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  const normalized = String(value ?? "").trim().replace(",", ".");
  if (!normalized) {
    return null;
  }

  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function normalizeDiameters(values = []) {
  return values
    .map((value) => {
      if (value && typeof value === "object" && "diameter" in value) {
        return parsePositiveDiameter(value.diameter);
      }
      return parsePositiveDiameter(value);
    })
    .filter((value) => value !== null);
}

export function calculateMedian(values = []) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) {
    return sorted[middle];
  }
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

export function calculateStandardDeviation(values = []) {
  if (!values.length) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function calculateDgv(values = []) {
  const diameters = normalizeDiameters(values);

  if (!diameters.length) {
    return {
      count: 0,
      values: [],
      dgv: 0,
      arithmeticMean: 0,
      median: 0,
      min: 0,
      max: 0,
      standardDeviation: 0,
      hasValues: false,
      error: "Lägg till minst en giltig diameter större än 0 cm."
    };
  }

  const sumD2 = diameters.reduce((sum, diameter) => sum + diameter ** 2, 0);
  const sumD3 = diameters.reduce((sum, diameter) => sum + diameter ** 3, 0);
  const arithmeticMean = diameters.reduce((sum, diameter) => sum + diameter, 0) / diameters.length;

  return {
    count: diameters.length,
    values: diameters,
    dgv: sumD3 / sumD2,
    arithmeticMean,
    median: calculateMedian(diameters),
    min: Math.min(...diameters),
    max: Math.max(...diameters),
    standardDeviation: calculateStandardDeviation(diameters),
    hasValues: true,
    error: ""
  };
}
