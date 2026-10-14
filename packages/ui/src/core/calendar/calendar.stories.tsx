import { CalendarDate } from "@internationalized/date";
import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { type DateValue, I18nProvider, type RangeValue } from "react-aria-components";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Calendar, RangeCalendar } from "./calendar";
import meta from "./meta.json";

type Value = DateValue | RangeValue<DateValue> | readonly (DateValue | null)[] | null | undefined;

function formatValue(value: Value) {
  if (!value) return "None";
  if ("calendar" in value) return String(value);
  if ("start" in value) return `${value.start} – ${value.end}`;
  return value.length > 0 ? value.map(String).join(", ") : "None";
}

function ValueReadout({
  initial,
  children,
}: {
  initial: Value;
  children: (show: (value: Value) => void) => React.ReactNode;
}) {
  const [value, setValue] = React.useState(initial);
  return (
    <div className="flex w-fit flex-col gap-2">
      {children(setValue)}
      <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
        <span className="text-muted-foreground">Selected:</span>
        <output data-testid="value" className="font-mono">
          {formatValue(value)}
        </output>
      </div>
    </div>
  );
}

// Shows the value the calendar holds under it, for the eye and for the play
// functions. A decorator taps `onChange`, so each story's code stays the plain
// usage the docs show as its example.
const withSelectedValue: Decorator = (Story, context) => {
  const args = context.args as {
    value?: Value;
    defaultValue?: Value;
    onChange?: (value: Value) => void;
  };
  return (
    <ValueReadout initial={args.value ?? args.defaultValue}>
      {(show) => (
        <Story
          args={{
            ...context.args,
            onChange: (value: Value) => {
              show(value);
              args.onChange?.(value);
            },
          }}
        />
      )}
    </ValueReadout>
  );
};

const componentMeta = {
  title: "ui/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  decorators: [
    withSelectedValue,
    // Pinned so labels/assertions don't depend on the browser's locale.
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
} satisfies Meta<typeof Calendar>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

/** A `RangeCalendar` story: one meta per file, so it's typed on its own and cast. */
function rangeStory(story: StoryObj<typeof RangeCalendar>): Story {
  return story as Story;
}

const MARCH_15 = new CalendarDate(2026, 3, 15);

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

export const Range = rangeStory({
  args: { "aria-label": "Trip dates" },
  render: (args) => <RangeCalendar {...args} />,
});

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

export const MonthRange = rangeStory({
  args: { "aria-label": "Billing period", granularity: "month" },
  parameters: {
    docs: {
      description: {
        story:
          '`RangeCalendar` with `granularity="month"`: the committed range runs from the first day of the start month to the last day of the end month.',
      },
    },
  },
  render: (args) => <RangeCalendar {...args} />,
});

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
      <Calendar {...args} aria-label="Data do evento" />
    </I18nProvider>
  ),
};

// ---------------------------------------------------------------------------
// Interaction tests

export const ShouldDrillDownFromYearToDay: Story = {
  name: "when picking a year then a month from the caption, should land on that month's days without committing",
  tags: ["!autodocs"],
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
  tags: ["!autodocs"],
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
  tags: ["!autodocs"],
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
  tags: ["!autodocs"],
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
  tags: ["!autodocs"],
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
  tags: ["!autodocs"],
  args: { granularity: "year", defaultFocusedValue: MARCH_15, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Next decade" }));
    await userEvent.click(await canvas.findByRole("button", { name: "2031" }));
    await expect(args.onChange).toHaveBeenCalledWith(new CalendarDate(2031, 1, 1));
  },
};

export const ShouldCommitMonthRangeWithPreview = rangeStory({
  name: "when granularity is month in a RangeCalendar, should preview on hover and commit whole months",
  tags: ["!autodocs"],
  args: {
    "aria-label": "Billing period",
    granularity: "month",
    defaultFocusedValue: MARCH_15,
    onChange: fn(),
  },
  render: (args) => <RangeCalendar {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "March 2026" }));
    await userEvent.hover(canvas.getByRole("button", { name: "May 2026" }));

    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "April 2026" })).toHaveAttribute(
        "data-range-middle",
        "true",
      ),
    );
    await expect(args.onChange).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByRole("button", { name: "May 2026" }));
    await expect(args.onChange).toHaveBeenCalledWith({
      start: new CalendarDate(2026, 3, 1),
      end: new CalendarDate(2026, 5, 31),
    });
  },
});

