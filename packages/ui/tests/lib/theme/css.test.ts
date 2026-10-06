import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  generateIndexCss,
  generateThemeCss,
  modeThemeVars,
  sharedThemeVars,
} from "@/lib/theme/css";
import { parseCssVars } from "@/lib/theme/parse";
import { COLOR_TOKENS, type Theme } from "@/lib/theme/schema";
import { shadowScale } from "@/lib/theme/shadows";
import { DEFAULT_THEME } from "@/themes/index";

const STYLES = readFileSync(join(__dirname, "..", "..", "..", "src", "styles.css"), "utf8");

const shadow = {
  color: "oklch(0 0 0)",
  opacity: 0.2,
  blur: "4px",
  spread: "0px",
  offsetX: "0px",
  offsetY: "2px",
};

const custom: Theme = {
  ...DEFAULT_THEME,
  name: "custom",
  fonts: { sans: "Inter, sans-serif", mono: "JetBrains Mono, monospace" },
  radius: "0.5rem",
  spacing: "0.3rem",
  letterSpacing: "0.01em",
  shadow: { light: shadow, dark: { ...shadow, opacity: 0.5 } },
  light: { ...DEFAULT_THEME.light, primary: "oklch(0.5 0.2 260)" },
};

describe("sharedThemeVars", () => {
  it("only emits the optional settings a theme sets", () => {
    expect(sharedThemeVars(DEFAULT_THEME)).toEqual({ "--radius": "0.625rem" });
    expect(sharedThemeVars(custom)).toEqual({
      "--radius": "0.5rem",
      "--font-sans": "Inter, sans-serif",
      "--font-mono": "JetBrains Mono, monospace",
      "--spacing": "0.3rem",
      "--tracking-normal": "0.01em",
    });
  });
});

describe("modeThemeVars", () => {
  it("emits every color token of the mode", () => {
    const vars = modeThemeVars(custom, "light");
    for (const token of COLOR_TOKENS) expect(vars[`--${token}`]).toBe(custom.light[token]);
    expect(vars["--primary"]).toBe("oklch(0.5 0.2 260)");
  });

  it("derives the shadow scale per mode, with the recipe only when asked", () => {
    const light = modeThemeVars(custom, "light");
    expect(light["--shadow-md"]).toBe(shadowScale(shadow).md);
    expect(light["--shadow-color"]).toBeUndefined();
    const dark = modeThemeVars(custom, "dark", { shadowRecipe: true });
    expect(dark["--shadow-sm"]).toContain("/ 50%");
    expect(dark["--shadow-opacity"]).toBe("0.5");
    expect(modeThemeVars(DEFAULT_THEME, "light")["--shadow-sm"]).toBeUndefined();
  });
});

describe("generateThemeCss", () => {
  it("round-trips through parseCssVars", () => {
    const { light, dark } = parseCssVars(generateThemeCss(custom));
    expect(light.primary).toBe("oklch(0.5 0.2 260)");
    expect(light["font-sans"]).toBe("Inter, sans-serif");
    expect(light["shadow-offset-y"]).toBe("2px");
    expect(dark.background).toBe(custom.dark.background);
    expect(dark.radius).toBeUndefined();
  });
});

describe("generateIndexCss", () => {
  const css = generateIndexCss(custom, STYLES);

  it("keeps the rest of styles.css and swaps the :root and .dark blocks", () => {
    expect(css).toContain('@import "tailwindcss";');
    expect(css).toContain("@theme inline {");
    expect(css).toContain("@layer base {");
    expect(css.match(/^:root \{/gm)).toHaveLength(1);
    expect(css.match(/^\.dark \{/gm)).toHaveLength(1);
    const { light } = parseCssVars(css);
    expect(light.primary).toBe("oklch(0.5 0.2 260)");
    expect(light.radius).toBe("0.5rem");
  });

  it("keeps base defaults the theme doesn't override", () => {
    const { light } = parseCssVars(css);
    expect(light["font-serif"]).toContain("ui-serif");
    expect(light["shadow-sm"]).toBe(shadowScale(shadow).sm);
  });

  it("drops the Geist import only when the theme brings its own sans", () => {
    expect(css).not.toContain("@fontsource-variable/geist");
    expect(generateIndexCss(DEFAULT_THEME, STYLES)).toContain("@fontsource-variable/geist");
  });

  it("reproduces styles.css's values for the default theme", () => {
    const original = parseCssVars(STYLES);
    const generated = parseCssVars(generateIndexCss(DEFAULT_THEME, STYLES));
    expect(generated.light).toEqual(original.light);
    expect(generated.dark).toEqual(original.dark);
  });
});
