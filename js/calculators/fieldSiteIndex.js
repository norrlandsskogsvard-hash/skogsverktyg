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

export const AGE_ADDITION_SOURCE = {
  version: "bd-bh-tabell.1",
  title: "Skogsstyrelsen: Fälthäfte i bonitering, BD, sidorna 4–5",
  url: "https://shop.skogsstyrelsen.se/shop/9098/art15/37524915-57cb4c-bonitering_BD.pdf",
  checked: "2026-10-07",
  crossCheck: "Gallringsriktlinjer & gallringsmallar norra Sverige, Norra 2007, sidorna 9 och 18"
};

// Visually checked table rows. These are age assumptions, not new SI curves.
export const SI_AGE_ADDITIONS = {
  tall: [[14, 14], [16, 12], [18, 10], [20, 9], [22, 9], [24, 8], [26, 8], [28, 8]],
  gran: [[16, 13], [18, 12], [20, 11], [22, 10], [24, 10], [26, 9], [28, 9], [30, 8], [32, 8]]
};

export function yearsToBHForSI(species, si) {
  const rows = SI_AGE_ADDITIONS[species];
  if (!rows || !Number.isFinite(si) || si < rows[0][0] || si > rows.at(-1)[0]) return null;
  for (let i = 1; i < rows.length; i++) {
    const [a, yearsA] = rows[i - 1], [b, yearsB] = rows[i];
    if (si <= b) return yearsA + (yearsB - yearsA) * (si - a) / (b - a);
  }
  return null;
}

export function solveSIWithAgeAddition(species, height, age) {
  const rows = SI_AGE_ADDITIONS[species];
  if (!rows || !Number.isFinite(height) || height <= 5 || !Number.isSafeInteger(age) || age < 1) return null;
  const residual = si => sluHeightAtAge(species, height, age + yearsToBHForSI(species, si)) - si;
  const roots = [];
  const add = root => { if (!roots.some(value => Math.abs(value - root) < 1e-7)) roots.push(root); };
  // Solve SI and its age addition together, without rounding either during iteration.
  for (let i = 1; i < rows.length; i++) {
    let low = rows[i - 1][0], high = rows[i][0];
    let a = residual(low), b = residual(high);
    if (![a, b].every(Number.isFinite)) return null;
    if (Math.abs(a) < 1e-9) add(low);
    if (Math.abs(b) < 1e-9) add(high);
    if (a * b >= 0) continue;
    for (let step = 0; step < 60; step++) {
      const mid = (low + high) / 2, r = residual(mid);
      if (a * r <= 0) high = mid;
      else { low = mid; a = r; }
    }
    add((low + high) / 2);
  }
  if (roots.length !== 1) return null;
  const si = roots[0], addition = yearsToBHForSI(species, si);
  return { si, addition, totalAge: age + addition };
}

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

