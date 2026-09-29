import { fieldNumber } from "./fieldCalculator.js";

export const SI_SOURCE = {
  version: "slu-fakta-skog-2013-14.1",
  title: "Johansson m.fl., Fakta Skog 14/2013, faktaruta 3",
  url: "https://pub.epsilon.slu.se/37808/1/johansson-u-et-al-20250717.pdf",
  toolUrl: "https://www.skogskunskap.se/rakna-med-verktyg/mata-skogen/standortsindex/",
  ageUrl: "https://www.skogskunskap.se/aga-skog/matt-och-matning/redskap-for-matning-av-skogen/",
  accessed: "2026-09-29"
};

export const SLU_SI_MODELS = {
  tall: { code: "T", label: "Tall", asi: 25, beta: 7395.6, b2: -1.7829, ageOffset: 0 },
  gran: { code: "G", label: "Gran", asi: 10, beta: 1495.3, b2: -1.5978, ageOffset: 3 }
};

// Fact box 3, including the spruce footnote: subtract three from BOTH ages.
// Range checks on field observations are applied by calculateFieldSI below;
// the reference age 100 is prescribed by the source, not an observation.
export function sluHeightAtAge(species, height, totalAge, referenceAge = 100) {
  const model = SLU_SI_MODELS[species];
  if (!model || ![height, totalAge, referenceAge].every(Number.isFinite) || height <= 0) return null;
  const a1 = totalAge - model.ageOffset;
  const a2 = referenceAge - model.ageOffset;
  if (a1 <= 0 || a2 <= 0) return null;
  const d = model.beta * model.asi ** model.b2;
  const r = Math.sqrt((height - d) ** 2 + 4 * model.beta * height * a1 ** model.b2);
  const value = (height + d + r) / (2 + 4 * model.beta * a2 ** model.b2 / (height - d + r));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function calculateFieldSI({ species, ageType = "breast", ageAdditionMode = "range", yearsToBH, trees = [] }) {
  const model = SLU_SI_MODELS[species];
  if (!model) return { error: "Detta verktyg har SLU-funktioner för tall och gran. Lövträd beräknas inte med barrfunktioner." };
  if (ageType !== "breast") return { error: "Inmatningen ska vara BH-ålder. Totalålder beräknas separat." };
  if (!Array.isArray(trees) || trees.length < 1 || trees.length > 4) return { error: "Ange 1 till 4 provträd." };
  if (!["range", "own"].includes(ageAdditionMode)) return { error: "Välj underlag för år till BH." };
  const own = fieldNumber(yearsToBH);
  if (ageAdditionMode === "own" && (own === null || own <= 0 || !Number.isSafeInteger(own))) return { error: "Ange ett positivt heltal för eget tillägg till BH-åldern." };
  // Skogskunskap describes 7-13 years as a normal addition, not a confidence interval.
  const addition = ageAdditionMode === "own" ? [own, own] : [7, 13];
  const results = [];
  for (const [index, tree] of trees.entries()) {
    const height = fieldNumber(tree?.height);
    const age = fieldNumber(tree?.age);
    if (height === null || height <= 0 || age === null || !Number.isSafeInteger(age) || age < 1 || !Number.isSafeInteger(age + addition[1])) {
      return { error: `Träd ${index + 1}: ange positiv höjd och BH-ålder i hela år.` };
    }
    const totalAgeLow = age + addition[0];
    const totalAgeHigh = age + addition[1];
    // Table 1: 10-80 years for pine and spruce. Fact box 1: established forest >5 m.
    const inRange = totalAgeLow >= 10 && totalAgeHigh <= 80 && height > 5;
    const a = inRange ? sluHeightAtAge(species, height, totalAgeLow) : null;
    const b = inRange ? sluHeightAtAge(species, height, totalAgeHigh) : null;
    results.push({ height, age, totalAgeLow, totalAgeHigh,
      siLow: a === null || b === null ? null : Math.min(a, b),
      siHigh: a === null || b === null ? null : Math.max(a, b) });
  }
  const hasSI = results.every(t => t.siLow !== null);
  const mean = key => results.reduce((sum, tree) => sum + tree[key], 0) / results.length;
  return {
    code: model.code, species, method: SI_SOURCE.version, ageAdditionMode, addition, trees: results, hasSI,
    siLow: hasSI ? mean("siLow") : null, siHigh: hasSI ? mean("siHigh") : null,
    totalAgeLow: mean("totalAgeLow"), totalAgeHigh: mean("totalAgeHigh"),
    limitation: hasSI ? null : "SI visas bara när samtliga träds totalåldrar ligger inom 10–80 år och höjderna är över 5 m. Totalåldern visas ändå."
  };
}
