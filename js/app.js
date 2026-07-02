import { createAppShell, showToast } from "./ui.js";
import { startRouter } from "./router.js";
import { initTheme } from "./theme.js";

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => showToast("Offline-stöd är aktiverat."))
      .catch((error) => console.warn("Service worker kunde inte registreras", error));
  });
}

function boot() {
  initTheme();
  createAppShell();
  startRouter();
  registerServiceWorker();
}

boot();
