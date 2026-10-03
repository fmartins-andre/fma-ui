import { describe, expect, it } from "vitest";
import {
  createDecimalMaskOptions,
  decimalMaskFormatter,
  decimalMaskRemover,
} from "@/lib/input-masks/decimal-mask";

// ─── Remover ────────────────────────────────────────────────────────

describe("decimalMaskRemover", () => {
  it("converts formatted BR decimal to numeric string", () => {
    expect(decimalMaskRemover("1.234,56")).toBe("1234.56");
  });

  it("handles value without thousand separators", () => {
    expect(decimalMaskRemover("100,00")).toBe("100.00");
  });

  it("handles integer-only formatted value", () => {
    expect(decimalMaskRemover("1.000,00")).toBe("1000.00");
  });

  it("returns empty string for null input", () => {
    expect(decimalMaskRemover(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(decimalMaskRemover(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(decimalMaskRemover("")).toBe("");
  });
});

// ─── Formatter (string input) ───────────────────────────────────────

describe("decimalMaskFormatter", () => {
  describe("string input", () => {
    it("formats a raw numeric string with BR locale", () => {
      // integer input padded to 2 fraction digits
      expect(decimalMaskFormatter("123456")).toBe("123.456,00");
    });

    it("formats an integer string with min fraction digits", () => {
      expect(decimalMaskFormatter("1000")).toBe("1.000,00");
    });

    it("formats a string with decimal point as digit sequence", () => {
      expect(decimalMaskFormatter("1234.56")).toBe("123.456,00");
    });
  });

  describe("number input", () => {
    it("formats a number value", () => {
      expect(decimalMaskFormatter(1234.56)).toBe("1.234,56");
    });

    it("formats zero", () => {
      expect(decimalMaskFormatter(0)).toBe("0,00");
    });

    it("formats a large number", () => {
      expect(decimalMaskFormatter(1000000)).toBe("1.000.000,00");
    });
  });

  describe("null / undefined / empty input", () => {
    it("returns empty string for null input", () => {
      expect(decimalMaskFormatter(null)).toBe("");
    });

    it("returns empty string for undefined input", () => {
      expect(decimalMaskFormatter(undefined)).toBe("");
    });

    it("returns empty string for empty input", () => {
      expect(decimalMaskFormatter("")).toBe("");
    });
  });

  describe("custom options", () => {
    it("supports custom min/max fraction digits", () => {
      expect(
        decimalMaskFormatter("1234", {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        }),
      ).toBe("1.234,000");
    });

    it("supports prefix", () => {
      expect(decimalMaskFormatter("1000", { prefix: "R$ " })).toBe("R$ 1.000,00");
    });
  });
});

// ─── Mask options generator ─────────────────────────────────────────

describe("createDecimalMaskOptions", () => {
  it("returns valid MaskitoOptions for defaults", () => {
    const opts = createDecimalMaskOptions();
    expect(opts.mask).toBeDefined();
    expect(opts.preprocessors).toBeDefined();
    expect(opts.postprocessors).toBeDefined();
  });

  it("accepts custom fraction digits", () => {
    const opts = createDecimalMaskOptions({
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    expect(opts.mask).toBeDefined();
  });

  it("accepts custom prefix", () => {
    const opts = createDecimalMaskOptions({ prefix: "R$ " });
    expect(opts.mask).toBeDefined();
  });
});
