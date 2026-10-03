/**
 * Shared helpers for inclusive `Interval<T>` spans (`lib/types.ts`) — e.g.
 * "unavailable ranges" of days already booked — layered on top of the
 * `isDateUnavailable` prop that react-aria-components' Calendar,
 * RangeCalendar, DateField and DatePicker share, so the same interval list
 * blocks selection/typing consistently across all of them.
 *
 * Generic over any `T` exposing a `.compare(other: T): number` method (e.g.
 * `@internationalized/date`'s `DateValue`) rather than hardcoding that type
 * — this file has no import of (or dependency on) a specific date library;
 * callers supply `T` via `Interval<DateValue>` etc. Not generic over *every*
 * orderable type, though: a plain `Date`/`number`/`string` has no
 * `.compare()` method, so using this with one of those would need a small
 * wrapper implementing `Comparable`, not a bare value.
 */

import type { Interval } from "@/lib/types";

interface Comparable<T> {
  compare(other: T): number;
}

/**
 * The constraints under which a value counts as "blocked": outside the
 * inclusive `[min, max]` window, or inside any of the `unavailableRanges`
 * intervals. The field is named after the public `unavailableRanges` prop
 * on `calendar`/`date-input`/`date-picker` so call sites can build this
 * object with plain `{ min, max, unavailableRanges }` shorthand.
 */
export interface AvailabilityConstraints<T> {
  min?: T;
  max?: T;
  unavailableRanges?: Interval<T>[];
}

/** Whether `value` falls inside the inclusive `interval`. An inverted interval (`from > to`) contains nothing. */
export function isWithinInterval<T extends Comparable<T>>(
  value: T,
  interval: Interval<T>,
): boolean {
  return value.compare(interval.from) >= 0 && value.compare(interval.to) <= 0;
}

/** Whether `value` falls inside any interval of the list (`false` for `undefined`/empty lists). */
export function isWithinAnyInterval<T extends Comparable<T>>(
  value: T,
  intervals: Interval<T>[] | undefined,
): boolean {
  return !!intervals?.some((interval) => isWithinInterval(value, interval));
}

// Factory form of `isWithinAnyInterval`, shaped to slot straight into
// react-aria-components' `isDateUnavailable` prop (`(date) => boolean`).
// Returns `undefined` (instead of an always-false predicate) for an
// `undefined`/empty list so the prop can stay unset entirely.
export function createIsWithinAnyInterval<T extends Comparable<T>>(
  intervals: Interval<T>[] | undefined,
): ((value: T) => boolean) | undefined {
  if (!intervals || intervals.length === 0) return undefined;
  return (value: T) => isWithinAnyInterval(value, intervals);
}

/** Whether two inclusive intervals share at least one point (touching edges count). */
export function intervalsOverlap<T extends Comparable<T>>(a: Interval<T>, b: Interval<T>): boolean {
  return a.from.compare(b.to) <= 0 && b.from.compare(a.to) <= 0;
}

/** Whether `interval` overlaps any interval of the list (`false` for `undefined`/empty lists). */
export function overlapsAnyInterval<T extends Comparable<T>>(
  interval: Interval<T>,
  intervals: Interval<T>[] | undefined,
): boolean {
  return !!intervals?.some((other) => intervalsOverlap(interval, other));
}

// Whether a single value is blocked under the given constraints. Needed
// because neither Zag machine revalidates an already-committed `value`
// reactively when these props change later — confirmed by reading
// date-picker.machine.mjs's `watch()`, which tracks locale/focusedValue/
// startValue/etc. but never min/max/value together. `calendar`/`date-input`
// use this (via lib/date-availability.ts's travel helpers) to correct a
// `value` that went stale (e.g. a parent widened `unavailableRanges` to now
// cover a date the user already picked) rather than leaving it
// selected-but-disabled.
export function isValueBlocked<T extends Comparable<T>>(
  value: T,
  constraints: AvailabilityConstraints<T>,
): boolean {
  const { min, max, unavailableRanges } = constraints;
  return (
    (!!min && value.compare(min) < 0) ||
    (!!max && value.compare(max) > 0) ||
    isWithinAnyInterval(value, unavailableRanges)
  );
}

/** Whether at least one value in the list is blocked (`false` for `undefined`/empty lists). */
export function isAnyValueBlocked<T extends Comparable<T>>(
  values: T[] | undefined,
  constraints: AvailabilityConstraints<T>,
): boolean {
  return !!values?.some((value) => isValueBlocked(value, constraints));
}
