import { readFileSync, statSync } from "node:fs";
import { basename, dirname } from "node:path";
import type { Plugin } from "vite";
import { formatSnippets, storySnippets } from "../../packages/ui/scripts/story-snippets.ts";

// The docs examples' code: each story of a stories file as a component a reader
// can paste into their project (see packages/ui/scripts/story-snippets.ts).
// Generated at build time, since it parses and formats with Node tools, and
// imported by the pages as `<file>.stories.tsx?snippets`.

const QUERY = "?snippets";
const PREFIX = "\0story-snippets:";

const cache = new Map<string, { mtime: number; snippets: Record<string, string> }>();

/** The formatted snippets of a stories file, by export name, cached until it changes. */
export function readStorySnippets(path: string) {
  const mtime = statSync(path).mtimeMs;
  const hit = cache.get(path);
  if (hit?.mtime === mtime) return hit.snippets;
  // src/core/<name>/<name>.stories.tsx or src/blocks/<name>/<name>.stories.tsx
  const name = basename(dirname(path));
  const kind = basename(dirname(dirname(path))) === "blocks" ? "blocks" : "core";
  const snippets = formatSnippets(storySnippets(readFileSync(path, "utf8"), name, kind));
  cache.set(path, { mtime, snippets });
  return snippets;
}

export function storySnippetsPlugin(): Plugin {
  return {
    name: "fma-ui:story-snippets",
    enforce: "pre",
    async resolveId(source, importer) {
      if (!source.endsWith(QUERY)) return null;
      const resolved = await this.resolve(source.slice(0, -QUERY.length), importer, {
        skipSelf: true,
      });
      // A virtual id, so no other plugin compiles it as the TSX it names.
      return resolved && `${PREFIX}${resolved.id}`;
    },
    load(id) {
      if (!id.startsWith(PREFIX)) return null;
      const path = id.slice(PREFIX.length);
      this.addWatchFile(path);
      return `export default ${JSON.stringify(readStorySnippets(path))};`;
    },
  };
}
