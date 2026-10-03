import { describe, expect, it } from "vitest";
import { cpfMaskFormatter, cpfMaskRemover, createCpfMaskOptions } from "@/lib/input-masks/cpf-mask";

// ─── Remover ────────────────────────────────────────────────────────

describe("cpfMaskRemover", () => {
  it("strips formatting from a CPF value", () => {
    expect(cpfMaskRemover("123.456.789-01")).toBe("12345678901");
  });

  it("returns only digits", () => {
    expect(cpfMaskRemover("1@2#3$4%5")).toBe("12345");
  });

  it("returns empty string for null input", () => {
    expect(cpfMaskRemover(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(cpfMaskRemover(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(cpfMaskRemover("")).toBe("");
  });
});

// ─── Formatter ──────────────────────────────────────────────────────

describe("cpfMaskFormatter", () => {
  it("formats a raw 11-digit CPF", () => {
    expect(cpfMaskFormatter("12345678901")).toBe("123.456.789-01");
  });

  it("formats with leading zeros", () => {
    expect(cpfMaskFormatter("00123456000")).toBe("001.234.560-00");
  });

  it("formats partial CPF without placeholder chars", () => {
    // 9 digits → 3 blocks filled, no trailing placeholder chars
    expect(cpfMaskFormatter("123456789")).toBe("123.456.789");
  });

  it("formats 3 digits (before first separator)", () => {
    expect(cpfMaskFormatter("123")).toBe("123");
  });

  it("returns empty string for null input", () => {
    expect(cpfMaskFormatter(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(cpfMaskFormatter(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(cpfMaskFormatter("")).toBe("");
  });
});

// ─── Mask options ───────────────────────────────────────────────────

describe("createCpfMaskOptions", () => {
  it("has the CPF mask pattern", () => {
    const options = createCpfMaskOptions();
    const pattern = options.mask as readonly (string | RegExp)[];
    expect(pattern).toHaveLength(14);
    expect(pattern[3]).toBe(".");
    expect(pattern[11]).toBe("-");
  });

  it("includes placeholder preprocessors from maskitoWithPlaceholder", () => {
    const options = createCpfMaskOptions();
    expect(options.preprocessors).toBeDefined();
    expect(options.preprocessors?.length).toBeGreaterThan(0);
  });

  it("includes placeholder postprocessors from maskitoWithPlaceholder", () => {
    const options = createCpfMaskOptions();
    expect(options.postprocessors).toBeDefined();
    expect(options.postprocessors?.length).toBeGreaterThan(0);
  });
});
