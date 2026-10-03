import { startOfWeek, startOfYear, type WeekOptions } from "./boundaries";
import { differenceInCalendarDays } from "./difference";

/**
 * Locale-agnostic week-of-year: 1 + the number of week-boundaries crossed
 * since the week containing Jan 1. This is a deliberate simplification of
 * date-fns's `getWeek` (which also consults the locale's
 * `firstWeekContainsDate` for the year-boundary edge case — a date in late
 * December can belong to "week 1" of the following year under some
 * conventions) — most call sites use this for a display gutter number and
 * always pass `weekStartsOn` explicitly, so this covers the common case
 * without reimplementing full CLDR week-numbering.
 */
export function getWeek(date: Date, options?: WeekOptions): number {
  const firstWeekOfYearStart = startOfWeek(startOfYear(date, options), options);
  const dateWeekStart = startOfWeek(date, options);
  const days = differenceInCalendarDays(dateWeekStart, firstWeekOfYearStart, options);
  return Math.floor(days / 7) + 1;
}
