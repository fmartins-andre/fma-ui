import { describe, expect, it } from "vitest";
import {
  detectNpmDependencies,
  detectRegistryDependencies,
  discoverModules,
  NAMESPACE,
  processComponent,
  processModule,
} from "../scripts/gen-registry-json";

describe("detectNpmDependencies", () => {
  it("collects real npm package imports", () => {
    const source = `
      import { cn } from "cn";
      import { cva } from "class-variance-authority";
      import { Button } from "react-aria-components";
    `;
    expect(detectNpmDependencies(source)).toEqual(
      expect.arrayContaining(["cn", "class-variance-authority", "react-aria-components"]),
    );
  });

  it("ignores relative imports, the @/ alias, node builtins, and react", () => {
    const source = `
      import { readFileSync } from "node:fs";
      import { helper } from "./helper";
      import { cn } from "@/lib/utils";
      import type * as React from "react";
    `;
    expect(detectNpmDependencies(source)).toEqual([]);
  });

  it("de-duplicates repeated imports", () => {
    const source = `
      import { cn } from "cn";
      import { cn as cn2 } from "cn";
    `;
    expect(detectNpmDependencies(source)).toEqual(["cn"]);
  });

  it("ignores import examples inside comments", () => {
    const source = `
      /**
       *   import { addDays } from 'date-fns'
       */
      // import { TZDate } from "@date-fns/tz";
      import { fromDate } from "@internationalized/date";
    `;
    expect(detectNpmDependencies(source)).toEqual(["@internationalized/date"]);
  });
});

describe("detectRegistryDependencies", () => {
  it("finds cross-component @/core/<id>/<id> imports, excluding self-imports", () => {
    const source = `
      import { Button } from "@/core/button/button";
      import { Card } from "@/core/card/card";
    `;
    expect(detectRegistryDependencies(source, "card-with-actions")).toEqual(
      expect.arrayContaining(["button", "card"]),
    );
  });

  it("excludes a self-referencing import", () => {
    const source = `import { Button } from "@/core/button/button";`;
    expect(detectRegistryDependencies(source, "button")).toEqual([]);
  });

  it("finds @/lib/<id>, @/lib/<id>/<sub> and @/hooks/<id> imports, skipping @/lib/utils", () => {
    const source = `
      import { cn } from "@/lib/utils";
      import type { Interval } from "@/lib/types";
      import { cpfMask } from "@/lib/input-masks/cpf-mask";
      import { useIsMobile } from "@/hooks/use-mobile";
    `;
    expect(detectRegistryDependencies(source, "some-component").sort()).toEqual([
      "input-masks",
      "types",
      "use-mobile",
    ]);
  });
});

// Built from the real sources: everything installs under "fma-ui" folders and
// depends on other items through the namespace, so a consumer's official
// shadcn components can't overwrite or stand in for ours.
describe("generated items", () => {
  const moduleItem = (id: string) => {
    const module = discoverModules().find((candidate) => candidate.id === id);
    if (!module) throw new Error(`No module ${id}`);
    return processModule(module);
  };

  it("installs components into components/fma-ui with namespaced dependencies", () => {
    const item = processComponent("menubar");
    expect(item?.files).toEqual([
      expect.objectContaining({ target: "components/fma-ui/menubar.tsx" }),
    ]);
    expect(item?.registryDependencies).toEqual([`${NAMESPACE}/dropdown-menu`]);
  });

  it("installs hooks and libs into hooks/fma-ui and lib/fma-ui", () => {
    const hook = moduleItem("use-mask");
    expect(hook.files.map((file) => file.target)).toEqual(["hooks/fma-ui/use-mask.ts"]);
    expect(hook.registryDependencies).toEqual([`${NAMESPACE}/input-masks`]);

    const lib = moduleItem("input-masks");
    expect(lib.files.map((file) => file.target)).toContain("lib/fma-ui/input-masks/cpf-mask.ts");
  });

  it("installs blocks into their own folder under components/fma-ui", () => {
    const block = moduleItem("app-sidebar");
    expect(block.type).toBe("registry:block");
    expect(block.files.map((file) => file.target)).toContain(
      "components/fma-ui/app-sidebar/app-sidebar.tsx",
    );
    expect(block.registryDependencies).toContain(`${NAMESPACE}/sidebar`);
  });
});
