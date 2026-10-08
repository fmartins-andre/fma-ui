import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { readRegistryEnv } from "../../packages/registry/src/env.ts";
import { storybookStatic } from "./storybook-static.ts";

export default defineConfig(({ command }) => {
  // Fails the dev server and the build alike when a variable is missing.
  const { siteUrl } = readRegistryEnv();
  return {
    define: {
      "import.meta.env.FMA_UI_SITE_URL": JSON.stringify(siteUrl),
    },
    server: {
      port: 3000,
    },
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      // Before start's plugin, so its dev middleware answers /storybook/ first.
      storybookStatic(),
      tanstackStart(),
      // Cloudflare Workers: .output/server is the Worker, .output/public its static
      // assets; wrangler.jsonc is merged into the generated .output/server/wrangler.json.
      // Build only: in dev the preset turns on nitro's miniflare emulation, whose
      // runner doesn't support the miniflare wrangler installs; dev stays on Node.
      nitro(
        command === "build"
          ? {
              preset: "cloudflare_module",
              // Merged into the generated wrangler.json with wrangler.jsonc.
              cloudflare: {
                wrangler: { routes: [{ pattern: new URL(siteUrl).hostname, custom_domain: true }] },
              },
            }
          : {},
      ),
      // react's vite plugin must come after start's vite plugin
      viteReact(),
      // compiles @fma-ui/ui's styles.css (imported in src/routes/__root.tsx)
      tailwindcss(),
    ],
  };
});
