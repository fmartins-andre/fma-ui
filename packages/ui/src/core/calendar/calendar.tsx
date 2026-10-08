"use client";

import {
  type CalendarDate,
  DateFormatter,
  endOfYear,
  isSameMonth,
  startOfYear,
  toCalendar,
  toCalendarDate,
  today,
} from "@internationalized/date";
import { cva } from "class-variance-authority";
import { cn } from "cn";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import {
  Calendar as AriaCalendar,
  CalendarGridHeader as AriaCalendarGridHeader,
  RangeCalendar as AriaRangeCalendar,
  CalendarCell,
  type CalendarCellRenderProps,
  CalendarGrid,
  CalendarGridBody,
  CalendarHeaderCell,
  CalendarHeading,
  CalendarMonthPicker,
  type CalendarProps,
  type CalendarState,
  CalendarStateContext,
  CalendarYearPicker,
  type DateValue,
  type RangeCalendarProps,
  type RangeCalendarState,
  RangeCalendarStateContext,
  useLocale,
} from "react-aria-components";
import { Button, buttonVariants } from "@/core/button/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/select/select";
import { useAvailableDateCorrection } from "@/hooks/use-available-date-correction";
import {
  type DateGranularity,
  isFullyUnavailable,
  isSamePeriod,
  type PeriodGranularity,
  periodBounds,
  periodEnd,
} from "@/lib/date-granularity";
import { createIsWithinAnyInterval } from "@/lib/interval-helpers";
import type { Interval } from "@/lib/types";

/**
 * What a selection represents. `"day"` is the regular day grid; `"month"` and
 * `"year"` replace it with a month (3×4) or year (3×4, one decade ± 1 year)
 * grid and commit the *period's first day* (`startOfMonth`/`startOfYear`).
 * In a `RangeCalendar` the committed `end` is the period's *last* day, so the
 * range stays inclusive (e.g. Mar–May → 03-01 … 05-31).
 */
type CalendarGranularity = DateGranularity;
type PeriodView = PeriodGranularity;

// Views from the most detailed to the least. A calendar only offers the views
// at or above its granularity: day → [day, month, year], month → [month, year].
const VIEW_ORDER: readonly CalendarGranularity[] = ["day", "month", "year"];
const PERIOD_COLUMNS = 3;
const NEVER_UNAVAILABLE = () => false;
const CELL_FOCUS_TARGET = '[role="gridcell"] [tabindex="0"]';

type AnyCalendarState = CalendarState<"single" | "multiple"> | RangeCalendarState;
type ButtonVariant = React.ComponentProps<typeof Button>["variant"];
type RenderCell = (
  renderProps: CalendarCellRenderProps & { defaultChildren: React.ReactNode },
) => React.ReactNode;

interface CalendarExtraProps {
  buttonVariant?: ButtonVariant;
  /**
   * Day view header. `"grid"` (default) renders the month and the year as
   * buttons that open the month/year grids; `"label"` is a static heading;
   * `"dropdown"` uses month/year selects.
   */
  captionLayout?: "label" | "dropdown" | "grid";
  numberOfMonths?: number;
  showWeekNumber?: boolean;
  headerFormat?: Intl.DateTimeFormatOptions;
  renderCell?: RenderCell;
  granularity?: CalendarGranularity;
  /**
   * Inclusive from/to spans that can't be picked (e.g. already-booked days),
   * on top of `minValue`/`maxValue` and `isDateUnavailable`. A committed value
   * that becomes blocked later travels to the nearest available date (or is
   * cleared when none is left) — see `useAvailableDateCorrection`.
   */
  unavailableRanges?: Interval<DateValue>[];
  /** Always render 6 week rows, so the height doesn't change between months. */
  fixedWeeks?: boolean;
  /**
   * Travel/clear a selected value that becomes blocked (default `true`). Turn
   * off when another component owns that correction — e.g. `DatePicker`,
   * which defers it until its field loses focus so typing isn't interrupted.
   */
  correctBlockedValue?: boolean;
}

const ROOT_CLASSES =
  "group/calendar w-fit bg-background p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent";

