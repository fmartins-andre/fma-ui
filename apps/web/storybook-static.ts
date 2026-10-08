import { execSync } from "node:child_process";
import { cpSync, createReadStream, existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import type { Plugin } from "vite";

// The site serves packages/ui's static Storybook build at /storybook/ — in the
// deployed Worker (copied into public/, so it ships as static assets) and in
// the dev server (straight from the build folder, when there is one).

const UI = resolve(import.meta.dirname, "../../packages/ui");
const STATIC_DIR = join(UI, "storybook-static");
const PUBLIC_COPY = resolve(import.meta.dirname, "public/storybook");
const BASE = "/storybook/";
/** `pnpm storybook`, for a dev server without a static build. */
const DEV_FALLBACK = "http://localhost:6006/";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function hasBuild() {
  return existsSync(join(STATIC_DIR, "index.html"));
}

/** Newest modification time under `dir` (files only). */
function newest(dir: string): number {
  let latest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue;
    latest = Math.max(latest, statSync(join(entry.parentPath, entry.name)).mtimeMs);
  }
  return latest;
}

/** The build exists and is newer than every source and Storybook config file. */
function isFresh() {
  if (!hasBuild()) return false;
  const built = statSync(join(STATIC_DIR, "index.html")).mtimeMs;
  return built >= Math.max(newest(join(UI, "src")), newest(join(UI, ".storybook")));
}

export function storybookStatic(): Plugin {
  return {
    name: "fma-ui:storybook-static",
    config(_, { command }) {
      let url = BASE;
      if (command === "build") {
        if (!isFresh()) {
          console.info("[storybook] static build missing or outdated: building it");
          execSync("pnpm --filter @fma-ui/ui build-storybook", { stdio: "inherit" });
        }
        rmSync(PUBLIC_COPY, { recursive: true, force: true });
        cpSync(STATIC_DIR, PUBLIC_COPY, { recursive: true });
      } else if (!hasBuild()) {
        url = DEV_FALLBACK;
        console.warn(
          `[storybook] no static build in packages/ui/storybook-static: Storybook links go to ${DEV_FALLBACK}` +
            " (run `pnpm --filter @fma-ui/ui build-storybook` and restart to serve it at /storybook/)",
        );
      }
      return { define: { "import.meta.env.VITE_STORYBOOK_URL": JSON.stringify(url) } };
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? "").split("?")[0] ?? "";
        if (pathname === BASE.slice(0, -1)) {
          res.writeHead(301, { location: BASE + (req.url ?? "").slice(pathname.length) });
          res.end();
          return;
        }
        if (!pathname.startsWith(BASE) || !hasBuild()) return next();
        const relative = decodeURIComponent(pathname.slice(BASE.length)) || "index.html";
        const file = normalize(join(STATIC_DIR, relative));
        if (!file.startsWith(STATIC_DIR) || !existsSync(file) || !statSync(file).isFile()) {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }
        res.setHeader("content-type", TYPES[extname(file)] ?? "application/octet-stream");
        createReadStream(file).pipe(res);
      });
    },
  };
}
