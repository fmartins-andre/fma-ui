import registry from "../../../../packages/ui/registry.json";

export type RegistryItem = (typeof registry.items)[number];
export type ItemKind = "components" | "blocks";

export const REGISTRY_NAME = registry.name;
/** FMA_UI_SITE_URL, validated and injected by vite.config.ts. */
export const HOMEPAGE: string = import.meta.env.FMA_UI_SITE_URL;
export const REPO_URL = "https://github.com/fmartins-andre/fma-ui";
/**
 * The static Storybook build, served by this app at /storybook/ (set by the
 * storybook-static Vite plugin; a dev server without the build falls back to
 * `pnpm storybook`). Ends in a slash: `${STORYBOOK_URL}?path=...`.
 */
export const STORYBOOK_URL: string = import.meta.env.VITE_STORYBOOK_URL ?? "/storybook/";

const byTitle = (a: RegistryItem, b: RegistryItem) => a.title.localeCompare(b.title);

export const COMPONENTS = registry.items
  .filter((item) => item.type === "registry:ui")
  .sort(byTitle);
export const BLOCKS = registry.items.filter((item) => item.type === "registry:block").sort(byTitle);
export const THEME_COUNT = registry.items.filter((item) => item.type === "registry:theme").length;

const CATEGORY_TITLES: Record<string, string> = {
  buttons: "Buttons",
  chat: "Chat",
  "data-display": "Data display",
  disclosure: "Disclosure",
  feedback: "Feedback",
  forms: "Forms",
  layout: "Layout",
  media: "Media",
  navigation: "Navigation",
  overlay: "Overlay",
};

export function categoryTitle(category: string) {
  return CATEGORY_TITLES[category] ?? category.replace(/-/g, " ");
}

/** Components grouped by their first category, groups sorted by title. */
export function componentsByCategory() {
  const groups = new Map<string, RegistryItem[]>();
  for (const item of COMPONENTS) {
    const category = item.categories?.[0] ?? "other";
    groups.set(category, [...(groups.get(category) ?? []), item]);
  }
  return [...groups.entries()]
    .map(([category, items]) => ({ category, title: categoryTitle(category), items }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function listFor(kind: ItemKind) {
  return kind === "components" ? COMPONENTS : BLOCKS;
}

export function getItem(kind: ItemKind, name: string) {
  return listFor(kind).find((item) => item.name === name);
}

/** The items before and after `name`, for the pager at the bottom of a page. */
export function neighbors(kind: ItemKind, name: string) {
  const items = listFor(kind);
  const index = items.findIndex((item) => item.name === name);
  return {
    previous: index > 0 ? items[index - 1] : undefined,
    next: index >= 0 && index < items.length - 1 ? items[index + 1] : undefined,
  };
}

export function installCommand(name: string) {
  return `pnpm dlx shadcn@latest add @fma-ui/${name}`;
}

export const REGISTRIES_SNIPPET = `{
  "registries": {
    "@fma-ui": "${HOMEPAGE}/r/{name}.json"
  }
}`;

/** "lucide-react@^1.52.0" → "lucide-react" */
export function packageName(dependency: string) {
  const at = dependency.lastIndexOf("@");
  return at > 0 ? dependency.slice(0, at) : dependency;
}

/** "@fma-ui/button" → the docs page of that item, if it is a component or block. */
export function registryDependencyLink(dependency: string) {
  const name = dependency.replace(/^@fma-ui\//, "");
  if (getItem("components", name)) return { kind: "components" as const, name };
  if (getItem("blocks", name)) return { kind: "blocks" as const, name };
  return undefined;
}
