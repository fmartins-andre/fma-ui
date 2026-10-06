// Scans src/core/*/meta.json + the matching <name>.tsx (registry:ui), plus the
// libs, hooks and blocks in src/lib, src/hooks and src/blocks that have
// metadata (registry:lib / registry:hook / registry:block) and the curated
// themes in src/themes/*.json (registry:theme), and produces registry.json (the
// shadcn-schema file that `shadcn build` then compiles into apps/web/public/r/*.json).
//
// Run via `pnpm generate:registry` (packages/ui) or `pnpm build` at the repo root.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ComponentMeta, Registry, RegistryItem } from "@fma-ui/registry";
import { ComponentMetaSchema } from "@fma-ui/registry";
import { ThemeSchema, themeRegistryItem } from "../src/lib/theme/index";

const CORE_DIR = "src/core";

// Everything installs under "fma-ui" folders and depends on other items
// through the "@fma-ui" namespace, so a consumer's official shadcn
// components (components/ui, hooks, lib) can never overwrite or stand in for
// ours. Consumers register the namespace in their components.json.
export const NAMESPACE = "@fma-ui";
const INSTALL_DIR = "fma-ui";
const toRegistryDependency = (id: string) => `${NAMESPACE}/${id}`;

// npm dependencies ship with the range from package.json ("pkg@^8.21.3"), so
// consumers get the major these components were tested against, not whatever
// "latest" is (a new major can break them, as TanStack Table v9 would).
const PACKAGE_RANGES: Record<string, string> = JSON.parse(
  readFileSync("package.json", "utf8"),
).dependencies;

export function withVersion(name: string, ranges = PACKAGE_RANGES): string {
  const range = ranges[name];
  return range && !/^(catalog|workspace):/.test(range) ? `${name}@${range}` : name;
}

/** "pkg@^1.0.0" or "@scope/pkg@^1.0.0" → the package name. */
export function packageName(dependency: string): string {
  const at = dependency.lastIndexOf("@");
  return at > 0 ? dependency.slice(0, at) : dependency;
}

// Modules published as their own registry items, besides src/core. Two shapes:
//   <dir>/<name>/meta.json       → every .ts/.tsx file in that folder (e.g. lib/input-masks/)
//   <dir>/<name>.meta.json       → the single <dir>/<name>.ts(x) next to it (e.g. lib/types.ts)
// Files keep their relative path under lib/fma-ui/, hooks/fma-ui/ or
// components/fma-ui/ on install; the shadcn CLI rewrites imports between
// registry files to their installed paths.
// Blocks (src/blocks/<name>/) are multi-file compositions of core components,
// installed as components/<name>/; their stories are left out like core's.
const MODULE_DIRS = [
  { dir: "src/lib", target: `lib/${INSTALL_DIR}`, type: "registry:lib" },
  { dir: "src/hooks", target: `hooks/${INSTALL_DIR}`, type: "registry:hook" },
  { dir: "src/blocks", target: `components/${INSTALL_DIR}`, type: "registry:block" },
] as const;
const THEMES_DIR = "src/themes";
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

// Drops block comments and whole-line "//" comments so import examples in
// docs (e.g. "import { addDays } from 'date-fns'" in a JSDoc) aren't mistaken
// for real imports.
export function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

