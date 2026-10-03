import { describe, expect, it } from "vitest";
import {
  createCreditCardMaskOptions,
  creditCardMaskFormatter,
  creditCardMaskRemover,
} from "@/lib/input-masks/credit-card-mask";

// ─── Remover ────────────────────────────────────────────────────────

describe("creditCardMaskRemover", () => {
  it("strips formatting from a credit card value", () => {
    expect(creditCardMaskRemover("4111 1111 1111 1111")).toBe("4111111111111111");
  });

  it("returns only digits", () => {
    expect(creditCardMaskRemover("4111-1111-1111-1111")).toBe("4111111111111111");
  });

  it("returns empty string for null input", () => {
    expect(creditCardMaskRemover(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(creditCardMaskRemover(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(creditCardMaskRemover("")).toBe("");
  });
});

// ─── Formatter ──────────────────────────────────────────────────────

describe("creditCardMaskFormatter", () => {
  it("formats a raw 16-digit card number", () => {
    expect(creditCardMaskFormatter("4111111111111111")).toBe("4111 1111 1111 1111");
  });

  it("formats a different 16-digit number", () => {
    expect(creditCardMaskFormatter("5500000000000004")).toBe("5500 0000 0000 0004");
  });

  it("formats partial input without placeholder chars", () => {
    expect(creditCardMaskFormatter("41111111")).toBe("4111 1111");
  });

  it("formats 4 digits", () => {
    expect(creditCardMaskFormatter("4111")).toBe("4111");
  });

  it("truncates extra digits beyond the mask", () => {
    // 19 digits — mask only holds 16
    expect(creditCardMaskFormatter("4111111111111111111")).toBe("4111 1111 1111 1111");
  });

  it("returns empty string for null input", () => {
    expect(creditCardMaskFormatter(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(creditCardMaskFormatter(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(creditCardMaskFormatter("")).toBe("");
  });
});

// ─── Mask options ───────────────────────────────────────────────────

describe("createCreditCardMaskOptions", () => {
  it("has the credit card mask pattern", () => {
    const options = createCreditCardMaskOptions();
    const pattern = options.mask as readonly (string | RegExp)[];
    expect(pattern).toHaveLength(19);
    expect(pattern[4]).toBe(" ");
    expect(pattern[9]).toBe(" ");
    expect(pattern[14]).toBe(" ");
  });

  it("includes placeholder preprocessors", () => {
    const options = createCreditCardMaskOptions();
    expect(options.preprocessors).toBeDefined();
    expect(options.preprocessors?.length).toBeGreaterThan(0);
  });

  it("includes placeholder postprocessors", () => {
    const options = createCreditCardMaskOptions();
    expect(options.postprocessors).toBeDefined();
    expect(options.postprocessors?.length).toBeGreaterThan(0);
  });
});
