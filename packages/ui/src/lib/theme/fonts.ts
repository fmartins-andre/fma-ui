// Theme fonts: a curated Google Fonts catalog for the editor's pickers, and
// loading whatever families a theme names from fonts.googleapis.com.

import type { Theme } from "./schema";

export type FontCategory = "sans" | "serif" | "mono";

export const FONT_FALLBACKS: Record<FontCategory, string> = {
  sans: "ui-sans-serif, system-ui, sans-serif",
  serif: "ui-serif, Georgia, serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

/** Google Fonts offered by the editor's font pickers (any other family can still be typed in). */
export const GOOGLE_FONTS: Record<FontCategory, string[]> = {
  sans: [
    "Inter",
    "Geist",
    "Roboto",
    "Open Sans",
    "Lato",
    "Poppins",
    "Montserrat",
    "Outfit",
    "Plus Jakarta Sans",
    "DM Sans",
    "Manrope",
    "Nunito",
    "Figtree",
    "Work Sans",
    "IBM Plex Sans",
    "Space Grotesk",
    "Quicksand",
    "Oxanium",
    "Rubik",
    "Sora",
  ],
  serif: [
    "Merriweather",
    "Playfair Display",
    "Lora",
    "Source Serif 4",
    "Libre Baskerville",
    "EB Garamond",
    "Crimson Pro",
    "DM Serif Display",
    "Fraunces",
    "IBM Plex Serif",
    "Noto Serif",
    "PT Serif",
  ],
  mono: [
    "JetBrains Mono",
    "Fira Code",
    "Source Code Pro",
    "IBM Plex Mono",
    "Roboto Mono",
    "Space Mono",
    "Geist Mono",
    "Ubuntu Mono",
    "DM Mono",
    "Inconsolata",
  ],
};

// Generic families and fonts that ship with operating systems (or, for Geist
// Variable, with styles.css via @fontsource) — never fetched from Google.
const LOCAL_FONTS = new Set(
  [
    "ui-sans-serif",
    "ui-serif",
    "ui-monospace",
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "sans-serif",
    "serif",
    "monospace",
    "cursive",
    "fantasy",
    "Arial",
    "Helvetica",
    "Helvetica Neue",
    "Georgia",
    "Times New Roman",
    "Times",
    "Courier New",
    "Menlo",
    "Monaco",
    "Consolas",
    "SFMono-Regular",
    "Segoe UI",
    "Geist Variable",
  ].map((font) => font.toLowerCase()),
);

/** First family in a font-family stack, unquoted: `"DM Sans", sans-serif` → `DM Sans`. */
export function primaryFamily(stack: string): string {
  return (stack.split(",")[0] ?? "").trim().replace(/^["']|["']$/g, "");
}

/** `DM Sans` → `"DM Sans", ui-sans-serif, system-ui, sans-serif`. */
export function fontStack(family: string, category: FontCategory): string {
  const name = /\s/.test(family) ? `"${family}"` : family;
  return `${name}, ${FONT_FALLBACKS[category]}`;
}

/** The theme's font families that need loading from Google Fonts. */
export function googleFontFamilies(theme: Pick<Theme, "fonts">): string[] {
  const families = Object.values(theme.fonts)
    .filter((stack): stack is string => Boolean(stack))
    .map(primaryFamily)
    .filter((family) => family && !LOCAL_FONTS.has(family.toLowerCase()));
  return [...new Set(families)];
}

// The CSS2 API rejects the whole request when a family lacks a requested
// weight, so catalog fonts without 400–700 list theirs; families typed in by
// hand get only their default (regular) weight, which always exists.
const CATALOG_WEIGHTS: Record<string, string> = {
  Lato: "400;700",
  "Libre Baskerville": "400;700",
  "PT Serif": "400;700",
  "DM Serif Display": "400",
  "Space Mono": "400;700",
  "Ubuntu Mono": "400;700",
  "DM Mono": "400;500",
};
const CATALOG = new Set(Object.values(GOOGLE_FONTS).flat());

/** Weights loaded for a catalog family (Google Fonts and @fontsource alike). */
export function catalogWeights(family: string): string[] {
  return (CATALOG_WEIGHTS[family] ?? "400;500;600;700").split(";");
}

export function isCatalogFont(family: string): boolean {
  return CATALOG.has(family);
}

function familyParam(family: string): string {
  const name = encodeURIComponent(family).replace(/%20/g, "+");
  if (!CATALOG.has(family)) return `family=${name}`;
  return `family=${name}:wght@${catalogWeights(family).join(";")}`;
}

// Every catalog font is published as a static @fontsource/<slug> package (5.x)
// with one CSS file per weight, and registers the same family name as Google
// Fonts — so a theme's font stacks work unchanged. Checked against npm when the
// catalog was assembled; tests/lib/theme/registry.test.ts pins the naming.
export const FONTSOURCE_RANGE = "^5.3.0";

/** "Plus Jakarta Sans" → "@fontsource/plus-jakarta-sans", for catalog fonts only. */
export function fontsourcePackage(family: string): string | null {
  return CATALOG.has(family) ? `@fontsource/${family.toLowerCase().replace(/\s+/g, "-")}` : null;
}

export interface ThemeFontPackages {
  /** npm dependencies, e.g. "@fontsource/inter@^5.3.0". */
  dependencies: string[];
  /** CSS imports, one per weight, e.g. "@fontsource/inter/400.css". */
  imports: string[];
  /** Google Fonts families outside the catalog: the app has to load them itself. */
  unpackaged: string[];
}

/** How to install the theme's fonts with @fontsource instead of fetching them from Google. */
export function themeFontPackages(theme: Pick<Theme, "fonts">): ThemeFontPackages {
  const result: ThemeFontPackages = { dependencies: [], imports: [], unpackaged: [] };
  for (const family of googleFontFamilies(theme)) {
    const pkg = fontsourcePackage(family);
    if (!pkg) {
      result.unpackaged.push(family);
      continue;
    }
    result.dependencies.push(`${pkg}@${FONTSOURCE_RANGE}`);
    for (const weight of catalogWeights(family)) result.imports.push(`${pkg}/${weight}.css`);
  }
  return result;
}

/** Google Fonts CSS2 URL for the given families, or null when there are none. */
export function googleFontsHref(families: string[]): string | null {
  if (families.length === 0) return null;
  const params = families.map(familyParam).join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/** Adds a <link> per family (once each) so the theme's Google Fonts load in `doc`. */
export function loadThemeFonts(theme: Pick<Theme, "fonts">, doc: Document = document): void {
  for (const family of googleFontFamilies(theme)) {
    const href = googleFontsHref([family]);
    if (!href || doc.head.querySelector(`link[data-theme-font="${CSS.escape(family)}"]`)) continue;
    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.themeFont = family;
    doc.head.append(link);
  }
}
