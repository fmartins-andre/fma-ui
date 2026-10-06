import { describe, expect, it } from "vitest";

import {
  adjustHsl,
  alphaOf,
  contrastRatio,
  isColor,
  NO_HSL_ADJUSTMENT,
  shiftLightness,
  toHex,
  toOklch,
  withAlpha,
} from "@/lib/theme/color";

describe("toOklch", () => {
  it("converts hex, rgb and hsl to rounded oklch", () => {
    expect(toOklch("#ffffff")).toBe("oklch(1 0 0)");
    expect(toOklch("#000")).toBe("oklch(0 0 0)");
    expect(toOklch("rgb(255 0 0)")).toBe("oklch(0.628 0.258 29.234)");
    expect(toOklch("hsl(0 100% 50%)")).toBe("oklch(0.628 0.258 29.234)");
  });

  it("reads shadcn v3's bare HSL triplets", () => {
    expect(toOklch("0 0% 100%")).toBe("oklch(1 0 0)");
  });

  it("keeps alpha as a percentage", () => {
    expect(toOklch("oklch(1 0 0 / 10%)")).toBe("oklch(1 0 0 / 10%)");
    expect(toOklch("rgb(0 0 0 / 0.5)")).toBe("oklch(0 0 0 / 50%)");
  });

  it("zeroes the hue of achromatic colors", () => {
    expect(toOklch("#808080")).toMatch(/^oklch\(0\.6 0 0\)$/);
  });

  it("returns unparseable input unchanged", () => {
    expect(toOklch("var(--x)")).toBe("var(--x)");
    expect(isColor("var(--x)")).toBe(false);
    expect(isColor("tomato")).toBe(true);
  });
});

describe("toHex", () => {
  it("formats any color as #rrggbb, dropping alpha", () => {
    expect(toHex("oklch(1 0 0)")).toBe("#ffffff");
    expect(toHex("oklch(0 0 0 / 50%)")).toBe("#000000");
    expect(toHex("hsl(0 100% 50%)")).toBe("#ff0000");
  });

  it("falls back to black for garbage", () => {
    expect(toHex("nope")).toBe("#000000");
  });
});

describe("alpha helpers", () => {
  it("reads and replaces alpha", () => {
    expect(alphaOf("oklch(1 0 0 / 15%)")).toBeCloseTo(0.15);
    expect(alphaOf("#fff")).toBe(1);
    expect(withAlpha("oklch(0.5 0.1 200)", 0.25)).toBe("oklch(0.5 0.1 200 / 25%)");
    expect(withAlpha("oklch(0.5 0.1 200 / 25%)", 1)).toBe("oklch(0.5 0.1 200)");
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for identical colors", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21);
    expect(contrastRatio("oklch(0.5 0 0)", "oklch(0.5 0 0)")).toBeCloseTo(1);
  });

  it("is symmetric and returns 1 for unparseable colors", () => {
    expect(contrastRatio("#333", "#eee")).toBeCloseTo(contrastRatio("#eee", "#333"));
    expect(contrastRatio("nope", "#fff")).toBe(1);
  });
});

describe("shiftLightness", () => {
  it("moves oklch lightness and clamps to 0–1", () => {
    expect(shiftLightness("oklch(0.5 0.1 30)", -0.1)).toBe("oklch(0.4 0.1 30)");
    expect(shiftLightness("oklch(0.95 0 0)", 0.2)).toBe("oklch(1 0 0)");
    expect(shiftLightness("oklch(0.5 0.1 30 / 50%)", 0.1)).toBe("oklch(0.6 0.1 30 / 50%)");
  });
});

describe("adjustHsl", () => {
  it("is a no-op with the neutral adjustment", () => {
    expect(adjustHsl("#3b82f6", NO_HSL_ADJUSTMENT)).toBe(toOklch("#3b82f6"));
  });

  it("shifts hue and scales saturation", () => {
    expect(toHex(adjustHsl("hsl(0 100% 50%)", { ...NO_HSL_ADJUSTMENT, hueShift: 120 }))).toBe(
      "#00ff00",
    );
    // Pure blue sits on the sRGB gamut edge, where the hex round-trip clips it.
    expect(adjustHsl("hsl(0 100% 50%)", { ...NO_HSL_ADJUSTMENT, hueShift: -120 })).toBe(
      toOklch("#0000ff"),
    );
    expect(adjustHsl("#3b82f6", { ...NO_HSL_ADJUSTMENT, saturationScale: 0 })).toMatch(
      /^oklch\([\d.]+ 0 0\)$/,
    );
  });

  it("keeps alpha", () => {
    expect(adjustHsl("oklch(1 0 0 / 10%)", { ...NO_HSL_ADJUSTMENT, lightnessScale: 0.5 })).toMatch(
      / \/ 10%\)$/,
    );
  });
});
