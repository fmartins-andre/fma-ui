// Imports themes from what people paste or upload into the editor: a shadcn
// styles.css (ours, tweakcn's, ui.shadcn.com/themes'), a shadcn registry theme
// item (e.g. https://tweakcn.com/r/themes/<id>.json), or one of our theme JSONs.

import { shiftLightness, toOklch } from "./color";
import {
  COLOR_TOKENS,
  type Theme,
  type ThemeColors,
  type ThemeMode,
  ThemeSchema,
  type ThemeShadow,
} from "./schema";

export interface CssVarBlocks {
  /** Variables from `:root` blocks, without the leading "--". */
  light: Record<string, string>;
  /** Variables from `.dark` blocks, without the leading "--". */
  dark: Record<string, string>;
}

/**
 * Collects the custom properties declared in `:root` and `.dark` rules, at any
 * nesting depth (tweakcn's Tailwind v3 output wraps them in `@layer base`).
 */
export function parseCssVars(css: string): CssVarBlocks {
  const result: CssVarBlocks = { light: {}, dark: {} };
  const code = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const stack: string[] = [];
  let buffer = "";
  for (const char of code) {
    if (char === "{") {
      stack.push(buffer.trim());
      buffer = "";
    } else if (char === "}") {
      collect(stack.at(-1), buffer, result);
      stack.pop();
      buffer = "";
    } else if (char === ";") {
      collect(stack.at(-1), buffer, result);
      buffer = "";
    } else {
      buffer += char;
    }
  }
  return result;
}

function collect(selector: string | undefined, declaration: string, result: CssVarBlocks) {
  const target = selector === ":root" ? result.light : selector === ".dark" ? result.dark : null;
  const match = /^\s*--([\w-]+)\s*:\s*([\s\S]+?)\s*$/.exec(declaration);
  if (target && match?.[1] && match[2]) target[match[1]] = match[2];
}

// Our destructive/info/success/warning "-foreground" is text on a light tint of
// the color (badge "info-light", alert); tweakcn/shadcn's destructive-foreground
// is text on the solid color. Sources without our tokens get them derived.
const STATUS_TOKENS = ["info", "success", "warning"] as const;
const STATUS_FOREGROUND_SHIFT: Record<ThemeMode, number> = { light: -0.12, dark: 0.1 };

function colorsFrom(
  vars: Record<string, string>,
  fallback: ThemeColors,
  mode: ThemeMode,
): ThemeColors {
  const ours = "info" in vars;
  const colors = { ...fallback };
  for (const token of COLOR_TOKENS) {
    const value = vars[token];
    if (value !== undefined) colors[token] = toOklch(value);
  }
  if (!ours) {
    for (const token of STATUS_TOKENS) {
      colors[token] = fallback[token];
      colors[`${token}-foreground`] = fallback[`${token}-foreground`];
    }
    colors["destructive-foreground"] = shiftLightness(
      colors.destructive,
      STATUS_FOREGROUND_SHIFT[mode],
    );
    colors.invert = colors.foreground;
    colors["invert-foreground"] = colors.background;
  }
  return colors;
}

function shadowFrom(
  vars: Record<string, string>,
  fallback: Record<string, string>,
): ThemeShadow | undefined {
  const get = (...names: string[]) => {
    for (const name of names) {
      const value = vars[name] ?? fallback[name];
      if (value !== undefined) return value;
    }
    return undefined;
  };
  const color = get("shadow-color");
  if (color === undefined) return undefined;
  return {
    color: toOklch(color),
    opacity: Number.parseFloat(get("shadow-opacity") ?? "0.1") || 0,
    blur: get("shadow-blur") ?? "3px",
    spread: get("shadow-spread") ?? "0px",
    offsetX: get("shadow-offset-x", "shadow-x") ?? "0px",
    offsetY: get("shadow-offset-y", "shadow-y") ?? "1px",
  };
}

export interface ThemeIdentity {
  name: string;
  title: string;
  description?: string;
}

/**
 * Builds a theme from parsed variables, taking anything missing from `base`
 * (dark falls back to the light value, then to base.dark, like tweakcn).
 */
export function themeFromCssVars(
  { light, dark }: CssVarBlocks,
  base: Theme,
  identity: ThemeIdentity,
  shared: Record<string, string> = {},
): Theme {
  const all = { ...shared, ...light };
  const font = (key: "sans" | "serif" | "mono") => all[`font-${key}`] ?? base.fonts[key];
  const lightShadow = shadowFrom(light, shared);
  const darkShadow = shadowFrom(dark, { ...shared, ...light });
  return ThemeSchema.parse({
    ...identity,
    description: identity.description ?? base.description,
    source: "original",
    tags: [],
    fonts: { sans: font("sans"), serif: font("serif"), mono: font("mono") },
    radius: all.radius ?? base.radius,
    spacing: all.spacing ?? base.spacing,
    letterSpacing: all["tracking-normal"] ?? all["letter-spacing"] ?? base.letterSpacing,
    shadow:
      lightShadow || darkShadow
        ? {
            light: lightShadow ?? darkShadow,
            dark: darkShadow ?? lightShadow,
          }
        : base.shadow,
    light: colorsFrom(light, base.light, "light"),
    dark: colorsFrom({ ...light, ...dark }, base.dark, "dark"),
  });
}

/** A theme from CSS text, JSON text (our theme or a shadcn registry item), or throws. */
export function parseThemeInput(input: string, base: Theme, identity: ThemeIdentity): Theme {
  const text = input.trim();
  if (text.startsWith("{")) {
    const json: unknown = JSON.parse(text);
    const ours = ThemeSchema.safeParse(json);
    if (ours.success) return ours.data;
    if (isRegistryTheme(json)) {
      return themeFromCssVars(
        { light: json.cssVars.light ?? {}, dark: json.cssVars.dark ?? {} },
        base,
        {
          name: json.name ?? identity.name,
          title: json.title ?? identity.title,
          description: json.description ?? identity.description,
        },
        json.cssVars.theme ?? {},
      );
    }
    throw new Error("JSON is neither a theme nor a shadcn registry item with cssVars.");
  }
  const vars = parseCssVars(text);
  if (Object.keys(vars.light).length === 0 && Object.keys(vars.dark).length === 0) {
    throw new Error("No CSS variables found in :root or .dark.");
  }
  return themeFromCssVars(vars, base, identity);
}

interface RegistryTheme {
  name?: string;
  title?: string;
  description?: string;
  cssVars: {
    theme?: Record<string, string>;
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
}

function isRegistryTheme(json: unknown): json is RegistryTheme {
  return (
    typeof json === "object" &&
    json !== null &&
    "cssVars" in json &&
    typeof json.cssVars === "object"
  );
}
