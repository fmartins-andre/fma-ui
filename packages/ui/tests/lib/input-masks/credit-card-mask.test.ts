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

  it("keeps up to 19 digits for issuers that use them", () => {
    expect(creditCardMaskFormatter("4111111111111111111")).toBe("4111 1111 1111 1111111");
  });

  it("truncates digits beyond the issuer's longest length", () => {
    expect(creditCardMaskFormatter("41111111111111111112")).toBe("4111 1111 1111 1111111");
    expect(creditCardMaskFormatter("3782822463100051")).toBe("3782 822463 10005");
  });

  it("groups Amex 4-6-5", () => {
    expect(creditCardMaskFormatter("378282246310005")).toBe("3782 822463 10005");
  });

  it("groups Diners 4-6-4", () => {
    expect(creditCardMaskFormatter("30569309025904")).toBe("3056 930902 5904");
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
  it("picks the pattern from the issuer", () => {
    const options = createCreditCardMaskOptions();
    if (typeof options.mask !== "function") throw new Error("expected a dynamic mask");
    const patternFor = (value: string) =>
      (options.mask as (state: { value: string; selection: [number, number] }) => unknown[])({
        value,
        selection: [0, 0],
      });
    const unknown = patternFor("");
    expect(unknown).toHaveLength(22);
    expect([unknown[4], unknown[9], unknown[14]]).toEqual([" ", " ", " "]);
    const amex = patternFor("37");
    expect(amex).toHaveLength(17);
    expect([amex[4], amex[11]]).toEqual([" ", " "]);
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
