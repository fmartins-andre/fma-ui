// The curated themes and token list, straight from packages/ui (what the
// editor ships). Read with fs: Playwright's ESM loader won't import JSON
// without import attributes, which src/themes/index.ts doesn't use.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { type Theme, ThemeSchema } from "../../../packages/ui/src/lib/theme/schema";

export { COLOR_TOKENS } from "../../../packages/ui/src/lib/theme/schema";

const DIR = join(import.meta.dirname, "..", "..", "..", "packages", "ui", "src", "themes");

export const THEMES: Theme[] = readdirSync(DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => ThemeSchema.parse(JSON.parse(readFileSync(join(DIR, file), "utf8"))));

export function getTheme(name: string): Theme | undefined {
  return THEMES.find((theme) => theme.name === name);
}
