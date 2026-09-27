// Structural gate: every registry.json item's declared dependencies must
// match what its actual source file imports — catches registry.json going
// stale (hand-edited, or generated from an older version of the source) and
// catches a real npm dependency being used but never installed.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Registry } from "@fmartinsandre/registry";
import { describe, expect, it } from "vitest";
import { detectNpmDependencies, detectRegistryDependencies } from "../scripts/gen-registry-json";

const ROOT = join(__dirname, "..");

const registry = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf8")) as Registry;

const packageJson = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
  dependencies?: Record<string, string>;
};
const installedDeps = new Set(Object.keys(packageJson.dependencies ?? {}));

const registryItemNames = new Set(registry.items.map((item) => item.name));

describe.each(registry.items.map((item) => [item.name, item] as const))(
  "registry item: %s",
  (name, item) => {
    const file = item.files[0];
    if (!file) throw new Error(`${name} declares no files`);
    const source = readFileSync(join(ROOT, file.path), "utf8");

    it("declares exactly the npm dependencies its source actually imports", () => {
      expect(new Set(item.dependencies ?? [])).toEqual(new Set(detectNpmDependencies(source)));
    });

    it("declares exactly the registryDependencies its source actually cross-imports", () => {
      expect(new Set(item.registryDependencies ?? [])).toEqual(
        new Set(detectRegistryDependencies(source, name)),
      );
    });

    it("every declared npm dependency is actually installed in package.json", () => {
      for (const dep of item.dependencies ?? []) {
        expect(
          installedDeps.has(dep),
          `"${dep}" is imported by ${name} but missing from packages/ui/package.json dependencies`,
        ).toBe(true);
      }
    });

    it("every declared registryDependency points at a real component in this registry", () => {
      for (const dep of item.registryDependencies ?? []) {
        expect(
          registryItemNames.has(dep),
          `registryDependency "${dep}" declared by ${name} doesn't exist in registry.json`,
        ).toBe(true);
      }
    });
  },
);
