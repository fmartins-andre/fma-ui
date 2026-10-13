import type { Page } from "@playwright/test";
import registry from "../../../packages/ui/registry.json" with { type: "json" };
import { expect, test } from "./fixtures";

/** Server-rendered pages: wait until hydrated, or early clicks go nowhere. */
async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
}

const components = registry.items.filter((item) => item.type === "registry:ui");
const blocks = registry.items.filter((item) => item.type === "registry:block");

test("home links to the docs, components, blocks and themes", async ({ page }) => {
  await open(page, "/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs");
  await expect(nav.getByRole("link", { name: "Themes" })).toHaveAttribute("href", "/themes");
  await expect(page.getByRole("link", { name: "GitHub", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/fmartins-andre/fma-ui",
  );
  await expect(nav.getByRole("link", { name: /Storybook/ })).toBeVisible();
  await page.getByRole("link", { name: "Get started" }).click();
  await expect(page).toHaveURL(/\/docs$/);
  await expect(page.getByRole("heading", { name: "Introduction" })).toBeVisible();
});

test("the components menu lists every component and opens its page", async ({ page }) => {
  await open(page, "/");
  await page.getByRole("button", { name: "Components" }).click();
  const menu = page.getByRole("dialog", { name: "Components" });
  for (const item of components) {
    await expect(menu.getByRole("link", { name: item.title, exact: true })).toBeAttached();
  }
  await menu.getByRole("link", { name: "Badge", exact: true }).click();
  await expect(page).toHaveURL(/\/components\/badge$/);
  await expect(page.getByRole("heading", { level: 1, name: "Badge" })).toBeVisible();
});

test("the blocks menu lists every block", async ({ page }) => {
  await open(page, "/");
  await page.getByRole("button", { name: "Blocks" }).click();
  const menu = page.getByRole("dialog", { name: "Blocks" });
  for (const item of blocks) {
    await expect(menu.getByRole("link", { name: new RegExp(item.title) })).toBeVisible();
  }
});

test("the components index groups every component", async ({ page }) => {
  await open(page, "/components");
  const main = page.getByRole("main");
  for (const item of components) {
    await expect(main.locator(`a[href="/components/${item.name}"]`)).toContainText(item.title);
  }
});

test("a component page shows a live preview, its code and the install command", async ({
  page,
}) => {
  await open(page, "/components/button");
  const preview = page.locator("[data-slot=story-preview]").first();
  await expect(preview.getByRole("button").first()).toBeVisible();
  await page.getByRole("tab", { name: "Code" }).first().click();
  await expect(page.getByRole("tabpanel").first()).toContainText("export const");
  await expect(page.getByText("pnpm dlx shadcn@latest add @fma-ui/button")).toBeVisible();
  await page.getByRole("tab", { name: "Manual" }).click();
  await expect(page.getByText("components/fma-ui/button.tsx")).toBeVisible();
});

test("a block page previews the block in an iframe", async ({ page }) => {
  await open(page, "/blocks/app-sidebar");
  const frame = page.frameLocator('iframe[title$="preview"]').first();
  await expect(frame.getByText("Acme Inc").first()).toBeVisible();
});

test("search finds a component", async ({ page }) => {
  await open(page, "/docs");
  await page.getByRole("button", { name: /Search docs/ }).click();
  await page.keyboard.type("date pick");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/components\/date-picker$/);
});

test("the mode toggle persists dark mode", async ({ page }) => {
  await open(page, "/docs");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeVisible();
});

test("serves the static Storybook build at /storybook/", async ({ page }) => {
  await open(page, "/components/badge");
  const main = page.getByRole("main");
  await expect(main.getByRole("link", { name: "Storybook", exact: true })).toHaveAttribute(
    "href",
    "/storybook/?path=/docs/ui-badge--docs",
  );
  await expect(
    page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Storybook" }),
  ).toHaveAttribute("href", "/storybook/");
  const index = await page.request.get("/storybook/index.json");
  expect(index.ok()).toBe(true);
  expect(Object.keys((await index.json()).entries)).toContain("ui-badge--default");
  await page.goto("/storybook/iframe.html?id=ui-badge--default&viewMode=story");
  await expect(page.locator("#storybook-root").getByText("Badge")).toBeVisible();
});
