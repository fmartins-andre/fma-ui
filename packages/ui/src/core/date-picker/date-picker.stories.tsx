import { CalendarDate } from "@internationalized/date";
import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { type DateValue, I18nProvider, type RangeValue } from "react-aria-components";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { DateInput } from "@/core/date-field/date-field";
import { InputGroup, InputGroupAddon } from "@/core/input-group/input-group";
import { Label } from "@/core/label/label";
import { DatePicker, DatePickerContent, DatePickerTrigger, DateRangePicker } from "./date-picker";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/DatePicker",
  component: DatePicker,
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
    granularity: { control: "radio", options: ["day", "month", "year"] },
  },
  args: {
    "aria-label": "Event date",
  },
  render: (args) => <DatePickerWithValue {...args} />,
} satisfies Meta<typeof DatePicker>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const MARCH_15 = new CalendarDate(2026, 3, 15);
const BOOKED = [{ from: new CalendarDate(2026, 3, 10), to: new CalendarDate(2026, 3, 14) }];

function formatValue(value: DateValue | null | undefined) {
  return value ? String(value) : "None";
}

function formatRange(range: RangeValue<DateValue> | null | undefined) {
  return range ? `${range.start} – ${range.end}` : "None";
}

// Visual reference for every story: the value the picker currently holds.
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

function DatePickerWithValue(props: React.ComponentProps<typeof DatePicker<DateValue>>) {
  const [value, setValue] = React.useState(props.value ?? props.defaultValue ?? null);
  return (
    <div className="flex w-64 flex-col gap-2">
      <DatePicker
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

function DateRangePickerWithValue(props: React.ComponentProps<typeof DateRangePicker<DateValue>>) {
  const [value, setValue] = React.useState(props.value ?? props.defaultValue ?? null);
  return (
    <div className="flex w-80 flex-col gap-2">
      <DateRangePicker
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

async function openCalendar(canvasElement: HTMLElement) {
  await userEvent.click(within(canvasElement).getByRole("button", { name: /calend/i }));
  return within(document.body).findByRole("dialog");
}

function segment(canvasElement: HTMLElement, name: RegExp, index = 0) {
  return within(canvasElement).getAllByRole("spinbutton", { name })[index] as HTMLElement;
}

export const Default: Story = {};

export const Composed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Children replace the default layout: add a `Label`, place the `DatePickerTrigger` in an `InputGroupAddon` and render `DatePickerContent` for the calendar.",
      },
    },
  },
  render: (args) => (
    <DatePicker {...args} aria-label={undefined} className="w-64">
      <Label>Event date</Label>
      <InputGroup>
        <DateInput />
        <InputGroupAddon align="inline-end">
          <DatePickerTrigger />
        </InputGroupAddon>
      </InputGroup>
      <DatePickerContent />
    </DatePicker>
  ),
};

export const MonthGranularity: Story = {
  args: { granularity: "month" },
};

export const YearGranularity: Story = {
  args: { granularity: "year" },
};

export const Range: Story = {
  render: () => <DateRangePickerWithValue aria-label="Trip dates" />,
};

export const MonthRange: Story = {
  render: () => <DateRangePickerWithValue aria-label="Billing period" granularity="month" />,
};

export const MinMax: Story = {
  args: {
    defaultValue: MARCH_15,
    minValue: new CalendarDate(2026, 3, 5),
    maxValue: new CalendarDate(2026, 3, 25),
  },
};

export const UnavailableRanges: Story = {
  args: { placeholderValue: MARCH_15, unavailableRanges: BOOKED },
};

export const Localized: Story = {
  render: (args) => (
    <I18nProvider locale="pt-BR">
      <DatePickerWithValue {...args} aria-label="Data do evento" />
    </I18nProvider>
  ),
};

// ---------------------------------------------------------------------------
// Interaction tests

export const ShouldFillInputFromCalendar: Story = {
  name: "when clicking a day in the calendar, should fill the input and close the popover",
  args: { placeholderValue: MARCH_15, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const dialog = await openCalendar(canvasElement);
    await userEvent.click(within(dialog).getByRole("button", { name: /March 20, 2026/ }));

    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await expect(args.onChange).toHaveBeenCalledWith(new CalendarDate(2026, 3, 20));
    await expect(segment(canvasElement, /^day/i)).toHaveTextContent("20");
  },
};

export const ShouldFollowTypingWhileOpen: Story = {
  name: "when clicking the input and typing while the popover is open, should stay open and follow the typed date",
  args: { defaultValue: MARCH_15 },
  play: async ({ canvasElement }) => {
    const dialog = await openCalendar(canvasElement);
    await userEvent.click(segment(canvasElement, /^month/i));
    await userEvent.keyboard("08202027");

    await expect(within(document.body).getByRole("dialog")).toBe(dialog);
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Choose month" })).toHaveTextContent(
        "August",
      ),
    );
    await expect(within(dialog).getByRole("button", { name: "Choose year" })).toHaveTextContent(
      "2027",
    );
  },
};

