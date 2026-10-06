import { describe, expect, it } from "vitest";

import { NO_HSL_ADJUSTMENT, toHex } from "@/lib/theme/color";
import {
  HISTORY_LIMIT,
  HISTORY_MERGE_MS,
  initEditorState,
  sameTheme,
  type ThemeEditorState,
  themeEditorReducer,
} from "@/lib/theme/editor";
import type { Theme } from "@/lib/theme/schema";
import { DEFAULT_THEME, getTheme } from "@/themes/index";

// biome-ignore lint/style/noNonNullAssertion: curated theme exists
const violet = getTheme("violet-bloom")!;

const withRadius = (radius: string) => (theme: Theme) => ({ ...theme, radius });

function run(state: ThemeEditorState, ...actions: Parameters<typeof themeEditorReducer>[1][]) {
  return actions.reduce(themeEditorReducer, state);
}

describe("themeEditorReducer", () => {
  const initial = initEditorState(DEFAULT_THEME);

  it("edits push undo steps, but rapid edits merge into one", () => {
    const state = run(
      initial,
      { type: "edit", update: withRadius("1rem"), at: 1000 },
      { type: "edit", update: withRadius("1.1rem"), at: 1000 + HISTORY_MERGE_MS - 1 },
      { type: "edit", update: withRadius("1.2rem"), at: 5000 },
    );
    expect(state.theme.radius).toBe("1.2rem");
    expect(state.past.map((theme) => theme.radius)).toEqual(["0.625rem", "1.1rem"]);
  });

  it("undoes and redoes, and a new edit clears the redo stack", () => {
    let state = run(
      initial,
      { type: "edit", update: withRadius("1rem"), at: 1000 },
      { type: "edit", update: withRadius("2rem"), at: 5000 },
      { type: "undo" },
    );
    expect(state.theme.radius).toBe("1rem");
    state = run(state, { type: "redo" });
    expect(state.theme.radius).toBe("2rem");
    state = run(state, { type: "undo" }, { type: "undo" });
    expect(state.theme.radius).toBe("0.625rem");
    expect(run(state, { type: "undo" })).toBe(state);
    state = run(state, { type: "edit", update: withRadius("3rem"), at: 9000 });
    expect(state.future).toEqual([]);
    expect(run(state, { type: "redo" })).toBe(state);
  });

  it("caps the history", () => {
    const actions = Array.from({ length: HISTORY_LIMIT + 10 }, (_, i) => ({
      type: "edit" as const,
      update: withRadius(`${i}px`),
      at: i * 10_000,
    }));
    expect(run(initial, ...actions).past).toHaveLength(HISTORY_LIMIT);
  });

  it("loading a preset is undoable and becomes the reset target", () => {
    let state = run(
      initial,
      { type: "load", theme: violet },
      { type: "edit", update: withRadius("0rem"), at: 1000 },
      { type: "reset" },
    );
    expect(sameTheme(state.theme, violet)).toBe(true);
    state = run(state, { type: "undo" });
    expect(state.theme.radius).toBe("0rem");
    state = run(state, { type: "undo" }, { type: "undo" });
    expect(sameTheme(state.theme, DEFAULT_THEME)).toBe(true);
  });

  it("applies HSL adjustments to the captured colors, not cumulatively", () => {
    const red = run(initial, {
      type: "edit",
      update: (theme) => ({ ...theme, light: { ...theme.light, primary: "#ff0000" } }),
      at: 0,
    });
    let state = run(red, { type: "hsl", hsl: { ...NO_HSL_ADJUSTMENT, hueShift: 60 }, at: 1000 });
    state = run(state, { type: "hsl", hsl: { ...NO_HSL_ADJUSTMENT, hueShift: 120 }, at: 1100 });
    expect(toHex(state.theme.light.primary)).toBe("#00ff00");
    // Back to neutral restores the captured colors exactly.
    state = run(state, { type: "hsl", hsl: NO_HSL_ADJUSTMENT, at: 1200 });
    expect(state.theme.light).toEqual(red.theme.light);
    // One undo step for the whole drag.
    expect(state.past).toHaveLength(red.past.length + 1);
  });

  it("a direct edit bakes the HSL adjustment in", () => {
    const state = run(
      initial,
      { type: "hsl", hsl: { ...NO_HSL_ADJUSTMENT, saturationScale: 0 }, at: 1000 },
      { type: "edit", update: withRadius("1rem"), at: 5000 },
    );
    expect(state.hsl).toEqual(NO_HSL_ADJUSTMENT);
    expect(state.hslSource).toBeNull();
    expect(state.theme.light.destructive).toMatch(/^oklch\([\d.]+ 0 0\)$/);
  });
});

describe("sameTheme", () => {
  it("ignores key order and undefined keys", () => {
    const reordered = { ...DEFAULT_THEME, fonts: { sans: undefined }, spacing: undefined };
    expect(sameTheme(reordered, DEFAULT_THEME)).toBe(true);
    expect(sameTheme(violet, DEFAULT_THEME)).toBe(false);
  });
});
