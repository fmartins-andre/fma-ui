import { CalendarDate } from "@internationalized/date";
import { describe, expect, it } from "vitest";

import {
  createIsWithinAnyInterval,
  intervalsOverlap,
  isAnyValueBlocked,
  isValueBlocked,
  isWithinAnyInterval,
  isWithinInterval,
  overlapsAnyInterval,
} from "@/lib/interval-helpers";
import type { Interval } from "@/lib/types";

const d = (day: number) => new CalendarDate(2026, 8, day);
const interval = (from: number, to: number): Interval<CalendarDate> => ({
  from: d(from),
  to: d(to),
});

describe("isWithinInterval", () => {
  it("returns true for a value strictly inside the interval", () => {
    expect(isWithinInterval(d(15), interval(10, 20))).toBe(true);
  });

  it("is inclusive at both edges", () => {
    expect(isWithinInterval(d(10), interval(10, 20))).toBe(true);
    expect(isWithinInterval(d(20), interval(10, 20))).toBe(true);
  });

  it("returns false outside the interval", () => {
    expect(isWithinInterval(d(9), interval(10, 20))).toBe(false);
    expect(isWithinInterval(d(21), interval(10, 20))).toBe(false);
  });

  it("returns false for an inverted (from > to) interval", () => {
    expect(isWithinInterval(d(15), interval(20, 10))).toBe(false);
  });
});

describe("isWithinAnyInterval", () => {
  it("returns false for undefined or empty interval lists", () => {
    expect(isWithinAnyInterval(d(15), undefined)).toBe(false);
    expect(isWithinAnyInterval(d(15), [])).toBe(false);
  });

  it("returns true when any interval in the list contains the value", () => {
    const intervals = [interval(1, 5), interval(10, 20)];
    expect(isWithinAnyInterval(d(15), intervals)).toBe(true);
    expect(isWithinAnyInterval(d(7), intervals)).toBe(false);
  });
});

describe("createIsWithinAnyInterval", () => {
  it("returns undefined for undefined or empty interval lists", () => {
    expect(createIsWithinAnyInterval(undefined)).toBeUndefined();
    expect(createIsWithinAnyInterval([])).toBeUndefined();
  });

  it("returns a predicate testing membership in any interval", () => {
    const predicate = createIsWithinAnyInterval([interval(10, 20)]);
    expect(predicate).toBeDefined();
    expect(predicate?.(d(12))).toBe(true);
    expect(predicate?.(d(25))).toBe(false);
  });
});

describe("intervalsOverlap", () => {
  it("returns true for partial overlap", () => {
    expect(intervalsOverlap(interval(1, 10), interval(5, 15))).toBe(true);
  });

  it("returns true when one interval contains the other", () => {
    expect(intervalsOverlap(interval(1, 30), interval(10, 12))).toBe(true);
    expect(intervalsOverlap(interval(10, 12), interval(1, 30))).toBe(true);
  });

  it("returns true when intervals only touch at an inclusive edge", () => {
    expect(intervalsOverlap(interval(1, 10), interval(10, 15))).toBe(true);
  });

  it("returns false for disjoint intervals", () => {
    expect(intervalsOverlap(interval(1, 9), interval(10, 15))).toBe(false);
  });
});

describe("overlapsAnyInterval", () => {
  it("returns false for undefined or empty interval lists", () => {
    expect(overlapsAnyInterval(interval(1, 5), undefined)).toBe(false);
    expect(overlapsAnyInterval(interval(1, 5), [])).toBe(false);
  });

  it("returns true when the interval overlaps any in the list", () => {
    const intervals = [interval(10, 12), interval(20, 25)];
    expect(overlapsAnyInterval(interval(8, 15), intervals)).toBe(true);
    expect(overlapsAnyInterval(interval(13, 19), intervals)).toBe(false);
  });
});

describe("isValueBlocked", () => {
  it("returns false with no constraints at all", () => {
    expect(isValueBlocked(d(15), {})).toBe(false);
  });

  it("blocks values below min or above max (inclusive bounds allowed)", () => {
    const constraints = { min: d(10), max: d(20) };
    expect(isValueBlocked(d(9), constraints)).toBe(true);
    expect(isValueBlocked(d(10), constraints)).toBe(false);
    expect(isValueBlocked(d(20), constraints)).toBe(false);
    expect(isValueBlocked(d(21), constraints)).toBe(true);
  });

  it("blocks values inside any unavailable interval", () => {
    const constraints = { unavailableRanges: [interval(10, 12)] };
    expect(isValueBlocked(d(11), constraints)).toBe(true);
    expect(isValueBlocked(d(13), constraints)).toBe(false);
  });
});

describe("isAnyValueBlocked", () => {
  it("returns false for undefined or empty value lists", () => {
    expect(isAnyValueBlocked(undefined, { min: d(10) })).toBe(false);
    expect(isAnyValueBlocked([], { min: d(10) })).toBe(false);
  });

  it("returns true when at least one value is blocked", () => {
    const constraints = { unavailableRanges: [interval(10, 12)] };
    expect(isAnyValueBlocked([d(5), d(11)], constraints)).toBe(true);
    expect(isAnyValueBlocked([d(5), d(15)], constraints)).toBe(false);
  });
});
