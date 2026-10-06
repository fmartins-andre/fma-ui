import { useCallback, useEffect, useReducer, useState } from "react";
import {
  applyTheme,
  clearTheme,
  initEditorState,
  loadThemeFonts,
  type Theme,
  type ThemeEditorState,
  type ThemeMode,
  ThemeSchema,
  themeEditorReducer,
} from "@/lib/theme/index";
import { DEFAULT_THEME, getTheme } from "@/themes/index";

const STORAGE_KEY = "fma-ui:theme-editor";

interface Stored {
  theme: Theme;
  loaded: Theme;
  mode: ThemeMode;
}

function readStored(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const json = JSON.parse(raw);
    const theme = ThemeSchema.safeParse(json.theme);
    const loaded = ThemeSchema.safeParse(json.loaded);
    if (!theme.success || !loaded.success) return null;
    return {
      theme: theme.data,
      loaded: loaded.data,
      mode: json.mode === "dark" ? "dark" : "light",
    };
  } catch {
    return null;
  }
}

function writeStored(stored: Stored) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Private mode or full storage: the editor still works, it just won't remember.
  }
}

function initialState(preset: string | undefined): { state: ThemeEditorState; mode: ThemeMode } {
  const stored = readStored();
  const fromUrl = preset ? getTheme(preset) : undefined;
  // A ?preset= link wins over what was being edited last time.
  if (fromUrl) return { state: initEditorState(fromUrl), mode: stored?.mode ?? "light" };
  if (stored) return { state: initEditorState(stored.theme, stored.loaded), mode: stored.mode };
  return { state: initEditorState(DEFAULT_THEME), mode: "light" };
}

export function useThemeEditor(preset: string | undefined) {
  const [initial] = useState(() => initialState(preset));
  const [state, dispatch] = useReducer(themeEditorReducer, initial.state);
  const [mode, setMode] = useState<ThemeMode>(initial.mode);
  const { theme, loaded } = state;

  // The whole page wears the theme — the controls too, like tweakcn — so
  // popovers and dialogs (portaled to <body>) pick it up as well.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    applyTheme(root, theme, mode);
    loadThemeFonts(theme);
  }, [theme, mode]);

  useEffect(
    () => () => {
      clearTheme(document.documentElement);
      document.documentElement.classList.remove("dark");
    },
    [],
  );

  useEffect(() => writeStored({ theme, loaded, mode }), [theme, loaded, mode]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") return;
      // Leave text fields their own undo.
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable=true]")) return;
      event.preventDefault();
      dispatch({ type: event.shiftKey ? "redo" : "undo" });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const edit = useCallback(
    (update: (theme: Theme) => Theme) => dispatch({ type: "edit", update, at: Date.now() }),
    [],
  );

  return { state, dispatch, edit, mode, setMode };
}

export type ThemeEditor = ReturnType<typeof useThemeEditor>;
