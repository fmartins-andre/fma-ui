import { describe, expect, it } from "vitest";
import {
  eventsOverlap,
  isBarOccurrence,
  packTimedSegments,
  rangesIntersect,
  segmentOccurrence,
} from "@/blocks/event-calendar/event-calendar-lib";
import {
  expandRecurrence,
  formatRRuleString,
  parseRRuleString,
} from "@/blocks/event-calendar/event-calendar-recurrence";
import type {
  CalendarEvent,
  EventCalendarOccurrence,
} from "@/blocks/event-calendar/event-calendar-types";

const TZ = "UTC";
const at = (iso: string) => new Date(`${iso}Z`);

function occurrence(start: string, end: string, extra: Partial<CalendarEvent> = {}) {
  const event: CalendarEvent = {
    id: extra.id ?? "e",
    title: "E",
    start: at(start),
    end: at(end),
    ...extra,
  };
  return {
    key: `${event.id}::${event.start.toISOString()}`,
    eventId: event.id,
    event,
    start: event.start,
    end: event.end,
    allDay: event.allDay ?? false,
    isRecurring: false,
  } satisfies EventCalendarOccurrence;
}

const MARCH = { start: at("2026-03-01T00:00:00"), end: at("2026-04-01T00:00:00") };

describe("segmentOccurrence", () => {
  it("splits a multi-day event into per-day segments with continuation flags", () => {
    const segments = segmentOccurrence(
      occurrence("2026-03-10T22:00:00", "2026-03-12T02:00:00"),
      MARCH,
      TZ,
    );
    expect(segments.map((s) => s.day.toISOString().slice(0, 10))).toEqual([
      "2026-03-10",
      "2026-03-11",
      "2026-03-12",
    ]);
    expect(segments.map((s) => [s.continuesBefore, s.continuesAfter])).toEqual([
      [false, true],
      [true, true],
      [true, false],
    ]);
    expect([segments[0]?.startMin, segments[0]?.endMin]).toEqual([22 * 60, 24 * 60]);
    expect([segments[2]?.startMin, segments[2]?.endMin]).toEqual([0, 120]);
  });

  it("treats the end as exclusive: ending at midnight emits no segment for the next day", () => {
    const segments = segmentOccurrence(
      occurrence("2026-03-10T20:00:00", "2026-03-11T00:00:00"),
      MARCH,
      TZ,
    );
    expect(segments).toHaveLength(1);
    expect(segments[0]?.isEnd).toBe(true);
  });

  it("keeps zero-length events as one segment", () => {
    expect(
      segmentOccurrence(occurrence("2026-03-10T09:00:00", "2026-03-10T09:00:00"), MARCH, TZ),
    ).toHaveLength(1);
  });

  it("clamps to the range", () => {
    const segments = segmentOccurrence(
      occurrence("2026-02-27T10:00:00", "2026-03-02T10:00:00"),
      MARCH,
      TZ,
    );
    expect(segments.map((s) => s.day.toISOString().slice(0, 10))).toEqual([
      "2026-03-01",
      "2026-03-02",
    ]);
    expect(segments[0]?.continuesBefore).toBe(true);
  });
});

describe("isBarOccurrence", () => {
  it("is true for all-day and multi-day events, false for same-day timed ones", () => {
    expect(
      isBarOccurrence(
        occurrence("2026-03-10T00:00:00", "2026-03-11T00:00:00", { allDay: true }),
        TZ,
      ),
    ).toBe(true);
    expect(isBarOccurrence(occurrence("2026-03-10T09:00:00", "2026-03-11T10:00:00"), TZ)).toBe(
      true,
    );
    expect(isBarOccurrence(occurrence("2026-03-10T09:00:00", "2026-03-10T17:00:00"), TZ)).toBe(
      false,
    );
    // Midnight to midnight is still one day (exclusive end).
    expect(isBarOccurrence(occurrence("2026-03-10T00:00:00", "2026-03-11T00:00:00"), TZ)).toBe(
      false,
    );
  });
});

