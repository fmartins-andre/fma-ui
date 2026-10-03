"use client";

import type { DateValue } from "@internationalized/date";
import { cn } from "cn";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import {
  DatePicker as AriaDatePicker,
  type DatePickerProps as AriaDatePickerProps,
  DateRangePicker as AriaDateRangePicker,
  type DateRangePickerProps as AriaDateRangePickerProps,
  DialogContext,
  OverlayTriggerStateContext,
  type RangeValue,
} from "react-aria-components";
import { Calendar, RangeCalendar } from "@/core/calendar/calendar";
import {
  type DateConstraintProps,
  DateInput,
  useBlockedValueCorrection,
  useControlledValue,
  useDateConstraints,
  useFocusWithin,
} from "@/core/date-field/date-field";
import { InputGroup, InputGroupAddon, InputGroupButton } from "@/core/input-group/input-group";
import { Popover } from "@/core/popover/popover";
import { type DateGranularity, periodEnd, periodStart } from "@/lib/date-granularity";
import type { Interval } from "@/lib/types";

interface DatePickerContextValue {
  isRange: boolean;
  period: DateGranularity;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  // The consumer's own predicate, not the period-lifted one: the calendar
  // lifts it to periods itself and combines it with `unavailableRanges`.
  isDateUnavailable?: (date: DateValue) => boolean;
  unavailableRanges?: Interval<DateValue>[];
  rootRef: React.RefObject<HTMLDivElement | null>;
}

const DatePickerContext = React.createContext<DatePickerContextValue | null>(null);

function useDatePickerContext(component: string) {
  const context = React.useContext(DatePickerContext);
  if (!context) throw new Error(`${component} must be used inside DatePicker or DateRangePicker`);
  return context;
}

type PickerExtraProps = DateConstraintProps & {
  className?: string;
  /**
   * Defaults to an `InputGroup` with the date input(s) and a calendar
   * trigger, plus `DatePickerContent`. Compose your own to add a `Label`,
   * description or a different layout.
   */
  children?: React.ReactNode;
};

/**
 * Typed segmented input plus a calendar popover over one value. `granularity`
 * `"month" | "year"` narrows both the segments and the calendar to whole
 * periods. The popover is non-modal: the input stays usable while it's open
 * and the calendar follows what's typed.
 */
function DatePicker<T extends DateValue>({
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
}: Omit<AriaDatePickerProps<T>, "granularity" | "children" | "className"> & PickerExtraProps) {
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

  const context = React.useMemo<DatePickerContextValue>(
    () => ({
      isRange: false,
      period,
      minValue,
      maxValue,
      isDateUnavailable,
      unavailableRanges,
      rootRef,
    }),
    [period, minValue, maxValue, isDateUnavailable, unavailableRanges],
  );

  return (
    <AriaDatePicker
      {...(props as AriaDatePickerProps<DateValue>)}
      ref={rootRef}
      data-slot="date-picker"
      value={value ?? null}
      onChange={handleChange}
      granularity={constraints.granularity}
      minValue={constraints.minValue}
      maxValue={constraints.maxValue}
      isDateUnavailable={constraints.isDateUnavailable}
      placeholderValue={constraints.placeholderValue}
      className={cn("group/date-picker flex flex-col gap-2", className)}
    >
      <DatePickerContext.Provider value={context}>
        {children ?? (
          <>
            <InputGroup>
              <DateInput />
              <InputGroupAddon align="inline-end">
                <DatePickerTrigger />
              </InputGroupAddon>
            </InputGroup>
            <DatePickerContent />
          </>
        )}
      </DatePickerContext.Provider>
    </AriaDatePicker>
  );
}

/**
 * Range version of `DatePicker`: two segmented inputs (`slot="start"` /
 * `slot="end"`) and a `RangeCalendar`. With `granularity="month" | "year"`
 * the range runs from the start period's first day to the end period's last
 * day. Without `DatePickerContent` it's a plain range field. Custom children
 * must keep both inputs inside an `InputGroup` (a react-aria `Group`): the
 * picker moves focus between their segments through it.
 */
