import { createPageHeader, escapeHtml, formatNumber, showToast } from "../ui.js";
import { getStoredValue, setStoredValue } from "../storage.js";
import { calculateYoungVolume, calculatePlotStems } from "../calculators/fieldCalculator.js";
import { FIELD_REFERENCE_VERSION } from "../calculators/fieldReferenceData.js";
import { calculateFieldSI, SI_SOURCE } from "../calculators/fieldSiteIndex.js";
import { calculateCirclePlot, summarizeCirclePlots, PLOT_PRESETS, CIRCLE_PLOT_SOURCE } from "../calculators/circlePlotCalculator.js";

const NOTES_KEY = "fieldNotesV1";
const links = [["si", "SI"], ["young-volume", "Ungskogsvolym"], ["circle-plot", "Stamantal"], ["field-notes", "Anteckningar"]];
const number = (name, label, value = "") => `<label class="field"><span>${label}</span><input class="input" name="${name}" inputmode="decimal" autocomplete="off" value="${escapeHtml(value)}"></label>`;
const select = (name, label, options, value) => `<label class="field"><span>${label}</span><select class="select" name="${name}">${options.map(([id, text]) => `<option value="${id}" ${id === value ? "selected" : ""}>${text}</option>`).join("")}</select></label>`;
const values = form => Object.fromEntries(new FormData(form));
const notes = () => getStoredValue(NOTES_KEY, []);
const stamp = () => new Date().toISOString();

function pageShell(title, active) {
  const page = document.createElement("div");
  page.className = "field-tools";
  page.append(createPageHeader(title, ""));
  page.insertAdjacentHTML("beforeend", `<nav class="field-tools__tabs" aria-label="Fältverktyg">${links.map(([id, label]) => `<a href="#/${id}" ${id === active ? 'aria-current="page"' : ""}>${label}</a>`).join("")}</nav>`);
  return page;
}

function saveDraft(page, key, value) {
  const ok = setStoredValue(key, value);
  page.querySelector("[data-save-status]").textContent = ok ? "Sparat på denna enhet" : "Kunde inte spara på enheten. Behåll sidan öppen och exportera dina uppgifter.";
}

function sourceDetails(image, description) {
  return `<details class="field-tools__source"><summary>Bildkälla och begränsningar</summary><p>${description}</p><p>Ungefärlig interpolation mellan avlästa bildpunkter. Ingen verifierad originalformel eller statistisk felmarginal. Version ${FIELD_REFERENCE_VERSION}.</p><a href="${image}" target="_blank" rel="noopener">Öppna originalbild</a><img src="${image}" alt="Bildunderlaget för beräkningen" loading="lazy"></details>`;
}

function noteAction() {
  return `<div class="field-tools__note-action">${select("targetNote", "Spara resultat i avdelning", [["", "Välj avdelning"], ...notes().map(n => [n.id, [n.property, n.department].filter(Boolean).join(" / ") || "Namnlös avdelning"] )], "")}<button type="button" class="button button--secondary" data-save-result>Spara resultat</button><a href="#/field-notes">Ny avdelning</a></div>`;
}

function wireNoteAction(page, report) {
  page.querySelector("[data-save-result]").addEventListener("click", () => {
    const id = page.querySelector('[name="targetNote"]').value;
    const all = notes();
    const note = all.find(n => n.id === id);
    if (!note) return showToast("Välj en avdelning, eller skapa en ny under Anteckningar.");
    const updated = { ...note, text: `${note.text}${note.text ? "\n\n" : ""}${new Date().toLocaleString("sv-SE")}\n${report}`, updatedAt: stamp() };
    if (setStoredValue(NOTES_KEY, all.map(n => n.id === id ? updated : n))) showToast("Resultatet har lagts till i avdelningens anteckning.");
    else showToast("Kunde inte spara resultatet. Lagringen kan vara full.");
  });
}

