import { MODULE_STATUS } from "../config.js";
import { createPageHeader, escapeHtml } from "../ui.js";

const modules = [
  { title: "DGV", href: "#/dgv", status: MODULE_STATUS.dgv, text: "Beräkna diametergrundytevägd medeldiameter med snabb fältinmatning." },
  { title: "Medelhöjd", href: "#/height", status: MODULE_STATUS.height, text: "Mata in provträdshöjder och få medelhöjd och statistik direkt." },
  { title: "Skötselkollen", href: "#/skotselkollen", status: MODULE_STATUS.skotselkollen, text: "Röjning, gallring eller slutavverkning baserat på beståndsvärden, källmatris och lagkontroll." },
  { title: "Kurvgranskning", href: "#/curve-review", status: MODULE_STATUS.curveReview, text: "Kurvgranskning - för källarbete, inte fältbeslut. Spara manuella utkast lokalt och kopiera CSV-rad." },
  { title: "Röjning", href: "#/rojning", status: MODULE_STATUS.rojning, text: "Beräkna svårighet, tidsåtgång, pris per hektar och offertunderlag." },
  { title: "Planpris", href: "#/forest-plan-pricing", status: MODULE_STATUS.forestPlanPricing, text: "Prissätt skogsbruksplan med fältarbete, kontor, resa och påslag." },
  { title: "Offert", href: "#/quote", status: MODULE_STATUS.quote, text: "Skapa offert, importera kalkyler och skriv ut som PDF." },
  { title: "Kunder & jobb", href: "#/customers", status: MODULE_STATUS.customers, text: "Spara kunder, fastigheter och uppdrag lokalt på enheten." }
];

export function renderDashboardView() {
  const page = document.createElement("div");
  page.append(createPageHeader("Skogskalkyl 2.0", "Ett offline-redo appskal för fältarbete, kalkyler och offertunderlag."));
  page.insertAdjacentHTML("beforeend",
    "<section class='dashboard-hero'>" +
      "<div class='hero-panel'>" +
        "<span class='pill'>v2.0.0-alpha.1</span>" +
        "<h1>Fältkalkyler utan krångel</h1>" +
        "<p>Öppna rätt modul, fyll i underlaget och fortsätt även när täckningen försvinner.</p>" +
      "</div>" +
      "<div class='card'><div class='card__body'>" +
        "<h3 class='card__title'>Status</h3>" +
        "<ul class='status-list'>" +
          "<li class='status-item'><span>Appskal</span><strong>Klart</strong></li>" +
          "<li class='status-item'><span>Offline</span><strong>Aktivt</strong></li>" +
          "<li class='status-item'><span>Fältverktyg</span><strong>DGV, Höjd, Röjning, Planpris</strong></li>" +
          "<li class='status-item'><span>Affärsstöd</span><strong>Offert, Kunder</strong></li>" +
        "</ul>" +
      "</div></div>" +
    "</section>" +
    "<section class='content-grid' aria-label='Moduler'>" + modules.map(moduleCard).join("") + "</section>"
  );
  return page;
}

function moduleCard(module) {
  return "<article class='card module-card span-4'><div class='card__body'>" +
    "<span class='pill'>" + escapeHtml(module.status) + "</span>" +
    "<h3 class='card__title'>" + escapeHtml(module.title) + "</h3>" +
    "<p class='card__text'>" + escapeHtml(module.text) + "</p>" +
    "<div class='module-card__footer'><span>Öppna modul</span><a class='button button--secondary' href='" + escapeHtml(module.href) + "'>Gå vidare</a></div>" +
  "</div></article>";
}