export const ShouldCloseOnOutsidePress: Story = {
  name: "when pressing outside the picker, should close the popover",
  play: async ({ canvasElement }) => {
    await openCalendar(canvasElement);
    await userEvent.click(within(canvasElement).getByTestId("value"));
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
  },
};

export const ShouldPickWholeMonth: Story = {
  name: 'when granularity is "month", should show month/year segments and commit the 1st from the calendar',
  args: { granularity: "month", placeholderValue: MARCH_15, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    await expect(within(canvasElement).getAllByRole("spinbutton")).toHaveLength(2);
    const dialog = await openCalendar(canvasElement);
    await userEvent.click(within(dialog).getByRole("button", { name: "May 2026" }));

    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await expect(args.onChange).toHaveBeenCalledWith(new CalendarDate(2026, 5, 1));
  },
};

export const ShouldPickWholeYear: Story = {
  name: 'when granularity is "year", should show only the year segment and commit January 1st',
  args: { granularity: "year", placeholderValue: MARCH_15, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    await expect(within(canvasElement).getAllByRole("spinbutton")).toHaveLength(1);
    const dialog = await openCalendar(canvasElement);
    await userEvent.click(within(dialog).getByRole("button", { name: "2028" }));

    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await expect(args.onChange).toHaveBeenCalledWith(new CalendarDate(2028, 1, 1));
  },
};

const rangeChange = fn();

export const ShouldCloseAfterRangeEnd: Story = {
  name: "when picking a range, should stay open after the start and close after the end",
  render: () => (
    <DateRangePickerWithValue
      aria-label="Trip dates"
      placeholderValue={MARCH_15}
      onChange={rangeChange}
    />
  ),
  play: async ({ canvasElement }) => {
    rangeChange.mockClear();
    const dialog = await openCalendar(canvasElement);
    await userEvent.click(within(dialog).getByRole("button", { name: /March 5, 2026/ }));
    await expect(within(document.body).getByRole("dialog")).toBe(dialog);

    await userEvent.click(within(dialog).getByRole("button", { name: /March 20, 2026/ }));
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await expect(rangeChange).toHaveBeenCalledWith({
      start: new CalendarDate(2026, 3, 5),
      end: new CalendarDate(2026, 3, 20),
    });
  },
};

const monthRangeChange = fn();

export const ShouldPickWholeMonthRange: Story = {
  name: "when granularity is \"month\" in a range, should commit the start month's 1st to the end month's last day",
  render: () => (
    <DateRangePickerWithValue
      aria-label="Billing period"
      granularity="month"
      placeholderValue={MARCH_15}
      onChange={monthRangeChange}
    />
  ),
  play: async ({ canvasElement }) => {
    monthRangeChange.mockClear();
    const dialog = await openCalendar(canvasElement);
    await userEvent.click(within(dialog).getByRole("button", { name: "March 2026" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "May 2026" }));

    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await expect(monthRangeChange).toHaveBeenCalledWith({
      start: new CalendarDate(2026, 3, 1),
      end: new CalendarDate(2026, 5, 31),
    });
  },
};

export const ShouldDisableDaysOutsideMinMax: Story = {
  name: "when min/max are set, should disable calendar days outside them",
  args: {
    defaultValue: MARCH_15,
    minValue: new CalendarDate(2026, 3, 5),
    maxValue: new CalendarDate(2026, 3, 25),
  },
  play: async ({ canvasElement }) => {
    const dialog = await openCalendar(canvasElement);
    await expect(within(dialog).getByRole("button", { name: /March 4, 2026/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(within(dialog).getByRole("button", { name: /March 5, 2026/ })).not.toHaveAttribute(
      "aria-disabled",
    );
  },
};

export const ShouldThreadUnavailableRanges: Story = {
  name: "when unavailableRanges is set, should block those days in the calendar and move a typed one on blur",
  args: { placeholderValue: MARCH_15, unavailableRanges: BOOKED },
  play: async ({ canvasElement }) => {
    const dialog = await openCalendar(canvasElement);
    await expect(within(dialog).getByRole("button", { name: /March 12, 2026/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());

    await userEvent.click(segment(canvasElement, /^month/i));
    await userEvent.keyboard("03132026");
    await userEvent.tab();
    await userEvent.tab();
    await waitFor(() =>
      expect(within(canvasElement).getByTestId("value")).toHaveTextContent("2026-03-15"),
    );
  },
};

export const ShouldLocalizeInputAndCalendar: Story = {
  name: "when the locale is pt-BR, should localize both the segments and the calendar",
  render: (args) => (
    <I18nProvider locale="pt-BR">
      <DatePickerWithValue {...args} aria-label="Data do evento" defaultValue={MARCH_15} />
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const order = within(canvasElement)
      .getAllByRole("spinbutton")
      .map((el) => el.getAttribute("data-type"));
    await expect(order).toEqual(["day", "month", "year"]);

    const dialog = await openCalendar(canvasElement);
    await expect(within(dialog).getByRole("button", { name: "Choose month" })).toHaveTextContent(
      "março",
    );
  },
};