describe("overlap helpers", () => {
  it("uses half-open ranges", () => {
    const a = { start: at("2026-03-10T09:00:00"), end: at("2026-03-10T10:00:00") };
    const b = { start: at("2026-03-10T10:00:00"), end: at("2026-03-10T11:00:00") };
    const c = { start: at("2026-03-10T09:30:00"), end: at("2026-03-10T10:30:00") };
    expect(eventsOverlap(a, b)).toBe(false);
    expect(eventsOverlap(a, c)).toBe(true);
    expect(rangesIntersect(a, c)).toBe(true);
  });
});

describe("packTimedSegments", () => {
  const day = (start: string, end: string, id: string) =>
    segmentOccurrence(occurrence(start, end, { id }), MARCH, TZ)[0];

  it("puts overlapping events side by side and lets later free columns widen", () => {
    const a = day("2026-03-10T09:00:00", "2026-03-10T11:00:00", "a");
    const b = day("2026-03-10T10:00:00", "2026-03-10T12:00:00", "b");
    const c = day("2026-03-10T11:00:00", "2026-03-10T12:00:00", "c");
    const segments = [a, b, c].filter((s) => s !== undefined);
    packTimedSegments(segments);
    expect(segments.map((s) => [s.column, s.columnCount])).toEqual([
      [0, 2],
      [1, 2],
      [0, 2],
    ]);
  });

  it("keeps separate clusters independent", () => {
    const a = day("2026-03-10T09:00:00", "2026-03-10T10:00:00", "a");
    const b = day("2026-03-10T13:00:00", "2026-03-10T14:00:00", "b");
    const segments = [a, b].filter((s) => s !== undefined);
    packTimedSegments(segments);
    expect(segments.map((s) => [s.column, s.columnCount, s.columnSpan])).toEqual([
      [0, 1, 1],
      [0, 1, 1],
    ]);
  });
});

describe("expandRecurrence", () => {
  const weekly: CalendarEvent = {
    id: "w",
    title: "Sync",
    start: at("2026-03-02T09:00:00"), // a Monday
    end: at("2026-03-02T09:30:00"),
    recurrence: { freq: "weekly", byWeekday: ["MO", "WE"], count: 4 },
  };

  it("expands weekly rules on the given weekdays up to count", () => {
    const days = expandRecurrence(weekly, MARCH, { timeZone: TZ }).map((o) =>
      o.start.toISOString().slice(0, 10),
    );
    expect(days).toEqual(["2026-03-02", "2026-03-04", "2026-03-09", "2026-03-11"]);
  });

  it("skips exDates and stops at an inclusive until", () => {
    const event: CalendarEvent = {
      ...weekly,
      recurrence: {
        freq: "daily",
        until: at("2026-03-05T09:00:00"),
        exDates: [at("2026-03-03T09:00:00")],
      },
    };
    const days = expandRecurrence(event, MARCH, { timeZone: TZ }).map((o) =>
      o.start.toISOString().slice(0, 10),
    );
    expect(days).toEqual(["2026-03-02", "2026-03-04", "2026-03-05"]);
  });

  it("marks occurrences as recurring with stable keys", () => {
    const [first] = expandRecurrence(weekly, MARCH, { timeZone: TZ });
    expect(first?.isRecurring).toBe(true);
    expect(first?.key).toBe("w::2026-03-02T09:00:00.000Z");
  });

  it("accepts a raw RRULE string", () => {
    const event: CalendarEvent = { ...weekly, recurrence: "RRULE:FREQ=DAILY;INTERVAL=2;COUNT=3" };
    const days = expandRecurrence(event, MARCH, { timeZone: TZ }).map((o) =>
      o.start.toISOString().slice(0, 10),
    );
    expect(days).toEqual(["2026-03-02", "2026-03-04", "2026-03-06"]);
  });

  it("round-trips rules through RRULE strings", () => {
    const rule = parseRRuleString("RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR;COUNT=6", TZ);
    expect(rule).toMatchObject({ freq: "weekly", interval: 2, count: 6, byWeekday: ["MO", "FR"] });
    expect(parseRRuleString(formatRRuleString(rule), TZ)).toEqual(rule);
  });
});
