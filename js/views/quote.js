import { calculateQuoteTotal } from "../calculators/pricingEngine.js";
import { DEFAULT_SETTINGS } from "../config.js";
import { getStoredValue } from "../storage.js";
import { createPageHeader, escapeHtml, formatCurrency, getFormNumber, showToast } from "../ui.js";

export function renderQuoteView() {
  const settings = getStoredValue("settings", DEFAULT_SETTINGS);
  const page = document.createElement("div");
  page.append(createPageHeader("Offertgenerator", "Skapa en enkel offertsummering för arbete, resor och material."));
  page.insertAdjacentHTML("beforeend",
    "<section class='content-grid'>" +
      "<article class='card span-8'><div class='card__body'>" +
        "<h3 class='card__title'>Offertposter</h3>" +
        "<form class='form' data-quote-form>" +
          "<div class='form-grid'>" +
            "<label class='field'><span>Kund</span><input class='input' name='customer' type='text' placeholder='Kundnamn'></label>" +
            "<label class='field'><span>Moms, %</span><input class='input' name='vatRate' type='number' min='0' step='1' value='" + settings.vatRate + "'></label>" +
          "</div>" +
          "<div class='form-grid'>" + quoteLine("Röjning", 4.2, 3600, 1) + quoteLine("Resa/etablering", 1, 850, 2) + quoteLine("Planarbete", 0, 0, 3) + "</div>" +
          "<div class='button-row'><button class='button' type='submit'>Summera offert</button><button class='button button--secondary' type='button' data-print>Utskrift</button></div>" +
        "</form>" +
      "</div></article>" +
      "<aside class='card span-4'><div class='card__body'>" +
        "<h3 class='card__title'>Offert</h3>" +
        "<p class='card__text'>" + escapeHtml(settings.companyName || "Ditt företag") + " visas som avsändare när inställningar är ifyllda.</p>" +
        "<div class='result-panel' data-quote-result></div>" +
      "</div></aside>" +
    "</section>"
  );

  const form = page.querySelector("[data-quote-form]");
  const renderResult = () => {
    const items = [1, 2, 3].map((index) => ({
      quantity: getFormNumber(form, "quantity" + index),
      unitPrice: getFormNumber(form, "unitPrice" + index)
    }));
    const result = calculateQuoteTotal(items, getFormNumber(form, "vatRate", settings.vatRate));
    page.querySelector("[data-quote-result]").innerHTML =
      "<div class='result-row'><span>Exkl. moms</span><strong>" + formatCurrency(result.subtotal) + "</strong></div>" +
      "<div class='result-row'><span>Moms</span><strong>" + formatCurrency(result.vat) + "</strong></div>" +
      "<div class='result-row'><span>Att offerera</span><strong>" + formatCurrency(result.total) + "</strong></div>";
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderResult();
    showToast("Offerten är summerad.");
  });
  page.querySelector("[data-print]").addEventListener("click", () => window.print());
  renderResult();
  return page;
}

function quoteLine(label, quantity, unitPrice, index) {
  return "<label class='field'><span>" + label + " antal</span><input class='input' name='quantity" + index + "' type='number' step='0.1' min='0' value='" + quantity + "'></label>" +
    "<label class='field'><span>" + label + " à-pris</span><input class='input' name='unitPrice" + index + "' type='number' step='50' min='0' value='" + unitPrice + "'></label>";
}
