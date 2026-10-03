import { describe, expect, it } from "vitest";
import {
  createDateMaskOptions,
  dateMaskFormatter,
  dateMaskRemover,
  parseIsoDateParts,
} from "@/lib/input-masks/date-mask";

// ─── Remover ────────────────────────────────────────────────────────

describe("dateMaskRemover", () => {
  it("converts dd/mm/yyyy to ISO format", () => {
    expect(dateMaskRemover("01/01/2024")).toBe("2024-01-01");
  });

  it("handles end of year", () => {
    expect(dateMaskRemover("31/12/2024")).toBe("2024-12-31");
  });

  it("returns empty string for invalid format", () => {
    expect(dateMaskRemover("01-01-2024")).toBe("");
  });

  it("returns empty string for partial date", () => {
    expect(dateMaskRemover("01/01")).toBe("");
  });

  it("returns empty string for null input", () => {
    expect(dateMaskRemover(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(dateMaskRemover(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(dateMaskRemover("")).toBe("");
  });

  it("trims whitespace", () => {
    expect(dateMaskRemover("  01/01/2024  ")).toBe("2024-01-01");
  });

  it("converts mm/yyyy to ISO year-month format", () => {
    expect(dateMaskRemover("06/2024", "mm/yyyy")).toBe("2024-06");
  });

  it("returns empty string for incomplete mm/yyyy", () => {
    expect(dateMaskRemover("06", "mm/yyyy")).toBe("");
  });

  it("returns the year as-is for yyyy mode", () => {
    expect(dateMaskRemover("2024", "yyyy")).toBe("2024");
  });

  it("returns empty string for incomplete yyyy", () => {
    expect(dateMaskRemover("202", "yyyy")).toBe("");
  });
});

// ─── Formatter (string input) ───────────────────────────────────────

describe("dateMaskFormatter", () => {
  describe("string input", () => {
    it("formats a raw 8-digit date", () => {
      expect(dateMaskFormatter("01012024")).toBe("01/01/2024");
    });

    it("formats a raw date with leading zeros", () => {
      expect(dateMaskFormatter("01012024")).toBe("01/01/2024");
    });

    it("formats partial input (4 digits)", () => {
      expect(dateMaskFormatter("0101")).toBe("01/01");
    });

    it("formats already-formatted date", () => {
      expect(dateMaskFormatter("01/01/2024")).toBe("01/01/2024");
    });
  });

  describe("Date object input", () => {
    it("formats a Date object", () => {
      expect(dateMaskFormatter(new Date(2024, 0, 1))).toBe("01/01/2024");
    });

    it("formats end-of-year date", () => {
      expect(dateMaskFormatter(new Date(2024, 11, 31))).toBe("31/12/2024");
    });
  });

  describe("null / undefined / empty input", () => {
    it("returns empty string for null input", () => {
      expect(dateMaskFormatter(null)).toBe("");
    });

    it("returns empty string for undefined input", () => {
      expect(dateMaskFormatter(undefined)).toBe("");
    });

    it("returns empty string for empty input", () => {
      expect(dateMaskFormatter("")).toBe("");
    });
  });

  describe("mm/yyyy mode", () => {
    it("formats a Date object as mm/yyyy", () => {
      expect(dateMaskFormatter(new Date(2024, 5, 1), { mode: "mm/yyyy" })).toBe("06/2024");
    });

    it("formats a raw 6-digit string as mm/yyyy", () => {
      expect(dateMaskFormatter("062024", { mode: "mm/yyyy" })).toBe("06/2024");
    });
  });

  describe("yyyy mode", () => {
    it("formats a Date object as yyyy", () => {
      expect(dateMaskFormatter(new Date(2024, 0, 1), { mode: "yyyy" })).toBe("2024");
    });

    it("formats a raw 4-digit string as yyyy", () => {
      expect(dateMaskFormatter("2024", { mode: "yyyy" })).toBe("2024");
    });
  });
});

// ─── Mask options generator ─────────────────────────────────────────

describe("createDateMaskOptions", () => {
  it("returns valid MaskitoOptions for defaults", () => {
    const opts = createDateMaskOptions();
    expect(opts.mask).toBeDefined();
    expect(opts.preprocessors).toBeDefined();
    expect(opts.postprocessors).toBeDefined();
  });

  it("includes placeholder plugins (autohide on blur)", () => {
    const opts = createDateMaskOptions();
    expect(opts.plugins).toBeDefined();
    expect(opts.plugins?.length).toBeGreaterThan(0);
  });

  it("accepts custom min/max options", () => {
    const opts = createDateMaskOptions({
      min: new Date(2024, 0, 1),
      max: new Date(2024, 11, 31),
    });
    expect(opts.mask).toBeDefined();
  });

  it("returns valid MaskitoOptions for mm/yyyy mode", () => {
    const opts = createDateMaskOptions({ mode: "mm/yyyy" });
    expect(opts.mask).toBeDefined();
    expect(opts.plugins?.length).toBeGreaterThan(0);
  });

  it("returns valid MaskitoOptions for yyyy mode", () => {
    const opts = createDateMaskOptions({ mode: "yyyy" });
    expect(opts.mask).toBeDefined();
    expect(opts.plugins?.length).toBeGreaterThan(0);
  });
});

// ─── parseIsoDateParts ───────────────────────────────────────────────

describe("parseIsoDateParts", () => {
  it("parses a full yyyy-mm-dd string into a local Date", () => {
    const result = parseIsoDateParts("2024-01-15");
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2024);
    expect(result?.getMonth()).toBe(0);
    expect(result?.getDate()).toBe(15);
  });

  it("parses a yyyy-mm string, defaulting day to 1", () => {
    const result = parseIsoDateParts("2024-06");
    expect(result?.getFullYear()).toBe(2024);
    expect(result?.getMonth()).toBe(5);
    expect(result?.getDate()).toBe(1);
  });

  it("parses a yyyy string, defaulting month and day to January 1st", () => {
    const result = parseIsoDateParts("2024");
    expect(result?.getFullYear()).toBe(2024);
    expect(result?.getMonth()).toBe(0);
    expect(result?.getDate()).toBe(1);
  });

  it("returns undefined for an empty string", () => {
    expect(parseIsoDateParts("")).toBeUndefined();
  });

  it("round-trips through dateMaskRemover for a full date", () => {
    const iso = dateMaskRemover("31/12/2024");
    const result = parseIsoDateParts(iso);
    expect(result?.getFullYear()).toBe(2024);
    expect(result?.getMonth()).toBe(11);
    expect(result?.getDate()).toBe(31);
  });
});

// ─── formatValue/parseValue round-trip ──────────────────────────────

// Replicates a masked-date-input's format/parse round-trip:
// formatValue = dateMaskFormatter(date, opts) and
// parseValue = parseIsoDateParts(dateMaskRemover(masked, mode)).
// A calendar's external-selected sync effect feeds every picked value
// through this loop, so any value that doesn't survive it is silently
// dropped on the next render (the bug class fixed in 34f7c86).
describe("single-date mask round-trip", () => {
  it.each([
    ["dd/mm/yyyy", new Date(2025, 5, 15)],
    ["mm/yyyy", new Date(2025, 5, 1)],
    ["yyyy", new Date(2025, 0, 1)],
  ] as const)("survives format → parse in %s mode", (mode, date) => {
    const masked = dateMaskFormatter(date, { mode });
    const parsed = parseIsoDateParts(dateMaskRemover(masked, mode));
    expect(parsed).toEqual(date);
  });

  it("round-trips an empty value to undefined", () => {
    const masked = dateMaskFormatter(null);
    expect(parseIsoDateParts(dateMaskRemover(masked))).toBeUndefined();
  });
});
