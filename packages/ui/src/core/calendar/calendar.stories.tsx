import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar, RangeCalendar } from "./calendar";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    captionLayout: { control: "select", options: ["label", "dropdown"] },
    numberOfMonths: { control: "number" },
  },
  args: {
    "aria-label": "Event date",
  },
} satisfies Meta<typeof Calendar>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const DropdownCaption: Story = {
  args: { captionLayout: "dropdown" },
};

export const TwoMonths: Story = {
  args: { numberOfMonths: 2 },
};

export const Range: Story = {
  render: () => <RangeCalendar aria-label="Trip dates" />,
};
