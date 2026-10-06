// WCAG 2 contrast helpers over OKLCH. Colors are CSS color strings; results are
// emitted as `oklch(l c h)` clamped to the sRGB gamut, so the ratio computed here
// is the ratio the browser renders.

import { type Color, clampChroma, converter, type Oklch, parse, wcagContrast } from "culori";

const toOklchColor = converter("oklch");

/** WCAG thresholds: AA for normal text, AAA for normal text, AA for large text. */
export const CONTRAST_AA = 4.5;
export const CONTRAST_AAA = 7;
export const CONTRAST_AA_LARGE = 3;

export type ContrastLevel = "AAA" | "AA" | "AA18" | "Fail";

export interface OklchChannels {
  /** Lightness, 0–1. */
  l: number;
  /** Chroma, 0–0.4 in practice. */
  c: number;
  /** Hue in degrees, 0–360. */
  h: number;
  /** Alpha, 0–1. */
  alpha: number;
}

function parseOpaque(value: string): Color | undefined {
  const color = parse(value.trim());
  return color ? { ...color, alpha: 1 } : undefined;
}

/** WCAG 2 contrast ratio between two CSS colors (1–21). Alpha is ignored; unparseable → 1. */
export function contrastRatio(a: string, b: string): number {
  const ca = parseOpaque(a);
  const cb = parseOpaque(b);
  return ca && cb ? wcagContrast(ca, cb) : 1;
}

/** WCAG level for a ratio: AAA ≥ 7, AA ≥ 4.5, AA large (AA18) ≥ 3. */
export function contrastLevel(ratio: number): ContrastLevel {
  if (ratio >= CONTRAST_AAA) return "AAA";
  if (ratio >= CONTRAST_AA) return "AA";
  if (ratio >= CONTRAST_AA_LARGE) return "AA18";
  return "Fail";
}

/** OKLCH channels of a CSS color (hue 0 for grays), or undefined when unparseable. */
export function toOklchChannels(value: string): OklchChannels | undefined {
  const color = parse(value.trim());
  if (!color) return undefined;
  const { l, c, h, alpha } = toOklchColor(color);
  return {
    l: l ?? 0,
    c: c ?? 0,
    h: h === undefined || Number.isNaN(h) ? 0 : h,
    alpha: alpha ?? 1,
  };
}

const round = (n: number, digits: number) => {
  const r = Number(n.toFixed(digits));
  return Object.is(r, -0) ? 0 : r;
};

/** Channels → `oklch(l c h)` (with `/ a%` when translucent), chroma clamped to sRGB. */
export function formatOklchChannels(channels: OklchChannels): string {
  const { l, c, h } = inGamut(channels);
  const hue = c < 0.0005 ? 0 : h;
  const body = `${round(l, 3)} ${round(c, 3)} ${round(hue, 3)}`;
  return channels.alpha < 1
    ? `oklch(${body} / ${round(channels.alpha * 100, 1)}%)`
    : `oklch(${body})`;
}

/** The channels with chroma reduced (lightness and hue kept) until they fit sRGB. */
export function inGamut({ l, c, h, alpha }: OklchChannels): OklchChannels {
  const clamped = clampChroma({ mode: "oklch", l, c, h } satisfies Oklch, "oklch");
  return { l, c: clamped.c ?? 0, h, alpha };
}

function ratioAtLightness(channels: OklchChannels, l: number, background: Color): number {
  const { c, h } = inGamut({ ...channels, l });
  return wcagContrast({ mode: "oklch", l, c, h }, background);
}

const SAMPLES = 400;

/**
 * Lightness intervals ([from, to], 0–1) where the color, keeping its hue and
 * (gamut-clamped) chroma, reaches `minRatio` against `background`. Sampled at
 * 1/`samples` resolution, so meant for drawing, not for exact boundaries.
 */
export function passingLightnessRanges(
  value: string,
  background: string,
  minRatio: number,
  samples = 100,
): Array<[number, number]> {
  const channels = toOklchChannels(value);
  const bg = parseOpaque(background);
  if (!channels || !bg) return [];
  const ranges: Array<[number, number]> = [];
  let start: number | undefined;
  for (let i = 0; i <= samples; i++) {
    const l = i / samples;
    const passes = ratioAtLightness(channels, l, bg) >= minRatio;
    if (passes && start === undefined) start = l;
    if (!passes && start !== undefined) {
      ranges.push([start, (i - 1) / samples]);
      start = undefined;
    }
  }
  if (start !== undefined) ranges.push([start, 1]);
  return ranges;
}

/**
 * The closest color (by OKLCH lightness only — hue kept, chroma clamped to
 * sRGB) whose contrast against `background` is at least `minRatio`. Returns the
 * color itself (normalized to oklch) when it already passes, and undefined when
 * no lightness reaches the ratio (e.g. 7:1 against a mid gray).
 */
export function nearestContrastColor(
  value: string,
  background: string,
  minRatio: number,
): string | undefined {
  const channels = toOklchChannels(value);
  const bg = parseOpaque(background);
  if (!channels || !bg) return undefined;
  if (ratioAtLightness(channels, channels.l, bg) >= minRatio) {
    return formatOklchChannels(channels);
  }

  // Contrast isn't monotonic in lightness (both ends can pass), so scan the
  // whole range for the nearest passing sample, then bisect its boundary.
  let best: number | undefined;
  for (let i = 0; i <= SAMPLES; i++) {
    const l = i / SAMPLES;
    if (ratioAtLightness(channels, l, bg) < minRatio) continue;
    if (best === undefined || Math.abs(l - channels.l) < Math.abs(best - channels.l)) best = l;
  }
  if (best === undefined) return undefined;

  let pass = best;
  let fail = channels.l;
  for (let i = 0; i < 20 && Math.abs(pass - fail) > 1e-5; i++) {
    const mid = (pass + fail) / 2;
    if (ratioAtLightness(channels, mid, bg) >= minRatio) pass = mid;
    else fail = mid;
  }
  // Rounding to 3 digits on output may cross the boundary: step outward until it passes.
  const direction = pass > channels.l ? 1 : -1;
  let l = round(pass, 3);
  let result = formatOklchChannels({ ...channels, l });
  while (contrastRatio(result, background) < minRatio && l > 0 && l < 1) {
    l = round(l + direction * 0.001, 3);
    result = formatOklchChannels({ ...channels, l });
  }
  return result;
}
