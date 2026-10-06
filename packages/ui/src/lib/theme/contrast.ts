// The contrast bar curated themes must meet (tests/themes.test.ts), also shown
// live in the theme editor. Body text meets WCAG AA (4.5:1); fills with their
// own text color (buttons, badges, muted text, tinted status text) reach 3:1 —
// the bar shadcn's own default theme meets (muted-foreground on muted is 4.34:1).

import { contrastRatio } from "./color";
import type { ColorToken, Theme, ThemeMode } from "./schema";

export interface ContrastPair {
  background: ColorToken;
  foreground: ColorToken;
  minimum: number;
}

const body = (background: ColorToken, foreground: ColorToken): ContrastPair => ({
  background,
  foreground,
  minimum: 4.5,
});
const fill = (background: ColorToken, foreground: ColorToken): ContrastPair => ({
  background,
  foreground,
  minimum: 3,
});

export const CONTRAST_PAIRS: ContrastPair[] = [
  body("background", "foreground"),
  body("card", "card-foreground"),
  body("popover", "popover-foreground"),
  body("sidebar", "sidebar-foreground"),
  fill("primary", "primary-foreground"),
  fill("secondary", "secondary-foreground"),
  fill("accent", "accent-foreground"),
  fill("muted", "muted-foreground"),
  fill("background", "muted-foreground"),
  // Our status foregrounds are text on a light tint of the color, i.e. ~on the page.
  fill("background", "destructive-foreground"),
  fill("background", "info-foreground"),
  fill("background", "success-foreground"),
  fill("background", "warning-foreground"),
  fill("invert", "invert-foreground"),
  fill("sidebar-primary", "sidebar-primary-foreground"),
  fill("sidebar-accent", "sidebar-accent-foreground"),
];

export interface ContrastResult extends ContrastPair {
  ratio: number;
  passes: boolean;
}

export function checkContrast(theme: Theme, mode: ThemeMode): ContrastResult[] {
  return CONTRAST_PAIRS.map((pair) => {
    const ratio = contrastRatio(theme[mode][pair.background], theme[mode][pair.foreground]);
    return { ...pair, ratio, passes: ratio >= pair.minimum };
  });
}
