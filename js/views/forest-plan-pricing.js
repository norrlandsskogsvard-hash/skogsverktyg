import { calculateForestPlanPrice } from "../calculators/pricingEngine.js";
import { createPageHeader, formatCurrency, getFormNumber } from "../ui.js";

export function renderForestPlanPricingView() {
  const page = document.createElement("div");
  page.append(createPageHeader("Prissättning av skogsbruksplan", "Ta fram ett första prisunderlag med grundavgift, hektarpris och fältdagar."));
  page.insertAdjacentHTML("beforeend",
    "<section class='content-grid'>" +
      "<article class='card span-6'><div class='card__body'>" +
        "<h3 class='card__title'>Prisunderlag</h3>" +
        "<form class='form' data-plan-form><div class='form-grid'>" +
          numberField("areaHa", "Areal, ha", 75, 1) +
          numberField("baseFee", "Grundavgift, kr", 4500, 100) +
          numberField("hectareRate", "Hektarpris, kr/ha", 145, 5) +
          numberField("fieldDays", "Fältdagar", 1.5, 0.5) +
          numberField("dayRate", "Dagpris, kr", 6800, 100) +
        "</div><button class='button' type='submit'>Beräkna planpris</button></form>" +
      "</div></article>" +
      "<aside class='card span-6'><div class='card__body'><h3 class='card__title'>Resultat</h3><div class='result-panel' data-plan-result></div></div></aside>" +
    "</section>"
  );

  const form = page.querySelector("[data-plan-form]");
  const renderResult = () => {
    const result = calculateForestPlanPrice({
      areaHa: getFormNumber(form, "areaHa"),
      baseFee: getFormNumber(form, "baseFee"),
      hectareRate: getFormNumber(form, "hectareRate"),
      fieldDays: getFormNumber(form, "fieldDays"),
      dayRate: getFormNumber(form, "dayRate")
    });
    page.querySelector("[data-plan-result]").innerHTML =
      "<div class='result-row'><span>Grundavgift</span><strong>" + formatCurrency(result.baseFee) + "</strong></div>" +
      "<div class='result-row'><span>Arealpris</span><strong>" + formatCurrency(result.areaPrice) + "</strong></div>" +
      "<div class='result-row'><span>Fältarbete</span><strong>" + formatCurrency(result.fieldPrice) + "</strong></div>" +
      "<div class='result-row'><span>Totalt exkl. moms</span><strong>" + formatCurrency(result.total) + "</strong></div>";
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderResult();
  });
  renderResult();
  return page;
}

function numberField(name, label, value, step) {
  return "<label class='field'><span>" + label + "</span><input class='input' name='" + name + "' type='number' step='" + step + "' min='0' value='" + value + "'></label>";
}
