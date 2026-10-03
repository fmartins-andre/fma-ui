/**
 * Parity tests against the real `date-fns` / `@date-fns/tz` packages
 * (devDependencies — never shipped, never imported outside this file). These
 * exist solely to keep `lib/date-fns-compat` honest against upstream
 * behavior as date-fns itself evolves; the rest of the test suite
 * (`date-fns-compat.test.ts`) asserts against hand-computed expectations so
 * it stays meaningful even if this file is ever removed.
 */

import { TZDate as RealTZDate } from "@date-fns/tz";
import {
  addDays as dfAddDays,
  addMonths as dfAddMonths,
  addWeeks as dfAddWeeks,
  differenceInCalendarDays as dfDifferenceInCalendarDays,
  format as dfFormat,
  getWeek as dfGetWeek,
  isSameMonth as dfIsSameMonth,
  startOfMonth as dfStartOfMonth,
  startOfWeek as dfStartOfWeek,
  subMilliseconds as dfSubMilliseconds,
} from "date-fns";
import { beforeAll, describe, expect, it } from "vitest";

import * as adapter from "@/lib/date-fns-compat";

beforeAll(() => {
  adapter.setDefaultTimeZone("America/Sao_Paulo");
  adapter.setDefaultLocale("en-US");
});

const TZ = "America/Sao_Paulo";

describe("parity: plain Date arithmetic/formatting", () => {
  const ref = new Date("2026-01-15T10:30:00-03:00");

  // Plain `date-fns` has no time zone concept of its own — every one of its
  // functions reads/writes wall-clock fields in the *process's* local zone.
  // Comparing it directly against our TZ-explicit adapter would only agree
  // when the test runner's system zone happens to match `TZ`, which isn't
  // guaranteed (CI runs in UTC). The correct, environment-independent
  // comparison is real `date-fns` + a real `@date-fns/tz` `TZDate` (the
  // actual pair this compat layer replaces) against our adapter functions
  // taking the same instant with an explicit `{ timeZone: TZ }` option.
  const refInTz = new RealTZDate(ref.getTime(), TZ);

  it("addDays matches real date-fns+TZDate", () => {
    expect(adapter.addDays(ref, 10, { timeZone: TZ }).getTime()).toBe(
      dfAddDays(refInTz, 10).getTime(),
    );
  });

  it("addMonths clamping matches real date-fns+TZDate (Jan 31 + 1mo)", () => {
    const jan31 = new Date("2026-01-31T12:00:00-03:00");
    const jan31InTz = new RealTZDate(jan31.getTime(), TZ);
    expect(adapter.addMonths(jan31, 1, { timeZone: TZ }).getTime()).toBe(
      dfAddMonths(jan31InTz, 1).getTime(),
    );
  });

  it("addWeeks matches real date-fns+TZDate", () => {
    expect(adapter.addWeeks(ref, 3, { timeZone: TZ }).getTime()).toBe(
      dfAddWeeks(refInTz, 3).getTime(),
    );
  });

  it("startOfWeek(weekStartsOn: 1) matches real date-fns+TZDate", () => {
    expect(adapter.startOfWeek(ref, { weekStartsOn: 1, timeZone: TZ }).getTime()).toBe(
      dfStartOfWeek(refInTz, { weekStartsOn: 1 }).getTime(),
    );
  });

  it("startOfMonth matches real date-fns+TZDate", () => {
    expect(adapter.startOfMonth(ref, { timeZone: TZ }).getTime()).toBe(
      dfStartOfMonth(refInTz).getTime(),
    );
  });

  it("differenceInCalendarDays matches real date-fns+TZDate", () => {
    const later = adapter.addDays(ref, 47, { timeZone: TZ });
    const laterInTz = new RealTZDate(later.getTime(), TZ);
    expect(adapter.differenceInCalendarDays(later, ref, { timeZone: TZ })).toBe(
      dfDifferenceInCalendarDays(laterInTz, refInTz),
    );
  });

  it("isSameMonth matches real date-fns+TZDate", () => {
    const other = new Date("2026-01-30T00:00:00-03:00");
    const otherInTz = new RealTZDate(other.getTime(), TZ);
    expect(adapter.isSameMonth(ref, other, { timeZone: TZ })).toBe(
      dfIsSameMonth(refInTz, otherInTz),
    );
  });

  it("format token output matches real date-fns+TZDate for common tokens", () => {
    for (const pattern of ["yyyy-MM-dd", "dd/MM/yyyy HH:mm", "EEEE, MMMM d, yyyy", "h:mm a"]) {
      expect(adapter.format(ref, pattern, { timeZone: TZ })).toBe(dfFormat(refInTz, pattern));
    }
  });

  it("getWeek is at least directionally consistent with real date-fns+TZDate for a mid-year date", () => {
    // Not asserted equal: the adapter's getWeek is a documented
    // simplification (no firstWeekContainsDate handling) — but for a date
    // safely inside the year (not near a year boundary) both should agree.
    const midYear = new Date("2026-06-15T00:00:00-03:00");
    const midYearInTz = new RealTZDate(midYear.getTime(), TZ);
    expect(adapter.getWeek(midYear, { weekStartsOn: 0, timeZone: TZ })).toBe(
      dfGetWeek(midYearInTz, { weekStartsOn: 0 }),
    );
  });

  it("subMilliseconds matches real date-fns+TZDate", () => {
    expect(adapter.subMilliseconds(ref, 1, { timeZone: TZ }).getTime()).toBe(
      dfSubMilliseconds(refInTz, 1).getTime(),
    );
  });
});

