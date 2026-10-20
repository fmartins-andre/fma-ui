// Regression gate for the sheet's `size` prop: re-vendoring the sheet from
// shadcn (`pnpm add:shadcn sheet`) would drop it, and the filter-toolbar
// relies on it.
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { describe, expect, expectTypeOf, it } from "vitest";
import { sheetSizeVariants } from "../src/core/sheet/sheet";

type SheetSize = VariantProps<typeof sheetSizeVariants>["size"];

const EXPECTED_CLASS = { sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-2xl" } as const;

describe("Sheet size type", () => {
  it("includes sm, md and lg", () => {
    expectTypeOf<"sm">().toExtend<SheetSize>();
    expectTypeOf<"md">().toExtend<SheetSize>();
    expectTypeOf<"lg">().toExtend<SheetSize>();
  });
});

describe("sheetSizeVariants", () => {
  for (const [size, expected] of Object.entries(EXPECTED_CLASS)) {
    it(`size="${size}" caps the width with ${expected}`, () => {
      expect(sheetSizeVariants({ size: size as keyof typeof EXPECTED_CLASS })).toBe(expected);
    });
  }

  it("defaults to sm", () => {
    expect(sheetSizeVariants()).toBe(EXPECTED_CLASS.sm);
  });

  it("is replaced by a width in the consumer's className", () => {
    const merged = cn(sheetSizeVariants({ size: "sm" }), "sm:max-w-xl");
    expect(merged).toBe("sm:max-w-xl");
  });
});
