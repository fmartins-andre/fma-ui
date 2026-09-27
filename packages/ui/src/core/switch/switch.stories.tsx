import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Label } from "../label/label";
import meta from "./meta.json";
import { Switch } from "./switch";

const componentMeta = {
  title: "ui/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    size: { control: "select", options: ["default", "sm"] },
    isSelected: { control: "boolean" },
    isDisabled: { control: "boolean" },
  },
  args: {
    onChange: fn(),
  },
} satisfies Meta<typeof Switch>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

// Switch's own children slot is for a custom thumb override, not label text —
// passing long text there crams it into the fixed pill-shaped box. The real
// pattern pairs Switch with an external Label via id/htmlFor, laid out as a
// flex row.
export const Default: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Switch {...args} id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
};

export const Small: Story = {
  args: { size: "sm" },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Switch {...args} id="airplane-mode-sm" />
      <Label htmlFor="airplane-mode-sm">Airplane Mode</Label>
    </div>
  ),
};

export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Switch {...args} id="airplane-mode-disabled" />
      <Label htmlFor="airplane-mode-disabled">Airplane Mode</Label>
    </div>
  ),
};

export const Interactive: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Switch {...args} id="airplane-mode-interactive" />
      <Label htmlFor="airplane-mode-interactive">Airplane Mode</Label>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("switch");
    await userEvent.click(toggle);
    expect(args.onChange).toHaveBeenCalledWith(true);
    await userEvent.click(toggle);
    expect(args.onChange).toHaveBeenCalledWith(false);
  },
};