describe("parity: TZDate vs @date-fns/tz's real TZDate", () => {
  it("epoch-ms constructor exposes the same zoned wall-clock fields", () => {
    const epochMs = Date.UTC(2026, 5, 15, 14, 30);
    const real = new RealTZDate(epochMs, TZ);
    const ours = new adapter.TZDate(epochMs, TZ);
    expect(ours.getFullYear()).toBe(real.getFullYear());
    expect(ours.getMonth()).toBe(real.getMonth());
    expect(ours.getDate()).toBe(real.getDate());
    expect(ours.getHours()).toBe(real.getHours());
    expect(ours.getMinutes()).toBe(real.getMinutes());
    expect(ours.getDay()).toBe(real.getDay());
  });

  it("wall-clock constructor (year, month, day, ..., timeZone) matches real TZDate's instant", () => {
    const real = new RealTZDate(2026, 5, 15, 14, 30, 0, TZ);
    const ours = new adapter.TZDate(2026, 5, 15, 14, 30, 0, TZ);
    expect(ours.getTime()).toBe(real.getTime());
  });

  it("addDays on a real TZDate vs our TZDate produce the same resulting instant", () => {
    const real = new RealTZDate(2026, 2, 9, 23, 30, 0, "America/New_York");
    const ours = new adapter.TZDate(2026, 2, 9, 23, 30, 0, "America/New_York");
    expect(dfAddDays(ours, 1).getTime()).toBe(adapter.addDays(ours, 1).getTime());
    expect(adapter.addDays(ours, 1).getTime()).toBe(dfAddDays(real, 1).getTime());
  });

  it("setDate(0) overflows to the last day of the previous month, like native Date", () => {
    const ours = new adapter.TZDate(2026, 2, 15, 12, 0, 0, TZ); // March 15
    const real = new RealTZDate(2026, 2, 15, 12, 0, 0, TZ);
    ours.setDate(0);
    real.setDate(0);
    expect(ours.getTime()).toBe(real.getTime());
    expect(ours.getMonth()).toBe(1); // February
    expect(ours.getDate()).toBe(28); // 2026 is not a leap year
  });

  it("setMonth(m, 0) overflow (date-fns' own addMonths trick) matches real TZDate", () => {
    const ours = new adapter.TZDate(2026, 0, 31, 12, 0, 0, TZ); // Jan 31
    const real = new RealTZDate(2026, 0, 31, 12, 0, 0, TZ);
    // date-fns' addMonths.js: endOfDesiredMonth.setMonth(targetMonth + 1, 0)
    ours.setMonth(1 + 1, 0);
    real.setMonth(1 + 1, 0);
    expect(ours.getTime()).toBe(real.getTime());
  });

  it("setHours(25) overflows into the next day, like native Date", () => {
    const ours = new adapter.TZDate(2026, 0, 1, 10, 0, 0, TZ);
    const real = new RealTZDate(2026, 0, 1, 10, 0, 0, TZ);
    ours.setHours(25);
    real.setHours(25);
    expect(ours.getTime()).toBe(real.getTime());
    expect(ours.getDate()).toBe(2);
    expect(ours.getHours()).toBe(1);
  });

  it("addMonths clamping (Jan 31 + 1mo) matches real date-fns+TZDate exactly (the bug this suite caught)", () => {
    const ours = new adapter.TZDate(2026, 0, 31, 12, 0, 0, TZ);
    const real = new RealTZDate(2026, 0, 31, 12, 0, 0, TZ);
    expect(dfAddMonths(real, 1).getTime()).toBe(dfAddMonths(ours, 1).getTime());
    expect(dfAddMonths(ours, 1).getTime()).toBe(adapter.addMonths(ours, 1).getTime());
  });

  it("chained calls stay TZDate-typed with no cast needed (generic T extends Date)", () => {
    const start = new adapter.TZDate(2026, 0, 15, 0, 0, 0, TZ);
    // No `as TZDate` anywhere here - if this compiles, the generics work.
    const chained: InstanceType<typeof adapter.TZDate> = adapter.addDays(
      adapter.startOfWeek(start, { weekStartsOn: 1 }),
      1,
    );
    expect(chained).toBeInstanceOf(adapter.TZDate);
    expect(chained.timeZone).toBe(TZ);
  });

  it("min/max return the original TZDate reference (matches real date-fns's own min/max)", () => {
    const earlier = new adapter.TZDate(2026, 0, 1, 0, 0, 0, TZ);
    const later = new adapter.TZDate(2026, 5, 1, 0, 0, 0, TZ);
    expect(adapter.min([later, earlier])).toBe(earlier);
    expect(adapter.max([later, earlier])).toBe(later);
  });

  it("getTimezoneOffset matches real TZDate's (own zone, not the process's)", () => {
    const ours = new adapter.TZDate(2026, 5, 15, 12, 0, 0, TZ);
    const real = new RealTZDate(2026, 5, 15, 12, 0, 0, TZ);
    expect(ours.getTimezoneOffset()).toBe(real.getTimezoneOffset());
  });

  it("toISOString includes the instance's own offset (not Z), matching real TZDate", () => {
    const ours = new adapter.TZDate(2026, 5, 15, 12, 0, 0, TZ);
    const real = new RealTZDate(2026, 5, 15, 12, 0, 0, TZ);
    expect(ours.toISOString()).toBe(real.toISOString());
  });

  it("toLocaleString/toLocaleDateString/toLocaleTimeString render in the instance's own zone, matching real TZDate", () => {
    const ours = new adapter.TZDate(2026, 5, 15, 23, 30, 0, "America/New_York");
    const real = new RealTZDate(2026, 5, 15, 23, 30, 0, "America/New_York");
    const opts: Intl.DateTimeFormatOptions = {
      dateStyle: "medium",
      timeStyle: "medium",
    };
    expect(ours.toLocaleString("en-US", opts)).toBe(real.toLocaleString("en-US", opts));
    expect(ours.toLocaleDateString("en-US")).toBe(real.toLocaleDateString("en-US"));
    expect(ours.toLocaleTimeString("en-US")).toBe(real.toLocaleTimeString("en-US"));
  });

  it("real date-fns functions preserve our TZDate via the constructDateFrom symbol", () => {
    // Real date-fns's constructFrom() looks for Symbol.for("constructDateFrom")
    // on the reference date before falling back to `new date.constructor(value)`
    // (which would break here, since our constructor's last argument must be
    // a timeZone string). Our TZDate implements that symbol, so real
    // date-fns's addMonths correctly reconstructs another TZDate in the same
    // zone — not just an instant that happens to match.
    const ours = new adapter.TZDate(2026, 0, 31, 12, 0, 0, TZ);
    const result = dfAddMonths(ours, 1);
    expect(result).toBeInstanceOf(adapter.TZDate);
    expect(result.timeZone).toBe(TZ);
    expect(result.getTime()).toBe(adapter.addMonths(ours, 1).getTime());
  });
});
