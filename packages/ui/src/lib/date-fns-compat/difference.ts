import type { AdapterOptions } from "./context";
import { assertValid, toZoned } from "./convert";

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;

/**
 * "Exact" differences work purely on the instant (epoch milliseconds), just
 * like date-fns's own `differenceInHours`/`differenceInMinutes`/etc. They
 * don't need calendar awareness, so no conversion through
 * `@internationalized/date` happens here — only `assertValid` keeps the
 * same "throw on Invalid Date" behaviour as date-fns.
 */
function exactDiff(dateLeft: Date, dateRight: Date, unitMs: number): number {
  assertValid(dateLeft);
  assertValid(dateRight);
  const diff = (dateLeft.getTime() - dateRight.getTime()) / unitMs;
  return diff > 0 ? Math.floor(diff) : Math.ceil(diff);
}

export function differenceInMilliseconds(dateLeft: Date, dateRight: Date): number {
  assertValid(dateLeft);
  assertValid(dateRight);
  return dateLeft.getTime() - dateRight.getTime();
}
export function differenceInSeconds(dateLeft: Date, dateRight: Date): number {
  return exactDiff(dateLeft, dateRight, MS_PER_SECOND);
}
export function differenceInMinutes(dateLeft: Date, dateRight: Date): number {
  return exactDiff(dateLeft, dateRight, MS_PER_MINUTE);
}
export function differenceInHours(dateLeft: Date, dateRight: Date): number {
  return exactDiff(dateLeft, dateRight, MS_PER_HOUR);
}

/**
 * "Calendar" differences count whole calendar units crossed, the way a
 * person reading a calendar would — this is where handing the math to
 * `@internationalized/date` actually pays off, since it resolves each side
 * to a calendar date in the given time zone before comparing fields,
 * instead of assuming a fixed 24h/30-day/365-day unit like naive
 * millisecond division would.
 */
export function differenceInCalendarDays(
  dateLeft: Date,
  dateRight: Date,
  options?: AdapterOptions,
): number {
  const tz = options?.timeZone;
  const leftMidnight = toZoned(dateLeft, tz)
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .toDate();
  const rightMidnight = toZoned(dateRight, tz)
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .toDate();
  return Math.round((leftMidnight.getTime() - rightMidnight.getTime()) / (MS_PER_HOUR * 24));
}

/** Like `differenceInCalendarDays`, but only counts a day once a full 24h-equivalent has elapsed (date-fns semantics). */
export function differenceInDays(
  dateLeft: Date,
  dateRight: Date,
  options?: AdapterOptions,
): number {
  const calendarDays = differenceInCalendarDays(dateLeft, dateRight, options);
  const left = toZoned(dateLeft, options?.timeZone);
  const right = toZoned(dateRight, options?.timeZone).add({
    days: calendarDays,
  });
  const isLastDayNotFull =
    (calendarDays > 0 && left.compare(right) < 0) || (calendarDays < 0 && left.compare(right) > 0);
  return isLastDayNotFull ? calendarDays - Math.sign(calendarDays) : calendarDays;
}

export function differenceInCalendarWeeks(
  dateLeft: Date,
  dateRight: Date,
  options?: AdapterOptions,
): number {
  const days = differenceInCalendarDays(dateLeft, dateRight, options);
  return days > 0 ? Math.floor(days / 7) : Math.ceil(days / 7);
}

export function differenceInCalendarMonths(
  dateLeft: Date,
  dateRight: Date,
  options?: AdapterOptions,
): number {
  const left = toZoned(dateLeft, options?.timeZone);
  const right = toZoned(dateRight, options?.timeZone);
  return (left.year - right.year) * 12 + (left.month - right.month);
}

export function differenceInCalendarYears(
  dateLeft: Date,
  dateRight: Date,
  options?: AdapterOptions,
): number {
  const left = toZoned(dateLeft, options?.timeZone);
  const right = toZoned(dateRight, options?.timeZone);
  return left.year - right.year;
}

/** Like `differenceInCalendarMonths`, but only counts a month once it has fully elapsed (date-fns semantics). */
export function differenceInMonths(
  dateLeft: Date,
  dateRight: Date,
  options?: AdapterOptions,
): number {
  const calendarMonths = differenceInCalendarMonths(dateLeft, dateRight, options);
  const left = toZoned(dateLeft, options?.timeZone);
  const right = toZoned(dateRight, options?.timeZone).add({
    months: calendarMonths,
  });
  const isLastMonthNotFull =
    (calendarMonths > 0 && left.compare(right) < 0) ||
    (calendarMonths < 0 && left.compare(right) > 0);
  return isLastMonthNotFull ? calendarMonths - Math.sign(calendarMonths) : calendarMonths;
}

/** Like `differenceInCalendarYears`, but only counts a year once it has fully elapsed (date-fns semantics). */
export function differenceInYears(
  dateLeft: Date,
  dateRight: Date,
  options?: AdapterOptions,
): number {
  const months = differenceInMonths(dateLeft, dateRight, options);
  return Math.trunc(months / 12);
}
