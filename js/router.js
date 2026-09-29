import { renderDashboardView } from "./views/dashboard.js";
import { renderDgvView } from "./views/dgv.js";
import { renderHeightView } from "./views/height.js";
import { renderFieldToolsView, renderFieldSIView, renderYoungVolumeView, renderCirclePlotView, renderFieldNotesView } from "./views/field-tools.js";
import { renderCurveReviewView } from "./views/curve-review.js";
import { renderRojningView } from "./views/rojning.js";
import { renderForestPlanPricingView } from "./views/forest-plan-pricing.js";
import { renderQuoteView } from "./views/quote.js";
import { renderCustomersView } from "./views/customers.js";
import { renderSettingsView } from "./views/settings.js";
import { setActiveNavigation, setViewTitle } from "./ui.js";

const routes = {
  "": { id: "dashboard", title: "Start", render: renderDashboardView },
  "/": { id: "dashboard", title: "Start", render: renderDashboardView },
  "/dgv": { id: "dgv", title: "DGV", render: renderDgvView },
  "/height": { id: "height", title: "Medelhöjd", render: renderHeightView },
  "/skotselkollen": { id: "skotselkollen", title: "Fältverktyg", render: renderFieldToolsView },
  "/si": { id: "si", title: "Snabb SI", render: renderFieldSIView },
  "/young-volume": { id: "young-volume", title: "Ungskogsvolym", render: renderYoungVolumeView },
  "/circle-plot": { id: "circle-plot", title: "Stamantal", render: renderCirclePlotView },
  "/field-notes": { id: "field-notes", title: "Anteckningar", render: renderFieldNotesView },
  "/curve-review": { id: "curve-review", title: "Kurvgranskning", render: renderCurveReviewView },
  "/rojning": { id: "rojning", title: "Röjning", render: renderRojningView },
  "/forest-plan-pricing": { id: "forest-plan-pricing", title: "Planpris", render: renderForestPlanPricingView },
  "/quote": { id: "quote", title: "Offert", render: renderQuoteView },
  "/customers": { id: "customers", title: "Kundregister", render: renderCustomersView },
  "/settings": { id: "settings", title: "Inställningar", render: renderSettingsView }
};

function currentPath() {
  return window.location.hash.replace(/^#/, "") || "/";
}

export function startRouter() {
  window.addEventListener("hashchange", renderRoute);
  renderRoute();
}

export function renderRoute() {
  const view = document.querySelector("#view");
  const route = routes[currentPath()] ?? routes["/"];
  setViewTitle(route.title);
  setActiveNavigation(route.id);
  view.replaceChildren(route.render());
  view.focus({ preventScroll: true });
  window.dispatchEvent(new CustomEvent("skogskalkyl:route", { detail: route }));
}
