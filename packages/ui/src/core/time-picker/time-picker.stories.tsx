import { Time } from "@internationalized/date";
import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/core/button/button";
import { Card, CardContent } from "@/core/card/card";
import meta from "./meta.json";
import {
  TimePicker,
  TimePickerContent,
  type TimePickerI18nOverrides,
  TimePickerInput,
  TimePickerPanel,
} from "./time-picker";

const componentMeta = {
  title: "ui/TimePicker",
  component: TimePicker,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    granularity: { control: "radio", options: ["hour", "minute", "second"] },
    hourCycle: { control: "radio", options: [12, 24] },
    periodPosition: { control: "radio", options: ["start", "end"] },
  },
  args: {
    "aria-label": "Start time",
    defaultValue: new Time(9, 30),
    onChange: fn(),
    className: "w-36",
  },
} satisfies Meta<typeof TimePicker>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const body = () => within(document.body);
const column = (name: string) => body().getByRole("listbox", { name });
const option = (columnName: string, name: string) =>
  within(column(columnName)).getByRole("option", { name });

export const Default: Story = {
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole("button", { name: "Start time" });
    await expect(trigger).toHaveTextContent("09:30");
    await userEvent.click(trigger);
    await body().findByRole("dialog", { name: "Start time" });
    await expect(body().queryByRole("listbox", { name: "Second" })).toBeNull();
    await expect(option("Hour", "09")).toHaveAttribute("aria-selected", "true");

    await userEvent.click(option("Minute", "45"));
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(9, 45));
    await userEvent.click(option("Hour", "14"));
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(14, 45));
    await expect(trigger).toHaveTextContent("14:45");

    await userEvent.click(body().getByRole("button", { name: "OK" }));
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};

/** The first column takes focus on open. Arrows pick within a column, Left and Right move between columns, Enter closes. */
export const Keyboard: Story = {
  play: async ({ canvas, args }) => {
    canvas.getByRole("button").focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(column("Hour")).toHaveFocus());
    await userEvent.keyboard("{ArrowDown}");
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(10, 30));
    await userEvent.keyboard("{ArrowRight}");
    await expect(column("Minute")).toHaveFocus();
    // Two digits within a second read as one number.
    await userEvent.keyboard("45");
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(10, 45));
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(canvas.getByRole("button")).toHaveFocus());
  },
};

/** `hourCycle={12}` lists 12, 01 to 11 for the half of the day on screen and adds an AM/PM column. */
export const TwelveHourWithSeconds: Story = {
  args: { hourCycle: 12, granularity: "second", defaultValue: new Time(14, 5, 15) },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole("button")).toHaveTextContent("02:05:15 PM");
    await userEvent.click(canvas.getByRole("button"));
    await body().findByRole("dialog");
    await expect(within(column("Hour")).getAllByRole("option")).toHaveLength(12);
    await userEvent.click(option("AM/PM", "AM"));
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(2, 5, 15));
    await userEvent.click(option("Second", "40"));
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(2, 5, 40));
  },
};

export const HourOnly: Story = {
  args: { granularity: "hour", defaultValue: new Time(8) },
};

/** Steps count from 0; `minValue`/`maxValue` disable rows that lead to no selectable time, and picks move to the nearest one. */
export const StepsAndBounds: Story = {
  args: {
    "aria-label": "Pickup time",
    defaultValue: null,
    minuteStep: 15,
    minValue: new Time(9, 30),
    maxValue: new Time(17),
  },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole("button")).toHaveTextContent("Select time");
    await userEvent.click(canvas.getByRole("button"));
    await body().findByRole("dialog");
    await expect(within(column("Minute")).getAllByRole("option")).toHaveLength(4);
    await expect(option("Hour", "08")).toHaveAttribute("aria-disabled", "true");
    await expect(option("Hour", "18")).toHaveAttribute("aria-disabled", "true");
    // An empty picker fills the other units: hour 9 alone would be 09:00, before the minimum.
    await userEvent.click(option("Hour", "09"));
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(9, 30));
    await userEvent.click(option("Hour", "17"));
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(17));
  },
};

const BOOKED = new Set(["10:00", "14:30"]);
const isTimeUnavailable = (time: Time) =>
  time.hour === 12 || BOOKED.has(time.toString().slice(0, 5));

/** `isTimeUnavailable` marks single times; a row with no time left is disabled. */
export const UnavailableSlots: Story = {
  args: {
    "aria-label": "Appointment",
    defaultValue: new Time(14),
    minuteStep: 30,
    minValue: new Time(9),
    maxValue: new Time(17),
    isTimeUnavailable,
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button"));
    await body().findByRole("dialog");
    await expect(option("Hour", "12")).toHaveAttribute("aria-disabled", "true");
    await expect(option("Minute", "30")).toHaveAttribute("aria-disabled", "true");
  },
};

