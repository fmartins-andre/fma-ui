import { CalendarDate } from "@internationalized/date";
import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { type DateValue, I18nProvider, type RangeValue } from "react-aria-components";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import type { Interval } from "@/lib/types";
import { Calendar, RangeCalendar } from "./calendar";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  // Pinned so labels/assertions don't depend on the browser's locale.
  decorators: [
    (Story) => (
      <I18nProvider locale="en-US">
        <Story />
      </I18nProvider>
    ),
  ],
  argTypes: {
    captionLayout: { control: "select", options: ["grid", "label", "dropdown"] },
    granularity: { control: "radio", options: ["day", "month", "year"] },
    numberOfMonths: { control: "number" },
    fixedWeeks: { control: "boolean" },
  },
  args: {
    "aria-label": "Event date",
  },
  render: (args) => <CalendarWithValue {...args} />,
} satisfies Meta<typeof Calendar>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const MARCH_15 = new CalendarDate(2026, 3, 15);

function formatValue(value: DateValue | readonly (DateValue | null)[] | null | undefined) {
  if (!value) return "None";
  if ("calendar" in value) return String(value);
  return value.length > 0 ? value.map(String).join(", ") : "None";
}

function formatRange(range: RangeValue<DateValue> | null | undefined) {
  return range ? `${range.start} – ${range.end}` : "None";
}

// Visual reference for every story: the value the calendar currently holds.
function SelectedValue({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <span className="text-muted-foreground">Selected:</span>
      <output data-testid="value" className="font-mono">
        {children}
      </output>
    </div>
  );
}

function CalendarWithValue(props: React.ComponentProps<typeof Calendar>) {
  const [value, setValue] = React.useState(props.value ?? props.defaultValue ?? null);
  return (
    <div className="flex w-fit flex-col gap-2">
      <Calendar
        {...props}
        value={value}
        onChange={(next) => {
          setValue(next);
          props.onChange?.(next);
        }}
      />
      <SelectedValue>{formatValue(value)}</SelectedValue>
    </div>
  );
}

function RangeCalendarWithValue(props: React.ComponentProps<typeof RangeCalendar>) {
  const [value, setValue] = React.useState(props.value ?? props.defaultValue ?? null);
  return (
    <div className="flex w-fit flex-col gap-2">
      <RangeCalendar
        {...props}
        value={value}
        onChange={(next) => {
          setValue(next);
          props.onChange?.(next);
        }}
      />
      <SelectedValue>{formatRange(value)}</SelectedValue>
    </div>
  );
}

export const Default: Story = {};

export const LabelCaption: Story = {
  args: { captionLayout: "label" },
};

export const DropdownCaption: Story = {
  args: { captionLayout: "dropdown" },
};

export const TwoMonths: Story = {
  args: { numberOfMonths: 2 },
};

export const Range: Story = {
  render: () => <RangeCalendarWithValue aria-label="Trip dates" />,
};

export const MonthGranularity: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Picks a whole month: commits the month's first day. The header jumps to the year grid.",
      },
    },
  },
  args: { granularity: "month" },
};

export const YearGranularity: Story = {
  parameters: {
    docs: { description: { story: "Picks a whole year: commits January 1st." } },
  },
  args: { granularity: "year" },
};

export const MonthRange: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`RangeCalendar` with `granularity="month"`: the committed range runs from the first day of the start month to the last day of the end month.',
      },
    },
  },
  render: () => <RangeCalendarWithValue aria-label="Billing period" granularity="month" />,
};

export const UnavailableRanges: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`unavailableRanges` blocks inclusive spans (e.g. already-booked days) on top of `minValue`/`maxValue`.",
      },
    },
  },
  args: {
    defaultFocusedValue: MARCH_15,
    unavailableRanges: [
      { from: new CalendarDate(2026, 3, 10), to: new CalendarDate(2026, 3, 14) },
      { from: new CalendarDate(2026, 3, 23), to: new CalendarDate(2026, 3, 25) },
    ],
  },
};

export const Localized: Story = {
  parameters: {
    docs: { description: { story: "Labels follow the nearest `I18nProvider` locale." } },
  },
  render: (args) => (
    <I18nProvider locale="pt-BR">
      <CalendarWithValue {...args} aria-label="Data do evento" />
    </I18nProvider>
  ),
};

// ---------------------------------------------------------------------------
// Interaction tests

