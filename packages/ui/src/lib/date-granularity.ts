/**
 * Period helpers for date components that select whole months or years
 * (`granularity="month" | "year"`) instead of days: period boundaries,
 * same-period comparison, period-level min/max and unavailability. Shared by
 * calendar, date-field and date-picker so every one of them agrees on what a
 * "month" value is (its first day) and when a period counts as blocked.
 */

import {
  type CalendarDate,
  type DateValue,
  endOfMonth,
  endOfYear,
  isSameMonth,
  isSameYear,
  startOfMonth,
  startOfYear,
  toCalendarDate,
} from "@internationalized/date";

/** What a date selection represents: a day, or a whole month/year. */
export type DateGranularity = "day" | "month" | "year";

/** The granularities that pick a whole period. */
export type PeriodGranularity = Exclude<DateGranularity, "day">;

/** Whether the granularity picks a whole month/year rather than a day. */
export function isPeriodGranularity(
  granularity: string | undefined,
): granularity is PeriodGranularity {
  return granularity === "month" || granularity === "year";
}

/** First day of the month/year containing `date`. */
export function periodStart<D extends DateValue>(date: D, period: PeriodGranularity): D {
  return (period === "month" ? startOfMonth(date) : startOfYear(date)) as D;
}

/** Last day of the month/year containing `date`. */
export function periodEnd<D extends DateValue>(date: D, period: PeriodGranularity): D {
  return (period === "month" ? endOfMonth(date) : endOfYear(date)) as D;
}

/** Whether both dates fall in the same month/year (across calendar systems). */
export function isSamePeriod(a: DateValue, b: DateValue, period: PeriodGranularity): boolean {
  return period === "month" ? isSameMonth(a, b) : isSameYear(a, b);
}

/**
 * Widens `minValue`/`maxValue` to whole periods: with month granularity a
 * `minValue` of 2026-03-15 must still allow March, whose value is
 * 2026-03-01. Day granularity returns the bounds untouched.
 */
export function periodBounds<D extends DateValue>(
  granularity: DateGranularity,
  minValue: D | null | undefined,
  maxValue: D | null | undefined,
): { minValue: D | null | undefined; maxValue: D | null | undefined } {
  if (granularity === "day") return { minValue, maxValue };
  return {
    minValue: minValue && periodStart(minValue, granularity),
    maxValue: maxValue && periodEnd(maxValue, granularity),
  };
}

/**
 * Whether every day from `start` to `end` (inclusive) is unavailable — a
 * month or year only counts as unavailable when nothing inside it can be
 * picked, not when its first day happens to be blocked.
 */
export function isFullyUnavailable(
  start: CalendarDate,
  end: CalendarDate,
  isUnavailable: (date: DateValue) => boolean,
): boolean {
  for (let day = start; day.compare(end) <= 0; day = day.add({ days: 1 })) {
    if (!isUnavailable(day)) return false;
  }
  return true;
}

/**
 * Lifts a day-level `isDateUnavailable` predicate to whole periods: the
 * period containing `date` is unavailable only when all of its days are.
 * Returns `undefined` for an `undefined` predicate or day granularity, so
 * it can be passed straight to react-aria's `isDateUnavailable` prop.
 */
export function createIsPeriodUnavailable(
  granularity: DateGranularity,
  isUnavailable: ((date: DateValue) => boolean) | undefined,
): ((date: DateValue) => boolean) | undefined {
  if (!isUnavailable || granularity === "day") return isUnavailable;
  return (date) => {
    const start = periodStart(date, granularity);
    const end = periodEnd(date, granularity);
    return isFullyUnavailable(toCalendarDate(start), toCalendarDate(end), isUnavailable);
  };
}
