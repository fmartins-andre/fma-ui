import type { DateTimeDuration } from "@internationalized/date";

import type { AdapterOptions } from "./context";
import { fromZonedLike, toZoned } from "./convert";

function applyDuration<T extends Date>(
  date: T,
  duration: DateTimeDuration,
  options?: AdapterOptions,
): T {
  const zoned = toZoned(date, options?.timeZone);
  return fromZonedLike(date, zoned.add(duration));
}

function applyNegativeDuration<T extends Date>(
  date: T,
  duration: DateTimeDuration,
  options?: AdapterOptions,
): T {
  const zoned = toZoned(date, options?.timeZone);
  return fromZonedLike(date, zoned.subtract(duration));
}

/**
 * Each pair below has the same name and signature as its date-fns
 * counterpart (`addDays(date, amount)`), so a call site that does
 *
 *   import { addDays } from 'date-fns'
 *
 * keeps working unmodified after switching the import to this package —
 * only now DST transitions, month-length overflow ("Jan 31 + 1 month"),
 * and non-Gregorian calendars are handled by `@internationalized/date`'s
 * calendar engine instead of by hand-rolled millisecond math.
 *
 * Every function here is generic over `T extends Date` (matching real
 * date-fns v4's own typing convention) so a `TZDate` input infers a
 * `TZDate` return with no cast at the call site — `addDays(someTZDate, 1)`
 * is typed `TZDate`, not widened to `Date`.
 */

export function addYears<T extends Date>(date: T, amount: number, options?: AdapterOptions): T {
  return applyDuration(date, { years: amount }, options);
}
export function subYears<T extends Date>(date: T, amount: number, options?: AdapterOptions): T {
  return applyNegativeDuration(date, { years: amount }, options);
}

export function addMonths<T extends Date>(date: T, amount: number, options?: AdapterOptions): T {
  return applyDuration(date, { months: amount }, options);
}
export function subMonths<T extends Date>(date: T, amount: number, options?: AdapterOptions): T {
  return applyNegativeDuration(date, { months: amount }, options);
}

export function addWeeks<T extends Date>(date: T, amount: number, options?: AdapterOptions): T {
  return applyDuration(date, { weeks: amount }, options);
}
export function subWeeks<T extends Date>(date: T, amount: number, options?: AdapterOptions): T {
  return applyNegativeDuration(date, { weeks: amount }, options);
}

export function addDays<T extends Date>(date: T, amount: number, options?: AdapterOptions): T {
  return applyDuration(date, { days: amount }, options);
}
export function subDays<T extends Date>(date: T, amount: number, options?: AdapterOptions): T {
  return applyNegativeDuration(date, { days: amount }, options);
}

export function addHours<T extends Date>(date: T, amount: number, options?: AdapterOptions): T {
  return applyDuration(date, { hours: amount }, options);
}
export function subHours<T extends Date>(date: T, amount: number, options?: AdapterOptions): T {
  return applyNegativeDuration(date, { hours: amount }, options);
}

export function addMinutes<T extends Date>(date: T, amount: number, options?: AdapterOptions): T {
  return applyDuration(date, { minutes: amount }, options);
}
export function subMinutes<T extends Date>(date: T, amount: number, options?: AdapterOptions): T {
  return applyNegativeDuration(date, { minutes: amount }, options);
}

export function addSeconds<T extends Date>(date: T, amount: number, options?: AdapterOptions): T {
  return applyDuration(date, { seconds: amount }, options);
}
export function subSeconds<T extends Date>(date: T, amount: number, options?: AdapterOptions): T {
  return applyNegativeDuration(date, { seconds: amount }, options);
}

export function addMilliseconds<T extends Date>(
  date: T,
  amount: number,
  options?: AdapterOptions,
): T {
  return applyDuration(date, { milliseconds: amount }, options);
}
export function subMilliseconds<T extends Date>(
  date: T,
  amount: number,
  options?: AdapterOptions,
): T {
  return applyNegativeDuration(date, { milliseconds: amount }, options);
}

/** Generic escape hatch mirroring date-fns's `add`/`sub`, taking a full duration object. */
export function add<T extends Date>(
  date: T,
  duration: DateTimeDuration,
  options?: AdapterOptions,
): T {
  return applyDuration(date, duration, options);
}
export function sub<T extends Date>(
  date: T,
  duration: DateTimeDuration,
  options?: AdapterOptions,
): T {
  return applyNegativeDuration(date, duration, options);
}
