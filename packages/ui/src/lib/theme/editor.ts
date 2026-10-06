// State of the theme editor (apps/web /themes): the theme being edited, the
// theme it was loaded from (for "reset"), undo/redo history and tweakcn's
// global HSL adjustment. A plain reducer so it's testable without React.

import { adjustHsl, type HslAdjustment, NO_HSL_ADJUSTMENT } from "./color";
import { COLOR_TOKENS, type Theme, type ThemeColors } from "./schema";

/** Edits closer together than this merge into one undo step (dragging a slider). */
export const HISTORY_MERGE_MS = 500;
export const HISTORY_LIMIT = 50;

export interface ThemeEditorState {
  theme: Theme;
  /** What "reset" goes back to: the last loaded preset or import. */
  loaded: Theme;
  hsl: HslAdjustment;
  /** Colors the HSL adjustment applies to; captured when it leaves neutral. */
  hslSource: { light: ThemeColors; dark: ThemeColors } | null;
  past: Theme[];
  future: Theme[];
  lastEditAt: number;
}

export type ThemeEditorAction =
  | { type: "load"; theme: Theme }
  | { type: "edit"; update: (theme: Theme) => Theme; at: number }
  | { type: "hsl"; hsl: HslAdjustment; at: number }
  | { type: "reset" }
  | { type: "undo" }
  | { type: "redo" };

export function initEditorState(theme: Theme, loaded: Theme = theme): ThemeEditorState {
  return {
    theme,
    loaded,
    hsl: NO_HSL_ADJUSTMENT,
    hslSource: null,
    past: [],
    future: [],
    lastEditAt: 0,
  };
}

function isNeutral(hsl: HslAdjustment): boolean {
  return (
    hsl.hueShift === NO_HSL_ADJUSTMENT.hueShift &&
    hsl.saturationScale === NO_HSL_ADJUSTMENT.saturationScale &&
    hsl.lightnessScale === NO_HSL_ADJUSTMENT.lightnessScale
  );
}

function adjustColors(colors: ThemeColors, hsl: HslAdjustment): ThemeColors {
  const adjusted = { ...colors };
  for (const token of COLOR_TOKENS) adjusted[token] = adjustHsl(colors[token], hsl);
  return adjusted;
}

/** Pushes `state.theme` onto the undo stack unless the previous edit was moments ago. */
function commit(state: ThemeEditorState, theme: Theme, at: number): ThemeEditorState {
  const merge = state.past.length > 0 && at - state.lastEditAt < HISTORY_MERGE_MS;
  return {
    ...state,
    theme,
    past: merge ? state.past : [...state.past, state.theme].slice(-HISTORY_LIMIT),
    future: [],
    lastEditAt: at,
  };
}

export function themeEditorReducer(
  state: ThemeEditorState,
  action: ThemeEditorAction,
): ThemeEditorState {
  switch (action.type) {
    case "load":
      return {
        ...state,
        theme: action.theme,
        loaded: action.theme,
        hsl: NO_HSL_ADJUSTMENT,
        hslSource: null,
        past: [...state.past, state.theme].slice(-HISTORY_LIMIT),
        future: [],
        lastEditAt: 0,
      };
    case "edit":
      // Any direct edit bakes in the current HSL adjustment.
      return {
        ...commit(state, action.update(state.theme), action.at),
        hsl: NO_HSL_ADJUSTMENT,
        hslSource: null,
      };
    case "hsl": {
      const source = state.hslSource ?? { light: state.theme.light, dark: state.theme.dark };
      const theme = isNeutral(action.hsl)
        ? { ...state.theme, ...source }
        : {
            ...state.theme,
            light: adjustColors(source.light, action.hsl),
            dark: adjustColors(source.dark, action.hsl),
          };
      return { ...commit(state, theme, action.at), hsl: action.hsl, hslSource: source };
    }
    case "reset":
      return {
        ...state,
        theme: state.loaded,
        hsl: NO_HSL_ADJUSTMENT,
        hslSource: null,
        past: [...state.past, state.theme].slice(-HISTORY_LIMIT),
        future: [],
        lastEditAt: 0,
      };
    case "undo": {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return {
        ...state,
        theme: previous,
        past: state.past.slice(0, -1),
        future: [state.theme, ...state.future],
        hsl: NO_HSL_ADJUSTMENT,
        hslSource: null,
        lastEditAt: 0,
      };
    }
    case "redo": {
      const next = state.future[0];
      if (!next) return state;
      return {
        ...state,
        theme: next,
        past: [...state.past, state.theme],
        future: state.future.slice(1),
        hsl: NO_HSL_ADJUSTMENT,
        hslSource: null,
        lastEditAt: 0,
      };
    }
  }
}

/** Deep equality for themes (plain JSON data; key order and undefined keys don't matter). */
export function sameTheme(a: Theme, b: Theme): boolean {
  return deepEqual(a, b);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  const keys = new Set(
    [...Object.keys(a), ...Object.keys(b)].filter(
      (key) =>
        (a as Record<string, unknown>)[key] !== undefined ||
        (b as Record<string, unknown>)[key] !== undefined,
    ),
  );
  for (const key of keys) {
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }
  return true;
}
