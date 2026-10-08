// Design-system gate: interactive states use `accent`, not `muted`.
//
// Following the shadcn theming docs (https://ui.shadcn.com/docs/theming),
// `accent` is the "interactive hover, focus, and active surfaces" token (menu
// highlights, hovered rows, selected items) and `muted` is for "subtle
// surfaces and lower-emphasis content". The upstream `*-nova` styles drift from
// that (and aria-nova paints focused items with `bg-foreground/10`), which
// ignores the theme's accent. See CONTRIBUTING.md, "Tokens de estado".
//
// Checked: our own code — components whose meta.json `source` is "customized"
// or "original", and every block. Vendored ("shadcn") and "third-party"
// components are left as shipped; customizing one brings it under the gate.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const UI_ROOT = join(__dirname, "..");
const CORE_DIR = join(UI_ROOT, "src", "core");
const BLOCKS_DIR = join(UI_ROOT, "src", "blocks");

// Deliberate exceptions, keyed by file (relative to packages/ui). Keep the
// reason honest: the default answer is to switch to `bg-accent`.
const GHOST_BUTTON_REASON =
  "matches Button ghost/outline hover, which still uses muted (aria-nova); revisit together with Button";
const ALLOWED: Record<string, { classes: string[]; reason: string }> = {
  "src/core/badge/badge.tsx": {
    classes: ["[a]:hover:bg-muted", "hover:bg-muted", "dark:hover:bg-muted/50"],
    reason: GHOST_BUTTON_REASON,
  },
  "src/core/menubar/menubar.tsx": {
    classes: ["data-hovered:bg-muted", "data-pressed:bg-muted", "aria-expanded:bg-muted"],
    reason: GHOST_BUTTON_REASON,
  },
  "src/core/navigation-menu/navigation-menu.tsx": {
    classes: [
      "data-focus-visible:bg-muted",
      "data-hovered:bg-muted",
      "aria-expanded:bg-muted/50",
      "aria-expanded:data-hovered:bg-muted",
      "data-current:bg-muted/50",
    ],
    reason: GHOST_BUTTON_REASON,
  },
  "src/core/date-field/date-field.tsx": {
    classes: ["data-focused:bg-muted"],
    reason: "the focused segment is a text-editing caret highlight, not a picked item",
  },
};

const CHECKED_SOURCES = new Set(["customized", "original"]);

// A variant that means "the user is interacting with / has picked this".
const INTERACTIVE_VARIANT =
  /^(hover|focus|focus-visible|focus-within|active|aria-(selected|expanded|pressed|current|checked)|data-(hovered|focused|focus-visible|pressed|selected|highlighted|current|open|checked|today)|(data|aria)-\[(selected|selected-single|state|today|range-[a-z]+|highlighted|focused|current|expanded|pressed)(=[^\]]*)?\])$/;
const FORBIDDEN_UTILITY = /^!?(bg-muted(\/\d+)?|bg-foreground\/\d+)!?$/;

/** Splits `a:[&:is(x)]:b` on the colons outside brackets/parens. */
function splitVariants(token: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of token) {
    if (char === "[" || char === "(") depth++;
    if (char === "]" || char === ")") depth--;
    if (char === ":" && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

function isInteractive(variant: string): boolean {
  // `not-*` negates the state; group-/peer-/in-/has- relay it from elsewhere.
  if (variant.startsWith("not-")) return false;
  const bare = variant.replace(/^(group-|peer-|in-|has-)/, "").replace(/\/[\w-]+$/, "");
  return INTERACTIVE_VARIANT.test(bare);
}

function findViolations(source: string): string[] {
  const found = new Set<string>();
  for (const token of source.split(/[\s"'`{}(),;]+/)) {
    if (!token.includes(":")) continue;
    const parts = splitVariants(token);
    const utility = parts.pop() ?? "";
    if (FORBIDDEN_UTILITY.test(utility) && parts.some(isInteractive)) found.add(token);
  }
  return [...found];
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    .filter((entry) => !entry.name.includes(".stories."))
    .map((entry) => join(entry.parentPath, entry.name));
}

const checkedFiles = [
  ...readdirSync(CORE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "_incoming")
    .filter((entry) => {
      const meta = JSON.parse(readFileSync(join(CORE_DIR, entry.name, "meta.json"), "utf8"));
      return CHECKED_SOURCES.has(meta.source);
    })
    .flatMap((entry) => sourceFiles(join(CORE_DIR, entry.name))),
  ...sourceFiles(BLOCKS_DIR),
].map((file) => relative(UI_ROOT, file));

describe("interactive states use accent", () => {
  it.each(checkedFiles)("%s", (file) => {
    const allowed = new Set(ALLOWED[file]?.classes);
    const violations = findViolations(readFileSync(join(UI_ROOT, file), "utf8")).filter(
      (token) => !allowed.has(token),
    );
    expect(
      violations,
      "hover/focus/selected states must use bg-accent (+ text-accent-foreground), not bg-muted or bg-foreground/N",
    ).toEqual([]);
  });

  it.each(Object.entries(ALLOWED))("allowlist entry %s is still needed", (file, { classes }) => {
    expect(checkedFiles).toContain(file);
    const present = findViolations(readFileSync(join(UI_ROOT, file), "utf8"));
    expect(classes.filter((token) => !present.includes(token))).toEqual([]);
  });
});

describe("findViolations", () => {
  it("flags muted and foreground/N on interactive variants", () => {
    expect(
      findViolations(
        `"hover:bg-muted data-focused:bg-muted/50 **:data-[slot$=-item]:data-focused:bg-foreground/10 data-[range-middle=true]:bg-muted dark:hover:bg-muted/50 group-hover/cell:bg-muted"`,
      ),
    ).toEqual([
      "hover:bg-muted",
      "data-focused:bg-muted/50",
      "**:data-[slot$=-item]:data-focused:bg-foreground/10",
      "data-[range-middle=true]:bg-muted",
      "dark:hover:bg-muted/50",
      "group-hover/cell:bg-muted",
    ]);
  });

  it("ignores static surfaces, accent, text tokens and negated states", () => {
    expect(
      findViolations(
        `"bg-muted odd:bg-muted/30 data-pinned:bg-muted/40 hover:bg-accent text-muted-foreground hover:text-muted-foreground not-data-selected:bg-muted [&:is(:first-child)]:bg-muted ring-foreground/10"`,
      ),
    ).toEqual([]);
  });
});
