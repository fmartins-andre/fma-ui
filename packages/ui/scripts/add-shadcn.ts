// Pulls official shadcn/ui components into this package's folder-per-component
// layout (src/core/<name>/<name>.tsx + meta.json), instead of the flat
// components/ui/<name>.tsx the shadcn CLI writes by default.
//
// Usage (from packages/ui, or via `pnpm add:shadcn` at the repo root):
//   pnpm add:shadcn button card "alert-dialog"
//   pnpm add:shadcn all              (fetches every official component in one go)
//
// What it does:
//   1. Runs the real `shadcn add` (--all for "all") against components.json (whose
//      `ui`/`components` aliases point at a throwaway staging folder,
//      src/core/_incoming) — this is what installs any npm dependencies the
//      component(s) need, too.
//   2. Moves each staged file into src/core/<name>/<name>.tsx.
//   3. Scaffolds a meta.json stub (source: "shadcn") if one doesn't exist yet.
//
// After this, edit meta.json (category/description/tags), customize the component
// if you want ("customized"), then run `pnpm generate:registry && pnpm registry:build`.

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
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
    console.log("Fetching the entire shadcn/ui registry...");
    execSync("pnpm dlx shadcn@latest add --all --yes --overwrite", { stdio: "inherit" });
  } else {
    console.log(`Fetching from the shadcn/ui registry: ${args.join(", ")}`);
    execSync(
      `pnpm dlx shadcn@latest add ${args.map((n) => `"${n}"`).join(" ")} --yes --overwrite`,
      { stdio: "inherit" },
    );
  }

  // "all" doesn't know component names ahead of time — discover them from
  // whatever actually landed in staging instead of an expected list.
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
    renameSync(staged, join(dest, `${name}.tsx`));

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
