import { test as base, expect, type Page } from "@playwright/test";

/** Fails any test that logs a console error or throws on the page. */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await use(errors);
      expect(errors, "console errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** A custom property's current value on <html>, where the site theme lands. */
export function rootVar(page: Page, name: string) {
  return page.evaluate(
    (property) => getComputedStyle(document.documentElement).getPropertyValue(property).trim(),
    name,
  );
}

export async function openEditor(page: Page, preset = "default") {
  await page.goto(`/themes?preset=${preset}`);
  await expect(page.getByRole("heading", { name: "Themes" })).toBeVisible();
}