export function renderFieldToolsView() {
  const page = pageShell("Skötselkollen", "");
  page.insertAdjacentHTML("beforeend", `<section class="field-tools__home" aria-label="Snabba fältverktyg">
    <a class="field-tools__launch" href="#/si"><strong>Ståndortsindex</strong><span>Höjd och brösthöjdsålder · 1–4 träd</span><span aria-hidden="true">→</span></a>
    <a class="field-tools__launch" href="#/young-volume"><strong>Volym i ungskog</strong><span>Grundyta eller stamantal</span><span aria-hidden="true">→</span></a>
    <a class="field-tools__launch" href="#/circle-plot"><strong>Stamantal</strong><span>Cirkelprovyta · en eller flera provytor</span><span aria-hidden="true">→</span></a>
    <a class="field-tools__launch" href="#/field-notes"><strong>Fältanteckningar</strong><span>Fastighet och avdelning</span><span aria-hidden="true">→</span></a>
  </section>`);
  return page;
}

export function renderFieldSIView() {
  const page = pageShell("Snabb SI", "si");
  const previous = getStoredValue("fieldSIDraftV1", null);
  // Never reinterpret a saved total age as a breast-height age on upgrade.
  const migrated = previous?.ageType === "breast" ? { species: previous.species, trees: previous.trees } : {};
  const draft = { species: "tall", ageAdditionMode: "range", yearsToBH: "", trees: [{ height: "", age: "" }],
    ...migrated, ...getStoredValue("fieldSIDraftV2", {}) };
  page.insertAdjacentHTML("beforeend", `<div class="field-tools__layout"><form class="form field-tools__form" data-si-form>
    <div class="field-tools__grid">${select("species", "Trädslag", [["tall", "Tall"], ["gran", "Gran"]], draft.species)}${select("ageAdditionMode", "År till brösthöjd", [["range", "Schablon 7–13 år"], ["own", "Eget tillägg"]], draft.ageAdditionMode)}</div>
    <div data-age-addition>${number("yearsToBH", "Eget tillägg (år till BH)", draft.yearsToBH)}<p class="field-tools__muted">Tillägget gäller alla provträd i denna beräkning.</p></div>
    <p class="field-tools__muted">Ange BH-ålder. Totalålder = BH-ålder + år till brösthöjd.</p>
    <div data-trees></div><button class="button button--secondary" type="button" data-add-tree>Lägg till provträd</button>
    <button class="button" type="submit">Beräkna SI och totalålder</button><p class="field-tools__muted" data-save-status role="status"></p>
    </form><section class="field-tools__result" data-si-result aria-live="polite"><h3>SI och totalålder</h3><p>Ange höjd och BH-ålder för provträden.</p></section></div>
    <details class="field-tools__source"><summary>Provträd och ålderstillägg</summary><p>Välj representativa övrehöjdsträd i likåldrig, oskadad skog. SLU beskriver mätning av de två grövsta träden på en cirkelprovyta med 10 m radie. Ett träd ger en provträdsskattning; flera sammanfattas som medel av individuella SI.</p><p>Skogskunskap anger normalt 7–13 år till brösthöjd för tall och gran. Det är en schablon, inte en uppmätt ålder eller statistisk felmarginal. Undertryckta träd kan behöva ett större tillägg. Ange ett eget tillägg om tiden är känd.</p></details>
    <details class="field-tools__source" data-si-source><summary>Källor och beräkning</summary><p>SLU:s funktioner för tall och gran, hela Sverige. SI avser höjd vid 100 års totalålder (H100). För gran minskas båda funktionsåldrarna med 3 år enligt fotnoten.</p><p>SI beräknas inom källans tillämpningsområde: totalålder 10–80 år och etablerad skog över 5 m. Utanför området visas bara totalålder.</p><ul><li><a href="${SI_SOURCE.url}" target="_blank" rel="noopener">SLU: Fakta Skog 14/2013, faktaruta 3</a></li><li><a href="${SI_SOURCE.toolUrl}" target="_blank" rel="noopener">Skogskunskap: Ståndortsindex</a></li><li><a href="${SI_SOURCE.ageUrl}" target="_blank" rel="noopener">Skogskunskap: underlag för ålderstillägget</a></li></ul></details>`);
  const form = page.querySelector("form");
  const result = page.querySelector("[data-si-result]");
  let trees = Array.isArray(draft.trees) ? draft.trees.slice(0, 4) : [];
  if (!trees.length) trees = [{ height: "", age: "" }];
  function treeInputs() {
    return [...form.querySelectorAll("[data-tree]")].map(row => ({ height: row.querySelector('[data-height]').value, age: row.querySelector('[data-age]').value }));
  }
  function persist() { saveDraft(page, "fieldSIDraftV2", { ...values(form), ageType: "breast", trees: treeInputs() }); }
  function invalidate() {
    page.querySelector("[data-age-addition]").hidden = form.elements.ageAdditionMode.value !== "own";
    result.innerHTML = "<h3>SI och totalålder</h3><p>Indata ändrad. Beräkna för aktuella värden.</p>";
  }
  function rows() {
    page.querySelector("[data-trees]").innerHTML = trees.map((tree, i) => `<fieldset class="field-tools__tree" data-tree><legend>Träd ${i + 1}</legend><div class="field-tools__grid"><label class="field"><span>Höjd (m)</span><input class="input" data-height aria-label="Höjd träd ${i + 1}" inputmode="decimal" value="${escapeHtml(tree.height)}"></label><label class="field"><span>BH-ålder (år)</span><input class="input" data-age aria-label="BH-ålder träd ${i + 1}" inputmode="numeric" value="${escapeHtml(tree.age)}"></label></div>${trees.length > 1 ? `<button class="field-tools__remove" type="button" data-remove-tree="${i}" aria-label="Ta bort träd ${i + 1}" title="Ta bort träd ${i + 1}">×</button>` : ""}</fieldset>`).join("");
    page.querySelector("[data-add-tree]").disabled = trees.length >= 4;
  }
  rows(); invalidate();
  form.addEventListener("input", () => { invalidate(); persist(); });
  form.addEventListener("change", () => { invalidate(); persist(); });
  page.querySelector("[data-add-tree]").addEventListener("click", () => {
    trees = treeInputs();
    if (trees.length === 4) return;
    trees.push({ height: "", age: "" }); rows(); invalidate(); persist();
  });
  form.addEventListener("click", event => {
    const button = event.target.closest("[data-remove-tree]");
    if (!button) return;
    trees = treeInputs().filter((_, i) => i !== Number(button.dataset.removeTree));
    rows(); invalidate(); persist();
  });
  form.addEventListener("submit", event => {
    event.preventDefault(); persist();
    const input = { ...values(form), ageType: "breast", trees: treeInputs() };
    const output = calculateFieldSI(input);
    if (output.error) { result.innerHTML = `<p class="field-tools__error" role="alert">${escapeHtml(output.error)}</p>`; return; }
    const range = (a, b, digits = 0) => Math.abs(a - b) < 1e-9 ? formatNumber(a, digits) : `${formatNumber(a, digits)}–${formatNumber(b, digits)}`;
    const si = (a, b) => a === null ? "Ej beräknat" : output.code + range(a, b, 1);
    const label = si(output.siLow, output.siHigh);
    const total = range(output.totalAgeLow, output.totalAgeHigh, output.trees.length > 1 ? 1 : 0);
    const ageBasis = output.ageAdditionMode === "own" ? `eget tillägg ${output.addition[0]} år` : "schablontillägg 7–13 år";
    const report = `SI ${output.hasSI ? "cirka " : ""}${label}, H100. Totalålder ${total} år (${ageBasis}).\n${output.trees.map((t, i) => `Träd ${i + 1}: ${formatNumber(t.height)} m, BH-ålder ${t.age} år, totalålder ${range(t.totalAgeLow, t.totalAgeHigh)} år, SI ${si(t.siLow, t.siHigh)}.`).join("\n")}\nUnderlag: ${SI_SOURCE.title}, ${SI_SOURCE.version}. Ålderstillägg: Skogskunskap / egen uppgift. Spannet är inte en statistisk felmarginal.${output.limitation ? `\n${output.limitation}` : ""}`;
    result.innerHTML = `<span class="pill">SLU-funktion · ${output.ageAdditionMode === "own" ? "eget ålderstillägg" : "uppskattad totalålder"}</span><h3>Ståndortsindex, H100</h3><strong class="field-tools__value">${output.hasSI ? "≈ " : ""}${label}</strong><div class="field-tools__age-result"><span>Beräknad totalålder${output.trees.length > 1 ? ", medel" : ""}</span><strong data-total-age>${total} år</strong><small>${escapeHtml(ageBasis)}</small></div>${output.limitation ? `<p class="field-tools__error">${output.limitation}</p>` : ""}<p>${output.trees.length} provträd · medel av individuella SI</p><ul class="field-tools__readings">${output.trees.map((t, i) => `<li class="field-tools__tree-result"><span>Träd ${i + 1} · BH ${t.age} år<br>Totalålder ${range(t.totalAgeLow, t.totalAgeHigh)} år</span><strong>${si(t.siLow, t.siHigh)}</strong></li>`).join("")}</ul><p class="field-tools__muted">${output.ageAdditionMode === "range" ? "Schablonen kan underskatta åldern hos undertryckta träd. " : ""}SI-spannet följer åldersantagandet och är inte en statistisk felmarginal.</p>${noteAction()}`;
    wireNoteAction(page, report);
  });
  return page;
}

