import type { composeStories } from "@storybook/react-vite";
import type { ComponentType } from "react";
import type { ItemKind } from "./registry";

// The registry's stories double as the docs examples (portable stories), and
// their code is each story turned into a copyable component, generated at build
// time (`?snippets`, see story-snippets.ts). Lazy globs: each page loads only its own.
// Client-only (pages load them in effects): `import.meta.env.SSR` drops them, and
// Storybook with them, from the server bundle, which must fit a Cloudflare Worker.
type StoryModule = Parameters<typeof composeStories>[0];

const loadStorybook = import.meta.env.SSR
  ? () => Promise.reject(new Error("Stories render on the client"))
  : () => import("@storybook/react-vite");

type Loaders<T> = Record<string, () => Promise<T>>;

const storyModules: Loaders<StoryModule> = import.meta.env.SSR
  ? {}
  : {
      ...import.meta.glob<StoryModule>("../../../../packages/ui/src/core/*/*.stories.tsx"),
      ...import.meta.glob<StoryModule>("../../../../packages/ui/src/blocks/*/*.stories.tsx"),
    };

type Snippets = Record<string, string>;

const snippetModules: Loaders<Snippets> = import.meta.env.SSR
  ? {}
  : {
      ...import.meta.glob<Snippets>("../../../../packages/ui/src/core/*/*.stories.tsx", {
        query: "?snippets",
        import: "default",
      }),
      ...import.meta.glob<Snippets>("../../../../packages/ui/src/blocks/*/*.stories.tsx", {
        query: "?snippets",
        import: "default",
      }),
    };

const sources: Loaders<string> = import.meta.env.SSR
  ? {}
  : import.meta.glob<string>(
      [
        "../../../../packages/ui/src/core/*/*.tsx",
        "../../../../packages/ui/src/blocks/**/*.{ts,tsx}",
      ],
      { query: "?raw", import: "default" },
    );

/** "../../../../packages/ui/src/core/x/x.tsx" → "src/core/x/x.tsx", as in registry.json. */
function registryPath(key: string) {
  return key.slice(key.indexOf("packages/ui/") + "packages/ui/".length);
}

const sourceByPath = new Map(
  Object.entries(sources).map(([key, load]) => [registryPath(key), load]),
);
const storiesByPath = new Map(
  Object.entries(storyModules).map(([key, load]) => [registryPath(key), load]),
);
const snippetsByPath = new Map(
  Object.entries(snippetModules).map(([key, load]) => [registryPath(key), load]),
);

function storiesPath(kind: ItemKind, name: string) {
  return `src/${kind === "components" ? "core" : "blocks"}/${name}/${name}.stories.tsx`;
}

export function loadSource(path: string): Promise<string> {
  const load = sourceByPath.get(path);
  return load ? load() : Promise.reject(new Error(`No source for ${path}`));
}

export interface DocStory {
  /** The export name, e.g. "WithIcon". */
  exportName: string;
  name: string;
  /** Storybook's story id, e.g. "ui-badge--with-icon". */
  id: string;
  Component: ComponentType;
  /** Story-level layout, falling back to the file's. */
  layout: "centered" | "padded" | "fullscreen";
  description?: string;
  /** The story as a component to paste into a project (imports included). */
  code: string;
  /** Has its own render or args, so it shows something the first story doesn't. */
  isExample: boolean;
}

export interface DocStories {
  /** Storybook's docs id for the file, e.g. "ui-badge--docs". */
  docsId: string;
  stories: DocStory[];
}

type RawStory = {
  render?: unknown;
  args?: unknown;
  tags?: string[];
  parameters?: { layout?: DocStory["layout"]; docs?: { description?: { story?: string } } };
};

export async function loadStories(kind: ItemKind, name: string): Promise<DocStories | null> {
  const path = storiesPath(kind, name);
  const load = storiesByPath.get(path);
  const loadSnippets = snippetsByPath.get(path);
  if (!load || !loadSnippets) return null;
  const [module, snippets, { composeStories }] = await Promise.all([
    load(),
    loadSnippets(),
    loadStorybook(),
  ]);
  const composed = composeStories(module) as Record<
    string,
    ComponentType & { id: string; storyName?: string; parameters?: RawStory["parameters"] }
  >;
  // A module namespace lists exports alphabetically; the snippets keep the file's order.
  const authored = Object.keys(snippets);
  const order = (exportName: string) => authored.indexOf(exportName);
  const stories: DocStory[] = Object.entries(composed)
    .sort(([a], [b]) => order(a) - order(b))
    .filter(([exportName]) => {
      const tags = (module as unknown as Record<string, RawStory>)[exportName]?.tags ?? [];
      return !tags.includes("!dev") && !tags.includes("!autodocs");
    })
    .map(([exportName, Component]) => {
      const raw = (module as unknown as Record<string, RawStory>)[exportName] ?? {};
      return {
        exportName,
        name: Component.storyName ?? exportName,
        id: Component.id,
        Component,
        layout: Component.parameters?.layout ?? "centered",
        description: raw.parameters?.docs?.description?.story,
        code: snippets[exportName] ?? "",
        isExample: Boolean(raw.render || raw.args || raw.parameters?.docs?.description?.story),
      };
    });
  const docsId = `${stories[0]?.id.split("--")[0] ?? name}--docs`;
  return { docsId, stories };
}
