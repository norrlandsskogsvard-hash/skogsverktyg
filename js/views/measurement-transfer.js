import { getStoredValue, setStoredValue } from "../storage.js";
import { escapeHtml } from "../ui.js";

export function attachMeasurementTransfer(page, getReport) {
  const section = document.createElement("section");
  section.className = "measurement-transfer";
  section.innerHTML = `<h3>Spara i avdelning</h3><label class="field"><span>Avdelning</span><select class="select" data-measurement-target></select></label><details><summary>Ny avdelning</summary><div class="field-tools__grid"><label class="field"><span>Fastighet</span><input class="input" data-new-property></label><label class="field"><span>Avdelningsnummer</span><input class="input" data-new-department></label></div><button class="button button--secondary" type="button" data-create-department>Skapa avdelning</button></details><label class="field"><span>Kommentar till mätningen</span><textarea class="textarea" rows="2" data-measurement-comment></textarea></label><button class="button" type="button" data-transfer-measurement>Spara mätning i avdelning</button><p role="status" data-transfer-status></p><a href="#/field-notes">Öppna fältanteckningar</a>`;
  const module = page.querySelector(".field-module");
  if (module) module.append(section); else page.append(section);
  const select = section.querySelector("select");
  const status = section.querySelector("[data-transfer-status]");
  const commentInput = section.querySelector("textarea");
  const commentKey = `fieldCommentV1:${location.hash}`;
  commentInput.value = getStoredValue(commentKey, "");
  commentInput.addEventListener("input", () => {
    if (!setStoredValue(commentKey, commentInput.value)) status.textContent = "Kunde inte autospara kommentaren. Spara eller kopiera den innan du lämnar sidan.";
  });
  const readNotes = () => { const stored = getStoredValue("fieldNotesV1", []); return Array.isArray(stored) ? stored : []; };
  function refresh() {
    const active = getStoredValue("activeFieldNoteV1", "");
    select.innerHTML = `<option value="">Välj avdelning</option>` + readNotes().map(note => `<option value="${escapeHtml(note.id)}">${escapeHtml([note.property, note.department].filter(Boolean).join(" / ") || "Namnlös avdelning")}</option>`).join("");
    select.value = active;
  }
  refresh();
  select.addEventListener("change", () => setStoredValue("activeFieldNoteV1", select.value));
  section.querySelector("[data-create-department]").addEventListener("click", () => {
    const department = section.querySelector("[data-new-department]").value.trim();
    const property = section.querySelector("[data-new-property]").value.trim();
    if (!department) { status.textContent = "Ange avdelningsnummer."; return; }
    const note = { id: crypto.randomUUID(), property, department, text: "", updatedAt: new Date().toISOString() };
    if (!setStoredValue("fieldNotesV1", [note, ...readNotes()])) { status.textContent = "Kunde inte spara avdelningen. Lagringen kan vara full."; return; }
    setStoredValue("activeFieldNoteV1", note.id); refresh();
    section.querySelector("details").open = false;
    status.textContent = "Avdelning skapad.";
  });
  section.querySelector("[data-transfer-measurement]").addEventListener("click", () => {
    const report = getReport();
    if (!report) { status.textContent = "Lägg till mätvärden först."; return; }
    const notes = readNotes();
    const note = notes.find(item => item.id === select.value);
    if (!note) { status.textContent = "Välj eller skapa en avdelning."; return; }
    const comment = section.querySelector("textarea").value.trim();
    const updatedAt = new Date().toISOString();
    const reportText = typeof report === "string" ? report : report.text;
    const text = `${note.text}${note.text ? "\n\n" : ""}${new Date(updatedAt).toLocaleString("sv-SE")}\n${reportText}${comment ? "\nKommentar: " + comment : ""}`;
    const measurements = [...(Array.isArray(note.measurements) ? note.measurements : []), ...(typeof report === "object" ? [{ ...report, comment, recordedAt: updatedAt }] : [])];
    if (!setStoredValue("fieldNotesV1", notes.map(item => item.id === note.id ? { ...item, text, updatedAt, measurements } : item))) { status.textContent = "Kunde inte spara mätningen. Dina mätvärden finns kvar i verktyget."; return; }
    setStoredValue("activeFieldNoteV1", note.id);
    section.querySelector("textarea").value = "";
    setStoredValue(commentKey, "");
    status.textContent = `Mätningen är sparad i ${[note.property, note.department].filter(Boolean).join(" / ")}.`;
  });
}

export function attachHandPreference(page) {
  const workspace = page.querySelector(".field-workspace");
  const selector = document.createElement("div");
  selector.className = "field-hand-selector";
  selector.setAttribute("role", "group");
  selector.setAttribute("aria-label", "Hand för inmatning");
  selector.innerHTML = `<button type="button" data-hand="left">Vänster</button><button type="button" data-hand="right">Höger</button>`;
  workspace.prepend(selector);
  function apply(hand) {
    page.dataset.hand = hand === "left" ? "left" : "right";
    selector.querySelectorAll("button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.hand === page.dataset.hand)));
  }
  apply(getStoredValue("fieldHandV1", "right"));
  selector.addEventListener("click", event => {
    const button = event.target.closest("[data-hand]");
    if (button) { apply(button.dataset.hand); setStoredValue("fieldHandV1", button.dataset.hand); }
  });
}
