import { describe, expect, it } from "vitest";
import { cepMaskFormatter, cepMaskRemover, createCepMaskOptions } from "@/lib/input-masks/cep-mask";

// ─── Remover ────────────────────────────────────────────────────────

describe("cepMaskRemover", () => {
  it("strips formatting from a CEP value", () => {
    expect(cepMaskRemover("01001-000")).toBe("01001000");
  });

  it("returns only digits", () => {
    expect(cepMaskRemover("01@001-000")).toBe("01001000");
  });

  it("returns empty string for null input", () => {
    expect(cepMaskRemover(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(cepMaskRemover(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(cepMaskRemover("")).toBe("");
  });
});

// ─── Formatter ──────────────────────────────────────────────────────

describe("cepMaskFormatter", () => {
  it("formats a raw 8-digit CEP", () => {
    expect(cepMaskFormatter("01001000")).toBe("01001-000");
  });

  it("formats a raw CEP starting with zero", () => {
    expect(cepMaskFormatter("00000000")).toBe("00000-000");
  });

  it("formats partial CEP (5 digits)", () => {
    expect(cepMaskFormatter("01001")).toBe("01001");
  });

  it("returns empty string for null input", () => {
    expect(cepMaskFormatter(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(cepMaskFormatter(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(cepMaskFormatter("")).toBe("");
  });
});

// ─── Mask options ───────────────────────────────────────────────────

describe("createCepMaskOptions", () => {
  it("has the CEP mask pattern", () => {
    const options = createCepMaskOptions();
    const pattern = options.mask as readonly (string | RegExp)[];
    expect(pattern).toHaveLength(9);
    expect(pattern[5]).toBe("-");
  });

  it("includes placeholder preprocessors", () => {
    const options = createCepMaskOptions();
    expect(options.preprocessors).toBeDefined();
    expect(options.preprocessors?.length).toBeGreaterThan(0);
  });

  it("includes placeholder postprocessors", () => {
    const options = createCepMaskOptions();
    expect(options.postprocessors).toBeDefined();
    expect(options.postprocessors?.length).toBeGreaterThan(0);
  });
});
