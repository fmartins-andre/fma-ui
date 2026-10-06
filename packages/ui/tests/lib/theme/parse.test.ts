import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateIndexCss, generateThemeCss } from "@/lib/theme/css";
import { parseCssVars, parseThemeInput, themeFromCssVars } from "@/lib/theme/parse";
import { themeRegistryItem } from "@/lib/theme/registry";
import { DEFAULT_THEME, getTheme, THEMES } from "@/themes/index";

const identity = { name: "imported", title: "Imported" };
const STYLES = join(__dirname, "..", "..", "..", "src", "styles.css");

describe("parseCssVars", () => {
  it("reads :root and .dark at any depth, ignoring other rules and comments", () => {
    const vars = parseCssVars(`
      @layer base {
        :root { --background: 0 0% 100%; /* --primary: red; */ --radius: 0.5rem }
        .dark { --background: 222 47% 11%; }
      }
      .other { --background: red; }
      @theme inline { --color-primary: var(--primary); }
    `);
    expect(vars.light).toEqual({ background: "0 0% 100%", radius: "0.5rem" });
    expect(vars.dark).toEqual({ background: "222 47% 11%" });
  });

  it("merges repeated blocks", () => {
    const vars = parseCssVars(":root { --a: 1; }\n:root { --b: 2; }");
    expect(vars.light).toEqual({ a: "1", b: "2" });
  });
});

describe("themeFromCssVars", () => {
  it("converts colors to oklch and keeps unset tokens from the base", () => {
    const theme = themeFromCssVars(
      { light: { primary: "#ff0000", info: "#0000ff" }, dark: {} },
      DEFAULT_THEME,
      identity,
    );
    expect(theme.light.primary).toBe("oklch(0.628 0.258 29.234)");
    expect(theme.light.background).toBe(DEFAULT_THEME.light.background);
    // Dark falls back to the light value first, like tweakcn.
    expect(theme.dark.primary).toBe("oklch(0.628 0.258 29.234)");
    expect(theme.name).toBe("imported");
  });

  it("derives our status tokens for sources that lack them (tweakcn, ui.shadcn.com)", () => {
    const theme = themeFromCssVars(
      {
        light: {
          background: "#ffffff",
          foreground: "#111111",
          destructive: "oklch(0.6 0.2 25)",
          "destructive-foreground": "#ffffff",
        },
        dark: { background: "#000000", foreground: "#eeeeee", destructive: "oklch(0.7 0.2 25)" },
      },
      DEFAULT_THEME,
      identity,
    );
    // Text on a destructive tint, not tweakcn's white-on-solid.
    expect(theme.light["destructive-foreground"]).toBe("oklch(0.48 0.2 25)");
    expect(theme.dark["destructive-foreground"]).toBe("oklch(0.8 0.2 25)");
    expect(theme.light.invert).toBe(theme.light.foreground);
    expect(theme.light["invert-foreground"]).toBe(theme.light.background);
    expect(theme.light.info).toBe(DEFAULT_THEME.light.info);
    expect(theme.dark["success-foreground"]).toBe(DEFAULT_THEME.dark["success-foreground"]);
  });

  it("reads fonts, radius, spacing, tracking and tweakcn's shadow recipe", () => {
    const theme = themeFromCssVars(
      {
        light: {
          "font-sans": "Inter, sans-serif",
          radius: "1rem",
          spacing: "0.3rem",
          "letter-spacing": "0.02em",
          "shadow-color": "hsl(0 0% 0%)",
          "shadow-opacity": "0.2",
          "shadow-blur": "8px",
          "shadow-spread": "0px",
          "shadow-x": "0px",
          "shadow-y": "4px",
        },
        dark: { "shadow-opacity": "0.5" },
      },
      DEFAULT_THEME,
      identity,
    );
    expect(theme.fonts.sans).toBe("Inter, sans-serif");
    expect(theme.radius).toBe("1rem");
    expect(theme.spacing).toBe("0.3rem");
    expect(theme.letterSpacing).toBe("0.02em");
    expect(theme.shadow?.light).toEqual({
      color: "oklch(0 0 0)",
      opacity: 0.2,
      blur: "8px",
      spread: "0px",
      offsetX: "0px",
      offsetY: "4px",
    });
    expect(theme.shadow?.dark.opacity).toBe(0.5);
    expect(theme.shadow?.dark.blur).toBe("8px");
  });
});