const cellVariants = cva(
  "group/day relative mt-2 aspect-square h-full w-full cursor-default rounded-(--cell-radius) p-0 text-center select-none [&:is(:last-child>[data-selected=true])>div]:rounded-r-(--cell-radius)",
  {
    variants: {
      showWeekNumber: {
        false: "[&:is(:first-child>[data-selected=true])>div]:rounded-l-(--cell-radius)",
        true: "[&:is(:nth-child(2)>[data-selected=true])>div]:rounded-l-(--cell-radius)",
      },
      isToday: {
        true: "rounded-(--cell-radius) bg-accent text-accent-foreground data-[selected=true]:rounded-none",
      },
      isSelectionStart: {
        true: "relative isolate z-0 rounded-l-(--cell-radius) bg-accent after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-accent",
      },
      isSelectionEnd: {
        true: "relative isolate z-0 rounded-r-(--cell-radius) bg-accent after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-accent",
      },
      isUnavailable: {
        true: "text-muted-foreground opacity-50 [&>div]:line-through",
      },
      isDisabled: {
        true: "text-muted-foreground opacity-50",
      },
      isOutsideMonth: {
        true: "text-muted-foreground aria-selected:text-muted-foreground",
      },
    },
  },
);

// Month/year cells mirror the day cells' look: solid endpoints, accent middle
// span (square, so a range reads as one band per row), accent "today" and hover.
const PERIOD_CELL_CLASSES = cn(
  buttonVariants({ variant: "ghost" }),
  // bg-clip-border: buttonVariants clips the fill inside its transparent
  // border, which would leave 1px seams along a range band.
  "h-full min-h-(--cell-size) w-full rounded-(--cell-radius) bg-clip-border px-1 font-normal",
  "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground",
  "data-[today=true]:bg-accent data-[today=true]:text-accent-foreground data-[outside=true]:text-muted-foreground",
  "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
  "data-[unavailable=true]:pointer-events-none data-[unavailable=true]:line-through data-[unavailable=true]:opacity-50",
  "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
  "data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground",
  "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-start=true]:not-data-[range-end=true]:rounded-e-none",
  "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-end=true]:not-data-[range-start=true]:rounded-s-none",
  // A band wrapping to the next row keeps the outer corners rounded.
  "[td:first-child>&]:rounded-s-(--cell-radius)! [td:last-child>&]:rounded-e-(--cell-radius)!",
);

function navButtonClasses(variant: ButtonVariant) {
  return cn(
    buttonVariants({ variant }),
    "size-(--cell-size) p-0 select-none disabled:opacity-50 aria-disabled:opacity-50",
  );
}

function captionButtonClasses(variant: ButtonVariant) {
  return cn(buttonVariants({ variant, size: "sm" }), "h-(--cell-size) px-1.5 font-medium");
}

// Month/year granularity compares whole periods: `minValue` 2026-03-15 must
// still allow picking March, whose committed value is 2026-03-01.
function useGranularityBounds(
  granularity: CalendarGranularity,
  minValue: DateValue | null | undefined,
  maxValue: DateValue | null | undefined,
) {
  return React.useMemo(
    () => periodBounds(granularity, minValue, maxValue),
    [granularity, minValue, maxValue],
  );
}

// `isDateUnavailable` OR "inside one of `unavailableRanges`". Stays
// `undefined` when neither is set, so react-aria skips the check entirely.
function useUnavailablePredicate<A extends unknown[]>(
  isDateUnavailable: ((date: DateValue, ...rest: A) => boolean) | undefined,
  unavailableRanges: Interval<DateValue>[] | undefined,
) {
  return React.useMemo(() => {
    const isInRanges = createIsWithinAnyInterval(unavailableRanges);
    if (!isInRanges) return isDateUnavailable;
    if (!isDateUnavailable) return (date: DateValue) => isInRanges(date);
    return (date: DateValue, ...rest: A) => isDateUnavailable(date, ...rest) || isInRanges(date);
  }, [isDateUnavailable, unavailableRanges]);
}

