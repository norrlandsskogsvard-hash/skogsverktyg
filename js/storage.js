const STORAGE_PREFIX = "skogskalkyl2";

function storageKey(key) {
  return STORAGE_PREFIX + ":" + key;
}

export function getStoredValue(key, fallback = null) {
  try {
    const raw = localStorage.getItem(storageKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn("Kunde inte läsa lokal lagring", error);
    return fallback;
  }
}

export function setStoredValue(key, value) {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Kunde inte spara lokal lagring", error);
    return false;
  }
}

export function removeStoredValue(key) {
  localStorage.removeItem(storageKey(key));
}

export function mergeStoredValue(key, value) {
  const current = getStoredValue(key, {});
  const next = { ...current, ...value };
  setStoredValue(key, next);
  return next;
}