export function renderCirclePlotView() {
  const page = pageShell("Stamantal", "circle-plot");
  const draft = getStoredValue("circlePlotDraftV1", { size: "100", radius: "", count: "" });
  let plots = getStoredValue("circlePlotObservationsV1", []);
  if (!Array.isArray(plots)) plots = [];
  page.insertAdjacentHTML("beforeend", `<div class="field-tools__layout"><form class="form field-tools__form" data-circle-form>
    ${select("size", "Provytans storlek", [...PLOT_PRESETS.map(p => [p.id, `${p.area} m² · radie ${formatNumber(p.radius, 2)} m`]), ["custom", "Egen radie"]], draft.size)}
    <div data-custom-radius>${number("radius", "Radie (m)", draft.radius)}</div>
    <div class="field-tools__counter"><button class="button button--secondary" type="button" data-count-step="-1" aria-label="Minska antal stammar">−</button>${number("count", "Antal stammar på provytan", draft.count)}<button class="button button--secondary" type="button" data-count-step="1" aria-label="Öka antal stammar">+</button></div>
    <button class="button" type="submit">Lägg till provyta</button><p class="field-tools__muted" data-save-status role="status"></p>
    </form><section class="field-tools__result" data-circle-result aria-live="polite"><h3>Stamantal per hektar</h3><p>Räkna stammar inom provytan och lägg till varje provyta.</p></section></div>
    <section class="field-tools__notes" data-circle-list aria-label="Sparade provytor"></section>
    <div class="field-tools__toolbar"><button class="button button--secondary" type="button" data-undo-plot disabled>Ångra senaste</button><button class="button button--secondary" type="button" data-clear-plots>Rensa provytor</button></div>
    <details class="field-tools__source"><summary>Så räknas det</summary><p>Stamantal per hektar = antal stammar på provytan × 10 000 / provytans area. Flera provytor sammanställs som totalt antal stammar delat med total provytearea.</p><p>Räkna bara träd som står inom provytans radie enligt fältmetoden. Detta är en geometrisk omräkning, inte en skoglig gräns eller gallringsregel.</p><p><a href="${CIRCLE_PLOT_SOURCE}" target="_blank" rel="noopener">Skogskunskap: Cirkelprovyta</a> · <a href="https://www.skogskunskap.se/ordlista/c/cirkelprovyta/" target="_blank" rel="noopener">Storlek och radie</a></p></details>`);
  const form = page.querySelector("[data-circle-form]");
  const result = page.querySelector("[data-circle-result]");
  const list = page.querySelector("[data-circle-list]");
  const customRadius = page.querySelector("[data-custom-radius]");
  const formatResult = output => output.error ? `<p class="field-tools__error" role="alert">${escapeHtml(output.error)}</p>` : `<h3>Stamantal per hektar</h3><strong class="field-tools__value">${formatNumber(output.stemsPerHa, 0)} <small>stammar/ha</small></strong><p>${output.count} stammar på ${formatNumber(output.area, 2)} m² · omräkningsfaktor ${formatNumber(output.factor, 1)}</p>`;
  function current() { return calculateCirclePlot(values(form)); }
  function persist() { saveDraft(page, "circlePlotDraftV1", values(form)); }
  function render() {
    const summary = summarizeCirclePlots(plots);
    list.innerHTML = plots.length ? `<h3>Sparade provytor</h3><ul class="field-tools__readings">${plots.slice().reverse().map((plot, index) => `<li><span>Provyta ${plots.length - index} · ${plot.count} stammar · ${formatNumber(plot.area, 2)} m²</span><strong>${formatNumber(plot.count * 10000 / plot.area, 0)} st/ha</strong></li>`).join("")}</ul>${summary.error ? `<p class="field-tools__error">${escapeHtml(summary.error)}</p>` : `<p class="field-tools__muted">Sammanlagt ${summary.plotCount} provytor: <strong>${formatNumber(summary.stemsPerHa, 0)} stammar/ha</strong>.</p>`}` : "<p class=\"field-tools__muted\">Inga sparade provytor ännu.</p>";
    page.querySelector("[data-undo-plot]").disabled = !plots.length;
  }
  function update() {
    customRadius.hidden = form.elements.size.value !== "custom";
    const output = current();
    result.innerHTML = formatResult(output);
    page.querySelector("[data-count-step='-1']").disabled = !Number(fieldNumberSafe(form.elements.count.value));
  }
  function fieldNumberSafe(value) { const n = Number(String(value ?? "").replace(",", ".")); return Number.isSafeInteger(n) && n >= 0 ? n : 0; }
  form.addEventListener("input", () => { persist(); update(); });
  form.addEventListener("change", () => { persist(); update(); });
  page.querySelectorAll("[data-count-step]").forEach(button => button.addEventListener("click", () => {
    const count = fieldNumberSafe(form.elements.count.value) + Number(button.dataset.countStep);
    form.elements.count.value = String(Math.max(0, count)); persist(); update();
  }));
  form.addEventListener("submit", event => {
    event.preventDefault();
    const output = current();
    if (output.error) { result.innerHTML = formatResult(output); return; }
    plots.push({ count: output.count, size: output.size, radius: output.radius, area: output.area });
    setStoredValue("circlePlotObservationsV1", plots);
    form.elements.count.value = "";
    persist(); update(); render();
    result.innerHTML = formatResult(output);
    showToast("Provyta tillagd.");
  });
  page.querySelector("[data-undo-plot]").addEventListener("click", () => { plots.pop(); setStoredValue("circlePlotObservationsV1", plots); render(); update(); });
  page.querySelector("[data-clear-plots]").addEventListener("click", () => { plots = []; setStoredValue("circlePlotObservationsV1", plots); render(); update(); });
  update(); render();
  return page;
}

