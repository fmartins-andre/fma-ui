import { cn } from "cn";
import * as React from "react";
import {
  SliderFill,
  SliderOutput,
  Slider as SliderPrimitive,
  type SliderProps as SliderPrimitiveProps,
  type SliderState,
  SliderThumb,
  SliderTrack,
} from "react-aria-components";
import { Label } from "@/core/label/label";

type SliderValue = number | number[];

type SliderMark = number | { value: number; label?: React.ReactNode };

type SliderProps<T extends SliderValue = SliderValue> = Omit<
  SliderPrimitiveProps<T>,
  "className" | "children"
> & {
  className?: string;
  /** Visible label above the track; names the slider. */
  label?: React.ReactNode;
  /** Shows the current value (or range) next to the label. */
  showValue?: boolean;
  /**
   * Formats the value shown by `showValue` ("200 notas"). Without it, and for
   * marks without a `label`, `formatOptions` applies; that is also what screen
   * readers announce.
   */
  formatValue?: (value: number) => React.ReactNode;
  /**
   * Labelled stops under the track. Clicking one moves the nearest thumb
   * there; the keyboard keeps using the thumb.
   */
  marks?: SliderMark[];
  /**
   * A cap below `maxValue`: the scale and the marks still run to `maxValue`,
   * but the value stops here (dragging, keys and marks above it), and the part
   * of the track above it is drawn as unavailable. Say why in `description`.
   */
  limit?: number;
  /** Text under the track ("Only 20 left"); screen readers read it with the value. */
  description?: React.ReactNode;
};

const toMark = (mark: SliderMark) => (typeof mark === "number" ? { value: mark } : mark);

function clampTo<T extends SliderValue>(value: T, limit: number): T {
  return (
    Array.isArray(value) ? value.map((item) => Math.min(item, limit)) : Math.min(value, limit)
  ) as T;
}

const sameValue = (a: SliderValue, b: SliderValue) =>
  Array.isArray(a) && Array.isArray(b)
    ? a.length === b.length && a.every((item, index) => item === b[index])
    : a === b;

/** Moves the thumb closest to `value` there, reporting it as a finished change; returns its index. */
function moveNearestThumb(state: SliderState, value: number) {
  let nearest = 0;
  state.values.forEach((current, index) => {
    const best = state.values[nearest] ?? current;
    if (Math.abs(current - value) < Math.abs(best - value)) nearest = index;
  });
  state.setThumbDragging(nearest, true);
  state.setThumbValue(nearest, value);
  state.setThumbDragging(nearest, false);
  return nearest;
}

function SliderMarks({
  marks,
  state,
  limit,
}: {
  marks: SliderMark[];
  state: SliderState;
  limit?: number;
}) {
  return (
    <div
      data-slot="slider-marks"
      className="relative text-xs text-muted-foreground group-data-horizontal:h-5 group-data-horizontal:w-full group-data-vertical:min-w-8"
    >
      {marks.map(toMark).map(({ value, label }) => {
        const percent = state.getValuePercent(value) * 100;
        return (
          <button
            key={value}
            type="button"
            // The thumb is the keyboard path; marks are a pointer shortcut.
            tabIndex={-1}
            data-slot="slider-mark"
            disabled={state.isDisabled || (limit !== undefined && value > limit)}
            // Hand focus to the moved thumb, so the arrow keys pick up from there.
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              const index = moveNearestThumb(state, value);
              event.currentTarget
                .closest("[data-slot=slider]")
                ?.querySelectorAll<HTMLInputElement>("input[type=range]")
                [index]?.focus();
            }}
            style={
              state.orientation === "vertical" ? { bottom: `${percent}%` } : { left: `${percent}%` }
            }
            className={cn(
              "absolute rounded-sm px-1 whitespace-nowrap tabular-nums transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
              "group-data-horizontal:top-0 group-data-vertical:left-0",
              percent <= 0
                ? "group-data-horizontal:-translate-x-1 group-data-vertical:translate-y-0"
                : percent >= 100
                  ? "group-data-horizontal:-translate-x-[calc(100%-0.25rem)] group-data-vertical:translate-y-full"
                  : "group-data-horizontal:-translate-x-1/2 group-data-vertical:translate-y-1/2",
            )}
          >
            {label ?? state.getFormattedValue(value)}
          </button>
        );
      })}
    </div>
  );
}

