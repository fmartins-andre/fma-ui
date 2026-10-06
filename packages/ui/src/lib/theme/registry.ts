// A Theme as a shadcn `registry:theme` item: `shadcn add @fma-ui/theme-<name>`
// writes cssVars.light/dark into the consumer's :root/.dark and cssVars.theme
// into its @theme block. Same shape tweakcn serves from /r/themes/<id>.json.

import type { RegistryItem } from "@fma-ui/registry";
import { themeFontPackages } from "./fonts";
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
  // Catalog fonts install as @fontsource packages imported into the consumer's
  // CSS; anything else is only named in `docs` for the app to load.
  const fonts = themeFontPackages(theme);
  const css: Record<string, unknown> = {};
  for (const path of fonts.imports) css[`@import "${path}"`] = {};
  if (theme.letterSpacing) {
    css["@layer base"] = { body: { "letter-spacing": "var(--tracking-normal)" } };
  }
  return {
    name: `${THEME_ITEM_PREFIX}${theme.name}`,
    type: "registry:theme",
    title: theme.title,
    description: theme.description,
    author: "@fma-ui/ui",
    categories: ["theme"],
    ...(fonts.unpackaged.length > 0 && {
      docs: `This theme also uses ${fonts.unpackaged.join(", ")}, which isn't installed for you. Load ${fonts.unpackaged.length > 1 ? "them" : "it"} in your app, e.g. with next/font/google, @fontsource or a <link> to fonts.googleapis.com.`,
    }),
    ...(fonts.dependencies.length > 0 && { dependencies: fonts.dependencies }),
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
    ...(Object.keys(css).length > 0 && { css }),
    meta: {
      source: theme.source,
      ...(theme.origin && { origin: theme.origin }),
      tags: theme.tags,
      // The recipe the shadow-* scale was derived from, so importing this
      // item back into the editor restores the shadow controls.
      ...(theme.shadow && { shadow: theme.shadow }),
    },
  };
}
