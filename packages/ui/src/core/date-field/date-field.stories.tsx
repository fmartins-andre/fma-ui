import { CalendarDate } from "@internationalized/date";
import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { type DateValue, I18nProvider, type RangeValue } from "react-aria-components";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { DateRangePicker } from "@/core/date-picker/date-picker";
import { InputGroup } from "@/core/input-group/input-group";
import { Label } from "@/core/label/label";
import { DateField, DateInput } from "./date-field";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/DateField",
  component: DateField,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  // Pinned so segment order/labels don't depend on the browser's locale.
  decorators: [
    (Story) => (
      <I18nProvider locale="en-US">
        <Story />
      </I18nProvider>
    ),
  ],
  argTypes: {
    granularity: { control: "radio", options: ["day", "month", "year", "minute"] },
  },
  args: {
    "aria-label": "Event date",
  },
  render: (args) => <DateFieldWithValue {...args} />,
} satisfies Meta<typeof DateField>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const MARCH_12 = new CalendarDate(2026, 3, 12);
const BOOKED = [{ from: new CalendarDate(2026, 3, 10), to: new CalendarDate(2026, 3, 14) }];

function formatValue(value: DateValue | null | undefined) {
  return value ? String(value) : "None";
}

function formatRange(range: RangeValue<DateValue> | null | undefined) {
  return range ? `${range.start} – ${range.end}` : "None";
}

// Visual reference for every story: the value the field currently holds.
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

function DateFieldWithValue(props: React.ComponentProps<typeof DateField<DateValue>>) {
  const [value, setValue] = React.useState(props.value ?? props.defaultValue ?? null);
  return (
    <div className="flex w-64 flex-col gap-2">
      <DateField
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

function RangeFieldWithValue(props: React.ComponentProps<typeof DateRangePicker<DateValue>>) {
  const [value, setValue] = React.useState(props.value ?? props.defaultValue ?? null);
  return (
    <div className="flex w-72 flex-col gap-2">
      <DateRangePicker
        {...props}
        value={value}
        onChange={(next) => {
          setValue(next);
          props.onChange?.(next);
        }}
      >
        {/* The inputs must sit in a react-aria Group (InputGroup is one): the
            picker moves focus between segments through it. */}
        <InputGroup>
          <DateInput slot="start" />
          <span aria-hidden="true" className="text-muted-foreground">
            –
          </span>
          <DateInput slot="end" />
        </InputGroup>
      </DateRangePicker>
      <SelectedValue>{formatRange(value)}</SelectedValue>
    </div>
  );
}

function segment(canvasElement: HTMLElement, name: RegExp, index = 0) {
  return within(canvasElement).getAllByRole("spinbutton", { name })[index] as HTMLElement;
}

export const Default: Story = {};

export const WithLabel: Story = {
  render: (args) => (
    <DateField {...args} aria-label={undefined} className="w-64">
      <Label>Event date</Label>
      <DateInput />
    </DateField>
  ),
};

export const MonthGranularity: Story = {
  parameters: {
    docs: {
      description: { story: "Only month and year segments; commits the month's first day." },
    },
  },
  args: { granularity: "month" },
};

export const YearGranularity: Story = {
  parameters: {
    docs: { description: { story: "Only the year segment; commits January 1st." } },
  },
  args: { granularity: "year" },
};

export const DateTime: Story = {
  args: { granularity: "minute" },
};

export const Range: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A range field is a `DateRangePicker` without `DatePickerContent`: two `DateInput`s, `slot="start"` and `slot="end"`.',
      },
    },
  },
  render: () => <RangeFieldWithValue aria-label="Trip dates" />,
};

export const UnavailableRanges: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Mar 10–14 are booked. A typed date inside them is flagged invalid while editing, then moves to the nearest available date when the field loses focus.",
      },
    },
  },
  args: { unavailableRanges: BOOKED, placeholderValue: MARCH_12 },
};

export const Localized: Story = {
  render: (args) => (
    <I18nProvider locale="pt-BR">
      <DateFieldWithValue {...args} aria-label="Data do evento" />
    </I18nProvider>
  ),
};

// ---------------------------------------------------------------------------
// Interaction tests

