import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart(),
    // self-hosted Node output at .output/server/index.mjs (see package.json "start")
    nitro(),
    // react's vite plugin must come after start's vite plugin
    viteReact(),
  ],
});
