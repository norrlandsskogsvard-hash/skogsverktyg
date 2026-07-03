import { calculateDgv, parsePositiveDiameter } from "../calculators/dgvCalculator.js";
import { getStoredValue, setStoredValue } from "../storage.js";
import { createPageHeader, escapeHtml, formatNumber } from "../ui.js";

const STORAGE_KEY = "dgvDraftDiameters";
const QUICK_DIAMETERS = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
const KEYPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "backspace"];

export function renderDgvView() {
  const page = document.createElement("div");
  let diameters = calculateDgv(getStoredValue(STORAGE_KEY, [])).values;
  let lastRemoved = null;
  let currentEntry = "";

  page.append(createPageHeader("DGV", "Mata in provträdsdiametrar i cm. DGV beräknas direkt och sparas automatiskt som utkast."));
  page.insertAdjacentHTML("beforeend", viewTemplate());

  const form = page.querySelector("[data-diameter-form]");
  const input = page.querySelector("[data-diameter-input]");
  const list = page.querySelector("[data-diameter-list]");
  const resultPanel = page.querySelector("[data-diameter-result]");
  const feedback = page.querySelector("[data-diameter-feedback]");
  const undoButton = page.querySelector("[data-undo]");
  const clearButton = page.querySelector("[data-clear]");
  const clearEntryButton = page.querySelector("[data-clear-entry]");
  const keypad = page.querySelector("[data-diameter-keypad]");
  const quickValues = page.querySelector("[data-diameter-quick]");

  function saveDraft() {
    setStoredValue(STORAGE_KEY, diameters);
  }

  function setFeedback(message, type = "info") {
    feedback.textContent = message;
    feedback.dataset.state = type;
    feedback.classList.toggle("is-error", type === "error");
  }

  function setEntry(value) {
    currentEntry = value;
    input.value = currentEntry;
  }

  function focusEntryDisplay() {
    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }
    input.focus({ preventScroll: true });
  }

  function isValidEntry(value) {
    const rawValue = String(value ?? "").trim();
    return /^[0-9]+([,.][0-9]+)?$/.test(rawValue);
  }

  function addDiameter(rawValue = currentEntry, successMessage = "Diameter tillagd och utkast sparat.", shouldFocus = true) {
    const value = parsePositiveDiameter(rawValue);
    if (!isValidEntry(rawValue) || value === null) {
      setFeedback("Ange en diameter större än 0 cm. Komma går bra som decimaltecken.", "error");
      if (shouldFocus) {
        focusEntryDisplay();
      }
      return;
    }

    diameters = [...diameters, value];
    lastRemoved = null;
    setEntry("");
    setFeedback(successMessage);
    saveDraft();
    render();
    if (shouldFocus) {
      focusEntryDisplay();
    }
  }

  function appendKey(key) {
    if (/^[0-9]$/.test(key)) {
      setEntry(currentEntry === "0" ? key : currentEntry + key);
      return;
    }

    if ((key === "," || key === ".") && !currentEntry.includes(",")) {
      setEntry(currentEntry ? currentEntry + "," : "0,");
    }
  }

  function backspaceEntry() {
    setEntry(currentEntry.slice(0, -1));
  }

  function clearEntry(shouldFocus = true) {
    setEntry("");
    setFeedback("Aktuell inmatning är rensad.");
    if (shouldFocus) {
      focusEntryDisplay();
    }
  }

  function removeDiameter(index) {
    lastRemoved = { value: diameters[index], index };
    diameters = diameters.filter((_, itemIndex) => itemIndex !== index);
    setFeedback("Värdet togs bort. Du kan ångra direkt.");
    saveDraft();
    render();
  }

  function undoLast() {
    if (lastRemoved) {
      const next = [...diameters];
      next.splice(lastRemoved.index, 0, lastRemoved.value);
      diameters = next;
      lastRemoved = null;
      setFeedback("Borttaget värde återställt.");
    } else if (diameters.length) {
      lastRemoved = { value: diameters.at(-1), index: diameters.length - 1 };
      diameters = diameters.slice(0, -1);
      setFeedback("Senaste diameter togs bort.");
    } else {
      setFeedback("Det finns inget värde att ångra.", "error");
    }
    saveDraft();
    render();
  }

  function clearAll() {
    if (!diameters.length) {
      setFeedback("Listan är redan tom.", "error");
      return;
    }

    if (window.confirm("Rensa alla diametrar i DGV-utkastet?")) {
      diameters = [];
      lastRemoved = null;
      setFeedback("Alla diametrar är rensade.");
      saveDraft();
      render();
    }
  }

  function render() {
    const result = calculateDgv(diameters);
    resultPanel.innerHTML = resultTemplate(result);
    list.innerHTML = valuesTemplate(diameters, "cm", "diameter");
    undoButton.disabled = !diameters.length && !lastRemoved;
    clearButton.disabled = !diameters.length;

    if (!result.hasValues) {
      setFeedback(result.error, "error");
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    addDiameter(currentEntry, "Diameter tillagd och utkast sparat.", document.activeElement === input);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addDiameter();
    } else if (event.key === "Backspace") {
      event.preventDefault();
      backspaceEntry();
    } else if (/^[0-9]$/.test(event.key) || event.key === "," || event.key === ".") {
      event.preventDefault();
      appendKey(event.key);
    } else if (event.key === "Escape") {
      event.preventDefault();
      clearEntry();
    }
  });

  keypad.addEventListener("click", (event) => {
    const button = event.target.closest("[data-keypad-value]");
    if (!button) {
      return;
    }

    event.preventDefault();
    if (button.dataset.keypadValue === "backspace") {
      backspaceEntry();
    } else {
      appendKey(button.dataset.keypadValue);
    }
  });

  quickValues.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quick-value]");
    if (button) {
      event.preventDefault();
      const value = Number(button.dataset.quickValue);
      addDiameter(String(value).replace(".", ","), "Snabbval " + formatNumber(value, 1) + " cm tillagt och utkast sparat.", false);
    }
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-index]");
    if (button) {
      removeDiameter(Number(button.dataset.removeIndex));
    }
  });

  clearEntryButton.addEventListener("click", (event) => {
    event.preventDefault();
    clearEntry(false);
  });
  undoButton.addEventListener("click", undoLast);
  clearButton.addEventListener("click", clearAll);

  render();
  return page;
}

