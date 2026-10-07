import { NATURE_FORM } from "./natureReferenceData.js";

export const NATURE_SECTIONS = ["Ståndort", "Dynamik", "Miljöer", "Träd", "Struktur", "Död ved"];
export const NATURE_GROUPS = { N: "Nystörd skog", Ot: "Brandpräglad tallskog", Op: "Pionjärlövskog", S: "Sällan störd granskog", V: "Vattenpåverkad lövskog", K: "Kulturpräglad skog" };
export const NATURE_SCOPE = "Boreal zon; även Västerbotten/Norrbotten enligt användarens rättelse 2026-10-07";
export const NATURE_SCOPE_BASIS = "Användaren har bekräftat att PDF är rätt blankett för AC/BD och att områdesrubriken är felskriven. Rättelsen är inte verifierad hos utgivaren. PDF-frågorna och poängmatrisen är oförändrade.";
export const NATURE_PARENTS = { 14: [13], 15: [14], 30: [29], 35: [34], 40: [39], 43: [42], 48: [49], 49: [50], 51: [50], 52: [50], 56: [55], 57: [52], 64: [63], 67: [66], 69: [68], 74: [73], 76: [73], 77: [73], 78: [73], 80: [79] };
const states = ["yes", "no", "uncertain"];

export function natureQuestions(group = "all") {
  return NATURE_FORM.items.filter(item => group === "all" || item.groups.includes(group));
}

export function assessNature({ answers = {}, group = "all", scope = "unknown" } = {}) {
  const relevant = natureQuestions(group);
  const effectiveYes = new Set(NATURE_FORM.items.filter(i => answers[i.id] === "yes").map(i => i.id));
  // Higher quantity/quality levels also earn the earlier marks in the supplied form.
  function includeParents(id) {
    for (const parent of NATURE_PARENTS[id] || []) {
      if (!effectiveYes.has(parent)) { effectiveYes.add(parent); includeParents(parent); }
    }
  }
  [...effectiveYes].forEach(includeParents);
  const conflicts = NATURE_FORM.items.filter(i => effectiveYes.has(i.id) && answers[i.id] === "no");
  const unanswered = relevant.filter(i => !states.includes(answers[i.id]) && !effectiveYes.has(i.id));
  const uncertain = relevant.filter(i => answers[i.id] === "uncertain" && !effectiveYes.has(i.id));
  const balance = Object.keys(NATURE_GROUPS).map(code => {
    const selected = NATURE_FORM.items.filter(i => i.groups.includes(code) && effectiveYes.has(i.id));
    const site = selected.filter(i => i.id <= 40).length;
    const stand = selected.length - site;
    return { code, site, stand, total: site + stand };
  });
  const scoreAllowed = ["boreal", "north"].includes(scope);
  const complete = relevant.length > 0 && !unanswered.length && !uncertain.length && !conflicts.length;
  return { balance, scoreAllowed, scopeBasis: scope === "north" ? NATURE_SCOPE_BASIS : null, complete, relevantCount: relevant.length, assessedCount: relevant.length - unanswered.length - uncertain.length, unanswered, uncertain, conflicts, effectiveYes: [...effectiveYes].sort((a, b) => a - b), version: NATURE_FORM.version };
}

export function natureReport(draft) {
  const result = assessNature(draft);
  if (!result.assessedCount && !result.uncertain.length && !draft.observations && !draft.species && !draft.action) return null;
  const picked = result.balance.filter(b => draft.group === "all" || b.code === draft.group);
  const score = result.scoreAllowed ? picked.map(b => `${b.code}: ståndort ${b.site} + bestånd ${b.stand} = ${b.total} poäng`).join("; ") : "Ingen regionalt giltig poäng beräknad. Endast fältobservationer.";
  const text = [
    "Naturvärdesbedömning / fältunderlag",
    `Biotop: ${NATURE_GROUPS[draft.group] || "Alla biotopgrupper"}. Areal: ${draft.area || "ej angiven"} ha.`,
    score,
    `${result.complete ? "Frågorna genomgångna" : "Ofullständigt underlag"}: ${result.assessedCount}/${result.relevantCount} bedömda; ${result.unanswered.length} obesvarade; ${result.uncertain.length} osäkra; ${result.conflicts.length} motsägande.`,
    ...NATURE_FORM.items.filter(i => result.effectiveYes.includes(i.id)).map(i => `Ja ${i.id}: ${i.text}${draft.answers?.[i.id] === "yes" ? "" : " (ingår genom högre nivå)"}`),
    ...(result.unanswered.length ? [`Ej bedömda frågor: ${result.unanswered.map(i => i.id).join(", ")}.`] : []),
    ...(result.uncertain.length ? [`Osäkra frågor: ${result.uncertain.map(i => i.id).join(", ")}.`] : []),
    ...(result.conflicts.length ? [`Kontrollera motsägande svar: ${result.conflicts.map(i => i.id).join(", ")}.`] : []),
    draft.observations && `Fältbild: ${draft.observations}`,
    draft.species && `Arter / kulturlämningar: ${draft.species}`,
    draft.action && `Eget skötselförslag / nästa kontroll: ${draft.action}`,
    `Underlag: Skogsbiologerna AB, ${NATURE_FORM.sourceFile}, ${NATURE_FORM.version}. Blankettområde: ${NATURE_SCOPE}. Valt område: ${draft.scope || "unknown"}.`,
    result.scopeBasis,
    "Poäng är ett relativt strukturmått, inte en naturvärdesklass eller ett klartecken till skoglig åtgärd. Manualens avvikande frågor eller poäng importeras inte som ersättare."
  ].filter(Boolean).join("\n");
  return { text, kind: "nature-assessment", input: JSON.parse(JSON.stringify(draft)), assessment: result, sourceVersion: NATURE_FORM.version };
}
