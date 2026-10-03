import { describe, expect, it } from "vitest";
import {
  createDateTimeMaskOptions,
  dateTimeMaskFormatter,
  dateTimeMaskRemover,
} from "@/lib/input-masks/date-time-mask";

// ─── Remover ────────────────────────────────────────────────────────

describe("dateTimeMaskRemover", () => {
  it("converts formatted dd/mm/yyyy HH:MM to ISO string", () => {
    // 07.11.2022, 13:17 → Nov 7, 2022 13:17 UTC
    const iso = dateTimeMaskRemover("07/11/2022, 13:17");
    expect(iso).toBe("2022-11-07T13:17:00.000Z");
  });

  it("handles date-only input", () => {
    const iso = dateTimeMaskRemover("07/11/2022");
    expect(iso).toBe("2022-11-07T00:00:00.000Z");
  });

  it("returns empty string for null input", () => {
    expect(dateTimeMaskRemover(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(dateTimeMaskRemover(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(dateTimeMaskRemover("")).toBe("");
  });
});

// ─── Formatter ──────────────────────────────────────────────────────

describe("dateTimeMaskFormatter", () => {
  describe("string input", () => {
    it("formats a raw 12-digit datetime string", () => {
      expect(dateTimeMaskFormatter("071120221317")).toBe("07/11/2022, 13:17");
    });

    it("formats date-only (8 digits)", () => {
      expect(dateTimeMaskFormatter("07112022")).toBe("07/11/2022");
    });

    it("formats partial datetime (10 digits)", () => {
      expect(dateTimeMaskFormatter("0711202213")).toBe("07/11/2022, 13");
    });
  });

  describe("Date object input", () => {
    it("formats a Date object", () => {
      expect(dateTimeMaskFormatter(new Date(2024, 0, 1, 13, 17))).toBe("01/01/2024, 13:17");
    });

    it("formats midnight", () => {
      expect(dateTimeMaskFormatter(new Date(2024, 0, 1))).toBe("01/01/2024, 00:00");
    });
  });

  describe("null / undefined / empty input", () => {
    it("returns empty string for null input", () => {
      expect(dateTimeMaskFormatter(null)).toBe("");
    });

    it("returns empty string for undefined input", () => {
      expect(dateTimeMaskFormatter(undefined)).toBe("");
    });

    it("returns empty string for empty input", () => {
      expect(dateTimeMaskFormatter("")).toBe("");
    });
  });
});

// ─── Mask options ───────────────────────────────────────────────────

describe("createDateTimeMaskOptions", () => {
  it("returns valid MaskitoOptions for defaults", () => {
    const opts = createDateTimeMaskOptions();
    expect(opts.mask).toBeDefined();
    expect(opts.preprocessors).toBeDefined();
    expect(opts.postprocessors).toBeDefined();
  });

  it("includes placeholder plugins", () => {
    const opts = createDateTimeMaskOptions();
    expect(opts.plugins).toBeDefined();
    expect(opts.plugins?.length).toBeGreaterThan(0);
  });

  it("accepts custom dateSeparator", () => {
    const opts = createDateTimeMaskOptions({ dateSeparator: " - " });
    expect(opts.mask).toBeDefined();
  });
});
