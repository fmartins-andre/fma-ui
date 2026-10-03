/**
 * useAvailableDateCorrection — revalidates an already-committed date value
 * against `min`/`max`/`unavailableRanges` whenever the value or the
 * constraints change, correcting it through the shared travel-or-clear
 * policy (`lib/date-availability.ts`). Meant for date components such as
 * calendar, date-input and date-picker.
 */

import type { DateValue } from "@internationalized/date";
import * as React from "react";
import {
  type DateAvailabilityConstraints,
  travelDatesToAvailable,
  travelRangeToAvailable,
} from "@/lib/date-availability";
import type { Interval } from "@/lib/types";

interface UseAvailableDateCorrectionOptions {
  value: DateValue[] | undefined;
  min?: DateValue;
  max?: DateValue;
  unavailableRanges?: Interval<DateValue>[];
  // "range" applies the span-aware policy (`travelRangeToAvailable`);
  // anything else corrects each entry independently.
  selectionMode?: string;
  // The owning component's state setters. Read at effect time through a
  // ref (callers often pass fresh closures every render), so they don't
  // belong in the effect's dependency list.
  clearValue: () => void;
  setValue: (value: DateValue[]) => void;
}

function serializeAttempt(
  value: DateValue[],
  { min, max, unavailableRanges }: DateAvailabilityConstraints,
): string {
  return [
    value.map(String).join(","),
    String(min ?? ""),
    String(max ?? ""),
    (unavailableRanges ?? [])
      .map((interval) => `${String(interval.from)}/${String(interval.to)}`)
      .join(","),
  ].join("|");
}

/**
 * Date pickers don't revalidate an already-committed `value` when
 * `min`/`max`/`isDateUnavailable` change later — their guards only gate
 * *new* selections/edits (see `isValueBlocked`'s doc comment in
 * lib/interval-helpers.ts). Without this effect, a consumer narrowing the
 * allowed window after a date was already picked/typed would leave that
 * date visually selected while every cell/segment renders it as
 * disabled/unavailable — a contradictory state. Each blocked value travels
 * to its nearest available date; `clearValue` is reserved for the one case
 * where there is truly no available date left to travel to.
 *
 * A correction is attempted at most once per distinct (value, constraints)
 * pair: a controlled parent that never adopts the corrected value but
 * re-renders on every `onValueChange` (fresh array identity of the same
 * blocked date each time) would otherwise re-trigger
 * setValue -> onValueChange -> re-render in an unbounded loop. The
 * attempt key resets as soon as an unblocked value arrives, so a *new*
 * stale state later is corrected normally.
 */
export function useAvailableDateCorrection({
  value,
  min,
  max,
  unavailableRanges,
  selectionMode,
  clearValue,
  setValue,
}: UseAvailableDateCorrectionOptions): void {
  const lastAttemptRef = React.useRef<string | null>(null);
  const clearValueRef = React.useRef(clearValue);
  clearValueRef.current = clearValue;
  const setValueRef = React.useRef(setValue);
  setValueRef.current = setValue;

  React.useEffect(() => {
    if (!value || value.length === 0) {
      lastAttemptRef.current = null;
      return;
    }
    const constraints = { min, max, unavailableRanges };
    const corrected =
      selectionMode === "range"
        ? travelRangeToAvailable(value, constraints)
        : travelDatesToAvailable(value, constraints);
    if (corrected === value) {
      lastAttemptRef.current = null;
      return;
    }
    const attemptKey = serializeAttempt(value, constraints);
    if (lastAttemptRef.current === attemptKey) return;
    lastAttemptRef.current = attemptKey;
    if (corrected === undefined) {
      clearValueRef.current();
    } else {
      setValueRef.current(corrected);
    }
  }, [value, min, max, unavailableRanges, selectionMode]);
}
