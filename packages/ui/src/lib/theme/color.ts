// Color helpers for themes. Values are stored as CSS color strings (oklch, like
// src/styles.css); culori parses anything CSS accepts, plus shadcn v3's bare
// "222 47% 11%" HSL triplets.

import {
  type Color,
  clampChroma,
  converter,
  formatHex,
  type Oklch,
  parse,
  wcagContrast,
} from "culori";

const toOklchColor = converter("oklch");
const toHslColor = converter("hsl");

function parseColor(value: string): Color | undefined {
  const trimmed = value.trim();
  // Bare "h s% l%" triplets (shadcn's Tailwind v3 format) are wrapped in hsl().
  return parse(/^-?\d/.test(trimmed) ? `hsl(${trimmed})` : trimmed);
}

export function isColor(value: string): boolean {
  return parseColor(value) !== undefined;
}

const round = (n: number, digits: number) => {
  const r = Number(n.toFixed(digits));
  return Object.is(r, -0) ? 0 : r;
};

function formatOklch({ l, c, h, alpha }: Oklch): string {
  const hue = c < 0.0005 || h === undefined || Number.isNaN(h) ? 0 : h;
  const body = `${round(l, 3)} ${round(c, 3)} ${round(hue, 3)}`;
  return alpha !== undefined && alpha < 1
    ? `oklch(${body} / ${round(alpha * 100, 1)}%)`
    : `oklch(${body})`;
}

function mapOklch(value: string, map: (color: Oklch) => Oklch): string {
  const color = parseColor(value);
  return color ? formatOklch(map(toOklchColor(color))) : value;
}

/** Any CSS color → "oklch(L C H)" (or "oklch(L C H / A%)"); unparseable input is returned as-is. */
export function toOklch(value: string): string {
  return mapOklch(value, (color) => color);
}

/** Any CSS color → "#rrggbb" (alpha dropped), for <input type="color">. */
export function toHex(value: string): string {
  const color = parseColor(value);
  return color ? formatHex(clampChroma(color, "oklch")) : "#000000";
}

/** Alpha of a CSS color (1 when opaque or unparseable). */
export function alphaOf(value: string): number {
  return parseColor(value)?.alpha ?? 1;
}

/** The same color with another alpha (0–1). */
export function withAlpha(value: string, alpha: number): string {
  return mapOklch(value, (color) => ({ ...color, alpha }));
}

/** WCAG 2 contrast ratio between two colors (1–21). Translucent colors use their opaque base. */
export function contrastRatio(a: string, b: string): number {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return 1;
  return wcagContrast({ ...ca, alpha: 1 }, { ...cb, alpha: 1 });
}

/** Moves a color's oklch lightness by `delta` (clamped to 0–1), keeping chroma, hue and alpha. */
export function shiftLightness(value: string, delta: number): string {
  return mapOklch(value, (color) => ({ ...color, l: Math.min(1, Math.max(0, color.l + delta)) }));
}

export interface HslAdjustment {
  /** Degrees added to the hue. */
  hueShift: number;
  /** Multiplier for saturation (0 = grayscale). */
  saturationScale: number;
  /** Multiplier for lightness. */
  lightnessScale: number;
}

export const NO_HSL_ADJUSTMENT: HslAdjustment = {
  hueShift: 0,
  saturationScale: 1,
  lightnessScale: 1,
};

/** tweakcn's global HSL adjustment: shift hue, scale saturation/lightness, keep alpha. */
export function adjustHsl(
  value: string,
  { hueShift, saturationScale, lightnessScale }: HslAdjustment,
): string {
  const color = parseColor(value);
  if (!color) return value;
  const hsl = toHslColor(color);
  return formatOklch(
    toOklchColor({
      ...hsl,
      h: ((((hsl.h ?? 0) + hueShift) % 360) + 360) % 360,
      s: Math.min(1, Math.max(0, hsl.s * saturationScale)),
      l: Math.min(1, Math.max(0, hsl.l * lightnessScale)),
    }),
  );
}
