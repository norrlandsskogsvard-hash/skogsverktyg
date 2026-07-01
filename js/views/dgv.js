import { calculateDgv, dgvFields } from "../calculators/dgvCalculator.js";
import { createPageHeader } from "../ui.js";

export function renderDgvView() {
  const page = document.createElement("div");
  const result = calculateDgv();
  page.append(createPageHeader("DGV", "Modulen är förberedd för diametergrundytevägd volym och byggs ut i nästa steg."));
  page.insertAdjacentHTML("beforeend",
    "<section class='content-grid'>" +
      "<article class='card span-8'><div class='card__body'>" +
        "<h3 class='card__title'>Planerad inmatning</h3>" +
        "<p class='card__text'>Fälten nedan visar den tänkta strukturen för kommande DGV-beräkning.</p>" +
        "<div class='form-grid'>" + dgvFields.map((field) =>
          "<label class='field'><span>" + field + "</span><input class='input' type='text' disabled placeholder='Kommer i nästa steg'></label>"
        ).join("") + "</div>" +
      "</div></article>" +
      "<aside class='card span-4'><div class='card__body'>" +
        "<span class='pill'>" + result.status + "</span>" +
        "<h3 class='card__title'>Beräkningsmotor</h3>" +
        "<p class='card__text'>" + result.message + "</p>" +
      "</div></aside>" +
    "</section>"
  );
  return page;
}
