import { readFileSync } from "node:fs";
import { expect, openEditor, rootVar, test } from "./fixtures";
import { COLOR_TOKENS, getTheme, THEMES } from "./themes";

// biome-ignore lint/style/noNonNullAssertion: curated themes exist
const violet = getTheme("violet-bloom")!;
// biome-ignore lint/style/noNonNullAssertion: curated themes exist
const nature = getTheme("nature")!;

test("applies a curated preset from the URL to the whole page", async ({ page }) => {
  await openEditor(page, "violet-bloom");
  expect(await rootVar(page, "--primary")).toBe(violet.light.primary);
  expect(await rootVar(page, "--font-sans")).toBe(violet.fonts.sans);
  await expect(page.getByRole("button", { name: /Theme preset/ })).toContainText("Violet Bloom");
});

test("offers every curated theme and switches between them", async ({ page }) => {
  await openEditor(page);
  await page.getByRole("button", { name: /Theme preset/ }).click();
  for (const theme of THEMES) {
    await expect(page.getByRole("option", { name: theme.title, exact: true })).toBeVisible();
  }
  await page.getByRole("option", { name: "Nature", exact: true }).click();
  await expect.poll(() => rootVar(page, "--primary")).toBe(nature.light.primary);
});

test("has a color field for every color token", async ({ page }) => {
  await openEditor(page);
  // Expand every color group, as a user would to reach each token.
  const collapsed = page
    .locator("aside")
    .getByRole("button", { expanded: false })
    .and(page.locator("[data-slot=accordion-trigger]"));
  while ((await collapsed.count()) > 0) await collapsed.first().click();
  for (const token of COLOR_TOKENS) {
    // The value text field (the swatch's picker button is labelled "Pick …").
    const field = page
      .getByRole("textbox", { name: new RegExp(`\\(--${token}\\)$`) })
      .and(page.locator("[data-slot=input]"));
    await expect(field).toHaveCount(1);
    await expect(field).toBeVisible();
  }
});

test("edits a color, then undoes and redoes it", async ({ page }) => {
  await openEditor(page, "violet-bloom");
  const primary = page.getByRole("textbox", { name: "Background (--primary)", exact: true });
  await primary.fill("#e11d48");
  await primary.press("Enter");
  await expect.poll(() => rootVar(page, "--primary")).toBe("oklch(0.586 0.222 17.585)");
  await expect(page.getByText("Modified")).toBeVisible();

  await page.getByRole("button", { name: /^Undo/ }).click();
  await expect.poll(() => rootVar(page, "--primary")).toBe(violet.light.primary);
  await page.getByRole("button", { name: /^Redo/ }).click();
  await expect.poll(() => rootVar(page, "--primary")).toBe("oklch(0.586 0.222 17.585)");

  await page.getByRole("button", { name: /^Reset to/ }).click();
  await expect.poll(() => rootVar(page, "--primary")).toBe(violet.light.primary);
  await expect(page.getByText("Modified")).toHaveCount(0);
});

test("fixes a failing foreground to AA with the color picker", async ({ page }) => {
  await openEditor(page, "violet-bloom");
  const foreground = page.getByRole("textbox", {
    name: "Foreground (--primary-foreground)",
    exact: true,
  });
  await foreground.fill(violet.light.primary);
  await foreground.press("Enter");

  await page.getByRole("button", { name: "Pick Foreground (--primary-foreground)" }).click();
  const dialog = page.getByRole("dialog", { name: "Pick Foreground (--primary-foreground)" });
  const ratio = dialog.locator("[data-slot=color-picker-ratio]");
  await expect(ratio).toHaveAttribute("data-level", "Fail");
  await dialog.getByRole("button", { name: "Fix to AA", exact: true }).click();
  await expect(ratio).toHaveAttribute("data-level", /^AAA?$/);
  await expect.poll(() => rootVar(page, "--primary-foreground")).not.toBe(violet.light.primary);
});

test("switches to dark mode and edits the dark palette", async ({ page }) => {
  await openEditor(page, "violet-bloom");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  expect(await rootVar(page, "--background")).toBe(violet.dark.background);
  await expect(page.getByText("Editing the dark palette", { exact: false })).toBeVisible();
});

test("picks a heading font for headings only", async ({ page }) => {
  await openEditor(page);
  await page.getByRole("tab", { name: "Typography" }).first().click();
  await page.getByRole("button", { name: /Headings.*font$/ }).click();
  await page.getByRole("option", { name: "Fraunces" }).click();
  await expect.poll(() => rootVar(page, "--font-heading")).toMatch(/^Fraunces, ui-serif/);
  await expect(page.locator("#fma-ui-theme")).not.toContainText("--font-sans");
});

test("shifts every color with an HSL preset, as one undo step", async ({ page }) => {
  await openEditor(page, "nature");
  await page.getByRole("tab", { name: "Other" }).click();
  await page.getByRole("button", { name: "Grayscale" }).click();
  await expect.poll(() => rootVar(page, "--primary")).toMatch(/^oklch\([\d.]+ 0 0\)$/);
  await page.getByRole("button", { name: /^Undo/ }).click();
  await expect.poll(() => rootVar(page, "--primary")).toBe(nature.light.primary);
});

