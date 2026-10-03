"use client";

import { type DateValue, getLocalTimeZone, today } from "@internationalized/date";
import { cn } from "cn";
import * as React from "react";
import {
  DateField as AriaDateField,
  type DateFieldProps as AriaDateFieldProps,
  DateInput as AriaDateInput,
  type DateInputProps as AriaDateInputProps,
  DateSegment as AriaDateSegment,
  type DateSegmentProps as AriaDateSegmentProps,
  composeRenderProps,
} from "react-aria-components";
import { useAvailableDateCorrection } from "@/hooks/use-available-date-correction";
import {
  createIsPeriodUnavailable,
  type DateGranularity,
  isPeriodGranularity,
  periodBounds,
  periodStart,
} from "@/lib/date-granularity";
import { createIsWithinAnyInterval } from "@/lib/interval-helpers";
import type { Interval } from "@/lib/types";

/**
 * `"year"`/`"month"` render only those segments and commit the period's
 * first day; `"day"` and the time granularities behave like react-aria's.
 */
type DateFieldGranularity = DateGranularity | "hour" | "minute" | "second";

// react-aria's public `Granularity` type stops at "day", but its field state
// builds the segment list (and the "is complete" check) from the slice
// `[maxGranularity … granularity]` of year/month/day/…, and
// `createPlaceholderDate` handles "year"/"month" explicitly — so a coarser
// granularity yields a real year(/month)-only field, with the missing fields
// filled from `placeholderValue` at commit time. Filtering segments in the
// render layer instead would leave the state waiting forever for a day.
type AriaGranularity = NonNullable<AriaDateFieldProps<DateValue>["granularity"]>;

interface DateConstraintProps {
  granularity?: DateFieldGranularity;
  /**
   * Inclusive from/to spans that can't be picked (e.g. already-booked days),
   * on top of `minValue`/`maxValue` and `isDateUnavailable`. A value that ends
   * up blocked — typed, or left behind by changed constraints — travels to
   * the nearest available date (or is cleared when none is left) once the
   * field loses focus, so typing is never interrupted.
   */
  unavailableRanges?: Interval<DateValue>[];
}

/**
 * Resolves the props react-aria needs for a granularity: period-widened
 * min/max, an `isDateUnavailable` lifted to whole periods, and a placeholder
 * at the start of the current period (so a month field commits day 1).
 * Shared by `DateField`, `DatePicker` and `DateRangePicker`.
 */
function useDateConstraints<A extends unknown[]>({
  granularity,
  minValue,
  maxValue,
  isDateUnavailable,
  unavailableRanges,
  placeholderValue,
}: DateConstraintProps & {
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  isDateUnavailable?: (date: DateValue, ...rest: A) => boolean;
  placeholderValue?: DateValue | null;
}) {
  const period: DateGranularity = isPeriodGranularity(granularity) ? granularity : "day";
  const bounds = React.useMemo(
    () => periodBounds(period, minValue, maxValue),
    [period, minValue, maxValue],
  );
  const isUnavailable = React.useMemo(() => {
    const isInRanges = createIsWithinAnyInterval(unavailableRanges);
    const isDayUnavailable =
      isInRanges && isDateUnavailable
        ? (date: DateValue, ...rest: A) => isDateUnavailable(date, ...rest) || isInRanges(date)
        : (isDateUnavailable ?? isInRanges);
    if (period === "day" || !isDayUnavailable) return isDayUnavailable;
    // Periods ignore the range picker's anchor argument: a month is blocked
    // only when every day in it is.
    return createIsPeriodUnavailable(period, (date) =>
      isDayUnavailable(date, ...([null] as unknown as A)),
    );
  }, [period, isDateUnavailable, unavailableRanges]);
  const placeholder = React.useMemo(() => {
    if (period === "day") return placeholderValue;
    return periodStart(placeholderValue ?? today(getLocalTimeZone()), period);
  }, [period, placeholderValue]);

  return {
    period,
    granularity: granularity as AriaGranularity | undefined,
    minValue: bounds.minValue,
    maxValue: bounds.maxValue,
    isDateUnavailable: isUnavailable,
    placeholderValue: placeholder,
  };
}