function Calendar<T extends DateValue, M extends "single" | "multiple" = "single">({
  buttonVariant,
  captionLayout,
  numberOfMonths = 1,
  showWeekNumber,
  headerFormat,
  renderCell,
  granularity = "day",
  unavailableRanges,
  fixedWeeks = true,
  correctBlockedValue = true,
  minValue,
  maxValue,
  isDateUnavailable,
  className,
  ...props
}: Omit<CalendarProps<T, M>, "visibleDuration"> & CalendarExtraProps) {
  const bounds = useGranularityBounds(granularity, minValue, maxValue);
  const isUnavailable = useUnavailablePredicate(isDateUnavailable, unavailableRanges);

  return (
    <AriaCalendar
      {...props}
      data-slot="calendar"
      minValue={bounds.minValue}
      maxValue={bounds.maxValue}
      // Month/year cells evaluate unavailability per period (see PeriodGrid);
      // handing the day predicate to react-aria there would make it reject
      // the period's first day instead. An explicit "never" (not `undefined`)
      // also keeps a parent DatePicker's context predicate from leaking in.
      isDateUnavailable={granularity === "day" ? isUnavailable : NEVER_UNAVAILABLE}
      weeksInMonth={fixedWeeks ? 6 : undefined}
      visibleDuration={{ months: granularity === "day" ? numberOfMonths : 1 }}
      className={(renderProps) =>
        cn(ROOT_CLASSES, typeof className === "function" ? className(renderProps) : className)
      }
    >
      <CalendarInner
        buttonVariant={buttonVariant}
        captionLayout={captionLayout}
        numberOfMonths={numberOfMonths}
        showWeekNumber={showWeekNumber}
        headerFormat={headerFormat}
        renderCell={renderCell}
        granularity={granularity}
        isPeriodUnavailable={isUnavailable}
        correction={correctBlockedValue ? { minValue, maxValue, unavailableRanges } : null}
      />
    </AriaCalendar>
  );
}

function RangeCalendar<T extends DateValue>({
  buttonVariant,
  captionLayout,
  numberOfMonths = 1,
  showWeekNumber,
  headerFormat,
  renderCell,
  granularity = "day",
  unavailableRanges,
  fixedWeeks = true,
  correctBlockedValue = true,
  minValue,
  maxValue,
  isDateUnavailable,
  onChange,
  className,
  ...props
}: RangeCalendarProps<T> & CalendarExtraProps) {
  const bounds = useGranularityBounds(granularity, minValue, maxValue);
  const isUnavailable = useUnavailablePredicate(isDateUnavailable, unavailableRanges);
  const isPeriodUnavailable = React.useMemo(
    () => isUnavailable && ((date: DateValue) => isUnavailable(date, null)),
    [isUnavailable],
  );
  // react-aria commits the clicked period's first day as `end`; widen it to
  // the period's last day so the emitted range covers the whole period.
  const handleChange = React.useMemo<typeof onChange>(() => {
    if (!onChange || granularity === "day") return onChange;
    return (value) => onChange({ start: value.start, end: periodEnd(value.end, granularity) });
  }, [onChange, granularity]);

  return (
    <AriaRangeCalendar
      {...props}
      data-slot="calendar"
      onChange={handleChange}
      minValue={bounds.minValue}
      maxValue={bounds.maxValue}
      isDateUnavailable={granularity === "day" ? isUnavailable : NEVER_UNAVAILABLE}
      weeksInMonth={fixedWeeks ? 6 : undefined}
      visibleDuration={{ months: granularity === "day" ? numberOfMonths : 1 }}
      className={(renderProps) =>
        cn(ROOT_CLASSES, typeof className === "function" ? className(renderProps) : className)
      }
    >
      <CalendarInner
        buttonVariant={buttonVariant}
        captionLayout={captionLayout}
        numberOfMonths={numberOfMonths}
        showWeekNumber={showWeekNumber}
        headerFormat={headerFormat}
        renderCell={renderCell}
        granularity={granularity}
        isPeriodUnavailable={isPeriodUnavailable}
        correction={correctBlockedValue ? { minValue, maxValue, unavailableRanges } : null}
        isRange
      />
    </AriaRangeCalendar>
  );
}

interface CalendarInnerProps {
  buttonVariant?: ButtonVariant;
  captionLayout?: "label" | "dropdown" | "grid";
  numberOfMonths: number;
  showWeekNumber?: boolean;
  headerFormat?: Intl.DateTimeFormatOptions;
  renderCell?: RenderCell;
  granularity: CalendarGranularity;
  isPeriodUnavailable?: (date: DateValue) => boolean;
  correction: {
    minValue?: DateValue | null;
    maxValue?: DateValue | null;
    unavailableRanges?: Interval<DateValue>[];
  } | null;
  isRange?: boolean;
}

