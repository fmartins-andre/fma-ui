// Gate: every theme token stays customizable in the theme editor (apps/web /themes).
//
// The chain, and what breaks when a link is missing:
//   1. A custom property in styles.css :root/.dark must be something a Theme can set
//      (THEME_VARS via css.ts) — this test.
//   2. Every color token must have a control in COLOR_GROUPS, exactly once — this test.
//   3. Every font slot must have a picker in FONT_CONTROLS — this test (and its Record type).
//   4. Every other styling field of ThemeSchema must be rendered by a panel — apps/web's
//      type-check (SETTINGS_COVERED in theme-editor/editor.tsx).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { modeThemeVars, sharedThemeVars } from "@/lib/theme/css";
import { COLOR_GROUPS, FONT_CONTROLS } from "@/lib/theme/editor-controls";
import { COLOR_TOKENS, type Theme, ThemeFontsSchema } from "@/lib/theme/schema";
import { DEFAULT_THEME } from "@/themes/index";

const css = readFileSync(join(__dirname, "..", "src", "styles.css"), "utf8");

/** Top-level `selector { … }` block body, by brace counting. */
function block(selector: string): string {
  const match = new RegExp(`(^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{`).exec(
    css,
  );
  if (!match) return "";
  let depth = 1;
  let i = match.index + match[0].length;
  const start = i;
  while (i < css.length && depth > 0) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") depth--;
    i++;
  }
  return css.slice(start, i - 1);
}

const declared = (body: string) => [...body.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]);

// A theme that sets every optional setting, so it emits every variable a theme can.
const everything: Theme = {
  ...DEFAULT_THEME,
  fonts: { sans: "Inter", serif: "Lora", mono: "Fira Code", heading: "Fraunces" },
  spacing: "0.25rem",
  letterSpacing: "0.01em",
  shadow: {
    light: {
      color: "#000",
      opacity: 0.1,
      blur: "3px",
      spread: "0px",
      offsetX: "0px",
      offsetY: "1px",
    },
    dark: {
      color: "#000",
      opacity: 0.1,
      blur: "3px",
      spread: "0px",
      offsetX: "0px",
      offsetY: "1px",
    },
  },
};
const themeable = new Set([
  ...Object.keys(sharedThemeVars(everything)),
  ...Object.keys(modeThemeVars(everything, "light")),
  ...Object.keys(modeThemeVars(everything, "dark")),
]);

describe("styles.css tokens are all theme settings", () => {
  it.each([":root", ".dark"])("every variable in %s can be set by a theme", (selector) => {
    const missing = declared(block(selector)).filter((name) => !themeable.has(name as string));
    expect(
      missing,
      `Not settable by a Theme, so not editable in /themes: add them to ThemeSchema (COLOR_TOKENS for colors) and css.ts`,
    ).toEqual([]);
  });

  it("every variable @theme inline reads is a theme setting or another @theme variable", () => {
    const inline = block("@theme inline");
    const own = new Set(declared(inline));
    const read = [...inline.matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1] as string);
    expect(read.filter((name) => !themeable.has(name) && !own.has(name))).toEqual([]);
  });
});

describe("the editor has a control for every token", () => {
  const listed = COLOR_GROUPS.flatMap((group) => group.colors.map((entry) => entry.token));

  it("COLOR_GROUPS lists every color token exactly once", () => {
    expect([...listed].sort()).toEqual([...COLOR_TOKENS].sort());
  });

  it("contrast hints point at real color tokens", () => {
    for (const entry of COLOR_GROUPS.flatMap((group) => group.colors)) {
      if (entry.on) expect(COLOR_TOKENS).toContain(entry.on);
    }
  });

  it("FONT_CONTROLS has a picker for every font slot", () => {
    expect(Object.keys(FONT_CONTROLS).sort()).toEqual(Object.keys(ThemeFontsSchema.shape).sort());
  });
});