/**
 * Uncontrolled/controlled value in one: react-aria always receives a
 * controlled value, so corrections can be written back through `setValue`.
 */
function useControlledValue<V>(
  value: V | undefined,
  defaultValue: V | undefined,
  onChange: ((value: V) => void) | undefined,
) {
  const [internal, setInternal] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const setValue = React.useCallback(
    (next: V) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [current, setValue] as const;
}

/**
 * Whether focus is inside `ref`'s element. Native focusin/focusout (not
 * React's synthetic events), so focus moving into a portaled popover — the
 * date picker's calendar — counts as leaving.
 */
function useFocusWithin(ref: React.RefObject<HTMLElement | null>) {
  const [isFocusWithin, setFocusWithin] = React.useState(false);
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onFocusIn = () => setFocusWithin(true);
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (!(next instanceof Node && element.contains(next))) setFocusWithin(false);
    };
    element.addEventListener("focusin", onFocusIn);
    element.addEventListener("focusout", onFocusOut);
    return () => {
      element.removeEventListener("focusin", onFocusIn);
      element.removeEventListener("focusout", onFocusOut);
    };
  }, [ref]);
  return isFocusWithin;
}

/**
 * Travel/clear for a blocked value, deferred while the user is editing:
 * react-aria emits a value on every keystroke once all segments are filled
 * (typing "2026" passes through year 2, 20, 202…), so correcting eagerly
 * would fight the typing. Runs on blur and whenever the constraints change.
 */
function useBlockedValueCorrection({
  dates,
  isEditing,
  isRange,
  period,
  minValue,
  maxValue,
  unavailableRanges,
  onClear,
  onCorrect,
}: {
  dates: DateValue[];
  isEditing: boolean;
  isRange?: boolean;
  period: DateGranularity;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  unavailableRanges?: Interval<DateValue>[];
  onClear: () => void;
  onCorrect: (dates: DateValue[]) => void;
}) {
  useAvailableDateCorrection({
    // Travel/clear works on days; month/year values are validated per period.
    value: !isEditing && period === "day" ? dates : undefined,
    min: minValue ?? undefined,
    max: maxValue ?? undefined,
    unavailableRanges,
    selectionMode: isRange ? "range" : "single",
    clearValue: onClear,
    setValue: onCorrect,
  });
}

function DateField<T extends DateValue>({
  granularity,
  unavailableRanges,
  minValue,
  maxValue,
  isDateUnavailable,
  placeholderValue,
  value: valueProp,
  defaultValue,
  onChange,
  className,
  children,
  ...props
}: Omit<AriaDateFieldProps<T>, "granularity" | "children" | "className"> &
  DateConstraintProps & {
    className?: string;
    /** Defaults to a bare `<DateInput />`. */
    children?: React.ReactNode;
  }) {
  const constraints = useDateConstraints({
    granularity,
    minValue,
    maxValue,
    isDateUnavailable,
    unavailableRanges,
    placeholderValue,
  });
  const { period } = constraints;
  const [value, setValue] = useControlledValue<DateValue | null>(
    valueProp,
    defaultValue,
    onChange as ((value: DateValue | null) => void) | undefined,
  );
  const handleChange = (next: DateValue | null) =>
    setValue(next && period !== "day" ? periodStart(next, period) : next);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const isEditing = useFocusWithin(rootRef);
  const dates = React.useMemo(() => (value ? [value] : []), [value]);
  useBlockedValueCorrection({
    dates,
    isEditing,
    period,
    minValue,
    maxValue,
    unavailableRanges,
    onClear: () => setValue(null),
    onCorrect: ([date]) => setValue(date ?? null),
  });

  return (
    <AriaDateField
      {...(props as AriaDateFieldProps<DateValue>)}
      ref={rootRef}
      data-slot="date-field"
      value={value ?? null}
      onChange={handleChange}
      granularity={constraints.granularity}
      minValue={constraints.minValue}
      maxValue={constraints.maxValue}
      isDateUnavailable={constraints.isDateUnavailable}
      placeholderValue={constraints.placeholderValue}
      className={cn("group/date-field flex flex-col gap-2", className)}
    >
      {children ?? <DateInput />}
    </AriaDateField>
  );
}