export function detectNpmDependencies(source: string): string[] {
  const code = stripComments(source);
  const deps = new Set<string>();
  const importRegex = /from\s+["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: loop over all matches
  while ((match = importRegex.exec(code)) !== null) {
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
  const code = stripComments(source);
  const deps = new Set<string>();
  // Another core component via the "@/core/x/x" alias, or a published lib/hook
  // via "@/lib/x", "@/lib/x/sub" or "@/hooks/x". "@/lib/utils" is skipped: it's
  // the standard shadcn alias every consumer already has, not a registry item.
  const aliasImportRegexes = [
    /from\s+["']@\/core\/([^/"']+)\/\1["']/g,
    /from\s+["']@\/(?:lib|hooks)\/([^/"']+)(?:\/[^"']*)?["']/g,
  ];
  for (const regex of aliasImportRegexes) {
    let match: RegExpExecArray | null;
    // biome-ignore lint/suspicious/noAssignInExpressions: loop over all matches
    while ((match = regex.exec(code)) !== null) {
      // biome-ignore lint/style/noNonNullAssertion: capture group 1 always matches when the regex matches
      const depId = match[1]!;
      if (depId !== componentId && depId !== "utils") deps.add(depId);
    }
  }
  return [...deps];
}

export function processComponent(componentId: string): RegistryItem | null {
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
    author: "@fma-ui/ui",
    categories: [meta.category],
    files: [
      {
        path: `src/core/${componentId}/${componentId}.tsx`,
        target: `components/${INSTALL_DIR}/${componentId}.tsx`,
        type: "registry:component",
      },
    ],
    ...(registryDependencies.length > 0 && {
      registryDependencies: registryDependencies.map(toRegistryDependency),
    }),
    dependencies: detectNpmDependencies(source).map((name) => withVersion(name)),
    meta: toItemMeta(meta),
  };
}

function toItemMeta(meta: ComponentMeta): RegistryItem["meta"] {
  return {
    status: meta.status,
    source: meta.source,
    ...(meta.origin && { origin: meta.origin }),
    tags: meta.tags,
  };
}

const isSourceFile = (file: string) => /\.tsx?$/.test(file) && !file.endsWith(".stories.tsx");

// Finds every lib/hook with metadata, in either shape described at MODULE_DIRS.
// Returned paths are relative to `root` (the packages/ui directory).
export function discoverModules(root = "."): { id: string; metaPath: string; files: string[] }[] {
  const modules: { id: string; metaPath: string; files: string[] }[] = [];
  for (const { dir } of MODULE_DIRS) {
    if (!existsSync(join(root, dir))) continue;
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      if (entry.isDirectory() && existsSync(join(root, dir, entry.name, "meta.json"))) {
        const files = readdirSync(join(root, dir, entry.name))
          .filter(isSourceFile)
          .sort()
          .map((file) => join(dir, entry.name, file));
        modules.push({ id: entry.name, metaPath: join(dir, entry.name, "meta.json"), files });
      } else if (entry.isFile() && entry.name.endsWith(".meta.json")) {
        const id = entry.name.slice(0, -".meta.json".length);
        const files = [`${id}.ts`, `${id}.tsx`]
          .map((file) => join(dir, file))
          .filter((file) => existsSync(join(root, file)));
        modules.push({ id, metaPath: join(dir, entry.name), files });
      }
    }
  }
  return modules;
}

export function processModule(module: {
  id: string;
  metaPath: string;
  files: string[];
}): RegistryItem {
  // biome-ignore lint/style/noNonNullAssertion: discoverModules only returns paths under a MODULE_DIRS entry
  const base = MODULE_DIRS.find(({ dir }) => module.metaPath.startsWith(`${dir}/`))!;
  if (module.files.length === 0) {
    throw new Error(`${module.metaPath} has no source file next to it`);
  }

  const meta = ComponentMetaSchema.parse(JSON.parse(readFileSync(module.metaPath, "utf8")));
  const source = module.files.map((file) => readFileSync(file, "utf8")).join("\n");
  const registryDependencies = detectRegistryDependencies(source, module.id);

  return {
    name: module.id,
    type: base.type,
    title: toTitle(module.id),
    description: meta.description,
    author: "@fma-ui/ui",
    categories: [meta.category],
    files: module.files.map((file) => ({
      path: file,
      target: `${base.target}/${file.slice(base.dir.length + 1)}`,
      type: base.type === "registry:block" ? "registry:component" : base.type,
    })),
    ...(registryDependencies.length > 0 && {
      registryDependencies: registryDependencies.map(toRegistryDependency),
    }),
    dependencies: detectNpmDependencies(source).map((name) => withVersion(name)),
    meta: toItemMeta(meta),
  };
}

/** Every src/themes/<name>.json as a registry:theme item; the file name must match its `name`. */
export function processThemes(root = "."): RegistryItem[] {
  return readdirSync(join(root, THEMES_DIR))
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => {
      const theme = ThemeSchema.parse(
        JSON.parse(readFileSync(join(root, THEMES_DIR, file), "utf8")),
      );
      if (`${theme.name}.json` !== file) {
        throw new Error(`${THEMES_DIR}/${file} is named "${theme.name}"`);
      }
      return themeRegistryItem(theme);
    });
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

  const modules = discoverModules();
  console.log(`Found ${modules.length} libs/hooks/blocks`);
  for (const module of modules) {
    const item = processModule(module);
    items.push(item);
    console.log(`Processed ${item.name} (${item.type})`);
  }

  const themes = processThemes();
  console.log(`Found ${themes.length} themes`);
  items.push(...themes);

  items.sort((a, b) => a.name.localeCompare(b.name));

  const registry: Registry = {
    name: "@fma-ui",
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
