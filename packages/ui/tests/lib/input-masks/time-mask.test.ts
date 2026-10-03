import { describe, expect, it } from "vitest";
import {
  createTimeMaskOptions,
  timeMaskFormatter,
  timeMaskRemover,
} from "@/lib/input-masks/time-mask";

// ─── Remover ────────────────────────────────────────────────────────

describe("timeMaskRemover", () => {
  it("keeps digits and colons", () => {
    expect(timeMaskRemover("12:30")).toBe("12:30");
  });

  it("strips non-digit, non-colon characters", () => {
    expect(timeMaskRemover("12:30 PM")).toBe("12:30");
  });

  it("returns empty string for null input", () => {
    expect(timeMaskRemover(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(timeMaskRemover(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(timeMaskRemover("")).toBe("");
  });
});

// ─── Formatter ──────────────────────────────────────────────────────

describe("timeMaskFormatter", () => {
  describe("string input", () => {
    it("formats a raw 4-digit time string", () => {
      expect(timeMaskFormatter("1230")).toBe("12:30");
    });

    it("parses partial time and fills with defaults", () => {
      // "12" parses as 12:00
      expect(timeMaskFormatter("12")).toBe("12:00");
    });

    it("formats midnight", () => {
      expect(timeMaskFormatter("0000")).toBe("00:00");
    });
  });

  describe("number input (milliseconds)", () => {
    it("formats milliseconds to time string", () => {
      // 12:30 = 12*3600000 + 30*60000 = 45000000
      expect(timeMaskFormatter(45000000)).toBe("12:30");
    });

    it("formats zero to midnight", () => {
      expect(timeMaskFormatter(0)).toBe("00:00");
    });
  });

  describe("null / undefined / empty input", () => {
    it("returns empty string for null input", () => {
      expect(timeMaskFormatter(null)).toBe("");
    });

    it("returns empty string for undefined input", () => {
      expect(timeMaskFormatter(undefined)).toBe("");
    });

    it("returns empty string for empty input", () => {
      expect(timeMaskFormatter("")).toBe("");
    });
  });
});

// ─── Mask options ───────────────────────────────────────────────────

describe("createTimeMaskOptions", () => {
  it("returns valid MaskitoOptions for defaults", () => {
    const opts = createTimeMaskOptions();
    expect(opts.mask).toBeDefined();
    expect(opts.preprocessors).toBeDefined();
    expect(opts.postprocessors).toBeDefined();
  });

  it("includes placeholder plugins", () => {
    const opts = createTimeMaskOptions();
    expect(opts.plugins).toBeDefined();
    expect(opts.plugins?.length).toBeGreaterThan(0);
  });

  it("accepts custom mode", () => {
    const opts = createTimeMaskOptions({ mode: "HH:MM:SS" });
    expect(opts.mask).toBeDefined();
  });
});
