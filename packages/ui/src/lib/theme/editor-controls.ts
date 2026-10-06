// What the theme editor (apps/web /themes) offers a control for. Kept here,
// next to the schema, so tests/theme-editor-coverage.test.ts can prove every
// theme token stays editable: every color token sits in exactly one group, and
// the editor's panels key their non-color controls by EditableSetting, so a new
// ThemeSchema field without a control fails apps/web's type-check.

import type { FontCategory } from "./fonts";
import type { ColorToken, Theme, ThemeFonts } from "./schema";

export interface ColorEntry {
  token: ColorToken;
  label: string;
  /** For text colors: the background they sit on (contrast badge). */
  on?: ColorToken;
}

export interface ColorGroup {
  id: string;
  title: string;
  hint?: string;
  colors: ColorEntry[];
}

const pair = (bg: ColorToken, fg: ColorToken): ColorEntry[] => [
  { token: bg, label: "Background" },
  { token: fg, label: "Foreground", on: bg },
];

export const COLOR_GROUPS: ColorGroup[] = [
  { id: "primary", title: "Primary", colors: pair("primary", "primary-foreground") },
  { id: "secondary", title: "Secondary", colors: pair("secondary", "secondary-foreground") },
  { id: "accent", title: "Accent", colors: pair("accent", "accent-foreground") },
  { id: "base", title: "Base", colors: pair("background", "foreground") },
  { id: "card", title: "Card", colors: pair("card", "card-foreground") },
  { id: "popover", title: "Popover", colors: pair("popover", "popover-foreground") },
  { id: "muted", title: "Muted", colors: pair("muted", "muted-foreground") },
  {
    id: "status",
    title: "Status",
    hint: "Each foreground is text on a light tint of its color (badges, alerts), so contrast is checked against the page background.",
    colors: (["destructive", "info", "success", "warning"] as const).flatMap((status) => [
      { token: status, label: status[0]?.toUpperCase() + status.slice(1) },
      { token: `${status}-foreground` as ColorToken, label: "Foreground", on: "background" },
    ]),
  },
  { id: "invert", title: "Invert", colors: pair("invert", "invert-foreground") },
  {
    id: "border",
    title: "Border & input",
    colors: [
      { token: "border", label: "Border" },
      { token: "input", label: "Input" },
      { token: "ring", label: "Ring" },
    ],
  },
  {
    id: "chart",
    title: "Chart",
    colors: (["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const).map((token) => ({
      token,
      label: `Chart ${token.slice(-1)}`,
    })),
  },
  {
    id: "sidebar",
    title: "Sidebar",
    colors: [
      ...pair("sidebar", "sidebar-foreground"),
      { token: "sidebar-primary", label: "Primary" },
      { token: "sidebar-primary-foreground", label: "Primary foreground", on: "sidebar-primary" },
      { token: "sidebar-accent", label: "Accent" },
      { token: "sidebar-accent-foreground", label: "Accent foreground", on: "sidebar-accent" },
      { token: "sidebar-border", label: "Border" },
      { token: "sidebar-ring", label: "Ring" },
    ],
  },
];

/** Theme fields that identify or describe a theme rather than style it (edited in Export). */
export type ThemeIdentityField = "name" | "title" | "description" | "source" | "origin" | "tags";

/** Every styling field of a Theme besides the per-mode colors (edited via COLOR_GROUPS). */
export type EditableSetting = Exclude<keyof Theme, ThemeIdentityField | "light" | "dark">;

export type FontSlot = keyof ThemeFonts;

/** The font pickers, one per font slot (Record: a new slot fails type-check until listed). */
export const FONT_CONTROLS: Record<
  FontSlot,
  {
    label: string;
    utility: string;
    /** GOOGLE_FONTS categories offered by the picker. */
    catalog: FontCategory[];
    /** Generic fallback appended to a picked family. */
    fallback: FontCategory;
  }
> = {
  sans: { label: "Sans-serif", utility: "font-sans", catalog: ["sans"], fallback: "sans" },
  serif: { label: "Serif", utility: "font-serif", catalog: ["serif"], fallback: "serif" },
  mono: { label: "Monospace", utility: "font-mono", catalog: ["mono"], fallback: "mono" },
  heading: {
    label: "Headings (default: sans)",
    utility: "font-heading",
    catalog: ["sans", "serif"],
    fallback: "sans",
  },
};