export const ShouldDrillDownFromYearToDay: Story = {
  name: "when picking a year then a month from the caption, should land on that month's days without committing",
  args: { defaultFocusedValue: MARCH_15, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Choose year" }));

    const yearGrid = await canvas.findByRole("grid", { name: "2020 – 2029" });
    await userEvent.click(within(yearGrid).getByRole("button", { name: "2028" }));

    const monthGrid = await canvas.findByRole("grid", { name: "2028" });
    await userEvent.click(within(monthGrid).getByRole("button", { name: "July 2028" }));

    await expect(canvas.getByRole("button", { name: "Choose month" })).toHaveTextContent("July");
    await expect(canvas.getByRole("button", { name: "Choose year" })).toHaveTextContent("2028");
    // The focused day (15) carries over and receives focus.
    await waitFor(() => expect(document.activeElement).toHaveTextContent(/^15$/));
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

export const ShouldReturnToDaysOnEscape: Story = {
  name: "when pressing Escape in the month grid, should return to the day grid",
  args: { defaultFocusedValue: MARCH_15 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Choose month" }));
    const monthGrid = await canvas.findByRole("grid", { name: "2026" });
    await waitFor(() =>
      expect(within(monthGrid).getByRole("button", { name: "March 2026" })).toHaveFocus(),
    );

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("grid", { name: "2026" })).toBeNull());
    await expect(canvas.getByRole("button", { name: "Choose month" })).toHaveTextContent("March");
  },
};

export const ShouldCommitMonthStart: Story = {
  name: "when granularity is month, clicking a month should commit its first day",
  args: { granularity: "month", defaultFocusedValue: MARCH_15, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const may = canvas.getByRole("button", { name: "May 2026" });
    await userEvent.click(may);

    await expect(args.onChange).toHaveBeenCalledWith(new CalendarDate(2026, 5, 1));
    await expect(may.closest("td")).toHaveAttribute("aria-selected", "true");
  },
};

export const ShouldDisableMonthsOutsideBounds: Story = {
  name: "when granularity is month, months entirely outside min/max should be disabled",
  args: {
    granularity: "month",
    defaultFocusedValue: MARCH_15,
    minValue: new CalendarDate(2026, 3, 15),
    maxValue: new CalendarDate(2026, 10, 5),
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "February 2026" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(canvas.getByRole("button", { name: "November 2026" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(canvas.getByRole("button", { name: "Previous year" })).toBeDisabled();

    // Partially-allowed months stay pickable at month level.
    await userEvent.click(canvas.getByRole("button", { name: "March 2026" }));
    await expect(args.onChange).toHaveBeenCalledWith(new CalendarDate(2026, 3, 1));
  },
};

export const ShouldNavigateMonthsWithKeyboard: Story = {
  name: "when granularity is month, arrow keys should move focus and Enter should commit",
  args: { granularity: "month", defaultFocusedValue: MARCH_15, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("button", { name: "March 2026" }).focus();

    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(canvas.getByRole("button", { name: "April 2026" })).toHaveFocus());
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(canvas.getByRole("button", { name: "July 2026" })).toHaveFocus());
    await userEvent.keyboard("{PageDown}");
    await waitFor(() => expect(canvas.getByRole("button", { name: "July 2027" })).toHaveFocus());

    await userEvent.keyboard("{Enter}");
    await expect(args.onChange).toHaveBeenCalledWith(new CalendarDate(2027, 7, 1));
  },
};

export const ShouldCommitYearStart: Story = {
  name: "when granularity is year, clicking a year should commit January 1st",
  args: { granularity: "year", defaultFocusedValue: MARCH_15, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Next decade" }));
    await userEvent.click(await canvas.findByRole("button", { name: "2031" }));
    await expect(args.onChange).toHaveBeenCalledWith(new CalendarDate(2031, 1, 1));
  },
};

const monthRangeChange = fn();

export const ShouldCommitMonthRangeWithPreview: Story = {
  name: "when granularity is month in a RangeCalendar, should preview on hover and commit whole months",
  render: () => (
    <RangeCalendarWithValue
      aria-label="Billing period"
      granularity="month"
      defaultFocusedValue={MARCH_15}
      onChange={monthRangeChange}
    />
  ),
  play: async ({ canvasElement }) => {
    monthRangeChange.mockClear();
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "March 2026" }));
    await userEvent.hover(canvas.getByRole("button", { name: "May 2026" }));

    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "April 2026" })).toHaveAttribute(
        "data-range-middle",
        "true",
      ),
    );
    await expect(monthRangeChange).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByRole("button", { name: "May 2026" }));
    await expect(monthRangeChange).toHaveBeenCalledWith({
      start: new CalendarDate(2026, 3, 1),
      end: new CalendarDate(2026, 5, 31),
    });
  },
};

export const ShouldBlockUnavailableDay: Story = {
  name: "when a day falls inside unavailableRanges, clicking it should not select it",
  args: {
    defaultFocusedValue: MARCH_15,
    unavailableRanges: [{ from: new CalendarDate(2026, 3, 10), to: new CalendarDate(2026, 3, 14) }],
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /March 12, 2026/ }));
    await expect(args.onChange).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByRole("button", { name: /March 16, 2026/ }));
    await expect(args.onChange).toHaveBeenCalledWith(new CalendarDate(2026, 3, 16));
  },
};

