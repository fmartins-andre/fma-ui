import { Time } from "@internationalized/date";
import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import meta from "./meta.json";
import { SimpleTimePicker } from "./simple-time-picker";

const componentMeta = {
  title: "ui/SimpleTimePicker",
  component: SimpleTimePicker,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    granularity: { control: "radio", options: ["hour", "minute", "second"] },
    hourCycle: { control: "radio", options: [12, 24] },
  },
  args: { defaultValue: new Time(9, 30), onChange: fn() },
} satisfies Meta<typeof SimpleTimePicker>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const body = () => within(document.body);
const column = (name: string) => body().getByRole("listbox", { name });

export const Default: Story = {
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole("button", { name: "Time, 09:30" });
    await userEvent.click(trigger);
    await body().findByRole("dialog", { name: "Time" });
    await expect(body().queryByRole("listbox", { name: "Seconds" })).toBeNull();
    await expect(within(column("Hours")).getByRole("option", { name: "09" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await userEvent.click(within(column("Minutes")).getByRole("option", { name: "45" }));
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(9, 45));
    await userEvent.click(within(column("Hours")).getByRole("option", { name: "14" }));
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(14, 45));
    await expect(canvas.getByRole("button", { name: "Time, 14:45" })).toBeInTheDocument();
  },
};

/** The selected hour gets focus on open; arrows move within a column, Tab to the next. */
export const Keyboard: Story = {
  play: async ({ canvas, args }) => {
    canvas.getByRole("button").focus();
    await userEvent.keyboard("{Enter}");
    await body().findByRole("dialog");
    await waitFor(() =>
      expect(within(column("Hours")).getByRole("option", { name: "09" })).toHaveFocus(),
    );
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(10, 30));

    await userEvent.tab();
    await waitFor(() =>
      expect(within(column("Minutes")).getByRole("option", { name: "30" })).toHaveFocus(),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(canvas.getByRole("button")).toHaveFocus());
  },
};

export const WithSeconds: Story = {
  args: { granularity: "second", defaultValue: new Time(8, 5, 15) },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Time, 08:05:15" }));
    await userEvent.click(
      within(await body().findByRole("listbox", { name: "Seconds" })).getByRole("option", {
        name: "40",
      }),
    );
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(8, 5, 40));
  },
};

/** `hourCycle={12}` shows 12-hour labels and an AM/PM column. */
export const TwelveHour: Story = {
  args: { hourCycle: 12, defaultValue: new Time(14, 0) },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Time, 02:00 PM" }));
    await body().findByRole("dialog");
    await expect(within(column("Hours")).getAllByRole("option")).toHaveLength(12);
    await expect(within(column("Hours")).getByRole("option", { name: "02" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await userEvent.click(within(column("AM/PM")).getByRole("option", { name: "AM" }));
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(2, 0));
    await userEvent.click(within(column("Hours")).getByRole("option", { name: "12" }));
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(0, 0));
  },
};

/** Options outside `minValue`/`maxValue` are disabled, and picks are clamped into range. */
export const MinMax: Story = {
  args: { defaultValue: new Time(9, 30), minValue: new Time(9, 15), maxValue: new Time(17, 45) },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button"));
    await body().findByRole("dialog");
    const hours = column("Hours");
    await expect(within(hours).getByRole("option", { name: "08" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(within(hours).getByRole("option", { name: "18" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(within(column("Minutes")).getByRole("option", { name: "10" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    // 09:50 is in range; moving to hour 17 would give 17:50, past the max, so it clamps.
    await userEvent.click(within(column("Minutes")).getByRole("option", { name: "50" }));
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(9, 50));
    await userEvent.click(within(hours).getByRole("option", { name: "17" }));
    await expect(args.onChange).toHaveBeenLastCalledWith(new Time(17, 45));
  },
};

export const Controlled: Story = {
  render: function Render(args) {
    const [time, setTime] = React.useState<Time | null>(null);
    return (
      <div className="flex flex-col items-start gap-2">
        <SimpleTimePicker {...args} value={time} onChange={setTime} />
        <output className="text-sm text-muted-foreground">{time?.toString() ?? "No time"}</output>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Time, --:--" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button"));
    await userEvent.click(
      within(await body().findByRole("listbox", { name: "Minutes" })).getByRole("option", {
        name: "05",
      }),
    );
    await expect(canvas.getByText("00:05:00")).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button")).toBeDisabled();
  },
};
