import { describe, expect, it } from "vitest";

import { checkContrast } from "@/lib/theme/contrast";
import { DEFAULT_THEME } from "@/themes/index";

describe("checkContrast", () => {
  it("passes the default theme in both modes", () => {
    expect(checkContrast(DEFAULT_THEME, "light").every((pair) => pair.passes)).toBe(true);
    expect(checkContrast(DEFAULT_THEME, "dark").every((pair) => pair.passes)).toBe(true);
  });

  it("flags pairs under their minimum", () => {
    const unreadable = {
      ...DEFAULT_THEME,
      light: { ...DEFAULT_THEME.light, foreground: DEFAULT_THEME.light.background },
    };
    const failing = checkContrast(unreadable, "light").filter((pair) => !pair.passes);
    expect(failing.map((pair) => pair.foreground)).toEqual(["foreground"]);
    expect(failing[0]?.ratio).toBeCloseTo(1);
    expect(failing[0]?.minimum).toBe(4.5);
  });
});