function CalendarInner(props: CalendarInnerProps) {
  const calendarState = React.useContext(CalendarStateContext);
  const rangeState = React.useContext(RangeCalendarStateContext);
  const state = props.isRange ? rangeState : calendarState;
  if (!state) return null;
  return <CalendarViews {...props} state={state} rangeState={props.isRange ? rangeState : null} />;
}

function getSelectedDates(value: AnyCalendarState["value"]): DateValue[] {
  if (!value) return [];
  if ("start" in value) return [value.start, value.end];
  if ("calendar" in value) return [value];
  return value.filter((date): date is CalendarDate => date !== null);
}

// The page (range of dates) a granularity's selection view currently shows.
function getVisiblePage(state: AnyCalendarState, granularity: CalendarGranularity) {
  if (granularity === "day") return state.visibleRange;
  const { focusedDate } = state;
  if (granularity === "month") {
    return { start: startOfYear(focusedDate), end: endOfYear(focusedDate) };
  }
  const decadeStart = focusedDate.year - (focusedDate.year % 10);
  return {
    start: startOfYear(focusedDate.set({ year: decadeStart - 1 })),
    end: endOfYear(focusedDate.set({ year: decadeStart + 10 })),
  };
}

function CalendarViews({
  state,
  rangeState,
  granularity,
  captionLayout = "grid",
  buttonVariant = "ghost",
  numberOfMonths,
  showWeekNumber = false,
  headerFormat,
  renderCell,
  isPeriodUnavailable,
  correction,
  isRange,
}: CalendarInnerProps & { state: AnyCalendarState; rangeState: RangeCalendarState | null }) {
  const views = VIEW_ORDER.slice(VIEW_ORDER.indexOf(granularity));
  const [view, setView] = React.useState<CalendarGranularity>(granularity);
  const [prevGranularity, setPrevGranularity] = React.useState(granularity);
  if (prevGranularity !== granularity) {
    setPrevGranularity(granularity);
    setView(granularity);
  }

  // Moving between views (or around a month/year grid with the keyboard)
  // hides the element that had focus, so the next commit hands focus to the
  // active view's focusable cell — the same roving-tabindex cell react-aria
  // uses for the day grid.
  const viewRefs = React.useRef<Partial<Record<CalendarGranularity, HTMLDivElement | null>>>({});
  const focusIntentRef = React.useRef(false);
  React.useLayoutEffect(() => {
    if (!focusIntentRef.current) return;
    focusIntentRef.current = false;
    viewRefs.current[view]?.querySelector<HTMLElement>(CELL_FOCUS_TARGET)?.focus();
  });

  const showView = (next: CalendarGranularity, focusedDate?: CalendarDate) => {
    if (focusedDate) state.setFocusedDate(focusedDate);
    focusIntentRef.current = true;
    setView(next);
  };

  const selectedDates = React.useMemo(() => getSelectedDates(state.value), [state.value]);

  // react-aria only derives the visible page from `value` on mount: a
  // controlled value changed from outside (e.g. typed into a paired input)
  // would leave the grid on the old page. Re-page only when none of the
  // selected dates is visible, so committing a range whose start sits on an
  // earlier page doesn't yank the view back to it.
  const valueKey = selectedDates.map(String).join("|");
  const prevValueKeyRef = React.useRef(valueKey);
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-page only when the selected dates change, not on every navigation
  React.useEffect(() => {
    if (prevValueKeyRef.current === valueKey) return;
    prevValueKeyRef.current = valueKey;
    const [first] = selectedDates;
    if (!first) return;
    const page = getVisiblePage(state, granularity);
    const isVisible = selectedDates.some(
      (date) => date.compare(page.start) >= 0 && date.compare(page.end) <= 0,
    );
    if (!isVisible) {
      state.setFocusedDate(toCalendar(toCalendarDate(first), state.focusedDate.calendar));
    }
  }, [valueKey]);

  useAvailableDateCorrection({
    // Travel/clear works on days; month/year values are validated per period.
    value: correction && granularity === "day" ? selectedDates : undefined,
    min: correction?.minValue ?? undefined,
    max: correction?.maxValue ?? undefined,
    unavailableRanges: correction?.unavailableRanges,
    // RangeCalendarState also carries the base state's `selectionMode: "single"`.
    selectionMode: rangeState
      ? "range"
      : "selectionMode" in state
        ? state.selectionMode
        : undefined,
    clearValue: () => state.setValue(null),
    setValue: (dates) => {
      if (rangeState) {
        const [start, end = start] = dates;
        if (start && end) rangeState.setValue({ start, end });
        return;
      }
      if (!("selectionMode" in state)) return;
      const days = dates.map((date) => toCalendarDate(date));
      state.setValue(state.selectionMode === "multiple" ? days : (days[0] ?? null));
    },
  });

  const handlePeriodPick = (period: PeriodView, date: CalendarDate) => {
    if (period === granularity) {
      state.setFocusedDate(date);
      state.selectDate(date);
      return;
    }
    // Navigation only: keep the focused day/month and move to the picked
    // period, one level down (year → month → day).
    const { focusedDate } = state;
    const next =
      period === "year"
        ? date.set({ month: focusedDate.month, day: focusedDate.day })
        : date.set({ day: focusedDate.day });
    showView(period === "year" ? "month" : "day", next);
  };

  const backToGranularity = view === granularity ? undefined : () => showView(granularity);

  return (
    <div className="grid">
      {views.map((v) => (
        <div
          key={v}
          ref={(el) => {
            viewRefs.current[v] = el;
          }}
          data-view={v}
          // All views share one grid cell, so the container keeps the size of
          // the largest and switching never shifts layout. Hidden with
          // opacity (+ inert/aria-hidden), not `visibility`: the cells'
          // `transition-all` interpolates the inherited `visibility`, which
          // keeps them `hidden` for the first frame and makes focusing the
          // newly shown view fail.
          inert={v !== view}
          aria-hidden={v !== view || undefined}
          className={cn(
            "col-start-1 row-start-1 min-w-0 transition-opacity duration-150",
            v !== view && "pointer-events-none opacity-0",
          )}
        >
          {v === "day" ? (
            <DayView
              captionLayout={captionLayout}
              buttonVariant={buttonVariant}
              numberOfMonths={numberOfMonths}
              showWeekNumber={showWeekNumber}
              headerFormat={headerFormat}
              renderCell={renderCell}
              isRange={isRange}
              state={state}
              onShowView={showView}
            />
          ) : (
            <PeriodGrid
              period={v}
              state={state}
              rangeState={rangeState}
              selectedDates={selectedDates}
              isSelectionView={v === granularity}
              isPeriodUnavailable={isPeriodUnavailable}
              buttonVariant={buttonVariant}
              onPick={(date) => handlePeriodPick(v, date)}
              onShowYears={v === "month" ? () => showView("year") : undefined}
              onEscape={backToGranularity}
              onKeyboardMove={() => {
                focusIntentRef.current = true;
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function formatDate(
  date: CalendarDate,
  locale: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
) {
  return new DateFormatter(locale, {
    ...options,
    calendar: date.calendar.identifier,
    timeZone,
  }).format(date.toDate(timeZone));
}

function DayView({
  captionLayout,
  buttonVariant,
  numberOfMonths,
  showWeekNumber,
  headerFormat,
  renderCell,
  isRange,
  state,
  onShowView,
}: {
  captionLayout: "label" | "dropdown" | "grid";
  buttonVariant: ButtonVariant;
  numberOfMonths: number;
  showWeekNumber: boolean;
  headerFormat?: Intl.DateTimeFormatOptions;
  renderCell?: RenderCell;
  isRange?: boolean;
  state: AnyCalendarState;
  onShowView: (view: CalendarGranularity, focusedDate?: CalendarDate) => void;
}) {
  const { locale } = useLocale();

  return (
    <div className="relative flex flex-col gap-4 md:flex-row">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex w-full items-center justify-between gap-1 *:pointer-events-auto">
        <Button variant={buttonVariant} slot="previous" className={navButtonClasses(buttonVariant)}>
          <ChevronLeftIcon className="size-4 rtl:rotate-180" />
        </Button>
        <Button variant={buttonVariant} slot="next" className={navButtonClasses(buttonVariant)}>
          <ChevronRightIcon className="size-4 rtl:rotate-180" />
        </Button>
      </header>
      {Array.from({ length: numberOfMonths }, (_, i) => {
        const panelMonth = state.visibleRange.start.add({ months: i });
        // Opening a grid from panel `i` keeps the focused day when it's
        // already in that panel's month, otherwise starts from the panel.
        const panelFocus = isSameMonth(state.focusedDate, panelMonth)
          ? state.focusedDate
          : panelMonth;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length sequential month offsets, i IS the identity
          <div key={i} className="flex w-full flex-col gap-4">
            <div className="flex h-(--cell-size) w-full items-center justify-center gap-1 px-(--cell-size)">
              {captionLayout === "dropdown" ? (
                <>
                  <MonthDropdown format={headerFormat} />
                  <YearDropdown format={headerFormat} />
                </>
              ) : captionLayout === "grid" ? (
                <>
                  <button
                    type="button"
                    aria-label="Choose month"
                    className={captionButtonClasses(buttonVariant)}
                    onClick={() => onShowView("month", panelFocus)}
                  >
                    {formatDate(panelMonth, locale, state.timeZone, {
                      month: headerFormat?.month ?? "long",
                    })}
                  </button>
                  <button
                    type="button"
                    aria-label="Choose year"
                    className={captionButtonClasses(buttonVariant)}
                    onClick={() => onShowView("year", panelFocus)}
                  >
                    {formatDate(panelMonth, locale, state.timeZone, {
                      year: headerFormat?.year ?? "numeric",
                    })}
                  </button>
                </>
              ) : (
                <CalendarHeading
                  offset={{ months: i }}
                  format={headerFormat}
                  className="text-sm font-medium select-none"
                />
              )}
            </div>
            <CalendarGrid className="w-full border-collapse" offset={{ months: i }}>
              <AriaCalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="rounded-(--cell-radius) text-[0.8rem] font-normal text-muted-foreground select-none">
                    {day}
                  </CalendarHeaderCell>
                )}
              </AriaCalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell
                    date={date}
                    className={(renderProps) => cellVariants({ ...renderProps, showWeekNumber })}
                  >
                    {(renderProps) => (
                      <div
                        data-selected-single={renderProps.isSelected && !isRange}
                        data-range-start={renderProps.isSelectionStart && isRange}
                        data-range-end={renderProps.isSelectionEnd && isRange}
                        data-range-middle={
                          renderProps.isSelected &&
                          !renderProps.isSelectionStart &&
                          !renderProps.isSelectionEnd &&
                          isRange
                        }
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon" }),
                          "relative isolate z-10 flex aspect-square h-full w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground [&>span]:text-xs [&>span]:opacity-70",
                        )}
                      >
                        {renderCell ? renderCell(renderProps) : renderProps.defaultChildren}
                      </div>
                    )}
                  </CalendarCell>
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </div>
        );
      })}
    </div>
  );
}

interface PeriodCell {
  date: CalendarDate;
  label: string;
  fullLabel: string;
  isFocused: boolean;
  isOutside: boolean;
  isToday: boolean;
  isDisabled: boolean;
  isUnavailable: boolean;
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
}

// Month (3×4 for the focused year) or year (3×4 for the focused decade ± 1
// year, outer years muted) grid. Selection, range anchor/preview and focus all
// go through the react-aria calendar state, so `value`/`onChange`, read-only,
// min/max and the range's hover preview behave exactly like the day grid.
function PeriodGrid({
  period,
  state,
  rangeState,
  selectedDates,
  isSelectionView,
  isPeriodUnavailable,
  buttonVariant,
  onPick,
  onShowYears,
  onEscape,
  onKeyboardMove,
}: {
  period: PeriodView;
  state: AnyCalendarState;
  rangeState: RangeCalendarState | null;
  selectedDates: DateValue[];
  isSelectionView: boolean;
  isPeriodUnavailable?: (date: DateValue) => boolean;
  buttonVariant: ButtonVariant;
  onPick: (date: CalendarDate) => void;
  onShowYears?: () => void;
  onEscape?: () => void;
  onKeyboardMove: () => void;
}) {
  const { locale, direction } = useLocale();
  const { focusedDate, minValue, maxValue, timeZone } = state;
  const todayDate = today(timeZone);
  const range = rangeState?.highlightedRange ?? null;
  const decadeStart = focusedDate.year - (focusedDate.year % 10);
  const firstCell =
    period === "month"
      ? startOfYear(focusedDate)
      : startOfYear(focusedDate.set({ year: decadeStart - 1 }));
  const cellCount =
    period === "month" ? focusedDate.calendar.getMonthsInYear(focusedDate) : PERIOD_COLUMNS * 4;
  const step = (n: number) => (period === "month" ? { months: n } : { years: n });
  const page = period === "month" ? { years: 1 } : { years: 10 };

  const isOutOfBounds = (start: CalendarDate, end: CalendarDate) =>
    (minValue != null && end.compare(minValue) < 0) ||
    (maxValue != null && start.compare(maxValue) > 0);

  const cells: PeriodCell[] = Array.from({ length: cellCount }, (_, i) => {
    const date = firstCell.add(step(i));
    const end = periodEnd(date, period);
    const isDisabled = state.isDisabled || isOutOfBounds(date, end);
    const isUnavailable =
      isSelectionView &&
      !isDisabled &&
      !!isPeriodUnavailable &&
      isFullyUnavailable(date, end, isPeriodUnavailable);
    const isPickable = !isDisabled && !isUnavailable;
    const inRange =
      isPickable && !!range && date.compare(range.end) <= 0 && end.compare(range.start) >= 0;
    return {
      date,
      label: formatDate(
        date,
        locale,
        timeZone,
        period === "month" ? { month: "short" } : { year: "numeric" },
      ),
      fullLabel: formatDate(
        date,
        locale,
        timeZone,
        period === "month" ? { month: "long", year: "numeric" } : { year: "numeric" },
      ),
      isFocused: isSamePeriod(date, focusedDate, period),
      isOutside: period === "year" && (date.year < decadeStart || date.year > decadeStart + 9),
      isToday: isSamePeriod(date, todayDate, period),
      isDisabled,
      isUnavailable,
      isSelected: rangeState
        ? inRange
        : isPickable && selectedDates.some((value) => isSamePeriod(value, date, period)),
      isRangeStart: inRange && !!range && isSamePeriod(range.start, date, period),
      isRangeEnd: inRange && !!range && isSamePeriod(range.end, date, period),
    };
  });
  const rows = Array.from({ length: Math.ceil(cells.length / PERIOD_COLUMNS) }, (_, row) =>
    cells.slice(row * PERIOD_COLUMNS, (row + 1) * PERIOD_COLUMNS),
  );

  const prevPageLast = periodEnd(firstCell.subtract(step(1)), period);
  const nextPageFirst = firstCell.add(step(cellCount));
  const isPrevDisabled =
    state.isDisabled || (minValue != null && prevPageLast.compare(minValue) < 0);
  const isNextDisabled =
    state.isDisabled || (maxValue != null && nextPageFirst.compare(maxValue) > 0);

  const pageLabel =
    period === "month"
      ? formatDate(focusedDate, locale, timeZone, { year: "numeric" })
      : `${decadeStart} – ${decadeStart + 9}`;

  const moveFocus = (date: CalendarDate) => {
    onKeyboardMove();
    state.setFocusedDate(date);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const forward = direction === "rtl" ? -1 : 1;
    switch (event.key) {
      case "ArrowLeft":
        moveFocus(focusedDate.subtract(step(forward)));
        break;
      case "ArrowRight":
        moveFocus(focusedDate.add(step(forward)));
        break;
      case "ArrowUp":
        moveFocus(focusedDate.subtract(step(PERIOD_COLUMNS)));
        break;
      case "ArrowDown":
        moveFocus(focusedDate.add(step(PERIOD_COLUMNS)));
        break;
      case "Home":
        moveFocus(firstCell.set({ day: focusedDate.day }));
        break;
      case "End":
        moveFocus(firstCell.add(step(cellCount - 1)).set({ day: focusedDate.day }));
        break;
      case "PageUp":
        moveFocus(focusedDate.subtract(page));
        break;
      case "PageDown":
        moveFocus(focusedDate.add(page));
        break;
      case "Escape":
        if (!onEscape) return;
        onEscape();
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex h-(--cell-size) items-center justify-between gap-1">
        <button
          type="button"
          aria-label={period === "month" ? "Previous year" : "Previous decade"}
          disabled={isPrevDisabled}
          className={navButtonClasses(buttonVariant)}
          onClick={() => state.setFocusedDate(focusedDate.subtract(page))}
        >
          <ChevronLeftIcon className="size-4 rtl:rotate-180" />
        </button>
        {onShowYears ? (
          <button
            type="button"
            aria-label="Choose year"
            aria-live="polite"
            className={captionButtonClasses(buttonVariant)}
            onClick={onShowYears}
          >
            {pageLabel}
          </button>
        ) : (
          <span aria-live="polite" className="text-sm font-medium tabular-nums select-none">
            {pageLabel}
          </span>
        )}
        <button
          type="button"
          aria-label={period === "month" ? "Next year" : "Next decade"}
          disabled={isNextDisabled}
          className={navButtonClasses(buttonVariant)}
          onClick={() => state.setFocusedDate(focusedDate.add(page))}
        >
          <ChevronRightIcon className="size-4 rtl:rotate-180" />
        </button>
      </div>
      {/* ARIA grid pattern (roving tabindex + arrow keys), like react-aria's day grid table. */}
      <table
        // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: ARIA grid pattern
        role="grid"
        aria-label={pageLabel}
        aria-readonly={state.isReadOnly || undefined}
        data-slot="calendar-period-grid"
        data-period={period}
        className="h-full w-full min-w-[calc(var(--cell-size)*7)] flex-1 border-collapse"
        onKeyDown={handleKeyDown}
      >
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]?.date.toString()}>
              {row.map((cell) => {
                const isBlocked = cell.isDisabled || cell.isUnavailable;
                const isRangeMiddle = cell.isSelected && !cell.isRangeStart && !cell.isRangeEnd;
                return (
                  <td
                    key={cell.date.toString()}
                    // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: ARIA grid pattern
                    role="gridcell"
                    aria-selected={cell.isSelected || undefined}
                    aria-disabled={isBlocked || undefined}
                    className="p-0 py-1"
                  >
                    <button
                      type="button"
                      tabIndex={cell.isFocused ? 0 : -1}
                      aria-label={cell.fullLabel}
                      aria-disabled={isBlocked || undefined}
                      data-today={cell.isToday || undefined}
                      data-outside={cell.isOutside || undefined}
                      data-disabled={cell.isDisabled || undefined}
                      data-unavailable={cell.isUnavailable || undefined}
                      data-selected={(cell.isSelected && !rangeState) || undefined}
                      data-range-start={(rangeState && cell.isRangeStart) || undefined}
                      data-range-end={(rangeState && cell.isRangeEnd) || undefined}
                      data-range-middle={(rangeState && isRangeMiddle) || undefined}
                      className={PERIOD_CELL_CLASSES}
                      onClick={() => {
                        if (!isBlocked) onPick(cell.date);
                      }}
                      onMouseEnter={() => {
                        if (isSelectionView && !isBlocked) rangeState?.highlightDate(cell.date);
                      }}
                    >
                      {cell.label}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MonthDropdown({ format }: { format?: Intl.DateTimeFormatOptions }) {
  return (
    <CalendarMonthPicker format={format?.month}>
      {(props) => (
        <Select {...props} className="relative">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-0">
            <SelectGroup>
              {props.items.map((item) => (
                <SelectItem key={item.id} id={item.id}>
                  {item.formatted}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    </CalendarMonthPicker>
  );
}

function YearDropdown({ format }: { format?: Intl.DateTimeFormatOptions }) {
  return (
    <CalendarYearPicker format={format}>
      {(props) => (
        <Select {...props} className="relative">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-0">
            {props.items.map((item) => (
              <SelectItem key={item.id} id={item.id}>
                {item.formatted}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </CalendarYearPicker>
  );
}

export type { CalendarGranularity };
export { Calendar, RangeCalendar };
