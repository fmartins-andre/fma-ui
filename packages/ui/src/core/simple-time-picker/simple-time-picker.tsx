"use client";

import { Time } from "@internationalized/date";
import { cn } from "cn";
import { CheckIcon, ChevronDownIcon, ClockIcon } from "lucide-react";
import * as React from "react";
import {
  Button,
  Dialog,
  DialogTrigger,
  type Key,
  ListBox,
  ListBoxItem,
  Popover,
} from "react-aria-components";

type Granularity = "hour" | "minute" | "second";

type SimpleTimePickerProps = {
  /** The selected time (controlled). */
  value?: Time | null;
  /** The initial time (uncontrolled). */
  defaultValue?: Time | null;
  onChange?: (value: Time) => void;
  /** Earliest selectable time; picks before it are clamped to it. */
  minValue?: Time;
  /** Latest selectable time; picks after it are clamped to it. */
  maxValue?: Time;
  /** 12 shows an AM/PM column. Defaults to 24. */
  hourCycle?: 12 | 24;
  /** The smallest unit offered. Defaults to "minute". */
  granularity?: Granularity;
  isDisabled?: boolean;
  /** Names the trigger for assistive tech. Defaults to "Time". */
  "aria-label"?: string;
  className?: string;
};

type Option = { id: number; label: string; isDisabled: boolean };

const pad = (n: number) => n.toString().padStart(2, "0");
const outside = (start: Time, end: Time, min?: Time, max?: Time) =>
  (min !== undefined && end.compare(min) < 0) || (max !== undefined && start.compare(max) > 0);

function clamp(time: Time, min?: Time, max?: Time) {
  if (min && time.compare(min) < 0) return min;
  if (max && time.compare(max) > 0) return max;
  return time;
}

function format(time: Time | null, hourCycle: 12 | 24, granularity: Granularity) {
  const parts = (h: string, m: string, s: string) =>
    [h, m, s].slice(0, granularity === "hour" ? 1 : granularity === "minute" ? 2 : 3).join(":");
  if (!time) return parts("--", "--", "--");
  if (hourCycle === 24) return parts(pad(time.hour), pad(time.minute), pad(time.second));
  return `${parts(pad(time.hour % 12 || 12), pad(time.minute), pad(time.second))} ${time.hour < 12 ? "AM" : "PM"}`;
}

/**
 * A button showing the time that opens columns of hours, minutes, seconds and
 * AM/PM. Each column is a react-aria `ListBox`, so arrow keys, Home/End and
 * typing a number move within it and Tab moves between columns.
 */
