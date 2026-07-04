export const SKOTSEL_SOURCE_DOCUMENTS = [
  "docs/skotselkollen-kallmatris.md",
  "docs/skotselkollen-beslutsmodell.md",
  "docs/skotselkollen-lagkontroll.md",
  "docs/skotselkollen-input-output.md"
];

export const SKOTSEL_SOURCE_RULES = [
  {
    id: "missing-source-matrix",
    type: "documentationOnly",
    area: "source",
    species: "all",
    region: "all",
    variable: "sourceMatrix",
    valueRange: null,
    unit: "",
    source: "Skötselkollen källdokument saknas i denna checkout",
    page: "",
    confidence: "low",
    note: "Inga numeriska röjnings-, gallrings- eller slutavverkningsgränser används förrän källmatrisen finns i repo."
  },
  {
    id: "legal-control-separate",
    type: "documentationOnly",
    area: "legal",
    species: "all",
    region: "all",
    variable: "legalFlags",
    valueRange: null,
    unit: "",
    source: "Användarkrav för Skötselkollen v1",
    page: "",
    confidence: "medium",
    note: "Juridisk kontroll redovisas separat från skoglig bedömning och är inte ett avverkningsbeslut."
  },
  {
    id: "birch-separate-track",
    type: "documentationOnly",
    area: "species",
    species: "bjork",
    region: "all",
    variable: "speciesTrack",
    valueRange: null,
    unit: "",
    source: "Användarkrav för Skötselkollen v1",
    page: "",
    confidence: "medium",
    note: "Björk hanteras som eget spår. Tall- eller granmall används inte som ersättning."
  }
];

export function findGallringZone() {
  return null;
}

export function sourceNotesForInput(input = {}) {
  const notes = SKOTSEL_SOURCE_RULES.map((rule) => rule.note);

  if (input.mainSpecies === "bjork") {
    notes.push("Björkspåret saknar granskade numeriska källvärden i denna checkout.");
  }

  if (input.mainSpecies === "blandat") {
    notes.push("Blandbestånd bedöms endast mot dominerande trädslag om andelen är minst 70 %. I annat fall krävs manuell bedömning.");
  }

  notes.push("Gallringszon visas bara när kunskapsbasen innehåller granskad zondata. För vald v1 saknas sådan zondata.");
  return [...new Set(notes)];
}
