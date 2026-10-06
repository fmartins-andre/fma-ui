// Derives Tailwind's shadow-2xs … shadow-2xl from one base shadow. Adapted from
// tweakcn's utils/shadows.ts (https://github.com/jnsahaj/tweakcn, Apache-2.0):
// same layering and opacity multipliers, colors emitted as oklch.

import { alphaOf, withAlpha } from "./color";
import type { ThemeShadow } from "./schema";

export const SHADOW_SIZES = ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"] as const;

export type ShadowSize = (typeof SHADOW_SIZES)[number];

/** Tailwind v4's default shadow scale, what styles.css falls back to without a theme shadow. */
export const TAILWIND_SHADOWS: Record<ShadowSize, string> = {
  "2xs": "0 1px rgb(0 0 0 / 0.05)",
  xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
};

export function shadowScale(shadow: ThemeShadow): Record<ShadowSize, string> {
  const { offsetX, offsetY, blur, spread } = shadow;
  // The color's own alpha is multiplied in, so "oklch(0 0 0 / 50%)" at opacity 0.2 is 0.1.
  const baseAlpha = alphaOf(shadow.color) * shadow.opacity;
  const color = (multiplier: number) =>
    withAlpha(shadow.color, Math.min(1, Number((baseAlpha * multiplier).toFixed(2))));
  const base = (multiplier: number) =>
    `${offsetX} ${offsetY} ${blur} ${spread} ${color(multiplier)}`;
  const spread2 = `${(Number.parseFloat(spread) || 0) - 1}px`;
  const second = (y: string, blur2: string) => `${offsetX} ${y} ${blur2} ${spread2} ${color(1)}`;

  return {
    "2xs": base(0.5),
    xs: base(0.5),
    sm: `${base(1)}, ${second("1px", "2px")}`,
    md: `${base(1)}, ${second("2px", "4px")}`,
    lg: `${base(1)}, ${second("4px", "6px")}`,
    xl: `${base(1)}, ${second("8px", "10px")}`,
    "2xl": base(2.5),
  };
}
