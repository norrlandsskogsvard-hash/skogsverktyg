import { DEFAULT_SETTINGS } from "../config.js";
import { getStoredValue, setStoredValue } from "../storage.js";
import { setTheme } from "../theme.js";
import { createPageHeader, escapeHtml, getFormNumber, showToast } from "../ui.js";

export function renderSettingsView() {
  const settings = getStoredValue("settings", DEFAULT_SETTINGS);
  const page = document.createElement("div");
  page.append(createPageHeader("Inställningar", "Spara lokala standardvärden för priser, moms och visning."));
  page.insertAdjacentHTML("beforeend",
    "<section class='content-grid'>" +
      "<article class='card span-8'><div class='card__body'>" +
        "<h3 class='card__title'>Lokala värden</h3>" +
        "<form class='form' data-settings-form>" +
          "<label class='field'><span>Företagsnamn</span><input class='input' name='companyName' type='text' value='" + escapeHtml(settings.companyName ?? "") + "'></label>" +
          "<div class='form-grid'>" +
            numberField("hourlyRate", "Timpris, kr", settings.hourlyRate, 10) +
            numberField("travelRate", "Respris, kr/km", settings.travelRate, 1) +
            numberField("vatRate", "Moms, %", settings.vatRate, 1) +
            "<label class='field'><span>Tema</span><select class='select' name='theme'><option value='light' " + (settings.theme === "light" ? "selected" : "") + ">Ljust</option><option value='dark' " + (settings.theme === "dark" ? "selected" : "") + ">Mörkt</option></select></label>" +
          "</div>" +
          "<button class='button' type='submit'>Spara inställningar</button>" +
        "</form>" +
      "</div></article>" +
      "<aside class='card span-4'><div class='card__body'><h3 class='card__title'>Offline</h3><p class='card__text'>Appen sparar inställningar i webbläsaren på den här enheten. Ingen backend används.</p></div></aside>" +
    "</section>"
  );

  page.querySelector("[data-settings-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const nextSettings = {
      companyName: form.elements.companyName.value.trim(),
      hourlyRate: getFormNumber(form, "hourlyRate", DEFAULT_SETTINGS.hourlyRate),
      travelRate: getFormNumber(form, "travelRate", DEFAULT_SETTINGS.travelRate),
      vatRate: getFormNumber(form, "vatRate", DEFAULT_SETTINGS.vatRate),
      theme: form.elements.theme.value
    };
    setStoredValue("settings", nextSettings);
    setTheme(nextSettings.theme);
    showToast("Inställningarna är sparade.");
  });

  return page;
}

function numberField(name, label, value, step) {
  return "<label class='field'><span>" + label + "</span><input class='input' name='" + name + "' type='number' min='0' step='" + step + "' value='" + value + "'></label>";
}
