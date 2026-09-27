import type { Meta, StoryObj } from "@storybook/react-vite";
import meta from "./meta.json";
import { Slider } from "./slider";

const componentMeta = {
  title: "ui/Slider",
  component: Slider,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    minValue: { control: "number" },
    maxValue: { control: "number" },
    step: { control: "number" },
    orientation: { control: "select", options: ["horizontal", "vertical"] },
    isDisabled: { control: "boolean" },
  },
  args: {
    defaultValue: 33,
    minValue: 0,
    maxValue: 100,
    step: 1,
  },
  render: (args) => (
    <div className="w-64">
      <Slider {...args} />
    </div>
  ),
} satisfies Meta<typeof Slider>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: "A single-thumb slider with one draggable value." } },
  },
};

// A multi-value array renders one thumb per value, not a separate "range" prop.
export const Range: Story = {
  args: { defaultValue: [20, 80] },
  parameters: {
    docs: {
      description: { story: "A defaultValue array renders two thumbs for a min/max range." },
    },
  },
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  parameters: {
    docs: { description: { story: 'orientation="vertical" for a top-to-bottom slider.' } },
  },
  render: (args) => (
    <div className="h-40">
      <Slider {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: { isDisabled: true },
  parameters: {
    docs: { description: { story: "isDisabled prevents dragging and dims the track/thumb." } },
  },
};