function ControlledCalendar({
  initialValue,
  minValue,
  maxValue,
  unavailableRanges,
  onChange,
  ignoreChanges,
}: {
  initialValue: DateValue | null;
  minValue?: DateValue;
  maxValue?: DateValue;
  unavailableRanges?: Interval<DateValue>[];
  onChange?: (value: DateValue) => void;
  ignoreChanges?: boolean;
}) {
  const [value, setValue] = React.useState(initialValue);
  return (
    <div className="flex w-fit flex-col gap-2">
      <Calendar<DateValue>
        aria-label="Event date"
        value={value}
        minValue={minValue}
        maxValue={maxValue}
        unavailableRanges={unavailableRanges}
        onChange={(next) => {
          onChange?.(next);
          if (!ignoreChanges) setValue(next);
        }}
      />
      <button type="button" onClick={() => setValue(new CalendarDate(2027, 8, 20))}>
        Set Aug 20, 2027
      </button>
      <SelectedValue>{formatValue(value)}</SelectedValue>
    </div>
  );
}

export const ShouldFollowControlledValue: Story = {
  name: "when a controlled value changes from outside, should page the grid to it",
  render: () => <ControlledCalendar initialValue={MARCH_15} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Set Aug 20, 2027" }));
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Choose month" })).toHaveTextContent("August"),
    );
    await expect(canvas.getByRole("button", { name: "Choose year" })).toHaveTextContent("2027");
  },
};

export const ShouldTravelToNearestAvailableDate: Story = {
  name: "when the selected value falls inside unavailableRanges, should travel to the nearest available date",
  render: () => (
    <ControlledCalendar
      initialValue={new CalendarDate(2026, 3, 12)}
      unavailableRanges={[
        { from: new CalendarDate(2026, 3, 10), to: new CalendarDate(2026, 3, 14) },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 03-09 and 03-15 are equally close; ties prefer the later date.
    await waitFor(() => expect(canvas.getByTestId("value")).toHaveTextContent("2026-03-15"));
  },
};

export const ShouldClearWhenNothingIsAvailable: Story = {
  name: "when min/max and unavailableRanges leave no date available, should clear the value",
  render: () => (
    <ControlledCalendar
      initialValue={new CalendarDate(2026, 3, 12)}
      minValue={new CalendarDate(2026, 3, 10)}
      maxValue={new CalendarDate(2026, 3, 14)}
      unavailableRanges={[
        { from: new CalendarDate(2026, 3, 10), to: new CalendarDate(2026, 3, 14) },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByTestId("value")).toHaveTextContent("None"));
  },
};

const ignoredChange = fn();

export const ShouldCorrectOnlyOnceWhenParentIgnoresIt: Story = {
  name: "when a controlled parent keeps the blocked value, correction should be attempted once",
  render: () => (
    <ControlledCalendar
      initialValue={new CalendarDate(2026, 3, 12)}
      unavailableRanges={[
        { from: new CalendarDate(2026, 3, 10), to: new CalendarDate(2026, 3, 14) },
      ]}
      onChange={ignoredChange}
      ignoreChanges
    />
  ),
  play: async () => {
    await waitFor(() => expect(ignoredChange).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 100));
    await expect(ignoredChange).toHaveBeenCalledTimes(1);
  },
  beforeEach: () => {
    ignoredChange.mockClear();
  },
};

function ControlledRangeCalendar({
  initialValue,
  unavailableRanges,
}: {
  initialValue: RangeValue<DateValue>;
  unavailableRanges: Interval<DateValue>[];
}) {
  const [value, setValue] = React.useState<RangeValue<DateValue> | null>(initialValue);
  return (
    <div className="flex w-fit flex-col gap-2">
      <RangeCalendar
        aria-label="Trip dates"
        value={value}
        onChange={setValue}
        unavailableRanges={unavailableRanges}
      />
      <SelectedValue>{formatRange(value)}</SelectedValue>
    </div>
  );
}

export const ShouldShrinkRangeSpanningUnavailableDays: Story = {
  name: "when a selected range spans unavailableRanges, should shrink it to the start's available window",
  render: () => (
    <ControlledRangeCalendar
      initialValue={{ start: new CalendarDate(2026, 3, 5), end: new CalendarDate(2026, 3, 20) }}
      unavailableRanges={[
        { from: new CalendarDate(2026, 3, 10), to: new CalendarDate(2026, 3, 12) },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("value")).toHaveTextContent("2026-03-05 – 2026-03-09"),
    );
  },
};
