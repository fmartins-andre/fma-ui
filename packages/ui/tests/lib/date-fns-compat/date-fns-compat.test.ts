import { beforeAll, describe, expect, it } from "vitest";

import * as adapter from "@/lib/date-fns-compat";

// No dependency on the real date-fns package here (this repo doesn't install
// it) — expectations below are hand-computed against date-fns' documented
// semantics instead of asserted by running date-fns itself.
beforeAll(() => {
  adapter.setDefaultTimeZone("America/Sao_Paulo");
  adapter.setDefaultLocale("en-US");
});

const REF = new Date("2024-01-15T10:30:00-03:00"); // a Monday

describe("arithmetic", () => {
  it("addDays adds calendar days", () => {
    expect(adapter.addDays(REF, 10)).toEqual(new Date("2024-01-25T10:30:00-03:00"));
  });
  it("addMonths clamps to the shorter month's last day", () => {
    const jan31 = new Date("2024-01-31T12:00:00-03:00");
    // 2024 is a leap year, so Jan 31 + 1 month clamps to Feb 29.
    expect(adapter.addMonths(jan31, 1)).toEqual(new Date("2024-02-29T12:00:00-03:00"));
  });
  it("subWeeks subtracts whole weeks", () => {
    expect(adapter.subWeeks(REF, 2)).toEqual(new Date("2024-01-01T10:30:00-03:00"));
  });
  it("addYears adds calendar years", () => {
    expect(adapter.addYears(REF, 3)).toEqual(new Date("2027-01-15T10:30:00-03:00"));
  });
});

describe("comparison", () => {
  it("isBefore / isAfter / isEqual", () => {
    const later = adapter.addDays(REF, 1);
    expect(adapter.isBefore(REF, later)).toBe(true);
    expect(adapter.isAfter(later, REF)).toBe(true);
    expect(adapter.isEqual(REF, REF)).toBe(true);
  });
  it("isSameDay across a DST-free boundary", () => {
    const almostMidnight = new Date("2024-01-15T23:59:59-03:00");
    const justAfterMidnight = new Date("2024-01-16T00:00:01-03:00");
    expect(
      adapter.isSameDay(almostMidnight, justAfterMidnight, {
        timeZone: "America/Sao_Paulo",
      }),
    ).toBe(false);
  });
  it("compareAsc sign matches ordering", () => {
    expect(Math.sign(adapter.compareAsc(REF, adapter.addDays(REF, 1)))).toBe(-1);
  });
});

describe("boundaries", () => {
  it("startOfMonth / endOfMonth", () => {
    expect(adapter.startOfMonth(REF, { timeZone: "America/Sao_Paulo" })).toEqual(
      new Date("2024-01-01T00:00:00-03:00"),
    );
    expect(adapter.endOfMonth(REF, { timeZone: "America/Sao_Paulo" })).toEqual(
      new Date("2024-01-31T23:59:59.999-03:00"),
    );
  });
  it("startOfWeek with weekStartsOn: 1 (Monday)", () => {
    // REF (2024-01-15) is itself a Monday, so the week start is unchanged.
    expect(
      adapter.startOfWeek(REF, {
        timeZone: "America/Sao_Paulo",
        weekStartsOn: 1,
      }),
    ).toEqual(new Date("2024-01-15T00:00:00-03:00"));
  });
});

describe("DST correctness (a case plain millisecond math cannot get right)", () => {
  it("addDays across a US spring-forward transition lands on the correct wall-clock hour", () => {
    // 2024-03-09 23:30 America/New_York, +1 day crosses the 2024-03-10 02:00 -> 03:00 DST jump.
    const beforeDst = adapter.parseISO("2024-03-09T23:30:00", {
      timeZone: "America/New_York",
    });
    const result = adapter.addDays(beforeDst, 1, {
      timeZone: "America/New_York",
    });
    const formatted = adapter.format(result, "yyyy-MM-dd HH:mm", {
      timeZone: "America/New_York",
    });
    // The adapter lets @internationalized/date resolve the wall-clock day in
    // the *requested* IANA zone, so the hour stays 23:30 across the jump —
    // plain millisecond math pinned to a different process time zone would drift.
    expect(formatted).toBe("2024-03-10 23:30");
  });
});

describe("difference", () => {
  it("differenceInCalendarDays counts calendar days crossed", () => {
    const later = adapter.addDays(REF, 40);
    expect(
      adapter.differenceInCalendarDays(later, REF, {
        timeZone: "America/Sao_Paulo",
      }),
    ).toBe(40);
  });
  it("differenceInMonths only counts a fully elapsed month", () => {
    const later = new Date("2024-03-01T00:00:00-03:00");
    const earlier = new Date("2024-01-15T00:00:00-03:00");
    // Jan 15 -> Mar 1 is short of a full second month (Mar 1 < Mar 15).
    expect(
      adapter.differenceInMonths(later, earlier, {
        timeZone: "America/Sao_Paulo",
      }),
    ).toBe(1);
  });
});

