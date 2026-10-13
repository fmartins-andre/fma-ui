import { formatHex } from "culori";
import { describe, expect, it } from "vitest";

import {
  CONTRAST_AA,
  CONTRAST_AAA,
  channelDomain,
  contrastLevel,
  contrastRatio,
  formatOklchChannels,
  inGamut,
  nearestContrastColor,
  passingLightnessRanges,
  passingRanges,
  passingRegion,
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

/** Every range's midpoint passes and every gap's midpoint fails. */
function expectRanges(
  ranges: Array<[number, number]>,
  [min, max]: [number, number],
  passes: (value: number) => boolean,
) {
  const edges = [min, ...ranges.flat(), max];
  for (let i = 0; i + 1 < edges.length; i++) {
    const [from = 0, to = 0] = [edges[i], edges[i + 1]];
    if (to - from < 1e-6) continue;
    expect(passes((from + to) / 2), `${from}–${to}`).toBe(i % 2 === 1);
  }
}

const oklch = (l: number, c: number, h: number) => formatOklchChannels({ l, c, h, alpha: 1 });

describe("passingRanges", () => {
  it("defaults to OKLCH and matches passingLightnessRanges on lightness", () => {
    const color = "oklch(0.5 0.1 250)";
    expect(passingRanges(color, WHITE, CONTRAST_AA, { channel: "l" })).toEqual(
      passingLightnessRanges(color, WHITE, CONTRAST_AA),
    );
  });

  it("refines the edges well below the sampling step", () => {
    const [range] = passingRanges("oklch(0.5 0.1 250)", WHITE, CONTRAST_AA, { channel: "l" });
    const edge = range?.[1] ?? 0;
    expect(contrastRatio(`oklch(${edge} 0.1 250)`, WHITE)).toBeGreaterThanOrEqual(CONTRAST_AA);
    expect(contrastRatio(`oklch(${edge + 0.002} 0.1 250)`, WHITE)).toBeLessThan(CONTRAST_AA);
  });

  it("scans OKLCH hue and chroma across their domains", () => {
    const bg = "oklch(0.97 0.01 100)";
    for (const channel of ["h", "c"] as const) {
      const ranges = passingRanges("oklch(0.55 0.15 40)", bg, CONTRAST_AA, { channel });
      expectRanges(ranges, channelDomain(channel), (v) => {
        const channels = { l: 0.55, c: 0.15, h: 40, [channel]: v };
        return contrastRatio(oklch(channels.l, channels.c, channels.h), bg) >= CONTRAST_AA;
      });
    }
  });

  it("works in HSB, HSL and RGB", () => {
    const hsb = passingRanges("#3b82f6", WHITE, CONTRAST_AA, { space: "hsb", channel: "v" });
    expect(hsb[0]?.[0]).toBe(0);
    expectRanges(hsb, [0, 1], (v) => {
      const color = formatHex({ mode: "hsv", h: 217.2, s: 0.76, v });
      return contrastRatio(color, WHITE) >= CONTRAST_AA;
    });

    const hsl = passingRanges("#3b82f6", BLACK, CONTRAST_AA, { space: "hsl", channel: "l" });
    expect(hsl.at(-1)?.[1]).toBe(1);

    const rgb = passingRanges("#000000", "#ff0000", 3, { space: "rgb", channel: "g" });
    expectRanges(
      rgb,
      [0, 1],
      (g) => contrastRatio(formatHex({ mode: "rgb", r: 0, g, b: 0 }), "#ff0000") >= 3,
    );
  });

  it("is empty for unparseable colors", () => {
    expect(passingRanges("nope", WHITE, CONTRAST_AA, { channel: "l" })).toEqual([]);
    expect(passingRanges("#000", "nope", CONTRAST_AA, { channel: "l" })).toEqual([]);
  });
});

describe("passingRegion", () => {
  it("has columns + 1 columns spanning the x domain", () => {
    const region = passingRegion("oklch(0.5 0.1 250)", WHITE, CONTRAST_AA, {
      x: "c",
      y: "l",
      columns: 8,
    });
    expect(region).toHaveLength(9);
    expect(region[0]?.x).toBe(0);
    expect(region.at(-1)?.x).toBeCloseTo(0.4, 10);
  });

  it("matches the lightness ranges of each column's color", () => {
    const region = passingRegion("oklch(0.5 0.1 250)", WHITE, CONTRAST_AA, {
      x: "c",
      y: "l",
      columns: 4,
      samples: 100,
    });
    for (const { x, ranges } of region) {
      // Unclamped: the area clamps each point's chroma at its own lightness.
      expect(ranges).toEqual(passingLightnessRanges(`oklch(0.5 ${x} 250)`, WHITE, CONTRAST_AA));
    }
  });

  it("passes at both ends and fails between against a mid gray", () => {
    const region = passingRegion("oklch(0.5 0.1 30)", "oklch(0.6 0 0)", 3, {
      x: "c",
      y: "l",
      columns: 4,
    });
    for (const { ranges } of region) {
      expect(ranges).toHaveLength(2);
      expect(ranges[0]?.[0]).toBe(0);
      expect(ranges[1]?.[1]).toBe(1);
    }
  });

  it("covers an HSB saturation × brightness area", () => {
    const region = passingRegion("#3b82f6", WHITE, CONTRAST_AA, {
      space: "hsb",
      x: "s",
      y: "v",
      columns: 4,
    });
    for (const { x, ranges } of region) {
      expect(ranges[0]?.[0]).toBe(0);
      expectRanges(ranges, [0, 1], (v) => {
        const color = formatHex({ mode: "hsv", h: 217.2, s: x, v });
        return contrastRatio(color, WHITE) >= CONTRAST_AA;
      });
    }
  });

  it("is empty for unparseable colors", () => {
    expect(passingRegion("nope", WHITE, CONTRAST_AA, { x: "c", y: "l" })).toEqual([]);
  });
});
