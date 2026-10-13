import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Plugin } from "vite";
import { SHADCN_ADD } from "./src/site/shadcn.ts";
import { storyCode } from "./src/site/story-code.ts";

// /llms.txt and /llms-full.txt (https://llmstxt.org), generated from
// packages/ui/registry.json so they never go stale. Written into public/ at
// build time (static assets of the Worker, which has no fs at runtime) and
// rendered on each request by the dev server.

const UI = resolve(import.meta.dirname, "../../packages/ui");
const PUBLIC = resolve(import.meta.dirname, "public");
const FILES = ["llms.txt", "llms-full.txt"] as const;

interface Item {
  name: string;
  type: string;
  title: string;
  description: string;
  dependencies?: string[];
  registryDependencies?: string[];
}

function readItems(): Item[] {
  return JSON.parse(readFileSync(join(UI, "registry.json"), "utf8")).items;
}

const byTitle = (a: Item, b: Item) => a.title.localeCompare(b.title);

function ofType(items: Item[], type: string) {
  return items.filter((item) => item.type === type).sort(byTitle);
}

/** The docs page of a component or block. */
function pagePath(item: Item) {
  return item.type === "registry:block" ? `/blocks/${item.name}` : `/components/${item.name}`;
}

/** The first story that renders something of its own and carries no interaction test. */
function usageExample(item: Item) {
  const folder = item.type === "registry:block" ? "blocks" : "core";
  const path = join(UI, "src", folder, item.name, `${item.name}.stories.tsx`);
  if (!existsSync(path)) return "";
  const file = readFileSync(path, "utf8");
  const stories = [...file.matchAll(/^export const (\w+)\b/gm)].map((match) =>
    storyCode(file, match[1] ?? ""),
  );
  return (
    stories.find((code) => code.includes("render:") && !code.includes("play:")) ??
    stories.find((code) => code.includes("render:")) ??
    ""
  );
}

function header(siteUrl: string) {
  return `# fma-ui

> A personal component registry in the shadcn/ui format, built on react-aria-components: components, blocks, libs, hooks and themes copied into your project by the shadcn CLI (not an npm package).

Register the namespace in components.json:

\`\`\`json
{
  "registries": {
    "@fma-ui": "${siteUrl}/r/{name}.json"
  }
}
\`\`\`

Then add items by name: \`${SHADCN_ADD} @fma-ui/button\`. Dependencies between items resolve through the same namespace. Everything installs into \`fma-ui\` folders (\`components/fma-ui/\`, \`hooks/fma-ui/\`, \`lib/fma-ui/\`), so it never collides with the official shadcn components.

The APIs follow React Aria, not Radix: \`isDisabled\` instead of \`disabled\`, \`onPress\` instead of \`onClick\`, and no \`asChild\` (use \`LinkButton\` for a link that looks like a button). Wrap the app in React Aria's \`RouterProvider\` for client-side links.
`;
}

function link(title: string, url: string, description: string) {
  return `- [${title}](${url}): ${description}`;
}

export function llmsTxt(siteUrl: string, items = readItems()) {
  const entry = (item: Item) =>
    link(
      item.title,
      `${siteUrl}${pagePath(item)}`,
      `${item.description} Registry item: ${siteUrl}/r/${item.name}.json`,
    );
  const raw = (item: Item) => link(item.title, `${siteUrl}/r/${item.name}.json`, item.description);
  return [
    header(siteUrl),
    "## Docs\n",
    link("Introduction", `${siteUrl}/docs`, "Installation, React Aria conventions, themes."),
    link(
      "Registry index",
      `${siteUrl}/r/registry.json`,
      "Every component, block, lib, hook and theme in one file.",
    ),
    link("Theme editor", `${siteUrl}/themes`, "Tweak a theme and export it as CSS or JSON."),
    link("Full text", `${siteUrl}/llms-full.txt`, "This file plus every item's usage example."),
    "\n## Components\n",
    ...ofType(items, "registry:ui").map(entry),
    "\n## Blocks\n",
    ...ofType(items, "registry:block").map(entry),
    "\n## Themes\n",
    ...ofType(items, "registry:theme").map(raw),
    "\n## Optional\n",
    ...[...ofType(items, "registry:lib"), ...ofType(items, "registry:hook")].map(raw),
    "",
  ].join("\n");
}

export function llmsFullTxt(siteUrl: string, items = readItems()) {
  const section = (item: Item) => {
    const lines = [
      `### ${item.title}`,
      "",
      item.description,
      "",
      `- Install: \`${SHADCN_ADD} @fma-ui/${item.name}\``,
      `- Registry item: ${siteUrl}/r/${item.name}.json`,
    ];
    if (item.type === "registry:ui" || item.type === "registry:block") {
      lines.push(`- Docs: ${siteUrl}${pagePath(item)}`);
    }
    if (item.dependencies?.length) lines.push(`- npm: ${item.dependencies.join(", ")}`);
    if (item.registryDependencies?.length) {
      lines.push(`- Registry: ${item.registryDependencies.join(", ")}`);
    }
    const example = item.type === "registry:theme" ? "" : usageExample(item);
    if (example) lines.push("", "```tsx", example, "```");
    return `${lines.join("\n")}\n`;
  };
  const group = (title: string, type: string) => [
    `## ${title}\n`,
    ...ofType(items, type).map(section),
  ];
  return [
    header(siteUrl),
    ...group("Components", "registry:ui"),
    ...group("Blocks", "registry:block"),
    ...group("Libs", "registry:lib"),
    ...group("Hooks", "registry:hook"),
    ...group("Themes", "registry:theme"),
  ].join("\n");
}

function render(file: (typeof FILES)[number], siteUrl: string) {
  return file === "llms.txt" ? llmsTxt(siteUrl) : llmsFullTxt(siteUrl);
}

export function llmsTxtPlugin(siteUrl: string): Plugin {
  return {
    name: "fma-ui:llms-txt",
    config(_, { command }) {
      if (command !== "build") return;
      mkdirSync(PUBLIC, { recursive: true });
      for (const file of FILES) writeFileSync(join(PUBLIC, file), render(file, siteUrl));
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const file = FILES.find((name) => (req.url ?? "").split("?")[0] === `/${name}`);
        if (!file) return next();
        res.setHeader("content-type", "text/plain; charset=utf-8");
        res.end(render(file, siteUrl));
      });
    },
  };
}
