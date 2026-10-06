// A Theme as a shadcn `registry:theme` item: `shadcn add @fma-ui/theme-<name>`
// writes cssVars.light/dark into the consumer's :root/.dark and cssVars.theme
// into its @theme block. Same shape tweakcn serves from /r/themes/<id>.json.

import type { RegistryItem } from "@fma-ui/registry";
import { googleFontFamilies } from "./fonts";
import { COLOR_TOKENS, type Theme, type ThemeMode } from "./schema";
import { SHADOW_SIZES, shadowScale } from "./shadows";

export const THEME_ITEM_PREFIX = "theme-";

function modeVars(theme: Theme, mode: ThemeMode): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const token of COLOR_TOKENS) vars[token] = theme[mode][token];
  const shadow = theme.shadow?.[mode];
  if (shadow) {
    const scale = shadowScale(shadow);
    for (const size of SHADOW_SIZES) vars[`shadow-${size}`] = scale[size];
  }
  return vars;
}

export function themeRegistryItem(theme: Theme): RegistryItem {
  const fonts = googleFontFamilies(theme);
  return {
    name: `${THEME_ITEM_PREFIX}${theme.name}`,
    type: "registry:theme",
    title: theme.title,
    description: theme.description,
    author: "@fma-ui/ui",
    categories: ["theme"],
    ...(fonts.length > 0 && {
      docs: `This theme uses ${fonts.join(", ")} (Google Fonts). Load ${fonts.length > 1 ? "them" : "it"} in your app, e.g. with next/font/google, @fontsource or a <link> to fonts.googleapis.com.`,
    }),
    files: [],
    cssVars: {
      theme: {
        ...(theme.fonts.sans && { "font-sans": theme.fonts.sans }),
        ...(theme.fonts.serif && { "font-serif": theme.fonts.serif }),
        ...(theme.fonts.mono && { "font-mono": theme.fonts.mono }),
      },
      light: {
        ...modeVars(theme, "light"),
        radius: theme.radius,
        ...(theme.spacing && { spacing: theme.spacing }),
        ...(theme.letterSpacing && { "tracking-normal": theme.letterSpacing }),
      },
      dark: modeVars(theme, "dark"),
    },
    ...(theme.letterSpacing && {
      css: { "@layer base": { body: { "letter-spacing": "var(--tracking-normal)" } } },
    }),
    meta: {
      source: theme.source,
      ...(theme.origin && { origin: theme.origin }),
      tags: theme.tags,
    },
  };
}