// Standalone it draws its own border/ring; inside an InputGroup the group
// draws them (it reacts to the segments' `data-slot="input-group-control"`),
// so the input sits flush and none of its own frame states apply.
const DATE_INPUT_CLASSES = cn(
  "flex h-8 w-full min-w-0 items-center text-base outline-none md:text-sm",
  "not-in-data-[slot=input-group]:rounded-lg not-in-data-[slot=input-group]:border not-in-data-[slot=input-group]:border-input not-in-data-[slot=input-group]:bg-transparent not-in-data-[slot=input-group]:px-2.5 not-in-data-[slot=input-group]:py-1 not-in-data-[slot=input-group]:transition-colors dark:not-in-data-[slot=input-group]:bg-input/30",
  "not-in-data-[slot=input-group]:data-focus-within:border-ring not-in-data-[slot=input-group]:data-focus-within:ring-3 not-in-data-[slot=input-group]:data-focus-within:ring-ring/50",
  "not-in-data-[slot=input-group]:data-invalid:border-destructive not-in-data-[slot=input-group]:data-invalid:ring-3 not-in-data-[slot=input-group]:data-invalid:ring-destructive/20 dark:not-in-data-[slot=input-group]:data-invalid:border-destructive/50 dark:not-in-data-[slot=input-group]:data-invalid:ring-destructive/40",
  "data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 not-in-data-[slot=input-group]:data-disabled:bg-input/50",
  "in-data-[slot=input-group]:h-full in-data-[slot=input-group]:px-2.5",
);

/**
 * The segmented input of a `DateField`, `DatePicker` or `DateRangePicker`
 * (`slot="start" | "end"` in a range). Fills the row inside an `InputGroup`,
 * except range inputs, which size to their content.
 */
function DateInput({
  className,
  ...props
}: Omit<AriaDateInputProps, "children" | "className"> & { className?: string }) {
  return (
    <AriaDateInput
      data-slot="date-input"
      className={composeRenderProps(className, (className) =>
        cn(
          DATE_INPUT_CLASSES,
          props.slot
            ? "in-data-[slot=input-group]:w-auto in-data-[slot=input-group]:flex-none in-data-[slot=input-group]:px-1 in-data-[slot=input-group]:first:pl-2.5"
            : "in-data-[slot=input-group]:flex-1",
          className,
        ),
      )}
      {...props}
    >
      {(segment) => <DateSegment segment={segment} />}
    </AriaDateInput>
  );
}

function DateSegment({ className, ...props }: AriaDateSegmentProps) {
  return (
    <AriaDateSegment
      // Lets an enclosing InputGroup show its focus/invalid ring.
      data-slot="input-group-control"
      className={composeRenderProps(className, (className) =>
        cn(
          "rounded-sm px-0.5 tabular-nums caret-transparent outline-none select-none",
          "data-placeholder:text-muted-foreground data-[type=literal]:px-0 data-[type=literal]:text-muted-foreground",
          "data-focused:bg-muted data-focused:text-foreground data-invalid:text-destructive data-focused:data-invalid:text-destructive",
          className,
        ),
      )}
      {...props}
    />
  );
}

export type { DateConstraintProps, DateFieldGranularity };
export {
  DateField,
  DateInput,
  DateSegment,
  useBlockedValueCorrection,
  useControlledValue,
  useDateConstraints,
  useFocusWithin,
};