describe("themeFromCssVars defaults", () => {
  it("reads a heading font but not one that just points at another variable", () => {
    const picked = themeFromCssVars(
      { light: { "font-heading": "Fraunces, serif" }, dark: {} },
      DEFAULT_THEME,
      identity,
    );
    expect(picked.fonts.heading).toBe("Fraunces, serif");
    const aliased = themeFromCssVars(
      { light: { "font-heading": "var(--font-sans)" }, dark: {} },
      DEFAULT_THEME,
      identity,
    );
    expect(aliased.fonts.heading).toBeUndefined();
  });

  it.each(["0em", "0", "normal"])("treats tracking %s as unset", (value) => {
    const theme = themeFromCssVars(
      { light: { "tracking-normal": value }, dark: {} },
      DEFAULT_THEME,
      identity,
    );
    expect(theme.letterSpacing).toBeUndefined();
  });

  it("re-imports the default index.css export as the default theme's settings", () => {
    const css = generateIndexCss(DEFAULT_THEME, readFileSync(STYLES, "utf8"));
    const theme = parseThemeInput(css, DEFAULT_THEME, identity);
    expect(theme.letterSpacing).toBeUndefined();
    expect(theme.fonts.heading).toBeUndefined();
    expect(theme.light).toEqual(DEFAULT_THEME.light);
  });
});

describe("parseThemeInput", () => {
  // biome-ignore lint/style/noNonNullAssertion: curated theme exists
  const violet = { ...getTheme("violet-bloom")!, letterSpacing: "0.01em" };

  it("round-trips our own CSS export", () => {
    const theme = parseThemeInput(generateThemeCss(violet), DEFAULT_THEME, {
      name: violet.name,
      title: violet.title,
      description: violet.description,
    });
    expect(theme.light).toEqual(violet.light);
    expect(theme.dark).toEqual(violet.dark);
    expect(theme.fonts).toEqual(violet.fonts);
    expect(theme.shadow).toEqual(violet.shadow);
    expect(theme.letterSpacing).toBe(violet.letterSpacing);
  });

  it("accepts our theme JSON as-is", () => {
    expect(parseThemeInput(JSON.stringify(violet), DEFAULT_THEME, identity)).toEqual(violet);
  });

  it("accepts a shadcn registry theme item, ours or tweakcn's", () => {
    const theme = parseThemeInput(
      JSON.stringify(themeRegistryItem(violet)),
      DEFAULT_THEME,
      identity,
    );
    expect(theme.name).toBe("violet-bloom");
    expect(theme.title).toBe("Violet Bloom");
    expect(theme.light).toEqual(violet.light);
    expect(theme.fonts).toEqual(violet.fonts);
    expect(theme.letterSpacing).toBe(violet.letterSpacing);
  });

  it.each(THEMES.map((theme) => [theme.name, theme] as const))(
    "round-trips the published registry item of %s exactly",
    (_name, theme) => {
      const item = JSON.stringify(themeRegistryItem(theme));
      expect(parseThemeInput(item, DEFAULT_THEME, identity)).toEqual(theme);
    },
  );

  it("ignores a foreign registry item's unrelated meta", () => {
    const item = { ...themeRegistryItem(violet), meta: { shadow: "nope", source: 42 } };
    const theme = parseThemeInput(JSON.stringify(item), DEFAULT_THEME, identity);
    expect(theme.source).toBe("original");
    expect(theme.shadow).toBeUndefined();
  });

  it("rejects input with nothing to import", () => {
    expect(() => parseThemeInput("body { color: red }", DEFAULT_THEME, identity)).toThrow(
      /No CSS variables/,
    );
    expect(() => parseThemeInput('{"foo": 1}', DEFAULT_THEME, identity)).toThrow(/neither/);
  });
});
