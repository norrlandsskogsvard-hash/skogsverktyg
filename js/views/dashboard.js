import { MODULE_STATUS } from "../config.js";
import { createPageHeader } from "../ui.js";

const modules = [
  { title: "DGV", href: "#/dgv", status: MODULE_STATUS.dgv, text: "Struktur för diametergrundytevägd volym är redo." },
  { title: "Medelhöjd", href: "#/height", status: MODULE_STATUS.height, text: "Provträdsflöde och beräkningsmodul är förberett." },
  { title: "Röjning", href: "#/rojning", status: MODULE_STATUS.rojning, text: "Snabb kalkyl för hektar, täthet och svårighetsgrad." },
  { title: "Planpris", href: "#/forest-plan-pricing", status: MODULE_STATUS.forestPlanPricing, text: "Prissätt skogsbruksplan med areal och fältdagar." },
  { title: "Offert", href: "#/quote", status: MODULE_STATUS.quote, text: "Skapa enkel offertsummering med moms." }
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
          "<li class='status-item'><span>DGV och höjd</span><strong>Nästa steg</strong></li>" +
        "</ul>" +
      "</div></div>" +
    "</section>" +
    "<section class='content-grid' aria-label='Moduler'>" + modules.map(moduleCard).join("") + "</section>"
  );
  return page;
}

function moduleCard(module) {
  return "<article class='card module-card span-4'><div class='card__body'>" +
    "<span class='pill'>" + module.status + "</span>" +
    "<h3 class='card__title'>" + module.title + "</h3>" +
    "<p class='card__text'>" + module.text + "</p>" +
    "<div class='module-card__footer'><span>Öppna modul</span><a class='button button--secondary' href='" + module.href + "'>Gå vidare</a></div>" +
  "</div></article>";
}
