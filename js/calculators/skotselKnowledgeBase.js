export const SKOTSEL_SOURCE_DOCUMENTS = [
  "docs/skotselkollen-kallmatris.md",
  "docs/skotselkollen-beslutsmodell.md",
  "docs/skotselkollen-lagkontroll.md",
  "docs/skotselkollen-input-output.md",
  "docs/skotselkollen-kurvdata.md"
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
    note: "Inga numeriska röjnings-, gallrings- eller slutavverkningsgränser används som skarpa beslut utan komplett källmatris."
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

export const THINNING_CURVES = [
  {
    id: "norra-tall-t20-pilot",
    species: "tall",
    speciesCode: "T",
    siteIndex: 20,
    region: "norra-sverige",
    source: "Gallringsriktlinjer & gallringsmallar norra Sverige",
    sourcePage: "s. 36, exempel normalfall T20",
    status: "pilot",
    precision: "text-example",
    confidence: "medium",
    limitations: [
      "Bygger på exempelvärden, inte full digitaliserad kurva.",
      "Ska inte användas som komplett gallringsmall.",
      "Används för att testa kurvfunktion och visning."
    ],
    points: {
      thinningEvents: [
        {
          label: "1:a gallring",
          topHeight: 14.5,
          basalAreaBefore: 24.5,
          basalAreaAfter: 18.5,
          ageTotal: 59,
          stemsBefore: 1650,
          stemsAfter: 1100
        },
        {
          label: "2:a gallring",
          topHeight: 18.0,
          basalAreaBefore: 28.0,
          basalAreaAfter: 20.5,
          ageTotal: 82,
          stemsBefore: 1100,
          stemsAfter: 700
        },
        {
          label: "Slutavverkning enligt exempel",
          topHeight: 22.0,
          basalAreaBefore: 31.5,
          basalAreaAfter: 0,
          ageTotal: 125,
          stemsBefore: 700,
          stemsAfter: 0
        }
      ]
    }
  }
];

export function findGallringZone(input = {}, siteIndexEstimate = {}) {
  const numericSiteIndex = siteIndexEstimate.numericSiteIndex ?? input.siteIndex;
  const curve = THINNING_CURVES.find((candidate) =>
    candidate.species === input.mainSpecies &&
    candidate.siteIndex === numericSiteIndex &&
    regionMatches(candidate.region, input.region)
  );

  if (!curve) return null;

  if (curve.status === "pilot") {
    return {
      type: "thinningCurve",
      actionCode: "curve_reference_pilot",
      actionLabel: "Pilotunderlag",
      confidence: curve.confidence,
      status: curve.status,
      precision: curve.precision,
      curve,
      explanation: "Källstött T20-exempel finns för tall i norra Sverige. Det är ett pilot-/exempelprogram, inte en full gallringskurva.",
      recommendation: "Använd som jämförelse mot T20-exemplet. Kontrollera full regional gallringsmall innan åtgärdsförslag."
    };
  }

  return {
    type: "thinningCurve",
    actionCode: "curve_monitor",
    actionLabel: "Kurvunderlag",
    confidence: curve.confidence,
    status: curve.status,
    precision: curve.precision,
    curve,
    explanation: "Beståndets punkt har jämförts mot inlagd gallringskurva.",
    recommendation: "Kontrollera stabilitet, kronlängd, bärighet och hänsyn innan förslag skrivs."
  };
}

export function sourceNotesForInput(input = {}) {
  const notes = SKOTSEL_SOURCE_RULES.map((rule) => rule.note);

  if (input.mainSpecies === "bjork") {
    notes.push("Björkspåret saknar granskade numeriska källvärden i denna checkout.");
  }

  if (input.mainSpecies === "blandat") {
    notes.push("Blandbestånd kräver manuell kontroll av trädslagsblandning, skiktning och målbild innan mall används.");
  }

  notes.push("Gallringszon visas bara när kunskapsbasen innehåller granskad komplett zondata. T20-underlaget är pilot/exempel, inte full kurva.");
  notes.push("INGVAR används endast som referens för arbetsgång och variabler, inte som direkt facit.");
  notes.push("Heureka används som referens för långsiktigt scenario- och beslutsstöd, inte som direkt fältgräns.");
  notes.push("Gallringsmallar norra Sverige används som kommande källa för tall/gran när källmatris är inlagd.");
  notes.push("Björk saknar ännu fullständig granskad kurva i appens kunskapsbas.");
  return [...new Set(notes)];
}

function regionMatches(curveRegion, inputRegion) {
  if (curveRegion === "norra-sverige") {
    return ["norrland_kust", "norrland_inland", "hoglage_fjallnara", "okand"].includes(inputRegion);
  }
  return curveRegion === inputRegion;
}