export const ShouldBlockUnavailableDay: Story = {
  name: "when a day falls inside unavailableRanges, clicking it should not select it",
  tags: ["!autodocs"],
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

// Controlled from outside: a button sets the value, and `ignoreChanges` keeps
// the parent's value whatever the calendar reports.
function ControlledCalendar({
  defaultValue,
  onChange,
  ignoreChanges,
  ...props
}: React.ComponentProps<typeof Calendar> & { ignoreChanges?: boolean }) {
  const [value, setValue] = React.useState(defaultValue ?? null);
  return (
    <div className="flex w-fit flex-col gap-2">
      <Calendar
        {...props}
        value={value}
        onChange={(next) => {
          onChange?.(next);
          if (!ignoreChanges) setValue(next);
        }}
      />
      <button type="button" onClick={() => setValue(new CalendarDate(2027, 8, 20))}>
        Set Aug 20, 2027
      </button>
    </div>
  );
}

export const ShouldFollowControlledValue: Story = {
  name: "when a controlled value changes from outside, should page the grid to it",
  tags: ["!autodocs"],
  args: { defaultValue: MARCH_15 },
  render: (args) => <ControlledCalendar {...args} />,
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
  tags: ["!autodocs"],
  args: {
    defaultValue: new CalendarDate(2026, 3, 12),
    unavailableRanges: [{ from: new CalendarDate(2026, 3, 10), to: new CalendarDate(2026, 3, 14) }],
  },
  render: (args) => <ControlledCalendar {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 03-09 and 03-15 are equally close; ties prefer the later date.
    await waitFor(() => expect(canvas.getByTestId("value")).toHaveTextContent("2026-03-15"));
  },
};

export const ShouldClearWhenNothingIsAvailable: Story = {
  name: "when min/max and unavailableRanges leave no date available, should clear the value",
  tags: ["!autodocs"],
  args: {
    defaultValue: new CalendarDate(2026, 3, 12),
    minValue: new CalendarDate(2026, 3, 10),
    maxValue: new CalendarDate(2026, 3, 14),
    unavailableRanges: [{ from: new CalendarDate(2026, 3, 10), to: new CalendarDate(2026, 3, 14) }],
  },
  render: (args) => <ControlledCalendar {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByTestId("value")).toHaveTextContent("None"));
  },
};

export const ShouldCorrectOnlyOnceWhenParentIgnoresIt: Story = {
  name: "when a controlled parent keeps the blocked value, correction should be attempted once",
  tags: ["!autodocs"],
  args: {
    defaultValue: new CalendarDate(2026, 3, 12),
    unavailableRanges: [{ from: new CalendarDate(2026, 3, 10), to: new CalendarDate(2026, 3, 14) }],
    onChange: fn(),
  },
  render: (args) => <ControlledCalendar {...args} ignoreChanges />,
  play: async ({ args }) => {
    await waitFor(() => expect(args.onChange).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 100));
    await expect(args.onChange).toHaveBeenCalledTimes(1);
  },
};

function ControlledRangeCalendar({
  defaultValue,
  onChange,
  ...props
}: React.ComponentProps<typeof RangeCalendar<DateValue>>) {
  const [value, setValue] = React.useState(defaultValue ?? null);
  return (
    <RangeCalendar
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

export const ShouldShrinkRangeSpanningUnavailableDays = rangeStory({
  name: "when a selected range spans unavailableRanges, should shrink it to the start's available window",
  tags: ["!autodocs"],
  args: {
    "aria-label": "Trip dates",
    defaultValue: { start: new CalendarDate(2026, 3, 5), end: new CalendarDate(2026, 3, 20) },
    unavailableRanges: [{ from: new CalendarDate(2026, 3, 10), to: new CalendarDate(2026, 3, 12) }],
  },
  render: (args) => <ControlledRangeCalendar {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("value")).toHaveTextContent("2026-03-05 – 2026-03-09"),
    );
  },
});
