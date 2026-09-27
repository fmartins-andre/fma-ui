import type { Meta, StoryObj } from "@storybook/react-vite";
import { Kbd, KbdGroup } from "./kbd";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Kbd",
  component: Kbd,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  args: {
    children: "⌘",
  },
} satisfies Meta<typeof Kbd>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: "A single key." } },
  },
};

export const Group: Story = {
  parameters: {
    docs: { description: { story: "KbdGroup lays out multiple keys as one shortcut combo." } },
  },
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
};
