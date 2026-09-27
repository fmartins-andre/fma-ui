import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  // Colocated, one convention with meta.json: src/core/<name>/<name>.stories.tsx
  stories: ["../src/core/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
};

export default config;
