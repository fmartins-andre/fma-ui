import { useCallback, useEffect } from "react";
import { sameTheme, type Theme } from "@/lib/theme/index";
import { getTheme } from "@/themes/index";
import { useMode } from "../site/mode";
import { dispatchTheme, getThemeState, useThemeState } from "../site/theme";

export function useThemeEditor(preset: string | undefined) {
  // The editor edits the site theme itself, so the whole site wears it — the
  // controls too, like tweakcn — and popovers and dialogs (portaled to <body>) as well.
  const state = useThemeState();
  // The site's mode: the header toggle switches which palette is edited.
  const { mode, setMode } = useMode();

  // A ?preset= link wins over what was being edited last time.
  useEffect(() => {
    const fromUrl = preset ? getTheme(preset) : undefined;
    if (fromUrl && !sameTheme(fromUrl, getThemeState().theme)) {
      dispatchTheme({ type: "load", theme: fromUrl });
    }
  }, [preset]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") return;
      // Leave text fields their own undo.
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable=true]")) return;
      event.preventDefault();
      dispatchTheme({ type: event.shiftKey ? "redo" : "undo" });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const edit = useCallback(
    (update: (theme: Theme) => Theme) => dispatchTheme({ type: "edit", update, at: Date.now() }),
    [],
  );

  return { state, dispatch: dispatchTheme, edit, mode, setMode };
}

export type ThemeEditor = ReturnType<typeof useThemeEditor>;