/** `TimePickerInput` replaces the trigger with a typable field and a clock button. */
export const TypableInput: Story = {
  args: { defaultValue: null },
  render: (args) => (
    <TimePicker {...args} hourCycle={12}>
      <TimePickerInput className="w-40" />
      <TimePickerContent placement="bottom end" />
    </TimePicker>
  ),
  play: async ({ canvas, args }) => {
    const input = canvas.getByRole("textbox", { name: "Start time" });
    await userEvent.type(input, "2:30 pm{Enter}");
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(14, 30));
    await expect(input).toHaveValue("02:30 PM");
    await userEvent.keyboard("{ArrowUp}");
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(14, 31));

    await userEvent.click(canvas.getByRole("button", { name: "Open time picker" }));
    await expect(await body().findByRole("dialog")).toBeInTheDocument();
    await expect(option("Minute", "31")).toHaveAttribute("aria-selected", "true");
  },
};

/** With `requireConfirm`, picks stay a draft until OK; closing drops them. */
export const RequireConfirm: Story = {
  args: { requireConfirm: true },
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole("button");
    await userEvent.click(trigger);
    await body().findByRole("dialog");
    await userEvent.click(option("Hour", "11"));
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(trigger).toHaveTextContent("09:30");
    await userEvent.click(body().getByRole("button", { name: "OK" }));
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(11, 30));
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};

/** `TimePickerPanel` renders the columns in place, for an always-open picker. */
export const Inline: Story = {
  render: (args) => (
    <Card className="py-0">
      <CardContent className="px-0">
        <TimePicker {...args}>
          <TimePickerPanel />
        </TimePicker>
      </CardContent>
    </Card>
  ),
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole("group", { name: "Start time" })).toBeInTheDocument();
    await userEvent.click(within(canvas.getByRole("listbox", { name: "Hour" })).getByText("07"));
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(7, 30));
    await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
    await expect(args.onChange).toHaveBeenLastCalledWith(null);
  },
};

const PT_BR: TimePickerI18nOverrides = {
  labels: {
    placeholder: "Escolha um horário",
    hour: "Hora",
    minute: "Minuto",
    now: "Agora",
    clear: "Limpar",
    panelLabel: "Escolher horário",
    openPicker: "Abrir seletor de horário",
  },
};

/** Every string comes from `i18n`, merged over the English defaults per section. */
export const Localized: Story = {
  args: { "aria-label": undefined, defaultValue: null, i18n: PT_BR, className: "w-48" },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Escolha um horário" }));
    await expect(
      await body().findByRole("dialog", { name: "Escolher horário" }),
    ).toBeInTheDocument();
    await expect(body().getByRole("listbox", { name: "Hora" })).toBeInTheDocument();
  },
};

/** `name` submits `HH:mm` with a native form; `isRequired` blocks an empty submit. */
export const FormField: Story = {
  args: { "aria-label": undefined, defaultValue: null },
  render: function Render(args) {
    const [submitted, setSubmitted] = React.useState<string | null>(null);
    return (
      <form
        className="flex flex-col items-start gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(String(new FormData(event.currentTarget).get("delivery")));
        }}
      >
        <span id="delivery-label" className="text-sm font-medium">
          Delivery time
        </span>
        <TimePicker {...args} aria-labelledby="delivery-label" name="delivery" isRequired />
        <Button type="submit">Submit</Button>
        <output className="text-sm text-muted-foreground">{submitted ?? "Not submitted"}</output>
      </form>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Submit" }));
    await expect(canvas.getByText("Not submitted")).toBeInTheDocument();
    const trigger = canvas.getByRole("button", { name: "Delivery time Select time" });
    await userEvent.click(trigger);
    await userEvent.click(option("Hour", "18"));
    await userEvent.keyboard("{Escape}");
    await userEvent.click(canvas.getByRole("button", { name: "Submit" }));
    await expect(canvas.getByText("18:00", { selector: "output" })).toBeInTheDocument();
  },
};

export const Controlled: Story = {
  render: function Render(args) {
    const [time, setTime] = React.useState<Time | null>(null);
    return (
      <div className="flex flex-col items-start gap-2">
        <TimePicker {...args} value={time} onChange={setTime} />
        <output className="text-sm text-muted-foreground">{time?.toString() ?? "No time"}</output>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Start time" }));
    await userEvent.click(option("Minute", "05"));
    await expect(canvas.getByText("00:05:00")).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button")).toBeDisabled();
  },
};