export function renderYoungVolumeView() {
  const page = pageShell("Volym i ungskog", "young-volume");
  const draft = getStoredValue("youngVolumeDraftV1", { method: "basal", species: "conifer" });
  page.insertAdjacentHTML("beforeend", `<div class="field-tools__layout"><form class="form field-tools__form" id="young-volume-form" data-volume-form>
    ${select("method", "Beräkningsunderlag", [["basal", "Grundyta och höjd"], ["stems", "Stamantal och höjd"]], draft.method)}
    <div class="field-tools__grid">${number("height", "Grundytevägd medelhöjd (m)", draft.height)}<div data-basal>${number("basalArea", "Grundyta (m²/ha)", draft.basalArea)}</div><div data-stems>${number("stems", "Stamantal (st/ha)", draft.stems)}</div></div>
    <div data-species>${select("species", "Bestånd", [["conifer", "Barr"], ["broadleaf", "Löv"], ["mixed", "Blandat / osäkert (spann)"]], draft.species)}</div>
    ${number("area", "Areal (ha, valfritt)", draft.area)}
    <button class="button" type="submit">Beräkna volym</button><p class="field-tools__muted" data-save-status role="status"></p>
    </form><section class="field-tools__result" data-volume-result aria-live="polite"><h3>Volym från bildunderlag</h3><p>Ange höjd och grundyta eller stamantal.</p></section></div>
    <details class="field-tools__source" data-plot><summary>Stamantal från cirkelprovyta</summary><div class="field-tools__grid">${number("plotCount", "Räknade stammar", draft.plotCount)}${number("plotRadius", "Provyteradie (m)", draft.plotRadius)}</div><p data-plot-result role="status"></p><button class="button button--secondary" type="button" data-use-plot>Använd stamantal</button></details>
    ${sourceDetails("./assets/field/young-volume.png", "Användarens två diagram för volym i ungskog, uppladdade 2026-09-29. Utgivare och årtal saknas i bildutdraget. Höjden avser grundytevägd medelhöjd, inte övre höjd. Stamantalsbildens övre kant används för barr och nedre för löv. Blandat visas som ett spann mellan dem, utan antagen trädslagsblandning.")}`);
  const form = page.querySelector("form");
  const result = page.querySelector("[data-volume-result]");
  page.querySelectorAll("[data-plot] input").forEach(input => input.setAttribute("form", form.id));
  const plotCount = page.querySelector('[name="plotCount"]');
  const plotRadius = page.querySelector('[name="plotRadius"]');
  function update() {
    const stems = form.elements.method.value === "stems";
    page.querySelector("[data-basal]").hidden = stems;
    page.querySelector("[data-stems]").hidden = !stems;
    page.querySelector("[data-species]").hidden = !stems;
    const count = calculatePlotStems(plotCount.value, plotRadius.value);
    page.querySelector("[data-plot-result]").textContent = count === null ? "Ange antal och radie." : `${formatNumber(count, 0)} stammar/ha`;
    page.querySelector("[data-use-plot]").disabled = count === null;
  }
  function changed() { update(); saveDraft(page, "youngVolumeDraftV1", values(form)); result.innerHTML = "<h3>Volym från bildunderlag</h3><p>Indata ändrad. Beräkna volym för aktuella värden.</p>"; }
  form.addEventListener("input", changed);
  form.addEventListener("change", changed);
  page.querySelector("[data-plot]").addEventListener("input", () => {
    update(); saveDraft(page, "youngVolumeDraftV1", values(form));
  });
  page.querySelector("[data-use-plot]").addEventListener("click", () => {
    const count = calculatePlotStems(plotCount.value, plotRadius.value);
    if (count === null) return;
    form.elements.method.value = "stems";
    form.elements.stems.value = String(Math.round(count)); changed();
  });
  form.addEventListener("submit", event => {
    event.preventDefault(); saveDraft(page, "youngVolumeDraftV1", values(form));
    const output = calculateYoungVolume(values(form));
    if (output.error) { result.innerHTML = `<p class="field-tools__error" role="alert">${escapeHtml(output.error)}</p>`; return; }
    const rounded = v => formatNumber(Math.round(v / 5) * 5, 0);
    const label = output.volume === null ? `${rounded(output.lower)}–${rounded(output.upper)}` : rounded(output.volume);
    const total = output.area === null ? "" : `<p>Totalt på ${formatNumber(output.area, 2)} ha: <strong>≈ ${output.total === null ? `${rounded(output.lower * output.area)}–${rounded(output.upper * output.area)}` : rounded(output.total)} m³sk</strong></p>`;
    const report = `Ungskogsvolym cirka ${label} m³sk/ha (diagramavläsning).\n${form.elements.method.value === "basal" ? `Grundyta ${form.elements.basalArea.value} m²/ha` : `Stamantal ${form.elements.stems.value} st/ha, ${form.elements.species.selectedOptions[0].textContent}`}, grundytevägd medelhöjd ${form.elements.height.value} m.${output.area === null ? "" : ` Areal ${formatNumber(output.area, 2)} ha. Total cirka ${output.total === null ? `${rounded(output.lower * output.area)}–${rounded(output.upper * output.area)}` : rounded(output.total)} m³sk.`}\nUnderlag: ${FIELD_REFERENCE_VERSION}. Ungefärlig bildavläsning, avrundad till 5 m³sk.`;
    result.innerHTML = `<span class="pill">Ungefärlig diagramavläsning</span><h3>Volym per hektar</h3><strong class="field-tools__value">≈ ${label} <small>m³sk/ha</small></strong>${total}<p>Avrundat till 5 m³sk. ${output.volume === null ? "Spannet följer löv- och barrkanterna i bilden; det är inte en statistisk felmarginal." : "Avrundningen är inte ett mått på noggrannhet."}</p>${noteAction()}`;
    wireNoteAction(page, report);
  });
  update();
  return page;
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function renderFieldNotesView() {
  const page = pageShell("Fältanteckningar", "field-notes");
  let entries = notes();
  let removed = null;
  page.insertAdjacentHTML("beforeend", `<div class="field-tools__toolbar"><button class="button" data-add-note>Ny avdelning</button><button class="button button--secondary" data-export-text>Exportera text</button><button class="button button--secondary" data-backup>Säkerhetskopia</button></div><p class="field-tools__muted">Sparas på denna enhet. Exportera en säkerhetskopia innan du rensar webbläsardata eller byter enhet.</p><p data-save-status role="status"></p><button class="button button--secondary" data-undo-note hidden>Ångra borttagning</button><section class="field-tools__notes" data-notes aria-label="Avdelningar"></section><details class="field-tools__source"><summary>Återställ säkerhetskopia</summary><label class="field"><span>Anteckningsfil (.json)</span><input type="file" accept=".json,application/json" data-import-notes></label><p>Befintliga anteckningar behålls. Importerade avdelningar läggs till som kopior.</p></details>`);
  function persist() {
    const ok = setStoredValue(NOTES_KEY, entries);
    page.querySelector("[data-save-status]").textContent = ok ? "Sparat på denna enhet" : "Kunde inte spara. Exportera text eller säkerhetskopia innan du lämnar sidan.";
  }
  function render() {
    page.querySelector("[data-notes]").innerHTML = entries.length ? entries.map(n => `<article class="field-tools__note" data-note="${escapeHtml(n.id)}"><div class="field-tools__grid"><label class="field"><span>Fastighet</span><input class="input" data-note-field="property" value="${escapeHtml(n.property)}" autocomplete="off"></label><label class="field"><span>Avdelning</span><input class="input" data-note-field="department" value="${escapeHtml(n.department)}" autocomplete="off"></label></div><label class="field"><span>Anteckning</span><textarea class="textarea" data-note-field="text" aria-label="Anteckning" rows="5">${escapeHtml(n.text)}</textarea></label><div class="field-tools__note-footer"><time>${escapeHtml(new Date(n.updatedAt).toLocaleString("sv-SE"))}</time><button class="field-tools__remove" data-remove-note="${escapeHtml(n.id)}" title="Ta bort avdelning" aria-label="Ta bort avdelning ${escapeHtml(n.department)}">×</button></div></article>`).join("") : "<p>Inga avdelningar ännu.</p>";
  }
  page.querySelector("[data-add-note]").addEventListener("click", () => {
    entries.unshift({ id: crypto.randomUUID(), property: entries[0]?.property || "", department: "", text: "", updatedAt: stamp() });
    render(); persist(); page.querySelector('[data-note-field="department"]').focus();
  });
  page.querySelector("[data-notes]").addEventListener("input", event => {
    const key = event.target.dataset.noteField;
    if (!key) return;
    const row = event.target.closest("[data-note]");
    const note = entries.find(n => n.id === row.dataset.note);
    note[key] = event.target.value; note.updatedAt = stamp();
    row.querySelector("time").textContent = new Date(note.updatedAt).toLocaleString("sv-SE");
    persist();
  });
  page.querySelector("[data-notes]").addEventListener("click", event => {
    const button = event.target.closest("[data-remove-note]");
    if (!button) return;
    removed = entries.find(n => n.id === button.dataset.removeNote);
    entries = entries.filter(n => n !== removed); persist(); render();
    page.querySelector("[data-undo-note]").hidden = false;
  });
  page.querySelector("[data-undo-note]").addEventListener("click", () => {
    if (removed) entries.unshift(removed);
    removed = null; persist(); render(); page.querySelector("[data-undo-note]").hidden = true;
  });
  page.querySelector("[data-export-text]").addEventListener("click", () => {
    download("skogskalkyl-faltanteckningar.txt", entries.map(n => `${n.property || "Fastighet saknas"} / Avdelning ${n.department || "saknas"}\n${new Date(n.updatedAt).toLocaleString("sv-SE")}\n${n.text}`).join("\n\n--------------------\n\n"), "text/plain;charset=utf-8");
  });
  page.querySelector("[data-backup]").addEventListener("click", () => {
    download("skogskalkyl-faltanteckningar.json", JSON.stringify({ version: 1, exportedAt: stamp(), entries }, null, 2), "application/json");
  });
  page.querySelector("[data-import-notes]").addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error("Filen är för stor (max 2 MB).");
      const payload = JSON.parse(await file.text());
      if (payload.version !== 1 || !Array.isArray(payload.entries) || payload.entries.length > 1000 || payload.entries.some(n => !n || ["property", "department", "text"].some(k => typeof n[k] !== "string"))) throw new Error("Filen är inte en giltig anteckningskopia.");
      const imported = payload.entries.map(n => ({ id: crypto.randomUUID(), property: n.property, department: n.department, text: n.text, updatedAt: stamp() }));
      entries = [...imported, ...entries]; persist(); render();
    } catch (error) { showToast(error.message); }
    event.target.value = "";
  });
  render();
  return page;
}