function SimpleTimePicker({
  value: controlled,
  defaultValue = null,
  onChange,
  minValue,
  maxValue,
  hourCycle = 24,
  granularity = "minute",
  isDisabled,
  "aria-label": ariaLabel = "Time",
  className,
}: SimpleTimePickerProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const value = controlled === undefined ? uncontrolled : controlled;
  const time = value ?? clamp(new Time(0, 0), minValue, maxValue);
  const isPm = time.hour >= 12;

  const commit = (next: Time) => {
    const clamped = clamp(next, minValue, maxValue);
    setUncontrolled(clamped);
    onChange?.(clamped);
  };

  const hours: Option[] = Array.from({ length: hourCycle }, (_, i) => {
    const hour = hourCycle === 12 ? i + (isPm ? 12 : 0) : i;
    return {
      id: hour,
      label: pad(hourCycle === 12 ? hour % 12 || 12 : hour),
      isDisabled: outside(new Time(hour), new Time(hour, 59, 59), minValue, maxValue),
    };
  });
  const minutes: Option[] = Array.from({ length: 60 }, (_, minute) => ({
    id: minute,
    label: pad(minute),
    isDisabled: outside(
      new Time(time.hour, minute),
      new Time(time.hour, minute, 59),
      minValue,
      maxValue,
    ),
  }));
  const seconds: Option[] = Array.from({ length: 60 }, (_, second) => {
    const at = new Time(time.hour, time.minute, second);
    return { id: second, label: pad(second), isDisabled: outside(at, at, minValue, maxValue) };
  });
  const periods: Option[] = [
    {
      id: 0,
      label: "AM",
      isDisabled: outside(new Time(0), new Time(11, 59, 59), minValue, maxValue),
    },
    {
      id: 12,
      label: "PM",
      isDisabled: outside(new Time(12), new Time(23, 59, 59), minValue, maxValue),
    },
  ];

  return (
    <DialogTrigger>
      <Button
        data-slot="simple-time-picker"
        aria-label={`${ariaLabel}, ${format(value, hourCycle, granularity)}`}
        isDisabled={isDisabled}
        className={cn(
          "flex h-8 w-fit items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm tabular-nums outline-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-visible:border-ring data-focus-visible:ring-3 data-focus-visible:ring-ring/50 dark:bg-input/30",
          className,
        )}
      >
        <ClockIcon aria-hidden="true" className="size-4 text-muted-foreground" />
        <span className={cn(!value && "text-muted-foreground")}>
          {format(value, hourCycle, granularity)}
        </span>
        <ChevronDownIcon aria-hidden="true" className="size-4 opacity-50" />
      </Button>
      <Popover
        placement="bottom start"
        offset={4}
        className="z-50 rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none data-entering:animate-in data-entering:fade-in-0 data-entering:zoom-in-95 data-exiting:animate-out data-exiting:fade-out-0 data-exiting:zoom-out-95"
      >
        <Dialog aria-label={ariaLabel} className="flex h-56 max-h-[inherit] gap-1 p-1 outline-none">
          <TimeColumn
            label="Hours"
            options={hours}
            selected={time.hour}
            onSelect={(hour) => commit(time.set({ hour }))}
            autoFocus
          />
          {granularity !== "hour" && (
            <TimeColumn
              label="Minutes"
              options={minutes}
              selected={time.minute}
              onSelect={(minute) => commit(time.set({ minute }))}
            />
          )}
          {granularity === "second" && (
            <TimeColumn
              label="Seconds"
              options={seconds}
              selected={time.second}
              onSelect={(second) => commit(time.set({ second }))}
            />
          )}
          {hourCycle === 12 && (
            <TimeColumn
              label="AM/PM"
              options={periods}
              selected={isPm ? 12 : 0}
              onSelect={(period) => commit(time.set({ hour: (time.hour % 12) + period }))}
            />
          )}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

function TimeColumn({
  label,
  options,
  selected,
  onSelect,
  autoFocus,
}: {
  label: string;
  options: Option[];
  selected: number;
  onSelect: (value: number) => void;
  autoFocus?: boolean;
}) {
  // Start with the selected option centered. Set scrollTop directly (not
  // scrollIntoView) so only the column scrolls, and wait a frame for
  // react-aria to render the collection.
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const list = ref.current;
      const item = list?.querySelector<HTMLElement>("[aria-selected=true]");
      if (list && item)
        list.scrollTop = item.offsetTop - (list.clientHeight - item.offsetHeight) / 2;
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <ListBox
      ref={ref}
      aria-label={label}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[selected]}
      onSelectionChange={(keys) => {
        const [key] = keys as Set<Key>;
        if (key !== undefined) onSelect(Number(key));
      }}
      disabledKeys={options.filter((option) => option.isDisabled).map((option) => option.id)}
      autoFocus={autoFocus}
      items={options}
      className="relative flex h-full w-14 flex-col gap-0.5 overflow-y-auto outline-none"
    >
      {(option) => (
        <ListBoxItem
          textValue={option.label}
          className="flex h-8 shrink-0 cursor-default items-center gap-1 rounded-md px-1.5 text-sm tabular-nums outline-none data-disabled:opacity-40 data-focus-visible:ring-2 data-focus-visible:ring-ring/50 data-focused:bg-accent data-hovered:bg-accent data-selected:font-medium"
        >
          {({ isSelected }) => (
            <>
              <CheckIcon
                aria-hidden="true"
                className={cn("size-3.5 shrink-0", !isSelected && "invisible")}
              />
              {option.label}
            </>
          )}
        </ListBoxItem>
      )}
    </ListBox>
  );
}

export type { SimpleTimePickerProps };
export { SimpleTimePicker };
