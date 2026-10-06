import { defineConfig, devices } from "@playwright/test";

// End-to-end tests for the theme editor (/themes), against the production
// build: the dev server's on-demand dependency optimization can reload the
// page mid-test.
const PORT = 4319;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1500, height: 1000 } },
    },
  ],
  webServer: {
    command: `pnpm build && PORT=${PORT} node .output/server/index.mjs`,
    url: `http://localhost:${PORT}/themes`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
