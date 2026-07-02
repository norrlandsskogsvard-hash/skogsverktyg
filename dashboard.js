import { DEFAULT_SETTINGS } from "./config.js";
import { getStoredValue, mergeStoredValue } from "./storage.js";

export function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  document.querySelector("meta[name='theme-color']")?.setAttribute(
    "content",
    nextTheme === "dark" ? "#101612" : "#1f6f4a"
  );
}

export function initTheme() {
  const settings = getStoredValue("settings", DEFAULT_SETTINGS);
  applyTheme(settings.theme);
}

export function setTheme(theme) {
  applyTheme(theme);
  mergeStoredValue("settings", { theme });
}
