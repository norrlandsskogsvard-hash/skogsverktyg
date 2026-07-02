import { APP_VERSION, NAV_ITEMS } from "./config.js";

export function createAppShell() {
  const app = document.querySelector("#app");
  app.innerHTML = shellTemplate();
}

function shellTemplate() {
  return "<div class='app-layout'>" +
    "<aside class='sidebar' aria-label='Huvudmeny'>" +
      "<div class='brand'><span class='brand__title'>Skogskalkyl 2.0</span><span class='brand__version'>v" + APP_VERSION + "</span></div>" +
      "<nav><ul class='nav-list'>" + NAV_ITEMS.map(navItemTemplate).join("") + "</ul></nav>" +
    "</aside>" +
    "<main class='main-area'>" +
      "<header class='topbar'>" +
        "<div><h1 class='topbar__title' id='view-title'>Start</h1><span class='topbar__meta'>Offline-redo fältapp</span></div>" +
        "<a class='button button--secondary' href='#/settings'>Inställningar</a>" +
      "</header>" +
      "<section id='view' class='page' tabindex='-1'></section>" +
    "</main>" +
    "<nav class='bottom-nav' aria-label='Mobilmeny'>" + NAV_ITEMS.filter((item) => item.primary).map(navLinkTemplate).join("") + "</nav>" +
  "</div>";
}

function navItemTemplate(item) {
  return "<li>" + navLinkTemplate(item) + "</li>";
}

function navLinkTemplate(item) {
  return "<a class='nav-link' href='" + item.hash + "' data-route-link='" + item.id + "'>" +
    "<span class='nav-icon' aria-hidden='true'>" + item.icon + "</span>" +
    "<span class='nav-label'>" + item.label + "</span>" +
  "</a>";
}

export function setActiveNavigation(routeId) {
  document.querySelectorAll("[data-route-link]").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.routeLink === routeId);
  });
}

export function setViewTitle(title) {
  const titleNode = document.querySelector("#view-title");
  if (titleNode) {
    titleNode.textContent = title;
  }
  document.title = title + " - Skogskalkyl 2.0";
}

export function createPageHeader(title, lead) {
  const header = document.createElement("header");
  header.className = "page-header";
  header.innerHTML = "<h2 class='page-title'>" + escapeHtml(title) + "</h2><p class='page-lead'>" + escapeHtml(lead) + "</p>";
  return header;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value, digits = 1) {
  return new Intl.NumberFormat("sv-SE", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(Number.isFinite(value) ? value : 0);
}

export function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

export function getFormNumber(form, name, fallback = 0) {
  const value = Number.parseFloat(form.elements[name]?.value ?? "");
  return Number.isFinite(value) ? value : fallback;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
