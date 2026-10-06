import { describe, expect, it } from "vitest";

import {
  CONTRAST_AA,
  CONTRAST_AAA,
  contrastLevel,
  contrastRatio,
  formatOklchChannels,
  inGamut,
  nearestContrastColor,
  passingLightnessRanges,
  toOklchChannels,
} from "@/lib/color-contrast";

const WHITE = "#ffffff";
const BLACK = "#000000";

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for identical colors", () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 5);
    expect(contrastRatio("oklch(0.6 0.1 200)", "oklch(0.6 0.1 200)")).toBe(1);
  });

  it("ignores alpha and returns 1 for unparseable input", () => {
    expect(contrastRatio("rgb(0 0 0 / 10%)", WHITE)).toBeCloseTo(21, 5);
    expect(contrastRatio("nope", WHITE)).toBe(1);
  });
});

describe("contrastLevel", () => {
  it("maps ratios to WCAG levels", () => {
    expect(contrastLevel(7)).toBe("AAA");
    expect(contrastLevel(4.5)).toBe("AA");
    expect(contrastLevel(3)).toBe("AA18");
    expect(contrastLevel(2.99)).toBe("Fail");
  });
});

describe("toOklchChannels / formatOklchChannels", () => {
  it("round-trips an oklch color, keeping alpha", () => {
    const channels = toOklchChannels("oklch(0.5 0.1 250 / 50%)");
    expect(channels).toMatchObject({ l: 0.5, c: 0.1, h: 250, alpha: 0.5 });
    expect(channels && formatOklchChannels(channels)).toBe("oklch(0.5 0.1 250 / 50%)");
  });

  it("uses hue 0 for grays and undefined for invalid colors", () => {
    expect(toOklchChannels("#808080")?.h).toBe(0);
    expect(toOklchChannels("nope")).toBeUndefined();
  });

  it("clamps chroma into sRGB keeping lightness and hue", () => {
    const clamped = inGamut({ l: 0.9, c: 0.4, h: 30, alpha: 1 });
    expect(clamped.l).toBe(0.9);
    expect(clamped.h).toBe(30);
    expect(clamped.c).toBeLessThan(0.4);
  });
});

describe("nearestContrastColor", () => {
  it("returns the color itself when it already passes", () => {
    expect(nearestContrastColor("oklch(0.2 0.05 260)", WHITE, CONTRAST_AA)).toBe(
      "oklch(0.2 0.05 260)",
    );
  });

  it("darkens a light color on white just enough to reach the ratio, keeping hue", () => {
    const start = "oklch(0.7 0.15 250)";
    const result = nearestContrastColor(start, WHITE, CONTRAST_AA);
    expect(result).toBeDefined();
    const ratio = contrastRatio(result ?? "", WHITE);
    expect(ratio).toBeGreaterThanOrEqual(CONTRAST_AA);
    expect(ratio).toBeLessThan(CONTRAST_AA + 0.1);
    const channels = toOklchChannels(result ?? "");
    expect(channels?.l).toBeLessThan(0.7);
    expect(channels?.h).toBeCloseTo(250, 0);
  });

  it("lightens a dark color on black", () => {
    const result = nearestContrastColor("oklch(0.3 0.1 140)", BLACK, CONTRAST_AAA);
    expect(contrastRatio(result ?? "", BLACK)).toBeGreaterThanOrEqual(CONTRAST_AAA);
    expect(toOklchChannels(result ?? "")?.l).toBeGreaterThan(0.3);
  });

  it("picks the nearer side when both directions pass", () => {
    // Mid gray background: AA is reachable both lighter and darker.
    const bg = "oklch(0.6 0 0)";
    const darker = nearestContrastColor("oklch(0.5 0 0)", bg, 3);
    const lighter = nearestContrastColor("oklch(0.7 0 0)", bg, 3);
    expect(toOklchChannels(darker ?? "")?.l).toBeLessThan(0.5);
    expect(toOklchChannels(lighter ?? "")?.l).toBeGreaterThan(0.7);
  });

  it("keeps alpha", () => {
    const result = nearestContrastColor("oklch(0.8 0.1 30 / 60%)", WHITE, CONTRAST_AA);
    expect(result).toMatch(/\/ 60%\)$/);
  });

  it("returns undefined when no lightness reaches the ratio", () => {
    expect(nearestContrastColor("oklch(0.5 0.1 30)", "oklch(0.6 0 0)", CONTRAST_AAA)).toBe(
      undefined,
    );
    expect(nearestContrastColor("nope", WHITE, CONTRAST_AA)).toBeUndefined();
  });
});

describe("passingLightnessRanges", () => {
  it("is one dark range on white", () => {
    const ranges = passingLightnessRanges("oklch(0.5 0.1 250)", WHITE, CONTRAST_AA);
    expect(ranges).toHaveLength(1);
    expect(ranges[0]?.[0]).toBe(0);
    expect(ranges[0]?.[1]).toBeGreaterThan(0.4);
    expect(ranges[0]?.[1]).toBeLessThan(0.65);
  });

  it("splits into a dark and a light range against a mid gray", () => {
    const ranges = passingLightnessRanges("oklch(0.5 0 0)", "oklch(0.6 0 0)", 3);
    expect(ranges).toHaveLength(2);
    expect(ranges[0]?.[0]).toBe(0);
    expect(ranges[1]?.[1]).toBe(1);
  });

  it("is empty when nothing passes", () => {
    expect(passingLightnessRanges("oklch(0.5 0 0)", "oklch(0.6 0 0)", CONTRAST_AAA)).toEqual([]);
  });
});
