import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Resolve the "@/*" alias from tsconfig.json — src/lib and src/hooks import
  // each other through it (e.g. "@/lib/types"), same as Storybook's viteFinal.
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        extends: true,
        plugins: [storybookTest({ configDir: path.join(dirname, ".storybook") })],
        // react-stately's Virtualizer reads process.env.VIRT_ON when NODE_ENV is
        // "test", and there's no `process` in the browser. Setting it also keeps
        // real virtualization on (it's off under test by default).
        define: { "process.env.VIRT_ON": "true" },
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          // Date libs (input-masks, date-fns-compat) have tests that assume a
          // fixed zone; pin it so results don't depend on the machine's TZ.
          env: { TZ: "UTC" },
          include: ["tests/**/*.test.ts"],
        },
      },
    ],
  },
});
