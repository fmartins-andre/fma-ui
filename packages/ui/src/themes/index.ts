// Curated themes, published as `registry:theme` items (@fma-ui/theme-<name>) and
// offered by Storybook's theme toolbar and the theme editor. One JSON per theme;
// tests/themes.test.ts checks this list covers every file in the folder.

import { type Theme, ThemeSchema } from "@/lib/theme/schema";
import caffeine from "./caffeine.json";
import cleanSlate from "./clean-slate.json";
import cosmicNight from "./cosmic-night.json";
import defaultTheme from "./default.json";
import elegantLuxury from "./elegant-luxury.json";
import graphite from "./graphite.json";
import modernMinimal from "./modern-minimal.json";
import mono from "./mono.json";
import nature from "./nature.json";
import vintagePaper from "./vintage-paper.json";
import violetBloom from "./violet-bloom.json";

/** All curated themes, "default" (src/styles.css) first. */
export const THEMES: Theme[] = [
  defaultTheme,
  modernMinimal,
  violetBloom,
  cleanSlate,
  cosmicNight,
  graphite,
  mono,
  nature,
  caffeine,
  vintagePaper,
  elegantLuxury,
].map((theme) => ThemeSchema.parse(theme));

// biome-ignore lint/style/noNonNullAssertion: THEMES is a non-empty literal
export const DEFAULT_THEME = THEMES[0]!;

export function getTheme(name: string): Theme | undefined {
  return THEMES.find((theme) => theme.name === name);
}
