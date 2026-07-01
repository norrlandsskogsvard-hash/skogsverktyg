export function parsePositiveHeight(value) {
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

export function normalizeHeights(values = []) {
  return values
    .map((value) => {
      if (value && typeof value === "object" && "height" in value) {
        return parsePositiveHeight(value.height);
      }
      return parsePositiveHeight(value);
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

export function calculateMeanHeight(values = []) {
  const heights = normalizeHeights(values);

  if (!heights.length) {
    return {
      count: 0,
      values: [],
      meanHeight: 0,
      median: 0,
      min: 0,
      max: 0,
      standardDeviation: 0,
      hasValues: false,
      error: "Lägg till minst en giltig höjd större än 0 m."
    };
  }

  const meanHeight = heights.reduce((sum, height) => sum + height, 0) / heights.length;

  return {
    count: heights.length,
    values: heights,
    meanHeight,
    median: calculateMedian(heights),
    min: Math.min(...heights),
    max: Math.max(...heights),
    standardDeviation: calculateStandardDeviation(heights),
    hasValues: true,
    error: ""
  };
}
