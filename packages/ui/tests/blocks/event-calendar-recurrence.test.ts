import { describe, expect, it } from "vitest";
import { expandRecurrence } from "@/blocks/event-calendar/event-calendar-recurrence";
import type { CalendarEvent } from "@/blocks/event-calendar/event-calendar-types";

// America/Sao_Paulo has observed no DST since 2019 - it cannot exercise a
// wall-clock transition. America/New_York still does; its 2026 fall-back
// (clocks retreat 1h) lands on 2026-11-01, which this test straddles.
const TZ = "America/New_York";

function range(startIso: string, endIso: string) {
  return { start: new Date(startIso), end: new Date(endIso) };
}

/** Wall-clock hour (0-23) of `date` as rendered in `timeZone`. */
function hourIn(date: Date, timeZone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(date),
  );
}

describe("expandRecurrence", () => {
  it("FREQ=DAILY holds the same wall-clock hour across a real DST transition", () => {
    // 2026-10-30T09:00 America/New_York (still EDT, UTC-4) = 13:00 UTC.
    // +1/+2/+3/+4 days lands on Oct 31 (EDT), Nov 1 (the fall-back day -
    // clocks retreat from EDT to EST at 02:00 local), Nov 2, Nov 3 (EST).
    const event: CalendarEvent = {
      id: "e1",
      title: "Daily standup",
      start: new Date("2026-10-30T13:00:00Z"),
      end: new Date("2026-10-30T13:30:00Z"),
      recurrence: { freq: "daily", count: 5 },
    };
    const occurrences = expandRecurrence(
      event,
      range("2026-10-29T00:00:00Z", "2026-12-01T00:00:00Z"),
      { timeZone: TZ },
    );
    expect(occurrences).toHaveLength(5);
    // Wall-clock hour stays 09:00 in the display zone on every occurrence -
    // the whole point of zoned (not millisecond-fixed) daily recurrence.
    for (const occ of occurrences) {
      expect(hourIn(occ.start, TZ)).toBe(9);
    }
    // Elapsed *real* time differs depending on whether the gap crosses the
    // fall-back: Oct 30->31 and Nov 1->2->3 are ordinary 24h EDT/EST days,
    // but Oct 31->Nov 1 spans the transition itself, so that local calendar
    // day is 25 real hours long - a naive fixed-86400000-ms recurrence
    // would land on the wrong wall-clock hour there.
    const gaps = occurrences
      .slice(1)
      .map((occ, i) => occ.start.getTime() - occurrences[i].start.getTime());
    expect(gaps).toEqual([86400000, 90000000, 86400000, 86400000]);
  });

  it("FREQ=MONTHLY;BYMONTHDAY=31 skips months shorter than 31 days", () => {
    const event: CalendarEvent = {
      id: "e2",
      title: "End of month",
      start: new Date("2026-01-31T10:00:00Z"),
      end: new Date("2026-01-31T11:00:00Z"),
      recurrence: { freq: "monthly", byMonthDay: [31], count: 4 },
    };
    const occurrences = expandRecurrence(
      event,
      range("2026-01-01T00:00:00Z", "2026-12-31T00:00:00Z"),
      { timeZone: "UTC" },
    );
    // Jan 31, Mar 31, May 31, Jul 31 - Feb/Apr/Jun have no 31st
    expect(occurrences.map((o) => o.start.getUTCMonth())).toEqual([0, 2, 4, 6]);
  });

  it("FREQ=YEARLY;BYMONTH=11;BYDAY=4TH finds the 4th Thursday of November (US Thanksgiving)", () => {
    const event: CalendarEvent = {
      id: "e3",
      title: "Thanksgiving",
      start: new Date("2026-01-01T18:00:00Z"),
      end: new Date("2026-01-01T19:00:00Z"),
      recurrence: {
        freq: "yearly",
        byMonth: [11],
        byWeekday: [{ day: "TH", ordinal: 4 }],
        count: 1,
      },
    };
    const occurrences = expandRecurrence(
      event,
      range("2026-01-01T00:00:00Z", "2027-01-01T00:00:00Z"),
      { timeZone: "UTC" },
    );
    expect(occurrences).toHaveLength(1);
    expect(occurrences[0].start.getUTCMonth()).toBe(10); // November (0-indexed)
    expect(occurrences[0].start.getUTCDate()).toBe(26); // 2026-11-26 is the 4th Thursday
  });
});
