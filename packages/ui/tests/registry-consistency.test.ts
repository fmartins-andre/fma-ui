// Structural gate: every published component must have a valid meta.json AND
// a colocated story — this is the check EMITTE's registry didn't enforce
// (see /var/home/fmartinsandre/DevProjects/EMITTE/emitte.design-system.frontend,
// which relies on developer discipline instead of a hook/CI gate for this).
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { ComponentMetaSchema } from "@fmartinsandre/registry";
import { describe, expect, it } from "vitest";

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