describe("format", () => {
  it("format yyyy-MM-dd", () => {
    expect(adapter.format(REF, "yyyy-MM-dd", { timeZone: "America/Sao_Paulo" })).toBe("2024-01-15");
  });
  it("format dd/MM/yyyy HH:mm", () => {
    expect(
      adapter.format(REF, "dd/MM/yyyy HH:mm", {
        timeZone: "America/Sao_Paulo",
      }),
    ).toBe("15/01/2024 10:30");
  });
  it("format with literal text", () => {
    expect(
      adapter.format(REF, "'Week of' MMMM do, yyyy", {
        timeZone: "America/Sao_Paulo",
      }),
    ).toBe("Week of January 15th, 2024");
  });
  it("throws on an unsupported token", () => {
    expect(() => adapter.format(REF, "QQQ", { timeZone: "America/Sao_Paulo" })).toThrow(RangeError);
  });
});

describe("TZDate", () => {
  it("constructor mirrors Date's overloads with timeZone appended (wall-clock components)", () => {
    const d = new adapter.TZDate(2024, 5, 15, 14, 30, 0, "America/Sao_Paulo");
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(14);
    expect(d.getMinutes()).toBe(30);
  });

  it("constructor mirrors Date's epoch-ms overload with timeZone appended", () => {
    const epochMs = Date.UTC(2024, 0, 1, 12);
    const d = new adapter.TZDate(epochMs, "UTC");
    expect(d.getTime()).toBe(epochMs);
    expect(d.getFullYear()).toBe(2024);
  });

  it("getDay matches native Date's fixed Sunday=0 convention", () => {
    // 2026-01-04 is a Sunday
    const d = new adapter.TZDate(Date.UTC(2026, 0, 4), "UTC");
    expect(d.getDay()).toBe(0);
  });

  it("addDays/startOfWeek on a TZDate return a TZDate in the same zone (constructFrom)", () => {
    const d = new adapter.TZDate(Date.UTC(2026, 0, 15), "America/Sao_Paulo");
    const next = adapter.addDays(d, 1);
    expect(next).toBeInstanceOf(adapter.TZDate);
    expect(next.timeZone).toBe("America/Sao_Paulo");
    const weekStart = adapter.startOfWeek(d, { weekStartsOn: 1 });
    expect(weekStart).toBeInstanceOf(adapter.TZDate);
  });

  it("getTimezoneOffset reflects the TZDate's own zone, not the process's", () => {
    const d = new adapter.TZDate(2026, 5, 15, 12, 0, 0, "America/Sao_Paulo");
    expect(d.getTimezoneOffset()).toBe(180); // UTC-3 => +180 minutes
  });

  it("toISOString ends in the instance's own offset, not Z", () => {
    const d = new adapter.TZDate(2026, 5, 15, 12, 0, 0, "America/Sao_Paulo");
    expect(d.toISOString()).toBe("2026-06-15T12:00:00.000-03:00");
  });

  it("toDateString/toString are zoned and locale-invariant", () => {
    const d = new adapter.TZDate(2026, 5, 15, 12, 0, 0, "UTC");
    expect(d.toDateString()).toBe("Mon Jun 15 2026");
    expect(d.toString()).toContain("Mon Jun 15 2026");
  });

  it("arithmetic on a TZDate needs no explicit timeZone option (uses the value's own zone)", () => {
    // 2026-03-09 23:30 America/New_York wall clock (wall-clock constructor
    // overload: year, month, day, hours, minutes, seconds, timeZone).
    const d = new adapter.TZDate(2026, 2, 9, 23, 30, 0, "America/New_York");
    // no options arg at all - must resolve tz from the TZDate itself. +1 day
    // crosses the 2026-03-08 US spring-forward transition's aftermath.
    const next = adapter.addDays(d, 1);
    expect(adapter.format(next, "yyyy-MM-dd HH:mm", { locale: "en-US" })).toBe("2026-03-10 23:30");
  });

  it("plain Date input keeps returning a plain Date (no accidental TZDate leakage)", () => {
    const result = adapter.addDays(REF, 1);
    expect(result).not.toBeInstanceOf(adapter.TZDate);
  });
});

describe("getWeek", () => {
  it("returns 1 for a date in the first tracked week of the year", () => {
    const jan1 = new Date(Date.UTC(2026, 0, 1));
    expect(adapter.getWeek(jan1, { weekStartsOn: 0, timeZone: "UTC" })).toBe(1);
  });
});

describe("format PPPP (long localized date)", () => {
  it("supports the date-fns P-token family via Intl dateStyle", () => {
    const d = new Date("2026-04-20T14:05:00Z");
    expect(adapter.format(d, "PPPP", { locale: "en-US", timeZone: "UTC" })).toContain("2026");
  });
});

describe("parseISO / formatISO", () => {
  it("parseISO for a date-only string in an explicit time zone", () => {
    expect(adapter.parseISO("2024-06-01", { timeZone: "America/Sao_Paulo" })).toEqual(
      new Date("2024-06-01T00:00:00-03:00"),
    );
  });
  it("parseISO for a date+time string with an explicit offset", () => {
    const str = "2024-06-01T10:00:00-03:00";
    expect(adapter.parseISO(str)).toEqual(new Date(str));
  });
  it("formatISO round-trips through parseISO", () => {
    const iso = adapter.formatISO(REF, { timeZone: "America/Sao_Paulo" });
    expect(adapter.parseISO(iso)).toEqual(REF);
  });
  it("parseISO returns an Invalid Date for garbage input", () => {
    expect(adapter.isValid(adapter.parseISO("not-a-date"))).toBe(false);
  });
});
