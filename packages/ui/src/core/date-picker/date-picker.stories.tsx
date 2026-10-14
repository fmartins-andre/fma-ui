import { CalendarDate } from "@internationalized/date";
import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { type DateValue, I18nProvider, type RangeValue } from "react-aria-components";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { DateInput } from "@/core/date-field/date-field";
import { InputGroup, InputGroupAddon } from "@/core/input-group/input-group";
import { Label } from "@/core/label/label";
import { DatePicker, DatePickerContent, DatePickerTrigger, DateRangePicker } from "./date-picker";
import meta from "./meta.json";

type Value = DateValue | RangeValue<DateValue> | null | undefined;

function formatValue(value: Value) {
  if (!value) return "None";
  return "start" in value ? `${value.start} – ${value.end}` : String(value);
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
    <div className="flex w-80 flex-col gap-2">
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

// Shows the value the picker holds under it, for the eye and for the play
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
  title: "ui/DatePicker",
  component: DatePicker,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  decorators: [
    withSelectedValue,
    // Pinned so segment order/labels don't depend on the browser's locale.
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
} satisfies Meta<typeof DatePicker>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

/** A `DateRangePicker` story: one meta per file, so it's typed on its own and cast. */
function rangeStory(story: StoryObj<typeof DateRangePicker>): Story {
  return story as Story;
}

const MARCH_15 = new CalendarDate(2026, 3, 15);
const BOOKED = [{ from: new CalendarDate(2026, 3, 10), to: new CalendarDate(2026, 3, 14) }];

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

export const Range = rangeStory({
  args: { "aria-label": "Trip dates" },
  render: (args) => <DateRangePicker {...args} />,
});

export const MonthRange = rangeStory({
  args: { "aria-label": "Billing period", granularity: "month" },
  render: (args) => <DateRangePicker {...args} />,
});

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
      <DatePicker {...args} aria-label="Data do evento" />
    </I18nProvider>
  ),
};

// ---------------------------------------------------------------------------
// Interaction tests

export const ShouldFillInputFromCalendar: Story = {
  name: "when clicking a day in the calendar, should fill the input and close the popover",
  tags: ["!autodocs"],
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
  tags: ["!autodocs"],
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
  tags: ["!autodocs"],
  play: async ({ canvasElement }) => {
    await openCalendar(canvasElement);
    await userEvent.click(within(canvasElement).getByTestId("value"));
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
  },
};

export const ShouldPickWholeMonth: Story = {
  name: 'when granularity is "month", should show month/year segments and commit the 1st from the calendar',
  tags: ["!autodocs"],
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
  tags: ["!autodocs"],
  args: { granularity: "year", placeholderValue: MARCH_15, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    await expect(within(canvasElement).getAllByRole("spinbutton")).toHaveLength(1);
    const dialog = await openCalendar(canvasElement);
    await userEvent.click(within(dialog).getByRole("button", { name: "2028" }));

    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await expect(args.onChange).toHaveBeenCalledWith(new CalendarDate(2028, 1, 1));
  },
};

export const ShouldCloseAfterRangeEnd = rangeStory({
  name: "when picking a range, should stay open after the start and close after the end",
  tags: ["!autodocs"],
  args: { "aria-label": "Trip dates", placeholderValue: MARCH_15, onChange: fn() },
  render: (args) => <DateRangePicker {...args} />,
  play: async ({ canvasElement, args }) => {
    const dialog = await openCalendar(canvasElement);
    await userEvent.click(within(dialog).getByRole("button", { name: /March 5, 2026/ }));
    await expect(within(document.body).getByRole("dialog")).toBe(dialog);

    await userEvent.click(within(dialog).getByRole("button", { name: /March 20, 2026/ }));
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await expect(args.onChange).toHaveBeenCalledWith({
      start: new CalendarDate(2026, 3, 5),
      end: new CalendarDate(2026, 3, 20),
    });
  },
});

export const ShouldPickWholeMonthRange = rangeStory({
  name: "when granularity is \"month\" in a range, should commit the start month's 1st to the end month's last day",
  tags: ["!autodocs"],
  args: {
    "aria-label": "Billing period",
    granularity: "month",
    placeholderValue: MARCH_15,
    onChange: fn(),
  },
  render: (args) => <DateRangePicker {...args} />,
  play: async ({ canvasElement, args }) => {
    const dialog = await openCalendar(canvasElement);
    await userEvent.click(within(dialog).getByRole("button", { name: "March 2026" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "May 2026" }));

    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await expect(args.onChange).toHaveBeenCalledWith({
      start: new CalendarDate(2026, 3, 1),
      end: new CalendarDate(2026, 5, 31),
    });
  },
});

export const ShouldDisableDaysOutsideMinMax: Story = {
  name: "when min/max are set, should disable calendar days outside them",
  tags: ["!autodocs"],
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
  tags: ["!autodocs"],
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
  tags: ["!autodocs"],
  render: (args) => (
    <I18nProvider locale="pt-BR">
      <DatePicker {...args} aria-label="Data do evento" defaultValue={MARCH_15} />
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