test("imports a tweakcn-style CSS theme and derives our status tokens", async ({ page }) => {
  await openEditor(page);
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await page.getByLabel("CSS or JSON").fill(
    `:root { --background: oklch(0.98 0.01 90); --foreground: oklch(0.2 0.02 90);
       --primary: oklch(0.55 0.15 150); --destructive: oklch(0.6 0.2 25);
       --destructive-foreground: oklch(1 0 0); --radius: 0.25rem; }
     .dark { --background: oklch(0.2 0.02 150); --foreground: oklch(0.95 0 0); }`,
  );
  await page.getByRole("dialog").getByRole("button", { name: "Import", exact: true }).click();
  await expect.poll(() => rootVar(page, "--primary")).toBe("oklch(0.55 0.15 150)");
  expect(await rootVar(page, "--radius")).toBe("0.25rem");
  // Text on a destructive tint, not tweakcn's white-on-solid.
  expect(await rootVar(page, "--destructive-foreground")).toBe("oklch(0.48 0.2 25)");
  await expect(page.getByRole("button", { name: /Theme preset/ })).toContainText("imported");
});

test("re-imports a published registry item by URL, shadows included", async ({ page }) => {
  await openEditor(page);
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await page.getByRole("tab", { name: "URL" }).click();
  await page.getByLabel("Theme URL").fill("/r/theme-violet-bloom.json");
  await page.getByRole("button", { name: "Fetch and import" }).click();
  await expect.poll(() => rootVar(page, "--primary")).toBe(violet.light.primary);
  // An exact round trip is recognized as the curated preset itself.
  await expect(page.getByRole("button", { name: /Theme preset/ })).toContainText("Violet Bloom");
  await page.getByRole("tab", { name: "Other" }).click();
  await expect(page.getByRole("switch", { name: /Custom shadows/ })).toBeChecked();
});

test("exports an installable registry item and an index.css with the fonts", async ({ page }) => {
  await openEditor(page, "violet-bloom");
  await page.getByRole("button", { name: "Export" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("npx shadcn@latest add @fma-ui/theme-violet-bloom")).toBeVisible();
  await expect(dialog.getByText(/@fontsource\/plus-jakarta-sans/).first()).toBeVisible();

  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "index.css", exact: true }).click();
  const css = readFileSync((await (await download).path()) ?? "", "utf8");
  expect(css).toContain('@import "@fontsource/plus-jakarta-sans/400.css";');
  expect(css).toContain(`--primary: ${violet.light.primary};`);
});

test("remembers the theme across reloads and keeps it on the rest of the site", async ({
  page,
}) => {
  await openEditor(page, "nature");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.goto("/themes");
  await expect.poll(() => rootVar(page, "--background")).toBe(nature.dark.background);
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);

  await page.getByRole("link", { name: "fma-ui" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await rootVar(page, "--primary")).toBe(nature.dark.primary);
});

test("the header picks the theme for every page, before the first paint", async ({ page }) => {
  // Server-rendered: wait until hydrated, or the click goes nowhere.
  await page.goto("/docs", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Theme preset/ }).click();
  await page.getByRole("option", { name: "Violet Bloom", exact: true }).click();
  await expect.poll(() => rootVar(page, "--primary")).toBe(violet.light.primary);

  // The inline head script applies it on its own: serve the page without the app's modules.
  await page.route("**/components", async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /<script[^>]*type="module"[^>]*>.*?<\/script>/gs,
      "",
    );
    await route.fulfill({ response, body });
  });
  await page.goto("/components");
  await expect(page.locator("script[type=module]")).toHaveCount(0);
  expect(await rootVar(page, "--primary")).toBe(violet.light.primary);
  await page.unrouteAll();

  // Vite's dev server injects the stylesheet after the theme: it must win anyway.
  await page.evaluate(() => {
    const style = document.getElementById("fma-ui-theme");
    if (style) document.head.prepend(style);
  });
  expect(await rootVar(page, "--primary")).toBe(violet.light.primary);

  await page.goto("/themes");
  await expect(page.getByRole("button", { name: /Theme preset/ })).toContainText("Violet Bloom");
  await page.getByRole("button", { name: /Theme preset/ }).click();
  await page.getByRole("option", { name: "Default", exact: true }).click();
  await expect.poll(() => rootVar(page, "--primary")).not.toBe(violet.light.primary);
  expect(await page.locator("#fma-ui-theme").count()).toBe(0);
});

test("previews the app-sidebar block inside its frame", async ({ page }) => {
  await openEditor(page, "cosmic-night");
  await page.getByRole("tab", { name: "Sidebar" }).click();
  const sidebar = page.locator("[data-slot=sidebar-container]");
  const frame = page.locator("[data-slot=sidebar-wrapper]");
  const [sidebarBox, frameBox] = [await sidebar.boundingBox(), await frame.boundingBox()];
  expect(sidebarBox && frameBox && sidebarBox.y >= frameBox.y).toBe(true);
  expect(sidebarBox && frameBox && sidebarBox.height <= frameBox.height).toBe(true);

  await page.getByRole("link", { name: "Genesis" }).click();
  await expect(page.getByText("/models/genesis")).toBeVisible();
  await expect(page).toHaveURL(/\/themes/);
});
