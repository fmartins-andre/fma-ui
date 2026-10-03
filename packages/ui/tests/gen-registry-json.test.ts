import { describe, expect, it } from "vitest";
import { detectNpmDependencies, detectRegistryDependencies } from "../scripts/gen-registry-json";

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
});
