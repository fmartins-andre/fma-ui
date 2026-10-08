import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Mode = "light" | "dark";

const STORAGE_KEY = "fma-ui:mode";

/**
 * Inline in <head>: sets the `dark` class before the first paint, so a dark
 * reader doesn't see the page flash light while it hydrates.
 */
export const MODE_SCRIPT = `try{var m=localStorage.getItem("${STORAGE_KEY}");if(m==="dark"||(!m&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

function readMode(): Mode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyMode(mode: Mode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
}

// One mode for the whole page: the site header's toggle and the theme editor
// read and write the same value.
let current: Mode | undefined;
const listeners = new Set<() => void>();

function getSnapshot(): Mode {
  current ??= readMode();
  return current;
}

function setCurrent(next: Mode) {
  current = next;
  applyMode(next);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Other tabs and preview iframes follow along.
  function onStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) setCurrent(readMode());
  }
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The site's light/dark mode, on <html> like everywhere in the registry. */
export function useMode() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, () => "light" as const);

  useEffect(() => applyMode(mode), [mode]);

  const setMode = useCallback((next: Mode) => {
    setCurrent(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode: the toggle still works for this page.
    }
  }, []);

  return { mode, setMode };
}
