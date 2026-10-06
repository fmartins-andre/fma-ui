import { describe, expect, it } from "vitest";

import {
  fontStack,
  fontsourcePackage,
  googleFontFamilies,
  googleFontsHref,
  primaryFamily,
  themeFontPackages,
} from "@/lib/theme/fonts";
import { themeRegistryItem } from "@/lib/theme/registry";
import { COLOR_TOKENS } from "@/lib/theme/schema";
import { shadowScale, TAILWIND_SHADOWS } from "@/lib/theme/shadows";
import { DEFAULT_THEME, getTheme } from "@/themes/index";

// biome-ignore lint/style/noNonNullAssertion: curated theme exists
const violet = getTheme("violet-bloom")!;

describe("themeRegistryItem", () => {
  it("is a namespaced registry:theme item with no files", () => {
    const item = themeRegistryItem(violet);
    expect(item).toMatchObject({
      name: "theme-violet-bloom",
      type: "registry:theme",
      title: "Violet Bloom",
      files: [],
      categories: ["theme"],
      meta: { source: "third-party", origin: violet.origin },
    });
  });

  it("puts colors, radius and shadows in light/dark and fonts in theme", () => {
    const { cssVars } = themeRegistryItem(violet);
    for (const token of COLOR_TOKENS) {
      expect(cssVars?.light[token]).toBe(violet.light[token]);
      expect(cssVars?.dark[token]).toBe(violet.dark[token]);
    }
    expect(cssVars?.light.radius).toBe("1.4rem");
    expect(cssVars?.dark.radius).toBeUndefined();
    // biome-ignore lint/style/noNonNullAssertion: violet-bloom has a shadow
    expect(cssVars?.dark["shadow-lg"]).toBe(shadowScale(violet.shadow!.dark).lg);
    expect(cssVars?.light["shadow-color"]).toBeUndefined();
    expect(cssVars?.theme).toEqual({
      "font-sans": violet.fonts.sans,
      "font-serif": violet.fonts.serif,
      "font-mono": violet.fonts.mono,
    });
  });

  it("sets font-heading only when the theme picks one", () => {
    expect(themeRegistryItem(violet).cssVars?.theme?.["font-heading"]).toBeUndefined();
    const item = themeRegistryItem({
      ...violet,
      fonts: { ...violet.fonts, heading: "Fraunces, serif" },
    });
    expect(item.cssVars?.theme?.["font-heading"]).toBe("Fraunces, serif");
    expect(item.dependencies).toContain("@fontsource/fraunces@^5.3.0");
  });

  it("makes the consumer's tracking scale relative when the theme sets letter spacing", () => {
    const tracked = themeRegistryItem({ ...violet, letterSpacing: "0.01em" });
    expect(tracked.cssVars?.theme?.["tracking-widest"]).toBe(
      "calc(var(--tracking-normal) + 0.1em)",
    );
    expect(themeRegistryItem(violet).cssVars?.theme?.["tracking-tight"]).toBeUndefined();
  });

  it("applies letter-spacing to body only when the theme sets it", () => {
    const tracked = themeRegistryItem({ ...violet, letterSpacing: "0.01em" });
    expect(tracked.cssVars?.light["tracking-normal"]).toBe("0.01em");
    expect(tracked.css?.["@layer base"]).toEqual({
      body: { "letter-spacing": "var(--tracking-normal)" },
    });
    expect(themeRegistryItem(violet).css?.["@layer base"]).toBeUndefined();
    expect(themeRegistryItem(DEFAULT_THEME).css).toBeUndefined();
    expect(themeRegistryItem(violet).cssVars?.light["tracking-normal"]).toBeUndefined();
  });

  it("installs the theme's fonts as @fontsource packages imported per weight", () => {
    const item = themeRegistryItem(violet);
    expect(item.dependencies).toEqual([
      "@fontsource/plus-jakarta-sans@^5.3.0",
      "@fontsource/lora@^5.3.0",
      "@fontsource/ibm-plex-mono@^5.3.0",
    ]);
    expect(Object.keys(item.css ?? {})).toEqual(
      ["plus-jakarta-sans", "lora", "ibm-plex-mono"].flatMap((slug) =>
        ["400", "500", "600", "700"].map((weight) => `@import "@fontsource/${slug}/${weight}.css"`),
      ),
    );
    expect(item.docs).toBeUndefined();
  });

  it("only documents fonts outside the catalog, which it can't install", () => {
    const item = themeRegistryItem({
      ...violet,
      fonts: { sans: "Some Custom, sans-serif", mono: "Fira Code, monospace" },
    });
    expect(item.dependencies).toEqual(["@fontsource/fira-code@^5.3.0"]);
    expect(item.docs).toContain("Some Custom");
    expect(item.docs).not.toContain("Fira Code");
  });

  it("adds nothing font-related for the default theme", () => {
    const item = themeRegistryItem(DEFAULT_THEME);
    expect(item.dependencies).toBeUndefined();
    expect(item.docs).toBeUndefined();
    expect(item.cssVars?.theme).toEqual({});
    expect(item.cssVars?.light["shadow-sm"]).toBeUndefined();
  });
});

describe("fonts", () => {
  it("maps catalog families to @fontsource packages and their weights", () => {
    expect(fontsourcePackage("Source Serif 4")).toBe("@fontsource/source-serif-4");
    expect(fontsourcePackage("Some Custom")).toBeNull();
    expect(themeFontPackages({ fonts: { sans: "Lato, sans-serif" } })).toEqual({
      dependencies: ["@fontsource/lato@^5.3.0"],
      imports: ["@fontsource/lato/400.css", "@fontsource/lato/700.css"],
      unpackaged: [],
    });
  });

  it("extracts and builds font stacks", () => {
    expect(primaryFamily('"DM Sans", sans-serif')).toBe("DM Sans");
    expect(primaryFamily("Inter")).toBe("Inter");
    expect(fontStack("DM Sans", "sans")).toBe('"DM Sans", ui-sans-serif, system-ui, sans-serif');
    expect(fontStack("Lora", "serif")).toBe("Lora, ui-serif, Georgia, serif");
  });

  it("skips system and bundled fonts", () => {
    expect(
      googleFontFamilies({
        fonts: { sans: '"Geist Variable", sans-serif', serif: "Georgia, serif", mono: "Fira Code" },
      }),
    ).toEqual(["Fira Code"]);
    expect(googleFontFamilies({ fonts: { sans: "Inter", serif: "Inter, serif" } })).toEqual([
      "Inter",
    ]);
  });

  it("asks Google only for weights the family has", () => {
    expect(googleFontsHref([])).toBeNull();
    expect(googleFontsHref(["DM Sans", "Space Mono", "Some Custom"])).toBe(
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Some+Custom&display=swap",
    );
  });
});

describe("shadowScale", () => {
  const scale = shadowScale({
    color: "oklch(0 0 0 / 50%)",
    opacity: 0.2,
    blur: "3px",
    spread: "1px",
    offsetX: "0px",
    offsetY: "1px",
  });

  it("covers every Tailwind shadow size", () => {
    expect(Object.keys(scale)).toEqual(Object.keys(TAILWIND_SHADOWS));
  });

  it("multiplies the color's alpha with the opacity and layers the mid sizes", () => {
    expect(scale.xs).toBe("0px 1px 3px 1px oklch(0 0 0 / 5%)");
    expect(scale.md).toBe("0px 1px 3px 1px oklch(0 0 0 / 10%), 0px 2px 4px 0px oklch(0 0 0 / 10%)");
    expect(scale["2xl"]).toBe("0px 1px 3px 1px oklch(0 0 0 / 25%)");
  });
});
