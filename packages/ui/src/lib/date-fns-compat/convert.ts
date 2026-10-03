import { fromDate, type ZonedDateTime } from "@internationalized/date";

import { getDefaultTimeZone } from "./context";
import { TZDate } from "./tz";

/**
 * Converts a native `Date` (an instant) into a `ZonedDateTime` (a calendar
 * date + wall-clock time + offset) in the given time zone. This is the
 * single conversion every arithmetic/comparison/boundary function in this
 * package goes through, so that `@internationalized/date`'s DST-safe,
 * calendar-aware math runs under the hood while every public function here
 * still accepts and returns plain `Date` objects — the same as date-fns.
 *
 * When no explicit `timeZone` is given and `date` is a `TZDate`, its own
 * zone wins over the adapter's global default — the same rule date-fns v4
 * itself applies via `constructFrom`, and what lets a `TZDate` chain through
 * `addDays(startOfWeek(tzDate), 1)` without repeating `timeZone` at each step.
 */
export function toZoned(date: Date, timeZone?: string): ZonedDateTime {
  assertValid(date);
  const tz = timeZone ?? (date instanceof TZDate ? date.timeZone : getDefaultTimeZone());
  return fromDate(date, tz);
}

/** Converts a `ZonedDateTime` back to a native `Date` instant. */
export function fromZoned(zoned: ZonedDateTime): Date {
  return zoned.toDate();
}

/**
 * Like `fromZoned`, but preserves `reference`'s exact type (mirrors date-fns
 * v4's own generic `constructFrom<DateType extends Date>`): if `reference`
 * is a `TZDate`, the result is a `TZDate` in the same zone (still typed
 * `T`); otherwise a plain `Date`. Every arithmetic/boundary function that
 * transforms a `Date` into another `Date` uses this instead of `fromZoned`,
 * and is itself generic over `T extends Date`, so a call site typed
 * `addDays(startOfWeek(tzDate), 1)` — where `tzDate: TZDate` — infers a
 * `TZDate` result with no cast, exactly like real date-fns's own types do.
 */
export function fromZonedLike<T extends Date>(reference: T, zoned: ZonedDateTime): T {
  // The cast is safe: when `reference` is a `TZDate`, the runtime branch
  // below always constructs one, and `T` was inferred from `reference`
  // itself at the call site.
  return (
    reference instanceof TZDate
      ? new TZDate(zoned.toDate().getTime(), reference.timeZone)
      : zoned.toDate()
  ) as T;
}

/** Throws the same kind of `RangeError` `date-fns` throws for an invalid Date. */
export function assertValid(date: Date): void {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid time value");
  }
}
