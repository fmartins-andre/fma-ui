// Turns a Theme into CSS custom properties: as stylesheet text (the editor's
// downloads) or as inline styles on an element (live preview in the editor and
// Storybook). Variable names match src/styles.css, which maps them into
// Tailwind through `@theme inline`.

import { themeFontPackages } from "./fonts";
import { COLOR_TOKENS, type Theme, type ThemeMode } from "./schema";
import { SHADOW_SIZES, shadowScale } from "./shadows";

/** Every custom property a theme can set, for clearing inline styles. */
export const THEME_VARS = [
  ...COLOR_TOKENS.map((token) => `--${token}`),
  "--radius",
  "--font-sans",
  "--font-serif",
  "--font-mono",
  "--spacing",
  "--tracking-normal",
  ...SHADOW_SIZES.map((size) => `--shadow-${size}`),
  "--shadow-color",
  "--shadow-opacity",
  "--shadow-blur",
  "--shadow-spread",
  "--shadow-offset-x",
  "--shadow-offset-y",
];

export interface ThemeVarsOptions {
  /**
   * Also emit the raw shadow recipe (--shadow-color, --shadow-blur, …) so the
   * CSS can be imported back into the editor. Off for the registry, where
   * shadcn would map each of them into `@theme inline` as a bogus shadow-* utility.
   */
  shadowRecipe?: boolean;
}

/** Settings shared by both modes (they live in :root only). */
export function sharedThemeVars(theme: Theme): Record<string, string> {
  return {
    "--radius": theme.radius,
    ...(theme.fonts.sans && { "--font-sans": theme.fonts.sans }),
    ...(theme.fonts.serif && { "--font-serif": theme.fonts.serif }),
    ...(theme.fonts.mono && { "--font-mono": theme.fonts.mono }),
    ...(theme.spacing && { "--spacing": theme.spacing }),
    ...(theme.letterSpacing && { "--tracking-normal": theme.letterSpacing }),
  };
}

/** Colors (and shadows) of one mode. */
export function modeThemeVars(
  theme: Theme,
  mode: ThemeMode,
  { shadowRecipe = false }: ThemeVarsOptions = {},
): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const token of COLOR_TOKENS) vars[`--${token}`] = theme[mode][token];
  const shadow = theme.shadow?.[mode];
  if (shadow) {
    const scale = shadowScale(shadow);
    for (const size of SHADOW_SIZES) vars[`--shadow-${size}`] = scale[size];
    if (shadowRecipe) {
      vars["--shadow-color"] = shadow.color;
      vars["--shadow-opacity"] = String(shadow.opacity);
      vars["--shadow-blur"] = shadow.blur;
      vars["--shadow-spread"] = shadow.spread;
      vars["--shadow-offset-x"] = shadow.offsetX;
      vars["--shadow-offset-y"] = shadow.offsetY;
    }
  }
  return vars;
}

function block(selector: string, vars: Record<string, string>): string {
  const lines = Object.entries(vars).map(([name, value]) => `  ${name}: ${value};`);
  return `${selector} {\n${lines.join("\n")}\n}`;
}

/** `:root { … }` and `.dark { … }` blocks, ready to replace the ones in a shadcn styles.css. */
export function generateThemeCss(
  theme: Theme,
  options: ThemeVarsOptions = { shadowRecipe: true },
): string {
  return `${block(":root", { ...sharedThemeVars(theme), ...modeThemeVars(theme, "light", options) })}

${block(".dark", modeThemeVars(theme, "dark", options))}
`;
}

/** Finds a top-level `selector { … }` block by brace counting; returns [start, end) or null. */
function findBlock(css: string, selector: string): [number, number] | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(^|\\n)${escaped}\\s*\\{`).exec(css);
  if (!match) return null;
  const start = match.index + match[1].length;
  let depth = 1;
  let i = match.index + match[0].length;
  while (i < css.length && depth > 0) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") depth--;
    i++;
  }
  return [start, i];
}

/**
 * A complete Tailwind v4 stylesheet for the theme: `baseCss` (this repo's
 * src/styles.css) with its :root and .dark blocks swapped for the theme's.
 */
export function generateIndexCss(theme: Theme, baseCss: string): string {
  const root = block(":root", {
    ...defaultsFrom(baseCss, ":root"),
    ...sharedThemeVars(theme),
    ...modeThemeVars(theme, "light", { shadowRecipe: true }),
  });
  const dark = block(".dark", modeThemeVars(theme, "dark", { shadowRecipe: true }));
  let css = baseCss;
  for (const [selector, replacement] of [
    [":root", root],
    [".dark", dark],
  ] as const) {
    const range = findBlock(css, selector);
    if (range) css = css.slice(0, range[0]) + replacement + css.slice(range[1]);
  }
  // Geist is only the default sans; a theme with its own drops the @fontsource import.
  if (theme.fonts.sans) css = css.replace(/^@import "@fontsource-variable\/geist";\n/m, "");
  // The theme's catalog fonts, from the @fontsource packages (see themeFontPackages).
  const imports = themeFontPackages(theme).imports.map((path) => `@import "${path}";\n`);
  return css.replace(/^(@import "tailwindcss";\n)/m, `$1${imports.join("")}`);
}

// Non-color defaults declared in the base stylesheet's block (fonts, shadows)
// that the theme doesn't override, so swapping the block doesn't drop them.
function defaultsFrom(css: string, selector: string): Record<string, string> {
  const range = findBlock(css, selector);
  if (!range) return {};
  const vars: Record<string, string> = {};
  const body = css.slice(range[0], range[1]);
  for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    if (name && value && !COLOR_TOKENS.includes(name.slice(2) as never)) vars[name] = value.trim();
  }
  return vars;
}

/** Sets the theme's variables for `mode` as inline styles on `element` (replacing any earlier theme). */
export function applyTheme(element: HTMLElement, theme: Theme, mode: ThemeMode): void {
  clearTheme(element);
  const vars = { ...sharedThemeVars(theme), ...modeThemeVars(theme, mode) };
  for (const [name, value] of Object.entries(vars)) element.style.setProperty(name, value);
}

/** Removes every theme variable `applyTheme` may have set, so the stylesheet's values apply again. */
export function clearTheme(element: HTMLElement): void {
  for (const name of THEME_VARS) element.style.removeProperty(name);
}
