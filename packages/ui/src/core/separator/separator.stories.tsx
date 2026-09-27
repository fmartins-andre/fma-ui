import type { Meta, StoryObj } from "@storybook/react-vite";
import meta from "./meta.json";
import { Separator } from "./separator";

const componentMeta = {
  title: "ui/Separator",
  component: Separator,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    orientation: { control: "select", options: ["horizontal", "vertical"] },
  },
} satisfies Meta<typeof Separator>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Horizontal: Story = {
  parameters: {
    docs: { description: { story: "The default orientation — a full-width horizontal rule." } },
  },
  render: () => (
    <div className="w-64">
      <p className="text-sm">Above</p>
      <Separator className="my-4" />
      <p className="text-sm">Below</p>
    </div>
  ),
};

export const Vertical: Story = {
  parameters: {
    docs: { description: { story: 'orientation="vertical" for dividing inline content.' } },
  },
  render: () => (
    <div className="flex h-8 items-center gap-4">
      <p className="text-sm">Left</p>
      <Separator orientation="vertical" />
      <p className="text-sm">Right</p>
    </div>
  ),
};
