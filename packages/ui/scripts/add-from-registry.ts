// Vendors component(s) from a THIRD-PARTY shadcn-compatible registry into this
// package's folder-per-component layout, so you can republish them under your
// own registry alongside the shadcn/customized/original ones.
//
// Usage (from packages/ui, or via `pnpm add:registry` at the repo root):
//   pnpm add:registry https://example.com/r/fancy-button.json
//   pnpm add:registry https://example.com/r/fancy-button.json https://example.com/r/fancy-card.json
//   pnpm add:registry @acme/fancy-button
//     (namespace shorthand — requires a "registries" entry in components.json:
//      { "registries": { "@acme": "https://example.com/r/{name}.json" } })
//
// Unlike add-shadcn.ts (official shadcn/ui only, source: "shadcn"), everything
// vendored here is tagged source: "third-party" with `origin` set to whatever
// ref you passed — check that registry's license before you republish its code.
//
// Because the ref you pass (a URL or namespace) rarely matches the component's
// actual registry `name`, this script doesn't guess: it runs `shadcn add`, then
// picks up whatever files actually landed in the staging folder.

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

const STAGING_DIR = join("src", "core", "_incoming");
const CORE_DIR = join("src", "core");

function toTitle(id: string): string {
  return id
    .split("-")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function main() {
  const refs = process.argv.slice(2);
  if (refs.length === 0) {
    console.error("Usage: pnpm add:registry <url-or-@namespace/name> [...]");
    console.error("Example: pnpm add:registry https://example.com/r/fancy-button.json");
    process.exit(1);
  }

  mkdirSync(STAGING_DIR, { recursive: true });

  console.log(`Fetching from third-party registry: ${refs.join(", ")}`);
  execSync(`pnpm dlx shadcn@latest add ${refs.map((r) => `"${r}"`).join(" ")} --yes --overwrite`, {
    stdio: "inherit",
  });

  const staged = existsSync(STAGING_DIR)
    ? readdirSync(STAGING_DIR, { withFileTypes: true }).filter((entry) => entry.isFile())
    : [];

  if (staged.length === 0) {
    console.warn(`Nothing landed in ${STAGING_DIR}. Is that a valid registry item URL/ref?`);
  }

  for (const file of staged) {
    const ext = extname(file.name);
    const id = file.name.slice(0, -ext.length);
    const dest = join(CORE_DIR, id);
    mkdirSync(dest, { recursive: true });
    renameSync(join(STAGING_DIR, file.name), join(dest, file.name));

    const metaPath = join(dest, "meta.json");
    if (!existsSync(metaPath)) {
      const origin = refs.find((r) => r.toLowerCase().includes(id.toLowerCase())) ?? refs[0];
      const stub = {
        name: id,
        category: "uncategorized",
        status: "experimental",
        source: "third-party",
        origin,
        description: `${toTitle(id)} — vendored from a third-party registry (${origin}). Check its license before republishing. Edit this description.`,
        tags: [],
      };
      writeFileSync(metaPath, `${JSON.stringify(stub, null, 2)}\n`);
    }

    console.log(`Vendored ${id} -> ${dest}/${file.name}`);
  }

  rmSync(STAGING_DIR, { recursive: true, force: true });

  console.log("\nNext:");
  console.log("  1. Check the source registry's license before republishing.");
  console.log("  2. Review the vendored file(s) and fill in meta.json.");
  console.log("  3. pnpm generate:registry && pnpm registry:build");
}

main();