export function calculateFieldSI({ species, ageType = "breast", ageAdditionMode = "range", yearsToBH, region = "north", trees = [], suitability = "suitable", allowExtrapolation = false }) {
  const model = SLU_SI_MODELS[species];
  if (!model) return { error: "Detta verktyg har SLU-funktioner för tall och gran. Lövträd beräknas inte med barrfunktioner." };
  if (!["suitable", "uncertain", "unsuitable"].includes(suitability)) return { error: "Välj provträdens lämplighet." };
  if (ageType !== "breast") return { error: "Inmatningen ska vara BH-ålder. Totalålder beräknas separat." };
  if (!Array.isArray(trees) || trees.length < 1 || trees.length > 4) return { error: "Ange 1 till 4 provträd." };
  if (!["range", "own", "regional", "measured"].includes(ageAdditionMode)) return { error: "Välj underlag för år till BH." };
  if (ageAdditionMode === "regional" && species === "gran" && region !== "north") return { error: "Granens ålderstabell gäller norra Sverige (Norrland och Kopparbergs län). Välj känd totalålder, eget tillägg eller schablon för annat område." };
  const own = fieldNumber(yearsToBH);
  if (ageAdditionMode === "own" && (own === null || own <= 0 || !Number.isSafeInteger(own))) return { error: "Ange ett positivt heltal för eget tillägg till BH-åldern." };
  // Skogskunskap describes 7-13 years as a normal addition, not a confidence interval.
  let addition = ageAdditionMode === "own" ? [own, own] : [7, 13];
  const results = [];
  for (const [index, tree] of trees.entries()) {
    const height = fieldNumber(tree?.height);
    const age = fieldNumber(tree?.age);
    if (height === null || height <= 0 || age === null || !Number.isSafeInteger(age) || age < 1 || !Number.isSafeInteger(age + addition[1])) {
      return { error: `Träd ${index + 1}: ange positiv höjd och BH-ålder i hela år.` };
    }
    let treeAddition = addition;
    if (ageAdditionMode === "measured") {
      const total = fieldNumber(tree?.totalAge);
      if (!Number.isSafeInteger(total) || total <= age) return { error: `Träd ${index + 1}: känd totalålder ska vara ett heltal större än BH-åldern.` };
      treeAddition = [total - age, total - age];
    }
    if (ageAdditionMode === "regional") {
      const solved = solveSIWithAgeAddition(species, height, age);
      if (!solved) return { error: `Träd ${index + 1}: ingen entydig matchning inom ålderstabellens ${model.code}${SI_AGE_ADDITIONS[species][0][0]}–${model.code}${SI_AGE_ADDITIONS[species].at(-1)[0]}. Ange känd totalålder eller välj annat åldersunderlag. Höjd högst 5 m kräver annan boniteringsmetod.` };
      treeAddition = [solved.addition, solved.addition];
    }
    const totalAgeLow = age + treeAddition[0];
    const totalAgeHigh = age + treeAddition[1];
    // Table 1: 10-80 years for pine and spruce. Fact box 1: established forest >5 m.
    const inRange = totalAgeLow >= 10 && totalAgeHigh <= 80 && height > 5;
    const a = inRange && suitability === "suitable" ? sluHeightAtAge(species, height, totalAgeLow) : null;
    const b = inRange && suitability === "suitable" ? sluHeightAtAge(species, height, totalAgeHigh) : null;
    const proposalA = height > 5 ? sluHeightAtAge(species, height, totalAgeLow) : null;
    const proposalB = height > 5 ? sluHeightAtAge(species, height, totalAgeHigh) : null;
    results.push({ height, age, totalAgeLow, totalAgeHigh, additionLow: treeAddition[0], additionHigh: treeAddition[1],
      inRange,
      proposalLow: proposalA === null || proposalB === null ? null : Math.min(proposalA, proposalB),
      proposalHigh: proposalA === null || proposalB === null ? null : Math.max(proposalA, proposalB),
      siLow: a === null || b === null ? null : Math.min(a, b),
      siHigh: a === null || b === null ? null : Math.max(a, b) });
  }
  const hasSI = suitability === "suitable" && results.every(t => t.siLow !== null);
  if (["regional", "measured"].includes(ageAdditionMode)) addition = [Math.min(...results.map(t => t.additionLow)), Math.max(...results.map(t => t.additionHigh))];
  const mean = key => results.reduce((sum, tree) => sum + tree[key], 0) / results.length;
  const suggestionAllowed = !hasSI && allowExtrapolation === true && suitability !== "unsuitable" && results.every(t => t.proposalLow !== null);
  const suggestion = suggestionAllowed ? { siLow: mean("proposalLow"), siHigh: mean("proposalHigh"), confidence: "Låg", extrapolated: results.some(t => !t.inRange) } : null;
  const guidance = results.some(t => t.height <= 5)
    ? "Ung eller ej etablerad skog: använd interceptmetod eller ståndortsegenskaper. Höjdutvecklingsfunktionen ger inget SI-förslag här."
    : suitability === "unsuitable"
      ? "Skadade, undertryckta eller olikåldriga provträd är olämpliga för denna bonitering. Välj andra övrehöjdsträd eller använd ståndortsegenskaper."
      : "Kontrollera provträd, övre höjd, ålder och ståndort. Ett modellförslag utanför åldersområdet är extrapolation och bör inte användas ensamt i plan eller åtgärdsbeslut.";
  return {
    code: model.code, species, method: SI_SOURCE.version, ageAdditionMode, region, addition, trees: results, hasSI,
    ageSource: ageAdditionMode === "regional" ? AGE_ADDITION_SOURCE.version : ageAdditionMode === "range" ? "skogskunskap-7-13" : "egen-uppgift",
    ageSpread: Math.max(...results.map(t => t.age)) - Math.min(...results.map(t => t.age)),
    treeSISpread: results.every(t => t.proposalLow !== null) ? [Math.min(...results.map(t => t.proposalLow)), Math.max(...results.map(t => t.proposalHigh))] : null,
    siLow: hasSI ? mean("siLow") : null, siHigh: hasSI ? mean("siHigh") : null,
    totalAgeLow: mean("totalAgeLow"), totalAgeHigh: mean("totalAgeHigh"),
    suggestion, suitability, guidance: hasSI ? null : guidance,
    limitation: hasSI ? null : "Ordinarie SI kräver lämpliga provträd, totalålder 10–80 år och höjd över 5 m. Totalåldern visas ändå. Modellförslag har låg säkerhet; inga mätvärden klipps till mallens gränser."
  };
}