export const ShouldCommitTypedDate: Story = {
  name: "when typing month/day/year into the segments, should commit the date",
  args: { onChange: fn() },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(segment(canvasElement, /^month/i));
    await userEvent.keyboard("03152026");
    await waitFor(() =>
      expect(within(canvasElement).getByTestId("value")).toHaveTextContent("2026-03-15"),
    );
    await expect(args.onChange).toHaveBeenLastCalledWith(new CalendarDate(2026, 3, 15));
  },
};

export const ShouldRenderOnlyYearSegment: Story = {
  name: 'when granularity is "year", should render only the year segment and commit January 1st',
  args: { granularity: "year" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("spinbutton")).toHaveLength(1);
    await userEvent.click(segment(canvasElement, /^year/i));
    await userEvent.keyboard("2031");
    await waitFor(() => expect(canvas.getByTestId("value")).toHaveTextContent("2031-01-01"));
  },
};

export const ShouldRenderMonthAndYearSegments: Story = {
  name: 'when granularity is "month", should render month/year segments and commit the 1st',
  args: { granularity: "month" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("spinbutton")).toHaveLength(2);
    await userEvent.click(segment(canvasElement, /^month/i));
    await userEvent.keyboard("072027");
    await waitFor(() => expect(canvas.getByTestId("value")).toHaveTextContent("2027-07-01"));
  },
};

export const ShouldClampToMinMaxOnBlur: Story = {
  name: "when typing a date past maxValue, should keep it while editing and clamp it on blur",
  args: { maxValue: new CalendarDate(2026, 6, 30) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(segment(canvasElement, /^month/i));
    await userEvent.keyboard("08102026");
    await waitFor(() => expect(canvas.getByTestId("value")).toHaveTextContent("2026-08-10"));

    await userEvent.tab();
    await waitFor(() => expect(canvas.getByTestId("value")).toHaveTextContent("2026-06-30"));
  },
};

export const ShouldTravelPastUnavailableOnBlur: Story = {
  name: "when typing a date inside unavailableRanges, should travel to the nearest available date on blur",
  args: { unavailableRanges: BOOKED },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(segment(canvasElement, /^month/i));
    await userEvent.keyboard("03132026");
    // Kept as typed while editing — correcting mid-typing would fight the user.
    await waitFor(() => expect(canvas.getByTestId("value")).toHaveTextContent("2026-03-13"));

    await userEvent.tab();
    // 03-09 is 4 days away, 03-15 only 2.
    await waitFor(() => expect(canvas.getByTestId("value")).toHaveTextContent("2026-03-15"));
  },
};

export const ShouldTravelWhenConstraintsChange: Story = {
  name: "when the value becomes unavailable while not editing, should travel right away",
  args: { defaultValue: MARCH_12, unavailableRanges: BOOKED },
  play: async ({ canvasElement }) => {
    // 03-09 and 03-15 are equally close; ties prefer the later date.
    await waitFor(() =>
      expect(within(canvasElement).getByTestId("value")).toHaveTextContent("2026-03-15"),
    );
  },
};

export const ShouldTypeRangeIndependently: Story = {
  name: "when typing into the start and end inputs, should commit both ends without cross-talk",
  render: () => <RangeFieldWithValue aria-label="Trip dates" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(segment(canvasElement, /^month/i, 0));
    await userEvent.keyboard("03052026");
    await userEvent.click(segment(canvasElement, /^month/i, 1));
    await userEvent.keyboard("03202026");
    await waitFor(() =>
      expect(canvas.getByTestId("value")).toHaveTextContent("2026-03-05 – 2026-03-20"),
    );
  },
};

export const ShouldShrinkRangeSpanningUnavailableDays: Story = {
  name: "when a preset range spans unavailableRanges, should shrink to the start's available window",
  render: () => (
    <RangeFieldWithValue
      aria-label="Trip dates"
      defaultValue={{ start: new CalendarDate(2026, 3, 5), end: new CalendarDate(2026, 3, 20) }}
      unavailableRanges={BOOKED}
    />
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(within(canvasElement).getByTestId("value")).toHaveTextContent(
        "2026-03-05 – 2026-03-09",
      ),
    );
  },
};

export const ShouldClearWhenNothingIsAvailable: Story = {
  name: "when min/max and unavailableRanges leave no date available, should clear the value",
  args: {
    defaultValue: MARCH_12,
    minValue: new CalendarDate(2026, 3, 10),
    maxValue: new CalendarDate(2026, 3, 14),
    unavailableRanges: BOOKED,
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(within(canvasElement).getByTestId("value")).toHaveTextContent("None"),
    );
  },
};
