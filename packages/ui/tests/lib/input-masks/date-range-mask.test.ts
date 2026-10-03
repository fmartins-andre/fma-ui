import { describe, expect, it } from "vitest";
import {
  createDateRangeMaskOptions,
  dateRangeMaskFormatter,
  dateRangeMaskParser,
  dateRangeMaskRemover,
  parseIsoDateRangeParts,
} from "@/lib/input-masks/date-range-mask";

// ─── Remover ────────────────────────────────────────────────────────

describe("dateRangeMaskRemover", () => {
  it("strips formatting from a date range", () => {
    expect(dateRangeMaskRemover("01/01/2024\u00a0–\u00a001/01/2024")).toBe("0101202401012024");
  });

  it("strips partial range", () => {
    expect(dateRangeMaskRemover("01/01/2024\u00a0–\u00a001/0")).toBe("01012024010");
  });

  it("returns empty string for null input", () => {
    expect(dateRangeMaskRemover(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(dateRangeMaskRemover(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(dateRangeMaskRemover("")).toBe("");
  });
});

// ─── Formatter ──────────────────────────────────────────────────────

describe("dateRangeMaskFormatter", () => {
  it("formats a raw 16-digit date range", () => {
    expect(dateRangeMaskFormatter("0101202401012024")).toBe("01/01/2024\u00a0–\u00a001/01/2024");
  });

  it("formats first date only (8 digits)", () => {
    expect(dateRangeMaskFormatter("01012024")).toBe("01/01/2024");
  });

  it("formats partial range crossing the separator", () => {
    expect(dateRangeMaskFormatter("01012024010")).toBe("01/01/2024\u00a0–\u00a001/0");
  });

  it("formats 2 digits (partial first date)", () => {
    expect(dateRangeMaskFormatter("01")).toBe("01");
  });

  it("returns empty string for null input", () => {
    expect(dateRangeMaskFormatter(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(dateRangeMaskFormatter(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(dateRangeMaskFormatter("")).toBe("");
  });
});

// ─── Mask options ───────────────────────────────────────────────────

describe("createDateRangeMaskOptions", () => {
  it("returns valid MaskitoOptions for defaults", () => {
    const opts = createDateRangeMaskOptions();
    expect(opts.mask).toBeDefined();
    expect(opts.preprocessors).toBeDefined();
    expect(opts.postprocessors).toBeDefined();
  });

  it("includes placeholder plugins", () => {
    const opts = createDateRangeMaskOptions();
    expect(opts.plugins).toBeDefined();
    expect(opts.plugins?.length).toBeGreaterThan(0);
  });

  it("accepts custom mode", () => {
    const opts = createDateRangeMaskOptions({ mode: "mm/dd/yyyy" });
    expect(opts.mask).toBeDefined();
  });
});

// ─── dateRangeMaskParser ────────────────────────────────────────────

describe("dateRangeMaskParser", () => {
  it("splits a complete dd/mm/yyyy range into ISO parts", () => {
    expect(dateRangeMaskParser("01/06/2025 – 15/06/2025")).toEqual({
      from: "2025-06-01",
      to: "2025-06-15",
    });
  });

  it("returns empty strings for an incomplete range", () => {
    expect(dateRangeMaskParser("01/06/2025 – 15/0")).toEqual({
      from: "",
      to: "",
    });
  });

  it("returns empty strings for null/undefined/empty input", () => {
    expect(dateRangeMaskParser(null)).toEqual({ from: "", to: "" });
    expect(dateRangeMaskParser(undefined)).toEqual({ from: "", to: "" });
    expect(dateRangeMaskParser("")).toEqual({ from: "", to: "" });
  });

  it("splits a complete mm/yyyy range when mode is mm/yyyy", () => {
    expect(dateRangeMaskParser("06/2025 – 12/2025", "mm/yyyy")).toEqual({
      from: "2025-06",
      to: "2025-12",
    });
  });

  it("splits a complete yyyy range when mode is yyyy", () => {
    expect(dateRangeMaskParser("2020 – 2025", "yyyy")).toEqual({
      from: "2020",
      to: "2025",
    });
  });

  it("parses a bare from-only segment (dd/mm/yyyy) into from with empty to", () => {
    expect(dateRangeMaskParser("01/06/2025")).toEqual({
      from: "2025-06-01",
      to: "",
    });
  });

  it("parses a bare from-only segment (mm/yyyy) into from with empty to", () => {
    expect(dateRangeMaskParser("06/2025", "mm/yyyy")).toEqual({
      from: "2025-06",
      to: "",
    });
  });

  it("parses a bare from-only segment (yyyy) into from with empty to", () => {
    expect(dateRangeMaskParser("2025", "yyyy")).toEqual({
      from: "2025",
      to: "",
    });
  });
});

// ─── parseIsoDateRangeParts ─────────────────────────────────────────

describe("parseIsoDateRangeParts", () => {
  it("parses both ISO parts into a DateRange", () => {
    const result = parseIsoDateRangeParts({
      from: "2025-06-01",
      to: "2025-06-15",
    });
    expect(result?.from?.getFullYear()).toBe(2025);
    expect(result?.from?.getMonth()).toBe(5);
    expect(result?.from?.getDate()).toBe(1);
    expect(result?.to?.getDate()).toBe(15);
  });

  it("returns undefined when from is empty", () => {
    expect(parseIsoDateRangeParts({ from: "", to: "" })).toBeUndefined();
  });

  it("returns a range with only `from` set when `to` is empty", () => {
    const result = parseIsoDateRangeParts({ from: "2025-06-01", to: "" });
    expect(result?.from?.getDate()).toBe(1);
    expect(result?.to).toBeUndefined();
  });
});

// ─── dateRangeMaskFormatter (Date-pair input) ───────────────────────

describe("dateRangeMaskFormatter with a Date pair", () => {
  it("formats a complete {from, to} pair", () => {
    expect(
      dateRangeMaskFormatter({
        from: new Date(2025, 5, 1),
        to: new Date(2025, 5, 15),
      }),
    ).toBe("01/06/2025 – 15/06/2025");
  });

  it("formats a {from} only pair", () => {
    expect(dateRangeMaskFormatter({ from: new Date(2025, 5, 1) })).toBe("01/06/2025");
  });

  it("formats a {from, to} pair in mm/yyyy mode", () => {
    expect(
      dateRangeMaskFormatter(
        { from: new Date(2025, 5, 1), to: new Date(2025, 11, 1) },
        { mode: "mm/yyyy" },
      ),
    ).toBe("06/2025 – 12/2025");
  });

  it("returns empty string for undefined", () => {
    expect(dateRangeMaskFormatter(undefined)).toBe("");
  });

  it("returns empty string for an empty object", () => {
    expect(dateRangeMaskFormatter({})).toBe("");
  });
});

// ─── createDateRangeMaskOptions (mode-aware placeholder) ────────────

describe("createDateRangeMaskOptions mode-aware placeholder", () => {
  it("returns valid MaskitoOptions for mm/yyyy mode", () => {
    const opts = createDateRangeMaskOptions({ mode: "mm/yyyy" });
    expect(opts.mask).toBeDefined();
    expect(opts.plugins?.length).toBeGreaterThan(0);
  });

  it("returns valid MaskitoOptions for yyyy mode", () => {
    const opts = createDateRangeMaskOptions({ mode: "yyyy" });
    expect(opts.mask).toBeDefined();
    expect(opts.plugins?.length).toBeGreaterThan(0);
  });
});

// ─── formatValue/parseValue round-trip ──────────────────────────────

// Replicates exactly what the range picker variants do:
// formatValue = dateRangeMaskFormatter(range, opts) and
// parseValue = parseIsoDateRangeParts(dateRangeMaskParser(masked, mode)).
// The from-only cases are the important ones: after the first click of a
// new range selection, the formatter emits a bare single segment, and
// a calendar's external-selected sync effect immediately parses it back —
// a partial value that doesn't survive this loop silently loses the
// just-picked `from` (the bug class fixed in 34f7c86).
describe("date-range mask round-trip", () => {
  const CASES = [
    ["dd/mm/yyyy", new Date(2025, 5, 1), new Date(2025, 5, 15)],
    ["mm/yyyy", new Date(2025, 5, 1), new Date(2025, 11, 1)],
    ["yyyy", new Date(2020, 0, 1), new Date(2025, 0, 1)],
  ] as const;

  it.each(CASES)("survives format → parse for a full range in %s mode", (mode, from, to) => {
    const masked = dateRangeMaskFormatter({ from, to }, { mode });
    const parsed = parseIsoDateRangeParts(dateRangeMaskParser(masked, mode));
    expect(parsed).toEqual({ from, to });
  });

  it.each(CASES)("survives format → parse for a from-only draft in %s mode", (mode, from) => {
    const masked = dateRangeMaskFormatter({ from }, { mode });
    const parsed = parseIsoDateRangeParts(dateRangeMaskParser(masked, mode));
    expect(parsed).toEqual({ from, to: undefined });
  });

  it("round-trips an empty range to undefined", () => {
    const masked = dateRangeMaskFormatter(undefined);
    expect(parseIsoDateRangeParts(dateRangeMaskParser(masked))).toBeUndefined();
  });
});
