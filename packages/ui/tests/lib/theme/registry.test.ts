import { describe, expect, it } from "vitest";

import { fontStack, googleFontFamilies, googleFontsHref, primaryFamily } from "@/lib/theme/fonts";
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

  it("applies letter-spacing to body only when the theme sets it", () => {
    const tracked = themeRegistryItem({ ...violet, letterSpacing: "0.01em" });
    expect(tracked.cssVars?.light["tracking-normal"]).toBe("0.01em");
    expect(tracked.css).toEqual({
      "@layer base": { body: { "letter-spacing": "var(--tracking-normal)" } },
    });
    expect(themeRegistryItem(violet).css).toBeUndefined();
    expect(themeRegistryItem(violet).cssVars?.light["tracking-normal"]).toBeUndefined();
  });

  it("documents the Google Fonts to load, and nothing for the default theme", () => {
    expect(themeRegistryItem(violet).docs).toContain("Plus Jakarta Sans, Lora, IBM Plex Mono");
    const item = themeRegistryItem(DEFAULT_THEME);
    expect(item.docs).toBeUndefined();
    expect(item.cssVars?.theme).toEqual({});
    expect(item.cssVars?.light["shadow-sm"]).toBeUndefined();
  });
});

describe("fonts", () => {
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
