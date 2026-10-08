import { useCallback, useEffect, useState } from "react";

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

/**
 * The site's light/dark mode, on <html> like everywhere in the registry. Kept
 * apart from the theme editor's own mode; the editor removes the class when it
 * unmounts, and this puts it back. Other tabs and preview iframes follow along.
 */
export function useMode() {
  const [mode, setModeState] = useState<Mode>("light");

  useEffect(() => {
    const current = readMode();
    setModeState(current);
    applyMode(current);
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      const next = readMode();
      setModeState(next);
      applyMode(next);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    applyMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode: the toggle still works for this page.
    }
  }, []);

  return { mode, setMode };
}
