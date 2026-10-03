import { CalendarDate, CalendarDateTime } from "@internationalized/date";
import { describe, expect, it } from "vitest";

import {
  createIsPeriodUnavailable,
  isFullyUnavailable,
  isPeriodGranularity,
  isSamePeriod,
  periodBounds,
  periodEnd,
  periodStart,
} from "@/lib/date-granularity";

const date = (month: number, day: number, year = 2026) => new CalendarDate(year, month, day);

describe("isPeriodGranularity", () => {
  it("is true only for month and year", () => {
    expect(isPeriodGranularity("month")).toBe(true);
    expect(isPeriodGranularity("year")).toBe(true);
    expect(isPeriodGranularity("day")).toBe(false);
    expect(isPeriodGranularity("minute")).toBe(false);
    expect(isPeriodGranularity(undefined)).toBe(false);
  });
});

describe("periodStart / periodEnd", () => {
  it("returns the month's first and last day", () => {
    expect(periodStart(date(2, 14), "month")).toEqual(date(2, 1));
    expect(periodEnd(date(2, 14), "month")).toEqual(date(2, 28));
    expect(periodEnd(date(2, 14, 2028), "month")).toEqual(date(2, 29, 2028));
  });

  it("returns the year's first and last day", () => {
    expect(periodStart(date(7, 9), "year")).toEqual(date(1, 1));
    expect(periodEnd(date(7, 9), "year")).toEqual(date(12, 31));
  });

  it("keeps the value's type", () => {
    const value = new CalendarDateTime(2026, 5, 20, 13, 30);
    expect(periodStart(value, "month")).toEqual(new CalendarDateTime(2026, 5, 1, 13, 30));
  });
});

describe("isSamePeriod", () => {
  it("compares months and years", () => {
    expect(isSamePeriod(date(3, 1), date(3, 31), "month")).toBe(true);
    expect(isSamePeriod(date(3, 31), date(4, 1), "month")).toBe(false);
    expect(isSamePeriod(date(1, 1), date(12, 31), "year")).toBe(true);
    expect(isSamePeriod(date(3, 1, 2026), date(3, 1, 2027), "month")).toBe(false);
  });
});

describe("periodBounds", () => {
  it("leaves day bounds untouched", () => {
    expect(periodBounds("day", date(3, 15), date(10, 5))).toEqual({
      minValue: date(3, 15),
      maxValue: date(10, 5),
    });
  });

  it("widens bounds to whole periods", () => {
    expect(periodBounds("month", date(3, 15), date(10, 5))).toEqual({
      minValue: date(3, 1),
      maxValue: date(10, 31),
    });
    expect(periodBounds("year", date(3, 15), date(10, 5))).toEqual({
      minValue: date(1, 1),
      maxValue: date(12, 31),
    });
  });

  it("passes missing bounds through", () => {
    expect(periodBounds("month", null, undefined)).toEqual({
      minValue: null,
      maxValue: undefined,
    });
  });
});

describe("isFullyUnavailable", () => {
  const blocked =
    (from: CalendarDate, to: CalendarDate) => (value: { compare(o: CalendarDate): number }) =>
      value.compare(from) >= 0 && value.compare(to) <= 0;

  it("is true only when every day in the span is unavailable", () => {
    const isBlocked = blocked(date(3, 1), date(3, 31));
    expect(isFullyUnavailable(date(3, 1), date(3, 31), isBlocked)).toBe(true);
    expect(isFullyUnavailable(date(3, 1), date(4, 1), isBlocked)).toBe(false);
  });
});

describe("createIsPeriodUnavailable", () => {
  const isBlocked = (value: CalendarDate | { compare(o: CalendarDate): number }) =>
    value.compare(date(3, 1)) >= 0 && value.compare(date(3, 31)) <= 0;

  it("returns the day predicate untouched for day granularity", () => {
    expect(createIsPeriodUnavailable("day", isBlocked)).toBe(isBlocked);
    expect(createIsPeriodUnavailable("month", undefined)).toBeUndefined();
  });

  it("blocks a month only when all of its days are blocked", () => {
    const isMonthBlocked = createIsPeriodUnavailable("month", isBlocked);
    expect(isMonthBlocked?.(date(3, 1))).toBe(true);
    expect(isMonthBlocked?.(date(4, 1))).toBe(false);
  });

  it("blocks a year only when all of its days are blocked", () => {
    expect(createIsPeriodUnavailable("year", isBlocked)?.(date(1, 1))).toBe(false);
    expect(createIsPeriodUnavailable("year", () => true)?.(date(1, 1))).toBe(true);
  });
});
