// Scans src/core/*/meta.json + the matching <name>.tsx, and produces registry.json
// (the shadcn-schema file that `shadcn build` then compiles into apps/web/public/r/*.json).
//
// Run via `pnpm generate:registry` (packages/ui) or `pnpm build` at the repo root.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Registry, RegistryItem } from "@fmartinsandre/registry";
import { ComponentMetaSchema } from "@fmartinsandre/registry";

const CORE_DIR = "src/core";
const OUTPUT_FILE = "registry.json";

function toTitle(id: string): string {
  return id
    .split("-")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

// A bare import specifier is the installable package name plus an optional
// subpath (e.g. "@base-ui/react/drawer", "lucide-react/icons/check"). Only
// the package name itself belongs in a dependencies list — the subpath isn't
// a real npm package "@base-ui/react/drawer" would 404 if passed to a package
// manager.
function toPackageName(spec: string): string {
  const parts = spec.split("/");
  // biome-ignore lint/style/noNonNullAssertion: split() on a non-empty string always yields at least 1 element
  return spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]!;
}

export function detectNpmDependencies(source: string): string[] {
  const deps = new Set<string>();
  const importRegex = /from\s+["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: loop over all matches
  while ((match = importRegex.exec(source)) !== null) {
    // biome-ignore lint/style/noNonNullAssertion: capture group 1 always matches when the regex matches
    const spec = match[1]!;
    // Skip relative imports, our own "@/..." alias, node builtins, and react
    // itself (a peer dep the consumer already has) — anything else is a real
    // npm dependency the vendored component needs (react-aria-components, "cn",
    // class-variance-authority, @radix-ui/*, lucide-react, whatever comes next).
    if (
      spec.startsWith(".") ||
      spec.startsWith("@/") ||
      spec.startsWith("node:") ||
      spec === "react"
    ) {
      continue;
    }
    deps.add(toPackageName(spec));
  }
  return [...deps];
}

export function detectRegistryDependencies(source: string, componentId: string): string[] {
  const deps = new Set<string>();
  // src/core/<id>/<id>.tsx importing another core component via the "@/core/x/x" alias
  const aliasImportRegex = /from\s+["']@\/core\/([^/"']+)\/\1["']/g;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: loop over all matches
  while ((match = aliasImportRegex.exec(source)) !== null) {
    // biome-ignore lint/style/noNonNullAssertion: capture group 1 always matches when the regex matches
    const depId = match[1]!;
    if (depId !== componentId) deps.add(depId);
  }
  return [...deps];
}

function processComponent(componentId: string): RegistryItem | null {
  const dir = join(CORE_DIR, componentId);
  const metaPath = join(dir, "meta.json");
  const sourcePath = join(dir, `${componentId}.tsx`);

  if (!existsSync(sourcePath)) {
    console.warn(`Skipping ${componentId}: no ${componentId}.tsx next to meta.json`);
    return null;
  }

  const meta = ComponentMetaSchema.parse(JSON.parse(readFileSync(metaPath, "utf8")));
  const source = readFileSync(sourcePath, "utf8");

  const registryDependencies = detectRegistryDependencies(source, componentId);

  return {
    name: componentId,
    type: "registry:ui",
    title: toTitle(componentId),
    description: meta.description,
    author: "@fmartinsandre/ui",
    categories: [meta.category],
    files: [
      {
        path: `src/core/${componentId}/${componentId}.tsx`,
        target: `components/ui/${componentId}.tsx`,
        type: "registry:component",
      },
    ],
    ...(registryDependencies.length > 0 && { registryDependencies }),
    dependencies: detectNpmDependencies(source),
    meta: {
      status: meta.status,
      source: meta.source,
      ...(meta.origin && { origin: meta.origin }),
      tags: meta.tags,
    },
  };
}

export function main() {
  console.log("Discovering components...");
  const componentIds = readdirSync(CORE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "_incoming")
    .map((entry) => entry.name)
    .filter((id) => existsSync(join(CORE_DIR, id, "meta.json")));

  console.log(`Found ${componentIds.length} components`);

  const items: RegistryItem[] = [];
  for (const id of componentIds) {
    const item = processComponent(id);
    if (item) {
      items.push(item);
      console.log(`Processed ${item.name}`);
    }
  }

  items.sort((a, b) => a.name.localeCompare(b.name));

  const registry: Registry = {
    name: "@fmartinsandre",
    $schema: "https://ui.shadcn.com/schema/registry.json",
    // shadcn's `build` command requires this to be a valid URL, even locally.
    // Update once the registry has a real domain (see apps/web).
    homepage: "https://ui.fmartinsandre.dev",
    items,
  };

  writeFileSync(OUTPUT_FILE, `${JSON.stringify(registry, null, 2)}\n`);
  console.log(`Generated ${OUTPUT_FILE} with ${items.length} items`);
  console.log("Next: pnpm registry:build");
}

// Guard so importing this module from tests (to unit-test the pure functions
// above) doesn't also run the script against the filesystem.
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
