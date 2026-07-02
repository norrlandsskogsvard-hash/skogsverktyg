import { calculateDgv, parsePositiveDiameter } from "../calculators/dgvCalculator.js";
import { getStoredValue, setStoredValue } from "../storage.js";
import { createPageHeader, escapeHtml, formatNumber } from "../ui.js";

const STORAGE_KEY = "dgvDraftDiameters";

export function renderDgvView() {
  const page = document.createElement("div");
  let diameters = calculateDgv(getStoredValue(STORAGE_KEY, [])).values;
  let lastRemoved = null;

  page.append(createPageHeader("DGV", "Mata in provträdsdiametrar i cm. DGV beräknas direkt och sparas automatiskt som utkast."));
  page.insertAdjacentHTML("beforeend", viewTemplate());

  const form = page.querySelector("[data-diameter-form]");
  const input = page.querySelector("[data-diameter-input]");
  const list = page.querySelector("[data-diameter-list]");
  const resultPanel = page.querySelector("[data-diameter-result]");
  const feedback = page.querySelector("[data-diameter-feedback]");
  const undoButton = page.querySelector("[data-undo]");
  const clearButton = page.querySelector("[data-clear]");

  function saveDraft() {
    setStoredValue(STORAGE_KEY, diameters);
  }

  function setFeedback(message, type = "info") {
    feedback.textContent = message;
    feedback.dataset.state = type;
    feedback.classList.toggle("is-error", type === "error");
  }

  function addDiameter() {
    const value = parsePositiveDiameter(input.value);
    if (value === null) {
      setFeedback("Ange en diameter större än 0 cm. Komma går bra som decimaltecken.", "error");
      input.select();
      return;
    }

    diameters = [...diameters, value];
    lastRemoved = null;
    input.value = "";
    setFeedback("Diameter tillagd och utkast sparat.");
    saveDraft();
    render();
    input.focus();
  }

  function removeDiameter(index) {
    lastRemoved = { value: diameters[index], index };
    diameters = diameters.filter((_, itemIndex) => itemIndex !== index);
    setFeedback("Värdet togs bort. Du kan ångra direkt.");
    saveDraft();
    render();
    input.focus();
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
    input.focus();
  }

  function clearAll() {
    if (!diameters.length) {
      setFeedback("Listan är redan tom.", "error");
      input.focus();
      return;
    }

    if (window.confirm("Rensa alla diametrar i DGV-utkastet?")) {
      diameters = [];
      lastRemoved = null;
      setFeedback("Alla diametrar är rensade.");
      saveDraft();
      render();
      input.focus();
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
    addDiameter();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addDiameter();
    }
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-index]");
    if (button) {
      removeDiameter(Number(button.dataset.removeIndex));
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
        "<h3 class='card__title'>Lägg till diameter</h3>" +
        "<form class='field-entry-form' data-diameter-form>" +
          "<label class='field field-entry-input'>" +
            "<span>Diameter, cm</span>" +
            "<input class='input input--large' data-diameter-input inputmode='decimal' autocomplete='off' placeholder='Ex. 18,5' aria-describedby='dgv-feedback'>" +
          "</label>" +
          "<button class='button button--large' type='submit'>Lägg till</button>" +
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
