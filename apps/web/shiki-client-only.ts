import type { Plugin } from "vite";

// The registry's code block (packages/ui, via @/lib/code-block-highlight)
// imports shiki lazily — one chunk per grammar and theme — and only ever
// highlights from an effect, so on the client. Bundled for the server, those
// chunks would still ship in the Worker, which has a size limit. In every
// server environment shiki resolves to this stub instead; calling it throws,
// which highlightCode() turns into plain text.

const STUB_ID = "\0shiki-client-only";

const STUB = `
const clientOnly = () => {
  throw new Error("shiki is client-only in apps/web (see shiki-client-only.ts)");
};
export const createHighlighterCore = clientOnly;
export const createJavaScriptRegexEngine = clientOnly;
export const createCssVariablesTheme = clientOnly;
export default {};
`;

export function shikiClientOnly(): Plugin {
  return {
    name: "fma-ui:shiki-client-only",
    enforce: "pre",
    applyToEnvironment: (environment) => environment.config.consumer === "server",
    resolveId(id) {
      if (id === "shiki" || id.startsWith("shiki/")) return STUB_ID;
    },
    load(id) {
      if (id === STUB_ID) return STUB;
    },
  };
}
