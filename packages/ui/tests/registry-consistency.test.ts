// Structural gate: every published component must have a valid meta.json AND
// a colocated story — this is the check EMITTE's registry didn't enforce
// (see /var/home/fmartinsandre/DevProjects/EMITTE/emitte.design-system.frontend,
// which relies on developer discipline instead of a hook/CI gate for this).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ComponentMetaSchema } from "@fma-ui/registry";
import { describe, expect, it } from "vitest";
import { discoverModules } from "../scripts/gen-registry-json";

const CORE_DIR = join(__dirname, "..", "src", "core");

const componentIds = readdirSync(CORE_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "_incoming")
  .map((entry) => entry.name);

describe.each(componentIds)("src/core/%s", (id) => {
  const dir = join(CORE_DIR, id);
  const files = readdirSync(dir);

  it("has a meta.json that matches ComponentMetaSchema", async () => {
    const meta = await import(join(dir, "meta.json"));
    expect(() => ComponentMetaSchema.parse(meta.default ?? meta)).not.toThrow();
  });

  it(`has ${id}.tsx`, () => {
    expect(files).toContain(`${id}.tsx`);
  });

  it(`has a colocated ${id}.stories.tsx`, () => {
    expect(files).toContain(`${id}.stories.tsx`);
  });
});

// Libs (src/lib), hooks (src/hooks) and blocks (src/blocks) with metadata are
// published too. The gate is: valid meta.json, at least one source file, and
// either unit tests importing them (libs/hooks: tests/**/*.test.ts mentioning
// "@/lib/<id>" or "@/hooks/<id>", except type-only modules and the vendored
// shadcn hook) or, for blocks, a colocated <id>.stories.tsx.
const UI_ROOT = join(__dirname, "..");
const UNTESTED_MODULES = new Set(["types", "use-mobile"]);

function readTestSources(dir: string): string {
  return readdirSync(dir, { withFileTypes: true })
    .map((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return readTestSources(path);
      return entry.name.endsWith(".test.ts") ? readFileSync(path, "utf8") : "";
    })
    .join("\n");
}

const testSources = readTestSources(join(UI_ROOT, "tests"));
const modules = discoverModules(UI_ROOT);

describe.each(modules.map((module) => [module.id, module] as const))(
  "lib/hook %s",
  (id, module) => {
    it("has a meta.json that matches ComponentMetaSchema and names itself", () => {
      const meta = ComponentMetaSchema.parse(
        JSON.parse(readFileSync(join(UI_ROOT, module.metaPath), "utf8")),
      );
      expect(meta.name).toBe(id);
    });

    it("has at least one source file", () => {
      expect(module.files.length).toBeGreaterThan(0);
      for (const file of module.files) expect(existsSync(join(UI_ROOT, file))).toBe(true);
    });

    const isBlock = module.metaPath.startsWith("src/blocks/");

    it.skipIf(isBlock || UNTESTED_MODULES.has(id))("is covered by unit tests", () => {
      expect(testSources).toMatch(new RegExp(`["']@/(lib|hooks)/${id}["/]`));
    });

    it.runIf(isBlock)(`has a colocated ${id}.stories.tsx`, () => {
      expect(existsSync(join(UI_ROOT, "src/blocks", id, `${id}.stories.tsx`))).toBe(true);
    });
  },
);
