// Pulls official shadcn/ui components into this package's folder-per-component
// layout (src/core/<name>/<name>.tsx + meta.json), instead of the flat
// components/ui/<name>.tsx the shadcn CLI writes by default.
//
// Usage (from packages/ui, or via `pnpm add:shadcn` at the repo root):
//   pnpm add:shadcn button card "alert-dialog"
//   pnpm add:shadcn all              (fetches every available ui component, one at a time)
//
// What it does:
//   1. Runs the real `shadcn add` against components.json (whose `ui`/`components`
//      aliases point at a throwaway staging folder, src/core/_incoming) — this is
//      what installs any npm dependencies the component(s) need, too.
//      For "all": the CLI's own `--all` flag isn't safe to use here — it
//      preflight-checks every item's URL for the *current* style/base up front
//      and aborts the whole batch on the first miss. "aria-nova" doesn't have
//      full parity with every component yet (e.g. menubar 404s), so instead we
//      discover the real item list via `shadcn search @shadcn --type ui --json`
//      and add items one at a time, skipping ones that don't resolve for this
//      style instead of losing the whole run.
//   2. Moves each staged file into src/core/<name>/<name>.tsx, rewriting any
//      cross-component import (components.json's "ui"/"components" aliases
//      point at the staging dir, so a component that imports another one,
//      e.g. alert-dialog -> button, is written as "@/core/_incoming/button")
//      to this repo's real per-folder path ("@/core/button/button").
//   3. Scaffolds a meta.json stub (source: "shadcn") if one doesn't exist yet.
//
// After this, edit meta.json (category/description/tags), customize the component
// if you want ("customized"), then run `pnpm generate:registry && pnpm registry:build`.

import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const STAGING_DIR = join("src", "core", "_incoming");
const CORE_DIR = join("src", "core");

function toTitle(id: string): string {
  return id
    .split("-")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function main() {
  const args = process.argv.slice(2);
  const wantsAll = args.length === 1 && args[0]?.toLowerCase() === "all";

  if (args.length === 0 || (!wantsAll && args.some((a) => a.toLowerCase() === "all"))) {
    console.error("Usage: pnpm add:shadcn <component> [component...]");
    console.error('Example: pnpm add:shadcn button card "alert-dialog"');
    console.error("Or:      pnpm add:shadcn all   (fetches every official component)");
    process.exit(1);
  }

  mkdirSync(STAGING_DIR, { recursive: true });

  if (wantsAll) {
    console.log("Discovering available components in the @shadcn registry...");
    const searchOutput = execSync(
      "pnpm dlx shadcn@latest search @shadcn --type ui --json --limit 500",
      { encoding: "utf8" },
    );
    const { items } = JSON.parse(searchOutput) as { items: { name: string }[] };
    console.log(`Found ${items.length} components. Adding one at a time...`);

    for (const { name } of items) {
      try {
        execSync(`pnpm dlx shadcn@latest add "${name}" --yes --overwrite`, { stdio: "inherit" });
      } catch {
        console.warn(`Skipped "${name}": not available for this style/base — see error above.`);
      }
    }
  } else {
    console.log(`Fetching from the shadcn/ui registry: ${args.join(", ")}`);
    execSync(
      `pnpm dlx shadcn@latest add ${args.map((n) => `"${n}"`).join(" ")} --yes --overwrite`,
      { stdio: "inherit" },
    );
  }

  // "all" doesn't know ahead of time which items actually resolved for this
  // style — discover them from whatever actually landed in staging instead.
  const names = wantsAll
    ? readdirSync(STAGING_DIR)
        .filter((f) => f.endsWith(".tsx"))
        .map((f) => f.slice(0, -".tsx".length))
    : args;

  for (const name of names) {
    const staged = join(STAGING_DIR, `${name}.tsx`);
    if (!existsSync(staged)) {
      console.warn(
        `Skipped "${name}": no file landed in ${STAGING_DIR}. Check the component name.`,
      );
      continue;
    }

    const dest = join(CORE_DIR, name);
    mkdirSync(dest, { recursive: true });
    const destFile = join(dest, `${name}.tsx`);
    renameSync(staged, destFile);

    const source = readFileSync(destFile, "utf8");
    const rewritten = source.replace(
      /@\/core\/_incoming\/([\w-]+)/g,
      (_match, dep: string) => `@/core/${dep}/${dep}`,
    );
    if (rewritten !== source) {
      writeFileSync(destFile, rewritten);
    }

    const metaPath = join(dest, "meta.json");
    if (!existsSync(metaPath)) {
      const stub = {
        name,
        category: "uncategorized",
        status: "experimental",
        source: "shadcn",
        description: `${toTitle(name)} — vendored from shadcn/ui. Edit this description.`,
        tags: [],
      };
      writeFileSync(metaPath, `${JSON.stringify(stub, null, 2)}\n`);
    }

    console.log(`Vendored ${name} -> ${dest}/${name}.tsx`);
  }

  rmSync(STAGING_DIR, { recursive: true, force: true });

  console.log("\nNext:");
  console.log("  1. Review the vendored file(s) and fill in meta.json.");
  console.log("  2. pnpm generate:registry && pnpm registry:build");
}

main();
