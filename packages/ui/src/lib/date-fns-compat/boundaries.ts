import {
  type DayOfWeek,
  endOfMonth as intlEndOfMonth,
  endOfWeek as intlEndOfWeek,
  endOfYear as intlEndOfYear,
  startOfMonth as intlStartOfMonth,
  startOfWeek as intlStartOfWeek,
  startOfYear as intlStartOfYear,
} from "@internationalized/date";

import type { AdapterOptions } from "./context";
import { getDefaultLocale } from "./context";
import { fromZonedLike, toZoned } from "./convert";

const END_OF_DAY_FIELDS = {
  hour: 23,
  minute: 59,
  second: 59,
  millisecond: 999,
} as const;
const START_OF_DAY_FIELDS = {
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0,
} as const;

/** date-fns's numeric `weekStartsOn` (0 = Sunday .. 6 = Saturday) mapped to `@internationalized/date`'s `DayOfWeek`. */
const WEEKDAY_BY_INDEX: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export interface WeekOptions extends AdapterOptions {
  /** 0 (Sunday) through 6 (Saturday), matching date-fns's `weekStartsOn`. Defaults to the locale's convention. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export function startOfDay<T extends Date>(date: T, options?: AdapterOptions): T {
  const zoned = toZoned(date, options?.timeZone).set(START_OF_DAY_FIELDS);
  return fromZonedLike(date, zoned);
}

export function endOfDay<T extends Date>(date: T, options?: AdapterOptions): T {
  const zoned = toZoned(date, options?.timeZone).set(END_OF_DAY_FIELDS);
  return fromZonedLike(date, zoned);
}

export function startOfMonth<T extends Date>(date: T, options?: AdapterOptions): T {
  const zoned = toZoned(date, options?.timeZone);
  return fromZonedLike(date, intlStartOfMonth(zoned).set(START_OF_DAY_FIELDS));
}

export function endOfMonth<T extends Date>(date: T, options?: AdapterOptions): T {
  const zoned = toZoned(date, options?.timeZone);
  return fromZonedLike(date, intlEndOfMonth(zoned).set(END_OF_DAY_FIELDS));
}

export function startOfYear<T extends Date>(date: T, options?: AdapterOptions): T {
  const zoned = toZoned(date, options?.timeZone);
  return fromZonedLike(date, intlStartOfYear(zoned).set(START_OF_DAY_FIELDS));
}

export function endOfYear<T extends Date>(date: T, options?: AdapterOptions): T {
  const zoned = toZoned(date, options?.timeZone);
  return fromZonedLike(date, intlEndOfYear(zoned).set(END_OF_DAY_FIELDS));
}

export function startOfWeek<T extends Date>(date: T, options?: WeekOptions): T {
  const zoned = toZoned(date, options?.timeZone);
  const locale = options?.locale ?? getDefaultLocale();
  const firstDay =
    options?.weekStartsOn !== undefined ? WEEKDAY_BY_INDEX[options.weekStartsOn] : undefined;
  return fromZonedLike(date, intlStartOfWeek(zoned, locale, firstDay).set(START_OF_DAY_FIELDS));
}

export function endOfWeek<T extends Date>(date: T, options?: WeekOptions): T {
  const zoned = toZoned(date, options?.timeZone);
  const locale = options?.locale ?? getDefaultLocale();
  const firstDay =
    options?.weekStartsOn !== undefined ? WEEKDAY_BY_INDEX[options.weekStartsOn] : undefined;
  return fromZonedLike(date, intlEndOfWeek(zoned, locale, firstDay).set(END_OF_DAY_FIELDS));
}
