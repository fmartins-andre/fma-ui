import { describe, expect, it } from "vitest";
import {
  createPhoneMaskOptions,
  phoneMaskFormatter,
  phoneMaskRemover,
} from "@/lib/input-masks/phone-mask";

// ─── Remover ────────────────────────────────────────────────────────

describe("phoneMaskRemover", () => {
  it("strips formatting from a mobile phone", () => {
    expect(phoneMaskRemover("(11) 98765-4321")).toBe("11987654321");
  });

  it("strips formatting from a fixed phone", () => {
    expect(phoneMaskRemover("(11) 3456-7890")).toBe("1134567890");
  });

  it("returns only digits", () => {
    expect(phoneMaskRemover("(11) 9@#8765-4321")).toBe("11987654321");
  });

  it("returns empty string for empty input", () => {
    expect(phoneMaskRemover("")).toBe("");
  });
});

// ─── Formatter ──────────────────────────────────────────────────────

describe("phoneMaskFormatter", () => {
  describe("mobile phone (3rd digit is 9)", () => {
    it("formats a raw 11-digit mobile number", () => {
      expect(phoneMaskFormatter("11987654321")).toBe("(11) 98765-4321");
    });

    it("formats with DDD 21", () => {
      expect(phoneMaskFormatter("21987654321")).toBe("(21) 98765-4321");
    });
  });

  describe("fixed phone (3rd digit is not 9)", () => {
    it("formats a raw 10-digit fixed number", () => {
      expect(phoneMaskFormatter("1134567890")).toBe("(11) 3456-7890");
    });

    it("formats with DDD 21", () => {
      expect(phoneMaskFormatter("2134567890")).toBe("(21) 3456-7890");
    });
  });

  it("formats a partial phone number", () => {
    expect(phoneMaskFormatter("1198")).toBe("(11) 98");
  });

  it("returns empty string for empty input", () => {
    expect(phoneMaskFormatter("")).toBe("");
  });
});

// ─── Mask options ───────────────────────────────────────────────────

describe("createPhoneMaskOptions", () => {
  it("has a dynamic mask function", () => {
    const options = createPhoneMaskOptions();
    expect(typeof options.mask).toBe("function");
  });

  it("selects mobile pattern when 3rd digit is 9", () => {
    const options = createPhoneMaskOptions();
    const fn = options.mask as unknown as (s: { value: string }) => readonly (string | RegExp)[];
    const mobile = fn({ value: "11987654321" });
    const fixed = fn({ value: "1134567890" });

    // Mobile pattern has 15 positions, fixed has 14
    expect(mobile).toHaveLength(15);
    expect(fixed).toHaveLength(14);
  });

  it("includes focus and blur plugins", () => {
    const options = createPhoneMaskOptions();
    const plugins = options.plugins;
    expect(plugins).toBeDefined();
    expect(plugins).toHaveLength(2);
    for (const plugin of plugins ?? []) {
      expect(typeof plugin).toBe("function");
    }
  });
});

// ─── Factory isolation ───────────────────────────────────────────────

describe("createPhoneMaskOptions (factory)", () => {
  it("returns a MaskitoOptions object", () => {
    const options = createPhoneMaskOptions();
    expect(options).toBeDefined();
    expect(typeof options.mask).toBe("function");
  });

  it("returns distinct instances with independent plugins", () => {
    const a = createPhoneMaskOptions();
    const b = createPhoneMaskOptions();
    expect(a).not.toBe(b);
    expect(a.plugins).not.toBe(b.plugins);
    expect(a.plugins).toHaveLength(2);
    expect(b.plugins).toHaveLength(2);
  });

  it("returns instances with preprocessors", () => {
    const options = createPhoneMaskOptions();
    expect(options.preprocessors).toBeDefined();
    expect(options.preprocessors?.length).toBeGreaterThanOrEqual(1);
  });

  it("returns instances with postprocessors", () => {
    const options = createPhoneMaskOptions();
    expect(options.postprocessors).toBeDefined();
    expect(options.postprocessors?.length).toBeGreaterThanOrEqual(1);
  });
});