function Slider<T extends SliderValue = SliderValue>({
  className,
  label,
  showValue = false,
  formatValue,
  marks,
  limit,
  description,
  ...props
}: SliderProps<T>) {
  const descriptionId = React.useId();
  const [uncontrolled, setUncontrolled] = React.useState(props.defaultValue);

  // With a limit the value is held here, so a change past it can be pulled back.
  let limitProps: Partial<SliderPrimitiveProps<T>> = {};
  if (limit !== undefined) {
    const { value, onChange, onChangeEnd } = props;
    const current = clampTo(value ?? uncontrolled ?? ((props.minValue ?? 0) as T), limit);
    limitProps = {
      defaultValue: undefined,
      value: current,
      onChange: (next) => {
        const clamped = clampTo(next, limit);
        if (sameValue(clamped, current)) return;
        if (value === undefined) setUncontrolled(clamped);
        onChange?.(clamped);
      },
      onChangeEnd: onChangeEnd && ((next) => onChangeEnd(clampTo(next, limit))),
    };
  }

  return (
    <SliderPrimitive
      className={cn(
        "group flex w-full touch-none flex-col gap-2 select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto",
        className,
      )}
      data-slot="slider"
      {...props}
      {...limitProps}
      aria-describedby={
        cn(props["aria-describedby"], description != null && descriptionId) || undefined
      }
    >
      {({ state }) => {
        const format = formatValue ?? ((value: number) => state.getFormattedValue(value));
        const limitPercent =
          limit !== undefined && limit < (props.maxValue ?? 100)
            ? state.getValuePercent(limit) * 100
            : undefined;
        return (
          <>
            {(label || showValue) && (
              <div data-slot="slider-header" className="flex items-center justify-between gap-3">
                {label && <Label>{label}</Label>}
                {showValue && (
                  <SliderOutput
                    data-slot="slider-value"
                    className="ml-auto text-sm text-muted-foreground tabular-nums"
                  >
                    {state.values.map((value, index) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: one entry per thumb, in thumb order
                      <span key={index}>
                        {index > 0 && " – "}
                        {format(value)}
                      </span>
                    ))}
                  </SliderOutput>
                )}
              </div>
            )}
            <div className="flex flex-col gap-2 group-data-vertical:flex-1 group-data-vertical:flex-row">
              <div
                data-slot="slider-control"
                className="relative flex w-full items-center group-data-vertical:h-full group-data-vertical:w-auto group-data-vertical:flex-col"
              >
                <SliderTrack
                  data-slot="slider-track"
                  className="relative grow overflow-hidden rounded-full bg-muted select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
                >
                  <SliderFill
                    data-slot="slider-range"
                    className="absolute bg-primary select-none data-horizontal:h-full data-vertical:w-full"
                  />
                  {limitPercent !== undefined && (
                    <div
                      aria-hidden="true"
                      data-slot="slider-unavailable"
                      style={
                        state.orientation === "vertical"
                          ? { bottom: `${limitPercent}%` }
                          : { left: `${limitPercent}%` }
                      }
                      className="absolute bg-[repeating-linear-gradient(90deg,var(--muted-foreground)_0_2px,transparent_2px_5px)] opacity-40 group-data-horizontal:inset-y-0 group-data-horizontal:right-0 group-data-vertical:inset-x-0 group-data-vertical:top-0 group-data-vertical:bg-[repeating-linear-gradient(0deg,var(--muted-foreground)_0_2px,transparent_2px_5px)]"
                    />
                  )}
                </SliderTrack>
                {limitPercent !== undefined && (
                  <span
                    aria-hidden="true"
                    data-slot="slider-limit"
                    style={
                      state.orientation === "vertical"
                        ? { bottom: `${limitPercent}%` }
                        : { left: `${limitPercent}%` }
                    }
                    className="absolute rounded-full bg-muted-foreground/60 group-data-horizontal:h-3 group-data-horizontal:w-0.5 group-data-horizontal:-translate-x-1/2 group-data-vertical:h-0.5 group-data-vertical:w-3 group-data-vertical:translate-y-1/2"
                  />
                )}
                {state.values.map((_, index) => (
                  <SliderThumb
                    data-slot="slider-thumb"
                    // biome-ignore lint/suspicious/noArrayIndexKey: index IS the thumb's positional identity (also passed as the `index` prop below)
                    key={index}
                    index={index}
                    className="relative block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none group-data-horizontal:top-[50%] group-data-vertical:left-[50%] after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
                  />
                ))}
              </div>
              {marks && marks.length > 0 && (
                <SliderMarks marks={marks} state={state} limit={limit} />
              )}
            </div>
            {description != null && (
              <p
                id={descriptionId}
                data-slot="slider-description"
                className="text-sm text-muted-foreground"
              >
                {description}
              </p>
            )}
          </>
        );
      }}
    </SliderPrimitive>
  );
}

export type { SliderMark, SliderProps };
export { Slider };
