import { describe, expect, it } from "vitest";
import { getViewDateRange, stepDate } from "@/blocks/event-calendar/event-calendar-lib";

const TZ = "America/Sao_Paulo";

describe("event-calendar-lib getViewDateRange", () => {
  it("month view's visible range starts on the configured weekStartsOn", () => {
    const anchor = new Date(Date.UTC(2026, 3, 15)); // April 2026
    const { visibleRange } = getViewDateRange("month", anchor, {
      timeZone: TZ,
      weekStartsOn: 1,
      dayCount: 5,
      agendaDayCount: 3,
      fixedWeeks: true,
    });
    expect(visibleRange.start.getDay()).toBe(1); // Monday
  });

  it("stepDate month navigation from the 31st lands back on the 31st when possible", () => {
    const jan31 = new Date(Date.UTC(2026, 0, 31, 12));
    const next = stepDate("month", jan31, 1, {
      timeZone: "UTC",
      dayCount: 5,
      agendaDayCount: 3,
    });
    const back = stepDate("month", next, -1, {
      timeZone: "UTC",
      dayCount: 5,
      agendaDayCount: 3,
    });
    expect(back.getUTCDate()).toBe(31);
  });
});
