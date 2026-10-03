// Theme gate: every required color token must be defined in :root, .dark and
// mapped in @theme inline, so components can rely on bg-info, text-success-foreground
// etc. without silently compiling to nothing. Ported from EMITTE's theme-tokens.test.ts.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REQUIRED_TOKENS } from "./required-tokens";

const STYLES_PATH = join(__dirname, "..", "src", "styles.css");

/**
 * Extracts the content inside a top-level CSS block by its selector/at-rule.
 * Uses brace-counting so nested blocks (e.g. inside `@layer base`) don't interfere.
 * Returns the raw text between the braces, or "" if not found.
 */
function extractBlock(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`${escaped}\\s*\\{`).exec(css);
  if (!match) return "";

  let depth = 1;
  let i = match.index + match[0].length;
  const start = i;
  while (i < css.length && depth > 0) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") depth--;
    i++;
  }
  return css.slice(start, i - 1);
}

const css = readFileSync(STYLES_PATH, "utf-8");

const BLOCKS = [
  { selector: ":root", prefix: "--" },
  { selector: ".dark", prefix: "--" },
  { selector: "@theme inline", prefix: "--color-" },
];

describe("theme tokens (src/styles.css)", () => {
  for (const { selector, prefix } of BLOCKS) {
    describe(selector, () => {
      const block = extractBlock(css, selector);

      it("exists", () => {
        expect(block, `styles.css has no ${selector} block`).not.toBe("");
      });

      for (const token of REQUIRED_TOKENS) {
        it(`defines ${prefix}${token}`, () => {
          expect(
            block.includes(`${prefix}${token}:`),
            `${selector} missing ${prefix}${token}`,
          ).toBe(true);
        });
      }
    });
  }
});
