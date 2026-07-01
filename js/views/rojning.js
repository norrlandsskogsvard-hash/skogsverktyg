import { calculateClearingPrice } from "../calculators/pricingEngine.js";
import { createPageHeader, formatCurrency, getFormNumber, showToast } from "../ui.js";
import { getStoredValue, setStoredValue } from "../storage.js";

const DEFAULT_DRAFT = {
  areaHa: 4.2,
  density: "normal",
  difficulty: "normal",
  baseRate: 3600,
  travelCost: 850
};

export function renderRojningView() {
  const draft = getStoredValue("rojningDraft", DEFAULT_DRAFT);
  const page = document.createElement("div");
  page.append(createPageHeader("Röjningskalkyl", "Beräkna ett snabbt riktpris för röjning baserat på areal, täthet och svårighetsgrad."));
  page.insertAdjacentHTML("beforeend",
    "<section class='content-grid'>" +
      "<article class='card span-6'><div class='card__body'>" +
        "<h3 class='card__title'>Underlag</h3>" +
        "<form class='form' data-clearing-form>" +
          "<div class='form-grid'>" +
            numberField("areaHa", "Areal, ha", draft.areaHa, "0.1") +
            numberField("baseRate", "Grundpris, kr/ha", draft.baseRate, "50") +
            selectField("density", "Täthet", draft.density, [["low", "Låg"], ["normal", "Normal"], ["high", "Hög"]]) +
            selectField("difficulty", "Svårighetsgrad", draft.difficulty, [["easy", "Lätt"], ["normal", "Normal"], ["hard", "Svår"]]) +
            numberField("travelCost", "Resa/etablering, kr", draft.travelCost, "50") +
          "</div>" +
          "<div class='button-row'><button class='button' type='submit'>Beräkna</button><button class='button button--secondary' type='button' data-save-clearing>Spara utkast</button></div>" +
        "</form>" +
      "</div></article>" +
      "<aside class='card span-6'><div class='card__body'><h3 class='card__title'>Resultat</h3><div class='result-panel' data-clearing-result></div></div></aside>" +
    "</section>"
  );

  const form = page.querySelector("[data-clearing-form]");
  const renderResult = () => {
    const input = readForm(form);
    const result = calculateClearingPrice(input);
    page.querySelector("[data-clearing-result]").innerHTML =
      "<div class='result-row'><span>Arbetskostnad</span><strong>" + formatCurrency(result.subtotal) + "</strong></div>" +
      "<div class='result-row'><span>Resa/etablering</span><strong>" + formatCurrency(result.travelCost) + "</strong></div>" +
      "<div class='result-row'><span>Totalt exkl. moms</span><strong>" + formatCurrency(result.total) + "</strong></div>";
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderResult();
  });

  page.querySelector("[data-save-clearing]").addEventListener("click", () => {
    setStoredValue("rojningDraft", readForm(form));
    showToast("Röjningsutkast sparat på enheten.");
  });

  renderResult();
  return page;
}

function numberField(name, label, value, step) {
  return "<label class='field'><span>" + label + "</span><input class='input' name='" + name + "' type='number' step='" + step + "' min='0' value='" + value + "'></label>";
}

function selectField(name, label, selected, options) {
  return "<label class='field'><span>" + label + "</span><select class='select' name='" + name + "'>" +
    options.map((option) => "<option value='" + option[0] + "' " + (option[0] === selected ? "selected" : "") + ">" + option[1] + "</option>").join("") +
  "</select></label>";
}

function readForm(form) {
  return {
    areaHa: getFormNumber(form, "areaHa"),
    density: form.elements.density.value,
    difficulty: form.elements.difficulty.value,
    baseRate: getFormNumber(form, "baseRate"),
    travelCost: getFormNumber(form, "travelCost")
  };
}
