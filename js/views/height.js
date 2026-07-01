import { calculateMeanHeight } from "../calculators/heightCalculator.js";
import { createPageHeader, formatNumber, getFormNumber, showToast } from "../ui.js";

export function renderHeightView() {
  const page = document.createElement("div");
  page.append(createPageHeader("Medelhöjd", "Alpha-vyn visar hur provträd kan matas in. Full modul byggs i nästa steg."));
  page.insertAdjacentHTML("beforeend",
    "<section class='content-grid'>" +
      "<article class='card span-6'><div class='card__body'>" +
        "<h3 class='card__title'>Snabb provberäkning</h3>" +
        "<form class='form' data-height-form>" +
          "<div class='form-grid'>" +
            heightInput("h1", "Höjd 1, m", "12.4") +
            heightInput("h2", "Höjd 2, m", "13.1") +
            heightInput("h3", "Höjd 3, m", "11.8") +
            heightInput("h4", "Höjd 4, m", "12.7") +
          "</div>" +
          "<button class='button' type='submit'>Beräkna medelhöjd</button>" +
        "</form>" +
      "</div></article>" +
      "<aside class='card span-6'><div class='card__body'>" +
        "<h3 class='card__title'>Resultat</h3>" +
        "<div class='result-panel' data-height-result><div class='result-row'><span>Antal provträd</span><strong>0</strong></div><div class='result-row'><span>Medelhöjd</span><strong>0,0 m</strong></div></div>" +
        "<div class='notice'><strong>Nästa steg</strong>Provträdstabell, sparade objekt och export kopplas på när modulen byggs färdig.</div>" +
      "</div></aside>" +
    "</section>"
  );

  page.querySelector("[data-height-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const trees = ["h1", "h2", "h3", "h4"].map((name) => ({ height: getFormNumber(form, name) }));
    const result = calculateMeanHeight(trees);
    page.querySelector("[data-height-result]").innerHTML =
      "<div class='result-row'><span>Antal provträd</span><strong>" + result.count + "</strong></div>" +
      "<div class='result-row'><span>Medelhöjd</span><strong>" + formatNumber(result.meanHeight) + " m</strong></div>";
    showToast("Medelhöjd beräknad.");
  });

  return page;
}

function heightInput(name, label, value) {
  return "<label class='field'><span>" + label + "</span><input class='input' name='" + name + "' type='number' step='0.1' min='0' value='" + value + "'></label>";
}
