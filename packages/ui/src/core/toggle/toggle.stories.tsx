import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Italic } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";
import meta from "./meta.json";
import { Toggle } from "./toggle";

const componentMeta = {
  title: "ui/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    variant: { control: "select", options: ["default", "outline"] },
    size: { control: "select", options: ["default", "sm", "lg"] },
    isDisabled: { control: "boolean" },
  },
  args: {
    "aria-label": "Toggle bold",
    children: <Bold />,
    onChange: fn(),
  },
} satisfies Meta<typeof Toggle>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const Outline: Story = {
  args: { variant: "outline", "aria-label": "Toggle italic", children: <Italic /> },
};

export const WithText: Story = {
  render: (args) => (
    <Toggle {...args}>
      <Italic />
      Italic
    </Toggle>
  ),
  args: { "aria-label": undefined },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const Interactive: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button");
    await userEvent.click(toggle);
    expect(args.onChange).toHaveBeenCalledWith(true);
  },
};
