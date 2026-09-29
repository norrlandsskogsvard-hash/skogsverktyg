import { VOLUME_BASAL_AREAS, VOLUME_BASAL_CURVES, VOLUME_STEMS, VOLUME_STEM_CURVES } from "./fieldReferenceData.js";

export function fieldNumber(value) {
  const text = String(value ?? "").trim().replace(",", ".");
  return /^\d+(\.\d+)?$/.test(text) && Number.isFinite(Number(text)) ? Number(text) : null;
}

// Interpolation is confined to adjacent, available readings. Never extrapolate.
export function interpolateReadings(xs, ys, x) {
  for (let i = 0; i < ys.length; i++) {
    if (x === xs[i] && Number.isFinite(ys[i])) return ys[i];
    if (i && x > xs[i - 1] && x < xs[i] && Number.isFinite(ys[i - 1]) && Number.isFinite(ys[i])) {
      return ys[i - 1] + (ys[i] - ys[i - 1]) * (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
    }
  }
  return null;
}

export function calculateYoungVolume({ method, height, basalArea, stems, species, area }) {
  const h = fieldNumber(height);
  const ha = String(area ?? "").trim() === "" ? null : fieldNumber(area);
  if (String(area ?? "").trim() !== "" && (ha === null || ha <= 0)) return { error: "Areal måste vara ett positivt tal, eller lämnas tom." };
  let volume;
  let lower;
  let upper;
  if (method === "basal") {
    const g = fieldNumber(basalArea);
    if (h === null || h < 3 || h > 15 || g === null || g < 5 || g > 30) return { error: "Grundytebilden täcker höjd 3–15 m och grundyta 5–30 m²/ha." };
    volume = interpolateReadings(VOLUME_BASAL_CURVES.map(c => c[0]), VOLUME_BASAL_CURVES.map(c => interpolateReadings(VOLUME_BASAL_AREAS, c[1], g)), h);
    lower = volume;
    upper = volume;
  } else if (method === "stems") {
    const n = fieldNumber(stems);
    if (h === null || h < 3 || h > 9 || n === null || n < 500 || n > 10000) return { error: "Stamantalsbilden täcker höjd 3–9 m och 500–10 000 stammar/ha." };
    if (!["conifer", "broadleaf", "mixed"].includes(species)) return { error: "Välj barr, löv eller blandat." };
    const heights = VOLUME_STEM_CURVES.map(c => c[0]);
    lower = interpolateReadings(heights, VOLUME_STEM_CURVES.map(c => interpolateReadings(VOLUME_STEMS, c[1], n)), h);
    upper = interpolateReadings(heights, VOLUME_STEM_CURVES.map(c => interpolateReadings(VOLUME_STEMS, c[2], n)), h);
    volume = species === "conifer" ? upper : species === "broadleaf" ? lower : null;
  } else return { error: "Välj beräkningsmetod." };
  if (ha !== null && !Number.isFinite(upper * ha)) return { error: "Arealen är för stor för en giltig totalvolym." };
  return { volume, lower, upper, area: ha, total: volume !== null && ha !== null ? volume * ha : null };
}

export function calculatePlotStems(count, radius) {
  const n = fieldNumber(count);
  const r = fieldNumber(radius);
  if (n === null || !Number.isInteger(n) || r === null || r <= 0) return null;
  const result = n * 10000 / (Math.PI * r * r);
  return Number.isFinite(result) ? result : null;
}
