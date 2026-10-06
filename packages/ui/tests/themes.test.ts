// Curation gate for src/themes/*.json: every theme is valid, listed in
// src/themes/index.ts, meets the contrast bar (src/lib/theme/contrast.ts),
// is attributed when third-party, and "default"
// matches src/styles.css (the theme Storybook and apps/web use when no other
// is applied).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { checkContrast } from "@/lib/theme/contrast";
import { themeFontPackages } from "@/lib/theme/fonts";
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

describe.each(files)("src/themes/%s", (file) => {
  const json = JSON.parse(readFileSync(join(THEMES_DIR, file), "utf8"));
  const theme = ThemeSchema.parse(json);

  it("is named after its file", () => {
    expect(`${theme.name}.json`).toBe(file);
  });

  it("only uses fonts the registry can install (@fontsource catalog)", () => {
    expect(themeFontPackages(theme).unpackaged).toEqual([]);
  });

  it("is attributed when third-party", () => {
    if (theme.source !== "third-party") return;
    expect(theme.origin, "third-party themes need an origin").toBeTruthy();
    expect(notices).toContain(`| \`${theme.name}\` | ${theme.origin} |`);
  });

  for (const mode of ["light", "dark"] as const) {
    it.each(checkContrast(theme, mode))(
      `${mode}: $foreground on $background ≥ $minimum`,
      ({ ratio, minimum }) => {
        expect(ratio).toBeGreaterThanOrEqual(minimum);
      },
    );
  }
});
