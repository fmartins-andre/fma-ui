import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

// Only the languages and themes the docs use, and the JavaScript regex engine
// instead of shiki's wasm one.
const highlighter = createHighlighterCore({
  engine: createJavaScriptRegexEngine(),
  langs: [
    import("shiki/langs/tsx.mjs"),
    import("shiki/langs/typescript.mjs"),
    import("shiki/langs/json.mjs"),
    import("shiki/langs/bash.mjs"),
  ],
  themes: [import("shiki/themes/github-light.mjs"), import("shiki/themes/github-dark.mjs")],
});

export async function highlight(code: string, lang: string) {
  return (await highlighter).codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
}