function viewTemplate() {
  return "<section class='field-module'>" +
    "<article class='card field-entry-card'>" +
      "<div class='card__body'>" +
        "<h3 class='card__title'>Lägg till diameter</h3>" +
        "<form class='field-entry-form field-entry-form--keypad' data-diameter-form>" +
          "<div class='field-keypad'>" +
            "<label class='field field-entry-input'>" +
              "<span>Aktuell diameter</span>" +
              "<span class='field-keypad__display-row'>" +
                "<input class='input input--large field-keypad__display' data-diameter-input inputmode='none' autocomplete='off' placeholder='0,0' readonly aria-describedby='dgv-feedback'>" +
                "<span class='field-keypad__unit'>cm</span>" +
              "</span>" +
            "</label>" +
            "<div class='field-keypad__quick-section'>" +
              "<p class='field-keypad__label'>Snabbval</p>" +
              "<div class='field-keypad__quick' data-diameter-quick>" + quickButtonsTemplate(QUICK_DIAMETERS, "cm") + "</div>" +
            "</div>" +
            "<div class='field-keypad__grid' data-diameter-keypad>" + keypadButtonsTemplate() + "</div>" +
            "<div class='field-keypad__actions'>" +
              "<button class='button button--large field-keypad__button--primary' type='submit'>Lägg till</button>" +
              "<button class='button button--secondary button--large' type='button' data-clear-entry>Rensa inmatning</button>" +
            "</div>" +
          "</div>" +
        "</form>" +
        "<p class='field-feedback' id='dgv-feedback' data-diameter-feedback>Diametrar sparas automatiskt på enheten.</p>" +
        "<div class='field-actions'>" +
          "<button class='button button--secondary' type='button' data-undo>Ångra</button>" +
          "<button class='button button--secondary' type='button' data-clear>Rensa alla</button>" +
        "</div>" +
      "</div>" +
    "</article>" +
    "<aside class='result-panel result-panel--strong' data-diameter-result></aside>" +
    "<article class='card field-list-card'>" +
      "<div class='card__body'>" +
        "<h3 class='card__title'>Inmatade diametrar</h3>" +
        "<div class='field-value-list' data-diameter-list></div>" +
      "</div>" +
    "</article>" +
  "</section>";
}

function quickButtonsTemplate(values, unit) {
  return values.map((value) =>
    "<button class='button button--secondary field-keypad__quick-button' type='button' data-quick-value='" + value + "'>" +
      formatNumber(value, 0) + " " + unit +
    "</button>"
  ).join("");
}

function keypadButtonsTemplate() {
  return KEYPAD_KEYS.map((key) => {
    const label = key === "backspace" ? "⌫" : key;
    const ariaLabel = key === "backspace" ? "Ta bort senaste tecknet" : "Skriv " + key;
    return "<button class='button button--secondary field-keypad__button' type='button' data-keypad-value='" + key + "' aria-label='" + ariaLabel + "'>" + label + "</button>";
  }).join("");
}

function resultTemplate(result) {
  if (!result.hasValues) {
    return "<div class='result-main'><span>DGV</span><strong>-</strong></div>" +
      "<p class='card__text'>" + escapeHtml(result.error) + "</p>";
  }

  return "<div class='result-main'><span>DGV</span><strong>" + formatNumber(result.dgv, 1) + " cm</strong></div>" +
    statRow("Antal provträd", String(result.count)) +
    statRow("Aritmetiskt medel", formatNumber(result.arithmeticMean, 1) + " cm") +
    statRow("Median", formatNumber(result.median, 1) + " cm") +
    statRow("Min", formatNumber(result.min, 1) + " cm") +
    statRow("Max", formatNumber(result.max, 1) + " cm") +
    statRow("Standardavvikelse", formatNumber(result.standardDeviation, 1) + " cm");
}

function valuesTemplate(values, unit, label) {
  if (!values.length) {
    return "<p class='card__text'>Inga värden inmatade ännu.</p>";
  }

  return values.map((value, index) =>
    "<div class='field-value-item'>" +
      "<span><strong>" + formatNumber(value, 1) + "</strong> " + unit + "</span>" +
      "<button class='button button--secondary button--compact' type='button' data-remove-index='" + index + "' aria-label='Ta bort " + label + " " + formatNumber(value, 1) + "'>Ta bort</button>" +
    "</div>"
  ).join("");
}

function statRow(label, value) {
  return "<div class='result-row'><span>" + label + "</span><strong>" + value + "</strong></div>";
}
