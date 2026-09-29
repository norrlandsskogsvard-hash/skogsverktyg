export const APP_VERSION = "2.0.0-alpha.1";

export const NAV_ITEMS = [
  { id: "dashboard", label: "Start", hash: "#/", icon: "S", primary: true },
  { id: "dgv", label: "DGV", hash: "#/dgv", icon: "D", primary: true },
  { id: "height", label: "Höjd", hash: "#/height", icon: "H", primary: true },
  { id: "si", label: "SI", hash: "#/si", icon: "SI", primary: true },
  { id: "young-volume", label: "Volym", hash: "#/young-volume", icon: "V", primary: true },
  { id: "circle-plot", label: "Stamantal", hash: "#/circle-plot", icon: "N", primary: true },
  { id: "field-notes", label: "Anteckningar", hash: "#/field-notes", icon: "A", primary: true },
  { id: "rojning", label: "Röjning", hash: "#/rojning", icon: "R", primary: true },
  { id: "quote", label: "Offert", hash: "#/quote", icon: "O" },
  { id: "customers", label: "Kunder", hash: "#/customers", icon: "K" },
  { id: "forest-plan-pricing", label: "Planpris", hash: "#/forest-plan-pricing", icon: "P" },
  { id: "settings", label: "Inställningar", hash: "#/settings", icon: "I" }
];

export const DEFAULT_SETTINGS = {
  theme: "light",
  companyName: "",
  hourlyRate: 620,
  travelRate: 65,
  vatRate: 25
};

export const MODULE_STATUS = {
  dgv: "Fältklar",
  height: "Fältklar",
  skotselkollen: "Beslutsstöd",
  rojning: "Proffskalkyl",
  forestPlanPricing: "Proffskalkyl",
  quote: "Offertgenerator",
  customers: "Lokalt arkiv",
  curveReview: "Källarbete"
};
