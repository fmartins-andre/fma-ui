import { isToday as intlIsToday, isWeekend as intlIsWeekend } from "@internationalized/date";

import type { AdapterOptions } from "./context";
import { getDefaultLocale } from "./context";
import { assertValid, toZoned } from "./convert";

export function isBefore(date: Date, dateToCompare: Date): boolean {
  assertValid(date);
  assertValid(dateToCompare);
  return date.getTime() < dateToCompare.getTime();
}

export function isAfter(date: Date, dateToCompare: Date): boolean {
  assertValid(date);
  assertValid(dateToCompare);
  return date.getTime() > dateToCompare.getTime();
}

export function isEqual(dateLeft: Date, dateRight: Date): boolean {
  assertValid(dateLeft);
  assertValid(dateRight);
  return dateLeft.getTime() === dateRight.getTime();
}

export function compareAsc(dateLeft: Date, dateRight: Date): number {
  assertValid(dateLeft);
  assertValid(dateRight);
  const diff = dateLeft.getTime() - dateRight.getTime();
  return diff < 0 ? -1 : diff > 0 ? 1 : 0;
}

export function compareDesc(dateLeft: Date, dateRight: Date): number {
  return -compareAsc(dateLeft, dateRight);
}

/** Calendar-date equality (ignores time-of-day), evaluated in `options.timeZone`. */
export function isSameDay(dateLeft: Date, dateRight: Date, options?: AdapterOptions): boolean {
  const left = toZoned(dateLeft, options?.timeZone);
  const right = toZoned(dateRight, options?.timeZone);
  return left.year === right.year && left.month === right.month && left.day === right.day;
}

export function isSameMonth(dateLeft: Date, dateRight: Date, options?: AdapterOptions): boolean {
  const left = toZoned(dateLeft, options?.timeZone);
  const right = toZoned(dateRight, options?.timeZone);
  return left.year === right.year && left.month === right.month;
}

export function isSameYear(dateLeft: Date, dateRight: Date, options?: AdapterOptions): boolean {
  const left = toZoned(dateLeft, options?.timeZone);
  const right = toZoned(dateRight, options?.timeZone);
  return left.year === right.year;
}

/** Locale-aware weekend check (e.g. Fri/Sat counts as weekend in several Middle Eastern locales). */
export function isWeekend(date: Date, options?: AdapterOptions): boolean {
  const zoned = toZoned(date, options?.timeZone);
  return intlIsWeekend(zoned, options?.locale ?? getDefaultLocale());
}

export function isToday(date: Date, options?: AdapterOptions): boolean {
  const zoned = toZoned(date, options?.timeZone);
  return intlIsToday(zoned, zoned.timeZone);
}

export function isValid(date: unknown): date is Date {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

/** Returns the earliest date, by reference (preserving its exact type — e.g. a `TZDate` stays a `TZDate` — same as real date-fns). */
export function min<T extends Date>(dates: T[]): T {
  dates.forEach(assertValid);
  return dates.reduce((earliest, d) => (d.getTime() < earliest.getTime() ? d : earliest));
}

/** Returns the latest date, by reference (preserving its exact type — same as real date-fns). */
export function max<T extends Date>(dates: T[]): T {
  dates.forEach(assertValid);
  return dates.reduce((latest, d) => (d.getTime() > latest.getTime() ? d : latest));
}
