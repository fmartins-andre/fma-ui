// Contract gate for the semantic alert variants. Ported from EMITTE's alert.test.ts.
import type { VariantProps } from "class-variance-authority";
import { describe, expect, expectTypeOf, it } from "vitest";
import { alertVariants } from "../src/core/alert/alert";

type AlertVariant = VariantProps<typeof alertVariants>["variant"];

const VARIANTS = ["default", "destructive", "info", "success", "warning", "invert"] as const;

// Compile-time guard against variant removal.
describe("Alert variant type", () => {
  it("includes all six variants in the type union", () => {
    expectTypeOf<"default">().toExtend<AlertVariant>();
    expectTypeOf<"destructive">().toExtend<AlertVariant>();
    expectTypeOf<"info">().toExtend<AlertVariant>();
    expectTypeOf<"success">().toExtend<AlertVariant>();
    expectTypeOf<"warning">().toExtend<AlertVariant>();
    expectTypeOf<"invert">().toExtend<AlertVariant>();
  });
});

// Runtime guard: catch variant removal or token remap.
const EXPECTED_CLASS: Record<(typeof VARIANTS)[number], string> = {
  default: "bg-card",
  destructive: "bg-destructive/4",
  info: "bg-info/4",
  success: "bg-success/4",
  warning: "bg-warning/4",
  invert: "bg-invert",
};

describe("alertVariants className output", () => {
  for (const variant of VARIANTS) {
    it(`variant="${variant}" includes expected token class`, () => {
      expect(alertVariants({ variant })).toContain(EXPECTED_CLASS[variant]);
    });
  }
});
