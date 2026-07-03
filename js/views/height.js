import { calculateMeanHeight, parsePositiveHeight } from "../calculators/heightCalculator.js";
import { getStoredValue, setStoredValue } from "../storage.js";
import { createPageHeader, escapeHtml, formatNumber } from "../ui.js";

const STORAGE_KEY = "heightDraftValues";
const KEYPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "backspace"];

export function renderHeightView() {
  const page = document.createElement("div");
  page.classList.add("field-page", "field-page--height");
  let heights = calculateMeanHeight(getStoredValue(STORAGE_KEY, [])).values;
  let lastRemoved = null;
  let currentEntry = "";

  page.append(createPageHeader("Medelhöjd", "Mata in provträdshöjder i meter. Medelhöjd visas direkt och utkastet sparas automatiskt."));
  page.insertAdjacentHTML("beforeend", viewTemplate());

  const form = page.querySelector("[data-height-form]");
  const input = page.querySelector("[data-height-input]");
  const list = page.querySelector("[data-height-list]");
  const resultPanel = page.querySelector("[data-height-result]");
  const summary = page.querySelector("[data-height-summary]");
  const feedback = page.querySelector("[data-height-feedback]");
  const undoButton = page.querySelector("[data-undo]");
  const clearButton = page.querySelector("[data-clear]");
  const clearEntryButton = page.querySelector("[data-clear-entry]");
  const keypad = page.querySelector("[data-height-keypad]");

  function saveDraft() {
    setStoredValue(STORAGE_KEY, heights);
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

  function addHeight(rawValue = currentEntry, successMessage = "Höjd tillagd och utkast sparat.", shouldFocus = true) {
    const value = parsePositiveHeight(rawValue);
    if (!isValidEntry(rawValue) || value === null) {
      setFeedback("Ange en höjd större än 0 m. Komma går bra som decimaltecken.", "error");
      if (shouldFocus) {
        focusEntryDisplay();
      }
      return;
    }

    heights = [...heights, value];
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

  function removeHeight(index) {
    lastRemoved = { value: heights[index], index };
    heights = heights.filter((_, itemIndex) => itemIndex !== index);
    setFeedback("Värdet togs bort. Du kan ångra direkt.");
    saveDraft();
    render();
  }

  function undoLast() {
    if (lastRemoved) {
      const next = [...heights];
      next.splice(lastRemoved.index, 0, lastRemoved.value);
      heights = next;
      lastRemoved = null;
      setFeedback("Borttaget värde återställt.");
    } else if (heights.length) {
      lastRemoved = { value: heights.at(-1), index: heights.length - 1 };
      heights = heights.slice(0, -1);
      setFeedback("Senaste höjd togs bort.");
    } else {
      setFeedback("Det finns inget värde att ångra.", "error");
    }
    saveDraft();
    render();
  }

  function clearAll() {
    if (!heights.length) {
      setFeedback("Listan är redan tom.", "error");
      return;
    }

    if (window.confirm("Rensa alla höjder i medelhöjdsutkastet?")) {
      heights = [];
      lastRemoved = null;
      setFeedback("Alla höjder är rensade.");
      saveDraft();
      render();
    }
  }

  function render() {
    const result = calculateMeanHeight(heights);
    summary.innerHTML = summaryTemplate(result, "Medelhöjd", "m", result.meanHeight);
    resultPanel.innerHTML = resultTemplate(result);
    list.innerHTML = valuesTemplate(heights);
    undoButton.disabled = !heights.length && !lastRemoved;
    clearButton.disabled = !heights.length;

    if (!result.hasValues) {
      setFeedback(result.error, "error");
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    addHeight(currentEntry, "Höjd tillagd och utkast sparat.", document.activeElement === input);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addHeight();
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

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-index]");
    if (button) {
      removeHeight(Number(button.dataset.removeIndex));
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
        "<h3 class='card__title'>Lägg till höjd</h3>" +
        "<form class='field-entry-form field-entry-form--keypad' data-height-form>" +
          "<div class='field-keypad'>" +
            "<div class='field-workspace'>" +
              "<div class='field-summary' data-height-summary></div>" +
              "<label class='field field-entry-input'>" +
                "<span>Aktuell höjd</span>" +
                "<span class='field-keypad__display-row'>" +
                  "<input class='input input--large field-keypad__display' data-height-input inputmode='none' autocomplete='off' placeholder='0,0' readonly aria-describedby='height-feedback'>" +
                  "<span class='field-keypad__unit'>m</span>" +
                "</span>" +
              "</label>" +
              "<div class='field-keypad__grid' data-height-keypad>" + keypadButtonsTemplate() + "</div>" +
              "<div class='field-keypad__actions'>" +
                "<button class='button button--large field-keypad__button--primary' type='submit'>Lägg till</button>" +
                "<button class='button button--secondary' type='button' data-clear-entry>Rensa inmatning</button>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</form>" +
        "<p class='field-feedback' id='height-feedback' data-height-feedback>Höjder sparas automatiskt på enheten.</p>" +
        "<div class='field-actions'>" +
          "<button class='button button--secondary' type='button' data-undo>Ångra</button>" +
          "<button class='button button--secondary' type='button' data-clear>Rensa alla</button>" +
        "</div>" +
      "</div>" +
    "</article>" +
    "<aside class='result-panel result-panel--strong' data-height-result></aside>" +
    "<article class='card field-list-card'>" +
      "<div class='card__body'>" +
        "<h3 class='card__title'>Inmatade höjder</h3>" +
        "<div class='field-value-list' data-height-list></div>" +
      "</div>" +
    "</article>" +
  "</section>";
}

function keypadButtonsTemplate() {
  return KEYPAD_KEYS.map((key) => {
    const label = key === "backspace" ? "⌫" : key;
    const ariaLabel = key === "backspace" ? "Ta bort senaste tecknet" : "Skriv " + key;
    return "<button class='button button--secondary field-keypad__button' type='button' data-keypad-value='" + key + "' aria-label='" + ariaLabel + "'>" + label + "</button>";
  }).join("");
}

function summaryTemplate(result, label, unit, value) {
  if (!result.hasValues) {
    return "<span>" + label + "</span><strong>- " + unit + " · 0 träd</strong>";
  }

  return "<span>" + label + "</span><strong>" + formatNumber(value, 1) + " " + unit + " · " + result.count + " träd</strong>";
}

function resultTemplate(result) {
  if (!result.hasValues) {
    return "<div class='result-main result-main--compact'><span>Detaljerad statistik</span><strong>-</strong></div>" +
      "<p class='card__text'>" + escapeHtml(result.error) + "</p>";
  }

  return "<div class='result-main result-main--compact'><span>Detaljerad statistik</span><strong>Medelhöjd " + formatNumber(result.meanHeight, 1) + " m</strong></div>" +
    statRow("Antal provträd", String(result.count)) +
    statRow("Median", formatNumber(result.median, 1) + " m") +
    statRow("Min", formatNumber(result.min, 1) + " m") +
    statRow("Max", formatNumber(result.max, 1) + " m") +
    statRow("Standardavvikelse", formatNumber(result.standardDeviation, 1) + " m");
}

function valuesTemplate(values) {
  if (!values.length) {
    return "<p class='card__text'>Inga värden inmatade ännu.</p>";
  }

  return values.map((value, index) => ({ value, index })).reverse().map((item, listIndex) =>
    "<div class='field-value-item" + (listIndex === 0 ? " field-value-item--latest" : "") + "'>" +
      "<span class='field-value-item__meta'><strong>" + formatNumber(item.value, 1) + "</strong> m" + (listIndex === 0 ? "<small>Senast</small>" : "") + "</span>" +
      "<button class='button button--secondary button--compact' type='button' data-remove-index='" + item.index + "' aria-label='Ta bort höjd " + formatNumber(item.value, 1) + "'>Ta bort</button>" +
    "</div>"
  ).join("");
}

function statRow(label, value) {
  return "<div class='result-row'><span>" + label + "</span><strong>" + value + "</strong></div>";
}