function DateRangePicker<T extends DateValue>({
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
}: Omit<AriaDateRangePickerProps<T>, "granularity" | "children" | "className"> & PickerExtraProps) {
  const constraints = useDateConstraints({
    granularity,
    minValue,
    maxValue,
    isDateUnavailable,
    unavailableRanges,
    placeholderValue,
  });
  const { period } = constraints;
  const [value, setValue] = useControlledValue<RangeValue<DateValue> | null>(
    valueProp,
    defaultValue,
    onChange as ((value: RangeValue<DateValue> | null) => void) | undefined,
  );
  const handleChange = (next: RangeValue<DateValue> | null) =>
    setValue(
      next && period !== "day"
        ? { start: periodStart(next.start, period), end: periodEnd(next.end, period) }
        : next,
    );

  const rootRef = React.useRef<HTMLDivElement>(null);
  const isEditing = useFocusWithin(rootRef);
  const dates = React.useMemo(() => (value ? [value.start, value.end] : []), [value]);
  useBlockedValueCorrection({
    dates,
    isEditing,
    isRange: true,
    period,
    minValue,
    maxValue,
    unavailableRanges,
    onClear: () => setValue(null),
    onCorrect: ([start, end = start]) => {
      if (start && end) setValue({ start, end });
    },
  });

  const calendarUnavailable = React.useMemo(
    () => isDateUnavailable && ((date: DateValue) => isDateUnavailable(date, null)),
    [isDateUnavailable],
  );
  const context = React.useMemo<DatePickerContextValue>(
    () => ({
      isRange: true,
      period,
      minValue,
      maxValue,
      isDateUnavailable: calendarUnavailable,
      unavailableRanges,
      rootRef,
    }),
    [period, minValue, maxValue, calendarUnavailable, unavailableRanges],
  );

  return (
    <AriaDateRangePicker
      {...(props as AriaDateRangePickerProps<DateValue>)}
      ref={rootRef}
      data-slot="date-range-picker"
      value={value ?? null}
      onChange={handleChange}
      granularity={constraints.granularity}
      minValue={constraints.minValue}
      maxValue={constraints.maxValue}
      isDateUnavailable={constraints.isDateUnavailable}
      placeholderValue={constraints.placeholderValue}
      className={cn("group/date-picker flex flex-col gap-2", className)}
    >
      <DatePickerContext.Provider value={context}>
        {children ?? (
          <>
            <InputGroup>
              <DateInput slot="start" />
              <span aria-hidden="true" className="text-muted-foreground">
                –
              </span>
              <DateInput slot="end" />
              <InputGroupAddon align="inline-end" className="ml-auto">
                <DatePickerTrigger />
              </InputGroupAddon>
            </InputGroup>
            <DatePickerContent />
          </>
        )}
      </DatePickerContext.Provider>
    </AriaDateRangePicker>
  );
}

/** Calendar button for an `InputGroupAddon`; react-aria labels and wires it. */
function DatePickerTrigger({ children, ...props }: React.ComponentProps<typeof InputGroupButton>) {
  useDatePickerContext("DatePickerTrigger");
  return (
    <InputGroupButton data-slot="date-picker-trigger" size="icon-xs" {...props}>
      {children ?? <CalendarIcon />}
    </InputGroupButton>
  );
}

/**
 * The calendar popover. Non-modal on purpose: a modal popover makes the rest
 * of the page inert, so the paired input couldn't be clicked or typed into
 * while the calendar is open. Interacting with the picker itself keeps it
 * open; anything else outside closes it, as do Escape and choosing a date.
 */
function DatePickerContent({
  className,
  placement = "bottom start",
  ...props
}: Omit<React.ComponentProps<typeof Popover>, "children">) {
  const context = useDatePickerContext("DatePickerContent");
  const state = React.useContext(OverlayTriggerStateContext);
  const dialogContext = React.useContext(DialogContext);
  // id/aria-labelledby react-aria prepared for the picker's dialog.
  const dialogProps =
    dialogContext && !("slots" in dialogContext)
      ? (dialogContext as React.HTMLAttributes<HTMLElement>)
      : {};
  // Our Popover doesn't take a ref; the dialog fills it (padding lives on the dialog).
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const { rootRef } = context;
  const isOpen = state?.isOpen ?? false;
  const close = state?.close;

  const isInsidePicker = React.useCallback(
    (target: EventTarget | null) =>
      target instanceof Node &&
      (!!rootRef.current?.contains(target) || !!dialogRef.current?.contains(target)),
    [rootRef],
  );

  // Non-modal popovers aren't dismissed by outside presses, so do it here.
  React.useEffect(() => {
    if (!isOpen || !close) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!isInsidePicker(event.target)) close();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [isOpen, close, isInsidePicker]);

  const calendarProps = {
    granularity: context.period,
    minValue: context.minValue,
    maxValue: context.maxValue,
    isDateUnavailable: context.isDateUnavailable,
    unavailableRanges: context.unavailableRanges,
    // The picker corrects blocked values itself, once its input loses focus.
    correctBlockedValue: false,
  };

  return (
    <Popover
      placement={placement}
      isNonModal
      shouldCloseOnInteractOutside={(element) => !isInsidePicker(element)}
      className={cn("w-auto overflow-auto p-0", className)}
      {...props}
    >
      {/* A plain role="dialog" instead of react-aria's <Dialog>: useDialog
          turns on the overlay's focus containment even in a non-modal
          popover, which would yank focus back from the input. */}
      <div
        ref={dialogRef}
        role="dialog"
        id={dialogProps.id}
        aria-labelledby={dialogProps["aria-labelledby"]}
        aria-label={dialogProps["aria-label"]}
        className="p-1 outline-none"
      >
        {context.isRange ? <RangeCalendar {...calendarProps} /> : <Calendar {...calendarProps} />}
      </div>
    </Popover>
  );
}

export { DatePicker, DatePickerContent, DatePickerTrigger, DateRangePicker };
