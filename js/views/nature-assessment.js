import { createPageHeader, escapeHtml, showToast } from "../ui.js";
import { getStoredValue, setStoredValue } from "../storage.js";
import { attachMeasurementTransfer } from "./measurement-transfer.js";
import { assessNature, natureQuestions, natureReport, NATURE_SECTIONS, NATURE_GROUPS, NATURE_PARENTS, NATURE_SCOPE_BASIS } from "../calculators/natureCalculator.js";

const KEY = "natureAssessmentsV1";
const fresh = () => ({ group: "Ot", scope: "unknown", answers: {}, area: "", observations: "", species: "", action: "" });
const selectOptions = (entries, value) => entries.map(([id, label]) => `<option value="${escapeHtml(id)}" ${id === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("");

export function renderNatureAssessmentView() {
  const page = document.createElement("div");
  page.className = "field-tools nature-field";
  page.append(createPageHeader("Naturvärdesbedömning", ""));
  let archive = getStoredValue(KEY, {});
  if (!archive || typeof archive !== "object" || Array.isArray(archive)) archive = {};
  const readNotes = () => { const notes = getStoredValue("fieldNotesV1", []); return Array.isArray(notes) ? notes : []; };
  let workingId = getStoredValue("activeFieldNoteV1", "");
  if (!readNotes().some(n => n.id === workingId)) workingId = "standalone";
  let draft;
  let index = 0;
  page.insertAdjacentHTML("beforeend", `
    <div class="nature-field__context">
      <label class="field"><span>Arbetsavdelning</span><select class="select" data-nature-department></select></label>
      <label class="field"><span>Biotopgrupp</span><select class="select" data-nature-group>${selectOptions([...Object.entries(NATURE_GROUPS).map(([id,label]) => [id, `${id} · ${label}`]), ["all", "Osäker / jämför alla"]], "Ot")}</select></label>
    </div>
    <details class="field-tools__source" data-nature-context>
      <summary>Område, areal och fältbild</summary>
      <div class="form">
        <label class="field"><span>Regionalt underlag</span><select class="select" data-draft="scope">${selectOptions([["unknown", "Område ej bekräftat"], ["boreal", "Boreal zon"], ["north", "Västerbotten / Norrbotten (rättad rubrik)"], ["other", "Annan region / fjällnära"]], "unknown")}</select></label>
        <p class="field-tools__muted">${NATURE_SCOPE_BASIS}</p>
        <label class="field"><span>Bedömd areal (ha)</span><input class="input" data-draft="area" inputmode="decimal"></label>
        <label class="field"><span>Fältbild / avgränsning</span><textarea class="textarea" data-draft="observations" rows="3"></textarea></label>
      </div>
    </details>
    <section class="nature-field__status" data-nature-status aria-live="polite"></section>
    <div class="nature-field__workspace">
      <div class="nature-field__stepbar"><label class="field"><span>Delområde</span><select class="select" data-nature-section>${NATURE_SECTIONS.map((label,i) => `<option value="${i}">${label}</option>`).join("")}</select></label><label class="nature-field__auto"><input type="checkbox" data-auto-next checked> Gå vidare efter svar</label></div>
      <section class="nature-field__question" data-nature-question aria-live="polite"></section>
      <div class="nature-field__navigation"><button class="button button--secondary" data-prev title="Föregående fråga" aria-label="Föregående fråga">‹</button><button class="button button--secondary" data-unanswered>Nästa obesvarade</button><button class="button button--secondary" data-next title="Nästa fråga" aria-label="Nästa fråga">›</button></div>
      <p class="field-tools__muted" data-nature-save role="status"></p>
    </div>
    <details class="field-tools__source"><summary>Arter, hänsyn och egna förslag</summary><div class="form">
      <label class="field"><span>Arter / kulturlämningar</span><textarea class="textarea" data-draft="species" rows="3"></textarea></label>
      <label class="field"><span>Eget skötselförslag / nästa kontroll</span><textarea class="textarea" data-draft="action" rows="3"></textarea></label>
    </div></details>
    <details class="field-tools__source"><summary>Översikt över svar och poäng</summary><div data-nature-overview></div></details>
    <div class="field-tools__toolbar"><button class="button button--secondary" data-export-nature>Exportera underlag</button><button class="button button--secondary" data-reset-nature>Nytt underlag i denna avdelning</button></div>
    <details class="field-tools__source"><summary>Bedömningsstöd och källor</summary>
      <p>Skogsbiologerna AB: användarens PDF 5214_borealexcel_-_2_sidig.pdf (Borealexcel2004) och manual 5213_Norrborealman2015 (1).doc, Drakenberg/Lindhe 2015. Originalfilerna ingår inte i appen.</p>
      <p>Varje ring i PDF-blanketten motsvarar en poäng i sin biotopkolumn. Frågor 1–40 ger ståndortspoäng, 41–80 beståndspoäng. Flera betyder i genomsnitt mer än två per hektar. Påtagligt innebär ett tydligt inslag utan särskilt letande. Diametrar mäts i brösthöjd, för lågor vid grovändan.</p>
      <p>Högre mängd- eller kvalitetsnivå inkluderar tidigare nivåer för samma företeelse. Ja på en sådan fråga räknar med tidigare nivåer; uttryckligt Nej på dessa flaggas som motsägelse. Obesvarat och osäkert är inte Nej.</p>
      <p>Poäng jämförs inom samma region och biotopgrupp. Areal, landskap, artfynd och objektets sammanhang måste bedömas separat. Ingen automatisk naturvärdesklass, skyddsstatus eller juridisk kontroll görs. Olika delbestånd bör få egna underlag.</p>
    </details>`);
  const workSelect = page.querySelector("[data-nature-department]");
  const groupSelect = page.querySelector("[data-nature-group]");
  function departments() {
    workSelect.innerHTML = selectOptions([["standalone", "Fristående underlag"], ...readNotes().map(n => [n.id, [n.property,n.department].filter(Boolean).join(" / ") || "Namnlös avdelning"])], workingId);
  }
  function persist() {
    draft.questionId = natureQuestions(draft.group)[index]?.id;
    archive[workingId] = { ...draft, updatedAt: new Date().toISOString() };
    page.querySelector("[data-nature-save]").textContent = setStoredValue(KEY, archive) ? "Sparat på denna enhet" : "Kunde inte spara. Behåll sidan öppen och exportera underlaget.";
  }
  function load() {
    draft = { ...fresh(), ...archive[workingId] };
    if (!draft.answers || typeof draft.answers !== "object" || Array.isArray(draft.answers)) draft.answers = {};
    if (!Object.hasOwn(NATURE_GROUPS, draft.group) && draft.group !== "all") draft.group = "Ot";
    groupSelect.value = draft.group;
    for (const field of page.querySelectorAll("[data-draft]")) field.value = draft[field.dataset.draft] || "";
    page.querySelector("[data-nature-context]").open = draft.scope === "unknown";
    index = Math.max(0, natureQuestions(draft.group).findIndex(q => q.id === draft.questionId));
    departments(); render();
  }
  function render() {
    const items = natureQuestions(draft.group);
    index = Math.min(Math.max(index, 0), items.length - 1);
    const item = items[index];
    const result = assessNature(draft);
    const inherited = result.effectiveYes.includes(item.id) && draft.answers[item.id] !== "yes";
    const answer = inherited && draft.answers[item.id] !== "no" ? "yes" : draft.answers[item.id];
    const parent = (NATURE_PARENTS[item.id] || []).map(id => natureQuestions().find(q => q.id === id));
    page.querySelector("[data-nature-section]").value = String(item.section);
    page.querySelector("[data-nature-question]").innerHTML = `<div class="nature-field__question-head"><span>${NATURE_SECTIONS[item.section]} · ${index + 1}/${items.length}</span><button class="field-tools__remove" data-clear-answer title="Återställ svar" aria-label="Återställ svar">↺</button></div><h3 data-question-id="${item.id}"><small>${item.id}.</small> ${escapeHtml(item.text)}</h3>${/^Som ovan/.test(item.text) ? `<p class="field-tools__muted">Avser: ${escapeHtml(parent[0]?.text || "föregående fråga")}</p>` : ""}<p class="nature-field__basis">${item.id > 40 ? "Bedöm som genomsnitt per hektar." : "Bedöm förekomst inom hela objektet."}${inherited ? " Ingår genom Ja på högre nivå." : ""}</p><div class="nature-field__answers" role="group" aria-label="Svar på fråga ${item.id}">${[["no","Nej"],["uncertain","Osäker"],["yes","Ja"]].map(([id,label]) => `<button class="button button--secondary" data-answer="${id}" aria-pressed="${answer === id}">${label}</button>`).join("")}</div>`;
    const selected = result.balance.filter(b => draft.group === "all" || b.code === draft.group);
    page.querySelector("[data-nature-status]").innerHTML = `<div><strong>${result.assessedCount}/${result.relevantCount} bedömda</strong><span>${result.complete ? "Frågorna genomgångna" : `${result.unanswered.length} kvar · ${result.uncertain.length} osäkra`}</span></div><div><strong>${result.scoreAllowed ? selected.map(b => `${b.code} ${b.total} p`).join(" · ") : "Observationsläge"}</strong><span>${result.scoreAllowed ? "Observerade poäng, ej naturvärdesklass" : "Regional poängversion ej bekräftad"}</span></div>${result.conflicts.length ? `<p class="field-tools__error">Motsägande svar: ${result.conflicts.map(i => i.id).join(", ")}. Kontrollera tidigare nivåer.</p>` : ""}`;
    page.querySelector("[data-prev]").disabled = index === 0;
    if (result.conflicts.length) {
      const controls = document.createElement("div"); controls.className = "nature-field__conflicts";
      controls.innerHTML = result.conflicts.map(q => `<button class="button button--secondary" data-jump="${q.id}">Kontrollera fråga ${q.id}</button>`).join("");
      page.querySelector("[data-nature-status]").append(controls);
    }
    page.querySelector("[data-next]").disabled = index === items.length - 1;
    page.querySelector("[data-nature-overview]").innerHTML = `${result.scoreAllowed ? `<ul class="field-tools__readings">${selected.map(b => `<li>${b.code} · ${NATURE_GROUPS[b.code]}<strong>${b.site} + ${b.stand} = ${b.total} p</strong></li>`).join("")}</ul>` : "<p>Poäng visas inte utanför PDF-blankettens område.</p>"}<ul class="nature-field__review">${items.map(q => `<li><button data-jump="${q.id}">${q.id}. ${escapeHtml(q.text)} <strong>${draft.answers[q.id] === "no" ? "Nej" : result.effectiveYes.includes(q.id) ? "Ja" : draft.answers[q.id] === "uncertain" ? "Osäker" : "Ej bedömd"}</strong></button></li>`).join("")}</ul>`;
  }
  workSelect.addEventListener("change", () => {
    persist(); workingId = workSelect.value;
    if (workingId !== "standalone") setStoredValue("activeFieldNoteV1", workingId);
    load();
    const target = page.querySelector("[data-measurement-target]");
    if (target) target.value = workingId === "standalone" ? "" : workingId;
  });
  workSelect.addEventListener("focus", departments);
  groupSelect.addEventListener("change", () => { draft.group = groupSelect.value; index = 0; persist(); render(); });
  page.querySelectorAll("[data-draft]").forEach(field => field.addEventListener("input", () => { draft[field.dataset.draft] = field.value; persist(); render(); }));
  page.addEventListener("click", event => {
    const answer = event.target.closest("[data-answer]");
    const items = natureQuestions(draft.group);
    if (answer) {
      draft.answers[items[index].id] = answer.dataset.answer;
      if (page.querySelector("[data-auto-next]").checked && index < items.length - 1) index++;
      persist(); render();
    }
    if (event.target.closest("[data-clear-answer]")) { delete draft.answers[items[index].id]; persist(); render(); }
    if (event.target.closest("[data-prev]")) { index--; persist(); render(); }
    if (event.target.closest("[data-next]")) { index++; persist(); render(); }
    if (event.target.closest("[data-unanswered]")) {
      const result = assessNature(draft);
      const pending = [...items.slice(index + 1), ...items.slice(0, index + 1)].find(q => result.unanswered.some(i => i.id === q.id) || result.uncertain.some(i => i.id === q.id) || result.conflicts.some(i => i.id === q.id));
      if (pending) { index = items.findIndex(q => q.id === pending.id); persist(); render(); }
      else showToast("Alla frågor i biotopgruppen är bedömda.");
    }
    const jump = event.target.closest("[data-jump]");
    if (jump) {
      const id = Number(jump.dataset.jump);
      if (!items.some(q => q.id === id)) { draft.group = "all"; groupSelect.value = "all"; }
      index = natureQuestions(draft.group).findIndex(q => q.id === id);
      persist(); render(); page.querySelector("[data-nature-question]").scrollIntoView({ block: "center" });
    }
  });
  page.querySelector("[data-nature-section]").addEventListener("change", event => { const next = natureQuestions(draft.group).findIndex(q => q.section === Number(event.target.value)); if (next >= 0) index = next; persist(); render(); });
  const autoNext = page.querySelector("[data-auto-next]");
  autoNext.checked = getStoredValue("natureAutoNextV1", true) === true;
  autoNext.addEventListener("change", () => setStoredValue("natureAutoNextV1", autoNext.checked));
  page.querySelector("[data-reset-nature]").addEventListener("click", () => {
    if (!confirm("Börja ett nytt underlag här? Exportera eller spara till avdelningsanteckningen först. Tidigare svar i arbetsunderlaget ersätts.")) return;
    archive[workingId] = fresh(); load(); persist();
  });
  page.querySelector("[data-export-nature]").addEventListener("click", () => {
    const report = natureReport(draft);
    if (!report) return showToast("Registrera en observation först.");
    const blob = new Blob([report.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `naturvarde-${new Date().toISOString().slice(0,10)}.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  load();
  attachMeasurementTransfer(page, () => natureReport(draft));
  return page;
}
