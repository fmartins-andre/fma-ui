// Curation gate for src/themes/*.json: every theme is valid, listed in
// src/themes/index.ts, readable, attributed when third-party, and "default"
// matches src/styles.css (the theme Storybook and apps/web use when no other
// is applied).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { contrastRatio } from "@/lib/theme/color";
import { parseCssVars } from "@/lib/theme/parse";
import { COLOR_TOKENS, ThemeSchema } from "@/lib/theme/schema";
import { DEFAULT_THEME, THEMES } from "@/themes/index";
import { processThemes } from "../scripts/gen-registry-json";
import { REQUIRED_TOKENS } from "./required-tokens";

const UI_ROOT = join(__dirname, "..");
const THEMES_DIR = join(UI_ROOT, "src", "themes");
const files = readdirSync(THEMES_DIR).filter((file) => file.endsWith(".json"));
const notices = readFileSync(join(THEMES_DIR, "THIRD_PARTY_NOTICES.md"), "utf8");

it("COLOR_TOKENS is the same contract as tests/required-tokens.ts", () => {
  expect([...COLOR_TOKENS]).toEqual(REQUIRED_TOKENS);
});

it("src/themes/index.ts lists every theme file, default first", () => {
  expect(THEMES.map((theme) => `${theme.name}.json`).sort()).toEqual([...files].sort());
  expect(DEFAULT_THEME.name).toBe("default");
});

it("every theme becomes a registry item", () => {
  expect(processThemes(UI_ROOT).map((item) => item.name)).toEqual(
    files.map((file) => `theme-${file.replace(/\.json$/, "")}`).sort(),
  );
});

it("the default theme matches src/styles.css", () => {
  const { light, dark } = parseCssVars(readFileSync(join(UI_ROOT, "src", "styles.css"), "utf8"));
  for (const token of COLOR_TOKENS) {
    expect(DEFAULT_THEME.light[token], `:root --${token}`).toBe(light[token]);
    expect(DEFAULT_THEME.dark[token], `.dark --${token}`).toBe(dark[token]);
  }
  expect(DEFAULT_THEME.radius).toBe(light.radius);
  // styles.css owns the default fonts/shadows; the default theme must not override them.
  expect(DEFAULT_THEME.fonts).toEqual({});
  expect(DEFAULT_THEME.shadow).toBeUndefined();
});

// Body text must meet WCAG AA (4.5:1). Fills with their own text color (buttons,
// badges, muted text, tinted status text) must reach 3:1 — the bar shadcn's own
// default theme meets (muted-foreground on muted is 4.34:1).
const BODY_PAIRS = [
  ["background", "foreground"],
  ["card", "card-foreground"],
  ["popover", "popover-foreground"],
  ["sidebar", "sidebar-foreground"],
] as const;
const FILL_PAIRS = [
  ["primary", "primary-foreground"],
  ["secondary", "secondary-foreground"],
  ["accent", "accent-foreground"],
  ["muted", "muted-foreground"],
  ["background", "muted-foreground"],
  ["background", "destructive-foreground"],
  ["background", "info-foreground"],
  ["background", "success-foreground"],
  ["background", "warning-foreground"],
  ["invert", "invert-foreground"],
  ["sidebar-primary", "sidebar-primary-foreground"],
  ["sidebar-accent", "sidebar-accent-foreground"],
] as const;

describe.each(files)("src/themes/%s", (file) => {
  const json = JSON.parse(readFileSync(join(THEMES_DIR, file), "utf8"));
  const theme = ThemeSchema.parse(json);

  it("is named after its file", () => {
    expect(`${theme.name}.json`).toBe(file);
  });

  it("is attributed when third-party", () => {
    if (theme.source !== "third-party") return;
    expect(theme.origin, "third-party themes need an origin").toBeTruthy();
    expect(notices).toContain(`| \`${theme.name}\` | ${theme.origin} |`);
  });

  for (const mode of ["light", "dark"] as const) {
    it.each(BODY_PAIRS)(`${mode}: %s / %s ≥ 4.5`, (bg, fg) => {
      expect(contrastRatio(theme[mode][bg], theme[mode][fg])).toBeGreaterThanOrEqual(4.5);
    });

    it.each(FILL_PAIRS)(`${mode}: %s / %s ≥ 3`, (bg, fg) => {
      expect(contrastRatio(theme[mode][bg], theme[mode][fg])).toBeGreaterThanOrEqual(3);
    });
  }
});
