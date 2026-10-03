import { describe, expect, it } from "vitest";
import {
  cnpjMaskFormatter,
  cnpjMaskRemover,
  createCnpjMaskOptions,
} from "@/lib/input-masks/cnpj-mask";

// ─── Remover ────────────────────────────────────────────────────────

describe("cnpjMaskRemover", () => {
  it("strips formatting from a CNPJ value", () => {
    expect(cnpjMaskRemover("12.345.678/0001-99")).toBe("12345678000199");
  });

  it("uppercases letter characters", () => {
    expect(cnpjMaskRemover("ab.cde.fg/hijk-lm")).toBe("ABCDEFGHIJKLM");
  });

  it("returns only digits and letters", () => {
    expect(cnpjMaskRemover("12.345.678/0001-99")).toBe("12345678000199");
  });

  it("returns empty string for null input", () => {
    expect(cnpjMaskRemover(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(cnpjMaskRemover(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(cnpjMaskRemover("")).toBe("");
  });
});

// ─── Formatter ──────────────────────────────────────────────────────

describe("cnpjMaskFormatter", () => {
  it("formats a raw 14-digit CNPJ", () => {
    expect(cnpjMaskFormatter("12345678000199")).toBe("12.345.678/0001-99");
  });

  it("formats with leading zeros", () => {
    expect(cnpjMaskFormatter("00123456000199")).toBe("00.123.456/0001-99");
  });

  it("formats partial CNPJ without placeholder chars", () => {
    expect(cnpjMaskFormatter("12345678")).toBe("12.345.678");
  });

  it("uppercases letter characters in the output", () => {
    expect(cnpjMaskFormatter("ab000000000000")).toBe("AB.000.000/0000-00");
  });

  it("returns empty string for null input", () => {
    expect(cnpjMaskFormatter(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(cnpjMaskFormatter(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(cnpjMaskFormatter("")).toBe("");
  });
});

// ─── Mask options ───────────────────────────────────────────────────

describe("createCnpjMaskOptions", () => {
  it("has the CNPJ mask pattern", () => {
    const options = createCnpjMaskOptions();
    const pattern = options.mask as readonly (string | RegExp)[];
    expect(pattern).toHaveLength(18);
    expect(pattern[2]).toBe(".");
    expect(pattern[10]).toBe("/");
    expect(pattern[15]).toBe("-");
  });

  it("includes placeholder preprocessors", () => {
    const options = createCnpjMaskOptions();
    expect(options.preprocessors).toBeDefined();
    expect(options.preprocessors?.length).toBeGreaterThan(0);
  });

  it("includes postprocessors (placeholder + uppercase)", () => {
    const options = createCnpjMaskOptions();
    expect(options.postprocessors).toBeDefined();
    expect(options.postprocessors?.length).toBeGreaterThanOrEqual(2);
  });

  it("uppercase postprocessor uppercases value", () => {
    const options = createCnpjMaskOptions();
    const result = options.postprocessors?.[1]?.(
      { selection: [0, 0] as [number, number], value: "abc" },
      { value: "", selection: [0, 0] as [number, number] },
    );
    expect(result?.value).toBe("ABC");
  });
});
