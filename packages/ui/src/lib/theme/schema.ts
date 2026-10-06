// Theme format for the curated themes in src/themes/*.json and the theme editor
// (apps/web). Shaped after tweakcn's ThemeStyles (https://github.com/jnsahaj/tweakcn,
// Apache-2.0), but with this repo's extra status tokens (info/success/warning/invert)
// and the non-color settings lifted out of light/dark, since they're shared by both.

import { z } from "zod";

/** Every color a theme must define, per mode. Same list as tests/required-tokens.ts. */
export const COLOR_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "info",
  "info-foreground",
  "success",
  "success-foreground",
  "warning",
  "warning-foreground",
  "invert",
  "invert-foreground",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

export type ColorToken = (typeof COLOR_TOKENS)[number];

export const ThemeColorsSchema = z.object(
  Object.fromEntries(COLOR_TOKENS.map((token) => [token, z.string().min(1)])) as Record<
    ColorToken,
    z.ZodString
  >,
);

export type ThemeColors = z.infer<typeof ThemeColorsSchema>;

/**
 * Layered box-shadow recipe (tweakcn's): one base shadow that every Tailwind
 * shadow-* size is derived from. Lengths are CSS lengths ("4px"), opacity is 0–1.
 */
export const ThemeShadowSchema = z.object({
  color: z.string().min(1),
  opacity: z.number().min(0).max(1),
  blur: z.string(),
  spread: z.string(),
  offsetX: z.string(),
  offsetY: z.string(),
});

export type ThemeShadow = z.infer<typeof ThemeShadowSchema>;

export const ThemeFontsSchema = z.object({
  sans: z.string().optional(),
  serif: z.string().optional(),
  mono: z.string().optional(),
});

export type ThemeFonts = z.infer<typeof ThemeFontsSchema>;

export const ThemeSchema = z.object({
  name: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "kebab-case"),
  title: z.string().min(1),
  description: z.string().min(1),
  // Same meaning as ComponentMetaSchema.source; "third-party" needs `origin`.
  source: z.enum(["original", "third-party"]).default("original"),
  origin: z.string().optional(),
  tags: z.array(z.string()).default([]),
  // Optional settings: when absent the theme leaves them alone (styles.css /
  // Tailwind defaults apply), so the registry item doesn't override them either.
  fonts: ThemeFontsSchema.default({}),
  radius: z.string(),
  spacing: z.string().optional(),
  letterSpacing: z.string().optional(),
  shadow: z.object({ light: ThemeShadowSchema, dark: ThemeShadowSchema }).optional(),
  light: ThemeColorsSchema,
  dark: ThemeColorsSchema,
});

export type Theme = z.infer<typeof ThemeSchema>;
export type ThemeInput = z.input<typeof ThemeSchema>;
export type ThemeMode = "light" | "dark";
