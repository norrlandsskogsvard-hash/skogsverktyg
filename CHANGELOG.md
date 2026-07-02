import { calculateMeanHeight, parsePositiveHeight } from "../calculators/heightCalculator.js";
import { getStoredValue, setStoredValue } from "../storage.js";
import { createPageHeader, escapeHtml, formatNumber } from "../ui.js";

const STORAGE_KEY = "heightDraftValues";

export function renderHeightView() {
  const page = document.createElement("div");
  let heights = calculateMeanHeight(getStoredValue(STORAGE_KEY, [])).values;
  let lastRemoved = null;

  page.append(createPageHeader("Medelhöjd", "Mata in provträdshöjder i meter. Medelhöjd visas direkt och utkastet sparas automatiskt."));
  page.insertAdjacentHTML("beforeend", viewTemplate());

  const form = page.querySelector("[data-height-form]");
  const input = page.querySelector("[data-height-input]");
  const list = page.querySelector("[data-height-list]");
  const resultPanel = page.querySelector("[data-height-result]");
  const feedback = page.querySelector("[data-height-feedback]");
  const undoButton = page.querySelector("[data-undo]");
  const clearButton = page.querySelector("[data-clear]");

  function saveDraft() {
    setStoredValue(STORAGE_KEY, heights);
  }

  function setFeedback(message, type = "info") {
    feedback.textContent = message;
    feedback.dataset.state = type;
    feedback.classList.toggle("is-error", type === "error");
  }

  function addHeight() {
    const value = parsePositiveHeight(input.value);
    if (value === null) {
      setFeedback("Ange en höjd större än 0 m. Komma går bra som decimaltecken.", "error");
      input.select();
      return;
    }

    heights = [...heights, value];
    lastRemoved = null;
    input.value = "";
    setFeedback("Höjd tillagd och utkast sparat.");
    saveDraft();
    render();
    input.focus();
  }

  function removeHeight(index) {
    lastRemoved = { value: heights[index], index };
    heights = heights.filter((_, itemIndex) => itemIndex !== index);
    setFeedback("Värdet togs bort. Du kan ångra direkt.");
    saveDraft();
    render();
    input.focus();
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
    input.focus();
  }

  function clearAll() {
    if (!heights.length) {
      setFeedback("Listan är redan tom.", "error");
      input.focus();
      return;
    }

    if (window.confirm("Rensa alla höjder i medelhöjdsutkastet?")) {
      heights = [];
      lastRemoved = null;
      setFeedback("Alla höjder är rensade.");
      saveDraft();
      render();
      input.focus();
    }
  }

  function render() {
    const result = calculateMeanHeight(heights);
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
    addHeight();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addHeight();
    }
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-index]");
    if (button) {
      removeHeight(Number(button.dataset.removeIndex));
    }
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
        "<form class='field-entry-form' data-height-form>" +
          "<label class='field field-entry-input'>" +
            "<span>Höjd, m</span>" +
            "<input class='input input--large' data-height-input inputmode='decimal' autocomplete='off' placeholder='Ex. 12,7' aria-describedby='height-feedback'>" +
          "</label>" +
          "<button class='button button--large' type='submit'>Lägg till</button>" +
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

function resultTemplate(result) {
  if (!result.hasValues) {
    return "<div class='result-main'><span>Medelhöjd</span><strong>-</strong></div>" +
      "<p class='card__text'>" + escapeHtml(result.error) + "</p>";
  }

  return "<div class='result-main'><span>Medelhöjd</span><strong>" + formatNumber(result.meanHeight, 1) + " m</strong></div>" +
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

  return values.map((value, index) =>
    "<div class='field-value-item'>" +
      "<span><strong>" + formatNumber(value, 1) + "</strong> m</span>" +
      "<button class='button button--secondary button--compact' type='button' data-remove-index='" + index + "' aria-label='Ta bort höjd " + formatNumber(value, 1) + "'>Ta bort</button>" +
    "</div>"
  ).join("");
}

function statRow(label, value) {
  return "<div class='result-row'><span>" + label + "</span><strong>" + value + "</strong></div>";
}
