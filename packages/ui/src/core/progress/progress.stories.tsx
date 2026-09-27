import type { Meta, StoryObj } from "@storybook/react-vite";
import meta from "./meta.json";
import { Progress, ProgressLabel, ProgressValue } from "./progress";

const componentMeta = {
  title: "ui/Progress",
  component: Progress,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100 } },
    isIndeterminate: { control: "boolean" },
  },
  args: {
    value: 40,
  },
} satisfies Meta<typeof Progress>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: "A bare progress bar at a fixed value." } },
  },
  render: (args) => <Progress {...args} className="w-64" />,
};

export const WithLabel: Story = {
  parameters: {
    docs: {
      description: { story: "ProgressLabel and ProgressValue add a caption and percentage." },
    },
  },
  render: (args) => (
    <Progress {...args} className="w-64">
      <ProgressLabel>Uploading</ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
};

export const Indeterminate: Story = {
  args: { isIndeterminate: true },
  parameters: {
    docs: {
      description: { story: "isIndeterminate for when progress can't be measured yet." },
    },
  },
  render: (args) => (
    <Progress {...args} className="w-64">
      <ProgressLabel>Loading</ProgressLabel>
    </Progress>
  ),
};
