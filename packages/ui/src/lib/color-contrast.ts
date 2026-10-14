// WCAG 2 contrast helpers over OKLCH. Colors are CSS color strings; results are
// emitted as `oklch(l c h)` clamped to the sRGB gamut, so the ratio computed here
// is the ratio the browser renders. Passing ranges and regions also work in HSL,
// HSB and RGB, so a picker can show where contrast fails on any track or area.

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

/** The channels of each space, named as culori names them (HSB is culori's `hsv`). */
const SPACE_CHANNELS = {
  oklch: ["l", "c", "h"],
  hsl: ["h", "s", "l"],
  hsb: ["h", "s", "v"],
  rgb: ["r", "g", "b"],
} as const;

const SPACE_MODES = { oklch: "oklch", hsl: "hsl", hsb: "hsv", rgb: "rgb" } as const;

export type ColorSpace = keyof typeof SPACE_CHANNELS;
export type ColorChannel<S extends ColorSpace = ColorSpace> = (typeof SPACE_CHANNELS)[S][number];

/** The range a channel runs through: hue 0–360, OKLCH chroma 0–0.4, everything else 0–1. */
export function channelDomain(channel: ColorChannel): [number, number] {
  if (channel === "h") return [0, 360];
  if (channel === "c") return [0, 0.4];
  return [0, 1];
}

type Channels = Partial<Record<ColorChannel, number>>;

/** The color's channels in `space`; a missing channel (the hue of a gray) reads 0. */
function readChannels(space: ColorSpace, color: Color): Channels {
  const converted: Channels = converter(SPACE_MODES[space])(color);
  return Object.fromEntries(
    SPACE_CHANNELS[space].map((channel) => {
      const value = converted[channel];
      return [channel, value === undefined || Number.isNaN(value) ? 0 : value];
    }),
  );
}

/** Contrast against `background` of `channels` in `space`; OKLCH chroma is clamped to sRGB. */
function ratioIn(space: ColorSpace, channels: Channels, background: Color): number {
  if (space === "oklch") {
    const { l = 0, c = 0, h = 0 } = channels;
    return wcagContrast({ mode: "oklch", ...inGamut({ l, c, h, alpha: 1 }) }, background);
  }
  return wcagContrast({ mode: SPACE_MODES[space], ...channels } as Color, background);
}

const EDGE_STEPS = 12;

/**
 * Intervals of [min, max] where `passes` holds, sampled at `samples` steps and
 * each edge refined by bisection between its passing and failing samples.
 */
function scanRanges(
  passes: (value: number) => boolean,
  [min, max]: [number, number],
  samples: number,
): Array<[number, number]> {
  const at = (i: number) => min + ((max - min) * i) / samples;
  const edge = (pass: number, fail: number) => {
    for (let i = 0; i < EDGE_STEPS; i++) {
      const mid = (pass + fail) / 2;
      if (passes(mid)) pass = mid;
      else fail = mid;
    }
    return pass;
  };
  const ranges: Array<[number, number]> = [];
  let start: number | undefined;
  for (let i = 0; i <= samples; i++) {
    const value = at(i);
    const passing = passes(value);
    if (passing && start === undefined) start = i === 0 ? min : edge(value, at(i - 1));
    if (!passing && start !== undefined) {
      ranges.push([start, edge(at(i - 1), value)]);
      start = undefined;
    }
  }
  if (start !== undefined) ranges.push([start, max]);
  return ranges;
}

export interface PassingRangesOptions<S extends ColorSpace> {
  /** The space the channel belongs to. Defaults to OKLCH. */
  space?: S;
  channel: ColorChannel<S>;
  /** Sampling steps across the channel's domain (edges are then refined). */
  samples?: number;
}

/**
 * Intervals ([from, to], in the channel's domain — see channelDomain) where the
 * color, with only `channel` moved, reaches `minRatio` against `background`. In
 * OKLCH the chroma is clamped to sRGB at each step, as the picker emits it.
 * Meant for drawing the passing part of a slider track.
 */
export function passingRanges<S extends ColorSpace = "oklch">(
  value: string,
  background: string,
  minRatio: number,
  { space = "oklch" as S, channel, samples = 100 }: PassingRangesOptions<S>,
): Array<[number, number]> {
  const color = parseOpaque(value);
  const bg = parseOpaque(background);
  if (!color || !bg) return [];
  const channels = readChannels(space, color);
  return scanRanges(
    (v) => ratioIn(space, { ...channels, [channel]: v }, bg) >= minRatio,
    channelDomain(channel),
    samples,
  );
}

/**
 * Lightness intervals ([from, to], 0–1) where the color, keeping its hue and
 * (gamut-clamped) chroma, reaches `minRatio` against `background`. Same as
 * passingRanges on OKLCH lightness.
 */
export function passingLightnessRanges(
  value: string,
  background: string,
  minRatio: number,
  samples = 100,
): Array<[number, number]> {
  return passingRanges(value, background, minRatio, { channel: "l", samples });
}

export interface PassingRegionOptions<S extends ColorSpace> {
  /** The space both channels belong to. Defaults to OKLCH. */
  space?: S;
  /** Horizontal channel of the area. */
  x: ColorChannel<S>;
  /** Vertical channel of the area. */
  y: ColorChannel<S>;
  /** The range of `x` covered. Defaults to its channelDomain (e.g. chroma up to a hue's maximum). */
  xDomain?: [number, number];
  /** Columns across `x` (the region has `columns + 1` of them, ends included). */
  columns?: number;
  /** Sampling steps along `y` in each column (edges are then refined). */
  samples?: number;
}

/** One column of a passing region: the `y` intervals that pass at this `x`. */
export interface PassingColumn {
  x: number;
  ranges: Array<[number, number]>;
}

/**
 * The part of a 2D color area (channels `x` × `y`, the third one taken from
 * `value`) that reaches `minRatio` against `background`, as columns of passing
 * `y` intervals — e.g. chroma × lightness at the color's hue for an OKLCH area.
 * Contrast isn't monotonic, so a column can pass at both ends and fail between.
 * The coarse default grid keeps it to a few ms (edges are bisected anyway);
 * memoize it on the background and the third channel when drawing.
 */
export function passingRegion<S extends ColorSpace = "oklch">(
  value: string,
  background: string,
  minRatio: number,
  { space = "oklch" as S, x, y, xDomain, columns = 32, samples = 50 }: PassingRegionOptions<S>,
): PassingColumn[] {
  const color = parseOpaque(value);
  const bg = parseOpaque(background);
  if (!color || !bg) return [];
  const channels = readChannels(space, color);
  const [min, max] = xDomain ?? channelDomain(x);
  return Array.from({ length: columns + 1 }, (_, i) => {
    const at = min + ((max - min) * i) / columns;
    const ranges = scanRanges(
      (v) => ratioIn(space, { ...channels, [x]: at, [y]: v }, bg) >= minRatio,
      channelDomain(y),
      samples,
    );
    return { x: at, ranges };
  });
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
