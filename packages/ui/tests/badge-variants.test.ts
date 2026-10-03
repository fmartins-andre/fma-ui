// Contract gate: keeps the semantic badge variants (ported from EMITTE) from being
// dropped by a re-vendor or refactor. Ported from EMITTE's badge-variants.test.ts.
import { describe, expect, it } from "vitest";
import { badgeVariants, badgeVariantsConfig } from "../src/core/badge/badge";

const REQUIRED_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "link",
  "info",
  "success",
  "warning",
  "destructive",
  "invert",
  "primary-light",
  "secondary-light",
  "warning-light",
  "success-light",
  "info-light",
  "destructive-light",
  "invert-light",
  "primary-outline",
  "secondary-outline",
  "warning-outline",
  "success-outline",
  "info-outline",
  "destructive-outline",
  "invert-outline",
] as const;

const REQUIRED_SIZES = ["xs", "sm", "default", "lg", "xl"] as const;

const REQUIRED_RADII = ["default", "full"] as const;

// Each semantic tone must keep reading from its own status token.
const EXPECTED_CLASS = {
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  invert: "bg-invert",
  "info-light": "text-info-foreground",
  "success-light": "text-success-foreground",
  "warning-light": "text-warning-foreground",
  "destructive-light": "text-destructive-foreground",
  "info-outline": "border-info/30",
  "success-outline": "border-success/30",
  "warning-outline": "border-warning/30",
  "destructive-outline": "border-destructive/30",
} as const;

describe("Badge variant contract", () => {
  const definedVariants = Object.keys(badgeVariantsConfig.variant);
  const definedSizes = Object.keys(badgeVariantsConfig.size);
  const definedRadii = Object.keys(badgeVariantsConfig.radius);

  describe("variant keys", () => {
    for (const variant of REQUIRED_VARIANTS) {
      it(`includes variant "${variant}"`, () => {
        expect(definedVariants).toContain(variant);
      });
    }
  });

  describe("size keys", () => {
    for (const size of REQUIRED_SIZES) {
      it(`includes size "${size}"`, () => {
        expect(definedSizes).toContain(size);
      });
    }
  });

  describe("radius keys", () => {
    for (const radius of REQUIRED_RADII) {
      it(`includes radius "${radius}"`, () => {
        expect(definedRadii).toContain(radius);
      });
    }
  });

  describe("badgeVariants className output", () => {
    for (const [variant, expected] of Object.entries(EXPECTED_CLASS)) {
      it(`variant="${variant}" includes ${expected}`, () => {
        expect(badgeVariants({ variant: variant as keyof typeof EXPECTED_CLASS })).toContain(
          expected,
        );
      });
    }
  });
});
