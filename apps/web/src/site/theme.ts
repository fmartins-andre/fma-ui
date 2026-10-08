import { useSyncExternalStore } from "react";
import {
  googleFontFamilies,
  googleFontsHref,
  initEditorState,
  loadThemeFonts,
  modeThemeVars,
  sameTheme,
  sharedThemeVars,
  type Theme,
  type ThemeEditorAction,
  type ThemeEditorState,
  ThemeSchema,
  themeEditorReducer,
} from "@/lib/theme/index";
import { DEFAULT_THEME } from "@/themes/index";
import {
  THEME_SNAPSHOT_KEY,
  THEME_STATE_KEY,
  THEME_STYLE_ID,
  type ThemeSnapshot,
} from "./theme-script";

// The site theme: one store for the whole site. The header's preset picker and
// the theme editor (/themes) both drive it, and every page — preview iframes and
// other tabs too — wears it.

function readStored(): ThemeEditorState | null {
  try {
    const raw = localStorage.getItem(THEME_STATE_KEY);
    if (!raw) return null;
    const json = JSON.parse(raw);
    const theme = ThemeSchema.safeParse(json.theme);
    const loaded = ThemeSchema.safeParse(json.loaded);
    if (!theme.success || !loaded.success) return null;
    return initEditorState(theme.data, loaded.data);
  } catch {
    return null;
  }
}

function block(selector: string, vars: Record<string, string>): string {
  const lines = Object.entries(vars).map(([name, value]) => `  ${name}: ${value};`);
  return `${selector} {\n${lines.join("\n")}\n}`;
}

/**
 * The theme as CSS that beats styles.css' `:root`/`.dark` by specificity, not
 * source order: Vite's dev server injects the stylesheet after the head script
 * runs. Each mode's vars only apply in that mode, like the inline styles the
 * editor used to set, so a theme without dark shadows keeps the default ones.
 */
function themeCss(theme: Theme): string {
  return [
    block(":root:root", sharedThemeVars(theme)),
    block(":root:root:not(.dark)", modeThemeVars(theme, "light")),
    block(":root:root.dark", modeThemeVars(theme, "dark")),
  ].join("\n\n");
}

function snapshot(theme: Theme): ThemeSnapshot {
  if (sameTheme(theme, DEFAULT_THEME)) return { css: "", fonts: [] };
  const fonts = googleFontFamilies(theme).flatMap((family) => {
    const href = googleFontsHref([family]);
    return href ? [{ family, href }] : [];
  });
  return { css: themeCss(theme), fonts };
}

function writeStored(state: ThemeEditorState) {
  try {
    localStorage.setItem(
      THEME_STATE_KEY,
      JSON.stringify({ theme: state.theme, loaded: state.loaded }),
    );
    localStorage.setItem(THEME_SNAPSHOT_KEY, JSON.stringify(snapshot(state.theme)));
  } catch {
    // Private mode or full storage: the theme still applies, it just won't be remembered.
  }
}

/** Styles the page with `theme`: a <style> after the stylesheets, so both modes follow it. */
function applySiteTheme(theme: Theme) {
  const { css } = snapshot(theme);
  let style = document.getElementById(THEME_STYLE_ID);
  if (!css) {
    style?.remove();
    return;
  }
  if (!style) {
    style = document.createElement("style");
    style.id = THEME_STYLE_ID;
    document.head.append(style);
  }
  if (style.textContent !== css) style.textContent = css;
  loadThemeFonts(theme);
}

const SERVER_STATE = initEditorState(DEFAULT_THEME);
let state: ThemeEditorState | undefined;
const listeners = new Set<() => void>();

export function getThemeState(): ThemeEditorState {
  state ??= readStored() ?? SERVER_STATE;
  return state;
}

function setState(next: ThemeEditorState) {
  state = next;
  applySiteTheme(next.theme);
  for (const listener of listeners) listener();
}

export function dispatchTheme(action: ThemeEditorAction) {
  const next = themeEditorReducer(getThemeState(), action);
  if (next === state) return;
  writeStored(next);
  setState(next);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // The head script may have run against an older snapshot (or format): sync it.
  const current = getThemeState();
  applySiteTheme(current.theme);
  writeStored(current);
  function onStorage(event: StorageEvent) {
    if (event.key === THEME_STATE_KEY) setState(readStored() ?? SERVER_STATE);
  }
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The site theme and its editing history; re-renders when either changes. */
export function useThemeState(): ThemeEditorState {
  return useSyncExternalStore(subscribe, getThemeState, () => SERVER_STATE);
}
