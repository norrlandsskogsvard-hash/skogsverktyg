import { fieldNumber } from "./fieldCalculator.js";

export const CIRCLE_PLOT_SOURCE = "https://www.skogskunskap.se/rakna-med-verktyg/mata-skogen/cirkelprovyta/";
// Named field areas use nominal areas; the displayed rope lengths are rounded.
export const PLOT_PRESETS = [
  { id: "10", radius: 1.78, area: 10 }, { id: "20", radius: 2.52, area: 20 },
  { id: "25", radius: 2.82, area: 25 }, { id: "50", radius: 3.99, area: 50 },
  { id: "100", radius: 5.64, area: 100 }
];

export function calculateCirclePlot({ count, size = "100", radius }) {
  const n = fieldNumber(count);
  if (n === null || !Number.isSafeInteger(n)) return { error: "Ange antal stammar som ett heltal, minst 0." };
  const preset = PLOT_PRESETS.find(p => p.id === size);
  const r = size === "custom" ? fieldNumber(radius) : preset?.radius;
  const area = size === "custom" && r !== null ? Math.PI * r * r : preset?.area;
  if (!r || !Number.isFinite(area) || area <= 0) return { error: "Välj provyta eller ange en positiv radie i meter." };
  const factor = 10000 / area;
  const stemsPerHa = n * factor;
  if (!Number.isFinite(factor) || !Number.isFinite(stemsPerHa)) return { error: "Radien eller antalet är för stort eller litet för beräkningen." };
  return { count: n, radius: r, area, size, factor, stemsPerHa, nominalArea: size !== "custom" };
}

export function summarizeCirclePlots(plots) {
  if (!Array.isArray(plots) || !plots.length) return { error: "Inga sparade provytor." };
  // Recalculate stored observations; derived/imported totals are never trusted.
  const results = plots.map(calculateCirclePlot);
  if (results.some(p => p.error)) return { error: "En provyta saknar giltigt antal eller radie." };
  const count = results.reduce((sum, p) => sum + p.count, 0);
  const area = results.reduce((sum, p) => sum + p.area, 0);
  const stemsPerHa = count * 10000 / area;
  if (!Number.isSafeInteger(count) || !Number.isFinite(area) || !Number.isFinite(stemsPerHa)) return { error: "Provytesumman är för stor för beräkningen." };
  return { count, area, plotCount: results.length, stemsPerHa, plots: results };
}
