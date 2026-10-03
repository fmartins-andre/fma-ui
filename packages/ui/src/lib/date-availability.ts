/**
 * Finds the nearest date to a given one that isn't blocked by `min`/`max`
 * or `unavailableRanges`, and builds on that to centralize the
 * travel-or-clear correction policy for date components (calendar,
 * date-input, date-picker): a blocked value travels to a valid neighbour instead of
 * being discarded outright, and clearing is reserved for the one case
 * where no available date exists at all.
 *
 * Deliberately NOT generic like `lib/interval-helpers.ts`: computing a
 * *neighbour* needs day-stepping (`.add`/`.subtract`), which only a
 * calendar-date type provides — `@internationalized/date`'s `DateValue`
 * here, not a bare `Comparable<T>`. `isValueBlocked`'s own membership
 * check has no such requirement, which is why it stays generic there.
 */

import type { DateValue } from "@internationalized/date";
import {
  type AvailabilityConstraints,
  isAnyValueBlocked,
  isValueBlocked,
  overlapsAnyInterval,
} from "@/lib/interval-helpers";

export type DateAvailabilityConstraints = AvailabilityConstraints<DateValue>;

/**
 * Returns the nearest date to `date` that clears every constraint, or
 * `date` itself unchanged if it isn't blocked to begin with.
 *
 * Rather than scanning day by day, this only examines constraint
 * *boundaries* — `min`, `max`, and each interval's `from - 1 day` /
 * `to + 1 day` — because the nearest available date is always one of
 * them: scanning outward from a blocked date, the first free day in
 * either direction is by definition adjacent to whatever blocked the
 * previous one. Boundaries that are themselves blocked (e.g. an interval
 * edge that falls inside another interval, or outside `[min, max]`) are
 * filtered out by the same `isValueBlocked` check. Ties between an
 * earlier and a later candidate at equal distance prefer the later one.
 *
 * There is no distance cap: a boundary is a valid destination however far
 * away it is (e.g. `min` months ahead of a typed date). Returns
 * `undefined` only when no candidate survives — i.e. `unavailableRanges`
 * covers the entire `[min, max]` window (or every boundary is blocked) —
 * meaning there is truly no available value to travel to, not just that
 * this particular one is blocked.
 */
export function findNearestAvailableDate(
  date: DateValue,
  constraints: DateAvailabilityConstraints,
): DateValue | undefined {
  if (!isValueBlocked(date, constraints)) return date;

  const { min, max, unavailableRanges } = constraints;
  const candidates: DateValue[] = [];
  if (min) candidates.push(min);
  if (max) candidates.push(max);
  for (const interval of unavailableRanges ?? []) {
    candidates.push(interval.from.subtract({ days: 1 }), interval.to.add({ days: 1 }));
  }

  let best: DateValue | undefined;
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    if (isValueBlocked(candidate, constraints)) continue;
    const diff = candidate.compare(date);
    const distance = Math.abs(diff);
    if (distance < bestDistance || (distance === bestDistance && diff > 0)) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Travels every blocked entry of `values` to its nearest available date,
 * independently of the others (single-selection policy). Returns `values`
 * unchanged *by identity* when nothing is blocked (so callers can cheaply
 * test `result === values`), a new corrected array otherwise, or
 * `undefined` when some entry has no available date to travel to at all —
 * the only case that should clear the value outright.
 */
export function travelDatesToAvailable(
  values: DateValue[],
  constraints: DateAvailabilityConstraints,
): DateValue[] | undefined {
  if (!isAnyValueBlocked(values, constraints)) return values;
  const corrected: DateValue[] = [];
  for (const date of values) {
    const traveled = findNearestAvailableDate(date, constraints);
    if (traveled === undefined) return undefined;
    corrected.push(traveled);
  }
  return corrected;
}

/**
 * Range-selection variant of `travelDatesToAvailable`: treats `values` as
 * the inclusive `[start, end]` span of a range selection, so the *whole
 * span* — not just the endpoints — must be available. Correcting each
 * endpoint independently could otherwise "fix" a range into one that
 * fully contains the unavailable interval it was supposed to avoid (e.g.
 * `[12, 24]` blocked by `[5-30]` becoming `[4, 31]`).
 *
 * Policy: the start anchors — it travels to its nearest available date —
 * and the end is then clamped into the same contiguous available window
 * (collapsing to a single-day range when nothing of the original span
 * fits). Same identity/`undefined` contract as `travelDatesToAvailable`.
 * A partial range (fewer than two entries, i.e. mid-selection) falls back
 * to per-date travel, since there is no span to protect yet.
 */
export function travelRangeToAvailable(
  values: DateValue[],
  constraints: DateAvailabilityConstraints,
): DateValue[] | undefined {
  if (values.length < 2) return travelDatesToAvailable(values, constraints);

  const [first, second] = values;
  const inOrder = first.compare(second) <= 0;
  const start = inOrder ? first : second;
  const end = inOrder ? second : first;

  const blocked =
    isAnyValueBlocked(values, constraints) ||
    overlapsAnyInterval({ from: start, to: end }, constraints.unavailableRanges);
  if (!blocked) return values;

  const newStart = findNearestAvailableDate(start, constraints);
  if (newStart === undefined) return undefined;

  // Upper edge of the contiguous available window containing `newStart`:
  // `max`, or the day before the nearest unavailable interval that starts
  // after `newStart`, whichever comes first. Every date in
  // `[newStart, windowEnd]` is available by construction.
  let windowEnd = constraints.max;
  for (const interval of constraints.unavailableRanges ?? []) {
    if (interval.from.compare(interval.to) > 0) continue; // inverted: blocks nothing
    if (interval.from.compare(newStart) <= 0) continue;
    const edge = interval.from.subtract({ days: 1 });
    if (windowEnd === undefined || edge.compare(windowEnd) < 0) {
      windowEnd = edge;
    }
  }

  let newEnd = end.compare(newStart) < 0 ? newStart : end;
  if (windowEnd !== undefined && newEnd.compare(windowEnd) > 0) {
    newEnd = windowEnd;
  }
  return [newStart, newEnd];
}
