import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
  stories: [
    // Colocated, one convention with meta.json: src/core/<name>/<name>.stories.tsx
    "../src/core/**/*.stories.tsx",
    // Doc-only token catalogs (color/radius/typography) — no meta.json, not registry items.
    "../src/design-tokens/**/*.stories.tsx",
  ],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  // Nothing else in this repo has ever wired Tailwind v4 into a Vite build —
  // "tailwindcss" is only a peerDependency of @fmartinsandre/ui (the consumer
  // supplies it). Storybook needs its own copy to actually compile
  // src/styles.css's `@import "tailwindcss"` into real utility classes;
  // without this plugin only the plain CSS custom properties (:root vars)
  // would load, and every `bg-*`/`text-*`/`rounded-*` class would be empty.
  async viteFinal(viteConfig) {
    viteConfig.plugins ??= [];
    viteConfig.plugins.push(tailwindcss());
    return viteConfig;
  },
};

export default config;
