import { CalendarDate } from "@internationalized/date";
import { describe, expect, it } from "vitest";

import {
  findNearestAvailableDate,
  travelDatesToAvailable,
  travelRangeToAvailable,
} from "@/lib/date-availability";
import type { Interval } from "@/lib/types";

const d = (day: number) => new CalendarDate(2026, 8, day);
const interval = (from: number, to: number): Interval<CalendarDate> => ({
  from: d(from),
  to: d(to),
});
const iso = (date: { toString(): string } | undefined) => date?.toString();

describe("findNearestAvailableDate", () => {
  it("returns the same date unchanged when it isn't blocked", () => {
    const date = d(15);
    expect(findNearestAvailableDate(date, { min: d(1) })).toBe(date);
  });

  it("travels up to min when the date is below it", () => {
    expect(iso(findNearestAvailableDate(d(5), { min: d(10) }))).toBe("2026-08-10");
  });

  it("travels down to max when the date is above it", () => {
    expect(iso(findNearestAvailableDate(d(25), { max: d(20) }))).toBe("2026-08-20");
  });

  it("travels to the nearest edge outside an unavailable interval", () => {
    const constraints = { unavailableRanges: [interval(10, 20)] };
    expect(iso(findNearestAvailableDate(d(12), constraints))).toBe("2026-08-09");
    expect(iso(findNearestAvailableDate(d(18), constraints))).toBe("2026-08-21");
  });

  it("prefers the later candidate on a distance tie", () => {
    // Day 15 is equidistant (5 days) from both edges of [10, 20].
    expect(
      iso(
        findNearestAvailableDate(d(15), {
          unavailableRanges: [interval(10, 20)],
        }),
      ),
    ).toBe("2026-08-21");
  });

  it("skips edges that land inside another unavailable interval", () => {
    // [10-13] and [14-20] chain: escaping [10-13] downward is day 9,
    // upward must clear both intervals (day 21).
    const constraints = {
      unavailableRanges: [interval(10, 13), interval(14, 20)],
    };
    expect(iso(findNearestAvailableDate(d(13), constraints))).toBe("2026-08-09");
  });

  it("skips edges that fall outside min/max", () => {
    // Escaping [10-20] downward would land on day 9 < min, so the only
    // way out is upward.
    const constraints = {
      min: d(10),
      unavailableRanges: [interval(10, 20)],
    };
    expect(iso(findNearestAvailableDate(d(11), constraints))).toBe("2026-08-21");
  });

  it("returns undefined when every date in [min, max] is unavailable", () => {
    expect(
      findNearestAvailableDate(d(15), {
        min: d(15),
        max: d(15),
        unavailableRanges: [interval(15, 15)],
      }),
    ).toBeUndefined();
  });
});

describe("travelDatesToAvailable", () => {
  it("returns the input array by identity when nothing is blocked", () => {
    const values = [d(5), d(25)];
    expect(travelDatesToAvailable(values, { unavailableRanges: [interval(10, 20)] })).toBe(values);
  });

  it("corrects only the blocked entries", () => {
    const result = travelDatesToAvailable([d(5), d(12)], {
      unavailableRanges: [interval(10, 20)],
    });
    expect(result?.map(iso)).toEqual(["2026-08-05", "2026-08-09"]);
  });

  it("returns undefined when any entry has no available date to travel to", () => {
    expect(
      travelDatesToAvailable([d(15)], {
        min: d(15),
        max: d(15),
        unavailableRanges: [interval(15, 15)],
      }),
    ).toBeUndefined();
  });
});

describe("travelRangeToAvailable", () => {
  it("returns the input array by identity when the whole span is available", () => {
    const values = [d(2), d(8)];
    expect(travelRangeToAvailable(values, { unavailableRanges: [interval(10, 20)] })).toBe(values);
  });

  it("shrinks a span whose endpoints are free but that crosses an unavailable interval", () => {
    // Old per-endpoint logic would leave [8, 15] untouched even though it
    // spans the blocked [10-12].
    const result = travelRangeToAvailable([d(8), d(15)], {
      unavailableRanges: [interval(10, 12)],
    });
    expect(result?.map(iso)).toEqual(["2026-08-08", "2026-08-09"]);
  });

  it("never produces a span containing the interval that blocked it", () => {
    // Old per-endpoint logic corrected [12, 24] inside [5-30] to [4, 31] —
    // a span covering every blocked day. The range policy anchors on the
    // start's nearest available date and keeps the end in the same
    // contiguous available window.
    const result = travelRangeToAvailable([d(12), d(24)], {
      unavailableRanges: [interval(5, 30)],
    });
    expect(result?.map(iso)).toEqual(["2026-08-04", "2026-08-04"]);
  });

  it("collapses to a single-day range when the start travels past the end", () => {
    const result = travelRangeToAvailable([d(10), d(12)], {
      min: d(12),
    });
    expect(result?.map(iso)).toEqual(["2026-08-12", "2026-08-12"]);
  });

  it("keeps the end when it already sits inside the start's available window", () => {
    const result = travelRangeToAvailable([d(10), d(25)], {
      unavailableRanges: [interval(9, 11)],
    });
    expect(result?.map(iso)).toEqual(["2026-08-12", "2026-08-25"]);
  });

  it("falls back to per-date travel for a partial (single-entry) range", () => {
    const result = travelRangeToAvailable([d(12)], {
      unavailableRanges: [interval(10, 20)],
    });
    expect(result?.map(iso)).toEqual(["2026-08-09"]);
  });

  it("returns undefined when no date is available at all", () => {
    expect(
      travelRangeToAvailable([d(15), d(16)], {
        min: d(15),
        max: d(16),
        unavailableRanges: [interval(15, 16)],
      }),
    ).toBeUndefined();
  });
});
